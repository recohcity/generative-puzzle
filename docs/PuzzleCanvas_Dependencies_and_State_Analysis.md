# PuzzleCanvas.tsx 依赖关系和状态分析

本文件详细梳理了 `components/PuzzleCanvas.tsx` 文件中的内部函数调用关系、与外部文件的依赖关系，以及关键变量和状态的追踪。这份分析旨在为后续的代码重构提供清晰的蓝图。

---

## 1. 依赖图谱绘制 (文本描述)

以下是 `PuzzleCanvas.tsx` 内部函数之间的调用关系，以及它与 `GameContext` 和 `utils` 目录下其他文件的依赖关系。

### `PuzzleCanvas` (主组件函数)

*   **使用的 React Hooks**: `useEffect`, `useRef`, `useState`
*   **调用的外部 Hook**: `useGame` (来自 `@/contexts/GameContext`)
*   **调用的内部辅助函数**:
    *   `setInitialCanvasSize`
    *   `handleResize`
    *   `updatePositions`
    *   `handleMouseDown`
    *   `handleMouseMove`
    *   `handleMouseUp`
    *   `handleTouchStart`
    *   `handleTouchMove`
    *   `handleTouchEnd`
    *   `handleKeyDown`
    *   `handleOrientationChange`
*   **直接渲染的 Canvas 元素**: `canvasRef`, `backgroundCanvasRef`

### 内部辅助函数 (当前位于 `PuzzleCanvas.tsx` 中)

*   `calculateCenter(points: Point[])`
    *   **被调用方**: `drawPuzzle`, `drawPiece`, `drawHintOutline`, `handleMouseMove`, `handleMouseUp`, `handleTouchStart`, `handleTouchMove`, `handleTouchEnd`
*   `isPointInPolygon(x: number, y: number, polygon: Point[])`
    *   **被调用方**: `handleMouseDown`, `handleTouchStart`
*   `rotatePoint(x: number, y: number, cx: number, cy: number, angle: number)`
    *   **被调用方**: `handleMouseDown`, `handleTouchStart`
*   `calculateAngle(x1: number, y1: number, x2: number, y2: number)`
    *   **被调用方**: `handleTouchStart`, `handleTouchMove`
*   `drawShape(ctx: CanvasRenderingContext2D, shape: Point[], shapeType: string)`
    *   **被调用方**: `useEffect` (用于初始/空状态), `drawPuzzle`
*   `drawPuzzle(ctx: CanvasRenderingContext2D, pieces: PuzzlePiece[], completedPieces: number[], selectedPiece: number | null, shapeType: string, originalShape?: Point[], isScattered: boolean = false)`
    *   **被调用方**: `useEffect` (主渲染循环), `handleMouseUp`
    *   **调用方**: `drawPiece`, `drawCompletionEffect`, `calculateCenter`
*   `drawPiece(ctx: CanvasRenderingContext2D, piece: PuzzlePiece, index: number, isCompleted: boolean, isSelected: boolean, shapeType: string, isScattered: boolean = false)`
    *   **被调用方**: `drawPuzzle`
    *   **调用方**: `calculateCenter`, `appendAlpha` (来自 `@/utils/rendering/colorUtils`)
*   `drawHintOutline(ctx: CanvasRenderingContext2D, piece: PuzzlePiece)`
    *   **被调用方**: `useEffect`
    *   **调用方**: `calculateCenter`
*   `drawCompletionEffect(ctx: CanvasRenderingContext2D, shape: Point[], shapeType: string)`
    *   **被调用方**: `drawPuzzle`, `useEffect`
    *   **调用方**: `calculateCenter`
*   `setInitialCanvasSize()`
    *   **被调用方**: `useEffect` (初始化), `handleResize`, `handleOrientationChange`
    *   **调用方**: `updateCanvasSize` (来自 `GameContext`)
    *   **依赖**: `canvasRef.current`, `canvasRef.current.parentElement`, `window.innerWidth`, `window.innerHeight`, `navigator.userAgent`
*   `handleResize()`
    *   **被调用方**: `useEffect` (resize 监听器), `handleOrientationChange`
    *   **调用方**: `setInitialCanvasSize`, `updateCanvasSize` (来自 `GameContext`), `updatePositions`, `clearTimeout`, `setTimeout`
    *   **依赖**: `canvasRef.current`, `canvasRef.current.parentElement`, `window.innerWidth`, `window.innerHeight`, `navigator.userAgent`
*   `updatePositions()`
    *   **被调用方**: `handleResize`
    *   **依赖**: `canvasSize` (组件状态), `state.originalShape`, `state.puzzle` (来自 `GameContext`), `canvasRef.current`, `window.innerWidth`, `window.innerHeight`, `navigator.userAgent`
*   `drawCanvasBorderLine()`
    *   **被调用方**: `useEffect`
*   `drawDistributionArea()`
    *   **被调用方**: `useEffect`
    *   **依赖**: `canvas.width`, `canvas.height`, `window.innerHeight`, `window.innerWidth`, `navigator.userAgent`
*   `handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>)`
    *   **被绑定到**: `onMouseDown` prop
    *   **依赖**: `state.puzzle`, `state.completedPieces` (来自 `GameContext`), `canvasRef.current`, 事件对象 (`e.clientX`, `e.clientY`, `e.button`)
    *   **调用方**: `getBoundingClientRect`, `calculateCenter`, `rotatePoint`, `isPointInPolygon`, `Math.sqrt`, `dispatch` (来自 `GameContext`), `playPieceSelectSound` (来自 `@/utils/rendering/soundEffects`)
*   `handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>)`
    *   **被绑定到**: `onMouseMove` prop
    *   **依赖**: `state.draggingPiece`, `state.puzzle`, `state.selectedPiece`, `state.originalPositions` (来自 `GameContext`), `canvasRef.current`, 事件对象 (`e.clientX`, `e.clientY`), `canvas.width`, `canvas.height`
    *   **调用方**: `getBoundingClientRect`, `ensurePieceInBounds` (来自 `GameContext`), `dispatch` (来自 `GameContext`), `setIsDragging` (组件状态), `calculatePieceBounds` (来自 `GameContext`), `calculateCenter`, `Math.abs`, `Math.sign`, `Math.sqrt`, `setTimeout`
*   `handleMouseUp()`
    *   **被绑定到**: `onMouseUp`, `onMouseLeave` prop
    *   **被调用方**: `handleTouchEnd`
    *   **依赖**: `state.isScattered`, `state.draggingPiece`, `state.puzzle`, `state.originalPositions`, `state.completedPieces`, `state.shapeType`, `state.originalShape` (来自 `GameContext`), `canvasRef.current`
    *   **调用方**: `calculateCenter`, `Math.min`, `Math.abs`, `Math.sqrt`, `dispatch` (来自 `GameContext`), `setIsDragging` (组件状态), `playPieceSnapSound` (来自 `@/utils/rendering/soundEffects`), `playPuzzleCompletedSound` (来自 `@/utils/rendering/soundEffects`), `setTimeout`, `requestAnimationFrame`, `cancelAnimationFrame`, `drawPuzzle`
*   `handleTouchStart(e: React.TouchEvent<HTMLCanvasElement>)`
    *   **被绑定到**: `onTouchStart` prop
    *   **依赖**: `state.puzzle`, `state.isScattered`, `state.completedPieces`, `state.selectedPiece` (来自 `GameContext`), `canvasRef.current`, 事件对象 (`e.touches`)
    *   **调用方**: `preventDefault`, `getBoundingClientRect`, `calculateCenter`, `rotatePoint`, `isPointInPolygon`, `Math.sqrt`, `dispatch` (来自 `GameContext`), `playPieceSelectSound` (来自 `@/utils/rendering/soundEffects`), `calculateAngle`, `setTouchStartAngle` (组件状态)
*   `handleTouchMove(e: React.TouchEvent<HTMLCanvasElement>)`
    *   **被绑定到**: `onTouchMove` prop
    *   **依赖**: `state.draggingPiece`, `state.puzzle`, `state.selectedPiece`, `state.originalPositions` (来自 `GameContext`), `canvasRef.current`, 事件对象 (`e.touches`), `canvas.width`, `canvas.height`
    *   **调用方**: `preventDefault`, `getBoundingClientRect`, `calculateAngle`, `rotatePiece` (来自 `GameContext`), `playRotateSound` (来自 `@/utils/rendering/soundEffects`), `setTouchStartAngle` (组件状态), `ensurePieceInBounds` (来自 `GameContext`), `dispatch` (来自 `GameContext`), `setIsDragging` (组件状态), `calculatePieceBounds` (来自 `GameContext`), `Math.abs`, `Math.sign`, `Math.sqrt`, `setTimeout`, `calculateCenter`
*   `handleTouchEnd(e: React.TouchEvent<HTMLCanvasElement>)`
    *   **被绑定到**: `onTouchEnd` prop
    *   **依赖**: 事件对象 (`e.touches`), `canvasRef.current`
    *   **调用方**: `preventDefault`, `stopPropagation`, `handleMouseUp`, `setIsDragging` (组件状态), `setTouchStartAngle` (组件状态)
*   `handleOrientationChange()`
    *   **被调用方**: `useEffect` (orientationchange 监听器)
    *   **调用方**: `clearTimeout`, `setTimeout`, `handleResize`, `setInitialCanvasSize`, `updatePositions`
    *   **依赖**: `window.innerHeight`, `window.innerWidth`, `navigator.userAgent`
*   `handleKeyDown(e: KeyboardEvent)`
    *   **被调用方**: `useEffect` (keydown 监听器)
    *   **调用方**: `e.preventDefault`, `setShowDebugElements` (组件状态), `console.log`
*   `animateFlash()` (内部递归函数，在 `handleMouseUp` 中定义和调用)
    *   **调用方**: `requestAnimationFrame`, `clearRect`, `drawPuzzle`, `Math.max`, `Math.hypot`, `Math.PI`, `ctx.createRadialGradient`, `ctx.arc`, `ctx.fill`, `ctx.save`, `ctx.restore`, `animateFlash`

### 外部文件依赖

*   `@/contexts/GameContext`: 提供了 `useGame` Hook，包含 `state`, `dispatch`, `canvasRef`, `backgroundCanvasRef`, `ensurePieceInBounds`, `calculatePieceBounds`, `updateCanvasSize`, `rotatePiece`。
*   `@/utils/rendering/soundEffects`: 提供了 `playPieceSelectSound`, `playPieceSnapSound`, `playPuzzleCompletedSound`, `playRotateSound`。
*   `@/utils/rendering/colorUtils`: 提供了 `appendAlpha`。
*   React 库: `useEffect`, `useRef`, `useState`, `type React`。
*   浏览器 API: `window`, `navigator`, `document`, `setTimeout`, `clearTimeout`, `requestAnimationFrame`, `cancelAnimationFrame`, `getBoundingClientRect`, `getContext` 等。

---

## 2. 关键变量和状态追踪

以下是 `PuzzleCanvas.tsx` 中关键变量和状态的分类，以及它们在渲染和交互中的传递方式。

### I. 组件内部状态 (由 `useState` 管理)

*   `canvasSize: { width: number; height: number }`
    *   **目的**: 存储主画布的当前计算尺寸。
    *   **来源**: 由 `setInitialCanvasSize` 初始化，由 `handleResize` 更新。
    *   **传递**: 作为属性传递给 `canvas` 元素，并在 `updatePositions`, 主 `useEffect` (绘图), `drawPuzzle`, `drawPiece` (隐式通过 `ctx.canvas.width/height`), `drawCanvasBorderLine`, `drawDistributionArea` 中使用。它也通过 `updateCanvasSize` 同步到 `GameContext`。
*   `isDragging: boolean`
    *   **目的**: 追踪拼图块是否正在被拖拽（用于本地视觉反馈或阻止其他交互）。
    *   **来源**: 在 `handleMouseMove` 中设置为 `true` (在 `SET_DRAGGING_PIECE` 动作被分发且未触及边界后)，在 `handleMouseMove` (触及边界时), `handleMouseUp`, `handleTouchEnd` 中设置为 `false`。
    *   **传递**: 主要在事件处理函数内部使用，控制本地拖拽状态。
*   `touchStartAngle: number`
    *   **目的**: 存储双指触摸开始时的角度，用于计算旋转量。
    *   **来源**: 在 `handleTouchStart` (双指触摸时) 设置，在 `handleTouchEnd` 中重置。
    *   **传递**: 在 `handleTouchMove` 中用于计算旋转差值。
*   `showDebugElements: boolean`
    *   **目的**: 控制调试 overlay（如画布边界、分布区域、拼图边界框）的可见性。
    *   **来源**: 通过 `handleKeyDown` (F10 键) 切换。
    *   **传递**: 在主 `useEffect` (绘图) 中作为条件判断。
*   `isAndroid: boolean`
    *   **目的**: 检测设备是否为 Android，用于特定的 UI 调整（例如，进度提示的字体大小和内边距）。
    *   **来源**: 在组件挂载时通过 `useEffect` 检测一次用户代理字符串。
    *   **传递**: 在 JSX 中作为条件样式或属性使用。

### II. 组件内部 Ref (由 `useRef` 管理)

*   `containerRef: React.RefObject<HTMLDivElement>`
    *   **目的**: 获取最外层 `div` 容器的 DOM 引用。
    *   **来源**: 绑定到 JSX 中的 `div` 元素。
    *   **传递**: 在 `setInitialCanvasSize`, `handleResize` 中用于获取容器的 `clientWidth` 和 `clientHeight`。
*   `animationFrameRef: React.MutableRefObject<number | null>`
    *   **目的**: 存储 `requestAnimationFrame` 调用返回的 ID，以便在组件卸载或动画结束时取消。
    *   **来源**: 在 `animateFlash` 函数中设置，在主 `useEffect` 的清理函数中清除。
    *   **传递**: 管理闪光动画的生命周期。
*   `resizeTimer: React.MutableRefObject<ReturnType<typeof setTimeout> | null>`
    *   **目的**: 存储 `setTimeout` 计时器的 ID，用于窗口 resize/方向变化事件的防抖。
    *   **来源**: 在 `handleResize`, `handleOrientationChange` 中设置，在这些函数开始时以及主 `useEffect` 的清理函数中清除。
    *   **传递**: 控制 resize 事件的触发频率。
*   `lastTouchRef: React.MutableRefObject<{ x: number; y: number } | null>`
    *   **目的**: 存储上次触摸事件的 `x`, `y` 坐标，用于计算触摸移动的增量。
    *   **来源**: 在 `handleTouchStart`, `handleTouchMove` 中设置，在 `handleTouchEnd` 中重置。
    *   **传递**: 对触摸拖拽的平滑性至关重要。

### III. 从 `GameContext` 获取的状态/Dispatcher

*   `state`: Object (来自 `useGame` Hook)
    *   **目的**: 整个游戏状态的单一数据源。
    *   **主要属性及其用途**:
        *   `state.puzzle: PuzzlePiece[]`: 当前所有拼图块的数组，包含其绝对坐标 (`points`), `x`, `y`, `rotation` 等。用于所有绘制和交互逻辑。
        *   `state.originalShape: Point[]`: 完整拼图的原始形状点集。用于绘制完成后的整体形状和散开时的背景轮廓。
        *   `state.originalPositions: PuzzlePiece[]`: 每个拼图块在正确完成位置和旋转下的状态。用于磁吸逻辑和提示轮廓。
        *   `state.completedPieces: number[]`: 已完成拼图块的索引数组。用于判断拼图块的渲染状态和是否允许交互。
        *   `state.selectedPiece: number | null`: 当前被选中/拖拽的拼图块索引。用于突出显示选中的拼图块。
        *   `state.isScattered: boolean`: 拼图是否处于散开状态。控制交互和渲染逻辑。
        *   `state.isCompleted: boolean`: 游戏是否已完成。控制最终渲染效果和进度提示的可见性。
        *   `state.shapeType: string`: 形状类型 ('polygon' 或 'curve')。决定绘制算法。
        *   `state.canvasWidth: number`, `state.canvasHeight: number`: Canvas 的当前宽度和高度，从 `PuzzleCanvas` 同步而来。用于 `GameContext` 内部的边界检查逻辑，但在 `PuzzleCanvas` 中与 `canvasSize` 存在一定冗余。
*   `dispatch: (action: Action) => void` (来自 `useGame` Hook)
    *   **目的**: 用于更新 `GameContext` 中游戏状态的函数。
    *   **传递**: 在所有交互事件处理函数 (`handleMouseDown`, `handleMouseMove`, `handleMouseUp`, `handleTouchStart`, `handleTouchMove`) 中被调用，以更新拼图位置、选中状态、完成状态等。也在 `setInitialCanvasSize`/`handleResize` 中通过 `updateCanvasSize` 调用。
*   `ensurePieceInBounds: (piece: PuzzlePiece, dx: number, dy: number, margin: number) => { constrainedDx: number; constrainedDy: number; hitBoundary: boolean; }` (来自 `GameContext`)
    *   **目的**: 检查并限制拼图块在画布边界内的移动，并返回是否触及边界。
    *   **传递**: 在 `handleMouseMove`, `handleTouchMove` 中被调用。
*   `calculatePieceBounds: (piece: PuzzlePiece) => { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number; centerX: number; centerY: number; }` (来自 `GameContext`)
    *   **目的**: 计算拼图块的包围盒信息。
    *   **传递**: 在 `handleMouseMove` (用于震动方向判断) 和主 `useEffect` (用于调试绘制) 中被调用。
*   `updateCanvasSize: (width: number, height: number) => void` (来自 `GameContext`)
    *   **目的**: 更新 `GameContext` 中存储的画布尺寸。
    *   **传递**: 在 `setInitialCanvasSize`, `handleResize` 中被调用。
*   `rotatePiece: (isClockwise: boolean) => void` (来自 `GameContext`)
    *   **目的**: 旋转当前选中的拼图块。
    *   **传递**: 在 `handleTouchMove` 中被调用。

### IV. 纯计算结果 (临时变量，在渲染或事件处理中即时计算)

*   `rect` (在事件处理函数中): `canvas.getBoundingClientRect()` 的结果，用于将客户端坐标转换为画布坐标。
*   `x`, `y` (在事件处理函数中): 相对于画布的鼠标/触摸坐标。
*   `dx`, `dy` (在事件处理函数中): 鼠标/触摸移动的增量。
*   `center` (在绘制和交互函数中): `calculateCenter(piece.points)` 的结果，拼图块的中心点。
*   `isAllCompleted` (在 `drawPuzzle` 中): 根据 `completedPieces.length` 和 `pieces.length` 计算得出。
*   `minDimension`, `maxSize`, `aspectRatio`, `newWidth`, `newHeight` (在 `setInitialCanvasSize`, `handleResize` 中): 用于画布尺寸计算的临时变量。
*   `shapeBounds`, `shapeWidth`, `shapeHeight`, `scale` (在 `updatePositions` 中): 用于形状缩放计算的临时变量。
*   `pieceRotation`, `originalRotation`, `rotationDiff`, `isRotationCorrect` (在 `handleMouseUp` 中): 用于旋转角度比较的临时变量。
*   `distance`, `magnetThreshold`, `magnetStrength`, `attractionFactor`, `attractionX`, `attractionY` (在 `handleMouseMove`, `handleTouchMove` 中): 用于磁吸力计算的临时变量。

</rewritten_file> 