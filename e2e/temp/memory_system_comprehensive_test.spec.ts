/**
 * 记忆适配系统综合测试
 * 
 * 测试记忆系统在实际拼图游戏场景中的表现：
 * - 拼图切割状态的形状适配
 * - 拼图散开状态的形状适配
 * - 拼图交互状态的形状适配
 * - 拼图完成状态的形状适配
 * - 窗口大小变化时的实时适配
 */

import { test, expect } from '@playwright/test';
import { MemoryManager } from '../../utils/memory/MemoryManager';
import { adaptShapeUnified } from '../../utils/shape/shapeAdaptationUtils';
import { Point, CanvasSize } from '../../types/common';

test.describe('记忆适配系统综合测试', () => {
  
  let memoryManager: MemoryManager;

  test.beforeEach(() => {
    memoryManager = new MemoryManager({
      debugMode: true,
      autoCleanup: false,
      enablePerformanceMonitoring: true
    });
  });

  test.afterEach(() => {
    memoryManager.destroy();
  });

  test('应该支持拼图游戏的完整生命周期适配', async () => {
    // 模拟拼图游戏的四个主要状态
    
    // 1. 初始状态：完整的拼图形状（例如一个复杂的多边形）
    const originalPuzzleShape: Point[] = [
      { x: 100, y: 100 }, { x: 200, y: 80 }, { x: 300, y: 100 },
      { x: 320, y: 200 }, { x: 300, y: 300 }, { x: 200, y: 320 },
      { x: 100, y: 300 }, { x: 80, y: 200 }
    ];
    const originalCanvas: CanvasSize = { width: 400, height: 400 };

    // 创建拼图形状记忆
    const puzzleMemoryId = await memoryManager.createShapeMemory(
      originalPuzzleShape, 
      originalCanvas, 
      'puzzle-complete'
    );

    // 2. 切割状态：拼图被切割成多个片段
    const puzzlePieces: Point[][] = [
      // 片段1：左上角
      [
        { x: 100, y: 100 }, { x: 200, y: 80 }, 
        { x: 180, y: 180 }, { x: 80, y: 200 }
      ],
      // 片段2：右上角
      [
        { x: 200, y: 80 }, { x: 300, y: 100 },
        { x: 320, y: 200 }, { x: 180, y: 180 }
      ],
      // 片段3：右下角
      [
        { x: 180, y: 180 }, { x: 320, y: 200 },
        { x: 300, y: 300 }, { x: 200, y: 320 }
      ],
      // 片段4：左下角
      [
        { x: 80, y: 200 }, { x: 180, y: 180 },
        { x: 200, y: 320 }, { x: 100, y: 300 }
      ]
    ];

    // 为每个拼图片段创建记忆
    const pieceMemoryIds: string[] = [];
    for (let i = 0; i < puzzlePieces.length; i++) {
      const pieceId = await memoryManager.createShapeMemory(
        puzzlePieces[i], 
        originalCanvas, 
        `puzzle-piece-${i}`
      );
      pieceMemoryIds.push(pieceId);
    }

    // 3. 散开状态：拼图片段散布在画布上
    const scatteredCanvas: CanvasSize = { width: 800, height: 600 };
    
    // 适配所有拼图片段到散开状态
    const scatteredPieces = await Promise.all(
      pieceMemoryIds.map(id => 
        memoryManager.adaptShapeToCanvas(id, scatteredCanvas)
      )
    );

    // 验证散开状态的适配
    expect(scatteredPieces).toHaveLength(4);
    scatteredPieces.forEach((piece, index) => {
      expect(piece.shapeId).toBe(`puzzle-piece-${index}`);
      expect(piece.canvasSize).toEqual(scatteredCanvas);
      expect(piece.adaptationMetrics.fidelity).toBeGreaterThan(0.8);
    });

    // 4. 交互状态：用户拖拽拼图片段，画布可能会调整大小
    const interactionCanvas: CanvasSize = { width: 1200, height: 800 };
    
    // 模拟用户交互过程中的实时适配
    const interactionAdaptations = await Promise.all([
      memoryManager.adaptShapeToCanvas('puzzle-piece-0', interactionCanvas),
      memoryManager.adaptShapeToCanvas('puzzle-piece-1', interactionCanvas),
      memoryManager.adaptShapeToCanvas('puzzle-complete', interactionCanvas)
    ]);

    // 验证交互状态的适配
    expect(interactionAdaptations).toHaveLength(3);
    interactionAdaptations.forEach(adaptation => {
      expect(adaptation.canvasSize).toEqual(interactionCanvas);
      expect(adaptation.adaptationMetrics.boundaryFit).toBeGreaterThan(0.9);
    });

    // 5. 完成状态：拼图重新组合成完整形状
    const completionCanvas: CanvasSize = { width: 600, height: 600 };
    
    const completedPuzzle = await memoryManager.adaptShapeToCanvas(
      puzzleMemoryId, 
      completionCanvas
    );

    // 验证完成状态的适配
    expect(completedPuzzle.shapeId).toBe('puzzle-complete');
    expect(completedPuzzle.points).toHaveLength(8);
    expect(completedPuzzle.canvasSize).toEqual(completionCanvas);
    expect(completedPuzzle.adaptationMetrics.fidelity).toBeGreaterThan(0.9);

    // 6. 验证整个生命周期的性能指标
    const finalMetrics = memoryManager.getPerformanceMetrics();
    expect(finalMetrics.totalMemories).toBe(5); // 1个完整拼图 + 4个片段
    expect(finalMetrics.totalAdaptations).toBeGreaterThanOrEqual(8); // 至少8次适配
    expect(finalMetrics.successRate).toBe(1.0);
    expect(finalMetrics.averageAdaptationTime).toBeLessThan(5); // 平均适配时间应该很快
  });

  test('应该支持窗口大小变化时的实时适配', async () => {
    // 创建一个复杂的形状
    const complexShape: Point[] = [];
    const centerX = 200, centerY = 200;
    
    // 创建一个星形
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI * 2) / 10;
      const radius = i % 2 === 0 ? 100 : 50; // 交替的长短半径
      complexShape.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius
      });
    }

    const initialCanvas: CanvasSize = { width: 400, height: 400 };
    const shapeMemoryId = await memoryManager.createShapeMemory(
      complexShape, 
      initialCanvas, 
      'star-shape'
    );

    // 模拟一系列窗口大小变化
    const windowSizes: CanvasSize[] = [
      { width: 800, height: 600 },   // 标准宽屏
      { width: 1920, height: 1080 }, // 全高清
      { width: 1366, height: 768 },  // 笔记本常见分辨率
      { width: 414, height: 896 },   // 手机竖屏
      { width: 896, height: 414 },   // 手机横屏
      { width: 1024, height: 768 },  // 平板
      { width: 2560, height: 1440 }, // 2K显示器
      { width: 400, height: 400 }    // 回到初始尺寸
    ];

    // 记录每次适配的结果
    const adaptationResults: any[] = [];
    const startTime = Date.now();

    for (const windowSize of windowSizes) {
      const adaptationStart = Date.now();
      const adapted = await memoryManager.adaptShapeToCanvas(shapeMemoryId, windowSize);
      const adaptationTime = Date.now() - adaptationStart;

      adaptationResults.push({
        windowSize,
        adapted,
        adaptationTime,
        bounds: calculateBounds(adapted.points)
      });
    }

    const totalTime = Date.now() - startTime;

    // 验证所有适配都成功
    expect(adaptationResults).toHaveLength(8);
    adaptationResults.forEach((result, index) => {
      expect(result.adapted.shapeId).toBe('star-shape');
      expect(result.adapted.points).toHaveLength(10);
      expect(result.adapted.canvasSize).toEqual(windowSizes[index]);
      expect(result.adapted.adaptationMetrics.fidelity).toBeGreaterThan(0.8);
      expect(result.adaptationTime).toBeLessThan(10); // 每次适配应该很快
    });

    // 验证形状在不同尺寸下保持相对比例
    const aspectRatios = adaptationResults.map(result => 
      result.bounds.width / result.bounds.height
    );
    
    // 所有宽高比应该相近（考虑到30%规则的影响）
    const avgRatio = aspectRatios.reduce((sum, ratio) => sum + ratio, 0) / aspectRatios.length;
    aspectRatios.forEach(ratio => {
      expect(Math.abs(ratio - avgRatio)).toBeLessThan(0.3); // 允许一定的变化
    });

    // 验证性能表现
    expect(totalTime).toBeLessThan(100); // 总时间应该很快
    
    const finalMetrics = memoryManager.getPerformanceMetrics();
    expect(finalMetrics.totalAdaptations).toBe(8);
    expect(finalMetrics.successRate).toBe(1.0);

    console.log('窗口适配性能统计:', {
      totalTime: `${totalTime}ms`,
      averageAdaptationTime: `${totalTime / 8}ms`,
      finalMetrics
    });
  });

  test('应该支持使用统一适配函数的场景', async () => {
    // 测试使用 adaptShapeUnified 函数的场景
    
    const originalShape: Point[] = [
      { x: 150, y: 100 },
      { x: 250, y: 100 },
      { x: 300, y: 200 },
      { x: 250, y: 300 },
      { x: 150, y: 300 },
      { x: 100, y: 200 }
    ];

    const oldSize: CanvasSize = { width: 400, height: 400 };
    const newSize: CanvasSize = { width: 800, height: 600 };

    // 场景1：不使用记忆的直接适配
    const directAdapted = await adaptShapeUnified(
      originalShape,
      oldSize,
      newSize,
      {
        memoryManager: null,
        shapeMemoryId: null,
        createMemoryIfNeeded: false
      }
    );

    expect(directAdapted).toHaveLength(6);
    expect(Array.isArray(directAdapted)).toBe(true);

    // 场景2：自动创建记忆并使用
    const memoryAdapted = await adaptShapeUnified(
      originalShape,
      oldSize,
      newSize,
      {
        memoryManager,
        shapeMemoryId: 'auto-created-shape',
        createMemoryIfNeeded: true
      }
    );

    expect(memoryAdapted).toHaveLength(6);
    expect(Array.isArray(memoryAdapted)).toBe(true);

    // 验证记忆已被创建
    const memoryStatus = memoryManager.getMemoryStatus('auto-created-shape');
    expect(memoryStatus).toBeDefined();
    expect(memoryStatus!.isValid).toBe(true);

    // 场景3：使用已存在的记忆进行适配
    const anotherSize: CanvasSize = { width: 1200, height: 900 };
    const existingMemoryAdapted = await adaptShapeUnified(
      originalShape, // 这个参数在有记忆时会被忽略
      oldSize,       // 这个参数在有记忆时会被忽略
      anotherSize,
      {
        memoryManager,
        shapeMemoryId: 'auto-created-shape',
        createMemoryIfNeeded: false
      }
    );

    expect(existingMemoryAdapted).toHaveLength(6);
    expect(Array.isArray(existingMemoryAdapted)).toBe(true);

    // 验证三种适配方式都保持了形状的基本特征
    const directBounds = calculateBounds(directAdapted);
    const memoryBounds = calculateBounds(memoryAdapted);
    const existingBounds = calculateBounds(existingMemoryAdapted);

    // 形状的宽高比应该相近
    const directRatio = directBounds.width / directBounds.height;
    const memoryRatio = memoryBounds.width / memoryBounds.height;
    const existingRatio = existingBounds.width / existingBounds.height;

    expect(Math.abs(directRatio - memoryRatio)).toBeLessThan(0.1);
    expect(Math.abs(memoryRatio - existingRatio)).toBeLessThan(0.1);
  });

  test('应该正确处理记忆系统的错误情况', async () => {
    // 测试各种错误情况的处理

    // 1. 尝试适配不存在的记忆
    try {
      await memoryManager.adaptShapeToCanvas('non-existent-memory', { width: 800, height: 600 });
      expect(false).toBe(true); // 不应该到达这里
    } catch (error) {
      expect(error).toBeDefined();
    }

    // 2. 使用无效的形状数据创建记忆
    try {
      await memoryManager.createShapeMemory([], { width: 400, height: 400 });
      expect(false).toBe(true); // 不应该到达这里
    } catch (error) {
      expect(error).toBeDefined();
    }

    // 3. 使用无效的画布尺寸
    const validShape: Point[] = [
      { x: 100, y: 100 },
      { x: 200, y: 100 },
      { x: 200, y: 200 },
      { x: 100, y: 200 }
    ];

    try {
      await memoryManager.createShapeMemory(validShape, { width: 0, height: 0 });
      expect(false).toBe(true); // 不应该到达这里
    } catch (error) {
      expect(error).toBeDefined();
    }

    // 4. 测试记忆系统的恢复能力
    const memoryId = await memoryManager.createShapeMemory(
      validShape, 
      { width: 400, height: 400 },
      'recovery-test'
    );

    // 正常适配应该成功
    const normalAdapted = await memoryManager.adaptShapeToCanvas(
      memoryId, 
      { width: 800, height: 600 }
    );
    expect(normalAdapted.points).toHaveLength(4);

    // 使用极端的画布尺寸测试边界情况 - 这应该会失败或产生警告
    try {
      const extremeAdapted = await memoryManager.adaptShapeToCanvas(
        memoryId, 
        { width: 10, height: 10000 }
      );
      // 如果成功，验证基本结构
      expect(extremeAdapted.points).toHaveLength(4);
      // 对于极端情况，边界适配可能为负值，这是正常的
      expect(typeof extremeAdapted.adaptationMetrics.boundaryFit).toBe('number');
    } catch (error) {
      // 极端情况下适配失败是可以接受的
      expect(error).toBeDefined();
      console.log('极端画布适配失败（预期行为）:', error.message);
    }
  });

  test('应该提供完整的调试和监控信息', async () => {
    // 创建多个形状进行全面的监控测试
    
    const shapes = [
      { points: [{ x: 100, y: 100 }, { x: 200, y: 200 }, { x: 100, y: 200 }], id: 'triangle' },
      { points: [{ x: 100, y: 100 }, { x: 200, y: 100 }, { x: 200, y: 200 }, { x: 100, y: 200 }], id: 'square' },
      { points: generateCirclePoints(150, 150, 50, 8), id: 'octagon' }
    ];

    const originalCanvas: CanvasSize = { width: 300, height: 300 };
    const memoryIds: string[] = [];

    // 创建所有形状的记忆
    for (const shape of shapes) {
      const memoryId = await memoryManager.createShapeMemory(
        shape.points, 
        originalCanvas, 
        shape.id
      );
      memoryIds.push(memoryId);
    }

    // 执行多次适配操作
    const targetSizes: CanvasSize[] = [
      { width: 600, height: 400 },
      { width: 800, height: 800 },
      { width: 1200, height: 600 }
    ];

    for (const targetSize of targetSizes) {
      await Promise.all(
        memoryIds.map(id => memoryManager.adaptShapeToCanvas(id, targetSize))
      );
    }

    // 检查性能指标
    const metrics = memoryManager.getPerformanceMetrics();
    expect(metrics.totalMemories).toBe(3);
    expect(metrics.totalAdaptations).toBe(9); // 3 shapes × 3 sizes
    expect(metrics.successRate).toBe(1.0);
    expect(metrics.averageAdaptationTime).toBeGreaterThan(0);

    // 检查每个记忆的状态
    for (const memoryId of memoryIds) {
      const status = memoryManager.getMemoryStatus(memoryId);
      expect(status).toBeDefined();
      expect(status!.isValid).toBe(true);
      expect(status!.integrityScore).toBeGreaterThan(0.9);

      const snapshot = memoryManager.getMemorySnapshot(memoryId);
      expect(snapshot).toBeDefined();
      expect(snapshot!.memory.topology.nodes.length).toBeGreaterThan(0);

      const history = memoryManager.getAdaptationHistory(memoryId);
      expect(history).toHaveLength(3); // 每个形状适配了3次
      history.forEach(record => {
        expect(record.success).toBe(true);
        expect(record.metrics.processingTime).toBeGreaterThan(0);
      });
    }

    console.log('完整监控信息:', {
      performanceMetrics: metrics,
      memoryStatuses: memoryIds.map(id => ({
        id,
        status: memoryManager.getMemoryStatus(id)
      }))
    });
  });

  // 辅助函数：计算点集的边界框
  function calculateBounds(points: Point[]) {
    if (points.length === 0) {
      return { width: 0, height: 0, minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    let minX = points[0].x, maxX = points[0].x;
    let minY = points[0].y, maxY = points[0].y;

    points.forEach(point => {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    });

    return {
      width: maxX - minX,
      height: maxY - minY,
      minX, maxX, minY, maxY
    };
  }

  // 辅助函数：生成圆形点
  function generateCirclePoints(centerX: number, centerY: number, radius: number, sides: number): Point[] {
    const points: Point[] = [];
    for (let i = 0; i < sides; i++) {
      const angle = (i * Math.PI * 2) / sides;
      points.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius
      });
    }
    return points;
  }
});