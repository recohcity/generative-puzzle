"use client"
import { useGame } from "@/contexts/GameContext"
import { Button } from "@/components/ui/button"
import { ScatterChart } from "lucide-react"
import { playButtonClickSound } from "@/utils/rendering/soundEffects"
import { useState, useEffect } from "react"

interface PuzzleControlsScatterProps {
  goToNextTab?: () => void;
  buttonHeight?: number;
}

export default function PuzzleControlsScatter({ goToNextTab, buttonHeight = 34 }: PuzzleControlsScatterProps) {
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
      <Button
        onClick={handleScatterPuzzle}
        disabled={!isPuzzleGenerated || state.isScattered}
        className={`w-full bg-[#F68E5F] hover:bg-[#F47B42] text-white shadow-md ${(!isPuzzleGenerated || state.isScattered) ? disabledClass : ""} disabled:hover:bg-[#F68E5F]`}
        style={{
          fontSize: '14px',
          borderRadius: '14px',
          minHeight: buttonHeight,
          height: buttonHeight,
          padding: '0 16px',
          lineHeight: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
        variant="ghost"
      >
        <ScatterChart style={{ width: '16px', height: '16px', marginRight: '6px', flexShrink: 0 }} strokeWidth={2} />
        {state.isScattered ? "拼图已散开" : "散开拼图"}
      </Button>

      <div style={{
        textAlign: 'center',
        marginTop: '8px',
        fontSize: '12px',
        color: '#FFD5AB',
        lineHeight: '16px',
      }}>
        {state.isScattered 
          ? "游戏已开始，请将拼图拖到正确位置" 
          : " "
        }
      </div>
    </div>
  )
} 