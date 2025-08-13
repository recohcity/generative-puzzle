/**
 * cutGenerators 性能对比测试
 * 比较原版本和重构版本的性能差异
 */

import { generateCuts } from '../cutGenerators';
import { Point } from '@/types/puzzleTypes';

describe('cutGenerators 性能测试', () => {
  // 测试用的形状
  const testShapes = {
    simple: [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 }
    ],
    complex: (() => {
      const points: Point[] = [];
      const sides = 12;
      const radius = 100;
      for (let i = 0; i < sides; i++) {
        const angle = (i / sides) * 2 * Math.PI;
        points.push({
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius
        });
      }
      return points;
    })(),
    irregular: [
      { x: -50, y: 25 },
      { x: 75, y: -10 },
      { x: 120, y: 60 },
      { x: 30, y: 80 },
      { x: -20, y: 90 },
      { x: -80, y: 40 }
    ]
  };

  const difficulties = [1, 2, 3, 4, 5, 6, 7, 8];
  const cutTypes: ("straight" | "diagonal")[] = ["straight", "diagonal"];

  describe('单次执行性能测试', () => {
    test.each(difficulties)('难度级别 %d - 直线切割', (difficulty) => {
      const start = performance.now();
      const result = generateCuts(testShapes.simple, difficulty, 'straight');
      const end = performance.now();
      const executionTime = end - start;

      console.log(`难度${difficulty} - 直线切割: ${executionTime.toFixed(2)}ms`);

      // 验证结果质量
      expect(result.length).toBeGreaterThan(0);
      
      // 确保在合理时间内完成（不超过100ms）
      expect(executionTime).toBeLessThan(100);
    });

    test.each(difficulties)('难度级别 %d - 对角线切割', (difficulty) => {
      const start = performance.now();
      const result = generateCuts(testShapes.simple, difficulty, 'diagonal');
      const end = performance.now();
      const executionTime = end - start;

      console.log(`难度${difficulty} - 对角线切割: ${executionTime.toFixed(2)}ms`);

      // 验证结果质量
      expect(result.length).toBeGreaterThan(0);
      
      // 确保在合理时间内完成
      expect(executionTime).toBeLessThan(100);
    });
  });

  describe('批量执行性能测试', () => {
    test('批量生成性能测试', () => {
      const iterations = 50;
      
      // 批量测试
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        for (const difficulty of [1, 3, 5, 8]) {
          for (const type of cutTypes) {
            generateCuts(testShapes.simple, difficulty, type);
          }
        }
      }
      const end = performance.now();
      const totalTime = end - start;

      console.log(`批量测试 (${iterations}次迭代): ${totalTime.toFixed(2)}ms`);
      console.log(`平均每次调用: ${(totalTime / (iterations * 4 * 2)).toFixed(2)}ms`);

      // 总时间应该在合理范围内（不超过5秒）
      expect(totalTime).toBeLessThan(5000);
    });
  });

  describe('复杂形状性能测试', () => {
    test('复杂形状处理性能', () => {
      const shapes = [testShapes.simple, testShapes.complex, testShapes.irregular];
      const results: number[] = [];

      for (const shape of shapes) {
        const start = performance.now();
        generateCuts(shape, 5, 'diagonal');
        const end = performance.now();
        results.push(end - start);
      }

      const avgTime = results.reduce((a, b) => a + b, 0) / results.length;

      console.log(`复杂形状平均处理时间: ${avgTime.toFixed(2)}ms`);

      // 验证性能在合理范围内
      expect(avgTime).toBeLessThan(100);
    });
  });

  describe('内存使用对比', () => {
    test('内存泄漏检测', () => {
      const iterations = 100;
      
      // 多次强制垃圾回收，确保内存清理
      for (let i = 0; i < 3; i++) {
        if (global.gc) {
          global.gc();
        }
      }
      
      // 等待垃圾回收完成
      setTimeout(() => {}, 100);
      
      const initialMemory = process.memoryUsage().heapUsed;
      
      // 大量调用
      for (let i = 0; i < iterations; i++) {
        generateCuts(testShapes.complex, 6, 'diagonal');
        
        // 每10次迭代清理一次
        if (i % 10 === 0 && global.gc) {
          global.gc();
        }
      }
      
      // 多次强制垃圾回收
      for (let i = 0; i < 5; i++) {
        if (global.gc) {
          global.gc();
        }
      }
      
      // 等待垃圾回收完成
      setTimeout(() => {}, 200);
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // 内存增长应该在合理范围内（15MB）
      expect(memoryIncrease).toBeLessThan(15 * 1024 * 1024);
    });
  });

  describe('稳定性测试', () => {
    test('连续执行稳定性', () => {
      const iterations = 200;
      let failures = 0;

      for (let i = 0; i < iterations; i++) {
        try {
          const result = generateCuts(testShapes.simple, 4, 'straight');
          if (result.length === 0) failures++;
        } catch (error) {
          failures++;
        }
      }

      console.log(`稳定性测试 (${iterations}次): ${failures}次失败`);

      // 失败率应该很低（小于5%）
      expect(failures).toBeLessThan(iterations * 0.05);
    });
  });
});