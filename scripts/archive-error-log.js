const fs = require('fs-extra');
const path = require('path');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const LOG_DIR = path.join(process.cwd(), 'playwright-test-logs');
const RESULTS_DIR = path.join(process.cwd(), 'test-results');
const RAW_LOG_PATH = path.join(LOG_DIR, 'test-run.log');

function findErrorContextFile(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.lstatSync(filePath);
        if (stat.isDirectory()) {
            const found = findErrorContextFile(filePath);
            if (found) return found;
        } else if (path.basename(filePath) === 'error-context.md') {
            return filePath;
        }
    }
    return null;
}

function parseRawLog(logContent) {
    const testNameMatch = logContent.match(/e2e\/full_game_flow\.spec\.ts:\d+:\d+ › (.+)/);
    const testName = testNameMatch ? testNameMatch[1].trim() : 'N/A';
    
    const steps = [...logContent.matchAll(/^(步骤 \d+: .+? - 完成。)$/gm)].map(m => m[0]).join('\n');
    // 匹配所有性能评测区块，取最后一个
    const perfBlocks = [...logContent.matchAll(/={3,}\s*性能评测结果\s*={3,}([\s\S]+?)={3,}/g)];
    const performance = perfBlocks.length > 0 ? perfBlocks[perfBlocks.length - 1][1].trim() : '未找到性能评测结果。';
    
    // Extract error details
    const errorDetailsMatch = logContent.match(/Error: (.+)\n\n([\s\S]+?)at/);
    let errorSummary = 'N/A';
    if (errorDetailsMatch) {
      errorSummary = `${errorDetailsMatch[1].trim()}\n${errorDetailsMatch[2].trim()}`;
    }

    const isFailed = /failed/.test(logContent);

    return {
        testName,
        steps: steps || '未找到流程步骤。',
        performance,
        errorSummary,
        isFailed
    };
}

// 新增：提取性能数据
function extractPerformanceMetrics(perfBlock) {
    // 兼容中英文和不同格式
    const get = (regex) => {
        const m = perfBlock.match(regex);
        return m ? m[1].replace(/[^-\u007F\d.\-]/g, '') : '';
    };
    const getIcon = (line, type = 'max') => {
        if (!line) return { val: '', icon: '' };
        const iconMatch = line.match(/(✅|⚠️|缺失)/);
        const numMatch = line.match(/([\d.]+)(ms|fps|MB)?/);
        return {
            val: numMatch ? numMatch[1] : '',
            icon: iconMatch ? iconMatch[1] : ''
        };
    };
    // 按行分割
    const lines = perfBlock.split(/\n|\r/).map(l => l.trim());
    return {
        loadTime: getIcon(lines.find(l => l.includes('页面加载时间'))),
        shapeGenerationTime: getIcon(lines.find(l => l.includes('形状生成时间'))),
        puzzleGenerationTime: getIcon(lines.find(l => l.includes('拼图生成时间'))),
        scatterTime: getIcon(lines.find(l => l.includes('散开时间'))),
        avgInteraction: getIcon(lines.find(l => l.includes('平均拼图交互时间'))),
        avgFps: getIcon(lines.find(l => l.includes('平均帧率')), 'min'),
        memory: getIcon(lines.find(l => l.includes('内存使用'))),
        result: lines.some(l => l.includes('⚠️')) ? '❌' : '✅',
    };
}

// 新增：生成性能趋势表格
async function generateTrendTable() {
    const files = (await fs.readdir(LOG_DIR)).filter(f => f.startsWith('test-report-') && f.endsWith('.md'));
    files.sort();
    const rows = [];
    for (const file of files) {
        const content = await fs.readFile(path.join(LOG_DIR, file), 'utf-8');
        const timeMatch = content.match(/\*\*生成时间\*\*: ([^\(]+)/);
        const time = timeMatch ? timeMatch[1].trim() : '';
        const perfBlock = content.match(/## 一、性能概览\n```([\s\S]+?)```/);
        const perf = perfBlock ? extractPerformanceMetrics(perfBlock[1]) : {};
        // 帧率和内存保留两位小数
        let avgFps = perf.avgFps && perf.avgFps.val ? `${Number(perf.avgFps.val).toFixed(2)} ${perf.avgFps.icon}` : (perf.avgFps && perf.avgFps.icon ? perf.avgFps.icon : '');
        let memory = perf.memory && perf.memory.val ? `${Number(perf.memory.val).toFixed(2)} ${perf.memory.icon}` : (perf.memory && perf.memory.icon ? perf.memory.icon : '');
        // 平均拼图交互时间
        let avgInteraction = perf.avgInteraction && perf.avgInteraction.val ? `${perf.avgInteraction.val} ${perf.avgInteraction.icon}` : (perf.avgInteraction && perf.avgInteraction.icon ? perf.avgInteraction.icon : '缺失');
        rows.push({
            time,
            loadTime: perf.loadTime ? `${perf.loadTime.val} ${perf.loadTime.icon}` : '',
            shapeGenerationTime: perf.shapeGenerationTime ? `${perf.shapeGenerationTime.val} ${perf.shapeGenerationTime.icon}` : '',
            puzzleGenerationTime: perf.puzzleGenerationTime ? `${perf.puzzleGenerationTime.val} ${perf.puzzleGenerationTime.icon}` : '',
            scatterTime: perf.scatterTime ? `${perf.scatterTime.val} ${perf.scatterTime.icon}` : '',
            avgInteraction,
            avgFps,
            memory,
            result: perf.result || '',
            file
        });
    }
    let table = `| 时间 | 页面加载(ms) | 形状生成(ms) | 拼图生成(ms) | 散开(ms) | 平均拼图交互时间(ms) | 帧率(fps) | 内存(MB) | 结果 |\n|------|------|------|------|------|------|------|------|------|\n`;
    for (const r of rows.reverse()) {
        table += `| ${r.time} | ${r.loadTime} | ${r.shapeGenerationTime} | ${r.puzzleGenerationTime} | ${r.scatterTime} | ${r.avgInteraction} | ${r.avgFps} | ${r.memory} | ${r.result} |\n`;
    }
    return table;
}

async function archiveErrorLog() {
    try {
        console.log('开始执行测试日志归档...');
        await fs.ensureDir(LOG_DIR);

        if (!fs.existsSync(RAW_LOG_PATH)) {
            console.log('未找到原始日志文件 test-run.log，跳过归档。');
            return;
        }

        const rawLogContent = await fs.readFile(RAW_LOG_PATH, 'utf-8');
        // 新增：清理 ANSI 颜色码
        const ansiRegex = /\u001b\[[0-9;]*m/g;
        const cleanLogContent = rawLogContent.replace(ansiRegex, '');

        const errorContextFile = fs.existsSync(RESULTS_DIR) ? findErrorContextFile(RESULTS_DIR) : null;
        
        const { testName, steps, performance, errorSummary, isFailed } = parseRawLog(cleanLogContent);

        let pageSnapshot = 'N/A';
        let testSource = 'N/A';

        if (errorContextFile) {
            const errorContextContent = await fs.readFile(errorContextFile, 'utf-8');
            const snapshotMatch = errorContextContent.match(/Page snapshot([\s\S]+?)Test source/);
            const sourceMatch = errorContextContent.match(/Test source([\s\S]+)/);
            if (snapshotMatch) pageSnapshot = snapshotMatch[1].trim();
            if (sourceMatch) testSource = sourceMatch[1].trim();
        }

        const now = dayjs().tz('Asia/Hong_Kong');
        const timestamp = now.format('YYYYMMDDHHmmss');
        const formattedTime = now.format('YYYY-MM-DD HH:mm:ss');
        const reportFileName = `test-report-${timestamp}.md`;
        const reportFilePath = path.join(LOG_DIR, reportFileName);

        const reportContent = `
# Playwright 测试报告

- **测试名称**: ${testName}
- **测试文件**: e2e/full_game_flow.spec.ts
- **生成时间**: ${formattedTime} (香港时间)
- **测试结果**: ${isFailed ? '❌ **失败**' : '✅ **成功**'}

---

## 一、性能概览
\`\`\`
${performance}
\`\`\`

---

${isFailed ? `
## 二、核心问题
> ${errorSummary}
` : ''}

---

## 三、流程步骤
\`\`\`
${steps}
\`\`\`

---

## 四、页面快照 (Page Snapshot)
${pageSnapshot !== 'N/A' ? pageSnapshot : '无可用快照。'}

---

## 五、源码追溯 (Test Source)
${testSource !== 'N/A' ? `\`\`\`typescript\n${testSource}\n\`\`\`` : '无可用源码。'}

---

## 六、完整终端输出 (Raw Terminal Output)
<details>
<summary>点击展开</summary>

\`\`\`
${cleanLogContent}
\`\`\`
</details>
`;

        await fs.writeFile(reportFilePath, reportContent.trim());
        console.log(`测试报告已生成: ${reportFilePath}`);

        // 新增：生成性能趋势表格和索引
        const trendTable = await generateTrendTable();
        const files = (await fs.readdir(LOG_DIR)).filter(f => f.startsWith('test-report-') && f.endsWith('.md'));
        files.sort();
        let indexContent = `# Playwright 测试历史性能趋势\n\n${trendTable}\n\n## 报告索引\n`;
        for (const file of files.reverse()) {
            // 提取时间
            const content = await fs.readFile(path.join(LOG_DIR, file), 'utf-8');
            const timeMatch = content.match(/\*\*生成时间\*\*: ([^\(]+)/);
            const time = timeMatch ? timeMatch[1].trim() : '';
            indexContent += `- [${file}](${file}) - ${time}\n`;
        }
        const indexFilePath = path.join(LOG_DIR, 'index.md');
        await fs.writeFile(indexFilePath, indexContent);
        console.log(`索引文件已更新: ${indexFilePath}`);

    } catch (error) {
        console.error('归档脚本执行失败:', error);
    } finally {
        // Clean up
        if (fs.existsSync(RAW_LOG_PATH)) {
            await fs.remove(RAW_LOG_PATH);
            console.log('已清理临时日志文件: test-run.log');
        }
        if (fs.existsSync(RESULTS_DIR)) {
            await fs.remove(RESULTS_DIR);
            console.log('已清理临时测试结果目录: test-results');
        }
        console.log('日志归档流程结束。');
    }
}

archiveErrorLog();
