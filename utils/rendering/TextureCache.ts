import { Point } from "@generative-puzzle/game-core";

export interface CachedPiece {
  canvas: HTMLCanvasElement | OffscreenCanvas;
  width: number;
  height: number;
  offsetX: number; // 绘制时的偏移补正 (padding)
  valid: boolean;
}

class TextureCache {
  private cache: Map<string, CachedPiece> = new Map();
  private textureImg: HTMLImageElement | null = null;
  private texturePattern: CanvasPattern | null = null;
  private isInitializing: boolean = false;
  private initPromise: Promise<void> | null = null;

  /**
   * 初始化并预加载纹理图片
   */
  async initStack(): Promise<void> {
    if (this.textureImg) return Promise.resolve();
    if (this.isInitializing) return this.initPromise!;

    this.isInitializing = true;
    this.initPromise = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.textureImg = img;
        this.isInitializing = false;
        this.clear(); // 关键：加载成功后清理一次缓存，确保后续生成带纹理的位图
        resolve();
      };
      img.onerror = () => {
        console.warn("[TextureCache] Failed to load texture, falling back to pure colors.");
        this.isInitializing = false;
        resolve();
      };
      img.src = '/texture-tile.png';
    });
    return this.initPromise;
  }

  /**
   * 清理所有缓存
   */
  clear() {
    this.cache.clear();
    this.texturePattern = null;
  }

  /**
   * 获取或创建一个带有纹理的拼图碎片位图
   */
  getPiece(
    index: number,
    points: Point[],
    color: string,
    shapeType: string,
    isCompleted: boolean
  ): CachedPiece {
    // 缓存键排除绝对位置，保证拖动时能命中
    const cacheKey = `${index}_${color}_${isCompleted}_${shapeType}`;
    const hit = this.cache.get(cacheKey);
    if (hit) return hit;

    // 计算当前碎片的本地包围盒
    const bounds = this.calculateLocalBounds(points);
    const padding = 2; // 留出一点边距防止切边抗锯齿问题
    const width = Math.ceil(bounds.width + padding * 2);
    const height = Math.ceil(bounds.height + padding * 2);

    // 创建离屏画布
    let canvas: HTMLCanvasElement | OffscreenCanvas;
    if (typeof OffscreenCanvas !== 'undefined') {
      canvas = new OffscreenCanvas(width, height);
    } else {
      canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
    }

    const ctx = canvas.getContext('2d') as (CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D);
    if (!ctx) {
      return { canvas: canvas, width: 0, height: 0, offsetX: 0, valid: false };
    }

    // 将绘制原点移动到局部包围盒左上角（含 padding）
    ctx.translate(-bounds.minX + padding, -bounds.minY + padding);

    // 绘制主体形状
    this.drawPath(ctx, points, shapeType);
    ctx.fillStyle = color;
    ctx.fill();

    // 描边以修补抗锯齿缝隙
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // 叠加纹理
    this.applyTexture(ctx, points, shapeType);

    const cached: CachedPiece = {
      canvas,
      width,
      height,
      offsetX: padding,
      valid: true
    };

    this.cache.set(cacheKey, cached);
    return cached;
  }

  private calculateLocalBounds(points: Point[]) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
  }

  private drawPath(ctx: any, points: Point[], shapeType: string) {
    if (points.length === 0) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const current = points[i];
      const next = points[(i + 1) % points.length];

      if (shapeType !== "polygon" && current.isOriginal !== false) {
        // 对于曲线形状和锯齿形状，使用二次贝塞尔曲线
        const nextMidX = (current.x + next.x) / 2;
        const nextMidY = (current.y + next.y) / 2;
        ctx.quadraticCurveTo(current.x, current.y, nextMidX, nextMidY);
      } else {
        // 对于多边形和切割线，使用直线
        ctx.lineTo(current.x, current.y);
      }
    }
    ctx.closePath();
  }

  private applyTexture(ctx: any, points: Point[], shapeType: string) {
    if (!this.textureImg || !this.textureImg.complete) return;

    if (!this.texturePattern) {
      this.texturePattern = ctx.createPattern(this.textureImg, 'repeat');
    }

    if (this.texturePattern) {
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = this.texturePattern;
      this.drawPath(ctx, points, shapeType);
      ctx.fill();
      ctx.restore();
    }
  }
}

export const textureCache = new TextureCache();
