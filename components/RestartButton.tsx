import { Button } from "@/components/ui/button";
import { RefreshCw, RotateCcw } from "lucide-react";
import React from "react";
import { useTranslation } from '@/contexts/I18nContext';

interface RestartButtonProps {
  onClick: () => void;
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
  fontSize?: number | string;
  iconSize?: number | string;
  height?: number | string;
  children?: React.ReactNode;
  icon?: 'refresh' | 'retry'; // 新增：图标类型
}

const DEFAULT_HEIGHT = 36;
const DEFAULT_FONT_SIZE = 15;
const DEFAULT_ICON_SIZE = 24;

const RestartButton: React.FC<RestartButtonProps> = ({
  onClick,
  disabled = false,
  style = {},
  className = "",
  fontSize = DEFAULT_FONT_SIZE,
  iconSize = DEFAULT_ICON_SIZE,
  height = DEFAULT_HEIGHT,
  children,
  icon = 'refresh', // 默认使用 refresh 图标
}) => {
  const { t } = useTranslation();
  const defaultText = children || t('game.controls.restart');
  
  // 根据 icon prop 选择图标
  const IconComponent = icon === 'retry' ? RotateCcw : RefreshCw;
  
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={`w-full bg-[#1E1A2A] text-white rounded-3xl shadow-md hover:bg-[#141022] hover:text-white hover:border-[#706B89] active:bg-[#2A283E] active:text-white active:border-[#463E50] min-h-0 p-0 leading-none ${className}`}
      data-testid="restart-button"
      style={{
        height,
        fontSize,
        minHeight: 0,
        paddingTop: 0,
        paddingBottom: 0,
        lineHeight: 1,
        ...style,
      }}
    >
      <IconComponent
        className="mr-2"
        style={{
          width: iconSize,
          height: iconSize,
          color: "#F68E5F",
          flexShrink: 0,
          lineHeight: 1,
        }}
      />
      <span style={{lineHeight: 1}}>{defaultText}</span>
    </Button>
  );
};

export default RestartButton; 