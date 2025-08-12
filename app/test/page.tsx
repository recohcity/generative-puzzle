"use client";

import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';

// 1. 明确定义数据类型
interface TrendData {
  time: string;
  fullTime: string;
  envMode?: string;
  status: string;
  count: number;
  resourceLoadTime?: number;
  e2eLoadTime?: number;
  loadTime: number;
  shapeGenerationTime: number;
  puzzleGenerationTime: number;
  scatterTime: number;
  avgInteractionTime: number;
  fps: number;
  memoryUsage: number;
  shapeType: string;
  cutType: string;
  cutCount: number;
  version?: string; 
  failReason?: string;
  // 新增：适配测试相关字段
  adaptationPassRate?: number;
  adaptationTestCount?: number;
  adaptationPassCount?: number;
  adaptationTestResults?: { [resolution: string]: boolean };
}

const BENCHMARKS = {
  loadTime: 1000,
  shapeGenerationTime: 500,
  puzzleGenerationTime: 800,
  scatterTime: 800,
  pieceInteractionTime: 1200,
  minFps: 30,
  maxMemoryUsage: 100 // MB
};

// 1. 增加新指标
const METRIC_LABELS: Record<string, string> = {
  resourceLoadTime: '资源(ms)',
  e2eLoadTime: '端到端(ms)',
  loadTime: '加载(ms)', // 兼容历史
  shapeGenerationTime: '形状(ms)',
  puzzleGenerationTime: '切割(ms)',
  scatterTime: '散开(ms)',
  avgInteractionTime: '交互(ms)',
  fps: 'FPS',
  memoryUsage: '内存(MB)',
  // 新增：适配测试指标
  adaptationPassRate: '适配通过率(%)',
  adaptationTestCount: '适配测试数',
  adaptationPassCount: '适配通过数'
};
const METRIC_KEYS = [
  'resourceLoadTime',
  'e2eLoadTime',
  'shapeGenerationTime',
  'puzzleGenerationTime',
  'scatterTime',
  'avgInteractionTime',
  'fps',
  'memoryUsage',
  'adaptationPassRate'
] as const;

type MetricKey = typeof METRIC_KEYS[number];

// 2. getPerformanceGrade 增加新指标
const getPerformanceGrade = (metric: MetricKey, value: number) => {
  if (value === undefined || value === null || isNaN(value)) {
    return { grade: '缺失', color: 'text-gray-400', bg: 'bg-gray-100' };
  }
  switch (metric) {
    case 'resourceLoadTime':
      if (value <= 800) return { grade: '极优', color: 'text-green-700', bg: 'bg-green-100' };
      if (value <= 1000) return { grade: '达标', color: 'text-blue-600', bg: 'bg-blue-100' };
      if (value <= 1200) return { grade: '预警', color: 'text-yellow-600', bg: 'bg-yellow-100' };
      return { grade: '超标', color: 'text-red-600', bg: 'bg-red-100' };
    case 'e2eLoadTime':
      if (value <= 1200) return { grade: '极优', color: 'text-green-700', bg: 'bg-green-100' };
      if (value <= 1800) return { grade: '达标', color: 'text-blue-600', bg: 'bg-blue-100' };
      if (value <= 2000) return { grade: '预警', color: 'text-yellow-600', bg: 'bg-yellow-100' };
      return { grade: '超标', color: 'text-red-600', bg: 'bg-red-100' };
    case 'shapeGenerationTime':
      if (value <= BENCHMARKS.shapeGenerationTime * 0.8) return { grade: '优秀', color: 'text-green-600', bg: 'bg-green-100' };
      if (value <= BENCHMARKS.shapeGenerationTime) return { grade: '良好', color: 'text-blue-600', bg: 'bg-blue-100' };
      if (value <= BENCHMARKS.shapeGenerationTime * 1.2) return { grade: '警告', color: 'text-yellow-600', bg: 'bg-yellow-100' };
      return { grade: '超标', color: 'text-red-600', bg: 'bg-red-100' };
    case 'puzzleGenerationTime':
      if (value <= BENCHMARKS.puzzleGenerationTime * 0.8) return { grade: '优秀', color: 'text-green-600', bg: 'bg-green-100' };
      if (value <= BENCHMARKS.puzzleGenerationTime) return { grade: '良好', color: 'text-blue-600', bg: 'bg-blue-100' };
      return { grade: '合格', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    case 'scatterTime':
      if (value <= BENCHMARKS.scatterTime * 0.8) return { grade: '优秀', color: 'text-green-600', bg: 'bg-green-100' };
      if (value <= BENCHMARKS.scatterTime) return { grade: '良好', color: 'text-blue-600', bg: 'bg-blue-100' };
      return { grade: '合格', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    case 'avgInteractionTime':
      if (value <= BENCHMARKS.pieceInteractionTime * 0.8) return { grade: '优秀', color: 'text-green-600', bg: 'bg-green-100' };
      if (value <= BENCHMARKS.pieceInteractionTime) return { grade: '良好', color: 'text-blue-600', bg: 'bg-blue-100' };
      if (value <= BENCHMARKS.pieceInteractionTime * 1.2) return { grade: '警告', color: 'text-yellow-600', bg: 'bg-yellow-100' };
      return { grade: '超标', color: 'text-red-600', bg: 'bg-red-100' };
    case 'fps':
      if (value >= 50) return { grade: '优秀', color: 'text-green-600', bg: 'bg-green-100' };
      if (value >= 40) return { grade: '良好', color: 'text-blue-600', bg: 'bg-blue-100' };
      if (value >= BENCHMARKS.minFps) return { grade: '合格', color: 'text-yellow-600', bg: 'bg-yellow-100' };
      return { grade: '不达标', color: 'text-red-600', bg: 'bg-red-100' };
    case 'memoryUsage':
      if (value <= BENCHMARKS.maxMemoryUsage * 0.5) return { grade: '优秀', color: 'text-green-600', bg: 'bg-green-100' };
      if (value <= BENCHMARKS.maxMemoryUsage * 0.7) return { grade: '良好', color: 'text-blue-600', bg: 'bg-blue-100' };
      if (value <= BENCHMARKS.maxMemoryUsage) return { grade: '合格', color: 'text-yellow-600', bg: 'bg-yellow-100' };
      return { grade: '超标', color: 'text-red-600', bg: 'bg-red-100' };
    case 'adaptationPassRate':
      if (value >= 100) return { grade: '完美', color: 'text-green-700', bg: 'bg-green-100' };
      if (value >= 90) return { grade: '优秀', color: 'text-green-600', bg: 'bg-green-100' };
      if (value >= 75) return { grade: '良好', color: 'text-blue-600', bg: 'bg-blue-100' };
      if (value >= 50) return { grade: '合格', color: 'text-yellow-600', bg: 'bg-yellow-100' };
      return { grade: '不达标', color: 'text-red-600', bg: 'bg-red-100' };
    default:
      return { grade: '未知', color: 'text-gray-600', bg: 'bg-gray-100' };
  }
};

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; color: string; name: string }>;
  label?: string;
  data: TrendData[];
}

const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label, data }) => {
  if (active && payload && payload.length && label) {
    const dataPoint = data.find(d => d.time === label);
    return (
      <div className="bg-white p-4 border border-gray-300 rounded shadow-lg min-w-[200px]">
        <p className="font-semibold text-gray-800 mb-2">{`时间: ${dataPoint?.fullTime || label}`}</p>
        <p className="text-sm text-gray-600 mb-2">
          状态: {dataPoint?.status} | 块数: {dataPoint?.count}
        </p>
        {payload.map((entry, index) => {
          const key = Object.keys(METRIC_LABELS).find(k => METRIC_LABELS[k] === entry.name) as MetricKey | undefined;
          const grade = key ? getPerformanceGrade(key, entry.value) : { grade: '', bg: '', color: '' };
          return (
            <div key={index} className="text-sm mb-1 flex justify-between items-center">
              <span style={{ color: entry.color }}>
                {`${entry.name}: ${entry.value}${entry.name === 'FPS' ? '' : entry.name.includes('内存') ? 'MB' : 'ms'}`}
              </span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${grade.bg} ${grade.color}`}>
                {grade.grade}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

const calculateComplianceStats = (data: TrendData[]) => {
  if (!data || data.length === 0) {
    return { 
      totalRuns: 0, successfulRuns: 0, failedRuns: 0, successRate: '0.0%',
      totalMetrics: 0, compliantMetrics: 0, warningMetrics: 0, exceededMetrics: 0,
      compliantRate: '0.0%', warningRate: '0.0%', exceededRate: '0.0%', failedRate: '0.0%'
    };
  }

  const stats = {
    totalRuns: data.length,
    successfulRuns: data.filter(d => d.status === '✅').length,
    failedRuns: data.filter(d => d.status !== '✅').length,
    totalMetrics: 0,
    compliantMetrics: 0,
    warningMetrics: 0,
    exceededMetrics: 0,
  };

  data.forEach(item => {
    METRIC_KEYS.forEach(key => {
      stats.totalMetrics++;
      const grade = getPerformanceGrade(key, item[key as keyof TrendData] as number);
      if (grade.grade === '优秀' || grade.grade === '良好' || grade.grade === '极优' || grade.grade === '达标') {
        stats.compliantMetrics++;
      } else if (grade.grade === '警告' || grade.grade === '预警') {
        stats.warningMetrics++;
      } else if (grade.grade === '超标' || grade.grade === '不达标') {
        stats.exceededMetrics++;
      }
    });
  });

  const formatPercentage = (numerator: number, denominator: number) => {
    if (denominator === 0) return '0.0%';
    return `${((numerator / denominator) * 100).toFixed(1)}%`;
  };

  return {
    ...stats,
    successRate: formatPercentage(stats.successfulRuns, stats.totalRuns),
    failedRate: formatPercentage(stats.failedRuns, stats.totalRuns),
    compliantRate: formatPercentage(stats.compliantMetrics, stats.totalMetrics),
    warningRate: formatPercentage(stats.warningMetrics, stats.totalMetrics),
    exceededRate: formatPercentage(stats.exceededMetrics, stats.totalMetrics),
  };
};

// 1. 新增评级计算函数
function getModeRating(stats: { successRate: number, compliantRate: number, exceededRate: number }) {
  if (stats.successRate >= 0.95 && stats.compliantRate >= 0.95 && stats.exceededRate === 0) {
    return { grade: 'A+', desc: '成功率极高，所有性能指标全部达标，系统稳定性和可靠性极佳，已达到高质量上线标准。' };
  }
  if (stats.successRate >= 0.90 && stats.compliantRate >= 0.90 && stats.exceededRate <= 0.01) {
    return { grade: 'A', desc: '成功率和性能指标均表现优秀，系统稳定，适合生产环境。' };
  }
  if (stats.successRate >= 0.85 && stats.compliantRate >= 0.85 && stats.exceededRate <= 0.03) {
    return { grade: 'B+', desc: '整体表现良好，偶有失败和性能波动，适合持续集成和问题预警。' };
  }
  if (stats.successRate >= 0.75 && stats.compliantRate >= 0.75 && stats.exceededRate <= 0.05) {
    return { grade: 'B', desc: '有一定失败和性能波动，需关注优化。' };
  }
  return { grade: 'C', desc: '成功率和性能指标不达标，建议重点排查和优化。' };
}

// 新增：单次测试评级计算函数
function getSingleTestRating(item: TrendData) {
  let excellentCount = 0;
  let goodCount = 0;
  let warningCount = 0;
  let exceededCount = 0;
  
  METRIC_KEYS.forEach(key => {
    const grade = getPerformanceGrade(key, item[key as keyof TrendData] as number);
    if (grade.grade === '极优' || grade.grade === '优秀' || grade.grade === '完美') {
      excellentCount++;
    } else if (grade.grade === '达标' || grade.grade === '良好') {
      goodCount++;
    } else if (grade.grade === '预警' || grade.grade === '警告' || grade.grade === '合格') {
      warningCount++;
    } else if (grade.grade === '超标' || grade.grade === '不达标') {
      exceededCount++;
    }
  });
  
  const totalMetrics = METRIC_KEYS.length;
  const excellentRate = excellentCount / totalMetrics;
  const goodRate = (excellentCount + goodCount) / totalMetrics;
  const exceededRate = exceededCount / totalMetrics;
  
  // 如果测试失败，直接返回F
  if (item.status !== '✅') {
    return { grade: 'F', color: 'text-red-700', bg: 'bg-red-100', desc: '测试失败' };
  }
  
  // 检查适配测试结果 - 只有当数据存在时才考虑适配测试
  const hasAdaptationData = item.adaptationPassRate !== undefined && item.adaptationPassRate !== null;
  const adaptationPassRate = hasAdaptationData ? item.adaptationPassRate : 100; // 缺失数据时默认为100%
  let adaptationPenalty = 0;
  
  // 只有当适配测试数据存在且不达标时才应用惩罚
  if (hasAdaptationData && adaptationPassRate && adaptationPassRate < 100) {
    adaptationPenalty = (100 - adaptationPassRate) / 100 * 0.2; // 适配测试占20%权重
  }
  
  // 根据指标表现评级（考虑适配测试影响）
  const adjustedExcellentRate = Math.max(0, excellentRate - adaptationPenalty);
  const adjustedGoodRate = Math.max(0, goodRate - adaptationPenalty);
  
  // 评级逻辑：当没有适配数据时，不要求适配测试通过率
  if (adjustedExcellentRate >= 0.8 && (!hasAdaptationData || (adaptationPassRate && adaptationPassRate >= 90))) {
    return { grade: 'A+', color: 'text-green-700', bg: 'bg-green-100', desc: '性能卓越' };
  } else if (adjustedExcellentRate >= 0.6 || (adjustedGoodRate >= 0.9 && (!hasAdaptationData || (adaptationPassRate && adaptationPassRate >= 75)))) {
    return { grade: 'A', color: 'text-green-600', bg: 'bg-green-50', desc: '性能优秀' };
  } else if (adjustedGoodRate >= 0.8 && exceededRate === 0 && (!hasAdaptationData || (adaptationPassRate && adaptationPassRate >= 75))) {
    return { grade: 'B+', color: 'text-blue-600', bg: 'bg-blue-50', desc: '性能良好' };
  } else if (adjustedGoodRate >= 0.7 && exceededRate <= 0.1) {
    return { grade: 'B', color: 'text-blue-500', bg: 'bg-blue-50', desc: '性能合格' };
  } else if (exceededRate <= 0.2) {
    return { grade: 'C', color: 'text-yellow-600', bg: 'bg-yellow-50', desc: '需要优化' };
  } else {
    return { grade: 'D', color: 'text-red-600', bg: 'bg-red-50', desc: '性能不达标' };
  }
}


const PerformanceTrendPage: React.FC = () => {
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<'performance' | 'system' | 'adaptation'>('performance');
  // 分页相关
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  // 新增：模式筛选
  const [envFilter, setEnvFilter] = useState<'all' | 'development' | 'production'>('all');
  
  // 优化：使用 useMemo 缓存计算结果
  const filteredData = React.useMemo(() => {
    return envFilter === 'all' ? trendData : trendData.filter(d => d.envMode === envFilter);
  }, [trendData, envFilter]);
  
  const totalPages = React.useMemo(() => {
    return Math.max(1, Math.ceil(filteredData.length / pageSize));
  }, [filteredData.length, pageSize]);

  // 统计开发/生产均值、极值
  function calcStats(data: TrendData[], key: MetricKey) {
    const values = data.map(d => d[key]).filter(v => typeof v === 'number' && !isNaN(v)) as number[];
    if (!values.length) return { avg: '-', max: '-', min: '-' };
    const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
    const max = Math.max(...values).toFixed(2);
    const min = Math.min(...values).toFixed(2);
    return { avg, max, min };
  }
  const devData = trendData.filter(d => d.envMode === 'development');
  const prodData = trendData.filter(d => d.envMode === 'production');

  // 差异分析：开发/生产均值相差2倍及以上高亮
  const diffAnalysis: string[] = [];
  METRIC_KEYS.forEach(key => {
    const devStats = calcStats(devData, key);
    const prodStats = calcStats(prodData, key);
    if (devStats.avg !== '-' && prodStats.avg !== '-') {
      const devAvg = parseFloat(devStats.avg);
      const prodAvg = parseFloat(prodStats.avg);
      if (devAvg > 0 && prodAvg > 0) {
        const ratio = devAvg > prodAvg ? devAvg / prodAvg : prodAvg / devAvg;
        if (ratio >= 2) {
          diffAnalysis.push(`${METRIC_LABELS[key]} 开发/生产均值差异显著（${devStats.avg} vs ${prodStats.avg}）`);
        }
      }
    }
  });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        console.log('开始获取性能数据...');
        
        // 使用API路由读取测试报告数据
        const apiUrl = '/api/performance-trend';
        const res = await fetch(apiUrl);
        
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
        }
        
        const data = await res.json();
        
        if (Array.isArray(data)) {
          // 兼容老数据，补齐 resourceLoadTime、e2eLoadTime 字段
          const patched = data.map((item: any) => ({
            ...item,
            resourceLoadTime: item.resourceLoadTime ?? item.loadTime ?? 0,
            e2eLoadTime: item.e2eLoadTime ?? item.loadTime ?? 0,
          }));
          setTrendData(patched);
        } else {
          throw new Error("API did not return an array");
        }
      } catch (e: unknown) {
        console.error('Fetch error:', e);
        const message =
          e instanceof Error ? e.message :
          typeof e === 'string' ? e :
          'Unknown error occurred';
        // 离线友好提示
        setError(!navigator.onLine ? '网络异常，请检查网络连接' : (message || 'Unknown error occurred'));
        setTrendData([]);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  // 当数据变化时自动跳转到最后一页（最新数据）
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredData.length]);

  // 优化：使用 useMemo 缓存分页数据
  const pagedFilteredData = React.useMemo(() => {
    // 保险：按 fullTime/time 降序排序后再分页，确保最新数据始终在前
    const sorted = [...filteredData].sort((a, b) => {
      const ta = new Date(a.fullTime || a.time).getTime();
      const tb = new Date(b.fullTime || b.time).getTime();
      return tb - ta; // DESC - 最新的在前
    });
    return sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredData, currentPage, pageSize]);

  // 优化：更好的加载和错误状态
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">正在加载性能数据...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-center mb-4">
            <div className="bg-red-100 rounded-full p-2 mr-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-800">数据加载失败</h3>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  const complianceStats = calculateComplianceStats(trendData);

  // 2. 统计开发/生产环境的指标
  const devStats = calculateComplianceStats(devData);
  const prodStats = calculateComplianceStats(prodData);

  function parsePercent(str: string) {
    // "93.7%" => 0.937
    return parseFloat(str.replace('%','')) / 100;
  }

  const devRating = getModeRating({
    successRate: parsePercent(devStats.successRate),
    compliantRate: parsePercent(devStats.compliantRate),
    exceededRate: parsePercent(devStats.exceededRate),
  });
  const prodRating = getModeRating({
    successRate: parsePercent(prodStats.successRate),
    compliantRate: parsePercent(prodStats.compliantRate),
    exceededRate: parsePercent(prodStats.exceededRate),
  });

  return (
    <main className="w-full min-h-screen bg-gray-50 p-2 sm:p-4 text-gray-900" style={{ userSelect: 'text', color: '#111827' }}>
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-3 sm:p-4 text-gray-900">
        {/* 精简标题区 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">🎮 性能测试仪表板</h1>
            <p className="text-xs text-gray-500 mt-1">实时监控 · 自动化测试 · 性能分析</p>
          </div>
          <div className="flex gap-2 mt-2 sm:mt-0">
            <button
              onClick={() => {
                const csvContent = [
                  ['时间', '版本', '模式', ...METRIC_KEYS.map(k => METRIC_LABELS[k]), '综合评级'],
                  ...filteredData.map(item => [
                    item.fullTime,
                    item.version || '',
                    item.envMode || '',
                    ...METRIC_KEYS.map(k => item[k as keyof TrendData] || ''),
                    getSingleTestRating(item).grade
                  ])
                ].map(row => row.join(',')).join('\n');
                
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `performance-data-${new Date().toISOString().split('T')[0]}.csv`;
                link.click();
              }}
              className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs"
            >
              📊 导出
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs"
            >
              🔄 刷新
            </button>
          </div>
        </div>
        
        {/* 核心指标概览 - 紧凑设计 */}
        <section className="mb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-green-50 p-3 rounded border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-green-800">生产</span>
                <span className="text-2xl font-extrabold text-green-700">{prodRating.grade}</span>
              </div>
              <p className="text-xs text-green-600 mt-1">{complianceStats.successRate} 成功率</p>
            </div>
            <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-blue-800">开发</span>
                <span className="text-2xl font-extrabold text-blue-700">{devRating.grade}</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">{devStats.successRate} 成功率</p>
            </div>
            <div className="bg-purple-50 p-3 rounded border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-purple-800">适配</span>
                <span className="text-lg font-extrabold text-purple-700">
                  {filteredData.filter(d => d.adaptationPassRate !== undefined).length > 0 
                    ? (filteredData.filter(d => d.adaptationPassRate !== undefined)
                        .reduce((sum, d) => sum + (d.adaptationPassRate || 0), 0) / 
                       filteredData.filter(d => d.adaptationPassRate !== undefined).length).toFixed(0)
                    : '0'}%
                </span>
              </div>
              <p className="text-xs text-purple-600 mt-1">跨平台通过率</p>
            </div>
            <div className="bg-gray-50 p-3 rounded border-l-4 border-gray-500">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-800">总计</span>
                <span className="text-lg font-extrabold text-gray-700">{complianceStats.totalRuns}</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">测试执行次数</p>
            </div>
          </div>
        </section>
        
        {/* 精简基准值说明 */}
        <div className="mb-4 p-3 bg-blue-50 rounded border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-blue-800 text-sm">🎯 性能基准</h2>
            <button 
              onClick={() => {
                const details = document.getElementById('benchmark-details');
                if (details) {
                  details.style.display = details.style.display === 'none' ? 'block' : 'none';
                }
              }}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              详情 ▼
            </button>
          </div>
          <div className="text-xs text-blue-700 mt-2">
            加载≤1000ms · 形状≤500ms · 切割≤800ms · 交互≤1200ms · FPS≥30 · 适配≥90%
          </div>
          <div id="benchmark-details" style={{ display: 'none' }} className="mt-3 text-xs text-blue-600 space-y-1">
            <div>📱 <strong>适配测试覆盖</strong>: 桌面(1920×1080等) · 移动(375×667等) · 平板(768×1024等)</div>
            <div>🎯 <strong>评估维度</strong>: 布局完整性 · 交互可用性 · 性能稳定性 · 视觉一致性</div>
          </div>
        </div>
        


        {/* 差异分析说明块 - 精简版 */}
        {diffAnalysis.length > 0 && (
          <div className="mb-3 p-2 bg-yellow-50 border-l-4 border-yellow-400 rounded">
            <div className="text-xs text-yellow-800">
              <strong>⚠️ 环境差异:</strong> {diffAnalysis.slice(0, 2).join(' · ')}
              {diffAnalysis.length > 2 && ' ...'}
            </div>
          </div>
        )}

        {/* 趋势图表 - 移到表格后面 */}
        <section className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800">📈 性能趋势</h2>
            <div className="flex gap-1">
              <button
                onClick={() => setSelectedMetric('performance')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${selectedMetric === 'performance' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                性能
              </button>
              <button
                onClick={() => setSelectedMetric('system')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${selectedMetric === 'system' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                系统
              </button>
              <button
                onClick={() => setSelectedMetric('adaptation')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${selectedMetric === 'adaptation' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                适配
              </button>
            </div>
          </div>

        {selectedMetric === 'performance' && (
          <div className="mb-4">
            <div className="bg-white border border-gray-200 rounded p-3">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart 
                  data={filteredData} 
                  margin={{ top: 5, right: 20, left: 10, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="time" 
                    angle={-45} 
                    textAnchor="end" 
                    height={60} 
                    interval="preserveStartEnd"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    label={{ value: '时间 (ms)', angle: -90, position: 'insideLeft' }}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip data={filteredData} />} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <ReferenceLine y={BENCHMARKS.shapeGenerationTime} label="形状基准" stroke="#f59e0b" strokeDasharray="3 3" />
                  <ReferenceLine y={BENCHMARKS.pieceInteractionTime} label="交互基准" stroke="#ef4444" strokeDasharray="3 3" />
                  <Line 
                    type="monotone" 
                    dataKey="shapeGenerationTime" 
                    name={METRIC_LABELS.shapeGenerationTime} 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="puzzleGenerationTime" 
                    name={METRIC_LABELS.puzzleGenerationTime} 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="scatterTime" 
                    name={METRIC_LABELS.scatterTime} 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="avgInteractionTime" 
                    name={METRIC_LABELS.avgInteractionTime} 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        
        {selectedMetric === 'adaptation' && (
          <section className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">跨平台适配指标趋势</h2>
              <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                <span className="text-sm text-gray-600">显示数据点:</span>
                <span className="text-sm font-medium text-blue-600">{filteredData.length} 个</span>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart 
                  data={filteredData} 
                  margin={{ top: 5, right: 30, left: 10, bottom: 50 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="time" 
                    angle={-45} 
                    textAnchor="end" 
                    height={60} 
                    interval="preserveStartEnd"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    label={{ value: '通过率 (%)', angle: -90, position: 'insideLeft' }}
                    tick={{ fontSize: 12 }}
                    domain={[0, 100]}
                  />
                  <Tooltip content={<CustomTooltip data={filteredData} />} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <ReferenceLine 
                    y={90} 
                    label="优秀基准 (90%)" 
                    stroke="#10b981" 
                    strokeDasharray="3 3" 
                  />
                  <ReferenceLine 
                    y={75} 
                    label="良好基准 (75%)" 
                    stroke="#f59e0b" 
                    strokeDasharray="3 3" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="adaptationPassRate" 
                    name={METRIC_LABELS.adaptationPassRate} 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {/* 适配测试详细统计 */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                <h3 className="font-semibold text-purple-800 mb-2">📊 适配测试统计</h3>
                <div className="space-y-1 text-sm text-purple-700">
                  <div>总测试次数: <strong>{filteredData.filter(d => d.adaptationTestCount).length}</strong></div>
                  <div>平均通过率: <strong>
                    {filteredData.filter(d => d.adaptationPassRate !== undefined).length > 0 
                      ? (filteredData.filter(d => d.adaptationPassRate !== undefined)
                          .reduce((sum, d) => sum + (d.adaptationPassRate || 0), 0) / 
                         filteredData.filter(d => d.adaptationPassRate !== undefined).length).toFixed(1)
                      : '暂无数据'}%
                  </strong></div>
                  <div>完美通过次数: <strong>{filteredData.filter(d => d.adaptationPassRate === 100).length}</strong></div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <h3 className="font-semibold text-green-800 mb-2">✅ 优秀表现</h3>
                <div className="space-y-1 text-sm text-green-700">
                  <div>≥90% 通过率: <strong>{filteredData.filter(d => (d.adaptationPassRate || 0) >= 90).length}</strong> 次</div>
                  <div>≥75% 通过率: <strong>{filteredData.filter(d => (d.adaptationPassRate || 0) >= 75).length}</strong> 次</div>
                  <div>最高通过率: <strong>
                    {filteredData.filter(d => d.adaptationPassRate !== undefined).length > 0
                      ? Math.max(...filteredData.filter(d => d.adaptationPassRate !== undefined).map(d => d.adaptationPassRate || 0)).toFixed(1)
                      : '暂无数据'}%
                  </strong></div>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
                <h3 className="font-semibold text-yellow-800 mb-2">⚠️ 需要关注</h3>
                <div className="space-y-1 text-sm text-yellow-700">
                  <div>&lt;75% 通过率: <strong>{filteredData.filter(d => (d.adaptationPassRate || 0) < 75 && d.adaptationPassRate !== undefined).length}</strong> 次</div>
                  <div>&lt;50% 通过率: <strong>{filteredData.filter(d => (d.adaptationPassRate || 0) < 50 && d.adaptationPassRate !== undefined).length}</strong> 次</div>
                  <div>最低通过率: <strong>
                    {filteredData.filter(d => d.adaptationPassRate !== undefined).length > 0
                      ? Math.min(...filteredData.filter(d => d.adaptationPassRate !== undefined).map(d => d.adaptationPassRate || 0)).toFixed(1)
                      : '暂无数据'}%
                  </strong></div>
                </div>
              </div>
            </div>
          </section>
        )}
        
        {selectedMetric === 'system' && (
          <section className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">系统指标趋势 (含基准线)</h2>
              <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                <span className="text-sm text-gray-600">显示数据点:</span>
                <span className="text-sm font-medium text-blue-600">{filteredData.length} 个</span>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart 
                  data={filteredData} 
                  margin={{ top: 5, right: 30, left: 10, bottom: 50 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="time" 
                    angle={-45} 
                    textAnchor="end" 
                    height={60} 
                    interval="preserveStartEnd"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    yAxisId="fps" 
                    label={{ value: 'FPS', angle: -90, position: 'insideLeft' }}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    yAxisId="memory" 
                    orientation="right" 
                    label={{ value: '内存 (MB)', angle: 90, position: 'insideRight' }}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip data={filteredData} />} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <ReferenceLine 
                    yAxisId="fps" 
                    y={BENCHMARKS.minFps} 
                    label="FPS基准" 
                    stroke="#06b6d4" 
                    strokeDasharray="3 3" 
                  />
                  <ReferenceLine 
                    yAxisId="memory" 
                    y={BENCHMARKS.maxMemoryUsage} 
                    label="内存基准" 
                    stroke="#84cc16" 
                    strokeDasharray="3 3" 
                  />
                  <Line 
                    yAxisId="fps" 
                    type="monotone" 
                    dataKey="fps" 
                    name={METRIC_LABELS.fps} 
                    stroke="#06b6d4" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line 
                    yAxisId="memory" 
                    type="monotone" 
                    dataKey="memoryUsage" 
                    name={METRIC_LABELS.memoryUsage} 
                    stroke="#84cc16" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* 核心数据表格 - 提前展示 */}
        <section className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800">📊 测试结果数据</h2>
            <div className="flex items-center space-x-2 text-sm">
              <select
                value={envFilter}
                onChange={e => setEnvFilter(e.target.value as any)}
                className="border border-gray-300 rounded px-2 py-1 text-xs bg-white"
              >
                <option value="all">全部 ({trendData.length})</option>
                <option value="development">开发 ({devData.length})</option>
                <option value="production">生产 ({prodData.length})</option>
              </select>
              <span className="text-xs text-gray-600">
                显示: {filteredData.length} 条
              </span>
            </div>
          </div>
          <div className="overflow-x-auto shadow-sm border border-gray-200 rounded-lg">
            <table className="min-w-full border-collapse bg-white text-xs">
              <thead className="sticky top-0 z-10 bg-gray-100">
                <tr>
                  <th className="sticky left-0 bg-gray-100 border-r border-gray-300 px-2 py-2 text-left font-bold text-gray-700 text-xs">时间</th>
                  <th className="border-r border-gray-300 px-2 py-2 text-center font-bold text-gray-700 text-xs">模式</th>
                  <th className="border-r border-gray-300 px-2 py-2 text-center font-bold text-gray-700 text-xs">版本</th>
                  {/* 核心指标优先 */}
                  <th className="border-r border-gray-300 px-2 py-2 text-center font-bold text-gray-700 text-xs">资源</th>
                  <th className="border-r border-gray-300 px-2 py-2 text-center font-bold text-gray-700 text-xs">E2E</th>
                  <th className="border-r border-gray-300 px-2 py-2 text-center font-bold text-gray-700 text-xs">形状</th>
                  <th className="border-r border-gray-300 px-2 py-2 text-center font-bold text-gray-700 text-xs">切割</th>
                  <th className="border-r border-gray-300 px-2 py-2 text-center font-bold text-gray-700 text-xs">交互</th>
                  <th className="border-r border-gray-300 px-2 py-2 text-center font-bold text-gray-700 text-xs">FPS</th>
                  <th className="border-r border-gray-300 px-2 py-2 text-center font-bold text-gray-700 text-xs">内存</th>
                  <th className="border-r border-gray-300 px-2 py-2 text-center font-bold text-gray-700 text-xs">适配</th>
                  <th className="px-2 py-2 text-center font-bold text-gray-700 text-xs">评级</th>
                </tr>
              </thead>
              <tbody>
                {pagedFilteredData.map((item: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="sticky left-0 bg-white border-r border-b border-gray-300 px-2 py-1 font-mono text-xs text-gray-800">
                      {item.fullTime?.split(' ')[1] || item.time}
                      <div className="text-[10px] text-gray-500">{item.fullTime?.split(' ')[0]}</div>
                    </td>
                    <td className="border-r border-b border-gray-300 px-2 py-1 text-center">
                      {item.envMode === 'production' && (
                        <span className="bg-green-100 text-green-700 px-1 py-0.5 rounded text-[10px]">生产</span>
                      )}
                      {item.envMode === 'development' && (
                        <span className="bg-blue-100 text-blue-700 px-1 py-0.5 rounded text-[10px]">开发</span>
                      )}
                      {(!item.envMode || (item.envMode !== 'production' && item.envMode !== 'development')) && (
                        <span className="bg-gray-100 text-gray-700 px-1 py-0.5 rounded text-[10px]">未知</span>
                      )}
                    </td>
                    <td className="border-r border-b border-gray-300 px-2 py-1 text-center">
                      <span className="text-[10px] text-gray-700 font-mono">
                        {item.version || '-'}
                      </span>
                    </td>
                    {/* 核心指标：资源、E2E、形状、切割、交互、FPS、内存、适配 */}
                    {[
                      { key: 'resourceLoadTime', value: item.resourceLoadTime },
                      { key: 'e2eLoadTime', value: item.e2eLoadTime },
                      { key: 'shapeGenerationTime', value: item.shapeGenerationTime },
                      { key: 'puzzleGenerationTime', value: item.puzzleGenerationTime },
                      { key: 'avgInteractionTime', value: item.avgInteractionTime },
                      { key: 'fps', value: item.fps },
                      { key: 'memoryUsage', value: item.memoryUsage },
                      { key: 'adaptationPassRate', value: item.adaptationPassRate }
                    ].map(({ key, value }) => {

                      const grade = getPerformanceGrade(key as MetricKey, value);
                      return (
                        <td key={key} className="border-r border-b border-gray-300 px-2 py-1 text-center">
                          <div className={`px-1 py-0.5 rounded text-[10px] font-medium ${grade.bg} ${grade.color}`}>
                            {key === 'avgInteractionTime' && value ? value.toFixed(0) :
                             key === 'fps' && value ? value.toFixed(0) :
                             key === 'memoryUsage' && value ? value.toFixed(1) :
                             key === 'adaptationPassRate' ? (value !== undefined && value !== null ? `${value.toFixed(0)}%` : '-') :
                             value || '-'}
                          </div>
                        </td>
                      );
                    })}
                    <td className="border-b border-gray-300 px-2 py-1 text-center">
                      {(() => {
                        const rating = getSingleTestRating(item);
                        return (
                          <div className={`px-2 py-1 rounded font-bold text-sm ${rating.bg} ${rating.color}`}>
                            {rating.grade}
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
                {/* 精简统计行 */}
                <tr className="bg-blue-50 font-semibold text-xs">
                  <td colSpan={3} className="text-right pr-2 text-blue-800">开发均值</td>
                  <td className="text-center text-blue-700 border-r border-gray-300 px-2 py-1">{calcStats(devData, 'resourceLoadTime').avg}</td>
                  <td className="text-center text-blue-700 border-r border-gray-300 px-2 py-1">{calcStats(devData, 'e2eLoadTime').avg}</td>
                  <td className="text-center text-blue-700 border-r border-gray-300 px-2 py-1">{calcStats(devData, 'shapeGenerationTime').avg}</td>
                  <td className="text-center text-blue-700 border-r border-gray-300 px-2 py-1">{calcStats(devData, 'puzzleGenerationTime').avg}</td>
                  <td className="text-center text-blue-700 border-r border-gray-300 px-2 py-1">{calcStats(devData, 'avgInteractionTime').avg}</td>
                  <td className="text-center text-blue-700 border-r border-gray-300 px-2 py-1">{calcStats(devData, 'fps').avg}</td>
                  <td className="text-center text-blue-700 border-r border-gray-300 px-2 py-1">{calcStats(devData, 'memoryUsage').avg}</td>
                  <td className="text-center text-blue-700 border-r border-gray-300 px-2 py-1">{calcStats(devData, 'adaptationPassRate').avg}</td>
                  <td className="text-center text-blue-800">-</td>
                </tr>
                <tr className="bg-green-50 font-semibold text-xs">
                  <td colSpan={3} className="text-right pr-2 text-green-800">生产均值</td>
                  <td className="text-center text-green-700 border-r border-gray-300 px-2 py-1">{calcStats(prodData, 'resourceLoadTime').avg}</td>
                  <td className="text-center text-green-700 border-r border-gray-300 px-2 py-1">{calcStats(prodData, 'e2eLoadTime').avg}</td>
                  <td className="text-center text-green-700 border-r border-gray-300 px-2 py-1">{calcStats(prodData, 'shapeGenerationTime').avg}</td>
                  <td className="text-center text-green-700 border-r border-gray-300 px-2 py-1">{calcStats(prodData, 'puzzleGenerationTime').avg}</td>
                  <td className="text-center text-green-700 border-r border-gray-300 px-2 py-1">{calcStats(prodData, 'avgInteractionTime').avg}</td>
                  <td className="text-center text-green-700 border-r border-gray-300 px-2 py-1">{calcStats(prodData, 'fps').avg}</td>
                  <td className="text-center text-green-700 border-r border-gray-300 px-2 py-1">{calcStats(prodData, 'memoryUsage').avg}</td>
                  <td className="text-center text-green-700 border-r border-gray-300 px-2 py-1">{calcStats(prodData, 'adaptationPassRate').avg}</td>
                  <td className="text-center text-green-800">-</td>
                </tr>
              </tbody>
          </table>
        </div>
          {/* 分页控件 */}
          <div className="flex justify-center items-center space-x-2 mt-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              上一页
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
              <button
                key={pageNumber}
                onClick={() => setCurrentPage(pageNumber)}
                className={`px-4 py-2 text-sm font-medium border rounded-md ${
                  currentPage === pageNumber
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'text-gray-600 bg-white border-gray-300 hover:bg-gray-100'
                }`}
              >
                {pageNumber}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        </section>

        {/* 精简优化建议 */}
        <div className="bg-orange-50 p-3 rounded border-l-4 border-orange-500">
          <h2 className="font-semibold text-orange-800 mb-2 text-sm">🔧 关键建议</h2>
          <div className="text-xs text-orange-700 space-y-1">
            <div><strong>✅ 生产环境:</strong> 各项指标优秀，系统稳定，已达上线标准</div>
            <div><strong>⚠️ 开发环境:</strong> 部分指标波动，建议引入生产级构建流程</div>
            <div><strong>📱 跨平台适配:</strong> 整体表现良好，重点关注小屏设备和4K显示器</div>
            <div><strong>📊 持续监控:</strong> 定期回归测试，防止性能回退，关注环境差异趋势</div>
          </div>
        </div>
        </section>
      </div>
    </main>
  );
};

export default PerformanceTrendPage;