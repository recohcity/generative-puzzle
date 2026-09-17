import { CutType } from "@generative-puzzle/game-core"
import type { Point, PuzzlePiece } from "@generative-puzzle/game-core"
import { generateCuts, DIFFICULTY_SETTINGS } from "@/utils/puzzle/cutGenerators"
import { splitPolygon } from "@/utils/puzzle/puzzleUtils"
import { applyExtraCutsWithRetry, ensureMinPieces } from "@/utils/puzzle/puzzleCompensation"
import { NetworkCutter } from "@/utils/puzzle/graph/NetworkCutter"
import { MosaicGenerator } from "@/utils/puzzle/MosaicGenerator"
import { ConcavoConvexGenerator } from "@/utils/puzzle/ConcavoConvexGenerator"
import { IncrementalCutter } from "@/utils/puzzle/IncrementalCutter"
import { HexGenerator } from "@/utils/puzzle/HexGenerator"

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
   * @param cutType 切割类型（CutType 枚举：直线/斜线/放射式曲线/贯穿曲线/马赛克/凹凸）
   * @param cutCount 切割数量（直线/斜线为切割线数，增量架构下为切割刀数，决定拼图难度）
   * @param shapeType 形状类型（影响渲染方式）
   * @returns 包含拼图片段和原始位置的对象
   */
  static generatePuzzle(
    shape: Point[],
    cutType: CutType,
    cutCount: number,
    shapeType?: string,
  ): { pieces: PuzzlePiece[]; originalPositions: PuzzlePiece[]; cutSteps?: PuzzlePiece[][] } {

    let splitPieces: Point[][];
    let cutSteps: PuzzlePiece[][] | undefined;
    // 用于存储直线/斜线模式下的切割线，如果使用曲线模式则为空
    let usedCuts: any[] = [];

    // 🆕 马赛克碎裂模式：Voronoi 剖分引擎
    if (cutType === CutType.MosaicRandom) {
      console.log("[PuzzleGenerator] 使用马赛克碎裂生成器...");
      splitPieces = MosaicGenerator.generate(shape, cutCount, shapeType);
    // 🆕 凹凸咬合模式：马赛克碎裂 + 内部共享边替换贝塞尔曲边（切割后处理）
    } else if (cutType === CutType.ConcavoConvex) {
      console.log("[PuzzleGenerator] 使用凹凸咬合生成器（马赛克碎裂 + 曲边替换）...");
      splitPieces = ConcavoConvexGenerator.generate(shape, cutCount, shapeType);
    // 🆕 贯穿类模式（贯穿曲线/S弯/折线/嵌齿）：增量顺序切割（逐刀结构共享，消除飞边）
    // cutCount 为难度档位(1-8)，内部映射为目标刀数（修复：此前将档位直接当刀数，
    // 8 档仅 8 刀 → 9 片，与"16-30+"档位文案脱节）
    } else if (
      cutType === CutType.ThroughCurve ||
      cutType === CutType.SCurve ||
      cutType === CutType.Zigzag ||
      cutType === CutType.Jigsaw
    ) {
      const settings = DIFFICULTY_SETTINGS[cutCount as keyof typeof DIFFICULTY_SETTINGS] ?? DIFFICULTY_SETTINGS[1];
      const kindByCut: Record<string, "through" | "s-curve" | "zigzag" | "jigsaw"> = {
        [CutType.ThroughCurve]: "through",
        [CutType.SCurve]: "s-curve",
        [CutType.Zigzag]: "zigzag",
        [CutType.Jigsaw]: "jigsaw",
      };
      // 折线单 V 每刀只切一块（无交叉），低档位刀数少 → 碎片太少无拼图难度；最小 4 刀（5 片）起步
      let targetCuts = settings.targetCuts;
      if (cutType === CutType.Zigzag && targetCuts < 4) targetCuts = 4;
      const result = IncrementalCutter.generate(shape, targetCuts, 0.45, undefined, kindByCut[cutType]);
      result.log.forEach((l) => console.log(`[IncrementalCutter] ${l.text}`));
      splitPieces = result.pieces;
      // S弯/折线：逐刀步骤供游戏内一刀一刀切割动画（太极递进 / 统一角度逐刀呈现）
      if (cutType === CutType.SCurve || cutType === CutType.Zigzag) {
        cutSteps = result.steps.map((step) => this.toPuzzlePieces(step));
      }
    // 🆕 蜂巢六边形网格：蜂窝单元边集合 → 图网络面提取
    } else if (cutType === CutType.Hex) {
      console.log("[PuzzleGenerator] 使用六边形网格（蜂巢）生成器...");
      splitPieces = HexGenerator.generate(shape, cutCount);
    // 星形放射式曲线：图网络切割引擎（保留旧实现，模式更名自 curve）
    } else if (cutType === CutType.Radial) {
      console.log("[PuzzleGenerator] 使用图网络进行放射式曲线切割...");
      const result = NetworkCutter.generate(shape, cutCount, shapeType);
      splitPieces = result;
      // 放射式曲线模式下，cuts 概念不同，我们暂时不填充 usedCuts，跳过后续的补偿逻辑
    } else {
      // 步骤1：生成切割线
      // 根据形状边界、难度级别和切割类型生成优化的切割路径
      const cuts = generateCuts(shape, cutCount, cutType);
      usedCuts = cuts;

      // 步骤2：执行多边形分割
      // 使用线段相交检测算法将原始形状切割成独立的拼图片段
      splitPieces = splitPolygon(shape, cuts);

      // 🔧 调试：记录初始切割结果
      console.log(`[PuzzleGenerator] 初始切割结果: ${splitPieces.length}块拼图 (${cuts.length}条切割线)`);
    }

    // 步骤3：质量控制 - 验证切割效果
    // 我们接受切割产生的自然片段数量，不强制补偿到特定数量

    // 步骤4：智能补偿算法（仅在片段数量明显不足时启用）
    // 注意：只针对直线/斜线模式启用补偿，曲线模式由 NetworkCutter 内部保证质量
    // 补偿阈值：n 条有效切割线至少应产 n+1 片（全平行时），< 会放过"有线未生效"（如 3 线 3 片）
    if (usedCuts.length > 0 && splitPieces.length <= usedCuts.length) {
      splitPieces = applyExtraCutsWithRetry({
        shape,
        cuts: usedCuts,
        cutType,
        cutCount,
        splitPolygon,
        initialPieces: splitPieces,
      });
    }
    // v1.5.9：硬保障——随机补偿仍低于档位下限时，追加确定性贯穿线（直线/斜线专属）
    const pieceMin = DIFFICULTY_SETTINGS[cutCount as keyof typeof DIFFICULTY_SETTINGS]?.pieceRange?.min;
    if (pieceMin && usedCuts.length > 0 && splitPieces.length < pieceMin) {
      splitPieces = ensureMinPieces({
        shape,
        cuts: usedCuts,
        cutType,
        splitPolygon,
        pieces: splitPieces,
        minPieces: pieceMin,
      });
      console.log(`[PuzzleGenerator] 确定性贯穿线补偿后: ${splitPieces.length}个拼图片段`);
    }

    // 🔧 调试：记录最终切割结果
    console.log(`[PuzzleGenerator] 最终切割结果: ${splitPieces.length}个拼图片段`);

    // 定义暖色调色板
    const colors = [
      "#FF9F40", "#FF6B6B", "#FFD166", "#F68E5F", "#FFB17A", "#FFE3C1",
      "#FFBB7C", "#FF8A5B", "#FF785A", "#F26419", "#E57373", "#FFCC80",
      "#F08080", "#FFB74D"
    ];

    // 创建拼图片段（每步独立打乱颜色，中间态仅动画展示用）
    const pieces: PuzzlePiece[] = this.toPuzzlePieces(splitPieces, colors);

    // 创建原始位置记录
    const originalPositions = JSON.parse(JSON.stringify(pieces));

    return { pieces, originalPositions, cutSteps };
  }

  /** 原始点集 → PuzzlePiece[]（每步独立打乱暖色，供最终拼图与逐刀动画步骤共用） */
  private static readonly PALETTE = [
    "#FF9F40", "#FF6B6B", "#FFD166", "#F68E5F", "#FFB17A", "#FFE3C1",
    "#FFBB7C", "#FF8A5B", "#FF785A", "#F26419", "#E57373", "#FFCC80",
    "#F08080", "#FFB74D",
  ];
  private static toPuzzlePieces(splitPieces: Point[][], colors?: string[]): PuzzlePiece[] {
    const palette = [...(colors ?? PuzzleGenerator.PALETTE)];
    for (let i = palette.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [palette[i], palette[j]] = [palette[j], palette[i]];
    }
    return splitPieces.map((points, index) => {
      const center = this.calculateCenter(points);
      const assignedColor = palette[index % palette.length];
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