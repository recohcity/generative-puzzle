/**
 * useCanvas - Centralized canvas management hook (Refactored)
 * Now uses specialized hooks for better separation of concerns
 * Maintains backward compatibility while improving code organization
 */

import { RefObject } from 'react';
import { useCanvasSize } from './useCanvasSize';
import { useCanvasRefs } from './useCanvasRefs';
import { useCanvasEvents } from './useCanvasEvents';

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
  // Use specialized hooks for different responsibilities
  const { isInitialized } = useCanvasRefs({ containerRef, canvasRef, backgroundCanvasRef });
  const canvasSize = useCanvasSize();
  
  // Handle events with the initialization state
  useCanvasEvents({ isInitialized });

  return canvasSize;
};

// Re-export utility hooks for backward compatibility
export { useCanvasContext, useCanvasBounds } from './useCanvasSize';