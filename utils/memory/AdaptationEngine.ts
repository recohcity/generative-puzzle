/**
 * 适配引擎 - 执行记忆读取、坐标清除和重新适配的核心逻辑
 * 
 * 这是记忆适配系统的核心组件，负责协调整个适配流程：
 * 1. 从记忆存储中读取形状数据
 * 2. 清除旧的坐标信息
 * 3. 应用适配规则生成新的坐标
 * 4. 验证适配结果
 */

import { CanvasSize } from '../../types/common';
import { 
  ShapeMemory, 
  CleanTopology, 
  AdaptedShape, 
  AdaptationHistory 
} from '../../types/memory';
import { MemoryStorage } from './MemoryStorage';
import { CoordinateCleaner } from './CoordinateCleaner';
import { AdaptationRuleEngine } from './AdaptationRuleEngine';
import { AdaptationContext } from './AdaptationRules';

/**
 * 适配错误类型枚举
 */
export enum AdaptationErrorType {
  MEMORY_NOT_FOUND = 'MEMORY_NOT_FOUND',
  INVALID_TOPOLOGY = 'INVALID_TOPOLOGY',
  ADAPTATION_FAILED = 'ADAPTATION_FAILED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  COORDINATE_CLEANING_FAILED = 'COORDINATE_CLEANING_FAILED'
}

/**
 * 适配错误类
 */
export class AdaptationError extends Error {
  constructor(
    public type: AdaptationErrorType,
    public shapeId: string,
    public context: AdaptationContext,
    message: string
  ) {
    super(message);
    this.name = 'AdaptationError';
  }
}

/**
 * 适配选项
 */
export interface AdaptationOptions {
  debugMode?: boolean;
  preserveAspectRatio?: boolean;
  centerShape?: boolean;
  validateResult?: boolean;
  timeout?: number; // 适配超时时间(ms)
}

/**
 * 适配引擎类
 */
export class AdaptationEngine {
  private memoryStorage: MemoryStorage;
  private coordinateCleaner: CoordinateCleaner;
  private ruleEngine: AdaptationRuleEngine;
  private adaptationHistory: AdaptationHistory[] = [];
  private debugMode: boolean = false;

  constructor(
    memoryStorage: MemoryStorage,
    coordinateCleaner: CoordinateCleaner,
    ruleEngine: AdaptationRuleEngine
  ) {
    this.memoryStorage = memoryStorage;
    this.coordinateCleaner = coordinateCleaner;
    this.ruleEngine = ruleEngine;
  }

  /**
   * 设置调试模式
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    this.ruleEngine.setDebugMode(enabled);
  }

  /**
   * 适配形状到新的画布尺寸
   */
  async adaptShape(
    shapeId: string,
    targetCanvas: CanvasSize,
    options: AdaptationOptions = {}
  ): Promise<AdaptedShape> {
    const startTime = performance.now();
    const adaptationId = this.generateAdaptationId();

    try {
      console.log(`🔧 [AdaptationEngine] 开始适配形状: ${shapeId}`);
      console.log(`🔧 [AdaptationEngine] 目标画布: ${targetCanvas.width}x${targetCanvas.height}`);

      // 第一步：读取记忆
      const memory = await this.readMemory(shapeId);
      
      // 第二步：清除坐标
      const cleanTopology = await this.clearCoordinates(memory);
      
      // 第三步：构建适配上下文
      const context: AdaptationContext = {
        sourceCanvas: memory.baseCanvasSize,
        targetCanvas,
        debugMode: options.debugMode ?? this.debugMode,
        preserveAspectRatio: options.preserveAspectRatio ?? true,
        centerShape: options.centerShape ?? true
      };

      // 第四步：应用适配规则
      const adaptedShape = await this.applyAdaptationRules(cleanTopology, context);
      
      // 第五步：验证适配结果
      if (options.validateResult !== false) {
        await this.validateAdaptation(adaptedShape, memory);
      }

      // 记录适配历史
      const processingTime = performance.now() - startTime;
      this.recordAdaptationHistory({
        adaptationId,
        memoryId: shapeId,
        sourceCanvas: memory.baseCanvasSize,
        targetCanvas,
        metrics: {
          ...adaptedShape.adaptationMetrics,
          processingTime
        },
        success: true,
        timestamp: Date.now()
      });

      if (this.debugMode) {
        console.log(`[AdaptationEngine] 适配成功完成，耗时: ${processingTime.toFixed(2)}ms`);
      }

      return adaptedShape;

    } catch (error) {
      const processingTime = performance.now() - startTime;
      
      // 记录失败的适配历史
      this.recordAdaptationHistory({
        adaptationId,
        memoryId: shapeId,
        sourceCanvas: { width: 0, height: 0 }, // 无法获取源画布信息
        targetCanvas,
        metrics: {
          scaleFactor: 0,
          centerOffset: { x: 0, y: 0 },
          boundaryFit: 0,
          fidelity: 0,
          processingTime
        },
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now()
      });

      if (this.debugMode) {
        console.error(`[AdaptationEngine] 适配失败:`, error);
      }

      throw error;
    }
  }

  /**
   * 从记忆存储中读取形状数据
   */
  private async readMemory(shapeId: string): Promise<ShapeMemory> {
    try {
      const memory = this.memoryStorage.retrieve(shapeId);
      
      if (!memory) {
        throw new AdaptationError(
          AdaptationErrorType.MEMORY_NOT_FOUND,
          shapeId,
          {} as AdaptationContext,
          `未找到形状记忆: ${shapeId}`
        );
      }

      // 验证记忆数据的完整性
      if (!memory.topology || !memory.topology.nodes || memory.topology.nodes.length === 0) {
        throw new AdaptationError(
          AdaptationErrorType.INVALID_TOPOLOGY,
          shapeId,
          {} as AdaptationContext,
          `形状记忆包含无效的拓扑结构: ${shapeId}`
        );
      }

      if (this.debugMode) {
        console.log(`[AdaptationEngine] 成功读取记忆，节点数: ${memory.topology.nodes.length}`);
      }

      return memory;
    } catch (error) {
      if (error instanceof AdaptationError) {
        throw error;
      }
      
      throw new AdaptationError(
        AdaptationErrorType.MEMORY_NOT_FOUND,
        shapeId,
        {} as AdaptationContext,
        `读取形状记忆时发生错误: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 清除旧的坐标信息
   */
  private async clearCoordinates(memory: ShapeMemory): Promise<CleanTopology> {
    try {
      const cleanTopology = this.coordinateCleaner.cleanFromTopology(memory.topology, memory.id);
      
      if (this.debugMode) {
        console.log(`[AdaptationEngine] 坐标清除完成，保留节点数: ${cleanTopology.nodes.length}`);
      }

      return cleanTopology;
    } catch (error) {
      throw new AdaptationError(
        AdaptationErrorType.COORDINATE_CLEANING_FAILED,
        memory.id,
        {} as AdaptationContext,
        `坐标清除失败: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 应用适配规则
   */
  private async applyAdaptationRules(
    cleanTopology: CleanTopology, 
    context: AdaptationContext
  ): Promise<AdaptedShape> {
    try {
      console.log(`🔧 [AdaptationEngine] 开始应用适配规则`);
      const adaptedShape = this.ruleEngine.applyRules(cleanTopology, context);
      
      console.log(`🔧 [AdaptationEngine] 规则应用完成，生成点数: ${adaptedShape.points.length}`);

      return adaptedShape;
    } catch (error) {
      console.error(`🔧 [AdaptationEngine] 规则应用失败:`, error);
      throw new AdaptationError(
        AdaptationErrorType.ADAPTATION_FAILED,
        cleanTopology.originalMemoryId,
        context,
        `适配规则应用失败: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 验证适配结果
   */
  private async validateAdaptation(adaptedShape: AdaptedShape, originalMemory: ShapeMemory): Promise<void> {
    try {
      // 使用规则引擎的验证方法
      const cleanTopology: CleanTopology = {
        nodes: originalMemory.topology.nodes,
        relationships: originalMemory.topology.relationships,
        boundingInfo: originalMemory.topology.boundingInfo,
        originalMemoryId: originalMemory.id
      };

      const isValid = this.ruleEngine.validateAdaptation(adaptedShape, cleanTopology);
      
      if (!isValid) {
        throw new AdaptationError(
          AdaptationErrorType.VALIDATION_FAILED,
          adaptedShape.shapeId,
          {} as AdaptationContext,
          '适配结果验证失败'
        );
      }

      if (this.debugMode) {
        console.log(`[AdaptationEngine] 适配结果验证通过`);
      }
    } catch (error) {
      if (error instanceof AdaptationError) {
        throw error;
      }
      
      throw new AdaptationError(
        AdaptationErrorType.VALIDATION_FAILED,
        adaptedShape.shapeId,
        {} as AdaptationContext,
        `适配结果验证时发生错误: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 记录适配历史
   */
  private recordAdaptationHistory(history: AdaptationHistory): void {
    this.adaptationHistory.push(history);
    
    // 限制历史记录数量，避免内存泄漏
    const maxHistorySize = 1000;
    if (this.adaptationHistory.length > maxHistorySize) {
      this.adaptationHistory = this.adaptationHistory.slice(-maxHistorySize);
    }
  }

  /**
   * 获取适配历史
   */
  getAdaptationHistory(shapeId?: string): AdaptationHistory[] {
    if (shapeId) {
      return this.adaptationHistory.filter(h => h.memoryId === shapeId);
    }
    return [...this.adaptationHistory];
  }

  /**
   * 清除适配历史
   */
  clearAdaptationHistory(shapeId?: string): void {
    if (shapeId) {
      this.adaptationHistory = this.adaptationHistory.filter(h => h.memoryId !== shapeId);
    } else {
      this.adaptationHistory = [];
    }
  }

  /**
   * 获取引擎状态信息
   */
  getEngineStatus() {
    return {
      memoryCount: this.memoryStorage.listAll().length,
      historyCount: this.adaptationHistory.length,
      ruleEngineInfo: this.ruleEngine.getEngineInfo(),
      debugMode: this.debugMode
    };
  }

  /**
   * 生成适配ID
   */
  private generateAdaptationId(): string {
    return `adaptation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 批量适配多个形状
   */
  async adaptMultipleShapes(
    shapeIds: string[],
    targetCanvas: CanvasSize,
    options: AdaptationOptions = {}
  ): Promise<{ success: AdaptedShape[], failed: { shapeId: string, error: Error }[] }> {
    const results = await Promise.allSettled(
      shapeIds.map(shapeId => this.adaptShape(shapeId, targetCanvas, options))
    );

    const success: AdaptedShape[] = [];
    const failed: { shapeId: string, error: Error }[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        success.push(result.value);
      } else {
        failed.push({
          shapeId: shapeIds[index],
          error: result.reason
        });
      }
    });

    return { success, failed };
  }
}