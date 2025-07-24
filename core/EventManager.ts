/**
 * EventManager - Centralized event handling system
 * Eliminates redundant event listeners and provides optimized event delegation
 */

interface EventSubscription {
  id: string;
  callback: (event: any) => void;
  priority: number;
}

interface EventConfig {
  debounceMs?: number;
  throttleMs?: number;
  passive?: boolean;
}

export class EventManager {
  private static instance: EventManager;
  private subscriptions: Map<string, EventSubscription[]> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private throttleTimers: Map<string, NodeJS.Timeout> = new Map();
  private lastThrottleCall: Map<string, number> = new Map();
  private isListening: Set<string> = new Set();

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
  }

  private addNativeListener(eventType: string, handler: EventListener, options?: AddEventListenerOptions): void {
    if (this.isListening.has(eventType)) return;
    
    window.addEventListener(eventType, handler, options);
    this.isListening.add(eventType);
  }

  private handleEvent(eventType: string, event: Event): void {
    const subscriptions = this.subscriptions.get(eventType);
    if (!subscriptions || subscriptions.length === 0) return;

    // Sort by priority (higher priority first)
    const sortedSubscriptions = [...subscriptions].sort((a, b) => b.priority - a.priority);

    // Execute callbacks in priority order
    for (const subscription of sortedSubscriptions) {
      try {
        subscription.callback(event);
      } catch (error) {
        console.error(`Error in event handler for ${eventType}:`, error);
      }
    }
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
      priority
    };

    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, []);
    }

    this.subscriptions.get(eventType)!.push(subscription);

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

  public onTouch(
    eventType: 'touchstart' | 'touchmove' | 'touchend',
    callback: (event: TouchEvent) => void,
    priority: number = 0
  ): () => void {
    return this.subscribe(eventType, callback, { priority });
  }

  // Clean up all subscriptions and timers
  public destroy(): void {
    // Clear all timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.throttleTimers.forEach(timer => clearTimeout(timer));
    
    // Clear all data structures
    this.subscriptions.clear();
    this.debounceTimers.clear();
    this.throttleTimers.clear();
    this.lastThrottleCall.clear();

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