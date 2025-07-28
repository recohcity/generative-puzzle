/**
 * useCanvasRefs - Specialized hook for canvas reference management
 * Extracted from useCanvas to maintain single responsibility principle
 * Handles canvas reference setup and ResizeObserver initialization
 */

import { useEffect, useRef, RefObject } from 'react';
import { useSystem } from '../SystemProvider';

interface CanvasHookProps {
  containerRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  backgroundCanvasRef: RefObject<HTMLCanvasElement | null>;
}

export const useCanvasRefs = ({ containerRef, canvasRef, backgroundCanvasRef }: CanvasHookProps) => {
  const { canvasManager } = useSystem();
  const isInitialized = useRef(false);

  // Set canvas references in the manager - this automatically sets up ResizeObserver
  useEffect(() => {
    canvasManager.setCanvasRefs({
      main: canvasRef,
      background: backgroundCanvasRef,
      container: containerRef
    });

    // Mark as initialized
    isInitialized.current = true;

    return () => {
      // Reset initialization state on cleanup
      isInitialized.current = false;
    };
  }, [canvasManager, containerRef, canvasRef, backgroundCanvasRef]);

  return {
    isInitialized: () => isInitialized.current
  };
};