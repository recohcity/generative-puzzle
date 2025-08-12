/**
 * 简化的拼图生成器
 * 基于成功实现的最小化版本
 */

import type { Point, PuzzlePiece } from "@/types/puzzleTypes";
import { generateCuts } from "./cutGenerators";
import { splitPolygon } from "./puzzleUtils";

/**
 * 生成简单的拼图
 */
export function generateSimplePuzzle(
  shape: Point[],
  cutType: "straight" | "diagonal",
  cutCount: number
): { pieces: PuzzlePiece[]; originalPositions: PuzzlePiece[] } {
  
  // 生成切割线
  const cuts = generateCuts(shape, cutCount, cutType);
  
  // 切割形状
  const pieces = splitPolygon(shape, cuts);
  
  // 转换为PuzzlePiece格式
  const puzzlePieces: PuzzlePiece[] = pieces.map((piece, index) => ({
    id: index,
    points: piece,
    originalPoints: [...piece],
    rotation: 0,
    originalRotation: 0,
    x: 0,
    y: 0,
    originalX: 0,
    originalY: 0,
    isCompleted: false,
    color: `hsl(${index * 60}, 70%, 60%)`
  }));
  
  return {
    pieces: puzzlePieces,
    originalPositions: [...puzzlePieces]
  };
}