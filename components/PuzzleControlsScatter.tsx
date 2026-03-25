"use client"
import { useGameBoardData, useGameBoardInteraction } from "@/contexts/GameDomainContexts"
import { Button } from "@/components/ui/button"
import { ScatterChart } from "lucide-react"
import { playScatterSound } from "@/utils/rendering/soundEffects"
import { useTranslation } from '@/contexts/I18nContext'

interface PuzzleControlsScatterProps {
  goToNextTab?: () => void;
  buttonHeight?: number;
}

export default function PuzzleControlsScatter({ goToNextTab, buttonHeight = 34 }: PuzzleControlsScatterProps) {
  const { puzzle, scatterPuzzle } = useGameBoardData()
  const { isScattered } = useGameBoardInteraction()
  const { t } = useTranslation()

  // 检查是否已生成拼图
  const isPuzzleGenerated = puzzle !== null

  // 所有按钮共用的禁用样式类
  const disabledClass = "opacity-30 pointer-events-none";

  const handleScatterPuzzle = () => {
    playScatterSound() // 使用指定的散开拼图音效替代通用按钮音效
    scatterPuzzle()

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
        disabled={!isPuzzleGenerated || isScattered}
        className={`w-full bg-[#F68E5F] hover:bg-[#F47B42] text-white ${(!isPuzzleGenerated || isScattered) ? disabledClass : ""} disabled:hover:bg-[#F68E5F]`}
        data-testid="scatter-puzzle-button"
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
        {isScattered ? t('game.scatter.completed') : t('game.scatter.button')}
      </Button>

      <div style={{
        textAlign: 'center',
        marginTop: '8px',
        fontSize: '12px',
        color: '#FFD5AB',
        lineHeight: '16px',
      }}>
        {isScattered
          ? t('game.hints.gameInProgress')
          : " "
        }
      </div>
    </div>
  )
} 