"use client"

import dynamic from 'next/dynamic'
import CurveTestOptimized from "@/curve-test-optimized"
import { useState, useEffect } from "react"
// Removed PuzzleAnalysis import
// import PuzzleAnalysis from "@/curve-test-analysis"
// Removed useState import as it's no longer needed
// import { useState } from "react"

// 动态导入LoadingScreen组件，禁用SSR
const LoadingScreen = dynamic(() => import('@/components/LoadingScreen'), { 
  ssr: false 
})

export default function PuzzleTestPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  
  // 确保在客户端渲染时才显示加载页面
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  const handleLoadComplete = () => {
    setIsLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200 flex flex-col items-center justify-center">
      {isMounted ? (
        isLoading ? (
          <LoadingScreen onLoadComplete={handleLoadComplete} />
        ) : (
          <CurveTestOptimized />
        )
      ) : (
        // 服务器端渲染时显示空白页
        <div className="w-full h-screen bg-gradient-to-b from-[#2A2835] to-[#1F1D2B]"></div>
      )}
    </main>
  )
}

