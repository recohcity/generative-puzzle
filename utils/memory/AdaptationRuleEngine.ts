/**
 * 适配规则引擎 - 协调和执行所有适配规则
 * 
 * 这个引擎负责管理适配规则的注册、排序和执行，
 * 将清理后的拓扑结构转换为完整的适配形状
 */

import { Point, CanvasSize } from '../../types/common';
import { CleanTopology, AdaptedShape, AdaptationMetrics } from '../../types/memory';
import { 
  AdaptationRule, 
  AdaptationContext,
  SizeScalingRule,
  CenteringRule,
  ProportionRule,
  BoundaryRule
} from './AdaptationRules';

/**
 * 适配规则引擎类
 */
export class AdaptationRuleEngine {
  private rules: AdaptationRule[] = [];
  private debugMode: boolean = false;

  constructor() {
    // 注册默认规则
    this.registerDefaultRules();
  }

  /**
   * 注册默认的适配规则
   */
  private registerDefaultRules(): void {
    this.addRule(new SizeScalingRule());
    this.addRule(new CenteringRule());
    this.addRule(new ProportionRule());
    this.addRule(new BoundaryRule());
  }

  /**
   * 添加新的适配规则
   */
  addRule(rule: AdaptationRule): void {
    // 检查是否已存在同名规则
    const existingIndex = this.rules.findIndex(r => r.name === rule.name);
    if (existingIndex >= 0) {
      this.rules[existingIndex] = rule; // 替换现有规则
    } else {
      this.rules.push(rule);
    }
    
    // 按优先级排序（优先级高的在前）
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 移除指定名称的规则
   */
  removeRule(ruleName: string): boolean {
    const index = this.rules.findIndex(rule => rule.name === ruleName);
    if (index >= 0) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 获取所有已注册的规则
   */
  getRules(): AdaptationRule[] {
    return [...this.rules];
  }

  /**
   * 设置调试模式
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  /**
   * 应用所有适用的规则，生成完整的适配形状
   */
  applyRules(topology: CleanTopology, context: AdaptationContext): AdaptedShape {
    const startTime = performance.now();
    
    console.log(`🔧 [AdaptationRuleEngine] 开始应用规则，拓扑节点数: ${topology.nodes.length}, 调试模式: ${this.debugMode}`);
    console.log(`🔧 [AdaptationRuleEngine] 源画布: ${context.sourceCanvas.width}x${context.sourceCanvas.height}`);
    console.log(`🔧 [AdaptationRuleEngine] 目标画布: ${context.targetCanvas.width}x${context.targetCanvas.height}`);

    // 初始化适配结果
    let adaptedShape: AdaptedShape = {
      shapeId: topology.originalMemoryId,
      points: [],
      canvasSize: context.targetCanvas,
      adaptationMetrics: {
        scaleFactor: 1.0,
        centerOffset: { x: 0, y: 0 },
        boundaryFit: 1.0,
        fidelity: 1.0,
        processingTime: 0
      },
      timestamp: Date.now(),
      sourceMemoryChecksum: ''
    };

    // 第一阶段：应用尺寸缩放规则
    const scalingResult = this.applyScalingRules(topology, context);
    if (scalingResult.points) {
      adaptedShape.points = scalingResult.points;
    }
    if (scalingResult.adaptationMetrics) {
      adaptedShape.adaptationMetrics = {
        ...adaptedShape.adaptationMetrics,
        ...scalingResult.adaptationMetrics
      };
    }

    // 第二阶段：应用位置调整规则（居中）
    const positionResult = this.applyPositionRules(adaptedShape, topology, context);
    adaptedShape = this.mergeAdaptationResults(adaptedShape, positionResult);

    // 第三阶段：应用约束规则（边界、比例等）
    const constraintResult = this.applyConstraintRules(adaptedShape, topology, context);
    adaptedShape = this.mergeAdaptationResults(adaptedShape, constraintResult);

    // 计算最终处理时间
    const processingTime = performance.now() - startTime;
    adaptedShape.adaptationMetrics.processingTime = processingTime;

    if (this.debugMode) {
      console.log(`[AdaptationRuleEngine] 适配完成，耗时: ${processingTime.toFixed(2)}ms`);
      console.log(`[AdaptationRuleEngine] 最终点数: ${adaptedShape.points.length}`);
      console.log(`[AdaptationRuleEngine] 适配指标:`, adaptedShape.adaptationMetrics);
    }

    return adaptedShape;
  }

  /**
   * 应用尺寸缩放相关规则
   */
  private applyScalingRules(topology: CleanTopology, context: AdaptationContext): Partial<AdaptedShape> {
    const scalingRules = this.rules.filter(rule => 
      rule.name.includes('Scaling') && rule.condition(context)
    );

    console.log(`🔧 找到 ${scalingRules.length} 个缩放规则:`, scalingRules.map(r => r.name));

    let result: Partial<AdaptedShape> = {};
    
    for (const rule of scalingRules) {
      console.log(`🔧 [AdaptationRuleEngine] 应用规则: ${rule.name}`);
      
      const ruleResult = rule.apply(topology, context);
      result = this.mergePartialResults(result, ruleResult);
    }

    return result;
  }

  /**
   * 应用位置调整相关规则
   */
  private applyPositionRules(currentShape: AdaptedShape, topology: CleanTopology, context: AdaptationContext): Partial<AdaptedShape> {
    const positionRules = this.rules.filter(rule => 
      rule.name.includes('Centering') && rule.condition(context)
    );

    let result: Partial<AdaptedShape> = {};
    
    for (const rule of positionRules) {
      if (this.debugMode) {
        console.log(`[AdaptationRuleEngine] 应用规则: ${rule.name}`);
      }
      
      const ruleResult = rule.apply(topology, context);
      result = this.mergePartialResults(result, ruleResult);
      
      // 如果有居中偏移，应用到当前点
      if (ruleResult.adaptationMetrics?.centerOffset) {
        const offset = ruleResult.adaptationMetrics.centerOffset;
        const centeredPoints = currentShape.points.map(point => ({
          x: point.x + offset.x,
          y: point.y + offset.y
        }));
        result.points = centeredPoints;
      }
    }

    return result;
  }

  /**
   * 应用约束相关规则
   */
  private applyConstraintRules(currentShape: AdaptedShape, topology: CleanTopology, context: AdaptationContext): Partial<AdaptedShape> {
    const constraintRules = this.rules.filter(rule => 
      (rule.name.includes('Boundary') || rule.name.includes('Proportion')) && 
      rule.condition(context)
    );

    let result: Partial<AdaptedShape> = {};
    
    for (const rule of constraintRules) {
      if (this.debugMode) {
        console.log(`[AdaptationRuleEngine] 应用规则: ${rule.name}`);
      }
      
      const ruleResult = rule.apply(topology, context);
      result = this.mergePartialResults(result, ruleResult);
    }

    return result;
  }

  /**
   * 合并两个部分适配结果
   */
  private mergePartialResults(base: Partial<AdaptedShape>, addition: Partial<AdaptedShape>): Partial<AdaptedShape> {
    const merged: Partial<AdaptedShape> = { ...base };

    if (addition.points) {
      merged.points = addition.points;
    }

    if (addition.adaptationMetrics) {
      merged.adaptationMetrics = {
        ...base.adaptationMetrics,
        ...addition.adaptationMetrics
      };
    }

    if (addition.canvasSize) {
      merged.canvasSize = addition.canvasSize;
    }

    return merged;
  }

  /**
   * 合并完整的适配结果
   */
  private mergeAdaptationResults(base: AdaptedShape, addition: Partial<AdaptedShape>): AdaptedShape {
    const merged: AdaptedShape = { ...base };

    if (addition.points) {
      merged.points = addition.points;
    }

    if (addition.adaptationMetrics) {
      merged.adaptationMetrics = {
        ...base.adaptationMetrics,
        ...addition.adaptationMetrics
      };
    }

    if (addition.canvasSize) {
      merged.canvasSize = addition.canvasSize;
    }

    return merged;
  }

  /**
   * 验证适配结果的有效性
   */
  validateAdaptation(adapted: AdaptedShape, original: CleanTopology): boolean {
    // 检查点数是否匹配
    if (adapted.points.length !== original.nodes.length) {
      if (this.debugMode) {
        console.warn(`[AdaptationRuleEngine] 点数不匹配: 适配后${adapted.points.length}, 原始${original.nodes.length}`);
      }
      return false;
    }

    // 检查是否有无效坐标
    const hasInvalidPoints = adapted.points.some(point => 
      !isFinite(point.x) || !isFinite(point.y)
    );
    
    if (hasInvalidPoints) {
      if (this.debugMode) {
        console.warn(`[AdaptationRuleEngine] 发现无效坐标`);
      }
      return false;
    }

    // 检查适配指标是否合理
    const metrics = adapted.adaptationMetrics;
    if (metrics.fidelity < 0 || metrics.fidelity > 1 ||
        metrics.boundaryFit < 0 || metrics.boundaryFit > 1) {
      if (this.debugMode) {
        console.warn(`[AdaptationRuleEngine] 适配指标超出有效范围`);
      }
      return false;
    }

    return true;
  }

  /**
   * 获取引擎状态信息
   */
  getEngineInfo() {
    return {
      rulesCount: this.rules.length,
      rules: this.rules.map(rule => ({
        name: rule.name,
        priority: rule.priority,
        description: rule.description
      })),
      debugMode: this.debugMode
    };
  }
}