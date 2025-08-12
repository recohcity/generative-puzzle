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
   * 生成标准化形状（固定尺寸，不依赖画布）
   * @param shapeType 形状类型
   * @returns 标准化的形状点集（以STANDARD_SIZE为基准）
   */
  static generateShape(shapeType: ShapeType): Point[] {
    console.log(`开始生成标准化形状: 类型=${shapeType}`);

    // 计算标准尺寸的中心点
    const centerX = this.STANDARD_SIZE / 2;
    const centerY = this.STANDARD_SIZE / 2;

    // 🎯 恢复v1.3.35的形状尺寸配置
    // 形状直径为标准尺寸的30%，半径为15%，更接近v1.3.35的尺寸
    const baseRadius = this.STANDARD_SIZE * 0.15; // 标准尺寸的15%

    const shapeParams = {
      numPoints: 8,
      minRadius: baseRadius * 0.8,
      maxRadius: baseRadius,
      amplitude: 0.08, // 🎯 恢复v1.3.35的振幅值
      detail: 200, // 🎯 恢复v1.3.35的高密度点数，用于平滑曲凸
    };

    console.log(`标准形状参数: 中心点(${centerX}, ${centerY}), 半径=${shapeParams.minRadius}-${shapeParams.maxRadius}`);

    // 生成标准化形状
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

    console.log(`生成标准化形状完成: ${points.length}个点`);
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

    console.log(`生成标准多边形: ${actualPoints}个点`);

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

    console.log(`生成云朵形状: ${detail}个点, 振幅=${amplitude}`);

    // 使用1.3.35版本的简单算法生成平滑曲凸
    const r = minRadius + Math.random() * (maxRadius - minRadius);

    // 使用相同的半径值，生成正圆，然后通过噪声扰动来产生不规则形状
    const a = r;
    const b = r;

    const frequency = 2 + Math.random() * 4;
    console.log(`云朵形状参数: 频率=${frequency}, 主半径=${a}, 次半径=${b}`);

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

    console.log(`生成锯齿形状: ${detail}个点`);

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