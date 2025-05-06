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
  const [isLandscape, setIsLandscape] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  
  // 设备检测
  useEffect(() => {
    const checkDevice = () => {
      const ua = navigator.userAgent;
      const isMobile = /iPhone|Android/i.test(ua);
      const isPortrait = window.innerHeight > window.innerWidth;
      setIsPhone(isMobile);
      setIsLandscape(isMobile && !isPortrait);
      
      // 检测小屏幕设备
      setIsSmallScreen(window.innerWidth < 600);
      
      console.log(`设备检测: 移动=${isMobile}, 竖屏=${isPortrait}, 小屏幕=${window.innerWidth < 600}`);
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
  
  // 难度选择按钮的样式
  const getDifficultyButtonStyle = (num: number) => {
    return `
      flex-1 aspect-square rounded-lg flex items-center justify-center 
      ${isLandscape ? 'text-[12px]' : isPhone ? 'text-[12px]' : isSmallScreen ? 'text-[12px]' : 'text-base'} 
      transition-all duration-200 border border-2 shadow-sm min-w-0
      ${localCutCount === num 
        ? "bg-[#F68E5F] text-white border-[#F26419] hover:bg-[#F47B42] hover:border-[#E15A0F] active:bg-[#E15A0F]" 
        : "bg-[#3D3852] text-white border-transparent hover:border-[#504C67] hover:bg-[#4D4862] active:bg-[#302B45]"}
      ${!canModifySettings ? disabledClass : ""}
    `;
  };

  return (
    <div className="space-y-4 w-full overflow-visible">
      <div className="w-full">
        {/* 所有按钮放在一行：1-8 */}
        <div className="flex justify-between w-full gap-[2px] sm:gap-1 mb-1">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
            <button
              key={num}
              onClick={() => canModifySettings && handleCutCountChange(num)}
              className={getDifficultyButtonStyle(num)}
              aria-label={`选择切割${num}次`}
              disabled={!canModifySettings}
            >
              {num}
            </button>
          ))}
        </div>
        
        {/* 难度指示器 */}
        <div className="flex justify-between text-[12px] text-[#F26419] px-1 mt-1">
          <span>简单</span>
          <span className="ml-auto">困难</span>
        </div>
      </div>

      {/* 切割按钮 */}
      <Button 
        onClick={handleGeneratePuzzle} 
        disabled={!isShapeGenerated || state.isScattered || !hasSelectedCount} 
        className={`w-full ${isLandscape ? 'py-1 text-[12px]' : isPhone ? 'py-1.5 text-[12px]' : ''} bg-[#F68E5F] hover:bg-[#F47B42] text-white border-2 border-[#F26419] hover:border-[#E15A0F] active:bg-[#E15A0F] rounded-xl shadow-md ${(!isShapeGenerated || state.isScattered || !hasSelectedCount) ? disabledClass : ""} disabled:hover:bg-[#F68E5F]`}
      >
        <PuzzleIcon className={`${isLandscape ? 'w-3 h-3' : ''} w-4 h-4 mr-2`} />
        切割形状
      </Button>
    </div>
  )
} 