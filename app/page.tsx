"use client"

import CurveTestOptimized from "@/curve-test-optimized"
import PuzzleAnalysis from "@/curve-test-analysis"
import { useState } from "react"

export default function PuzzleTestPage() {
  const [showAnalysis, setShowAnalysis] = useState(false)

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <div className="container mx-auto px-4 py-8">
        {showAnalysis ? (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-3xl font-bold">拼图游戏项目分析</h1>
              <button 
                onClick={() => setShowAnalysis(false)}
                className="inline-flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                返回游戏
              </button>
            </div>
            
            <PuzzleAnalysis />
            
            <div className="mt-8 text-center">
              <button 
                onClick={() => setShowAnalysis(false)}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 shadow-md"
              >
                返回拼图游戏
              </button>
            </div>
          </>
        ) : (
          <>
            <header className="mb-8 text-center">
              <h1 className="text-3xl font-bold mb-2">拼图游戏优化测试</h1>
              <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                这是优化后的拼图游戏测试页面。该版本包含模块化重构、性能优化、UI/UX改进以及无障碍功能增强。
              </p>
              <div className="mt-4">
                <button 
                  onClick={() => setShowAnalysis(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 shadow-md"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                  查看项目分析文档
                </button>
              </div>
            </header>

            <section className="mb-6 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md max-w-3xl mx-auto">
              <h2 className="text-lg font-medium mb-2">使用说明</h2>
              <ol className="list-decimal ml-5 space-y-1 text-sm">
                <li>选择形状类型 (多边形、曲线形状或不规则形状)</li>
                <li>点击"生成形状"按钮创建基础形状</li>
                <li>设置切割次数和切割类型</li>
                <li>点击"生成拼图"切割形状</li>
                <li>点击"散开拼图"开始游戏</li>
                <li>拖动拼图片段到正确位置，可以使用旋转按钮调整角度</li>
                <li>当所有拼图片段都放回原位时，游戏完成</li>
              </ol>
            </section>

            <div className="my-8">
              <CurveTestOptimized />
            </div>

            <footer className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
              <p>本页面支持深色模式 - 请使用组件顶部的主题切换按钮</p>
              <p className="mt-2">
                <button 
                  onClick={() => setShowAnalysis(true)}
                  className="text-blue-500 hover:text-blue-700 transition-colors duration-200"
                >
                  查看完整项目分析文档
                </button>
              </p>
            </footer>
          </>
        )}
      </div>
    </main>
  )
}

