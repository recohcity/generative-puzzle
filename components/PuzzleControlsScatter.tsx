"use client"
import { useGame } from "@/contexts/GameContext"
import { Button } from "@/components/ui/button"
import { ScatterChart } from "lucide-react"
import { playButtonClickSound } from "@/utils/rendering/soundEffects"
import { useState, useEffect } from "react"
import { useDeviceDetection } from "@/hooks/useDeviceDetection"

interface PuzzleControlsScatterProps {
  goToNextTab?: () => void;
  buttonHeight?: number;
}

export default function PuzzleControlsScatter({ goToNextTab, buttonHeight = 34 }: PuzzleControlsScatterProps) {
  const { 
    state,
    scatterPuzzle 
  } = useGame()
  
  // 使用统一设备检测系统
  const device = useDeviceDetection();
  const isPhone = device.deviceType === 'phone';
  const isLandscape = device.layoutMode === 'landscape';
  
  // 检查是否已生成拼图
  const isPuzzleGenerated = state.puzzle !== null
  
  // 所有按钮共用的禁用样式类
  const disabledClass = "opacity-30 pointer-events-none";

  const handleScatterPuzzle = () => {
    console.log('🔧 handleScatterPuzzle被调用');
    playButtonClickSound()
    console.log('🔧 准备调用scatterPuzzle');
    scatterPuzzle()
    console.log('🔧 scatterPuzzle调用完成');
    
    // 散开拼图后自动跳转到下一个tab
    if (goToNextTab) {
      setTimeout(() => {
        goToNextTab()
      }, 300)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', width: '100%' }}>
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