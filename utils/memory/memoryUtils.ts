/**
 * 记忆工具函数 - 支持记忆存储的辅助功能
 * 
 * 包含：
 * 1. 校验和生成和验证
 * 2. 记忆完整性检查
 * 3. 拓扑结构分析
 * 4. 序列化和反序列化
 */

import { 
  ShapeMemory, 
  ShapeTopology, 
  TopologyNode, 
  RelativePosition,
  BoundingInfo,
  SymmetryInfo 
} from '../../types/memory';
import { Point } from '../../types/common';

/**
 * 生成拓扑结构的校验和
 * @param topology 拓扑结构
 * @returns 校验和字符串
 */
export function generateChecksum(topology: ShapeTopology): string {
  try {
    // 创建一个标准化的字符串表示
    const normalized = {
      nodes: topology.nodes.map(node => ({
        id: node.id,
        type: node.type,
        xRatio: Math.round(node.relativePosition.xRatio * 10000) / 10000,
        yRatio: Math.round(node.relativePosition.yRatio * 10000) / 10000,
        connections: [...node.connections].sort()
      })).sort((a, b) => a.id.localeCompare(b.id)),
      relationships: topology.relationships.map(rel => ({
        from: rel.fromNodeId,
        to: rel.toNodeId,
        type: rel.type,
        strength: Math.round(rel.strength * 1000) / 1000
      })).sort((a, b) => `${a.from}-${a.to}`.localeCompare(`${b.from}-${b.to}`)),
      boundingInfo: {
        aspectRatio: Math.round(topology.boundingInfo.aspectRatio * 1000) / 1000,
        complexity: Math.round(topology.boundingInfo.complexity * 1000) / 1000,
        area: Math.round(topology.boundingInfo.area * 1000) / 1000
      }
    };

    const jsonString = JSON.stringify(normalized);
    return simpleHash(jsonString);
  } catch (error) {
    console.error('校验和生成失败:', error);
    return 'invalid';
  }
}

/**
 * 验证记忆完整性
 * @param memory 要验证的记忆
 * @returns 是否完整有效
 */
export function validateMemoryIntegrity(memory: ShapeMemory): boolean {
  try {
    // 基本结构检查
    if (!memory.id || !memory.topology || !memory.baseCanvasSize) {
      return false;
    }

    // 拓扑结构检查
    const topology = memory.topology;
    if (!topology.nodes || topology.nodes.length === 0) {
      return false;
    }

    // 节点有效性检查
    for (const node of topology.nodes) {
      if (!isValidTopologyNode(node)) {
        return false;
      }
    }

    // 关系有效性检查
    if (topology.relationships) {
      for (const rel of topology.relationships) {
        if (!isValidRelationship(rel, topology.nodes)) {
          return false;
        }
      }
    }

    // 边界信息检查
    if (!isValidBoundingInfo(topology.boundingInfo)) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('记忆完整性验证异常:', error);
    return false;
  }
}

/**
 * 从Point数组提取拓扑结构
 * @param points 点数组
 * @param canvasSize 画布尺寸
 * @returns 拓扑结构
 */
export function extractTopologyFromPoints(points: Point[], canvasSize: { width: number; height: number }): ShapeTopology {
  // 使用新的TopologyExtractor类
  const { TopologyExtractor } = require('./TopologyExtractor');
  const extractor = new TopologyExtractor();
  
  return extractor.extractTopology(points, canvasSize, {
    detectCurves: true,
    importanceThreshold: 0.1,
    symmetryTolerance: 0.05,
    simplifyTopology: false
  });
}

/**
 * 将拓扑结构转换为Point数组
 * @param topology 拓扑结构
 * @param targetCanvasSize 目标画布尺寸
 * @param targetShapeSize 目标形状尺寸
 * @returns Point数组
 */
export function topologyToPoints(
  topology: ShapeTopology, 
  targetCanvasSize: { width: number; height: number },
  targetShapeSize: { width: number; height: number }
): Point[] {
  if (!topology.nodes || topology.nodes.length === 0) {
    return [];
  }

  // 计算目标形状的位置（居中）
  const shapeLeft = (targetCanvasSize.width - targetShapeSize.width) / 2;
  const shapeTop = (targetCanvasSize.height - targetShapeSize.height) / 2;

  // 将相对位置转换为绝对坐标
  return topology.nodes.map(node => ({
    x: shapeLeft + node.relativePosition.xRatio * targetShapeSize.width,
    y: shapeTop + node.relativePosition.yRatio * targetShapeSize.height
  }));
}

/**
 * 计算点数组的边界框
 */
function calculateBounds(points: Point[]) {
  return points.reduce(
    (bounds, point) => ({
      minX: Math.min(bounds.minX, point.x),
      maxX: Math.max(bounds.maxX, point.x),
      minY: Math.min(bounds.minY, point.y),
      maxY: Math.max(bounds.maxY, point.y)
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
  );
}

/**
 * 获取节点的连接关系
 */
function getNodeConnections(nodeIndex: number, totalNodes: number): string[] {
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
  if (nodeIndex === 0 && totalNodes > 2) {
    connections.push(`node_${totalNodes - 1}`);
  }
  if (nodeIndex === totalNodes - 1 && totalNodes > 2) {
    connections.push('node_0');
  }
  
  return connections;
}

/**
 * 计算节点重要性
 */
function calculateNodeImportance(point: Point, allPoints: Point[], index: number): number {
  // 基于节点在形状中的位置和角度变化计算重要性
  const totalPoints = allPoints.length;
  if (totalPoints < 3) return 1.0;

  const prevIndex = (index - 1 + totalPoints) % totalPoints;
  const nextIndex = (index + 1) % totalPoints;
  
  const prevPoint = allPoints[prevIndex];
  const nextPoint = allPoints[nextIndex];
  
  // 计算角度变化
  const angle1 = Math.atan2(point.y - prevPoint.y, point.x - prevPoint.x);
  const angle2 = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x);
  const angleDiff = Math.abs(angle2 - angle1);
  
  // 角度变化越大，重要性越高
  return Math.min(1.0, angleDiff / Math.PI);
}

/**
 * 生成节点关系
 */
function generateNodeRelationships(nodes: TopologyNode[]) {
  const relationships: Array<{source: string; target: string; type: string; fromNodeId?: string; toNodeId?: string}> = [];
  
  for (const node of nodes) {
    for (const connectionId of node.connections) {
      // 避免重复关系
      const existingRel = relationships.find(rel => 
        (rel.fromNodeId === node.id && rel.toNodeId === connectionId) ||
        (rel.fromNodeId === connectionId && rel.toNodeId === node.id)
      );
      
      if (!existingRel) {
        relationships.push({
          source: node.id,
          target: connectionId,
          type: 'edge',
          fromNodeId: node.id,
          toNodeId: connectionId
        });
      }
    }
  }
  
  return relationships;
}

/**
 * 分析边界信息
 */
function analyzeBoundingInfo(points: Point[], bounds: any): BoundingInfo {
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  
  return {
    aspectRatio: height > 0 ? width / height : 1.0,
    complexity: calculateComplexity(points),
    symmetry: analyzeSymmetry(points, bounds),
    area: calculateRelativeArea(points, bounds)
  };
}

/**
 * 计算形状复杂度
 */
function calculateComplexity(points: Point[]): number {
  if (points.length < 3) return 0;
  
  // 基于点数量和角度变化计算复杂度
  let totalAngleChange = 0;
  const n = points.length;
  
  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];
    
    const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
    const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x);
    totalAngleChange += Math.abs(angle2 - angle1);
  }
  
  // 标准化复杂度到0-1范围
  return Math.min(1.0, totalAngleChange / (2 * Math.PI * n));
}

/**
 * 分析对称性
 */
function analyzeSymmetry(points: Point[], bounds: any): SymmetryInfo {
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  
  // 简化的对称性检测
  let verticalSymmetry = true;
  let horizontalSymmetry = true;
  
  const tolerance = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) * 0.1;
  
  for (const point of points) {
    // 检查垂直对称
    const mirrorX = 2 * centerX - point.x;
    const hasVerticalMirror = points.some(p => 
      Math.abs(p.x - mirrorX) < tolerance && Math.abs(p.y - point.y) < tolerance
    );
    if (!hasVerticalMirror) verticalSymmetry = false;
    
    // 检查水平对称
    const mirrorY = 2 * centerY - point.y;
    const hasHorizontalMirror = points.some(p => 
      Math.abs(p.x - point.x) < tolerance && Math.abs(p.y - mirrorY) < tolerance
    );
    if (!hasHorizontalMirror) horizontalSymmetry = false;
  }
  
  return {
    hasVerticalSymmetry: verticalSymmetry,
    hasHorizontalSymmetry: horizontalSymmetry,
    hasRotationalSymmetry: false, // 简化实现
    rotationAngle: undefined
  };
}

/**
 * 计算相对面积
 */
function calculateRelativeArea(points: Point[], bounds: any): number {
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
  
  // 相对于边界框的面积比例
  const boundingArea = (bounds.maxX - bounds.minX) * (bounds.maxY - bounds.minY);
  return boundingArea > 0 ? area / boundingArea : 0;
}

/**
 * 验证拓扑节点有效性
 */
function isValidTopologyNode(node: TopologyNode): boolean {
  return !!(
    node.id &&
    node.type &&
    node.relativePosition &&
    typeof node.relativePosition.xRatio === 'number' &&
    typeof node.relativePosition.yRatio === 'number' &&
    node.relativePosition.xRatio >= 0 &&
    node.relativePosition.xRatio <= 1 &&
    node.relativePosition.yRatio >= 0 &&
    node.relativePosition.yRatio <= 1 &&
    Array.isArray(node.connections)
  );
}

/**
 * 验证关系有效性
 */
function isValidRelationship(relationship: any, nodes: TopologyNode[]): boolean {
  const nodeIds = new Set(nodes.map(n => n.id));
  return !!(
    relationship.fromNodeId &&
    relationship.toNodeId &&
    relationship.type &&
    typeof relationship.strength === 'number' &&
    nodeIds.has(relationship.fromNodeId) &&
    nodeIds.has(relationship.toNodeId)
  );
}

/**
 * 验证边界信息有效性
 */
function isValidBoundingInfo(boundingInfo: BoundingInfo): boolean {
  return !!(
    boundingInfo &&
    typeof boundingInfo.aspectRatio === 'number' &&
    typeof boundingInfo.complexity === 'number' &&
    typeof boundingInfo.area === 'number' &&
    boundingInfo.aspectRatio > 0 &&
    boundingInfo.complexity >= 0 &&
    boundingInfo.complexity <= 1 &&
    boundingInfo.area >= 0 &&
    boundingInfo.area <= 1 &&
    boundingInfo.symmetry
  );
}

/**
 * 简单哈希函数
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  return Math.abs(hash).toString(16);
}