/**
 * 事件管理器
 * 统一管理事件监听器，防止内存泄漏
 */

interface EventListener {
  element: EventTarget;
  event: string;
  handler: EventListener;
  options?: boolean | AddEventListenerOptions;
}

export class EventManager {
  private static instance: EventManager;
  private listeners: Map<string, EventListener> = new Map();
  private listenerCounter = 0;

  private constructor() {}

  static getInstance(): EventManager {
    if (!EventManager.instance) {
      EventManager.instance = new EventManager();
    }
    return EventManager.instance;
  }

  /**
   * 添加事件监听器
   */
  addEventListener(
    element: EventTarget,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ): string {
    const id = `listener_${++this.listenerCounter}`;
    
    element.addEventListener(event, handler, options);
    
    this.listeners.set(id, {
      element,
      event,
      handler,
      options
    });

    return id;
  }

  /**
   * 移除特定事件监听器
   */
  removeEventListener(id: string): boolean {
    const listener = this.listeners.get(id);
    if (!listener) return false;

    listener.element.removeEventListener(
      listener.event,
      listener.handler,
      listener.options
    );

    return this.listeners.delete(id);
  }

  /**
   * 移除元素的所有事件监听器
   */
  removeAllListenersForElement(element: EventTarget): number {
    let removedCount = 0;
    
    for (const [id, listener] of this.listeners.entries()) {
      if (listener.element === element) {
        listener.element.removeEventListener(
          listener.event,
          listener.handler,
          listener.options
        );
        this.listeners.delete(id);
        removedCount++;
      }
    }

    return removedCount;
  }

  /**
   * 清除所有事件监听器
   */
  clearAllListeners(): void {
    for (const [id, listener] of this.listeners.entries()) {
      listener.element.removeEventListener(
        listener.event,
        listener.handler,
        listener.options
      );
    }
    this.listeners.clear();
  }

  /**
   * 获取当前监听器数量
   */
  getListenerCount(): number {
    return this.listeners.size;
  }

  /**
   * 创建防抖处理器
   */
  createDebouncedHandler<T extends (...args: any[]) => void>(
    handler: T,
    delay: number
  ): T {
    let timeoutId: NodeJS.Timeout;
    
    return ((...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => handler(...args), delay);
    }) as T;
  }

  /**
   * 创建节流处理器
   */
  createThrottledHandler<T extends (...args: any[]) => void>(
    handler: T,
    delay: number
  ): T {
    let lastCallTime = 0;
    
    return ((...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCallTime >= delay) {
        lastCallTime = now;
        handler(...args);
      }
    }) as T;
  }
}

export const eventManager = EventManager.getInstance();