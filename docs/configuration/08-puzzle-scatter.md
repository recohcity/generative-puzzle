# 拼图散开与分布配置

> 修订日期：2025-01-24 (v1.3.36)

本文档详细说明拼图散开与分布系统的配置参数，包括分布算法、散开范围、安全边距、设备适配等核心配置。

---

## 1. 分布算法配置

### distributionType
- **作用**：决定拼图块散布算法
- **取值范围**：'spiral'（竖屏）| 'grid'（桌面/横屏）
- **自动切换**：根据设备/方向自动选择
- **默认值**：随设备/方向自动切换
- **影响点**：拼图初始分布模式、用户体验
- **配置/代码位置**：`utils/puzzle/ScatterPuzzle.ts`、`components/GameInterface.tsx`

### spiralDistribution
- **作用**：螺旋分布算法配置（移动端竖屏）
- **算法参数**：
  - 起始半径：50px
  - 螺旋间距：30px
  - 角度增量：45度
  - 最大圈数：5圈
- **默认值**：如上所示
- **影响点**：竖屏模式下拼图块的分布效果
- **配置/代码位置**：`utils/puzzle/ScatterPuzzle.ts`（螺旋算法）

### gridDistribution
- **作用**：网格分布算法配置（桌面端/横屏）
- **算法参数**：
  - 网格行数：动态计算
  - 网格列数：动态计算
  - 单元格间距：40px
  - 随机偏移：±15px
- **默认值**：如上所示
- **影响点**：桌面端和横屏模式下拼图块的分布效果
- **配置/代码位置**：`utils/puzzle/ScatterPuzzle.ts`（网格算法）

### distributionStrategy
- **作用**：分布策略选择配置
- **策略选择**：
  - 设备类型检测
  - 屏幕方向检测
  - 画布尺寸分析
  - 拼图块数量考虑
- **默认值**：智能策略选择
- **影响点**：分布算法的自动选择
- **配置/代码位置**：`utils/puzzle/ScatterPuzzle.ts`（策略选择逻辑）

---

## 2. 散开范围配置

### distributionFactor
- **作用**：控制拼图块分散程度
- **取值范围**：0.5~2.0（随难度动态调整）
- **难度映射**：
  - 简单：0.8（较集中）
  - 中等：1.0（标准）
  - 困难：1.5（较分散）
  - 极难：2.0（最分散）
- **默认值**：1.0
- **影响点**：拼图块间距、游戏难度
- **配置/代码位置**：`utils/puzzle/ScatterPuzzle.ts`

### scatterRadius
- **作用**：散开半径配置
- **计算公式**：`baseRadius * distributionFactor * canvasScale`
- **基础半径**：
  - 桌面端：120px
  - 移动端：80px
- **动态调整**：根据画布尺寸和拼图块数量调整
- **默认值**：动态计算
- **影响点**：拼图块的散开范围
- **配置/代码位置**：`utils/puzzle/ScatterPuzzle.ts`（半径计算）

### scatterBounds
- **作用**：散开边界配置
- **边界定义**：
  - 最小X：safeMargin
  - 最大X：canvasWidth - safeMargin
  - 最小Y：safeMargin
  - 最大Y：canvasHeight - safeMargin
- **默认值**：基于安全边距计算
- **影响点**：拼图块的可散开区域
- **配置/代码位置**：`utils/puzzle/ScatterPuzzle.ts`（边界计算）

---

## 3. 安全边距配置

### safeMargin
- **作用**：画布边缘安全距离，防止拼图超出可视区域
- **取值范围**：20~80（像素，随设备/难度动态调整）
- **设备适配**：
  - 桌面端：40px
  - 移动端竖屏：30px
  - 移动端横屏：25px
- **默认值**：40px
- **影响点**：拼图块初始位置、边界检测
- **配置/代码位置**：`utils/puzzle/ScatterPuzzle.ts`

### adaptiveSafeMargin
- **作用**：自适应安全边距配置
- **适应因素**：
  - 画布尺寸
  - 拼图块大小
  - 设备类型
  - 触摸精度要求
- **计算公式**：`baseMargin + (pieceSize * 0.1) + deviceOffset`
- **默认值**：启用自适应计算
- **影响点**：不同场景下的边距优化
- **配置/代码位置**：`utils/puzzle/ScatterPuzzle.ts`（自适应计算）

### boundaryDetection
- **作用**：边界检测配置
- **检测方式**：
  - 拼图块中心点检测
  - 拼图块边界框检测
  - 碰撞预测检测
- **默认值**：启用边界框检测
- **影响点**：拼图块位置的有效性验证
- **配置/代码位置**：`utils/puzzle/ScatterPuzzle.ts`（边界检测逻辑）

---

## 4. 旋转配置

### initialRotationRange
- **作用**：拼图块散开时的初始角度范围
- **取值范围**：0~345（度，随设备/难度动态调整）
- **设备适配**：
  - 竖屏：0~90度（较小范围）
  - 桌面/横屏：0~180度（较大范围）
- **难度调整**：
  - 简单：0~45度
  - 中等：0~90度
  - 困难：0~180度
  - 极难：0~345度
- **默认值**：0~90（竖屏），0~180（桌面/横屏）
- **影响点**：拼图初始状态、游戏难度
- **配置/代码位置**：`utils/puzzle/ScatterPuzzle.ts`

### rotationStep
- **作用**：每次旋转的角度增量
- **取值范围**：15（度，常量）
- **默认值**：15度
- **影响点**：旋转操作、吸附判定
- **配置/代码位置**：`utils/puzzle/ScatterPuzzle.ts`、`contexts/GameContext.tsx`

### rotationRandomization
- **作用**：旋转随机化配置
- **随机策略**：
  - 完全随机：每个拼图块独立随机角度
  - 分组随机：相邻拼图块使用相似角度
  - 渐进随机：角度逐渐变化
- **默认值**：完全随机
- **影响点**：拼图块旋转的多样性
- **配置/代码位置**：`utils/puzzle/ScatterPuzzle.ts`（随机化逻辑）

---

## 5. 碰撞检测配置

### collisionDetection
- **作用**：拼图块间碰撞检测配置
- **检测算法**：
  - 边界框碰撞检测
  - 圆形碰撞检测
  - 精确多边形碰撞检测
- **默认值**：边界框检测（性能平衡）
- **影响点**：拼图块分布的合理性
- **配置/代码位置**：`utils/puzzle/ScatterPuzzle.ts`（碰撞检测）

### collisionAvoidance
- **作用**：碰撞避免策略配置
- **避免策略**：
  - 位置重新计算
  - 角度微调
  - 距离增加
- **最大尝试次数**：50次
- **默认值**：启用碰撞避免
- **影响点**：拼图块分布的质量
- **配置/代码位置**：`utils/puzzle/ScatterPuzzle.ts`（避免策略）

### overlapTolerance
- **作用**：重叠容忍度配置
- **容忍范围**：0~10像素
- **默认值**：5像素
- **影响点**：碰撞检测的严格程度
- **配置/代码位置**：`utils/puzzle/ScatterPuzzle.ts`（容忍度设置）

---

## 6. 设备适配配置

### mobileScatterOptimization
- **作用**：移动端散开优化配置
- **优化策略**：
  - 减少散开范围，便于触摸操作
  - 增加拼图块间距，避免误触
  - 优化旋转角度范围
- **优化参数**：
  - 散开系数：0.8（vs 桌面端1.0）
  - 最小间距：40px（vs 桌面端30px）
  - 旋转范围：0~90度（vs 桌面端0~180度）
- **默认值**：移动端自动启用
- **影响点**：移动端用户体验
- **配置/代码位置**：`utils/puzzle/ScatterPuzzle.ts`（移动端优化）

### touchFriendlySpacing
- **作用**：触摸友好间距配置
- **间距要求**：
  - 最小触摸目标：44x44px
  - 拼图块间最小距离：40px
  - 边缘安全距离：30px
- **默认值**：移动端启用
- **影响点**：触摸操作的准确性
- **配置/代码位置**：`utils/puzzle/ScatterPuzzle.ts`（触摸优化）

### devicePerformanceOptimization
- **作用**：设备性能优化配置
- **优化策略**：
  - 低端设备：减少拼图块数量，简化算法
  - 高端设备：提高分布质量，增加细节
- **性能检测**：基于设备类型和性能指标
- **默认值**：启用性能优化
- **影响点**：不同设备的性能表现
- **配置/代码位置**：`utils/puzzle/ScatterPuzzle.ts`（性能优化）

---

## 7. 散开动画配置

### scatterAnimation
- **作用**：散开动画配置
- **动画参数**：
  - 动画时长：800ms
  - 缓动函数：ease-out
  - 延迟间隔：50ms（拼图块间）
- **默认值**：启用散开动画
- **影响点**：散开过程的视觉效果
- **配置/代码位置**：`utils/puzzle/ScatterPuzzle.ts`（动画逻辑）

### animationSequence
- **作用**：动画序列配置
- **序列策略**：
  - 从中心向外扩散
  - 按拼图块大小排序
  - 随机序列
- **默认值**：从中心向外扩散
- **影响点**：动画的视觉效果
- **配置/代码位置**：`utils/puzzle/ScatterPuzzle.ts`（序列控制）

### animationPerformance
- **作用**：动画性能配置
- **性能优化**：
  - 使用CSS transform替代position
  - 启用硬件加速
  - 批量DOM更新
- **默认值**：启用性能优化
- **影响点**：动画的流畅度
- **配置/代码位置**：动画实现逻辑

---

## 8. 散开状态管理配置

### scatterState
- **作用**：散开状态管理配置
- **状态类型**：
  - 未散开：拼图块重叠在目标形状上
  - 散开中：正在执行散开动画
  - 已散开：拼图块分布在画布上
- **默认值**：未散开
- **影响点**：游戏流程控制
- **配置/代码位置**：`contexts/GameContext.tsx`（状态管理）

### scatterTrigger
- **作用**：散开触发配置
- **触发方式**：
  - 用户点击散开按钮
  - 自动散开（可配置）
  - 程序化触发
- **默认值**：用户手动触发
- **影响点**：游戏交互方式
- **配置/代码位置**：`components/PuzzleControlsScatter.tsx`

### scatterValidation
- **作用**：散开有效性验证配置
- **验证规则**：
  - 所有拼图块在画布内
  - 拼图块间无重叠
  - 拼图块可交互
- **默认值**：启用完整验证
- **影响点**：散开结果的质量保证
- **配置/代码位置**：`utils/puzzle/ScatterPuzzle.ts`（验证逻辑）

---

## 9. 性能优化配置

### scatterPerformance
- **作用**：散开算法性能优化配置
- **优化策略**：
  - 空间索引加速碰撞检测
  - 批量计算位置
  - 缓存计算结果
- **性能目标**：
  - 散开计算时间：< 200ms
  - 动画帧率：> 30fps
  - 内存使用：< 20MB
- **默认值**：启用所有优化
- **影响点**：散开过程的性能表现
- **配置/代码位置**：`utils/puzzle/ScatterPuzzle.ts`（性能优化）

### memoryManagement
- **作用**：散开过程内存管理配置
- **管理策略**：
  - 及时释放临时计算数据
  - 重用位置计算结果
  - 避免内存泄漏
- **默认值**：启用内存管理
- **影响点**：内存使用的稳定性
- **配置/代码位置**：`utils/puzzle/ScatterPuzzle.ts`（内存管理）

### algorithmOptimization
- **作用**：算法优化配置
- **优化方法**：
  - 使用高效的数据结构
  - 减少不必要的计算
  - 并行处理可能的计算
- **默认值**：启用算法优化
- **影响点**：散开算法的执行效率
- **配置/代码位置**：`utils/puzzle/ScatterPuzzle.ts`（算法实现）

---

## 10. 调试配置

### scatterDebugMode
- **作用**：散开调试模式配置
- **调试功能**：
  - 显示散开计算过程
  - 输出位置计算详情
  - 验证散开结果
- **默认值**：开发环境启用，生产环境禁用
- **影响点**：开发调试效率
- **配置/代码位置**：`utils/puzzle/ScatterPuzzle.ts`（调试日志）

### scatterVisualization
- **作用**：散开过程可视化配置
- **可视化内容**：
  - 散开路径轨迹
  - 碰撞检测区域
  - 安全边距显示
- **默认值**：调试模式下启用
- **影响点**：算法理解和优化
- **配置/代码位置**：`utils/puzzle/ScatterPuzzle.ts`（可视化函数）

---

## 11. 配置示例

### 基础散开配置示例
```typescript
// 散开配置示例
const scatterConfig = {
  distribution: {
    type: 'auto', // 'spiral' | 'grid' | 'auto'
    factor: 1.0,
    radius: 'dynamic'
  },
  safety: {
    margin: 40,
    adaptive: true,
    boundaryDetection: true
  },
  rotation: {
    range: [0, 180],
    step: 15,
    randomization: 'full'
  }
};
```

### 设备适配配置示例
```typescript
// 设备特定散开配置
const deviceScatterConfig = {
  mobile: {
    distribution: { type: 'spiral', factor: 0.8 },
    safety: { margin: 30 },
    rotation: { range: [0, 90] },
    touchFriendly: true
  },
  desktop: {
    distribution: { type: 'grid', factor: 1.0 },
    safety: { margin: 40 },
    rotation: { range: [0, 180] },
    touchFriendly: false
  }
};
```

### 性能优化配置示例
```typescript
// 性能优化配置
const performanceConfig = {
  scatter: {
    maxCalculationTime: 200,
    spatialIndexing: true,
    batchProcessing: true
  },
  animation: {
    duration: 800,
    easing: 'ease-out',
    hardwareAcceleration: true
  },
  memory: {
    caching: true,
    cleanup: true,
    reuse: true
  }
};
```

---

## 12. 故障排除

### 常见问题
1. **拼图块重叠**：检查碰撞检测和避免策略配置
2. **散开超出边界**：验证安全边距和边界检测配置
3. **散开性能差**：调整性能优化和算法配置
4. **移动端体验差**：确认移动端优化配置已启用

### 调试方法
- 启用散开调试模式
- 检查散开计算参数
- 验证设备适配配置
- 监控散开性能指标

---

> 📖 **相关文档**
> - [形状生成配置](./07-shape-generation.md)
> - [碰撞与回弹配置](./09-collision-bounce.md)
> - [旋转配置](./10-rotation.md)