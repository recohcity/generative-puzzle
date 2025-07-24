/**
 * useCanvas - Centralized canvas management hook
 * Replaces useResponsiveCanvasSizing.ts logic
 */

import { useState, useEffect, useRef, RefObject } from 'react';
import { useSystem } from '../SystemProvider';
import { calculateMobilePortraitCanvasSize, calculateMobileLandscapeCanvasSize } from '@/constants/canvasAdaptation';

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
  const { canvasManager, eventManager, deviceManager } = useSystem();
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

  // Handle container resize with device-aware sizing
  useEffect(() => {
    const updateCanvasSize = () => {
      const deviceState = deviceManager.getState();
      const { screenWidth, screenHeight, deviceType, layoutMode } = deviceState;

      let calculatedSize: CanvasSize;

      // 移动端使用容器尺寸，桌面端使用动态计算
      if (deviceType === 'phone') {
        // 移动端：使用容器的实际尺寸，这样布局组件可以控制画布大小
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const width = Math.round(rect.width);
        const height = Math.round(rect.height);

        if (width > 0 && height > 0) {
          calculatedSize = { width, height };
          console.log('📱 移动端画布尺寸 (使用容器尺寸):', {
            deviceType,
            layoutMode,
            containerSize: `${width}x${height}`,
            screenSize: `${screenWidth}x${screenHeight}`
          });
        } else {
          return;
        }
      } else {
        // 桌面端和平板使用原有逻辑
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const width = Math.round(rect.width);
        const height = Math.round(rect.height);

        if (width > 0 && height > 0) {
          calculatedSize = { width, height };
        } else {
          return;
        }
      }

      canvasManager.updateCanvasSize(calculatedSize.width, calculatedSize.height);
    };

    // Initial size calculation
    updateCanvasSize();
    isInitialized.current = true;

    // Subscribe to resize events with high priority
    const unsubscribeResize = eventManager.onResize(updateCanvasSize, 5, 200);

    // Subscribe to device changes - 修复横屏刷新问题
    const unsubscribeDevice = deviceManager.subscribe((newState) => {
      console.log('🔄 设备状态变化，重新计算画布尺寸:', {
        deviceType: newState.deviceType,
        layoutMode: newState.layoutMode,
        screenSize: `${newState.screenWidth}x${newState.screenHeight}`
      });
      // 延迟执行确保DOM更新完成
      setTimeout(() => {
        updateCanvasSize();
      }, 100);
    });

    // Additional check for mobile devices - 增加多次检查确保适配正确
    const timeoutId1 = setTimeout(() => {
      updateCanvasSize();
    }, 300);
    
    const timeoutId2 = setTimeout(() => {
      updateCanvasSize();
    }, 600);
    
    const timeoutId3 = setTimeout(() => {
      updateCanvasSize();
    }, 1000);

    // 监听页面可见性变化 - 修复横屏刷新问题
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('📄 页面重新可见，重新计算画布尺寸');
        setTimeout(() => {
          updateCanvasSize();
        }, 200);
      }
    };

    // 监听方向变化 - 修复横屏刷新问题
    const handleOrientationChange = () => {
      console.log('🔄 屏幕方向变化，重新计算画布尺寸');
      setTimeout(() => {
        deviceManager.updateState();
        updateCanvasSize();
      }, 300);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      unsubscribeResize();
      unsubscribeDevice();
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [canvasManager, eventManager, deviceManager, containerRef]);

  // ResizeObserver for container changes (only for desktop)
  useEffect(() => {
    const deviceState = deviceManager.getState();
    if (deviceState.deviceType !== 'desktop' || !containerRef.current || typeof ResizeObserver === 'undefined') return;

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
  }, [canvasManager, containerRef, deviceManager]);

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