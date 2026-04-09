import React from 'react';
import { useGame } from '@/contexts/GameContext';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import DesktopScoreLayout from './DesktopScoreLayout';
import MobileScoreLayout from './MobileScoreLayout';
import { cn } from "@/lib/utils";

interface ScoreDisplayProps {
  className?: string;
  onClose?: () => void;
  showAnimation?: boolean;
  embedded?: boolean;
}

/**
 * 统一分数显示组件
 * 使用现有适配系统区分桌面端/移动端
 */
export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  className = '',
  onClose,
  showAnimation = true,
  embedded = false
}) => {
  const { state } = useGame();
  // Hook必须在条件返回之前调用
  const { deviceType } = useDeviceDetection();

  // 如果游戏未完成，不显示统计面板
  if (!state.isCompleted || !state.gameStats) {
    return null;
  }

  // 使用现有适配系统的设备检测
  const commonProps = {
    gameStats: state.gameStats!,
    scoreBreakdown: state.scoreBreakdown || undefined,
    currentScore: state.currentScore,
    isNewRecord: state.isNewRecord,
    currentRank: state.currentRank ?? undefined, // 将null转换为undefined
    onClose,
    showAnimation,
    embedded
  };
  const renderLayout = () => {
    // 只有手机使用移动端布局，iPad和桌面端使用桌面端布局
    return deviceType === 'phone'
      ? <MobileScoreLayout {...commonProps} />
      : <DesktopScoreLayout {...commonProps} />;
  };

  // 嵌入模式：直接渲染布局组件
  if (embedded) {
    return (
      <div
        className={className}
        data-testid="score-display-embedded"
      >
        {renderLayout()}
      </div>
    );
  }

  // 模态模式：使用高端覆盖样式与模糊背景
  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        "bg-black/40 backdrop-blur-xl animate-in fade-in duration-300",
        className
      )}
      data-testid="score-display"
      role="dialog"
      aria-labelledby="score-display-title"
      aria-modal="true"
    >
      <div className={cn(
        "w-full animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 delay-150",
        deviceType === 'phone' ? "max-w-sm" : "max-w-2xl"
      )}>
        {renderLayout()}
      </div>
    </div>
  );
};

export default ScoreDisplay;