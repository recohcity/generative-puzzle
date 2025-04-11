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

export class ScatterPuzzle {
  static scatterPuzzle(pieces: PuzzlePiece[]): PuzzlePiece[] {
    // 获取所有画布元素，确保获取到正确的画布
    const canvases = document.querySelectorAll('canvas');
    
    // 通常游戏画布是最后一个或第二个画布
    const mainCanvas = canvases[canvases.length - 1] || canvases[0];
    
    // 确定画布尺寸，有备用值
    const canvasWidth = mainCanvas?.width || 800;
    const canvasHeight = mainCanvas?.height || 600;
    
    // 固定安全边距
    const margin = 50;

    // 创建一个网格来放置拼图片段
    const gridSize = Math.ceil(Math.sqrt(pieces.length));
    const cellWidth = (canvasWidth - margin * 2) / gridSize;
    const cellHeight = (canvasHeight - margin * 2) / gridSize;

    return pieces.map((piece, index) => {
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

      // 计算网格位置
      const gridX = index % gridSize;
      const gridY = Math.floor(index / gridSize);
      
      // 计算目标位置 - 网格单元格中心
      const cellCenterX = margin + gridX * cellWidth + cellWidth / 2;
      const cellCenterY = margin + gridY * cellHeight + cellHeight / 2;
      
      // 确保拼图完全在画布内
      const maxOffsetX = Math.min(cellWidth / 4, 20);
      const maxOffsetY = Math.min(cellHeight / 4, 20);
      
      // 添加随机偏移
      const offsetX = (Math.random() - 0.5) * maxOffsetX * 2;
      const offsetY = (Math.random() - 0.5) * maxOffsetY * 2;
      
      // 计算安全的目标坐标
      const targetX = cellCenterX + offsetX;
      const targetY = cellCenterY + offsetY;
      
      // 确保边界安全
      const safeX = Math.max(margin + pieceWidth/2, Math.min(canvasWidth - margin - pieceWidth/2, targetX));
      const safeY = Math.max(margin + pieceHeight/2, Math.min(canvasHeight - margin - pieceHeight/2, targetY));
      
      // 计算需要移动的距离
      const dx = safeX - centerX;
      const dy = safeY - centerY;

      // 随机旋转
      const randomRotation = Math.floor(Math.random() * 4) * 90;

      // 创建新的点集
      const newPoints = piece.points.map((point) => ({
        x: point.x + dx,
        y: point.y + dy,
        isOriginal: point.isOriginal,
      }));

      return {
        ...piece,
        points: newPoints,
        rotation: randomRotation,
        x: safeX,
        y: safeY,
      };
    });
  }
}

