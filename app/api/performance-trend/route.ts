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
    const files = fs.readdirSync(logsDir)
      .filter(f => /^test-report-.*\.md$/.test(f))
      .sort((a, b) => b.localeCompare(a)); // 按文件名（时间）降序

    for (const file of files) {
      const filePath = path.join(logsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const meta = extractMetaFromMarkdown(content);
      if (meta && meta.metrics && meta.scenario) {
        // status 字段只与流程通过/失败相关，性能极优不会导致失败
        // 如有 failReason 字段，聚合到结果中，便于前端展示失败详情
        result.push({
          time: meta.timestamp ? new Date(meta.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'N/A',
          fullTime: meta.timestamp ? new Date(meta.timestamp).toLocaleString('zh-CN', { hour12: false }) : 'N/A',
          status: meta.status === '通过' ? '✅' : '❌',
          count: meta.scenario.pieceCount ?? 0,
          loadTime: meta.metrics.loadTime ?? 0,
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
          ...(meta.failReason ? { failReason: meta.failReason } : {})
        });
      }
    }
    // 前端图表需要升序数据
    return NextResponse.json(result.slice().reverse());
  } catch (e: any) {
    console.error("Failed to read performance data:", e);
    return NextResponse.json({ error: '读取性能数据失败', detail: e.message }, { status: 500 });
  }
}