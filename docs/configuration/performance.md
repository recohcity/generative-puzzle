# 性能配置

> 修订日期：2025-12-31 (v1.3.71)

本文档详细说明项目的性能监控和优化配置，包括事件处理、内存管理、渲染优化等。

---

## 📁 配置文件位置

### 主要配置文件
```
src/config/performanceConfig.ts     # 性能配置
utils/rendering/RenderOptimizer.ts  # 渲染优化器
core/EventScheduler.ts              # 事件调度器
```

---

## ⚙️ 事件处理配置

### 事件配置参数
```typescript
// src/config/performanceConfig.ts
export const EVENT_CONFIG = {
  // ResizeObserver settings
  RESIZE_DEBOUNCE_MS: 100,         // ResizeObserver防抖延时
  RESIZE_THROTTLE_MS: 50,          // ResizeObserver节流延时
  
  // Touch and mouse events
  TOUCH_DEBOUNCE_MS: 16,           // 触摸事件防抖 (~60fps)
  MOUSE_THROTTLE_MS: 8,            // 鼠标事件节流 (~120fps)
  
  // Orientation change
  ORIENTATION_DEBOUNCE_MS: 200,    // 方向变化防抖延时
  
  // Scroll events
  SCROLL_THROTTLE_MS: 16,          // 滚动事件节流
  
  // Keyboard events
  KEYBOARD_DEBOUNCE_MS: 50,        // 键盘事件防抖
  
  // Custom events
  CUSTOM_EVENT_THROTTLE_MS: 100    // 自定义事件节流
};
```

### 事件监听器限制
```typescript
// src/config/performanceConfig.ts
export const EVENT_LIMITS = {
  MAX_LISTENERS_PER_TYPE: 10,      // 每种事件类型最大监听器数量
  MAX_TOTAL_LISTENERS: 100,        // 总监听器数量限制
  CLEANUP_INTERVAL_MS: 30000,      // 监听器清理间隔
  MEMORY_THRESHOLD_MB: 50          // 内存阈值触发清理
};
```

---

## 🧠 内存管理配置

### 内存配置参数
```typescript
// src/config/performanceConfig.ts
export const MEMORY_CONFIG = {
  // Event listener limits
  MAX_EVENT_LISTENERS: 100,        // 最大事件监听器数量
  EVENT_CLEANUP_INTERVAL: 30000,   // 事件监听器清理间隔(ms)
  
  // Canvas and rendering
  MAX_CANVAS_CONTEXTS: 5,          // 最大画布上下文数量
  CANVAS_MEMORY_LIMIT: 100,        // 画布内存限制(MB)
  
  // Object pooling
  OBJECT_POOL_SIZE: 1000,          // 对象池大小
  POOL_CLEANUP_THRESHOLD: 0.8,     // 池清理阈值(80%)
  
  // Cache management
  MAX_CACHE_SIZE: 50,              // 最大缓存条目数
  CACHE_TTL_MS: 300000,            // 缓存生存时间(5分钟)
  
  // Garbage collection hints
  GC_HINT_INTERVAL: 60000,         // GC提示间隔(1分钟)
  MEMORY_PRESSURE_THRESHOLD: 0.85  // 内存压力阈值(85%)
};
```

### 内存监控配置
```typescript
// src/config/performanceConfig.ts
export const MEMORY_MONITORING = {
  ENABLE_MONITORING: true,         // 启用内存监控
  MONITORING_INTERVAL: 5000,       // 监控间隔(5秒)
  ALERT_THRESHOLD: 80,             // 内存使用警告阈值(80%)
  CRITICAL_THRESHOLD: 95,          // 内存使用严重阈值(95%)
  AUTO_CLEANUP: true               // 自动清理
};
```

---

## 📊 性能阈值配置

### 性能阈值参数
```typescript
// src/config/performanceConfig.ts
export const PERFORMANCE_THRESHOLDS = {
  // Rendering performance
  MAX_RENDER_TIME_MS: 16,          // 最大渲染时间(16ms = 60fps)
  TARGET_FPS: 60,                  // 目标帧率
  MIN_FPS: 30,                     // 最小可接受帧率
  
  // Memory thresholds
  MAX_MEMORY_USAGE_MB: 100,        // 最大内存使用(MB)
  MEMORY_WARNING_MB: 80,           // 内存警告阈值(MB)
  
  // Event processing
  MAX_EVENT_QUEUE_SIZE: 1000,      // 最大事件队列大小
  EVENT_PROCESSING_TIME_MS: 5,     // 事件处理时间限制
  
  // Network and I/O
  MAX_REQUEST_TIME_MS: 3000,       // 最大请求时间
  MAX_FILE_SIZE_MB: 10,            // 最大文件大小
  
  // Animation and transitions
  ANIMATION_FRAME_BUDGET_MS: 16,   // 动画帧预算
  TRANSITION_DURATION_MS: 300      // 过渡动画时长
};
```

### 性能监控配置
```typescript
// src/config/performanceConfig.ts
export const PERFORMANCE_MONITORING = {
  ENABLE_FPS_MONITORING: true,     // 启用FPS监控
  ENABLE_MEMORY_MONITORING: true,  // 启用内存监控
  ENABLE_EVENT_MONITORING: true,   // 启用事件监控
  MONITORING_SAMPLE_RATE: 0.1,     // 监控采样率(10%)
  PERFORMANCE_BUFFER_SIZE: 100     // 性能数据缓冲区大小
};
```

---

## 🎨 渲染优化配置

### 渲染配置参数
```typescript
// utils/rendering/RenderOptimizer.ts
const RENDER_CONFIG = {
  // Canvas optimization
  ENABLE_HARDWARE_ACCELERATION: true,  // 启用硬件加速
  USE_OFFSCREEN_CANVAS: true,          // 使用离屏画布
  ENABLE_IMAGE_SMOOTHING: true,        // 启用图像平滑
  
  // Rendering strategy
  USE_DIRTY_RECTANGLES: true,          // 使用脏矩形优化
  BATCH_DRAW_CALLS: true,              // 批量绘制调用
  ENABLE_CULLING: true,                // 启用视锥剔除
  
  // Frame rate control
  ADAPTIVE_FRAME_RATE: true,           // 自适应帧率
  VSYNC_ENABLED: true,                 // 垂直同步
  FRAME_SKIP_THRESHOLD: 2              // 跳帧阈值
};
```

### 渲染性能配置
```typescript
// utils/rendering/RenderOptimizer.ts
const RENDER_PERFORMANCE = {
  MAX_DRAW_CALLS_PER_FRAME: 100,      // 每帧最大绘制调用数
  TEXTURE_CACHE_SIZE: 50,              // 纹理缓存大小
  GEOMETRY_CACHE_SIZE: 100,            // 几何体缓存大小
  SHADER_CACHE_SIZE: 20,               // 着色器缓存大小
  RENDER_QUEUE_SIZE: 1000              // 渲染队列大小
};
```

---

## 🔧 优化标志配置

### 优化开关
```typescript
// src/config/performanceConfig.ts
export const OPTIMIZATION_FLAGS = {
  // Rendering optimizations
  ENABLE_RENDER_OPTIMIZATION: true,   // 启用渲染优化
  ENABLE_TEXTURE_COMPRESSION: true,   // 启用纹理压缩
  ENABLE_GEOMETRY_INSTANCING: true,   // 启用几何体实例化
  
  // Memory optimizations
  ENABLE_OBJECT_POOLING: true,        // 启用对象池
  ENABLE_MEMORY_COMPACTION: true,     // 启用内存压缩
  ENABLE_LAZY_LOADING: true,          // 启用懒加载
  
  // Event optimizations
  ENABLE_EVENT_DELEGATION: true,      // 启用事件委托
  ENABLE_PASSIVE_LISTENERS: true,     // 启用被动监听器
  ENABLE_EVENT_THROTTLING: true,      // 启用事件节流
  
  // Network optimizations
  ENABLE_REQUEST_CACHING: true,       // 启用请求缓存
  ENABLE_RESOURCE_PRELOADING: true,   // 启用资源预加载
  ENABLE_COMPRESSION: true,            // 启用压缩

  // v1.3.71 Visual Optimizations
  DISABLE_SHADOWS: true,              // 禁用投影 (消除Webkit黑线)
  DISABLE_BACKDROP_BLUR: true,        // 禁用背景模糊 (消除渲染伪影)
  DISABLE_BORDERS: true               // 禁用边框 (实现0px缝隙)
};
```

### 调试配置
```typescript
// src/config/performanceConfig.ts
export const DEBUG_CONFIG = {
  ENABLE_PERFORMANCE_LOGGING: process.env.NODE_ENV === 'development',
  ENABLE_MEMORY_LOGGING: process.env.NODE_ENV === 'development',
  ENABLE_RENDER_LOGGING: false,       // 渲染日志（性能影响大）
  PERFORMANCE_OVERLAY: false,         // 性能覆盖层
  SHOW_FPS_COUNTER: false            // 显示FPS计数器
};
```

---

## 🌐 浏览器支持配置

### 浏览器兼容性配置
```typescript
// src/config/performanceConfig.ts
export const BROWSER_SUPPORT = {
  // Feature detection
  SUPPORTS_WEBGL: 'WebGLRenderingContext' in window,
  SUPPORTS_WEBGL2: 'WebGL2RenderingContext' in window,
  SUPPORTS_OFFSCREEN_CANVAS: 'OffscreenCanvas' in window,
  SUPPORTS_INTERSECTION_OBSERVER: 'IntersectionObserver' in window,
  SUPPORTS_RESIZE_OBSERVER: 'ResizeObserver' in window,
  
  // Fallback strategies
  WEBGL_FALLBACK: 'canvas2d',         // WebGL降级策略
  ANIMATION_FALLBACK: 'css',          // 动画降级策略
  STORAGE_FALLBACK: 'memory',         // 存储降级策略
  
  // Performance hints
  PREFER_REDUCED_MOTION: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  LOW_POWER_MODE: navigator.getBattery ? 'detect' : false
};
```

---

## 🔧 配置修改指南

### 调整性能阈值
```typescript
// 降低性能要求（适用于低端设备）
export const PERFORMANCE_THRESHOLDS = {
  ...PERFORMANCE_THRESHOLDS,
  TARGET_FPS: 30,              // 降低目标帧率
  MIN_FPS: 15,                 // 降低最小帧率
  MAX_RENDER_TIME_MS: 33       // 增加渲染时间预算
};
```

### 调整内存限制
```typescript
// 减少内存使用（适用于内存受限设备）
export const MEMORY_CONFIG = {
  ...MEMORY_CONFIG,
  MAX_CACHE_SIZE: 20,          // 减少缓存大小
  OBJECT_POOL_SIZE: 500,       // 减少对象池大小
  MAX_MEMORY_USAGE_MB: 50      // 降低内存限制
};
```

### 调整事件处理频率
```typescript
// 降低事件处理频率（提高性能）
export const EVENT_CONFIG = {
  ...EVENT_CONFIG,
  TOUCH_DEBOUNCE_MS: 33,       // 降低触摸事件频率到30fps
  MOUSE_THROTTLE_MS: 16        // 降低鼠标事件频率到60fps
};
```

---

## 🐛 故障排除

### 性能问题诊断

#### 1. 帧率下降
**检查项**:
- 渲染时间是否超过阈值
- 绘制调用数量是否过多
- 内存使用是否过高

**解决方案**:
```typescript
// 启用性能监控
const ENABLE_PROFILING = true;
if (ENABLE_PROFILING) {
  console.time('render');
  // 渲染代码
  console.timeEnd('render');
}
```

#### 2. 内存泄漏
**检查项**:
- 事件监听器是否正确清理
- 对象引用是否及时释放
- 缓存是否定期清理

**解决方案**:
```typescript
// 启用内存监控
setInterval(() => {
  if (performance.memory) {
    console.log('Memory usage:', performance.memory.usedJSHeapSize / 1024 / 1024, 'MB');
  }
}, 5000);
```

#### 3. 事件处理延迟
**检查项**:
- 事件队列是否积压
- 事件处理函数是否耗时过长
- 事件节流/防抖配置是否合适

**解决方案**:
```typescript
// 调整事件处理配置
export const EVENT_CONFIG = {
  ...EVENT_CONFIG,
  TOUCH_DEBOUNCE_MS: 8,        // 减少防抖延时
  MOUSE_THROTTLE_MS: 4         // 减少节流延时
};
```

---

## 📊 性能监控

### 性能指标收集
```typescript
// 性能指标收集器
class PerformanceCollector {
  private metrics = {
    fps: 0,
    renderTime: 0,
    memoryUsage: 0,
    eventLatency: 0
  };
  
  collectMetrics() {
    // FPS计算
    this.metrics.fps = this.calculateFPS();
    
    // 内存使用
    if (performance.memory) {
      this.metrics.memoryUsage = performance.memory.usedJSHeapSize;
    }
    
    // 渲染时间
    this.metrics.renderTime = this.measureRenderTime();
  }
}
```

### 性能报告
```typescript
// 性能报告生成
const generatePerformanceReport = () => {
  return {
    timestamp: Date.now(),
    fps: getCurrentFPS(),
    memory: getMemoryUsage(),
    renderTime: getAverageRenderTime(),
    eventLatency: getAverageEventLatency(),
    recommendations: getPerformanceRecommendations()
  };
};
```

---

## 📈 配置更新历史

### v1.3.71 (2025/12/31)
- ✅ 新增视觉渲染优化标志 (Shadow/Blur禁用)
- ✅ 优化 Webkit 渲染性能
- ✅ 提升移动端渲染效率

### v1.3.39
- ✅ 统一性能配置文件
- ✅ 优化事件处理配置
- ✅ 增强内存管理配置
- ✅ 完善浏览器兼容性配置

### v1.3.38
- 🔧 优化渲染性能配置
- 🔧 调整内存阈值

### v1.3.37
- 🔧 简化性能监控配置
- 🔧 删除冗余性能检查

---

## 📚 相关文档

- **[核心架构配置](./core-architecture.md)** - 整体架构说明
- **[日志配置](./logging.md)** - 日志系统配置
- **[API文档](../API_DOCUMENTATION.md)** - 性能相关API

---

*📝 文档维护: 本文档基于v1.3.71的实际配置*  
*🔄 最后更新: 2025年12月31日*  
*✅ 监督指令合规: 完全符合性能优化原则*