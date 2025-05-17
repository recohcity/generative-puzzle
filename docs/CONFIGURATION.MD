# 生成式拼图游戏 - 配置说明

本文档旨在提供项目关键配置和参数的概览，方便开发者理解和调整游戏行为。

## 主要配置文件参考

大部分核心配置和逻辑分散在以下文件中：

- **难度与切割逻辑**: `utils/puzzle/cutGenerators.ts`, `utils/puzzle/PuzzleGenerator.ts`, `docs/difficulty-design.md`
- **形状生成**: `utils/shape/ShapeGenerator.ts`
- **拼图散开与分布**: `utils/puzzle/ScatterPuzzle.ts`
- **核心状态管理**: `contexts/GameContext.tsx`
- **渲染与交互**: `components/PuzzleCanvas.tsx`
- **界面布局与路由**: `components/GameInterface.tsx` (作为布局路由), `components/layouts/DesktopLayout.tsx`, `components/layouts/PhonePortraitLayout.tsx`, `components/layouts/PhoneLandscapeLayout.tsx`
- **控制组件**: `components/ShapeControls.tsx`, `components/PuzzleControlsCutType.tsx`, `components/PuzzleControlsCutCount.tsx`, `components/PuzzleControlsScatter.tsx`, `components/PuzzleControlsGamepad.tsx`, `components/ActionButtons.tsx`, `components/DesktopPuzzleSettings.tsx`, `components/GlobalUtilityButtons.tsx`
- **设备适配逻辑**: 主要在 `GameInterface.tsx` (检测与分发) 和各个布局组件 (`components/layouts/`) 中实现特定布局。部分底层逻辑仍在 `ShapeGenerator.ts`, `ScatterPuzzle.ts`, `GameContext.tsx` 等。
- **音效管理**: `utils/rendering/soundEffects.ts`
- **构建配置**: `next.config.mjs`
- **UI 与主题**: `tailwind.config.ts`, `components.json` (Shadcn UI)
- **常量定义**: `utils/constants.ts` (如果存在重要常量)

## 难度配置 (`utils/puzzle/cutGenerators.ts`, `docs/difficulty-design.md`)

游戏难度主要由用户选择的"切割次数"（1-8）驱动，系统会根据此选择映射到实际的切割线数量和拼图块数。

| 选择的切割次数 (难度) | 实际稳定生成的有效切割线数 | 最终产生拼图块数 |
|-----------------------|-----------------------------|-------------------|
| 1                     | 1                           | 2                 |
| 2                     | 2                           | 3                 |
| 3                     | 3                           | 4                 |
| 4                     | 4                           | 5                 |
| 5                     | 6                           | 7                 |
| 6                     | 8                           | 9                 |
| 7                     | 11                          | 12                |
| 8                     | 13                          | 14                |

**切割策略**:
- **目标切割线数**: 代码会*尝试*生成略多于上表的切割线数（如难度8尝试14条），但通过 `isValidCut` 等验证逻辑确保最终生效的数量。
- **中心切割概率**: 低难度优先使用穿过中心的切割线（概率高），高难度则倾向于随机切割（中心切割概率低）。具体概率计算见 `cutGenerators.ts` 内 `useCenterCutProbability`。
- **随机性**: 高难度（≥7）会采用更随机的切割线生成模式 (`useExtremeRandomness`)，放宽验证条件。

## 形状生成配置 (`utils/shape/ShapeGenerator.ts`)

支持三种形状类型，其参数会根据设备类型和方向动态调整：

- **多边形 (`polygon`)**:
    - 顶点数: 5 至 (5 + `shapeParams.numPoints`) 随机 (移动端 `numPoints`=6, 桌面端=8)
- **曲线 (`curve`)**:
    - 顶点数: `shapeParams.detail` (移动端=120, 桌面端=200)
- **不规则圆形 (`irregular`)**:
    - 顶点数: `shapeParams.detail` (移动端=120, 桌面端=200)
    - 通过噪声函数 (`noise`) 控制不规则程度，振幅 (`amplitude`) 移动端较小。

**尺寸与归一化**:
- 所有形状基于 `STANDARD_SIZE` (1000) 生成，然后通过 `normalizePoints` 函数根据实际画布尺寸 (`realCanvasWidth`, `realCanvasHeight`) 和设备/方向进行缩放和居中。
- 移动设备（尤其竖屏）会使用更小的基础半径 (`baseRadius`) 和缩放因子 (`scaleFactor`) 以确保形状在屏幕内显示良好。

## 切割配置 (`utils/puzzle/cutGenerators.ts`)

- **支持类型**: 仅支持 `"straight"` (直线) 和 `"diagonal"` (斜线) 两种切割类型。
- **实现**: 通过 `generateStraightCutLine` 和 `generateDiagonalCutLine` 生成基础切割线，`generateCuts` 函数根据难度和类型参数选择和验证最终使用的切割线。

## 散开与分布配置 (`utils/puzzle/ScatterPuzzle.ts`, `docs/difficulty-design.md`)

拼图散开时的分布策略：

- **分布算法**:
    - **手机竖屏**: 使用**螺旋分布算法**，将拼图从外向内螺旋排列，以适应狭长屏幕。
    - **桌面/平板/手机横屏**: 使用**网格布局**，将画布划分为网格，拼图随机放置在网格单元内。
- **分布因子**: 根据难度调整，控制拼图分散程度（低难度集中，高难度分散）。
- **随机偏移**: 在网格单元内或螺旋路径附近添加随机偏移量，偏移范围也受难度影响。
- **目标形状避开**: 散开时会计算原始形状区域，并优先将拼图放置在形状外的可用空间（上/右/下/左）。
- **边界安全边距**: 根据设备和难度动态调整画布边缘的安全距离，防止拼图完全移出可视区域。手机竖屏使用更大的边距。

## 碰撞与回弹配置 (`contexts/GameContext.tsx`, `components/PuzzleCanvas.tsx`)

- **边界检测**:
  - 通过 `calculatePieceBounds` 函数计算拼图的精确边界框（考虑旋转角度）
  - 使用 `ensurePieceInBounds` 实现统一的边界约束处理，确保拼图不会超出画布
  - 精确的边界触碰阈值（0.1像素），避免微小位移也触发碰撞检测
- **回弹效果**:
  - **回弹计算**: 根据拼图尺寸的30%计算回弹距离，使不同大小拼图的回弹效果视觉一致
  - **回弹幅度**: 使用 `bounceBackFactor = 0.4` 控制回弹强度
  - **最大回弹限制**: 设置回弹距离上限（30-80像素），防止过度回弹
  - **方向识别**: 自动识别碰撞边界（上/右/下/左），据此确定回弹方向
  - **二次校正**: 回弹后进行二次边界检查，确保不会再次超出画布
- **视觉反馈**:
  - **震动动画**: 拼图碰撞边界后执行震动序列 `[8, -6, 5, -4, 3, -2]` 像素的位移
  - **音效反馈**: 碰撞时播放分层音效（低频120Hz + 高频240Hz），提供更丰富的感官反馈
- **调试工具**:
  - 按F10键切换显示调试元素（拼图边界框、画布边缘指示器和拼图ID）
  - 拼图ID从1开始编号，便于开发测试和调试
  - 拖拽停止后自动重绘，确保状态一致

## 旋转配置 (`ScatterPuzzle.ts`, `docs/difficulty-design.md`)

- **旋转增量**: 所有用户操作（按钮、双指）均使用 **15 度** 增量。
- **初始随机旋转**: 拼图散开时的初始角度：
    - **手机竖屏**: 简化为 90 度倍数（0, 90, 180, 270），根据难度增加选项。
    - **桌面/平板/手机横屏**: 使用 15 度倍数，范围根据难度增加（低难度0-45度，中难度0-90度，高难度0-180度，极高难度0-345度）。
- **角度修正**: `ScatterPuzzle.ts` 确保散开时的初始角度是 15 的倍数。

## 设备适配配置 (分散在多个文件)

- **检测**: 通过 `navigator.userAgent` 和 `window.innerWidth/innerHeight` 检测设备类型 (phone/tablet/desktop) 和方向 (portrait/landscape)。主要检测逻辑位于 `GameInterface.tsx`。
- **主要适配点**:
    - **UI 布局**: 由 `GameInterface.tsx` 根据检测结果渲染不同的布局组件 (`DesktopLayout`, `PhonePortraitLayout`, `PhoneLandscapeLayout`)。手机竖屏使用选项卡式控制面板。
    - **画布尺寸**: 手机竖屏强制正方形并限制最大尺寸 (`PuzzleCanvas.tsx` -> `setInitialCanvasSize`, `handleResize`)。
    - **形状参数**: 顶点数、半径、扰动幅度等 (`ShapeGenerator.ts`)。
    - **分布策略**: 螺旋 vs 网格 (`ScatterPuzzle.ts`)。
    - **初始旋转**: 90度 vs 15度倍数 (`ScatterPuzzle.ts`)。
    - **边界约束**: 安全边距和约束严格度 (`GameContext.tsx` -> `ensurePieceInBounds`)。
    - **字体大小**: 进度提示等 (`PuzzleCanvas.tsx`)。
    - **按钮尺寸/间距**: `ShapeControls.tsx`, `GlobalUtilityButtons.tsx` 等组件内部处理。
    - **音量**: `soundEffects.ts` 中可能包含基于设备类型的音量调整。

## 媒体资源配置 (`public/`, `utils/rendering/soundEffects.ts`)

- **背景图片**: `public/bg.jpg`
- **背景音乐**: `public/puzzle-pieces.mp3` (通过 `soundEffects.ts` 控制播放/暂停/状态)
- **预览图片**: `public/p1.png`, `public/p2.png`
- **音效**: 具体实现位于 `utils/rendering/soundEffects.ts`，定义了如 `playButtonClickSound`, `playPieceSelectSound`, `playPieceSnapSound` 等函数。

## 视觉与主题配置 (`tailwind.config.ts`, `components/PuzzleCanvas.tsx`)

- **主题**: 主要通过 Tailwind CSS 实现，颜色配置在 `tailwind.config.ts`。整体为儿童友好的暖色系。
- **核心效果**:
    - **玻璃效果画布**: 通过 CSS 实现 (`app/globals.css`)。
    - **动态阴影**: 在 `PuzzleCanvas.tsx` -> `drawPiece` 中根据 `isScattered` 和 `isCompleted` 状态绘制。
    - **完成效果**: 包含星星、文字、发光等，在 `PuzzleCanvas.tsx` -> `drawCompletionEffect` 和 `drawPuzzle` 中实现。
    - **提示轮廓**: 在 `PuzzleCanvas.tsx` -> `drawHintOutline` 中实现。

## 构建与开发配置 (`next.config.mjs`, `app/page.tsx`)

- **React StrictMode**: 在 `next.config.mjs` 中设置为 `false`，以解决开发模式下旋转功能重复执行的问题。
- **Lazy Loading**: 主游戏组件 (`GameInterface.tsx`) 在 `app/page.tsx` 中使用 `next/dynamic` 进行懒加载和预加载。

## UI 组件配置 (`components.json`)

- 该文件由 Shadcn UI CLI 生成和使用，用于跟踪已安装的基础 UI 组件。

---

本文档提供了主要配置点的概览。详细的实现逻辑和具体参数值请参考上述提到的源代码文件。 