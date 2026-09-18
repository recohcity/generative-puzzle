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
  canvasSize?: { width: number; height: number }
  targetShape?: {
    center: { x: number, y: number }
    radius: number
  } | null
}

export class ScatterPuzzle {
  /**
   * 拼图散布算法 - 智能分布系统
   * 
   * 算法核心功能：
   * 1. 智能网格分布：根据拼图数量动态计算最优网格布局
   * 2. 碰撞检测：确保拼图片段之间不重叠
   * 3. 边界保护：防止拼图超出画布边界
   * 4. 旋转随机化：为每个拼图应用15°倍数的随机旋转
   * 5. 回弹动画：为超出边界的拼图添加回弹效果
   * 
   * 分布策略：
   * - 使用网格系统确保均匀分布
   * - 根据难度调整分布密度
   * - 避开目标形状区域
   * - 优先放置大片段，后放置小片段
   * 
   * @param pieces 待散布的拼图片段数组
   * @param contextState 游戏上下文状态（画布尺寸、目标形状等）
   * @returns 散布后的拼图片段数组
   */
  static scatterPuzzle(pieces: PuzzlePiece[], contextState?: GameContextState): PuzzlePiece[] {
    // 步骤1：获取画布尺寸信息
    // 优先使用上下文提供的尺寸，否则使用默认值
    let canvasWidth = contextState?.canvasSize?.width || 800;
    let canvasHeight = contextState?.canvasSize?.height || 600;

    // 步骤2：获取目标形状信息
    // 目标形状区域需要避开，不能放置拼图片段
    const targetShape = contextState?.targetShape || null;
    try {
      if (!contextState?.canvasSize?.width || !contextState?.canvasSize?.height) {
        const canvasElements = Array.from(typeof document !== 'undefined' ? document.querySelectorAll('canvas') : []);
        const validCanvases = canvasElements.filter((canvas): canvas is HTMLCanvasElement => canvas instanceof HTMLCanvasElement);
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
        }
      }
    } catch (e) {
      // SSR安全
    }
    // 使用统一设备检测系统
    const { DeviceManager } = require('../../services/DeviceManager');
    const deviceManager = DeviceManager.getInstance();
    const deviceState = deviceManager.getState();
    // === 安全边距重构 ===
    // 统一安全边距为10px，仅用于拼图自动分布/回弹兜底，不影响拼图区大小
    const SAFE_BOUNDARY_MARGIN = 10;
    // safeWidth/safeHeight 仅用于分布兜底
    const safeWidth = Math.max(canvasWidth - SAFE_BOUNDARY_MARGIN * 2, 200);
    const safeHeight = Math.max(canvasHeight - SAFE_BOUNDARY_MARGIN * 2, 200);
    let gridCols = Math.ceil(Math.sqrt(pieces.length * 1.5));
    let gridRows = Math.ceil(pieces.length / gridCols);
    if (canvasWidth > canvasHeight * 1.5) {
      gridCols = Math.ceil(Math.sqrt(pieces.length * 2));
      gridRows = Math.ceil(pieces.length / gridCols);
    } else if (canvasHeight > canvasWidth * 1.5) {
      gridRows = Math.ceil(Math.sqrt(pieces.length * 2));
      gridCols = Math.ceil(pieces.length / gridRows);
    }
    const difficulty = pieces.length;
    // 覆盖全画布分布，避免集中收缩
    const distributionFactor = 1.0;
    const adjustedSafeWidth = safeWidth * distributionFactor;
    const adjustedSafeHeight = safeHeight * distributionFactor;
    const cellWidth = adjustedSafeWidth / gridCols;
    const cellHeight = adjustedSafeHeight / gridRows;
    // 目标形状区域
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
    }
    if (!targetShapeRegion) {
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
      const centerX = (bounds.minX + bounds.maxX) / 2;
      const centerY = (bounds.minY + bounds.maxY) / 2;
      const radius = Math.max(
        (bounds.maxX - bounds.minX) / 2,
        (bounds.maxY - bounds.minY) / 2
      ) * 1.2;
      targetShapeRegion = {
        x: centerX - radius,
        y: centerY - radius,
        width: radius * 2,
        height: radius * 2,
        center: { x: centerX, y: centerY },
        radius: radius
      };
    }
    // placementAreas 生成时始终覆盖整个画布，不再收缩
    const placementAreas = [{
      x: 0, // 不收缩，左边界
      y: 0, // 不收缩，上边界
      width: canvasWidth, // 全画布宽度
      height: canvasHeight // 全画布高度
    }];
    // 克隆拼图数组，避免修改原始数据
    const scatteredPieces = JSON.parse(JSON.stringify(pieces)) as PuzzlePiece[];
    // 随机打乱拼图顺序
    const shuffledIndices = [...Array(scatteredPieces.length).keys()].sort(() => Math.random() - 0.5);
    // 记录原始中心点，避免反复遍历点集计算中心
    const originalCenters = scatteredPieces.map(p => ({ x: p.x, y: p.y }));
    const placedPieceBounds: Array<{ x: number, y: number, width: number, height: number }> = [];
    const MAX_PLACEMENT_ATTEMPTS = 10;
    for (let i = 0; i < scatteredPieces.length; i++) {
      const pieceIndex = shuffledIndices[i];
      const piece = scatteredPieces[pieceIndex];
      const originalCenter = originalCenters[pieceIndex];
      // 随机旋转拼图 - 15°倍数
      const rotationSteps = Math.floor(Math.random() * 24); // 0-23，每步15度
      piece.rotation = rotationSteps * 15;
      // ===== 应用旋转后，重新计算拼图的实际边界 =====
      const rotatedBounds = this.calculateRotatedPieceBounds(piece);
      let bestX = 0, bestY = 0;
      let minOverlap = Infinity;
      let placementFound = false;
      for (let attempt = 0; attempt < MAX_PLACEMENT_ATTEMPTS; attempt++) {
        const areaIndex = Math.floor(Math.random() * placementAreas.length);
        const area = placementAreas[areaIndex];
        // 全画布范围内均匀采样网格索引
        const gridX = Math.floor(Math.random() * gridCols);
        const gridY = Math.floor(Math.random() * gridRows);
        const extraMargin = SAFE_BOUNDARY_MARGIN;
        const gridCenterX = area.x + extraMargin + gridX * cellWidth + cellWidth / 2;
        const gridCenterY = area.y + extraMargin + gridY * cellHeight + cellHeight / 2;
        // 增大抖动，提升覆盖度（仍受安全边距与画布边界约束）
        const offsetX = (Math.random() - 0.5) * cellWidth * 0.9;
        const offsetY = (Math.random() - 0.5) * cellHeight * 0.9;
        const posX = gridCenterX + offsetX;
        const posY = gridCenterY + offsetY;
        const adjustedX = Math.max(SAFE_BOUNDARY_MARGIN + rotatedBounds.width / 2, Math.min(canvasWidth - SAFE_BOUNDARY_MARGIN - rotatedBounds.width / 2, posX));
        const adjustedY = Math.max(SAFE_BOUNDARY_MARGIN + rotatedBounds.height / 2, Math.min(canvasHeight - SAFE_BOUNDARY_MARGIN - rotatedBounds.height / 2, posY));
        const pieceRect = {
          x: adjustedX - rotatedBounds.width / 2,
          y: adjustedY - rotatedBounds.height / 2,
          width: rotatedBounds.width,
          height: rotatedBounds.height
        };
        const isWithinCanvas =
          pieceRect.x >= 0 &&
          pieceRect.y >= 0 &&
          pieceRect.x + pieceRect.width <= canvasWidth &&
          pieceRect.y + pieceRect.height <= canvasHeight;
        if (!isWithinCanvas) continue;
        let totalOverlap = 0;
        for (const placed of placedPieceBounds) {
          if (checkRectOverlap(pieceRect, placed)) {
            const overlapWidth = Math.min(pieceRect.x + pieceRect.width, placed.x + placed.width) - Math.max(pieceRect.x, placed.x);
            const overlapHeight = Math.min(pieceRect.y + pieceRect.height, placed.y + placed.height) - Math.max(pieceRect.y, placed.y);
            totalOverlap += overlapWidth * overlapHeight;
          }
        }
        if (totalOverlap === 0) {
          bestX = adjustedX;
          bestY = adjustedY;
          placementFound = true;
          break;
        } else if (totalOverlap < minOverlap) {
          minOverlap = totalOverlap;
          bestX = adjustedX;
          bestY = adjustedY;
        }
      }
      if (!placementFound && minOverlap === Infinity) {
        const randomX = SAFE_BOUNDARY_MARGIN + Math.random() * (canvasWidth - 2 * SAFE_BOUNDARY_MARGIN);
        const randomY = SAFE_BOUNDARY_MARGIN + Math.random() * (canvasHeight - 2 * SAFE_BOUNDARY_MARGIN);
        bestX = randomX;
        bestY = randomY;
      }
      const dx = bestX - originalCenter.x;
      const dy = bestY - originalCenter.y;
      piece.x += dx;
      piece.y += dy;

      // 优化：仅在最终确定位置后偏移一次点集
      const pLen = piece.points.length;
      for (let j = 0; j < pLen; j++) {
        piece.points[j].x += dx;
        piece.points[j].y += dy;
      }

      const updatedBounds = this.calculateRotatedPieceBounds(piece);
      let correctionNeeded = false;
      let correctionDx = 0, correctionDy = 0;
      if (updatedBounds.minX < SAFE_BOUNDARY_MARGIN) {
        correctionDx = SAFE_BOUNDARY_MARGIN - updatedBounds.minX;
        correctionNeeded = true;
      } else if (updatedBounds.maxX > canvasWidth - SAFE_BOUNDARY_MARGIN) {
        correctionDx = canvasWidth - SAFE_BOUNDARY_MARGIN - updatedBounds.maxX;
        correctionNeeded = true;
      }
      if (updatedBounds.minY < SAFE_BOUNDARY_MARGIN) {
        correctionDy = SAFE_BOUNDARY_MARGIN - updatedBounds.minY;
        correctionNeeded = true;
      } else if (updatedBounds.maxY > canvasHeight - SAFE_BOUNDARY_MARGIN) {
        correctionDy = canvasHeight - SAFE_BOUNDARY_MARGIN - updatedBounds.maxY;
        correctionNeeded = true;
      }
      if (correctionNeeded) {
        piece.x += correctionDx;
        piece.y += correctionDy;
        for (let j = 0; j < pLen; j++) {
          piece.points[j].x += correctionDx;
          piece.points[j].y += correctionDy;
        }
        bestX += correctionDx;
        bestY += correctionDy;
      }
      // 记录已放置区域时使用旋转后的宽高，避免后续重叠检测误差
      placedPieceBounds.push({
        x: bestX - rotatedBounds.width / 2,
        y: bestY - rotatedBounds.height / 2,
        width: rotatedBounds.width,
        height: rotatedBounds.height
      });
    }
    const finalScatteredPieces = [...scatteredPieces];
    for (let i = 0; i < finalScatteredPieces.length; i++) {
      const piece = finalScatteredPieces[i];
      const pieceBounds = this.calculateRotatedPieceBounds(piece);
      let finalCorrectionNeeded = false;
      let finalCorrectionDx = 0, finalCorrectionDy = 0;
      if (pieceBounds.minX < SAFE_BOUNDARY_MARGIN) {
        finalCorrectionDx = SAFE_BOUNDARY_MARGIN - pieceBounds.minX;
        finalCorrectionNeeded = true;
      } else if (pieceBounds.maxX > canvasWidth - SAFE_BOUNDARY_MARGIN) {
        finalCorrectionDx = canvasWidth - SAFE_BOUNDARY_MARGIN - pieceBounds.maxX;
        finalCorrectionNeeded = true;
      }
      if (pieceBounds.minY < SAFE_BOUNDARY_MARGIN) {
        finalCorrectionDy = SAFE_BOUNDARY_MARGIN - pieceBounds.minY;
        finalCorrectionNeeded = true;
      } else if (pieceBounds.maxY > canvasHeight - SAFE_BOUNDARY_MARGIN) {
        finalCorrectionDy = canvasHeight - SAFE_BOUNDARY_MARGIN - pieceBounds.maxY;
        finalCorrectionNeeded = true;
      }
      if (finalCorrectionNeeded) {
        piece.x += finalCorrectionDx;
        piece.y += finalCorrectionDy;
        const pLen = piece.points.length;
        for (let j = 0; j < pLen; j++) {
          piece.points[j].x += finalCorrectionDx;
          piece.points[j].y += finalCorrectionDy;
        }
        const verifiedBounds = this.calculateRotatedPieceBounds(piece);
        if (
          verifiedBounds.minX < SAFE_BOUNDARY_MARGIN ||
          verifiedBounds.maxX > canvasWidth - SAFE_BOUNDARY_MARGIN ||
          verifiedBounds.minY < SAFE_BOUNDARY_MARGIN ||
          verifiedBounds.maxY > canvasHeight - SAFE_BOUNDARY_MARGIN
        ) {
          const centerX = canvasWidth / 2;
          const centerY = canvasHeight / 2;
          const centerDx = centerX - piece.x;
          const centerDy = centerY - piece.y;
          piece.x = centerX;
          piece.y = centerY;
          for (let jj = 0; jj < pLen; jj++) {
            piece.points[jj].x += centerDx;
            piece.points[jj].y += centerDy;
          }
        }
      }
    }
    return this.addBounceBackAnimation(finalScatteredPieces, canvasWidth, canvasHeight);
  }

  // 辅助函数：计算螺旋位置
  static getSpiralPosition(index: number, size: number): { x: number, y: number } {
    if (index === 0) return { x: Math.floor(size / 2), y: Math.floor(size / 2) }; // 中心点

    let layer = 1;
    while ((2 * layer + 1) * (2 * layer + 1) <= index) {
      layer++;
    }

    const layerStart = (2 * (layer - 1) + 1) * (2 * (layer - 1) + 1);
    const sideLength = 2 * layer + 1;
    const sidePosition = index - layerStart;
    const side = Math.floor(sidePosition / (sideLength - 1));
    const posInSide = sidePosition % (sideLength - 1);

    const centerOffset = Math.floor(size / 2);

    switch (side) {
      case 0: // 上边
        return { x: centerOffset - layer + posInSide, y: centerOffset - layer };
      case 1: // 右边
        return { x: centerOffset + layer, y: centerOffset - layer + posInSide };
      case 2: // 下边
        return { x: centerOffset + layer - posInSide, y: centerOffset + layer };
      case 3: // 左边
        return { x: centerOffset - layer, y: centerOffset + layer - posInSide };
      default:
        return { x: centerOffset, y: centerOffset };
    }
  }

  // 优化的位置分布算法，使拼图更加集中
  static getOptimizedPosition(index: number, size: number, offsetFactor: number = 0.3): { x: number, y: number } {
    // 中心点
    const centerX = (size - 1) / 2;
    const centerY = (size - 1) / 2;

    if (index === 0) return { x: centerX, y: centerY }; // 中心点

    // 计算极坐标 - 使用更小的半径使拼图更集中
    const angle = index * 0.7; // 黄金角度的近似值，避免拼图聚集
    const radius = Math.sqrt(index) * offsetFactor * (size / 3); // 降低半径计算，使分布更集中

    // 转换为笛卡尔坐标，并围绕中心点
    let x = centerX + radius * Math.cos(angle);
    let y = centerY + radius * Math.sin(angle);

    // 确保坐标在网格范围内
    x = Math.max(0, Math.min(size - 1, x));
    y = Math.max(0, Math.min(size - 1, y));

    return { x, y };
  }

  // 根据目标形状计算放置区域
  static generatePlacementAreas(
    canvasWidth: number,
    canvasHeight: number,
    targetShape: { x: number, y: number, width: number, height: number, center: { x: number, y: number }, radius: number } | null
  ): Array<{ x: number, y: number, width: number, height: number }> {
    // 安全边距只用于兜底，placementAreas 始终为全画布
    return [{
      x: 0,
      y: 0,
      width: canvasWidth,
      height: canvasHeight
    }];
  }

  // 帮助方法：考虑旋转计算拼图真实边界 (高性能单次遍历版本)
  static calculateRotatedPieceBounds(piece: PuzzlePiece) {
    const points = piece.points;
    const len = points.length;
    if (len === 0) return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0, centerX: 0, centerY: 0 };

    // 1. 如果没有旋转，单次遍历获取边界
    if (piece.rotation === 0) {
      let minX = points[0].x, maxX = points[0].x;
      let minY = points[0].y, maxY = points[0].y;
      for (let i = 1; i < len; i++) {
        const p = points[i];
        if (p.x < minX) minX = p.x; else if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y; else if (p.y > maxY) maxY = p.y;
      }
      return {
        minX, maxX, minY, maxY,
        width: maxX - minX,
        height: maxY - minY,
        centerX: (minX + maxX) / 2,
        centerY: (minY + maxY) / 2
      };
    }

    // 2. 如果有旋转，单次遍历获取原始中心，然后单次遍历计算旋转后的边界
    let oMinX = points[0].x, oMaxX = points[0].x;
    let oMinY = points[0].y, oMaxY = points[0].y;
    for (let i = 1; i < len; i++) {
      const p = points[i];
      if (p.x < oMinX) oMinX = p.x; else if (p.x > oMaxX) oMaxX = p.x;
      if (p.y < oMinY) oMinY = p.y; else if (p.y > oMaxY) oMaxY = p.y;
    }
    const centerX = (oMinX + oMaxX) / 2;
    const centerY = (oMinY + oMaxY) / 2;
    const radians = (piece.rotation * Math.PI) / 180;
    const cosR = Math.cos(radians);
    const sinR = Math.sin(radians);

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < len; i++) {
      const p = points[i];
      const dx = p.x - centerX;
      const dy = p.y - centerY;
      const rx = centerX + dx * cosR - dy * sinR;
      const ry = centerY + dx * sinR + dy * cosR;
      if (rx < minX) minX = rx; if (rx > maxX) maxX = rx;
      if (ry < minY) minY = ry; if (ry > maxY) maxY = ry;
    }

    return {
      minX, maxX, minY, maxY,
      width: maxX - minX,
      height: maxY - minY,
      centerX, centerY
    };
  }

  // 新增函数：检测边界超出并添加回弹动画信息
  static addBounceBackAnimation(
    pieces: PuzzlePiece[],
    canvasWidth: number,
    canvasHeight: number
  ): PuzzlePiece[] {
    // 兜底安全边距统一为10px
    const strictSafeMargin = 10;
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
    for (let i = 0; i < pieces.length; i++) {
      const piece = pieces[i];

      // 增强精度：计算拼图当前的边界（考虑旋转）- 已优化为单次遍历
      const finalBounds = this.calculateRotatedPieceBounds(piece);

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
        const pLen = piece.points.length;
        for (let j = 0; j < pLen; j++) {
          piece.points[j].x += correctionX;
          piece.points[j].y += correctionY;
        }

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
    for (let i = 0; i < pieces.length; i++) {
      const piece = pieces[i];

      // 如果已经标记了回弹，则跳过
      if (piece.needsBounceAnimation) continue;

      // 获取最终的拼图边界
      const bounds = this.calculateRotatedPieceBounds(piece);

      // 最终安全检查，minPadding是最小兜底安全边距，10px
      const minPadding = 10;

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

          const pLen = piece.points.length;
          for (let k = 0; k < pLen; k++) {
            piece.points[k].x += finalCorrectionX;
            piece.points[k].y += finalCorrectionY;
          }

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

    return pieces;
  }
}


