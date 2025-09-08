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

// 中等难度策略 - 增加相交概率
export class MediumCutStrategy implements CutGenerationStrategy {
  generateCut(bounds: Bounds, existingCuts: CutLine[], shape: Point[], type: "straight" | "diagonal"): CutLine | null {
    // 🔧 修复：中等难度增加相交概率，确保更多随机性
    if (existingCuts.length > 1 && Math.random() < 0.7) { // 从50%提升到70%
      return this.generateSlightlyIntersectingCut(bounds, existingCuts, type);
    }
    
    const useCenterCut = Math.random() < 0.3; // 降低中心切割概率，增加随机性
    
    if (useCenterCut) {
      return generateCenterCutLine(shape, type === "straight", type);
    } else {
      return type === "straight" 
        ? generateStraightCutLine(bounds)
        : generateDiagonalCutLine(bounds);
    }
  }
  
  private generateSlightlyIntersectingCut(bounds: Bounds, existingCuts: CutLine[], type: "straight" | "diagonal"): CutLine {
    // 选择一条现有的切割线
    const referenceCut = existingCuts[Math.floor(Math.random() * existingCuts.length)];
    
    // 计算参考切割线的角度
    const refAngle = Math.atan2(referenceCut.y2 - referenceCut.y1, referenceCut.x2 - referenceCut.x1);
    
    // 生成一个与参考线有一定角度的切割线（45-135度之间）
    const intersectAngle = refAngle + (Math.PI / 4) + (Math.random() * (Math.PI / 2));
    
    // 选择一个中心点
    const center = {
      x: (bounds.minX + bounds.maxX) / 2 + (Math.random() * 80 - 40),
      y: (bounds.minY + bounds.maxY) / 2 + (Math.random() * 80 - 40)
    };
    
    const extension = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) * 0.75;
    
    return {
      x1: center.x + Math.cos(intersectAngle) * extension,
      y1: center.y + Math.sin(intersectAngle) * extension,
      x2: center.x + Math.cos(intersectAngle + Math.PI) * extension,
      y2: center.y + Math.sin(intersectAngle + Math.PI) * extension,
      type: type
    };
  }
}

// 高难度策略 - 强制切割线相交以产生更多片段
export class HardCutStrategy implements CutGenerationStrategy {
  generateCut(bounds: Bounds, existingCuts: CutLine[], shape: Point[], type: "straight" | "diagonal"): CutLine | null {
    // 🔧 修复：高难度策略强制让切割线相交以产生随机数量的片段
    if (existingCuts.length > 0) {
      // 高难度：100%概率尝试相交切割，确保随机性
      return this.generateIntersectingCut(bounds, existingCuts, type);
    }
    
    // 第一条切割线：随机生成
    return type === "straight" 
      ? generateStraightCutLine(bounds)
      : generateDiagonalCutLine(bounds);
  }
  
  private generateIntersectingCut(bounds: Bounds, existingCuts: CutLine[], type: "straight" | "diagonal"): CutLine {
    // 🔧 修复：改进相交切割生成，确保产生更多随机性
    
    // 选择多条现有切割线作为参考，增加随机性
    const numReferences = Math.min(3, existingCuts.length);
    const referenceCuts = existingCuts
      .sort(() => Math.random() - 0.5) // 随机排序
      .slice(0, numReferences);
    
    // 计算所有参考切割线的平均中点
    let avgMidX = 0, avgMidY = 0;
    for (const cut of referenceCuts) {
      avgMidX += (cut.x1 + cut.x2) / 2;
      avgMidY += (cut.y1 + cut.y2) / 2;
    }
    avgMidX /= referenceCuts.length;
    avgMidY /= referenceCuts.length;
    
    // 计算所有参考切割线的平均角度
    let avgAngle = 0;
    for (const cut of referenceCuts) {
      avgAngle += Math.atan2(cut.y2 - cut.y1, cut.x2 - cut.x1);
    }
    avgAngle /= referenceCuts.length;
    
    // 🔧 关键修复：生成与参考线垂直或大角度相交的切割线
    // 这样可以确保切割线相交，产生更多片段
    const perpendicularAngle = avgAngle + Math.PI / 2; // 垂直角度
    const randomOffset = (Math.random() - 0.5) * Math.PI / 3; // ±30度随机偏移
    const intersectAngle = perpendicularAngle + randomOffset;
    
    // 在参考线中点附近生成新切割线，确保相交
    const center = {
      x: avgMidX + (Math.random() * 40 - 20), // 增加偏移范围
      y: avgMidY + (Math.random() * 40 - 20)
    };
    
    const extension = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) * 1.2; // 增加长度确保覆盖
    
    return {
      x1: center.x + Math.cos(intersectAngle) * extension,
      y1: center.y + Math.sin(intersectAngle) * extension,
      x2: center.x + Math.cos(intersectAngle + Math.PI) * extension,
      y2: center.y + Math.sin(intersectAngle + Math.PI) * extension,
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