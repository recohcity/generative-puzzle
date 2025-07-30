import type { ShapeType } from "@/types/puzzleTypes"

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

    // 🎯 形状直径为标准尺寸的40%，半径为20%
    // 这个值会在adaptShapeToCanvas中根据设备类型和屏幕尺寸进行调整
    const baseRadius = this.STANDARD_SIZE * 0.2; // 标准尺寸的20%（直径40%）

    const shapeParams = {
      numPoints: 8,
      minRadius: baseRadius * 0.8,
      maxRadius: baseRadius,
      amplitude: 0.15, // 🎯 增加不规则形状的振幅，让凸出更明显
      detail: 40, // 🎯 增加细节点数，让不规则形状更精细
    };

    console.log(`标准形状参数: 中心点(${centerX}, ${centerY}), 半径=${shapeParams.minRadius}-${shapeParams.maxRadius}`);

    // 生成标准化形状
    let points: Point[] = [];
    switch (shapeType) {
      case "polygon":
        points = this.generateStandardPolygon(centerX, centerY, shapeParams);
        break;
      case "curve":
        points = this.generateStandardCurve(centerX, centerY, shapeParams);
        break;
      case "irregular":
        points = this.generateStandardIrregular(centerX, centerY, shapeParams);
        break;
      default:
        points = this.generateStandardPolygon(centerX, centerY, shapeParams);
    }

    console.log(`生成标准化形状完成: ${points.length}个点`);
    return points;
  }

  // 生成标准多边形
  private static generateStandardPolygon(centerX: number, centerY: number, params: any): Point[] {
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

  // 生成标准曲凸形状 - 创建尖锐的星形凸凹效果
  private static generateStandardCurve(centerX: number, centerY: number, params: any): Point[] {
    const { minRadius, maxRadius, amplitude, detail } = params;

    console.log(`生成标准曲凸形状: ${detail}个点, 振幅=${amplitude}`);

    const baseRadius = minRadius + Math.random() * (maxRadius - minRadius);

    // 🎯 创建星形/太阳光芒效果：长短不一的凸出
    const numRays = 8 + Math.floor(Math.random() * 12); // 8-19个光芒

    // 🎯 为每个光芒预先生成不同的长度
    const rayLengths: number[] = [];
    for (let r = 0; r < numRays; r++) {
      // 每个光芒有不同的长度：0.5-2.0倍的随机变化
      rayLengths.push(0.5 + Math.random() * 1.5);
    }

    console.log(`曲凸形状参数: ${numRays}个光芒, 基础半径=${baseRadius}, 光芒长度变化=${rayLengths.map(l => l.toFixed(2)).join(',')}`);

    const points: Point[] = [];

    // 🎯 为每个光芒创建凸出和凹陷的交替模式
    for (let i = 0; i < detail; i++) {
      const angle = (i / detail) * 2 * Math.PI;

      // 🎯 计算当前角度在哪个光芒区间内
      const rayAngle = (2 * Math.PI) / numRays;
      const rayIndex = Math.floor(angle / rayAngle);
      const angleInRay = (angle % rayAngle) / rayAngle; // 0-1 在当前光芒内的位置

      // 🎯 获取当前光芒的长度倍数
      const currentRayLength = rayLengths[rayIndex];

      // 🎯 创建尖锐的凸凹模式
      let radiusMultiplier;
      if (angleInRay < 0.5) {
        // 前半部分：从凹陷到凸出
        const t = angleInRay * 2; // 0-1
        // 使用三次函数创建尖锐的过渡
        const baseMultiplier = 0.6 + 0.8 * (t * t * (3 - 2 * t)); // 从0.6到1.4
        // 🎯 应用当前光芒的长度倍数
        radiusMultiplier = 0.6 + (baseMultiplier - 0.6) * currentRayLength;
      } else {
        // 后半部分：从凸出到凹陷
        const t = (angleInRay - 0.5) * 2; // 0-1
        // 使用三次函数创建尖锐的过渡
        const baseMultiplier = 1.4 - 0.8 * (t * t * (3 - 2 * t)); // 从1.4到0.6
        // 🎯 应用当前光芒的长度倍数
        const peakMultiplier = 0.6 + (1.4 - 0.6) * currentRayLength;
        radiusMultiplier = peakMultiplier - (peakMultiplier - 0.6) * (t * t * (3 - 2 * t));
      }

      // 🎯 添加细微的噪声，让边缘更自然但保持尖锐特征
      const noise = Math.sin(angle * 20) * 0.05 + Math.cos(angle * 15) * 0.03;
      radiusMultiplier += noise;

      // 🎯 确保最小和最大半径的合理范围
      radiusMultiplier = Math.max(0.4, Math.min(1.8, radiusMultiplier));

      const finalRadius = baseRadius * radiusMultiplier;

      const x = centerX + finalRadius * Math.cos(angle);
      const y = centerY + finalRadius * Math.sin(angle);
      points.push({ x, y, isOriginal: true });
    }

    return points;
  }

  // 生成标准云朵形状 - 创建平滑的云朵效果
  private static generateStandardIrregular(centerX: number, centerY: number, params: any): Point[] {
    const { minRadius, maxRadius, amplitude, detail } = params;

    console.log(`生成标准云朵形状: ${detail}个点, 振幅=${amplitude}`);

    const baseRadius = minRadius + Math.random() * (maxRadius - minRadius);

    // 🎯 创建平滑的云朵效果：柔和的起伏
    const frequency = 2 + Math.random() * 4; // 2-6个主要波浪
    console.log(`云朵形状参数: 频率=${frequency}, 基础半径=${baseRadius}`);

    const noise = (angle: number) =>
      1 + Math.sin(angle * frequency) * amplitude +
      Math.cos(angle * frequency * 1.5) * amplitude * 0.5 +
      Math.sin(angle * frequency * 2.3) * amplitude * 0.3; // 添加更多层次的波浪

    const points: Point[] = [];
    for (let i = 0; i < detail; i++) {
      const angle = (i / detail) * 2 * Math.PI;
      const distortion = noise(angle);

      // 🎯 确保云朵形状保持平滑，不会有尖锐的凸出
      const smoothedDistortion = Math.max(0.7, Math.min(1.3, distortion));

      const finalRadius = baseRadius * smoothedDistortion;

      const x = centerX + finalRadius * Math.cos(angle);
      const y = centerY + finalRadius * Math.sin(angle);
      points.push({ x, y, isOriginal: true });
    }

    return points;
  }
}