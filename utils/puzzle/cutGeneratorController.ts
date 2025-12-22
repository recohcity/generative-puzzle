import { Point } from "@/types/puzzleTypes";
import { CutLine, Bounds, CutType } from "./cutGeneratorTypes";
import { DIFFICULTY_SETTINGS } from "./cutGeneratorConfig";
import {
  calculateBounds,
  doesCutIntersectShape,
  cutsAreTooClose
} from "./cutGeneratorGeometry";
import { CutStrategyFactory, CutGenerationStrategy } from "./cutGeneratorStrategies";

/**
 * 切割线生成控制器
 * 负责协调各个模块，实现主要的生成逻辑
 */

export class CutGeneratorController {

  /**
   * 生成切割线的主要方法
   */
  generateCuts(shape: Point[], difficulty: number, type: CutType): CutLine[] {
    // 验证输入参数
    this.validateInputs(shape, difficulty, type);

    // 获取难度配置
    const settings = this.getDifficultySettings(difficulty);

    // 🔧 调试：记录难度配置
    console.log(`[CutGeneratorController] 难度级别: ${difficulty}, 目标切割线数量: ${settings.targetCuts}`);

    // 计算边界
    const bounds = calculateBounds(shape);

    const cuts: CutLine[] = [];

    // 获取策略
    const strategy = CutStrategyFactory.createStrategy(difficulty);

    // 生成切割线
    for (let i = 0; i < settings.targetCuts; i++) {
      const cut = this.generateSingleCut(bounds, cuts, shape, type, strategy);

      if (cut) {
        cuts.push(cut);
        console.log(`[CutGeneratorController] 成功生成第${i + 1}条切割线`);
      } else {
        // 只在无法生成切割线时输出警告
        console.warn(`⚠️ 无法生成第${i + 1}条切割线`);
        break;
      }
    }

    console.log(`[CutGeneratorController] 总共生成了${cuts.length}条切割线`);
    return cuts;
  }

  /**
   * 验证输入参数
   */
  private validateInputs(shape: Point[], difficulty: number, type: CutType): void {
    if (!shape || shape.length < 3) {
      throw new Error("形状必须至少包含3个点");
    }

    if (difficulty < 1 || difficulty > 8) {
      throw new Error("难度级别必须在1-8之间");
    }

    if (type !== "straight" && type !== "diagonal" && type !== "curve" as any) {
      throw new Error("切割类型必须是 'straight', 'diagonal' 或 'curve'");
    }
  }

  /**
   * 获取难度配置
   */
  private getDifficultySettings(difficulty: number) {
    const settings = DIFFICULTY_SETTINGS[difficulty as keyof typeof DIFFICULTY_SETTINGS];
    if (!settings) {
      throw new Error(`不支持的难度级别: ${difficulty}`);
    }
    return settings;
  }

  /**
   * 生成单条切割线
   */
  private generateSingleCut(
    bounds: Bounds,
    existingCuts: CutLine[],
    shape: Point[],
    type: CutType,
    strategy: CutGenerationStrategy
  ): CutLine | null {
    // 尝试多次生成切割线
    const maxAttempts = 10;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const cut = strategy.generateCut(bounds, existingCuts, shape, type);

      if (!cut) continue;

      // 🔧 修复：对于高难度，更早地跳过距离验证以允许相交
      // 难度8有15条切割线，我们应该从第3条开始就允许相交
      const isHighDifficulty = existingCuts.length >= 2;

      if (isHighDifficulty) {
        // 高难度模式：只进行基本的形状相交验证
        if (this.basicValidation(cut, shape)) {
          return cut;
        }
      } else {
        // 低中难度：进行完整验证
        if (this.fullValidation(cut, shape, existingCuts)) {
          return cut;
        }
      }
    }

    return null;
  }

  private basicValidation(cut: CutLine, shape: Point[]): boolean {
    // 🔧 修复：放宽验证条件，允许更多切割线通过
    // 只检查是否与形状相交，不检查距离和交点数量
    const intersections = this.doesCutIntersectShape(cut, shape);
    console.log(`[basicValidation] 切割线交点数量: ${intersections}`);
    return intersections >= 1; // 降低到至少1个交点即可
  }

  private fullValidation(cut: CutLine, shape: Point[], existingCuts: CutLine[]): boolean {
    // 完整验证：形状相交 + 距离检查
    if (this.doesCutIntersectShape(cut, shape) < 2) {
      return false;
    }

    // 检查与现有切割线的距离
    for (const existingCut of existingCuts) {
      if (this.cutsAreTooClose(cut, existingCut)) {
        return false;
      }
    }

    return true;
  }

  // 简化的形状相交检测
  private doesCutIntersectShape(cut: CutLine, shape: Point[]): number {
    let intersections = 0;
    for (let i = 0; i < shape.length; i++) {
      const j = (i + 1) % shape.length;
      if (this.lineIntersection({ x: cut.x1, y: cut.y1 }, { x: cut.x2, y: cut.y2 }, shape[i], shape[j])) {
        intersections++;
      }
    }
    return intersections;
  }

  // 简化的距离检测
  private cutsAreTooClose(cut1: CutLine, cut2: CutLine): boolean {
    const minDistance = 15;
    const points = [
      { x: cut1.x1, y: cut1.y1 },
      { x: cut1.x2, y: cut1.y2 },
      { x: cut2.x1, y: cut2.y1 },
      { x: cut2.x2, y: cut2.y2 },
    ];

    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < minDistance) {
          return true;
        }
      }
    }
    return false;
  }

  // 简化的线段相交检测
  private lineIntersection(p1: Point, p2: Point, p3: Point, p4: Point): Point | null {
    const x1 = p1.x, y1 = p1.y, x2 = p2.x, y2 = p2.y;
    const x3 = p3.x, y3 = p3.y, x4 = p4.x, y4 = p4.y;

    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (denom === 0) return null;

    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

    if (ua < 0 || ua > 1 || ub < 0 || ub > 1) return null;

    return {
      x: x1 + ua * (x2 - x1),
      y: y1 + ua * (y2 - y1),
    };
  }

}