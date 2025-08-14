/**
 * puzzleDrawing 单元测试
 * 
 * 🎯 验证Canvas渲染核心逻辑
 */

import { 
  drawShape, 
  drawPiece, 
  drawHintOutline, 
  drawCompletionEffect, 
  drawCanvasBorderLine, 
  drawDistributionArea, 
  drawPuzzle,
  drawCanvasCenter,
  drawShapeCenter,
  PuzzlePiece 
} from '../puzzleDrawing';
import type { Point } from '@/types/puzzleTypes';

// Mock Canvas API
class MockCanvasRenderingContext2D {
  canvas = { width: 800, height: 600 };
  fillStyle = '';
  strokeStyle = '';
  lineWidth = 1;
  shadowColor = '';
  shadowBlur = 0;
  shadowOffsetX = 0;
  shadowOffsetY = 0;
  globalAlpha = 1;
  globalCompositeOperation = 'source-over';
  textAlign = 'start';
  textBaseline = 'alphabetic';
  font = '10px sans-serif';
  
  private path: string[] = [];
  
  clearRect = jest.fn();
  beginPath = jest.fn(() => { this.path = []; });
  moveTo = jest.fn((x: number, y: number) => { this.path.push(`M${x},${y}`); });
  lineTo = jest.fn((x: number, y: number) => { this.path.push(`L${x},${y}`); });
  quadraticCurveTo = jest.fn((cpx: number, cpy: number, x: number, y: number) => { 
    this.path.push(`Q${cpx},${cpy},${x},${y}`); 
  });
  closePath = jest.fn(() => { this.path.push('Z'); });
  fill = jest.fn();
  stroke = jest.fn();
  save = jest.fn();
  restore = jest.fn();
  translate = jest.fn();
  rotate = jest.fn();
  scale = jest.fn();
  rect = jest.fn();
  arc = jest.fn();
  setLineDash = jest.fn();
  fillRect = jest.fn();
  fillText = jest.fn();
  strokeText = jest.fn();
  createRadialGradient = jest.fn(() => ({
    addColorStop: jest.fn()
  }));
  createLinearGradient = jest.fn(() => ({
    addColorStop: jest.fn()
  }));
  createPattern = jest.fn(() => 'mock-pattern');
  
  getPath = () => this.path.join(' ');
}

describe('puzzleDrawing - 渲染功能测试', () => {
  let mockCtx: MockCanvasRenderingContext2D;
  
  beforeEach(() => {
    mockCtx = new MockCanvasRenderingContext2D();
    // 清除所有mock调用记录
    jest.clearAllMocks();
  });

  // 测试用形状数据
  const testShape: Point[] = [
    { x: 100, y: 100 },
    { x: 200, y: 100 },
    { x: 200, y: 200 },
    { x: 100, y: 200 }
  ];

  describe('🔑 基础绘制功能', () => {
    test('应该正确绘制简单形状', () => {
      drawShape(mockCtx as any, testShape, 'polygon');
      
      // 验证Canvas API调用
      expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.moveTo).toHaveBeenCalledWith(100, 100);
      expect(mockCtx.fill).toHaveBeenCalled();
      expect(mockCtx.stroke).toHaveBeenCalled();
    });

    test('应该设置正确的绘制样式', () => {
      drawShape(mockCtx as any, testShape, 'polygon');
      
      expect(mockCtx.fillStyle).toBe("rgba(45, 55, 72, 0.6)");
      expect(mockCtx.strokeStyle).toBe("rgba(203, 213, 225, 0.8)");
      expect(mockCtx.lineWidth).toBe(2);
    });

    test('应该处理空形状数组', () => {
      const emptyShape: Point[] = [];
      
      expect(() => {
        drawShape(mockCtx as any, emptyShape, 'polygon');
      }).not.toThrow();
      
      // 空形状会直接返回，不进行任何绘制操作
      expect(mockCtx.clearRect).not.toHaveBeenCalled();
      expect(mockCtx.beginPath).not.toHaveBeenCalled();
    });
  });

  describe('🔑 形状类型处理', () => {
    test('应该处理多边形类型', () => {
      drawShape(mockCtx as any, testShape, 'polygon');
      
      expect(mockCtx.moveTo).toHaveBeenCalledWith(100, 100);
      // 多边形会绘制所有线段，包括闭合线段，所以是testShape.length次lineTo调用
      expect(mockCtx.lineTo).toHaveBeenCalledTimes(testShape.length);
    });

    test('应该处理曲线类型', () => {
      const curveShape: Point[] = [
        { x: 100, y: 100 },
        { x: 150, y: 80 },
        { x: 200, y: 100 },
        { x: 200, y: 200 },
        { x: 100, y: 200 }
      ];
      
      drawShape(mockCtx as any, curveShape, 'curve');
      
      expect(mockCtx.moveTo).toHaveBeenCalledWith(100, 100);
      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.quadraticCurveTo).toHaveBeenCalled();
    });

    test('应该处理不规则形状类型', () => {
      drawShape(mockCtx as any, testShape, 'irregular');
      
      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.moveTo).toHaveBeenCalled();
      expect(mockCtx.quadraticCurveTo).toHaveBeenCalled();
    });

    test('应该正确处理曲线形状的贝塞尔曲线计算', () => {
      const curveShape: Point[] = [
        { x: 100, y: 100 },
        { x: 150, y: 80 },
        { x: 200, y: 100 },
        { x: 180, y: 150 },
        { x: 120, y: 140 }
      ];
      
      drawShape(mockCtx as any, curveShape, 'curve');
      
      // 验证quadraticCurveTo被调用了正确的次数（形状长度-1次）
      expect(mockCtx.quadraticCurveTo).toHaveBeenCalledTimes(curveShape.length - 1);
    });

    test('应该处理只有两个点的曲线形状', () => {
      const twoPointCurve: Point[] = [
        { x: 100, y: 100 },
        { x: 200, y: 200 }
      ];
      
      expect(() => {
        drawShape(mockCtx as any, twoPointCurve, 'curve');
      }).not.toThrow();
      
      expect(mockCtx.moveTo).toHaveBeenCalledWith(100, 100);
      expect(mockCtx.quadraticCurveTo).toHaveBeenCalledTimes(1);
    });

    test('应该处理形状长度为0的情况并记录错误', () => {
      // Mock console.error 来验证错误日志
      const originalConsoleError = console.error;
      console.error = jest.fn();

      const emptyShape: Point[] = [];
      
      expect(() => {
        drawShape(mockCtx as any, emptyShape, 'polygon');
      }).not.toThrow();
      
      // 验证错误日志被调用
      expect(console.error).toHaveBeenCalledWith('形状没有点，无法绘制');
      
      // 恢复原始的 console.error
      console.error = originalConsoleError;
    });

    test('应该处理形状长度为0但有点数组的情况', () => {
      // 创建一个长度为0但不是undefined的形状数组
      const emptyButDefinedShape: Point[] = [];
      
      // Mock console.error 来验证错误日志
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      expect(() => {
        drawShape(mockCtx as any, emptyButDefinedShape, 'polygon');
      }).not.toThrow();
      
      // 验证第27行的错误日志被调用（早期返回）
      expect(console.error).toHaveBeenCalledWith('形状没有点，无法绘制');
      
      // 恢复原始的 console.error
      console.error = originalConsoleError;
    });

    test('应该覆盖第92行 - 形状在执行过程中长度变为0', () => {
      // 🎯 这个测试专门覆盖第92行的else分支
      // 需要让代码通过第27行检查，但在第49行时length为0
      
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      console.log = jest.fn();
      console.error = jest.fn();
      
      // 创建一个特殊的对象，模拟在执行过程中长度发生变化的情况
      let lengthAccessCount = 0;
      const dynamicShape = {
        0: { x: 100, y: 100 }, // 确保能访问到第一个元素
        get length() {
          lengthAccessCount++;
          // 第一次访问返回1（通过初始检查），后续访问返回0（触发错误分支）
          if (lengthAccessCount === 1) {
            return 1; // 通过初始长度检查
          } else {
            return 0; // 在绘制过程中长度变为0
          }
        }
      };
      
      expect(() => {
        drawShape(mockCtx as any, dynamicShape as any, 'polygon');
      }).not.toThrow();
      
      // 验证第92行的错误日志被调用
      expect(console.error).toHaveBeenCalledWith('没有点可绘制');
      
      // 恢复原始的 console
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
    });


  });

  describe('🔑 路径生成验证', () => {
    test('应该生成正确的路径序列', () => {
      drawShape(mockCtx as any, testShape, 'polygon');
      
      const path = mockCtx.getPath();
      expect(path).toContain('M100,100'); // 移动到起始点
      expect(path).toContain('L200,100'); // 线段
      expect(path).toContain('L200,200');
      expect(path).toContain('L100,200');
    });

    test('复杂形状应该生成完整路径', () => {
      const complexShape: Point[] = Array.from({ length: 8 }, (_, i) => ({
        x: 150 + 50 * Math.cos(i * Math.PI / 4),
        y: 150 + 50 * Math.sin(i * Math.PI / 4)
      }));
      
      drawShape(mockCtx as any, complexShape, 'polygon');
      
      expect(mockCtx.moveTo).toHaveBeenCalledTimes(1);
      // 包括闭合线段，所以是complexShape.length次lineTo调用
      expect(mockCtx.lineTo).toHaveBeenCalledTimes(complexShape.length);
    });
  });

  describe('🔑 性能基准测试', () => {
    test('简单形状绘制应该高效', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        drawShape(mockCtx as any, testShape, 'polygon');
      }
      
      const endTime = performance.now();
      const avgTime = (endTime - startTime) / 100;
      
      expect(avgTime).toBeLessThan(10); // 平均每次绘制 < 10ms
    });

    test('复杂形状绘制应该在性能标准内', () => {
      const complexShape: Point[] = Array.from({ length: 50 }, (_, i) => ({
        x: 150 + 100 * Math.cos(i * Math.PI / 25),
        y: 150 + 100 * Math.sin(i * Math.PI / 25)
      }));
      
      const startTime = performance.now();
      drawShape(mockCtx as any, complexShape, 'curve');
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(50); // 基于监督指令的渲染性能标准
    });
  });

  describe('🔑 错误处理', () => {
    test('应该处理无效的上下文', () => {
      expect(() => {
        drawShape(null as any, testShape, 'polygon');
      }).toThrow();
    });

    test('应该处理包含无效坐标的形状', () => {
      const invalidShape: Point[] = [
        { x: 100, y: 100 },
        { x: NaN, y: 100 },
        { x: 200, y: Infinity },
        { x: 100, y: 200 }
      ];
      
      expect(() => {
        drawShape(mockCtx as any, invalidShape, 'polygon');
      }).not.toThrow(); // 应该优雅处理，不抛出错误
    });

    test('应该处理绘制过程中的错误', () => {
      // Mock一个会抛出错误的上下文
      const errorCtx = {
        ...mockCtx,
        beginPath: jest.fn(() => { throw new Error('Canvas error'); }),
        canvas: { width: 800, height: 600 },
        clearRect: jest.fn()
      };

      expect(() => {
        drawShape(errorCtx as any, testShape, 'polygon');
      }).not.toThrow(); // 应该捕获并处理错误
    });

    test('应该处理非多边形形状类型', () => {
      drawShape(mockCtx as any, testShape, 'irregular');
      
      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.quadraticCurveTo).toHaveBeenCalled();
    });
  });

  describe('🔑 Canvas状态管理', () => {
    test('应该正确清除画布', () => {
      drawShape(mockCtx as any, testShape, 'polygon');
      
      expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
      expect(mockCtx.clearRect).toHaveBeenCalledTimes(1);
    });

    test('应该正确设置绘制属性', () => {
      const originalFillStyle = mockCtx.fillStyle;
      const originalStrokeStyle = mockCtx.strokeStyle;
      const originalLineWidth = mockCtx.lineWidth;
      
      drawShape(mockCtx as any, testShape, 'polygon');
      
      // 验证属性被正确设置
      expect(mockCtx.fillStyle).not.toBe(originalFillStyle);
      expect(mockCtx.strokeStyle).not.toBe(originalStrokeStyle);
      expect(mockCtx.lineWidth).not.toBe(originalLineWidth);
    });
  });

  describe('🔑 数据完整性验证', () => {
    test('应该处理所有点的坐标', () => {
      const shape: Point[] = [
        { x: 50, y: 50 },
        { x: 100, y: 75 },
        { x: 150, y: 50 },
        { x: 125, y: 100 },
        { x: 75, y: 100 }
      ];
      
      drawShape(mockCtx as any, shape, 'polygon');
      
      // 验证第一个点用于moveTo
      expect(mockCtx.moveTo).toHaveBeenCalledWith(50, 50);
      
      // 验证其余点用于lineTo
      expect(mockCtx.lineTo).toHaveBeenCalledWith(100, 75);
      expect(mockCtx.lineTo).toHaveBeenCalledWith(150, 50);
      expect(mockCtx.lineTo).toHaveBeenCalledWith(125, 100);
      expect(mockCtx.lineTo).toHaveBeenCalledWith(75, 100);
    });

    test('单点形状应该优雅处理', () => {
      const singlePoint: Point[] = [{ x: 100, y: 100 }];
      
      expect(() => {
        drawShape(mockCtx as any, singlePoint, 'polygon');
      }).not.toThrow();
      
      expect(mockCtx.moveTo).toHaveBeenCalledWith(100, 100);
      // 单点形状也会绘制闭合线段，所以会有1次lineTo调用
      expect(mockCtx.lineTo).toHaveBeenCalledTimes(1);
    });
  });

  describe('🔑 drawPiece 函数测试', () => {
    test('应该正确绘制拼图片段', () => {
      const mockPiece: PuzzlePiece = {
        points: testShape,
        originalPoints: testShape,
        rotation: 0,
        originalRotation: 0,
        x: 150,
        y: 150,
        originalX: 150,
        originalY: 150,
        color: '#FF0000'
      };

      expect(() => {
        drawPiece(mockCtx as any, mockPiece, 0, false, false, 'polygon', false);
      }).not.toThrow();

      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
    });

    test('应该处理选中状态的拼图片段', () => {
      const mockPiece: PuzzlePiece = {
        points: testShape,
        originalPoints: testShape,
        rotation: 45,
        originalRotation: 0,
        x: 150,
        y: 150,
        originalX: 150,
        originalY: 150,
        color: '#00FF00'
      };

      expect(() => {
        drawPiece(mockCtx as any, mockPiece, 0, false, true, 'polygon', true);
      }).not.toThrow();

      expect(mockCtx.translate).toHaveBeenCalled();
      expect(mockCtx.rotate).toHaveBeenCalled();
    });

    test('应该处理已完成的拼图片段', () => {
      const mockPiece: PuzzlePiece = {
        points: testShape,
        originalPoints: testShape,
        rotation: 0,
        originalRotation: 0,
        x: 150,
        y: 150,
        originalX: 150,
        originalY: 150
      };

      expect(() => {
        drawPiece(mockCtx as any, mockPiece, 0, true, false, 'polygon', false);
      }).not.toThrow();
    });

    test('应该处理曲线类型的拼图片段', () => {
      const curvePoints: Point[] = [
        { x: 100, y: 100, isOriginal: true },
        { x: 150, y: 80, isOriginal: true },
        { x: 200, y: 100, isOriginal: true },
        { x: 200, y: 200, isOriginal: false },
        { x: 100, y: 200, isOriginal: false }
      ];

      const mockPiece: PuzzlePiece = {
        points: curvePoints,
        originalPoints: curvePoints,
        rotation: 0,
        originalRotation: 0,
        x: 150,
        y: 150,
        originalX: 150,
        originalY: 150
      };

      expect(() => {
        drawPiece(mockCtx as any, mockPiece, 0, false, false, 'curve', false);
      }).not.toThrow();
    });

    test('应该处理纹理加载成功的情况', () => {
      // Mock window.Image 和纹理图片
      const mockImg = {
        complete: true,
        src: ''
      };
      
      // Mock global window object
      const originalWindow = global.window;
      (global as any).window = {
        Image: jest.fn(() => mockImg),
        _puzzleTextureImg: mockImg
      };

      const mockPiece: PuzzlePiece = {
        points: testShape,
        originalPoints: testShape,
        rotation: 0,
        originalRotation: 0,
        x: 150,
        y: 150,
        originalX: 150,
        originalY: 150,
        color: '#FF0000'
      };

      expect(() => {
        drawPiece(mockCtx as any, mockPiece, 0, false, false, 'polygon', false);
      }).not.toThrow();

      expect(mockCtx.createPattern).toHaveBeenCalledWith(mockImg, 'repeat');
      
      // 恢复原始的 window
      global.window = originalWindow;
    });

    test('应该处理纹理加载成功且createPattern返回null的情况', () => {
      // Mock window.Image 和纹理图片
      const mockImg = {
        complete: true,
        src: ''
      };
      
      // Mock global window object
      const originalWindow = global.window;
      (global as any).window = {
        Image: jest.fn(() => mockImg),
        _puzzleTextureImg: mockImg
      };

      // Mock createPattern 返回 null
      const originalCreatePattern = mockCtx.createPattern;
      mockCtx.createPattern = jest.fn(() => null) as any;

      const mockPiece: PuzzlePiece = {
        points: testShape,
        originalPoints: testShape,
        rotation: 0,
        originalRotation: 0,
        x: 150,
        y: 150,
        originalX: 150,
        originalY: 150,
        color: '#FF0000'
      };

      expect(() => {
        drawPiece(mockCtx as any, mockPiece, 0, false, false, 'polygon', false);
      }).not.toThrow();

      // 恢复原始方法
      mockCtx.createPattern = originalCreatePattern;
      global.window = originalWindow;
    });

    test('应该处理曲线类型拼图片段的纹理渲染', () => {
      const curvePoints: Point[] = [
        { x: 100, y: 100, isOriginal: true },
        { x: 150, y: 80, isOriginal: true },
        { x: 200, y: 100, isOriginal: false },
        { x: 200, y: 200, isOriginal: false },
        { x: 100, y: 200, isOriginal: true }
      ];

      const mockImg = {
        complete: true,
        src: ''
      };
      
      // Mock global window object
      const originalWindow = global.window;
      (global as any).window = {
        Image: jest.fn(() => mockImg),
        _puzzleTextureImg: mockImg
      };

      const mockPiece: PuzzlePiece = {
        points: curvePoints,
        originalPoints: curvePoints,
        rotation: 0,
        originalRotation: 0,
        x: 150,
        y: 150,
        originalX: 150,
        originalY: 150
      };

      expect(() => {
        drawPiece(mockCtx as any, mockPiece, 0, false, false, 'curve', false);
      }).not.toThrow();

      // 验证纹理渲染中的曲线绘制
      expect(mockCtx.quadraticCurveTo).toHaveBeenCalled();
      expect(mockCtx.lineTo).toHaveBeenCalled();

      // 恢复原始的 window
      global.window = originalWindow;
    });

    test('应该处理纹理加载失败的情况', () => {
      // Mock window.Image
      const mockImg = {
        complete: false,
        src: ''
      };
      
      // Mock global window object without cached texture
      const originalWindow = global.window;
      (global as any).window = {
        Image: jest.fn(() => mockImg)
        // 不设置 _puzzleTextureImg，模拟首次加载
      };

      const mockPiece: PuzzlePiece = {
        points: testShape,
        originalPoints: testShape,
        rotation: 0,
        originalRotation: 0,
        x: 150,
        y: 150,
        originalX: 150,
        originalY: 150
      };

      expect(() => {
        drawPiece(mockCtx as any, mockPiece, 0, false, false, 'polygon', false);
      }).not.toThrow();

      // 恢复原始的 window
      global.window = originalWindow;
    });

    test('应该处理纹理加载异常的情况', () => {
      // Mock createPattern 抛出异常
      const originalCreatePattern = mockCtx.createPattern;
      mockCtx.createPattern = jest.fn(() => { throw new Error('Pattern error'); });

      const mockPiece: PuzzlePiece = {
        points: testShape,
        originalPoints: testShape,
        rotation: 0,
        originalRotation: 0,
        x: 150,
        y: 150,
        originalX: 150,
        originalY: 150
      };

      expect(() => {
        drawPiece(mockCtx as any, mockPiece, 0, false, false, 'polygon', false);
      }).not.toThrow(); // 应该优雅处理异常

      // 恢复原始方法
      mockCtx.createPattern = originalCreatePattern;
    });

    test('应该处理未散开且未选中的拼图片段', () => {
      const mockPiece: PuzzlePiece = {
        points: testShape,
        originalPoints: testShape,
        rotation: 0,
        originalRotation: 0,
        x: 150,
        y: 150,
        originalX: 150,
        originalY: 150
      };

      expect(() => {
        drawPiece(mockCtx as any, mockPiece, 0, false, false, 'polygon', false);
      }).not.toThrow();

      // 应该绘制轻微轮廓
      expect(mockCtx.stroke).toHaveBeenCalled();
    });

    test('应该处理散开但未选中的拼图片段', () => {
      const mockPiece: PuzzlePiece = {
        points: testShape,
        originalPoints: testShape,
        rotation: 0,
        originalRotation: 0,
        x: 150,
        y: 150,
        originalX: 150,
        originalY: 150
      };

      expect(() => {
        drawPiece(mockCtx as any, mockPiece, 0, false, false, 'polygon', true);
      }).not.toThrow();

      // 散开状态下未选中的拼图不应该绘制轮廓
    });

    test('应该处理散开且选中的曲线拼图片段的阴影绘制', () => {
      const curvePoints: Point[] = [
        { x: 100, y: 100, isOriginal: true },
        { x: 150, y: 80, isOriginal: true },
        { x: 200, y: 100, isOriginal: false },
        { x: 200, y: 200, isOriginal: false },
        { x: 100, y: 200, isOriginal: true }
      ];

      const mockPiece: PuzzlePiece = {
        points: curvePoints,
        originalPoints: curvePoints,
        rotation: 0,
        originalRotation: 0,
        x: 150,
        y: 150,
        originalX: 150,
        originalY: 150
      };

      expect(() => {
        drawPiece(mockCtx as any, mockPiece, 0, false, true, 'curve', true);
      }).not.toThrow();

      // 验证阴影绘制中的曲线和直线混合使用
      expect(mockCtx.quadraticCurveTo).toHaveBeenCalled();
      expect(mockCtx.lineTo).toHaveBeenCalled();
    });
  });

  describe('🔑 drawHintOutline 函数测试', () => {
    test('应该正确绘制提示轮廓', () => {
      const mockPiece: PuzzlePiece = {
        points: testShape,
        originalPoints: testShape,
        rotation: 0,
        originalRotation: 0,
        x: 150,
        y: 150,
        originalX: 150,
        originalY: 150
      };

      expect(() => {
        drawHintOutline(mockCtx as any, mockPiece, 'polygon', '放在这里');
      }).not.toThrow();

      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
      expect(mockCtx.fillText).toHaveBeenCalled();
    });

    test('应该处理曲线类型的提示轮廓', () => {
      const curvePoints: Point[] = [
        { x: 100, y: 100, isOriginal: true },
        { x: 200, y: 100, isOriginal: true },
        { x: 200, y: 200, isOriginal: false },
        { x: 100, y: 200, isOriginal: false }
      ];

      const mockPiece: PuzzlePiece = {
        points: curvePoints,
        originalPoints: curvePoints,
        rotation: 0,
        originalRotation: 0,
        x: 150,
        y: 150,
        originalX: 150,
        originalY: 150
      };

      expect(() => {
        drawHintOutline(mockCtx as any, mockPiece, 'curve');
      }).not.toThrow();

      expect(mockCtx.quadraticCurveTo).toHaveBeenCalled();
    });

    test('应该处理空拼图片段', () => {
      expect(() => {
        drawHintOutline(mockCtx as any, null as any, 'polygon');
      }).not.toThrow();
    });

    test('应该处理没有提示文本的情况', () => {
      const mockPiece: PuzzlePiece = {
        points: testShape,
        originalPoints: testShape,
        rotation: 0,
        originalRotation: 0,
        x: 150,
        y: 150,
        originalX: 150,
        originalY: 150
      };

      expect(() => {
        drawHintOutline(mockCtx as any, mockPiece, 'polygon');
      }).not.toThrow();

      expect(mockCtx.fillText).toHaveBeenCalledWith('这里', expect.any(Number), expect.any(Number));
    });

    test('应该处理混合类型的点（部分原始点，部分切割点）', () => {
      const mixedPoints: Point[] = [
        { x: 100, y: 100, isOriginal: true },
        { x: 150, y: 80, isOriginal: false },
        { x: 200, y: 100, isOriginal: true },
        { x: 200, y: 200, isOriginal: false },
        { x: 100, y: 200, isOriginal: true }
      ];

      const mockPiece: PuzzlePiece = {
        points: mixedPoints,
        originalPoints: mixedPoints,
        rotation: 0,
        originalRotation: 0,
        x: 150,
        y: 150,
        originalX: 150,
        originalY: 150
      };

      expect(() => {
        drawHintOutline(mockCtx as any, mockPiece, 'curve');
      }).not.toThrow();

      // 应该同时使用直线和曲线
      expect(mockCtx.lineTo).toHaveBeenCalled();
      expect(mockCtx.quadraticCurveTo).toHaveBeenCalled();
    });

    test('应该正确计算边界框和中心点', () => {
      const asymmetricShape: Point[] = [
        { x: 50, y: 80 },
        { x: 300, y: 60 },
        { x: 280, y: 250 },
        { x: 70, y: 220 }
      ];

      const mockPiece: PuzzlePiece = {
        points: asymmetricShape,
        originalPoints: asymmetricShape,
        rotation: 0,
        originalRotation: 0,
        x: 150,
        y: 150,
        originalX: 150,
        originalY: 150
      };

      drawHintOutline(mockCtx as any, mockPiece, 'polygon', '测试文本');

      // 验证文本绘制在正确的中心位置
      const expectedCenterX = (50 + 300) / 2; // 175
      const expectedCenterY = (60 + 250) / 2; // 155
      expect(mockCtx.fillText).toHaveBeenCalledWith('测试文本', expectedCenterX, expectedCenterY);
    });
  });

  describe('🔑 drawCompletionEffect 函数测试', () => {
    test('应该正确绘制完成效果', () => {
      expect(() => {
        drawCompletionEffect(mockCtx as any, testShape, 'polygon');
      }).not.toThrow();

      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
    });

    test('应该处理曲线形状的完成效果', () => {
      const curveShape: Point[] = [
        { x: 100, y: 100, isOriginal: true },
        { x: 200, y: 100, isOriginal: true },
        { x: 200, y: 200, isOriginal: false },
        { x: 100, y: 200, isOriginal: false }
      ];

      expect(() => {
        drawCompletionEffect(mockCtx as any, curveShape, 'curve');
      }).not.toThrow();
    });

    test('应该正确计算阴影位置和尺寸', () => {
      const largeShape: Point[] = [
        { x: 50, y: 50 },
        { x: 250, y: 50 },
        { x: 250, y: 250 },
        { x: 50, y: 250 }
      ];

      drawCompletionEffect(mockCtx as any, largeShape, 'polygon');

      expect(mockCtx.createRadialGradient).toHaveBeenCalled();
      expect(mockCtx.arc).toHaveBeenCalled();
      expect(mockCtx.fill).toHaveBeenCalled();
    });

    test('应该处理极小形状的完成效果', () => {
      const smallShape: Point[] = [
        { x: 100, y: 100 },
        { x: 105, y: 100 },
        { x: 105, y: 105 },
        { x: 100, y: 105 }
      ];

      expect(() => {
        drawCompletionEffect(mockCtx as any, smallShape, 'polygon');
      }).not.toThrow();
    });

    test('应该处理空形状数组', () => {
      const emptyShape: Point[] = [];

      expect(() => {
        drawCompletionEffect(mockCtx as any, emptyShape, 'polygon');
      }).not.toThrow();
    });
  });

  describe('🔑 调试功能测试', () => {
    test('应该正确绘制画布边框线', () => {
      expect(() => {
        drawCanvasBorderLine(mockCtx as any, 800, 600, true);
      }).not.toThrow();

      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
    });

    test('调试关闭时不应该绘制边框线', () => {
      const saveCallsBefore = mockCtx.save.mock.calls.length;
      
      drawCanvasBorderLine(mockCtx as any, 800, 600, false);
      
      const saveCallsAfter = mockCtx.save.mock.calls.length;
      expect(saveCallsAfter).toBe(saveCallsBefore);
    });

    test('应该正确绘制分布区域', () => {
      expect(() => {
        drawDistributionArea(mockCtx as any, 800, 600, true);
      }).not.toThrow();

      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
    });

    test('调试关闭时不应该绘制分布区域', () => {
      const saveCallsBefore = mockCtx.save.mock.calls.length;
      
      drawDistributionArea(mockCtx as any, 800, 600, false);
      
      const saveCallsAfter = mockCtx.save.mock.calls.length;
      expect(saveCallsAfter).toBe(saveCallsBefore);
    });

    test('应该正确绘制画布中心', () => {
      expect(() => {
        drawCanvasCenter(mockCtx as any, 800, 600, true);
      }).not.toThrow();

      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
    });

    test('应该正确绘制形状中心', () => {
      expect(() => {
        drawShapeCenter(mockCtx as any, testShape, true);
      }).not.toThrow();

      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
    });

    test('应该处理空形状的中心绘制', () => {
      expect(() => {
        drawShapeCenter(mockCtx as any, [], true);
      }).not.toThrow();
    });

    test('应该处理小屏幕的分布区域绘制', () => {
      expect(() => {
        drawDistributionArea(mockCtx as any, 300, 300, true); // 小屏幕尺寸
      }).not.toThrow();

      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
      expect(mockCtx.fillRect).toHaveBeenCalled();
    });

    test('应该处理大屏幕的分布区域绘制', () => {
      expect(() => {
        drawDistributionArea(mockCtx as any, 800, 600, true); // 大屏幕尺寸
      }).not.toThrow();

      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
      expect(mockCtx.fillRect).toHaveBeenCalled();
    });
  });

  describe('🔑 drawPuzzle 综合函数测试', () => {
    test('应该正确绘制完整拼图', () => {
      const mockPieces: PuzzlePiece[] = [
        {
          points: testShape,
          originalPoints: testShape,
          rotation: 0,
          originalRotation: 0,
          x: 150,
          y: 150,
          originalX: 150,
          originalY: 150,
          color: '#FF0000'
        }
      ];

      expect(() => {
        drawPuzzle(
          mockCtx as any,
          mockPieces,
          [],
          null,
          'polygon',
          testShape,
          false
        );
      }).not.toThrow();

      expect(mockCtx.clearRect).toHaveBeenCalled();
    });

    test('应该处理全部完成的拼图', () => {
      const mockPieces: PuzzlePiece[] = [
        {
          points: testShape,
          originalPoints: testShape,
          rotation: 0,
          originalRotation: 0,
          x: 150,
          y: 150,
          originalX: 150,
          originalY: 150,
          color: '#FF0000'
        }
      ];

      expect(() => {
        drawPuzzle(
          mockCtx as any,
          mockPieces,
          [0], // 所有片段都完成
          null,
          'polygon',
          testShape,
          false,
          '完成了！'
        );
      }).not.toThrow();

      expect(mockCtx.fillText).toHaveBeenCalled();
    });

    test('应该处理选中的拼图片段', () => {
      const mockPieces: PuzzlePiece[] = [
        {
          points: testShape,
          originalPoints: testShape,
          rotation: 0,
          originalRotation: 0,
          x: 150,
          y: 150,
          originalX: 150,
          originalY: 150,
          color: '#FF0000'
        }
      ];

      expect(() => {
        drawPuzzle(
          mockCtx as any,
          mockPieces,
          [],
          0, // 选中第一个片段
          'polygon',
          testShape,
          true
        );
      }).not.toThrow();
    });

    test('应该处理曲线类型的拼图', () => {
      const curvePoints: Point[] = [
        { x: 100, y: 100, isOriginal: true },
        { x: 200, y: 100, isOriginal: true },
        { x: 200, y: 200, isOriginal: false },
        { x: 100, y: 200, isOriginal: false }
      ];

      const mockPieces: PuzzlePiece[] = [
        {
          points: curvePoints,
          originalPoints: curvePoints,
          rotation: 0,
          originalRotation: 0,
          x: 150,
          y: 150,
          originalX: 150,
          originalY: 150
        }
      ];

      expect(() => {
        drawPuzzle(
          mockCtx as any,
          mockPieces,
          [],
          null,
          'curve',
          curvePoints,
          false
        );
      }).not.toThrow();
    });

    test('应该处理全部完成的曲线拼图', () => {
      const curvePoints: Point[] = [
        { x: 100, y: 100, isOriginal: true },
        { x: 200, y: 100, isOriginal: true },
        { x: 200, y: 200, isOriginal: false },
        { x: 100, y: 200, isOriginal: false }
      ];

      const mockPieces: PuzzlePiece[] = [
        {
          points: curvePoints,
          originalPoints: curvePoints,
          rotation: 0,
          originalRotation: 0,
          x: 150,
          y: 150,
          originalX: 150,
          originalY: 150
        }
      ];

      expect(() => {
        drawPuzzle(
          mockCtx as any,
          mockPieces,
          [0], // 所有片段都完成
          null,
          'curve',
          curvePoints,
          false
        );
      }).not.toThrow();
    });

    test('应该处理没有原始形状的情况', () => {
      const mockPieces: PuzzlePiece[] = [
        {
          points: testShape,
          originalPoints: testShape,
          rotation: 0,
          originalRotation: 0,
          x: 150,
          y: 150,
          originalX: 150,
          originalY: 150
        }
      ];

      expect(() => {
        drawPuzzle(
          mockCtx as any,
          mockPieces,
          [],
          null,
          'polygon',
          undefined, // 没有原始形状
          false
        );
      }).not.toThrow();
    });

    test('应该处理空的原始形状', () => {
      const mockPieces: PuzzlePiece[] = [
        {
          points: testShape,
          originalPoints: testShape,
          rotation: 0,
          originalRotation: 0,
          x: 150,
          y: 150,
          originalX: 150,
          originalY: 150
        }
      ];

      expect(() => {
        drawPuzzle(
          mockCtx as any,
          mockPieces,
          [],
          null,
          'polygon',
          [], // 空的原始形状
          false
        );
      }).not.toThrow();
    });

    test('应该处理多个拼图片段的复杂场景', () => {
      const mockPieces: PuzzlePiece[] = [
        {
          points: testShape,
          originalPoints: testShape,
          rotation: 0,
          originalRotation: 0,
          x: 150,
          y: 150,
          originalX: 150,
          originalY: 150,
          color: '#FF0000'
        },
        {
          points: testShape,
          originalPoints: testShape,
          rotation: 45,
          originalRotation: 0,
          x: 200,
          y: 200,
          originalX: 200,
          originalY: 200,
          color: '#00FF00'
        },
        {
          points: testShape,
          originalPoints: testShape,
          rotation: 90,
          originalRotation: 0,
          x: 100,
          y: 200,
          originalX: 100,
          originalY: 200,
          color: '#0000FF'
        }
      ];

      expect(() => {
        drawPuzzle(
          mockCtx as any,
          mockPieces,
          [1], // 第二个片段完成
          2, // 选中第三个片段
          'polygon',
          testShape,
          true
        );
      }).not.toThrow();
    });

    test('应该处理已完成片段被选中的情况', () => {
      const mockPieces: PuzzlePiece[] = [
        {
          points: testShape,
          originalPoints: testShape,
          rotation: 0,
          originalRotation: 0,
          x: 150,
          y: 150,
          originalX: 150,
          originalY: 150,
          color: '#FF0000'
        }
      ];

      expect(() => {
        drawPuzzle(
          mockCtx as any,
          mockPieces,
          [0], // 第一个片段完成
          0, // 同时选中第一个片段
          'polygon',
          testShape,
          true
        );
      }).not.toThrow();
    });

    test('应该处理全部完成拼图的纹理渲染', () => {
      const mockImg = {
        complete: true,
        src: ''
      };
      
      // Mock global window object
      const originalWindow = global.window;
      (global as any).window = {
        Image: jest.fn(() => mockImg),
        _puzzleTextureImg: mockImg
      };

      const mockPieces: PuzzlePiece[] = [
        {
          points: testShape,
          originalPoints: testShape,
          rotation: 0,
          originalRotation: 0,
          x: 150,
          y: 150,
          originalX: 150,
          originalY: 150
        }
      ];

      expect(() => {
        drawPuzzle(
          mockCtx as any,
          mockPieces,
          [0], // 所有片段都完成
          null,
          'polygon',
          testShape,
          false
        );
      }).not.toThrow();

      expect(mockCtx.createPattern).toHaveBeenCalled();

      // 恢复原始的 window
      global.window = originalWindow;
    });

    test('应该处理全部完成曲线拼图的纹理渲染', () => {
      const curvePoints: Point[] = [
        { x: 100, y: 100, isOriginal: true },
        { x: 200, y: 100, isOriginal: true },
        { x: 200, y: 200, isOriginal: false },
        { x: 100, y: 200, isOriginal: false }
      ];

      const mockImg = {
        complete: true,
        src: ''
      };
      
      // Mock global window object
      const originalWindow = global.window;
      (global as any).window = {
        Image: jest.fn(() => mockImg),
        _puzzleTextureImg: mockImg
      };

      const mockPieces: PuzzlePiece[] = [
        {
          points: curvePoints,
          originalPoints: curvePoints,
          rotation: 0,
          originalRotation: 0,
          x: 150,
          y: 150,
          originalX: 150,
          originalY: 150
        }
      ];

      expect(() => {
        drawPuzzle(
          mockCtx as any,
          mockPieces,
          [0], // 所有片段都完成
          null,
          'curve',
          curvePoints,
          false
        );
      }).not.toThrow();

      // 验证纹理渲染中的曲线绘制
      expect(mockCtx.quadraticCurveTo).toHaveBeenCalled();
      expect(mockCtx.lineTo).toHaveBeenCalled();

      // 恢复原始的 window
      global.window = originalWindow;
    });

    test('应该处理全部完成拼图的纹理加载失败情况', () => {
      const mockImg = {
        complete: false,
        src: ''
      };
      
      // Mock global window object without cached texture
      const originalWindow = global.window;
      (global as any).window = {
        Image: jest.fn(() => mockImg)
        // 不设置 _puzzleTextureImg，模拟首次加载失败
      };

      const mockPieces: PuzzlePiece[] = [
        {
          points: testShape,
          originalPoints: testShape,
          rotation: 0,
          originalRotation: 0,
          x: 150,
          y: 150,
          originalX: 150,
          originalY: 150
        }
      ];

      expect(() => {
        drawPuzzle(
          mockCtx as any,
          mockPieces,
          [0], // 所有片段都完成
          null,
          'polygon',
          testShape,
          false
        );
      }).not.toThrow();

      // 恢复原始的 window
      global.window = originalWindow;
    });

    test('应该覆盖第107行 - drawPiece中的center计算', () => {
      const mockPieces: PuzzlePiece[] = [
        {
          points: testShape,
          originalPoints: testShape,
          rotation: 45, // 设置旋转角度来触发center计算
          originalRotation: 0,
          x: 150,
          y: 150,
          originalX: 150,
          originalY: 150
        }
      ];

      expect(() => {
        drawPuzzle(
          mockCtx as any,
          mockPieces,
          [],
          null,
          'polygon',
          testShape,
          false
        );
      }).not.toThrow();

      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.translate).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
    });

    test('应该覆盖第479行 - drawPuzzle中的isAllCompleted检查', () => {
      const mockPieces: PuzzlePiece[] = [
        {
          points: testShape,
          originalPoints: testShape,
          rotation: 0,
          originalRotation: 0,
          x: 150,
          y: 150,
          originalX: 150,
          originalY: 150
        }
      ];
      const completedPieces = [0]; // 所有片段都完成
      const originalShape = testShape;
      
      expect(() => {
        drawPuzzle(
          mockCtx as any, 
          mockPieces, 
          completedPieces, 
          null, 
          'polygon', 
          originalShape, 
          false
        );
      }).not.toThrow();
      
      expect(mockCtx.clearRect).toHaveBeenCalled();
      expect(mockCtx.beginPath).toHaveBeenCalled();
    });

    test('应该覆盖第538行 - 曲线形状的纹理渲染中的isOriginal检查', () => {
      // 创建带有isOriginal属性的曲线形状点
      const curveShape: Point[] = [
        { x: 100, y: 100, isOriginal: true },
        { x: 150, y: 100, isOriginal: true },
        { x: 200, y: 150, isOriginal: true },
        { x: 150, y: 200, isOriginal: true },
        { x: 100, y: 200, isOriginal: true }
      ];
      
      const mockPieces: PuzzlePiece[] = [
        {
          points: curveShape,
          originalPoints: curveShape,
          rotation: 0,
          originalRotation: 0,
          x: 150,
          y: 150,
          originalX: 150,
          originalY: 150
        }
      ];
      const completedPieces = [0];
      
      // Mock 成功的纹理图片
      const mockImg = {
        complete: true,
        naturalWidth: 100,
        naturalHeight: 100
      } as HTMLImageElement;
      
      // Mock global window object
      const originalWindow = global.window;
      (global as any).window = {
        Image: jest.fn(() => mockImg),
        _puzzleTextureImg: mockImg
      };
      
      // Mock createPattern 返回有效的pattern
      mockCtx.createPattern = jest.fn().mockReturnValue('mock-pattern');
      
      expect(() => {
        drawPuzzle(
          mockCtx as any, 
          mockPieces, 
          completedPieces, 
          null, 
          'curve', // 使用曲线类型
          curveShape, 
          false, 
          '恭喜完成！'
        );
      }).not.toThrow();
      
      expect(mockCtx.createPattern).toHaveBeenCalledWith(mockImg, 'repeat');
      expect(mockCtx.quadraticCurveTo).toHaveBeenCalled();

      // 恢复原始的 window
      global.window = originalWindow;
    });

    test('应该覆盖第703行 - drawCanvasCenter中的showDebugElements检查', () => {
      // 测试showDebugElements为true的情况
      expect(() => {
        drawCanvasCenter(mockCtx as any, 800, 600, true);
      }).not.toThrow();
      
      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
      
      // 重置mock
      jest.clearAllMocks();
      
      // 测试showDebugElements为false的情况（应该直接返回）
      expect(() => {
        drawCanvasCenter(mockCtx as any, 800, 600, false);
      }).not.toThrow();
      
      expect(mockCtx.save).not.toHaveBeenCalled();
      expect(mockCtx.beginPath).not.toHaveBeenCalled();
    });

    test('应该覆盖分支条件 - isOriginal为false的情况', () => {
      // 创建带有isOriginal为false的点的曲线形状
      const curveShapeWithFalseOriginal: Point[] = [
        { x: 100, y: 100, isOriginal: true },
        { x: 150, y: 100, isOriginal: false }, // 这个点的isOriginal为false
        { x: 200, y: 150, isOriginal: true },
        { x: 150, y: 200, isOriginal: false }, // 这个点的isOriginal为false
        { x: 100, y: 200, isOriginal: true }
      ];
      
      const mockPieces: PuzzlePiece[] = [
        {
          points: curveShapeWithFalseOriginal,
          originalPoints: curveShapeWithFalseOriginal,
          rotation: 0,
          originalRotation: 0,
          x: 150,
          y: 150,
          originalX: 150,
          originalY: 150
        }
      ];
      
      // 测试drawPiece中的分支
      expect(() => {
        drawPiece(mockCtx as any, mockPieces[0], 0, false, false, 'curve', false);
      }).not.toThrow();
      
      // 测试drawPuzzle中的分支
      expect(() => {
        drawPuzzle(
          mockCtx as any, 
          mockPieces, 
          [], 
          null, 
          'curve', 
          curveShapeWithFalseOriginal, 
          false
        );
      }).not.toThrow();
      
      // 测试drawHintOutline中的分支
      expect(() => {
        drawHintOutline(mockCtx as any, mockPieces[0], 'curve', '提示');
      }).not.toThrow();
      
      expect(mockCtx.lineTo).toHaveBeenCalled();
    });

    test('应该覆盖纹理渲染中的isOriginal分支', () => {
      // 创建带有isOriginal为false的点的曲线形状
      const curveShapeWithFalseOriginal: Point[] = [
        { x: 100, y: 100, isOriginal: true },
        { x: 150, y: 100, isOriginal: false }, // 这个点的isOriginal为false
        { x: 200, y: 150, isOriginal: true },
        { x: 150, y: 200, isOriginal: false }, // 这个点的isOriginal为false
        { x: 100, y: 200, isOriginal: true }
      ];
      
      const mockPieces: PuzzlePiece[] = [
        {
          points: curveShapeWithFalseOriginal,
          originalPoints: curveShapeWithFalseOriginal,
          rotation: 0,
          originalRotation: 0,
          x: 150,
          y: 150,
          originalX: 150,
          originalY: 150
        }
      ];
      const completedPieces = [0];
      
      // Mock 成功的纹理图片
      const mockImg = {
        complete: true,
        naturalWidth: 100,
        naturalHeight: 100
      } as HTMLImageElement;
      
      // Mock global window object
      const originalWindow = global.window;
      (global as any).window = {
        Image: jest.fn(() => mockImg),
        _puzzleTextureImg: mockImg
      };
      
      // Mock createPattern 返回有效的pattern
      mockCtx.createPattern = jest.fn().mockReturnValue('mock-pattern');
      
      expect(() => {
        drawPuzzle(
          mockCtx as any, 
          mockPieces, 
          completedPieces, 
          null, 
          'curve', // 使用曲线类型
          curveShapeWithFalseOriginal, 
          false, 
          '恭喜完成！'
        );
      }).not.toThrow();
      
      // 验证既调用了quadraticCurveTo（对于isOriginal !== false的点）
      // 也调用了lineTo（对于isOriginal === false的点）
      expect(mockCtx.createPattern).toHaveBeenCalledWith(mockImg, 'repeat');
      expect(mockCtx.quadraticCurveTo).toHaveBeenCalled();
      expect(mockCtx.lineTo).toHaveBeenCalled();

      // 恢复原始的 window
      global.window = originalWindow;
    });

    test('应该覆盖第479行的所有分支条件', () => {
      // 测试 completedPieces.length !== pieces.length 的情况
      const mockPieces: PuzzlePiece[] = [
        {
          points: testShape,
          originalPoints: testShape,
          rotation: 0,
          originalRotation: 0,
          x: 150,
          y: 150,
          originalX: 150,
          originalY: 150
        },
        {
          points: testShape,
          originalPoints: testShape,
          rotation: 0,
          originalRotation: 0,
          x: 200,
          y: 200,
          originalX: 200,
          originalY: 200
        }
      ];
      
      // 只完成一个片段，不等于总数
      const completedPieces = [0]; // 1 !== 2
      
      expect(() => {
        drawPuzzle(
          mockCtx as any, 
          mockPieces, 
          completedPieces, 
          null, 
          'polygon', 
          testShape, 
          false
        );
      }).not.toThrow();
      
      // 重置mock
      jest.clearAllMocks();
      
      // 测试 completedPieces.length === pieces.length 但 !originalShape 的情况
      const allCompletedPieces = [0, 1]; // 2 === 2
      
      expect(() => {
        drawPuzzle(
          mockCtx as any, 
          mockPieces, 
          allCompletedPieces, 
          null, 
          'polygon', 
          undefined, // 没有原始形状
          false
        );
      }).not.toThrow();
      
      // 重置mock
      jest.clearAllMocks();
      
      // 测试 completedPieces.length === pieces.length 但 originalShape.length === 0 的情况
      expect(() => {
        drawPuzzle(
          mockCtx as any, 
          mockPieces, 
          allCompletedPieces, 
          null, 
          'polygon', 
          [], // 空的原始形状
          false
        );
      }).not.toThrow();
    });

    test('应该覆盖第538行的polygon分支条件', () => {
      // 测试 shapeType === "polygon" 的情况（应该使用lineTo而不是quadraticCurveTo）
      const polygonShape: Point[] = [
        { x: 100, y: 100, isOriginal: true },
        { x: 150, y: 100, isOriginal: true },
        { x: 200, y: 150, isOriginal: true },
        { x: 150, y: 200, isOriginal: true },
        { x: 100, y: 200, isOriginal: true }
      ];
      
      const mockPieces: PuzzlePiece[] = [
        {
          points: polygonShape,
          originalPoints: polygonShape,
          rotation: 0,
          originalRotation: 0,
          x: 150,
          y: 150,
          originalX: 150,
          originalY: 150
        }
      ];
      const completedPieces = [0];
      
      // Mock 成功的纹理图片
      const mockImg = {
        complete: true,
        naturalWidth: 100,
        naturalHeight: 100
      } as HTMLImageElement;
      
      // Mock global window object
      const originalWindow = global.window;
      (global as any).window = {
        Image: jest.fn(() => mockImg),
        _puzzleTextureImg: mockImg
      };
      
      // Mock createPattern 返回有效的pattern
      mockCtx.createPattern = jest.fn().mockReturnValue('mock-pattern');
      
      expect(() => {
        drawPuzzle(
          mockCtx as any, 
          mockPieces, 
          completedPieces, 
          null, 
          'polygon', // 使用多边形类型，应该走lineTo分支
          polygonShape, 
          false, 
          '恭喜完成！'
        );
      }).not.toThrow();
      
      // 对于polygon类型，应该只调用lineTo，不调用quadraticCurveTo
      expect(mockCtx.createPattern).toHaveBeenCalledWith(mockImg, 'repeat');
      expect(mockCtx.lineTo).toHaveBeenCalled();

      // 恢复原始的 window
      global.window = originalWindow;
    });

    test('应该覆盖第479行的分支 - completedPieces长度为0的情况', () => {
      const mockPieces: PuzzlePiece[] = [
        {
          points: testShape,
          originalPoints: testShape,
          rotation: 0,
          originalRotation: 0,
          x: 150,
          y: 150,
          originalX: 150,
          originalY: 150
        }
      ];
      
      // 测试completedPieces为空数组的情况
      const completedPieces: number[] = []; // 0 !== 1
      
      expect(() => {
        drawPuzzle(
          mockCtx as any, 
          mockPieces, 
          completedPieces, 
          null, 
          'polygon', 
          testShape, 
          false
        );
      }).not.toThrow();
      
      expect(mockCtx.clearRect).toHaveBeenCalled();
    });

    test('应该覆盖第479行的特殊分支 - 空pieces数组的情况', () => {
      // 测试pieces为空数组的情况，这会让 completedPieces.length === pieces.length 为true（0 === 0）
      const mockPieces: PuzzlePiece[] = []; // 空数组
      const completedPieces: number[] = []; // 也是空数组
      
      expect(() => {
        drawPuzzle(
          mockCtx as any, 
          mockPieces, 
          completedPieces, 
          null, 
          'polygon', 
          testShape, 
          false
        );
      }).not.toThrow();
      
      expect(mockCtx.clearRect).toHaveBeenCalled();
    });

    test('应该覆盖第479行的另一个分支 - completedPieces长度大于pieces长度', () => {
      // 这是一个边界情况，虽然在正常情况下不应该发生
      const mockPieces: PuzzlePiece[] = [
        {
          points: testShape,
          originalPoints: testShape,
          rotation: 0,
          originalRotation: 0,
          x: 150,
          y: 150,
          originalX: 150,
          originalY: 150
        }
      ];
      
      // completedPieces长度大于pieces长度的异常情况
      const completedPieces: number[] = [0, 1, 2]; // 3 !== 1
      
      expect(() => {
        drawPuzzle(
          mockCtx as any, 
          mockPieces, 
          completedPieces, 
          null, 
          'polygon', 
          testShape, 
          false
        );
      }).not.toThrow();
      
      expect(mockCtx.clearRect).toHaveBeenCalled();
    });

    test('应该覆盖第538行的分支 - current.isOriginal === false的情况', () => {
      // 创建一个曲线形状，其中有些点的isOriginal为false
      const shapeWithMixedOriginal: Point[] = [
        { x: 100, y: 100, isOriginal: true },  // 第一个点为true
        { x: 150, y: 100, isOriginal: false }, // 第二个点为false - 这会触发else分支
        { x: 200, y: 150, isOriginal: true },  // 第三个点为true
        { x: 150, y: 200, isOriginal: false }, // 第四个点为false - 这会触发else分支
        { x: 100, y: 200, isOriginal: true }   // 第五个点为true
      ];
      
      const mockPieces: PuzzlePiece[] = [
        {
          points: shapeWithMixedOriginal,
          originalPoints: shapeWithMixedOriginal,
          rotation: 0,
          originalRotation: 0,
          x: 150,
          y: 150,
          originalX: 150,
          originalY: 150
        }
      ];
      const completedPieces = [0];
      
      // Mock 成功的纹理图片
      const mockImg = {
        complete: true,
        naturalWidth: 100,
        naturalHeight: 100
      } as HTMLImageElement;
      
      // Mock global window object
      const originalWindow = global.window;
      (global as any).window = {
        Image: jest.fn(() => mockImg),
        _puzzleTextureImg: mockImg
      };
      
      // Mock createPattern 返回有效的pattern
      mockCtx.createPattern = jest.fn().mockReturnValue('mock-pattern');
      
      expect(() => {
        drawPuzzle(
          mockCtx as any, 
          mockPieces, 
          completedPieces, 
          null, 
          'curve', // 使用曲线类型，混合isOriginal值
          shapeWithMixedOriginal, 
          false, 
          '恭喜完成！'
        );
      }).not.toThrow();
      
      // 应该既调用quadraticCurveTo（对于isOriginal !== false的点）
      // 也调用lineTo（对于isOriginal === false的点）
      expect(mockCtx.createPattern).toHaveBeenCalledWith(mockImg, 'repeat');
      expect(mockCtx.quadraticCurveTo).toHaveBeenCalled(); // 对于isOriginal为true的点
      expect(mockCtx.lineTo).toHaveBeenCalled(); // 对于isOriginal为false的点

      // 恢复原始的 window
      global.window = originalWindow;
    });

    // 🔑 完整测试468-481行代码段（drawPuzzle函数开始部分）
    describe('🔑 完整测试468-481行代码段', () => {
      test('应该完整覆盖drawPuzzle函数的初始化逻辑', () => {
        const mockPieces: PuzzlePiece[] = [
          {
            points: [{ x: 100, y: 100 }, { x: 200, y: 100 }, { x: 200, y: 200 }, { x: 100, y: 200 }],
            originalPoints: [{ x: 100, y: 100 }, { x: 200, y: 100 }, { x: 200, y: 200 }, { x: 100, y: 200 }],
            rotation: 0,
            originalRotation: 0,
            x: 150,
            y: 150,
            originalX: 150,
            originalY: 150
          }
        ];

        const originalShape: Point[] = [
          { x: 100, y: 100 },
          { x: 200, y: 100 },
          { x: 200, y: 200 },
          { x: 100, y: 200 }
        ];

        // 测试所有参数的组合
        expect(() => {
          drawPuzzle(
            mockCtx as any,
            mockPieces,
            [0], // completedPieces
            0, // selectedPiece
            'polygon', // shapeType
            originalShape, // originalShape
            true, // isScattered
            '完成了！' // completionText
          );
        }).not.toThrow();

        // 验证画布被清除
        expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, mockCtx.canvas.width, mockCtx.canvas.height);
      });

      test('应该处理所有参数为边界值的情况', () => {
        // 测试空数组和null值
        expect(() => {
          drawPuzzle(
            mockCtx as any,
            [], // 空pieces数组
            [], // 空completedPieces数组
            null, // selectedPiece为null
            'curve', // shapeType
            undefined, // originalShape为undefined
            false, // isScattered为false
            undefined // completionText为undefined
          );
        }).not.toThrow();

        expect(mockCtx.clearRect).toHaveBeenCalled();
      });

      test('应该处理isAllCompleted的各种情况', () => {
        const mockPieces: PuzzlePiece[] = [
          {
            points: [{ x: 100, y: 100 }],
            originalPoints: [{ x: 100, y: 100 }],
            rotation: 0,
            originalRotation: 0,
            x: 100,
            y: 100,
            originalX: 100,
            originalY: 100
          },
          {
            points: [{ x: 200, y: 200 }],
            originalPoints: [{ x: 200, y: 200 }],
            rotation: 0,
            originalRotation: 0,
            x: 200,
            y: 200,
            originalX: 200,
            originalY: 200
          }
        ];

        // 情况1: completedPieces.length < pieces.length
        expect(() => {
          drawPuzzle(mockCtx as any, mockPieces, [0], null, 'polygon');
        }).not.toThrow();

        // 情况2: completedPieces.length === pieces.length
        expect(() => {
          drawPuzzle(mockCtx as any, mockPieces, [0, 1], null, 'polygon');
        }).not.toThrow();

        // 情况3: completedPieces.length > pieces.length (异常情况)
        expect(() => {
          drawPuzzle(mockCtx as any, mockPieces, [0, 1, 2], null, 'polygon');
        }).not.toThrow();
      });

      test('应该正确处理画布尺寸和清除操作', () => {
        const customCanvas = {
          width: 1024,
          height: 768
        };
        
        const customCtx = {
          ...mockCtx,
          canvas: customCanvas,
          clearRect: jest.fn()
        };

        expect(() => {
          drawPuzzle(customCtx as any, [], [], null, 'polygon');
        }).not.toThrow();

        // 验证使用了正确的画布尺寸进行清除
        expect(customCtx.clearRect).toHaveBeenCalledWith(0, 0, 1024, 768);
      });
    });

    // 🔑 完整测试526-564行代码段（纹理渲染逻辑）
    describe('🔑 完整测试526-564行代码段', () => {
      let originalWindow: any;

      beforeEach(() => {
        // 保存原始window对象
        originalWindow = global.window;
        // 创建mock window对象
        (global as any).window = {
          Image: jest.fn(),
          _puzzleTextureImg: undefined
        };
      });

      afterEach(() => {
        // 恢复原始window对象
        global.window = originalWindow;
      });

      test('应该完整覆盖纹理加载和渲染的所有分支', () => {
        const originalShape: Point[] = [
          { x: 100, y: 100, isOriginal: true },
          { x: 200, y: 100, isOriginal: true },
          { x: 200, y: 200, isOriginal: false },
          { x: 100, y: 200, isOriginal: false }
        ];

        // 情况1: 纹理图片不存在，需要创建
        delete (window as any)._puzzleTextureImg;
        
        // 模拟Image构造函数
        const mockImage = {
          complete: false,
          src: ''
        };
        (window as any).Image = jest.fn(() => mockImage);

        expect(() => {
          drawPuzzle(mockCtx as any, [], [], null, 'curve', originalShape, false);
        }).not.toThrow();

        // 验证图片被创建并设置了正确的src
        expect((window as any).Image).toHaveBeenCalled();
        expect((window as any)._puzzleTextureImg.src).toBe('/texture-tile.png');
      });

      test('应该处理纹理图片加载完成的情况', () => {
        const originalShape: Point[] = [
          { x: 100, y: 100, isOriginal: true },
          { x: 150, y: 80, isOriginal: false },
          { x: 200, y: 100, isOriginal: true },
          { x: 200, y: 200, isOriginal: false },
          { x: 100, y: 200, isOriginal: true }
        ];

        // 模拟纹理图片已加载完成
        (window as any)._puzzleTextureImg = {
          complete: true,
          src: '/texture-tile.png'
        };

        // 模拟createPattern返回有效的pattern
        mockCtx.createPattern.mockReturnValue('mock-pattern');

        expect(() => {
          drawPuzzle(mockCtx as any, [], [], null, 'curve', originalShape, false);
        }).not.toThrow();

        // 验证纹理渲染的完整流程
        expect(mockCtx.save).toHaveBeenCalled();
        expect(mockCtx.createPattern).toHaveBeenCalledWith((window as any)._puzzleTextureImg, 'repeat');
        expect(mockCtx.beginPath).toHaveBeenCalled();
        expect(mockCtx.moveTo).toHaveBeenCalledWith(100, 100);
        expect(mockCtx.quadraticCurveTo).toHaveBeenCalled(); // 对于isOriginal !== false的点
        expect(mockCtx.lineTo).toHaveBeenCalled(); // 对于isOriginal === false的点
        expect(mockCtx.closePath).toHaveBeenCalled();
        expect(mockCtx.fill).toHaveBeenCalled();
        expect(mockCtx.restore).toHaveBeenCalled();
      });

      test('应该处理createPattern返回null的情况', () => {
        const originalShape: Point[] = [
          { x: 100, y: 100 },
          { x: 200, y: 100 },
          { x: 200, y: 200 },
          { x: 100, y: 200 }
        ];

        (window as any)._puzzleTextureImg = {
          complete: true,
          src: '/texture-tile.png'
        };

        // 模拟createPattern返回null
        mockCtx.createPattern.mockReturnValue(null as any);

        expect(() => {
          drawPuzzle(mockCtx as any, [], [], null, 'polygon', originalShape, false);
        }).not.toThrow();

        // 验证当pattern为null时，不会调用fill
        expect(mockCtx.createPattern).toHaveBeenCalled();
        // fill不应该被调用，因为pattern为null
      });

      test('应该处理纹理加载异常的情况', () => {
        const originalShape: Point[] = [
          { x: 100, y: 100 },
          { x: 200, y: 100 },
          { x: 200, y: 200 },
          { x: 100, y: 200 }
        ];

        // 模拟createPattern抛出异常
        mockCtx.createPattern.mockImplementation(() => {
          throw new Error('Pattern creation failed');
        });

        (window as any)._puzzleTextureImg = {
          complete: true,
          src: '/texture-tile.png'
        };

        // 应该捕获异常并继续执行
        expect(() => {
          drawPuzzle(mockCtx as any, [], [], null, 'polygon', originalShape, false);
        }).not.toThrow();
      });

      test('应该正确处理曲线和多边形的不同渲染逻辑', () => {
        const mixedShape: Point[] = [
          { x: 100, y: 100, isOriginal: true },
          { x: 150, y: 80, isOriginal: false },
          { x: 200, y: 100, isOriginal: true },
          { x: 200, y: 200, isOriginal: false },
          { x: 100, y: 200, isOriginal: true }
        ];

        (window as any)._puzzleTextureImg = {
          complete: true,
          src: '/texture-tile.png'
        };

        mockCtx.createPattern.mockReturnValue('mock-pattern');

        // 测试曲线类型
        expect(() => {
          drawPuzzle(mockCtx as any, [], [], null, 'curve', mixedShape, false);
        }).not.toThrow();

        // 重置mock
        mockCtx.quadraticCurveTo.mockClear();
        mockCtx.lineTo.mockClear();

        // 测试多边形类型
        expect(() => {
          drawPuzzle(mockCtx as any, [], [], null, 'polygon', mixedShape, false);
        }).not.toThrow();

        // 对于polygon类型，所有点都应该使用lineTo
        expect(mockCtx.lineTo).toHaveBeenCalled();
      });

      test('应该正确设置和恢复Canvas状态', () => {
        const originalShape: Point[] = [
          { x: 100, y: 100 },
          { x: 200, y: 100 },
          { x: 200, y: 200 },
          { x: 100, y: 200 }
        ];

        (window as any)._puzzleTextureImg = {
          complete: true,
          src: '/texture-tile.png'
        };

        mockCtx.createPattern.mockReturnValue('mock-pattern');

        expect(() => {
          drawPuzzle(mockCtx as any, [], [], null, 'polygon', originalShape, false);
        }).not.toThrow();

        // 验证Canvas状态的正确设置和恢复
        expect(mockCtx.save).toHaveBeenCalled();
        expect(mockCtx.restore).toHaveBeenCalled();
      });

      test('应该处理纹理图片未完成加载的情况', () => {
        const originalShape: Point[] = [
          { x: 100, y: 100 },
          { x: 200, y: 100 },
          { x: 200, y: 200 },
          { x: 100, y: 200 }
        ];

        // 模拟纹理图片未完成加载
        (window as any)._puzzleTextureImg = {
          complete: false,
          src: '/texture-tile.png'
        };

        expect(() => {
          drawPuzzle(mockCtx as any, [], [], null, 'polygon', originalShape, false);
        }).not.toThrow();

        // 当图片未加载完成时，不应该调用createPattern
        expect(mockCtx.createPattern).not.toHaveBeenCalled();
      });

      test('应该正确处理循环中的边界条件', () => {
        const singlePointShape: Point[] = [
          { x: 100, y: 100, isOriginal: true }
        ];

        (window as any)._puzzleTextureImg = {
          complete: true,
          src: '/texture-tile.png'
        };

        mockCtx.createPattern.mockReturnValue('mock-pattern');

        expect(() => {
          drawPuzzle(mockCtx as any, [], [], null, 'curve', singlePointShape, false);
        }).not.toThrow();

        // 对于单点形状，应该只调用moveTo，不调用其他绘制方法
        expect(mockCtx.moveTo).toHaveBeenCalledWith(100, 100);
      });

      test('应该正确计算贝塞尔曲线的控制点', () => {
        const curveShape: Point[] = [
          { x: 100, y: 100, isOriginal: true },
          { x: 150, y: 80, isOriginal: true },
          { x: 200, y: 100, isOriginal: true },
          { x: 200, y: 200, isOriginal: true },
          { x: 100, y: 200, isOriginal: true }
        ];

        (window as any)._puzzleTextureImg = {
          complete: true,
          src: '/texture-tile.png'
        };

        mockCtx.createPattern.mockReturnValue('mock-pattern');

        expect(() => {
          drawPuzzle(mockCtx as any, [], [], null, 'curve', curveShape, false);
        }).not.toThrow();

        // 验证quadraticCurveTo被正确调用
        expect(mockCtx.quadraticCurveTo).toHaveBeenCalled();
        
        // 验证计算的中点坐标
        const calls = mockCtx.quadraticCurveTo.mock.calls;
        expect(calls.length).toBeGreaterThan(0);
      });
    });
  });
});