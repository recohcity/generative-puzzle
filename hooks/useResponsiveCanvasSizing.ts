import { RefObject } from "react";
import { useCanvas } from "@/providers/hooks";

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
 * useResponsiveCanvasSizing - 迁移到统一画布管理系统
 * 
 * ✅ 现在使用统一的画布管理系统，提供向后兼容性
 * 这个Hook现在是useCanvas的包装器，保持API兼容性
 */
export function useResponsiveCanvasSizing({
  containerRef,
  canvasRef,
  backgroundCanvasRef,
}: UseResponsiveCanvasSizingProps): CanvasSize {
  console.log('✅ [useResponsiveCanvasSizing] 使用统一画布管理系统');
  
  // 使用统一的画布管理系统
  const canvasSize = useCanvas({
    containerRef,
    canvasRef,
    backgroundCanvasRef,
  });

  // 统一画布管理系统会自动处理所有画布尺寸逻辑
  // 包括事件监听、防抖、设备检测等
  
  return canvasSize; // 返回当前的画布尺寸
} 