/**
 * 内存管理工具类
 * 负责Canvas清理、事件监听器管理、对象引用释放
 */

export class MemoryManager {
  private static instance: MemoryManager;
  private cleanupTasks: (() => void)[] = [];
  private intervalId: NodeJS.Timeout | null = null;

  private constructor() {
    this.startPeriodicCleanup();
  }

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  /**
   * 清理Canvas内容
   */
  clearCanvas(canvas: HTMLCanvasElement | null) {
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // 重置Canvas状态
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  /**
   * 批量清理多个Canvas
   */
  clearMultipleCanvas(canvases: (HTMLCanvasElement | null)[]) {
    canvases.forEach(canvas => this.clearCanvas(canvas));
  }

  /**
   * 注册清理任务
   */
  registerCleanupTask(task: () => void) {
    this.cleanupTasks.push(task);
  }

  /**
   * 执行所有清理任务
   */
  executeCleanup() {
    this.cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        console.warn('清理任务执行失败:', error);
      }
    });
    this.cleanupTasks = [];
  }

  /**
   * 强制垃圾回收（如果可用）
   */
  forceGarbageCollection() {
    if ((window as any).gc) {
      (window as any).gc();
    }
  }

  /**
   * 获取当前内存使用情况
   */
  getMemoryUsage(): number {
    const memory = (performance as any).memory;
    if (memory) {
      return memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return -1;
  }

  /**
   * 启动定期清理
   */
  private startPeriodicCleanup() {
    // 每30秒执行一次清理
    this.intervalId = setInterval(() => {
      this.executeCleanup();
      this.forceGarbageCollection();
    }, 30000);
  }

  /**
   * 停止定期清理
   */
  stopPeriodicCleanup() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * 销毁管理器
   */
  destroy() {
    this.stopPeriodicCleanup();
    this.executeCleanup();
  }
}

export const memoryManager = MemoryManager.getInstance();