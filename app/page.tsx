"use client"

import dynamic from 'next/dynamic'
import { useState, useEffect, useRef } from "react"
// import LoadingScreenStatic from "@/components/loading/LoadingScreenStatic"

// 动态懒加载加载屏幕组件，但不使用静态替代，以减少中间状态切换
const LoadingScreen = dynamic(() => import('@/components/loading/LoadingScreen'), { 
  ssr: false,
  loading: () => null // 避免递归，使用 null
})

// 预加载主游戏组件，设置为priority
const GameInterfaceComponent = dynamic(() => import('@/components/GameInterface'), {
  ssr: false,
  loading: () => null // 避免递归，使用 null
})

export default function HomePage() {
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
      import('@/components/GameInterface')
        .then(() => console.log('游戏组件预加载完成'))
        .catch(err => console.error('游戏组件预加载失败:', err))
    }
  }, [])
  
  const handleLoadComplete = () => {
    console.log('加载完成，显示游戏组件')
    setIsLoading(false)
  }

  // 如果还没有挂载，直接显示静态加载屏幕，防止闪烁
  if (!isMounted) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <div />
      </main>
    )
  }

  return (
    <main className="flex items-center justify-center min-h-screen">
      {isLoading ? (
        <LoadingScreen key="loading" onLoadComplete={handleLoadComplete} />
      ) : (
        <GameInterfaceComponent key="main" />
      )}
    </main>
  )
}

