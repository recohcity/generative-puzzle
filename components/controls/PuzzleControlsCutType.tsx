"use client"
import { useGame } from "@/contexts/GameContext"
import { CutType } from "@generative-puzzle/game-core"
import { playButtonClickSound } from "@/utils/rendering/soundEffects"
import { useState, useEffect, useRef } from "react"
import { useDeviceDetection } from "@/hooks/useDeviceDetection"
import { useTranslation } from '@/contexts/I18nContext'
import { cn } from "@/lib/utils"

interface PuzzleControlsCutTypeProps {
  goToNextTab?: () => void;
  buttonHeight?: number | string;
}

export default function PuzzleControlsCutType({ goToNextTab, buttonHeight = 40 }: PuzzleControlsCutTypeProps) {
  const { state, dispatch, generatePuzzle } = useGame()
  const { t, locale } = useTranslation()
  // 添加本地状态，初始值为空字符串，表示未选择
  const [localCutType, setLocalCutType] = useState<string>("")
  // 按钮文字统一缩放系数：10 个按钮整体适配（以最长标签为基准），多端/多语言自适应
  const [scale, setScale] = useState(1)
  const gridRef = useRef<HTMLDivElement>(null)

  // 语言切换时重置缩放，避免缩放残留到另一种语言
  useEffect(() => {
    setScale(1);
  }, [locale]);

  // 统一溢出适配：测量所有按钮，取最长文字宽度与最小可用列宽，
  // 只要最长文字接近列宽（≥90%）就整体缩小全部按钮，保证 10 个按钮字号一致
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const measure = () => {
      const btns = Array.from(grid.querySelectorAll<HTMLButtonElement>("button"));
      if (btns.length === 0) return;
      let maxNeed = 0;
      let minAvail = Infinity;
      for (const btn of btns) {
        maxNeed = Math.max(maxNeed, btn.scrollWidth);
        minAvail = Math.min(minAvail, btn.clientWidth);
      }
      if (maxNeed > 0 && minAvail > 0) {
        if (maxNeed > minAvail * 0.8) {
          setScale(Math.max(0.72, (minAvail / maxNeed) * 0.94));
        } else {
          setScale(1);
        }
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(grid);
    if (typeof document !== "undefined" && typeof document.fonts?.ready?.then === "function") {
      document.fonts.ready.then(measure).catch(() => undefined);
    }
    return () => {
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, localCutType, state.isScattered, state.originalShape.length]);

  // 同步全局状态到本地状态，但仅当本地状态为空且全局状态有值时才同步
  useEffect(() => {
    if (state.cutType !== "" && localCutType === "") {
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
  // 检查是否可以修改拼图设置（进度门控：先选形状、再选难度、后选切割类型；逐刀切割动画中锁定）
  // 选形状后切割类型即可选（难度不 gate：未选难度时自动切割用默认档位）
  const canModifySettings = isShapeGenerated && !state.isScattered && !state.isCutting


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
      payload: value as CutType,
    })
    // 选切割类型即等同点击"切割形状"按钮：直接按新类型切割（传参覆盖 dispatch 异步滞后），
    // 下方"切割形状"按钮随即变为"再次切割"，允许重复切割
    generatePuzzle(value as CutType)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* 添加切割类型标签 - 仅在非手机设备上显示 */}
      {!isPhone && !isLandscape && (
        <div className="text-premium-title mb-[10px]" style={{ fontSize: 'calc(0.9rem * var(--panel-scale, 1))' }}>
          {t('game.cutType.title')}
        </div>
      )}
      <div
        ref={gridRef}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))',
          gap: 'calc(var(--panel-scale, 1) * 8px)',
          width: '100%'
        }}
      >
        {[
          { id: 'straight', type: CutType.Straight, label: t('game.cutType.straight') },
          { id: 'diagonal', type: CutType.Diagonal, label: t('game.cutType.diagonal') },
          { id: 'radial', type: CutType.Radial, label: t('game.cutType.radial') },
          { id: 'through-curve', type: CutType.ThroughCurve, label: t('game.cutType.throughCurve') },
          { id: 's-curve', type: CutType.SCurve, label: t('game.cutType.sCurve') },
          { id: 'zigzag', type: CutType.Zigzag, label: t('game.cutType.zigzag') },
          { id: 'jigsaw', type: CutType.Jigsaw, label: t('game.cutType.jigsaw') },
          { id: 'mosaic-random', type: CutType.MosaicRandom, label: t('game.cutType.mosaicRandom') },
          { id: 'concavo-convex', type: CutType.ConcavoConvex, label: t('game.cutType.concavoConvex') },
          { id: 'hex', type: CutType.Hex, label: t('game.cutType.hex') },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => handleCutTypeChange(item.type)}
            disabled={!canModifySettings}
            data-testid={`cut-type-${item.id}-button`}
            className={cn(
              "glass-btn-sheen",
              localCutType === item.type ? "glass-btn-active" : "glass-btn-inactive",
              !canModifySettings ? disabledClass : "cursor-pointer"
            )}
            style={{
              height: buttonHeight,
              fontSize: `calc(var(--panel-scale, 1) * 14px * ${scale})`,
              lineHeight: `calc(var(--panel-scale, 1) * 14px * ${scale})`,
              borderRadius: 'calc(var(--panel-scale, 1) * 14px)',
              width: '100%',
              minWidth: 0,
              outline: 'none',
              padding: 0,
              fontWeight: 'normal',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
} 