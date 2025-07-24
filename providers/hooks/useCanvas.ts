/**
 * useCanvas - Centralized canvas management hook
 * Replaces useResponsiveCanvasSizing.ts logic
 */

import { useState, useEffect, useRef, RefObject } from 'react';
import { useSystem } from '../SystemProvider';

interface CanvasHookProps {
  containerRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  backgroundCanvasRef: RefObject<HTMLCanvasElement | null>;
}

interface CanvasSize {
  width: number;
  height: number;
}

export const useCanvas = ({ containerRef, canvasRef, backgroundCanvasRef }: CanvasHookProps): CanvasSize => {
  const { canvasManager, eventManager } = useSystem();
  const [canvasSize, setCanvasSize] = useState<CanvasSize>(() => canvasManager.getSize());
  const isInitialized = useRef(false);

  // Set canvas references in the manager
  useEffect(() => {
    canvasManager.setCanvasRefs({
      main: canvasRef,
      background: backgroundCanvasRef,
      container: containerRef
    });
  }, [canvasManager, containerRef, canvasRef, backgroundCanvasRef]);

  // Subscribe to canvas size changes
  useEffect(() => {
    const unsubscribe = canvasManager.subscribe((state) => {
      setCanvasSize(state.size);
    });

    return unsubscribe;
  }, [canvasManager]);

  // Handle container resize
  useEffect(() => {
    const updateCanvasSize = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);

      if (width > 0 && height > 0) {
        canvasManager.updateCanvasSize(width, height);
      }
    };

    // Initial size calculation
    updateCanvasSize();
    isInitialized.current = true;

    // Subscribe to resize events with high priority
    const unsubscribeResize = eventManager.onResize(updateCanvasSize, 5, 200);

    // Additional check for mobile devices
    const timeoutId = setTimeout(() => {
      updateCanvasSize();
    }, 300);

    return () => {
      unsubscribeResize();
      clearTimeout(timeoutId);
    };
  }, [canvasManager, eventManager, containerRef]);

  // ResizeObserver for container changes
  useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === 'undefined') return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          canvasManager.updateCanvasSize(Math.round(width), Math.round(height));
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [canvasManager, containerRef]);

  return canvasSize;
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