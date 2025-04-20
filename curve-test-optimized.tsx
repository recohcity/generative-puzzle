"use client"
import { GameProvider } from "@/contexts/GameContext"
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext"
import PuzzleCanvas from "@/components/PuzzleCanvas"
import PuzzleControls from "@/components/PuzzleControls"
import ShapeControls from "@/components/ShapeControls"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function CurveTestOptimized() {
  return (
    <ThemeProvider>
      <GameProvider>
        <div className="min-h-screen w-full bg-gradient-to-b from-[#2A2835] to-[#1F1D2B] p-4 lg:p-6 flex items-center justify-center">
          <div className="flex flex-col lg:flex-row gap-6 max-w-[1400px] mx-auto w-full h-[calc(100vh-80px)] lg:justify-center">
            {/* 左侧控制面板 - Apply consistent style */}
            <div className="lg:w-[350px] lg:min-w-[350px] h-full overflow-y-auto">
              {/* Consistent style: bg, rounded, border, padding */}
              <div className="bg-[#36323E] rounded-3xl border-2 border-[#463E50] p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                  <h1 className="text-xl font-bold text-[#FFB17A]">拼图游戏</h1>
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

            {/* 右侧画布区域 - Apply consistent style */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Consistent style: bg, rounded, border, padding. Adjusted padding from p-2 to p-6 */}
              <div className="flex-1 relative bg-[#36323E] rounded-3xl border-2 border-[#463E50] p-6">
                <PuzzleCanvas />
              </div>
            </div>
          </div>
        </div>
      </GameProvider>
    </ThemeProvider>
  )
}

