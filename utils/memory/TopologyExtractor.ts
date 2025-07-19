/**
 * 拓扑结构提取器 - 从Point数组提取形状的拓扑结构
 * 
 * 这个类负责：
 * 1. 分析形状的几何特征
 * 2. 提取节点的相对位置关系
 * 3. 计算形状的复杂度和对称性
 * 4. 生成标准化的拓扑结构
 */

import { 
  ShapeTopology, 
  TopologyNode, 
  NodeRelationship, 
  BoundingInfo, 
  SymmetryInfo,
  RelativePosition 
} from '../../types/memory';
import { Point, CanvasSize, BoundingBox } from '../../types/common';

export interface ExtractionOptions {
  /** 是否检测曲线节点 */
  detectCurves: boolean;
  /** 节点重要性阈值 */
  importanceThreshold: number;
  /** 对称性检测容差 */
  symmetryTolerance: number;
  /** 是否简化拓扑结构 */
  simplifyTopology: boolean;
}

export class TopologyExtractor {
  private readonly defaultOptions: ExtractionOptions = {
    detectCurves: true,
    importanceThreshold: 0.1,
    symmetryTolerance: 0.05,
    simplifyTopology: false
  };

  /**
   * 从点数组提取拓扑结构
   * @param points 形状的点数组
   * @param canvasSize 画布尺寸
   * @param options 提取选项
   * @returns 拓扑结构
   */
  extractTopology(
    points: Point[], 
    canvasSize: CanvasSize, 
    options: Partial<ExtractionOptions> = {}
  ): ShapeTopology {
    const opts = { ...this.defaultOptions, ...options };
    
    if (!points || points.length === 0) {
      throw new Error('无法从空点数组提取拓扑结构');
    }

    console.log(`🔍 开始提取拓扑结构: ${points.length} 个点`);

    // 1. 计算形状边界框
    const boundingBox = this.calculateBoundingBox(points);
    
    // 2. 创建拓扑节点
    const nodes = this.createTopologyNodes(points, boundingBox, opts);
    
    // 3. 生成节点关系
    const relationships = this.generateNodeRelationships(nodes, points, opts);
    
    // 4. 分析边界信息
    const boundingInfo = this.analyzeBoundingInfo(points, boundingBox, opts);
    
    // 5. 验证拓扑结构
    const topology: ShapeTopology = {
      nodes,
      relationships,
      boundingInfo,
      version: '1.0.0'
    };

    this.validateTopology(topology);
    
    console.log(`✅ 拓扑结构提取完成: ${nodes.length} 节点, ${relationships.length} 关系`);
    return topology;
  }

  /**
   * 计算形状的边界框
   */
  private calculateBoundingBox(points: Point[]): BoundingBox {
    const bounds = points.reduce(
      (acc, point) => ({
        minX: Math.min(acc.minX, point.x),
        maxX: Math.max(acc.maxX, point.x),
        minY: Math.min(acc.minY, point.y),
        maxY: Math.max(acc.maxY, point.y)
      }),
      { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
    );

    // 确保边界框有效
    if (!isFinite(bounds.minX) || !isFinite(bounds.maxX) || 
        !isFinite(bounds.minY) || !isFinite(bounds.maxY)) {
      throw new Error('无效的点坐标导致边界框计算失败');
    }

    return bounds;
  }

  /**
   * 创建拓扑节点
   */
  private createTopologyNodes(
    points: Point[], 
    boundingBox: BoundingBox, 
    options: ExtractionOptions
  ): TopologyNode[] {
    const shapeWidth = boundingBox.maxX - boundingBox.minX;
    const shapeHeight = boundingBox.maxY - boundingBox.minY;

    // 防止除零错误
    const safeWidth = Math.max(shapeWidth, 1e-6);
    const safeHeight = Math.max(shapeHeight, 1e-6);

    return points.map((point, index) => {
      // 计算相对位置
      const relativePosition: RelativePosition = {
        xRatio: (point.x - boundingBox.minX) / safeWidth,
        yRatio: (point.y - boundingBox.minY) / safeHeight
      };

      // 确保相对位置在有效范围内
      relativePosition.xRatio = Math.max(0, Math.min(1, relativePosition.xRatio));
      relativePosition.yRatio = Math.max(0, Math.min(1, relativePosition.yRatio));

      // 计算节点重要性
      const importance = this.calculateNodeImportance(point, points, index);
      
      // 检测节点类型
      const nodeType = this.detectNodeType(point, points, index, options);
      
      // 生成连接关系
      const connections = this.getNodeConnections(index, points.length);

      return {
        id: `node_${index}`,
        type: nodeType,
        relativePosition,
        connections,
        metadata: {
          importance,
          curvature: this.calculateCurvature(point, points, index)
        }
      };
    });
  }

  /**
   * 计算节点重要性
   */
  private calculateNodeImportance(point: Point, allPoints: Point[], index: number): number {
    const totalPoints = allPoints.length;
    if (totalPoints < 3) return 1.0;

    const prevIndex = (index - 1 + totalPoints) % totalPoints;
    const nextIndex = (index + 1) % totalPoints;
    
    const prevPoint = allPoints[prevIndex];
    const nextPoint = allPoints[nextIndex];
    
    // 计算角度变化
    const angle1 = Math.atan2(point.y - prevPoint.y, point.x - prevPoint.x);
    const angle2 = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x);
    let angleDiff = Math.abs(angle2 - angle1);
    
    // 处理角度跨越问题
    if (angleDiff > Math.PI) {
      angleDiff = 2 * Math.PI - angleDiff;
    }
    
    // 角度变化越大，重要性越高
    const importance = angleDiff / Math.PI;
    
    // 考虑距离因素
    const dist1 = this.calculateDistance(point, prevPoint);
    const dist2 = this.calculateDistance(point, nextPoint);
    const avgDistance = (dist1 + dist2) / 2;
    
    // 距离较远的点重要性稍高
    const distanceFactor = Math.min(1.2, 1 + avgDistance / 100);
    
    return Math.min(1.0, importance * distanceFactor);
  }

  /**
   * 检测节点类型
   */
  private detectNodeType(
    point: Point, 
    allPoints: Point[], 
    index: number, 
    options: ExtractionOptions
  ): 'vertex' | 'control' | 'anchor' {
    if (!options.detectCurves) {
      return 'vertex';
    }

    const curvature = this.calculateCurvature(point, allPoints, index);
    const importance = this.calculateNodeImportance(point, allPoints, index);
    
    // 基于曲率和重要性判断节点类型
    if (curvature > 0.8 && importance > 0.7) {
      return 'anchor';  // 重要的转折点
    } else if (curvature > 0.3) {
      return 'control'; // 控制点
    } else {
      return 'vertex';  // 普通顶点
    }
  }

  /**
   * 计算节点曲率
   */
  private calculateCurvature(point: Point, allPoints: Point[], index: number): number {
    const totalPoints = allPoints.length;
    if (totalPoints < 3) return 0;

    const prevIndex = (index - 1 + totalPoints) % totalPoints;
    const nextIndex = (index + 1) % totalPoints;
    
    const prevPoint = allPoints[prevIndex];
    const nextPoint = allPoints[nextIndex];
    
    // 计算三点形成的角度
    const v1 = {
      x: point.x - prevPoint.x,
      y: point.y - prevPoint.y
    };
    const v2 = {
      x: nextPoint.x - point.x,
      y: nextPoint.y - point.y
    };
    
    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    
    if (mag1 === 0 || mag2 === 0) return 0;
    
    const cosAngle = dot / (mag1 * mag2);
    const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
    
    // 将角度转换为曲率值 (0-1)
    return angle / Math.PI;
  }

  /**
   * 获取节点连接关系
   */
  private getNodeConnections(nodeIndex: number, totalNodes: number): string[] {
    const connections: string[] = [];
    
    // 连接到前一个节点
    if (nodeIndex > 0) {
      connections.push(`node_${nodeIndex - 1}`);
    }
    
    // 连接到后一个节点
    if (nodeIndex < totalNodes - 1) {
      connections.push(`node_${nodeIndex + 1}`);
    }
    
    // 如果是闭合形状，连接首尾
    if (totalNodes > 2) {
      if (nodeIndex === 0) {
        connections.push(`node_${totalNodes - 1}`);
      }
      if (nodeIndex === totalNodes - 1) {
        connections.push('node_0');
      }
    }
    
    return connections;
  }

  /**
   * 生成节点关系
   */
  private generateNodeRelationships(
    nodes: TopologyNode[], 
    originalPoints: Point[], 
    options: ExtractionOptions
  ): NodeRelationship[] {
    const relationships: NodeRelationship[] = [];
    
    for (const node of nodes) {
      for (const connectionId of node.connections) {
        // 避免重复关系
        const existingRel = relationships.find(rel => 
          (rel.fromNodeId === node.id && rel.toNodeId === connectionId) ||
          (rel.fromNodeId === connectionId && rel.toNodeId === node.id)
        );
        
        if (!existingRel) {
          const strength = this.calculateRelationshipStrength(node.id, connectionId, nodes);
          const relType = this.determineRelationshipType(node.id, connectionId, nodes, options);
          
          relationships.push({
            fromNodeId: node.id,
            toNodeId: connectionId,
            type: relType,
            strength
          });
        }
      }
    }
    
    return relationships;
  }

  /**
   * 计算关系强度
   */
  private calculateRelationshipStrength(
    fromNodeId: string, 
    toNodeId: string, 
    nodes: TopologyNode[]
  ): number {
    const fromNode = nodes.find(n => n.id === fromNodeId);
    const toNode = nodes.find(n => n.id === toNodeId);
    
    if (!fromNode || !toNode) return 0.5;
    
    // 基于节点重要性计算关系强度
    const fromImportance = fromNode.metadata?.importance || 0.5;
    const toImportance = toNode.metadata?.importance || 0.5;
    
    return (fromImportance + toImportance) / 2;
  }

  /**
   * 确定关系类型
   */
  private determineRelationshipType(
    fromNodeId: string, 
    toNodeId: string, 
    nodes: TopologyNode[], 
    options: ExtractionOptions
  ): 'edge' | 'curve' | 'constraint' {
    if (!options.detectCurves) {
      return 'edge';
    }

    const fromNode = nodes.find(n => n.id === fromNodeId);
    const toNode = nodes.find(n => n.id === toNodeId);
    
    if (!fromNode || !toNode) return 'edge';
    
    // 如果任一节点是控制点，则关系为曲线
    if (fromNode.type === 'control' || toNode.type === 'control') {
      return 'curve';
    }
    
    // 如果两个节点都是锚点，则为约束关系
    if (fromNode.type === 'anchor' && toNode.type === 'anchor') {
      return 'constraint';
    }
    
    return 'edge';
  }

  /**
   * 分析边界信息
   */
  private analyzeBoundingInfo(
    points: Point[], 
    boundingBox: BoundingBox, 
    options: ExtractionOptions
  ): BoundingInfo {
    const width = boundingBox.maxX - boundingBox.minX;
    const height = boundingBox.maxY - boundingBox.minY;
    
    return {
      aspectRatio: height > 0 ? width / height : 1.0,
      complexity: this.calculateComplexity(points),
      symmetry: this.analyzeSymmetry(points, boundingBox, options),
      area: this.calculateRelativeArea(points, boundingBox)
    };
  }

  /**
   * 计算形状复杂度
   */
  private calculateComplexity(points: Point[]): number {
    if (points.length < 3) return 0;
    
    let totalAngleChange = 0;
    let totalDistance = 0;
    const n = points.length;
    
    for (let i = 0; i < n; i++) {
      const prev = points[(i - 1 + n) % n];
      const curr = points[i];
      const next = points[(i + 1) % n];
      
      // 计算角度变化
      const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
      const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x);
      let angleDiff = Math.abs(angle2 - angle1);
      
      if (angleDiff > Math.PI) {
        angleDiff = 2 * Math.PI - angleDiff;
      }
      
      totalAngleChange += angleDiff;
      
      // 计算距离
      totalDistance += this.calculateDistance(curr, next);
    }
    
    // 综合角度变化和形状大小计算复杂度
    const angleComplexity = totalAngleChange / (2 * Math.PI);
    const sizeComplexity = Math.min(1.0, totalDistance / 1000);
    const pointComplexity = Math.min(1.0, n / 50);
    
    return Math.min(1.0, (angleComplexity + sizeComplexity + pointComplexity) / 3);
  }

  /**
   * 分析对称性
   */
  private analyzeSymmetry(
    points: Point[], 
    boundingBox: BoundingBox, 
    options: ExtractionOptions
  ): SymmetryInfo {
    const centerX = (boundingBox.minX + boundingBox.maxX) / 2;
    const centerY = (boundingBox.minY + boundingBox.maxY) / 2;
    const tolerance = Math.max(
      boundingBox.maxX - boundingBox.minX, 
      boundingBox.maxY - boundingBox.minY
    ) * options.symmetryTolerance;
    
    // 检测垂直对称
    const hasVerticalSymmetry = this.checkVerticalSymmetry(points, centerX, tolerance);
    
    // 检测水平对称
    const hasHorizontalSymmetry = this.checkHorizontalSymmetry(points, centerY, tolerance);
    
    // 检测旋转对称
    const rotationalSymmetry = this.checkRotationalSymmetry(points, centerX, centerY, tolerance);
    
    return {
      hasVerticalSymmetry,
      hasHorizontalSymmetry,
      hasRotationalSymmetry: rotationalSymmetry.hasSymmetry,
      rotationAngle: rotationalSymmetry.angle
    };
  }

  /**
   * 检查垂直对称性
   */
  private checkVerticalSymmetry(points: Point[], centerX: number, tolerance: number): boolean {
    for (const point of points) {
      const mirrorX = 2 * centerX - point.x;
      const hasMatch = points.some(p => 
        Math.abs(p.x - mirrorX) < tolerance && Math.abs(p.y - point.y) < tolerance
      );
      if (!hasMatch) return false;
    }
    return true;
  }

  /**
   * 检查水平对称性
   */
  private checkHorizontalSymmetry(points: Point[], centerY: number, tolerance: number): boolean {
    for (const point of points) {
      const mirrorY = 2 * centerY - point.y;
      const hasMatch = points.some(p => 
        Math.abs(p.x - point.x) < tolerance && Math.abs(p.y - mirrorY) < tolerance
      );
      if (!hasMatch) return false;
    }
    return true;
  }

  /**
   * 检查旋转对称性
   */
  private checkRotationalSymmetry(
    points: Point[], 
    centerX: number, 
    centerY: number, 
    tolerance: number
  ): { hasSymmetry: boolean; angle?: number } {
    // 简化实现：检查常见的旋转角度
    const commonAngles = [Math.PI / 2, Math.PI / 3, Math.PI / 4, Math.PI / 6];
    
    for (const angle of commonAngles) {
      if (this.checkRotationAngle(points, centerX, centerY, angle, tolerance)) {
        return { hasSymmetry: true, angle };
      }
    }
    
    return { hasSymmetry: false };
  }

  /**
   * 检查特定角度的旋转对称性
   */
  private checkRotationAngle(
    points: Point[], 
    centerX: number, 
    centerY: number, 
    angle: number, 
    tolerance: number
  ): boolean {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    for (const point of points) {
      // 将点转换到以中心为原点的坐标系
      const x = point.x - centerX;
      const y = point.y - centerY;
      
      // 应用旋转变换
      const rotatedX = x * cos - y * sin + centerX;
      const rotatedY = x * sin + y * cos + centerY;
      
      // 检查是否有匹配的点
      const hasMatch = points.some(p => 
        Math.abs(p.x - rotatedX) < tolerance && Math.abs(p.y - rotatedY) < tolerance
      );
      
      if (!hasMatch) return false;
    }
    
    return true;
  }

  /**
   * 计算相对面积
   */
  private calculateRelativeArea(points: Point[], boundingBox: BoundingBox): number {
    if (points.length < 3) return 0;
    
    // 使用鞋带公式计算多边形面积
    let area = 0;
    const n = points.length;
    
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    area = Math.abs(area) / 2;
    
    // 计算边界框面积
    const boundingArea = (boundingBox.maxX - boundingBox.minX) * (boundingBox.maxY - boundingBox.minY);
    
    return boundingArea > 0 ? Math.min(1.0, area / boundingArea) : 0;
  }

  /**
   * 计算两点间距离
   */
  private calculateDistance(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 验证拓扑结构的有效性
   */
  private validateTopology(topology: ShapeTopology): void {
    // 检查节点数量
    if (topology.nodes.length === 0) {
      throw new Error('拓扑结构不能为空');
    }

    // 检查节点ID唯一性
    const nodeIds = new Set(topology.nodes.map(n => n.id));
    if (nodeIds.size !== topology.nodes.length) {
      throw new Error('拓扑结构中存在重复的节点ID');
    }

    // 检查关系的有效性
    for (const rel of topology.relationships) {
      if (!nodeIds.has(rel.fromNodeId) || !nodeIds.has(rel.toNodeId)) {
        throw new Error(`无效的节点关系: ${rel.fromNodeId} -> ${rel.toNodeId}`);
      }
    }

    // 检查相对位置的有效性
    for (const node of topology.nodes) {
      const { xRatio, yRatio } = node.relativePosition;
      if (xRatio < 0 || xRatio > 1 || yRatio < 0 || yRatio > 1) {
        throw new Error(`节点 ${node.id} 的相对位置超出有效范围: (${xRatio}, ${yRatio})`);
      }
    }

    console.log('✅ 拓扑结构验证通过');
  }
}