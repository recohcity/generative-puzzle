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
    // 优先使用GameContext中的画布尺寸信息
    let canvasWidth = contextState?.canvasWidth || 800;
    let canvasHeight = contextState?.canvasHeight || 600;
    
    try {
      // 只有在没有提供GameContext尺寸时才尝试从DOM获取
      if (!contextState?.canvasWidth || !contextState?.canvasHeight) {
        // 使用类型安全的方法获取画布元素
        const canvasElements = Array.from(document.querySelectorAll('canvas'));
        // 过滤非空画布并转换为HTMLCanvasElement
        const validCanvases = canvasElements.filter((canvas): canvas is HTMLCanvasElement => 
          canvas instanceof HTMLCanvasElement);
        
        // 初始化变量
        let mainCanvas: HTMLCanvasElement | null = null;
        let maxArea = 0;
        
        // 找到最大的画布
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
          console.warn("No canvas element found, using default or context dimensions");
        }
      } else {
        console.log(`Using context canvas: ${canvasWidth}x${canvasHeight}`);
      }
    } catch (e) {
      console.error("Error detecting canvas:", e);
    }
    
    // 更大的安全边距，确保拼图完全在画布内
    const margin = 100; // 从70增加到100
    
    // 确保有效范围
    const safeWidth = Math.max(canvasWidth - margin * 2, 400);
    const safeHeight = Math.max(canvasHeight - margin * 2, 300);

    // 创建一个网格，但使用更小的区域来确保不会太靠近边缘
    const gridSize = Math.ceil(Math.sqrt(pieces.length));
    const cellWidth = safeWidth / gridSize;
    const cellHeight = safeHeight / gridSize;

    // 确保我们有拼图数据且不会导致无限循环
    if (!pieces.length) {
      console.warn("ScatterPuzzle: No pieces to scatter");
      return pieces;
    }

    // 检查所有拼图是否有必要的属性
    const validPieces = pieces.every(piece => {
      return piece.points && piece.points.length > 0;
    });

    if (!validPieces) {
      console.warn("ScatterPuzzle: Invalid puzzle pieces data");
      return pieces;
    }

    // 记录起始位置用于调试
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
        
        // 计算该拼图所需的安全边距 - 考虑大尺寸拼图可能需要更大边距
        const pieceSafeMargin = Math.max(margin, 
                                        Math.ceil(pieceWidth * 0.1), 
                                        Math.ceil(pieceHeight * 0.1));

        // 计算网格位置 - 使用真正居中的位置
        const gridX = index % gridSize;
        const gridY = Math.floor(index / gridSize);
        
        // 计算目标位置 - 网格单元格中心，使用画布中心开始布局
        const centerOffsetX = (canvasWidth - (cellWidth * gridSize)) / 2;
        const centerOffsetY = (canvasHeight - (cellHeight * gridSize)) / 2;
        
        // 应用网格位置
        const cellCenterX = centerOffsetX + (gridX * cellWidth) + (cellWidth / 2);
        const cellCenterY = centerOffsetY + (gridY * cellHeight) + (cellHeight / 2);
        
        // 使用非常小的确定性偏移量，避免所有拼图在格子中心重叠
        const maxOffsetX = Math.min(cellWidth / 8, 8); 
        const maxOffsetY = Math.min(cellHeight / 8, 8);
        
        // 确定性随机偏移
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
        
        // 初始位置
        let adjustedX = targetX;
        let adjustedY = targetY;
        
        // 强制约束所有边缘都在画布内
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
        
        // 确认式的旋转选项 - 避免随机旋转
        const rotationOptions = [0, 90, 180, 270];
        const rotation = rotationOptions[index % rotationOptions.length];
        
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
}

