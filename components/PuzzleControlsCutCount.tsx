"use client"
import { useGame } from "@/contexts/GameContext"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { PuzzleIcon } from "lucide-react"
import { playButtonClickSound } from "@/utils/rendering/soundEffects"
import { useState, useEffect } from "react"

interface PuzzleControlsCutCountProps {
  goToNextTab?: () => void;
}

export default function PuzzleControlsCutCount({ goToNextTab }: PuzzleControlsCutCountProps) {
  const { 
    state, 
    dispatch, 
    generatePuzzle 
  } = useGame()
  
  // 添加本地状态用于跟踪选择的次数
  const [localCutCount, setLocalCutCount] = useState<number | null>(null)
  
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
  
  // 检查是否已生成形状
  const isShapeGenerated = state.originalShape.length > 0
  // 检查是否可以修改拼图设置
  const canModifySettings = isShapeGenerated && !state.isScattered
  // 检查是否有选择次数
  const hasSelectedCount = localCutCount !== null
  
  // 所有按钮共用的禁用样式类
  const disabledClass = "opacity-30 pointer-events-none";

  const handleCutCountChange = (value: number) => {
    if (!canModifySettings) return
    playButtonClickSound()
    dispatch({ type: "SET_CUT_COUNT", payload: value })
    setLocalCutCount(value)
  }

  const handleGeneratePuzzle = () => {
    playButtonClickSound()
    generatePuzzle()
    
    // 生成拼图后自动跳转到下一个tab
    if (goToNextTab) {
      setTimeout(() => {
        goToNextTab()
      }, 300)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between w-full gap-2 mb-1">
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              onClick={() => canModifySettings && handleCutCountChange(num)}
              className={`
                flex-1 aspect-square rounded-lg flex items-center justify-center ${isPhone ? 'text-base' : 'text-lg'} transition-all duration-200 border-2 shadow-sm
                ${localCutCount === num 
                  ? "bg-[#F68E5F] text-white border-[#F26419] hover:bg-[#F47B42] hover:border-[#E15A0F] active:bg-[#E15A0F]" 
                  : "bg-[#3D3852] text-white border-transparent hover:border-[#504C67] hover:bg-[#4D4862] active:bg-[#302B45]"}
                ${!canModifySettings ? disabledClass : ""}
              `}
              aria-label={`选择切割${num}次`}
              disabled={!canModifySettings}
            >
              {num}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-[#F26419] px-1 mt-1">
          <span>简单</span>
          <span>困难</span>
        </div>
      </div>

      <Button 
        onClick={handleGeneratePuzzle} 
        disabled={!isShapeGenerated || state.isScattered || !hasSelectedCount} 
        className={`w-full ${isPhone ? 'py-1.5 text-sm' : ''} bg-[#F68E5F] hover:bg-[#F47B42] text-white border-2 border-[#F26419] hover:border-[#E15A0F] active:bg-[#E15A0F] rounded-xl shadow-md ${(!isShapeGenerated || state.isScattered || !hasSelectedCount) ? disabledClass : ""} disabled:hover:bg-[#F68E5F]`}
      >
        <PuzzleIcon className="w-4 h-4 mr-2" />
        切割形状
      </Button>
    </div>
  )
} 