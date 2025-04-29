import type { CutType } from "@/types/types"
import { generateCuts } from "@/utils/puzzle/cutGenerators"
import { splitPolygon } from "@/utils/puzzle/puzzleUtils"

type Point = {
  x: number
  y: number
  isOriginal?: boolean
}

type PuzzlePiece = {
  points: Point[]
  originalPoints: Point[]
  rotation: number
  originalRotation: number
  x: number
  y: number
  originalX: number
  originalY: number
}

export class PuzzleGenerator {
  static generatePuzzle(
    shape: Point[],
    cutType: CutType,
    cutCount: number,
  ): { pieces: PuzzlePiece[]; originalPositions: PuzzlePiece[] } {
    // 生成切割线
    const cuts = generateCuts(shape, cutCount, cutType)

    // 拆分形状
    const splitPieces = splitPolygon(shape, cuts)

    // 创建拼图片段
    const pieces: PuzzlePiece[] = splitPieces.map((points) => {
      // 计算中心点
      const center = this.calculateCenter(points)

      return {
        points: [...points],
        originalPoints: JSON.parse(JSON.stringify(points)), // 深拷贝确保原始点不被修改
        rotation: 0,
        originalRotation: 0,
        x: center.x,
        y: center.y,
        originalX: center.x,
        originalY: center.y,
      }
    })

    // 创建原始位置记录 - 深拷贝确保不会被后续操作修改
    const originalPositions = JSON.parse(JSON.stringify(pieces))

    return { pieces, originalPositions }
  }

  private static calculateCenter(points: Point[]): Point {
    return points.reduce(
      (acc, point) => ({
        x: acc.x + point.x / points.length,
        y: acc.y + point.y / points.length,
      }),
      { x: 0, y: 0 },
    )
  }
}

