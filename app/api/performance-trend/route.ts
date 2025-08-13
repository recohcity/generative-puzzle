// app/api/performance-trend/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 提取 md 文件头部的 JSON 数据
function extractMetaFromMarkdown(content: string) {
  const match = content.match(/<!--\s*({[\s\S]*?})\s*-->/);
  if (!match) return null;
  try {
    const meta = JSON.parse(match[1]);
    return meta?.data || null;
  } catch {
    return null;
  }
}

export async function GET() {
  const logsDir = path.join(process.cwd(), 'playwright-test-logs');
  let result: any[] = [];

  try {
    // 检查目录是否存在
    if (!fs.existsSync(logsDir)) {
      console.log(`Logs directory does not exist: ${logsDir}`);
      return NextResponse.json([]);
    }

    const files = fs.readdirSync(logsDir)
      .filter(f => /^test-report-.*\.md$/.test(f))
      .sort((a, b) => b.localeCompare(a)); // 按文件名（时间）降序

    if (files.length === 0) {
      console.log('No test report files found');
      return NextResponse.json([]);
    }

    for (const file of files) {
      try {
        const filePath = path.join(logsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const meta = extractMetaFromMarkdown(content);
        if (meta && meta.metrics && meta.scenario) {
        // status 字段只与流程通过/失败相关，性能极优不会导致失败
        // 如有 failReason 字段，聚合到结果中，便于前端展示失败详情
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
          // 新增：适配测试数据
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
        console.error(`Error processing file ${file}:`, fileError);
        // 跳过有问题的文件，继续处理其他文件
        continue;
      }
    }
    // 前端图表需要升序数据
    return NextResponse.json(result.slice().reverse());
  } catch (e: any) {
    console.error("Failed to read performance data:", e);
    return NextResponse.json({ error: '读取性能数据失败', detail: e.message }, { status: 500 });
  }
}