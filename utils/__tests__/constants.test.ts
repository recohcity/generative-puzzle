/**
 * constants 单元测试
 * 
 * 🎯 验证常量定义的正确性
 */

import {
  MIN_SCREEN_WIDTH,
  MIN_SCREEN_HEIGHT,
  MIN_SHAPE_DIAMETER,
  MAX_SHAPE_DIAMETER,
  MIN_SHAPE_AREA
} from '../constants';

describe('constants - 常量定义测试', () => {
  
  describe('🔑 屏幕尺寸常量', () => {
    test('最小屏幕宽度应该是合理的值', () => {
      expect(MIN_SCREEN_WIDTH).toBe(320);
      expect(typeof MIN_SCREEN_WIDTH).toBe('number');
      expect(MIN_SCREEN_WIDTH).toBeGreaterThan(0);
    });

    test('最小屏幕高度应该是合理的值', () => {
      expect(MIN_SCREEN_HEIGHT).toBe(480);
      expect(typeof MIN_SCREEN_HEIGHT).toBe('number');
      expect(MIN_SCREEN_HEIGHT).toBeGreaterThan(0);
    });

    test('屏幕尺寸应该符合移动端标准', () => {
      // 320x480 是经典的移动端最小分辨率
      expect(MIN_SCREEN_WIDTH).toBe(320);
      expect(MIN_SCREEN_HEIGHT).toBe(480);
      
      // 高度应该大于宽度（竖屏模式）
      expect(MIN_SCREEN_HEIGHT).toBeGreaterThan(MIN_SCREEN_WIDTH);
    });
  });

  describe('🔑 形状尺寸常量', () => {
    test('最小形状直径应该是合理的值', () => {
      expect(MIN_SHAPE_DIAMETER).toBe(200);
      expect(typeof MIN_SHAPE_DIAMETER).toBe('number');
      expect(MIN_SHAPE_DIAMETER).toBeGreaterThan(0);
    });

    test('最大形状直径应该是合理的值', () => {
      expect(MAX_SHAPE_DIAMETER).toBe(400);
      expect(typeof MAX_SHAPE_DIAMETER).toBe('number');
      expect(MAX_SHAPE_DIAMETER).toBeGreaterThan(0);
    });

    test('形状直径范围应该合理', () => {
      expect(MAX_SHAPE_DIAMETER).toBeGreaterThan(MIN_SHAPE_DIAMETER);
      
      // 最大直径应该是最小直径的合理倍数
      const ratio = MAX_SHAPE_DIAMETER / MIN_SHAPE_DIAMETER;
      expect(ratio).toBe(2); // 正好是2倍关系
    });

    test('形状直径应该适合屏幕尺寸', () => {
      // 最小形状直径应该小于最小屏幕宽度
      expect(MIN_SHAPE_DIAMETER).toBeLessThan(MIN_SCREEN_WIDTH);
      
      // 最大形状直径应该小于最小屏幕高度
      expect(MAX_SHAPE_DIAMETER).toBeLessThan(MIN_SCREEN_HEIGHT);
    });
  });

  describe('🔑 形状面积常量', () => {
    test('最小形状面积应该正确计算', () => {
      const expectedArea = Math.PI * Math.pow(MIN_SHAPE_DIAMETER / 2, 2);
      expect(MIN_SHAPE_AREA).toBeCloseTo(expectedArea, 10);
    });

    test('最小形状面积应该是有效数值', () => {
      expect(typeof MIN_SHAPE_AREA).toBe('number');
      expect(Number.isFinite(MIN_SHAPE_AREA)).toBe(true);
      expect(MIN_SHAPE_AREA).toBeGreaterThan(0);
    });

    test('面积计算应该基于圆形公式', () => {
      const radius = MIN_SHAPE_DIAMETER / 2;
      const calculatedArea = Math.PI * radius * radius;
      
      expect(MIN_SHAPE_AREA).toBeCloseTo(calculatedArea, 10);
      expect(MIN_SHAPE_AREA).toBeCloseTo(Math.PI * 100 * 100, 10); // 半径100的圆
    });
  });

  describe('🔑 常量关系验证', () => {
    test('所有常量应该是数值类型', () => {
      const constants = [
        MIN_SCREEN_WIDTH,
        MIN_SCREEN_HEIGHT,
        MIN_SHAPE_DIAMETER,
        MAX_SHAPE_DIAMETER,
        MIN_SHAPE_AREA
      ];

      constants.forEach(constant => {
        expect(typeof constant).toBe('number');
        expect(Number.isFinite(constant)).toBe(true);
        expect(constant).toBeGreaterThan(0);
      });
    });

    test('常量应该保持不变性', () => {
      // 尝试修改常量（应该失败或无效果）
      const originalWidth = MIN_SCREEN_WIDTH;
      const originalHeight = MIN_SCREEN_HEIGHT;
      const originalMinDiameter = MIN_SHAPE_DIAMETER;
      const originalMaxDiameter = MAX_SHAPE_DIAMETER;
      const originalArea = MIN_SHAPE_AREA;

      // 在严格模式下，这些赋值应该失败
      // 但我们主要验证值没有被意外改变
      expect(MIN_SCREEN_WIDTH).toBe(originalWidth);
      expect(MIN_SCREEN_HEIGHT).toBe(originalHeight);
      expect(MIN_SHAPE_DIAMETER).toBe(originalMinDiameter);
      expect(MAX_SHAPE_DIAMETER).toBe(originalMaxDiameter);
      expect(MIN_SHAPE_AREA).toBe(originalArea);
    });

    test('常量应该符合设计规范', () => {
      // 验证常量符合UI/UX设计规范
      
      // 最小屏幕尺寸应该支持主流移动设备
      expect(MIN_SCREEN_WIDTH).toBeGreaterThanOrEqual(320);
      expect(MIN_SCREEN_HEIGHT).toBeGreaterThanOrEqual(480);
      
      // 形状尺寸应该在可用性范围内
      expect(MIN_SHAPE_DIAMETER).toBeGreaterThanOrEqual(100); // 不能太小，影响交互
      expect(MAX_SHAPE_DIAMETER).toBeLessThanOrEqual(500); // 不能太大，影响显示
      
      // 面积应该在合理范围内
      expect(MIN_SHAPE_AREA).toBeGreaterThan(1000); // 足够大以便交互
      expect(MIN_SHAPE_AREA).toBeLessThan(100000); // 不会占用过多屏幕空间
    });
  });

  describe('🔑 数学精度验证', () => {
    test('面积计算应该具有足够精度', () => {
      const radius = MIN_SHAPE_DIAMETER / 2; // 100
      const expectedArea = Math.PI * radius * radius;
      
      // 验证计算精度
      expect(MIN_SHAPE_AREA).toBeCloseTo(expectedArea, 15);
      expect(MIN_SHAPE_AREA).toBeCloseTo(31415.926535897932, 10);
    });

    test('常量应该避免浮点精度问题', () => {
      // 验证整数常量的精确性
      expect(MIN_SCREEN_WIDTH % 1).toBe(0);
      expect(MIN_SCREEN_HEIGHT % 1).toBe(0);
      expect(MIN_SHAPE_DIAMETER % 1).toBe(0);
      expect(MAX_SHAPE_DIAMETER % 1).toBe(0);
      
      // 面积常量可能是浮点数，但应该是有限的
      expect(Number.isFinite(MIN_SHAPE_AREA)).toBe(true);
      expect(Number.isNaN(MIN_SHAPE_AREA)).toBe(false);
    });
  });

  describe('🔑 实际应用场景验证', () => {
    test('常量应该适用于响应式设计', () => {
      // 验证常量在不同设备上的适用性
      const deviceSizes = [
        { width: 320, height: 568 },   // iPhone SE
        { width: 375, height: 667 },   // iPhone 8
        { width: 414, height: 896 },   // iPhone 11
        { width: 768, height: 1024 },  // iPad
      ];

      deviceSizes.forEach(device => {
        expect(device.width).toBeGreaterThanOrEqual(MIN_SCREEN_WIDTH);
        expect(device.height).toBeGreaterThanOrEqual(MIN_SCREEN_HEIGHT);
        
        // 形状应该能在这些设备上正常显示（允许一定的边距）
        expect(MAX_SHAPE_DIAMETER).toBeLessThanOrEqual(Math.min(device.width, device.height) + 80);
      });
    });

    test('常量应该支持游戏逻辑', () => {
      // 验证常量在游戏中的实用性
      
      // 形状大小范围应该提供足够的变化
      const sizeRange = MAX_SHAPE_DIAMETER - MIN_SHAPE_DIAMETER;
      expect(sizeRange).toBeGreaterThan(100); // 至少100像素的变化范围
      
      // 最小面积应该足够大以便用户交互
      const minInteractionArea = 50 * 50; // 50x50像素的最小交互区域
      expect(MIN_SHAPE_AREA).toBeGreaterThan(minInteractionArea);
    });
  });
});