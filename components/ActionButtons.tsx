"use client"
import { useGame } from "@/contexts/GameContext"
import { Button } from "@/components/ui/button"
import { Lightbulb, RotateCcw, RotateCw } from "lucide-react"
import { playButtonClickSound, playRotateSound } from "@/utils/rendering/soundEffects"
import { useState, useEffect } from "react" // Keep useEffect for potential future use or context dependencies

interface ActionButtonsProps {
  layout?: 'mobile' | 'desktop'; // Prop to differentiate layout styles if needed
}

export default function ActionButtons({ layout = 'mobile' }: ActionButtonsProps) {
  const { 
    state,
    rotatePiece,
    showHintOutline,
  } = useGame()

  // You might still need device detection if styles differ significantly, 
  // or adjust styles based on the 'layout' prop.
  const [isPhone, setIsPhone] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  
  // Simplified device detection (or remove if 'layout' prop is sufficient)
  useEffect(() => {
    const checkDevice = () => {
      const ua = navigator.userAgent;
      const isMobile = /iPhone|Android/i.test(ua);
      const isPortrait = window.innerHeight > window.innerWidth;
      // Set state based on actual device or rely on layout prop
      if (layout === 'mobile') {
          setIsPhone(isMobile);
          setIsLandscape(isMobile && !isPortrait);
      } else {
          setIsPhone(false);
          setIsLandscape(false);
      }
    };
    
    checkDevice(); // Initial check
    window.addEventListener('resize', checkDevice);
    // Consider if orientation change matters for desktop layout
    if (layout === 'mobile') {
        window.addEventListener('orientationchange', () => setTimeout(checkDevice, 300));
    }
    
    return () => {
      window.removeEventListener('resize', checkDevice);
      if (layout === 'mobile') {
          window.removeEventListener('orientationchange', checkDevice);
      }
    };
  }, [layout]); // Rerun effect if layout prop changes


  // Common disabled style
  const disabledClass = "opacity-30 pointer-events-none";

  // 检查是否有切割类型选择
  const hasCutTypeSelected = state.cutType !== "";

  const handleShowHint = () => {
    playButtonClickSound()
    showHintOutline()
  }

  const handleRotatePiece = (clockwise: boolean) => {
    console.log(`[ActionButtons] handleRotatePiece called, clockwise: ${clockwise}`);
    playRotateSound()
    rotatePiece(clockwise)
    console.log('[ActionButtons] handleRotatePiece finished');
  }
  
  // Determine styles based on layout prop or detected device state
  const buttonHeightClass = layout === 'desktop' ? 'h-10' : (isLandscape ? 'h-8 py-0.5' : 'h-9 py-0.5');
  const iconSizeClass = layout === 'desktop' ? 'w-4 h-4' : (isLandscape ? 'w-3 h-3' : 'w-4 h-4');
  const textSizeClass = layout === 'desktop' ? 'text-sm' : (isLandscape ? 'text-[12px]' : 'text-[12px]');
  const rotationInfoTextClass = layout === 'desktop' ? 'text-sm mt-2' : (isLandscape ? 'text-[12px] mt-1' : 'text-[12px] mt-1');
  const rotationInfoSubTextClass = layout === 'desktop' ? 'text-xs mt-1' : (isLandscape ? 'text-[12px] mt-0.5' : 'text-[12px] mt-0.5');


  return (
    <div className="space-y-3">
      {/* Action Buttons Grid */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          onClick={handleShowHint}
          disabled={
            !state.isScattered ||
            state.selectedPiece === null ||
            state.completedPieces.includes(state.selectedPiece ?? -1) // Use nullish coalescing
          }
          className={`w-full ${buttonHeightClass} px-0 bg-[#F68E5F] hover:bg-[#F47B42] text-white border-2 border-[#F26419] hover:border-[#E15A0F] active:bg-[#E15A0F] rounded-xl shadow-md 
            ${!state.isScattered || state.selectedPiece === null || 
              state.completedPieces.includes(state.selectedPiece ?? -1) 
              ? disabledClass : ""} disabled:hover:bg-[#F68E5F]`}
          title="显示提示"
          variant="ghost"
        >
          <Lightbulb className={`${iconSizeClass} text-white`} />
          {layout === 'mobile' && <span className={`ml-1 ${textSizeClass}`}>提示</span>}
        </Button>

        <Button
          onClick={() => handleRotatePiece(false)}
          disabled={!state.isScattered || state.selectedPiece === null || state.isCompleted}
          className={`w-full ${buttonHeightClass} px-0 bg-[#F68E5F] hover:bg-[#F47B42] text-white border-2 border-[#F26419] hover:border-[#E15A0F] active:bg-[#E15A0F] rounded-xl shadow-md 
            ${!state.isScattered || state.selectedPiece === null || state.isCompleted ? disabledClass : ""} disabled:hover:bg-[#F68E5F]`}
          title="逆时针旋转"
          variant="ghost"
        >
          <RotateCcw className={`${iconSizeClass} text-white`} />
           {layout === 'mobile' && <span className={`ml-1 ${textSizeClass}`}>左转</span>}
        </Button>

        <Button
          onClick={() => handleRotatePiece(true)}
          disabled={!state.isScattered || state.selectedPiece === null || state.isCompleted}
          className={`w-full ${buttonHeightClass} px-0 bg-[#F68E5F] hover:bg-[#F47B42] text-white border-2 border-[#F26419] hover:border-[#E15A0F] active:bg-[#E15A0F] rounded-xl shadow-md 
            ${!state.isScattered || state.selectedPiece === null || state.isCompleted ? disabledClass : ""} disabled:hover:bg-[#F68E5F]`}
          title="顺时针旋转"
          variant="ghost"
        >
          <RotateCw className={`${iconSizeClass} text-white`} />
          {layout === 'mobile' && <span className={`ml-1 ${textSizeClass}`}>右转</span>}
        </Button>
      </div>

      {/* Rotation Info */}
      {state.selectedPiece !== null && state.puzzle && (
        <div className={`text-center ${rotationInfoTextClass}`}>
          <div className="text-[#FFD5AB] font-medium">
            当前角度: {Math.round(state.puzzle[state.selectedPiece].rotation)}°
          </div>
          <div className={`${rotationInfoSubTextClass} text-[#F68E5F] font-medium`}>
            {layout === 'mobile' && isPhone ? "可以使用2只手指旋转拼图" : "(旋转角度需与目标角度匹配才能放置)"}
          </div>
        </div>
      )}
    </div>
  )
} 