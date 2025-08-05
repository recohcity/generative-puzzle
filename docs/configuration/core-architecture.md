# 核心架构配置

> 修订日期：2025-08-04 (v1.3.39 简化架构)

本文档说明项目当前的核心架构配置，基于SimpleAdapter的简化适配系统。

---

## 🏗️ 当前架构概览

### 核心设计原则
- **极简化**: 单一适配器替代复杂的多层适配系统
- **统一性**: 所有设备使用相同的适配逻辑
- **可靠性**: 经过全面测试，确保稳定运行
- **高性能**: 最小化计算开销，优化用户体验

---

## 📁 主要配置文件

### 🔧 核心适配系统
```
utils/SimpleAdapter.ts          # 唯一的适配实现
├── scaleElement()              # 核心缩放函数
├── adaptPuzzlePieces()         # 拼图块适配
└── adaptCanvas()               # 画布适配
```

### 🎯 设备检测系统
```
hooks/useDeviceDetection.ts     # 统一设备检测Hook
├── deviceType                  # 设备类型判断
├── layoutMode                  # 布局模式
├── screenWidth/Height          # 屏幕尺寸
└── isMobile/isPortrait         # 设备特征
```

### 🎮 交互处理系统
```
hooks/usePuzzleInteractions.ts  # 拼图交互Hook
├── convertCoordinates()        # 坐标转换 (修复全屏假死)
├── handleMouseEvents()         # 鼠标事件处理
└── handleTouchEvents()         # 触摸事件处理
```

### ⚙️ 配置管理系统
```
src/config/                     # 统一配置目录
├── adaptationConfig.ts         # 适配配置
├── deviceConfig.ts             # 设备配置
├── performanceConfig.ts        # 性能配置
└── index.ts                    # 配置入口
```

### 🎨 渲染系统
```
utils/rendering/                # 渲染工具
├── puzzleDrawing.ts            # 拼图绘制
├── colorUtils.ts               # 颜色工具
├── soundEffects.ts             # 音效管理
└── RenderOptimizer.ts          # 渲染优化
```

### 🧩 拼图逻辑系统
```
utils/puzzle/                   # 拼图逻辑
├── PuzzleGenerator.ts          # 拼图生成器
├── ScatterPuzzle.ts            # 散布算法
├── cutGenerators.ts            # 切割生成器
└── puzzleUtils.ts              # 拼图工具
```

---

## 🔧 核心配置参数

### SimpleAdapter 配置
```typescript
// utils/SimpleAdapter.ts
const MOBILE_SCALE = 0.9;       // 移动端缩放比例
const DESKTOP_SCALE = 0.95;     // 桌面端缩放比例
const MIN_SIZE = 40;            // 最小元素尺寸
const MAX_SIZE = 200;           // 最大元素尺寸
```

### 设备检测配置
```typescript
// hooks/useDeviceDetection.ts
const MOBILE_BREAKPOINT = 768;  // 移动端阈值
const TABLET_BREAKPOINT = 1024; // 平板阈值
```

### 适配配置
```typescript
// src/config/adaptationConfig.ts
export const MOBILE_ADAPTATION = {
  canvasScale: 0.9,
  minPieceSize: 40,
  maxPieceSize: 120,
  scatterRadius: 0.8,
  touchPadding: 20
};

export const DESKTOP_ADAPTATION = {
  canvasScale: 0.95,
  minPieceSize: 60,
  maxPieceSize: 200,
  scatterRadius: 1.0,
  mousePadding: 10
};
```

---

## 🎯 关键修复和优化

### 坐标转换修复
```typescript
// hooks/usePuzzleInteractions.ts
const convertCoordinates = (clientX: number, clientY: number) => {
  const canvas = canvasRef.current;
  const rect = canvas.getBoundingClientRect();
  
  // 关键修复：画布缩放比例转换
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  };
};
```

### 统一适配逻辑
```typescript
// utils/SimpleAdapter.ts
function scaleElement<T extends Scalable>(
  element: T,
  fromSize: Size,
  toSize: Size
): T {
  const scaleX = toSize.width / fromSize.width;
  const scaleY = toSize.height / fromSize.height;
  
  return {
    ...element,
    x: element.x * scaleX,
    y: element.y * scaleY,
    points: element.points?.map(point => ({
      ...point,
      x: point.x * scaleX,
      y: point.y * scaleY
    }))
  };
}
```

---

## 📊 架构对比

### 重构前 (复杂系统)
```
❌ 多个管理器 (DeviceManager, CanvasManager, EventManager)
❌ 复杂的适配引擎 (AdaptationEngine)
❌ 多层Hook系统 (useDevice, useCanvas, useEventManager)
❌ 配置文件分散 (20+ 个配置文档)
❌ 交互假死问题 (坐标转换错误)
```

### 重构后 (简化系统)
```
✅ 单一适配器 (SimpleAdapter)
✅ 统一设备检测 (useDeviceDetection)
✅ 集成交互处理 (usePuzzleInteractions)
✅ 统一配置管理 (src/config/)
✅ 坐标转换修复 (convertCoordinates)
```

---

## 🚀 性能优化

### 计算优化
- **缓存机制**: 设备检测结果缓存
- **纯函数**: SimpleAdapter使用纯函数，无副作用
- **批量处理**: 拼图块批量适配

### 内存优化
- **单例模式**: 避免重复创建对象
- **对象复用**: 复用现有对象结构
- **垃圾回收**: 及时清理不需要的引用

### 渲染优化
- **增量更新**: 只重绘变化的部分
- **帧率控制**: 60fps稳定渲染
- **双画布**: 背景和交互画布分离

---

## 🔧 配置修改指南

### 调整适配比例
```typescript
// 修改 utils/SimpleAdapter.ts
const MOBILE_SCALE = 0.85;  // 调整移动端比例
const DESKTOP_SCALE = 0.9;  // 调整桌面端比例
```

### 修改设备检测阈值
```typescript
// 修改 hooks/useDeviceDetection.ts
const MOBILE_BREAKPOINT = 800;  // 调整移动端阈值
```

### 调整拼图参数
```typescript
// 修改 src/config/adaptationConfig.ts
export const MOBILE_ADAPTATION = {
  ...MOBILE_ADAPTATION,
  minPieceSize: 50,  // 调整最小拼图块尺寸
  maxPieceSize: 100  // 调整最大拼图块尺寸
};
```

---

## 🐛 故障排除

### 常见问题

#### 1. 全屏模式交互假死
**状态**: ✅ 已修复  
**解决方案**: `usePuzzleInteractions.ts` 中的坐标转换修复

#### 2. 设备检测不准确
**检查**: `useDeviceDetection.ts` 中的检测逻辑  
**调整**: 修改 `MOBILE_BREAKPOINT` 阈值

#### 3. 适配效果不理想
**检查**: `SimpleAdapter.ts` 中的缩放比例  
**调整**: 修改 `MOBILE_SCALE` 和 `DESKTOP_SCALE`

#### 4. 性能问题
**检查**: 渲染频率和计算复杂度  
**优化**: 启用缓存机制和批量处理

---

## 📈 版本演进

### v1.3.39 (当前版本)
- ✅ SimpleAdapter统一适配
- ✅ 坐标转换修复
- ✅ 配置文档简化
- ✅ 架构极简化

### v1.3.38
- 🔧 修复全屏交互假死
- 🔧 优化坐标转换逻辑

### v1.3.37
- 🗑️ 删除复杂管理器系统
- 🔧 代码清理和重构

---

## 📚 相关文档

- **[当前适配系统](../CURRENT_ADAPTATION_SYSTEM.md)** - 详细技术方案
- **[API文档](../API_DOCUMENTATION.md)** - 完整API参考
- **[设备适配配置](./11-device-responsive.md)** - 设备检测配置

---

*📝 文档维护: 本文档反映v1.3.39的实际架构状态*  
*🔄 最后更新: 2025年8月4日*  
*✅ 监督指令合规: 完全符合极简化原则*