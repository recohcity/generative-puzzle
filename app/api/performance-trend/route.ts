import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

interface PerformanceDataItem {
  time: string;
  fullTime: string;
  envMode: string;
  status: string;
  count: number;
  version?: string;
  // 性能指标
  resourceLoadTime?: number;
  e2eLoadTime?: number;
  loadTime?: number;
  shapeGenerationTime?: number;
  puzzleGenerationTime?: number;
  scatterTime?: number;
  avgInteractionTime?: number;
  fps?: number;
  memoryUsage?: number;
  // 场景参数
  shapeType: string;
  cutType: string;
  cutCount: number;
  // 适配测试数据
  adaptationPassRate?: number;
  adaptationTestCount?: number;
  adaptationPassCount?: number;
  adaptationTestResults?: Record<string, boolean>;
  // 失败原因
  failReason?: string;
}

export async function GET() {
  try {
    // 读取历史测试数据
    const logsDir = path.join(process.cwd(), 'playwright-test-logs');
    
    if (!fs.existsSync(logsDir)) {
      return NextResponse.json([]);
    }
    
    const reportFiles = fs.readdirSync(logsDir)
      .filter(f => f.startsWith('test-report-') && f.endsWith('.md'))
      .sort();
    
    const performanceData: PerformanceDataItem[] = [];
    
    // 适配通过率解析函数
    const parseAdaptationPassRate = (value: any): number | undefined => {
      if (!value) return undefined;
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        return parseFloat(value.replace('%', ''));
      }
      return undefined;
    };
    
    for (const file of reportFiles) {
      try {
        const content = fs.readFileSync(path.join(logsDir, file), 'utf-8');
        const match = content.match(/<!--\s*(\{[\s\S]*?\})\s*-->/);
        
        if (match && match[1]) {
          const metadata = JSON.parse(match[1]);
          if (!metadata.data) {
            console.warn(`Missing data property in ${file}`);
            continue;
          }
          const data = metadata.data;
          
          // 数据格式标准化
          const timestamp = new Date(data.timestamp);
          const timeStr = timestamp.toLocaleString('zh-CN', { 
            timeZone: 'Asia/Hong_Kong',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }).replace(/\//g, '-');
          
          const fullTimeStr = timestamp.toLocaleString('zh-CN', { 
            timeZone: 'Asia/Hong_Kong',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }).replace(/\//g, '-');
          
          const item = {
            time: timeStr,
            fullTime: fullTimeStr,
            envMode: data.envMode || 'unknown',
            status: data.status === '通过' ? '✅' : '❌',
            count: data.scenario?.pieceCount || 0,
            version: data.version,
            // 性能指标
            resourceLoadTime: data.metrics?.resourceLoadTime,
            e2eLoadTime: data.metrics?.e2eLoadTime,
            loadTime: data.metrics?.loadTime || data.metrics?.e2eLoadTime,
            shapeGenerationTime: data.metrics?.shapeGenerationTime,
            puzzleGenerationTime: data.metrics?.puzzleGenerationTime,
            scatterTime: data.metrics?.scatterTime,
            avgInteractionTime: data.metrics?.avgInteractionTime,
            fps: data.metrics?.avgFps,
            memoryUsage: data.metrics?.memoryUsage,
            // 场景参数
            shapeType: data.scenario?.shapeType || '未知',
            cutType: data.scenario?.cutType || '未知',
            cutCount: data.scenario?.cutCount || 0,
            // 适配测试数据 - 使用解析函数确保数值格式正确
            adaptationPassRate: parseAdaptationPassRate(data.metrics?.adaptationPassRate),
            adaptationTestCount: data.metrics?.adaptationTestCount,
            adaptationPassCount: data.metrics?.adaptationPassCount,
            adaptationTestResults: data.metrics?.adaptationTestResults,
            // 失败原因
            failReason: data.failReason
          };
          
          performanceData.push(item);
        }
      } catch (e) {
        console.error(`Failed to parse report ${file}:`, e);
      }
    }
    
    // 按时间倒序排列
    performanceData.sort((a, b) => new Date(b.fullTime).getTime() - new Date(a.fullTime).getTime());
    
    return NextResponse.json(performanceData);
  } catch (error) {
    console.error('Error reading performance data:', error);
    return NextResponse.json([]);
  }
}