import React from 'react';
import { useTranslation } from '@/contexts/I18nContext';
import { RotationEfficiencyCalculator, RotationEfficiencyResult } from '@generative-puzzle/game-core';
import { RotateCw, Trophy, AlertCircle } from 'lucide-react';
import styles from './RotationScoreDisplay.module.css';

// 显示模式类型
export type DisplayMode = 'desktop' | 'mobile' | 'compact';

// 组件属性接口
export interface RotationScoreDisplayProps {
  actualRotations: number;
  minRotations: number;
  displayMode?: DisplayMode;
  showIcon?: boolean;
  showScore?: boolean;
  className?: string;
}

/**
 * 旋转评分显示组件
 * 支持不同显示模式（desktop/mobile/compact）
 * 集成国际化支持，确保中英文切换正常
 * 使用适当的颜色方案区分完美旋转和超出旋转
 */
export const RotationScoreDisplay: React.FC<RotationScoreDisplayProps> = ({
  actualRotations,
  minRotations,
  displayMode = 'desktop',
  showIcon = true,
  showScore = true,
  className = ''
}) => {
  const { t } = useTranslation();

  // 计算旋转效率结果（使用国际化）
  const result: RotationEfficiencyResult = React.useMemo(() => {
    return RotationEfficiencyCalculator.calculateScoreWithI18n(
      actualRotations,
      minRotations,
      t
    );
  }, [actualRotations, minRotations, t]);

  // 获取显示样式配置
  const getDisplayConfig = () => {
    switch (displayMode) {
      case 'desktop':
        return {
          containerClass: 'flex items-center gap-3 p-3 rounded-lg bg-white/90 backdrop-blur-sm border shadow-sm',
          iconSize: 'w-5 h-5',
          textSize: 'text-base',
          scoreSize: 'text-lg font-semibold',
          showDetails: true,
          showFullLabel: true
        };
      
      case 'mobile':
        return {
          containerClass: 'flex items-center gap-2 p-2 rounded-md bg-white/80 backdrop-blur-sm',
          iconSize: 'w-4 h-4',
          textSize: 'text-sm',
          scoreSize: 'text-base font-medium',
          showDetails: true,
          showFullLabel: false
        };
      
      case 'compact':
        return {
          containerClass: 'flex items-center gap-1 px-2 py-1 rounded text-xs',
          iconSize: 'w-3 h-3',
          textSize: 'text-xs',
          scoreSize: 'text-sm font-medium',
          showDetails: false,
          showFullLabel: false
        };
      
      default:
        return {
          containerClass: 'flex items-center gap-2 p-2 rounded',
          iconSize: 'w-4 h-4',
          textSize: 'text-sm',
          scoreSize: 'text-base',
          showDetails: true,
          showFullLabel: true
        };
    }
  };

  const config = getDisplayConfig();

  // 获取颜色样式类
  const getColorClasses = () => {
    if (result.isPerfect) {
      return {
        container: `border-yellow-200 bg-yellow-50/90 ${styles.perfectRotation}`,
        icon: 'text-yellow-600',
        text: 'text-yellow-800',
        score: 'text-yellow-700'
      };
    } else {
      return {
        container: `border-red-200 bg-red-50/90 ${styles.excessRotation}`,
        icon: 'text-red-600',
        text: 'text-red-800',
        score: 'text-red-700'
      };
    }
  };

  const colors = getColorClasses();

  // 格式化分数显示
  const formatScore = (score: number): string => {
    if (score > 0) return `+${score}`;
    return score.toString();
  };

  // 获取图标组件
  const getIcon = () => {
    if (result.isPerfect) {
      return <Trophy className={`${config.iconSize} ${colors.icon}`} />;
    } else {
      return <RotateCw className={`${config.iconSize} ${colors.icon}`} />;
    }
  };

  // 获取显示文本
  const getDisplayText = () => {
    if (displayMode === 'compact') {
      // 紧凑模式：只显示基本信息
      return result.displayText;
    }
    
    if (displayMode === 'mobile') {
      // 移动端模式：显示简化标签
      const label = config.showFullLabel ? t('rotation.label') : '🔄';
      return `${label} ${result.displayText}`;
    }
    
    // 桌面端模式：显示完整标签
    return `${t('rotation.label')}: ${result.displayText}`;
  };

  // 获取详细信息（仅在非紧凑模式下显示）
  const getDetailText = () => {
    if (!config.showDetails) return null;
    
    if (result.isPerfect) {
      return t('rotation.score.perfect');
    } else {
      return t('rotation.score.excess', { 
        count: result.excessRotations, 
        penalty: Math.abs(result.score) 
      });
    }
  };

  // 处理错误状态
  if (result.score === 0 && result.displayText === '计算错误') {
    return (
      <div className={`${config.containerClass} border-gray-200 bg-gray-50 ${className}`}>
        <AlertCircle className={`${config.iconSize} text-gray-500`} />
        <span className={`${config.textSize} text-gray-600`}>
          {t('common.error')}
        </span>
      </div>
    );
  }

  return (
    <div 
      className={`${config.containerClass} ${colors.container} ${styles.rotationScoreContainer} ${styles.rotationScoreAnimation} ${className}`}
      data-testid="rotation-score-display"
      role="status"
      aria-label={`${t('rotation.label')}: ${result.displayText}`}
    >
      {/* 图标 */}
      {showIcon && getIcon()}
      
      {/* 主要内容 */}
      <div className="flex-1 min-w-0">
        {/* 旋转信息 */}
        <div className={`${config.textSize} ${colors.text} ${styles.rotationText} font-medium`}>
          {getDisplayText()}
        </div>
        
        {/* 详细信息（仅在非紧凑模式下显示） */}
        {config.showDetails && getDetailText() && (
          <div className={`text-xs ${colors.text} opacity-75 mt-1`}>
            {getDetailText()}
          </div>
        )}
      </div>
      
      {/* 分数显示 */}
      {showScore && (
        <div className={`${config.scoreSize} ${colors.score} ${styles.rotationScore} font-bold`}>
          {formatScore(result.score)}
        </div>
      )}
    </div>
  );
};

/**
 * 旋转评分显示组件的简化版本
 * 用于在其他组件中快速集成
 */
export const SimpleRotationScoreDisplay: React.FC<{
  actualRotations: number;
  minRotations: number;
  className?: string;
}> = ({ actualRotations, minRotations, className }) => {
  return (
    <RotationScoreDisplay
      actualRotations={actualRotations}
      minRotations={minRotations}
      displayMode="compact"
      showIcon={false}
      className={className}
    />
  );
};

/**
 * 旋转评分卡片组件
 * 用于统计面板等场景
 */
export const RotationScoreCard: React.FC<{
  actualRotations: number;
  minRotations: number;
  className?: string;
}> = ({ actualRotations, minRotations, className }) => {
  const { t } = useTranslation();
  
  const result = React.useMemo(() => {
    return RotationEfficiencyCalculator.calculateScoreWithI18n(
      actualRotations,
      minRotations,
      t
    );
  }, [actualRotations, minRotations, t]);

  const cardColorClass = result.isPerfect 
    ? 'bg-yellow-50 border-yellow-200' 
    : 'bg-red-50 border-red-200';

  return (
    <div className={`rounded-lg p-4 border ${cardColorClass} ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">
          {t('rotation.label')}
        </h3>
        {result.isPerfect ? (
          <Trophy className="w-4 h-4 text-yellow-600" />
        ) : (
          <RotateCw className="w-4 h-4 text-red-600" />
        )}
      </div>
      
      <div className="space-y-1">
        <div className="text-lg font-bold text-gray-900">
          {result.displayText}
        </div>
        
        <div className={`text-sm font-medium ${result.isPerfect ? 'text-yellow-700' : 'text-red-700'}`}>
          {formatScore(result.score)} 分
        </div>
        
        <div className="text-xs text-gray-600">
          {result.isPerfect 
            ? t('rotation.score.perfect')
            : t('rotation.score.excess', { 
                count: result.excessRotations, 
                penalty: Math.abs(result.score) 
              })
          }
        </div>
      </div>
    </div>
  );
};

// 辅助函数：格式化分数显示
function formatScore(score: number): string {
  if (score > 0) return `+${score}`;
  return score.toString();
}

export default RotationScoreDisplay;