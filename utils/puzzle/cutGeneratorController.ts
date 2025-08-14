import { Point } from "@/types/puzzleTypes";
import { CutLine, Bounds } from "./cutGeneratorTypes";
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
  generateCuts(shape: Point[], difficulty: number, type: "straight" | "diagonal"): CutLine[] {
    // 验证输入参数
    this.validateInputs(shape, difficulty, type);
    
    // 获取难度配置
    const settings = this.getDifficultySettings(difficulty);
    
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
      } else {
        // 只在无法生成切割线时输出警告
        console.warn(`⚠️ 无法生成第${i + 1}条切割线`);
        break;
      }
    }
    return cuts;
  }
  
  /**
   * 验证输入参数
   */
  private validateInputs(shape: Point[], difficulty: number, type: "straight" | "diagonal"): void {
    if (!shape || shape.length < 3) {
      throw new Error("形状必须至少包含3个点");
    }
    
    if (difficulty < 1 || difficulty > 8) {
      throw new Error("难度级别必须在1-8之间");
    }
    
    if (type !== "straight" && type !== "diagonal") {
      throw new Error("切割类型必须是 'straight' 或 'diagonal'");
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
    type: "straight" | "diagonal",
    strategy: CutGenerationStrategy
  ): CutLine | null {
    return strategy.generateCut(bounds, existingCuts, shape, type);
  }
  
}