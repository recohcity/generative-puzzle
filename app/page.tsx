"use client"

import dynamic from 'next/dynamic'
import { useState, useEffect, useRef } from "react"
import LoadingScreenStatic from "@/components/loading/LoadingScreenStatic"

// 动态懒加载加载屏幕组件，但不使用静态替代，以减少中间状态切换
const LoadingScreen = dynamic(() => import('@/components/loading/LoadingScreen'), { 
  ssr: false,
  // 使用静态加载页面保持一致的UI
  loading: () => <LoadingScreenStatic />
})

// 预加载主游戏组件，设置为priority
const CurveTestOptimized = dynamic(() => import('@/curve-test-optimized'), {
  ssr: false
})

export default function PuzzleTestPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  // 添加一个标记，用于避免重复预加载
  const gamePreloaded = useRef(false)
  
  // 确保在客户端渲染时立即显示加载页面，并开始预加载游戏组件
  useEffect(() => {
    // 立即设置为已挂载
    setIsMounted(true)
    
    // 立即开始预加载游戏组件，不等待空闲时间
    if (!gamePreloaded.current) {
      gamePreloaded.current = true
      
      // 直接开始并行预加载，不使用requestIdleCallback
      // 这将加快资源加载速度，避免等待空闲时间
      import('@/curve-test-optimized')
        .then(() => console.log('游戏组件预加载完成'))
        .catch(err => console.error('游戏组件预加载失败:', err))
      
      // 预取其他可能的资源
      // 此处可以添加关键资源的预加载
    }
    
    // 用于调试加载性能
    const startTime = performance.now()
    return () => {
      const loadTime = performance.now() - startTime
      console.log(`页面组件挂载时间: ${loadTime.toFixed(2)}ms`)
    }
  }, [])
  
  const handleLoadComplete = () => {
    console.log('加载完成，显示游戏组件')
    setIsLoading(false)
  }

  // 如果还没有挂载，直接显示静态加载屏幕
  if (!isMounted) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center">
        <LoadingScreenStatic />
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      {isLoading ? (
        <LoadingScreen onLoadComplete={handleLoadComplete} />
      ) : (
        <CurveTestOptimized />
      )}
    </main>
  )
}

