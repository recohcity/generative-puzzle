/**
 * 拼图记忆适配系统 - 核心数据类型定义
 * 
 * 这个文件定义了记忆存储系统的核心数据结构，
 * 将形状的"记忆"（拓扑结构）与"表现"（坐标）分离
 */

import { Point, CanvasSize } from './common';

/**
 * 相对位置 - 使用比例而非绝对坐标
 * 这确保了形状记忆与具体画布尺寸无关
 */
export interface RelativePosition {
  xRatio: number;  // 在形状边界框中的X比例 (0-1)
  yRatio: number;  // 在形状边界框中的Y比例 (0-1)
}

/**
 * 拓扑节点 - 形状记忆的基本单元
 * 存储节点的相对位置和连接关系，而非绝对坐标
 */
export interface TopologyNode {
  id: string;
  type: 'vertex' | 'control' | 'anchor';
  relativePosition: RelativePosition;
  connections: string[];  // 连接的其他节点ID
  metadata?: {
    importance: number;    // 节点重要性 (0-1)
    curvature?: number;    // 曲率信息（如果适用）
  };
}

/**
 * 对称性信息 - 帮助保持形状特征
 */
export interface SymmetryInfo {
  hasVerticalSymmetry: boolean;
  hasHorizontalSymmetry: boolean;
  hasRotationalSymmetry: boolean;
  rotationAngle?: number;  // 旋转对称角度
}

/**
 * 边界信息 - 形状的整体特征
 */
export interface BoundingInfo {
  aspectRatio: number;     // 宽高比
  complexity: number;      // 形状复杂度 (0-1)
  symmetry: SymmetryInfo;  // 对称性信息
  area: number;           // 相对面积 (0-1)
}

/**
 * 节点关系 - 描述节点间的连接
 */
export interface NodeRelationship {
  fromNodeId: string;
  toNodeId: string;
  type: 'edge' | 'curve' | 'constraint';
  strength: number;  // 关系强度 (0-1)
}

/**
 * 形状拓扑结构 - 形状的"记忆"核心
 * 包含所有节点、关系和整体特征，但不包含具体坐标
 */
export interface ShapeTopology {
  nodes: TopologyNode[];
  relationships: NodeRelationship[];
  boundingInfo: BoundingInfo;
  version: string;  // 拓扑结构版本，用于兼容性检查
}

/**
 * 形状元数据 - 辅助信息
 */
export interface ShapeMetadata {
  name?: string;
  category: 'polygon' | 'curve' | 'complex';
  tags: string[];
  createdAt: number;
  lastModified: number;
  source: 'generated' | 'imported' | 'user_created';
}

/**
 * 形状记忆 - 完整的记忆存储单元
 * 这是系统中存储的核心数据结构
 */
export interface ShapeMemory {
  id: string;
  topology: ShapeTopology;
  baseCanvasSize: CanvasSize;  // 创建时的基准画布尺寸
  metadata: ShapeMetadata;
  timestamp: number;
  checksum: string;  // 数据完整性校验
}

/**
 * 清理后的拓扑结构 - 准备适配的中间状态
 * 已清除所有绝对坐标信息，只保留相对关系
 */
export interface CleanTopology {
  nodes: TopologyNode[];
  relationships: NodeRelationship[];
  boundingInfo: BoundingInfo;
  originalMemoryId: string;
}

/**
 * 适配指标 - 记录适配过程的质量信息
 */
export interface AdaptationMetrics {
  scaleFactor: number;        // 缩放因子
  centerOffset: Point;        // 居中偏移
  boundaryFit: number;        // 边界适配度 (0-1)
  fidelity: number;          // 与原始形状的保真度 (0-1)
  processingTime: number;     // 适配处理时间(ms)
}

/**
 * 适配后的形状 - 最终输出结果
 * 包含适配后的具体坐标和质量指标
 */
export interface AdaptedShape {
  shapeId: string;
  points: Point[];                    // 适配后的绝对坐标
  canvasSize: CanvasSize;            // 目标画布尺寸
  adaptationMetrics: AdaptationMetrics;
  timestamp: number;
  sourceMemoryChecksum: string;       // 源记忆的校验和
}

/**
 * 记忆状态 - 用于监控和调试
 */
export interface MemoryStatus {
  memoryId: string;
  isValid: boolean;
  lastAccessed: number;
  accessCount: number;
  integrityScore: number;  // 完整性评分 (0-1)
  errors: string[];
}

/**
 * 记忆快照 - 用于调试和备份
 */
export interface MemorySnapshot {
  memory: ShapeMemory;
  status: MemoryStatus;
  relatedAdaptations: AdaptedShape[];
  capturedAt: number;
}

/**
 * 适配历史记录 - 用于分析和优化
 */
export interface AdaptationHistory {
  adaptationId: string;
  memoryId: string;
  sourceCanvas: CanvasSize;
  targetCanvas: CanvasSize;
  metrics: AdaptationMetrics;
  success: boolean;
  error?: string;
  timestamp: number;
}

/**
 * 记忆导出格式 - 用于数据迁移和备份
 */
export interface MemoryExport {
  version: string;
  exportedAt: number;
  memories: ShapeMemory[];
  adaptationHistory: AdaptationHistory[];
  metadata: {
    totalMemories: number;
    totalAdaptations: number;
    exportReason: string;
  };
}