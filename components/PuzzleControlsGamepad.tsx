"use client"
import { useGame } from "@/contexts/GameContext"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { playButtonClickSound } from "@/utils/rendering/soundEffects"
import { useState, useEffect } from "react"
import ActionButtons from "./ActionButtons"
import RestartButton from "@/components/RestartButton";

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
  
  // 检测设备类型
  const [isPhone, setIsPhone] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  
  // 设备检测
  useEffect(() => {
    const checkDevice = () => {
      const ua = navigator.userAgent;
      const isMobile = /iPhone|Android/i.test(ua);
      const isPortrait = window.innerHeight > window.innerWidth;
      setIsPhone(isMobile);
      setIsLandscape(isMobile && !isPortrait);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', () => {
      setTimeout(checkDevice, 300);
    });
    
    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);
  
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