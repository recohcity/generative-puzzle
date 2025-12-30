#!/usr/bin/env node

/**
 * 性能测试数据静态化生成脚本
 * 将 playwright-test-logs 中的 MD 报告解析并转换为 public/performance-data.json
 * 适配静态导出 (output: 'export') 环境下的性能仪表板
 */

const fs = require('fs');
const path = require('path');

const logsDir = path.join(process.cwd(), 'playwright-test-logs');
const outputFile = path.join(process.cwd(), 'public/performance-data.json');

// 提取 md 文件头部的 JSON 数据
function extractMetaFromMarkdown(content) {
    const match = content.match(/<!--\s*({[\s\S]*?})\s*-->/);
    if (!match) return null;
    try {
        const meta = JSON.parse(match[1]);
        return meta?.data || null;
    } catch {
        return null;
    }
}

console.log('📊 正在生成静态性能数据...');

try {
    // 检查目录是否存在
    if (!fs.existsSync(logsDir)) {
        console.log(`⚠️ 日志目录不存在: ${logsDir}，生成空数据包`);
        fs.writeFileSync(outputFile, JSON.stringify([]));
        process.exit(0);
    }

    const files = fs.readdirSync(logsDir)
        .filter(f => /^test-report-.*\.md$/.test(f))
        .sort((a, b) => b.localeCompare(a)); // 按文件名（时间）降序

    if (files.length === 0) {
        console.log('⚠️ 未找到测试报告文件，生成空数据包');
        fs.writeFileSync(outputFile, JSON.stringify([]));
        process.exit(0);
    }

    const result = [];
    for (const file of files) {
        try {
            const filePath = path.join(logsDir, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const meta = extractMetaFromMarkdown(content);

            if (meta && meta.metrics && meta.scenario) {
                result.push({
                    time: meta.timestamp ? new Date(meta.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'N/A',
                    fullTime: meta.timestamp ? new Date(meta.timestamp).toLocaleString('zh-CN', { hour12: false }) : 'N/A',
                    envMode: meta.envMode || 'unknown',
                    status: meta.status === '通过' ? '✅' : '❌',
                    count: meta.scenario.pieceCount ?? 0,
                    resourceLoadTime: meta.metrics.resourceLoadTime ?? meta.metrics.gotoLoadTime ?? 0,
                    e2eLoadTime: meta.metrics.e2eLoadTime ?? meta.metrics.loadTime ?? 0,
                    shapeGenerationTime: meta.metrics.shapeGenerationTime ?? 0,
                    puzzleGenerationTime: meta.metrics.puzzleGenerationTime ?? 0,
                    scatterTime: meta.metrics.scatterTime ?? 0,
                    avgInteractionTime: meta.metrics.avgInteractionTime ?? 0,
                    fps: meta.metrics.avgFps ?? 0,
                    memoryUsage: meta.metrics.memoryUsage ?? 0,
                    shapeType: meta.scenario.shapeType || '-',
                    cutType: meta.scenario.cutType || '-',
                    cutCount: meta.scenario.cutCount ?? '-',
                    version: meta.version || '未记录',
                    adaptationPassRate: typeof meta.metrics.adaptationPassRate === 'string'
                        ? parseFloat(meta.metrics.adaptationPassRate.replace('%', ''))
                        : meta.metrics.adaptationPassRate ?? undefined,
                    adaptationTestCount: meta.metrics.adaptationTestCount ?? undefined,
                    adaptationPassCount: meta.metrics.adaptationPassCount ?? undefined,
                    adaptationTestResults: meta.metrics.adaptationTestResults ?? undefined,
                    ...(meta.failReason ? { failReason: meta.failReason } : {})
                });
            }
        } catch (fileError) {
            console.error(`❌ 处理文件 ${file} 时出错:`, fileError.message);
        }
    }

    // 前端图表需要升序数据
    const finalData = result.slice().reverse();
    fs.writeFileSync(outputFile, JSON.stringify(finalData, null, 2));
    console.log(`✅ 成功生成性能数据: ${outputFile} (共 ${finalData.length} 条记录)`);
} catch (e) {
    console.error("❌ 生成性能数据失败:", e);
    process.exit(1);
}
