/**
 * 渲染优化器
 * 实现脏区域检测和智能重绘策略
 */

interface DirtyRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface RenderState {
  lastRenderTime: number;
  dirtyRegions: DirtyRegion[];
  isAnimating: boolean;
}

export class RenderOptimizer {
  private static instance: RenderOptimizer;
  private renderState: RenderState = {
    lastRenderTime: 0,
    dirtyRegions: [],
    isAnimating: false
  };
  private frameId: number | null = null;
  private readonly TARGET_FPS = 60;
  private readonly FRAME_TIME = 1000 / this.TARGET_FPS;

  private constructor() {}

  static getInstance(): RenderOptimizer {
    if (!RenderOptimizer.instance) {
      RenderOptimizer.instance = new RenderOptimizer();
    }
    return RenderOptimizer.instance;
  }

  /**
   * 添加脏区域
   */
  addDirtyRegion(x: number, y: number, width: number, height: number) {
    this.renderState.dirtyRegions.push({ x, y, width, height });
  }

  /**
   * 标记拼图块为脏区域
   */
  markPieceDirty(piece: { x: number; y: number; points: { x: number; y: number }[] }) {
    const bounds = this.calculatePieceBounds(piece);
    this.addDirtyRegion(
      bounds.minX - 10, // 添加一些边距
      bounds.minY - 10,
      bounds.width + 20,
      bounds.height + 20
    );
  }

  /**
   * 计算拼图块边界
   */
  private calculatePieceBounds(piece: { x: number; y: number; points: { x: number; y: number }[] }) {
    const xs = piece.points.map(p => p.x);
    const ys = piece.points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    return {
      minX,
      maxX,
      minY,
      maxY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  /**
   * 合并重叠的脏区域
   */
  private mergeDirtyRegions(): DirtyRegion[] {
    if (this.renderState.dirtyRegions.length <= 1) {
      return this.renderState.dirtyRegions;
    }

    const merged: DirtyRegion[] = [];
    const sorted = [...this.renderState.dirtyRegions].sort((a, b) => a.x - b.x);

    for (const region of sorted) {
      const lastMerged = merged[merged.length - 1];
      
      if (lastMerged && this.regionsOverlap(lastMerged, region)) {
        // 合并区域
        const minX = Math.min(lastMerged.x, region.x);
        const minY = Math.min(lastMerged.y, region.y);
        const maxX = Math.max(lastMerged.x + lastMerged.width, region.x + region.width);
        const maxY = Math.max(lastMerged.y + lastMerged.height, region.y + region.height);
        
        lastMerged.x = minX;
        lastMerged.y = minY;
        lastMerged.width = maxX - minX;
        lastMerged.height = maxY - minY;
      } else {
        merged.push({ ...region });
      }
    }

    return merged;
  }

  /**
   * 检查两个区域是否重叠
   */
  private regionsOverlap(a: DirtyRegion, b: DirtyRegion): boolean {
    return !(a.x + a.width < b.x || 
             b.x + b.width < a.x || 
             a.y + a.height < b.y || 
             b.y + b.height < a.y);
  }

  /**
   * 请求智能重绘
   */
  requestRender(renderCallback: (dirtyRegions: DirtyRegion[]) => void) {
    if (this.frameId) {
      return; // 已有待处理的渲染请求
    }

    this.frameId = requestAnimationFrame((currentTime) => {
      this.frameId = null;
      
      // 帧率控制
      if (currentTime - this.renderState.lastRenderTime < this.FRAME_TIME) {
        this.requestRender(renderCallback);
        return;
      }

      const mergedRegions = this.mergeDirtyRegions();
      
      if (mergedRegions.length > 0) {
        renderCallback(mergedRegions);
        this.renderState.dirtyRegions = [];
        this.renderState.lastRenderTime = currentTime;
      }
    });
  }

  /**
   * 设置动画状态
   */
  setAnimating(isAnimating: boolean) {
    this.renderState.isAnimating = isAnimating;
  }

  /**
   * 清除所有脏区域
   */
  clearDirtyRegions() {
    this.renderState.dirtyRegions = [];
  }

  /**
   * 取消待处理的渲染
   */
  cancelRender() {
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }
}

export const renderOptimizer = RenderOptimizer.getInstance();