import { CutLine, Bounds } from "./cutGeneratorTypes";
import { Point } from "@/types/puzzleTypes";
import { 
  generateStraightCutLine, 
  generateDiagonalCutLine, 
  generateCenterCutLine 
} from "./cutGeneratorGeometry";

/**
 * 切割线生成策略模块
 * 实现不同难度级别的切割线生成策略
 */

// 抽象策略接口
export interface CutGenerationStrategy {
  generateCut(
    bounds: Bounds, 
    existingCuts: CutLine[], 
    shape: Point[], 
    type: "straight" | "diagonal"
  ): CutLine | null;
}

// 简单难度策略
export class SimpleCutStrategy implements CutGenerationStrategy {
  generateCut(bounds: Bounds, existingCuts: CutLine[], shape: Point[], type: "straight" | "diagonal"): CutLine | null {
    return generateCenterCutLine(shape, type === "straight", type);
  }
}

// 中等难度策略
export class MediumCutStrategy implements CutGenerationStrategy {
  generateCut(bounds: Bounds, existingCuts: CutLine[], shape: Point[], type: "straight" | "diagonal"): CutLine | null {
    const useCenterCut = Math.random() < 0.5;
    
    if (useCenterCut) {
      return generateCenterCutLine(shape, type === "straight", type);
    } else {
      return type === "straight" 
        ? generateStraightCutLine(bounds)
        : generateDiagonalCutLine(bounds);
    }
  }
}

// 高难度策略
export class HardCutStrategy implements CutGenerationStrategy {
  generateCut(bounds: Bounds, existingCuts: CutLine[], shape: Point[], type: "straight" | "diagonal"): CutLine | null {
    if (existingCuts.length > 0 && Math.random() < 0.3) {
      return this.generatePerpendicularCut(bounds, existingCuts, type);
    }
    
    return type === "straight" 
      ? generateStraightCutLine(bounds)
      : generateDiagonalCutLine(bounds);
  }
  
  private generatePerpendicularCut(bounds: Bounds, existingCuts: CutLine[], type: "straight" | "diagonal"): CutLine {
    const lastCut = existingCuts[existingCuts.length - 1];
    const lastAngle = Math.atan2(lastCut.y2 - lastCut.y1, lastCut.x2 - lastCut.x1);
    const perpendicularAngle = lastAngle + (Math.PI / 2) + (Math.random() * 0.3 - 0.15);
    
    const center = {
      x: (bounds.minX + bounds.maxX) / 2 + (Math.random() * 60 - 30),
      y: (bounds.minY + bounds.maxY) / 2 + (Math.random() * 60 - 30)
    };
    
    const extension = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) * 0.75;
    
    return {
      x1: center.x + Math.cos(perpendicularAngle) * extension,
      y1: center.y + Math.sin(perpendicularAngle) * extension,
      x2: center.x + Math.cos(perpendicularAngle + Math.PI) * extension,
      y2: center.y + Math.sin(perpendicularAngle + Math.PI) * extension,
      type: type
    };
  }
}

// 策略工厂
export class CutStrategyFactory {
  static createStrategy(difficulty: number): CutGenerationStrategy {
    if (difficulty <= 3) return new SimpleCutStrategy();
    if (difficulty <= 6) return new MediumCutStrategy();
    return new HardCutStrategy();
  }
}