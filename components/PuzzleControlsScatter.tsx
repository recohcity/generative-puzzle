"use client"
import { useGame } from "@/contexts/GameContext"
import { Button } from "@/components/ui/button"
import { ScatterChart } from "lucide-react"
import { playButtonClickSound } from "@/utils/rendering/soundEffects"
import { useState, useEffect } from "react"

interface PuzzleControlsScatterProps {
  goToNextTab?: () => void;
}

export default function PuzzleControlsScatter({ goToNextTab }: PuzzleControlsScatterProps) {
  const { 
    state,
    scatterPuzzle 
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
  
  // 检查是否已生成拼图
  const isPuzzleGenerated = state.puzzle !== null
  
  // 所有按钮共用的禁用样式类
  const disabledClass = "opacity-30 pointer-events-none";

  const handleScatterPuzzle = () => {
    // [E2E-debugLOG] 点击散开拼图按钮
    console.log('[E2E-debugLOG] handleScatterPuzzle', { puzzleLen: state.puzzle?.length, isScattered: state.isScattered });
    playButtonClickSound()
    scatterPuzzle()
    
    // 散开拼图后自动跳转到下一个tab
    if (goToNextTab) {
      setTimeout(() => {
        goToNextTab()
      }, 300)
    }
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={handleScatterPuzzle}
        disabled={!isPuzzleGenerated || state.isScattered}
        className={`w-full py-2 text-[14px] bg-[#F68E5F] hover:bg-[#F47B42] text-white rounded-xl shadow-md ${(!isPuzzleGenerated || state.isScattered) ? disabledClass : ""} disabled:hover:bg-[#F68E5F]`}
        variant="ghost"
      >
        <ScatterChart className="!w-6 !h-6 shrink-0 mr-2" strokeWidth={2} />
        {state.isScattered ? "拼图已散开" : "散开拼图"}
      </Button>

      <div className={`text-center mt-2 ${isLandscape ? 'text-[12px]' : isPhone ? 'text-[12px]' : 'text-xs'} text-[#FFD5AB]`}>
        {state.isScattered 
          ? "游戏已开始，请将拼图拖到正确位置" 
          : " "
        }
      </div>
    </div>
  )
} 