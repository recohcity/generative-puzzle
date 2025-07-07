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
  memoryUsage: '内存(MB)'
};
const METRIC_KEYS = [
  'resourceLoadTime',
  'e2eLoadTime',
  'shapeGenerationTime',
  'puzzleGenerationTime',
  'scatterTime',
  'avgInteractionTime',
  'fps',
  'memoryUsage'
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


const PerformanceTrendPage: React.FC = () => {
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<'performance' | 'system'>('performance');
  // 分页相关
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(trendData.length / pageSize));
  // 新增：模式筛选
  const [envFilter, setEnvFilter] = useState<'all' | 'development' | 'production'>('all');
  const filteredData = envFilter === 'all' ? trendData : trendData.filter(d => d.envMode === envFilter);

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
        const res = await fetch('/api/performance-trend');
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
      } catch (e: any) {
        setError(e.message);
        setTrendData([]);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  // 当数据变化时自动跳转到最后一页（最新数据）
  useEffect(() => {
    setCurrentPage(1);
  }, [trendData.length]);

  // pagedFilteredData 定义移到 useEffect 之后，确保作用域
  const pagedFilteredData: any[] = filteredData.slice().reverse().slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (loading) return <div className="flex justify-center items-center h-screen">加载中...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-500">加载数据失败: {error}</div>;

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
    <main className="w-full min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8" style={{ userSelect: 'text' }}>
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Generative Puzzle - 游戏性能测试平台</h1>
          <p className="text-sm text-gray-600 mt-1 sm:mt-0">基于 Playwright 的自动化测试与性能分析</p>
        </div>
        
        <section className="mb-6">
          <h2 className="font-semibold text-purple-800 mb-3 text-lg">📝 模式综合评级</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-lg font-bold text-green-800">生产模式</span>
                <span className="text-3xl font-extrabold text-green-700">{prodRating.grade}</span>
              </div>
              <p className="mt-2 text-green-700 text-sm">{prodRating.desc}</p>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-lg font-bold text-blue-800">开发模式</span>
                <span className="text-3xl font-extrabold text-blue-700">{devRating.grade}</span>
              </div>
              <p className="mt-2 text-blue-700 text-sm">{devRating.desc}</p>
            </div>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="font-semibold text-gray-800 mb-3 text-lg">📈 测试执行统计</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-100 p-4 rounded-lg border-l-4 border-gray-500">
              <h3 className="font-semibold text-gray-800">📋 总运行次数</h3>
              <p className="text-2xl font-bold text-gray-600">{complianceStats.totalRuns}</p>
              <p className="text-sm text-gray-700">完成的测试流程</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
              <h3 className="font-semibold text-green-800">✅ 成功次数</h3>
              <p className="text-2xl font-bold text-green-600">{complianceStats.successfulRuns}</p>
              <p className="text-sm text-green-700">{complianceStats.successRate}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
              <h3 className="font-semibold text-red-800">❌ 失败次数</h3>
              <p className="text-2xl font-bold text-red-600">{complianceStats.failedRuns}</p>
              <p className="text-sm text-red-700">{complianceStats.failedRate}</p>
            </div>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="font-semibold text-gray-800 mb-3 text-lg">📊 性能指标合规分析</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-100 p-4 rounded-lg border-l-4 border-gray-500">
              <h3 className="font-semibold text-gray-800"> M 指标检测总数</h3>
              <p className="text-2xl font-bold text-gray-600">{complianceStats.totalMetrics}</p>
              <p className="text-sm text-gray-700">跨所有测试</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
              <h3 className="font-semibold text-green-800">✅ 达标指标</h3>
              <p className="text-2xl font-bold text-green-600">{complianceStats.compliantMetrics}</p>
              <p className="text-sm text-green-700">{complianceStats.compliantRate}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
              <h3 className="font-semibold text-yellow-800">⚠️ 预警指标</h3>
              <p className="text-2xl font-bold text-yellow-600">{complianceStats.warningMetrics}</p>
              <p className="text-sm text-yellow-700">{complianceStats.warningRate}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
              <h3 className="font-semibold text-red-800">🚨 超标指标</h3>
              <p className="text-2xl font-bold text-red-600">{complianceStats.exceededMetrics}</p>
              <p className="text-sm text-red-700">{complianceStats.exceededRate}</p>
            </div>
          </div>
        </section>
        
        <section className="mb-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
          <h2 className="font-semibold text-blue-800 mb-3 text-lg">🎯 项目性能基准值</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
            {[
              { label: '资源加载', value: '≤1000ms' },
              { label: '端到端加载', value: '≤1800ms' },
              { label: '形状生成', value: `≤${BENCHMARKS.shapeGenerationTime}ms` },
              { label: '拼图生成', value: `≤${BENCHMARKS.puzzleGenerationTime}ms` },
              { label: '散开时间', value: `≤${BENCHMARKS.scatterTime}ms` },
              { label: '交互响应', value: `≤${BENCHMARKS.pieceInteractionTime}ms` },
              { label: '最低帧率', value: `≥${BENCHMARKS.minFps}fps` },
              { label: '最大内存', value: `≤${BENCHMARKS.maxMemoryUsage}MB` },
            ].map(item => (
              <div key={item.label} className="text-blue-700"><strong>{item.label}:</strong> {item.value}</div>
            ))}
          </div>
        </section>
        
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setSelectedMetric('performance')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedMetric === 'performance' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            性能指标趋势
          </button>
          <button
            onClick={() => setSelectedMetric('system')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedMetric === 'system' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            系统指标趋势
          </button>
        </div>

        {/* 模式筛选下拉框 */}
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-gray-700 font-medium">模式筛选：</span>
          <select
            value={envFilter}
            onChange={e => setEnvFilter(e.target.value as any)}
            className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="all">全部</option>
            <option value="development">开发</option>
            <option value="production">生产</option>
          </select>
        </div>
        {/* 差异分析说明块 */}
        {diffAnalysis.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded">
            <strong>开发/生产环境主要性能差异：</strong>
            <ul className="list-disc pl-5 mt-1">
              {diffAnalysis.map((txt, i) => <li key={i}>{txt}</li>)}
            </ul>
          </div>
        )}

        {selectedMetric === 'performance' && (
          <section className="mb-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">性能指标趋势 (含基准线)</h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={filteredData} margin={{ top: 5, right: 20, left: 10, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" angle={-45} textAnchor="end" height={60} interval="preserveStartEnd" />
                <YAxis label={{ value: '时间 (ms)', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={<CustomTooltip data={trendData} />} />
                <Legend />
                <ReferenceLine y={BENCHMARKS.shapeGenerationTime} label="形状基准" stroke="#f59e0b" strokeDasharray="3 3" />
                <ReferenceLine y={BENCHMARKS.pieceInteractionTime} label="交互基准" stroke="#ef4444" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="shapeGenerationTime" name={METRIC_LABELS.shapeGenerationTime} stroke="#f59e0b" strokeWidth={2} />
                <Line type="monotone" dataKey="puzzleGenerationTime" name={METRIC_LABELS.puzzleGenerationTime} stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="scatterTime" name={METRIC_LABELS.scatterTime} stroke="#8b5cf6" strokeWidth={2} />
                <Line type="monotone" dataKey="avgInteractionTime" name={METRIC_LABELS.avgInteractionTime} stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </section>
        )}
        
        {selectedMetric === 'system' && (
          <section className="mb-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">系统指标趋势 (含基准线)</h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={filteredData} margin={{ top: 5, right: 30, left: 10, bottom: 50 }}>
          <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" angle={-45} textAnchor="end" height={60} interval="preserveStartEnd" />
                <YAxis yAxisId="fps" label={{ value: 'FPS', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="memory" orientation="right" label={{ value: '内存 (MB)', angle: 90, position: 'insideRight' }} />
                <Tooltip content={<CustomTooltip data={trendData} />} />
          <Legend />
                <ReferenceLine yAxisId="fps" y={BENCHMARKS.minFps} label="FPS基准" stroke="#06b6d4" strokeDasharray="3 3" />
                <Line yAxisId="fps" type="monotone" dataKey="fps" name={METRIC_LABELS.fps} stroke="#06b6d4" strokeWidth={2} />
                <Line yAxisId="memory" type="monotone" dataKey="memoryUsage" name={METRIC_LABELS.memoryUsage} stroke="#84cc16" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
          </section>
        )}

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">详细性能评估报告</h2>
          <div className="mb-2 text-sm text-blue-700 bg-blue-50 rounded p-3 border-l-4 border-blue-400">
            <div><strong>加载时间说明：</strong></div>
            <div>• <strong>页面资源加载时间（page.goto）</strong>：仅统计页面资源加载（如JS/CSS/图片），基准值 <strong>1000ms</strong>。</div>
            <div>• <strong>端到端可交互加载时间（E2E）</strong>：统计从访问到页面完全可操作的完整耗时，基准值 <strong>1800ms</strong>。端到端体验更贴近用户真实感受。</div>
            <div>• 两者均有测试参考价值，建议同时关注。</div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300 text-sm">
              <thead className="sticky top-0 z-10 bg-gray-200">
                <tr>
                  <th className="sticky left-0 bg-gray-200 border-r border-gray-300 px-3 py-2 text-left font-bold text-gray-700">测试时间</th>
                  <th className="border-r border-gray-300 px-3 py-2 text-center font-bold text-gray-700">版本号</th>
                  <th className="border-r border-gray-300 px-3 py-2 text-center font-bold text-gray-700">模式</th>
                  {METRIC_KEYS.map(key => (
                    <th key={key} className="border-r border-gray-300 px-3 py-2 text-center font-bold text-gray-700">{METRIC_LABELS[key]}</th>
                  ))}
                  <th className="border-r border-gray-300 px-3 py-2 text-center font-bold text-gray-700">形状</th>
                  <th className="border-r border-gray-300 px-3 py-2 text-center font-bold text-gray-700">切割</th>
                  <th className="border-r border-gray-300 px-3 py-2 text-center font-bold text-gray-700">次数</th>
                  <th className="px-3 py-2 text-center font-bold text-gray-700">拼图</th>
                </tr>
              </thead>
              <tbody>
                {/* 表格渲染部分，使用 filteredData 替换 pagedData，分页逻辑同步调整 */}
                {pagedFilteredData.map((item: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="sticky left-0 bg-white border-r border-b border-gray-300 px-3 py-2 font-mono text-sm text-gray-800">
                      {item.fullTime}
                    </td>
                    <td className="border-r border-b border-gray-300 px-3 py-2 text-center text-gray-800">{item.version || '未记录'}</td>
                    <td className="border-r border-b border-gray-300 px-3 py-2 text-center">
                      {item.envMode === 'production' && (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm">生产</span>
                      )}
                      {item.envMode === 'development' && (
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">开发</span>
                      )}
                      {(!item.envMode || (item.envMode !== 'production' && item.envMode !== 'development')) && (
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">未知</span>
                      )}
                    </td>
                    {METRIC_KEYS.map(key => {
                      const grade = getPerformanceGrade(key, item[key as keyof TrendData] as number);
                      const value = item[key as keyof TrendData] as number;
                      return (
                        <td key={key} className="border-r border-b border-gray-300 px-3 py-2 text-center">
                          <div className={`px-2 py-1 rounded text-xs font-medium ${grade.bg} ${grade.color} flex items-center justify-center`}>
                            {key === 'avgInteractionTime' && value ? value.toFixed(2) :
                             key === 'memoryUsage' && value !== undefined && value !== null ? value.toFixed(2) :
                             value}
                            {grade.grade === '极优' && <span className="ml-1 bg-green-500 text-white rounded px-1 text-[10px]">极优</span>}
                          </div>
                          <div className={`text-xs mt-1 ${grade.color}`}>{grade.grade}</div>
                        </td>
                      );
                    })}
                    <td className="border-r border-b border-gray-300 px-3 py-2 text-center text-gray-800">{item.shapeType}</td>
                    <td className="border-r border-b border-gray-300 px-3 py-2 text-center text-gray-800">{item.cutType}</td>
                    <td className="border-r border-b border-gray-300 px-3 py-2 text-center text-gray-800">{item.cutCount}</td>
                    <td className="border-b border-gray-300 px-3 py-2 text-center text-gray-800">{item.count}</td>
                  </tr>
                ))}
                {/* 分组统计行 */}
                <tr className="bg-gray-50 font-semibold">
                  <td colSpan={3} className="text-right pr-2">开发均值</td>
                  {METRIC_KEYS.map(key => <td key={key} className="text-center text-blue-700">{calcStats(devData, key).avg}</td>)}
                  <td colSpan={4}></td>
                </tr>
                <tr className="bg-gray-50 font-semibold">
                  <td colSpan={3} className="text-right pr-2">生产均值</td>
                  {METRIC_KEYS.map(key => <td key={key} className="text-center text-green-700">{calcStats(prodData, key).avg}</td>)}
                  <td colSpan={4}></td>
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

        <section className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
          <h2 className="font-semibold text-orange-800 mb-3 text-lg">🔧 性能优化建议</h2>
          <div className="text-sm text-orange-700 space-y-2">
            <p><strong>总体评价：</strong>生产环境各项性能指标均优于基准线，系统稳定，用户体验优秀，已达到高质量上线标准。开发环境部分指标超标属正常现象，但建议定期对比生产数据，防止因开发习惯导致的性能回退。</p>
            <p><strong>资源加载与端到端加载：</strong>生产环境资源加载和端到端加载时间表现优异，绝大多数测试远低于基准值。开发环境波动较大，建议引入更接近生产的构建流程，便于提前发现潜在瓶颈。</p>
            <p><strong>形状/拼图生成与交互：</strong>生产环境下形状生成、拼图生成、散开和交互性能均表现稳定，核心算法和渲染流程高效。建议持续关注极端场景下的性能波动，定期回归测试。</p>
            <p><strong>FPS与内存：</strong>生产环境FPS长期稳定在60帧左右，内存使用极低，未见异常。建议持续监控大规模拼图或复杂动画场景，防止回归。</p>
            <p><strong>开发/生产差异：</strong>多项指标在开发与生产环境间存在2倍及以上差异，主要源于资源未压缩、调试工具注入等。开发环境建议模拟生产优化，提升测试数据参考价值。</p>
            <p><strong>自动化与趋势监控：</strong>建议持续自动化回归与趋势监控，关注资源体积、渲染链路、交互流畅性和内存使用，防止性能回退。差异显著的指标需定期分析，确保开发与生产环境的性能趋势一致。</p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default PerformanceTrendPage;