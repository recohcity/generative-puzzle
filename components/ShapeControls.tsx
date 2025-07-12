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
  const { state, dispatch, generateShape, resetGame } = useGame()

  // 检测设备类型
  const [isPhone, setIsPhone] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  // 形状按钮本地选中状态
  const [selectedShape, setSelectedShape] = useState<ShapeType | null>(null);

  // 首次生成形状自动重置逻辑
  const [hasGeneratedShape, setHasGeneratedShape] = useState(false);

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

  // 切割后禁用形状按钮
  const isShapeButtonDisabled = state.cutType !== "";

  // 监听游戏重置，重置按钮状态
  useEffect(() => {
    if (state.originalShape.length === 0 && state.cutType === "") {
      setSelectedShape(null);
    }
  }, [state.originalShape.length, state.cutType]);

  // 形状按钮点击逻辑
  const handleShapeButtonClick = (shapeType: ShapeType) => {
    if (isShapeButtonDisabled) return;
    playButtonClickSound();
    setSelectedShape(shapeType);
    if (!hasGeneratedShape) {
      resetGame();
      setHasGeneratedShape(true);
      setTimeout(() => {
        generateShape(shapeType);
        if (goToNextTab) {
          setTimeout(() => {
            goToNextTab();
          }, 300);
        }
      }, 0);
    } else {
      generateShape(shapeType);
      if (goToNextTab) {
        setTimeout(() => {
          goToNextTab();
        }, 300);
      }
    }
  };

  // 按钮高亮逻辑：
  // 1. 切割前，选中哪个高亮哪个
  // 2. 切割后，保留最后一次选中的高亮，全部禁用
  const getButtonClass = (shapeType: ShapeType) => {
    const isActive = selectedShape === shapeType;
    return `flex flex-col items-center justify-center \
      ${isPhone ? 'py-px' : 'py-1'} h-auto !rounded-xl shadow-sm transition-all duration-200 text-base \
      ${isActive ? "bg-[#F68E5F] text-white hover:bg-[#F47B42] active:bg-[#E15A0F]" : "bg-[#3D3852] text-white hover:bg-[#4D4862] active:bg-[#302B45]"} \
      ${isShapeButtonDisabled ? "opacity-30 cursor-not-allowed" : ""}`;
  };

  return (
    <div className="space-y-2">
      {/* 添加形状类型标签 - 仅在非手机设备上显示 */}
      {!isPhone && !isLandscape && (
        <div className="text-xs text-[#FFD5AB] mb-1">选择形状类型</div>
      )}
      <div>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="ghost"
            className={getButtonClass(ShapeType.Polygon) + " flex-col items-center justify-center gap-[2px] p-2"}
            onClick={() => handleShapeButtonClick(ShapeType.Polygon)}
            disabled={isShapeButtonDisabled}
          >
            <Hexagon 
              className="!w-[24px] !h-[24px] text-white"
              strokeWidth={2}
            />
            <span className="text-[14px]">多边形</span>
          </Button>
          <Button
            variant="ghost"
            className={getButtonClass(ShapeType.Curve) + " flex-col items-center justify-center gap-[2px] p-2"}
            onClick={() => handleShapeButtonClick(ShapeType.Curve)}
            disabled={isShapeButtonDisabled}
          >
            <Circle 
              className="!w-[24px] !h-[24px] text-white"
              strokeWidth={2}
            />
            <span className="text-[14px]">曲凸形状</span>
          </Button>
          <Button
            variant="ghost"
            className={getButtonClass(ShapeType.Circle) + " flex-col items-center justify-center gap-[2px] p-2"}
            onClick={() => handleShapeButtonClick(ShapeType.Circle)}
            disabled={isShapeButtonDisabled}
          >
            <BlobIcon 
              className="!w-[24px] !h-[24px] text-white"
              strokeWidth={2}
            />
            <span className="text-[14px]">云朵形状</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

