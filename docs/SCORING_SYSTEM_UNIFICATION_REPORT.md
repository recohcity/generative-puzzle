# 计分系统统一修复报告

## 问题描述

在检查 `GameContext.tsx`、`ScoreCalculator.ts` 与修订过的切割难度 `cutGeneratorConfig.ts` 时发现，系统使用了不同的难度和计分逻辑，导致计分显示混乱。主要问题包括：

1. **多套难度计分逻辑并存**：存在基于拼图数量和基于切割次数两套不同的计分系统
2. **常量定义缺失**：`ScoreCalculator.ts` 中缺少 `BASE_SCORES` 和 `PIECE_MULTIPLIERS` 常量定义
3. **逻辑不一致**：`cutGeneratorConfig.ts` 产生动态随机拼图数量，但计分系统仍使用固定的拼图数量映射
4. **计分混乱**：不同模块使用不同的难度计算方式，导致分数计算不准确

## 修复方案

### 1. 统一基于切割次数的计分逻辑

**修复文件**: `utils/score/ScoreCalculator.ts`

- ✅ 添加缺失的 `BASE_SCORES` 和 `PIECE_MULTIPLIERS` 常量定义
- ✅ 创建基于切割次数的新计分系统：
  - `BASE_SCORES_BY_CUT_COUNT`: 基于切割次数的基础分数表
  - `DIFFICULTY_MULTIPLIERS_BY_CUT_COUNT`: 基于切割次数的难度系数表
- ✅ 更新主要计分函数使用统一的基于切割次数的逻辑：
  - `getBaseScore()`: 现在基于 `cutCount` 而不是 `actualPieces`
  - `calculateDifficultyMultiplier()`: 使用 `DIFFICULTY_MULTIPLIERS_BY_CUT_COUNT`
- ✅ 保留兼容性函数（标记为废弃）：
  - `getBaseScoreByPieces()`: 基于拼图数量的旧函数
  - `getBaseDifficultyMultiplierByPieces()`: 基于拼图数量的旧函数

### 2. 支持动态拼图数量

**修复文件**: `utils/score/ScoreCalculator.ts`

- ✅ 扩展 `BASE_SCORES` 和 `PIECE_MULTIPLIERS` 支持 2-16 片拼图
- ✅ 支持 `cutGeneratorConfig.ts` 产生的动态随机拼图数量
- ✅ 确保计分系统与切割配置完全兼容

### 3. 更新游戏上下文

**修复文件**: `contexts/GameContext.tsx`

- ✅ 更新 `SCATTER_PUZZLE` 动作中的难度配置逻辑
- ✅ 确保使用实际生成的拼图数量（支持动态数量）
- ✅ 保持与 `cutGeneratorConfig.ts` 的一致性

### 4. 统一难度工具函数

**修复文件**: `utils/difficulty/DifficultyUtils.ts`

- ✅ 更新 `calculateDifficultyLevel()` 与 `cutGeneratorConfig.ts` 保持一致
- ✅ 标记旧函数为废弃，引导使用新的基于切割次数的系统
- ✅ 保持向后兼容性

### 5. 更新测试系统

**修复文件**: `utils/score/__tests__/ScoreCalculator.test.ts`

- ✅ 更新测试用例使用新的基于切割次数的逻辑
- ✅ 添加兼容性测试确保旧函数仍能正常工作
- ✅ 验证所有计分函数的一致性

## 修复后的系统架构

### 统一的计分逻辑

```typescript
// 基于切割次数的基础分数表（与cutGeneratorConfig.ts保持一致）
const BASE_SCORES_BY_CUT_COUNT: Record<number, number> = {
  1: 800,    // 1次切割 -> 基础分800
  2: 900,    // 2次切割 -> 基础分900
  3: 1000,   // 3次切割 -> 基础分1000
  4: 1200,   // 4次切割 -> 基础分1200
  5: 1400,   // 5次切割 -> 基础分1400
  6: 1600,   // 6次切割 -> 基础分1600
  7: 1800,   // 7次切割 -> 基础分1800
  8: 2000    // 8次切割 -> 基础分2000
};

// 基于切割次数的难度系数表
const DIFFICULTY_MULTIPLIERS_BY_CUT_COUNT: Record<number, number> = {
  1: 1.0,    // 1次切割 -> 系数1.0
  2: 1.1,    // 2次切割 -> 系数1.1
  3: 1.2,    // 3次切割 -> 系数1.2
  4: 1.4,    // 4次切割 -> 系数1.4
  5: 1.6,    // 5次切割 -> 系数1.6
  6: 1.8,    // 6次切割 -> 系数1.8
  7: 2.2,    // 7次切割 -> 系数2.2
  8: 2.5     // 8次切割 -> 系数2.5
};
```

### 计分流程

1. **基础分数**: 基于 `cutCount` 从 `BASE_SCORES_BY_CUT_COUNT` 获取
2. **难度系数**: 基于 `cutCount` 从 `DIFFICULTY_MULTIPLIERS_BY_CUT_COUNT` 获取
3. **切割类型系数**: 斜线切割 ×1.2，直线切割 ×1.0
4. **设备系数**: 移动端 ×1.1，桌面端 ×1.0
5. **最终系数**: `baseMultiplier × cutTypeMultiplier × deviceMultiplier`

### 动态拼图数量支持

- ✅ 支持 `cutGeneratorConfig.ts` 产生的 2-16 片随机拼图数量
- ✅ 计分系统自动适配实际生成的拼图数量
- ✅ 保持与切割配置的完全一致性

## 验证结果

### 1. 语法检查
- ✅ `utils/score/ScoreCalculator.ts`: 无语法错误
- ✅ `contexts/GameContext.tsx`: 无语法错误
- ✅ `utils/difficulty/DifficultyUtils.ts`: 无语法错误
- ✅ `utils/score/__tests__/ScoreCalculator.test.ts`: 无语法错误

### 2. 逻辑一致性
- ✅ 所有计分函数使用统一的基于切割次数的逻辑
- ✅ 支持 `cutGeneratorConfig.ts` 的动态拼图数量
- ✅ 保持向后兼容性

### 3. 测试覆盖
- ✅ 更新测试用例验证新的计分逻辑
- ✅ 添加兼容性测试确保旧函数正常工作
- ✅ 验证所有计分函数的一致性

## 总结

通过这次修复，我们成功：

1. **消除了多套难度计分逻辑并存的问题**
2. **统一了基于切割次数的计分系统**
3. **支持了 `cutGeneratorConfig.ts` 的动态拼图数量**
4. **保持了向后兼容性**
5. **确保了计分显示的一致性和准确性**

现在整个系统的难度和计分逻辑完全统一，与 `cutGeneratorConfig.ts` 保持完全一致，支持动态随机拼图数量，消除了计分混乱和歧义问题。

## 后续建议

1. **监控**: 在生产环境中监控计分系统的表现
2. **优化**: 根据用户反馈进一步优化计分算法
3. **文档**: 更新相关文档以反映新的计分系统
4. **清理**: 在确认系统稳定后，可以考虑移除标记为废弃的兼容性函数
