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
          "w-full rounded-2xl border border-white/10 transition-all duration-500 mb-2",
          "bg-white/5 backdrop-blur-sm",
          isPhone ? "p-3" : "p-5",
          !canModifySettings && "opacity-40 pointer-events-none"
        )}
      >
        {/* 信息行 - 极简显示 */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-baseline gap-2 overflow-hidden">
            <h3 className={cn("font-bold text-white tracking-tight leading-none shrink-0", isPhone ? "text-base" : "text-xl")}>
              {t(meta.nameKey)}
            </h3>
            <span className={cn("text-white/40 truncate font-medium", isPhone ? "text-[10px]" : "text-[11px]")}>
              {t(meta.descriptionKey)}
            </span>
          </div>
          <div className={cn("font-mono font-medium text-brand-peach leading-none shrink-0", isPhone ? "text-xs" : "text-lg")}>
            {meta.pieceRange} {t('stats.piecesUnit')}
          </div>
        </div>

        {/* 交互式滑动条容器 - 精密刻度优化版 */}
        <div className="relative w-full h-10 flex items-center group px-1">
          {/* 背景轨道 (含刻度) */}
          <div className={cn("w-full bg-white/5 rounded-full border border-white/5 relative overflow-hidden", isPhone ? "h-1.5" : "h-2")}>
            {/* 刻度点 - 增强档位感 */}
            <div className="absolute inset-0 flex justify-between px-[2px] items-center pointer-events-none opacity-20">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="w-1 h-1 rounded-full bg-white" />
              ))}
            </div>

            {/* 进度填充 (严格对齐滑块中心) */}
            <div 
              className="h-full transition-all duration-300 ease-out relative rounded-full"
              style={{ 
                width: `${((localCutCount || 1) - 1) / 7 * 100}%`,
                backgroundImage: 'linear-gradient(to right, #2dd4bf, #FFD5AB, #FFB17A, #F68E5F)',
                backgroundSize: '100% 100%', // 确保渐变始终拉伸填满
              }}
            >
              {/* 动态扫光 */}
              <div className="absolute inset-0 bg-gradient-to-right from-transparent via-white/10 to-transparent skew-x-12 animate-shimmer" />
            </div>
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

          {/* 自定义滑块 (Knob) - 拟物精密化设计 */}
          <div 
            className={cn(
              "absolute top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300 z-10",
              "flex items-center justify-center rounded-full border-2 border-white/40 shadow-2xl",
              "bg-gradient-to-br from-brand-peach to-brand-orange text-brand-dark font-bold",
              isPhone ? "w-7 h-7" : "w-8 h-8"
            )}
            style={{ 
              left: `calc(${((localCutCount || 1) - 1) / 7 * 100}% - ${isPhone ? '14px' : '16px'})`,
              boxShadow: `0 0 15px rgba(246, 142, 95, 0.4), inset 0 2px 4px rgba(255,255,255,0.3)`
            }}
          >
            <span className={isPhone ? "text-xs" : "text-sm"} style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))' }}>
              {localCutCount || 1}
            </span>
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