const fse = require('fs-extra');
const path = require('path');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const workspaceRoot = path.resolve(__dirname, '..');
const logsDir = path.join(workspaceRoot, 'playwright-test-logs');
const resultsFile = path.join(workspaceRoot, 'test-results/test-results.json');
const testSourceFile = path.join(workspaceRoot, 'e2e/full_game_flow.spec.ts');
const errorContextFile = path.join(workspaceRoot, 'test-results/full_game_flow-完整自动化游戏流程/error-context.md');

const PERFORMANCE_BENCHMARKS = {
  loadTime: 1000,
  shapeGenerationTime: 500,
  puzzleGenerationTime: 800,
  scatterTime: 800,
  pieceInteractionTime: 1200,
  minFps: 30,
  maxMemoryUsage: 100 * 1024 * 1024,
};

const OPTIMIZATION_SUGGESTIONS = {
    loadTime: "优化页面资源加载，如压缩图片、使用代码分割、利用浏览器缓存等。",
    shapeGenerationTime: "检查形状生成算法的复杂度，考虑是否有可优化的计算或缓存逻辑。",
    puzzleGenerationTime: "分析拼图切割算法，减少不必要的计算，或对中间结果进行缓存。",
    scatterTime: "优化散开动画的性能，减少同时进行的大量重绘，可以考虑使用 CSS transform 或 `requestAnimationFrame`。",
    avgInteractionTime: "检查拖拽和旋转过程中的事件处理和渲染逻辑，避免频繁或昂贵的计算导致卡顿。",
    minFps: "分析渲染瓶颈，可能存在过多的 DOM 操作或复杂的 Canvas 绘图。使用浏览器性能分析工具定位问题。",
    maxMemoryUsage: "检查是否存在内存泄漏，关注事件监听器的移除、大对象的引用释放等。",
};

function stripAnsiCodes(str) {
  return str.replace(/[\u001b\u009b][[()#;?]*.{0,2}(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
}

function getStatusIcon(value, base, type = 'max') {
  if (value === undefined || value === null || isNaN(value)) return '❌';
  if (type === 'max') return value > base ? '⚠️' : '✅';
  return value < base ? '⚠️' : '✅';
}

function parseTestStepsFromStdout(stdout) {
    const stepRegex = /步骤\s\d+:.*/g;
    const matches = stdout.match(stepRegex);
    return matches ? matches.join('\n') : '未能从日志中提取测试步骤。';
}

function formatValue(value, unit = '') {
    if (value === undefined || value === null || isNaN(value)) return '缺失';
    return `${value}${unit}`;
}


async function generateReport(suite) {
    const spec = suite.specs?.[0];
    if (!spec) {
        console.log('No spec found in the suite.');
        return;
    }
    const test = spec.tests?.[0];
    if (!test) {
        console.log('No test found in the spec.');
        return;
    }
    const result = test.results?.[0];
    if (!result) {
        console.log('No result found for the test case.');
        return;
    }

    // 从测试附件中查找性能指标
    const performanceAttachment = result.attachments.find(
      (att) => att.name === 'performance-metrics'
    );

    if (!performanceAttachment || !performanceAttachment.body) {
      console.log('Could not find performance metrics in test attachments. Skipping report generation.');
      return;
    }
    
    let metrics;
    try {
      // Playwright的JSON报告会将附件body进行base64编码，所以需要先解码
      const decodedBody = Buffer.from(performanceAttachment.body, 'base64').toString('utf8');
      metrics = JSON.parse(decodedBody);
    } catch (e) {
      console.error('Failed to parse performance metrics from attachment:', e);
      return;
    }
    
    // 计算平均交互时间
    if (metrics.pieceInteractionTimes && metrics.pieceInteractionTimes.length > 0) {
      metrics.avgInteractionTime = metrics.pieceInteractionTimes.reduce((a, b) => a + b, 0) / metrics.pieceInteractionTimes.length;
    }

    const stdout = stripAnsiCodes(result.stdout.map(s => s.text || '').join(''));
    
    const timestamp = dayjs().tz('Asia/Hong_Kong').format('YYYY-MM-DD HH:mm:ss');
    const fileTimestamp = dayjs().tz('Asia/Hong_Kong').format('YYYYMMDDHHmmss');
    const reportFileName = `test-report-${fileTimestamp}.md`;
    const reportFilePath = path.join(logsDir, reportFileName);

    const testTitle = spec.title;
    const testStatus = result.status === 'passed' ? '通过' : '失败';

    const avgFps = metrics.fps && metrics.fps.length > 0 ? (metrics.fps.reduce((a, b) => a + b, 0) / metrics.fps.length) : NaN;
    const memMB = metrics.memoryUsage;
    
    const summaryData = {
        fileName: reportFileName,
        title: testTitle,
        status: testStatus,
        timestamp: dayjs().tz('Asia/Hong_Kong').toISOString(),
        metrics: {
            loadTime: metrics.loadTime,
            shapeGenerationTime: metrics.shapeGenerationTime,
            puzzleGenerationTime: metrics.puzzleGenerationTime,
            scatterTime: metrics.scatterTime,
            avgInteractionTime: metrics.avgInteractionTime,
            puzzleInteractionDuration: metrics.puzzleInteractionDuration,
            totalTestTime: metrics.totalTestTime,
            avgFps: isNaN(avgFps) ? undefined : parseFloat(avgFps.toFixed(1)),
            memoryUsage: isNaN(memMB) ? undefined : parseFloat(memMB.toFixed(2)),
        },
        scenario: {
            shapeType: metrics.shapeType,
            cutType: metrics.cutType,
            cutCount: metrics.cutCount,
            pieceCount: metrics.pieceCount,
        }
    };

    const perfWarnings = [];
    if (metrics.loadTime > PERFORMANCE_BENCHMARKS.loadTime) perfWarnings.push(`- **页面加载时间**: (${metrics.loadTime}ms) 超过基准值 (${PERFORMANCE_BENCHMARKS.loadTime}ms)\n  - **建议**: ${OPTIMIZATION_SUGGESTIONS.loadTime}`);
    if (metrics.shapeGenerationTime > PERFORMANCE_BENCHMARKS.shapeGenerationTime) perfWarnings.push(`- **形状生成时间**: (${metrics.shapeGenerationTime}ms) 超过基准值 (${PERFORMANCE_BENCHMARKS.shapeGenerationTime}ms)\n  - **建议**: ${OPTIMIZATION_SUGGESTIONS.shapeGenerationTime}`);
    if (metrics.puzzleGenerationTime > PERFORMANCE_BENCHMARKS.puzzleGenerationTime) perfWarnings.push(`- **拼图生成时间**: (${metrics.puzzleGenerationTime}ms) 超过基准值 (${PERFORMANCE_BENCHMARKS.puzzleGenerationTime}ms)\n  - **建议**: ${OPTIMIZATION_SUGGESTIONS.puzzleGenerationTime}`);
    if (metrics.scatterTime > PERFORMANCE_BENCHMARKS.scatterTime) perfWarnings.push(`- **散开时间**: (${metrics.scatterTime}ms) 超过基准值 (${PERFORMANCE_BENCHMARKS.scatterTime}ms)\n  - **建议**: ${OPTIMIZATION_SUGGESTIONS.scatterTime}`);
    if (metrics.avgInteractionTime > PERFORMANCE_BENCHMARKS.pieceInteractionTime) perfWarnings.push(`- **平均拼图交互时间**: (${metrics.avgInteractionTime?.toFixed(2)}ms) 超过基准值 (${PERFORMANCE_BENCHMARKS.pieceInteractionTime}ms)\n  - **建议**: ${OPTIMIZATION_SUGGESTIONS.avgInteractionTime}`);
    if (!isNaN(avgFps) && avgFps < PERFORMANCE_BENCHMARKS.minFps) perfWarnings.push(`- **平均帧率**: (${avgFps.toFixed(1)}fps) 低于基准值 (${PERFORMANCE_BENCHMARKS.minFps}fps)\n  - **建议**: ${OPTIMIZATION_SUGGESTIONS.minFps}`);
    if (!isNaN(memMB) && memMB > (PERFORMANCE_BENCHMARKS.maxMemoryUsage / 1024 / 1024)) perfWarnings.push(`- **内存使用**: (${memMB.toFixed(2)}MB) 超过基准值 (${(PERFORMANCE_BENCHMARKS.maxMemoryUsage / 1024 / 1024)}MB)\n  - **建议**: ${OPTIMIZATION_SUGGESTIONS.maxMemoryUsage}`);


    const perfContent = `
| 指标 (单位)                | 结果      | 基准值    | 状态 |
| -------------------------- | --------- | --------- | ---- |
| 页面加载时间 (ms)          | ${formatValue(metrics.loadTime, 'ms')}      | < ${PERFORMANCE_BENCHMARKS.loadTime}ms    | ${getStatusIcon(metrics.loadTime, PERFORMANCE_BENCHMARKS.loadTime, 'max')} |
| 形状生成时间 (ms)          | ${formatValue(metrics.shapeGenerationTime, 'ms')} | < ${PERFORMANCE_BENCHMARKS.shapeGenerationTime}ms | ${getStatusIcon(metrics.shapeGenerationTime, PERFORMANCE_BENCHMARKS.shapeGenerationTime, 'max')} |
| 拼图生成时间 (ms)          | ${formatValue(metrics.puzzleGenerationTime, 'ms')} | < ${PERFORMANCE_BENCHMARKS.puzzleGenerationTime}ms | ${getStatusIcon(metrics.puzzleGenerationTime, PERFORMANCE_BENCHMARKS.puzzleGenerationTime, 'max')} |
| 散开时间 (ms)              | ${formatValue(metrics.scatterTime, 'ms')}      | < ${PERFORMANCE_BENCHMARKS.scatterTime}ms    | ${getStatusIcon(metrics.scatterTime, PERFORMANCE_BENCHMARKS.scatterTime, 'max')} |
| 平均拼图交互时间 (ms)      | ${formatValue(metrics.avgInteractionTime?.toFixed(2), 'ms')} | < ${PERFORMANCE_BENCHMARKS.pieceInteractionTime}ms | ${getStatusIcon(metrics.avgInteractionTime, PERFORMANCE_BENCHMARKS.pieceInteractionTime, 'max')} |
| 平均帧率 (fps)             | ${formatValue(isNaN(avgFps) ? undefined : avgFps.toFixed(1), 'fps')}       | > ${PERFORMANCE_BENCHMARKS.minFps}fps     | ${getStatusIcon(avgFps, PERFORMANCE_BENCHMARKS.minFps, 'min')} |
| 内存使用 (MB)            | ${formatValue(isNaN(memMB) ? undefined : memMB.toFixed(2), 'MB')}       | < ${PERFORMANCE_BENCHMARKS.maxMemoryUsage / 1024 / 1024}MB     | ${getStatusIcon(memMB, PERFORMANCE_BENCHMARKS.maxMemoryUsage / 1024 / 1024, 'max')} |
| 拼图交互总时长 (ms)        | ${formatValue(metrics.puzzleInteractionDuration, 'ms')} | -         | ℹ️   |
| 总测试时间 (ms)            | ${formatValue(metrics.totalTestTime, 'ms')} | -         | ℹ️   |
`;

    const scenarioContent = `
| 参数 | 值 |
|---|---|
| 形状 | ${summaryData.scenario.shapeType || '未记录'} |
| 切割类型 | ${summaryData.scenario.cutType || '未记录'} |
| 切割次数 | ${summaryData.scenario.cutCount || '未记录'} |
| 拼图数量 | ${summaryData.scenario.pieceCount || '未记录'} |
`;

    const warnings = result.errors.map(err => `\`\`\`\n${err.message}\n\`\`\``).join('\n');
    const testSteps = parseTestStepsFromStdout(stdout);
    const pageSnapshot = await fse.pathExists(errorContextFile) ? await fse.readFile(errorContextFile, 'utf-8') : '无 Page snapshot 信息。';
    const testSource = await fse.readFile(testSourceFile, 'utf-8');

    const reportContent = `
<!--
${JSON.stringify({ version: "1.0", data: summaryData }, null, 2)}
-->

# ${testTitle} - 测试报告

- **测试日期**: ${timestamp}
- **测试结果**: ${testTitle} (${testStatus})

## 测试游戏场景参数
${scenarioContent}

## 预警与优化建议
${perfWarnings.length > 0 ? perfWarnings.join('\n\n') : '✅  所有性能指标均在基准范围内。'}

## 性能评测指标
f${perfContent}

## 流程步骤状态
<details>
<summary>点击展开/折叠</summary>

\`\`\`
${testSteps}
\`\`\`
</details>

## Page Snapshot
<details>
<summary>点击展开/折叠</summary>

\`\`\`yaml
${pageSnapshot}
\`\`\`
</details>


## 完整终端输出
<details>
<summary>点击展开/折叠</summary>

\`\`\`
${stdout}
\`\`\`
</details>
`;

    await fse.ensureDir(logsDir);
    await fse.writeFile(reportFilePath, reportContent.trim());
    console.log(`Test report generated at: ${reportFilePath}`);
}

async function updateIndex() {
    const reportFiles = (await fse.readdir(logsDir)).filter(f => f.startsWith('test-report-') && f.endsWith('.md'));
    const reportsData = [];

    for (const file of reportFiles) {
        const content = await fse.readFile(path.join(logsDir, file), 'utf-8');
        const match = content.match(/<!--\s*(\{[\s\S]*?\})\s*-->/);
        if (match && match[1]) {
            try {
                reportsData.push(JSON.parse(match[1]).data);
            } catch (e) {
                console.error(`Failed to parse metadata from ${file}:`, e);
            }
        }
    }

    reportsData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    let trendTable = `
### 详细历史数据
| 测试报告 | 状态 | 块数 | 加载 (ms) | 形状 (ms) | 切割 (ms) | 散开 (ms) | 交互 (ms) | FPS | 内存 (MB) |
|---|---|---|---|---|---|---|---|---|---|
`;

    for (const data of reportsData) {
        const m = data.metrics;
        const s = data.scenario || {};
        trendTable += `| [${dayjs(data.timestamp).tz('Asia/Hong_Kong').format('YYYY-MM-DD HH:mm')}](${data.fileName}) | ${data.status === '通过' ? '✅' : '❌'} | ${formatValue(s.pieceCount, '')} | ${getStatusIcon(m.loadTime, PERFORMANCE_BENCHMARKS.loadTime)} ${formatValue(m.loadTime)} | ${getStatusIcon(m.shapeGenerationTime, PERFORMANCE_BENCHMARKS.shapeGenerationTime)} ${formatValue(m.shapeGenerationTime)} | ${getStatusIcon(m.puzzleGenerationTime, PERFORMANCE_BENCHMARKS.puzzleGenerationTime)} ${formatValue(m.puzzleGenerationTime)} | ${getStatusIcon(m.scatterTime, PERFORMANCE_BENCHMARKS.scatterTime)} ${formatValue(m.scatterTime)} | ${getStatusIcon(m.avgInteractionTime, PERFORMANCE_BENCHMARKS.pieceInteractionTime)} ${formatValue(m.avgInteractionTime?.toFixed(1))} | ${getStatusIcon(m.avgFps, PERFORMANCE_BENCHMARKS.minFps, 'min')} ${formatValue(m.avgFps)} | ${getStatusIcon(m.memoryUsage, PERFORMANCE_BENCHMARKS.maxMemoryUsage / 1024 / 1024)} ${formatValue(m.memoryUsage)} |\n`;
    }

    const indexContent = `
# Playwright 测试报告索引

${trendTable}

## 如何使用

- **本地调试**: 运行 \`npm test\` 或 \`npx playwright test\`，实时查看终端输出，此模式不归档。
- **一键归档**: 运行 \`npm run test:e2e\`，自动执行测试、生成报告并更新此索引。
- **查看报告**: 点击上方表格中的链接可查看单次测试的详细报告。
`;

    await fse.writeFile(path.join(logsDir, 'index.md'), indexContent.trim());
    console.log(`Index file updated at: ${path.join(logsDir, 'index.md')}`);
}

// 新增：递归查找测试套件的辅助函数
function findSuite(suite, file) {
    if (suite.file === file) {
        return suite;
    }
    for (const s of suite.suites || []) {
        const found = findSuite(s, file);
        if (found) {
            return found;
        }
    }
    return undefined;
}


async function main() {
    if (process.env.ARCHIVE_RESULTS !== 'true') {
        console.log('ARCHIVE_RESULTS is not set to "true", skipping report generation.');
        return;
    }

    if (!await fse.pathExists(resultsFile)) {
        console.error(`Test results file not found at ${resultsFile}. Cannot generate report.`);
        return;
    }

    const results = await fse.readJson(resultsFile);
    // 使用新的递归查找函数来定位测试结果，并使用正确的文件名
    const gameFlowResult = findSuite(results, 'full_game_flow.spec.ts');
    
    if (gameFlowResult) {
        await generateReport(gameFlowResult);
        await updateIndex();
    } else {
        console.log('No result found for full_game_flow.spec.ts in test-results.json.');
    }
}

main().catch(err => {
    console.error("Error during report archival:", err);
    process.exit(1);
});