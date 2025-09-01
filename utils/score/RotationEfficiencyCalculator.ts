/**
 * 新的旋转效率计算器
 * 实现"完美旋转+500分，每超出1次-10分"的算法
 * 支持国际化显示文本生成和完整的错误处理
 */

// 旋转效率计算结果接口
export interface RotationEfficiencyResult {
  actualRotations: number;      // 实际旋转次数
  minRotations: number;         // 最小旋转次数
  isPerfect: boolean;           // 是否完美旋转
  excessRotations: number;      // 超出旋转次数
  score: number;                // 旋转效率分数
  displayText: string;          // 显示文本
  displayColor: string;         // 显示颜色
}

// 数据验证结果接口
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// 国际化翻译函数类型
export type TranslationFunction = (key: string, params?: Record<string, any>) => string;

/**
 * 旋转数据验证器
 * 提供完整的数据验证和错误处理
 */
export class RotationDataValidator {
  /**
   * 验证旋转数据的有效性
   */
  static validateRotationData(actualRotations: number, minRotations: number): ValidationResult {
    const errors: string[] = [];
    
    // 验证数据类型
    if (!Number.isInteger(actualRotations)) {
      errors.push('实际旋转次数必须为整数');
    }
    
    if (!Number.isInteger(minRotations)) {
      errors.push('最小旋转次数必须为整数');
    }
    
    // 验证数值范围
    if (actualRotations < 0) {
      errors.push('实际旋转次数不能为负数');
    }
    
    if (minRotations < 0) {
      errors.push('最小旋转次数不能为负数');
    }
    
    // 验证数值合理性
    if (actualRotations > 1000) {
      errors.push('实际旋转次数过大，可能存在数据错误');
    }
    
    if (minRotations > 100) {
      errors.push('最小旋转次数过大，可能存在数据错误');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * 验证翻译函数是否可用
   */
  static validateTranslationFunction(t: TranslationFunction): boolean {
    try {
      // 测试基本翻译键值
      const testResult = t('rotation.perfect');
      return typeof testResult === 'string' && testResult.length > 0;
    } catch (error) {
      console.warn('翻译函数验证失败:', error);
      return false;
    }
  }
}

/**
 * 旋转分数错误处理器
 * 提供统一的错误处理和降级方案
 */
export class RotationScoreErrorHandler {
  /**
   * 处理计算错误，返回安全的默认值
   */
  static handleCalculationError(error: Error, context: string): RotationEfficiencyResult {
    console.error(`旋转分数计算错误 (${context}):`, error);
    
    return {
      actualRotations: 0,
      minRotations: 0,
      isPerfect: false,
      excessRotations: 0,
      score: 0,
      displayText: '计算错误',
      displayColor: '#666666'
    };
  }
  
  /**
   * 处理显示错误，返回安全的显示文本
   */
  static handleDisplayError(error: Error, actualRotations: number, minRotations: number): string {
    console.error('旋转分数显示错误:', error);
    return `${actualRotations}/${minRotations}`;
  }
  
  /**
   * 处理翻译错误，返回默认文本
   */
  static handleTranslationError(error: Error, fallbackText: string): string {
    console.error('旋转分数翻译错误:', error);
    return fallbackText;
  }
}

/**
 * 新的旋转效率计算器
 * 核心算法：完美旋转+500分，每超出1次-10分
 */
export class RotationEfficiencyCalculator {
  // 算法常量
  private static readonly PERFECT_ROTATION_BONUS = 500;  // 完美旋转奖励
  private static readonly EXCESS_ROTATION_PENALTY = 10;  // 每次超出旋转的惩罚
  
  // 显示颜色常量
  private static readonly COLORS = {
    PERFECT: '#FFD700',    // 金色 - 完美旋转
    EXCESS: '#FF6B6B',     // 红色 - 超出旋转
    ERROR: '#666666'       // 灰色 - 错误状态
  };
  
  /**
   * 计算旋转效率分数（核心算法）
   * @param actualRotations 实际旋转次数
   * @param minRotations 最小旋转次数
   * @returns 旋转效率计算结果
   */
  static calculateScore(actualRotations: number, minRotations: number): RotationEfficiencyResult {
    try {
      // 数据验证
      const validation = RotationDataValidator.validateRotationData(actualRotations, minRotations);
      if (!validation.isValid) {
        throw new Error(`数据验证失败: ${validation.errors.join(', ')}`);
      }
      
      // 边界条件处理
      if (minRotations === 0 && actualRotations === 0) {
        // 特殊情况：不需要旋转且没有旋转
        return {
          actualRotations: 0,
          minRotations: 0,
          isPerfect: true,
          excessRotations: 0,
          score: this.PERFECT_ROTATION_BONUS,
          displayText: '0/0（完美）',
          displayColor: this.COLORS.PERFECT
        };
      }
      
      if (minRotations === 0 && actualRotations > 0) {
        // 特殊情况：不需要旋转但进行了旋转
        return {
          actualRotations,
          minRotations: 0,
          isPerfect: false,
          excessRotations: actualRotations,
          score: -actualRotations * this.EXCESS_ROTATION_PENALTY,
          displayText: `${actualRotations}/0（超出${actualRotations}）`,
          displayColor: this.COLORS.EXCESS
        };
      }
      
      // 核心算法逻辑
      const isPerfect = actualRotations === minRotations;
      
      if (isPerfect) {
        // 完美旋转：+500分
        return {
          actualRotations,
          minRotations,
          isPerfect: true,
          excessRotations: 0,
          score: this.PERFECT_ROTATION_BONUS,
          displayText: `${actualRotations}/${minRotations}（完美）`,
          displayColor: this.COLORS.PERFECT
        };
      } else {
        // 超出旋转：每次-10分
        const excessRotations = actualRotations - minRotations;
        const score = -excessRotations * this.EXCESS_ROTATION_PENALTY;
        
        return {
          actualRotations,
          minRotations,
          isPerfect: false,
          excessRotations,
          score,
          displayText: `${actualRotations}/${minRotations}（超出${excessRotations}）`,
          displayColor: this.COLORS.EXCESS
        };
      }
    } catch (error) {
      return RotationScoreErrorHandler.handleCalculationError(
        error as Error,
        'calculateScore'
      );
    }
  }
  
  /**
   * 计算旋转效率分数（支持国际化）
   * @param actualRotations 实际旋转次数
   * @param minRotations 最小旋转次数
   * @param t 翻译函数
   * @returns 旋转效率计算结果（包含国际化文本）
   */
  static calculateScoreWithI18n(
    actualRotations: number,
    minRotations: number,
    t: TranslationFunction
  ): RotationEfficiencyResult {
    try {
      // 验证翻译函数
      if (!RotationDataValidator.validateTranslationFunction(t)) {
        console.warn('翻译函数不可用，使用默认算法');
        return this.calculateScore(actualRotations, minRotations);
      }
      
      // 数据验证
      const validation = RotationDataValidator.validateRotationData(actualRotations, minRotations);
      if (!validation.isValid) {
        throw new Error(`数据验证失败: ${validation.errors.join(', ')}`);
      }
      
      // 边界条件处理
      if (minRotations === 0 && actualRotations === 0) {
        return {
          actualRotations: 0,
          minRotations: 0,
          isPerfect: true,
          excessRotations: 0,
          score: this.PERFECT_ROTATION_BONUS,
          displayText: this.formatDisplayTextWithI18n(0, 0, true, 0, t),
          displayColor: this.COLORS.PERFECT
        };
      }
      
      if (minRotations === 0 && actualRotations > 0) {
        return {
          actualRotations,
          minRotations: 0,
          isPerfect: false,
          excessRotations: actualRotations,
          score: -actualRotations * this.EXCESS_ROTATION_PENALTY,
          displayText: this.formatDisplayTextWithI18n(actualRotations, 0, false, actualRotations, t),
          displayColor: this.COLORS.EXCESS
        };
      }
      
      // 核心算法逻辑
      const isPerfect = actualRotations === minRotations;
      
      if (isPerfect) {
        // 完美旋转：+500分
        return {
          actualRotations,
          minRotations,
          isPerfect: true,
          excessRotations: 0,
          score: this.PERFECT_ROTATION_BONUS,
          displayText: this.formatDisplayTextWithI18n(actualRotations, minRotations, true, 0, t),
          displayColor: this.COLORS.PERFECT
        };
      } else {
        // 超出旋转：每次-10分
        const excessRotations = actualRotations - minRotations;
        const score = -excessRotations * this.EXCESS_ROTATION_PENALTY;
        
        return {
          actualRotations,
          minRotations,
          isPerfect: false,
          excessRotations,
          score,
          displayText: this.formatDisplayTextWithI18n(actualRotations, minRotations, false, excessRotations, t),
          displayColor: this.COLORS.EXCESS
        };
      }
    } catch (error) {
      return RotationScoreErrorHandler.handleCalculationError(
        error as Error,
        'calculateScoreWithI18n'
      );
    }
  }
  
  /**
   * 格式化显示文本（支持国际化）
   * @param actualRotations 实际旋转次数
   * @param minRotations 最小旋转次数
   * @param isPerfect 是否完美旋转
   * @param excessRotations 超出旋转次数
   * @param t 翻译函数
   * @returns 格式化的显示文本
   */
  private static formatDisplayTextWithI18n(
    actualRotations: number,
    minRotations: number,
    isPerfect: boolean,
    excessRotations: number,
    t: TranslationFunction
  ): string {
    try {
      if (isPerfect) {
        // 完美旋转格式：X/X（完美）
        const perfectText = t('rotation.perfect');
        return `${actualRotations}/${minRotations}（${perfectText}）`;
      } else {
        // 超出旋转格式：Y/X（多了Z次）
        const excessText = t('rotation.excess', { count: excessRotations });
        return `${actualRotations}/${minRotations}（${excessText}）`;
      }
    } catch (error) {
      return RotationScoreErrorHandler.handleDisplayError(
        error as Error,
        actualRotations,
        minRotations
      );
    }
  }
  
  /**
   * 获取旋转分数颜色
   * @param isPerfect 是否完美旋转
   * @returns 颜色值
   */
  static getRotationScoreColor(isPerfect: boolean): string {
    return isPerfect ? this.COLORS.PERFECT : this.COLORS.EXCESS;
  }
  
  /**
   * 格式化旋转显示（简化版本）
   * @param actualRotations 实际旋转次数
   * @param minRotations 最小旋转次数
   * @returns 格式化的显示文本
   */
  static formatRotationDisplay(actualRotations: number, minRotations: number): string {
    try {
      const validation = RotationDataValidator.validateRotationData(actualRotations, minRotations);
      if (!validation.isValid) {
        return `${actualRotations}/${minRotations}`;
      }
      
      const isPerfect = actualRotations === minRotations;
      
      if (isPerfect) {
        return `${actualRotations}/${minRotations}（完美）`;
      } else {
        const excessRotations = actualRotations - minRotations;
        return `${actualRotations}/${minRotations}（超出${excessRotations}）`;
      }
    } catch (error) {
      return RotationScoreErrorHandler.handleDisplayError(
        error as Error,
        actualRotations,
        minRotations
      );
    }
  }
  
  /**
   * 创建默认结果（用于错误情况）
   */
  static createDefaultResult(): RotationEfficiencyResult {
    return {
      actualRotations: 0,
      minRotations: 0,
      isPerfect: false,
      excessRotations: 0,
      score: 0,
      displayText: '无数据',
      displayColor: this.COLORS.ERROR
    };
  }
  
  /**
   * 批量计算多个旋转效率分数（性能优化）
   * @param rotationPairs 旋转次数对数组
   * @returns 计算结果数组
   */
  static calculateBatchScores(
    rotationPairs: Array<{ actualRotations: number; minRotations: number }>
  ): RotationEfficiencyResult[] {
    return rotationPairs.map(({ actualRotations, minRotations }) => 
      this.calculateScore(actualRotations, minRotations)
    );
  }
  
  /**
   * 获取算法统计信息（用于调试和监控）
   */
  static getAlgorithmStats(): {
    perfectBonus: number;
    excessPenalty: number;
    colors: typeof RotationEfficiencyCalculator.COLORS;
  } {
    return {
      perfectBonus: this.PERFECT_ROTATION_BONUS,
      excessPenalty: this.EXCESS_ROTATION_PENALTY,
      colors: this.COLORS
    };
  }
}

/**
 * 便捷函数：计算新的旋转分数
 * @param actualRotations 实际旋转次数
 * @param minRotations 最小旋转次数
 * @returns 旋转效率分数
 * @throws Error 当数据验证失败时抛出异常，用于触发降级机制
 */
export const calculateNewRotationScore = (
  actualRotations: number,
  minRotations: number
): number => {
  // 先进行数据验证，如果失败则抛出异常以触发降级机制
  const validation = RotationDataValidator.validateRotationData(actualRotations, minRotations);
  if (!validation.isValid) {
    throw new Error(`数据验证失败: ${validation.errors.join(', ')}`);
  }
  
  const result = RotationEfficiencyCalculator.calculateScore(actualRotations, minRotations);
  return result.score;
};

/**
 * 便捷函数：计算新的旋转分数（支持国际化）
 * @param actualRotations 实际旋转次数
 * @param minRotations 最小旋转次数
 * @param t 翻译函数
 * @returns 旋转效率计算结果
 */
export const calculateNewRotationScoreWithI18n = (
  actualRotations: number,
  minRotations: number,
  t: TranslationFunction
): RotationEfficiencyResult => {
  return RotationEfficiencyCalculator.calculateScoreWithI18n(actualRotations, minRotations, t);
};

/**
 * 便捷函数：格式化旋转显示
 * @param actualRotations 实际旋转次数
 * @param minRotations 最小旋转次数
 * @returns 格式化的显示文本
 */
export const formatNewRotationDisplay = (
  actualRotations: number,
  minRotations: number
): string => {
  return RotationEfficiencyCalculator.formatRotationDisplay(actualRotations, minRotations);
};

// 类型定义已在上面导出，这里不需要重复导出