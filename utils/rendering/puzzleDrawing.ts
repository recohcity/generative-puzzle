// Path: utils/rendering/puzzleDrawing.ts
// Functions for drawing puzzle elements on a Canvas. 

import { calculateCenter } from "@/utils/geometry/puzzleGeometry"; // Import geometry helpers
import { appendAlpha } from "@/utils/rendering/colorUtils"; // Assuming appendAlpha is needed

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

// 定义 Point 接口 (从 PuzzleCanvas.tsx 迁移)
export interface Point {
  x: number;
  y: number;
  isOriginal?: boolean; // Add isOriginal property
}

// 绘制形状
export const drawShape = (ctx: CanvasRenderingContext2D, shape: Point[], shapeType: string) => {
  console.log(`开始绘制形状: ${shape.length}个点, 类型:${shapeType}`);
  
  if (shape.length === 0) {
    console.error('形状没有点，无法绘制');
    return;
  }
  
  // 记录画布尺寸
  console.log(`画布尺寸: ${ctx.canvas.width}x${ctx.canvas.height}`);
  
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
    console.log(`起始点: (${shape[0].x.toFixed(2)}, ${shape[0].y.toFixed(2)})`);
    
    // 移动到第一个点
    if (shape.length > 0) {
      ctx.moveTo(shape[0].x, shape[0].y);

      if (shapeType === "polygon") {
        // 多边形使用直线
        for (let i = 1; i < shape.length; i++) {
          ctx.lineTo(shape[i].x, shape[i].y);
          console.log(`线段到: (${shape[i].x.toFixed(2)}, ${shape[i].y.toFixed(2)})`);
        }
        
        // 闭合路径
        ctx.lineTo(shape[0].x, shape[0].y);
      } else {
        // 曲线形状和锯齿形状都使用贝塞尔曲线
        for (let i = 1; i < shape.length; i++) {
          const prev = shape[i - 1];
          const current = shape[i];
          const next = shape[(i + 1) % shape.length];

          // 使用二次贝塞尔曲线平滑连接点
          const midX = (prev.x + current.x) / 2;
          const midY = (prev.y + current.y) / 2;
          const nextMidX = (current.x + next.x) / 2;
          const nextMidY = (current.y + next.y) / 2;

          ctx.quadraticCurveTo(current.x, current.y, nextMidX, nextMidY);
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
      
      console.log('形状绘制完成');
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

  // 🎯 填充颜色：使用不透明的纯色，取消透明度
  // 根据是否已完成和是否有颜色属性设置填充颜色
  ctx.fillStyle = isCompleted 
    ? "#B8A9E8" // 🎯 已完成拼图使用浅蓝紫色，与背景冷色调同色系，更和谐美观
    : (piece.color || "#CCCCCC"); // 使用拼图的原始颜色，无透明度

  ctx.fill(); // 填充当前路径

  // --------- 叠加瓷砖气孔纹理 ---------
  try {
    // 只加载一次图片
    if (!(window as any)._puzzleTextureImg) {
      const img = new window.Image();
      img.src = '/texture-tile.png';
      (window as any)._puzzleTextureImg = img;
    }
    const textureImg = (window as any)._puzzleTextureImg;
    if (textureImg.complete) {
      ctx.save();
      ctx.globalAlpha = 0.28; // 纹理透明度
      ctx.globalCompositeOperation = 'multiply'; // 让黑色气孔叠加到主色
      const pattern = ctx.createPattern(textureImg, 'repeat');
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.beginPath();
        ctx.moveTo(piece.points[0].x, piece.points[0].y);
        for (let i = 1; i < piece.points.length; i++) {
          const prev = piece.points[i - 1];
          const current = piece.points[i];
          const next = piece.points[(i + 1) % piece.points.length];
          if (shapeType !== "polygon" && current.isOriginal !== false) {
            const midX = (prev.x + current.x) / 2;
            const midY = (prev.y + current.y) / 2;
            const nextMidX = (current.x + next.x) / 2;
            const nextMidY = (current.y + next.y) / 2;
            ctx.quadraticCurveTo(current.x, current.y, nextMidX, nextMidY);
          } else {
            ctx.lineTo(current.x, current.y);
          }
        }
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;
      ctx.globalCompositeOperation = 'source-over';
      ctx.restore();
    }
  } catch (e) { /* ignore */ }
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
  shapeType?: string, // 🔧 添加形状类型参数，确保提示轮廓与拼图形状一致
  hintText?: string // 添加提示文本参数
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

  ctx.beginPath();
  ctx.moveTo(piece.points[0].x, piece.points[0].y);

  // 🔧 修复：根据形状类型绘制正确的轮廓，确保与拼图形状一致
  for (let i = 1; i < piece.points.length; i++) {
    const prev = piece.points[i - 1];
    const current = piece.points[i];
    const next = piece.points[(i + 1) % piece.points.length];

    // 🎯 使用与拼图绘制完全相同的逻辑：只要当前点是原始点，就使用曲线
    if (shapeType !== "polygon" && current.isOriginal !== false) {
      // 🔧 对于曲线形状，只要当前点是原始点（或未定义），就使用贝塞尔曲线
      const midX = (prev.x + current.x) / 2;
      const midY = (prev.y + current.y) / 2;
      const nextMidX = (current.x + next.x) / 2;
      const nextMidY = (current.y + next.y) / 2;

      ctx.quadraticCurveTo(current.x, current.y, nextMidX, nextMidY);
    } else {
      // 对于多边形和切割线（isOriginal: false），使用直线
      ctx.lineTo(current.x, current.y);
    }
  }

  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 添加"放在这里"的文本提示
  const bounds = piece.points.reduce(
    (acc: {minX: number, maxX: number, minY: number, maxY: number}, point: Point) => ({
      minX: Math.min(acc.minX, point.x),
      maxX: Math.max(acc.maxX, point.x),
      minY: Math.min(acc.minY, point.y),
      maxY: Math.max(acc.maxY, point.y)
    }),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  );

  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;

  // 文字使用白色加黑色阴影，确保在任何背景下都清晰可见
  ctx.fillStyle = "white";
  ctx.font = "bold 16px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  
  // 添加黑色阴影使文字在任何背景下都清晰可见
  ctx.shadowColor = "black";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  
  // 只需绘制一次文字，阴影会自动应用
  ctx.fillText(hintText || "这里", centerX, centerY);
  
  // 重置阴影效果，避免影响其他绘制
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

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
    (acc: {minX: number, maxX: number, minY: number, maxY: number}, point: Point) => ({
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
  completionText?: string // 添加完成文本参数
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
      // 多边形使用直线
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
    
    // 使用纯色填充，不使用半透明
    const fillColor = "#F26419";
    
    // 先填充纯色
    ctx.fillStyle = fillColor;
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.fill();

    // --------- 叠加瓷砖气孔纹理 ---------
    try {
      if (!(window as any)._puzzleTextureImg) {
        const img = new window.Image();
        img.src = '/texture-tile.png';
        (window as any)._puzzleTextureImg = img;
      }
      const textureImg = (window as any)._puzzleTextureImg;
      if (textureImg.complete) {
        ctx.save();
        ctx.globalAlpha = 0.28;
        ctx.globalCompositeOperation = 'multiply';
        const pattern = ctx.createPattern(textureImg, 'repeat');
        if (pattern) {
          ctx.fillStyle = pattern;
          ctx.beginPath();
          ctx.moveTo(originalShape[0].x, originalShape[0].y);
          for (let i = 1; i < originalShape.length; i++) {
            const prev = originalShape[i - 1];
            const current = originalShape[i];
            const next = originalShape[(i + 1) % originalShape.length];
            if (shapeType !== "polygon" && current.isOriginal !== false) {
              const midX = (prev.x + current.x) / 2;
              const midY = (prev.y + current.y) / 2;
              const nextMidX = (current.x + next.x) / 2;
              const nextMidY = (current.y + next.y) / 2;
              ctx.quadraticCurveTo(current.x, current.y, nextMidX, nextMidY);
            } else {
              ctx.lineTo(current.x, current.y);
            }
          }
          ctx.closePath();
          ctx.fill();
        }
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = 'source-over';
        ctx.restore();
      }
    } catch (e) { /* ignore */ }
    // --------- END 材质纹理 ---------

    // 绘制完成效果
    drawCompletionEffect(ctx, originalShape, shapeType);

    // 绘制完成文本 - 使用更精确的字体堆栈和多层渲染技术，增强视觉效果
    // Calculate bounds for text positioning (re-calculating here for clarity, could pass from above)
    const bounds = originalShape.reduce(
      (acc: {minX: number, maxX: number, minY: number, maxY: number}, point: Point) => ({
        minX: Math.min(acc.minX, point.x),
        maxX: Math.max(acc.maxX, point.x),
        minY: Math.min(acc.minY, point.y),
        maxY: Math.max(acc.maxY, point.y)
      }),
      { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
    );

    const centerX = (bounds.minX + bounds.maxX) / 2; // 形状中心X坐标
    
    const fontSize = Math.min(36, Math.max(24, ctx.canvas.width / 15)); // 根据画布宽度自适应字体大小，确保在不同屏幕尺寸下都合适
    ctx.font = `bold ${fontSize}px 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'STHeiti', 'SimHei', 'WenQuanYi Micro Hei', sans-serif`; // 设置字体样式，包含多种中文字体以提高兼容性
    ctx.textAlign = "center"; // 文本水平居中对齐
    ctx.textBaseline = "middle"; // 文本垂直居中对齐
    
    // 文本位置 - 移到形状上方，避免遮挡，并确保不会超出画布顶部
    const textY = bounds.minY - 40; // 文本基础Y坐标，在形状 minY 上方40像素
    const finalY = Math.max(50, textY); // 确保文本不会太靠近顶部边缘，最小Y坐标为50
    const completeText = completionText || "你好犀利吖!"; // 游戏完成时显示的文本内容
    
    // 多层渲染技术，通过绘制多次叠加不同样式来创建复杂的文本效果
    // 1. 外发光效果 - 较大模糊，作为文本底层的辉光，使文本看起来更醒目
    ctx.save(); // Save state before applying text styles
    ctx.shadowColor = "rgba(255, 140, 0, 0.7)"; // 橙色发光颜色，半透明效果
    ctx.shadowBlur = 12; // 较大的模糊半径，创建柔和的发光效果
    ctx.shadowOffsetX = 0; // 水平方向无偏移
    ctx.shadowOffsetY = 0; // 垂直方向无偏移
    ctx.fillStyle = "rgba(255, 215, 0, 0.4)"; // 半透明金色作为发光填充色，与橙色阴影叠加产生层次感
    ctx.fillText(completeText, centerX, finalY); // 绘制带发光的文本
    
    // 2. 描边阴影 - 增加文本的深度感和立体感，使文本边缘更清晰
    ctx.shadowColor = "rgba(0, 0, 0, 0.7)"; // 黑色阴影颜色，提供深度
    ctx.shadowBlur = 3; // 较小的模糊半径，创建清晰的阴影边缘
    ctx.shadowOffsetX = 2; // 水平偏移
    ctx.shadowOffsetY = 2; // 垂直偏移
    ctx.strokeStyle = "#FF7700"; // 亮橙色作为描边颜色，与主体文字颜色形成对比
    ctx.lineWidth = Math.max(3, fontSize / 12); // 根据字体大小比例设置描边宽度，确保描边粗细适中
    ctx.strokeText(completeText, centerX, finalY); // 绘制带阴影的描边文本
    
    // 3. 清除阴影，绘制主体文字，确保主体文字清晰不受阴影影响
    ctx.shadowColor = "transparent"; // 将阴影颜色设为透明，移除阴影效果
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // 4. 渐变填充效果 - 使主体文字具有更丰富的色彩层次和质感
    const textGradient = ctx.createLinearGradient(
      centerX, finalY - fontSize/2, // 渐变起始点 (文本顶部中心)
      centerX, finalY + fontSize/2 // 渐变结束点 (文本底部中心)
    );
    textGradient.addColorStop(0, "#FFD700"); // 金色顶部，起始颜色
    textGradient.addColorStop(0.5, "#FFCC00"); // 中间色，黄色
    textGradient.addColorStop(1, "#FF9500"); // 橙色底部，结束颜色
    ctx.fillStyle = textGradient; // 应用创建的渐变填充样式
    ctx.fillText(completeText, centerX, finalY); // 绘制渐变填充的主体文本

    ctx.restore(); // Restore state after applying text styles

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