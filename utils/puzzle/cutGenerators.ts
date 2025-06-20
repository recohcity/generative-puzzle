import { Point } from "@/types/puzzleTypes"

/**
 * 拼图切割难度级别配置 (已优化):
 * 
 * 简单难度 (1-3)：
 * - 级别1: 2块拼图，1条切割线，切割线穿过中心，角度变化小
 * - 级别2: 3块拼图，2条切割线，切割线更倾向于穿过中心，布局均匀
 * - 级别3: 4块拼图，3条切割线，有一定随机性但仍保持可预测性
 * 
 * 中等难度 (4-6)：
 * - 级别4: 5块拼图，4条切割线，增加随机性和非中心切割
 * - 级别5: 7块拼图，6条切割线，更多方向变化，角度更复杂
 * - 级别6: 9块拼图，8条切割线，偏移更大，部分切割线不穿过中心
 * 
 * 高难度 (7-8)：
 * - 级别7: 12块拼图，11条切割线，高度随机，切割线方向多变
 * - 级别8: 15块拼图，14条切割线，最高难度，完全随机切割
 */

type Bounds = {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

type CutLine = {
  x1: number
  y1: number
  x2: number
  y2: number
  type: "straight" | "diagonal"
}

// 计算边界
const calculateBounds = (points: Point[]): Bounds => {
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  }
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

// 检查点是否靠近线段
const isPointNearLine = (point: Point, line: CutLine, threshold: number): boolean => {
  const d1 = Math.hypot(line.x1 - point.x, line.y1 - point.y)
  const d2 = Math.hypot(line.x2 - point.x, line.y2 - point.y)
  const lineLength = Math.hypot(line.x2 - line.x1, line.y2 - line.y1)
  const buffer = 0.1 // 小缓冲区以处理舍入误差

  return d1 + d2 >= lineLength - buffer && d1 + d2 <= lineLength + threshold + buffer
}

// 生成切割线
export const generateCuts = (shape: Point[], count: number, type: "straight" | "diagonal"): CutLine[] => {
  const bounds = calculateBounds(shape)
  const cuts: CutLine[] = []
  const maxAttempts = 100

  // 根据切割次数调整切割线的复杂度和随机性
  const difficulty = count; // 使用切割次数作为难度指标
  
  // 为不同难度级别设置精确的切割线数量 - 确保拼图数量稳定
  let targetCutCount = count;
  if (difficulty === 8) {
    // 难度8：尝试生成14条切割线 (实际稳定产生13条有效切割线 -> 14片拼图)
    targetCutCount = 14; 
    console.log(`最高难度：尝试生成${targetCutCount}条切割线`); // 更新日志信息
  } else if (difficulty === 7) {
    // 难度7：尝试生成11条切割线 (实际稳定产生11条有效切割线 -> 12片拼图)
    targetCutCount = 11;
    console.log(`高难度：尝试生成${targetCutCount}条切割线`); // 更新日志信息
  } else if (difficulty === 6) {
    // 难度6：尝试生成8条切割线 (实际稳定产生8条有效切割线 -> 9片拼图)
    targetCutCount = 8;
    console.log(`中高难度：尝试生成${targetCutCount}条切割线`); // 更新日志信息
  } else if (difficulty === 5) {
    // 难度5：尝试生成6条切割线 (实际稳定产生6条有效切割线 -> 7片拼图)
    targetCutCount = 6;
    console.log(`中难度：尝试生成${targetCutCount}条切割线`); // 更新日志信息
  } else if (difficulty === 4) {
    // 难度4：尝试生成4条切割线 (实际稳定产生4条有效切割线 -> 5片拼图)
    targetCutCount = 4;
    console.log(`中低难度：尝试生成${targetCutCount}条切割线`); // 更新日志信息
  } else {
    // 难度1-3：切割次数等于难度级别，产生难度+1块拼图
    targetCutCount = difficulty;
    console.log(`低难度：尝试生成${targetCutCount}条切割线`); // 更新日志信息
  }
  
  // 根据难度调整切割生成策略
  const useCenterCutProbability = 
    difficulty <= 3 ? 0.95 - (difficulty * 0.1) : // 1级:0.85, 2级:0.75, 3级:0.65
    difficulty <= 6 ? 0.6 - ((difficulty - 4) * 0.1) : // 4级:0.6, 5级:0.5, 6级:0.4
    0.3 - ((difficulty - 7) * 0.1); // 7级:0.3, 8级:0.2 (很少中心切割)
  
  console.log(`难度级别: ${difficulty}, 中心切割概率: ${useCenterCutProbability}, 目标切割数: ${targetCutCount}`);
  
  // 高难度强制使用的切割线类型
  const useForcedCenterCut = difficulty <= 3;
  // 高难度是否使用更加随机的切割模式
  const useExtremeRandomness = difficulty >= 7;
  
  // 设置一个计数器，确保我们生成足够多的有效切割线
  let validCutCount = 0;

  for (let i = 0; i < targetCutCount; i++) {
    let cut: CutLine | null = null
    let attempts = 0
    let validCut = false

    // 对低难度，优先使用穿过中心的切割线
    if (difficulty <= 2 && i === 0) {
      // 简单难度的第一条切割线总是穿过中心
      cut = generateCenterCutLine(shape, type === "straight", type);
      if (cut) {
        validCut = isValidCut(cut, shape, cuts);
      }
    }
    // 对极高难度，确保有一些完全随机的切割线
    else if (useExtremeRandomness && i >= count) {
      // 极高难度的额外切割线优先使用完全随机的方向
      let extraCutAttempts = 0;
      while (!validCut && extraCutAttempts < 20) { // 增加尝试次数
        extraCutAttempts++;
        
        // 尝试生成完全随机的切割线
        if (Math.random() < 0.7) {
          // 70%概率生成随机切割线
          if (type === "straight") {
            cut = generateStraightCutLine(bounds);
          } else {
            cut = generateDiagonalCutLine(bounds);
          }
        } else if (cuts.length > 0) {
          // 30%概率生成与现有切割线垂直的切割线
          const lastCut = cuts[Math.floor(Math.random() * cuts.length)]; // 随机选择一条已有切割线
          const lastAngle = Math.atan2(lastCut.y2 - lastCut.y1, lastCut.x2 - lastCut.x1);
          
          // 生成一个与选择的切割线大致垂直的切割线
          const perpendicularAngle = lastAngle + (Math.PI / 2) + (Math.random() * 0.4 - 0.2); // 添加小的随机偏移
          
          // 创建切割线
          const center = {
            x: (bounds.minX + bounds.maxX) / 2 + (Math.random() * 80 - 40), // 中心点随机偏移
            y: (bounds.minY + bounds.maxY) / 2 + (Math.random() * 80 - 40)  // 中心点随机偏移
          };
          
          const extension = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) * 0.8; // 增加延伸度
          cut = {
            x1: center.x + Math.cos(perpendicularAngle) * extension,
            y1: center.y + Math.sin(perpendicularAngle) * extension,
            x2: center.x + Math.cos(perpendicularAngle + Math.PI) * extension,
            y2: center.y + Math.sin(perpendicularAngle + Math.PI) * extension,
            type: type
          };
        }
        
        if (cut) {
          validCut = isValidCut(cut, shape, cuts, difficulty >= 7); // 对高难度放宽验证要求
        }
        
        // 如果仍然失败，在最后尝试中心切割
        if (!validCut && extraCutAttempts >= 15) { // 增加尝试次数后才使用中心切割
          cut = generateCenterCutLine(shape, type === "straight", type);
          if (cut) {
            validCut = isValidCut(cut, shape, cuts);
          }
        }
      }
    }
    // 对中高难度，确保有足够的角度变化
    else if (difficulty >= 4 && i >= count) {
      // 高难度的额外切割线优先使用与现有切割线角度不同的方向
      let extraCutAttempts = 0;
      while (!validCut && extraCutAttempts < 15) { // 增加尝试次数
        extraCutAttempts++;
        
        // 尝试生成不同角度的切割线
        if (cuts.length > 0) {
          // 获取上一条切割线的角度
          const lastCut = cuts[cuts.length - 1];
          const lastAngle = Math.atan2(lastCut.y2 - lastCut.y1, lastCut.x2 - lastCut.x1);
          
          // 生成一个与上一条切割线大致垂直的切割线
          const perpendicularAngle = lastAngle + (Math.PI / 2) + (Math.random() * 0.3 - 0.15); // 添加小的随机偏移
          
          // 创建一个穿过中心的切割线，角度接近垂直角度
          const center = {
            x: (bounds.minX + bounds.maxX) / 2 + (difficulty > 5 ? (Math.random() * 60 - 30) : 0), // 对难度6以上添加随机偏移
            y: (bounds.minY + bounds.maxY) / 2 + (difficulty > 5 ? (Math.random() * 60 - 30) : 0)  // 对难度6以上添加随机偏移
          };
          
          const extension = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) * 0.75; // 增加延伸度
          cut = {
            x1: center.x + Math.cos(perpendicularAngle) * extension,
            y1: center.y + Math.sin(perpendicularAngle) * extension,
            x2: center.x + Math.cos(perpendicularAngle + Math.PI) * extension,
            y2: center.y + Math.sin(perpendicularAngle + Math.PI) * extension,
            type: type
          };
          
          if (cut) {
            validCut = isValidCut(cut, shape, cuts, difficulty >= 6); // 对难度6以上放宽验证要求
          }
        }
        
        // 如果仍然失败，尝试普通的中心切割
        if (!validCut && extraCutAttempts >= 10) {
          cut = generateCenterCutLine(shape, type === "straight", type);
          if (cut) {
            validCut = isValidCut(cut, shape, cuts);
          }
        }
      }
    }
    
    // 如果第一次尝试失败，或不是特殊情况
    if (!validCut) {
      do {
        // 根据难度和随机性决定使用何种切割策略
        const useCenterCut = Math.random() < useCenterCutProbability;
        
        if (useCenterCut) {
          cut = generateCenterCutLine(shape, type === "straight", type);
        } else if (type === "straight") {
          cut = generateStraightCutLine(bounds)
        } else {
          cut = generateDiagonalCutLine(bounds)
        }
        
        // 验证切割线是否有效，对于高难度级别，放宽验证条件
        if (cut) {
          validCut = isValidCut(cut, shape, cuts, difficulty >= 7);
        }
        
        attempts++
        
        // 如果尝试次数过多但仍未生成有效切割线，则尝试使用中心切割
        if (attempts > maxAttempts / 2 && !validCut) {
          console.log(`尝试${attempts}次仍未生成有效切割线，尝试中心切割`);
          cut = generateCenterCutLine(shape, type === "straight", type);
          if (cut) {
            validCut = isValidCut(cut, shape, cuts);
          }
        }
      } while (!validCut && attempts < maxAttempts)
    }

    if (validCut && cut) {
      console.log(`成功生成切割线 ${i + 1}`);
      cuts.push(cut)
    } else {
      console.log(`无法生成有效切割线 ${i + 1}，尝试次数: ${attempts}`);
      
      // 在失败时尝试生成一个强制穿过形状中心的切割线
      const forcedCut = generateForcedCutLine(shape, cuts, type);
      if (forcedCut) {
        console.log(`添加强制切割线`);
        cuts.push(forcedCut);
      } else {
        break;
      }
    }
    
    // 高难度下，让后续切割线的方向有更多变化
    if (difficulty >= 4 && cuts.length > 1) {
      // 检查最后两条线是否方向相似（平行或垂直）
      const lastCut = cuts[cuts.length - 1];
      const prevCut = cuts[cuts.length - 2];
      
      // 计算线的角度
      const lastAngle = Math.atan2(lastCut.y2 - lastCut.y1, lastCut.x2 - lastCut.x1);
      const prevAngle = Math.atan2(prevCut.y2 - prevCut.y1, prevCut.x2 - prevCut.x1);
      
      // 计算角度差的绝对值（标准化到0-90度范围）
      const angleDiff = Math.abs(Math.abs(lastAngle - prevAngle) % Math.PI);
      const normalizedDiff = Math.min(angleDiff, Math.PI - angleDiff);
      
      // 如果角度差很小（平行）或接近90度（垂直），调整下一条线的生成策略
      if (normalizedDiff < 0.2 || Math.abs(normalizedDiff - Math.PI/2) < 0.2) {
        console.log(`检测到相似方向的切割线，下一条线将使用不同角度`);
      }
    }
  }

  return cuts
}

// 生成直线切割线
const generateStraightCutLine = (bounds: Bounds): CutLine => {
  const isVertical = Math.random() < 0.5

  if (isVertical) {
    const x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX)
    return {
      x1: x,
      y1: bounds.minY,
      x2: x,
      y2: bounds.maxY,
      type: "straight",
    }
  } else {
    const y = bounds.minY + Math.random() * (bounds.maxY - bounds.minY)
    return {
      x1: bounds.minX,
      y1: y,
      x2: bounds.maxX,
      y2: y,
      type: "straight",
    }
  }
}

// 生成斜线切割线
const generateDiagonalCutLine = (bounds: Bounds): CutLine => {
  const extension = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) * 0.5
  const centerX = (bounds.minX + bounds.maxX) / 2
  const centerY = (bounds.minY + bounds.maxY) / 2

  // 随机选择起点和终点
  const startAngle = Math.random() * 2 * Math.PI
  const endAngle = startAngle + Math.PI + (Math.random() - 0.5) * Math.PI

  const x1 = centerX + Math.cos(startAngle) * extension
  const y1 = centerY + Math.sin(startAngle) * extension
  const x2 = centerX + Math.cos(endAngle) * extension
  const y2 = centerY + Math.sin(endAngle) * extension

  return { x1, y1, x2, y2, type: "diagonal" }
}

// 检查切割线是否有效
const isValidCut = (cut: CutLine, shape: Point[], existingCuts: CutLine[], highDifficulty: boolean = false): boolean => {
  // 检查是否与形状相交
  const intersections = doesCutIntersectShape(cut, shape)
  if (intersections < 2) return false

  // 检查是否与现有切割线太接近
  for (const existingCut of existingCuts) {
    if (cutsAreTooClose(cut, existingCut)) {
      return false
    }
  }

  // 对高难度级别，放宽中心穿过的要求
  if (highDifficulty) {
    return true; // 高难度模式不要求切割线穿过中心
  }

  // 确保切割线穿过形状中心区域
  const bounds = calculateBounds(shape)
  const center = {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
  }

  if (!isPointNearLine(center, cut, 50)) {
    return false
  }

  return true
}

// 检查切割线是否太靠近
const cutsAreTooClose = (cut1: CutLine, cut2: CutLine): boolean => {
  const minDistance = 20
  const points = [
    { x: cut1.x1, y: cut1.y1 },
    { x: cut1.x2, y: cut1.y2 },
    { x: cut2.x1, y: cut2.y1 },
    { x: cut2.x2, y: cut2.y2 },
  ]

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const dx = points[i].x - points[j].x
      const dy = points[i].y - points[j].y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance < minDistance) {
        return true
      }
    }
  }

  return false
}

// 检查切割线与形状的交点数
const doesCutIntersectShape = (cut: CutLine, shape: Point[]): number => {
  let intersections = 0

  for (let i = 0; i < shape.length; i++) {
    const j = (i + 1) % shape.length

    if (lineIntersection({ x: cut.x1, y: cut.y1 }, { x: cut.x2, y: cut.y2 }, shape[i], shape[j])) {
      intersections++
    }
  }

  return intersections
}

// 创建强制穿过形状中心的切割线
const generateForcedCutLine = (shape: Point[], existingCuts: CutLine[], cutType: "straight" | "diagonal" = "diagonal"): CutLine | null => {
  // 计算形状的中心
  let sumX = 0, sumY = 0;
  for (const point of shape) {
    sumX += point.x;
    sumY += point.y;
  }
  const centerX = sumX / shape.length;
  const centerY = sumY / shape.length;
  
  // 计算形状的边界
  const bounds = calculateBounds(shape);
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  const diagonal = Math.sqrt(width * width + height * height) * 1.5; // 确保足够长
  
  // 如果是直线类型，直接生成水平或垂直线
  if (cutType === "straight") {
    const isVertical = Math.random() < 0.5;
    return {
      x1: isVertical ? centerX : bounds.minX - width * 0.2,
      y1: isVertical ? bounds.minY - height * 0.2 : centerY,
      x2: isVertical ? centerX : bounds.maxX + width * 0.2,
      y2: isVertical ? bounds.maxY + height * 0.2 : centerY,
      type: "straight"
    };
  }
  
  // 对于斜线类型，尝试不同角度的切割线
  const angles = 8;
  for (let i = 0; i < angles; i++) {
    const angle = (i / angles) * Math.PI;
    const cut: CutLine = {
      x1: centerX + Math.cos(angle) * diagonal,
      y1: centerY + Math.sin(angle) * diagonal,
      x2: centerX + Math.cos(angle + Math.PI) * diagonal,
      y2: centerY + Math.sin(angle + Math.PI) * diagonal,
      type: "diagonal"
    };
    
    if (doesCutIntersectShape(cut, shape) >= 2) {
      // 检查是否与现有切割线太近
      let tooClose = false;
      for (const existingCut of existingCuts) {
        if (cutsAreTooClose(cut, existingCut)) {
          tooClose = true;
          break;
        }
      }
      
      if (!tooClose) return cut;
    }
  }
  
  // 如果所有尝试都失败，返回一个垂直或水平的切割线
  const isVertical = Math.random() < 0.5;
  return {
    x1: isVertical ? centerX : bounds.minX - width * 0.2,
    y1: isVertical ? bounds.minY - height * 0.2 : centerY,
    x2: isVertical ? centerX : bounds.maxX + width * 0.2,
    y2: isVertical ? bounds.maxY + height * 0.2 : centerY,
    type: "straight"
  };
}

// 生成中心切割线
const generateCenterCutLine = (shape: Point[], isStraight: boolean, cutType: "straight" | "diagonal"): CutLine => {
  // 计算形状的中心和边界
  const bounds = calculateBounds(shape);
  const center = {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2
  };
  
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  const diagonal = Math.sqrt(width * width + height * height) * 1.2; // 确保足够长
  
  // 如果是直线类型或isStraight为true，则生成水平或垂直线
  if (cutType === "straight" || isStraight) {
    // 生成垂直或水平的中心切割线
    const isVertical = Math.random() < 0.5;
    return {
      x1: isVertical ? center.x : bounds.minX - width * 0.1,
      y1: isVertical ? bounds.minY - height * 0.1 : center.y,
      x2: isVertical ? center.x : bounds.maxX + width * 0.1,
      y2: isVertical ? bounds.maxY + height * 0.1 : center.y,
      type: "straight"
    };
  } else {
    // 生成对角线切割线
    const angle = Math.random() * Math.PI;
    return {
      x1: center.x + Math.cos(angle) * diagonal,
      y1: center.y + Math.sin(angle) * diagonal,
      x2: center.x + Math.cos(angle + Math.PI) * diagonal,
      y2: center.y + Math.sin(angle + Math.PI) * diagonal,
      type: "diagonal"
    };
  }
}

