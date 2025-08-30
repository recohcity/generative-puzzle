import { ShapeType } from "@/types/puzzleTypes"

type Point = {
  x: number
  y: number
  isOriginal?: boolean
}

export class ShapeGenerator {
  // 使用固定的画布尺寸标准化所有形状
  private static readonly STANDARD_SIZE = 1000;

  /**
   * 生成标准化形状的核心算法
   * 
   * 设计原理：
   * 1. 标准化尺寸：使用固定的1000x1000标准画布，确保形状一致性
   * 2. 中心对齐：所有形状都以标准画布中心为基准生成
   * 3. 比例控制：形状大小为标准尺寸的30%，提供合适的视觉比例
   * 4. 类型差异：不同形状类型使用不同的生成算法
   * 
   * 形状类型说明：
   * - Polygon: 规则多边形，使用直线连接
   * - Cloud: 云朵形状，使用贝塞尔曲线创建平滑曲凸效果
   * - Jagged: 锯齿形状，使用随机半径创建不规则边缘
   * 
   * @param shapeType 形状类型枚举
   * @returns 标准化的形状顶点数组
   */
  static generateShape(shapeType: ShapeType): Point[] {
    // 步骤1：初始化标准化参数
    // 使用固定的标准尺寸确保跨设备一致性
    const centerX = this.STANDARD_SIZE / 2;
    const centerY = this.STANDARD_SIZE / 2;

    // 步骤2：计算形状基础参数
    // 基础半径为标准尺寸的15%，经过测试的最佳比例
    const baseRadius = this.STANDARD_SIZE * 0.15;

    // 步骤3：配置形状生成参数
    // 这些参数经过精心调优，确保生成的形状既美观又适合拼图切割
    const shapeParams = {
      numPoints: 8,                    // 多边形最大顶点数
      minRadius: baseRadius * 0.8,     // 最小半径（80%基础半径）
      maxRadius: baseRadius,           // 最大半径（100%基础半径）
      amplitude: 0.08,                 // 曲线振幅系数，控制曲凸程度
      detail: 200,                     // 曲线细节点数，确保平滑度
    };

    // 步骤4：根据形状类型选择生成算法
    let points: Point[] = [];
    switch (shapeType) {
      case ShapeType.Polygon:
      case 'polygon':
        points = this.generateStandardPolygon(centerX, centerY, shapeParams);
        break;
      case ShapeType.Cloud:
      case 'cloud':
        points = this.generateStandardCurve(centerX, centerY, shapeParams);
        break;
      case ShapeType.Jagged:
      case 'jagged':
        points = this.generateStandardIrregular(centerX, centerY, shapeParams);
        break;
      default:
        points = this.generateStandardPolygon(centerX, centerY, shapeParams);
    }

    // 生成标准化形状完成: ${points.length}个点
    return points;
  }

  // 生成标准多边形
  private static generateStandardPolygon(centerX: number, centerY: number, params: {
    numPoints: number;
    minRadius: number;
    maxRadius: number;
  }): Point[] {
    const { numPoints, minRadius, maxRadius } = params;
    const actualPoints = 5 + Math.floor(Math.random() * numPoints);

    // 生成标准多边形: ${actualPoints}个点

    const points: Point[] = [];
    for (let i = 0; i < actualPoints; i++) {
      const angle = (i / actualPoints) * 2 * Math.PI;
      const r = minRadius + Math.random() * (maxRadius - minRadius);
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      points.push({ x, y, isOriginal: true });
    }

    return points;
  }

  // 生成云朵形状 - 平滑的曲凸效果
  private static generateStandardCurve(centerX: number, centerY: number, params: {
    minRadius: number;
    maxRadius: number;
    amplitude: number;
    detail: number;
  }): Point[] {
    const { minRadius, maxRadius, amplitude, detail } = params;

    // 生成云朵形状: ${detail}个点, 振幅=${amplitude}

    // 使用1.3.35版本的简单算法生成平滑曲凸
    const r = minRadius + Math.random() * (maxRadius - minRadius);

    // 使用相同的半径值，生成正圆，然后通过噪声扰动来产生不规则形状
    const a = r;
    const b = r;

    const frequency = 2 + Math.random() * 4;
    // 云朵形状参数: 频率=${frequency}, 主半径=${a}, 次半径=${b}

    // 1.3.35版本的简单噪声函数 - 创造平滑的曲凸效果
    const noise = (angle: number) =>
      1 + Math.sin(angle * frequency) * amplitude +
      Math.cos(angle * frequency * 1.5) * amplitude * 0.5;

    const points: Point[] = [];
    for (let i = 0; i < detail; i++) {
      const angle = (i / detail) * 2 * Math.PI;
      const distortion = noise(angle);

      // 1.3.35版本的椭圆变形公式
      const x = centerX + a * Math.cos(angle) * distortion;
      const y = centerY + b * Math.sin(angle) * distortion;

      points.push({ x, y, isOriginal: true });
    }

    return points;
  }

  // 生成锯齿形状 - 随机半径产生锯齿效果
  private static generateStandardIrregular(centerX: number, centerY: number, params: {
    minRadius: number;
    maxRadius: number;
    detail: number;
  }): Point[] {
    const { minRadius, maxRadius, detail } = params;

    // 生成锯齿形状: ${detail}个点

    const points: Point[] = [];
    for (let i = 0; i < detail; i++) {
      const angle = (i / detail) * 2 * Math.PI;
      const r = minRadius + Math.random() * (maxRadius - minRadius);
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      points.push({ x, y, isOriginal: true });
    }

    return points;
  }
}