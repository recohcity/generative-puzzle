"use client"
import { useGame } from "@/contexts/GameContext"
import { Hexagon, Cloud, Zap } from "lucide-react"
import { ShapeType } from "@generative-puzzle/game-core"
import { playButtonClickSound } from "@/utils/rendering/soundEffects"
import { useState, useEffect } from "react"
import { useDeviceDetection } from "@/hooks/useDeviceDetection"
import { useTranslation } from '@/contexts/I18nContext'
import { cn } from "@/lib/utils"

interface ShapeControlsProps {
  goToNextTab?: () => void;
  buttonHeight?: number;
  fontSize?: number;
}

export default function ShapeControls({ goToNextTab, buttonHeight = 60, fontSize = 14 }: ShapeControlsProps) {
  const { state, dispatch, generateShape, resetGame } = useGame()
  const { t } = useTranslation()

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
    let base = isActive ? "glass-btn-active" : "glass-btn-inactive";
    if (isShapeButtonDisabled) {
      base += " opacity-30 cursor-not-allowed";
    }
    return cn("flex flex-col items-center justify-center glass-btn-sheen", base);
  };

  // --- 响应式样式 ---
  const buttonStyle = {
    fontSize: fontSize + 'px',
    padding: '0',
    borderRadius: 'calc(var(--panel-scale, 1) * 14px)',
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
    <div className="space-y-0 w-full" style={{}}>
      {/* 添加形状类型标签 - 仅在非手机设备上显示 */}
      {!isPhone && !isLandscape && (
        <div className="text-premium-title mb-[10px]" style={{ fontSize: 'calc(0.9rem * var(--panel-scale, 1))' }}>
          {t('game.shapes.title')}
        </div>
      )}
      <div className="w-full">
        <div className="flex gap-[10px] w-full">
          <button
            className={getButtonClass(ShapeType.Polygon)}
            style={buttonStyle}
            data-testid="shape-polygon-button"
            onClick={() => {
              if (isShapeButtonDisabled) return;
              handleShapeButtonClick(ShapeType.Polygon);
            }}
          >
            <Hexagon
              style={iconStyle}
              strokeWidth={2.5}
            />
            <span style={labelStyle} className="font-bold">{t('game.shapes.polygon')}</span>
          </button>
          <button
            className={getButtonClass(ShapeType.Cloud)}
            style={buttonStyle}
            data-testid="shape-curve-button"
            onClick={() => {
              if (isShapeButtonDisabled) return;
              handleShapeButtonClick(ShapeType.Cloud);
            }}
          >
            <Cloud
              style={iconStyle}
              strokeWidth={2.5}
            />
            <span style={labelStyle} className="font-bold">{t('game.shapes.curve')}</span>
          </button>
          <button
            className={getButtonClass(ShapeType.Jagged)}
            style={buttonStyle}
            data-testid="shape-irregular-button"
            onClick={() => {
              if (isShapeButtonDisabled) return;
              handleShapeButtonClick(ShapeType.Jagged);
            }}
          >
            <Zap
              style={iconStyle}
              strokeWidth={2.5}
            />
            <span style={labelStyle} className="font-bold">{t('game.shapes.irregular')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

