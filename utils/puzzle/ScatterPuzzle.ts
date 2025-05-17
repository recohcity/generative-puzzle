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
  needsBounceAnimation?: boolean
  bounceInfo?: {
    correctionX: number
    correctionY: number
    bounceX: number
    bounceY: number
  }
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
    
    // 统一的边界安全距离，用于所有边界相关计算
    const SAFE_BOUNDARY_MARGIN = Math.max(15, margin / 2); // 至少15像素的安全边距
    console.log(`使用统一边界安全距离: ${SAFE_BOUNDARY_MARGIN}px`);
    
    // 确保可用区域
    const safeWidth = Math.max(canvasWidth - SAFE_BOUNDARY_MARGIN * 2, 200);
    const safeHeight = Math.max(canvasHeight - SAFE_BOUNDARY_MARGIN * 2, 200);

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
      distributionFactor = 0.6; // 减小分布因子，使拼图更集中
    } else if (difficulty <= 6) {
      // 中等难度(4-6片)
      distributionFactor = 0.7; // 减小分布因子，使拼图更集中
    } else {
      // 高难度(7+片)使用更分散的分布
      distributionFactor = 0.75; // 减小分布因子，使拼图更集中
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
    
    // 计算每个拼图的边界框 - 注意：需要考虑旋转！
    // 修改这部分，使用与GameContext中相同的calculatePieceBounds逻辑
    const pieceBounds = scatteredPieces.map(piece => {
      // 如果拼图有旋转，需要计算旋转后的实际边界
      if (piece.rotation !== 0) {
        // 计算拼图中心点
        const xs = piece.points.map(p => p.x);
        const ys = piece.points.map(p => p.y);
        const center = {
          x: (Math.min(...xs) + Math.max(...xs)) / 2,
          y: (Math.min(...ys) + Math.max(...ys)) / 2
        };
        
        // 角度转为弧度
        const radians = (piece.rotation * Math.PI) / 180;
        
        // 计算每个点旋转后的位置
        const rotatedPoints = piece.points.map(p => {
          // 将点平移到原点
          const dx = p.x - center.x;
          const dy = p.y - center.y;
          
          // 应用旋转
          const rotatedDx = dx * Math.cos(radians) - dy * Math.sin(radians);
          const rotatedDy = dx * Math.sin(radians) + dy * Math.cos(radians);
          
          // 将点平移回原来的位置
          return {
            x: center.x + rotatedDx,
            y: center.y + rotatedDy
          };
        });
        
        // 使用旋转后的点计算边界框
        const minX = Math.min(...rotatedPoints.map(p => p.x));
        const maxX = Math.max(...rotatedPoints.map(p => p.x));
        const minY = Math.min(...rotatedPoints.map(p => p.y));
        const maxY = Math.max(...rotatedPoints.map(p => p.y));
        
        // 计算尺寸和中心点
        const width = maxX - minX;
        const height = maxY - minY;
        
        return { 
          minX, maxX, minY, maxY, 
          width, height, 
          centerX: center.x, 
          centerY: center.y 
        };
      }
      
      // 如果没有旋转，直接使用原始点计算边界框
      const xs = piece.points.map(p => p.x);
      const ys = piece.points.map(p => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      
      const width = maxX - minX;
      const height = maxY - minY;
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      
      return { minX, maxX, minY, maxY, width, height, centerX, centerY };
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
      
      // 随机旋转拼图 - 先保存一下原始旋转，以便后面计算旋转后的实际边界
      const rotationSteps = Math.floor(Math.random() * 8); // 0-7，每步45度
      piece.rotation = rotationSteps * 45;
      
      // ===== 应用旋转后，重新计算拼图的实际边界 =====
      // 因为旋转会改变拼图的实际边界尺寸
      const rotatedBounds = this.calculateRotatedPieceBounds(piece);
      
      // 确定拼图的放置位置 - 使用旋转后的真实边界
      let bestX = 0, bestY = 0;
      let minOverlap = Infinity;
      let placementFound = false;
      
      // 最多尝试MAX_PLACEMENT_ATTEMPTS次找到最佳位置
      for (let attempt = 0; attempt < MAX_PLACEMENT_ATTEMPTS; attempt++) {
        // 为当前拼图选择放置区域
        const areaIndex = Math.floor(Math.random() * placementAreas.length);
        const area = placementAreas[areaIndex];
        
        // 在区域内随机选择一个位置，减少边缘位置的概率
        const gridX = Math.floor((0.2 + 0.6 * Math.random()) * gridCols); // 进一步减少边缘概率
        const gridY = Math.floor((0.2 + 0.6 * Math.random()) * gridRows); // 进一步减少边缘概率
        
        // 计算在网格中的位置，添加额外边距以避免边缘
        const extraMargin = 20; // 额外边距
        const gridCenterX = area.x + extraMargin + gridX * cellWidth + cellWidth / 2;
        const gridCenterY = area.y + extraMargin + gridY * cellHeight + cellHeight / 2;
        
        // 加入适度的随机偏移，但减小偏移范围
        const offsetX = (Math.random() - 0.5) * cellWidth * 0.5; // 减小偏移范围
        const offsetY = (Math.random() - 0.5) * cellHeight * 0.5; // 减小偏移范围
        
        const posX = gridCenterX + offsetX;
        const posY = gridCenterY + offsetY;
        
        // 确保拼图边界离画布边缘有足够的距离
        // 使用旋转后的真实边界进行约束！
        const adjustedX = Math.max(SAFE_BOUNDARY_MARGIN + rotatedBounds.width/2, 
                                 Math.min(canvasWidth - SAFE_BOUNDARY_MARGIN - rotatedBounds.width/2, posX));
        const adjustedY = Math.max(SAFE_BOUNDARY_MARGIN + rotatedBounds.height/2, 
                                 Math.min(canvasHeight - SAFE_BOUNDARY_MARGIN - rotatedBounds.height/2, posY));
        
        console.log(`拼图${pieceIndex}的放置位置计算:`, {
          grid: { x: gridX, y: gridY, cellWidth, cellHeight },
          gridCenter: { x: gridCenterX, y: gridCenterY },
          randomOffset: { x: offsetX, y: offsetY },
          initialPos: { x: posX, y: posY },
          pieceBounds: { width: rotatedBounds.width, height: rotatedBounds.height },
          adjustedPos: { x: adjustedX, y: adjustedY },
          canvas: { width: canvasWidth, height: canvasHeight },
          safeMargin: SAFE_BOUNDARY_MARGIN
        });
        
        // 计算拼图在新位置的边界框 - 使用旋转后的实际尺寸！
        const pieceRect = {
          x: adjustedX - rotatedBounds.width/2,
          y: adjustedY - rotatedBounds.height/2,
          width: rotatedBounds.width,
          height: rotatedBounds.height
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
      
      // 使用统一的边界安全距离
      
      // 检查左边界
      if (updatedBounds.minX < SAFE_BOUNDARY_MARGIN) {
        correctionDx = SAFE_BOUNDARY_MARGIN - updatedBounds.minX;
        correctionNeeded = true;
        console.warn(`⚠️ 拼图${pieceIndex}超出左边界，需要修正${correctionDx}px`);
      }
      // 检查右边界
      else if (updatedBounds.maxX > canvasWidth - SAFE_BOUNDARY_MARGIN) {
        correctionDx = canvasWidth - SAFE_BOUNDARY_MARGIN - updatedBounds.maxX;
        correctionNeeded = true;
        console.warn(`⚠️ 拼图${pieceIndex}超出右边界，需要修正${correctionDx}px`);
      }
      
      // 检查上边界
      if (updatedBounds.minY < SAFE_BOUNDARY_MARGIN) {
        correctionDy = SAFE_BOUNDARY_MARGIN - updatedBounds.minY;
        correctionNeeded = true;
        console.warn(`⚠️ 拼图${pieceIndex}超出上边界，需要修正${correctionDy}px`);
      }
      // 检查下边界
      else if (updatedBounds.maxY > canvasHeight - SAFE_BOUNDARY_MARGIN) {
        correctionDy = canvasHeight - SAFE_BOUNDARY_MARGIN - updatedBounds.maxY;
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
    
    // 对每个拼图进行布局后，作最终的边界验证
    const finalScatteredPieces = [...scatteredPieces];
    
    // 对所有拼图进行最终的边界检查，确保不超出画布
    for (let i = 0; i < finalScatteredPieces.length; i++) {
      const piece = finalScatteredPieces[i];
      
      // 计算拼图的边界 - 使用考虑旋转的边界计算方法！
      const pieceBounds = this.calculateRotatedPieceBounds(piece);
      
      // 边界安全距离 - 使用已定义的统一值
      let finalCorrectionNeeded = false;
      let finalCorrectionDx = 0, finalCorrectionDy = 0;
      
      // 执行更严格的边界检查
      if (pieceBounds.minX < SAFE_BOUNDARY_MARGIN) {
        finalCorrectionDx = SAFE_BOUNDARY_MARGIN - pieceBounds.minX;
        finalCorrectionNeeded = true;
        console.warn(`🔴 最终检查: 拼图${i}仍超出左边界，修正${finalCorrectionDx}px`);
      } else if (pieceBounds.maxX > canvasWidth - SAFE_BOUNDARY_MARGIN) {
        finalCorrectionDx = canvasWidth - SAFE_BOUNDARY_MARGIN - pieceBounds.maxX;
        finalCorrectionNeeded = true;
        console.warn(`🔴 最终检查: 拼图${i}仍超出右边界，修正${finalCorrectionDx}px`);
      }
      
      if (pieceBounds.minY < SAFE_BOUNDARY_MARGIN) {
        finalCorrectionDy = SAFE_BOUNDARY_MARGIN - pieceBounds.minY;
        finalCorrectionNeeded = true;
        console.warn(`🔴 最终检查: 拼图${i}仍超出上边界，修正${finalCorrectionDy}px`);
      } else if (pieceBounds.maxY > canvasHeight - SAFE_BOUNDARY_MARGIN) {
        finalCorrectionDy = canvasHeight - SAFE_BOUNDARY_MARGIN - pieceBounds.maxY;
        finalCorrectionNeeded = true;
        console.warn(`🔴 最终检查: 拼图${i}仍超出下边界，修正${finalCorrectionDy}px`);
      }
      
      // 如果需要最终修正，则应用修正
      if (finalCorrectionNeeded) {
        console.warn(`🛠️ 对拼图${i}应用最终强制修正: dx=${finalCorrectionDx}, dy=${finalCorrectionDy}, 旋转角度=${piece.rotation}°`);
        
        // 更新拼图位置
        piece.x += finalCorrectionDx;
        piece.y += finalCorrectionDy;
        
        // 更新所有点的位置
        piece.points = piece.points.map(p => ({
          ...p,
          x: p.x + finalCorrectionDx,
          y: p.y + finalCorrectionDy
        }));
        
        // 再次验证修正后的边界，确认不会超出画布
        const verifiedBounds = this.calculateRotatedPieceBounds(piece);
        if (
          verifiedBounds.minX < SAFE_BOUNDARY_MARGIN || 
          verifiedBounds.maxX > canvasWidth - SAFE_BOUNDARY_MARGIN ||
          verifiedBounds.minY < SAFE_BOUNDARY_MARGIN || 
          verifiedBounds.maxY > canvasHeight - SAFE_BOUNDARY_MARGIN
        ) {
          // 如果仍然超出，采取强制措施：将拼图移到画布中心位置
          console.error(`❌ 拼图${i}修正后仍超出边界，强制移至画布中心区域`);
          const centerX = canvasWidth / 2;
          const centerY = canvasHeight / 2;
          const centerDx = centerX - piece.x;
          const centerDy = centerY - piece.y;
          
          // 更新拼图位置到中心
          piece.x = centerX;
          piece.y = centerY;
          
          // 更新所有点的位置
          piece.points = piece.points.map(p => ({
            ...p,
            x: p.x + centerDx,
            y: p.y + centerDy
          }));
        }
      }
    }
    
    console.log(`已完成拼图散布，共${finalScatteredPieces.length}块，通过了最终边界检查`);
    
    // 添加边界超出检测与回弹机制
    // 为超出边界的拼图提供回弹动画效果
    // 返回包含需要回弹信息的拼图数组
    return this.addBounceBackAnimation(finalScatteredPieces, canvasWidth, canvasHeight, SAFE_BOUNDARY_MARGIN);
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
    // 使用传入的边距，并确保最小值
    const safeMargin = Math.max(15, margin);
    
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

  // 帮助方法：考虑旋转计算拼图真实边界
  static calculateRotatedPieceBounds(piece: PuzzlePiece) {
    // 如果拼图有旋转，需要计算旋转后的实际边界
    if (piece.rotation !== 0) {
      // 计算拼图中心点
      const xs = piece.points.map(p => p.x);
      const ys = piece.points.map(p => p.y);
      const center = {
        x: (Math.min(...xs) + Math.max(...xs)) / 2,
        y: (Math.min(...ys) + Math.max(...ys)) / 2
      };
      
      // 角度转为弧度
      const radians = (piece.rotation * Math.PI) / 180;
      
      // 计算每个点旋转后的位置
      const rotatedPoints = piece.points.map(p => {
        // 将点平移到原点
        const dx = p.x - center.x;
        const dy = p.y - center.y;
        
        // 应用旋转
        const rotatedDx = dx * Math.cos(radians) - dy * Math.sin(radians);
        const rotatedDy = dx * Math.sin(radians) + dy * Math.cos(radians);
        
        // 将点平移回原来的位置
        return {
          x: center.x + rotatedDx,
          y: center.y + rotatedDy
        };
      });
      
      // 使用旋转后的点计算边界框
      const minX = Math.min(...rotatedPoints.map(p => p.x));
      const maxX = Math.max(...rotatedPoints.map(p => p.x));
      const minY = Math.min(...rotatedPoints.map(p => p.y));
      const maxY = Math.max(...rotatedPoints.map(p => p.y));
      
      // 计算尺寸和中心点
      const width = maxX - minX;
      const height = maxY - minY;
      
      return { 
        minX, maxX, minY, maxY, 
        width, height, 
        centerX: center.x, 
        centerY: center.y 
      };
    }
    
    // 如果没有旋转，直接使用原始点计算边界框
    const xs = piece.points.map(p => p.x);
    const ys = piece.points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    const width = maxX - minX;
    const height = maxY - minY;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    return { minX, maxX, minY, maxY, width, height, centerX, centerY };
  }

  // 新增函数：检测边界超出并添加回弹动画信息
  static addBounceBackAnimation(
    pieces: PuzzlePiece[], 
    canvasWidth: number, 
    canvasHeight: number, 
    safeMargin: number
  ): PuzzlePiece[] {
    // 为每个拼图检查是否需要回弹
    // 并保存回弹信息供外部使用
    const piecesWithBounceInfo = [...pieces];
    
    // 增加更严格的安全边距，确保检测更严格
    const strictSafeMargin = Math.max(safeMargin, 15); // 至少15像素的安全边距
    console.log(`使用更严格的边界检测安全边距: ${strictSafeMargin}px`);
    
    // 将需要回弹的拼图信息记录在这里
    const bounceBackPieces: {
      index: number;
      piece: PuzzlePiece;
      currentBounds: {
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
        width: number;
        height: number;
      };
      correctionX: number;
      correctionY: number;
      bounceX: number;
      bounceY: number;
    }[] = [];
    
    // 检查每个拼图
    for (let i = 0; i < piecesWithBounceInfo.length; i++) {
      const piece = piecesWithBounceInfo[i];
      
      // 增强精度：计算拼图当前的边界（考虑旋转）- 使用多种方法计算以提高准确性
      const currentBounds = this.calculateRotatedPieceBounds(piece);
      
      // 额外的边界检查: 特别注意旋转拼图的边界，使用点集计算
      // 这是为了提高旋转拼图边界检测的准确性
      let extremePoints: {minX: number, maxX: number, minY: number, maxY: number} | null = null;
      
      if (piece.rotation !== 0) {
        // 对于旋转的拼图，直接检查所有点的极值
        const allPoints = piece.points.map(p => ({
          x: p.x,
          y: p.y
        }));
        
        // 角度转为弧度
        const radians = (piece.rotation * Math.PI) / 180;
        const center = {
          x: piece.x,
          y: piece.y
        };
        
        // 计算旋转后的点
        const rotatedPoints = allPoints.map(p => {
          // 将点平移到中心点
          const dx = p.x - center.x;
          const dy = p.y - center.y;
          
          // 应用旋转
          const rotatedDx = dx * Math.cos(radians) - dy * Math.sin(radians);
          const rotatedDy = dx * Math.sin(radians) + dy * Math.cos(radians);
          
          // 将点平移回原来的位置
          return {
            x: center.x + rotatedDx,
            y: center.y + rotatedDy
          };
        });
        
        // 计算极点值
        extremePoints = {
          minX: Math.min(...rotatedPoints.map(p => p.x)),
          maxX: Math.max(...rotatedPoints.map(p => p.x)),
          minY: Math.min(...rotatedPoints.map(p => p.y)),
          maxY: Math.max(...rotatedPoints.map(p => p.y))
        };
      }
      
      // 使用两种边界计算方法中更大的边界作为最终边界
      const finalBounds = {
        minX: extremePoints ? Math.min(currentBounds.minX, extremePoints.minX) : currentBounds.minX,
        maxX: extremePoints ? Math.max(currentBounds.maxX, extremePoints.maxX) : currentBounds.maxX,
        minY: extremePoints ? Math.min(currentBounds.minY, extremePoints.minY) : currentBounds.minY,
        maxY: extremePoints ? Math.max(currentBounds.maxY, extremePoints.maxY) : currentBounds.maxY,
        width: currentBounds.width,
        height: currentBounds.height
      };
      
      // 计算宽高
      finalBounds.width = finalBounds.maxX - finalBounds.minX;
      finalBounds.height = finalBounds.maxY - finalBounds.minY;
      
      // 检查是否超出画布边界 - 使用更严格的边距
      let correctionX = 0;
      let correctionY = 0;
      let bounceNeeded = false;
      
      // 降低检测阈值，只要超出0.05像素就触发回弹
      const detectionThreshold = 0.05;
      
      // 检查水平边界
      if (finalBounds.minX < strictSafeMargin) {
        // 精确检测是否确实超出边界 - 降低阈值
        const boundaryViolation = strictSafeMargin - finalBounds.minX;
        // 只有当确实超出边界时才标记为需要回弹 - 降低阈值
        if (boundaryViolation > detectionThreshold) {
          correctionX = boundaryViolation; // 需要向右修正
          bounceNeeded = true;
          console.log(`🔄 散开后边界检查: 拼图${i}触碰左边界，需要修正${correctionX}px`);
        }
      } else if (finalBounds.maxX > canvasWidth - strictSafeMargin) {
        // 精确检测是否确实超出边界 - 降低阈值
        const boundaryViolation = finalBounds.maxX - (canvasWidth - strictSafeMargin);
        // 只有当确实超出边界时才标记为需要回弹 - 降低阈值
        if (boundaryViolation > detectionThreshold) {
          correctionX = -boundaryViolation; // 需要向左修正
          bounceNeeded = true;
          console.log(`🔄 散开后边界检查: 拼图${i}触碰右边界，需要修正${correctionX}px`);
        }
      }
      
      // 检查垂直边界
      if (finalBounds.minY < strictSafeMargin) {
        // 精确检测是否确实超出边界 - 降低阈值
        const boundaryViolation = strictSafeMargin - finalBounds.minY;
        // 只有当确实超出边界时才标记为需要回弹 - 降低阈值
        if (boundaryViolation > detectionThreshold) {
          correctionY = boundaryViolation; // 需要向下修正
          bounceNeeded = true;
          console.log(`🔄 散开后边界检查: 拼图${i}触碰上边界，需要修正${correctionY}px`);
        }
      } else if (finalBounds.maxY > canvasHeight - strictSafeMargin) {
        // 精确检测是否确实超出边界 - 降低阈值
        const boundaryViolation = finalBounds.maxY - (canvasHeight - strictSafeMargin);
        // 只有当确实超出边界时才标记为需要回弹 - 降低阈值
        if (boundaryViolation > detectionThreshold) {
          correctionY = -boundaryViolation; // 需要向上修正
          bounceNeeded = true;
          console.log(`🔄 散开后边界检查: 拼图${i}触碰下边界，需要修正${correctionY}px`);
        }
      }
      
      // 对于旋转的拼图，增加额外的安全边距检测（更严格）
      if (piece.rotation !== 0 && !bounceNeeded) {
        // 增加额外的安全边距
        const extraRotationMargin = 10; // 旋转拼图额外增加10像素安全边距
        const totalMargin = strictSafeMargin + extraRotationMargin;
        
        // 再次检查是否超出边界，使用更大的安全边距
        if (finalBounds.minX < totalMargin) {
          correctionX = totalMargin - finalBounds.minX;
          bounceNeeded = true;
          console.log(`🔄 旋转拼图额外检查: 拼图${i}左边界过近，应用额外修正${correctionX}px`);
        } else if (finalBounds.maxX > canvasWidth - totalMargin) {
          correctionX = canvasWidth - totalMargin - finalBounds.maxX;
          bounceNeeded = true;
          console.log(`🔄 旋转拼图额外检查: 拼图${i}右边界过近，应用额外修正${correctionX}px`);
        }
        
        if (finalBounds.minY < totalMargin) {
          correctionY = totalMargin - finalBounds.minY;
          bounceNeeded = true;
          console.log(`🔄 旋转拼图额外检查: 拼图${i}上边界过近，应用额外修正${correctionY}px`);
        } else if (finalBounds.maxY > canvasHeight - totalMargin) {
          correctionY = canvasHeight - totalMargin - finalBounds.maxY;
          bounceNeeded = true;
          console.log(`🔄 旋转拼图额外检查: 拼图${i}下边界过近，应用额外修正${correctionY}px`);
        }
      }
      
      // 视觉检测：拼图的任何一部分是否看起来超出边界（判断视觉余量）
      // 这是为了确保拼图看起来不会太靠近边缘，提供更好的视觉体验
      if (!bounceNeeded) {
        const visualMargin = 20; // 视觉上至少离边缘20像素
        
        // 如果拼图视觉上太靠近边缘，也应用修正
        if (finalBounds.minX < visualMargin) {
          correctionX = visualMargin - finalBounds.minX;
          bounceNeeded = true;
          console.log(`🔄 视觉边距检查: 拼图${i}视觉上太靠近左边界，应用修正${correctionX}px`);
        } else if (finalBounds.maxX > canvasWidth - visualMargin) {
          correctionX = canvasWidth - visualMargin - finalBounds.maxX;
          bounceNeeded = true;
          console.log(`🔄 视觉边距检查: 拼图${i}视觉上太靠近右边界，应用修正${correctionX}px`);
        }
        
        if (finalBounds.minY < visualMargin) {
          correctionY = visualMargin - finalBounds.minY;
          bounceNeeded = true;
          console.log(`🔄 视觉边距检查: 拼图${i}视觉上太靠近上边界，应用修正${correctionY}px`);
        } else if (finalBounds.maxY > canvasHeight - visualMargin) {
          correctionY = canvasHeight - visualMargin - finalBounds.maxY;
          bounceNeeded = true;
          console.log(`🔄 视觉边距检查: 拼图${i}视觉上太靠近下边界，应用修正${correctionY}px`);
        }
      }
      
      if (bounceNeeded) {
        // 与GameContext中保持一致的回弹参数
        const bounceBackFactor = 0.4;
        
        // 使用拼图尺寸的30%作为回弹距离基准
        const pieceSizeBasedBounce = Math.max(finalBounds.width, finalBounds.height) * 0.3;
        // 最大回弹距离限制(像素) - 确保回弹效果明显但不过度
        const maxBounceDistance = Math.min(Math.max(pieceSizeBasedBounce, 30), 80);
        
        // 计算回弹距离，与修正方向相反
        const bounceX = Math.abs(correctionX) > 0 ? 
                      -Math.sign(correctionX) * Math.min(Math.abs(correctionX) * bounceBackFactor, maxBounceDistance) : 0;
        const bounceY = Math.abs(correctionY) > 0 ? 
                      -Math.sign(correctionY) * Math.min(Math.abs(correctionY) * bounceBackFactor, maxBounceDistance) : 0;
        
        console.log(`🔄 拼图${i}需要回弹动画: 修正(${correctionX}, ${correctionY}), 回弹(${bounceX}, ${bounceY})`);
        
        // 将该拼图添加到需要回弹的列表中
        bounceBackPieces.push({
          index: i,
          piece: piece,
          currentBounds: finalBounds,
          correctionX,
          correctionY,
          bounceX,
          bounceY
        });
        
        // 直接应用修正（将拼图挪回安全区域）
        // 动画回弹效果将由外部GameContext处理
        piece.x += correctionX;
        piece.y += correctionY;
        
        // 更新所有点的位置
        piece.points = piece.points.map(p => ({
          ...p,
          x: p.x + correctionX,
          y: p.y + correctionY
        }));
        
        // 为每个拼图添加回弹信息，供外部动画系统使用
        piece.needsBounceAnimation = true;
        piece.bounceInfo = {
          correctionX,
          correctionY,
          bounceX, 
          bounceY
        };
      }
    }
    
    // 记录需要回弹的拼图数量
    if (bounceBackPieces.length > 0) {
      console.log(`总计${bounceBackPieces.length}个拼图需要边界回弹处理`);
    } else {
      console.log(`所有拼图都在安全边界内，无需回弹处理`);
    }
    
    // 强制最终检查：确保所有拼图都在画布内
    // 即使前面的检测没有发现问题，这里也再次检查
    for (let i = 0; i < piecesWithBounceInfo.length; i++) {
      const piece = piecesWithBounceInfo[i];
      
      // 如果已经标记了回弹，则跳过
      if (piece.needsBounceAnimation) continue;
      
      // 获取最终的拼图边界
      const bounds = this.calculateRotatedPieceBounds(piece);
      
      // 检查是否有任何部分超出画布
      const minPadding = 5; // 最小的安全边距
      
      if (bounds.minX < minPadding || 
          bounds.maxX > canvasWidth - minPadding || 
          bounds.minY < minPadding || 
          bounds.maxY > canvasHeight - minPadding) {
        
        console.warn(`⚠️ 最终安全检查: 拼图${i}仍然可能超出画布边界，强制修正`);
        
        // 计算需要移动的距离，使拼图完全进入安全区域
        let finalCorrectionX = 0;
        let finalCorrectionY = 0;
        
        if (bounds.minX < minPadding) {
          finalCorrectionX = minPadding - bounds.minX;
        } else if (bounds.maxX > canvasWidth - minPadding) {
          finalCorrectionX = canvasWidth - minPadding - bounds.maxX;
        }
        
        if (bounds.minY < minPadding) {
          finalCorrectionY = minPadding - bounds.minY;
        } else if (bounds.maxY > canvasHeight - minPadding) {
          finalCorrectionY = canvasHeight - minPadding - bounds.maxY;
        }
        
        // 应用修正
        if (finalCorrectionX !== 0 || finalCorrectionY !== 0) {
          piece.x += finalCorrectionX;
          piece.y += finalCorrectionY;
          
          piece.points = piece.points.map(p => ({
            ...p,
            x: p.x + finalCorrectionX,
            y: p.y + finalCorrectionY
          }));
          
          // 标记为需要回弹动画
          piece.needsBounceAnimation = true;
          piece.bounceInfo = {
            correctionX: finalCorrectionX,
            correctionY: finalCorrectionY,
            bounceX: -Math.sign(finalCorrectionX) * 20, // 简单的回弹距离
            bounceY: -Math.sign(finalCorrectionY) * 20
          };
          
          console.log(`最终安全修正: 拼图${i}移动(${finalCorrectionX}, ${finalCorrectionY})`);
        }
      }
    }
    
    return piecesWithBounceInfo;
  }
}

