/**
 * EventScheduler - 事件调度器
 * 替代setTimeout链，提供基于requestAnimationFrame的事件调度
 * 确保在下一帧或指定时机执行回调，而不是固定延时
 */

interface ScheduledTask {
  id: string;
  callback: () => void;
  priority: number;
  dependencies?: string[];
  delay?: number;
  maxRetries?: number;
  retryCount?: number;
}

interface TaskResult {
  id: string;
  success: boolean;
  error?: Error;
  executionTime: number;
}

export class EventScheduler {
  private static instance: EventScheduler;
  private pendingTasks: Map<string, ScheduledTask> = new Map();
  private completedTasks: Set<string> = new Set();
  private isScheduled: boolean = false;
  private frameId: number | null = null;
  private taskResults: TaskResult[] = [];

  private constructor() {}

  public static getInstance(): EventScheduler {
    if (!EventScheduler.instance) {
      EventScheduler.instance = new EventScheduler();
    }
    return EventScheduler.instance;
  }

  /**
   * 调度一个任务在下一帧执行
   */
  public scheduleNextFrame(
    id: string,
    callback: () => void,
    options: {
      priority?: number;
      dependencies?: string[];
      maxRetries?: number;
    } = {}
  ): void {
    const { priority = 0, dependencies = [], maxRetries = 3 } = options;

    const task: ScheduledTask = {
      id,
      callback,
      priority,
      dependencies,
      maxRetries,
      retryCount: 0
    };

    this.pendingTasks.set(id, task);
    this.scheduleExecution();
  }

  /**
   * 调度一个任务在指定延时后执行（但使用更智能的时机）
   */
  public scheduleDelayed(
    id: string,
    callback: () => void,
    delay: number,
    options: {
      priority?: number;
      dependencies?: string[];
      maxRetries?: number;
    } = {}
  ): void {
    const { priority = 0, dependencies = [], maxRetries = 3 } = options;

    // 使用requestAnimationFrame + setTimeout的组合
    // 确保在合适的时机执行，而不是盲目延时
    setTimeout(() => {
      this.scheduleNextFrame(id, callback, { priority, dependencies, maxRetries });
    }, delay);
  }

  /**
   * 调度一个任务在DOM更新后执行
   */
  public scheduleAfterDOMUpdate(
    id: string,
    callback: () => void,
    options: {
      priority?: number;
      dependencies?: string[];
      maxRetries?: number;
    } = {}
  ): void {
    // 使用双重requestAnimationFrame确保DOM更新完成
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.scheduleNextFrame(id, callback, options);
      });
    });
  }

  /**
   * 调度一个任务在设备状态稳定后执行
   */
  public scheduleAfterDeviceStateStable(
    id: string,
    callback: () => void,
    options: {
      priority?: number;
      dependencies?: string[];
      maxRetries?: number;
      stabilityDelay?: number;
    } = {}
  ): void {
    const { stabilityDelay = 50, ...scheduleOptions } = options;
    
    // 等待设备状态稳定
    this.scheduleDelayed(id, callback, stabilityDelay, scheduleOptions);
  }

  private scheduleExecution(): void {
    if (this.isScheduled) return;

    this.isScheduled = true;
    this.frameId = requestAnimationFrame(() => {
      this.executePendingTasks();
    });
  }

  private executePendingTasks(): void {
    const startTime = performance.now();
    const tasks = Array.from(this.pendingTasks.values());
    
    // 按优先级排序
    tasks.sort((a, b) => b.priority - a.priority);
    
    // 处理依赖关系
    const readyTasks = this.getReadyTasks(tasks);
    
    // 执行就绪的任务
    for (const task of readyTasks) {
      this.executeTask(task);
    }
    
    // 清理和重置
    this.isScheduled = false;
    this.frameId = null;
    
    // 如果还有待处理的任务，继续调度
    if (this.pendingTasks.size > 0) {
      this.scheduleExecution();
    }

    const executionTime = performance.now() - startTime;
    if (executionTime > 16) { // 超过一帧的时间
      console.warn(`EventScheduler execution time exceeded 16ms: ${executionTime.toFixed(2)}ms`);
    }
  }

  private getReadyTasks(tasks: ScheduledTask[]): ScheduledTask[] {
    return tasks.filter(task => {
      // 检查依赖是否都已完成
      return task.dependencies?.every(dep => this.completedTasks.has(dep)) ?? true;
    });
  }

  private executeTask(task: ScheduledTask): void {
    const startTime = performance.now();
    let success = false;
    let error: Error | undefined;

    try {
      task.callback();
      success = true;
      this.completedTasks.add(task.id);
      this.pendingTasks.delete(task.id);
    } catch (err) {
      error = err as Error;
      console.error(`Task ${task.id} failed:`, error);
      
      // 重试机制
      if (task.retryCount! < task.maxRetries!) {
        task.retryCount = (task.retryCount || 0) + 1;
        console.log(`Retrying task ${task.id} (attempt ${task.retryCount}/${task.maxRetries})`);
        // 任务保留在pendingTasks中，下次执行时会重试
      } else {
        console.error(`Task ${task.id} failed after ${task.maxRetries} retries`);
        this.pendingTasks.delete(task.id);
      }
    }

    const executionTime = performance.now() - startTime;
    
    // 记录任务结果
    const result: TaskResult = {
      id: task.id,
      success,
      error,
      executionTime
    };
    
    this.taskResults.push(result);
    
    // 保持结果历史在合理范围内
    if (this.taskResults.length > 100) {
      this.taskResults = this.taskResults.slice(-50);
    }
  }

  /**
   * 取消一个待处理的任务
   */
  public cancelTask(id: string): boolean {
    return this.pendingTasks.delete(id);
  }

  /**
   * 取消所有待处理的任务
   */
  public cancelAllTasks(): void {
    this.pendingTasks.clear();
    
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
      this.isScheduled = false;
    }
  }

  /**
   * 强制执行所有待处理的任务
   */
  public flushAllTasks(): void {
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
      this.isScheduled = false;
    }
    
    this.executePendingTasks();
  }

  /**
   * 获取调度器统计信息
   */
  public getStats(): {
    pendingTasks: number;
    completedTasks: number;
    recentResults: TaskResult[];
    averageExecutionTime: number;
    successRate: number;
  } {
    const recentResults = this.taskResults.slice(-20);
    const averageExecutionTime = recentResults.length > 0
      ? recentResults.reduce((sum, result) => sum + result.executionTime, 0) / recentResults.length
      : 0;
    
    const successRate = recentResults.length > 0
      ? recentResults.filter(result => result.success).length / recentResults.length
      : 1;

    return {
      pendingTasks: this.pendingTasks.size,
      completedTasks: this.completedTasks.size,
      recentResults,
      averageExecutionTime,
      successRate
    };
  }

  /**
   * 清理资源
   */
  public destroy(): void {
    this.cancelAllTasks();
    this.completedTasks.clear();
    this.taskResults = [];
  }
}