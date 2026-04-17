"use client"
import { useGame } from "@/contexts/GameContext"
import { Button } from "@/components/ui/button"
import { ScatterChart } from "lucide-react"
import { playButtonClickSound, playScatterSound } from "@/utils/rendering/soundEffects"
import { useState, useEffect } from "react"
import { useDeviceDetection } from "@/hooks/useDeviceDetection"
import { useTranslation } from '@/contexts/I18nContext'
import { cn } from "@/lib/utils"

interface PuzzleControlsScatterProps {
  goToNextTab?: () => void;
  buttonHeight?: number;
}

export default function PuzzleControlsScatter({ goToNextTab, buttonHeight = 34 }: PuzzleControlsScatterProps) {
  const {
    state,
    scatterPuzzle
  } = useGame()
  const { t } = useTranslation()

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
    //playButtonClickSound() // 禁用通用按钮音效
    playScatterSound() // 使用指定的散开拼图音效替代通用按钮音效
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0', width: '100%' }}>
      <Button
        onClick={handleScatterPuzzle}
        disabled={!isPuzzleGenerated || state.isScattered}
        className={cn(
          "glass-btn-active glass-btn-sheen w-full border-none",
          (!isPuzzleGenerated || state.isScattered) && "opacity-30 pointer-events-none"
        )}
        data-testid="scatter-puzzle-button"
        style={{
          fontSize: '14px',
          borderRadius: 'calc(var(--panel-scale, 1) * 14px)',
          minHeight: buttonHeight,
          height: buttonHeight,
          padding: '0 16px',
          lineHeight: '18px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}
      >
        <ScatterChart style={{ width: '18px', height: '18px', marginRight: '8px', flexShrink: 0 }} strokeWidth={2.5} />
        <span style={{ fontSize: '14px' }}>
          {state.isScattered ? t('game.scatter.completed') : t('game.scatter.button')}
        </span>
      </Button>

      <div className="text-premium-label mt-2 text-center opacity-80 min-h-[16px] text-xs">
        {state.isScattered ? t('game.hints.gameInProgress') : " "}
      </div>
    </div>
  )
} 