"use client"

import { useEffect, useState } from "react"

interface LoadingScreenProps {
  onLoadComplete: () => void
}

export default function LoadingScreen({ onLoadComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [puzzlePieces, setPuzzlePieces] = useState<any[]>([])
  
  // 在客户端渲染时生成拼图碎片
  useEffect(() => {
    // 生成随机拼图碎片作为背景装饰
    const pieces = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      top: `${Math.random() * 80}%`,
      left: `${Math.random() * 80}%`,
      size: 40 + Math.random() * 40,
      rotation: Math.random() * 360,
      animationClass: `float-${(i % 4) + 1}`,
    }))
    
    setPuzzlePieces(pieces)
  }, [])
  
  useEffect(() => {
    // 模拟加载过程
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 8
        if (newProgress >= 100) {
          clearInterval(interval)
          // 完成加载后延迟一点时间，确保动画完成
          setTimeout(() => {
            onLoadComplete()
          }, 800)
          return 100
        }
        return newProgress
      })
    }, 200)
    
    return () => clearInterval(interval)
  }, [onLoadComplete])
  
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-[#2A2835] to-[#1F1D2B] overflow-hidden">
      {/* 装饰性拼图碎片 */}
      {puzzlePieces.map((piece) => (
        <div
          key={piece.id}
          className={`absolute opacity-10 bg-[#FFB17A] ${piece.animationClass}`}
          style={{
            top: piece.top,
            left: piece.left,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
            transform: `rotate(${piece.rotation}deg)`,
          }}
        />
      ))}
      
      <div className="relative z-10 flex flex-col items-center">
        <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FFB17A] to-[#FFD5AB] mb-8 animate-pulse">
          Generative Puzzle
        </h1>
        
        <div className="w-80 h-3 bg-[#463E50] rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#FFB17A] to-[#FFD5AB] transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <p className="mt-3 text-[#FFD5AB] font-medium">
          {Math.floor(progress)}% {progress >= 100 ? '准备完成！' : '加载中...'}
        </p>
      </div>
    </div>
  )
} 