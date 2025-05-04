# 生成式拼图游戏 - 难度设计与管理系统

## 概述

难度系统是生成式拼图游戏的核心组成部分，直接影响玩家体验和游戏可玩性。本文档详细说明游戏中的难度设计原理、实现方式及各种考量因素。

## 难度因素

游戏难度由多个因素组合决定：

1. **拼图数量**：最基础的难度指标，由切割次数决定，1-8次切割产生对应数量的拼图
2. **切割类型**：直线切割较容易，曲线切割增加难度
3. **拼图分布**：初始拼图的分散程度和布局
4. **旋转角度**：拼图初始旋转角度的随机性
5. **设备适配**：根据设备类型和屏幕方向动态调整难度参数

## 切割系统与难度关系

### 切割次数与拼图数量

用户可以在界面上选择1-8次切割，系统会根据选择的次数生成对应难度的拼图：

| 切割次数 | 预期切割线数 | 实际产生拼图数 | 难度级别 |
|---------|------------|------------|---------|
| 1       | 1          | 2片        | 低难度   |
| 2       | 2          | 3片        | 低难度   |
| 3       | 3          | 4片        | 低难度   |
| 4       | 4          | 5片        | 中等难度 |
| 5       | 6          | 7片        | 中等难度 |
| 6       | 8          | 9片        | 中等难度 |
| 7       | 11         | 12片       | 高难度   |
| 8       | 13         | 14片       | 高难度   |

> **注意**：表格中显示的是系统稳定生成的有效切割线数量和对应的拼图块数。在代码实现中，特别是高难度级别，系统可能会尝试生成更多切割线（例如难度8尝试生成14条），但由于切割线有效性验证和最终处理逻辑，实际生效的切割线数量如上表所示。

切割次数是游戏中最直接的难度控制器，每增加一次切割，游戏难度就会相应提高。系统针对不同难度级别采用不同的切割策略：

```javascript
// 为不同难度级别设置尝试生成的切割线数量
let targetCutCount = count;
if (difficulty === 8) {
  // 难度8：尝试生成14条切割线 (实际稳定产生13条有效切割线 -> 14片拼图)
  targetCutCount = 14;
} else if (difficulty === 7) {
  // 难度7：尝试生成11条切割线 (实际稳定产生11条有效切割线 -> 12片拼图)
  targetCutCount = 11;
} else if (difficulty === 6) {
  // 难度6：尝试生成8条切割线 (实际稳定产生8条有效切割线 -> 9片拼图)
  targetCutCount = 8;
} else if (difficulty === 5) {
  // 难度5：尝试生成6条切割线 (实际稳定产生6条有效切割线 -> 7片拼图)
  targetCutCount = 6;
} else if (difficulty === 4) {
  // 难度4：尝试生成4条切割线 (实际稳定产生4条有效切割线 -> 5片拼图)
  targetCutCount = 4;
} else {
  // 难度1-3：尝试生成的切割次数等于难度级别
  targetCutCount = difficulty;
}
```

### 切割类型组合

游戏支持两种切割类型，它们具有不同的难度特性：

1. **直线切割**：
   - 特点：产生具有直边的拼图片段
   - 难度：较低，边缘更容易识别和匹配
   - 适合：初学者和喜欢简单挑战的玩家

2. **曲线切割**：
   - 特点：产生具有曲线边缘的拼图片段
   - 难度：较高，边缘轮廓更复杂，增加识别和匹配难度
   - 适合：有经验的玩家和寻求更大挑战的用户

切割类型与切割次数结合会产生不同的游戏体验：
- **低切割次数 + 直线切割**：最简单的组合，适合儿童或初次接触拼图游戏的玩家
- **高切割次数 + 曲线切割**：最具挑战性的组合，适合拼图爱好者和有经验的玩家

## 难度级别定义

游戏根据拼图数量自动划分难度级别：

| 难度级别 | 拼图数量 | 特点 |
|---------|--------|------|
| 低难度   | 1-3片   | 适合初学者，拼图集中分布，旋转角度小 |
| 中等难度 | 4-6片   | 标准挑战，适当分散，中等旋转角度 |
| 高难度   | 7-9片   | 进阶挑战，更分散的布局，更大旋转角度 |
| 极高难度 | 10片以上 | 专家级挑战，最大分散度和旋转角度范围 |

## 分布系统设计

### 分布因子

根据难度动态计算分布因子，控制拼图在画布上的分散程度：

```
// 低难度(1-3片)拼图更集中
distributionFactor = 0.7 - ((difficulty - 1) * 0.05); // 1级:0.7, 2级:0.65, 3级:0.6

// 中等难度(4-6片)
distributionFactor = 0.8 + ((difficulty - 4) * 0.05); // 4级:0.8, 5级:0.85, 6级:0.9

// 高难度(7-9片)使用全部空间或更大范围
distributionFactor = difficulty === 7 ? 1.0 : 1.1; // 7级:1.0(全部空间), 8级:1.1(扩大范围)
```

较低的分布因子使拼图更集中，较高的分布因子使拼图更分散。

### 偏移量设计

拼图在网格内的随机偏移也根据难度调整：

```
// 低难度偏移很小，拼图位置更固定
maxOffsetX = Math.min(areaCellWidth / 20, 2); 
maxOffsetY = Math.min(areaCellHeight / 20, 2);

// 中等难度有适度偏移
maxOffsetX = Math.min(areaCellWidth / 15, 4); 
maxOffsetY = Math.min(areaCellHeight / 15, 4);

// 高难度有更大偏移，位置更随机
maxOffsetX = Math.min(areaCellWidth / 8, 10); 
maxOffsetY = Math.min(areaCellHeight / 8, 10);
```

## 旋转系统设计

拼图的初始随机旋转角度根据难度和设备类型调整：

### 移动设备（竖屏模式）

为提升移动设备可玩性，采用更简化的旋转模式：

```
// 简单难度(1-3)：常用0度或90度
const rotationOptions = [0, 0, 90, 90];

// 中等难度(4-6)：使用0、90、180度
const rotationOptions = [0, 90, 90, 180];

// 高难度(7+)：使用0、90、180、270度旋转
const rotationOptions = [0, 90, 180, 270];
```

### 桌面端和移动设备横屏模式

更精细的15度增量旋转：

```
// 简单难度：0、15、30、45度
rotation = Math.floor(Math.random() * 4) * 15;

// 中等难度：0-90度，15度的倍数
rotation = Math.floor(Math.random() * 7) * 15; // 0, 15, 30, 45, 60, 75, 90

// 高难度：0-180度，15度的倍数
rotation = Math.floor(Math.random() * 13) * 15; // 0, 15, 30, ..., 180

// 极高难度：0-345度，15度的倍数
rotation = Math.floor(Math.random() * 24) * 15; // 0, 15, 30, ..., 345
```

## 设备适配策略

游戏根据不同设备类型动态调整难度参数，确保在各种设备上都有良好的游戏体验。

### 设备检测机制

游戏使用以下代码检测设备类型和屏幕方向：

```javascript
// 检测设备类型和屏幕方向
const ua = navigator.userAgent;
const isIPhone = /iPhone/i.test(ua);
const isAndroid = /Android/i.test(ua);
const isMobile = isIPhone || isAndroid;
const isPortrait = window.innerHeight > window.innerWidth;
```

### 移动设备（竖屏）适配

针对手机等小屏设备的竖屏模式，系统做出以下调整：

1. **画布尺寸**：
   - 强制使用正方形画布，确保良好的视觉效果
   - 限制最大尺寸，避免拼图超出屏幕范围
   ```javascript
   // 获取容器的较小边作为画布的宽高，确保是正方形
   const minDimension = Math.min(containerWidth, containerHeight);
   // 进一步限制最大尺寸
   const maxSize = Math.min(minDimension, 
                       isIPhone ? 320 : 360, // iPhone设备上使用更保守的尺寸
                       Math.min(screenWidth, screenHeight) * 0.9);
   ```

2. **拼图分布**：
   - 使用更紧凑的网格系统，拼图位置更集中
   - 增大安全边距，确保所有拼图在画布范围内
   ```javascript
   // 手机竖屏模式下使用极大的边距
   margin = Math.floor(canvasWidth * 0.25);
   // 使用更大的网格尺寸，使拼图分布更集中
   gridSize = Math.ceil(Math.sqrt(pieces.length * 2));
   ```

3. **拼图缩放**：
   - 自动缩小过大的拼图，确保在小屏幕上仍可操作
   ```javascript
   // 如果拼图相对画布较大，则缩小拼图
   if (pieceWidth > canvasWidth * 0.4 || pieceHeight > canvasHeight * 0.4) {
     scaleFactor = Math.min(
       (canvasWidth * 0.3) / pieceWidth,
       (canvasHeight * 0.3) / pieceHeight,
       0.8 // 最大缩放到80%
     );
   }
   ```

4. **旋转简化**：
   - 使用90度的倍数进行旋转，简化旋转操作
   - 较少的旋转选项，减轻视觉混乱

5. **边界约束**：
   - 更严格的边界检查，确保拼图完全保持在画布内
   - 提高拼图操作精度要求

### 桌面和移动设备（横屏）适配

针对桌面设备和移动设备的横屏模式：

1. **画布尺寸**：
   - 根据容器尺寸自适应调整
   - 保持合适的宽高比，避免拉伸变形
   ```javascript
   // 桌面设备或横屏模式
   canvasWidth = containerWidth;
   canvasHeight = containerHeight;
   ```

2. **拼图分布**：
   - 使用标准网格系统，拼图均匀分布
   - 适中的安全边距
   ```javascript
   // 普通设备使用标准边距
   margin = Math.min(80, Math.floor(canvasWidth * 0.15));
   ```

3. **旋转多样化**：
   - 使用15度的倍数进行精细旋转
   - 根据难度级别提供更多旋转选项
   
4. **边界约束**：
   - 标准边界检查，允许部分拼图超出边界
   - 正常操作精度要求

### 设备切换响应

游戏监听设备方向变化事件，在设备旋转时实时调整：

```javascript
// 特别监听方向变化
window.addEventListener('orientationchange', handleOrientationChange);

// 方向变化响应函数
const handleOrientationChange = () => {
  console.log('方向变化检测到，强制重新计算画布尺寸');
  // 清除之前的定时器
  if (resizeTimer.current) {
    clearTimeout(resizeTimer.current as any);
  }
  
  // 设置新的定时器，确保DOM完全更新
  resizeTimer.current = setTimeout(() => {
    handleResize();
    
    // 对于移动设备，添加额外检查
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      setTimeout(() => {
        console.log('移动设备方向变化后额外检查');
        setInitialCanvasSize(); // 完全重置画布大小
      }, 500);
    }
  }, 300) as any;
};
```

## 目标形状避开系统

为提高可玩性，拼图散开时会避开目标形状区域：

1. 检测目标形状的位置和大小
2. 在目标形状周围生成可放置区域（上、右、下、左）
3. 根据面积排序区域，优先使用更大的区域
4. 在这些区域内均匀分布拼图

## 未来可能的改进

1. **自定义难度级别**：允许玩家自定义拼图数量、切割类型和旋转范围
2. **进度保存系统**：记录玩家在不同难度级别的完成情况
3. **成就系统**：基于难度级别设计成就
4. **时间挑战模式**：增加时间限制，根据难度级别调整时间
5. **智能适应系统**：根据玩家表现动态调整难度
6. **多级切割难度**：实现更复杂的切割类型和策略
7. **自定义形状导入**：允许玩家导入自定义形状作为拼图

## 技术实现参考

难度系统主要在以下文件中实现：

- `utils/puzzle/ScatterPuzzle.ts`：拼图散开和难度参数计算
- `utils/puzzle/PuzzleGenerator.ts`：拼图生成和切割
- `contexts/GameContext.tsx`：游戏状态管理和难度逻辑控制
- `components/PuzzleCanvas.tsx`：设备适配和交互处理

## 版本历史

- **v1.0.0**：基础难度系统，根据拼图数量自动调整
- **v1.1.0**：增加设备适配，为移动设备优化难度参数
- **v1.1.1**：添加目标形状避开系统，改进拼图分布方式
- **v1.2.0**：优化旋转角度系统，确保所有角度为15度的倍数 