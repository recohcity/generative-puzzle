/**
 * 坐标清除器 - 从拓扑结构中清除绝对坐标信息
 * 
 * 这个类负责：
 * 1. 从形状记忆中提取纯拓扑结构
 * 2. 清除所有与具体画布尺寸相关的坐标信息
 * 3. 保留形状的相对关系和结构特征
 * 4. 生成准备适配的清洁拓扑结构
 */

import { 
  ShapeMemory, 
  ShapeTopology, 
  CleanTopology, 
  TopologyNode, 
  NodeRelationship,
  BoundingInfo 
} from '../../types/memory';

export interface CleaningOptions {
  /** 是否保留节点重要性信息 */
  preserveImportance: boolean;
  /** 是否保留曲率信息 */
  preserveCurvature: boolean;
  /** 是否验证清理结果 */
  validateResult: boolean;
  /** 是否保留对称性信息 */
  preserveSymmetry: boolean;
}

export interface CleaningResult {
  /** 清理后的拓扑结构 */
  cleanTopology: CleanTopology;
  /** 清理过程的统计信息 */
  cleaningStats: CleaningStats;
  /** 清理是否成功 */
  success: boolean;
  /** 错误信息（如果有） */
  error?: string;
}

export interface CleaningStats {
  /** 原始节点数量 */
  originalNodeCount: number;
  /** 清理后节点数量 */
  cleanedNodeCount: number;
  /** 原始关系数量 */
  originalRelationshipCount: number;
  /** 清理后关系数量 */
  cleanedRelationshipCount: number;
  /** 清理处理时间（毫秒） */
  processingTime: number;
  /** 数据完整性评分 (0-1) */
  integrityScore: number;
}

export class CoordinateCleaner {
  private readonly defaultOptions: CleaningOptions = {
    preserveImportance: true,
    preserveCurvature: true,
    validateResult: true,
    preserveSymmetry: true
  };

  /**
   * 从形状记忆中清除坐标信息
   * @param memory 形状记忆
   * @param options 清理选项
   * @returns 清理结果
   */
  cleanFromMemory(
    memory: ShapeMemory, 
    options: Partial<CleaningOptions> = {}
  ): CleaningResult {
    const startTime = Date.now();
    const opts = { ...this.defaultOptions, ...options };

    try {
      console.log(`🧹 开始清理坐标: ${memory.id}`);

      // 验证输入记忆
      if (!this.validateMemory(memory)) {
        return {
          cleanTopology: this.createEmptyCleanTopology(memory.id),
          cleaningStats: this.createEmptyStats(),
          success: false,
          error: '输入记忆无效'
        };
      }

      // 执行坐标清理
      const cleanTopology = this.performCleaning(memory.topology, memory.id, opts);
      
      // 计算处理时间
      const processingTime = Date.now() - startTime;
      
      // 生成统计信息
      const cleaningStats = this.generateCleaningStats(
        memory.topology, 
        cleanTopology, 
        processingTime
      );

      // 验证清理结果
      if (opts.validateResult && !this.validateCleanTopology(cleanTopology)) {
        return {
          cleanTopology,
          cleaningStats,
          success: false,
          error: '清理结果验证失败'
        };
      }

      console.log(`✅ 坐标清理完成: ${memory.id}, 耗时: ${processingTime}ms`);

      return {
        cleanTopology,
        cleaningStats,
        success: true
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`❌ 坐标清理失败: ${memory.id}`, error);

      return {
        cleanTopology: this.createEmptyCleanTopology(memory.id),
        cleaningStats: this.createEmptyStats(processingTime),
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 直接从拓扑结构清除坐标
   * @param topology 拓扑结构
   * @param memoryId 记忆ID
   * @param options 清理选项
   * @returns 清洁拓扑结构
   */
  cleanFromTopology(
    topology: ShapeTopology, 
    memoryId: string, 
    options: Partial<CleaningOptions> = {}
  ): CleanTopology {
    const opts = { ...this.defaultOptions, ...options };
    return this.performCleaning(topology, memoryId, opts);
  }

  /**
   * 执行实际的坐标清理过程
   */
  private performCleaning(
    topology: ShapeTopology, 
    memoryId: string, 
    options: CleaningOptions
  ): CleanTopology {
    // 1. 清理节点 - 移除任何绝对坐标引用
    const cleanedNodes = this.cleanNodes(topology.nodes, options);
    
    // 2. 清理关系 - 确保关系只基于相对结构
    const cleanedRelationships = this.cleanRelationships(topology.relationships, cleanedNodes);
    
    // 3. 清理边界信息 - 保留结构特征，移除尺寸信息
    const cleanedBoundingInfo = this.cleanBoundingInfo(topology.boundingInfo, options);

    return {
      nodes: cleanedNodes,
      relationships: cleanedRelationships,
      boundingInfo: cleanedBoundingInfo,
      originalMemoryId: memoryId
    };
  }

  /**
   * 清理节点信息
   */
  private cleanNodes(nodes: TopologyNode[], options: CleaningOptions): TopologyNode[] {
    return nodes.map(node => {
      // 创建清洁的节点副本
      const cleanedNode: TopologyNode = {
        id: node.id,
        type: node.type,
        relativePosition: {
          // 相对位置已经是标准化的，直接保留
          xRatio: node.relativePosition.xRatio,
          yRatio: node.relativePosition.yRatio
        },
        connections: [...node.connections], // 深拷贝连接数组
        metadata: {}
      };

      // 根据选项保留元数据
      if (options.preserveImportance && node.metadata?.importance !== undefined) {
        cleanedNode.metadata!.importance = node.metadata.importance;
      }

      if (options.preserveCurvature && node.metadata?.curvature !== undefined) {
        cleanedNode.metadata!.curvature = node.metadata.curvature;
      }

      return cleanedNode;
    });
  }

  /**
   * 清理关系信息
   */
  private cleanRelationships(
    relationships: NodeRelationship[], 
    cleanedNodes: TopologyNode[]
  ): NodeRelationship[] {
    const nodeIds = new Set(cleanedNodes.map(n => n.id));
    
    return relationships
      .filter(rel => 
        // 只保留有效的关系
        nodeIds.has(rel.fromNodeId) && nodeIds.has(rel.toNodeId)
      )
      .map(rel => ({
        // 创建清洁的关系副本
        fromNodeId: rel.fromNodeId,
        toNodeId: rel.toNodeId,
        type: rel.type,
        strength: rel.strength
      }));
  }

  /**
   * 清理边界信息
   */
  private cleanBoundingInfo(
    boundingInfo: BoundingInfo, 
    options: CleaningOptions
  ): BoundingInfo {
    const cleanedInfo: BoundingInfo = {
      // 保留宽高比 - 这是结构特征
      aspectRatio: boundingInfo.aspectRatio,
      // 保留复杂度 - 这是形状特征
      complexity: boundingInfo.complexity,
      // 保留相对面积 - 这是标准化的
      area: boundingInfo.area,
      // 根据选项决定是否保留对称性信息
      symmetry: options.preserveSymmetry ? {
        hasVerticalSymmetry: boundingInfo.symmetry.hasVerticalSymmetry,
        hasHorizontalSymmetry: boundingInfo.symmetry.hasHorizontalSymmetry,
        hasRotationalSymmetry: boundingInfo.symmetry.hasRotationalSymmetry,
        rotationAngle: boundingInfo.symmetry.rotationAngle
      } : {
        hasVerticalSymmetry: false,
        hasHorizontalSymmetry: false,
        hasRotationalSymmetry: false,
        rotationAngle: undefined
      }
    };

    return cleanedInfo;
  }

  /**
   * 验证输入记忆的有效性
   */
  private validateMemory(memory: ShapeMemory): boolean {
    if (!memory || !memory.id || !memory.topology) {
      return false;
    }

    if (!memory.topology.nodes || memory.topology.nodes.length === 0) {
      return false;
    }

    // 检查节点的相对位置是否有效
    for (const node of memory.topology.nodes) {
      if (!node.relativePosition || 
          typeof node.relativePosition.xRatio !== 'number' ||
          typeof node.relativePosition.yRatio !== 'number' ||
          node.relativePosition.xRatio < 0 || node.relativePosition.xRatio > 1 ||
          node.relativePosition.yRatio < 0 || node.relativePosition.yRatio > 1) {
        return false;
      }
    }

    return true;
  }

  /**
   * 验证清洁拓扑结构的有效性
   */
  private validateCleanTopology(cleanTopology: CleanTopology): boolean {
    // 检查基本结构
    if (!cleanTopology.nodes || cleanTopology.nodes.length === 0) {
      return false;
    }

    if (!cleanTopology.originalMemoryId) {
      return false;
    }

    // 检查节点ID的唯一性
    const nodeIds = new Set(cleanTopology.nodes.map(n => n.id));
    if (nodeIds.size !== cleanTopology.nodes.length) {
      return false;
    }

    // 检查关系的有效性
    for (const rel of cleanTopology.relationships) {
      if (!nodeIds.has(rel.fromNodeId) || !nodeIds.has(rel.toNodeId)) {
        return false;
      }
    }

    // 检查相对位置是否仍然有效
    for (const node of cleanTopology.nodes) {
      const { xRatio, yRatio } = node.relativePosition;
      if (xRatio < 0 || xRatio > 1 || yRatio < 0 || yRatio > 1) {
        return false;
      }
    }

    return true;
  }

  /**
   * 生成清理统计信息
   */
  private generateCleaningStats(
    originalTopology: ShapeTopology,
    cleanTopology: CleanTopology,
    processingTime: number
  ): CleaningStats {
    // 计算数据完整性评分
    const nodeRetentionRate = cleanTopology.nodes.length / originalTopology.nodes.length;
    const relationshipRetentionRate = cleanTopology.relationships.length / originalTopology.relationships.length;
    const integrityScore = (nodeRetentionRate + relationshipRetentionRate) / 2;

    return {
      originalNodeCount: originalTopology.nodes.length,
      cleanedNodeCount: cleanTopology.nodes.length,
      originalRelationshipCount: originalTopology.relationships.length,
      cleanedRelationshipCount: cleanTopology.relationships.length,
      processingTime,
      integrityScore
    };
  }

  /**
   * 创建空的清洁拓扑结构
   */
  private createEmptyCleanTopology(memoryId: string): CleanTopology {
    return {
      nodes: [],
      relationships: [],
      boundingInfo: {
        aspectRatio: 1.0,
        complexity: 0,
        symmetry: {
          hasVerticalSymmetry: false,
          hasHorizontalSymmetry: false,
          hasRotationalSymmetry: false
        },
        area: 0
      },
      originalMemoryId: memoryId
    };
  }

  /**
   * 创建空的统计信息
   */
  private createEmptyStats(processingTime: number = 0): CleaningStats {
    return {
      originalNodeCount: 0,
      cleanedNodeCount: 0,
      originalRelationshipCount: 0,
      cleanedRelationshipCount: 0,
      processingTime,
      integrityScore: 0
    };
  }

  /**
   * 检查清洁拓扑结构的完整性
   * @param cleanTopology 清洁拓扑结构
   * @returns 完整性报告
   */
  checkIntegrity(cleanTopology: CleanTopology): {
    isValid: boolean;
    issues: string[];
    score: number;
  } {
    const issues: string[] = [];
    let score = 1.0;

    // 检查节点完整性
    if (cleanTopology.nodes.length === 0) {
      issues.push('清洁拓扑结构中没有节点');
      score = 0;
    }

    // 检查相对位置的有效性
    for (const node of cleanTopology.nodes) {
      const { xRatio, yRatio } = node.relativePosition;
      if (xRatio < 0 || xRatio > 1 || yRatio < 0 || yRatio > 1) {
        issues.push(`节点 ${node.id} 的相对位置超出有效范围: (${xRatio}, ${yRatio})`);
        score *= 0.9;
      }
    }

    // 检查关系完整性
    const nodeIds = new Set(cleanTopology.nodes.map(n => n.id));
    for (const rel of cleanTopology.relationships) {
      if (!nodeIds.has(rel.fromNodeId) || !nodeIds.has(rel.toNodeId)) {
        issues.push(`无效的关系: ${rel.fromNodeId} -> ${rel.toNodeId}`);
        score *= 0.8;
      }
    }

    // 检查边界信息
    if (cleanTopology.boundingInfo.aspectRatio <= 0) {
      issues.push('无效的宽高比');
      score *= 0.9;
    }

    if (cleanTopology.boundingInfo.complexity < 0 || cleanTopology.boundingInfo.complexity > 1) {
      issues.push('复杂度超出有效范围');
      score *= 0.9;
    }

    return {
      isValid: issues.length === 0,
      issues,
      score: Math.max(0, score)
    };
  }

  /**
   * 比较两个清洁拓扑结构的相似性
   * @param topology1 第一个拓扑结构
   * @param topology2 第二个拓扑结构
   * @returns 相似性评分 (0-1)
   */
  compareSimilarity(topology1: CleanTopology, topology2: CleanTopology): number {
    // 节点数量相似性
    const nodeCountSimilarity = 1 - Math.abs(topology1.nodes.length - topology2.nodes.length) / 
                               Math.max(topology1.nodes.length, topology2.nodes.length);

    // 关系数量相似性
    const relationshipCountSimilarity = 1 - Math.abs(topology1.relationships.length - topology2.relationships.length) / 
                                       Math.max(topology1.relationships.length, topology2.relationships.length);

    // 边界信息相似性
    const aspectRatioSimilarity = 1 - Math.abs(topology1.boundingInfo.aspectRatio - topology2.boundingInfo.aspectRatio) / 
                                 Math.max(topology1.boundingInfo.aspectRatio, topology2.boundingInfo.aspectRatio);

    const complexitySimilarity = 1 - Math.abs(topology1.boundingInfo.complexity - topology2.boundingInfo.complexity);

    // 综合相似性评分
    return (nodeCountSimilarity + relationshipCountSimilarity + aspectRatioSimilarity + complexitySimilarity) / 4;
  }
}