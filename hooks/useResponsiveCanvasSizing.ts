import { useState, useEffect, useRef, RefObject } from "react";
import { useGame } from "@/contexts/GameContext"; // 导入 GameContext 的 useGame
import { useDeviceDetection } from "@/hooks/useDeviceDetection"; // 导入设备检测 Hook

// 定义 Hook 的 props 接口
interface UseResponsiveCanvasSizingProps {
  containerRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLCanvasElement>;
  backgroundCanvasRef: RefObject<HTMLCanvasElement>;
}

// 定义返回的画布尺寸类型
interface CanvasSize {
  width: number;
  height: number;
}

/**
 * 自定义 Hook，用于管理画布的响应式尺寸。
 * 根据容器尺寸和设备方向动态调整画布大小，并同步到 GameContext。
 */
export function useResponsiveCanvasSizing({
  containerRef,
  canvasRef,
  backgroundCanvasRef,
}: UseResponsiveCanvasSizingProps): CanvasSize {
  // 从 GameContext 获取更新画布尺寸的 dispatch 函数
  const { updateCanvasSize: updateGameContextCanvasSize } = useGame();
  // 使用设备检测 Hook 获取设备信息
  const { isMobile, isPortrait, isAndroid, screenWidth, screenHeight } = useDeviceDetection();

  // 存储画布尺寸的本地状态
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 0, height: 0 });
  // 用于窗口 resize 事件防抖的计时器引用
  const resizeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * 设置画布的初始尺寸。
   * 根据容器、设备类型和方向计算最佳尺寸。
   */
  const setInitialCanvasSize = () => {
    if (!canvasRef.current || !containerRef.current) {
      console.error("[useResponsiveCanvasSizing] 画布或容器引用不可用");
      return;
    }

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    console.log("[useResponsiveCanvasSizing] 容器尺寸:", containerWidth, "x", containerHeight);

    console.log(`[useResponsiveCanvasSizing] 设备信息 (from hook): 移动=${isMobile}, 竖屏=${isPortrait}, 屏幕=${screenWidth}x${screenHeight}`);

    let newWidth: number, newHeight: number;

    if (isMobile && isPortrait) {
      // 移动端竖屏，画布最大化填满容器（正方形），最小边距为1px
      const minDimension = Math.min(containerWidth, containerHeight);
      newWidth = Math.max(1, minDimension);
      newHeight = Math.max(1, minDimension);
      console.log("[useResponsiveCanvasSizing] 移动端竖屏，画布填满容器:", newWidth, "x", newHeight);
    } else if (isMobile && !isPortrait) {
      // 移动端横屏，画布最大化填满容器
      newWidth = Math.max(1, containerWidth);
      newHeight = Math.max(1, containerHeight);
      console.log("[useResponsiveCanvasSizing] 移动端横屏，画布填满容器:", newWidth, "x", newHeight);
    } else {
      // 平板/桌面，画布最大化填满容器
      newWidth = Math.max(1, containerWidth);
      newHeight = Math.max(1, containerHeight);
      console.log("[useResponsiveCanvasSizing] 桌面/平板，画布填满容器:", newWidth, "x", newHeight);
    }

    // 确保使用整数值避免渲染问题
    newWidth = Math.floor(newWidth);
    newHeight = Math.floor(newHeight);

    // 安全检查，确保尺寸不为0或负数
    if (newWidth <= 0) newWidth = 320;
    if (newHeight <= 0) newHeight = 320;

    // 设置画布 DOM 元素的尺寸
    canvasRef.current.width = newWidth;
    canvasRef.current.height = newHeight;

    // 同时设置背景画布尺寸（如果存在）
    if (backgroundCanvasRef.current) {
      backgroundCanvasRef.current.width = newWidth;
      backgroundCanvasRef.current.height = newHeight;
    }

    // 更新本地状态
    setCanvasSize({
      width: newWidth,
      height: newHeight,
    });

    // 更新 GameContext 中的画布尺寸，用于边界检查
    updateGameContextCanvasSize(newWidth, newHeight);

    console.log(`[useResponsiveCanvasSizing] 设置画布尺寸: ${newWidth}x${newHeight}`);
  };

  /**
   * 窗口大小调整事件处理函数，包含防抖逻辑。
   */
  const handleResize = () => {
    // 防抖动处理
    if (resizeTimer.current) {
      clearTimeout(resizeTimer.current);
    }
    resizeTimer.current = setTimeout(() => {
      setInitialCanvasSize(); // 重新计算并设置画布尺寸
      // 注意: updatePositions() 不再在此处调用，而是由 PuzzleCanvas 在 canvasSize 变化时触发。
    }, 200); // 200ms 防抖动
  };

  // Effect Hook：初始化画布尺寸并添加事件监听器
  useEffect(() => {
    console.log('[useResponsiveCanvasSizing] 初始化画布尺寸监听器');
    setInitialCanvasSize(); // 首次挂载时设置画布尺寸

    window.addEventListener('resize', handleResize); // 监听窗口 resize 事件

    // 添加一个延迟强制重新计算，以确保在所有 DOM 元素完全渲染后执行
    const timeoutId = setTimeout(() => {
      console.log('[useResponsiveCanvasSizing] 延迟后强制重新计算画布尺寸...');
      handleResize(); // 触发一次 resize 处理，确保尺寸正确

      // 对于移动设备，添加额外的计算延迟以确保获得正确的尺寸
      if (isMobile) {
        setTimeout(() => {
          console.log('[useResponsiveCanvasSizing] 移动设备额外尺寸检查...');
          setInitialCanvasSize(); // 使用初始化函数而不是 handleResize
        }, 500);
      }
    }, 300);

    // 清理函数：在组件卸载时移除事件监听器和清除计时器
    return () => {
      console.log('[useResponsiveCanvasSizing] 清理画布尺寸监听器');
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
      if (resizeTimer.current) {
        clearTimeout(resizeTimer.current);
      }
    };
  }, [isMobile, isPortrait, isAndroid, screenWidth, screenHeight]); // 依赖项：当这些设备状态变化时重新运行

  return canvasSize; // 返回当前的画布尺寸
} 