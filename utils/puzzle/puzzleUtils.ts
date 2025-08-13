import { Point } from "@/types/puzzleTypes"

type CutLine = {
  x1: number
  y1: number
  x2: number
  y2: number
  type: "straight" | "diagonal"
}

// 线段相交检测
const lineIntersection = (p1: Point, p2: Point, p3: Point, p4: Point): Point | null => {
  const x1 = p1.x,
    y1 = p1.y,
    x2 = p2.x,
    y2 = p2.y
  const x3 = p3.x,
    y3 = p3.y,
    x4 = p4.x,
    y4 = p4.y

  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1)
  if (denom === 0) return null // 平行线

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom

  if (ua < 0 || ua > 1 || ub < 0 || ub > 1) return null // 交点不在线段上

  return {
    x: x1 + ua * (x2 - x1),
    y: y1 + ua * (y2 - y1),
  }
}

// 拆分多边形
export const splitPolygon = (shape: Point[], cuts: CutLine[]): Point[][] => {
  let pieces = [shape]
  
  // 最小片段面积 - 防止生成太小的片段，但对高难度调整为更低的阈值
  const isHighDifficulty = cuts.length >= 8; // 8条或更多切割线视为高难度
  // 高难度时使用更小的面积阈值，允许更多的小片段
  const minPieceAreaRatio = isHighDifficulty ? 0.02 : 0.05; 
  const originalArea = calculatePolygonArea(shape);
  const minPieceArea = originalArea * minPieceAreaRatio;
  
  // 目标片段数量 = 切割次数 + 1
  const targetPieceCount = cuts.length + 1;
  console.log(`切割目标: ${cuts.length}条切割线，预期${targetPieceCount}块拼图，最小面积比例: ${minPieceAreaRatio}`);
  
  // 切割操作计数
  let cutCount = 0;
  // 最大尝试次数，防止死循环
  const maxCutAttempts = cuts.length * 2;
  
  while (cutCount < cuts.length && pieces.length < targetPieceCount && cutCount < maxCutAttempts) {
    const cut = cuts[cutCount];
    const newPieces: Point[][] = [];
    let madeValidCut = false;
    
    // 如果已经达到或超过目标片段数量，停止切割
    if (pieces.length >= targetPieceCount) {
      console.log(`已达到目标片段数量(${targetPieceCount})，停止后续切割`);
      break;
    }
    
    // 找出最大的片段进行切割以增加成功率
    pieces.sort((a, b) => calculatePolygonArea(b) - calculatePolygonArea(a));
    
    // 尝试切割前四大片段，增加切割成功率
    const maxPiecesToTry = Math.min(4, pieces.length);
    
    for (let i = 0; i < maxPiecesToTry; i++) {
      const pieceToTry = pieces[i];
      const splitResult = splitPieceWithLine(pieceToTry, cut);
      
      // 过滤掉太小的片段
      const validSplitResults = splitResult.filter(piece => 
        calculatePolygonArea(piece) >= minPieceArea
      );
      
      // 如果有效的片段至少有2个，表示切割成功
      if (validSplitResults.length >= 2) {
        // 添加新切割出的片段
        newPieces.push(...validSplitResults);
        
        // 添加其他未尝试切割的片段
        newPieces.push(...pieces.slice(0, i).concat(pieces.slice(i + 1)));
        
        madeValidCut = true;
        console.log(`切割成功: 切割第${i+1}大片段，产生${validSplitResults.length}个新片段`);
        break;
      }
    }
    
    // 如果没有成功切割任何片段，保留所有原始片段并尝试下一条切割线
    if (!madeValidCut) {
      console.log(`切割线 ${cutCount + 1} 未能有效切割任何片段，尝试下一条切割线`);
      cutCount++;
      continue;
    }
    
    // 更新片段集合
    pieces = newPieces;
    console.log(`切割线 ${cutCount + 1} 后的片段数量: ${pieces.length}`);
    cutCount++;
    
    // 高难度时，如果片段已经足够多，可以提前结束
    if (isHighDifficulty && pieces.length >= targetPieceCount * 0.9) {
      console.log(`高难度模式已达到目标片段数量的90%，可以结束切割`);
      break;
    }
  }
  
  // 最终过滤，移除任何太小的片段或无效片段
  const finalPieces = pieces.filter((piece) => 
    piece.length >= 3 && calculatePolygonArea(piece) >= minPieceArea
  );
  
  console.log(`完成切割，最终片段数量: ${finalPieces.length}/${targetPieceCount}`);
  
  // 如果最终片段数量远少于目标，可以尝试再次随机切割
  if (finalPieces.length < targetPieceCount * 0.7 && isHighDifficulty) {
    console.log(`警告: 最终片段数量(${finalPieces.length})远少于目标(${targetPieceCount})，尝试添加额外切割`);
    // 这里可以添加额外的切割逻辑，或者返回原始片段，让外部处理
  }
  
  return finalPieces;
}

// 计算多边形面积（使用叉积法）
const calculatePolygonArea = (vertices: Point[]): number => {
  let area = 0;
  const n = vertices.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += vertices[i].x * vertices[j].y;
    area -= vertices[j].x * vertices[i].y;
  }
  
  return Math.abs(area) / 2;
}

// 使用直线拆分片段
export const splitPieceWithLine = (piece: Point[], cut: CutLine, recursionDepth: number = 0): Point[][] => {
  // 限制递归深度，防止无限递归
  if (recursionDepth > 2) {
    console.log(`达到最大递归深度，停止分割`);
    return [piece];
  }

  const intersections: { point: Point; index: number }[] = []

  for (let i = 0; i < piece.length; i++) {
    const j = (i + 1) % piece.length
    const intersection = lineIntersection({ x: cut.x1, y: cut.y1 }, { x: cut.x2, y: cut.y2 }, piece[i], piece[j])

    if (intersection) {
      // 添加一个非常小的偏移量，确保交点不会完全重合
      const offsetX = (Math.random() - 0.5) * 0.01;
      const offsetY = (Math.random() - 0.5) * 0.01;
      
      intersections.push({
        point: { 
          x: intersection.x + offsetX, 
          y: intersection.y + offsetY, 
          isOriginal: false // 切割产生的交点不是原始点，应该用直线连接
        },
        index: i,
      })
    }
  }

  // 如果恰好有两个交点，执行标准切割
  if (intersections.length === 2) {
    // 按索引排序交点
    intersections.sort((a, b) => a.index - b.index)
    const [int1, int2] = intersections

    // 创建两个新片段
    const piece1: Point[] = [...piece.slice(0, int1.index + 1), int1.point, int2.point, ...piece.slice(int2.index + 1)]
    const piece2: Point[] = [int1.point, ...piece.slice(int1.index + 1, int2.index + 1), int2.point]

    return [piece1, piece2]
  }
  
  // 处理没有恰好两个交点的情况
  console.log(`切割线交点数量: ${intersections.length}, 尝试调整切割线`);
  
  // 如果有多于两个交点，选择最远的两个
  if (intersections.length > 2) {
    // 找到最远的两个交点
    let maxDistance = 0;
    let point1 = 0, point2 = 1;
    
    for (let i = 0; i < intersections.length; i++) {
      for (let j = i + 1; j < intersections.length; j++) {
        const dist = Math.pow(intersections[i].point.x - intersections[j].point.x, 2) + 
                    Math.pow(intersections[i].point.y - intersections[j].point.y, 2);
        if (dist > maxDistance) {
          maxDistance = dist;
          point1 = i;
          point2 = j;
        }
      }
    }
    
    // 只保留这两个交点
    intersections.splice(0, intersections.length, intersections[point1], intersections[point2]);
    console.log(`选择了两个最远的交点`);
    
    // 重新按索引排序
    intersections.sort((a, b) => a.index - b.index);
    const [int1, int2] = intersections;
    
    // 创建两个新片段
    const piece1: Point[] = [...piece.slice(0, int1.index + 1), int1.point, int2.point, ...piece.slice(int2.index + 1)];
    const piece2: Point[] = [int1.point, ...piece.slice(int1.index + 1, int2.index + 1), int2.point];
    
    return [piece1, piece2];
  }
  
  // 如果没有足够的交点且递归深度允许，尝试一次新的切割
  if (intersections.length < 2 && recursionDepth < 1) {
    // 计算形状的中心和外接矩形
    const xs = piece.map(p => p.x);
    const ys = piece.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    // 根据切割类型创建新的切割线
    const width = maxX - minX;
    const height = maxY - minY;
    const diagonal = Math.sqrt(width * width + height * height);
    
    const newCut = { ...cut }; // 克隆原始切割
    
    if (cut.type === "straight") {
      // 对于直线类型，创建水平或垂直线
      const isVertical = Math.random() < 0.5;
      newCut.x1 = isVertical ? centerX : minX - width * 0.1;
      newCut.y1 = isVertical ? minY - height * 0.1 : centerY;
      newCut.x2 = isVertical ? centerX : maxX + width * 0.1;
      newCut.y2 = isVertical ? maxY + height * 0.1 : centerY;
    } else {
      // 对于斜线类型，创建对角线
      const angle = Math.random() * Math.PI;
      newCut.x1 = centerX + Math.cos(angle) * diagonal;
      newCut.y1 = centerY + Math.sin(angle) * diagonal;
      newCut.x2 = centerX + Math.cos(angle + Math.PI) * diagonal;
      newCut.y2 = centerY + Math.sin(angle + Math.PI) * diagonal;
    }
    
    // 递归调用，但增加递归深度
    return splitPieceWithLine(piece, newCut, recursionDepth + 1);
  }
  
  // 如果以上都失败，返回原始片段
  console.log(`无法有效切割，返回原始片段`);
  return [piece];
}

// 检查拼图片段是否有效
export const isValidPiece = (piece: Point[]): boolean => {
  return piece.length >= 3
}

// 检查两个矩形是否重叠
export const checkRectOverlap = (rect1: { x: number, y: number, width: number, height: number }, rect2: { x: number, y: number, width: number, height: number }): boolean => {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
};

/**
 * 计算两条线段的交点
 */
export function findLineIntersections(
  line1: { start: Point; end: Point },
  line2: { start: Point; end: Point }
): Point[] {
  const { start: p1, end: p2 } = line1;
  const { start: p3, end: p4 } = line2;

  const denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
  
  // 平行线
  if (Math.abs(denom) < 1e-10) {
    return [];
  }

  const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denom;
  const u = -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / denom;

  // 检查交点是否在两条线段上
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return [{
      x: p1.x + t * (p2.x - p1.x),
      y: p1.y + t * (p2.y - p1.y)
    }];
  }

  return [];
}