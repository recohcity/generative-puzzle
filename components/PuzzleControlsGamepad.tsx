"use client"
import { useGame } from "@/contexts/GameContext"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { playButtonClickSound } from "@/utils/rendering/soundEffects"
import { useState, useEffect } from "react"
import ActionButtons from "./ActionButtons"
import RestartButton from "@/components/RestartButton"
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

interface PuzzleControlsGamepadProps {
  goToFirstTab?: () => void;
  controlButtonHeight?: number;
  restartButtonHeight?: number;
}

export default function PuzzleControlsGamepad({ goToFirstTab, controlButtonHeight, restartButtonHeight }: PuzzleControlsGamepadProps) {
  const { 
    state,
    resetGame,
    canvasRef,
    backgroundCanvasRef
  } = useGame()
  
  // 使用统一设备检测系统
  const device = useDeviceDetection();
  const isPhone = device.deviceType === 'phone';
  const isLandscape = device.layoutMode === 'landscape';
  
  // 所有按钮共用的禁用样式类
  const disabledClass = "opacity-30 pointer-events-none";

  const handleResetGame = () => {
    playButtonClickSound()
    resetGame()

    // 重置游戏后自动跳转到第一个Tab
    if (goToFirstTab) {
      setTimeout(() => {
        goToFirstTab()
      }, 300)
    }
  }

  // Determine reset button style based on device
  const resetButtonHeightClass = isLandscape ? 'h-8 py-0.5 text-[12px]' : (isPhone ? 'h-9 py-0.5 text-[12px]' : 'h-12 text-base');
  const resetIconSizeClass = isLandscape ? 'w-3 h-3' : (isPhone ? 'w-4 h-4' : 'w-4 h-4');

  return (
    <div className="space-y-4">
      {/* Use the new ActionButtons component for Hint/Rotate */}
      <ActionButtons layout="mobile" buttonHeight={controlButtonHeight} />

      {/* 重新开始按钮 */}
      <div>
        <RestartButton 
          onClick={handleResetGame}
          style={{ marginTop: 0 }}
          height={restartButtonHeight}
        />
      </div>
    </div>
  )
} 