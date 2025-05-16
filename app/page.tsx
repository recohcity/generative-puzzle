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
const GameInterfaceComponent = dynamic(() => import('@/components/GameInterface'), {
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
      import('@/components/GameInterface')
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
  
  // 禁用页面滚动效果，解决移动设备上的滚动问题
  useEffect(() => {
    // 禁用触摸移动事件的默认行为
    const preventDefaultTouchMove = (e: TouchEvent) => {
      e.preventDefault();
    };
    
    // 禁用滚轮事件的默认行为
    const preventDefaultWheel = (e: WheelEvent) => {
      e.preventDefault();
    };
    
    // 禁用iOS Safari特有的弹性滚动效果
    const preventIosOverscroll = (e: Event) => {
      e.preventDefault();
    };
    
    // 注册全局事件监听器 - 使用passive: false确保可以preventDefault
    document.addEventListener('touchmove', preventDefaultTouchMove, { passive: false });
    document.addEventListener('wheel', preventDefaultWheel, { passive: false });
    document.addEventListener('gesturestart', preventIosOverscroll, { passive: false });
    
    // 补充设置，确保在所有设备上禁用滚动
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    document.body.style.position = 'fixed';
    document.body.style.top = '0';
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.bottom = '0';
    
    // 清理函数
    return () => {
      document.removeEventListener('touchmove', preventDefaultTouchMove);
      document.removeEventListener('wheel', preventDefaultWheel);
      document.removeEventListener('gesturestart', preventIosOverscroll);
      document.documentElement.style.overflow = '';
      document.documentElement.style.overscrollBehavior = '';
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.bottom = '';
    };
  }, []);
  
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
        <GameInterfaceComponent />
      )}
    </main>
  )
}

