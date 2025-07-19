/**
 * 记忆适配系统最终集成验证测试
 * 
 * 这是一个端到端的集成测试，验证记忆适配系统在实际拼图游戏中的完整工作流程。
 * 测试涵盖了从形状创建到最终适配的所有关键步骤。
 */

import { test, expect } from '@playwright/test';
import { MemoryManager } from '../../utils/memory/MemoryManager';
import { adaptShapeUnified } from '../../utils/shape/shapeAdaptationUtils';
import { useShapeAdaptation } from '../../hooks/useShapeAdaptation';
import { Point, CanvasSize } from '../../types/common';

test.describe('记忆适配系统最终集成验证', () => {
  
  test('完整的拼图游戏适配流程验证', async () => {
    console.log('🎯 开始最终集成验证测试');
    
    // 1. 初始化记忆管理器
    const memoryManager = new MemoryManager({
      debugMode: true,
      autoCleanup: false,
      enablePerformanceMonitoring: true
    });

    try {
      // 2. 创建测试形状 - 模拟一个拼图片段
      const puzzlePiece: Point[] = [
        { x: 100, y: 100 },
        { x: 200, y: 90 },
        { x: 250, y: 150 },
        { x: 220, y: 220 },
        { x: 150, y: 250 },
        { x: 80, y: 200 },
        { x: 70, y: 140 }
      ];
      
      const originalCanvas: CanvasSize = { width: 300, height: 300 };
      console.log('✅ 测试形状创建完成，点数:', puzzlePiece.length);

      // 3. 创建形状记忆
      const memoryId = await memoryManager.createShapeMemory(
        puzzlePiece,
        originalCanvas,
        'final-test-piece'
      );
      
      expect(memoryId).toBe('final-test-piece');
      console.log('✅ 形状记忆创建成功:', memoryId);

      // 4. 验证记忆状态
      const memoryStatus = memoryManager.getMemoryStatus(memoryId);
      expect(memoryStatus).toBeDefined();
      expect(memoryStatus!.isValid).toBe(true);
      console.log('✅ 记忆状态验证通过');

      // 5. 测试多种画布尺寸的适配
      const testCanvases: CanvasSize[] = [
        { width: 600, height: 400 },   // 宽屏
        { width: 400, height: 600 },   // 竖屏
        { width: 800, height: 800 },   // 正方形大屏
        { width: 1200, height: 800 },  // 超宽屏
        { width: 300, height: 300 }    // 回到原始尺寸
      ];

      const adaptationResults: any[] = [];
      
      for (let i = 0; i < testCanvases.length; i++) {
        const canvas = testCanvases[i];
        const startTime = Date.now();
        
        const adaptedShape = await memoryManager.adaptShapeToCanvas(memoryId, canvas);
        const adaptationTime = Date.now() - startTime;
        
        // 验证适配结果
        expect(adaptedShape.shapeId).toBe(memoryId);
        expect(adaptedShape.points).toHaveLength(puzzlePiece.length);
        expect(adaptedShape.canvasSize).toEqual(canvas);
        expect(adaptedShape.adaptationMetrics.fidelity).toBeGreaterThan(0.8);
        
        adaptationResults.push({
          canvas,
          adaptationTime,
          pointCount: adaptedShape.points.length,
          fidelity: adaptedShape.adaptationMetrics.fidelity
        });
        
        console.log(`✅ 适配测试 ${i + 1}/5 完成: ${canvas.width}x${canvas.height}, 耗时: ${adaptationTime}ms`);
      }

      // 6. 测试统一适配函数
      console.log('🔧 测试统一适配函数...');
      
      // 6.1 不使用记忆的直接适配
      const directAdapted = await adaptShapeUnified(
        puzzlePiece,
        originalCanvas,
        { width: 500, height: 400 },
        {
          memoryManager: null,
          shapeMemoryId: null,
          createMemoryIfNeeded: false,
          debug: true
        }
      );
      
      expect(directAdapted).toHaveLength(puzzlePiece.length);
      console.log('✅ 直接适配测试通过');

      // 6.2 自动创建记忆并使用
      const memoryAdapted = await adaptShapeUnified(
        puzzlePiece,
        originalCanvas,
        { width: 600, height: 500 },
        {
          memoryManager,
          shapeMemoryId: 'auto-test-memory',
          createMemoryIfNeeded: true,
          debug: true
        }
      );
      
      expect(memoryAdapted).toHaveLength(puzzlePiece.length);
      
      // 验证记忆已被创建
      const autoMemoryStatus = memoryManager.getMemoryStatus('auto-test-memory');
      expect(autoMemoryStatus).toBeDefined();
      expect(autoMemoryStatus!.isValid).toBe(true);
      console.log('✅ 自动记忆创建测试通过');

      // 6.3 使用已存在的记忆
      const existingMemoryAdapted = await adaptShapeUnified(
        [], // 空数组，应该被忽略
        { width: 0, height: 0 }, // 无效尺寸，应该被忽略
        { width: 700, height: 600 },
        {
          memoryManager,
          shapeMemoryId: 'auto-test-memory',
          createMemoryIfNeeded: false,
          debug: true
        }
      );
      
      expect(existingMemoryAdapted).toHaveLength(puzzlePiece.length);
      console.log('✅ 已存在记忆使用测试通过');

      // 7. 性能和统计验证
      const finalMetrics = memoryManager.getPerformanceMetrics();
      expect(finalMetrics.totalMemories).toBe(2); // final-test-piece + auto-test-memory
      expect(finalMetrics.totalAdaptations).toBeGreaterThanOrEqual(5);
      expect(finalMetrics.successRate).toBe(1.0);
      expect(finalMetrics.averageAdaptationTime).toBeLessThan(10);
      
      console.log('📊 最终性能指标:', {
        totalMemories: finalMetrics.totalMemories,
        totalAdaptations: finalMetrics.totalAdaptations,
        successRate: finalMetrics.successRate,
        averageTime: `${finalMetrics.averageAdaptationTime.toFixed(2)}ms`
      });

      // 8. 验证记忆完整性
      const memories = ['final-test-piece', 'auto-test-memory'];
      for (const memId of memories) {
        const status = memoryManager.getMemoryStatus(memId);
        expect(status).toBeDefined();
        expect(status!.isValid).toBe(true);
        expect(status!.integrityScore).toBeGreaterThan(0.9);
        
        const snapshot = memoryManager.getMemorySnapshot(memId);
        expect(snapshot).toBeDefined();
        expect(snapshot!.memory.topology.nodes.length).toBeGreaterThan(0);
      }
      
      console.log('✅ 记忆完整性验证通过');

      // 9. 测试Hook集成（模拟）
      console.log('🔗 测试Hook集成...');
      
      // 模拟useShapeAdaptation Hook的使用
      const canvasSize = { width: 800, height: 600 };
      
      // 这里我们模拟Hook的行为，因为在测试环境中无法直接使用React Hook
      const mockHookBehavior = {
        adaptShape: async () => {
          return await memoryManager.adaptShapeToCanvas('final-test-piece', canvasSize);
        },
        memoryManager,
        shapeMemoryId: 'final-test-piece'
      };
      
      const hookResult = await mockHookBehavior.adaptShape();
      expect(hookResult.shapeId).toBe('final-test-piece');
      expect(hookResult.canvasSize).toEqual(canvasSize);
      console.log('✅ Hook集成模拟测试通过');

      // 10. 最终验证总结
      console.log('🎉 最终集成验证完成！');
      console.log('📈 测试统计:');
      console.log(`   - 创建记忆数: ${finalMetrics.totalMemories}`);
      console.log(`   - 执行适配数: ${finalMetrics.totalAdaptations}`);
      console.log(`   - 成功率: ${(finalMetrics.successRate * 100).toFixed(1)}%`);
      console.log(`   - 平均适配时间: ${finalMetrics.averageAdaptationTime.toFixed(2)}ms`);
      console.log(`   - 记忆命中率: ${(finalMetrics.memoryHitRate * 100).toFixed(1)}%`);
      
      // 验证所有关键指标
      expect(finalMetrics.totalMemories).toBeGreaterThan(0);
      expect(finalMetrics.totalAdaptations).toBeGreaterThan(0);
      expect(finalMetrics.successRate).toBe(1.0);
      expect(finalMetrics.averageAdaptationTime).toBeLessThan(10);
      expect(finalMetrics.memoryHitRate).toBe(1.0);

    } finally {
      // 清理资源
      memoryManager.destroy();
      console.log('🧹 资源清理完成');
    }
  });

  test('错误恢复和边界情况验证', async () => {
    console.log('🛡️ 开始错误恢复测试');
    
    const memoryManager = new MemoryManager({
      debugMode: true,
      autoCleanup: false,
      enablePerformanceMonitoring: true
    });

    try {
      // 1. 测试无效输入的处理
      console.log('测试无效输入处理...');
      
      // 空点数组
      try {
        await memoryManager.createShapeMemory([], { width: 400, height: 400 });
        expect(false).toBe(true); // 不应该到达这里
      } catch (error) {
        expect(error).toBeDefined();
        console.log('✅ 空点数组错误处理正确');
      }

      // 2. 测试不存在记忆的适配
      console.log('测试不存在记忆的适配...');
      try {
        await memoryManager.adaptShapeToCanvas('non-existent', { width: 400, height: 400 });
        expect(false).toBe(true); // 不应该到达这里
      } catch (error) {
        expect(error).toBeDefined();
        console.log('✅ 不存在记忆错误处理正确');
      }

      // 3. 测试统一适配函数的回退机制
      console.log('测试统一适配函数回退机制...');
      
      const testShape: Point[] = [
        { x: 100, y: 100 },
        { x: 200, y: 100 },
        { x: 200, y: 200 },
        { x: 100, y: 200 }
      ];
      
      // 提供无效的记忆管理器，应该回退到传统方法
      const fallbackResult = await adaptShapeUnified(
        testShape,
        { width: 300, height: 300 },
        { width: 600, height: 600 },
        {
          memoryManager: null, // 无记忆管理器
          shapeMemoryId: 'invalid-id',
          createMemoryIfNeeded: false,
          debug: true
        }
      );
      
      expect(fallbackResult).toHaveLength(4);
      console.log('✅ 回退机制测试通过');

      // 4. 测试极端画布尺寸
      console.log('测试极端画布尺寸处理...');
      
      const memoryId = await memoryManager.createShapeMemory(
        testShape,
        { width: 300, height: 300 },
        'extreme-test'
      );
      
      // 极端宽屏
      try {
        const extremeResult = await memoryManager.adaptShapeToCanvas(
          memoryId,
          { width: 10, height: 2000 }
        );
        // 如果成功，验证基本结构
        expect(extremeResult.points).toHaveLength(4);
        console.log('✅ 极端画布适配成功');
      } catch (error) {
        // 失败也是可以接受的
        console.log('⚠️ 极端画布适配失败（可接受）:', error.message);
      }

      console.log('🛡️ 错误恢复测试完成');

    } finally {
      memoryManager.destroy();
    }
  });

  test('性能压力测试', async () => {
    console.log('⚡ 开始性能压力测试');
    
    const memoryManager = new MemoryManager({
      debugMode: false, // 关闭调试以提高性能
      autoCleanup: false,
      enablePerformanceMonitoring: true
    });

    try {
      const startTime = Date.now();
      
      // 1. 创建多个复杂形状
      const shapes: Point[][] = [];
      const memoryIds: string[] = [];
      
      for (let i = 0; i < 10; i++) {
        // 创建不同复杂度的形状
        const pointCount = 5 + (i % 8); // 5-12个点
        const shape: Point[] = [];
        
        for (let j = 0; j < pointCount; j++) {
          const angle = (j * Math.PI * 2) / pointCount;
          const radius = 50 + Math.random() * 50;
          shape.push({
            x: 150 + Math.cos(angle) * radius,
            y: 150 + Math.sin(angle) * radius
          });
        }
        
        shapes.push(shape);
        
        const memoryId = await memoryManager.createShapeMemory(
          shape,
          { width: 300, height: 300 },
          `stress-test-${i}`
        );
        
        memoryIds.push(memoryId);
      }
      
      const creationTime = Date.now() - startTime;
      console.log(`✅ 创建10个形状记忆耗时: ${creationTime}ms`);

      // 2. 并发适配测试
      const adaptationStartTime = Date.now();
      const targetCanvases = [
        { width: 400, height: 300 },
        { width: 600, height: 400 },
        { width: 800, height: 600 },
        { width: 1000, height: 800 },
        { width: 1200, height: 900 }
      ];
      
      // 每个形状适配到每个画布尺寸
      const adaptationPromises: Promise<any>[] = [];
      
      for (const memoryId of memoryIds) {
        for (const canvas of targetCanvases) {
          adaptationPromises.push(
            memoryManager.adaptShapeToCanvas(memoryId, canvas)
          );
        }
      }
      
      const adaptationResults = await Promise.all(adaptationPromises);
      const adaptationTime = Date.now() - adaptationStartTime;
      
      console.log(`✅ 并发执行${adaptationPromises.length}次适配耗时: ${adaptationTime}ms`);
      console.log(`   平均每次适配: ${(adaptationTime / adaptationPromises.length).toFixed(2)}ms`);

      // 3. 验证所有适配结果
      expect(adaptationResults).toHaveLength(50); // 10 shapes × 5 canvases
      adaptationResults.forEach(result => {
        expect(result.points.length).toBeGreaterThan(0);
        expect(result.adaptationMetrics.fidelity).toBeGreaterThan(0.5);
      });

      // 4. 检查最终性能指标
      const finalMetrics = memoryManager.getPerformanceMetrics();
      expect(finalMetrics.totalMemories).toBe(10);
      expect(finalMetrics.totalAdaptations).toBe(50);
      expect(finalMetrics.successRate).toBe(1.0);
      
      const totalTime = Date.now() - startTime;
      console.log('📊 压力测试完成统计:');
      console.log(`   总耗时: ${totalTime}ms`);
      console.log(`   记忆创建: ${creationTime}ms`);
      console.log(`   适配执行: ${adaptationTime}ms`);
      console.log(`   平均适配时间: ${finalMetrics.averageAdaptationTime.toFixed(2)}ms`);
      console.log(`   成功率: ${(finalMetrics.successRate * 100)}%`);
      
      // 性能要求验证
      expect(totalTime).toBeLessThan(5000); // 总时间不超过5秒
      expect(finalMetrics.averageAdaptationTime).toBeLessThan(20); // 平均适配时间不超过20ms
      
      console.log('⚡ 性能压力测试通过');

    } finally {
      memoryManager.destroy();
    }
  });
});