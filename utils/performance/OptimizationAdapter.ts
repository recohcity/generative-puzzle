/**
 * 性能优化适配器
 * 提供安全的、非侵入式的性能优化集成
 * 确保不影响现有的适配和游戏逻辑
 */

import { memoryManager } from './MemoryManager';
import { renderOptimizer } from '../rendering/RenderOptimizer';
import { eventManager } from './EventManager';

interface OptimizationConfig {
  enableMemoryOptimization: boolean;
  enableRenderOptimization: boolean;
  enableEventOptimization: boolean;
  safeMode: boolean; // 安全模式：出错时自动降级
}

export class OptimizationAdapter {
  private static instance: OptimizationAdapter;
  private config: OptimizationConfig = {
    enableMemoryOptimization: true,
    enableRenderOptimization: false, // 默认关闭，需要手动启用
    enableEventOptimization: false,  // 默认关闭，需要手动启用
    safeMode: true
  };

  private constructor() {}

  static getInstance(): OptimizationAdapter {
    if (!OptimizationAdapter.instance) {
      OptimizationAdapter.instance = new OptimizationAdapter();
    }
    return OptimizationAdapter.instance;
  }

  /**
   * 安全地清理Canvas - 不会影响现有逻辑
   */
  safeCanvasCleanup(canvas: HTMLCanvasElement | null): boolean {
    if (!this.config.enableMemoryOptimization || !canvas) return false;
    
    try {
      memoryManager.clearCanvas(canvas);
      return true;
    } catch (error) {
      if (this.config.safeMode) {
        console.warn('Canvas清理失败，降级到原始方法:', error);
        // 降级到原始清理方法
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      return false;
    }
  }

  /**
   * 安全地执行内存清理 - 可选的额外优化
   */
  safeMemoryCleanup(): boolean {
    if (!this.config.enableMemoryOptimization) return false;
    
    try {
      memoryManager.executeCleanup();
      return true;
    } catch (error) {
      if (this.config.safeMode) {
        console.warn('内存清理失败:', error);
      }
      return false;
    }
  }

  /**
   * 获取内存使用情况 - 不影响现有逻辑
   */
  getMemoryUsage(): number {
    try {
      return memoryManager.getMemoryUsage();
    } catch (error) {
      console.warn('获取内存使用情况失败:', error);
      return -1;
    }
  }

  /**
   * 配置优化选项
   */
  configure(newConfig: Partial<OptimizationConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 获取当前配置
   */
  getConfig(): OptimizationConfig {
    return { ...this.config };
  }

  /**
   * 启用渲染优化（需要明确启用）
   */
  enableRenderOptimization() {
    this.config.enableRenderOptimization = true;
  }

  /**
   * 启用事件优化（需要明确启用）
   */
  enableEventOptimization() {
    this.config.enableEventOptimization = true;
  }

  /**
   * 安全模式：遇到错误时自动降级
   */
  enableSafeMode() {
    this.config.safeMode = true;
  }

  /**
   * 检查优化是否正常工作
   */
  healthCheck(): { status: 'healthy' | 'degraded' | 'error'; details: string[] } {
    const details: string[] = [];
    let status: 'healthy' | 'degraded' | 'error' = 'healthy';

    try {
      // 检查内存管理器
      if (this.config.enableMemoryOptimization) {
        const memUsage = memoryManager.getMemoryUsage();
        if (memUsage === -1) {
          details.push('内存监控不可用');
          status = 'degraded';
        } else {
          details.push(`内存使用: ${memUsage.toFixed(2)}MB`);
        }
      }

      // 检查渲染优化器
      if (this.config.enableRenderOptimization) {
        details.push('渲染优化已启用');
      }

      // 检查事件管理器
      if (this.config.enableEventOptimization) {
        const listenerCount = eventManager.getListenerCount();
        details.push(`事件监听器: ${listenerCount}个`);
      }

    } catch (error) {
      status = 'error';
      details.push(`健康检查失败: ${error}`);
    }

    return { status, details };
  }
}

export const optimizationAdapter = OptimizationAdapter.getInstance();