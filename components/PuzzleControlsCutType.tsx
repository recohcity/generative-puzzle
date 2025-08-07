"use client"
import { useGame } from "@/contexts/GameContext"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { CutType } from "@/types/puzzleTypes"
import { playButtonClickSound } from "@/utils/rendering/soundEffects"
import { useState, useEffect } from "react"
import { useDeviceDetection } from "@/hooks/useDeviceDetection"
import { useTranslation } from '@/contexts/I18nContext'

interface PuzzleControlsCutTypeProps {
  goToNextTab?: () => void;
  buttonHeight?: number;
}

export default function PuzzleControlsCutType({ goToNextTab, buttonHeight = 36 }: PuzzleControlsCutTypeProps) {
  const { state, dispatch } = useGame()
  const { t } = useTranslation()
  // 添加本地状态，初始值为空字符串，表示未选择
  const [localCutType, setLocalCutType] = useState<string>("")

  // 同步全局状态到本地状态，但仅当本地状态为空且全局状态有值时才同步
  useEffect(() => {
    if (state.cutType && localCutType === "" && state.cutType !== localCutType) {
      setLocalCutType(state.cutType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.cutType]); // 移除localCutType依赖，避免循环

  // 监听游戏重置事件，当原始形状被清空（即游戏重置）时，清除本地选择状态
  useEffect(() => {
    if (state.originalShape.length === 0 && localCutType !== "") {
      console.log("游戏已重置，清除切割类型选择");
      setLocalCutType("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.originalShape.length]); // 移除localCutType依赖，避免循环

  // 使用统一设备检测系统
  const device = useDeviceDetection();
  const isPhone = device.deviceType === 'phone';
  const isLandscape = device.layoutMode === 'landscape';

  // 检查是否已生成形状
  const isShapeGenerated = state.originalShape.length > 0
  // 检查是否可以修改拼图设置
  const canModifySettings = isShapeGenerated && !state.isScattered


  // 所有按钮共用的禁用样式类
  const disabledClass = "opacity-30 pointer-events-none";

  const handleCutTypeChange = (value: string) => {
    if (!canModifySettings) return
    playButtonClickSound()
    // 更新本地状态
    setLocalCutType(value)
    // 更新全局状态
    dispatch({
      type: "SET_CUT_TYPE",
      payload: value as CutType.Straight | CutType.Diagonal,
    })

    // 自动跳转到下一个Tab
    if (goToNextTab) {
      setTimeout(() => {
        goToNextTab()
      }, 300)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--panel-scale, 1) * 16px)', width: '100%' }}>
      {/* 添加切割类型标签 - 仅在非手机设备上显示 */}
      {!isPhone && !isLandscape && (
        <div style={{ fontSize: 'calc(var(--panel-scale, 1) * 12px)', color: '#FFD5AB', marginBottom: 'calc(var(--panel-scale, 1) * 4px)' }}>
          {t('game.cutType.title')}
        </div>
      )}
      <div>
        <RadioGroup
          value={localCutType}
          onValueChange={canModifySettings ? handleCutTypeChange : undefined}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'calc(var(--panel-scale, 1) * 8px)' }}
          disabled={!canModifySettings}
        >
          <div className="relative">
            <RadioGroupItem
              value={CutType.Straight}
              id="straight"
              className="peer sr-only"
              disabled={!canModifySettings}
            />
            <Label
              htmlFor="straight"
              data-testid="cut-type-straight-button"
              className={`flex items-center justify-center transition-all shadow-sm \
                ${localCutType === CutType.Straight
                  ? "bg-[#F68E5F] text-white hover:bg-[#F47B42] active:bg-[#E15A0F]"
                  : "bg-[#1E1A2A] text-white hover:bg-[#2A283E] active:bg-[#2A283E]"}
                ${!canModifySettings ? disabledClass : "cursor-pointer"}
              `}
              style={{
                height: buttonHeight,
                fontSize: 'calc(var(--panel-scale, 1) * 16px)',
                lineHeight: 'calc(var(--panel-scale, 1) * 20px)',
                borderRadius: 'calc(var(--panel-scale, 1) * 12px)',
                width: '100%',
                justifyContent: 'center',
                alignItems: 'center',
                display: 'flex',
              }}
            >
              <span style={{ fontSize: 'calc(var(--panel-scale, 1) * 14px)' }}>{t('game.cutType.straight')}</span>
            </Label>
          </div>
          <div className="relative">
            <RadioGroupItem
              value={CutType.Diagonal}
              id="diagonal"
              className="peer sr-only"
              disabled={!canModifySettings}
            />
            <Label
              htmlFor="diagonal"
              data-testid="cut-type-diagonal-button"
              className={`flex items-center justify-center transition-all shadow-sm \
                ${localCutType === CutType.Diagonal
                  ? "bg-[#F68E5F] text-white hover:bg-[#F47B42] active:bg-[#E15A0F]"
                  : "bg-[#1E1A2A] text-white hover:bg-[#2A283E] active:bg-[#2A283E]"}
                ${!canModifySettings ? disabledClass : "cursor-pointer"}
              `}
              style={{
                height: buttonHeight,
                fontSize: 'calc(var(--panel-scale, 1) * 16px)',
                lineHeight: 'calc(var(--panel-scale, 1) * 20px)',
                borderRadius: 'calc(var(--panel-scale, 1) * 12px)',
                width: '100%',
                justifyContent: 'center',
                alignItems: 'center',
                display: 'flex',
              }}
            >
              <span style={{ fontSize: 'calc(var(--panel-scale, 1) * 14px)' }}>{t('game.cutType.diagonal')}</span>
            </Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  )
} 