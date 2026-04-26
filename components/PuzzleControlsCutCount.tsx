"use client"
import { useGame } from "@/contexts/GameContext"
import { Label } from "@/components/ui/label"
import { PuzzleIcon } from "lucide-react"
import { playButtonClickSound, playCutSound } from "@/utils/rendering/soundEffects"
import { useState, useEffect } from "react"
import { useDeviceDetection } from "@/hooks/useDeviceDetection"
import { useTranslation } from '@/contexts/I18nContext'
import { cn } from "@/lib/utils"

interface PuzzleControlsCutCountProps {
  goToNextTab?: () => void;
  buttonHeight?: number;
  actionButtonHeight?: number;
}

export default function PuzzleControlsCutCount({ goToNextTab, buttonHeight = 28, actionButtonHeight = 40 }: PuzzleControlsCutCountProps) {
  const {
    state,
    dispatch,
    generatePuzzle
  } = useGame()
  const { t } = useTranslation()

  // 添加本地状态用于跟踪选择的次数
  const [localCutCount, setLocalCutCount] = useState<number | null>(null)

  // 同步全局状态到本地状态
  useEffect(() => {
    if (state.cutCount) {
      setLocalCutCount(state.cutCount);
    }
  }, [state.cutCount]);

  // 使用统一设备检测系统
  const device = useDeviceDetection();
  const isPhone = device.deviceType === 'phone';
  const isLandscape = device.layoutMode === 'landscape';
  const isSmallScreen = device.screenWidth < 600;

  // 检查是否已生成形状
  const isShapeGenerated = state.originalShape.length > 0
  // 检查是否已选择切割类型
  const hasCutType = !!state.cutType
  // 检查是否可以修改拼图设置
  const canModifySettings = isShapeGenerated && !state.isScattered && hasCutType
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
    playCutSound() // 使用切割音效替代按钮点击音效
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
    return cn(
        "glass-btn-sheen",
        localCutCount === num ? "glass-btn-active" : "glass-btn-inactive",
        "flex-1 font-normal transition-all duration-500",
        localCutCount === num && "scale-110 z-10",
        !canModifySettings && "opacity-30 pointer-events-none"
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0', width: '100%', overflow: 'visible' }}>
      {/* 添加难度标签 - 仅在非手机设备上显示 */}
      {!isPhone && !isLandscape && (
        <div className="text-premium-title mb-[10px]" style={{ fontSize: 'calc(0.9rem * var(--panel-scale, 1))' }}>
          {t('game.cutCount.title')}
        </div>
      )}
      <div className="w-full">
        {/* 所有按钮放在一行：1-8 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: '3px', marginBottom: '4px' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
            <button
              key={num}
              onClick={() => canModifySettings && handleCutCountChange(num)}
              className={getDifficultyButtonStyle(num)}
              aria-label={t('game.cutCount.title') + ` ${num}`}
              data-testid={`cut-count-${num}-button`}
              disabled={!canModifySettings}
              style={{
                borderRadius: '50%', // 圆形
                fontSize: '14px',
                width: buttonHeight,
                height: buttonHeight,
                minWidth: buttonHeight,
                minHeight: buttonHeight,
                maxWidth: buttonHeight,
                maxHeight: buttonHeight,
                padding: 0,
                gap: 0,
                lineHeight: '18px',
                aspectRatio: '1 / 1',
              }}
            >
              <span style={{ fontSize: '14px' }}>{num}</span>
            </button>
          ))}
        </div>
        {/* 难度指示器 */}
        <div className="text-brand-peach" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '0 4px', marginTop: '4px', marginBottom: '12px', lineHeight: '16px' }}>
          <span>{t('game.cutCount.difficulty.easy')}</span>
          <span style={{ marginLeft: 'auto' }}>{t('game.cutCount.difficulty.hard')}</span>
        </div>
      </div>

      {/* 切割按钮 */}
      <button
        onClick={handleGeneratePuzzle}
        disabled={!isShapeGenerated || state.isScattered || !hasSelectedCount || !hasCutType}
        className={cn(
          "glass-btn-active glass-btn-sheen w-full",
          (!isShapeGenerated || state.isScattered || !hasSelectedCount || !hasCutType) && "opacity-30 pointer-events-none"
        )}
        data-testid="generate-puzzle-button"
        style={{
          fontSize: '14px',
          borderRadius: 'calc(var(--panel-scale, 1) * 14px)',
          minHeight: actionButtonHeight,
          height: actionButtonHeight,
          padding: '0 16px',
          lineHeight: '18px',
          fontWeight: 'normal',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <PuzzleIcon style={{ width: '18px', height: '18px', marginRight: '8px', flexShrink: 0 }} strokeWidth={2.5} />
        <span style={{ fontSize: '14px' }}>{t('game.cutCount.button')}</span>
      </button>
      {/* 添加提示信息，当按钮不可点击时显示原因 */}
      {isShapeGenerated && !state.isScattered && (!hasCutType || !hasSelectedCount) && (
        <div className="text-brand-peach" style={{ fontSize: '12px', textAlign: 'center', marginTop: '4px', lineHeight: '16px' }}>
          {!hasCutType ? t('game.cutCount.hints.selectCutType') : !hasSelectedCount ? t('game.cutCount.hints.selectCount') : ""}
        </div>
      )}


    </div>
  )
} 