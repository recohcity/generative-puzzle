"use client"
import { GameProvider } from "@/contexts/GameContext"
// Removed custom ThemeProvider/useTheme import
// import { ThemeProvider, useTheme } from "@/contexts/ThemeContext"
import PuzzleCanvas from "@/components/PuzzleCanvas"
import PuzzleControls from "@/components/PuzzleControls"
import ShapeControls from "@/components/ShapeControls"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function CurveTestOptimized() {
  // Removed showInstructions state

  // Theme state is now managed by next-themes via app/layout.tsx
  // No need to manage it here directly

  return (
    // Removed custom ThemeProvider wrapper
    <GameProvider>
      <div className="min-h-screen w-full bg-gradient-to-b from-[#2A2835] to-[#1F1D2B] p-4 lg:p-6 flex items-center justify-center">
        {/* 外层容器添加最大宽度和高度限制，保持横屏比例 */}
        <div className="flex flex-col lg:flex-row gap-6 max-w-[1400px] w-full max-h-[800px] h-[calc(100vh-80px)] mx-auto lg:justify-center relative">
          {/* 左侧控制面板 - 固定宽度不变 */}
          <div className="lg:w-[350px] lg:min-w-[350px] h-full overflow-y-auto flex-shrink-0">
            {/* Consistent style: bg, rounded, border, padding */}
            <div className="bg-[#36323E] rounded-3xl border-2 border-[#463E50] p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <h1 className="text-xl font-bold text-[#FFB17A]">生成式拼图游戏</h1>
              </div>
              
              {/* Added overflow-y-auto to this div to allow scrolling within the background */}
              <div className="space-y-4 flex-1 overflow-y-auto pr-2 -mr-2"> 
                <div className="p-3 bg-[#463E50] rounded-2xl">
                  <h3 className="text-sm font-medium mb-2 text-[#FFD5AB]">选择形状</h3>
                  <ShapeControls />
                </div>
                <div className="p-3 bg-[#463E50] rounded-2xl">
                  <h3 className="text-sm font-medium mb-2 text-[#FFD5AB]">拼图设置</h3>
                  <PuzzleControls />
                </div>
              </div>
            </div>
          </div>

          {/* 右侧画布区域 - 添加固定宽高比容器 */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* 直接将画布容器放在这里，移除多层嵌套结构 */}
            <div className="w-full h-full relative bg-[#36323E] rounded-3xl border-2 border-[#463E50] overflow-hidden">
              <PuzzleCanvas />
            </div>
          </div>
        </div>
      </div>
    </GameProvider>
  )
}

