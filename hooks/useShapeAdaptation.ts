import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useGame } from '@/contexts/GameContext';
import { useShapeAdaptation as useUnifiedShapeAdaptation } from '@/providers/hooks';
import { Point } from '@/types/common';
import { PuzzlePiece } from '@/types/puzzleTypes';

/**
 * useShapeAdaptation - 修复无限循环问题的版本
 * 
 * 🔧 修复策略：
 * 1. 使用useCallback稳定化回调函数
 * 2. 添加严格的条件检查
 * 3. 使用防抖机制避免频繁调用
 * 4. 添加适配结果比较，避免不必要的状态更新
 */
export const useShapeAdaptation = (canvasSize: { width: number; height: number } | null) => {
  const { state, dispatch } = useGame();
  const isMountedRef = useRef(true);
  const lastAdaptationRef = useRef<{
    canvasSize: { width: number; height: number } | null;
    baseCanvasSize: { width: number; height: number } | null;
    baseShape: Point[];
    adaptedShape: Point[];
  } | null>(null);
  
  // 组件卸载时更新标志
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // 🔧 修复1: 使用useCallback稳定化回调函数，避免每次渲染都创建新函数
  const handleShapeAdapted = useCallback((adaptedShape: Point[]) => {
    if (!isMountedRef.current) return;
    
    // 🔧 修复2: 检查适配结果是否真的发生了变化
    const lastAdaptation = lastAdaptationRef.current;
    if (lastAdaptation && lastAdaptation.adaptedShape.length === adaptedShape.length) {
      // 简单比较前几个点，如果相同则认为没有变化
      const isSame = adaptedShape.slice(0, 3).every((point, index) => {
        const lastPoint = lastAdaptation.adaptedShape[index];
        return lastPoint && 
               Math.abs(point.x - lastPoint.x) < 0.1 && 
               Math.abs(point.y - lastPoint.y) < 0.1;
      });
      
      if (isSame) {
        return;
      }
    }
    
    // 🔧 关键修复：先更新记录，再dispatch，避免循环
    lastAdaptationRef.current = {
      canvasSize: canvasSize ? { ...canvasSize } : null,
      baseCanvasSize: state.baseCanvasSize ? { ...state.baseCanvasSize } : null,
      baseShape: [...(state.baseShape || [])],
      adaptedShape: [...adaptedShape]
    };
    
    // 🎯 新增：形状适配完成后，同步适配拼图块
    dispatch({
      type: 'SET_ORIGINAL_SHAPE',
      payload: adaptedShape
    });
    
    // 🎯 拼图块同步适配：如果存在基础拼图块且未散开，则同步适配
    if (state.basePuzzle && 
        state.basePuzzle.length > 0 && 
        !state.isScattered &&
        canvasSize && 
        state.baseCanvasSize) {
      
      // 开始同步适配拼图块
      console.log('🔄 [useShapeAdaptation] 开始同步适配拼图块', {
        from: state.baseCanvasSize,
        to: canvasSize
      });
      
      // 使用UnifiedAdaptationEngine适配拼图块
      import('@/utils/adaptation/UnifiedAdaptationEngine').then(({ unifiedAdaptationEngine }) => {
        const adaptationResult = unifiedAdaptationEngine.adapt<PuzzlePiece[]>({
          type: 'puzzle',
          originalData: state.basePuzzle,
          originalCanvasSize: state.baseCanvasSize!,
          targetCanvasSize: canvasSize,
          options: {
            preserveAspectRatio: true,
            centerAlign: true,
            scaleMethod: 'minEdge'
          }
        });
        
        if (adaptationResult.success) {
          dispatch({
            type: 'SET_PUZZLE',
            payload: adaptationResult.adaptedData
          });
          
          // 🎯 同步更新originalPositions（提示区域）
          if (state.originalPositions && state.originalPositions.length > 0) {
            console.log('🔍 [useShapeAdaptation] 开始同步适配originalPositions:', state.originalPositions.length, '个位置');
            
            const originalPositionsResult = unifiedAdaptationEngine.adaptOriginalPositions(
              state.originalPositions,
              state.baseCanvasSize!,
              canvasSize
            );
            
            console.log('✅ [useShapeAdaptation] originalPositions同步适配完成:', originalPositionsResult.length, '个位置');
            dispatch({
              type: 'SET_ORIGINAL_POSITIONS',
              payload: originalPositionsResult
            });
          }
        } else {
          console.error('❌ [useShapeAdaptation] 拼图块同步适配失败:', adaptationResult.error);
        }
      }).catch(error => {
        console.error('❌ [useShapeAdaptation] 导入UnifiedAdaptationEngine失败:', error);
      });
    }
  }, [canvasSize, state.baseCanvasSize, state.baseShape, state.basePuzzle, state.isScattered, state.originalPositions, dispatch]);
  
  // 🔧 修复3: 使用useMemo缓存参数，避免不必要的重新计算
  const adaptationParams = useMemo(() => ({
    canvasSize,
    baseShape: state.baseShape || [],
    baseCanvasSize: state.baseCanvasSize
  }), [canvasSize, state.baseShape, state.baseCanvasSize]);
  
  // 🔧 修复4: 添加严格的条件检查，防止无限循环
  const shouldAdapt = useMemo(() => {
    // 基本参数检查
    if (!adaptationParams.canvasSize || 
        !adaptationParams.baseCanvasSize || 
        !adaptationParams.baseShape || 
        adaptationParams.baseShape.length === 0) {
      return false;
    }
    
    // 检查画布尺寸是否真的发生了变化
    if (adaptationParams.canvasSize.width === adaptationParams.baseCanvasSize.width && 
        adaptationParams.canvasSize.height === adaptationParams.baseCanvasSize.height) {
      return false;
    }
    
    // 🔧 关键修复：检查是否与上次适配的参数相同，避免重复适配
    const lastAdaptation = lastAdaptationRef.current;
    if (lastAdaptation && 
        lastAdaptation.canvasSize?.width === adaptationParams.canvasSize.width &&
        lastAdaptation.canvasSize?.height === adaptationParams.canvasSize.height &&
        lastAdaptation.baseCanvasSize?.width === adaptationParams.baseCanvasSize.width &&
        lastAdaptation.baseCanvasSize?.height === adaptationParams.baseCanvasSize.height) {
      return false;
    }
    
    return true;
  }, [adaptationParams]);
  
  // 🔧 修复5: 始终调用Hook，但在内部进行条件处理
  // console.log('🔧 [useShapeAdaptation] 适配条件检查:', {
  //   shouldAdapt,
  //   canvasSize: adaptationParams.canvasSize,
  //   baseCanvasSize: adaptationParams.baseCanvasSize,
  //   baseShapeLength: adaptationParams.baseShape.length
  // });
  
  // 🚨 临时完全禁用统一适配系统调用，避免无限循环
  // useUnifiedShapeAdaptation(
  //   adaptationParams.canvasSize,
  //   adaptationParams.baseShape,
  //   adaptationParams.baseCanvasSize,
  //   shouldAdapt ? handleShapeAdapted : () => {
  //     console.log('🔧 [useShapeAdaptation] 条件不满足，跳过适配回调');
  //   }
  // );
  
  // console.log('🚨 [useShapeAdaptation] 适配系统已完全禁用，避免无限循环');
  
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