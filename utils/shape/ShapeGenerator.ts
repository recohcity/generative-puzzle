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
    
    // 形状直径为标准尺寸的15%，更小的基础尺寸
    // 这个值会在adaptShapeToCanvas中根据设备类型和屏幕尺寸进行调整
    const baseRadius = this.STANDARD_SIZE * 0.15; // 标准尺寸的15%
    
    const shapeParams = {
      numPoints: 8,
      minRadius: baseRadius * 0.8,
      maxRadius: baseRadius,
      amplitude: 0.08,
      detail: 200,
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
  
  // 生成标准曲线形状
  private static generateStandardCurve(centerX: number, centerY: number, params: any): Point[] {
    const { minRadius, maxRadius, detail } = params;
    
    console.log(`生成标准曲线: ${detail}个点`);
    
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
  
  // 生成标准不规则形状
  private static generateStandardIrregular(centerX: number, centerY: number, params: any): Point[] {
    const { minRadius, maxRadius, amplitude, detail } = params;
    
    console.log(`生成标准不规则形状: ${detail}个点, 振幅=${amplitude}`);
    
    // 确保a和b的值接近，避免椭圆过扁
    const r = minRadius + Math.random() * (maxRadius - minRadius);
    
    // 使用相同的半径值，生成正圆，然后通过噪声扰动来产生不规则形状
    const a = r;
    const b = r;
    
    const frequency = 2 + Math.random() * 4;
    console.log(`不规则形状参数: 频率=${frequency}, 主半径=${a}, 次半径=${b}`);
    
    const noise = (angle: number) =>
      1 + Math.sin(angle * frequency) * amplitude + 
      Math.cos(angle * frequency * 1.5) * amplitude * 0.5;
    
    const points: Point[] = [];
    for (let i = 0; i < detail; i++) {
      const angle = (i / detail) * 2 * Math.PI;
      const distortion = noise(angle);
      const x = centerX + a * Math.cos(angle) * distortion;
      const y = centerY + b * Math.sin(angle) * distortion;
      points.push({ x, y, isOriginal: true });
    }
    
    return points;
  }
}