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
}

export class ScatterPuzzle {
  static scatterPuzzle(pieces: PuzzlePiece[], contextState?: GameContextState): PuzzlePiece[] {
    // 获取画布尺寸信息
    let canvasWidth = contextState?.canvasWidth || 800;
    let canvasHeight = contextState?.canvasHeight || 600;
    
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
      // 竖屏手机模式下使用更小的边距，让拼图更紧凑
      margin = Math.min(50, Math.floor(canvasWidth * 0.1));
      console.log(`手机竖屏模式，使用紧凑边距: ${margin}px`);
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
    const gridSize = Math.ceil(Math.sqrt(pieces.length));
    let cellWidth, cellHeight;
    
    if (isMobile && isPortrait) {
      // 手机竖屏模式下使用更紧凑的网格
      cellWidth = safeWidth / Math.max(gridSize, 2);
      cellHeight = safeHeight / Math.max(gridSize, 2);
    } else {
      // 普通设备使用标准网格
      cellWidth = safeWidth / gridSize;
      cellHeight = safeHeight / gridSize;
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
        
        // 为每个拼图调整安全边距
        const pieceSafeMargin = isMobile && isPortrait 
          ? Math.max(margin / 2, Math.ceil(pieceWidth * 0.05), Math.ceil(pieceHeight * 0.05))
          : Math.max(margin, Math.ceil(pieceWidth * 0.1), Math.ceil(pieceHeight * 0.1));

        // 计算网格位置 - 使用不同的拼图分布策略
        let gridX, gridY;
        
        if (isMobile && isPortrait) {
          // 竖屏手机模式下使用更均匀的分布
          // 使用螺旋形分布替代网格，避免重叠
          const spiralPosition = ScatterPuzzle.getSpiralPosition(index, gridSize);
          gridX = spiralPosition.x;
          gridY = spiralPosition.y;
        } else {
          // 普通设备使用标准网格
          gridX = index % gridSize;
          gridY = Math.floor(index / gridSize);
        }
        
        // 计算目标位置 - 从画布中心开始分布
        const centerOffsetX = (canvasWidth - (cellWidth * gridSize)) / 2;
        const centerOffsetY = (canvasHeight - (cellHeight * gridSize)) / 2;
        
        // 应用网格位置
        const cellCenterX = centerOffsetX + (gridX * cellWidth) + (cellWidth / 2);
        const cellCenterY = centerOffsetY + (gridY * cellHeight) + (cellHeight / 2);
        
        // 添加小的随机偏移，避免完全重叠
        const maxOffsetX = Math.min(cellWidth / 10, 5); 
        const maxOffsetY = Math.min(cellHeight / 10, 5);
        
        // 确定性随机偏移 - 使用更小的偏移量
        const seed = (index + 1) * 37.5;
        const offsetX = Math.cos(seed) * maxOffsetX;
        const offsetY = Math.sin(seed) * maxOffsetY;
        
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
        
        // 边界约束
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
        const newPoints = piece.points.map((point) => ({
          x: point.x + dx,
          y: point.y + dy,
          isOriginal: point.isOriginal,
        }));
        
        // 旋转逻辑 - 对手机端使用更简单的旋转选择
        let rotation;
        if (isMobile) {
          // 手机端使用简单的90度旋转
          const rotationOptions = [0, 90, 180, 270];
          rotation = rotationOptions[index % rotationOptions.length];
        } else {
          // 桌面端增加更多变化
          rotation = Math.floor((index % 8) * 45); // 0, 45, 90, 135, 180, 225, 270, 315
        }
        
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
}

