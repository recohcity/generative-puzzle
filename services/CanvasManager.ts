/**
 * CanvasManager - Centralized canvas management system
 * Consolidates canvas sizing, references, and coordination logic
 * Enhanced with ResizeObserver integration to replace setTimeout chains
 */

import { RefObject } from 'react';
import { ResizeObserverManager } from './ResizeObserverManager';

interface CanvasRefs {
  main: RefObject<HTMLCanvasElement | null>;
  background: RefObject<HTMLCanvasElement | null>;
  container: RefObject<HTMLDivElement | null>;
}

interface CanvasSize {
  width: number;
  height: number;
}

interface CanvasBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

interface CanvasState {
  size: CanvasSize;
  previousSize: CanvasSize;
  bounds: CanvasBounds;
  scale: number;
  devicePixelRatio: number;
}

export class CanvasManager {
  private static instance: CanvasManager;
  private canvasRefs: CanvasRefs | null = null;
  private currentState: CanvasState;
  private listeners: Set<(state: CanvasState) => void> = new Set();
  private resizeObserverManager: ResizeObserverManager;
  private unsubscribeResize: (() => void) | null = null;
  
  // Canvas size constraints from constants
  private readonly MIN_CANVAS_SIZE = 240;
  private readonly MAX_CANVAS_SIZE = 2560;

  private constructor() {
    this.currentState = this.getDefaultState();
    this.resizeObserverManager = ResizeObserverManager.getInstance();
  }

  public static getInstance(): CanvasManager {
    if (!CanvasManager.instance) {
      CanvasManager.instance = new CanvasManager();
    }
    return CanvasManager.instance;
  }

  private getDefaultState(): CanvasState {
    return {
      size: { width: 800, height: 600 },
      previousSize: { width: 800, height: 600 },
      bounds: { minX: 0, minY: 0, maxX: 800, maxY: 600, width: 800, height: 600 },
      scale: 1,
      devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
    };
  }

  public setCanvasRefs(refs: CanvasRefs): void {
    // 清理之前的ResizeObserver订阅
    if (this.unsubscribeResize) {
      this.unsubscribeResize();
      this.unsubscribeResize = null;
    }

    this.canvasRefs = refs;

    // 为容器元素设置ResizeObserver
    if (refs.container.current) {
      this.setupResizeObserver(refs.container.current);
    }
  }

  /**
   * 设置ResizeObserver来监听容器尺寸变化
   * 替代setTimeout链，提供基于实际尺寸变化的事件触发机制
   */
  private setupResizeObserver(container: HTMLDivElement): void {
    console.log('🔍 设置ResizeObserver监听容器尺寸变化');

    this.unsubscribeResize = this.resizeObserverManager.observe(
      container,
      (entry) => {
        this.handleContainerResize(entry);
      },
      {
        priority: 10, // 高优先级
        debounceMs: 50, // 50ms防抖，确保响应时间<100ms
        immediate: true // 立即执行一次
      }
    );
  }

  /**
   * 处理容器尺寸变化事件
   * 基于实际的ResizeObserverEntry而不是固定延时
   */
  private handleContainerResize(entry: ResizeObserverEntry): void {
    const { width, height } = entry.contentRect;
    const startTime = performance.now();

    // 只有当尺寸有效时才更新
    if (width > 0 && height > 0) {
      const roundedWidth = Math.round(width);
      const roundedHeight = Math.round(height);

      console.log('📐 容器尺寸变化:', {
        from: `${this.currentState.size.width}×${this.currentState.size.height}`,
        to: `${roundedWidth}×${roundedHeight}`,
        timestamp: Date.now()
      });

      this.updateCanvasSize(roundedWidth, roundedHeight);

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      // 确保响应时间小于100ms
      if (responseTime > 100) {
        console.warn(`Canvas resize response time exceeded 100ms: ${responseTime.toFixed(2)}ms`);
      } else {
        console.log(`✅ Canvas resize completed in ${responseTime.toFixed(2)}ms`);
      }
    }
  }

  public updateCanvasSize(width: number, height: number): void {
    // Apply size constraints
    const safeWidth = Math.max(this.MIN_CANVAS_SIZE, Math.min(width, this.MAX_CANVAS_SIZE));
    const safeHeight = Math.max(this.MIN_CANVAS_SIZE, Math.min(height, this.MAX_CANVAS_SIZE));

    const newSize = { width: safeWidth, height: safeHeight };
    const hasChanged = newSize.width !== this.currentState.size.width || 
                      newSize.height !== this.currentState.size.height;

    if (hasChanged) {
      const previousSize = { ...this.currentState.size };
      
      const newState: CanvasState = {
        ...this.currentState,
        previousSize,
        size: newSize,
        bounds: {
          minX: 0,
          minY: 0,
          maxX: safeWidth,
          maxY: safeHeight,
          width: safeWidth,
          height: safeHeight
        }
      };

      this.currentState = newState;
      this.updateCanvasElements();
      this.notifyListeners();
      
      // Emit canvas size change event through EventManager
      const eventManager = require('./EventManager').EventManager.getInstance();
      eventManager.emitCanvasSizeChange(
        previousSize,
        newSize,
        'ResizeObserver'
      );
    }
  }

  private updateCanvasElements(): void {
    if (!this.canvasRefs) return;

    const { main, background } = this.canvasRefs;
    const { width, height } = this.currentState.size;

    // Update main canvas
    if (main.current) {
      main.current.width = width;
      main.current.height = height;
      main.current.style.width = '100%';
      main.current.style.height = '100%';
    }

    // Update background canvas
    if (background.current) {
      background.current.width = width;
      background.current.height = height;
      background.current.style.width = '100%';
      background.current.style.height = '100%';
    }
  }

  public getState(): CanvasState {
    return { ...this.currentState };
  }

  public getSize(): CanvasSize {
    return { ...this.currentState.size };
  }

  public getPreviousSize(): CanvasSize {
    return { ...this.currentState.previousSize };
  }

  public getBounds(): CanvasBounds {
    return { ...this.currentState.bounds };
  }

  public isPointInBounds(x: number, y: number): boolean {
    const { bounds } = this.currentState;
    return x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY;
  }

  public clampToBounds(x: number, y: number): { x: number; y: number } {
    const { bounds } = this.currentState;
    return {
      x: Math.max(bounds.minX, Math.min(x, bounds.maxX)),
      y: Math.max(bounds.minY, Math.min(y, bounds.maxY))
    };
  }

  public subscribe(listener: (state: CanvasState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentState));
  }

  // Utility methods for canvas operations
  public getCanvasContext(type: 'main' | 'background' = 'main'): CanvasRenderingContext2D | null {
    if (!this.canvasRefs) return null;
    
    const canvas = type === 'main' ? this.canvasRefs.main.current : this.canvasRefs.background.current;
    return canvas ? canvas.getContext('2d') : null;
  }

  public clearCanvas(type: 'main' | 'background' | 'both' = 'both'): void {
    const { width, height } = this.currentState.size;

    if (type === 'main' || type === 'both') {
      const ctx = this.getCanvasContext('main');
      if (ctx) {
        ctx.clearRect(0, 0, width, height);
      }
    }

    if (type === 'background' || type === 'both') {
      const ctx = this.getCanvasContext('background');
      if (ctx) {
        ctx.clearRect(0, 0, width, height);
      }
    }
  }

  // Coordinate transformation utilities
  public screenToCanvas(screenX: number, screenY: number): { x: number; y: number } {
    if (!this.canvasRefs?.container.current) {
      return { x: screenX, y: screenY };
    }

    const rect = this.canvasRefs.container.current.getBoundingClientRect();
    const { width, height } = this.currentState.size;
    
    return {
      x: ((screenX - rect.left) / rect.width) * width,
      y: ((screenY - rect.top) / rect.height) * height
    };
  }

  public canvasToScreen(canvasX: number, canvasY: number): { x: number; y: number } {
    if (!this.canvasRefs?.container.current) {
      return { x: canvasX, y: canvasY };
    }

    const rect = this.canvasRefs.container.current.getBoundingClientRect();
    const { width, height } = this.currentState.size;
    
    return {
      x: (canvasX / width) * rect.width + rect.left,
      y: (canvasY / height) * rect.height + rect.top
    };
  }

  /**
   * 强制刷新画布尺寸
   * 用于处理特殊情况下的尺寸同步问题
   */
  public forceRefresh(): void {
    if (!this.canvasRefs?.container.current) return;

    const rect = this.canvasRefs.container.current.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      console.log('🔄 强制刷新画布尺寸');
      this.updateCanvasSize(Math.round(rect.width), Math.round(rect.height));
    }
  }

  /**
   * 获取ResizeObserver性能统计信息
   */
  public getResizeObserverStats(): {
    observedElements: number;
    totalCallbacks: number;
    pendingDebounces: number;
    isSupported: boolean;
  } {
    return this.resizeObserverManager.getStats();
  }

  /**
   * 强制执行所有待处理的防抖回调
   * 用于需要立即响应的场景
   */
  public flushPendingResizes(): void {
    console.log('⚡ 强制执行待处理的尺寸变化回调');
    this.resizeObserverManager.flushAll();
  }

  /**
   * 清理资源
   * 在组件卸载时调用
   */
  public destroy(): void {
    console.log('🧹 清理CanvasManager资源');
    
    // 清理ResizeObserver订阅
    if (this.unsubscribeResize) {
      this.unsubscribeResize();
      this.unsubscribeResize = null;
    }

    // 清理监听器
    this.listeners.clear();

    // 清理画布引用
    this.canvasRefs = null;

    // 重置状态
    this.currentState = this.getDefaultState();
  }
}