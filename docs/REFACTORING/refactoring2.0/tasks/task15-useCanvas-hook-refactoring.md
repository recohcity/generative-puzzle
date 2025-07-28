# Task 15: useCanvas Hook拆分重构

## 概述

本任务将原本复杂的 `useCanvas` Hook 拆分为三个专用的 hooks，实现更清晰的职责分离，同时保持完全的向后兼容性。

## 重构目标

### 主要目标
1. **职责分离**: 将复杂的 useCanvas 拆分为专用 hooks
2. **代码组织**: 提升代码的可读性和可维护性
3. **单一职责**: 每个 hook 专注于特定功能
4. **向后兼容**: 保持所有现有API完全兼容

### 具体变更
- 将 `useCanvas.ts:45-154` 拆分为专用hooks
- 创建 `useCanvasSize` 专注于尺寸管理
- 创建 `useCanvasRefs` 专注于引用管理
- 创建 `useCanvasEvents` 专注于事件处理
- 保持原有API的向后兼容性

## 实施方案

### 1. 创建专用Hooks

#### useCanvasSize.ts
```typescript
// 专注于画布尺寸管理
export const useCanvasSize = (): CanvasSize => {
  // 管理画布尺寸状态
  // 订阅ResizeObserver变化
}

// 重新导出工具hooks
export const useCanvasBounds = () => { /* 边界检查工具 */ }
export const useCanvasContext = () => { /* 画布上下文访问 */ }
```

#### useCanvasRefs.ts
```typescript
// 专注于画布引用管理
export const useCanvasRefs = ({ containerRef, canvasRef, backgroundCanvasRef }) => {
  // 设置画布引用
  // 初始化ResizeObserver
  // 管理初始化状态
}
```

#### useCanvasEvents.ts
```typescript
// 专注于事件处理
export const useCanvasEvents = ({ isInitialized }) => {
  // 设备状态变化处理
  // 页面可见性变化处理
  // 屏幕方向变化处理
  // 性能监控
}
```

### 2. 重构主Hook

```typescript
// useCanvas.ts - 重构后的主hook
export const useCanvas = ({ containerRef, canvasRef, backgroundCanvasRef }) => {
  // 使用专用hooks
  const { isInitialized } = useCanvasRefs({ containerRef, canvasRef, backgroundCanvasRef });
  const canvasSize = useCanvasSize();
  useCanvasEvents({ isInitialized });
  
  return canvasSize; // 保持原有返回值
}

// 重新导出工具hooks以保持兼容性
export { useCanvasContext, useCanvasBounds } from './useCanvasSize';
```

## 代码变更详情

### 新增文件

#### providers/hooks/useCanvasSize.ts
- **功能**: 专门处理画布尺寸管理
- **职责**:
  - 管理画布尺寸状态
  - 订阅ResizeObserver变化
  - 提供边界检查工具
  - 提供画布上下文访问

#### providers/hooks/useCanvasRefs.ts
- **功能**: 专门处理画布引用管理
- **职责**:
  - 设置画布引用到CanvasManager
  - 自动初始化ResizeObserver
  - 管理初始化状态
  - 提供初始化状态查询

#### providers/hooks/useCanvasEvents.ts
- **功能**: 专门处理事件响应
- **职责**:
  - 设备状态变化响应
  - 页面可见性变化处理
  - 屏幕方向变化处理
  - 性能监控和调试
  - EventScheduler任务管理

#### tests/test-useCanvas-refactoring.ts
- **功能**: 验证重构后的功能完整性
- **测试内容**:
  - 专用hooks存在性验证
  - 主hook向后兼容性
  - 工具hooks重新导出
  - 职责分离验证

### 修改文件

#### providers/hooks/useCanvas.ts
- **简化**: 从154行简化为约30行
- **重构**: 使用专用hooks组合功能
- **兼容**: 保持完全相同的API签名和返回值

## 架构改进

### 职责分离
```
useCanvas (主hook)
├── useCanvasRefs (引用管理)
│   ├── 设置画布引用
│   ├── 初始化ResizeObserver
│   └── 管理初始化状态
├── useCanvasSize (尺寸管理)
│   ├── 画布尺寸状态
│   ├── ResizeObserver订阅
│   └── 工具函数
└── useCanvasEvents (事件处理)
    ├── 设备状态变化
    ├── 页面可见性变化
    ├── 屏幕方向变化
    └── 性能监控
```

### 代码质量提升
1. **单一职责**: 每个hook专注于特定领域
2. **可测试性**: 独立hooks更容易单元测试
3. **可维护性**: 功能变更影响范围更小
4. **可复用性**: 专用hooks可在其他地方复用

## 向后兼容性保证

### API保持不变
```typescript
// 现有调用代码无需修改
const canvasSize = useCanvas({ containerRef, canvasRef, backgroundCanvasRef });

// 工具hooks继续可用
const context = useCanvasContext('main');
const bounds = useCanvasBounds();
```

### 行为保持一致
- 画布尺寸管理完全相同
- 事件处理逻辑不变
- 引用管理方式不变
- 性能特征保持
- 错误处理方式不变

### 导入方式不变
```typescript
// 所有现有导入都继续工作
import { useCanvas, useCanvasContext, useCanvasBounds } from './providers/hooks/useCanvas';
```

## 功能验证

### 关键验证点
1. **API兼容性**: 所有现有调用代码无需修改
2. **功能完整性**: 画布管理功能完全正常
3. **事件响应**: 设备变化、方向变化正常响应
4. **性能保持**: 重构不影响性能
5. **工具函数**: 边界检查、上下文访问正常

### 测试用例
```typescript
// 验证主hook功能
const canvasSize = useCanvas({ containerRef, canvasRef, backgroundCanvasRef });
// 应该返回 { width: number, height: number }

// 验证专用hooks独立工作
const size = useCanvasSize();
const { isInitialized } = useCanvasRefs({ ... });
useCanvasEvents({ isInitialized });

// 验证工具hooks
const context = useCanvasContext('main');
const bounds = useCanvasBounds();
```

## 风险控制

### 功能保护措施
1. **渐进式重构**: 保留原有实现作为参考
2. **全面测试**: 覆盖所有hook使用场景
3. **兼容性检查**: 确保所有现有调用正常
4. **回滚机制**: 发现问题可立即回滚

### 验证检查清单
- [ ] 桌面端画布管理正常
- [ ] 移动端画布管理正常
- [ ] 设备状态变化响应正常
- [ ] 屏幕方向变化处理正常
- [ ] 页面可见性变化处理正常
- [ ] 工具hooks功能正常
- [ ] 所有现有测试通过
- [ ] 性能不下降

## 总结

通过将复杂的 useCanvas Hook 拆分为三个专用hooks，我们实现了：

1. **更清晰的职责分离**: 每个hook专注于特定功能
2. **更好的代码组织**: 相关逻辑集中管理
3. **更高的可维护性**: 功能变更影响范围更小
4. **更强的可测试性**: 独立hooks更容易测试
5. **完全的向后兼容**: 现有代码无需修改

这个重构显著提升了代码的质量和可维护性，同时严格保护了现有的画布管理功能。