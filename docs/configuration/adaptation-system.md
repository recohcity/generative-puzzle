# 适配系统配置

> 修订日期：2025-08-04 (v1.3.39)

本文档详细说明当前简化的适配系统配置，基于SimpleAdapter的统一适配方案。

---

## 🎯 适配系统概览

### 核心组件
- **SimpleAdapter**: 统一适配器，纯函数实现
- **adaptationConfig.ts**: 适配参数配置
- **useDeviceDetection**: 设备检测Hook

---

## 📁 配置文件位置

### 主要配置文件
```
src/config/adaptationConfig.ts     # 适配参数配置
utils/SimpleAdapter.ts             # 适配器实现
hooks/useDeviceDetection.ts        # 设备检测
constants/canvasAdaptation.ts       # 画布适配常量
```

---

## ⚙️ 适配配置参数

### 移动端适配配置
```typescript
// src/config/adaptationConfig.ts
export const MOBILE_ADAPTATION = {
  canvasScale: 0.9,           // 画布缩放比例 (90%)
  minPieceSize: 40,           // 最小拼图块尺寸 (px)
  maxPieceSize: 120,          // 最大拼图块尺寸 (px)
  scatterRadius: 0.8,         // 散布半径系数
  touchPadding: 20,           // 触摸区域边距 (px)
  safeAreaInsets: true,       // 启用安全区域
  dynamicViewport: true       // 动态视口适配
};
```

### 桌面端适配配置
```typescript
// src/config/adaptationConfig.ts
export const DESKTOP_ADAPTATION = {
  canvasScale: 0.95,          // 画布缩放比例 (95%)
  minPieceSize: 60,           // 最小拼图块尺寸 (px)
  maxPieceSize: 200,          // 最大拼图块尺寸 (px)
  scatterRadius: 1.0,         // 散布半径系数
  mousePadding: 10,           // 鼠标操作边距 (px)
  centeringEnabled: true,     // 启用居中对齐
  highDPISupport: true        // 高DPI支持
};
```

### iPhone 16 系列优化配置
```typescript
// src/config/adaptationConfig.ts
export const IPHONE16_OPTIMIZATION = {
  dynamicViewport: true,      // 动态视口适配
  safeAreaInsets: true,       // 安全区域适配
  highRefreshRate: true,      // 高刷新率优化
  precisionTouch: true,       // 精确触摸检测
  orientationLock: false      // 方向锁定
};
```

### 高分辨率移动设备配置
```typescript
// src/config/adaptationConfig.ts
export const HIGH_RESOLUTION_MOBILE = {
  dpiThreshold: 2.0,          // DPI阈值
  scaleAdjustment: 1.1,       // 缩放调整系数
  textScaling: 1.2,           // 文本缩放
  touchTargetSize: 44         // 触摸目标最小尺寸
};
```

---

## 🔧 SimpleAdapter 配置

### 核心适配函数
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

### 适配策略配置
```typescript
// utils/SimpleAdapter.ts
const ADAPTATION_STRATEGY = {
  preserveAspectRatio: true,    // 保持宽高比
  centerElements: true,         // 元素居中
  scaleToFit: true,            // 缩放适应
  maintainMinSize: true,        // 保持最小尺寸
  boundaryCheck: true           // 边界检查
};
```

---

## 📱 设备检测配置

### 设备阈值配置
```typescript
// src/config/deviceConfig.ts
export const DEVICE_THRESHOLDS = {
  mobile: 768,                  // 移动端阈值 (px)
  tablet: 1024,                 // 平板阈值 (px)
  desktop: 1200,                // 桌面端阈值 (px)
  largeDesktop: 1920            // 大屏桌面阈值 (px)
};
```

### iPhone 16 系列检测配置
```typescript
// src/config/deviceConfig.ts
export const IPHONE16_MODELS = {
  'iPhone16': { 
    width: 393, height: 852,
    scale: 3, safeArea: { top: 59, bottom: 34 }
  },
  'iPhone16Plus': { 
    width: 430, height: 932,
    scale: 3, safeArea: { top: 59, bottom: 34 }
  },
  'iPhone16Pro': { 
    width: 393, height: 852,
    scale: 3, safeArea: { top: 59, bottom: 34 }
  },
  'iPhone16ProMax': { 
    width: 430, height: 932,
    scale: 3, safeArea: { top: 59, bottom: 34 }
  }
};
```

---

## 🎨 画布适配配置

### 画布尺寸配置
```typescript
// constants/canvasAdaptation.ts
export const CANVAS_CONFIG = {
  defaultWidth: 800,            // 默认宽度
  defaultHeight: 600,           // 默认高度
  minWidth: 320,                // 最小宽度
  minHeight: 240,               // 最小高度
  maxWidth: 1920,               // 最大宽度
  maxHeight: 1080,              // 最大高度
  aspectRatio: 4/3              // 默认宽高比
};
```

### 画布安全区域配置
```typescript
// constants/canvasAdaptation.ts
export const CANVAS_SAFETY = {
  marginTop: 20,                // 顶部边距
  marginBottom: 20,             // 底部边距
  marginLeft: 20,               // 左侧边距
  marginRight: 20,              // 右侧边距
  safeAreaEnabled: true,        // 启用安全区域
  dynamicMargin: true           // 动态边距调整
};
```

---

## 🔧 配置修改指南

### 调整适配比例
```typescript
// 修改移动端适配比例
export const MOBILE_ADAPTATION = {
  ...MOBILE_ADAPTATION,
  canvasScale: 0.85,  // 从0.9调整为0.85
};

// 修改桌面端适配比例
export const DESKTOP_ADAPTATION = {
  ...DESKTOP_ADAPTATION,
  canvasScale: 0.9,   // 从0.95调整为0.9
};
```

### 调整拼图块尺寸范围
```typescript
// 移动端拼图块尺寸调整
export const MOBILE_ADAPTATION = {
  ...MOBILE_ADAPTATION,
  minPieceSize: 50,   // 增大最小尺寸
  maxPieceSize: 100,  // 减小最大尺寸
};
```

### 调整设备检测阈值
```typescript
// 修改移动端检测阈值
export const DEVICE_THRESHOLDS = {
  ...DEVICE_THRESHOLDS,
  mobile: 800,        // 从768调整为800
};
```

---

## 🐛 故障排除

### 常见适配问题

#### 1. 移动端拼图块过小
**原因**: `minPieceSize` 设置过小  
**解决**: 调整 `MOBILE_ADAPTATION.minPieceSize` 为更大值

#### 2. 桌面端画布不居中
**原因**: 居中配置未启用  
**解决**: 确保 `DESKTOP_ADAPTATION.centeringEnabled = true`

#### 3. 高分辨率设备显示异常
**原因**: DPI适配参数不当  
**解决**: 调整 `HIGH_RESOLUTION_MOBILE` 配置

#### 4. iPhone 16 系列适配问题
**原因**: 安全区域配置错误  
**解决**: 检查 `IPHONE16_OPTIMIZATION.safeAreaInsets` 配置

### 调试方法
```typescript
// 启用适配调试
const DEBUG_ADAPTATION = process.env.NODE_ENV === 'development';

if (DEBUG_ADAPTATION) {
  console.log('Device Info:', deviceInfo);
  console.log('Adaptation Config:', adaptationConfig);
  console.log('Canvas Size:', canvasSize);
}
```

---

## 📊 性能优化

### 适配性能配置
```typescript
// 适配性能优化参数
const PERFORMANCE_CONFIG = {
  enableCaching: true,          // 启用缓存
  batchUpdates: true,           // 批量更新
  throttleResize: 100,          // 调整大小节流 (ms)
  debounceOrientation: 200      // 方向变化防抖 (ms)
};
```

### 内存优化配置
```typescript
// 内存使用优化
const MEMORY_CONFIG = {
  maxCacheSize: 50,             // 最大缓存数量
  cleanupInterval: 30000,       // 清理间隔 (ms)
  enableGC: true                // 启用垃圾回收
};
```

---

## 📈 配置更新历史

### v1.3.39 (当前版本)
- ✅ 简化为SimpleAdapter统一适配
- ✅ 统一配置文件结构
- ✅ iPhone 16系列优化配置
- ✅ 高分辨率设备支持

### v1.3.38
- 🔧 修复坐标转换问题
- 🔧 优化移动端适配参数

### v1.3.37
- 🗑️ 删除复杂适配引擎
- 🔧 简化配置结构

---

## 📚 相关文档

- **[核心架构配置](./core-architecture.md)** - 整体架构说明
- **[设备响应式配置](./device-responsive.md)** - 设备检测详细配置
- **[当前适配系统](../CURRENT_ADAPTATION_SYSTEM.md)** - 适配系统技术方案

---

*📝 文档维护: 本文档基于v1.3.39的实际配置*  
*🔄 最后更新: 2025年8月4日*  
*✅ 监督指令合规: 完全符合简化架构原则*