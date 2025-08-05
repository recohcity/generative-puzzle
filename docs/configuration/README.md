# 🔧 配置快速索引

> **v1.3.39** | 最后更新：2025-08-04 | 简化架构配置指南

**快速导航** | [核心配置](#-核心配置) | [游戏配置](#-游戏配置) | [开发配置](#-开发配置) | [故障排除](#-故障排除)

---

## 🚀 5分钟快速配置

### 最常用配置修改
```typescript
// 📱 调整移动端适配 → src/config/adaptationConfig.ts
export const MOBILE_ADAPTATION = {
  canvasScale: 0.9,        // 画布大小：90%
  minPieceSize: 40,        // 最小拼图块：40px
  touchPadding: 20         // 触摸边距：20px
};

// 🖥️ 调整桌面端适配 → src/config/adaptationConfig.ts  
export const DESKTOP_ADAPTATION = {
  canvasScale: 0.95,       // 画布大小：95%
  minPieceSize: 60,        // 最小拼图块：60px
  mousePadding: 10         // 鼠标边距：10px
};

// 🎯 调整游戏难度 → utils/puzzle/cutGenerators.ts
const DIFFICULTY_CONFIGS = {
  easy: { cuts: 4, complexity: 0.3 },    // 简单：4刀
  medium: { cuts: 8, complexity: 0.6 },  // 中等：8刀
  hard: { cuts: 12, complexity: 0.9 }    // 困难：12刀
};

// 📱 调整设备检测 → src/config/deviceConfig.ts
export const DEVICE_THRESHOLDS = {
  mobile: 768,             // 移动端阈值
  tablet: 1024,            // 平板阈值
  desktop: 1200            // 桌面端阈值
};
```

---

## 📁 项目配置文件地图

### 🔧 核心配置
| 配置类型 | 文件位置 | 作用 | 文档 |
|---------|---------|------|------|
| **适配器** | `utils/SimpleAdapter.ts` | 唯一适配实现 | [📖](./adaptation-system.md) |
| **设备检测** | `hooks/useDeviceDetection.ts` | 设备识别 | [📖](./device-responsive.md) |
| **交互处理** | `hooks/usePuzzleInteractions.ts` | 坐标转换修复 | [📖](./core-architecture.md) |

### ⚙️ 统一配置目录 (`src/config/`)
| 配置文件 | 作用 | 关键参数 | 文档 |
|---------|------|---------|------|
| `adaptationConfig.ts` | 适配参数 | `canvasScale`, `pieceSize` | [📖](./adaptation-system.md) |
| `deviceConfig.ts` | 设备检测 | `DEVICE_THRESHOLDS`, `IPHONE16_MODELS` | [📖](./device-responsive.md) |
| `performanceConfig.ts` | 性能优化 | `EVENT_CONFIG`, `MEMORY_CONFIG` | [📖](./performance.md) |
| `loggingConfig.ts` | 日志系统 | `DEVELOPMENT_LOGGING_CONFIG` | [📖](./logging.md) |

### 🎮 游戏逻辑配置
| 配置类型 | 文件位置 | 关键参数 | 文档 |
|---------|---------|---------|------|
| **难度系统** | `utils/puzzle/cutGenerators.ts` | `DIFFICULTY_MAPPING` | [📖](./difficulty-cutting.md) |
| **形状生成** | `utils/shape/ShapeGenerator.ts` | `STANDARD_SIZE`, `baseRadius` | [📖](./shape-generation.md) |
| **音效控制** | `utils/rendering/soundEffects.ts` | `SOUND_ENABLED` | [📖](./media-sound.md) |

---

## 🎯 按需求快速定位

### 🐛 问题解决
| 问题症状 | 检查配置 | 快速修复 |
|---------|---------|---------|
| **全屏交互假死** | ✅ 已修复 | `usePuzzleInteractions.ts` 坐标转换 |
| **移动端显示异常** | `deviceConfig.ts` | 调整 `DEVICE_THRESHOLDS.mobile` |
| **拼图块太小/太大** | `adaptationConfig.ts` | 调整 `minPieceSize`, `maxPieceSize` |
| **游戏太简单/太难** | `cutGenerators.ts` | 修改 `DIFFICULTY_CONFIGS` |
| **性能卡顿** | `performanceConfig.ts` | 调整 `PERFORMANCE_THRESHOLDS` |
| **设备识别错误** | `useDeviceDetection.ts` | 检查检测逻辑 |

### 📱 设备适配
| 设备类型 | 主要配置 | 关键参数 |
|---------|---------|---------|
| **iPhone 16系列** | `deviceConfig.ts` | `IPHONE16_MODELS`, `safeArea` |
| **Android手机** | `adaptationConfig.ts` | `MOBILE_ADAPTATION` |
| **iPad/平板** | `deviceConfig.ts` | `DEVICE_THRESHOLDS.tablet` |
| **桌面端** | `adaptationConfig.ts` | `DESKTOP_ADAPTATION` |
| **高分辨率屏** | `adaptationConfig.ts` | `HIGH_RESOLUTION_MOBILE` |

### 🎮 游戏调优
| 调优目标 | 配置文件 | 关键参数 |
|---------|---------|---------|
| **降低难度** | `cutGenerators.ts` | 减少 `cuts`, 降低 `complexity` |
| **提高难度** | `cutGenerators.ts` | 增加 `cuts`, 提高 `complexity` |
| **优化性能** | `performanceConfig.ts` | 调整 `maxRenderTime`, `targetFPS` |
| **减少内存** | `performanceConfig.ts` | 降低 `maxCacheSize`, `objectPoolSize` |
| **改善触摸** | `adaptationConfig.ts` | 增加 `touchPadding` |

---

## 📚 配置文档

### 🔧 核心配置
- **[核心架构](./core-architecture.md)** - 当前v1.3.39架构总览
- **[适配系统](./adaptation-system.md)** - SimpleAdapter详细配置
- **[设备检测](./device-responsive.md)** - 设备识别和响应式配置

### 🎮 游戏配置  
- **[难度配置](./difficulty-cutting.md)** - 拼图难度和切割算法
- **[形状生成](./shape-generation.md)** - 基础形状生成参数
- **[音效配置](./media-sound.md)** - 音效和媒体资源

### 🔧 开发配置
- **[性能配置](./performance.md)** - 性能监控和优化
- **[日志配置](./logging.md)** - 日志系统和调试
- **[构建配置](./build-dev.md)** - 构建和开发环境
- **[调试配置](./debug-mode.md)** - 调试模式和工具

---

## ⚡ 环境快速设置

### 开发环境
```bash
# 启动开发服务器
npm run dev

# 启用调试模式
# 修改 src/config/loggingConfig.ts
level: LogLevel.DEBUG
```

### 生产环境
```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm run start

# 生产日志配置
# 修改 src/config/loggingConfig.ts  
level: LogLevel.INFO
```

### 测试环境
```bash
# 运行单元测试
npm run test:unit

# 运行端到端测试
npm run test

# 生成覆盖率报告
npm run test:unit -- --coverage
```

---

## 🔧 故障排除

### � 紧急修复
```typescript
// 🔥 紧急禁用功能
const EMERGENCY_CONFIG = {
  // 禁用复杂形状
  shapeType: 'polygon',
  
  // 降低难度
  maxDifficulty: 3,
  
  // 减少性能负载
  targetFPS: 30,
  maxRenderTime: 33,
  
  // 简化适配
  canvasScale: 0.8
};
```

### 📊 性能问题
```typescript
// 🚀 性能优化配置
const PERFORMANCE_FIX = {
  // 减少事件频率
  TOUCH_DEBOUNCE_MS: 33,
  
  // 降低内存使用
  MAX_CACHE_SIZE: 20,
  OBJECT_POOL_SIZE: 500,
  
  // 简化渲染
  ENABLE_RENDER_OPTIMIZATION: true,
  USE_DIRTY_RECTANGLES: true
};
```

### 📱 移动端问题
```typescript
// 📱 移动端修复配置
const MOBILE_FIX = {
  // 增大触摸区域
  touchPadding: 30,
  
  // 减小画布
  canvasScale: 0.85,
  
  // 增大拼图块
  minPieceSize: 50,
  
  // 启用安全区域
  safeAreaInsets: true
};
```

---

## 📈 配置版本历史

| 版本 | 主要变更 | 影响 |
|------|---------|------|
| **v1.3.39** | SimpleAdapter统一适配 | 🔥 当前版本 |
| v1.3.38 | 坐标转换修复 | 修复全屏假死 |
| v1.3.37 | 架构简化 | 删除复杂管理器 |

---

## 🔗 相关资源

- **[适配技术方案](../CURRENT_ADAPTATION_SYSTEM.md)** - 详细技术文档
- **[API参考手册](../API_DOCUMENTATION.md)** - 完整API文档  
- **[项目架构说明](../project_structure.md)** - 项目结构文档
- **[快速开始指南](../GETTING_STARTED.md)** - 5分钟上手

---

## 💡 配置最佳实践

### ✅ 推荐做法
- **渐进式调整**: 每次只修改一个参数
- **备份配置**: 修改前备份原始配置
- **测试验证**: 修改后立即测试
- **文档更新**: 重要修改要更新文档

### ❌ 避免做法
- **批量修改**: 避免同时修改多个配置
- **极端数值**: 避免设置过大或过小的值
- **忽略设备**: 不要只针对单一设备优化
- **跳过测试**: 修改后必须测试验证

---

*📝 **使用提示**: 点击表格中的 📖 图标可快速跳转到详细文档*  
*🔄 **保持更新**: 本索引随配置变更实时更新*  
*✅ **监督合规**: 完全符合v1.3.39简化架构原则*