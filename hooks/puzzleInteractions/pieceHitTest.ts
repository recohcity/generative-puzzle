import type { PuzzlePiece } from "@/types/puzzleTypes";
import { calculateCenter, isPointInPolygon, rotatePoint } from "@/utils/geometry/puzzleGeometry";

/**
 * 画布逻辑坐标系下的命中检测（多边形优先，再中心距离容差）。
 * 阶段1内聚版：供交互 hooks 复用，后续阶段2再迁入 `game-engine/`。
 *
 * looseHitRadius：鼠标路径典型 20，触摸路径典型 30；若为负数则只做多边形命中（与双指中心选块一致）。
 */
export function findPieceIndexAtCanvasPoint(
  puzzle: PuzzlePiece[] | null | undefined,
  completedPieces: number[],
  x: number,
  y: number,
  looseHitRadius: number,
): number {
  if (!puzzle?.length) return -1;

  for (let i = puzzle.length - 1; i >= 0; i--) {
    if (completedPieces.includes(i)) continue;
    const piece = puzzle[i];
    const center = calculateCenter(piece.points);
    const rotationAngle = -piece.rotation;
    const rotatedPoint = rotatePoint(x, y, center.x, center.y, rotationAngle);
    if (isPointInPolygon(rotatedPoint.x, rotatedPoint.y, piece.points)) {
      return i;
    }
  }

  if (looseHitRadius < 0) return -1;

  for (let i = puzzle.length - 1; i >= 0; i--) {
    if (completedPieces.includes(i)) continue;
    const piece = puzzle[i];
    const center = calculateCenter(piece.points);
    const dx = center.x - x;
    const dy = center.y - y;
    if (Math.sqrt(dx * dx + dy * dy) < looseHitRadius * 2) {
      return i;
    }
  }

  return -1;
}
