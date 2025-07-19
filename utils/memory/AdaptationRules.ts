/**
 * 适配规则引擎 - 定义形状适配的具体规则
 * 
 * 这个文件实现了各种适配规则，用于将清理后的拓扑结构
 * 转换为适应新画布尺寸的具体坐标
 */

import { Point, CanvasSize } from '../../types/common';
import { CleanTopology, AdaptedShape, AdaptationMetrics } from '../../types/memory';

/**
 * 适配上下文 - 提供适配过程所需的环境信息
 */
export interface AdaptationContext {
  sourceCanvas: CanvasSize;
  targetCanvas: CanvasSize;
  debugMode: boolean;
  preserveAspectRatio: boolean;
  centerShape: boolean;
}

/**
 * 适配规则接口 - 所有适配规则的基础契约
 */
export interface AdaptationRule {
  name: string;
  priority: number;  // 优先级，数字越大优先级越高
  description: string;
  
  /**
   * 检查规则是否适用于当前上下文
   */
  condition(context: AdaptationContext): boolean;
  
  /**
   * 应用规则，返回部分适配结果
   */
  apply(topology: CleanTopology, context: AdaptationContext): Partial<AdaptedShape>;
}

/**
 * 尺寸缩放规则 - 确保形状直径为画布最小边的30%
 */
export class SizeScalingRule implements AdaptationRule {
  name = 'SizeScalingRule';
  priority = 100;
  description = '将形状缩放到画布最小边的30%直径并居中';

  condition(context: AdaptationContext): boolean {
    return true; // 总是适用
  }

  apply(topology: CleanTopology, context: AdaptationContext): Partial<AdaptedShape> {
    const { targetCanvas } = context;
    const minCanvasSize = Math.min(targetCanvas.width, targetCanvas.height);
    const targetDiameter = minCanvasSize * 0.3;
    
    console.log(`🔧 SizeScalingRule: 画布=${targetCanvas.width}x${targetCanvas.height}, 目标直径=${targetDiameter}`);
    
    // 计算原始形状的边界框（基于相对位置）
    const originalBounds = this.calculateBounds(topology);
    const originalDiameter = Math.max(originalBounds.width, originalBounds.height);
    
    console.log(`🔧 原始边界框:`, originalBounds, `原始直径=${originalDiameter}`);
    
    // 计算缩放因子
    const scaleFactor = originalDiameter > 0 ? targetDiameter / originalDiameter : 1;
    
    console.log(`🔧 缩放因子=${scaleFactor}`);
    
    // 先将相对位置转换为绝对坐标并缩放
    // 注意：相对位置是基于形状边界框的，需要转换为实际形状坐标
    const scaledPoints: Point[] = topology.nodes.map(node => ({
      x: node.relativePosition.xRatio * targetDiameter,
      y: node.relativePosition.yRatio * targetDiameter
    }));

    console.log(`🔧 缩放后的前3个点:`, scaledPoints.slice(0, 3));

    // 计算缩放后形状的边界框
    const scaledBounds = this.calculatePointsBounds(scaledPoints);
    const shapeCenter = {
      x: (scaledBounds.minX + scaledBounds.maxX) / 2,
      y: (scaledBounds.minY + scaledBounds.maxY) / 2
    };

    // 计算画布中心
    const canvasCenter = {
      x: targetCanvas.width / 2,
      y: targetCanvas.height / 2
    };

    console.log(`🔧 形状中心=${shapeCenter.x.toFixed(1)}, ${shapeCenter.y.toFixed(1)}, 画布中心=${canvasCenter.x}, ${canvasCenter.y}`);

    // 计算居中偏移
    const centerOffset = {
      x: canvasCenter.x - shapeCenter.x,
      y: canvasCenter.y - shapeCenter.y
    };

    console.log(`🔧 居中偏移=${centerOffset.x.toFixed(1)}, ${centerOffset.y.toFixed(1)}`);

    // 应用居中偏移到所有点
    const centeredPoints: Point[] = scaledPoints.map(point => ({
      x: point.x + centerOffset.x,
      y: point.y + centerOffset.y
    }));

    console.log(`🔧 居中后的前3个点:`, centeredPoints.slice(0, 3));

    return {
      points: centeredPoints,
      adaptationMetrics: {
        scaleFactor,
        centerOffset,
        boundaryFit: 1.0,
        fidelity: 1.0,
        processingTime: 0
      } as AdaptationMetrics
    };
  }

  private calculateBounds(topology: CleanTopology) {
    if (topology.nodes.length === 0) {
      return { width: 0, height: 0, minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }

    let minX = topology.nodes[0].relativePosition.xRatio;
    let maxX = minX;
    let minY = topology.nodes[0].relativePosition.yRatio;
    let maxY = minY;

    topology.nodes.forEach(node => {
      minX = Math.min(minX, node.relativePosition.xRatio);
      maxX = Math.max(maxX, node.relativePosition.xRatio);
      minY = Math.min(minY, node.relativePosition.yRatio);
      maxY = Math.max(maxY, node.relativePosition.yRatio);
    });

    return {
      width: maxX - minX,
      height: maxY - minY,
      minX,
      minY,
      maxX,
      maxY
    };
  }

  private calculatePointsBounds(points: Point[]) {
    if (points.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }

    let minX = points[0].x;
    let maxX = minX;
    let minY = points[0].y;
    let maxY = minY;

    points.forEach(point => {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    });

    return { minX, minY, maxX, maxY };
  }
}

/**
 * 居中规则 - 确保形状在画布中心精确定位
 * 注意：现在主要的居中逻辑已经集成到SizeScalingRule中，这个规则主要用于验证和微调
 */
export class CenteringRule implements AdaptationRule {
  name = 'CenteringRule';
  priority = 90;
  description = '验证和微调形状居中位置';

  condition(context: AdaptationContext): boolean {
    return context.centerShape;
  }

  apply(topology: CleanTopology, context: AdaptationContext): Partial<AdaptedShape> {
    // 由于SizeScalingRule已经处理了居中，这里主要返回验证信息
    return {
      adaptationMetrics: {
        centerOffset: { x: 0, y: 0 }, // 已经在SizeScalingRule中处理
        boundaryFit: 1.0,
        fidelity: 1.0,
        scaleFactor: 1.0,
        processingTime: 0
      } as AdaptationMetrics
    };
  }
}

/**
 * 比例保持规则 - 保持形状的原始宽高比
 */
export class ProportionRule implements AdaptationRule {
  name = 'ProportionRule';
  priority = 80;
  description = '保持形状的原始宽高比';

  condition(context: AdaptationContext): boolean {
    return context.preserveAspectRatio;
  }

  apply(topology: CleanTopology, context: AdaptationContext): Partial<AdaptedShape> {
    const originalAspectRatio = topology.boundingInfo.aspectRatio;
    
    // 如果需要保持宽高比，调整缩放策略
    const fidelityScore = this.calculateFidelity(topology, originalAspectRatio);

    return {
      adaptationMetrics: {
        fidelity: fidelityScore,
        boundaryFit: 1.0,
        scaleFactor: 1.0,
        centerOffset: { x: 0, y: 0 },
        processingTime: 0
      } as AdaptationMetrics
    };
  }

  private calculateFidelity(topology: CleanTopology, targetAspectRatio: number): number {
    // 计算当前形状的宽高比与目标宽高比的匹配度
    const bounds = this.calculateBounds(topology);
    const currentAspectRatio = bounds.width / bounds.height;
    
    if (currentAspectRatio === 0 || targetAspectRatio === 0) {
      return 0;
    }

    const ratio = Math.min(currentAspectRatio, targetAspectRatio) / 
                  Math.max(currentAspectRatio, targetAspectRatio);
    
    return ratio;
  }

  private calculateBounds(topology: CleanTopology) {
    if (topology.nodes.length === 0) {
      return { width: 0, height: 0 };
    }

    let minX = topology.nodes[0].relativePosition.xRatio;
    let maxX = minX;
    let minY = topology.nodes[0].relativePosition.yRatio;
    let maxY = minY;

    topology.nodes.forEach(node => {
      minX = Math.min(minX, node.relativePosition.xRatio);
      maxX = Math.max(maxX, node.relativePosition.xRatio);
      minY = Math.min(minY, node.relativePosition.yRatio);
      maxY = Math.max(maxY, node.relativePosition.yRatio);
    });

    return {
      width: maxX - minX,
      height: maxY - minY
    };
  }
}

/**
 * 边界约束规则 - 确保形状不超出画布边界
 */
export class BoundaryRule implements AdaptationRule {
  name = 'BoundaryRule';
  priority = 70;
  description = '确保形状完全在画布边界内';

  condition(context: AdaptationContext): boolean {
    return true; // 总是适用
  }

  apply(topology: CleanTopology, context: AdaptationContext): Partial<AdaptedShape> {
    const { targetCanvas } = context;
    const margin = 10; // 边界留白
    
    const bounds = this.calculateBounds(topology);
    const availableWidth = targetCanvas.width - 2 * margin;
    const availableHeight = targetCanvas.height - 2 * margin;
    
    // 计算边界适配度
    const boundaryFit = this.calculateBoundaryFit(bounds, availableWidth, availableHeight);

    return {
      adaptationMetrics: {
        boundaryFit,
        fidelity: 1.0,
        scaleFactor: 1.0,
        centerOffset: { x: 0, y: 0 },
        processingTime: 0
      } as AdaptationMetrics
    };
  }

  private calculateBounds(topology: CleanTopology) {
    if (topology.nodes.length === 0) {
      return { width: 0, height: 0 };
    }

    let minX = topology.nodes[0].relativePosition.xRatio;
    let maxX = minX;
    let minY = topology.nodes[0].relativePosition.yRatio;
    let maxY = minY;

    topology.nodes.forEach(node => {
      minX = Math.min(minX, node.relativePosition.xRatio);
      maxX = Math.max(maxX, node.relativePosition.xRatio);
      minY = Math.min(minY, node.relativePosition.yRatio);
      maxY = Math.max(maxY, node.relativePosition.yRatio);
    });

    return {
      width: maxX - minX,
      height: maxY - minY
    };
  }

  private calculateBoundaryFit(bounds: { width: number; height: number }, 
                              availableWidth: number, availableHeight: number): number {
    if (bounds.width <= availableWidth && bounds.height <= availableHeight) {
      return 1.0; // 完全适配
    }

    const widthFit = bounds.width > 0 ? Math.min(1, availableWidth / bounds.width) : 1;
    const heightFit = bounds.height > 0 ? Math.min(1, availableHeight / bounds.height) : 1;
    
    return Math.min(widthFit, heightFit);
  }
}