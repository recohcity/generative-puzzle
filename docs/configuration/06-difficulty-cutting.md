# 难度与切割配置

> 修订日期：2025-01-24 (v1.3.36)

本文档详细说明游戏难度系统和切割算法的配置参数，包括切割次数、切割类型、难度映射等核心配置。

---

## 1. 切割次数配置

### cutCount
- **作用**：用户选择的拼图切割难度，决定实际切割线数和拼图块数
- **取值范围**：1~8（整数）
- **默认值**：3
- **影响点**：拼图块数量、分布、吸附、回弹等
- **配置/代码位置**：`contexts/GameContext.tsx`（状态管理）、`components/PuzzleControlsCutCount.tsx`（UI控制）、`utils/puzzle/cutGenerators.ts`（算法实现）

### cutCountMapping
- **作用**：切割次数到实际切割线数的映射关系
- **映射规则**：
  - cutCount 1-2: 简单切割，2-4条切割线
  - cutCount 3-4: 中等切割，4-6条切割线
  - cutCount 5-6: 复杂切割，6-8条切割线
  - cutCount 7-8: 高难度切割，8-12条切割线
- **默认值**：动态映射
- **影响点**：拼图复杂度、游戏难度
- **配置/代码位置**：`utils/puzzle/cutGenerators.ts`（getDifficultyConfig函数）

---

## 2. 切割类型配置

### cutType
- **作用**：决定切割线类型
- **取值范围**：'straight' | 'diagonal'
- **默认值**：'straight'
- **影响点**：切割算法、拼图块形状
- **配置/代码位置**：`contexts/GameContext.tsx`（状态管理）、`components/PuzzleControlsCutType.tsx`（UI控制）、`utils/puzzle/cutGenerators.ts`（算法选择）

### straightCutConfig
- **作用**：直线切割的配置参数
- **参数配置**：
  - 水平切割概率：0.5
  - 垂直切割概率：0.5
  - 最小切割间距：形状尺寸的10%
  - 边界安全距离：形状尺寸的5%
- **默认值**：如上所示
- **影响点**：直线切割的分布和质量
- **配置/代码位置**：`utils/puzzle/cutGenerators.ts`（generateStraightCuts函数）

### diagonalCutConfig
- **作用**：对角线切割的配置参数
- **参数配置**：
  - 对角线角度范围：30°~150°
  - 最小切割长度：形状对角线的30%
  - 交叉点避让距离：形状尺寸的8%
- **默认值**：如上所示
- **影响点**：对角线切割的角度和分布
- **配置/代码位置**：`utils/puzzle/cutGenerators.ts`（generateDiagonalCuts函数）

---

## 3. 难度映射配置

### useCenterCutProbability
- **作用**：低难度时优先生成穿过中心的切割线
- **取值范围**：0~1（随难度动态调整）
- **计算公式**：`1.0 - (cutCount - 1) * 0.1`
- **默认值**：0.8（低难度），0.2（高难度）
- **影响点**：切割线分布，低难度更规整
- **配置/代码位置**：`utils/puzzle/cutGenerators.ts`（getDifficultyConfig函数）

### useExtremeRandomness
- **作用**：高难度时放宽切割线生成条件，增加随机性
- **取值范围**：布尔值
- **判断条件**：`cutCount >= 6`
- **默认值**：false（低难度），true（高难度）
- **影响点**：切割线生成的随机性和复杂度
- **配置/代码位置**：`utils/puzzle/cutGenerators.ts`（getDifficultyConfig函数）

### difficultyThresholds
- **作用**：难度等级阈值配置
- **等级划分**：
  - 简单：cutCount 1-2
  - 中等：cutCount 3-4
  - 困难：cutCount 5-6
  - 极难：cutCount 7-8
- **默认值**：如上划分
- **影响点**：难度相关的所有算法参数
- **配置/代码位置**：`utils/puzzle/cutGenerators.ts`（难度判断逻辑）

---

## 4. 切割算法配置

### cutLineGeneration
- **作用**：切割线生成算法的核心配置
- **算法参数**：
  - 最大尝试次数：100次
  - 切割线最小长度：形状尺寸的20%
  - 切割线间最小距离：形状尺寸的15%
  - 边界检测精度：1像素
- **默认值**：如上所示
- **影响点**：切割线生成的质量和性能
- **配置/代码位置**：`utils/puzzle/cutGenerators.ts`（切割线生成函数）

### cutLineValidation
- **作用**：切割线有效性验证配置
- **验证规则**：
  - 切割线必须与形状边界相交
  - 切割线不能过于接近现有切割线
  - 切割线长度必须满足最小要求
  - 切割线不能产生过小的拼图块
- **默认值**：启用所有验证
- **影响点**：切割质量、拼图块大小分布
- **配置/代码位置**：`utils/puzzle/cutGenerators.ts`（验证函数）

### cutOptimization
- **作用**：切割优化算法配置
- **优化策略**：
  - 避免产生过小的拼图块（<总面积的5%）
  - 优化切割线分布，避免过度集中
  - 确保每个拼图块都有合理的形状
- **默认值**：启用所有优化
- **影响点**：拼图块质量、游戏体验
- **配置/代码位置**：`utils/puzzle/cutGenerators.ts`（优化函数）

---

## 5. 设备适配配置

### mobileOptimization
- **作用**：移动端切割优化配置
- **优化参数**：
  - 移动端最大切割次数：6（vs 桌面端8）
  - 移动端最小拼图块尺寸：更大（便于触摸操作）
  - 移动端切割线间距：更大（避免过密）
- **默认值**：自动根据设备类型调整
- **影响点**：移动端游戏体验
- **配置/代码位置**：`utils/puzzle/cutGenerators.ts`（设备检测逻辑）

### touchFriendlyConfig
- **作用**：触摸友好的切割配置
- **配置参数**：
  - 最小拼图块尺寸：40x40像素
  - 拼图块间最小间距：20像素
  - 避免产生细长形状的拼图块
- **默认值**：移动端启用
- **影响点**：触摸操作的准确性和便利性
- **配置/代码位置**：`utils/puzzle/cutGenerators.ts`（移动端优化）

---

## 6. 性能优化配置

### cutGenerationPerformance
- **作用**：切割生成性能优化配置
- **优化策略**：
  - 限制最大尝试次数，避免无限循环
  - 使用空间索引加速碰撞检测
  - 缓存重复计算结果
- **性能目标**：
  - 简单切割：<100ms
  - 复杂切割：<500ms
  - 极难切割：<1000ms
- **配置/代码位置**：`utils/puzzle/cutGenerators.ts`（性能优化逻辑）

### memoryOptimization
- **作用**：切割算法内存优化配置
- **优化策略**：
  - 及时释放临时数据结构
  - 避免创建不必要的中间对象
  - 重用几何计算结果
- **默认值**：启用所有优化
- **影响点**：内存使用稳定性
- **配置/代码位置**：`utils/puzzle/cutGenerators.ts`（内存管理）

---

## 7. 调试配置

### cutDebugMode
- **作用**：切割算法调试模式配置
- **调试功能**：
  - 显示切割线生成过程
  - 输出切割统计信息
  - 验证拼图块完整性
- **默认值**：开发环境启用，生产环境禁用
- **影响点**：开发调试效率
- **配置/代码位置**：`utils/puzzle/cutGenerators.ts`（调试日志）

### cutVisualization
- **作用**：切割过程可视化配置
- **可视化内容**：
  - 切割线轨迹
  - 拼图块边界
  - 切割统计数据
- **默认值**：调试模式下启用
- **影响点**：算法理解和优化
- **配置/代码位置**：`utils/puzzle/cutGenerators.ts`（可视化函数）

---

## 8. 配置示例

### 基础配置示例
```typescript
// 切割配置示例
const cutConfig = {
  cutCount: 4,
  cutType: 'straight',
  useCenterCutProbability: 0.6,
  useExtremeRandomness: false,
  maxAttempts: 100,
  minCutLength: 0.2,
  minCutDistance: 0.15
};
```

### 高级配置示例
```typescript
// 设备适配配置示例
const deviceOptimizedConfig = {
  mobile: {
    maxCutCount: 6,
    minPieceSize: 40,
    minPieceSpacing: 20,
    touchFriendly: true
  },
  desktop: {
    maxCutCount: 8,
    minPieceSize: 30,
    minPieceSpacing: 15,
    touchFriendly: false
  }
};
```

---

## 9. 故障排除

### 常见问题
1. **切割线生成失败**：检查形状复杂度和切割参数
2. **拼图块过小**：调整最小拼图块尺寸配置
3. **切割性能差**：检查最大尝试次数和优化配置
4. **移动端体验差**：确认触摸友好配置已启用

### 调试方法
- 启用切割调试模式
- 检查切割统计信息
- 验证拼图块完整性
- 监控切割性能指标

---

> 📖 **相关文档**
> - [形状生成配置](./07-shape-generation.md)
> - [拼图散开与分布配置](./08-puzzle-scatter.md)
> - [游戏难度设计说明](../difficulty-design.md)