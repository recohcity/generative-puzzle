# PuzzleCanvas.tsx 重构任务清单

本清单旨在指导对 `components/PuzzleCanvas.tsx` 文件进行逐步重构，以实现对浏览器窗口和移动设备方向变化的良好适配，并能记忆和恢复交互进度状态，从而提高代码的稳健性、可维护性和可测试性。每一步分拆完成后，都必须进行相应的测试，并确保测试通过后才能进行下一步。

---

## 任务目标

1.  **响应式布局 (Adaptation):** 画布和拼图元素能根据容器尺寸（浏览器窗口、移动设备横/竖屏）动态调整大小和布局。
2.  **状态记忆与恢复 (State Persistence & Restoration):** 在尺寸/方向变化前后，游戏的核心进度（如拼图块的当前位置、旋转、已完成状态）能够被保留，并在新布局下正确恢复和重绘。

---

## 重构方案概览

我们将基于之前的分拆建议，进一步明确各模块的职责，特别是它们如何服务于响应式布局和状态记忆。

## 重构步骤

### 步骤 1: 准备工作和初始测试

1.  **代码审查**: 再次仔细审查 `PuzzleCanvas.tsx` 的当前代码，确保完全理解其现有逻辑和依赖关系。
2.  **创建初始测试**: 为 `PuzzleCanvas.tsx` 现有功能创建核心的端到端（E2E）或集成测试。这些测试应覆盖以下基本功能：
    *   画布的正确初始化和尺寸适应。
    *   拼图的渲染是否正常。
    *   拖拽和旋转功能是否正常。
    *   拼图吸附和完成逻辑是否正常。
    *   音效是否按预期播放。
    *   调试模式切换是否生效。
    **测试通过标准**: 所有初始测试必须通过，作为后续重构的基准。

### 步骤 2: 提取几何计算辅助函数

1.  **创建文件**: 在 `utils/geometry/` 目录下创建新文件 `puzzleGeometry.ts`。
2.  **迁移函数**: 将以下纯粹的几何计算辅助函数移动到 `utils/geometry/puzzleGeometry.ts`：
    *   `calculateCenter`
    *   `isPointInPolygon`
    *   `rotatePoint`
    *   `calculateAngle`
3.  **更新引用**: 修改 `PuzzleCanvas.tsx` 中对这些函数的引用，改为从新文件导入。
4.  **对适配的贡献:** 提供独立于UI和状态的底层计算能力。当拼图块需要根据新画布尺寸重新定位或计算交互点时，这些函数是基础。
5.  **测试**:\\
    *   **单元测试**: 为 `puzzleGeometry.ts` 中的每个函数编写单元测试，确保其计算逻辑的准确性。\
    *   **回归测试**: 运行步骤 1 中创建的 `PuzzleCanvas.tsx` 初始测试，确保功能没有退化。\
    **测试通过标准**: `puzzleGeometry.ts` 的单元测试全部通过，且 `PuzzleCanvas.tsx` 的回归测试全部通过。

### 步骤 3: 提取拼图绘制工具

1.  **创建文件**: 在 `utils/rendering/` 目录下创建新文件 `puzzleDrawing.ts`。
2.  **迁移函数**: 将 `PuzzleCanvas.tsx` 中所有纯粹的Canvas绘制函数移动到 `utils/rendering/puzzleDrawing.ts`：
    *   `drawShape`
    *   `drawPuzzle`
    *   `drawPiece`
    *   `drawHintOutline`
    *   `drawCompletionEffect`
    *   `drawCanvasBorderLine` (可选择移入，或在 `useCanvasRendering` 中处理)
    *   `drawDistributionArea` (可选择移入，或在 `useCanvasRendering` 中处理)
3.  **更新引用**: 修改 `PuzzleCanvas.tsx` 中对这些函数的引用，改为从新文件导入。
4.  **对适配的贡献:** 将绘制逻辑解耦。当拼图数据（位置、大小）根据新画布尺寸适配完成后，这些函数能直接使用新数据进行重绘，而无需关心适配逻辑本身。
5.  **测试**:\\
    *   **单元测试**: 为 `puzzleDrawing.ts` 中的每个函数编写单元测试，模拟不同的输入数据，确保绘制结果的准确性。\
    *   **回归测试**: 运行 `PuzzleCanvas.tsx` 的初始测试，重点关注所有渲染效果。\
    **测试通过标准**: `puzzleDrawing.ts` 的单元测试全部通过，且 `PuzzleCanvas.tsx` 的回归测试全部通过。

### 步骤 4: 定义核心类型

1.  **创建文件**: 在 `types/` 目录下创建新文件 `puzzleTypes.ts`。
2.  **迁移和定义类型**: 将 `PuzzleCanvas.tsx` 中定义的类型（如 `Point`, `PuzzlePiece`）移动到 `types/puzzleTypes.ts`。确保这些类型包含适配所需的所有字段，例如 `normalizedX`, `normalizedY` 等。
3.  **更新引用**: 修改所有相关文件（包括 `GameContext.tsx` 和其他 Hook）中对这些类型的引用。
4.  **对适配的贡献:** 提供清晰的数据模型，方便在不同模块间传递和理解与拼图状态及几何相关的适配数据。
5.  **测试**:\\
    *   **类型检查**: 确保整个项目通过 TypeScript 类型检查，没有类型错误。\
    **测试通过标准**: 项目成功通过 TypeScript 类型检查。

### 步骤 5: 更新游戏状态管理中心

1.  **更新文件**: 修改 `contexts/GameContext.tsx` 文件。
2.  **更新功能**:
    *   **状态存储**: 存储整个游戏的核心状态：`puzzle` (所有拼图块的当前数据数组，包括 `x`, `y`, `rotation`, `normalizedX`, `normalizedY`)、`originalShape` (原始形状的归一化点位)、`originalPositions` (每个拼图块在完成时的目标归一化点位和旋转)、`completedPieces`、`selectedPiece`、`isScattered`、`isCompleted`、`shapeType` 等。
    *   **新增状态**: 存储上一次的画布尺寸 (`previousCanvasSize: { width: number; height: number } | null`)，用于辅助计算相对位置的恢复。
    *   **新增 Action**: 可能需要新的 `action` 类型和对应的 `reducer` 逻辑，例如 `ADAPT_PUZZLE_TO_NEW_SIZE`，用于在画布尺寸变化后，根据旧状态和新尺寸计算并更新所有拼图块的新位置和旋转。
    *   **原有辅助函数**: 保持 `ensurePieceInBounds`, `calculatePieceBounds`, `updateCanvasSize`, `rotatePiece` 等函数，但其内部逻辑可能需要调整以适配新的状态结构。
3.  **对适配的贡献:**
    *   **状态记忆的核心:** 这是所有需要跨尺寸/方向变化保留的交互进度的"记忆体"。
    *   **状态恢复的源头:** 适配逻辑将读取此处的旧状态，计算出新状态，然后通过 `dispatch` 更新回 Context，触发重绘。
4.  **测试**:\\
    *   **单元测试**: 为 `GameContext` 中的新 reducer 逻辑编写单元测试，确保状态更新的正确性。\
    *   **集成测试**: 验证 `GameContext` 与其他 Hook 之间的数据流和状态同步是否正确。\
    *   **回归测试**: 运行 `PuzzleCanvas.tsx` 的初始测试，确保游戏状态管理的所有功能正常。\
    **测试通过标准**: `GameContext` 的单元测试和集成测试通过，且 `PuzzleCanvas.tsx` 的回归测试全部通过。

### 步骤 6: 提取设备检测钩子

1.  **创建文件**: 在 `hooks/` 目录下创建新文件 `useDeviceDetection.ts`。
2.  **迁移逻辑**: 将 `PuzzleCanvas.tsx` 中所有用于设备和屏幕方向检测的逻辑提取到 `useDeviceDetection.ts`，并封装为易于使用的 Hook。
3.  **创建 Hook**: `useDeviceDetection` Hook 应返回如 `isAndroid`, `isMobile`, `isPortrait` 等状态。
4.  **更新引用**: 修改 `PuzzleCanvas.tsx` 和其他可能使用这些判断的地方，改为使用 `useDeviceDetection` Hook。
5.  **对适配的贡献:** 为 `useResponsiveCanvasSizing` 和其他可能需要根据设备特性调整行为的逻辑提供判断依据。
6.  **测试**:\\
    *   **单元测试**: 为 `useDeviceDetection.ts` 中的 Hook 编写单元测试，模拟不同的 `userAgent` 和 `window` 尺寸，确保检测逻辑的准确性。\
    *   **回归测试**: 运行 `PuzzleCanvas.tsx` 的初始测试，重点关注画布尺寸适应和响应式行为。\
    **测试通过标准**: `useDeviceDetection.ts` 的单元测试通过，且 `PuzzleCanvas.tsx` 的回归测试全部通过。

### 步骤 7: 提取响应式画布尺寸管理钩子

1.  **创建文件**: 在 `hooks/` 目录下创建新文件 `useResponsiveCanvasSizing.ts`。
2.  **迁移逻辑**: 将 `PuzzleCanvas.tsx` 中 `setInitialCanvasSize`, `handleResize`, `handleOrientationChange` 以及与 `canvasSize` 状态相关的逻辑（包括对设备检测工具函数的调用）移动到 `useResponsiveCanvasSizing.ts`。
3.  **创建 Hook**: `useResponsiveCanvasSizing` Hook 应接收 `containerRef`, `canvasRef`, `backgroundCanvasRef`，并返回 `canvasSize` 状态。它也应在内部处理 `updateCanvasSize` 到 `GameContext` 的逻辑。
4.  **更新引用**: 修改 `PuzzleCanvas.tsx`，使用 `useResponsiveCanvasSizing` Hook 来管理画布尺寸。
5.  **对适配的贡献:**
    *   **触发适配流程:** 当检测到尺寸变化并更新 `canvasSize` 后，这个新 `canvasSize` 将成为 `PuzzleCanvas` 组件中适配逻辑的触发条件。
    *   **提供新画布尺寸:** 为后续的拼图块位置和大小重算提供目标画布尺寸。
6.  **测试**:\\
    *   **集成测试**: 编写测试来验证 `useResponsiveCanvasSizing` Hook 是否正确处理各种窗口大小和设备方向的变化，并返回正确的画布尺寸。\
    *   **回归测试**: 运行 `PuzzleCanvas.tsx` 的初始测试，特别是关于画布初始化和响应式布局的部分。\
    **测试通过标准**: `useResponsiveCanvasSizing` 的集成测试全部通过，且 `PuzzleCanvas.tsx` 的回归测试全部通过。

### 步骤 8: 提取拼图交互处理钩子

1.  **创建文件**: 在 `hooks/` 目录下创建新文件 `usePuzzleInteractions.ts`。
2.  **迁移交互逻辑**: 将 `PuzzleCanvas.tsx` 中所有与鼠标和触摸事件相关的处理函数 (`handleMouseDown`, `handleMouseMove`, `handleMouseUp`, `onTouchStart`, `onTouchMove`, `onTouchEnd`)，以及内部的拖拽状态 (`isDragging`, `touchStartAngle`, `lastTouchRef`)、磁吸逻辑、边界碰撞震动动画、音效播放调用等逻辑移动到 `usePuzzleInteractions.ts`。
3.  **创建 Hook**: `usePuzzleInteractions` Hook 接收 `canvasRef`, `state`, `dispatch`, `ensurePieceInBounds`, `calculatePieceBounds`, `rotatePiece` 以及音效播放函数作为参数，并返回事件处理函数。
4.  **更新引用**: 修改 `PuzzleCanvas.tsx`，使用 `usePuzzleInteractions` Hook 来管理所有交互。
5.  **对适配的贡献:** 交互逻辑本身与画布尺寸的具体值解耦。它依赖于 `GameContext` 中拼图块的当前位置和 `canvasRef` 的 `getBoundingClientRect()`。只要拼图块的位置被正确适配，交互逻辑就能在新布局下继续工作。
6.  **测试**:\\
    *   **集成测试**: 编写测试来验证 `usePuzzleInteractions` Hook 是否正确响应用户输入，包括拼图的选择、拖拽、旋转、吸附和边界碰撞效果。\
    *   **回归测试**: 运行 `PuzzleCanvas.tsx` 的初始测试，重点覆盖所有交互功能。\
    **测试通过标准**: `usePuzzleInteractions` 的集成测试全部通过，且 `PuzzleCanvas.tsx` 的回归测试全部通过。

### 步骤 9: 提取拼图状态适配钩子

1.  **创建文件**: 在 `hooks/` 目录下创建新文件 `usePuzzleAdaptation.ts`。
2.  **迁移逻辑**: 将原 `PuzzleCanvas.tsx` 中 `updatePositions` 函数的逻辑进行改造，并将其核心适配逻辑移动到 `usePuzzleAdaptation.ts`。
3.  **创建 Hook**: `usePuzzleAdaptation` Hook 接收当前的 `gameState` (来自 `GameContext`)、`newCanvasSize` (来自 `useResponsiveCanvasSizing`)。
4.  **核心职责**: 当 `newCanvasSize` 发生变化时，根据 `gameState` 中各拼图块的当前状态（是否完成、当前位置、旋转）和 `newCanvasSize`，计算出它们在**新画布下**的正确位置和（如果需要）大小。
    *   **对于已完成的拼图块**: 根据其在 `originalPositions` 中的目标位置（通常是归一化坐标）和 `newCanvasSize`，重新计算其绝对像素位置。旋转保持不变。
    *   **对于未完成/散开的拼图块**:
        *   **策略1 (相对位置记忆):** 假设这些块的位置在 `GameContext` 中可以存储为相对于旧画布的归一化坐标 (例如 `currentNormalizedX = oldX / previousCanvasWidth`)。那么新位置就是 `newX = currentNormalizedX * newCanvasWidth`。这需要 `GameContext` 能存储或 `usePuzzleAdaptation` 能接收到 `previousCanvasSize`。
        *   **策略2 (锚点+偏移记忆):** 如果以画布中心为锚点，可以记忆块中心相对于画布中心的偏移百分比。
        *   **策略3 (重新散布):** 如果精确记忆散开位置过于复杂，可以退而求其次，在画布尺寸变化后，对未完成的块执行一次新的"智能散布"逻辑，使其分布在新画布的可用区域内，同时保留其旋转状态。
    *   调用 `dispatch` (来自 `GameContext`) 来更新 `GameContext` 中的 `puzzle` 状态，包含所有块适配后的新坐标和旋转。
5.  **对适配的贡献:** 实现状态恢复和布局适配的核心逻辑。这是将"记忆"中的状态（旧位置）转换为"适应"新环境（新位置）的关键步骤。
6.  **测试**:\\
    *   **单元测试**: 为 `usePuzzleAdaptation` 中的适配逻辑编写单元测试，模拟不同的旧画布尺寸、新画布尺寸和拼图状态，确保计算出的新位置和旋转是正确的。\
    *   **集成测试**: 验证 `usePuzzleAdaptation` 是否正确地与 `GameContext` 交互，更新拼图状态。\
    *   **回归测试**: 运行 `PuzzleCanvas.tsx` 的初始测试，重点关注尺寸变化后拼图位置和状态的保持。\
    **测试通过标准**: `usePuzzleAdaptation` 的单元测试和集成测试通过，且 `PuzzleCanvas.tsx` 的回归测试全部通过。

### 步骤 10: 提取调试模式切换 Hook

1.  **创建文件**: 在 `hooks/` 目录下创建新文件 `useDebugToggle.ts`。
2.  **迁移逻辑**: 将 `PuzzleCanvas.tsx` 中 F10 键切换 `showDebugElements` 状态的逻辑移动到 `useDebugToggle.ts`。
3.  **创建 Hook**: `useDebugToggle` Hook 返回 `showDebugElements` 状态。
4.  **更新引用**: 修改 `PuzzleCanvas.tsx`，使用 `useDebugToggle` Hook 来管理调试状态。
5.  **测试**:\\
    *   **单元测试**: 验证 F10 键按下时 `showDebugElements` 状态是否正确切换。\
    *   **回归测试**: 运行 `PuzzleCanvas.tsx` 的初始测试，手动验证调试元素的显示/隐藏功能。\
    **测试通过标准**: `useDebugToggle` 的单元测试通过，且 `PuzzleCanvas.tsx` 的回归测试全部通过。

---

## 最终 `PuzzleCanvas.tsx` 的状态

经过上述分拆后，`PuzzleCanvas.tsx` 将变得非常简洁，主要负责：

*   引入并使用上述所有钩子和 `GameContext`。
*   编排：
    1.  `useResponsiveCanvasSizing` 获取 `canvasSize` 和 refs。
    2.  当 `canvasSize` 变化时 (通过 `useEffect` 监听 `canvasSize`):
        *   触发 `usePuzzleAdaptation` (或其逻辑) 来计算适配后的拼图状态。这将通过 `dispatch` 更新 `GameContext`。
    3.  主要的 `useEffect` (监听 `GameContext.state.puzzle`, `canvasSize` 等) 负责调用 `puzzleDrawing.ts` 中的函数进行绘制。由于 `GameContext` 中的 `puzzle` 数据已经被 `usePuzzleAdaptation` 更新，所以绘制出来就是适配后的效果。
*   渲染 `canvas` 元素，并绑定 `usePuzzleInteractions` 返回的事件处理器。
*   渲染如 `PuzzleProgressIndicator` 等UI子组件。

---

## 记忆与适配策略详解：

1.  **状态定义与存储 (GameContext):**
    *   **原始形状 (originalShape):** 以归一化坐标 (0-1范围) 存储。例如，`[{ x: 0.1, y: 0.1 }, ...]`。
    *   **拼图块目标位置 (originalPositions):** 每个拼图块在完成时的目标状态，其 `points` 也应基于归一化坐标的 `originalShape` 切割生成，或者其中心点和旋转以归一化形式存储。
    *   **拼图块当前状态 (puzzle 数组):**
        *   `id`: 唯一标识。
        *   `currentPoints`: **在当前画布尺寸下的绝对像素坐标**。这是绘制时直接使用的。
        *   `currentRotation`: 当前旋转角度。
        *   `isCompleted`: 布尔值。
        *   `color`, etc.
        *   **(可选，用于更精确恢复散开状态)** `normalizedX`, `normalizedY`: 该块中心点相对于**上一个**画布尺寸的归一化坐标 (`x/prevCanvasWidth`, `y/prevCanvasHeight`)。仅对未完成的块有意义。
2.  **适配流程 (当 `canvasSize` 改变时):**
    *   **步骤 1: `useResponsiveCanvasSizing` 更新 `canvasSize`。**
        
        `PuzzleCanvas` 组件通过 `useEffect` 监听到 `canvasSize` 的变化。
        
    *   **步骤 2: 触发适配计算 (在 `PuzzleCanvas` 的 `useEffect` 或 `usePuzzleAdaptation` 中)。**
        
        获取 `newCanvasSize` 和 `GameContext` 中的当前 `state` (包括 `state.puzzle` 和 `state.originalPositions`，以及可能的 `state.previousCanvasSize`)。
        
    *   **步骤 3: 遍历 `state.puzzle` 中的每一个拼图块，计算其新状态。**
        
        ```typescript
        // 伪代码
        const newPuzzleState = state.puzzle.map(piece => {
          if (piece.isCompleted) {
            // 对于已完成的块
            const targetOriginalPiece = state.originalPositions.find(op => op.id === piece.id);
            // originalPoints 应该是归一化的，或者能从归一化的 originalShape 推导
            const newAbsolutePoints = targetOriginalPiece.originalPoints.map(p => ({
              x: p.normalizedX * newCanvasSize.width, // 假设 originalPoints 存储的是归一化坐标
              y: p.normalizedY * newCanvasSize.height,
            }));
            return {
              ...piece,
              currentPoints: newAbsolutePoints, // 更新为基于新画布尺寸的绝对坐标
              currentRotation: targetOriginalPiece.originalRotation, // 确保是目标旋转
            };
          } else {
            // 对于未完成的块 (散开的)
            // 使用策略1：基于之前存储的归一化位置恢复
            let newCenterX: number, newCenterY: number;
            if (piece.normalizedX !== undefined && state.previousCanvasSize) { // 确保有归一化历史数据
              newCenterX = piece.normalizedX * newCanvasSize.width;
              newCenterY = piece.normalizedY * newCanvasSize.height;
            } else {
              // 如果没有历史归一化数据 (例如首次加载或策略3)
              // 保持当前相对位置的简单方法：
              const oldCenterX = calculateCenter(piece.currentPoints).x;
              const oldCenterY = calculateCenter(piece.currentPoints).y;
              const prevWidth = state.previousCanvasSize?.width || newCanvasSize.width; // Fallback if no prev
              const prevHeight = state.previousCanvasSize?.height || newCanvasSize.height;
        
              newCenterX = (oldCenterX / prevWidth) * newCanvasSize.width;
              newCenterY = (oldCenterY / prevHeight) * newCanvasSize.height;
            }
        
            // 根据新的中心点 newCenterX, newCenterY 和 piece 的原始形状点（相对块中心的点）
            // 以及 currentRotation，重新计算 currentPoints
            // 这需要 piece 的原始（未旋转，以自身(0,0)为中心）点集
            // 假设 piece.originalDefinitionPoints 存在并包含以自身 (0,0) 为中心的点定义
            const unrotatedRelativePoints = piece.originalDefinitionPoints; 
            const newAbsolutePoints = unrotatedRelativePoints.map(p => {
                const rotated = rotatePoint(p.x, p.y, 0, 0, piece.currentRotation);
                return { x: rotated.x + newCenterX, y: rotated.y + newCenterY };
            });
        
            return {
              ...piece,
              currentPoints: newAbsolutePoints,
              // (重要) 更新 piece.normalizedX, piece.normalizedY 以备下次适配
              normalizedX: newCenterX / newCanvasSize.width,
              normalizedY: newCenterY / newCanvasSize.height,
            };
          }
        });
        ```
        
    *   **步骤 4: 更新 `GameContext`。**
        
        `dispatch({ type: 'UPDATE_ADAPTED_PUZZLE_STATE', payload: { newPuzzleData: newPuzzleState, newPreviousCanvasSize: newCanvasSize } });`
        
        Reducer 中会更新 `state.puzzle` 和 `state.previousCanvasSize`。
        
    *   **步骤 5: `PuzzleCanvas` 的主绘制 `useEffect` 自动触发。**
        
        因为它依赖于 `state.puzzle` 和 `canvasSize`，当这些变化时，它会使用更新后的 `newPuzzleState` 和 `newCanvasSize` 调用 `puzzleDrawing.ts` 中的函数进行重绘。

---

## 重构带来的好处：

1.  **高内聚低耦合：** 每个模块职责单一，易于理解、维护和测试。
2.  **逻辑清晰：** 尺寸检测、状态记忆、适配计算、交互处理、绘制分离，使得复杂的适配流程变得条理清晰。
3.  **可复用性：** `puzzleGeometry.ts`, `puzzleDrawing.ts` 中的工具函数，以及各个自定义钩子，都可以在其他项目中复用或扩展。
4.  **提升可维护性：** 修改某部分逻辑（如交互方式、绘制效果、适配策略）时，影响范围更小。
5.  **更好的用户体验：** 平滑地适应各种屏幕和方向，并保留用户操作进度，避免了因尺寸变化导致的游戏重置或布局错乱。

这个方案的关键在于 `GameContext` 作为状态记忆的载体，以及 `usePuzzleAdaptation` (或类似逻辑) 作为连接"记忆"与"新环境"的桥梁。对于散开拼图块位置的精确恢复，需要仔细设计其在 `GameContext` 中的存储方式（例如，增加归一化坐标字段）。

---

## 额外建议

*   **逐步提交**: 每完成一个步骤并测试通过后，都应提交代码到版本控制系统，以方便回溯和协作。
*   **文档更新**: 随着组件的拆分，及时更新相关文档（如 `README.md` 或新组件的内部注释）。
*   **性能监控**: 在重构过程中和重构完成后，持续监控应用的性能，确保重构没有引入新的性能问题。
*   **TypeScript 类型**: 确保所有新创建的文件和函数都严格使用 TypeScript 类型定义，提高代码健壮性。

--- 