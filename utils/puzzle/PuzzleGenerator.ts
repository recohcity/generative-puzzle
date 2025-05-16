import { CutType } from "@/types/types"
import type { Point } from "@/types/types"
import { generateCuts } from "@/utils/puzzle/cutGenerators"
import { splitPolygon } from "@/utils/puzzle/puzzleUtils"

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
    console.log(`生成拼图，切割类型: ${cutType}，切割次数: ${cutCount}`);
    
    // 生成切割线，确保类型正确
    const cutTypeString = cutType === CutType.Straight ? "straight" : "diagonal";
    const cuts = generateCuts(shape, cutCount, cutTypeString as "straight" | "diagonal");
    
    console.log(`生成了${cuts.length}条切割线，目标切割次数: ${cutCount}`);
    console.log(`切割类型: ${cutTypeString}`);
    
    // 记录每条切割线的类型
    cuts.forEach((cut, index) => {
      console.log(`切割线 ${index + 1} 类型: ${cut.type}`);
    });

    // 拆分形状 - 确保只得到预期数量的片段
    let splitPieces = splitPolygon(shape, cuts);
    
    // 计算期望的拼图数量（切割线数量+1）
    const expectedPieceCount = cuts.length + 1;
    
    // 确保切割有效：如果没有足够的片段，尝试强制切割
    if (splitPieces.length < expectedPieceCount * 0.8) { // 允许20%的差异
      console.log(`切割后片段数量(${splitPieces.length})少于预期(${expectedPieceCount})的80%，尝试额外切割`);
      
      // 高难度切割次数(难度7-8)需要更多的尝试次数
      const isHighDifficulty = cutCount >= 7;
      const maxRetryCount = isHighDifficulty ? 5 : 3;
      let retryCount = 0;
      
      // 最多尝试几次切割
      while (splitPieces.length < expectedPieceCount * 0.9 && retryCount < maxRetryCount) {
        retryCount++;
        console.log(`尝试第${retryCount}次额外切割...`);
        
        // 计算形状的边界
        const xs = shape.map(p => p.x);
        const ys = shape.map(p => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        
        // 创建额外的切割线，确保类型一致
        const diagonal = Math.sqrt(Math.pow(maxX - minX, 2) + Math.pow(maxY - minY, 2));
        const extraCuts: CutLine[] = [];
        
        // 计算需要多少额外切割线 - 至少1条，最多目标的一半
        const neededExtraCuts = Math.max(1, Math.min(Math.ceil(expectedPieceCount / 2), expectedPieceCount - splitPieces.length));
        
        console.log(`需要额外添加${neededExtraCuts}条切割线`);
        
        for (let i = 0; i < neededExtraCuts; i++) {
          let x1, y1, x2, y2;
          
          // 高难度使用更随机的切割线
          if (isHighDifficulty) {
            // 随机选择角度，不仅限于垂直水平
            const angle = Math.random() * Math.PI;
            const offsetX = (Math.random() - 0.5) * (maxX - minX) * 0.3; // 中心点随机偏移
            const offsetY = (Math.random() - 0.5) * (maxY - minY) * 0.3;
            
            x1 = centerX + offsetX + Math.cos(angle) * diagonal * 0.8;
            y1 = centerY + offsetY + Math.sin(angle) * diagonal * 0.8;
            x2 = centerX + offsetX + Math.cos(angle + Math.PI) * diagonal * 0.8;
            y2 = centerY + offsetY + Math.sin(angle + Math.PI) * diagonal * 0.8;
          }
          else if (cutTypeString === "straight") {
            // 随机选择水平或垂直线
            const isVertical = Math.random() < 0.5;
            x1 = isVertical ? centerX : minX - diagonal * 0.1;
            y1 = isVertical ? minY - diagonal * 0.1 : centerY;
            x2 = isVertical ? centerX : maxX + diagonal * 0.1;
            y2 = isVertical ? maxY + diagonal * 0.1 : centerY;
          } else {
            // 生成对角线
            const angle = Math.random() * Math.PI; // 随机角度
            x1 = centerX + Math.cos(angle) * diagonal;
            y1 = centerY + Math.sin(angle) * diagonal;
            x2 = centerX + Math.cos(angle + Math.PI) * diagonal;
            y2 = centerY + Math.sin(angle + Math.PI) * diagonal;
          }
          
          extraCuts.push({
            x1, y1, x2, y2,
            type: cutTypeString as "straight" | "diagonal"
          });
        }
        
        // 使用额外的切割线重新切割
        if (extraCuts.length > 0) {
          console.log(`使用${extraCuts.length}条额外切割线进行切割`);
          const additionalPieces = splitPolygon(shape, [...cuts, ...extraCuts]);
          
          // 如果额外切割产生更多片段，则使用它们
          if (additionalPieces.length > splitPieces.length) {
            console.log(`额外切割成功: 从${splitPieces.length}增加到${additionalPieces.length}个片段`);
            splitPieces = additionalPieces;
          } else {
            console.log(`额外切割未增加片段数量，保持原始结果`);
          }
        }
      }
    }
    
    // 如果片段数量超过预期，只保留最大的几个片段
    if (splitPieces.length > expectedPieceCount) {
      console.log(`切割后片段数量(${splitPieces.length})超过预期(${expectedPieceCount})，将保留最大的片段`);
      
      // 按面积排序
      splitPieces.sort((a, b) => {
        const areaA = this.calculatePolygonArea(a);
        const areaB = this.calculatePolygonArea(b);
        return areaB - areaA; // 从大到小排序
      });
      
      // 只保留预期数量的片段
      splitPieces = splitPieces.slice(0, expectedPieceCount);
    }
    
    console.log(`最终生成了${splitPieces.length}个拼图片段，预期${expectedPieceCount}个`);

    // 如果最终片段数量严重不足，返回警告信息
    if (splitPieces.length < expectedPieceCount * 0.7) {
      console.warn(`⚠️ 警告：最终拼图数量(${splitPieces.length})远少于预期(${expectedPieceCount})！`);
    }

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
  
  // 计算多边形面积
  private static calculatePolygonArea(vertices: Point[]): number {
    let area = 0;
    const n = vertices.length;
    
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += vertices[i].x * vertices[j].y;
      area -= vertices[j].x * vertices[i].y;
    }
    
    return Math.abs(area) / 2;
  }
}

