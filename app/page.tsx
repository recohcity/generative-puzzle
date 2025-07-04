"use client"

import { useState, useEffect, useRef } from "react"
import LoadingScreen from "@/components/loading/LoadingScreen"
import dynamic from "next/dynamic"

const GameInterfaceComponent = dynamic(() => import('@/components/GameInterface'), { ssr: false })

export default function HomePage() {
  const [realProgress, setRealProgress] = useState(0) // 真实进度 0~100
  const [animatedProgress, setAnimatedProgress] = useState(0) // 动画进度 0~100
  const [showGame, setShowGame] = useState(false)
  const total = 9 // 资源总数
  const loadedRef = useRef(0)
  const animationRef = useRef<number | null>(null)
  const animationStart = useRef<number | null>(null)
  const ANIMATION_DURATION = 1200 // ms

  // 真实资源加载进度
  useEffect(() => {
    loadedRef.current = 0
    setRealProgress(0)
    // 1. 音效
    const audio = new Audio("/puzzle-pieces.mp3")
    audio.addEventListener("canplaythrough", handleLoaded, { once: true })
    audio.addEventListener("error", handleLoaded, { once: true })
    // 2. 贴图
    const img = new window.Image()
    img.src = "/texture-tile.png"
    img.onload = handleLoaded
    img.onerror = handleLoaded
    // 3-9. 主要组件
    import('@/components/animate-ui/backgrounds/bubble').then(handleLoaded).catch(handleLoaded)
    import('@/components/GameInterface').then(handleLoaded).catch(handleLoaded)
    import('@/components/PuzzleCanvas').then(handleLoaded).catch(handleLoaded)
    import('@/components/ActionButtons').then(handleLoaded).catch(handleLoaded)
    import('@/components/DesktopPuzzleSettings').then(handleLoaded).catch(handleLoaded)
    import('@/components/PuzzleControlsCutType').then(handleLoaded).catch(handleLoaded)
    import('@/components/PuzzleControlsCutCount').then(handleLoaded).catch(handleLoaded)
    // 清理
    return () => {
      audio.removeEventListener("canplaythrough", handleLoaded)
      audio.removeEventListener("error", handleLoaded)
      audio.src = "" // 释放音频资源，防止内存泄漏
      img.onload = null
      img.onerror = null
    }
    function handleLoaded() {
      loadedRef.current += 1
      setRealProgress(Math.floor((loadedRef.current / total) * 100))
    }
  }, [])

  // 动画自适应：动画总时长 1.2s 匀速递增到 99%，资源加载完后直接补到 100%
  useEffect(() => {
    let raf: number
    function animate(ts: number) {
      if (animationStart.current === null) animationStart.current = ts
      const elapsed = ts - animationStart.current
      if (realProgress < 100) {
        // 匀速递增到99%
        const percent = Math.min((elapsed / ANIMATION_DURATION) * 99, 99)
        setAnimatedProgress(percent)
        raf = requestAnimationFrame(animate)
      } else {
        // 资源已加载完，动画补到100%
        setAnimatedProgress(prev => {
          if (prev < 100) {
            const next = Math.min(prev + 2, 100)
            if (next < 100) {
              raf = requestAnimationFrame(animate)
            }
            return next
          }
          return 100
        })
      }
    }
    raf = requestAnimationFrame(animate)
    return () => {
      animationStart.current = null
      cancelAnimationFrame(raf)
    }
  }, [realProgress])

  // 切换到主内容
  useEffect(() => {
    if (!showGame && animatedProgress >= 100 && realProgress >= 100) {
      setShowGame(true)
    }
  }, [animatedProgress, realProgress, showGame])

  return (
    <main className="no-scroll-container flex items-center justify-center min-h-screen relative">
      {/* 无缝预渲染主内容 */}
      <div style={{
        visibility: showGame ? 'visible' : 'hidden',
        position: showGame ? 'static' : 'absolute',
        zIndex: showGame ? 1 : -1,
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
      }}>
        <GameInterfaceComponent />
      </div>
      {/* 加载动画 */}
      {!showGame && <LoadingScreen progress={animatedProgress} />}
    </main>
  )
}

