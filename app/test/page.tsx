"use client";

import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';

// 1. 明确定义数据类型
interface TrendData {
  time: string;
  fullTime: string;
  status: string;
  count: number;
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

const METRIC_LABELS: Record<string, string> = {
  loadTime: '加载(ms)',
  shapeGenerationTime: '形状(ms)',
  puzzleGenerationTime: '切割(ms)',
  scatterTime: '散开(ms)',
  avgInteractionTime: '交互(ms)',
  fps: 'FPS',
  memoryUsage: '内存(MB)'
};

const METRIC_KEYS = [
  'loadTime',
  'shapeGenerationTime',
  'puzzleGenerationTime',
  'scatterTime',
  'avgInteractionTime',
  'fps',
  'memoryUsage'
] as const;

type MetricKey = typeof METRIC_KEYS[number];

const getPerformanceGrade = (metric: MetricKey, value: number) => {
  if (value === undefined || value === null || isNaN(value)) {
    return { grade: '缺失', color: 'text-gray-400', bg: 'bg-gray-100' };
  }
  switch (metric) {
    case 'loadTime':
      if (value <= BENCHMARKS.loadTime * 0.8) return { grade: '优秀', color: 'text-green-600', bg: 'bg-green-100' };
      if (value <= BENCHMARKS.loadTime) return { grade: '良好', color: 'text-blue-600', bg: 'bg-blue-100' };
      if (value <= BENCHMARKS.loadTime * 1.2) return { grade: '警告', color: 'text-yellow-600', bg: 'bg-yellow-100' };
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
      if (grade.grade === '优秀' || grade.grade === '良好') {
        stats.compliantMetrics++;
      } else if (grade.grade === '警告' || grade.grade === '合格') {
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


const PerformanceTrendPage: React.FC = () => {
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<'performance' | 'system'>('performance');
  // 分页相关
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(trendData.length / pageSize));
  const pagedData = trendData.slice().reverse().slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
          setTrendData(data);
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

  if (loading) return <div className="flex justify-center items-center h-screen">加载中...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-500">加载数据失败: {error}</div>;

  const complianceStats = calculateComplianceStats(trendData);

  return (
    <main className="w-full min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8" style={{ userSelect: 'text' }}>
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Generative Puzzle - 游戏性能测试平台</h1>
          <p className="text-sm text-gray-600 mt-1 sm:mt-0">基于 Playwright 的自动化测试与性能分析</p>
        </div>
        
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
              { label: '加载时间', value: `≤${BENCHMARKS.loadTime}ms` },
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

        {selectedMetric === 'performance' && (
          <section className="mb-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">性能指标趋势 (含基准线)</h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={trendData} margin={{ top: 5, right: 20, left: 10, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" angle={-45} textAnchor="end" height={60} interval="preserveStartEnd" />
                <YAxis label={{ value: '时间 (ms)', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={<CustomTooltip data={trendData} />} />
                <Legend />
                <ReferenceLine y={BENCHMARKS.loadTime} label="加载基准" stroke="#3b82f6" strokeDasharray="3 3" />
                <ReferenceLine y={BENCHMARKS.shapeGenerationTime} label="形状基准" stroke="#f59e0b" strokeDasharray="3 3" />
                <ReferenceLine y={BENCHMARKS.pieceInteractionTime} label="交互基准" stroke="#ef4444" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="loadTime" name={METRIC_LABELS.loadTime} stroke="#3b82f6" strokeWidth={2} />
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
              <LineChart data={trendData} margin={{ top: 5, right: 30, left: 10, bottom: 50 }}>
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
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300 text-sm">
              <thead className="sticky top-0 z-10 bg-gray-200">
                <tr>
                  <th className="sticky left-0 bg-gray-200 border-r border-gray-300 px-3 py-2 text-left font-bold text-gray-700">测试时间</th>
                  <th className="border-r border-gray-300 px-3 py-2 text-center font-bold text-gray-700">版本号</th>
                  <th className="border-r border-gray-300 px-3 py-2 text-center font-bold text-gray-700">状态</th>
                  {METRIC_KEYS.map(key => (
                    <th key={key} className="border-r border-gray-300 px-3 py-2 text-center font-bold text-gray-700">{METRIC_LABELS[key]}</th>
                  ))}
                  <th className="border-r border-gray-300 px-3 py-2 text-center font-bold text-gray-700">形状类型</th>
                  <th className="border-r border-gray-300 px-3 py-2 text-center font-bold text-gray-700">切割类型</th>
                  <th className="border-r border-gray-300 px-3 py-2 text-center font-bold text-gray-700">切割次数</th>
                  <th className="px-3 py-2 text-center font-bold text-gray-700">拼图数量</th>
                </tr>
              </thead>
              <tbody>
                {pagedData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="sticky left-0 bg-white border-r border-b border-gray-300 px-3 py-2 font-mono text-sm text-gray-800">
                      {item.fullTime}
                    </td>
                    <td className="border-r border-b border-gray-300 px-3 py-2 text-center text-gray-800">{item.version || '未记录'}</td>
                    <td className="border-r border-b border-gray-300 px-3 py-2 text-center text-lg relative">
                      {item.status}
                      {item.status === '❌' && item.failReason && (
                        <div className="absolute left-1/2 z-10 mt-2 w-64 -translate-x-1/2 rounded bg-red-50 border border-red-300 p-2 text-xs text-red-700 shadow-lg whitespace-pre-line">
                          {item.failReason}
                        </div>
                      )}
                    </td>
                    {METRIC_KEYS.map(key => {
                      const grade = getPerformanceGrade(key, item[key as keyof TrendData] as number);
                      const value = item[key as keyof TrendData] as number;
                      return (
                        <td key={key} className="border-r border-b border-gray-300 px-3 py-2 text-center">
                          <div className={`px-2 py-1 rounded text-xs font-medium ${grade.bg} ${grade.color} flex items-center justify-center`}>
                            {key === 'avgInteractionTime' && value ? value.toFixed(2) : value}
                            {grade.grade === '优秀' && <span className="ml-1 bg-green-500 text-white rounded px-1 text-[10px]">极优</span>}
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
            <p><strong>交互优化:</strong> 关注交互时间超标的测试，检查拖拽和旋转过程中的事件处理和渲染逻辑，避免频繁或昂贵的计算导致卡顿。</p>
            <p><strong>形状生成:</strong> 对于形状生成时间超标的场景，建议优化形状生成算法的复杂度，考虑是否有可优化的计算或缓存逻辑。</p>
            <p><strong>加载性能:</strong> 对于加载时间显著超标的场景，需要排查页面资源加载瓶颈，如压缩图片、使用代码分割、利用浏览器缓存等。</p>
            <p><strong>持续监控:</strong> FPS 和内存使用目前稳定，但需持续监控，防止在复杂场景下出现性能退化。</p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default PerformanceTrendPage;