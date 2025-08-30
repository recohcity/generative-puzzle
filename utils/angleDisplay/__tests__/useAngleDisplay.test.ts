/**
 * useAngleDisplay Hook 单元测试
 * 测试角度显示 Hook 的所有功能
 */

import { renderHook } from '@testing-library/react';
import React from 'react';
import { useAngleDisplay } from '../useAngleDisplay';
import { GameContext } from '@/contexts/GameContext';
import { GameState } from '@/types/puzzleTypes';
import { AngleDisplayState } from '../AngleVisibilityManager';

// Mock angleDisplayService
jest.mock('../AngleDisplayService', () => ({
  angleDisplayService: {
    shouldShowAngle: jest.fn(),
    getDisplayMode: jest.fn(),
    getDisplayState: jest.fn(),
    isTemporaryDisplay: jest.fn(),
    needsHintEnhancement: jest.fn(),
  }
}));

import { angleDisplayService } from '../AngleDisplayService';

// 创建模拟的 GameState
const createMockGameState = (overrides: Partial<GameState> = {}): GameState => ({
  originalShape: [],
  puzzle: null,
  draggingPiece: null,
  selectedPiece: null,
  completedPieces: [],
  isCompleted: false,
  isScattered: false,
  showHint: false,
  shapeType: 'polygon' as any,
  pendingShapeType: null,
  cutType: 'straight' as any,
  cutCount: 1,
  originalPositions: [],
  canvasSize: null,
  baseCanvasSize: null,
  angleDisplayMode: 'always',
  temporaryAngleVisible: new Set(),
  gameStats: null,
  isGameActive: false,
  isGameComplete: false,
  showLeaderboard: false,
  leaderboard: [],
  currentScore: 0,
  scoreBreakdown: null,
  isNewRecord: false,
  currentRank: null,
  deviceType: 'desktop',
  ...overrides
});

// 创建模拟的 GameContext Provider
const createMockProvider = (state: GameState, dispatch: jest.Mock = jest.fn()) => {
  return ({ children }: { children: React.ReactNode }) => (
    React.createElement(GameContext.Provider, {
      value: {
        state,
        dispatch,
        canvasRef: { current: null },
        backgroundCanvasRef: { current: null },
        generateShape: jest.fn(),
        generatePuzzle: jest.fn(),
        scatterPuzzle: jest.fn(),
        rotatePiece: jest.fn(),
        showHintOutline: jest.fn(),
        resetGame: jest.fn(),
        calculatePieceBounds: jest.fn(),
        ensurePieceInBounds: jest.fn(),
        trackRotation: jest.fn(),
        trackHintUsage: jest.fn(),
        trackDragOperation: jest.fn(),
        completeGame: jest.fn(),
        restartGame: jest.fn(),
        showLeaderboard: jest.fn(),
        hideLeaderboard: jest.fn(),
        loadLeaderboard: jest.fn(),
        resetStats: jest.fn(),
      }
    }, children)
  );
};

describe('useAngleDisplay Hook', () => {
  let mockAngleDisplayService: jest.Mocked<typeof angleDisplayService>;

  beforeEach(() => {
    mockAngleDisplayService = angleDisplayService as jest.Mocked<typeof angleDisplayService>;
    jest.clearAllMocks();
  });

  describe('Hook 基础功能测试', () => {
    it('应该在没有 GameContext 时抛出错误', () => {
      // 使用 console.error 的 mock 来避免测试输出中的错误信息
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useAngleDisplay());
      }).toThrow('useAngleDisplay must be used within a GameProvider');
      
      consoleSpy.mockRestore();
    });

    it('应该正确返回状态信息', () => {
      const mockState = createMockGameState({
        cutCount: 5,
        angleDisplayMode: 'conditional',
        showHint: true
      });
      const MockProvider = createMockProvider(mockState);

      const { result } = renderHook(() => useAngleDisplay(), {
        wrapper: MockProvider
      });

      expect(result.current.cutCount).toBe(5);
      expect(result.current.angleDisplayMode).toBe('conditional');
      expect(result.current.showHint).toBe(true);
    });
  });

  describe('shouldShowAngle 函数测试', () => {
    it('应该调用 angleDisplayService.shouldShowAngle 并返回结果', () => {
      const mockState = createMockGameState({
        cutCount: 3,
        showHint: false
      });
      const MockProvider = createMockProvider(mockState);

      mockAngleDisplayService.shouldShowAngle.mockReturnValue(true);

      const { result } = renderHook(() => useAngleDisplay(), {
        wrapper: MockProvider
      });

      const shouldShow = result.current.shouldShowAngle(1);

      expect(mockAngleDisplayService.shouldShowAngle).toHaveBeenCalledWith(3, 1, false);
      expect(shouldShow).toBe(true);
    });

    it('应该在状态变化时重新计算结果', () => {
      // 第一次渲染
      const mockState1 = createMockGameState({
        cutCount: 3,
        showHint: false
      });
      const MockProvider1 = createMockProvider(mockState1);

      mockAngleDisplayService.shouldShowAngle.mockReturnValue(true);

      const { result: result1 } = renderHook(() => useAngleDisplay(), {
        wrapper: MockProvider1
      });

      result1.current.shouldShowAngle(1);
      expect(mockAngleDisplayService.shouldShowAngle).toHaveBeenCalledWith(3, 1, false);

      // 第二次渲染，使用不同的状态
      const mockState2 = createMockGameState({
        cutCount: 5,
        showHint: true
      });
      const MockProvider2 = createMockProvider(mockState2);

      const { result: result2 } = renderHook(() => useAngleDisplay(), {
        wrapper: MockProvider2
      });

      result2.current.shouldShowAngle(1);
      expect(mockAngleDisplayService.shouldShowAngle).toHaveBeenCalledWith(5, 1, true);
    });

    it('应该正确处理 null pieceId', () => {
      const mockState = createMockGameState({
        cutCount: 3,
        showHint: false
      });
      const MockProvider = createMockProvider(mockState);

      mockAngleDisplayService.shouldShowAngle.mockReturnValue(false);

      const { result } = renderHook(() => useAngleDisplay(), {
        wrapper: MockProvider
      });

      const shouldShow = result.current.shouldShowAngle(null);

      expect(mockAngleDisplayService.shouldShowAngle).toHaveBeenCalledWith(3, null, false);
      expect(shouldShow).toBe(false);
    });
  });

  describe('getDisplayMode 函数测试', () => {
    it('应该调用 angleDisplayService.getDisplayMode 并返回结果', () => {
      const mockState = createMockGameState({
        cutCount: 5
      });
      const MockProvider = createMockProvider(mockState);

      mockAngleDisplayService.getDisplayMode.mockReturnValue('conditional');

      const { result } = renderHook(() => useAngleDisplay(), {
        wrapper: MockProvider
      });

      const displayMode = result.current.getDisplayMode();

      expect(mockAngleDisplayService.getDisplayMode).toHaveBeenCalledWith(5);
      expect(displayMode).toBe('conditional');
    });

    it('应该在 cutCount 变化时重新计算结果', () => {
      // 第一次渲染
      const mockState1 = createMockGameState({
        cutCount: 2
      });
      const MockProvider1 = createMockProvider(mockState1);

      mockAngleDisplayService.getDisplayMode.mockReturnValue('always');

      const { result: result1 } = renderHook(() => useAngleDisplay(), {
        wrapper: MockProvider1
      });

      expect(result1.current.getDisplayMode()).toBe('always');
      expect(mockAngleDisplayService.getDisplayMode).toHaveBeenCalledWith(2);

      // 第二次渲染，使用不同的状态
      const mockState2 = createMockGameState({
        cutCount: 6
      });
      const MockProvider2 = createMockProvider(mockState2);

      mockAngleDisplayService.getDisplayMode.mockReturnValue('conditional');

      const { result: result2 } = renderHook(() => useAngleDisplay(), {
        wrapper: MockProvider2
      });

      expect(result2.current.getDisplayMode()).toBe('conditional');
      expect(mockAngleDisplayService.getDisplayMode).toHaveBeenCalledWith(6);
    });
  });

  describe('getDisplayState 函数测试', () => {
    it('应该调用 angleDisplayService.getDisplayState 并返回结果', () => {
      const mockState = createMockGameState({
        cutCount: 4,
        showHint: true
      });
      const MockProvider = createMockProvider(mockState);

      mockAngleDisplayService.getDisplayState.mockReturnValue(AngleDisplayState.TEMPORARY_VISIBLE);

      const { result } = renderHook(() => useAngleDisplay(), {
        wrapper: MockProvider
      });

      const displayState = result.current.getDisplayState(2);

      expect(mockAngleDisplayService.getDisplayState).toHaveBeenCalledWith(2, 4, true);
      expect(displayState).toBe(AngleDisplayState.TEMPORARY_VISIBLE);
    });

    it('应该正确处理不同的参数组合', () => {
      const mockState = createMockGameState({
        cutCount: 1,
        showHint: false
      });
      const MockProvider = createMockProvider(mockState);

      mockAngleDisplayService.getDisplayState.mockReturnValue(AngleDisplayState.ALWAYS_VISIBLE);

      const { result } = renderHook(() => useAngleDisplay(), {
        wrapper: MockProvider
      });

      // 测试不同的 pieceId
      result.current.getDisplayState(null);
      expect(mockAngleDisplayService.getDisplayState).toHaveBeenCalledWith(null, 1, false);

      result.current.getDisplayState(0);
      expect(mockAngleDisplayService.getDisplayState).toHaveBeenCalledWith(0, 1, false);

      result.current.getDisplayState(-1);
      expect(mockAngleDisplayService.getDisplayState).toHaveBeenCalledWith(-1, 1, false);
    });
  });

  describe('isTemporaryDisplay 函数测试', () => {
    it('应该调用 angleDisplayService.isTemporaryDisplay 并返回结果', () => {
      const mockState = createMockGameState({
        cutCount: 6,
        showHint: true
      });
      const MockProvider = createMockProvider(mockState);

      mockAngleDisplayService.isTemporaryDisplay.mockReturnValue(true);

      const { result } = renderHook(() => useAngleDisplay(), {
        wrapper: MockProvider
      });

      const isTemporary = result.current.isTemporaryDisplay();

      expect(mockAngleDisplayService.isTemporaryDisplay).toHaveBeenCalledWith(6, true);
      expect(isTemporary).toBe(true);
    });

    it('应该在状态变化时重新计算结果', () => {
      // 第一次渲染
      const mockState1 = createMockGameState({
        cutCount: 2,
        showHint: false
      });
      const MockProvider1 = createMockProvider(mockState1);

      mockAngleDisplayService.isTemporaryDisplay.mockReturnValue(false);

      const { result: result1 } = renderHook(() => useAngleDisplay(), {
        wrapper: MockProvider1
      });

      expect(result1.current.isTemporaryDisplay()).toBe(false);
      expect(mockAngleDisplayService.isTemporaryDisplay).toHaveBeenCalledWith(2, false);

      // 第二次渲染，使用不同的状态
      const mockState2 = createMockGameState({
        cutCount: 7,
        showHint: true
      });
      const MockProvider2 = createMockProvider(mockState2);

      mockAngleDisplayService.isTemporaryDisplay.mockReturnValue(true);

      const { result: result2 } = renderHook(() => useAngleDisplay(), {
        wrapper: MockProvider2
      });

      expect(result2.current.isTemporaryDisplay()).toBe(true);
      expect(mockAngleDisplayService.isTemporaryDisplay).toHaveBeenCalledWith(7, true);
    });
  });

  describe('needsHintEnhancement 函数测试', () => {
    it('应该调用 angleDisplayService.needsHintEnhancement 并返回结果', () => {
      const mockState = createMockGameState({
        cutCount: 8
      });
      const MockProvider = createMockProvider(mockState);

      mockAngleDisplayService.needsHintEnhancement.mockReturnValue(true);

      const { result } = renderHook(() => useAngleDisplay(), {
        wrapper: MockProvider
      });

      const needsEnhancement = result.current.needsHintEnhancement();

      expect(mockAngleDisplayService.needsHintEnhancement).toHaveBeenCalledWith(8);
      expect(needsEnhancement).toBe(true);
    });

    it('应该在 cutCount 变化时重新计算结果', () => {
      // 第一次渲染
      const mockState1 = createMockGameState({
        cutCount: 1
      });
      const MockProvider1 = createMockProvider(mockState1);

      mockAngleDisplayService.needsHintEnhancement.mockReturnValue(false);

      const { result: result1 } = renderHook(() => useAngleDisplay(), {
        wrapper: MockProvider1
      });

      expect(result1.current.needsHintEnhancement()).toBe(false);
      expect(mockAngleDisplayService.needsHintEnhancement).toHaveBeenCalledWith(1);

      // 第二次渲染，使用不同的状态
      const mockState2 = createMockGameState({
        cutCount: 5
      });
      const MockProvider2 = createMockProvider(mockState2);

      mockAngleDisplayService.needsHintEnhancement.mockReturnValue(true);

      const { result: result2 } = renderHook(() => useAngleDisplay(), {
        wrapper: MockProvider2
      });

      expect(result2.current.needsHintEnhancement()).toBe(true);
      expect(mockAngleDisplayService.needsHintEnhancement).toHaveBeenCalledWith(5);
    });
  });

  describe('Hook 优化和性能测试', () => {
    it('应该使用 useCallback 优化函数', () => {
      const mockState = createMockGameState({
        cutCount: 3,
        showHint: false
      });
      const MockProvider = createMockProvider(mockState);

      const { result, rerender } = renderHook(() => useAngleDisplay(), {
        wrapper: MockProvider
      });

      const firstRenderFunctions = {
        shouldShowAngle: result.current.shouldShowAngle,
        getDisplayMode: result.current.getDisplayMode,
        getDisplayState: result.current.getDisplayState,
        isTemporaryDisplay: result.current.isTemporaryDisplay,
        needsHintEnhancement: result.current.needsHintEnhancement,
      };

      // 重新渲染但状态不变
      rerender();

      // 函数引用应该保持不变（useCallback 优化）
      expect(result.current.shouldShowAngle).toBe(firstRenderFunctions.shouldShowAngle);
      expect(result.current.getDisplayMode).toBe(firstRenderFunctions.getDisplayMode);
      expect(result.current.getDisplayState).toBe(firstRenderFunctions.getDisplayState);
      expect(result.current.isTemporaryDisplay).toBe(firstRenderFunctions.isTemporaryDisplay);
      expect(result.current.needsHintEnhancement).toBe(firstRenderFunctions.needsHintEnhancement);
    });

    it('应该在依赖项变化时更新函数', () => {
      // 这个测试验证 useCallback 的依赖项是否正确设置
      // 我们通过比较不同状态下的函数行为来验证
      
      // 第一次渲染
      const mockState1 = createMockGameState({
        cutCount: 3,
        showHint: false
      });
      const MockProvider1 = createMockProvider(mockState1);

      mockAngleDisplayService.shouldShowAngle.mockReturnValue(true);
      mockAngleDisplayService.getDisplayMode.mockReturnValue('always');

      const { result: result1 } = renderHook(() => useAngleDisplay(), {
        wrapper: MockProvider1
      });

      // 调用函数并记录结果
      result1.current.shouldShowAngle(1);
      result1.current.getDisplayMode();
      
      expect(mockAngleDisplayService.shouldShowAngle).toHaveBeenCalledWith(3, 1, false);
      expect(mockAngleDisplayService.getDisplayMode).toHaveBeenCalledWith(3);

      // 第二次渲染，依赖项发生变化
      const mockState2 = createMockGameState({
        cutCount: 5, // cutCount 变化
        showHint: true // showHint 变化
      });
      const MockProvider2 = createMockProvider(mockState2);

      mockAngleDisplayService.shouldShowAngle.mockReturnValue(false);
      mockAngleDisplayService.getDisplayMode.mockReturnValue('conditional');

      const { result: result2 } = renderHook(() => useAngleDisplay(), {
        wrapper: MockProvider2
      });

      // 调用函数，应该使用新的依赖项
      result2.current.shouldShowAngle(1);
      result2.current.getDisplayMode();
      
      expect(mockAngleDisplayService.shouldShowAngle).toHaveBeenCalledWith(5, 1, true);
      expect(mockAngleDisplayService.getDisplayMode).toHaveBeenCalledWith(5);
    });
  });

  describe('边界值和异常情况测试', () => {
    it('应该正确处理极端的 cutCount 值', () => {
      const testCases = [
        { cutCount: 0, description: '零切割次数' },
        { cutCount: -1, description: '负数切割次数' },
        { cutCount: 100, description: '很大的切割次数' },
      ];

      testCases.forEach(({ cutCount, description }) => {
        const mockState = createMockGameState({
          cutCount,
          showHint: false
        });
        const MockProvider = createMockProvider(mockState);

        mockAngleDisplayService.shouldShowAngle.mockReturnValue(false);
        mockAngleDisplayService.getDisplayMode.mockReturnValue('conditional');
        mockAngleDisplayService.getDisplayState.mockReturnValue(AngleDisplayState.HIDDEN);
        mockAngleDisplayService.isTemporaryDisplay.mockReturnValue(false);
        mockAngleDisplayService.needsHintEnhancement.mockReturnValue(true);

        const { result } = renderHook(() => useAngleDisplay(), {
          wrapper: MockProvider
        });

        expect(() => {
          result.current.shouldShowAngle(1);
          result.current.getDisplayMode();
          result.current.getDisplayState(1);
          result.current.isTemporaryDisplay();
          result.current.needsHintEnhancement();
        }).not.toThrow();

        // 验证调用参数
        expect(mockAngleDisplayService.shouldShowAngle).toHaveBeenCalledWith(cutCount, 1, false);
        expect(mockAngleDisplayService.getDisplayMode).toHaveBeenCalledWith(cutCount);
        expect(mockAngleDisplayService.getDisplayState).toHaveBeenCalledWith(1, cutCount, false);
        expect(mockAngleDisplayService.isTemporaryDisplay).toHaveBeenCalledWith(cutCount, false);
        expect(mockAngleDisplayService.needsHintEnhancement).toHaveBeenCalledWith(cutCount);

        jest.clearAllMocks();
      });
    });

    it('应该正确处理极端的 pieceId 值', () => {
      const mockState = createMockGameState({
        cutCount: 3,
        showHint: false
      });
      const MockProvider = createMockProvider(mockState);

      mockAngleDisplayService.shouldShowAngle.mockReturnValue(true);
      mockAngleDisplayService.getDisplayState.mockReturnValue(AngleDisplayState.ALWAYS_VISIBLE);

      const { result } = renderHook(() => useAngleDisplay(), {
        wrapper: MockProvider
      });

      const extremePieceIds = [null, 0, -1, 999999];

      extremePieceIds.forEach(pieceId => {
        expect(() => {
          result.current.shouldShowAngle(pieceId);
          result.current.getDisplayState(pieceId);
        }).not.toThrow();

        expect(mockAngleDisplayService.shouldShowAngle).toHaveBeenCalledWith(3, pieceId, false);
        expect(mockAngleDisplayService.getDisplayState).toHaveBeenCalledWith(pieceId, 3, false);
      });
    });
  });

  describe('集成测试', () => {
    it('应该正确集成所有功能', () => {
      const mockState = createMockGameState({
        cutCount: 4,
        angleDisplayMode: 'conditional',
        showHint: true
      });
      const MockProvider = createMockProvider(mockState);

      // 设置 mock 返回值
      mockAngleDisplayService.shouldShowAngle.mockReturnValue(true);
      mockAngleDisplayService.getDisplayMode.mockReturnValue('conditional');
      mockAngleDisplayService.getDisplayState.mockReturnValue(AngleDisplayState.TEMPORARY_VISIBLE);
      mockAngleDisplayService.isTemporaryDisplay.mockReturnValue(true);
      mockAngleDisplayService.needsHintEnhancement.mockReturnValue(true);

      const { result } = renderHook(() => useAngleDisplay(), {
        wrapper: MockProvider
      });

      // 验证所有功能都正常工作
      expect(result.current.shouldShowAngle(1)).toBe(true);
      expect(result.current.getDisplayMode()).toBe('conditional');
      expect(result.current.getDisplayState(1)).toBe(AngleDisplayState.TEMPORARY_VISIBLE);
      expect(result.current.isTemporaryDisplay()).toBe(true);
      expect(result.current.needsHintEnhancement()).toBe(true);

      // 验证状态信息
      expect(result.current.cutCount).toBe(4);
      expect(result.current.angleDisplayMode).toBe('conditional');
      expect(result.current.showHint).toBe(true);

      // 验证所有 service 方法都被正确调用
      expect(mockAngleDisplayService.shouldShowAngle).toHaveBeenCalledWith(4, 1, true);
      expect(mockAngleDisplayService.getDisplayMode).toHaveBeenCalledWith(4);
      expect(mockAngleDisplayService.getDisplayState).toHaveBeenCalledWith(1, 4, true);
      expect(mockAngleDisplayService.isTemporaryDisplay).toHaveBeenCalledWith(4, true);
      expect(mockAngleDisplayService.needsHintEnhancement).toHaveBeenCalledWith(4);
    });

    it('应该在复杂状态变化下保持一致性', () => {
      // 第一阶段：cutCount=1, showHint=false
      const mockState1 = createMockGameState({
        cutCount: 1,
        showHint: false
      });
      const MockProvider1 = createMockProvider(mockState1);

      mockAngleDisplayService.shouldShowAngle.mockReturnValue(true);
      mockAngleDisplayService.getDisplayMode.mockReturnValue('always');
      mockAngleDisplayService.isTemporaryDisplay.mockReturnValue(false);

      const { result: result1 } = renderHook(() => useAngleDisplay(), {
        wrapper: MockProvider1
      });

      expect(result1.current.shouldShowAngle(1)).toBe(true);
      expect(result1.current.getDisplayMode()).toBe('always');
      expect(result1.current.isTemporaryDisplay()).toBe(false);

      // 第二阶段：cutCount=5, showHint=false
      const mockState2 = createMockGameState({
        cutCount: 5,
        showHint: false
      });
      const MockProvider2 = createMockProvider(mockState2);

      mockAngleDisplayService.shouldShowAngle.mockReturnValue(false);
      mockAngleDisplayService.getDisplayMode.mockReturnValue('conditional');
      mockAngleDisplayService.isTemporaryDisplay.mockReturnValue(false);

      const { result: result2 } = renderHook(() => useAngleDisplay(), {
        wrapper: MockProvider2
      });

      expect(result2.current.shouldShowAngle(1)).toBe(false);
      expect(result2.current.getDisplayMode()).toBe('conditional');
      expect(result2.current.isTemporaryDisplay()).toBe(false);

      // 第三阶段：cutCount=5, showHint=true
      const mockState3 = createMockGameState({
        cutCount: 5,
        showHint: true
      });
      const MockProvider3 = createMockProvider(mockState3);

      mockAngleDisplayService.shouldShowAngle.mockReturnValue(true);
      mockAngleDisplayService.getDisplayMode.mockReturnValue('conditional');
      mockAngleDisplayService.isTemporaryDisplay.mockReturnValue(true);

      const { result: result3 } = renderHook(() => useAngleDisplay(), {
        wrapper: MockProvider3
      });

      expect(result3.current.shouldShowAngle(1)).toBe(true);
      expect(result3.current.getDisplayMode()).toBe('conditional');
      expect(result3.current.isTemporaryDisplay()).toBe(true);
    });
  });

  describe('性能测试', () => {
    it('应该在大量调用下保持性能', () => {
      const mockState = createMockGameState({
        cutCount: 5,
        showHint: true
      });
      const MockProvider = createMockProvider(mockState);

      mockAngleDisplayService.shouldShowAngle.mockReturnValue(true);
      mockAngleDisplayService.getDisplayMode.mockReturnValue('conditional');
      mockAngleDisplayService.getDisplayState.mockReturnValue(AngleDisplayState.TEMPORARY_VISIBLE);
      mockAngleDisplayService.isTemporaryDisplay.mockReturnValue(true);
      mockAngleDisplayService.needsHintEnhancement.mockReturnValue(true);

      const { result } = renderHook(() => useAngleDisplay(), {
        wrapper: MockProvider
      });

      const startTime = performance.now();

      // 执行大量调用
      for (let i = 0; i < 1000; i++) {
        result.current.shouldShowAngle(i % 10);
        result.current.getDisplayMode();
        result.current.getDisplayState(i % 5);
        result.current.isTemporaryDisplay();
        result.current.needsHintEnhancement();
      }

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // 性能应该在合理范围内（50ms内完成1000次调用）
      expect(executionTime).toBeLessThan(50);
    });
  });
});