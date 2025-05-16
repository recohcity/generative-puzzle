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
  }
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
      // 手机竖屏模式下使用极大的边距，确保拼图在正方形画布内可见
      margin = Math.floor(canvasWidth * 0.25);
      console.log(`手机竖屏模式，使用极大边距: ${margin}px`);
    } else if (isSmallScreen) {
      // 小屏幕设备
      margin = Math.min(60, Math.floor(canvasWidth * 0.12));
      console.log(`小屏幕设备，使用中等边距: ${margin}px`);
    } else {
      // 普通设备
      margin = Math.min(80, Math.floor(canvasWidth * 0.15));
      console.log(`普通设备，使用标准边距: ${margin}px`);
    }
    
    // 确保可用区域
    const safeWidth = Math.max(canvasWidth - margin * 2, 200);
    const safeHeight = Math.max(canvasHeight - margin * 2, 200);

    // 创建更紧凑的网格
    let gridSize;
    if (isMobile && isPortrait) {
      // 手机竖屏模式下使用较小的网格size，确保拼图更加集中
      gridSize = Math.ceil(Math.sqrt(pieces.length * 2));
      console.log(`手机竖屏模式使用更大的网格尺寸: ${gridSize}x${gridSize}`);
    } else {
      gridSize = Math.ceil(Math.sqrt(pieces.length));
    }
    
    // 难度调整 - 根据拼图数量调整分布
    const difficulty = pieces.length; // 拼图数量作为难度指标
    
    // 根据难度调整拼图分布范围
    let distributionFactor;
    if (difficulty <= 3) {
      // 低难度(1-3片)拼图更集中
      distributionFactor = 0.7 - ((difficulty - 1) * 0.05); // 1级:0.7, 2级:0.65, 3级:0.6
    } else if (difficulty <= 6) {
      // 中等难度(4-6片)
      distributionFactor = 0.8 + ((difficulty - 4) * 0.05); // 4级:0.8, 5级:0.85, 6级:0.9
    } else {
      // 高难度(7-8片)使用全部空间或更大范围
      distributionFactor = difficulty === 7 ? 1.0 : 1.1; // 7级:1.0(全部空间), 8级:1.1(扩大范围)
    }
    
    console.log(`难度: ${difficulty}, 拼图数量: ${pieces.length}, 分布因子: ${distributionFactor}`);
    
    // 应用分布因子调整网格大小
    const adjustedSafeWidth = safeWidth * distributionFactor;
    const adjustedSafeHeight = safeHeight * distributionFactor;
    
    let cellWidth, cellHeight;
    
    if (isMobile && isPortrait) {
      // 手机竖屏模式下使用更紧凑的网格
      cellWidth = adjustedSafeWidth / (gridSize * 1.5); // 进一步减小单元格宽度
      cellHeight = adjustedSafeHeight / (gridSize * 1.5); // 进一步减小单元格高度
      console.log(`手机模式使用极小网格单元格: ${cellWidth.toFixed(2)}x${cellHeight.toFixed(2)}`);
    } else {
      // 普通设备使用标准网格
      cellWidth = adjustedSafeWidth / gridSize;
      cellHeight = adjustedSafeHeight / gridSize;
    }

    // 数据验证
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

    // 记录画布信息
    console.log(`Canvas size: ${canvasWidth}x${canvasHeight}, Safe area: ${safeWidth}x${safeHeight}, Grid: ${gridSize}x${gridSize}`);
    
    // 计算目标形状区域
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
      // 计算所有拼图的原始中心点
      const originalCenters = pieces.map(piece => {
        // 使用原始点计算中心
        if (piece.originalPoints && piece.originalPoints.length) {
          const bounds = {
            minX: Math.min(...piece.originalPoints.map(p => p.x)),
            maxX: Math.max(...piece.originalPoints.map(p => p.x)),
            minY: Math.min(...piece.originalPoints.map(p => p.y)),
            maxY: Math.max(...piece.originalPoints.map(p => p.y))
          };
          return {
            x: (bounds.minX + bounds.maxX) / 2,
            y: (bounds.minY + bounds.maxY) / 2
          };
        }
        // 如果没有原始点，则使用originalX和originalY
        return {
          x: piece.originalX || 0,
          y: piece.originalY || 0
        };
      });
      
      // 如果有足够的拼图，计算它们的边界作为目标区域
      if (originalCenters.length > 0) {
        const centerBounds = {
          minX: Math.min(...originalCenters.map(c => c.x)),
          maxX: Math.max(...originalCenters.map(c => c.x)),
          minY: Math.min(...originalCenters.map(c => c.y)),
          maxY: Math.max(...originalCenters.map(c => c.y))
        };
        
        const centerX = (centerBounds.minX + centerBounds.maxX) / 2;
        const centerY = (centerBounds.minY + centerBounds.maxY) / 2;
        const radius = Math.max(
          (centerBounds.maxX - centerBounds.minX) / 2,
          (centerBounds.maxY - centerBounds.minY) / 2
        ) * 1.2; // 增加20%的边距
        
        targetShapeRegion = {
          x: centerX - radius,
          y: centerY - radius,
          width: radius * 2,
          height: radius * 2,
          center: { x: centerX, y: centerY },
          radius: radius
        };
        
        console.log(`已推断目标形状区域: x=${targetShapeRegion.x.toFixed(2)}, y=${targetShapeRegion.y.toFixed(2)}, width=${targetShapeRegion.width.toFixed(2)}, height=${targetShapeRegion.height.toFixed(2)}`);
      }
    }
    
    // 根据目标形状区域，生成适合的放置区域
    const placementAreas = ScatterPuzzle.generatePlacementAreas(canvasWidth, canvasHeight, targetShapeRegion, margin);
    
    // 将拼图均匀分配到各个放置区域
    let areaIndex = 0;
    
    return pieces.map((piece, index) => {
      try {
        // 计算拼图的边界框
        const bounds = {
          minX: Math.min(...piece.points.map(p => p.x)),
          maxX: Math.max(...piece.points.map(p => p.x)),
          minY: Math.min(...piece.points.map(p => p.y)),
          maxY: Math.max(...piece.points.map(p => p.y))
        };
        
        // 计算拼图尺寸和中心点
        const pieceWidth = bounds.maxX - bounds.minX;
        const pieceHeight = bounds.maxY - bounds.minY;
        const centerX = (bounds.minX + bounds.maxX) / 2;
        const centerY = (bounds.minY + bounds.maxY) / 2;
        
        // 在手机模式下缩小拼图尺寸
        let scaleFactor = 1.0;
        let scaledPoints = [...piece.points];
        
        // 如果是手机模式且拼图相对画布较大，则缩小拼图
        if (isMobile && isPortrait && (pieceWidth > canvasWidth * 0.4 || pieceHeight > canvasHeight * 0.4)) {
          // 根据拼图尺寸和画布尺寸计算缩放系数
          scaleFactor = Math.min(
            (canvasWidth * 0.3) / pieceWidth,
            (canvasHeight * 0.3) / pieceHeight,
            0.8 // 最大缩放到80%
          );
          
          console.log(`拼图${index}较大，应用缩放: ${scaleFactor.toFixed(2)}`);
          
          // 缩放所有点
          scaledPoints = piece.points.map(p => ({
            x: centerX + (p.x - centerX) * scaleFactor,
            y: centerY + (p.y - centerY) * scaleFactor,
            isOriginal: p.isOriginal
          }));
        }
        
        // 为每个拼图调整安全边距
        const pieceSafeMargin = isMobile && isPortrait 
          ? Math.max(margin * 0.8, Math.ceil(pieceWidth * 0.15), Math.ceil(pieceHeight * 0.15))
          : Math.max(margin / 2, Math.ceil(pieceWidth * 0.1), Math.ceil(pieceHeight * 0.1));

        // 选择放置区域 - 循环使用可用区域
        const currentArea = placementAreas[areaIndex % placementAreas.length];
        areaIndex++;
        
        // 根据选定的放置区域计算位置
        let gridX, gridY;
        
        // 计算该区域内的行列数
        const areaGridSize = Math.ceil(Math.sqrt(pieces.length / placementAreas.length)) || 1;
        const areaIndex2D = index % (areaGridSize * areaGridSize);
        gridX = areaIndex2D % areaGridSize;
        gridY = Math.floor(areaIndex2D / areaGridSize);
        
        // 计算在区域内的单元格大小
        const areaCellWidth = currentArea.width / areaGridSize;
        const areaCellHeight = currentArea.height / areaGridSize;
        
        // 计算目标位置 - 在当前区域内分布
        const cellCenterX = currentArea.x + (gridX * areaCellWidth) + (areaCellWidth / 2);
        const cellCenterY = currentArea.y + (gridY * areaCellHeight) + (areaCellHeight / 2);
        
        // 添加随机偏移，根据难度调整偏移量
        let maxOffsetX, maxOffsetY;
        
        if (difficulty <= 3) {
          // 低难度偏移很小，拼图位置更固定
          maxOffsetX = Math.min(areaCellWidth / 20, 2); 
          maxOffsetY = Math.min(areaCellHeight / 20, 2);
        } else if (difficulty <= 6) {
          // 中等难度有适度偏移
          maxOffsetX = Math.min(areaCellWidth / 15, 4); 
          maxOffsetY = Math.min(areaCellHeight / 15, 4);
        } else {
          // 高难度有更大偏移，位置更随机
          maxOffsetX = Math.min(areaCellWidth / 8, 10); 
          maxOffsetY = Math.min(areaCellHeight / 8, 10);
        }
        
        // 使用拼图索引和难度生成伪随机种子
        const seed = ((index + 1) * 37.5 + difficulty * 13) % 100;
        const offsetX = Math.cos(seed) * maxOffsetX * (Math.random() * 0.5 + 0.75); // 增加随机性变化
        const offsetY = Math.sin(seed) * maxOffsetY * (Math.random() * 0.5 + 0.75);
        
        // 计算目标坐标
        const targetX = cellCenterX + offsetX;
        const targetY = cellCenterY + offsetY;
        
        // 计算目标位置时拼图的边缘坐标
        const targetMinX = targetX - (centerX - bounds.minX);
        const targetMaxX = targetX + (bounds.maxX - centerX);
        const targetMinY = targetY - (centerY - bounds.minY);
        const targetMaxY = targetY + (bounds.maxY - centerY);
        
        // 初始位置调整
        let adjustedX = targetX;
        let adjustedY = targetY;
        
        // 边界约束 - 确保拼图完全保持在画布范围内
        if (isMobile && isPortrait) {
          // 移动设备上需要更严格的约束
          adjustedX = Math.max(pieceSafeMargin + (centerX - bounds.minX), 
                      Math.min(canvasWidth - pieceSafeMargin - (bounds.maxX - centerX), adjustedX));
          adjustedY = Math.max(pieceSafeMargin + (centerY - bounds.minY), 
                      Math.min(canvasHeight - pieceSafeMargin - (bounds.maxY - centerY), adjustedY));
        } else {
          // 左边缘约束
          if (targetMinX < pieceSafeMargin) {
              adjustedX = pieceSafeMargin + (centerX - bounds.minX);
          }
          // 右边缘约束
          if (targetMaxX > canvasWidth - pieceSafeMargin) {
              adjustedX = (canvasWidth - pieceSafeMargin) - (bounds.maxX - centerX);
          }
          // 上边缘约束
          if (targetMinY < pieceSafeMargin) {
              adjustedY = pieceSafeMargin + (centerY - bounds.minY);
          }
          // 下边缘约束
          if (targetMaxY > canvasHeight - pieceSafeMargin) {
              adjustedY = (canvasHeight - pieceSafeMargin) - (bounds.maxY - centerY);
          }
        }
        
        // 最终安全检查
        const safeX = Math.max(
          pieceSafeMargin + (centerX - bounds.minX), 
          Math.min(canvasWidth - pieceSafeMargin - (bounds.maxX - centerX), adjustedX)
        );
        
        const safeY = Math.max(
          pieceSafeMargin + (centerY - bounds.minY), 
          Math.min(canvasHeight - pieceSafeMargin - (bounds.maxY - centerY), adjustedY)
        );
        
        // 计算移动距离
        const dx = safeX - centerX;
        const dy = safeY - centerY;
        
        // 创建新的点集
        const newPoints = scaledPoints.map((point) => ({
          x: point.x + dx,
          y: point.y + dy,
          isOriginal: point.isOriginal,
        }));
        
        // 旋转逻辑 - 根据切割次数调整旋转角度
        let rotation;
        // 获取拼图数量，作为难度的估计值
        const puzzleCount = pieces.length;
        
        // 修改旋转逻辑，确保所有设备上都使用15度的倍数
        if (isMobile && isPortrait) {
          // 手机竖屏模式下使用较大的旋转增量，但保持15度倍数
          if (puzzleCount <= 3) {
            // 简单难度(1-3)：常用0度或90度
            const rotationOptions = [0, 0, 90, 90];
            rotation = rotationOptions[index % rotationOptions.length];
          } else if (puzzleCount <= 6) {
            // 中等难度(4-6)：使用0、90、180度
            const rotationOptions = [0, 90, 90, 180];
            rotation = rotationOptions[index % rotationOptions.length];
          } else {
            // 高难度(7+)：使用0、90、180、270度旋转
            const rotationOptions = [0, 90, 180, 270];
            rotation = rotationOptions[index % rotationOptions.length];
          }
        } else {
          // 桌面端和手机横屏模式，只使用15度的倍数
          if (puzzleCount <= 3) {
            // 简单难度：0、15、30、45度
            rotation = Math.floor(Math.random() * 4) * 15;
          } else if (puzzleCount <= 6) {
            // 中等难度：0-90度，15度的倍数
            rotation = Math.floor(Math.random() * 7) * 15; // 0, 15, 30, 45, 60, 75, 90
          } else if (puzzleCount <= 9) {
            // 高难度：0-180度，15度的倍数
            rotation = Math.floor(Math.random() * 13) * 15; // 0, 15, 30, ..., 180
          } else {
            // 极高难度：0-345度，15度的倍数
            rotation = Math.floor(Math.random() * 24) * 15; // 0, 15, 30, ..., 345
          }
        }
        
        // 确保角度是15度的倍数
        rotation = Math.round(rotation / 15) * 15;
        
        // 最终边界检查
        const finalBounds = {
          minX: Math.min(...newPoints.map(p => p.x)),
          maxX: Math.max(...newPoints.map(p => p.x)),
          minY: Math.min(...newPoints.map(p => p.y)),
          maxY: Math.max(...newPoints.map(p => p.y))
        };
        
        // 记录是否所有边界都在安全区域内
        const isMinXSafe = finalBounds.minX >= pieceSafeMargin;
        const isMaxXSafe = finalBounds.maxX <= canvasWidth - pieceSafeMargin;
        const isMinYSafe = finalBounds.minY >= pieceSafeMargin;
        const isMaxYSafe = finalBounds.maxY <= canvasHeight - pieceSafeMargin;
        
        // 如果有边界不安全，记录详细信息
        if (!isMinXSafe || !isMaxXSafe || !isMinYSafe || !isMaxYSafe) {
          console.warn(`Piece ${index} boundary check:`, 
                       {minX: isMinXSafe, maxX: isMaxXSafe, minY: isMinYSafe, maxY: isMaxYSafe},
                       {finalBounds, canvas: {w: canvasWidth, h: canvasHeight}, margin: pieceSafeMargin});
        }

        return {
          ...piece,
          points: newPoints,
          rotation: rotation,
          x: safeX,
          y: safeY,
        };
      } catch (error) {
        console.error("Error scattering puzzle piece:", error);
        return piece; // 返回原始拼图，避免错误导致的中断
      }
    });
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
    // 安全边距
    const safeMargin = margin || 20;
    
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

