import { Point } from "@/types/puzzleTypes";

/**
 * 切割线生成器类型定义
 */

export type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export type CutLine = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: "straight" | "diagonal" | "curve";
};

export type CutType = "straight" | "diagonal" | "curve";

export interface CutGenerationContext {
  bounds: Bounds;
  shape: Point[];
  existingCuts: CutLine[];
  difficulty: number;
  cutType: CutType;
  attempts: number;
}

export interface CutGenerationResult {
  cut: CutLine | null;
  success: boolean;
  attempts: number;
  strategy: string;
}

export interface CutGenerationStrategy {
  name: string;
  canHandle(context: CutGenerationContext): boolean;
  generateCut(context: CutGenerationContext): CutGenerationResult;
}

export interface CutValidator {
  validate(cut: CutLine, context: CutGenerationContext, relaxed?: boolean): boolean;
}

export interface GeometryUtils {
  calculateBounds(points: Point[]): Bounds;
  lineIntersection(p1: Point, p2: Point, p3: Point, p4: Point): Point | null;
  isPointNearLine(point: Point, line: CutLine, threshold: number): boolean;
  doesCutIntersectShape(cut: CutLine, shape: Point[]): number;
  cutsAreTooClose(cut1: CutLine, cut2: CutLine, minDistance: number): boolean;
}