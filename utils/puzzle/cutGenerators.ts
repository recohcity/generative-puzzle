/**
 * 切割线生成器（直线/斜线族）
 *
 * 模块化架构：配置在 cutGeneratorConfig、策略在 cutGeneratorStrategies、
 * 专用几何在 cutGeneratorGeometry、校验在 cutGeneratorValidator。
 * 增量族（曲线/S弯/折线/嵌齿）见 IncrementalCutter，两族入口见 SKILL.md。
 */

import { Point, CutType } from "@generative-puzzle/game-core";
import { 
  CUT_GENERATOR_CONFIG, 
  DIFFICULTY_SETTINGS,
  MAX_ATTEMPTS,
  EARLY_EXIT_THRESHOLD 
} from "./cutGeneratorConfig";
import { 
  CutLine, 
  Bounds, 
  CutGenerationStrategy
} from "./cutGeneratorTypes";
import { 
  calculateBounds,
  generateStraightCutLine,
  generateDiagonalCutLine,
  generateCenterCutLine,
  generateForcedCutLine
} from "./cutGeneratorGeometry";
import { CutValidator } from "./cutGeneratorValidator";
import { CutStrategyFactory } from "./cutGeneratorStrategies";
import { CutGeneratorController } from "./cutGeneratorController";

/**
 * 主要的切割线生成函数
 * 
 * @param shape - 形状的点数组
 * @param difficulty - 难度级别 (1-8)
 * @param type - 切割类型 ("straight" | "diagonal")
 * @returns 生成的切割线数组
 */
export const generateCuts = (
  shape: Point[], 
  difficulty: number, 
  type: CutType
): CutLine[] => {
  // 输入验证
  if (!shape || shape.length < 3) {
    throw new Error("形状必须至少包含3个点");
  }
  
  if (difficulty < 1 || difficulty > 8) {
    throw new Error(`难度级别必须在1-8之间，当前值: ${difficulty}`);
  }
  
  if (type !== "straight" && type !== "diagonal") {
    throw new Error(`切割类型必须是 "straight" 或 "diagonal"，当前值: ${type}`);
  }
  
  // 使用控制器生成切割线
  const controller = new CutGeneratorController();
  return controller.generateCuts(shape, difficulty, type);
};

// 导出类型和配置供外部使用
export type { CutLine, Bounds, CutGenerationStrategy };
export { DIFFICULTY_SETTINGS, CUT_GENERATOR_CONFIG };

// 导出工具函数供测试使用
export {
  calculateBounds,
  generateStraightCutLine,
  generateDiagonalCutLine,
  generateCenterCutLine,
  generateForcedCutLine
} from "./cutGeneratorGeometry";

export { CutValidator } from "./cutGeneratorValidator";
export { CutStrategyFactory } from "./cutGeneratorStrategies";
export { CutGeneratorController } from "./cutGeneratorController";