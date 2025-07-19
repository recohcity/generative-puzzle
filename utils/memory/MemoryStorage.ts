/**
 * 记忆存储类 - 管理形状记忆的存储和检索
 * 
 * 这个类负责：
 * 1. 存储形状的拓扑结构记忆
 * 2. 提供高效的记忆检索
 * 3. 维护记忆数据的完整性
 * 4. 支持记忆的序列化和反序列化
 */

import {
  ShapeMemory,
  MemoryStatus,
  MemorySnapshot,
  MemoryExport,
  ShapeTopology,
  ShapeMetadata
} from '../../types/memory';
import { CanvasSize } from '../../types/common';
import { generateChecksum, validateMemoryIntegrity } from './memoryUtils';

export class MemoryStorage {
  private memories: Map<string, ShapeMemory> = new Map();
  private accessCounts: Map<string, number> = new Map();
  private lastAccessed: Map<string, number> = new Map();
  private readonly maxMemories: number;
  private readonly enableIntegrityCheck: boolean;

  constructor(options: {
    maxMemories?: number;
    enableIntegrityCheck?: boolean;
  } = {}) {
    this.maxMemories = options.maxMemories || 1000;
    this.enableIntegrityCheck = options.enableIntegrityCheck ?? true;
  }

  /**
   * 存储形状记忆
   * @param shapeId 形状唯一标识符
   * @param topology 形状拓扑结构
   * @param baseCanvas 基准画布尺寸
   * @param metadata 形状元数据
   * @returns 存储是否成功
   */
  store(
    shapeId: string,
    topology: ShapeTopology,
    baseCanvas: CanvasSize,
    metadata: ShapeMetadata
  ): boolean {
    try {
      // 检查存储容量
      if (this.memories.size >= this.maxMemories && !this.memories.has(shapeId)) {
        this.evictOldestMemory();
      }

      // 创建记忆对象
      const memory: ShapeMemory = {
        id: shapeId,
        topology,
        baseCanvasSize: baseCanvas,
        metadata: {
          ...metadata,
          lastModified: Date.now()
        },
        timestamp: Date.now(),
        checksum: generateChecksum(topology)
      };

      // 验证记忆完整性
      if (this.enableIntegrityCheck && !this.validateMemory(memory)) {
        console.error(`记忆存储失败: 形状 ${shapeId} 的拓扑结构无效`);
        return false;
      }

      // 存储记忆
      this.memories.set(shapeId, memory);
      this.accessCounts.set(shapeId, 0);
      this.lastAccessed.set(shapeId, Date.now());

      console.log(`✅ 形状记忆已存储: ${shapeId}, 节点数: ${topology.nodes.length}`);
      return true;

    } catch (error) {
      console.error(`记忆存储异常: ${shapeId}`, error);
      return false;
    }
  }

  /**
   * 检索形状记忆
   * @param shapeId 形状标识符
   * @returns 形状记忆或null
   */
  retrieve(shapeId: string): ShapeMemory | null {
    const memory = this.memories.get(shapeId);

    if (!memory) {
      console.warn(`记忆未找到: ${shapeId}`);
      return null;
    }

    // 更新访问统计
    this.accessCounts.set(shapeId, (this.accessCounts.get(shapeId) || 0) + 1);
    this.lastAccessed.set(shapeId, Date.now());

    // 验证记忆完整性
    if (this.enableIntegrityCheck && !this.validateMemory(memory)) {
      console.error(`记忆完整性验证失败: ${shapeId}`);
      this.memories.delete(shapeId);
      return null;
    }

    console.log(`📖 记忆已读取: ${shapeId}, 访问次数: ${this.accessCounts.get(shapeId)}`);
    return memory;
  }

  /**
   * 清除指定形状的记忆
   * @param shapeId 形状标识符
   * @returns 清除是否成功
   */
  clear(shapeId: string): boolean {
    const existed = this.memories.has(shapeId);

    this.memories.delete(shapeId);
    this.accessCounts.delete(shapeId);
    this.lastAccessed.delete(shapeId);

    if (existed) {
      console.log(`🗑️ 记忆已清除: ${shapeId}`);
    }

    return existed;
  }

  /**
   * 列出所有存储的记忆
   * @returns 所有形状记忆的数组
   */
  listAll(): ShapeMemory[] {
    return Array.from(this.memories.values());
  }

  /**
   * 获取记忆状态信息
   * @param shapeId 形状标识符
   * @returns 记忆状态或null
   */
  getMemoryStatus(shapeId: string): MemoryStatus | null {
    const memory = this.memories.get(shapeId);
    if (!memory) return null;

    const errors: string[] = [];
    let integrityScore = 1.0;

    // 检查记忆完整性
    if (this.enableIntegrityCheck) {
      const isValid = this.validateMemory(memory);
      if (!isValid) {
        errors.push('记忆完整性验证失败');
        integrityScore = 0.0;
      }
    }

    // 检查拓扑结构
    if (memory.topology.nodes.length === 0) {
      errors.push('拓扑结构为空');
      integrityScore *= 0.5;
    }

    return {
      memoryId: shapeId,
      isValid: errors.length === 0,
      lastAccessed: this.lastAccessed.get(shapeId) || 0,
      accessCount: this.accessCounts.get(shapeId) || 0,
      integrityScore,
      errors
    };
  }

  /**
   * 创建记忆快照
   * @param shapeId 形状标识符
   * @returns 记忆快照或null
   */
  createSnapshot(shapeId: string): MemorySnapshot | null {
    const memory = this.memories.get(shapeId);
    const status = this.getMemoryStatus(shapeId);

    if (!memory || !status) return null;

    return {
      memory,
      status,
      relatedAdaptations: [], // 这里可以扩展为包含相关的适配历史
      capturedAt: Date.now()
    };
  }

  /**
   * 导出所有记忆数据
   * @param reason 导出原因
   * @returns 记忆导出数据
   */
  exportMemories(reason: string = 'manual_export'): MemoryExport {
    return {
      version: '1.0.0',
      exportedAt: Date.now(),
      memories: this.listAll(),
      adaptationHistory: [], // 这里可以扩展为包含适配历史
      metadata: {
        totalMemories: this.memories.size,
        totalAdaptations: 0,
        exportReason: reason
      }
    };
  }

  /**
   * 从导出数据导入记忆
   * @param exportData 导出的记忆数据
   * @returns 导入成功的记忆数量
   */
  importMemories(exportData: MemoryExport): number {
    let importedCount = 0;

    for (const memory of exportData.memories) {
      try {
        // 验证记忆格式
        if (this.validateMemory(memory)) {
          this.memories.set(memory.id, memory);
          this.accessCounts.set(memory.id, 0);
          this.lastAccessed.set(memory.id, Date.now());
          importedCount++;
        } else {
          console.warn(`跳过无效记忆: ${memory.id}`);
        }
      } catch (error) {
        console.error(`导入记忆失败: ${memory.id}`, error);
      }
    }

    console.log(`📥 记忆导入完成: ${importedCount}/${exportData.memories.length}`);
    return importedCount;
  }

  /**
   * 清空所有记忆
   */
  clearAll(): void {
    const count = this.memories.size;
    this.memories.clear();
    this.accessCounts.clear();
    this.lastAccessed.clear();
    console.log(`🗑️ 已清空所有记忆: ${count} 个`);
  }

  /**
   * 获取存储统计信息
   */
  getStorageStats() {
    return {
      totalMemories: this.memories.size,
      maxCapacity: this.maxMemories,
      utilizationRate: this.memories.size / this.maxMemories,
      oldestMemory: Math.min(...Array.from(this.lastAccessed.values())),
      newestMemory: Math.max(...Array.from(this.lastAccessed.values())),
      totalAccesses: Array.from(this.accessCounts.values()).reduce((sum, count) => sum + count, 0)
    };
  }

  /**
   * 验证记忆完整性
   * @param memory 要验证的记忆
   * @returns 是否有效
   */
  private validateMemory(memory: ShapeMemory): boolean {
    try {
      // 基本字段检查
      if (!memory.id || !memory.topology || !memory.baseCanvasSize) {
        return false;
      }

      // 拓扑结构检查
      if (!memory.topology.nodes || memory.topology.nodes.length === 0) {
        return false;
      }

      // 校验和检查
      if (this.enableIntegrityCheck) {
        const expectedChecksum = generateChecksum(memory.topology);
        if (memory.checksum !== expectedChecksum) {
          console.warn(`记忆校验和不匹配: ${memory.id}`);
          return false;
        }
      }

      // 使用工具函数进行深度验证
      return validateMemoryIntegrity(memory);

    } catch (error) {
      console.error(`记忆验证异常: ${memory.id}`, error);
      return false;
    }
  }

  /**
   * 淘汰最旧的记忆以释放空间
   */
  private evictOldestMemory(): void {
    let oldestId = '';
    let oldestTime = Date.now();

    for (const [id, time] of this.lastAccessed.entries()) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestId = id;
      }
    }

    if (oldestId) {
      this.clear(oldestId);
      console.log(`🔄 已淘汰最旧记忆: ${oldestId}`);
    }
  }
}