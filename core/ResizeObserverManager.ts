/**
 * ResizeObserverManager - 统一的ResizeObserver管理系统
 * 替代setTimeout链，提供基于实际尺寸变化的事件触发机制
 */

interface ResizeCallback {
  id: string;
  callback: (entry: ResizeObserverEntry) => void;
  element: Element;
  priority: number;
  debounceMs?: number;
}

interface DebounceTimer {
  timer: NodeJS.Timeout;
  lastEntry: ResizeObserverEntry;
}

export class ResizeObserverManager {
  private static instance: ResizeObserverManager;
  private observer: ResizeObserver | null = null;
  private callbacks: Map<Element, ResizeCallback[]> = new Map();
  private debounceTimers: Map<string, DebounceTimer> = new Map();
  private isSupported: boolean;

  private constructor() {
    this.isSupported = typeof ResizeObserver !== 'undefined';
    
    if (this.isSupported) {
      this.observer = new ResizeObserver((entries) => {
        this.handleResize(entries);
      });
    } else {
      console.warn('ResizeObserver not supported, falling back to window resize events');
      this.setupFallback();
    }
  }

  public static getInstance(): ResizeObserverManager {
    if (!ResizeObserverManager.instance) {
      ResizeObserverManager.instance = new ResizeObserverManager();
    }
    return ResizeObserverManager.instance;
  }

  private handleResize(entries: ResizeObserverEntry[]): void {
    const startTime = performance.now();

    for (const entry of entries) {
      const callbacks = this.callbacks.get(entry.target);
      if (!callbacks || callbacks.length === 0) continue;

      // 按优先级排序执行
      const sortedCallbacks = [...callbacks].sort((a, b) => b.priority - a.priority);
      
      for (const callbackInfo of sortedCallbacks) {
        this.executeCallback(callbackInfo, entry);
      }
    }

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    // 确保响应时间小于100ms
    if (executionTime > 100) {
      console.warn(`ResizeObserver execution time exceeded 100ms: ${executionTime.toFixed(2)}ms`);
    }
  }

  private executeCallback(callbackInfo: ResizeCallback, entry: ResizeObserverEntry): void {
    const { id, callback, debounceMs = 50 } = callbackInfo;

    if (debounceMs > 0) {
      // 使用防抖机制
      this.debounceCallback(id, callback, entry, debounceMs);
    } else {
      // 立即执行
      try {
        callback(entry);
      } catch (error) {
        console.error(`ResizeObserver callback error for ${id}:`, error);
      }
    }
  }

  private debounceCallback(
    id: string,
    callback: (entry: ResizeObserverEntry) => void,
    entry: ResizeObserverEntry,
    debounceMs: number
  ): void {
    // 清除之前的定时器
    const existingTimer = this.debounceTimers.get(id);
    if (existingTimer) {
      clearTimeout(existingTimer.timer);
    }

    // 设置新的定时器
    const timer = setTimeout(() => {
      try {
        callback(entry);
      } catch (error) {
        console.error(`Debounced ResizeObserver callback error for ${id}:`, error);
      }
      this.debounceTimers.delete(id);
    }, debounceMs);

    this.debounceTimers.set(id, { timer, lastEntry: entry });
  }

  public observe(
    element: Element,
    callback: (entry: ResizeObserverEntry) => void,
    options: {
      priority?: number;
      debounceMs?: number;
      immediate?: boolean;
    } = {}
  ): () => void {
    const { priority = 0, debounceMs = 50, immediate = false } = options;
    const id = this.generateId();

    const callbackInfo: ResizeCallback = {
      id,
      callback,
      element,
      priority,
      debounceMs
    };

    // 添加到回调列表
    if (!this.callbacks.has(element)) {
      this.callbacks.set(element, []);
      
      // 开始观察元素
      if (this.observer) {
        this.observer.observe(element);
      }
    }

    this.callbacks.get(element)!.push(callbackInfo);

    // 立即执行一次（如果需要）
    if (immediate && element instanceof HTMLElement) {
      const rect = element.getBoundingClientRect();
      const mockEntry: ResizeObserverEntry = {
        target: element,
        contentRect: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          left: rect.left
        } as DOMRectReadOnly,
        borderBoxSize: [] as any,
        contentBoxSize: [] as any,
        devicePixelContentBoxSize: [] as any
      };

      // 延迟执行以避免同步问题
      setTimeout(() => {
        this.executeCallback(callbackInfo, mockEntry);
      }, 0);
    }

    // 返回取消监听函数
    return () => {
      this.unobserve(element, id);
    };
  }

  private unobserve(element: Element, id: string): void {
    const callbacks = this.callbacks.get(element);
    if (!callbacks) return;

    const index = callbacks.findIndex(cb => cb.id === id);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }

    // 清理防抖定时器
    const timer = this.debounceTimers.get(id);
    if (timer) {
      clearTimeout(timer.timer);
      this.debounceTimers.delete(id);
    }

    // 如果没有更多回调，停止观察
    if (callbacks.length === 0) {
      this.callbacks.delete(element);
      if (this.observer) {
        this.observer.unobserve(element);
      }
    }
  }

  private setupFallback(): void {
    // ResizeObserver不支持时的回退方案
    if (typeof window === 'undefined') return;

    let resizeTimer: NodeJS.Timeout;
    
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        // 为所有观察的元素触发回调
        this.callbacks.forEach((callbacks, element) => {
          if (element instanceof HTMLElement) {
            const rect = element.getBoundingClientRect();
            const mockEntry: ResizeObserverEntry = {
              target: element,
              contentRect: {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                top: rect.top,
                right: rect.right,
                bottom: rect.bottom,
                left: rect.left
              } as DOMRectReadOnly,
              borderBoxSize: [] as any,
              contentBoxSize: [] as any,
              devicePixelContentBoxSize: [] as any
            };

            callbacks.forEach(callbackInfo => {
              this.executeCallback(callbackInfo, mockEntry);
            });
          }
        });
      }, 100); // 100ms防抖
    });
  }

  private generateId(): string {
    return `resize_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 获取性能统计信息
  public getStats(): {
    observedElements: number;
    totalCallbacks: number;
    pendingDebounces: number;
    isSupported: boolean;
  } {
    let totalCallbacks = 0;
    this.callbacks.forEach(callbacks => {
      totalCallbacks += callbacks.length;
    });

    return {
      observedElements: this.callbacks.size,
      totalCallbacks,
      pendingDebounces: this.debounceTimers.size,
      isSupported: this.isSupported
    };
  }

  // 强制刷新所有防抖回调
  public flushAll(): void {
    this.debounceTimers.forEach(({ timer, lastEntry }, id) => {
      clearTimeout(timer);
      
      // 找到对应的回调并执行
      for (const [element, callbacks] of this.callbacks.entries()) {
        const callback = callbacks.find(cb => cb.id === id);
        if (callback) {
          try {
            callback.callback(lastEntry);
          } catch (error) {
            console.error(`Flushed callback error for ${id}:`, error);
          }
          break;
        }
      }
    });
    
    this.debounceTimers.clear();
  }

  // 清理所有资源
  public destroy(): void {
    // 清理所有防抖定时器
    this.debounceTimers.forEach(({ timer }) => {
      clearTimeout(timer);
    });
    this.debounceTimers.clear();

    // 断开观察器
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    // 清理回调
    this.callbacks.clear();
  }
}