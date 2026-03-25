import type { PuzzlePiece } from "@/types/puzzleTypes";
import { findPieceIndexAtCanvasPoint } from "@/hooks/puzzleInteractions/pieceHitTest";

function squarePiece(id: number, cx: number, cy: number, half = 40): PuzzlePiece {
  const pts = [
    { x: cx - half, y: cy - half },
    { x: cx + half, y: cy - half },
    { x: cx + half, y: cy + half },
    { x: cx - half, y: cy + half },
  ];
  return {
    id,
    points: pts.map((p) => ({ ...p })),
    originalPoints: pts.map((p) => ({ ...p })),
    rotation: 0,
    originalRotation: 0,
    x: 0,
    y: 0,
    originalX: 0,
    originalY: 0,
    isCompleted: false,
  };
}

describe("findPieceIndexAtCanvasPoint", () => {
  it("returns -1 for empty or null puzzle", () => {
    expect(findPieceIndexAtCanvasPoint(null, [], 10, 10, 20)).toBe(-1);
    expect(findPieceIndexAtCanvasPoint(undefined, [], 10, 10, 20)).toBe(-1);
    expect(findPieceIndexAtCanvasPoint([], [], 10, 10, 20)).toBe(-1);
  });

  it("skips completed pieces then falls through", () => {
    const puzzle = [squarePiece(0, 100, 100)];
    expect(findPieceIndexAtCanvasPoint(puzzle, [0], 100, 100, 20)).toBe(-1);
  });

  it("hits topmost piece by z-order (later index)", () => {
    const puzzle = [squarePiece(0, 100, 100, 50), squarePiece(1, 100, 100, 30)];
    // center overlaps; last in array should win
    expect(findPieceIndexAtCanvasPoint(puzzle, [], 100, 100, 20)).toBe(1);
  });

  it("uses loose radius when outside polygon but near center", () => {
    const puzzle = [squarePiece(0, 200, 200, 5)];
    // (215,200) outside small square but within looseHitRadius*2 of center if radius 20 -> 40px
    const idx = findPieceIndexAtCanvasPoint(puzzle, [], 230, 200, 20);
    expect(idx).toBe(0);
  });

  it("with negative loose radius only polygon hit counts", () => {
    const puzzle = [squarePiece(0, 200, 200, 5)];
    const idx = findPieceIndexAtCanvasPoint(puzzle, [], 230, 200, -1);
    expect(idx).toBe(-1);
  });
});
