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

  /**
   * 计算点数组的边界框
   */
  calculateBounds(points: { x: number; y: number }[]) {
    if (points.length === 0) {
      return {
        minX: 0,
        maxX: 0,
        minY: 0,
        maxY: 0,
        width: 0,
        height: 0
      };
    }

    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
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
   * 检查是否需要重绘
   */
  shouldRedraw(oldPoints: { x: number; y: number }[], newPoints: { x: number; y: number }[]): boolean {
    if (oldPoints.length !== newPoints.length) {
      return true;
    }

    for (let i = 0; i < oldPoints.length; i++) {
      if (oldPoints[i].x !== newPoints[i].x || oldPoints[i].y !== newPoints[i].y) {
        return true;
      }
    }

    return false;
  }

  /**
   * 优化渲染路径
   */
  optimizeRenderPath(points: { x: number; y: number }[]): { x: number; y: number }[] {
    if (points.length <= 2) {
      return [...points];
    }

    // 简单的路径优化：移除共线的点
    const optimized: { x: number; y: number }[] = [points[0]];

    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];

      // 检查是否共线
      const cross = (curr.x - prev.x) * (next.y - prev.y) - (curr.y - prev.y) * (next.x - prev.x);
      if (Math.abs(cross) > 0.001) { // 不共线，保留点
        optimized.push(curr);
      }
    }

    optimized.push(points[points.length - 1]);
    return optimized;
  }

  /**
   * 优化Canvas绘制
   */
  optimizeCanvasDrawing(ctx: CanvasRenderingContext2D, points: { x: number; y: number }[]) {
    if (points.length === 0) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    
    ctx.closePath();
  }

  /**
   * 优化Canvas状态管理
   */
  optimizeCanvasState(ctx: CanvasRenderingContext2D, points: { x: number; y: number }[]) {
    ctx.save();
    
    // 计算边界并设置裁剪区域
    const bounds = this.calculateBounds(points);
    if (bounds.width > 0 && bounds.height > 0) {
      ctx.rect(bounds.minX, bounds.minY, bounds.width, bounds.height);
      ctx.clip();
    }
    
    ctx.restore();
  }

  /**
   * 清理资源
   */
  cleanup() {
    this.cancelRender();
    this.clearDirtyRegions();
    this.renderState.lastRenderTime = 0;
    this.renderState.isAnimating = false;
  }
}

export const renderOptimizer = RenderOptimizer.getInstance();