# Step3 拼图块适配系统 - 设计文档

## 概述

基于Step2完成的形状适配系统，设计一个简化的拼图块同步适配机制。核心思路是让拼图块完全跟随目标形状的适配结果，使用相同的变换参数，确保完美拼合状态。

## 架构

### 系统架构图
```
拼图块适配系统
├── 形状适配层 (Step2已完成)
│   ├── useShapeAdaptation Hook
│   ├── 拓扑记忆系统
│   └── 智能适配规则
├── 拼图块适配层 (Step3新增)
│   ├── puzzlePieceAdaptationUtils
│   ├── 变换计算算法
│   └── 批量处理优化
└── 集成层
    ├── GameContext状态同步
    ├── Hook协调机制
    └── 错误处理与回退
```

### 核心设计原则
1. **跟随形状适配**: 拼图块完全跟随目标形状的适配结果
2. **保持拼合状态**: 确保拼图块始终完美拼合，无缝隙无重叠
3. **同步缩放**: 拼图块与目标形状使用相同的缩放比例和中心点
4. **简化实现**: 基于Step2的形状适配结果，直接应用到拼图块

## 组件和接口

### 核心组件

#### 1. puzzlePieceAdaptationUtils.ts
```typescript
// 形状变换计算
interface ShapeTransformation {
  scale: number;
  offsetX: number;
  offsetY: number;
  originalCenter: Point;
  adaptedCenter: Point;
}

// 核心函数接口
function calculateShapeTransformation(
  originalShape: Point[], 
  adaptedShape: Point[]
): ShapeTransformation;

function adaptPuzzlePiecesToShape(
  pieces: PuzzlePiece[],
  transformation: ShapeTransformation
): PuzzlePiece[];
```

#### 2. useShapeAdaptation Hook扩展
```typescript
// 扩展现有Hook，集成拼图块适配
export const useShapeAdaptation = (canvasSize: CanvasSize | null) => {
  // 现有形状适配逻辑
  // + 新增拼图块同步适配逻辑
  
  useEffect(() => {
    // 1. 适配目标形状
    const adaptedShape = adaptShape(originalShape, previousCanvasSize, canvasSize);
    
    // 2. 如果存在未散开的拼图块，同步适配
    if (puzzle && puzzle.length > 0 && !state.isScattered) {
      const transformation = calculateShapeTransformation(originalShape, adaptedShape);
      const adaptedPieces = adaptPuzzlePiecesToShape(puzzle, transformation);
      
      dispatch({ 
        type: "UPDATE_SHAPE_AND_PUZZLE", 
        payload: { originalShape: adaptedShape, puzzle: adaptedPieces }
      });
    }
  }, [canvasSize, originalShape, previousCanvasSize, puzzle, state.isScattered]);
};
```

#### 3. GameContext状态管理扩展
```typescript
// 新增action类型
type GameAction = 
  | { type: "UPDATE_SHAPE_AND_PUZZLE"; payload: { originalShape: Point[]; puzzle: PuzzlePiece[] } }
  | ... // 现有action类型

// reducer扩展
case "UPDATE_SHAPE_AND_PUZZLE":
  return {
    ...state,
    originalShape: action.payload.originalShape,
    puzzle: action.payload.puzzle,
  };
```

## 数据模型

### 拼图块适配结果
```typescript
interface PuzzlePieceAdaptationResult {
  adaptedPieces: PuzzlePiece[]; // 适配后的拼图块
  adaptationScale: number; // 使用的缩放比例（与目标形状相同）
  adaptationCenter: Point; // 适配中心点（与目标形状相同）
  processingTime: number; // 处理时间（性能监控）
}
```

### 变换参数
```typescript
interface ShapeTransformation {
  scale: number; // 统一缩放比例
  offsetX: number; // X轴偏移量
  offsetY: number; // Y轴偏移量
  originalCenter: Point; // 原始中心点
  adaptedCenter: Point; // 适配后中心点
}
```

## 错误处理

### 错误类型
1. **变换参数无效**: 缩放比例为0或负数
2. **拼图块数据异常**: 空数组或无效点数据
3. **形状数据不匹配**: 原始形状与适配形状不对应
4. **性能超时**: 适配时间超过阈值

### 错误处理策略
```typescript
function safeAdaptPuzzlePieces(
  pieces: PuzzlePiece[],
  transformation: ShapeTransformation
): PuzzlePiece[] {
  try {
    // 参数验证
    if (!validateTransformation(transformation)) {
      console.warn('Invalid transformation parameters, skipping adaptation');
      return pieces;
    }
    
    // 执行适配
    return adaptPuzzlePiecesToShape(pieces, transformation);
  } catch (error) {
    console.error('Puzzle piece adaptation failed:', error);
    return pieces; // 返回原始数据作为兜底
  }
}
```

## 测试策略

### 单元测试
- 变换计算算法测试
- 拼图块适配逻辑测试
- 错误处理机制测试
- 性能基准测试

### 集成测试
- Hook集成测试
- GameContext状态同步测试
- 与Step1-2兼容性测试

### E2E测试
- 窗口大小变化场景测试
- 设备切换场景测试
- 性能指标验证测试