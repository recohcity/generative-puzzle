"use client"
import { useGame } from "@/contexts/GameContext"
import { Button } from "@/components/ui/button"
import { Lightbulb, RotateCcw, RotateCw } from "lucide-react"
import { playButtonClickSound, playRotateSound } from "@/utils/rendering/soundEffects"
import { useState, useEffect } from "react"
import { useDeviceDetection } from "@/hooks/useDeviceDetection"

interface ActionButtonsProps {
  layout?: 'mobile' | 'desktop'; // Prop to differentiate layout styles if needed
  buttonHeight?: number;
}

export default function ActionButtons({ layout = 'mobile', buttonHeight = 34 }: ActionButtonsProps) {
  const {
    state,
    rotatePiece,
    showHintOutline,
  } = useGame()

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
  }

  const handleRotatePiece = (clockwise: boolean) => {
    console.log(`[ActionButtons] handleRotatePiece called, clockwise: ${clockwise}`);
    playRotateSound()
    rotatePiece(clockwise)
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
          title="显示提示"
          variant="ghost"
        >
          <Lightbulb style={{ width: '16px', height: '16px' }} className="text-white shrink-0" strokeWidth={2} />
          {layout === 'mobile' && <span style={{ fontSize: '14px', marginLeft: '2px' }}>提示</span>}
        </Button>

        <Button
          onClick={() => handleRotatePiece(false)}
          disabled={!state.isScattered || state.selectedPiece === null || state.isCompleted}
          className={`w-full bg-[#F68E5F] hover:bg-[#F47B42] text-white shadow-md ${!state.isScattered || state.selectedPiece === null || state.isCompleted ? disabledClass : ""} disabled:hover:bg-[#F68E5F]`}
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
          title="逆时针旋转"
          variant="ghost"
        >
          <RotateCcw style={{ width: '16px', height: '16px' }} className="text-white shrink-0" strokeWidth={2} />
          {layout === 'mobile' && <span style={{ fontSize: '14px', marginLeft: '2px' }}>左转</span>}
        </Button>

        <Button
          onClick={() => handleRotatePiece(true)}
          disabled={!state.isScattered || state.selectedPiece === null || state.isCompleted}
          className={`w-full bg-[#F68E5F] hover:bg-[#F47B42] text-white shadow-md ${!state.isScattered || state.selectedPiece === null || state.isCompleted ? disabledClass : ""} disabled:hover:bg-[#F68E5F]`}
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
          title="顺时针旋转"
          variant="ghost"
        >
          <RotateCw style={{ width: '16px', height: '16px' }} className="text-white shrink-0" strokeWidth={2} />
          {layout === 'mobile' && <span style={{ fontSize: '14px', marginLeft: '2px' }}>右转</span>}
        </Button>
      </div>

      {/* Rotation Info */}
      {state.selectedPiece !== null && state.puzzle && (
        <div style={{ textAlign: 'center', fontSize: '14px', marginTop: '6px', color: '#FFD5AB', fontWeight: 500 }}>
          <div>
            当前角度: {Math.round(state.puzzle[state.selectedPiece].rotation)}°
          </div>
          <div style={{ fontSize: '12px', marginTop: '2px', color: '#FFD5AB', fontWeight: 500 }}>
            {layout === 'mobile' && isPhone ? "可以使用2只手指旋转拼图" : "(旋转角度需与目标角度匹配才能放置)"}
          </div>
        </div>
      )}
    </div>
  )
} 