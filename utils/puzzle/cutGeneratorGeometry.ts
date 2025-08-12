import { Point } from "@/types/puzzleTypes";
import { Bounds, CutLine } from "./cutGeneratorTypes";
import { CUT_GENERATOR_CONFIG } from "./cutGeneratorConfig";

/**
 * 几何计算工具模块
 * 负责所有几何相关的计算
 */

/**
 * 计算点集的边界框
 */
export const calculateBounds = (points: Point[]): Bounds => {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
};

/**
 * 计算两条线段的交点
 */
export const lineIntersection = (p1: Point, p2: Point, p3: Point, p4: Point): Point | null => {
  const x1 = p1.x, y1 = p1.y, x2 = p2.x, y2 = p2.y;
  const x3 = p3.x, y3 = p3.y, x4 = p4.x, y4 = p4.y;

  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (denom === 0) return null; // 平行线

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

  if (ua < 0 || ua > 1 || ub < 0 || ub > 1) return null; // 交点不在线段上

  return {
    x: x1 + ua * (x2 - x1),
    y: y1 + ua * (y2 - y1),
  };
};

/**
 * 检查点是否接近线段
 */
export const isPointNearLine = (point: Point, line: CutLine, threshold: number): boolean => {
  const d1 = Math.hypot(line.x1 - point.x, line.y1 - point.y);
  const d2 = Math.hypot(line.x2 - point.x, line.y2 - point.y);
  const lineLength = Math.hypot(line.x2 - line.x1, line.y2 - line.y1);
  const buffer = 0.1; // 小缓冲区以处理舍入误差

  return d1 + d2 >= lineLength - buffer && d1 + d2 <= lineLength + threshold + buffer;
};

/**
 * 计算切割线与形状的交点数量
 */
export const doesCutIntersectShape = (cut: CutLine, shape: Point[]): number => {
  let intersections = 0;
  for (let i = 0; i < shape.length; i++) {
    const j = (i + 1) % shape.length;

    if (lineIntersection({ x: cut.x1, y: cut.y1 }, { x: cut.x2, y: cut.y2 }, shape[i], shape[j])) {
      intersections++;
    }
  }
  return intersections;
};

/**
 * 检查两条切割线是否太接近
 */
export const cutsAreTooClose = (cut1: CutLine, cut2: CutLine, minDistance: number = CUT_GENERATOR_CONFIG.MIN_CUT_DISTANCE): boolean => {
  const points = [
    { x: cut1.x1, y: cut1.y1 },
    { x: cut1.x2, y: cut1.y2 },
    { x: cut2.x1, y: cut2.y1 },
    { x: cut2.x2, y: cut2.y2 },
  ];

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const dx = points[i].x - points[j].x;
      const dy = points[i].y - points[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < minDistance) {
        return true;
      }
    }
  }
  return false;
};

/**
 * 计算形状的中心点
 */
export const calculateCenter = (bounds: Bounds): Point => {
  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
  };
};

/**
 * 生成直线切割线
 */
export const generateStraightCutLine = (bounds: Bounds): CutLine => {
  const isVertical = Math.random() < 0.5;
  
  if (isVertical) {
    const x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
    return {
      x1: x,
      y1: bounds.minY - 50,
      x2: x,
      y2: bounds.maxY + 50,
      type: "straight"
    };
  } else {
    const y = bounds.minY + Math.random() * (bounds.maxY - bounds.minY);
    return {
      x1: bounds.minX - 50,
      y1: y,
      x2: bounds.maxX + 50,
      y2: y,
      type: "straight"
    };
  }
};

/**
 * 生成对角线切割线
 */
export const generateDiagonalCutLine = (bounds: Bounds): CutLine => {
  const angle = Math.random() * Math.PI;
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  const length = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) * 0.8;

  return {
    x1: centerX + Math.cos(angle) * length,
    y1: centerY + Math.sin(angle) * length,
    x2: centerX + Math.cos(angle + Math.PI) * length,
    y2: centerY + Math.sin(angle + Math.PI) * length,
    type: "diagonal"
  };
};

/**
 * 生成穿过中心的切割线
 */
export const generateCenterCutLine = (shape: Point[], isStraight: boolean, cutType: "straight" | "diagonal"): CutLine => {
  const bounds = calculateBounds(shape);
  const center = calculateCenter(bounds);

  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;

  if (cutType === "straight" || isStraight) {
    const isVertical = Math.random() < 0.5;
    return {
      x1: isVertical ? center.x : bounds.minX - width * 0.1,
      y1: isVertical ? bounds.minY - height * 0.1 : center.y,
      x2: isVertical ? center.x : bounds.maxX + width * 0.1,
      y2: isVertical ? bounds.maxY + height * 0.1 : center.y,
      type: "straight"
    };
  } else {
    const angle = Math.random() * Math.PI;
    const diagonal = Math.sqrt(width * width + height * height) * 1.2;
    return {
      x1: center.x + Math.cos(angle) * diagonal,
      y1: center.y + Math.sin(angle) * diagonal,
      x2: center.x + Math.cos(angle + Math.PI) * diagonal,
      y2: center.y + Math.sin(angle + Math.PI) * diagonal,
      type: "diagonal"
    };
  }
};

/**
 * 强制生成切割线（最后手段）
 */
export const generateForcedCutLine = (shape: Point[], existingCuts: CutLine[], cutType: "straight" | "diagonal" = "diagonal"): CutLine | null => {
  let sumX = 0, sumY = 0;
  for (const point of shape) {
    sumX += point.x;
    sumY += point.y;
  }
  const centerX = sumX / shape.length;
  const centerY = sumY / shape.length;

  const bounds = calculateBounds(shape);
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  
  if (!isFinite(width) || !isFinite(height) || width <= 0 || height <= 0 || 
      !isFinite(centerX) || !isFinite(centerY)) {
    return null;
  }
  
  const diagonal = Math.sqrt(width * width + height * height) * 1.5;

  if (cutType === "straight") {
    const isVertical = Math.random() < 0.5;
    return {
      x1: isVertical ? centerX : bounds.minX - width * 0.2,
      y1: isVertical ? bounds.minY - height * 0.2 : centerY,
      x2: isVertical ? centerX : bounds.maxX + width * 0.2,
      y2: isVertical ? bounds.maxY + height * 0.2 : centerY,
      type: "straight"
    };
  }
  
  const angles = 8;
  for (let i = 0; i < angles; i++) {
    const angle = (i / angles) * Math.PI;
    const cut: CutLine = {
      x1: centerX + Math.cos(angle) * diagonal,
      y1: centerY + Math.sin(angle) * diagonal,
      x2: centerX + Math.cos(angle + Math.PI) * diagonal,
      y2: centerY + Math.sin(angle + Math.PI) * diagonal,
      type: "diagonal"
    };
    
    if (doesCutIntersectShape(cut, shape) >= 2) {
      let tooClose = false;
      for (const existingCut of existingCuts) {
        if (cutsAreTooClose(cut, existingCut)) {
          tooClose = true;
          break;
        }
      }
      
      if (!tooClose) return cut;
    }
  }
  
  const isVertical = Math.random() < 0.5;
  return {
    x1: isVertical ? centerX : bounds.minX - width * 0.2,
    y1: isVertical ? bounds.minY - height * 0.2 : centerY,
    x2: isVertical ? centerX : bounds.maxX + width * 0.2,
    y2: isVertical ? bounds.maxY + height * 0.2 : centerY,
    type: "straight"
  };
};