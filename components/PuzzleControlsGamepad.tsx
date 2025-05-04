"use client"
import { useGame } from "@/contexts/GameContext"
import { Button } from "@/components/ui/button"
import { Lightbulb, RotateCcw, RotateCw, RefreshCw } from "lucide-react"
import { playButtonClickSound, playRotateSound } from "@/utils/rendering/soundEffects"
import { useState, useEffect } from "react"

interface PuzzleControlsGamepadProps {
  goToFirstTab?: () => void;
}

export default function PuzzleControlsGamepad({ goToFirstTab }: PuzzleControlsGamepadProps) {
  const { 
    state,
    rotatePiece,
    showHintOutline,
    resetGame,
    canvasRef,
    backgroundCanvasRef
  } = useGame()
  
  // 检测设备类型
  const [isPhone, setIsPhone] = useState(false);
  
  // 设备检测
  useEffect(() => {
    const checkDevice = () => {
      const ua = navigator.userAgent;
      const isMobile = /iPhone|Android/i.test(ua);
      const isPortrait = window.innerHeight > window.innerWidth;
      setIsPhone(isMobile && isPortrait);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);
  
  // 所有按钮共用的禁用样式类
  const disabledClass = "opacity-30 pointer-events-none";

  const handleShowHint = () => {
    playButtonClickSound()
    showHintOutline()
  }

  const handleRotatePiece = (clockwise: boolean) => {
    console.log(`[PuzzleControlsGamepad] handleRotatePiece called, clockwise: ${clockwise}`);
    playRotateSound()
    // 旋转1次，每次15度，总共旋转15度
    rotatePiece(clockwise)
    console.log('[PuzzleControlsGamepad] handleRotatePiece finished');
  }

  const handleResetGame = () => {
    playButtonClickSound()
    resetGame()
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d")
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
    }
    if (backgroundCanvasRef.current) {
      const bgCtx = backgroundCanvasRef.current.getContext("2d")
      if (bgCtx) {
        bgCtx.clearRect(0, 0, backgroundCanvasRef.current.width, backgroundCanvasRef.current.height)
      }
    }

    // 重置游戏后自动跳转到第一个Tab
    if (goToFirstTab) {
      setTimeout(() => {
        goToFirstTab()
      }, 300)
    }
  }

  return (
    <div className="space-y-4">
      {/* 操作控制按钮 */}
      <div>
        <div className="grid grid-cols-3 gap-2">
          <Button
            onClick={handleShowHint}
            disabled={
              !state.isScattered ||
              state.selectedPiece === null ||
              state.completedPieces.includes(state.selectedPiece || -1)
            }
            className={`w-full ${isPhone ? 'h-9 py-0.5' : 'h-12'} px-0 bg-[#F68E5F] hover:bg-[#F47B42] text-white border-2 border-[#F26419] hover:border-[#E15A0F] active:bg-[#E15A0F] rounded-xl shadow-md 
              ${!state.isScattered || state.selectedPiece === null || 
                state.completedPieces.includes(state.selectedPiece || -1) 
                ? disabledClass : ""} disabled:hover:bg-[#F68E5F]`}
            title="显示提示"
            variant="ghost"
          >
            <Lightbulb className="w-4 h-4 text-white" />
            <span className="ml-1 text-xs">提示</span>
          </Button>

          <Button
            onClick={() => handleRotatePiece(false)}
            disabled={!state.isScattered || state.selectedPiece === null || state.isCompleted}
            className={`w-full ${isPhone ? 'h-9 py-0.5' : 'h-12'} px-0 bg-[#F68E5F] hover:bg-[#F47B42] text-white border-2 border-[#F26419] hover:border-[#E15A0F] active:bg-[#E15A0F] rounded-xl shadow-md 
              ${!state.isScattered || state.selectedPiece === null || state.isCompleted ? disabledClass : ""} disabled:hover:bg-[#F68E5F]`}
            title="逆时针旋转"
            variant="ghost"
          >
            <RotateCcw className="w-4 h-4 text-white" />
            <span className="ml-1 text-xs">左转</span>
          </Button>

          <Button
            onClick={() => handleRotatePiece(true)}
            disabled={!state.isScattered || state.selectedPiece === null || state.isCompleted}
            className={`w-full ${isPhone ? 'h-9 py-0.5' : 'h-12'} px-0 bg-[#F68E5F] hover:bg-[#F47B42] text-white border-2 border-[#F26419] hover:border-[#E15A0F] active:bg-[#E15A0F] rounded-xl shadow-md 
              ${!state.isScattered || state.selectedPiece === null || state.isCompleted ? disabledClass : ""} disabled:hover:bg-[#F68E5F]`}
            title="顺时针旋转"
            variant="ghost"
          >
            <RotateCw className="w-4 h-4 text-white" />
            <span className="ml-1 text-xs">右转</span>
          </Button>
        </div>
      </div>

      {/* 重新开始按钮 */}
      <div>
        <Button 
          onClick={handleResetGame} 
          variant="outline" 
          className={`w-full ${isPhone ? 'h-9 py-0.5 text-sm' : 'h-12'} bg-[#1E1A2A] hover:bg-[#141022] text-white border-2 border-[#504C67] hover:border-[#706B89] active:bg-[#0F0B19] rounded-xl shadow-md`}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          重新开始
        </Button>
      </div>
      
      {state.selectedPiece !== null && state.puzzle && (
        <div className={`text-center ${isPhone ? 'text-xs mt-1' : 'text-sm mt-2'}`}>
          <div className="text-[#FFD5AB] font-medium">
            当前角度: {Math.round(state.puzzle[state.selectedPiece].rotation)}°
          </div>
          <div className="text-xs text-[#F68E5F] mt-0.5 font-medium">
            {isPhone ? "可以使用2只手指旋转拼图" : "(旋转角度需与目标角度匹配才能放置)"}
          </div>
        </div>
      )}
    </div>
  )
} 