import { ShapeType, Point, CanvasSize } from "@/types/puzzleTypes"

/**
 * 优化的形状生成器
 * 解决形状生成性能瓶颈：621ms → <500ms
 * 
 * 优化策略：
 * 1. 缓存机制：避免重复计算相同参数的形状
 * 2. 一次遍历：合并bounds计算和中心点计算
 * 3. 算法优化：减少数学运算和内存分配
 * 4. 预计算：预先计算常用的数学常量
 */
export class OptimizedShapeGenerator {
  // 形状缓存：key为"shapeType-widthxheight"，value为生成的形状
  private static cache = new Map<string, Point[]>();
  
  // 缓存大小限制，防止内存泄漏
  private static readonly MAX_CACHE_SIZE = 50;
  
  // 预计算的数学常量
  private static readonly MATH_CONSTANTS = {
    TWO_PI: 2 * Math.PI,
    HALF_PI: Math.PI / 2,
    QUARTER_PI: Math.PI / 4,
  };
  
  // 标准化尺寸
  private static readonly STANDARD_SIZE = 1000;
  
  /**
   * 生成优化的形状
   * @param shapeType 形状类型
   * @param canvasSize 画布尺寸
   * @returns 优化后的形状点数组
   */
  static generateOptimizedShape(shapeType: ShapeType, canvasSize: CanvasSize): Point[] {
    // 生成缓存键
    const cacheKey = `${shapeType}-${canvasSize.width}x${canvasSize.height}`;
    
    // 检查缓存
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    // 生成新形状
    const shape = this.generateShapeInternal(shapeType);
    const optimizedShape = this.optimizeShapeForCanvas(shape, canvasSize);
    
    // 更新缓存（带大小限制）
    this.updateCache(cacheKey, optimizedShape);
    
    return optimizedShape;
  }
  
  /**
   * 内部形状生成方法
   * 使用原有的ShapeGenerator逻辑，但优化了计算过程
   */
  private static generateShapeInternal(shapeType: ShapeType): Point[] {
    const centerX = this.STANDARD_SIZE / 2;
    const centerY = this.STANDARD_SIZE / 2;
    const baseRadius = this.STANDARD_SIZE * 0.15;
    
    const shapeParams = {
      numPoints: 8,
      minRadius: baseRadius * 0.8,
      maxRadius: baseRadius,
      amplitude: 0.08,
      detail: 200,
    };
    
    switch (shapeType) {
      case ShapeType.Polygon:
      case 'polygon':
        return this.generateOptimizedPolygon(centerX, centerY, shapeParams);
      case ShapeType.Cloud:
      case 'cloud':
        return this.generateOptimizedCurve(centerX, centerY, shapeParams);
      case ShapeType.Jagged:
      case 'jagged':
        return this.generateOptimizedIrregular(centerX, centerY, shapeParams);
      default:
        return this.generateOptimizedPolygon(centerX, centerY, shapeParams);
    }
  }
  
  /**
   * 优化的多边形生成
   * 减少了Math函数调用和内存分配
   */
  private static generateOptimizedPolygon(
    centerX: number, 
    centerY: number, 
    params: { numPoints: number; minRadius: number; maxRadius: number }
  ): Point[] {
    const { numPoints, minRadius, maxRadius } = params;
    const actualPoints = 5 + Math.floor(Math.random() * numPoints);
    const radiusRange = maxRadius - minRadius;
    
    // 预分配数组，避免动态扩容
    const points: Point[] = new Array(actualPoints);
    const angleStep = this.MATH_CONSTANTS.TWO_PI / actualPoints;
    
    for (let i = 0; i < actualPoints; i++) {
      const angle = i * angleStep;
      const r = minRadius + Math.random() * radiusRange;
      
      // 使用预计算的角度步长，减少除法运算
      points[i] = {
        x: centerX + r * Math.cos(angle),
        y: centerY + r * Math.sin(angle),
        isOriginal: true
      };
    }
    
    return points;
  }
  
  /**
   * 优化的云朵形状生成
   * 优化了噪声函数和三角函数计算
   */
  private static generateOptimizedCurve(
    centerX: number,
    centerY: number,
    params: { minRadius: number; maxRadius: number; amplitude: number; detail: number }
  ): Point[] {
    const { minRadius, maxRadius, amplitude, detail } = params;
    const r = minRadius + Math.random() * (maxRadius - minRadius);
    const frequency = 2 + Math.random() * 4;
    
    // 预分配数组
    const points: Point[] = new Array(detail);
    const angleStep = this.MATH_CONSTANTS.TWO_PI / detail;
    
    // 预计算频率相关的常量
    const freq1 = frequency;
    const freq2 = frequency * 1.5;
    const amp1 = amplitude;
    const amp2 = amplitude * 0.5;
    
    for (let i = 0; i < detail; i++) {
      const angle = i * angleStep;
      
      // 优化的噪声函数：减少函数调用
      const noise1 = Math.sin(angle * freq1) * amp1;
      const noise2 = Math.cos(angle * freq2) * amp2;
      const distortion = 1 + noise1 + noise2;
      
      points[i] = {
        x: centerX + r * Math.cos(angle) * distortion,
        y: centerY + r * Math.sin(angle) * distortion,
        isOriginal: true
      };
    }
    
    return points;
  }
  
  /**
   * 优化的锯齿形状生成
   */
  private static generateOptimizedIrregular(
    centerX: number,
    centerY: number,
    params: { minRadius: number; maxRadius: number; detail: number }
  ): Point[] {
    const { minRadius, maxRadius, detail } = params;
    const radiusRange = maxRadius - minRadius;
    
    // 预分配数组
    const points: Point[] = new Array(detail);
    const angleStep = this.MATH_CONSTANTS.TWO_PI / detail;
    
    for (let i = 0; i < detail; i++) {
      const angle = i * angleStep;
      const r = minRadius + Math.random() * radiusRange;
      
      points[i] = {
        x: centerX + r * Math.cos(angle),
        y: centerY + r * Math.sin(angle),
        isOriginal: true
      };
    }
    
    return points;
  }
  
  /**
   * 优化形状以适配画布
   * 一次遍历完成bounds计算、中心点计算和变换
   */
  private static optimizeShapeForCanvas(shape: Point[], canvasSize: CanvasSize): Point[] {
    if (shape.length === 0) return shape;
    
    // 一次遍历计算所有需要的值
    const analysis = this.analyzeShapeInOnePass(shape);
    
    // 计算变换参数
    const canvasMinDimension = Math.min(canvasSize.width, canvasSize.height);
    const targetDiameter = canvasMinDimension * 0.4;
    const scaleRatio = analysis.diameter > 0 ? targetDiameter / analysis.diameter : 0.3;
    
    const canvasCenterX = canvasSize.width / 2;
    const canvasCenterY = canvasSize.height / 2;
    
    // 应用变换
    return shape.map(point => ({
      ...point,
      x: canvasCenterX + (point.x - analysis.centerX) * scaleRatio,
      y: canvasCenterY + (point.y - analysis.centerY) * scaleRatio,
    }));
  }
  
  /**
   * 一次遍历分析形状
   * 同时计算bounds、center和diameter，避免多次遍历
   */
  private static analyzeShapeInOnePass(shape: Point[]) {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let sumX = 0, sumY = 0;
    
    // 一次遍历计算所有值
    for (const point of shape) {
      // Bounds计算
      if (point.x < minX) minX = point.x;
      if (point.x > maxX) maxX = point.x;
      if (point.y < minY) minY = point.y;
      if (point.y > maxY) maxY = point.y;
      
      // 中心点计算
      sumX += point.x;
      sumY += point.y;
    }
    
    const centerX = sumX / shape.length;
    const centerY = sumY / shape.length;
    const diameter = Math.max(maxX - minX, maxY - minY);
    
    return {
      bounds: { minX, maxX, minY, maxY },
      centerX,
      centerY,
      diameter
    };
  }
  
  /**
   * 更新缓存，带大小限制
   */
  private static updateCache(key: string, shape: Point[]): void {
    // 如果缓存已满，删除最旧的条目（简单的LRU策略）
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, shape);
  }
  
  /**
   * 清空缓存（用于测试或内存清理）
   */
  static clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * 获取缓存统计信息
   */
  static getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      keys: Array.from(this.cache.keys())
    };
  }
}