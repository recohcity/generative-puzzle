"use client"
import { useGameBoardData, useGameBoardInteraction, useGameUI } from "@/contexts/GameDomainContexts"
import { CutType } from "@/types/puzzleTypes"
import { playButtonClickSound } from "@/utils/rendering/soundEffects"
import { useState, useEffect } from "react"
import { useTranslation } from '@/contexts/I18nContext'

interface PuzzleControlsCutTypeProps {
  goToNextTab?: () => void;
  buttonHeight?: number;
}

export default function PuzzleControlsCutType({ goToNextTab, buttonHeight = 36 }: PuzzleControlsCutTypeProps) {
  const { originalShape } = useGameBoardData()
  const { isScattered } = useGameBoardInteraction()
  const { cutType, dispatch } = useGameUI()
  const { t } = useTranslation()
  // 添加本地状态，初始值为空字符串，表示未选择
  const [localCutType, setLocalCutType] = useState<string>("")

  // 同步全局状态到本地状态，但仅当本地状态为空且全局状态有值时才同步
  useEffect(() => {
    if (cutType !== "" && localCutType === "") {
      setLocalCutType(cutType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cutType]); // 移除localCutType依赖，避免循环

  // 监听游戏重置事件，当原始形状被清空（即游戏重置）时，清除本地选择状态
  useEffect(() => {
    if (originalShape.length === 0 && localCutType !== "") {
      setLocalCutType("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalShape.length]); // 移除localCutType依赖，避免循环

  // 检查是否已生成形状
  const isShapeGenerated = originalShape.length > 0
  // 检查是否可以修改拼图设置
  const canModifySettings = isShapeGenerated && !isScattered


  // 所有按钮共用的禁用样式类
  const disabledClass = "opacity-30 pointer-events-none";

  const handleCutTypeChange = (value: string) => {
    if (!canModifySettings) return
    playButtonClickSound()
    // 更新本地状态
    setLocalCutType(value)
    // 更新全局状态
    // 更新全局状态
    dispatch({
      type: "SET_CUT_TYPE",
      payload: value as CutType,
    })

    // 自动跳转到下一个Tab
    if (goToNextTab) {
      setTimeout(() => {
        goToNextTab()
      }, 300)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* 切割类型标签 */}
      <div style={{ fontSize: 'calc(var(--panel-scale, 1) * 12px)', color: '#FFD5AB', marginBottom: 'calc(var(--panel-scale, 1) * 4px)' }}>
        {t('game.cutType.title')}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 'calc(var(--panel-scale, 1) * 8px)',
          width: '100%'
        }}
      >
        {[
          { id: 'straight', type: CutType.Straight, label: t('game.cutType.straight') },
          { id: 'diagonal', type: CutType.Diagonal, label: t('game.cutType.diagonal') },
          { id: 'curve', type: CutType.Curve, label: t('game.cutType.curve') },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => handleCutTypeChange(item.type)}
            disabled={!canModifySettings}
            data-testid={`cut-type-${item.id}-button`}
            className={`flex items-center justify-center transition-colors \
              ${localCutType === item.type
                ? "bg-[#F68E5F] text-white"
                : "bg-[#1E1A2A] text-white"}
              ${!canModifySettings ? disabledClass : "cursor-pointer"}
            `}
            style={{
              height: buttonHeight,
              fontSize: 'calc(var(--panel-scale, 1) * 14px)',
              lineHeight: 'calc(var(--panel-scale, 1) * 20px)',
              borderRadius: 'calc(var(--panel-scale, 1) * 12px)',
              width: '100%',
              border: 'none',
              outline: 'none',
              padding: 0,
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
} 