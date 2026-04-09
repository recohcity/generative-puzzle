import React from 'react';
import { useGame } from '@/contexts/GameContext';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import DesktopScoreLayout from './DesktopScoreLayout';
import MobileScoreLayout from './MobileScoreLayout';

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

  // 模态模式：使用简单覆盖样式
  return (
    <div 
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${className}`}
      data-testid="score-display"
      role="dialog"
      aria-labelledby="score-display-title"
      aria-modal="true"
    >
      <div className="max-w-md w-full mx-4">
        {renderLayout()}
      </div>
    </div>
  );
};

export default ScoreDisplay;