import { RefreshCw, RotateCcw } from "lucide-react";
import React from "react";
import { useTranslation } from '@/contexts/I18nContext';
import { cn } from "@/lib/utils";

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
  variant?: 'default' | 'recut' | 'active'; // 视觉变体：default=透明, recut=青蓝(再次切割), active=橙色(散开拼图)
}

const DEFAULT_HEIGHT = 40;
const DEFAULT_FONT_SIZE = 14;
const DEFAULT_ICON_SIZE = 18;

const VARIANT_CLASS_MAP = {
  default: 'glass-btn-inactive',
  recut: 'glass-btn-recut',
  active: 'glass-btn-active',
} as const;

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
  variant = 'default',
}) => {
  const { t } = useTranslation();
  const defaultText = children || t('game.controls.restart');

  // 根据 icon prop 选择图标
  const IconComponent = icon === 'retry' ? RotateCcw : RefreshCw;

  // 根据 variant 选择图标颜色
  const iconColor = variant === 'recut' ? '#ffffff' : variant === 'active' ? 'currentColor' : 'var(--brand-peach)';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        `${VARIANT_CLASS_MAP[variant]} glass-btn-sheen w-full`,
        disabled && "opacity-30 pointer-events-none",
        className
      )}
      data-testid="restart-button"
      style={{
        height,
        fontSize,
        minHeight: 0,
        paddingTop: 0,
        paddingBottom: 0,
        lineHeight: 1,
        borderRadius: 'calc(var(--panel-scale, 1) * 14px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'normal',
        ...style,
      }}
    >
      <IconComponent
        className="mr-2"
        style={{
          width: iconSize,
          height: iconSize,
          color: iconColor,
          flexShrink: 0,
          lineHeight: 1,
        }}
      />
      <span style={{ lineHeight: 1 }}>{defaultText}</span>
    </button>
  );
};

export default RestartButton;