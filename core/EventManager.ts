/**
 * EventManager - Centralized event handling system
 * Enhanced with canvas size change events and optimized event delegation
 * Provides unified event distribution with priority and performance controls
 */

interface EventSubscription {
  id: string;
  callback: (event: any) => void;
  priority: number;
  metadata?: {
    subscribeTime: number;
    executionCount: number;
    totalExecutionTime: number;
    lastExecutionTime: number;
  };
}

interface EventConfig {
  debounceMs?: number;
  throttleMs?: number;
  passive?: boolean;
  immediate?: boolean;
  maxExecutionTime?: number;
}

interface CustomEventData {
  type: string;
  data: any;
  timestamp: number;
  source?: string;
  // 扩展属性以支持各种事件类型
  viewportHeight?: number;
  windowHeight?: number;
  heightDiff?: number;
  isHidden?: boolean;
  online?: boolean;
  memoryPressure?: number;
  usedMemory?: number;
  totalMemory?: number;
}

interface CanvasSizeChangeEvent extends CustomEventData {
  type: 'canvasSizeChange';
  data: {
    previousSize: { width: number; height: number };
    currentSize: { width: number; height: number };
    source: 'ResizeObserver' | 'DeviceManager' | 'Manual';
  };
}

interface DeviceStateChangeEvent extends CustomEventData {
  type: 'deviceStateChange';
  data: {
    previousState: any;
    currentState: any;
    changes: string[];
  };
}

export class EventManager {
  private static instance: EventManager;
  private subscriptions: Map<string, EventSubscription[]> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private throttleTimers: Map<string, NodeJS.Timeout> = new Map();
  private lastThrottleCall: Map<string, number> = new Map();
  private isListening: Set<string> = new Set();
  private customEventQueue: CustomEventData[] = [];
  private isProcessingQueue: boolean = false;
  private performanceStats: Map<string, {
    totalEvents: number;
    averageExecutionTime: number;
    lastEventTime: number;
  }> = new Map();

  private constructor() {
    this.setupGlobalListeners();
  }

  public static getInstance(): EventManager {
    if (!EventManager.instance) {
      EventManager.instance = new EventManager();
    }
    return EventManager.instance;
  }

  private setupGlobalListeners(): void {
    if (typeof window === 'undefined') return;

    // Single resize listener for all components
    this.addNativeListener('resize', (event) => {
      this.handleEvent('resize', event);
    });

    // Single orientation change listener
    this.addNativeListener('orientationchange', (event) => {
      this.handleEvent('orientationchange', event);
    });

    // Touch event listeners for mobile optimization
    this.addNativeListener('touchstart', (event) => {
      this.handleEvent('touchstart', event);
    }, { passive: false });

    this.addNativeListener('touchmove', (event) => {
      this.handleEvent('touchmove', event);
    }, { passive: false });

    this.addNativeListener('touchend', (event) => {
      this.handleEvent('touchend', event);
    }, { passive: false });

    // Visibility change listener for performance optimization
    this.addNativeListener('visibilitychange', (event) => {
      this.handleEvent('visibilitychange', event);
    });

    // Focus/blur listeners for better event management
    this.addNativeListener('focus', (event) => {
      this.handleEvent('focus', event);
    });

    this.addNativeListener('blur', (event) => {
      this.handleEvent('blur', event);
    });

    // 🎯 移动端特殊场景支持
    this.setupMobileSpecificListeners();
  }

  /**
   * 🎯 设置移动端特殊场景的事件监听器
   * 解决真实的移动端适配问题
   */
  private setupMobileSpecificListeners(): void {
    // 1. 视口变化监听 - 处理地址栏显示/隐藏
    if (window.visualViewport) {
      this.addNativeListener('resize', (event) => {
        // 检测是否为视口变化（地址栏显示/隐藏）
        const isViewportChange = window.visualViewport && 
          (window.visualViewport.height !== window.innerHeight);
        
        if (isViewportChange) {
          this.handleEvent('viewportchange', {
            ...event,
            viewportHeight: window.visualViewport?.height || window.innerHeight,
            windowHeight: window.innerHeight,
            heightDiff: window.innerHeight - (window.visualViewport?.height || window.innerHeight)
          });
        }
      });
    }

    // 2. 页面可见性变化 - 处理多任务切换
    this.addNativeListener('visibilitychange', (event) => {
      const isHidden = document.hidden;
      this.handleEvent('multitaskswitch', {
        ...event,
        isHidden,
        timestamp: Date.now()
      });
    });

    // 3. 页面焦点变化 - 处理应用切换
    this.addNativeListener('pagehide', (event) => {
      this.handleEvent('appbackground', event);
    });

    this.addNativeListener('pageshow', (event) => {
      this.handleEvent('appforeground', event);
    });

    // 4. 网络状态变化监听
    if ('onLine' in navigator) {
      this.addNativeListener('online', (event) => {
        this.handleEvent('networkchange', {
          ...event,
          online: true,
          timestamp: Date.now()
        });
      });

      this.addNativeListener('offline', (event) => {
        this.handleEvent('networkchange', {
          ...event,
          online: false,
          timestamp: Date.now()
        });
      });
    }

    // 5. 设备内存压力监听（如果支持）
    if ('memory' in performance) {
      // 定期检查内存使用情况
      setInterval(() => {
        const memInfo = (performance as any).memory;
        if (memInfo) {
          const memoryPressure = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit;
          if (memoryPressure > 0.8) { // 内存使用超过80%
            this.handleEvent('memorypressure', {
              type: 'memorypressure',
              data: {},
              memoryPressure,
              usedMemory: memInfo.usedJSHeapSize,
              totalMemory: memInfo.jsHeapSizeLimit,
              timestamp: Date.now()
            });
          }
        }
      }, 5000); // 每5秒检查一次
    }
  }

  private addNativeListener(eventType: string, handler: EventListener, options?: AddEventListenerOptions): void {
    if (this.isListening.has(eventType)) return;
    
    window.addEventListener(eventType, handler, options);
    this.isListening.add(eventType);
  }

  private handleEvent(eventType: string, event: Event | CustomEventData): void {
    const startTime = performance.now();
    const subscriptions = this.subscriptions.get(eventType);
    
    if (!subscriptions || subscriptions.length === 0) return;

    // Sort by priority (higher priority first)
    const sortedSubscriptions = [...subscriptions].sort((a, b) => b.priority - a.priority);

    // Execute callbacks in priority order with performance tracking
    for (const subscription of sortedSubscriptions) {
      const callbackStartTime = performance.now();
      
      try {
        subscription.callback(event);
        
        // Update subscription metadata
        if (subscription.metadata) {
          subscription.metadata.executionCount++;
          const executionTime = performance.now() - callbackStartTime;
          subscription.metadata.totalExecutionTime += executionTime;
          subscription.metadata.lastExecutionTime = executionTime;
          
          // Warn about slow callbacks
          if (executionTime > 16) { // More than one frame
            console.warn(`Slow event callback for ${eventType}: ${executionTime.toFixed(2)}ms`);
          }
        }
      } catch (error) {
        console.error(`Error in event handler for ${eventType}:`, error);
      }
    }

    // Update performance stats
    const totalExecutionTime = performance.now() - startTime;
    this.updatePerformanceStats(eventType, totalExecutionTime);
  }

  public subscribe(
    eventType: string,
    callback: (event: any) => void,
    options: { priority?: number; config?: EventConfig } = {}
  ): () => void {
    const { priority = 0, config = {} } = options;
    const id = this.generateId();

    // Wrap callback with debounce/throttle if specified
    let wrappedCallback = callback;
    
    if (config.debounceMs) {
      wrappedCallback = this.debounce(callback, config.debounceMs, `${eventType}-${id}`);
    } else if (config.throttleMs) {
      wrappedCallback = this.throttle(callback, config.throttleMs, `${eventType}-${id}`);
    }

    const subscription: EventSubscription = {
      id,
      callback: wrappedCallback,
      priority,
      metadata: {
        subscribeTime: Date.now(),
        executionCount: 0,
        totalExecutionTime: 0,
        lastExecutionTime: 0
      }
    };

    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, []);
    }

    this.subscriptions.get(eventType)!.push(subscription);

    // Execute immediately if specified
    if (config.immediate) {
      try {
        callback(null);
      } catch (error) {
        console.error(`Error in immediate callback for ${eventType}:`, error);
      }
    }

    // Return unsubscribe function
    return () => {
      this.unsubscribe(eventType, id);
    };
  }

  private unsubscribe(eventType: string, id: string): void {
    const subscriptions = this.subscriptions.get(eventType);
    if (!subscriptions) return;

    const index = subscriptions.findIndex(sub => sub.id === id);
    if (index !== -1) {
      subscriptions.splice(index, 1);
    }

    // Clean up timers
    const timerKey = `${eventType}-${id}`;
    if (this.debounceTimers.has(timerKey)) {
      clearTimeout(this.debounceTimers.get(timerKey)!);
      this.debounceTimers.delete(timerKey);
    }
    if (this.throttleTimers.has(timerKey)) {
      clearTimeout(this.throttleTimers.get(timerKey)!);
      this.throttleTimers.delete(timerKey);
    }
    this.lastThrottleCall.delete(timerKey);
  }

  private debounce(func: Function, delay: number, key: string): (...args: any[]) => void {
    return (...args: any[]) => {
      const existingTimer = this.debounceTimers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        func.apply(this, args);
        this.debounceTimers.delete(key);
      }, delay);

      this.debounceTimers.set(key, timer);
    };
  }

  private throttle(func: Function, delay: number, key: string): (...args: any[]) => void {
    return (...args: any[]) => {
      const now = Date.now();
      const lastCall = this.lastThrottleCall.get(key) || 0;

      if (now - lastCall >= delay) {
        func.apply(this, args);
        this.lastThrottleCall.set(key, now);
      } else {
        // Schedule the call for later if not already scheduled
        if (!this.throttleTimers.has(key)) {
          const timer = setTimeout(() => {
            func.apply(this, args);
            this.lastThrottleCall.set(key, Date.now());
            this.throttleTimers.delete(key);
          }, delay - (now - lastCall));

          this.throttleTimers.set(key, timer);
        }
      }
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private updatePerformanceStats(eventType: string, executionTime: number): void {
    const stats = this.performanceStats.get(eventType) || {
      totalEvents: 0,
      averageExecutionTime: 0,
      lastEventTime: 0
    };

    stats.totalEvents++;
    stats.averageExecutionTime = (stats.averageExecutionTime * (stats.totalEvents - 1) + executionTime) / stats.totalEvents;
    stats.lastEventTime = executionTime;

    this.performanceStats.set(eventType, stats);

    // Warn about consistently slow events
    if (stats.averageExecutionTime > 10 && stats.totalEvents > 10) {
      console.warn(`Consistently slow event ${eventType}: avg ${stats.averageExecutionTime.toFixed(2)}ms`);
    }
  }

  // Performance monitoring and statistics
  public getPerformanceStats(): Map<string, {
    totalEvents: number;
    averageExecutionTime: number;
    lastEventTime: number;
  }> {
    return new Map(this.performanceStats);
  }

  public getSubscriptionStats(): {
    totalSubscriptions: number;
    subscriptionsByEvent: Map<string, number>;
    subscriptionsByPriority: Map<number, number>;
  } {
    let totalSubscriptions = 0;
    const subscriptionsByEvent = new Map<string, number>();
    const subscriptionsByPriority = new Map<number, number>();

    this.subscriptions.forEach((subs, eventType) => {
      totalSubscriptions += subs.length;
      subscriptionsByEvent.set(eventType, subs.length);
      
      subs.forEach(sub => {
        const count = subscriptionsByPriority.get(sub.priority) || 0;
        subscriptionsByPriority.set(sub.priority, count + 1);
      });
    });

    return {
      totalSubscriptions,
      subscriptionsByEvent,
      subscriptionsByPriority
    };
  }

  public getDetailedSubscriptionInfo(eventType: string): EventSubscription[] | null {
    const subscriptions = this.subscriptions.get(eventType);
    if (!subscriptions) return null;

    return subscriptions.map(sub => ({
      ...sub,
      metadata: sub.metadata ? {
        ...sub.metadata,
        averageExecutionTime: sub.metadata.executionCount > 0 
          ? sub.metadata.totalExecutionTime / sub.metadata.executionCount 
          : 0
      } : undefined
    }));
  }

  // Event queue management
  public getQueueStats(): {
    queueLength: number;
    isProcessing: boolean;
    pendingEventTypes: string[];
  } {
    return {
      queueLength: this.customEventQueue.length,
      isProcessing: this.isProcessingQueue,
      pendingEventTypes: [...new Set(this.customEventQueue.map(e => e.type))]
    };
  }

  public flushEventQueue(): void {
    if (this.isProcessingQueue) return;
    
    console.log(`🔄 强制刷新事件队列，待处理事件: ${this.customEventQueue.length}`);
    this.processCustomEventQueue();
  }

  public clearEventQueue(): void {
    console.log(`🧹 清空事件队列，丢弃 ${this.customEventQueue.length} 个待处理事件`);
    this.customEventQueue = [];
    this.isProcessingQueue = false;
  }

  // Custom event emission and handling
  public emit(eventType: string, data: any, source?: string): void {
    const customEvent: CustomEventData = {
      type: eventType,
      data,
      timestamp: Date.now(),
      source
    };

    // Add to queue for processing
    this.customEventQueue.push(customEvent);
    
    // Process queue if not already processing
    if (!this.isProcessingQueue) {
      this.processCustomEventQueue();
    }
  }

  private processCustomEventQueue(): void {
    if (this.customEventQueue.length === 0) return;

    this.isProcessingQueue = true;

    // Process events in next frame to avoid blocking
    const processEvents = () => {
      while (this.customEventQueue.length > 0) {
        const event = this.customEventQueue.shift()!;
        this.handleEvent(event.type, event);
      }
      
      this.isProcessingQueue = false;
      
      // Process any events that were added during processing
      if (this.customEventQueue.length > 0) {
        this.processCustomEventQueue();
      }
    };

    // 使用requestAnimationFrame（如果可用），否则使用setTimeout
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(processEvents);
    } else {
      setTimeout(processEvents, 0);
    }
  }

  // Canvas size change event handling
  public onCanvasSizeChange(
    callback: (event: CanvasSizeChangeEvent) => void,
    priority: number = 0,
    debounceMs: number = 50
  ): () => void {
    return this.subscribe('canvasSizeChange', callback, {
      priority,
      config: { debounceMs }
    });
  }

  public emitCanvasSizeChange(
    previousSize: { width: number; height: number },
    currentSize: { width: number; height: number },
    source: 'ResizeObserver' | 'DeviceManager' | 'Manual' = 'Manual'
  ): void {
    this.emit('canvasSizeChange', {
      previousSize,
      currentSize,
      source
    }, 'CanvasManager');
  }

  // Device state change event handling
  public onDeviceStateChange(
    callback: (event: DeviceStateChangeEvent) => void,
    priority: number = 0,
    debounceMs: number = 100
  ): () => void {
    return this.subscribe('deviceStateChange', callback, {
      priority,
      config: { debounceMs }
    });
  }

  public emitDeviceStateChange(
    previousState: any,
    currentState: any,
    changes: string[]
  ): void {
    this.emit('deviceStateChange', {
      previousState,
      currentState,
      changes
    }, 'DeviceManager');
  }

  // Utility methods for common event patterns
  public onResize(callback: (event: Event) => void, priority: number = 0, debounceMs: number = 200): () => void {
    return this.subscribe('resize', callback, {
      priority,
      config: { debounceMs }
    });
  }

  public onOrientationChange(callback: (event: Event) => void, priority: number = 0, debounceMs: number = 300): () => void {
    return this.subscribe('orientationchange', callback, {
      priority,
      config: { debounceMs }
    });
  }

  public onVisibilityChange(callback: (event: Event) => void, priority: number = 0): () => void {
    return this.subscribe('visibilitychange', callback, { priority });
  }

  public onFocus(callback: (event: Event) => void, priority: number = 0): () => void {
    return this.subscribe('focus', callback, { priority });
  }

  public onBlur(callback: (event: Event) => void, priority: number = 0): () => void {
    return this.subscribe('blur', callback, { priority });
  }

  public onTouch(
    eventType: 'touchstart' | 'touchmove' | 'touchend',
    callback: (event: TouchEvent) => void,
    priority: number = 0
  ): () => void {
    return this.subscribe(eventType, callback, { priority });
  }

  // 🎯 移动端特殊场景事件处理方法

  /**
   * 监听视口变化（地址栏显示/隐藏）
   */
  public onViewportChange(
    callback: (event: any) => void,
    priority: number = 0,
    debounceMs: number = 150
  ): () => void {
    return this.subscribe('viewportchange', callback, {
      priority,
      config: { debounceMs }
    });
  }

  /**
   * 监听多任务切换
   */
  public onMultitaskSwitch(
    callback: (event: any) => void,
    priority: number = 0
  ): () => void {
    return this.subscribe('multitaskswitch', callback, { priority });
  }

  /**
   * 监听应用前后台切换
   */
  public onAppBackground(callback: (event: Event) => void, priority: number = 0): () => void {
    return this.subscribe('appbackground', callback, { priority });
  }

  public onAppForeground(callback: (event: Event) => void, priority: number = 0): () => void {
    return this.subscribe('appforeground', callback, { priority });
  }

  /**
   * 监听网络状态变化
   */
  public onNetworkChange(
    callback: (event: any) => void,
    priority: number = 0
  ): () => void {
    return this.subscribe('networkchange', callback, { priority });
  }

  /**
   * 监听内存压力
   */
  public onMemoryPressure(
    callback: (event: any) => void,
    priority: number = 0
  ): () => void {
    return this.subscribe('memorypressure', callback, { priority });
  }

  /**
   * 🎯 移动端键盘检测
   * 通过视口高度变化检测虚拟键盘的显示/隐藏
   */
  public detectKeyboardState(): {
    isVisible: boolean;
    height: number;
  } {
    if (typeof window === 'undefined') {
      return { isVisible: false, height: 0 };
    }

    // 如果没有visualViewport API，使用window尺寸作为fallback
    if (!window.visualViewport) {
      return { isVisible: false, height: 0 };
    }

    const heightDiff = window.innerHeight - window.visualViewport.height;
    const isVisible = heightDiff > 150; // 键盘高度通常大于150px
    
    return {
      isVisible,
      height: isVisible ? heightDiff : 0
    };
  }

  /**
   * 🎯 获取设备性能等级
   * 基于设备内存和硬件并发数
   */
  public getDevicePerformanceLevel(): 'low' | 'medium' | 'high' {
    if (typeof navigator === 'undefined') return 'medium';

    const memory = (navigator as any).deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;

    if (memory >= 8 && cores >= 8) return 'high';
    if (memory >= 4 && cores >= 4) return 'medium';
    return 'low';
  }

  /**
   * 🎯 检测设备方向锁定状态
   */
  public async checkOrientationLock(): Promise<{
    isLocked: boolean;
    currentOrientation: string;
    supportedOrientations: string[];
  }> {
    if (typeof screen === 'undefined' || !screen.orientation) {
      return {
        isLocked: false,
        currentOrientation: 'unknown',
        supportedOrientations: []
      };
    }

    try {
      const orientation = screen.orientation;
      return {
        isLocked: false, // 无法直接检测锁定状态
        currentOrientation: orientation.type,
        supportedOrientations: ['portrait-primary', 'portrait-secondary', 'landscape-primary', 'landscape-secondary']
      };
    } catch (error) {
      return {
        isLocked: false,
        currentOrientation: 'unknown',
        supportedOrientations: []
      };
    }
  }

  // Clean up all subscriptions and timers
  public destroy(): void {
    console.log('🧹 销毁EventManager，清理所有资源');
    
    // Clear all timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.throttleTimers.forEach(timer => clearTimeout(timer));
    
    // Clear event queue
    this.clearEventQueue();
    
    // Clear all data structures
    this.subscriptions.clear();
    this.debounceTimers.clear();
    this.throttleTimers.clear();
    this.lastThrottleCall.clear();
    this.performanceStats.clear();

    // Remove native listeners
    if (typeof window !== 'undefined') {
      this.isListening.forEach(eventType => {
        // Note: We can't remove the specific handlers without keeping references
        // This is a limitation of the current design
      });
    }
    this.isListening.clear();
  }
}