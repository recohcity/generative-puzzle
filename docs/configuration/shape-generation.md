# 形状生成配置

> 修订日期：2025-01-04 (v1.3.39)

本文档详细说明形状生成系统的配置参数，基于当前简化的ShapeGenerator实现。

---

## 📁 配置文件位置

### 主要配置文件
```
utils/shape/ShapeGenerator.ts      # 形状生成器
utils/shape/geometryUtils.ts       # 几何工具函数
contexts/GameContext.tsx           # 游戏状态管理
components/ShapeControls.tsx       # 形状控制UI
```

---

## 🎯 形状类型配置

### 支持的形状类型
```typescript
// types/puzzleTypes.ts
export type ShapeType = "polygon" | "curve" | "irregular";
```

### 形状类型特性
```typescript
// 形状类型配置
const SHAPE_TYPE_CONFIG = {
  polygon: {
    description: "多边形",
    complexity: "简单",
    performance: "高",
    suitableFor: ["初学者", "快速游戏"]
  },
  curve: {
    description: "曲线形状",
    complexity: "中等",
    performance: "中等",
    suitableFor: ["中级玩家", "视觉效果"]
  },
  irregular: {
    description: "不规则形状",
    complexity: "复杂",
    performance: "中等",
    suitableFor: ["高级玩家", "挑战模式"]
  }
};
```

---

## ⚙️ 形状生成参数

### 标准化配置
```typescript
// utils/shape/ShapeGenerator.ts
export class ShapeGenerator {
  // 使用固定的画布尺寸标准化所有形状
  private static readonly STANDARD_SIZE = 1000;
  
  // 形状尺寸配置 (恢复v1.3.35的配置)
  private static readonly SHAPE_CONFIG = {
    baseRadius: STANDARD_SIZE * 0.15,  // 标准尺寸的15%
    radiusVariation: 0.8,              // 半径变化系数
    amplitude: 0.08,                   // 振幅值 (v1.3.35)
    detail: 200                        // 高密度点数 (平滑曲线)
  };
}
```

### 多边形配置
```typescript
// 多边形生成参数
const POLYGON_CONFIG = {
  numPoints: 8,                 // 默认顶点数
  minRadius: baseRadius * 0.8,  // 最小半径
  maxRadius: baseRadius,        // 最大半径
  regularityFactor: 0.9,        // 规则性系数 (0-1)
  angleVariation: 0.1           // 角度变化系数
};
```

### 曲线形状配置
```typescript
// 曲线形状生成参数
const CURVE_CONFIG = {
  detail: 200,                  // 曲线细节点数
  amplitude: 0.08,              // 曲线振幅
  frequency: 6,                 // 频率 (波数)
  smoothness: 0.8,              // 平滑度
  randomSeed: Math.random()     // 随机种子
};
```

### 不规则形状配置
```typescript
// 不规则形状生成参数
const IRREGULAR_CONFIG = {
  basePoints: 12,               // 基础控制点数
  irregularityFactor: 0.3,      // 不规则性系数
  minRadius: baseRadius * 0.7,  // 最小半径
  maxRadius: baseRadius * 1.2,  // 最大半径
  noiseScale: 0.1               // 噪声缩放
};
```

---

## 🎮 游戏状态配置

### 形状状态管理
```typescript
// contexts/GameContext.tsx
interface GameState {
  shapeType: ShapeType;         // 当前形状类型
  currentShape: Point[];        // 当前形状点集
  shapeComplexity: number;      // 形状复杂度 (1-10)
  adaptedShape: Point[];        // 适配后的形状
}
```

### 形状控制配置
```typescript
// 形状控制参数
const SHAPE_CONTROL = {
  availableTypes: ['polygon', 'curve', 'irregular'],
  defaultType: 'polygon',       // 默认形状类型
  allowRandomGeneration: true,  // 允许随机生成
  enablePreview: true,          // 启用预览
  autoAdaptation: true          // 自动适配
};
```

---

## 📐 几何参数配置

### 尺寸配置
```typescript
// 形状尺寸参数
const SIZE_CONFIG = {
  standardSize: 1000,           // 标准化尺寸
  minShapeSize: 200,            // 最小形状尺寸
  maxShapeSize: 800,            // 最大形状尺寸
  aspectRatioRange: [0.7, 1.3], // 宽高比范围
  scaleFactor: 1.0              // 全局缩放因子
};
```

### 位置配置
```typescript
// 形状位置参数
const POSITION_CONFIG = {
  centerX: STANDARD_SIZE / 2,   // 中心X坐标
  centerY: STANDARD_SIZE / 2,   // 中心Y坐标
  offsetRange: 0.1,             // 偏移范围 (相对于尺寸)
  rotationRange: [0, 360],      // 旋转角度范围
  enableCentering: true         // 启用自动居中
};
```

---

## 🔧 性能优化配置

### 生成性能配置
```typescript
// 形状生成性能参数
const GENERATION_PERFORMANCE = {
  maxGenerationTime: 1000,      // 最大生成时间 (毫秒)
  enableCaching: true,          // 启用形状缓存
  cacheSize: 20,               // 缓存大小
  simplificationThreshold: 0.5, // 简化阈值
  enableLOD: true              // 启用细节层次
};
```

### 内存优化配置
```typescript
// 内存使用优化
const MEMORY_OPTIMIZATION = {
  maxCachedShapes: 10,         // 最大缓存形状数
  pointPoolSize: 1000,         // 点对象池大小
  enableGC: true,              // 启用垃圾回收提示
  cleanupInterval: 30000       // 清理间隔 (毫秒)
};
```

---

## 📱 设备适配配置

### 移动端适配
```typescript
// 移动端形状配置
const MOBILE_SHAPE_CONFIG = {
  preferredTypes: ['polygon', 'curve'], // 首选形状类型
  maxComplexity: 6,            // 最大复杂度
  simplificationEnabled: true,  // 启用简化
  touchOptimization: true,     // 触摸优化
  reducedDetail: true          // 减少细节
};
```

### 桌面端配置
```typescript
// 桌面端形状配置
const DESKTOP_SHAPE_CONFIG = {
  preferredTypes: ['polygon', 'curve', 'irregular'], // 支持所有类型
  maxComplexity: 10,           // 最大复杂度
  highDetailEnabled: true,     // 启用高细节
  advancedFeatures: true,      // 高级功能
  fullResolution: true         // 全分辨率
};
```

---

## 🔧 配置修改指南

### 调整形状尺寸
```typescript
// 增大形状尺寸
const LARGER_SHAPES = {
  ...SHAPE_CONFIG,
  baseRadius: STANDARD_SIZE * 0.2,  // 从15%增加到20%
  minRadius: baseRadius * 0.9       // 调整最小半径
};

// 减小形状尺寸
const SMALLER_SHAPES = {
  ...SHAPE_CONFIG,
  baseRadius: STANDARD_SIZE * 0.12, // 从15%减少到12%
  maxRadius: baseRadius * 1.1       // 调整最大半径
};
```

### 调整形状复杂度
```typescript
// 增加复杂度
const MORE_COMPLEX = {
  numPoints: 12,               // 增加顶点数
  detail: 300,                 // 增加细节点数
  amplitude: 0.12,             // 增加振幅
  irregularityFactor: 0.5      // 增加不规则性
};

// 减少复杂度
const LESS_COMPLEX = {
  numPoints: 6,                // 减少顶点数
  detail: 100,                 // 减少细节点数
  amplitude: 0.05,             // 减少振幅
  irregularityFactor: 0.1      // 减少不规则性
};
```

### 调整性能参数
```typescript
// 高性能配置 (适用于低端设备)
const HIGH_PERFORMANCE = {
  detail: 50,                  // 大幅减少细节
  enableCaching: true,         // 启用缓存
  simplificationThreshold: 0.8, // 提高简化阈值
  maxGenerationTime: 500       // 减少生成时间
};

// 高质量配置 (适用于高端设备)
const HIGH_QUALITY = {
  detail: 400,                 // 增加细节
  enableCaching: false,        // 禁用缓存 (实时生成)
  simplificationThreshold: 0.1, // 降低简化阈值
  maxGenerationTime: 2000      // 增加生成时间
};
```

---

## 🐛 故障排除

### 常见形状生成问题

#### 1. 形状生成失败
**原因**: 参数配置超出合理范围  
**解决**: 检查 `numPoints`, `radius` 等参数是否在有效范围内

#### 2. 形状过于简单或复杂
**原因**: 复杂度参数设置不当  
**解决**: 调整 `amplitude`, `irregularityFactor` 等复杂度参数

#### 3. 性能问题
**原因**: 细节点数过多或缓存未启用  
**解决**: 减少 `detail` 参数或启用缓存机制

#### 4. 移动端显示异常
**原因**: 形状尺寸或复杂度不适合移动端  
**解决**: 使用移动端专用配置

### 调试方法
```typescript
// 启用形状生成调试
const DEBUG_SHAPE_GENERATION = process.env.NODE_ENV === 'development';

if (DEBUG_SHAPE_GENERATION) {
  console.log('Shape Type:', shapeType);
  console.log('Generated Points:', points.length);
  console.log('Shape Bounds:', bounds);
  console.log('Generation Time:', generationTime);
}
```

---

## 📊 形状质量评估

### 质量指标配置
```typescript
// 形状质量评估参数
const QUALITY_METRICS = {
  minArea: 1000,               // 最小面积
  maxArea: 500000,             // 最大面积
  minPerimeter: 200,           // 最小周长
  aspectRatioTolerance: 0.3,   // 宽高比容差
  convexityThreshold: 0.8,     // 凸性阈值
  smoothnessThreshold: 0.9     // 平滑度阈值
};
```

### 自动优化配置
```typescript
// 自动形状优化
const AUTO_OPTIMIZATION = {
  enableAutoFix: true,         // 启用自动修复
  maxRetries: 3,               // 最大重试次数
  fallbackToSimple: true,      // 失败时回退到简单形状
  qualityThreshold: 0.7,       // 质量阈值
  enableValidation: true       // 启用验证
};
```

---

## 📈 配置更新历史

### v1.3.39 (当前版本)
- ✅ 恢复v1.3.35的形状尺寸配置
- ✅ 优化形状生成性能
- ✅ 简化配置参数结构
- ✅ 增强设备适配

### v1.3.38
- 🔧 调整形状复杂度参数
- 🔧 优化移动端适配

### v1.3.37
- 🔧 简化形状生成系统
- 🔧 删除冗余配置

---

## 📚 相关文档

- **[核心架构配置](./core-architecture.md)** - 整体架构说明
- **[难度配置](./difficulty-cutting.md)** - 难度和切割配置
- **[适配系统配置](./adaptation-system.md)** - 适配系统配置

---

*📝 文档维护: 本文档基于v1.3.39的实际实现*  
*🔄 最后更新: 2025年1月4日*  
*✅ 监督指令合规: 完全符合简化形状生成原则*