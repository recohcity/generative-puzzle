import { useEffect, useRef, useCallback, useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { adaptShapeToCanvas, CanvasSize } from '@/utils/shape/shapeAdaptationUtils';
import { MemoryManager } from '@/utils/memory/MemoryManager';
import { Point } from '@/types/common';
import { 
  calculateShapeTransformation, 
  adaptPuzzlePiecesToShape, 
  safeAdaptPuzzlePieces,
  adaptPuzzlePiecesAbsolute
} from '@/utils/puzzlePieceAdaptationUtils';

/**
 * useShapeAdaptation - 基于记忆适配系统的形状适配Hook
 * 
 * 新的适配流程（基于记忆系统）：
 * 1. 首次创建形状时，将形状存储到记忆系统中
 * 2. 监听画布尺寸变化（canvasSize）
 * 3. 使用记忆管理器从记忆中读取形状拓扑结构
 * 4. 应用智能适配规则（30%直径、居中、比例保持、边界约束）
 * 5. 生成适配后的形状坐标
 * 6. 更新 originalShape 状态
 * 
 * 记忆适配系统的优势：
 * - 形状的"记忆"与"表现"分离，确保跨尺寸一致性
 * - 智能适配规则，自动处理缩放、居中、边界约束
 * - 高性能处理，支持并发和缓存优化
 * - 完善的错误处理和恢复机制
 * - 实时性能监控和历史记录
 * 
 * 向后兼容：
 * - 保持原有API不变，无缝集成到现有系统
 * - 自动检测是否支持记忆系统，不支持时回退到传统方法
 * - 渐进式升级，不影响现有功能
 */
export const useShapeAdaptation = (canvasSize: { width: number; height: number } | null) => {
  const { state, dispatch } = useGame();
  
  // 使用可选链和默认值，防止undefined错误
  const baseShape = state.baseShape || [];
  const baseCanvasSize = state.baseCanvasSize || { width: 0, height: 0 };
  
  // 记忆管理器实例（单例模式）
  const [memoryManager] = useState(() => new MemoryManager({
    debugMode: true, // 强制启用调试模式
    enablePerformanceMonitoring: true,
    autoCleanup: false // 在游戏会话中不自动清理
  }));
  
  // 形状记忆ID
  const [shapeMemoryId, setShapeMemoryId] = useState<string | null>(null);
  
  // 防抖定时器引用
  const debounceTimerRef = useRef<number | null>(null);
  
  // 记忆系统是否可用
  const [isMemorySystemAvailable, setIsMemorySystemAvailable] = useState(true);
  
  // 创建形状记忆
  const createShapeMemory = useCallback(async (points: Point[], canvasSize: { width: number; height: number }) => {
    try {
      if (!isMemorySystemAvailable) {
        console.log('记忆系统不可用，跳过记忆创建');
        return null;
      }

      console.log('🧠 创建形状记忆:', { pointsCount: points.length, canvasSize });
      
      const memoryId = await memoryManager.createShapeMemory(
        points,
        canvasSize,
        `shape_${Date.now()}`
      );
      
      setShapeMemoryId(memoryId);
      console.log('✅ 形状记忆创建成功:', memoryId);
      
      return memoryId;
    } catch (error) {
      console.error('❌ 创建形状记忆失败:', error);
      setIsMemorySystemAvailable(false);
      return null;
    }
  }, [memoryManager, isMemorySystemAvailable]);

  // 基于记忆系统的适配函数
  const adaptShapeWithMemory = useCallback(async (targetCanvasSize: { width: number; height: number }) => {
    try {
      if (!shapeMemoryId || !isMemorySystemAvailable) {
        console.log('记忆系统不可用或无记忆ID，回退到传统适配');
        return null;
      }

      console.log('🎯 使用记忆系统适配形状:', { memoryId: shapeMemoryId, targetCanvasSize });
      
      const adaptedShape = await memoryManager.adaptShapeToCanvas(
        shapeMemoryId,
        targetCanvasSize
      );
      
      console.log('✅ 记忆适配完成:', {
        pointsCount: adaptedShape.points.length,
        metrics: adaptedShape.adaptationMetrics
      });
      
      // 调试：输出前几个点的坐标
      console.log('🔍 记忆系统返回的前3个点:', adaptedShape.points.slice(0, 3));
      
      return adaptedShape.points;
    } catch (error) {
      console.error('❌ 记忆适配失败:', error);
      setIsMemorySystemAvailable(false);
      return null;
    }
  }, [shapeMemoryId, memoryManager, isMemorySystemAvailable]);

  // 传统适配函数（作为回退方案）
  const adaptShapeTraditional = useCallback((shapeToAdapt: Point[], canvasSize: { width: number; height: number }) => {
    console.log('🔄 使用传统方法适配形状');
    
    // 如果baseCanvasSize无效，使用当前canvasSize作为基准
    const effectiveBaseCanvasSize = (
      baseCanvasSize && 
      baseCanvasSize.width > 0 && 
      baseCanvasSize.height > 0
    ) ? baseCanvasSize : canvasSize;
    
    const oldSize: CanvasSize = {
      width: effectiveBaseCanvasSize.width,
      height: effectiveBaseCanvasSize.height
    };
    
    const newSize: CanvasSize = {
      width: canvasSize.width,
      height: canvasSize.height
    };
    
    return adaptShapeToCanvas(shapeToAdapt, oldSize, newSize, {
      debug: process.env.NODE_ENV === 'development',
      enforceAspectRatio: true,
      safetyMargin: 10,
      forceAdapt: true
    });
  }, [baseCanvasSize]);

  // 主适配函数
  const adaptShape = useCallback(async () => {
    console.log('🔄 adaptShape函数被调用，画布尺寸:', canvasSize);
    try {
      // 检查适配条件
      if (
        !canvasSize || 
        !canvasSize.width ||
        !canvasSize.height ||
        canvasSize.width <= 0 ||
        canvasSize.height <= 0
      ) {
        console.log('❌ 画布尺寸无效，跳过适配:', canvasSize);
        return;
      }
      
      // 获取要适配的形状
      const shapeToAdapt = (baseShape && baseShape.length > 0) ? baseShape : state.originalShape;
      
      if (!shapeToAdapt || !Array.isArray(shapeToAdapt) || shapeToAdapt.length === 0) {
        console.log('❌ 没有可适配的形状数据，跳过适配');
        return;
      }
      
      console.log(`🎯 形状适配开始: 画布=${canvasSize.width}x${canvasSize.height}, 形状点数=${shapeToAdapt.length}`);
      
      const startTime = performance.now();
      let adaptedPoints: Point[] | null = null;
      let adaptationMethod = '未知';
      
      // 如果没有记忆ID，先创建记忆
      if (!shapeMemoryId && isMemorySystemAvailable) {
        console.log('🧠 创建形状记忆...');
        const effectiveBaseCanvasSize = (
          baseCanvasSize && 
          baseCanvasSize.width > 0 && 
          baseCanvasSize.height > 0
        ) ? baseCanvasSize : canvasSize;
        
        await createShapeMemory(shapeToAdapt, effectiveBaseCanvasSize);
      }
      
      // 尝试使用记忆系统适配
      if (isMemorySystemAvailable && shapeMemoryId) {
        console.log('🧠 尝试使用记忆系统适配...');
        adaptedPoints = await adaptShapeWithMemory(canvasSize);
        if (adaptedPoints) {
          adaptationMethod = '记忆系统';
        }
      }
      
      // 如果记忆系统失败，回退到传统方法
      if (!adaptedPoints) {
        console.log('🔄 记忆系统不可用，使用传统适配方法');
        adaptedPoints = adaptShapeTraditional(shapeToAdapt, canvasSize);
        adaptationMethod = '传统方法';
      }
      
      const endTime = performance.now();
      
      // 检查适配结果是否有效
      if (!adaptedPoints || !Array.isArray(adaptedPoints) || adaptedPoints.length === 0) {
        console.error('❌ 适配结果无效，跳过状态更新');
        return;
      }
      
      // 检查是否需要同步适配拼图块
      const shouldAdaptPuzzlePieces = (
        state.puzzle && 
        state.puzzle.length > 0 && 
        !state.isScattered && // 只适配未散开的拼图块
        shapeToAdapt && 
        shapeToAdapt.length > 0
      );

      if (shouldAdaptPuzzlePieces) {
        console.log('🧩 检测到未散开的拼图块，开始同步适配...');
        
        try {
          // 获取原始画布尺寸
          const effectiveBaseCanvasSize = (
            baseCanvasSize && 
            baseCanvasSize.width > 0 && 
            baseCanvasSize.height > 0
          ) ? baseCanvasSize : canvasSize;

          // 使用绝对坐标适配方法，避免累积误差
          console.log('🔍 拼图块适配调试信息:', {
            hasBasePuzzle: !!state.basePuzzle,
            basePuzzleLength: state.basePuzzle?.length || 0,
            currentPuzzleLength: state.puzzle?.length || 0,
            effectiveBaseCanvasSize,
            currentCanvasSize: canvasSize
          });
          
          const adaptedPieces = adaptPuzzlePiecesAbsolute(
            state.basePuzzle || state.puzzle, // 使用原始拼图块状态
            effectiveBaseCanvasSize,
            canvasSize
          );
          
          // 同时更新形状和拼图块
          dispatch({ 
            type: "UPDATE_SHAPE_AND_PUZZLE", 
            payload: { 
              originalShape: adaptedPoints,
              puzzle: adaptedPieces
            }
          });
          
          console.log(`✅ 拼图块同步适配完成: ${adaptedPieces.length} 个拼图块`);
          console.log(`🔍 适配详情: 原始画布=${effectiveBaseCanvasSize.width}x${effectiveBaseCanvasSize.height}, 当前画布=${canvasSize.width}x${canvasSize.height}`);
        } catch (error) {
          console.error('❌ 拼图块适配失败，仅更新形状:', error);
          // 如果拼图块适配失败，至少更新形状
          dispatch({ 
            type: "SET_ORIGINAL_SHAPE", 
            payload: adaptedPoints 
          });
        }
      } else {
        // 只更新形状
        dispatch({ 
          type: "SET_ORIGINAL_SHAPE", 
          payload: adaptedPoints 
        });
        
        if (state.puzzle && state.puzzle.length > 0) {
          console.log('🧩 拼图块已散开，跳过同步适配');
        }
      }
      
      console.log(`✅ 形状适配完成: 耗时 ${(endTime - startTime).toFixed(2)}ms, 使用${adaptationMethod}, 结果点数=${adaptedPoints.length}`);
      
      // 输出适配后的形状信息用于调试
      if (adaptedPoints.length > 0) {
        const bounds = adaptedPoints.reduce((acc, point) => ({
          minX: Math.min(acc.minX, point.x),
          maxX: Math.max(acc.maxX, point.x),
          minY: Math.min(acc.minY, point.y),
          maxY: Math.max(acc.maxY, point.y)
        }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
        
        const width = bounds.maxX - bounds.minX;
        const height = bounds.maxY - bounds.minY;
        const centerX = (bounds.minX + bounds.maxX) / 2;
        const centerY = (bounds.minY + bounds.maxY) / 2;
        const diameter = Math.max(width, height);
        const canvasMinEdge = Math.min(canvasSize.width, canvasSize.height);
        const diameterRatio = diameter / canvasMinEdge;
        
        console.log(`📊 适配结果分析:`, {
          形状边界: `${bounds.minX.toFixed(1)}, ${bounds.minY.toFixed(1)} - ${bounds.maxX.toFixed(1)}, ${bounds.maxY.toFixed(1)}`,
          形状尺寸: `${width.toFixed(1)} x ${height.toFixed(1)}`,
          形状中心: `${centerX.toFixed(1)}, ${centerY.toFixed(1)}`,
          画布中心: `${(canvasSize.width/2).toFixed(1)}, ${(canvasSize.height/2).toFixed(1)}`,
          形状直径: diameter.toFixed(1),
          画布最小边: canvasMinEdge,
          直径比例: `${(diameterRatio * 100).toFixed(1)}%`,
          目标比例: '30%'
        });
      }
      
    } catch (error) {
      console.error('❌ 形状适配过程中发生错误:', error);
    }
  }, [
    canvasSize, 
    baseShape, 
    state.originalShape, 
    baseCanvasSize,
    shapeMemoryId, 
    isMemorySystemAvailable,
    createShapeMemory,
    adaptShapeWithMemory,
    adaptShapeTraditional,
    dispatch
  ]);

  // 使用useRef跟踪组件是否已挂载和上一次的画布尺寸
  const isMountedRef = useRef(true);
  const prevCanvasSizeRef = useRef({ width: 0, height: 0 });
  const prevShapeLengthRef = useRef({ base: 0, original: 0 });
  
  // 组件卸载时更新标志
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // 监听画布尺寸变化
  useEffect(() => {
    try {
      // 清除之前的定时器
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      
      // 检查是否有必要进行适配
      if (!canvasSize || canvasSize.width <= 0 || canvasSize.height <= 0) {
        console.log('🔍 画布尺寸无效，跳过适配:', canvasSize);
        return;
      }
      
      // 检查尺寸是否真的变化了
      const sizeChanged = 
        prevCanvasSizeRef.current.width !== canvasSize.width ||
        prevCanvasSizeRef.current.height !== canvasSize.height;
      
      // 检查形状数据是否变化了
      const currentBaseLength = baseShape?.length || 0;
      const currentOriginalLength = state.originalShape?.length || 0;
      const shapeDataChanged = 
        prevShapeLengthRef.current.base !== currentBaseLength ||
        prevShapeLengthRef.current.original !== currentOriginalLength;
      
      // 检查是否有形状数据
      const hasShapeData = currentBaseLength > 0 || currentOriginalLength > 0;
      
      // 只在有变化时输出日志
      if (sizeChanged || shapeDataChanged) {
        console.log('🔍 适配条件检查:', {
          sizeChanged,
          shapeDataChanged,
          hasShapeData,
          currentSize: `${canvasSize.width}x${canvasSize.height}`,
          prevSize: `${prevCanvasSizeRef.current.width}x${prevCanvasSizeRef.current.height}`,
          baseShapeLength: currentBaseLength,
          originalShapeLength: currentOriginalLength
        });
      }
      
      // 检查是否是初始化状态（上一次尺寸为0）
      const isInitializing = prevCanvasSizeRef.current.width === 0 && prevCanvasSizeRef.current.height === 0;
      
      // 如果尺寸和形状数据都没变化，且不是初始化状态，则跳过适配
      if (!sizeChanged && !shapeDataChanged && !isInitializing) {
        console.log('🔍 画布尺寸和形状数据都未变化，跳过适配避免无限循环');
        return;
      }
      
      // 如果没有形状数据且不是初始化状态，也跳过适配
      if (!hasShapeData && !isInitializing) {
        console.log('🔍 无形状数据且非初始化状态，跳过适配');
        return;
      }
      
      // 如果尺寸或形状数据变化了，需要适配
      if (sizeChanged) {
        console.log('🔍 画布尺寸变化，触发适配');
      }
      if (shapeDataChanged) {
        console.log('🔍 形状数据变化，触发适配');
      }
      
      // 更新上一次的尺寸和形状数据
      prevCanvasSizeRef.current = { ...canvasSize };
      prevShapeLengthRef.current = { base: currentBaseLength, original: currentOriginalLength };
      
      console.log('🎯 触发形状适配:', {
        reason: sizeChanged ? '尺寸变化' : (shapeDataChanged ? '形状数据变化' : '有形状数据'),
        size: `${canvasSize.width}x${canvasSize.height}`,
        hasShapeData
      });
      
      // 使用防抖机制避免频繁适配
      debounceTimerRef.current = window.setTimeout(() => {
        if (isMountedRef.current) {
          adaptShape();
        }
      }, 150); // 增加防抖时间到150ms
      
    } catch (error) {
      console.error('❌ 设置形状适配时发生错误:', error);
    }
    
    // 清理函数
    return () => {
      try {
        if (debounceTimerRef.current !== null) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }
      } catch (error) {
        console.error('❌ 清理形状适配定时器时发生错误:', error);
      }
    };
  }, [canvasSize?.width, canvasSize?.height]);
  
  // 清理函数
  useEffect(() => {
    return () => {
      if (memoryManager) {
        memoryManager.destroy();
      }
    };
  }, [memoryManager]);

  // 导出适配函数和记忆管理器，允许外部手动触发适配和访问记忆系统
  return { 
    adaptShape, 
    memoryManager,
    shapeMemoryId,
    isMemorySystemAvailable,
    createShapeMemory
  };
};