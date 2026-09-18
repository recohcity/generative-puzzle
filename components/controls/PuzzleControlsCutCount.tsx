"use client"
import { useGame } from "@/contexts/GameContext"
import { playButtonClickSound } from "@/utils/rendering/soundEffects"
import { useState, useEffect, useRef } from "react"
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
  // 统一触摸拖动逻辑（所有布局一致）：整层 touch-action 锁定或 iOS 橡皮筋场景下
  // 原生滑块拖动不可用/不可靠，统一用 JS 按触摸 X 实时计算档位。
  // 视觉位置与档位值解耦：滑块/轨道实时贴手指（连续跟随），档位独立取整（逐格变化）。
  const [isDragging, setIsDragging] = useState(false);
  // 松手瞬移到档位点（无吸附动画）
  const [snapInstant, setSnapInstant] = useState(false);
  // 拖动态手指位置（0-1 连续），null=非拖动
  const [dragRatio, setDragRatio] = useState<number | null>(null);
  // 显示用位置：拖动时=手指位置，否则=档位对应位置
  const displayRatio = dragRatio ?? ((localCutCount || 1) - 1) / 7;

  // 触摸拖动状态 refs
  const touchActiveRef = useRef(false);   // 触摸路径标记（防 onChange 双音效）
  const lastRatioRef = useRef(0);         // 最后手指位置（touchend 吸附依据）
  const directionRef = useRef(0);         // 方向累计（正=右，负=左）
  const startValRef = useRef(1);          // 触摸起始档位（决定是否发声）
  const movedRatioRef = useRef(0);        // 累计移动距离（相对轨道宽），区分点击/拖动
  const prevTouchValRef = useRef(1);      // 上次已响档位（拖动中每经过 1 个点响 1 次，去抖防重复）
  const suppressChangeRef = useRef(false); // touchend 后抑制 click→onChange 的双音效

  const getTouchRatio = (e: React.TouchEvent<HTMLInputElement>): number | null => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0) return null;
    const touch = e.touches[0];
    if (!touch) return null;
    return Math.min(1, Math.max(0, (touch.clientX - rect.left) / rect.width));
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLInputElement>) => {
    if (!canModifySettings) return;
    touchActiveRef.current = true;
    startValRef.current = localCutCount || 1;
    prevTouchValRef.current = startValRef.current; // 起点档位不响
    lastRatioRef.current = getTouchRatio(e) ?? 0;
    directionRef.current = 0;
    movedRatioRef.current = 0;
    setIsDragging(true);
    setDragRatio(lastRatioRef.current);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLInputElement>) => {
    if (!touchActiveRef.current || !canModifySettings) return;
    const ratio = getTouchRatio(e);
    if (ratio == null) return;
    directionRef.current += ratio - lastRatioRef.current;
    movedRatioRef.current += Math.abs(ratio - lastRatioRef.current);
    lastRatioRef.current = ratio;
    setDragRatio(ratio); // 视觉连续跟随手指
    const val = Math.round(1 + ratio * 7);
    if (val !== prevTouchValRef.current) {
      prevTouchValRef.current = val;
      playButtonClickSound(); // 每经过 1 个档位点响 1 次（去抖：同点不重复响）
      setLocalCutCount(val);
      dispatch({ type: "SET_CUT_COUNT", payload: val });
    }
  };

  const handleTouchEnd = () => {
    if (!touchActiveRef.current) return;
    touchActiveRef.current = false;
    setIsDragging(false);
    setSnapInstant(true); // 松手直接落档位点，无吸附动画
    setDragRatio(null);
    setTimeout(() => setSnapInstant(false), 50); // 一帧后恢复过渡（后续变化正常动画）
    // 吸附：无显著移动=点击（就近精准落点 round）；明显移动=拖动（方向吸附：
    // 向右拖→手指抬起位置右侧最近档位 ceil，向左→左侧 floor）
    const raw = 1 + lastRatioRef.current * 7;
    const isTap = movedRatioRef.current < 0.06; // 移动 < 6% 轨道宽视为点击
    let target = isTap ? Math.round(raw) : (directionRef.current >= 0 ? Math.ceil(raw) : Math.floor(raw));
    target = Math.max(1, Math.min(8, target));
    // 档位 1 向左（或吸附目标=起始档）→ 无变化、无音效
    if (target !== (localCutCount || 1)) {
      setLocalCutCount(target);
      dispatch({ type: "SET_CUT_COUNT", payload: target });
    }
    // 音效：拖动中已逐点响过（每经过 1 个点 1 次），松手不再响；
    // 点击（无显著移动）若吸附落点 ≠ 起始档，补 1 次
    if (isTap && target !== startValRef.current) {
      playButtonClickSound();
    }
    // 抑制随后 click→onChange 的双音效
    suppressChangeRef.current = true;
    setTimeout(() => { suppressChangeRef.current = false; }, 150);
    lastRatioRef.current = 0;
    directionRef.current = 0;
    movedRatioRef.current = 0;
  };

  const handleTouchCancel = () => {
    touchActiveRef.current = false;
    setIsDragging(false);
    setSnapInstant(true);
    setDragRatio(null);
    setTimeout(() => setSnapInstant(false), 50);
    lastRatioRef.current = 0;
    directionRef.current = 0;
    movedRatioRef.current = 0;
  };

  // 获取当前难度元数据
  const meta = getDifficultyMetadata(localCutCount || 1);

  // 检查是否已生成形状
  const isShapeGenerated = state.originalShape.length > 0
  // 检查是否可以修改拼图设置（先选难度再选切割方式：选形状后难度即可操作）
  const canModifySettings = isShapeGenerated && !state.isScattered

  const handleCutCountChange = (value: number) => {
    if (!canModifySettings) return
    playButtonClickSound()
    dispatch({ type: "SET_CUT_COUNT", payload: value })
    setLocalCutCount(value)
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
          {/* 背景轨道：两端与点位 1/8 对齐（内缩按钮半径），按钮在端点时半骑在轨道端上（专业滑条样式） */}
          <div className={cn("absolute rounded-full bg-black/20 border border-white/5", isLandscape ? "inset-x-3.5 h-2" : "inset-x-3 h-1.5")} />
          {/* 8 个档位刻度点：静态位置参考，与按钮档位落点使用同一偏移校正公式（精确对齐） */}
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
            const p = (i - 1) / 7;
            return (
              <div
                key={i}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/25 border border-white/20 pointer-events-none"
                style={{ left: `calc(${p * 100}% + ${isLandscape ? 14 : 12}px - ${p * (isLandscape ? 28 : 24)}px)` }}
              />
            );
          })}

          {/* 原生 Input 用于交互 (透明隐藏) */}
          <input
            type="range"
            min="1"
            max="8"
            step="1"
            value={localCutCount || 1}
            onChange={(e) => {
              const v = parseInt(e.target.value);
              if (touchActiveRef.current || suppressChangeRef.current) return; // 触摸路径由 JS 处理，防双音效
              handleCutCountChange(v);
            }}
            disabled={!canModifySettings}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
            style={{ touchAction: 'none' }}
            className={cn(
              "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20",
              !canModifySettings && "cursor-not-allowed"
            )}
          />

          {/* 动态滑块与内部数字 */}
          <div
            className={cn("absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none z-10 flex flex-col items-center justify-center",
              isDragging || snapInstant ? "transition-none" : "transition-all duration-300")}
            style={{
              // 精确对齐：确保滑块左边缘在1时对齐最左侧，在8时对齐最右侧
              left: `calc(${displayRatio * 100}% + ${isLandscape ? 14 : 12}px - ${displayRatio * (isLandscape ? 28 : 24)}px)`
            }}
          >
            {/* 调整后：和切割按钮颜色一致的圆形滑块 */}
            <div className={cn(
              "flex items-center justify-center rounded-full overflow-hidden relative font-black",
              isDragging || snapInstant ? "transition-none" : "transition-transform duration-200 group-active:scale-95",
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
    </div>
  )
}