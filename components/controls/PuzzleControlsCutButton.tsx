"use client"
import { useGame } from "@/contexts/GameContext"
import { PuzzleIcon } from "lucide-react"
import { playCutSound } from "@/utils/rendering/soundEffects"
import { useDeviceDetection } from "@/hooks/useDeviceDetection"
import { useTranslation } from '@/contexts/I18nContext'
import { cn } from "@/lib/utils"

interface PuzzleControlsCutButtonProps {
  goToNextTab?: () => void;
  actionButtonHeight?: number;
}

// 切割形状按钮：独立于难度选择，位于切割类型选择之后。
// 门控：形状已生成 + 难度已选（difficultyTouched）+ 切割类型已选 + 未散开。
// 已切割后（puzzle 存在且未散开）变为"再次切割"。
export default function PuzzleControlsCutButton({ goToNextTab, actionButtonHeight = 40 }: PuzzleControlsCutButtonProps) {
  const {
    state,
    generatePuzzle
  } = useGame()
  const { t } = useTranslation()

  const device = useDeviceDetection();
  const isLandscape = device.layoutMode === 'landscape';
  void isLandscape;

  const isShapeGenerated = state.originalShape.length > 0
  const hasCutType = !!state.cutType
  // 需先选切割类型（自动切割已触发过一次后即满足）；散开后锁定
  const canGenerate = isShapeGenerated && hasCutType && !state.isScattered
  // 已切割过一次（puzzle 存在且未散开）→ 可重复切割状态
  const isPuzzleAlreadyCut = state.puzzle !== null && !state.isScattered

  const handleGeneratePuzzle = () => {
    if (!canGenerate) return
    playCutSound() // 使用切割音效替代按钮点击音效
    generatePuzzle()

    // 生成拼图后自动跳转到下一个tab
    if (goToNextTab) {
      setTimeout(() => {
        goToNextTab()
      }, 300)
    }
  }

  return (
    <div className="flex flex-col gap-0 w-full overflow-visible">
      <button
        onClick={handleGeneratePuzzle}
        disabled={!canGenerate}
        className={cn(
          "glass-btn-sheen w-full group overflow-hidden relative",
          // 三态：禁用 / 首次可用（橙） / 可重复切割（青）
          !canGenerate
            ? "glass-btn-active opacity-30 pointer-events-none"
            : isPuzzleAlreadyCut
              ? "glass-btn-recut"
              : "glass-btn-active"
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
        <PuzzleIcon className="mr-2 group-hover:rotate-12 transition-transform duration-300" style={{ width: '18px', height: '18px' }} strokeWidth={2.5} />
        <span style={{ fontSize: '14px' }}>
          {isPuzzleAlreadyCut && canGenerate
            ? t('game.cutCount.recutButton')
            : t('game.cutCount.button')
          }
        </span>
      </button>

      {/* 引导提示：形状已选但未选切割类型时，提示先选类型（自动切割后即消失） */}
      {isShapeGenerated && !hasCutType && !state.isScattered && (
        <div className="text-brand-peach font-medium animate-pulse" style={{ fontSize: '11px', textAlign: 'center', marginTop: '8px', lineHeight: '16px' }}>
          {t('game.cutCount.hints.selectCutType')}
        </div>
      )}
    </div>
  )
}
