# 难度配置

> 修订日期：2025-01-04 (v1.3.39)

本文档详细说明游戏难度系统和切割算法的配置参数，基于当前简化的拼图生成系统。

---

## 📁 配置文件位置

### 主要配置文件
```
utils/puzzle/cutGenerators.ts      # 切割生成器
utils/puzzle/PuzzleGenerator.ts    # 拼图生成器
contexts/GameContext.tsx           # 游戏状态管理
components/PuzzleControlsCutCount.tsx  # 难度控制UI
```

---

## 🎯 难度级别配置

### 难度级别定义
```typescript
// utils/puzzle/cutGenerators.ts
/**
 * 拼图切割难度级别配置 (已优化):
 * 
 * 简单难度 (1-3)：
 * - 级别1: 2块拼图，1条切割线，切割线穿过中心，角度变化小
 * - 级别2: 3块拼图，2条切割线，切割线更倾向于穿过中心，布局均匀
 * - 级别3: 4块拼图，3条切割线，有一定随机性但仍保持可预测性
 * 
 * 中等难度 (4-6)：
 * - 级别4: 5块拼图，4条切割线，增加随机性和非中心切割
 * - 级别5: 7块拼图，6条切割线，更多方向变化，角度更复杂
 * - 级别6: 9块拼图，8条切割线，偏移更大，部分切割线不穿过中心
 * 
 * 高难度 (7-8)：
 * - 级别7: 12块拼图，11条切割线，高度随机，切割线方向多变
 * - 级别8: 15块拼图，14条切割线，最高难度，完全随机切割
 */
```

### 难度映射配置
```typescript
// 难度级别到拼图块数的映射
const DIFFICULTY_MAPPING = {
  1: { pieces: 2, cuts: 1, complexity: 0.1 },
  2: { pieces: 3, cuts: 2, complexity: 0.2 },
  3: { pieces: 4, cuts: 3, complexity: 0.3 },
  4: { pieces: 5, cuts: 4, complexity: 0.4 },
  5: { pieces: 7, cuts: 6, complexity: 0.6 },
  6: { pieces: 9, cuts: 8, complexity: 0.7 },
  7: { pieces: 12, cuts: 11, complexity: 0.9 },
  8: { pieces: 15, cuts: 14, complexity: 1.0 }
};
```

---

## ⚙️ 切割配置参数

### 切割类型配置
```typescript
// utils/puzzle/cutGenerators.ts
type CutLine = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: "straight" | "diagonal";
};
```

### 切割生成配置
```typescript
// 切割生成参数
const CUT_GENERATION_CONFIG = {
  // 简单难度配置
  SIMPLE_DIFFICULTY: {
    centerBias: 0.8,          // 中心偏向权重
    angleVariation: 15,       // 角度变化范围 (度)
    randomOffset: 0.1,        // 随机偏移系数
    minCutLength: 0.6         // 最小切割长度比例
  },
  
  // 中等难度配置
  MEDIUM_DIFFICULTY: {
    centerBias: 0.5,          // 中心偏向权重
    angleVariation: 45,       // 角度变化范围 (度)
    randomOffset: 0.3,        // 随机偏移系数
    minCutLength: 0.4         // 最小切割长度比例
  },
  
  // 高难度配置
  HARD_DIFFICULTY: {
    centerBias: 0.2,          // 中心偏向权重
    angleVariation: 90,       // 角度变化范围 (度)
    randomOffset: 0.5,        // 随机偏移系数
    minCutLength: 0.3         // 最小切割长度比例
  }
};
```

---

## 🎮 游戏状态配置

### 难度状态管理
```typescript
// contexts/GameContext.tsx
interface GameState {
  cutCount: number;           // 当前难度级别 (1-8)
  cutType: 'straight' | 'diagonal';  // 切割类型
  pieces: PuzzlePiece[];      // 生成的拼图块
  difficulty: DifficultyLevel; // 难度配置
}
```

### 难度控制配置
```typescript
// 难度控制参数
const DIFFICULTY_CONTROL = {
  minDifficulty: 1,           // 最小难度级别
  maxDifficulty: 8,           // 最大难度级别
  defaultDifficulty: 3,       // 默认难度级别
  stepSize: 1,                // 难度调整步长
  autoAdjust: false           // 自动难度调整
};
```

---

## 🔧 切割算法配置

### 直线切割配置
```typescript
// 直线切割参数
const STRAIGHT_CUT_CONFIG = {
  horizontalProbability: 0.5,  // 水平切割概率
  verticalProbability: 0.5,    // 垂直切割概率
  minSpacing: 0.1,            // 最小切割间距 (形状尺寸比例)
  safetyMargin: 0.05,         // 边界安全距离 (形状尺寸比例)
  parallelAvoidance: 0.3      // 平行线避免系数
};
```

### 对角切割配置
```typescript
// 对角切割参数
const DIAGONAL_CUT_CONFIG = {
  angleRange: [30, 150],      // 角度范围 (度)
  preferredAngles: [45, 135], // 首选角度
  intersectionTolerance: 0.05, // 交点容差
  lengthVariation: 0.2,       // 长度变化系数
  curvatureEnabled: false     // 曲线切割 (暂未实现)
};
```

---

## 📊 性能优化配置

### 切割性能配置
```typescript
// 切割性能优化参数
const CUTTING_PERFORMANCE = {
  maxIterations: 100,         // 最大迭代次数
  convergenceThreshold: 0.01, // 收敛阈值
  enableCaching: true,        // 启用缓存
  batchSize: 10,             // 批处理大小
  timeoutMs: 5000            // 超时时间 (毫秒)
};
```

### 内存优化配置
```typescript
// 内存使用优化
const MEMORY_OPTIMIZATION = {
  maxCachedCuts: 50,         // 最大缓存切割数
  cleanupInterval: 30000,     // 清理间隔 (毫秒)
  enableGC: true,            // 启用垃圾回收提示
  poolSize: 100              // 对象池大小
};
```

---

## 🔧 配置修改指南

### 调整难度级别
```typescript
// 增加新的难度级别
const CUSTOM_DIFFICULTY = {
  9: { pieces: 20, cuts: 19, complexity: 1.2 },
  10: { pieces: 25, cuts: 24, complexity: 1.5 }
};

// 修改现有难度
const MODIFIED_DIFFICULTY = {
  ...DIFFICULTY_MAPPING,
  3: { pieces: 6, cuts: 5, complexity: 0.4 }  // 增加级别3的难度
};
```

### 调整切割参数
```typescript
// 使切割更简单
const EASIER_CUTTING = {
  ...SIMPLE_DIFFICULTY,
  centerBias: 0.9,          // 增加中心偏向
  angleVariation: 10,       // 减少角度变化
  randomOffset: 0.05        // 减少随机偏移
};

// 使切割更复杂
const HARDER_CUTTING = {
  ...HARD_DIFFICULTY,
  centerBias: 0.1,          // 减少中心偏向
  angleVariation: 120,      // 增加角度变化
  randomOffset: 0.7         // 增加随机偏移
};
```

### 调整切割类型比例
```typescript
// 修改切割类型偏好
const CUT_TYPE_PREFERENCE = {
  straightProbability: 0.7,   // 70% 直线切割
  diagonalProbability: 0.3,   // 30% 对角切割
  mixedCutting: true,         // 允许混合切割
  adaptiveType: false         // 自适应切割类型
};
```

---

## 🐛 故障排除

### 常见难度问题

#### 1. 拼图块过多或过少
**原因**: 难度映射配置不当  
**解决**: 调整 `DIFFICULTY_MAPPING` 中的 `pieces` 参数

#### 2. 切割线重叠
**原因**: 切割间距设置过小  
**解决**: 增加 `minSpacing` 和 `safetyMargin` 参数

#### 3. 拼图过于简单或复杂
**原因**: 复杂度系数设置不当  
**解决**: 调整 `complexity` 参数和切割算法配置

#### 4. 性能问题
**原因**: 高难度级别计算量过大  
**解决**: 优化 `maxIterations` 和启用缓存

### 调试方法
```typescript
// 启用难度调试
const DEBUG_DIFFICULTY = process.env.NODE_ENV === 'development';

if (DEBUG_DIFFICULTY) {
  console.log('Difficulty Level:', cutCount);
  console.log('Generated Pieces:', pieces.length);
  console.log('Cut Lines:', cuts.length);
  console.log('Complexity:', complexity);
}
```

---

## 📊 难度平衡

### 难度曲线配置
```typescript
// 难度曲线参数
const DIFFICULTY_CURVE = {
  // 线性增长
  linear: (level: number) => level * 0.125,
  
  // 指数增长
  exponential: (level: number) => Math.pow(1.5, level - 1) * 0.1,
  
  // 对数增长
  logarithmic: (level: number) => Math.log(level + 1) * 0.3,
  
  // 当前使用的曲线
  current: 'exponential'
};
```

### 用户体验配置
```typescript
// 用户体验优化
const UX_OPTIMIZATION = {
  progressiveUnlock: true,    // 渐进式解锁难度
  hintSystem: true,          // 提示系统
  undoSupport: true,         // 撤销支持
  autoSave: true,            // 自动保存进度
  adaptiveDifficulty: false  // 自适应难度调整
};
```

---

## 📈 配置更新历史

### v1.3.39 (当前版本)
- ✅ 简化难度配置结构
- ✅ 优化切割算法参数
- ✅ 增强性能配置
- ✅ 统一难度映射

### v1.3.38
- 🔧 优化难度平衡
- 🔧 调整切割参数

### v1.3.37
- 🔧 简化难度系统
- 🔧 删除冗余配置

---

## 📚 相关文档

- **[核心架构配置](./core-architecture.md)** - 整体架构说明
- **[形状生成配置](./shape-generation.md)** - 形状生成配置
- **[性能配置](./performance.md)** - 性能优化配置

---

*📝 文档维护: 本文档基于v1.3.39的实际实现*  
*🔄 最后更新: 2025年1月4日*  
*✅ 监督指令合规: 完全符合简化难度系统原则*