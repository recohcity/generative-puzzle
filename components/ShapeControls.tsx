"use client"
import { useGame } from "@/contexts/GameContext"
import { Button } from "@/components/ui/button"
import { Check, Hexagon, Circle, CloudyIcon as BlobIcon } from "lucide-react"
import { ShapeType } from "@/types/puzzleTypes"
import { playButtonClickSound } from "@/utils/rendering/soundEffects"
import { useState, useEffect } from "react"

interface ShapeControlsProps {
  goToNextTab?: () => void;
}

export default function ShapeControls({ goToNextTab }: ShapeControlsProps) {
  const { state, dispatch, generateShape } = useGame()

  // 检测设备类型
  const [isPhone, setIsPhone] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  
  // 设备检测
  useEffect(() => {
    const checkDevice = () => {
      const ua = navigator.userAgent;
      const isMobile = /iPhone|Android/i.test(ua);
      const isPortrait = window.innerHeight > window.innerWidth;
      setIsPhone(isMobile);
      setIsLandscape(isMobile && !isPortrait);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', () => {
      setTimeout(checkDevice, 300);
    });
    
    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  // 获取当前活跃的形状类型（无论是实际使用的还是待使用的）
  const activeShapeType = state.pendingShapeType || state.shapeType

  const handleShapeTypeChange = (value: string) => {
    playButtonClickSound()
    
    // 只有在尚未生成形状时才允许更改形状类型直接生效
    // 或者当已经有拼图时禁用形状切换
    if (state.originalShape.length === 0 || state.puzzle !== null) {
    dispatch({
      type: "SET_SHAPE_TYPE",
      payload: value as ShapeType.Polygon | ShapeType.Curve | ShapeType.Circle,
    })
    } else {
      // 如果已经生成了形状但没有拼图，只更改类型但不立即重新生成
      dispatch({
        type: "SET_SHAPE_TYPE_WITHOUT_REGENERATE",
        payload: value as ShapeType.Polygon | ShapeType.Curve | ShapeType.Circle,
      })
    }
  }

  const handleGenerateShape = () => {
    playButtonClickSound()
    generateShape()
    // 生成形状后自动跳转到下一个tab
    if (goToNextTab) {
      setTimeout(() => {
        goToNextTab()
      }, 300)
    }
  }

  return (
    <div className="space-y-2">
      {/* 添加形状类型标签 - 仅在非手机设备上显示 */}
      {!isPhone && !isLandscape && (
        <div className="text-xs text-[#FFD5AB] mb-1">
          选择形状类型
        </div>
      )}
      <div>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="ghost"
            className={`
              flex flex-col items-center justify-center 
              ${isPhone ? 'py-px' : 'py-1'}
              h-auto rounded-lg shadow-sm transition-all duration-200
              ${activeShapeType === ShapeType.Polygon 
                ? "bg-[#F68E5F] text-white hover:bg-[#F47B42] active:bg-[#E15A0F]" 
                : "bg-[#3D3852] text-white hover:bg-[#4D4862] active:bg-[#302B45]"}
              ${state.puzzle ? "opacity-30 cursor-not-allowed" : ""}
            `}
            onClick={() => !state.puzzle && handleShapeTypeChange(ShapeType.Polygon)}
            disabled={state.puzzle !== null}
          >
            <Hexagon
              className={`${isLandscape ? 'w-4 h-4' : isPhone ? 'w-5 h-5' : 'w-6 h-6'} text-white mb-px`}
            />
            <span className={`${isLandscape ? 'text-[12px]' : isPhone ? 'text-[12px]' : 'text-xs'}`}>多边形</span>
          </Button>

          <Button
            variant="ghost"
            className={`
              flex flex-col items-center justify-center 
              ${isPhone ? 'py-px' : 'py-3'}
              h-auto rounded-lg shadow-sm transition-all duration-200
              ${activeShapeType === ShapeType.Curve 
                ? "bg-[#F68E5F] text-white hover:bg-[#F47B42] active:bg-[#E15A0F]" 
                : "bg-[#3D3852] text-white hover:bg-[#4D4862] active:bg-[#302B45]"}
              ${state.puzzle ? "opacity-30 cursor-not-allowed" : ""}
            `}
            onClick={() => !state.puzzle && handleShapeTypeChange(ShapeType.Curve)}
            disabled={state.puzzle !== null}
          >
            <Circle
              className={`${isLandscape ? 'w-4 h-4' : isPhone ? 'w-5 h-5' : 'w-6 h-6'} text-white mb-px`}
            />
            <span className={`${isLandscape ? 'text-[12px]' : isPhone ? 'text-[12px]' : 'text-xs'}`}>{isLandscape ? '曲凸形状' : '曲凸形状'}</span>
          </Button>

          <Button
            variant="ghost"
            className={`
              flex flex-col items-center justify-center 
              ${isPhone ? 'py-px' : 'py-3'}
              h-auto rounded-lg shadow-sm transition-all duration-200
              ${activeShapeType === ShapeType.Circle 
                ? "bg-[#F68E5F] text-white hover:bg-[#F47B42] active:bg-[#E15A0F]" 
                : "bg-[#3D3852] text-white hover:bg-[#4D4862] active:bg-[#302B45]"}
              ${state.puzzle ? "opacity-30 cursor-not-allowed" : ""}
            `}
            onClick={() => !state.puzzle && handleShapeTypeChange(ShapeType.Circle)}
            disabled={state.puzzle !== null}
          >
            <BlobIcon
              className={`${isLandscape ? 'w-4 h-4' : isPhone ? 'w-5 h-5' : 'w-6 h-6'} text-white mb-px`}
            />
            <span className={`${isLandscape ? 'text-[12px]' : isPhone ? 'text-[12px]' : 'text-xs'}`}>{isLandscape ? '云朵形状' : '云朵形状'}</span>
          </Button>
        </div>
      </div>

      <Button 
        onClick={handleGenerateShape} 
        className={`w-full 
                  ${isPhone ? 'py-px text-[12px]' : 'py-2'}
                  bg-[#36B37E] hover:bg-[#00875A] text-white rounded-xl shadow-md font-medium disabled:opacity-30 disabled:hover:bg-[#36B37E] active:bg-[#00734D]`}
        disabled={state.puzzle !== null}
      >
        {state.originalShape.length > 0 ? "重新生成形状" : "生成形状"}
      </Button>
    </div>
  )
}

