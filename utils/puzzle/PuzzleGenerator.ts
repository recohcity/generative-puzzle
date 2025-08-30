import type { Point, PuzzlePiece } from "@/types/puzzleTypes"
import { generateCuts } from "@/utils/puzzle/cutGenerators"
import { splitPolygon } from "@/utils/puzzle/puzzleUtils"

export class PuzzleGenerator {
  /**
   * 生成拼图的核心算法
   * 
   * 算法流程：
   * 1. 生成切割线：根据难度和类型创建切割路径
   * 2. 多边形分割：使用线段相交算法将形状切割成片段
   * 3. 质量控制：确保生成足够数量的有效拼图片段
   * 4. 颜色分配：为每个片段分配暖色调颜色
   * 5. 位置计算：确定每个片段的中心点和初始位置
   * 
   * @param shape 原始形状的顶点数组
   * @param cutType 切割类型：直线或斜线
   * @param cutCount 切割线数量（决定拼图难度）
   * @param shapeType 形状类型（影响渲染方式）
   * @returns 包含拼图片段和原始位置的对象
   */
  static generatePuzzle(
    shape: Point[],
    cutType: "straight" | "diagonal",
    cutCount: number,
    shapeType?: string,
  ): { pieces: PuzzlePiece[]; originalPositions: PuzzlePiece[] } {
    // 步骤1：生成切割线
    // 根据形状边界、难度级别和切割类型生成优化的切割路径
    const cuts = generateCuts(shape, cutCount, cutType);

    // 步骤2：执行多边形分割
    // 使用线段相交检测算法将原始形状切割成独立的拼图片段
    let splitPieces: Point[][] = splitPolygon(shape, cuts);

    // 步骤3：质量控制 - 验证切割效果
    // 理论上N条切割线应该产生N+1个拼图片段
    const expectedPieceCount = cuts.length + 1;

    // 步骤4：智能补偿算法
    // 如果实际片段数量少于预期的80%，启动补偿机制
    // 这种情况通常发生在复杂形状或高难度切割中
    if (splitPieces.length < expectedPieceCount * 0.8) {
      // 切割后片段数量少于预期的80%，尝试额外切割

      // 高难度切割次数(难度7-8)需要更多的尝试次数
      const isHighDifficulty = cutCount >= 7;
      const maxRetryCount = isHighDifficulty ? 5 : 3;
      let retryCount = 0;

      // 最多尝试几次切割
      while (splitPieces.length < expectedPieceCount * 0.9 && retryCount < maxRetryCount) {
        retryCount++;
        // 尝试第${retryCount}次额外切割

        // 计算形状的边界
        const xs = shape.map(p => p.x);
        const ys = shape.map(p => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        // 创建额外的切割线
        const diagonal = Math.sqrt(Math.pow(maxX - minX, 2) + Math.pow(maxY - minY, 2));
        const extraCuts: Array<{
          x1: number;
          y1: number;
          x2: number;
          y2: number;
          type: 'straight' | 'diagonal';
        }> = [];

        // 计算需要多少额外切割线
        const neededExtraCuts = Math.max(0, Math.min(Math.ceil(expectedPieceCount / 2), expectedPieceCount - splitPieces.length));

        // 需要额外添加${neededExtraCuts}条切割线

        // 生成额外切割线
        for (let i = 0; i < neededExtraCuts; i++) {
          let x1, y1, x2, y2;

          if (isHighDifficulty) {
            // 随机选择角度
            const angle = Math.random() * Math.PI;
            const offsetX = (Math.random() - 0.5) * (maxX - minX) * 0.3;
            const offsetY = (Math.random() - 0.5) * (maxY - minY) * 0.3;

            x1 = centerX + offsetX + Math.cos(angle) * diagonal * 0.8;
            y1 = centerY + offsetY + Math.sin(angle) * diagonal * 0.8;
            x2 = centerX + offsetX + Math.cos(angle + Math.PI) * diagonal * 0.8;
            y2 = centerY + offsetY + Math.sin(angle + Math.PI) * diagonal * 0.8;
          } else if (cutType === "straight") {
            // 随机选择水平或垂直线
            const isVertical = Math.random() < 0.5;
            x1 = isVertical ? centerX : minX - diagonal * 0.1;
            y1 = isVertical ? minY - diagonal * 0.1 : centerY;
            x2 = isVertical ? centerX : maxX + diagonal * 0.1;
            y2 = isVertical ? maxY + diagonal * 0.1 : centerY;
          } else {
            // 生成对角线
            const angle = Math.random() * Math.PI;
            x1 = centerX + Math.cos(angle) * diagonal;
            y1 = centerY + Math.sin(angle) * diagonal;
            x2 = centerX + Math.cos(angle + Math.PI) * diagonal;
            y2 = centerY + Math.sin(angle + Math.PI) * diagonal;
          }

          extraCuts.push({
            x1, y1, x2, y2,
            type: cutType
          });
        }

        // 使用额外的切割线重新切割
        if (extraCuts.length > 0) {
          // 使用${extraCuts.length}条额外切割线进行切割
          const additionalPieces = splitPolygon(shape, [...cuts, ...extraCuts]);

          if (additionalPieces.length > splitPieces.length) {
            // 额外切割成功: 从${splitPieces.length}增加到${additionalPieces.length}个片段
            splitPieces = additionalPieces;
          }
        }
      }
    }

    // 如果片段数量超过预期，只保留最大的几个片段
    if (splitPieces.length > expectedPieceCount) {
      // 切割后片段数量超过预期，将保留最大的片段

      // 按面积排序
      splitPieces.sort((a, b) => {
        const areaA = this.calculatePolygonArea(a);
        const areaB = this.calculatePolygonArea(b);
        return areaB - areaA;
      });

      splitPieces = splitPieces.slice(0, expectedPieceCount);
    }

    // 最终生成了${splitPieces.length}个拼图片段，预期${expectedPieceCount}个

    // 定义暖色调色板
    const colors = [
      "#FF9F40", "#FF6B6B", "#FFD166", "#F68E5F", "#FFB17A", "#FFE3C1",
      "#FFBB7C", "#FF8A5B", "#FF785A", "#F26419", "#E57373", "#FFCC80",
      "#F08080", "#FFB74D"
    ];

    // 打乱颜色数组
    for (let i = colors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [colors[i], colors[j]] = [colors[j], colors[i]];
    }

    // 创建拼图片段
    const pieces: PuzzlePiece[] = splitPieces.map((points, index) => {
      const center = this.calculateCenter(points);
      const assignedColor = colors[index % colors.length];

      return {
        id: index,
        points: [...points],
        originalPoints: JSON.parse(JSON.stringify(points)),
        rotation: 0,
        originalRotation: 0,
        x: center.x,
        y: center.y,
        originalX: center.x,
        originalY: center.y,
        isCompleted: false,
        color: assignedColor,
      };
    });

    // 创建原始位置记录
    const originalPositions = JSON.parse(JSON.stringify(pieces));

    return { pieces, originalPositions };
  }

  private static calculateCenter(points: Point[]): Point {
    return points.reduce(
      (acc, point) => ({
        x: acc.x + point.x / points.length,
        y: acc.y + point.y / points.length,
      }),
      { x: 0, y: 0 },
    );
  }

  // 计算多边形面积
  private static calculatePolygonArea(vertices: Point[]): number {
    let area = 0;
    const n = vertices.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += vertices[i].x * vertices[j].y;
      area -= vertices[j].x * vertices[i].y;
    }

    return Math.abs(area) / 2;
  }
}