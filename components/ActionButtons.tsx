"use client"
import { useGame } from "@/contexts/GameContext"
import { Button } from "@/components/ui/button"
import { Lightbulb, RotateCcw, RotateCw } from "lucide-react"
import { playButtonClickSound, playRotateSound } from "@/utils/rendering/soundEffects"
import { useState, useEffect } from "react"
import { useDeviceDetection } from "@/hooks/useDeviceDetection"
import { useTranslation } from '@/contexts/I18nContext'
import { useAngleDisplay } from '@/utils/angleDisplay'

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
        <Button
          onClick={handleShowHint}
          disabled={
            !state.isScattered ||
            state.selectedPiece === null ||
            state.completedPieces.includes(state.selectedPiece ?? -1)
          }
          className={`w-full bg-[#F68E5F] hover:bg-[#F47B42] text-white shadow-md ${!state.isScattered || state.selectedPiece === null || state.completedPieces.includes(state.selectedPiece ?? -1) ? disabledClass : ""} disabled:hover:bg-[#F68E5F]`}
          data-testid="hint-button"
          style={{
            height: buttonHeight,
            borderRadius: '14px',
            fontSize: '14px',
            padding: 0,
            lineHeight: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
          title={t('game.controls.hint')}
          variant="ghost"
        >
          <Lightbulb style={{ width: '16px', height: '16px' }} className="text-white shrink-0" strokeWidth={2} />
          {layout === 'mobile' && <span style={{ fontSize: '14px', marginLeft: '2px' }}>{t('game.controls.hint')}</span>}
        </Button>

        <Button
          onClick={() => handleRotatePiece(false)}
          disabled={!state.isScattered || state.selectedPiece === null || state.isCompleted}
          className={`w-full bg-[#F68E5F] hover:bg-[#F47B42] text-white shadow-md ${!state.isScattered || state.selectedPiece === null || state.isCompleted ? disabledClass : ""} disabled:hover:bg-[#F68E5F]`}
          data-testid="rotate-left-button"
          style={{
            height: buttonHeight,
            borderRadius: '14px',
            fontSize: '14px',
            padding: 0,
            lineHeight: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
          title={t('game.controls.rotateLeft')}
          variant="ghost"
        >
          <RotateCcw style={{ width: '16px', height: '16px' }} className="text-white shrink-0" strokeWidth={2} />
          {layout === 'mobile' && <span style={{ fontSize: '14px', marginLeft: '2px' }}>{t('game.controls.rotateLeft')}</span>}
        </Button>

        <Button
          onClick={() => handleRotatePiece(true)}
          disabled={!state.isScattered || state.selectedPiece === null || state.isCompleted}
          className={`w-full bg-[#F68E5F] hover:bg-[#F47B42] text-white shadow-md ${!state.isScattered || state.selectedPiece === null || state.isCompleted ? disabledClass : ""} disabled:hover:bg-[#F68E5F]`}
          data-testid="rotate-right-button"
          style={{
            height: buttonHeight,
            borderRadius: '14px',
            fontSize: '14px',
            padding: 0,
            lineHeight: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
          title={t('game.controls.rotateRight')}
          variant="ghost"
        >
          <RotateCw style={{ width: '16px', height: '16px' }} className="text-white shrink-0" strokeWidth={2} />
          {layout === 'mobile' && <span style={{ fontSize: '14px', marginLeft: '2px' }}>{t('game.controls.rotateRight')}</span>}
        </Button>
      </div>

      {/* 角度显示 - 增强版多语言支持 */}
      {state.selectedPiece !== null && state.puzzle && (
        <div style={{ textAlign: 'center', fontSize: '14px', marginTop: '6px', color: '#FFD5AB', fontWeight: 500 }}>
          {shouldShowAngle(state.selectedPiece) ? (
            <>
              <div className={isTemporaryDisplay() ? 'animate-pulse' : ''}>
                {isTemporaryDisplay() 
                  ? t('game.controls.angleTemporary', { angle: Math.round(state.puzzle[state.selectedPiece].rotation) })
                  : t('game.controls.currentAngle', { angle: Math.round(state.puzzle[state.selectedPiece].rotation) })
                }
              </div>
              <div style={{ fontSize: '12px', marginTop: '2px', color: '#FFD5AB', fontWeight: 500 }}>
                {isTemporaryDisplay() 
                  ? t('game.controls.hintRevealedAngle')
                  : (layout === 'mobile' ? t('game.controls.rotateInstruction') : t('game.controls.rotateInstructionDesktop'))
                }
              </div>
            </>
          ) : (
            <div style={{ fontSize: '12px', marginTop: '2px', color: '#FFD5AB', opacity: 0.6, fontWeight: 500 }}>
              {needsHintEnhancement() ? t('game.controls.useHintToReveal') : 
                (layout === 'mobile' ? t('game.controls.rotateInstruction') : t('game.controls.rotateInstructionDesktop'))}
            </div>
          )}
        </div>
      )}
    </div>
  )
} 