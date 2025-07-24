/**
 * 状态保存引擎 - 解决累积偏移问题
 * 
 * 核心思想：
 * 1. 在散开拼图时，保存每个拼图块的"绝对状态"（位置、角度）
 * 2. 在窗口变化时，基于保存的绝对状态进行适配，而不是基于当前状态
 * 3. 避免多次适配导致的累积误差
 */

import { PuzzlePiece } from '@/types/puzzleTypes';

// 拼图块的绝对状态
export interface PuzzlePieceAbsoluteState {
  index: number;
  // 绝对位置（相对于散开时的画布）
  absoluteX: number;
  absoluteY: number;
  // 绝对角度（用户设置的角度）
  absoluteRotation: number;
  // 是否已完成
  isCompleted: boolean;
  // 散开时的画布尺寸
  scatterCanvasSize: { width: number; height: number };
  // 保存时间戳
  timestamp: number;
}

// 状态保存管理器
export class StatePreservationEngine {
  private absoluteStates: Map<number, PuzzlePieceAbsoluteState> = new Map();
  private debugMode: boolean = false;

  constructor(debugMode: boolean = false) {
    this.debugMode = debugMode;
  }

  /**
   * 保存拼图块的绝对状态
   */
  saveAbsoluteStates(
    puzzlePieces: PuzzlePiece[],
    scatterCanvasSize: { width: number; height: number },
    completedPieces: number[] = []
  ): void {
    if (this.debugMode) {
      console.log('🔒 [状态保存引擎] 保存拼图块绝对状态:', {
        拼图块数量: puzzlePieces.length,
        散开画布尺寸: scatterCanvasSize,
        已完成拼图: completedPieces
      });
    }

    puzzlePieces.forEach((piece, index) => {
      const absoluteState: PuzzlePieceAbsoluteState = {
        index,
        absoluteX: piece.x,
        absoluteY: piece.y,
        absoluteRotation: piece.rotation,
        isCompleted: completedPieces.includes(index),
        scatterCanvasSize,
        timestamp: Date.now()
      };

      this.absoluteStates.set(index, absoluteState);

      if (this.debugMode && index < 3) {
        console.log(`🔒 保存拼图块${index}绝对状态:`, {
          位置: `(${absoluteState.absoluteX.toFixed(1)}, ${absoluteState.absoluteY.toFixed(1)})`,
          角度: `${absoluteState.absoluteRotation}°`,
          已完成: absoluteState.isCompleted
        });
      }
    });
  }

  /**
   * 基于绝对状态适配拼图块到新画布尺寸
   */
  adaptToNewCanvasSize(
    currentPuzzlePieces: PuzzlePiece[],
    newCanvasSize: { width: number; height: number }
  ): PuzzlePiece[] {
    if (this.absoluteStates.size === 0) {
      console.warn('🔒 [状态保存引擎] 没有保存的绝对状态，返回原始拼图块');
      return currentPuzzlePieces;
    }

    if (this.debugMode) {
      console.log('🔒 [状态保存引擎] 基于绝对状态适配拼图块:', {
        当前拼图块数量: currentPuzzlePieces.length,
        保存状态数量: this.absoluteStates.size,
        新画布尺寸: newCanvasSize
      });
    }

    return currentPuzzlePieces.map((piece, index) => {
      const absoluteState = this.absoluteStates.get(index);
      
      if (!absoluteState) {
        console.warn(`🔒 [状态保存引擎] 拼图块${index}没有保存的绝对状态`);
        return piece;
      }

      // 计算缩放比例
      const scaleX = newCanvasSize.width / absoluteState.scatterCanvasSize.width;
      const scaleY = newCanvasSize.height / absoluteState.scatterCanvasSize.height;

      // 计算新的位置（基于绝对状态）
      const newX = absoluteState.absoluteX * scaleX;
      const newY = absoluteState.absoluteY * scaleY;

      // 适配所有点的坐标
      const originalCenterX = absoluteState.scatterCanvasSize.width / 2;
      const originalCenterY = absoluteState.scatterCanvasSize.height / 2;
      const newCenterX = newCanvasSize.width / 2;
      const newCenterY = newCanvasSize.height / 2;

      const adaptedPoints = piece.points.map(point => {
        // 转换为相对于原始中心的坐标
        const relativeX = point.x - originalCenterX;
        const relativeY = point.y - originalCenterY;
        
        // 应用缩放
        const scaledX = relativeX * scaleX;
        const scaledY = relativeY * scaleY;
        
        // 转换到新的中心坐标系
        return {
          ...point,
          x: newCenterX + scaledX,
          y: newCenterY + scaledY
        };
      });

      if (this.debugMode && index < 3) {
        console.log(`🔒 拼图块${index}适配:`, {
          绝对位置: `(${absoluteState.absoluteX.toFixed(1)}, ${absoluteState.absoluteY.toFixed(1)})`,
          新位置: `(${newX.toFixed(1)}, ${newY.toFixed(1)})`,
          角度保持: `${absoluteState.absoluteRotation}°`,
          缩放比例: `${scaleX.toFixed(3)}x${scaleY.toFixed(3)}`
        });
      }

      return {
        ...piece,
        x: newX,
        y: newY,
        points: adaptedPoints,
        // 🔑 关键：保持绝对角度不变
        rotation: absoluteState.absoluteRotation,
        originalRotation: piece.originalRotation
      };
    });
  }

  /**
   * 更新拼图块的绝对状态（当用户旋转或移动拼图块时）
   */
  updateAbsoluteState(
    pieceIndex: number,
    newX?: number,
    newY?: number,
    newRotation?: number,
    isCompleted?: boolean
  ): void {
    const absoluteState = this.absoluteStates.get(pieceIndex);
    
    if (!absoluteState) {
      console.warn(`🔒 [状态保存引擎] 尝试更新不存在的拼图块${pieceIndex}状态`);
      return;
    }

    const updatedState: PuzzlePieceAbsoluteState = {
      ...absoluteState,
      ...(newX !== undefined && { absoluteX: newX }),
      ...(newY !== undefined && { absoluteY: newY }),
      ...(newRotation !== undefined && { absoluteRotation: newRotation }),
      ...(isCompleted !== undefined && { isCompleted }),
      timestamp: Date.now()
    };

    this.absoluteStates.set(pieceIndex, updatedState);

    if (this.debugMode) {
      console.log(`🔒 更新拼图块${pieceIndex}绝对状态:`, {
        位置: newX !== undefined || newY !== undefined ? `(${updatedState.absoluteX.toFixed(1)}, ${updatedState.absoluteY.toFixed(1)})` : '未变',
        角度: newRotation !== undefined ? `${updatedState.absoluteRotation}°` : '未变',
        完成状态: isCompleted !== undefined ? updatedState.isCompleted : '未变'
      });
    }
  }

  /**
   * 获取拼图块的绝对状态
   */
  getAbsoluteState(pieceIndex: number): PuzzlePieceAbsoluteState | null {
    return this.absoluteStates.get(pieceIndex) || null;
  }

  /**
   * 清除所有保存的状态
   */
  clearStates(): void {
    this.absoluteStates.clear();
    if (this.debugMode) {
      console.log('🔒 [状态保存引擎] 清除所有保存的状态');
    }
  }

  /**
   * 获取状态统计信息
   */
  getStats(): {
    totalStates: number;
    completedPieces: number;
    oldestTimestamp: number;
    newestTimestamp: number;
  } {
    const states = Array.from(this.absoluteStates.values());
    
    return {
      totalStates: states.length,
      completedPieces: states.filter(s => s.isCompleted).length,
      oldestTimestamp: Math.min(...states.map(s => s.timestamp)),
      newestTimestamp: Math.max(...states.map(s => s.timestamp))
    };
  }

  /**
   * 设置调试模式
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }
}

// 导出单例实例
export const statePreservationEngine = new StatePreservationEngine(
  process.env.NODE_ENV === 'development'
);