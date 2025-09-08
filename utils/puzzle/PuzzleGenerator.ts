import type { Point, PuzzlePiece } from "@/types/puzzleTypes"
import { generateCuts } from "@/utils/puzzle/cutGenerators"
import { splitPolygon } from "@/utils/puzzle/puzzleUtils"
import { applyExtraCutsWithRetry } from "@/utils/puzzle/puzzleCompensation"

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
    
    // 🔧 调试：记录初始切割结果
    console.log(`[PuzzleGenerator] 初始切割结果: ${splitPieces.length}块拼图 (${cuts.length}条切割线)`);

    // 步骤3：质量控制 - 验证切割效果
    // 重要修正：N条切割线可能产生N+1, N+2, N+3...个拼图片段
    // 这取决于切割线的相交方式，不是固定的N+1
    // 我们接受切割产生的自然片段数量，不强制补偿到特定数量
    
    // 步骤4：智能补偿算法（仅在片段数量明显不足时启用）
    if (splitPieces.length < cuts.length) {
      splitPieces = applyExtraCutsWithRetry({
        shape,
        cuts,
        cutType,
        cutCount,
        splitPolygon,
        initialPieces: splitPieces,
      });
    }

    // 移除基于固定预期数量的片段限制逻辑
    // 接受切割产生的自然片段数量，这才是正确的做法
    // N条切割线可能产生N+1, N+2, N+3...个片段，这是正常的

    // 🔧 调试：记录最终切割结果
    console.log(`[PuzzleGenerator] 最终切割结果: ${splitPieces.length}个拼图片段 (${cuts.length}条切割线)`);

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