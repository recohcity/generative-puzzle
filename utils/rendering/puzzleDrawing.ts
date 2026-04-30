// Path: utils/rendering/puzzleDrawing.ts
// Functions for drawing puzzle elements on a Canvas. 

import { calculateCenter, Point } from "@generative-puzzle/game-core"; // Import geometry helpers
import { appendAlpha } from "@/utils/rendering/colorUtils"; // Assuming appendAlpha is needed
import { textureCache } from "@/utils/rendering/TextureCache";
// 使用统一的类型定义

// 定义类型 (从 PuzzleCanvas.tsx 迁移)
export interface PuzzlePiece { // Export the interface
  points: Point[];
  originalPoints: Point[];
  rotation: number;
  originalRotation: number;
  x: number;
  y: number;
  originalX: number;
  originalY: number;
  color?: string;
}

// 绘制形状
export const drawShape = (ctx: CanvasRenderingContext2D, shape: Point[], shapeType: string) => {
  // 开始绘制形状: ${shape.length}个点, 类型:${shapeType}

  if (shape.length === 0) {
    console.error('形状没有点，无法绘制');
    return;
  }

  // 记录画布尺寸: ${ctx.canvas.width}x${ctx.canvas.height}

  // 先清除画布
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // 使用更鲜明的填充颜色，确保在画布上可见
  ctx.fillStyle = "rgba(45, 55, 72, 0.6)";
  ctx.strokeStyle = "rgba(203, 213, 225, 0.8)";
  ctx.lineWidth = 2;

  try {
    // 绘制路径
    ctx.beginPath();

    // 记录第一个点
    if (shape.length > 2) {
      if (shapeType === "polygon") {
        ctx.moveTo(shape[0].x, shape[0].y);
        for (let i = 1; i < shape.length; i++) {
          ctx.lineTo(shape[i].x, shape[i].y);
        }
      } else {
        // 曲线形状和锯齿形状都使用二次贝塞尔曲线
        // 逻辑必须与 NetworkCutter.discretizeShape 严格一致
        const last = shape[shape.length - 1];
        const first = shape[0];

        // 1. 起点：最后一点与第一点的中点
        ctx.moveTo((last.x + first.x) / 2, (last.y + first.y) / 2);

        // 2. 循环绘制：中点 -> 点[i](控制点) -> 中点(点[i], 点[i+1])
        for (let i = 0; i < shape.length; i++) {
          const p1 = shape[i];
          const p2 = shape[(i + 1) % shape.length];
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
        }
      }
      ctx.closePath();
      ctx.fill();

      // 添加轻微发光效果
      ctx.shadowColor = "rgba(255, 255, 255, 0.4)";
      ctx.shadowBlur = 15;
      ctx.stroke();

      // 重置阴影
      ctx.shadowBlur = 0;

      // 形状绘制完成
    } else {
      console.error('没有点可绘制');
    }
  } catch (error: any) {
    console.error('绘制过程中发生错误:', error);
  }
};

// 绘制单个拼图片段
export const drawPiece = (
  ctx: CanvasRenderingContext2D, // Canvas 2D 渲染上下文
  piece: PuzzlePiece, // 当前要绘制的拼图片段数据
  index: number, // 拼图片段的索引
  isCompleted: boolean, // 拼图片段是否已完成并吸附到目标位置
  isSelected: boolean, // 拼图片段当前是否被用户选中/拖动
  shapeType: string, // 形状类型 ('polygon' 或 'curve')
  isScattered: boolean = false // 游戏是否处于拼图散开的状态
) => {
  // 计算中心点用于旋转
  const center = calculateCenter(piece.points);

  ctx.save();

  // 应用旋转变换：先平移到中心点，旋转，再平移回来
  ctx.translate(center.x, center.y);
  ctx.rotate((piece.rotation * Math.PI) / 180);
  ctx.translate(-center.x, -center.y);

  // 🎯 优化触控体验：只有被选中的拼图才显示阴影，未点击的拼图默认无阴影
  // 仅当拼图已散开、未完成且被选中时才绘制阴影，增强触控反馈
  if (isScattered && !isCompleted && isSelected) {
    ctx.save(); // 保存当前状态，用于绘制阴影形状
    ctx.beginPath(); // 开始新的路径
    ctx.moveTo(piece.points[0].x, piece.points[0].y);

    // 遍历拼图的所有点，绘制形状路径
    for (let i = 1; i < piece.points.length; i++) {
      const prev = piece.points[i - 1];
      const current = piece.points[i];
      const next = piece.points[(i + 1) % piece.points.length];

      if (shapeType !== "polygon" && current.isOriginal !== false) {
        // 对于曲线形状和锯齿形状，使用二次贝塞尔曲线保持平滑
        const midX = (prev.x + current.x) / 2;
        const midY = (prev.y + current.y) / 2;
        const nextMidX = (current.x + next.x) / 2;
        const nextMidY = (current.y + next.y) / 2;

        ctx.quadraticCurveTo(current.x, current.y, nextMidX, nextMidY);
      } else {
        // 对于多边形和切割线，使用直线
        ctx.lineTo(current.x, current.y);
      }
    }

    ctx.closePath();

    // 🎯 增强选中状态的阴影效果，让触控反馈更强烈
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'; // 更深的阴影颜色，增强视觉反馈
    ctx.shadowBlur = 20; // 更大的阴影模糊半径，让选中效果更明显
    ctx.shadowOffsetX = 8; // 增大水平偏移，增强立体感
    ctx.shadowOffsetY = 8; // 增大垂直偏移，增强立体感

    // 填充形状以显示阴影效果（阴影是绘制在填充形状下方的）
    // 🎯 使用不透明的纯色填充，取消透明度
    ctx.fillStyle = piece.color || "#CCCCCC";

    ctx.fill(); // 填充当前路径
    ctx.restore(); // 恢复之前保存的绘图状态，取消阴影设置
  }

  // 绘制拼图的主体路径（在阴影上方）
  ctx.beginPath(); // 开始新的路径
  ctx.moveTo(piece.points[0].x, piece.points[0].y);

  for (let i = 1; i < piece.points.length; i++) {
    const prev = piece.points[i - 1];
    const current = piece.points[i];
    const next = piece.points[(i + 1) % piece.points.length];

    if (shapeType !== "polygon" && current.isOriginal !== false) {
      // 对于曲线形状和锯齿形状，使用二次贝塞尔曲线
      const midX = (prev.x + current.x) / 2;
      const midY = (prev.y + current.y) / 2;
      const nextMidX = (current.x + next.x) / 2;
      const nextMidY = (current.y + next.y) / 2;

      ctx.quadraticCurveTo(current.x, current.y, nextMidX, nextMidY);
    } else {
      // 对于多边形和切割线，使用直线
      ctx.lineTo(current.x, current.y);
    }
  }

  ctx.closePath();

  // 🎯 填充颜色：根据是否已完成和是否有颜色属性设置填充颜色
  const currentFillColor = isCompleted
    ? "#B8A9E8" // 🎯 已完成拼图使用浅蓝紫色
    : (piece.color || "#CCCCCC"); // 使用拼图的原始颜色

  // --------- 叠加瓷砖气孔纹理 (已优化为基于缓存的 AOT 模式) ---------
  try {
    // 异步触发初始化（仅首次）
    textureCache.initStack(); 

    const cached = textureCache.getPiece(
      index, 
      piece.points, 
      currentFillColor, 
      shapeType, 
      isCompleted
    );

    let minX = Infinity;
    let minY = Infinity;
    for (const p of piece.points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
    }

    if (cached.valid) {
      // 这里的 piece.points 是未旋转的基准点
      // 我们在外部已经应用了 ctx.rotate，所以直接绘制即可
      ctx.drawImage(
        cached.canvas, 
        minX - cached.offsetX,
        minY - cached.offsetX
      );
    }
  } catch (e) {
    console.error("[drawPiece] Texture cache error:", e);
    // 回退到原色填充（已经在上面做了）
  }
  // --------- END 材质纹理 ---------

  // 🎯 优化边框绘制：去掉选中拼图的橙色外轮廓，保持简洁
  if (!isCompleted) {
    if (isSelected) {
      // 🎯 选中拼图块：不绘制任何边框，只通过阴影来表示选中状态
      // 完全去掉橙色外轮廓边框
    } else if (isScattered) {
      // 🎯 散开状态下未选中拼图：完全不绘制轮廓线，保持简洁
      // 不画任何轮廓线，让未选中的拼图看起来更平整
    } else {
      // 其它情况（如未散开时）保持原有轻微轮廓，但进一步减弱
      ctx.strokeStyle = "rgba(255,255,255,0.2)"; // 进一步降低透明度
      ctx.setLineDash([]);
      ctx.lineWidth = 1; // 减小线宽
      ctx.stroke();
    }
  }

  ctx.restore();
};

// 改进提示轮廓显示
export const drawHintOutline = (
  ctx: CanvasRenderingContext2D,
  piece: PuzzlePiece, // Changed to take the puzzle piece object
  shapeType?: string // 🔧 添加形状类型参数，确保提示轮廓与拼图形状一致
) => {
  if (!piece) return;

  ctx.save();

  // 使用固定透明度，移除闪烁效果
  // 绿色轮廓线
  ctx.strokeStyle = "rgba(0, 255, 0, 0.8)";
  // 绿色半透明填充
  ctx.fillStyle = "rgba(0, 255, 0, 0.25)";
  ctx.setLineDash([5, 5]);
  ctx.lineWidth = 4;

  ctx.beginPath(); // Add beginPath here to ensure new path

  if (shapeType === "polygon") {
    ctx.moveTo(piece.points[0].x, piece.points[0].y);
    for (let i = 1; i < piece.points.length; i++) {
      ctx.lineTo(piece.points[i].x, piece.points[i].y);
    }
  } else {
    // 提示轮廓也必须遵循相同的曲线逻辑
    const last = piece.points[piece.points.length - 1];
    const first = piece.points[0];

    // 如果这些点包含切割产生的点 (isOriginal === false)，它们是离散化的直线段
    // 只有全是原始点时才应用平滑。但为了保险，我们检查每个点的性质。
    // 在 NetworkCutter 中，离散化后的形状点 isOriginal 通常为 true。
    const hasCutPoints = piece.points.some(p => p.isOriginal === false);

    if (hasCutPoints) {
      // 包含切割点，直接连线 (因为它已经是由 cutter 处理过的多边形)
      ctx.moveTo(piece.points[0].x, piece.points[0].y);
      for (let i = 1; i < piece.points.length; i++) {
        ctx.lineTo(piece.points[i].x, piece.points[i].y);
      }
    } else {
      // 全是原始点，应用二次贝塞尔平滑
      ctx.moveTo((last.x + first.x) / 2, (last.y + first.y) / 2);
      for (let i = 0; i < piece.points.length; i++) {
        const p1 = piece.points[i];
        const p2 = piece.points[(i + 1) % piece.points.length];
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
      }
    }
  }

  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
};

// 修改完成效果，更简洁不遮挡拼图
export const drawCompletionEffect = (
  ctx: CanvasRenderingContext2D, // Canvas 2D 渲染上下文
  shape: Point[], // 完成形状的顶点数组
  shapeType: string // 形状类型 ('polygon' 或 'curve')
) => {
  ctx.save(); // 保存当前绘图状态，以便后续恢复

  // 计算形状的边界框，用于定位效果和阴影尺寸计算
  const bounds = shape.reduce(
    (acc: { minX: number, maxX: number, minY: number, maxY: number }, point: Point) => ({
      minX: Math.min(acc.minX, point.x),
      maxX: Math.max(acc.maxX, point.x),
      minY: Math.min(acc.minY, point.y),
      maxY: Math.max(acc.maxY, point.y)
    }),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  );

  const centerX = (bounds.minX + bounds.maxX) / 2; // 形状中心X坐标
  const centerY = (bounds.minY + bounds.maxY) / 2; // 形状中心Y坐标

  // 绘制水平压扁的椭圆阴影，制造悬浮效果
  ctx.save(); // 保存当前状态以便应用变换

  // 计算阴影尺寸 - 宽度稍大于形状本身
  const shapeWidth = bounds.maxX - bounds.minX;
  const shadowWidthRadius = shapeWidth * 0.65;  // 控制阴影的宽度半径，占形状宽度的比例
  const shadowHeightRadius = shapeWidth * 0.2;  // 高度比宽度小很多，创造扁平效果

  // 阴影的位置 - 在形状下方，增加与拼图的距离
  const shadowX = centerX; // 阴影中心X坐标与形状中心一致
  const shadowY = bounds.maxY + shadowHeightRadius * 1.5;  // 阴影中心Y坐标在形状底部下方一定距离

  // 创建径向渐变，使阴影从中心向外逐渐消失，实现羽化效果
  const gradient = ctx.createRadialGradient(
    shadowX, shadowY, 0, // 渐变起始圆（中心点，半径0）
    shadowX, shadowY, shadowWidthRadius // 渐变结束圆（中心点，半径等于阴影宽度半径）
  );

  // 精细调整渐变过渡，中心稍黑但保持良好羽化
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');   // 渐变中心颜色和透明度
  gradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.15)'); // 内部区域过渡颜色和透明度
  gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.05)'); // 外围区域过渡颜色和透明度
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');      // 边缘完全透明

  // 保存当前状态以便应用变换 (压扁阴影)
  ctx.save();

  // 设置变换矩阵使圆形在垂直方向压扁（扁平比例约0.3），绘制出椭圆阴影
  ctx.translate(shadowX, shadowY); // 平移到阴影中心
  ctx.scale(1, 0.3);  // Y轴缩放为原来的0.3倍，创造扁平椭圆
  ctx.translate(-shadowX, -shadowY); // 平移回原点

  // 应用渐变填充绘制阴影
  ctx.fillStyle = gradient; // 设置填充样式为创建的渐变
  ctx.beginPath(); // 开始绘制路径
  ctx.arc(shadowX, shadowY, shadowWidthRadius, 0, Math.PI * 2); // 绘制一个圆形 (将被压扁成椭圆)
  ctx.fill(); // 填充路径

  ctx.restore(); // 恢复到应用压扁变换之前的状态
  ctx.restore(); // 恢复到应用阴影绘制之前的状态
};

// 绘制画布边缘警戒线 (调试功能)
export const drawCanvasBorderLine = (
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  showDebugElements: boolean // Pass debug state as parameter
) => {
  if (!showDebugElements) return; // 只在调试模式下显示

  // 保存当前绘图状态
  ctx.save();

  // 设置警戒线样式 - 红色虚线
  ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 5]);

  // 绘制内边框（警戒线）- 距离画布边缘1像素
  ctx.beginPath();
  ctx.rect(1, 1, canvasWidth - 2, canvasHeight - 2); // Use passed dimensions
  ctx.stroke();

  // 恢复绘图状态
  ctx.restore();
};

// 绘制可分布区域 (调试功能)
export const drawDistributionArea = (
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  showDebugElements: boolean // Pass debug state as parameter
) => {
  if (!showDebugElements) return; // 只在调试模式下显示

  // 保存当前绘图状态
  ctx.save();

  // 获取当前在ScatterPuzzle中使用的边距
  // 模拟计算边距的逻辑 (simplified for drawing visualization)
  // This part might need refinement based on actual ScatterPuzzle logic
  const isSmallScreen = canvasWidth < 400 || canvasHeight < 400; // Use passed dimensions

  let margin;
  // Simplified margin calculation for drawing visualization
  if (isSmallScreen) {
    margin = Math.min(20, Math.floor(canvasWidth * 0.03));
  } else {
    margin = Math.min(30, Math.floor(canvasWidth * 0.03));
  }

  // 小边距区域（用于拼图放置边界）
  const minMargin = 5;

  // 绘制安全放置区域（淡绿色）
  ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
  ctx.fillRect(margin, margin, canvasWidth - margin * 2, canvasHeight - margin * 2); // Use passed dimensions

  // 绘制较小放置边界区域（淡黄色）
  ctx.fillStyle = 'rgba(255, 255, 0, 0.1)';
  ctx.fillRect(minMargin, minMargin, canvasWidth - minMargin * 2, canvasHeight - minMargin * 2); // Use passed dimensions

  // 恢复绘图状态
  ctx.restore();
};

export const drawPuzzle = (
  ctx: CanvasRenderingContext2D, // Canvas 2D 渲染上下文
  pieces: PuzzlePiece[], // 所有拼图片段的数据数组
  completedPieces: number[], // 已完成拼图片段的索引数组
  selectedPiece: number | null, // 当前选中的拼图片段索引 (或 null)
  shapeType: string, // 形状类型 ('polygon' 或 'curve')
  originalShape?: Point[], // 原始形状的顶点数组 (用于显示轮廓或完成状态)
  isScattered: boolean = false, // 游戏是否处于拼图散开的状态
  tilt: { rx: number; ry: number } = { rx: 0, ry: 0 } // Tilt status for glaze effect
) => {
  // 清除整个画布，准备重新绘制
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // 检查是否所有拼图都已完成
  const isAllCompleted = completedPieces.length === pieces.length;

  if (isAllCompleted && originalShape && originalShape.length > 0) {
    // 如果所有拼图都完成，使用原始形状绘制一个完整的形状，避免拼图间的缝隙
    ctx.beginPath();
    ctx.moveTo(originalShape[0].x, originalShape[0].y);

    if (shapeType === "polygon") {
      ctx.moveTo(originalShape[0].x, originalShape[0].y);
      for (let i = 1; i < originalShape.length; i++) {
        ctx.lineTo(originalShape[i].x, originalShape[i].y);
      }
    } else {
      const last = originalShape[originalShape.length - 1];
      const first = originalShape[0];
      ctx.moveTo((last.x + first.x) / 2, (last.y + first.y) / 2);
      for (let i = 0; i < originalShape.length; i++) {
        const p1 = originalShape[i];
        const p2 = originalShape[(i + 1) % originalShape.length];
        ctx.quadraticCurveTo(p1.x, p1.y, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
      }
    }
    ctx.closePath();

    // 使用纯色填充，不使用半透明
    const fillColor = "#F26419";

    // 先填充纯色
    ctx.fillStyle = fillColor;
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.fill();

    // --------- 叠加瓷砖气孔纹理 (全量完成态缓存优化) ---------
    try {
      const cachedFull = textureCache.getPiece(
        -1, // 特殊索引代表全量形状
        originalShape, 
        fillColor, 
        shapeType, 
        true
      );

      if (cachedFull.valid) {
        let minX = Infinity;
        let minY = Infinity;
        for (const p of originalShape) {
          if (p.x < minX) minX = p.x;
          if (p.y < minY) minY = p.y;
        }
        ctx.drawImage(
          cachedFull.canvas, 
          minX - cachedFull.offsetX,
          minY - cachedFull.offsetX
        );
      }
    } catch (e) {
      console.error("[drawPuzzle] Full texture cache error:", e);
    }
    // --------- END 材质纹理 ---------

    // --------- 4. 绘制全息流光质感 (Holographic Glaze) ---------
    if (tilt.rx !== 0 || tilt.ry !== 0) {
      ctx.save();
      ctx.globalCompositeOperation = "source-atop"; // 仅在已有像素上绘制（即形状内部）
      
      const bounds = originalShape.reduce(
        (acc, point) => ({
          minX: Math.min(acc.minX, point.x),
          maxX: Math.max(acc.maxX, point.x),
          minY: Math.min(acc.minY, point.y),
          maxY: Math.max(acc.maxY, point.y)
        }),
        { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
      );
      
      const cx = (bounds.minX + bounds.maxX) / 2;
      const cy = (bounds.minY + bounds.maxY) / 2;
      const radius = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);

      // 计算高光位置偏移（基于倾斜角度的反馈）
      const highlightX = cx + (tilt.ry / 35) * radius * 0.8;
      const highlightY = cy + (tilt.rx / 35) * radius * 0.8;

      const glazeGradient = ctx.createRadialGradient(
        highlightX, highlightY, 0,
        highlightX, highlightY, radius * 1.5
      );

      // 流光渐变色（块状高光），调整透明度确保不遮挡材质
      glazeGradient.addColorStop(0, "rgba(255, 255, 255, 0.3)"); // 中心最亮但保持半透明
      glazeGradient.addColorStop(0.3, "rgba(255, 255, 255, 0.1)");
      glazeGradient.addColorStop(0.8, "rgba(255, 255, 255, 0)");
      glazeGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

      ctx.fillStyle = glazeGradient;
      ctx.beginPath();
      // 覆盖整个形状的矩形
      ctx.rect(bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
      ctx.fill();

      ctx.restore();
    }

    // 绘制底部的阴影悬浮效果
    drawCompletionEffect(ctx, originalShape, shapeType);

  } else {
    // 1. 先绘制目标形状（如有）- 修复：不论是否散开都显示目标形状轮廓
    if (originalShape && originalShape.length > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(originalShape[0].x, originalShape[0].y);
      if (shapeType === "polygon") {
        originalShape.forEach((point) => {
          ctx.lineTo(point.x, point.y);
        });
      } else {
        // 曲线形状和锯齿形状都使用贝塞尔曲线
        for (let i = 1; i < originalShape.length; i++) {
          const prev = originalShape[i - 1];
          const current = originalShape[i];
          const next = originalShape[(i + 1) % originalShape.length];
          const midX = (prev.x + current.x) / 2;
          const midY = (prev.y + current.y) / 2;
          const nextMidX = (current.x + next.x) / 2;
          const nextMidY = (current.y + next.y) / 2;
          ctx.quadraticCurveTo(current.x, current.y, nextMidX, nextMidY);
        }
      }
      ctx.closePath();
      ctx.fillStyle = "rgba(45, 55, 72, 0.6)";
      ctx.strokeStyle = "rgba(203, 213, 225, 0.8)";
      ctx.lineWidth = 2.;
      ctx.fill();
      ctx.restore();
    }

    // 2. 再绘制所有已完成拼图
    const piecesWithOriginalIndex = pieces.map((piece, index) => ({ piece, originalIndex: index }));

    const completedPiecesWithIndex = piecesWithOriginalIndex.filter(
      ({ originalIndex }) => completedPieces.includes(originalIndex)
    );

    completedPiecesWithIndex
      .forEach(({ piece, originalIndex }) => {
        drawPiece(ctx, piece, originalIndex, true, false, shapeType, isScattered);
      });

    // 3. 最后绘制所有未完成拼图（未选中的先，选中的最后）
    const uncompletedPiecesWithIndex = piecesWithOriginalIndex.filter(
      ({ originalIndex }) => !completedPieces.includes(originalIndex)
    );

    uncompletedPiecesWithIndex
      .filter(({ originalIndex }) => selectedPiece === null || originalIndex !== selectedPiece)
      .forEach(({ piece, originalIndex }) => {
        drawPiece(ctx, piece, originalIndex, false, false, shapeType, isScattered);
      });
    if (selectedPiece !== null && !completedPieces.includes(selectedPiece)) {
      const piece = pieces[selectedPiece];
      drawPiece(ctx, piece, selectedPiece, false, true, shapeType, isScattered);
    }
  }
};

// ... existing code ... 
/**
 * 🎯 
绘制画布中心红色+ (F10调试功能)
 * 用于验证形状是否正确居中
 */
export const drawCanvasCenter = (
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  showDebugElements: boolean
) => {
  if (!showDebugElements) return;

  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  const crossSize = 20; // +号的大小

  ctx.save();
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 3;
  ctx.setLineDash([]); // 实线

  // 绘制红色+
  ctx.beginPath();
  // 水平线
  ctx.moveTo(centerX - crossSize, centerY);
  ctx.lineTo(centerX + crossSize, centerY);
  // 垂直线
  ctx.moveTo(centerX, centerY - crossSize);
  ctx.lineTo(centerX, centerY + crossSize);
  ctx.stroke();

  ctx.restore();
};

/**
 * 🎯 绘制形状中心黑色+ (F10调试功能)
 * 用于验证形状中心位置
 */
export const drawShapeCenter = (
  ctx: CanvasRenderingContext2D,
  shape: Point[],
  showDebugElements: boolean
) => {
  if (!showDebugElements || !shape || shape.length === 0) return;

  // 计算形状中心
  const bounds = shape.reduce(
    (acc, point) => ({
      minX: Math.min(acc.minX, point.x),
      minY: Math.min(acc.minY, point.y),
      maxX: Math.max(acc.maxX, point.x),
      maxY: Math.max(acc.maxY, point.y),
    }),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  );

  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  const crossSize = 15; // +号的大小

  ctx.save();
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 4;
  ctx.setLineDash([]); // 实线

  // 绘制黑色+
  ctx.beginPath();
  // 水平线
  ctx.moveTo(centerX - crossSize, centerY);
  ctx.lineTo(centerX + crossSize, centerY);
  // 垂直线
  ctx.moveTo(centerX, centerY - crossSize);
  ctx.lineTo(centerX, centerY + crossSize);
  ctx.stroke();

  ctx.restore();
};