/**
 * CanvasManager - Centralized canvas management system
 * Consolidates canvas sizing, references, and coordination logic
 */

import { RefObject } from 'react';

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
  
  // Canvas size constraints from constants
  private readonly MIN_CANVAS_SIZE = 240;
  private readonly MAX_CANVAS_SIZE = 2560;

  private constructor() {
    this.currentState = this.getDefaultState();
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
    this.canvasRefs = refs;
  }

  public updateCanvasSize(width: number, height: number): void {
    // Apply size constraints
    const safeWidth = Math.max(this.MIN_CANVAS_SIZE, Math.min(width, this.MAX_CANVAS_SIZE));
    const safeHeight = Math.max(this.MIN_CANVAS_SIZE, Math.min(height, this.MAX_CANVAS_SIZE));

    const newSize = { width: safeWidth, height: safeHeight };
    const hasChanged = newSize.width !== this.currentState.size.width || 
                      newSize.height !== this.currentState.size.height;

    if (hasChanged) {
      const newState: CanvasState = {
        ...this.currentState,
        previousSize: { ...this.currentState.size },
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
}