"use client"
import { useGame } from "@/contexts/GameContext"
import { Button } from "@/components/ui/button"
import { Check, Hexagon, Circle, CloudyIcon as BlobIcon } from "lucide-react"
import { ShapeType } from "@/types/puzzleTypes"
import { playButtonClickSound } from "@/utils/rendering/soundEffects"
import { useState, useEffect } from "react"

interface ShapeControlsProps {
  goToNextTab?: () => void;
  buttonHeight?: number;
  fontSize?: number;
}

export default function ShapeControls({ goToNextTab, buttonHeight = 60, fontSize = 14 }: ShapeControlsProps) {
  const { state, dispatch, generateShape, resetGame } = useGame()

  // 检测设备类型
  const [isPhone, setIsPhone] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  // 移除本地 selectedShape 状态
  // const [selectedShape, setSelectedShape] = useState<ShapeType | null>(null);

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

  // 监听游戏重置，重置 hasGeneratedShape 状态
  useEffect(() => {
    if (state.originalShape.length === 0 && state.cutType === "") {
      setHasGeneratedShape(false);
    }
  }, [state.originalShape.length, state.cutType]);

  // 形状按钮点击逻辑
  const handleShapeButtonClick = (shapeType: ShapeType) => {
    if (isShapeButtonDisabled) return;
    playButtonClickSound();
    // setSelectedShape(shapeType); // 移除本地状态
    if (!hasGeneratedShape) {
      resetGame();
      setHasGeneratedShape(true);
      setTimeout(() => {
        dispatch({ type: "SET_SHAPE_TYPE", payload: shapeType });
        generateShape(shapeType);
        if (goToNextTab) {
          setTimeout(() => {
            goToNextTab();
          }, 300);
        }
      }, 0);
    } else {
      dispatch({ type: "SET_SHAPE_TYPE", payload: shapeType });
      generateShape(shapeType);
      if (goToNextTab) {
        setTimeout(() => {
          goToNextTab();
        }, 300);
      }
    }
  };

  // 按钮高亮逻辑：用全局 state.shapeType 判断
  const getButtonClass = (shapeType: ShapeType) => {
    const isActive = state.shapeType === shapeType;
    let base =
      isActive
        ? "bg-[#F68E5F] text-white hover:bg-[#F47B42] active:bg-[#E15A0F]"
        : "bg-[#3D3852] text-white hover:bg-[#4D4862] active:bg-[#302B45]";
    if (isShapeButtonDisabled) {
      base += " opacity-30 cursor-not-allowed";
    }
    return `flex flex-col items-center justify-center shadow-sm transition-all duration-200 ${base}`;
  };

  // --- 固定像素样式 ---
  const buttonStyle = {
    fontSize: fontSize + 'px',
    padding: '0',
    borderRadius: '14px',
    gap: '6px',
    minWidth: '80px',
    minHeight: buttonHeight,
    width: '80px',
    height: buttonHeight,
    lineHeight: '18px',
  };
  const iconStyle = {
    width: buttonHeight * 0.27,
    height: buttonHeight * 0.27,
    marginBottom: '2px',
  };
  const labelStyle = {
    fontSize: fontSize + 'px',
    lineHeight: '18px',
  };

  return (
    <div className="space-y-[1px]" style={{}}>
      {/* 添加形状类型标签 - 仅在非手机设备上显示 */}
      {!isPhone && !isLandscape && (
        <div className="text-[12px] text-[#FFD5AB] mb-[10px] leading-[22px] font-medium">选择形状类型</div>
      )}
      <div>
        <div className="flex gap-[10px]">
          <Button
            variant="ghost"
            className={getButtonClass(ShapeType.Polygon) + " flex flex-col items-center justify-center"}
            style={{ ...buttonStyle, flex: 1, minWidth: 0, width: 'auto', maxWidth: '240px' }}
            onClick={() => {
              if (isShapeButtonDisabled) return;
              handleShapeButtonClick(ShapeType.Polygon);
            }}
          >
            <Hexagon 
              style={iconStyle}
              className="text-white"
              strokeWidth={2}
            />
            <span style={labelStyle}>多边形</span>
          </Button>
          <Button
            variant="ghost"
            className={getButtonClass(ShapeType.Curve) + " flex flex-col items-center justify-center"}
            style={{ ...buttonStyle, flex: 1, minWidth: 0, width: 'auto', maxWidth: '240px' }}
            onClick={() => {
              if (isShapeButtonDisabled) return;
              handleShapeButtonClick(ShapeType.Curve);
            }}
          >
            <Circle 
              style={iconStyle}
              className="text-white"
              strokeWidth={2}
            />
            <span style={labelStyle}>曲凸形状</span>
          </Button>
          <Button
            variant="ghost"
            className={getButtonClass(ShapeType.Circle) + " flex flex-col items-center justify-center"}
            style={{ ...buttonStyle, flex: 1, minWidth: 0, width: 'auto', maxWidth: '240px' }}
            onClick={() => {
              if (isShapeButtonDisabled) return;
              handleShapeButtonClick(ShapeType.Circle);
            }}
          >
            <BlobIcon 
              style={iconStyle}
              className="text-white"
              strokeWidth={2}
            />
            <span style={labelStyle}>云朵形状</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

