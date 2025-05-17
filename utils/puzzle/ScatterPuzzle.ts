import { checkRectOverlap } from "./puzzleUtils";

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

// 声明一个接口描述游戏状态中的画布尺寸
interface GameContextState {
  canvasWidth?: number
  canvasHeight?: number
  targetShape?: {
    center: { x: number, y: number }
    radius: number
  } | null
}

export class ScatterPuzzle {
  static scatterPuzzle(pieces: PuzzlePiece[], contextState?: GameContextState): PuzzlePiece[] {
    // 获取画布尺寸信息
    let canvasWidth = contextState?.canvasWidth || 800;
    let canvasHeight = contextState?.canvasHeight || 600;
    
    // 目标形状信息
    const targetShape = contextState?.targetShape || null;
    
    try {
      // 尝试获取画布尺寸（如果没有提供）
      if (!contextState?.canvasWidth || !contextState?.canvasHeight) {
        const canvasElements = Array.from(document.querySelectorAll('canvas'));
        const validCanvases = canvasElements.filter((canvas): canvas is HTMLCanvasElement => 
          canvas instanceof HTMLCanvasElement);
        
        let mainCanvas: HTMLCanvasElement | null = null;
        let maxArea = 0;
        
        for (const canvas of validCanvases) {
          const area = canvas.width * canvas.height;
          if (area > maxArea) {
            maxArea = area;
            mainCanvas = canvas;
          }
        }
        
        if (mainCanvas) {
          canvasWidth = mainCanvas.width;
          canvasHeight = mainCanvas.height;
          console.log(`Using detected canvas: ${canvasWidth}x${canvasHeight}`);
        } else {
          console.warn("No canvas element found, using default dimensions");
        }
      } else {
        console.log(`Using context canvas: ${canvasWidth}x${canvasHeight}`);
      }
    } catch (e) {
      console.error("Error detecting canvas:", e);
    }
    
    // 检测设备类型和屏幕方向
    const ua = navigator.userAgent;
    const isIPhone = /iPhone/i.test(ua);
    const isAndroid = /Android/i.test(ua);
    const isMobile = isIPhone || isAndroid;
    const isPortrait = window.innerHeight > window.innerWidth;
    const isSmallScreen = canvasWidth < 400 || canvasHeight < 400;
    
    console.log(`设备检测: 移动=${isMobile}, 竖屏=${isPortrait}, 小屏幕=${isSmallScreen}`);
    
    // 根据设备类型调整安全边距
    let margin;
    if (isMobile && isPortrait) {
      // 手机竖屏模式下使用小边距，确保拼图在正方形画布内可见
      margin = Math.floor(canvasWidth * 0.05); // 减小到5%的边距
      console.log(`手机竖屏模式，使用边距: ${margin}px`);
    } else if (isSmallScreen) {
      // 小屏幕设备
      margin = Math.min(20, Math.floor(canvasWidth * 0.03)); // 减小到3%的边距
      console.log(`小屏幕设备，使用边距: ${margin}px`);
    } else {
      // 普通设备
      margin = Math.min(30, Math.floor(canvasWidth * 0.03)); // 减小到3%的边距
      console.log(`普通设备，使用边距: ${margin}px`);
    }
    
    // 确保可用区域
    const safeWidth = Math.max(canvasWidth - margin * 2, 200);
    const safeHeight = Math.max(canvasHeight - margin * 2, 200);

    // 使用更合理的网格大小
    let gridCols = Math.ceil(Math.sqrt(pieces.length * 1.5)); // 增加列数，减少重叠
    let gridRows = Math.ceil(pieces.length / gridCols);
    
    // 针对不同屏幕比例调整网格
    if (canvasWidth > canvasHeight * 1.5) { // 宽屏
      gridCols = Math.ceil(Math.sqrt(pieces.length * 2));
      gridRows = Math.ceil(pieces.length / gridCols);
    } else if (canvasHeight > canvasWidth * 1.5) { // 高屏
      gridRows = Math.ceil(Math.sqrt(pieces.length * 2));
      gridCols = Math.ceil(pieces.length / gridRows);
    }
    
    console.log(`使用网格: ${gridCols}列 x ${gridRows}行，共${pieces.length}个拼图`);
    
    // 根据难度调整拼图分布范围
    // 难度简化为拼图数量和形状复杂度
    const difficulty = pieces.length; 
    let distributionFactor;
    
    if (difficulty <= 3) {
      // 低难度(1-3片)使用更集中的分布
      distributionFactor = 0.65;
    } else if (difficulty <= 6) {
      // 中等难度(4-6片)
      distributionFactor = 0.75;
    } else {
      // 高难度(7+片)使用更分散的分布
      distributionFactor = 0.85;
    }
    
    console.log(`难度: ${difficulty}, 分布因子: ${distributionFactor}`);
    
    // 应用分布因子调整可用区域
    const adjustedSafeWidth = safeWidth * distributionFactor;
    const adjustedSafeHeight = safeHeight * distributionFactor;
    
    // 计算网格单元格大小
    const cellWidth = adjustedSafeWidth / gridCols;
    const cellHeight = adjustedSafeHeight / gridRows;
    
    // 验证数据
    if (!pieces.length) {
      console.warn("ScatterPuzzle: No pieces to scatter");
      return pieces;
    }

    const validPieces = pieces.every(piece => {
      return piece.points && piece.points.length > 0;
    });

    if (!validPieces) {
      console.warn("ScatterPuzzle: Invalid puzzle pieces data");
      return pieces;
    }

    console.log(`Canvas size: ${canvasWidth}x${canvasHeight}, Safe area: ${safeWidth}x${safeHeight}, Grid: ${gridCols}x${gridRows}`);
    
    // 计算目标形状区域，用于避免
    let targetShapeRegion = null;
    if (targetShape) {
      targetShapeRegion = {
        x: targetShape.center.x - targetShape.radius,
        y: targetShape.center.y - targetShape.radius,
        width: targetShape.radius * 2,
        height: targetShape.radius * 2,
        center: targetShape.center,
        radius: targetShape.radius
      };
      console.log(`目标形状区域: x=${targetShapeRegion.x}, y=${targetShapeRegion.y}, width=${targetShapeRegion.width}, height=${targetShapeRegion.height}`);
    }
    
    // 如果没有目标形状信息，尝试从已有拼图中推断
    if (!targetShapeRegion) {
      // 尝试从拼图原始位置推断形状
      const bounds = pieces.reduce(
        (acc, piece) => {
          const pieceBounds = {
            minX: Math.min(...piece.points.map(p => p.x)),
            maxX: Math.max(...piece.points.map(p => p.x)),
            minY: Math.min(...piece.points.map(p => p.y)),
            maxY: Math.max(...piece.points.map(p => p.y))
          };
          return {
            minX: Math.min(acc.minX, pieceBounds.minX),
            maxX: Math.max(acc.maxX, pieceBounds.maxX),
            minY: Math.min(acc.minY, pieceBounds.minY),
            maxY: Math.max(acc.maxY, pieceBounds.maxY)
          };
        },
        { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
      );
      
      // 计算形状的中心和半径
      const centerX = (bounds.minX + bounds.maxX) / 2;
      const centerY = (bounds.minY + bounds.maxY) / 2;
        const radius = Math.max(
        (bounds.maxX - bounds.minX) / 2,
        (bounds.maxY - bounds.minY) / 2
        ) * 1.2; // 增加20%的边距
        
        targetShapeRegion = {
          x: centerX - radius,
          y: centerY - radius,
          width: radius * 2,
          height: radius * 2,
          center: { x: centerX, y: centerY },
          radius: radius
        };
    }
    
    // 计算安全放置区域
    const placementAreas = this.generatePlacementAreas(
      canvasWidth, 
      canvasHeight, 
      targetShapeRegion,
      margin
    );
    
    console.log(`生成了${placementAreas.length}个放置区域`);
    
    // 克隆拼图数组，避免修改原始数据
    const scatteredPieces = JSON.parse(JSON.stringify(pieces)) as PuzzlePiece[];
    
    // 随机打乱拼图顺序，避免总是相同的分布
    const shuffledIndices = [...Array(scatteredPieces.length).keys()].sort(() => Math.random() - 0.5);
    
    // 计算每个拼图的边界框
    const pieceBounds = scatteredPieces.map(piece => {
      const xs = piece.points.map(p => p.x);
      const ys = piece.points.map(p => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      
      return {
        minX, maxX, minY, maxY,
        width: maxX - minX,
        height: maxY - minY,
        centerX: (minX + maxX) / 2,
        centerY: (minY + maxY) / 2
      };
    });
    
    // 跟踪已放置的拼图边界
    const placedPieceBounds: Array<{x: number, y: number, width: number, height: number}> = [];
    
    // 重叠检测的最大尝试次数
    const MAX_PLACEMENT_ATTEMPTS = 10;
    
    // 对每个拼图进行布局
    for (let i = 0; i < scatteredPieces.length; i++) {
      const pieceIndex = shuffledIndices[i];
      const piece = scatteredPieces[pieceIndex];
      const bounds = pieceBounds[pieceIndex];
      
      // 随机旋转
      const rotationSteps = Math.floor(Math.random() * 8); // 0-7，每步45度
      piece.rotation = rotationSteps * 45;
      
      // 确定拼图的放置位置
      let bestX = 0, bestY = 0;
      let minOverlap = Infinity;
      let placementFound = false;
      
      // 最多尝试MAX_PLACEMENT_ATTEMPTS次找到最佳位置
      for (let attempt = 0; attempt < MAX_PLACEMENT_ATTEMPTS; attempt++) {
        // 为当前拼图选择放置区域
        const areaIndex = Math.floor(Math.random() * placementAreas.length);
        const area = placementAreas[areaIndex];
        
        // 在区域内随机选择一个位置
        const gridX = Math.floor(Math.random() * gridCols);
        const gridY = Math.floor(Math.random() * gridRows);
        
        // 计算在网格中的位置
        const gridCenterX = area.x + margin/2 + gridX * cellWidth + cellWidth / 2;
        const gridCenterY = area.y + margin/2 + gridY * cellHeight + cellHeight / 2;
        
        // 加入一些随机偏移
        const offsetX = (Math.random() - 0.5) * cellWidth * 0.7; // 增加偏移范围
        const offsetY = (Math.random() - 0.5) * cellHeight * 0.7; // 增加偏移范围
        
        const posX = gridCenterX + offsetX;
        const posY = gridCenterY + offsetY;
        
        // 确保拼图边界离画布边缘有足够的距离，但使用更小的边距
        const minMargin = 5; // 使用非常小的边距，只要能保证拼图全部可见
        const adjustedX = Math.max(minMargin + bounds.width/2, Math.min(canvasWidth - minMargin - bounds.width/2, posX));
        const adjustedY = Math.max(minMargin + bounds.height/2, Math.min(canvasHeight - minMargin - bounds.height/2, posY));
        
        console.log(`拼图${pieceIndex}的放置位置计算:`, {
          grid: { x: gridX, y: gridY, cellWidth, cellHeight },
          gridCenter: { x: gridCenterX, y: gridCenterY },
          randomOffset: { x: offsetX, y: offsetY },
          initialPos: { x: posX, y: posY },
          pieceBounds: { width: bounds.width, height: bounds.height },
          adjustedPos: { x: adjustedX, y: adjustedY },
          canvas: { width: canvasWidth, height: canvasHeight },
          margin: { normal: margin, min: minMargin }
        });
        
        // 计算拼图在新位置的边界框
        const pieceRect = {
          x: adjustedX - bounds.width/2,
          y: adjustedY - bounds.height/2,
          width: bounds.width,
          height: bounds.height
        };
        
        // 验证拼图是否在画布内
        const isWithinCanvas = 
          pieceRect.x >= 0 && 
          pieceRect.y >= 0 && 
          pieceRect.x + pieceRect.width <= canvasWidth && 
          pieceRect.y + pieceRect.height <= canvasHeight;
        
        if (!isWithinCanvas) {
          console.warn(`⚠️ 拼图${pieceIndex}在调整后仍超出画布!`, {
            pieceRect,
            canvas: { width: canvasWidth, height: canvasHeight }
          });
        }
        
        // 计算与其他已放置拼图的重叠
        let totalOverlap = 0;
        for (const placed of placedPieceBounds) {
          if (checkRectOverlap(pieceRect, placed)) {
            // 计算重叠面积
            const overlapWidth = Math.min(pieceRect.x + pieceRect.width, placed.x + placed.width) - 
                                Math.max(pieceRect.x, placed.x);
            const overlapHeight = Math.min(pieceRect.y + pieceRect.height, placed.y + placed.height) - 
                                 Math.max(pieceRect.y, placed.y);
            totalOverlap += overlapWidth * overlapHeight;
          }
        }
        
        // 如果找到无重叠位置或者这是最小重叠的位置
        if (totalOverlap === 0) {
          bestX = adjustedX;
          bestY = adjustedY;
          placementFound = true;
          break; // 找到无重叠位置，立即使用
        } else if (totalOverlap < minOverlap) {
          minOverlap = totalOverlap;
          bestX = adjustedX;
          bestY = adjustedY;
        }
      }
      
      if (!placementFound && minOverlap === Infinity) {
        // 如果所有尝试都失败，使用备用策略
        const randomX = margin + Math.random() * (canvasWidth - 2 * margin);
        const randomY = margin + Math.random() * (canvasHeight - 2 * margin);
        bestX = randomX;
        bestY = randomY;
      }
      
      // 应用最佳位置
      const dx = bestX - bounds.centerX;
      const dy = bestY - bounds.centerY;
      
      // 更新拼图位置
      piece.x += dx;
      piece.y += dy;
      
      // 更新所有点的位置
      piece.points = piece.points.map(p => ({
        ...p,
        x: p.x + dx,
        y: p.y + dy
      }));
      
      // 再次计算拼图的实际边界，确保完全在画布内
      const updatedBounds = {
        minX: Math.min(...piece.points.map(p => p.x)),
        maxX: Math.max(...piece.points.map(p => p.x)),
        minY: Math.min(...piece.points.map(p => p.y)),
        maxY: Math.max(...piece.points.map(p => p.y)),
        width: 0,
        height: 0
      };
      updatedBounds.width = updatedBounds.maxX - updatedBounds.minX;
      updatedBounds.height = updatedBounds.maxY - updatedBounds.minY;
      
      // 检查并修正超出画布的情况
      let correctionNeeded = false;
      let correctionDx = 0, correctionDy = 0;
      
      // 检查左边界
      if (updatedBounds.minX < 0) {
        correctionDx = -updatedBounds.minX;
        correctionNeeded = true;
        console.warn(`⚠️ 拼图${pieceIndex}超出左边界，需要修正${correctionDx}px`);
      }
      // 检查右边界
      else if (updatedBounds.maxX > canvasWidth) {
        correctionDx = canvasWidth - updatedBounds.maxX;
        correctionNeeded = true;
        console.warn(`⚠️ 拼图${pieceIndex}超出右边界，需要修正${correctionDx}px`);
      }
      
      // 检查上边界
      if (updatedBounds.minY < 0) {
        correctionDy = -updatedBounds.minY;
        correctionNeeded = true;
        console.warn(`⚠️ 拼图${pieceIndex}超出上边界，需要修正${correctionDy}px`);
      }
      // 检查下边界
      else if (updatedBounds.maxY > canvasHeight) {
        correctionDy = canvasHeight - updatedBounds.maxY;
        correctionNeeded = true;
        console.warn(`⚠️ 拼图${pieceIndex}超出下边界，需要修正${correctionDy}px`);
      }
      
      // 应用修正（如果需要）
      if (correctionNeeded) {
        console.warn(`💡 拼图${pieceIndex}进行位置修正: dx=${correctionDx}, dy=${correctionDy}`);
        
        // 更新拼图位置
        piece.x += correctionDx;
        piece.y += correctionDy;
        
        // 更新所有点的位置
        piece.points = piece.points.map(p => ({
          ...p,
          x: p.x + correctionDx,
          y: p.y + correctionDy
        }));
        
        // 更新bestX和bestY用于记录已放置的拼图边界
        bestX += correctionDx;
        bestY += correctionDy;
      }
      
      // 记录已放置的拼图边界
      placedPieceBounds.push({
        x: bestX - bounds.width/2,
        y: bestY - bounds.height/2,
        width: bounds.width,
        height: bounds.height
      });
    }
    
    console.log(`已完成拼图散布，共${scatteredPieces.length}块`);
    
    return scatteredPieces;
  }
  
  // 辅助函数：计算螺旋位置
  static getSpiralPosition(index: number, size: number): {x: number, y: number} {
    if (index === 0) return {x: Math.floor(size/2), y: Math.floor(size/2)}; // 中心点
    
    let layer = 1;
    while ((2*layer+1)*(2*layer+1) <= index) {
      layer++;
    }
    
    const layerStart = (2*(layer-1)+1)*(2*(layer-1)+1);
    const sideLength = 2 * layer + 1;
    const sidePosition = index - layerStart;
    const side = Math.floor(sidePosition / (sideLength - 1));
    const posInSide = sidePosition % (sideLength - 1);
    
    const centerOffset = Math.floor(size/2);
    
    switch(side) {
      case 0: // 上边
        return {x: centerOffset - layer + posInSide, y: centerOffset - layer};
      case 1: // 右边
        return {x: centerOffset + layer, y: centerOffset - layer + posInSide};
      case 2: // 下边
        return {x: centerOffset + layer - posInSide, y: centerOffset + layer};
      case 3: // 左边
        return {x: centerOffset - layer, y: centerOffset + layer - posInSide};
      default:
        return {x: centerOffset, y: centerOffset};
    }
  }

  // 优化的位置分布算法，使拼图更加集中
  static getOptimizedPosition(index: number, size: number, offsetFactor: number = 0.3): {x: number, y: number} {
    // 中心点
    const centerX = (size - 1) / 2; 
    const centerY = (size - 1) / 2;
    
    if (index === 0) return {x: centerX, y: centerY}; // 中心点
    
    // 计算极坐标 - 使用更小的半径使拼图更集中
    const angle = index * 0.7; // 黄金角度的近似值，避免拼图聚集
    const radius = Math.sqrt(index) * offsetFactor * (size / 3); // 降低半径计算，使分布更集中
    
    // 转换为笛卡尔坐标，并围绕中心点
    let x = centerX + radius * Math.cos(angle);
    let y = centerY + radius * Math.sin(angle);
    
    // 确保坐标在网格范围内
    x = Math.max(0, Math.min(size - 1, x));
    y = Math.max(0, Math.min(size - 1, y));
    
    return {x, y};
  }
  
  // 根据目标形状计算放置区域
  static generatePlacementAreas(
    canvasWidth: number, 
    canvasHeight: number, 
    targetShape: { x: number, y: number, width: number, height: number, center: { x: number, y: number }, radius: number } | null,
    margin: number
  ): Array<{ x: number, y: number, width: number, height: number }> {
    // 使用传入的边距，如未提供则使用较小的默认值
    const safeMargin = margin || 5;
    
    // 如果没有目标形状，使用整个画布作为放置区域
    if (!targetShape) {
      return [{
        x: safeMargin,
        y: safeMargin,
        width: canvasWidth - safeMargin * 2,
        height: canvasHeight - safeMargin * 2
      }];
    }
    
    // 目标形状的有效边界（增加一点边距）
    const targetBoundary = {
      x: targetShape.x - safeMargin * 0.5,
      y: targetShape.y - safeMargin * 0.5,
      width: targetShape.width + safeMargin,
      height: targetShape.height + safeMargin
    };
    
    // 创建四个可能的放置区域（上、右、下、左）
    const areas = [];
    
    // 上方区域
    if (targetBoundary.y > safeMargin * 2) {
      areas.push({
        x: safeMargin,
        y: safeMargin,
        width: canvasWidth - safeMargin * 2,
        height: targetBoundary.y - safeMargin
      });
    }
    
    // 右侧区域
    if (targetBoundary.x + targetBoundary.width < canvasWidth - safeMargin * 2) {
      areas.push({
        x: targetBoundary.x + targetBoundary.width,
        y: safeMargin,
        width: canvasWidth - (targetBoundary.x + targetBoundary.width) - safeMargin,
        height: canvasHeight - safeMargin * 2
      });
    }
    
    // 下方区域
    if (targetBoundary.y + targetBoundary.height < canvasHeight - safeMargin * 2) {
      areas.push({
        x: safeMargin,
        y: targetBoundary.y + targetBoundary.height,
        width: canvasWidth - safeMargin * 2,
        height: canvasHeight - (targetBoundary.y + targetBoundary.height) - safeMargin
      });
    }
    
    // 左侧区域
    if (targetBoundary.x > safeMargin * 2) {
      areas.push({
        x: safeMargin,
        y: safeMargin,
        width: targetBoundary.x - safeMargin,
        height: canvasHeight - safeMargin * 2
      });
    }
    
    // 过滤掉太小的区域（至少要30x30像素）
    const validAreas = areas.filter(area => 
      area.width >= 30 && area.height >= 30
    );
    
    // 如果没有有效区域，回退到使用整个画布
    if (validAreas.length === 0) {
      console.warn("没有足够的空间避开目标形状，使用整个画布");
      return [{
        x: safeMargin,
        y: safeMargin,
        width: canvasWidth - safeMargin * 2,
        height: canvasHeight - safeMargin * 2
      }];
    }
    
    // 根据面积排序区域，优先使用更大的区域
    validAreas.sort((a, b) => (b.width * b.height) - (a.width * a.height));
    
    // 打印可用区域
    console.log(`生成了${validAreas.length}个有效放置区域:`, validAreas);
    
    return validAreas;
  }
}

