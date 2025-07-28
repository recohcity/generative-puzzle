/**
 * useCanvasSize - Specialized hook for canvas size management
 * Extracted from useCanvas to maintain single responsibility principle
 * Handles canvas size state and ResizeObserver integration
 */

import { useState, useEffect } from 'react';
import { useSystem } from '../SystemProvider';

interface CanvasSize {
  width: number;
  height: number;
}

export const useCanvasSize = (): CanvasSize => {
  const { canvasManager } = useSystem();
  const [canvasSize, setCanvasSize] = useState<CanvasSize>(() => canvasManager.getSize());

  // Subscribe to canvas size changes from ResizeObserver
  useEffect(() => {
    const unsubscribe = canvasManager.subscribe((state) => {
      setCanvasSize(state.size);
    });

    return unsubscribe;
  }, [canvasManager]);

  return canvasSize;
};

// Utility hook for canvas bounds checking
export const useCanvasBounds = () => {
  const { canvasManager } = useSystem();
  
  return {
    isPointInBounds: (x: number, y: number) => canvasManager.isPointInBounds(x, y),
    clampToBounds: (x: number, y: number) => canvasManager.clampToBounds(x, y),
    getBounds: () => canvasManager.getBounds(),
    screenToCanvas: (screenX: number, screenY: number) => canvasManager.screenToCanvas(screenX, screenY),
    canvasToScreen: (canvasX: number, canvasY: number) => canvasManager.canvasToScreen(canvasX, canvasY)
  };
};

// Utility hook for canvas context access
export const useCanvasContext = (type: 'main' | 'background' = 'main'): CanvasRenderingContext2D | null => {
  const { canvasManager } = useSystem();
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const ctx = canvasManager.getCanvasContext(type);
    setContext(ctx);
  }, [canvasManager, type]);

  return context;
};