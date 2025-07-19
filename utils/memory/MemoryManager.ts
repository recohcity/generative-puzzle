/**
 * 记忆管理器 - 拼图记忆适配系统的协调器
 * 
 * 这个类作为系统的中央协调器，负责：
 * 1. 集成记忆存储和适配引擎
 * 2. 管理记忆生命周期
 * 3. 提供事件发射和监听机制
 * 4. 协调形状生成、存储和适配的完整流程
 */

import { EventEmitter } from 'events';
import { Point, CanvasSize } from '../../types/common';
import { 
  ShapeMemory, 
  ShapeTopology, 
  AdaptedShape, 
  MemoryStatus,
  MemorySnapshot,
  AdaptationHistory
} from '../../types/memory';
import { MemoryStorage } from './MemoryStorage';
import { TopologyExtractor } from './TopologyExtractor';
import { CoordinateCleaner } from './CoordinateCleaner';
import { AdaptationRuleEngine } from './AdaptationRuleEngine';
import { AdaptationEngine, AdaptationOptions } from './AdaptationEngine';

/**
 * 记忆管理器配置选项
 */
export interface MemoryManagerConfig {
  /** 是否启用调试模式 */
  debugMode?: boolean;
  /** 是否启用自动清理 */
  autoCleanup?: boolean;
  /** 记忆过期时间（毫秒） */
  memoryExpirationTime?: number;
  /** 最大记忆数量 */
  maxMemoryCount?: number;
  /** 是否启用性能监控 */
  enablePerformanceMonitoring?: boolean;
}

/**
 * 记忆管理器事件类型
 */
export enum MemoryManagerEvent {
  MEMORY_CREATED = 'memory_created',
  MEMORY_UPDATED = 'memory_updated',
  MEMORY_DELETED = 'memory_deleted',
  ADAPTATION_STARTED = 'adaptation_started',
  ADAPTATION_COMPLETED = 'adaptation_completed',
  ADAPTATION_FAILED = 'adaptation_failed',
  CLEANUP_PERFORMED = 'cleanup_performed',
  ERROR_OCCURRED = 'error_occurred'
}

/**
 * 性能指标
 */
export interface PerformanceMetrics {
  totalMemories: number;
  totalAdaptations: number;
  averageAdaptationTime: number;
  successRate: number;
  memoryHitRate: number;
  lastCleanupTime: number;
}

/**
 * 记忆管理器类
 */
export class MemoryManager extends EventEmitter {
  private memoryStorage: MemoryStorage;
  private topologyExtractor: TopologyExtractor;
  private coordinateCleaner: CoordinateCleaner;
  private adaptationEngine: AdaptationEngine;
  private config: Required<MemoryManagerConfig>;
  private performanceMetrics: PerformanceMetrics;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: MemoryManagerConfig = {}) {
    super();
    
    // 设置默认配置
    this.config = {
      debugMode: false,
      autoCleanup: true,
      memoryExpirationTime: 24 * 60 * 60 * 1000, // 24小时
      maxMemoryCount: 1000,
      enablePerformanceMonitoring: true,
      ...config
    };

    // 初始化组件
    this.memoryStorage = new MemoryStorage();
    this.topologyExtractor = new TopologyExtractor();
    this.coordinateCleaner = new CoordinateCleaner();
    const ruleEngine = new AdaptationRuleEngine();
    this.adaptationEngine = new AdaptationEngine(
      this.memoryStorage,
      this.coordinateCleaner,
      ruleEngine
    );

    // 初始化性能指标
    this.performanceMetrics = {
      totalMemories: 0,
      totalAdaptations: 0,
      averageAdaptationTime: 0,
      successRate: 1.0,
      memoryHitRate: 1.0,
      lastCleanupTime: Date.now()
    };

    // 设置调试模式
    if (this.config.debugMode) {
      this.adaptationEngine.setDebugMode(true);
      console.log('[MemoryManager] 调试模式已启用');
    }

    // 启动自动清理
    if (this.config.autoCleanup) {
      this.startAutoCleanup();
    }

    console.log('🔧 [MemoryManager] 记忆管理器已初始化，调试模式:', this.config.debugMode);
  }

  /**
   * 从形状点数组创建形状记忆
   */
  async createShapeMemory(
    points: Point[], 
    canvasSize: CanvasSize,
    shapeId?: string
  ): Promise<string> {
    const startTime = performance.now();
    const memoryId = shapeId || this.generateMemoryId();

    try {
      if (this.config.debugMode) {
        console.log(`[MemoryManager] 开始创建形状记忆: ${memoryId}`);
        console.log(`[MemoryManager] 输入点数: ${points.length}, 画布: ${canvasSize.width}x${canvasSize.height}`);
      }

      // 1. 提取拓扑结构
      const topology = this.topologyExtractor.extractTopology(points, canvasSize);

      // 2. 存储记忆
      this.memoryStorage.store(memoryId, topology, canvasSize);

      // 3. 更新性能指标
      if (this.config.enablePerformanceMonitoring) {
        this.performanceMetrics.totalMemories++;
        this.updatePerformanceMetrics();
      }

      // 4. 发射事件
      this.emit(MemoryManagerEvent.MEMORY_CREATED, {
        memoryId,
        topology,
        canvasSize,
        processingTime: performance.now() - startTime
      });

      if (this.config.debugMode) {
        console.log(`[MemoryManager] 形状记忆创建成功: ${memoryId}, 耗时: ${(performance.now() - startTime).toFixed(2)}ms`);
      }

      return memoryId;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.emit(MemoryManagerEvent.ERROR_OCCURRED, {
        operation: 'createShapeMemory',
        memoryId,
        error: errorMessage,
        processingTime: performance.now() - startTime
      });

      if (this.config.debugMode) {
        console.error(`[MemoryManager] 形状记忆创建失败: ${memoryId}`, error);
      }

      throw new Error(`创建形状记忆失败: ${errorMessage}`);
    }
  }

  /**
   * 适配形状到新的画布尺寸
   */
  async adaptShapeToCanvas(
    shapeId: string, 
    newCanvasSize: CanvasSize,
    options: AdaptationOptions = {}
  ): Promise<AdaptedShape> {
    const startTime = performance.now();

    try {
      if (this.config.debugMode) {
        console.log(`[MemoryManager] 开始适配形状: ${shapeId} 到 ${newCanvasSize.width}x${newCanvasSize.height}`);
      }

      // 发射适配开始事件
      this.emit(MemoryManagerEvent.ADAPTATION_STARTED, {
        shapeId,
        targetCanvas: newCanvasSize,
        options
      });

      console.log(`🔧 [MemoryManager] 开始调用适配引擎`);
      
      // 执行适配
      const adaptedShape = await this.adaptationEngine.adaptShape(
        shapeId, 
        newCanvasSize, 
        {
          debugMode: this.config.debugMode,
          ...options
        }
      );
      
      console.log(`🔧 [MemoryManager] 适配引擎调用完成`);

      // 更新性能指标
      if (this.config.enablePerformanceMonitoring) {
        this.performanceMetrics.totalAdaptations++;
        const processingTime = performance.now() - startTime;
        this.updateAverageAdaptationTime(processingTime);
        this.updateSuccessRate(true);
      }

      // 发射适配完成事件
      this.emit(MemoryManagerEvent.ADAPTATION_COMPLETED, {
        shapeId,
        adaptedShape,
        processingTime: performance.now() - startTime
      });

      if (this.config.debugMode) {
        console.log(`[MemoryManager] 形状适配完成: ${shapeId}, 耗时: ${(performance.now() - startTime).toFixed(2)}ms`);
      }

      return adaptedShape;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // 更新性能指标
      if (this.config.enablePerformanceMonitoring) {
        this.performanceMetrics.totalAdaptations++;
        this.updateSuccessRate(false);
      }

      // 发射适配失败事件
      this.emit(MemoryManagerEvent.ADAPTATION_FAILED, {
        shapeId,
        targetCanvas: newCanvasSize,
        error: errorMessage,
        processingTime: performance.now() - startTime
      });

      if (this.config.debugMode) {
        console.error(`[MemoryManager] 形状适配失败: ${shapeId}`, error);
      }

      throw error;
    }
  }

  /**
   * 获取记忆状态
   */
  getMemoryStatus(shapeId: string): MemoryStatus | null {
    try {
      const memory = this.memoryStorage.retrieve(shapeId);
      if (!memory) {
        return null;
      }

      const status = this.memoryStorage.getMemoryStatus(shapeId);
      return status;

    } catch (error) {
      if (this.config.debugMode) {
        console.error(`[MemoryManager] 获取记忆状态失败: ${shapeId}`, error);
      }
      return null;
    }
  }

  /**
   * 获取记忆快照
   */
  getMemorySnapshot(shapeId: string): MemorySnapshot | null {
    try {
      const memory = this.memoryStorage.retrieve(shapeId);
      if (!memory) {
        return null;
      }

      const status = this.getMemoryStatus(shapeId);
      if (!status) {
        return null;
      }

      const adaptationHistory = this.adaptationEngine.getAdaptationHistory(shapeId);

      return {
        memory,
        status,
        relatedAdaptations: [], // 这里可以根据需要添加相关的适配结果
        capturedAt: Date.now()
      };

    } catch (error) {
      if (this.config.debugMode) {
        console.error(`[MemoryManager] 获取记忆快照失败: ${shapeId}`, error);
      }
      return null;
    }
  }

  /**
   * 删除形状记忆
   */
  deleteShapeMemory(shapeId: string): boolean {
    try {
      const success = this.memoryStorage.clear(shapeId);
      
      if (success) {
        // 清除相关的适配历史
        this.adaptationEngine.clearAdaptationHistory(shapeId);
        
        // 发射删除事件
        this.emit(MemoryManagerEvent.MEMORY_DELETED, { shapeId });
        
        if (this.config.debugMode) {
          console.log(`[MemoryManager] 形状记忆已删除: ${shapeId}`);
        }
      }

      return success;

    } catch (error) {
      if (this.config.debugMode) {
        console.error(`[MemoryManager] 删除形状记忆失败: ${shapeId}`, error);
      }
      return false;
    }
  }

  /**
   * 获取所有记忆ID
   */
  getAllMemoryIds(): string[] {
    return this.memoryStorage.listAll().map(memory => memory.id);
  }

  /**
   * 获取性能指标
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * 获取适配历史
   */
  getAdaptationHistory(shapeId?: string): AdaptationHistory[] {
    return this.adaptationEngine.getAdaptationHistory(shapeId);
  }

  /**
   * 执行清理操作
   */
  performCleanup(): void {
    const startTime = Date.now();
    let cleanedCount = 0;

    try {
      const allMemories = this.memoryStorage.listAll();
      const now = Date.now();

      // 清理过期记忆
      for (const memory of allMemories) {
        const age = now - memory.timestamp;
        if (age > this.config.memoryExpirationTime) {
          if (this.deleteShapeMemory(memory.id)) {
            cleanedCount++;
          }
        }
      }

      // 如果记忆数量超过限制，清理最旧的记忆
      const remainingMemories = this.memoryStorage.listAll();
      if (remainingMemories.length > this.config.maxMemoryCount) {
        const sortedMemories = remainingMemories.sort((a, b) => a.timestamp - b.timestamp);
        const toDelete = sortedMemories.slice(0, remainingMemories.length - this.config.maxMemoryCount);
        
        for (const memory of toDelete) {
          if (this.deleteShapeMemory(memory.id)) {
            cleanedCount++;
          }
        }
      }

      this.performanceMetrics.lastCleanupTime = Date.now();

      // 发射清理事件
      this.emit(MemoryManagerEvent.CLEANUP_PERFORMED, {
        cleanedCount,
        processingTime: Date.now() - startTime
      });

      if (this.config.debugMode) {
        console.log(`[MemoryManager] 清理完成，删除了 ${cleanedCount} 个记忆，耗时: ${Date.now() - startTime}ms`);
      }

    } catch (error) {
      if (this.config.debugMode) {
        console.error('[MemoryManager] 清理操作失败', error);
      }
    }
  }

  /**
   * 销毁记忆管理器
   */
  destroy(): void {
    // 停止自动清理
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }

    // 清除所有事件监听器
    this.removeAllListeners();

    if (this.config.debugMode) {
      console.log('[MemoryManager] 记忆管理器已销毁');
    }
  }

  /**
   * 启动自动清理
   */
  private startAutoCleanup(): void {
    // 每小时执行一次清理
    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, 60 * 60 * 1000);

    if (this.config.debugMode) {
      console.log('[MemoryManager] 自动清理已启动');
    }
  }

  /**
   * 生成记忆ID
   */
  private generateMemoryId(): string {
    return `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 更新性能指标
   */
  private updatePerformanceMetrics(): void {
    // 这里可以添加更多的性能指标计算逻辑
  }

  /**
   * 更新平均适配时间
   */
  private updateAverageAdaptationTime(newTime: number): void {
    const totalAdaptations = this.performanceMetrics.totalAdaptations;
    const currentAverage = this.performanceMetrics.averageAdaptationTime;
    
    this.performanceMetrics.averageAdaptationTime = 
      (currentAverage * (totalAdaptations - 1) + newTime) / totalAdaptations;
  }

  /**
   * 更新成功率
   */
  private updateSuccessRate(success: boolean): void {
    const totalAdaptations = this.performanceMetrics.totalAdaptations;
    const currentSuccessRate = this.performanceMetrics.successRate;
    const currentSuccessCount = Math.round(currentSuccessRate * (totalAdaptations - 1));
    
    const newSuccessCount = success ? currentSuccessCount + 1 : currentSuccessCount;
    this.performanceMetrics.successRate = newSuccessCount / totalAdaptations;
  }

  /**
   * 事件监听器便捷方法
   */
  onMemoryCreated(callback: (data: any) => void): void {
    this.on(MemoryManagerEvent.MEMORY_CREATED, callback);
  }

  onMemoryUpdated(callback: (data: any) => void): void {
    this.on(MemoryManagerEvent.MEMORY_UPDATED, callback);
  }

  onMemoryDeleted(callback: (data: any) => void): void {
    this.on(MemoryManagerEvent.MEMORY_DELETED, callback);
  }

  onAdaptationStarted(callback: (data: any) => void): void {
    this.on(MemoryManagerEvent.ADAPTATION_STARTED, callback);
  }

  onAdaptationCompleted(callback: (data: any) => void): void {
    this.on(MemoryManagerEvent.ADAPTATION_COMPLETED, callback);
  }

  onAdaptationFailed(callback: (data: any) => void): void {
    this.on(MemoryManagerEvent.ADAPTATION_FAILED, callback);
  }

  onCleanupPerformed(callback: (data: any) => void): void {
    this.on(MemoryManagerEvent.CLEANUP_PERFORMED, callback);
  }

  onErrorOccurred(callback: (data: any) => void): void {
    this.on(MemoryManagerEvent.ERROR_OCCURRED, callback);
  }
}