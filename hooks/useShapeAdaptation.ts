import { useEffect, useRef, useCallback } from 'react';
import { useGame } from '@/contexts/GameContext';
import { useShapeAdaptation as useUnifiedShapeAdaptation } from '@/providers/hooks';
import { Point } from '@/types/common';

/**
 * useShapeAdaptation - 迁移到统一适配系统
 * 
 * ✅ 现在使用统一的适配系统，提供向后兼容性
 */
export const useShapeAdaptation = (canvasSize: { width: number; height: number } | null) => {
  console.log('✅ [useShapeAdaptation] 使用统一适配系统');
  
  const { state, dispatch } = useGame();
  const isMountedRef = useRef(true);
  
  // 组件卸载时更新标志
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // 使用统一的形状适配系统
  useUnifiedShapeAdaptation(
    canvasSize,
    state.baseShape || [],
    state.baseCanvasSize,
    (adaptedShape: Point[]) => {
      if (!isMountedRef.current) return;
      
      console.log('✅ [useShapeAdaptation] 形状适配完成:', adaptedShape.length, '个点');
      dispatch({
        type: 'SET_ORIGINAL_SHAPE',
        payload: adaptedShape
      });
    }
  );
  
  // 保留适配函数用于向后兼容
  const adaptShape = useCallback(async () => {
    console.log('✅ [useShapeAdaptation.adaptShape] 使用统一适配系统自动处理');
    // 统一适配系统会自动处理，无需手动调用
  }, []);
  
  // 返回兼容的结构
  return { 
    adaptShape, 
    memoryManager: null,
    shapeMemoryId: null,
    isMemorySystemAvailable: true // 统一系统可用
  };
};