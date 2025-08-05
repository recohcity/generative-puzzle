"use client"
import { useGame } from "@/contexts/GameContext"
import { Button } from "@/components/ui/button"
import { Hexagon, Cloud, Zap } from "lucide-react"
import { ShapeType } from "@/types/puzzleTypes"
import { playButtonClickSound } from "@/utils/rendering/soundEffects"
import { useState, useEffect } from "react"
import { useDeviceDetection } from "@/hooks/useDeviceDetection"

interface ShapeControlsProps {
  goToNextTab?: () => void;
  buttonHeight?: number;
  fontSize?: number;
}

export default function ShapeControls({ goToNextTab, buttonHeight = 60, fontSize = 14 }: ShapeControlsProps) {
  const { state, dispatch, generateShape, resetGame } = useGame()

  // 使用统一设备检测系统
  const device = useDeviceDetection();
  const isPhone = device.deviceType === 'phone';
  const isLandscape = device.layoutMode === 'landscape';

  // 首次生成形状自动重置逻辑
  const [hasGeneratedShape, setHasGeneratedShape] = useState(false);

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
        : "bg-[#1E1A2A] text-white hover:bg-[#2A283E] active:bg-[#2A283E]";
    if (isShapeButtonDisabled) {
      base += " opacity-30 cursor-not-allowed text-white";
    }
    return `flex flex-col items-center justify-center shadow-sm transition-all duration-200 ${base}`;
  };

  // --- 响应式样式 ---
  const buttonStyle = {
    fontSize: fontSize + 'px',
    padding: '0',
    borderRadius: '14px',
    gap: '6px',
    minHeight: buttonHeight,
    height: buttonHeight,
    lineHeight: '18px',
    // 弹性布局样式
    flex: 1,
    minWidth: 0,
    width: 'auto',
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
    <div className="space-y-[1px] w-full" style={{}}>
      {/* 添加形状类型标签 - 仅在非手机设备上显示 */}
      {!isPhone && !isLandscape && (
        <div className="text-[12px] text-[#FFD5AB] mb-[10px] leading-[22px] font-medium">选择形状类型</div>
      )}
      <div className="w-full">
        <div className="flex gap-[10px] w-full">
          <Button
            variant="ghost"
            className={getButtonClass(ShapeType.Polygon) + " flex flex-col items-center justify-center"}
            style={buttonStyle}
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
            style={buttonStyle}
            onClick={() => {
              if (isShapeButtonDisabled) return;
              handleShapeButtonClick(ShapeType.Curve);
            }}
          >
            <Cloud
              style={iconStyle}
              className="text-white"
              strokeWidth={2}
            />
            <span style={labelStyle}>云朵形状</span>
          </Button>
          <Button
            variant="ghost"
            className={getButtonClass(ShapeType.Irregular) + " flex flex-col items-center justify-center"}
            style={buttonStyle}
            onClick={() => {
              if (isShapeButtonDisabled) return;
              handleShapeButtonClick(ShapeType.Irregular);
            }}
          >
            <Zap
              style={iconStyle}
              className="text-white"
              strokeWidth={2}
            />
            <span style={labelStyle}>锯齿形状</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

