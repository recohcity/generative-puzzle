"use client"
import { useGame } from "@/contexts/GameContext"
import { Lightbulb, RotateCcw, RotateCw } from "lucide-react"
import { playButtonClickSound, playRotateSound } from "@/utils/rendering/soundEffects"
import { useState, useEffect } from "react"
import { useDeviceDetection } from "@/hooks/useDeviceDetection"
import { useTranslation } from '@/contexts/I18nContext'
import { useAngleDisplay } from '@/utils/angleDisplay'
import { cn } from "@/lib/utils"

interface ActionButtonsProps {
  layout?: 'mobile' | 'desktop'; // Prop to differentiate layout styles if needed
  buttonHeight?: number;
}

export default function ActionButtons({ layout = 'mobile', buttonHeight = 34 }: ActionButtonsProps) {
  const {
    state,
    rotatePiece,
    showHintOutline,
    trackRotation,
    trackHintUsage,
  } = useGame()
  const { t } = useTranslation()
  
  // 角度显示增强功能
  const {
    shouldShowAngle,
    getDisplayState,
    isTemporaryDisplay,
    needsHintEnhancement
  } = useAngleDisplay()

  // 使用统一设备检测系统
  const device = useDeviceDetection();
  const isPhone = layout === 'mobile' ? device.deviceType === 'phone' : false;
  const isLandscape = layout === 'mobile' ? device.layoutMode === 'landscape' : false;


  // Common disabled style
  const disabledClass = "opacity-30 pointer-events-none";

  // 检查是否有切割类型选择
  const hasCutTypeSelected = state.cutType !== "";

  const handleShowHint = () => {
    playButtonClickSound()
    showHintOutline()

    // 统计触发：追踪提示使用
    try {
      trackHintUsage();
    } catch (error) {
      console.warn('统计追踪失败 (提示):', error);
    }
  }

  const handleRotatePiece = (clockwise: boolean) => {
    console.log(`[ActionButtons] handleRotatePiece called, clockwise: ${clockwise}`);
    playRotateSound()
    rotatePiece(clockwise)

    // 统计触发：追踪旋转操作
    try {
      trackRotation();
    } catch (error) {
      console.warn('统计追踪失败 (按钮旋转):', error);
    }

    console.log('[ActionButtons] handleRotatePiece finished');
  }

  // Determine styles based on layout prop or detected device state
  const buttonHeightClass = layout === 'desktop' ? 'h-9' : (isLandscape ? 'h-8 py-0.5' : 'h-9 py-0.5');
  // 统一图标大小为24px
  const iconSizeClass = 'w-6 h-6';
  const textSizeClass = layout === 'desktop' ? 'text-sm' : (isLandscape ? 'text-[12px]' : 'text-[12px]');
  const rotationInfoTextClass = layout === 'desktop' ? 'text-sm mt-2' : (isLandscape ? 'text-[12px] mt-1' : 'text-[12px] mt-1');
  const rotationInfoSubTextClass = layout === 'desktop' ? 'text-xs mt-1' : (isLandscape ? 'text-[12px] mt-0.5' : 'text-[12px] mt-0.5');


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
      {/* Action Buttons Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
        <button
          onClick={handleShowHint}
          disabled={
            !state.isScattered ||
            state.selectedPiece === null ||
            state.completedPieces.includes(state.selectedPiece ?? -1)
          }
          className={cn(
            "glass-btn-active glass-btn-sheen w-full border-none",
            (!state.isScattered || state.selectedPiece === null || state.completedPieces.includes(state.selectedPiece ?? -1)) && "opacity-30 pointer-events-none"
          )}
          data-testid="hint-button"
          style={{
            height: buttonHeight,
            borderRadius: 'calc(var(--panel-scale, 1) * 14px)',
            fontSize: '14px',
            padding: 0,
            lineHeight: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
          title={t('game.controls.hint')}
        >
          <Lightbulb style={{ width: '16px', height: '16px' }} className="text-brand-dark shrink-0" strokeWidth={2.5} />
          {layout === 'mobile' && <span className="text-[14px] ml-0.5">{t('game.controls.hint')}</span>}
        </button>

        <button
          onClick={() => handleRotatePiece(false)}
          disabled={!state.isScattered || state.selectedPiece === null || state.isCompleted}
          className={cn(
            "glass-btn-active glass-btn-sheen w-full border-none",
            (!state.isScattered || state.selectedPiece === null || state.isCompleted) && "opacity-30 pointer-events-none"
          )}
          data-testid="rotate-left-button"
          style={{
            height: buttonHeight,
            borderRadius: 'calc(var(--panel-scale, 1) * 14px)',
            fontSize: '14px',
            padding: 0,
            lineHeight: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
          title={t('game.controls.rotateLeft')}
        >
          <RotateCcw style={{ width: '16px', height: '16px' }} className="text-brand-dark shrink-0" strokeWidth={2.5} />
          {layout === 'mobile' && <span className="text-[14px] ml-0.5">{t('game.controls.rotateLeft')}</span>}
        </button>

        <button
          onClick={() => handleRotatePiece(true)}
          disabled={!state.isScattered || state.selectedPiece === null || state.isCompleted}
          className={cn(
            "glass-btn-active glass-btn-sheen w-full border-none",
            (!state.isScattered || state.selectedPiece === null || state.isCompleted) && "opacity-30 pointer-events-none"
          )}
          data-testid="rotate-right-button"
          style={{
            height: buttonHeight,
            borderRadius: 'calc(var(--panel-scale, 1) * 14px)',
            fontSize: '14px',
            padding: 0,
            lineHeight: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
          title={t('game.controls.rotateRight')}
        >
          <RotateCw style={{ width: '16px', height: '16px' }} className="text-brand-dark shrink-0" strokeWidth={2.5} />
          {layout === 'mobile' && <span className="text-[14px] ml-0.5">{t('game.controls.rotateRight')}</span>}
        </button>
      </div>

      {/* 角度显示 - 增强版多语言支持 */}
      {state.selectedPiece !== null && state.puzzle && (
        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          {shouldShowAngle(state.selectedPiece) ? (
            <>
              <div className={cn("text-premium-value text-sm", isTemporaryDisplay() ? 'animate-pulse-slow' : '')}>
                {isTemporaryDisplay() 
                  ? t('game.controls.angleTemporary', { angle: Math.round(state.puzzle[state.selectedPiece].rotation) })
                  : t('game.controls.currentAngle', { angle: Math.round(state.puzzle[state.selectedPiece].rotation) })
                }
              </div>
              <div className="text-premium-label text-[11px] mt-1 opacity-70">
                {isTemporaryDisplay() 
                  ? t('game.controls.hintRevealedAngle')
                  : (layout === 'mobile' ? t('game.controls.rotateInstruction') : t('game.controls.rotateInstructionDesktop'))
                }
              </div>
            </>
          ) : (
            <div className="text-premium-label text-[11px] mt-1 opacity-60">
              {needsHintEnhancement() ? t('game.controls.useHintToReveal') : 
                (layout === 'mobile' ? t('game.controls.rotateInstruction') : t('game.controls.rotateInstructionDesktop'))}
            </div>
          )}
        </div>
      )}
    </div>
  )
} 