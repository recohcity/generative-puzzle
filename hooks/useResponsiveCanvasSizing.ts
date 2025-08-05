import { RefObject } from "react";
import { useState, useEffect } from "react";
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

// 定义 Hook 的 props 接口
interface UseResponsiveCanvasSizingProps {
  containerRef: RefObject<HTMLDivElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  backgroundCanvasRef: RefObject<HTMLCanvasElement>;
}

// 定义返回的画布尺寸类型
interface CanvasSize {
  width: number;
  height: number;
}

/**
 * useResponsiveCanvasSizing - 简化版本
 * 
 * ✅ 基于设备检测提供基础画布尺寸
 */
export function useResponsiveCanvasSizing({
  containerRef,
  canvasRef,
  backgroundCanvasRef,
}: UseResponsiveCanvasSizingProps): CanvasSize {
  const device = useDeviceDetection();
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({
    width: 400,
    height: 400
  });

  useEffect(() => {
    // 简化的尺寸计算
    const size = device.deviceType === 'phone' ? 300 : 400;
    setCanvasSize({ width: size, height: size });
  }, [device.deviceType]);

  return canvasSize;
} 