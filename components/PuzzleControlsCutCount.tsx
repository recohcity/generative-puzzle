"use client"
import { useGame } from "@/contexts/GameContext"
import { PuzzleIcon } from "lucide-react"
import { playButtonClickSound, playCutSound } from "@/utils/rendering/soundEffects"
import { useState, useEffect } from "react"
import { useDeviceDetection } from "@/hooks/useDeviceDetection"
import { useTranslation } from '@/contexts/I18nContext'
import { cn } from "@/lib/utils"
import { getDifficultyMetadata } from "@/utils/difficulty/difficultyMetadata"

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

  // 获取当前难度元数据
  const meta = getDifficultyMetadata(localCutCount || 1);

  // 检查是否已生成形状
  const isShapeGenerated = state.originalShape.length > 0
  // 检查是否已选择切割类型
  const hasCutType = !!state.cutType
  // 检查是否可以修改拼图设置
  const canModifySettings = isShapeGenerated && !state.isScattered && hasCutType
  // 检查是否有选择次数
  const hasSelectedCount = localCutCount !== null

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
      "glass-btn-sheen transition-all duration-300",
      localCutCount === num ? "glass-btn-active scale-110 z-10" : "glass-btn-inactive",
      "flex-1 font-medium",
      !canModifySettings && "opacity-30 pointer-events-none"
    );
  };

  return (
    <div className="flex flex-col gap-0 w-full overflow-visible">
      {/* 标题 */}
      {!isPhone && !isLandscape && (
        <div className="text-premium-title mb-[10px]" style={{ fontSize: 'calc(0.9rem * var(--panel-scale, 1))' }}>
          {t('game.cutCount.title')}
        </div>
      )}

      {/* 难度选择可视化 - 交互式滑动条优化 */}
      <div
        className={cn(
          "w-full rounded-[1.5rem] border border-white/10 transition-all duration-500 overflow-hidden relative",
          "bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-md",
          isLandscape ? "p-3 pb-3 mb-1.5" : "p-2.5 pb-2.5 mb-1.5",
          !canModifySettings && "opacity-40 pointer-events-none"
        )}
      >
        {/* 顶部信息区：一行化设计 */}
        <div className={cn("flex items-center justify-between gap-2 relative z-10", isLandscape ? "mb-3" : "mb-2")}>
          {/* 左侧：难度名称 */}
          <h3 className={cn("font-black tracking-tighter text-white drop-shadow-md leading-none shrink-0", isLandscape ? "text-2xl" : "text-xl")}>
            {t(meta.nameKey)}
          </h3>

          {/* 中间：描述 (支持换行) */}
          <div className={cn("flex-[2] min-w-0 text-white/40 font-medium tracking-tight leading-[1.1] text-left px-1", isLandscape ? "text-[11px]" : "text-[11px]")}>
            {t(meta.descriptionKey)}
          </div>

          {/* 右侧：拼图块数 */}
          <div className={cn("font-black text-brand-peach tracking-tighter leading-none shrink-0 whitespace-nowrap flex items-baseline gap-0.5", isLandscape ? "text-[18px]" : "text-[16px]")}>
            <span>{meta.pieceRange}</span>
            <span className="text-[10px] opacity-60 ml-0.5 font-bold uppercase">{t('stats.piecesUnit')}</span>
          </div>
        </div>

        {/* 交互式滑动条容器 */}
        <div className={cn("relative w-full flex items-center group", isLandscape ? "h-7 mt-1" : "h-6 mt-0.5")}>
          {/* 背景轨道 */}
          <div className={cn("absolute inset-x-0 rounded-full bg-black/20 border border-white/5", isLandscape ? "h-2" : "h-1.5")}>
            {/* 纯色填充 */}
            <div
              className="h-full rounded-full transition-all duration-300 ease-out bg-white/40 shadow-[0_0_10px_rgba(255,255,255,0.2)]"
              style={{ width: `${((localCutCount || 1) - 1) / 7 * 100}%` }}
            />
          </div>

          {/* 原生 Input 用于交互 (透明隐藏) */}
          <input
            type="range"
            min="1"
            max="8"
            step="1"
            value={localCutCount || 1}
            onChange={(e) => handleCutCountChange(parseInt(e.target.value))}
            disabled={!canModifySettings}
            className={cn(
              "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20",
              !canModifySettings && "cursor-not-allowed"
            )}
          />

          {/* 动态滑块与内部数字 */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none transition-all duration-300 z-10 flex flex-col items-center justify-center"
            style={{
              // 精确对齐：确保滑块左边缘在1时对齐最左侧，在8时对齐最右侧
              left: `calc(${((localCutCount || 1) - 1) / 7 * 100}% + ${isLandscape ? 14 : 12}px - ${(((localCutCount || 1) - 1) / 7) * (isLandscape ? 28 : 24)}px)`
            }}
          >
            {/* 调整后：和切割按钮颜色一致的圆形滑块 */}
            <div className={cn(
              "flex items-center justify-center rounded-full overflow-hidden relative transition-transform duration-200 group-active:scale-95 font-black",
              // 复用切割按钮的玻璃态样式，保证颜色一致
              "glass-btn-active glass-btn-sheen border-2 border-white/30 text-brand-dark shadow-[0_0_15px_rgba(246,142,95,0.5)]",
              isLandscape ? "w-7 h-7 text-xs" : "w-6 h-6 text-[10px]"
            )}>
              <span key={localCutCount} className="animate-in zoom-in-50 duration-200 ease-out leading-none relative z-10">
                {localCutCount || 1}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 切割按钮 */}
      <button
        onClick={handleGeneratePuzzle}
        disabled={!isShapeGenerated || state.isScattered || !hasSelectedCount || !hasCutType}
        className={cn(
          "glass-btn-active glass-btn-sheen w-full group overflow-hidden relative",
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
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <PuzzleIcon className="mr-2 group-hover:rotate-12 transition-transform duration-300" style={{ width: '18px', height: '18px' }} strokeWidth={2.5} />
        <span style={{ fontSize: '14px' }}>{t('game.cutCount.button')}</span>
      </button>

      {/* 提示信息 */}
      {isShapeGenerated && !state.isScattered && (!hasCutType || !hasSelectedCount) && (
        <div className="text-brand-peach font-medium animate-pulse" style={{ fontSize: '11px', textAlign: 'center', marginTop: '8px', lineHeight: '16px' }}>
          {!hasCutType ? t('game.cutCount.hints.selectCutType') : !hasSelectedCount ? t('game.cutCount.hints.selectCount') : ""}
        </div>
      )}
    </div>
  )
}