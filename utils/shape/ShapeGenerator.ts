import type { ShapeType } from "@/types/puzzleTypes"

type Point = {
  x: number
  y: number
  isOriginal?: boolean
}

export class ShapeGenerator {
  // 使用固定的画布尺寸标准化所有形状
  private static readonly STANDARD_SIZE = 1000;

  static generateShape(shapeType: ShapeType): Point[] {
    console.log(`开始生成形状: 类型=${shapeType}`);
    
    // 检测设备和屏幕方向
    const ua = navigator.userAgent;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
    const isPortrait = window.innerHeight > window.innerWidth;
    
    console.log(`设备检测: 移动设备=${isMobile}, 竖屏模式=${isPortrait}, 屏幕尺寸=${window.innerWidth}x${window.innerHeight}`);
    
    // 获取真实的canvas元素
    const canvas = document.querySelector('canvas');
    const realCanvasWidth = canvas ? canvas.width : window.innerWidth;
    const realCanvasHeight = canvas ? canvas.height : window.innerHeight;
    
    console.log(`实际画布尺寸: ${realCanvasWidth}x${realCanvasHeight}`);
    
    // 计算中心点
    const centerX = this.STANDARD_SIZE / 2;
    const centerY = this.STANDARD_SIZE / 2;
    
    // 计算半径 - 使用较小的比例以确保形状完全在画布内
    // 在手机竖屏模式下使用更小的半径，避免形状变形
    const baseRadius = this.STANDARD_SIZE * (isMobile && isPortrait ? 0.25 : 0.3);
    
    // 根据设备类型调整生成参数
    const shapeParams = {
      numPoints: isMobile ? 6 : 8,  // 移动设备使用更少的点
      minRadius: baseRadius * 0.8,  // 确保最小半径更小，增加形状变化
      maxRadius: baseRadius,
      amplitude: isMobile ? 0.03 : 0.08,  // 移动设备使用更小的扰动
      detail: isMobile ? 120 : 200,       // 移动设备使用更少的细节点
    };
    
    console.log(`形状参数: 中心点(${centerX}, ${centerY}), 半径=${shapeParams.minRadius}-${shapeParams.maxRadius}`);
    
    // 生成形状
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
    
    // 将标准形状点转换为适合实际画布的坐标
    return this.normalizePoints(points, realCanvasWidth, realCanvasHeight, isMobile, isPortrait);
  }
  
  // 将标准尺寸坐标转换为适合实际画布的坐标
  private static normalizePoints(
    points: Point[], 
    targetWidth: number, 
    targetHeight: number, 
    isMobile: boolean = false, 
    isPortrait: boolean = false
  ): Point[] {
    console.log(`形状归一化: 目标画布=${targetWidth}x${targetHeight}, 移动设备=${isMobile}, 竖屏模式=${isPortrait}`);
    
    // 缩放因子：确保不超出画布
    const scaleFactor = isMobile ? 0.8 : 0.9;
    
    // 使用正方形区域来计算转换的标准大小，避免变形
    const minDimension = Math.min(targetWidth, targetHeight);
    
    // 计算缩放比例 - 根据画布的较小边缩放
    const scale = (minDimension / this.STANDARD_SIZE) * scaleFactor;
    
    // 根据缩放比例计算形状的总体尺寸
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    for (const point of points) {
      const x = (point.x - this.STANDARD_SIZE / 2) * scale;
      const y = (point.y - this.STANDARD_SIZE / 2) * scale;
      
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
    
    const width = maxX - minX;
    const height = maxY - minY;
    
    // 根据实际画布尺寸计算居中偏移量
    const offsetX = (targetWidth - width) / 2 - minX;
    const offsetY = (targetHeight - height) / 2 - minY;
    
    console.log(`形状尺寸: 宽度=${width}, 高度=${height}, 偏移=(${offsetX}, ${offsetY}), 缩放=${scale}`);
    
    // 应用转换，确保形状居中显示
    return points.map(point => {
      // 将点相对于标准尺寸中心点调整
      const normalizedX = point.x - this.STANDARD_SIZE / 2;
      const normalizedY = point.y - this.STANDARD_SIZE / 2;
      
      // 应用缩放
      const scaledX = normalizedX * scale;
      const scaledY = normalizedY * scale;
      
      // 应用居中偏移
      return {
        x: scaledX + targetWidth / 2,
        y: scaledY + targetHeight / 2,
        isOriginal: point.isOriginal,
      };
    });
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

