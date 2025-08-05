/**
 * SimpleAdapter 单元测试
 * 
 * 🎯 验证最高级别监督指令合规性
 */

import { scaleElement, adaptAllElements } from '../SimpleAdapter';

describe('SimpleAdapter - 监督指令合规性测试', () => {
  
  // 测试数据
  const originalSize = { width: 800, height: 600 };
  const targetSize = { width: 1200, height: 900 };
  
  const testElement = {
    x: 400, // 原始中心位置
    y: 300,
    points: [
      { x: 390, y: 290 },
      { x: 410, y: 290 },
      { x: 410, y: 310 },
      { x: 390, y: 310 }
    ],
    rotation: 45,
    isCompleted: true,
    customProperty: 'test'
  };

  describe('🔑 纯函数原则验证', () => {
    test('相同输入应产生相同输出', () => {
      const result1 = scaleElement(testElement, originalSize, targetSize);
      const result2 = scaleElement(testElement, originalSize, targetSize);
      
      expect(result1).toEqual(result2);
      expect(result1.x).toBe(result2.x);
      expect(result1.y).toBe(result2.y);
      expect(result1.points).toEqual(result2.points);
    });

    test('不应修改原始输入对象', () => {
      const originalElement = { ...testElement };
      scaleElement(testElement, originalSize, targetSize);
      
      expect(testElement).toEqual(originalElement);
    });

    test('无副作用 - 多次调用不影响结果', () => {
      const firstCall = scaleElement(testElement, originalSize, targetSize);
      const secondCall = scaleElement(testElement, originalSize, targetSize);
      const thirdCall = scaleElement(testElement, originalSize, targetSize);
      
      expect(firstCall).toEqual(secondCall);
      expect(secondCall).toEqual(thirdCall);
    });
  });

  describe('🔑 状态无关原则验证', () => {
    test('应保持游戏属性不变', () => {
      const result = scaleElement(testElement, originalSize, targetSize);
      
      // 游戏属性应保持不变
      expect(result.rotation).toBe(testElement.rotation);
      expect(result.isCompleted).toBe(testElement.isCompleted);
      expect(result.customProperty).toBe(testElement.customProperty);
    });

    test('只应改变位置和大小相关属性', () => {
      const result = scaleElement(testElement, originalSize, targetSize);
      
      // 位置应该改变
      expect(result.x).not.toBe(testElement.x);
      expect(result.y).not.toBe(testElement.y);
      
      // 点坐标应该改变
      expect(result.points![0].x).not.toBe(testElement.points![0].x);
      expect(result.points![0].y).not.toBe(testElement.points![0].y);
      
      // 其他属性不变
      expect(result.rotation).toBe(testElement.rotation);
      expect(result.isCompleted).toBe(testElement.isCompleted);
    });
  });

  describe('🔑 统一处理原则验证', () => {
    test('不同类型元素应使用相同缩放算法', () => {
      const shapePoint = { x: 400, y: 300 };
      const puzzlePiece = { x: 400, y: 300, rotation: 0, isCompleted: false };
      const hintPosition = { x: 400, y: 300, isHint: true };
      
      const scaledShape = scaleElement(shapePoint, originalSize, targetSize);
      const scaledPuzzle = scaleElement(puzzlePiece, originalSize, targetSize);
      const scaledHint = scaleElement(hintPosition, originalSize, targetSize);
      
      // 相同原始位置应产生相同的缩放位置
      expect(scaledShape.x).toBe(scaledPuzzle.x);
      expect(scaledShape.y).toBe(scaledPuzzle.y);
      expect(scaledShape.x).toBe(scaledHint.x);
      expect(scaledShape.y).toBe(scaledHint.y);
    });

    test('缩放比例计算应一致', () => {
      // 计算期望的缩放比例
      const expectedScale = Math.min(targetSize.width, targetSize.height) / 
                           Math.min(originalSize.width, originalSize.height);
      
      const result = scaleElement(testElement, originalSize, targetSize);
      
      // 验证实际缩放比例
      const actualScaleX = (result.x - targetSize.width/2) / (testElement.x - originalSize.width/2);
      const actualScaleY = (result.y - targetSize.height/2) / (testElement.y - originalSize.height/2);
      
      expect(Math.abs(actualScaleX - expectedScale)).toBeLessThan(0.001);
      expect(Math.abs(actualScaleY - expectedScale)).toBeLessThan(0.001);
    });
  });

  describe('🔑 批量适配功能验证', () => {
    test('应正确处理元素数组', () => {
      const elements = [
        { x: 200, y: 150 },
        { x: 400, y: 300 },
        { x: 600, y: 450 }
      ];
      
      const result = adaptAllElements(elements, originalSize, targetSize);
      
      expect(result).toHaveLength(3);
      expect(result[0].x).not.toBe(elements[0].x);
      expect(result[1].x).not.toBe(elements[1].x);
      expect(result[2].x).not.toBe(elements[2].x);
    });

    test('空数组应返回空数组', () => {
      const result = adaptAllElements([], originalSize, targetSize);
      expect(result).toEqual([]);
    });
  });

  describe('🔑 跨设备一致性验证', () => {
    test('桌面端和移动端应产生一致结果', () => {
      // 模拟桌面端尺寸
      const desktopFrom = { width: 1920, height: 1080 };
      const desktopTo = { width: 1600, height: 900 };
      
      // 模拟移动端尺寸
      const mobileFrom = { width: 375, height: 667 };
      const mobileTo = { width: 414, height: 736 };
      
      // 相同相对位置的元素
      const desktopElement = { x: 960, y: 540 }; // 桌面端中心
      const mobileElement = { x: 187.5, y: 333.5 }; // 移动端中心
      
      const desktopResult = scaleElement(desktopElement, desktopFrom, desktopTo);
      const mobileResult = scaleElement(mobileElement, mobileFrom, mobileTo);
      
      // 验证都缩放到各自的中心位置
      expect(Math.abs(desktopResult.x - desktopTo.width/2)).toBeLessThan(1);
      expect(Math.abs(desktopResult.y - desktopTo.height/2)).toBeLessThan(1);
      expect(Math.abs(mobileResult.x - mobileTo.width/2)).toBeLessThan(1);
      expect(Math.abs(mobileResult.y - mobileTo.height/2)).toBeLessThan(1);
    });
  });

  describe('🔑 性能基准测试', () => {
    test('单个元素适配应在10ms内完成', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        scaleElement(testElement, originalSize, targetSize);
      }
      
      const endTime = performance.now();
      const avgTime = (endTime - startTime) / 1000;
      
      expect(avgTime).toBeLessThan(10); // 平均每次 < 10ms
    });

    test('批量适配应高效处理', () => {
      const elements = Array.from({ length: 100 }, (_, i) => ({
        x: i * 10,
        y: i * 10,
        points: [{ x: i * 10, y: i * 10 }]
      }));
      
      const startTime = performance.now();
      adaptAllElements(elements, originalSize, targetSize);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(10); // 100个元素 < 10ms
    });
  });

  describe('🔑 边界条件测试', () => {
    test('相同尺寸应返回原始位置', () => {
      const sameSize = { width: 800, height: 600 };
      const result = scaleElement(testElement, sameSize, sameSize);
      
      expect(result.x).toBe(testElement.x);
      expect(result.y).toBe(testElement.y);
    });

    test('无points属性的元素应正常处理', () => {
      const elementWithoutPoints = { x: 400, y: 300, rotation: 0 };
      const result = scaleElement(elementWithoutPoints, originalSize, targetSize);
      
      expect(result.x).toBeDefined();
      expect(result.y).toBeDefined();
      expect(result.rotation).toBe(0);
      expect((result as any).points).toBeUndefined();
    });
  });
});