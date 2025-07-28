# Generative Puzzle API 文档

## 📚 快捷导航

### 📋 文档目录概览
```
Generative Puzzle API 文档
├── 🔧 核心API
│   ├── 配置管理API (统一配置、设备适配、性能优化)
│   ├── 错误处理API (日志服务、错误监控、验证系统)
│   └── Next.js API路由 (性能趋势聚合、测试数据查询、报告分析)
├── 🏗️ 系统架构API
│   ├── 核心管理器API (设备管理、画布管理、事件管理)
│   └── React Hooks API (响应式适配、交互处理)
├── 🛠️ 工具函数API
│   ├── 几何计算工具 (碰撞检测、坐标变换、边界计算)
│   ├── 拼图适配工具 (形状变换、智能适配、状态保持)
│   ├── 形状适配工具 (记忆系统、居中缩放、统一适配)
│   └── 渲染工具 (颜色处理、性能优化、视觉效果)
├── 💾 高级功能API
│   ├── 内存管理API (状态保存、拓扑记忆、智能清理)
│   └── 性能监控API (实时监控、基准测试、优化建议)
└── 📖 参考资料
    ├── 类型定义 (游戏状态、拼图类型、设备接口)
    ├── 使用示例 (完整组件、最佳实践、集成指南)
    ├── 开发指南 (架构设计、性能优化、测试策略)
    └── 迁移指南 (版本升级、API变更、兼容性)
```

### 🔧 核心API
- **[配置管理API](#配置管理api)**
  - [统一配置导入](#统一配置导入) | [设备配置API](#设备配置api) | [适配配置API](#适配配置api) | [性能配置API](#性能配置api)
- **[错误处理API](#错误处理api)**
  - [LoggingService](#loggingservice) | [ErrorHandlingService](#errorhandlingservice) | [ErrorMonitoringService](#errormonitoringservice) | [ValidationService](#validationservice)
- **[Next.js API路由](#nextjs-api路由)**
  - [性能趋势API](#性能趋势api) - 测试数据聚合、趋势分析、报告查询

### 🏗️ 系统架构API  
- **[核心管理器API](#核心管理器api)**
  - [DeviceManager](#devicemanager) | [CanvasManager](#canvasmanager) | [EventManager](#eventmanager) | [DeviceLayoutManager](#devicelayoutmanager)
- **[React Hooks API](#react-hooks-api)**
  - [统一系统Hooks](#统一系统hooks) | [专用Hooks](#专用hooks)

### 🛠️ 工具函数API
- **[几何计算工具](#几何计算工具)**
  - `isPointInPolygon` | `rotatePoint` | `calculateAngle` | `calculatePieceBounds`
- **[拼图适配工具](#拼图适配工具)**
  - `adaptPuzzlePiecesToShape` | `adaptScatteredPuzzlePieces` | `calculateShapeTransformation`
- **[形状适配工具](#形状适配工具)**
  - `adaptShapeWithMemory` | `centerShapeInCanvas` | `scaleShapeToSize` | `adaptShapeUnified`
- **[渲染工具](#渲染工具)**
  - `appendAlpha` | `RenderOptimizer`

### 💾 高级功能API
- **[内存管理API](#内存管理api)**
  - [MemoryManager](#memorymanager) | [StatePreservationEngine](#statepreservationengine)
- **[性能监控API](#性能监控api)**
  - [SystemPerformanceMonitor](#systemperformancemonitor) | [OptimizationAdapter](#optimizationadapter)

### 📖 参考资料
- **[类型定义](#类型定义)** - 核心类型、接口定义
- **[使用示例](#使用示例)** - 完整组件示例、配置使用示例  
- **[最佳实践](#最佳实践)** - 开发建议、性能优化
- **[迁移指南](#迁移指南)** - 从旧API迁移

### 🔍 快速搜索提示
- **按功能搜索**: 使用 `Ctrl+F` (Windows) 或 `Cmd+F` (Mac) 搜索关键词
- **常用搜索词**: `config`、`device`、`canvas`、`adaptation`、`error`、`logging`、`hook`、`manager`
- **API类型搜索**: `interface`、`class`、`function`、`export`、`import`
- **示例代码搜索**: `example`、`使用示例`、`const`、`await`

---

## 概述

**Generative Puzzle** 是一个基于 Next.js 和 React 构建的高性能响应式生成式拼图游戏。本文档提供了项目完整的API规范和使用指南，涵盖从核心游戏逻辑到系统架构的所有编程接口。

### 🎯 项目特色

- **🎮 生成式拼图游戏**: 支持多边形、曲线、不规则形状的动态生成和智能切割
- **📱 极致响应式适配**: 桌面与移动端、横竖屏自适应，拼图状态随窗口变化智能适配
- **🚀 高性能渲染**: 基于HTML Canvas的多层渲染引擎，60fps流畅体验
- **🔧 模块化架构**: 高度解耦的核心逻辑，完善的TypeScript类型系统
- **🧪 自动化测试闭环**: 100%稳定的E2E测试 + 性能数据归档 + 趋势可视化
- **💾 智能状态管理**: 内存优化的状态保存和恢复机制
- **📊 实时性能监控**: 自动化性能基准测试和趋势分析

### 🏗️ 技术架构

- **前端框架**: Next.js 15 / React 19
- **UI体系**: Radix UI + Shadcn UI / Tailwind CSS  
- **状态管理**: React Context + useReducer
- **类型系统**: TypeScript (核心类型集中于 `types/puzzleTypes.ts`)
- **渲染引擎**: HTML Canvas API (多层画布)
- **自动化测试**: Playwright (E2E测试 + 性能分析)
- **性能分析**: 测试数据自动归档、趋势仪表盘、报告可视化

### 📚 API分类说明

本文档按功能模块组织API，每个模块都提供完整的接口定义、使用示例和最佳实践：

- **核心API**: 配置管理、错误处理、服务端接口
- **系统架构API**: 设备管理、画布管理、事件系统、React Hooks
- **工具函数API**: 几何计算、拼图适配、形状处理、渲染优化
- **高级功能API**: 内存管理、性能监控、状态保存
- **参考资料**: 类型定义、使用示例、开发指南

## 配置管理API

> 📍 **快速跳转**: [错误处理API](#错误处理api) | [核心管理器API](#核心管理器api) | [React Hooks API](#react-hooks-api) | [返回顶部](#-快捷导航)

### 统一配置导入
```typescript
import {
  DEVICE_THRESHOLDS,
  DESKTOP_ADAPTATION,
  MOBILE_ADAPTATION,
  PERFORMANCE_THRESHOLDS,
  UNIFIED_CONFIG
} from '@/config';
```

### 设备配置API
```typescript
// 设备检测配置
interface DeviceThresholds {
  mobileMaxWidth: number;
  tabletMaxWidth: number;
  desktopMinWidth: number;
  touchDeviceMaxWidth: number;
}

// iPhone 16系列配置
interface iPhone16Model {
  portrait: { width: number; height: number };
  landscape: { width: number; height: number };
  devicePixelRatio: number;
  safeArea: { top: number; bottom: number };
}

// 使用示例
const deviceConfig = DEVICE_THRESHOLDS;
const iPhone16Models = IPHONE16_MODELS;
```

### 适配配置API
```typescript
// 桌面端适配配置
interface DesktopAdaptation {
  minCanvasSize: number;
  maxCanvasSize: number;
  defaultCanvasSize: number;
  containerPadding: number;
  aspectRatio: number;
}

// 移动端适配配置
interface MobileAdaptation {
  portrait: {
    canvasMargin: number;
    safeAreaTop: number;
    safeAreaBottom: number;
    panelHeight: number;
    maxCanvasSize: number;
  };
  landscape: {
    canvasMargin: number;
    safeAreaTop: number;
    minPanelWidth: number;
    maxPanelWidth: number;
    maxCanvasSize: number;
  };
}

// 使用示例
const desktopConfig = DESKTOP_ADAPTATION;
const mobileConfig = MOBILE_ADAPTATION;
```

### 性能配置API
```typescript
// 事件配置
interface EventConfig {
  debounceDelay: number;
  throttleDelay: number;
  resizeDebounce: number;
  scrollThrottle: number;
}

// 性能阈值配置
interface PerformanceThresholds {
  maxMemoryUsage: number;
  maxRenderTime: number;
  minFrameRate: number;
  maxEventDelay: number;
}

// 使用示例
const eventConfig = EVENT_CONFIG;
const performanceThresholds = PERFORMANCE_THRESHOLDS;
```

## 错误处理API

> 📍 **快速跳转**: [配置管理API](#配置管理api) | [Next.js API路由](#nextjs-api路由) | [核心管理器API](#核心管理器api) | [返回顶部](#-快捷导航)

### LoggingService
```typescript
import { LoggingService, LogLevel } from '@/core/LoggingService';

// 创建日志服务实例
const logger = new LoggingService({
  level: LogLevel.INFO,
  enableConsole: true,
  enableStorage: true,
  maxStorageEntries: 1000
});

// 使用方法
logger.debug('调试信息', { component: 'MyComponent' });
logger.info('信息日志', { userId: '123' });
logger.warn('警告信息', { action: 'userAction' });
logger.error('错误信息', error, { context: 'errorContext' });
```

### ErrorHandlingService
```typescript
import { ErrorHandlingService } from '@/core/ErrorHandlingService';

// 创建错误处理服务
const errorHandler = new ErrorHandlingService();

// 处理错误
try {
  // 可能出错的代码
} catch (error) {
  errorHandler.handleError(error, {
    component: 'MyComponent',
    action: 'userAction',
    severity: 'high'
  });
}

// 注册错误恢复策略
errorHandler.registerRecoveryStrategy('NetworkError', async (error) => {
  // 网络错误恢复逻辑
  return { success: true, message: '网络连接已恢复' };
});
```

### ErrorMonitoringService
```typescript
import { ErrorMonitoringService } from '@/core/ErrorMonitoringService';

// 创建监控服务
const monitor = new ErrorMonitoringService();

// 开始监控
monitor.startMonitoring();

// 获取错误统计
const stats = monitor.getErrorStats();
console.log('错误统计:', stats);

// 获取错误趋势
const trends = monitor.getErrorTrends();
console.log('错误趋势:', trends);
```

### ValidationService
```typescript
import { ValidationService } from '@/core/ValidationService';

// 创建验证服务
const validator = new ValidationService();

// 验证配置
const configValid = validator.validateConfig(config);
if (!configValid.isValid) {
  console.error('配置验证失败:', configValid.errors);
}

// 验证用户输入
const inputValid = validator.validateInput(userInput, {
  required: ['name', 'email'],
  types: { name: 'string', email: 'email' }
});
```

## 配置验证API

### 配置验证函数
```typescript
import { validateConfig, getConfigInfo } from '@/config';

// 验证所有配置
const isValid = validateConfig();
if (!isValid) {
  console.error('配置验证失败');
}

// 获取配置信息
const configInfo = getConfigInfo();
console.log('配置信息:', configInfo);
```

### 环境配置
```typescript
import { getLoggingConfig } from '@/config/loggingConfig';

// 根据环境获取日志配置
const loggingConfig = getLoggingConfig();
// 开发环境: DEBUG级别，包含堆栈跟踪
// 生产环境: INFO级别，不包含堆栈跟踪
// 测试环境: WARN级别，最小化输出
```

## 类型定义

### 核心类型
```typescript
// 设备类型
type DeviceType = 'phone' | 'tablet' | 'desktop';
type LayoutMode = 'portrait' | 'landscape' | 'desktop';

// 设备状态
interface DeviceState {
  deviceType: DeviceType;
  layoutMode: LayoutMode;
  screenWidth: number;
  screenHeight: number;
  isIOS: boolean;
  isAndroid: boolean;
  isTouchDevice: boolean;
}

// 适配结果
interface AdaptationResult {
  canvasSize: number;
  panelWidth?: number;
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

// 日志级别
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

// 错误上下文
interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}
```

## 使用示例

### 完整的组件示例
```typescript
import React, { useEffect } from 'react';
import { UNIFIED_CONFIG } from '@/config';
import { LoggingService, LogLevel } from '@/core/LoggingService';
import { ErrorHandlingService } from '@/core/ErrorHandlingService';

// 创建服务实例
const logger = new LoggingService({
  level: LogLevel.INFO,
  enableConsole: true,
  contextFields: ['component', 'action']
});

const errorHandler = new ErrorHandlingService();

const MyComponent: React.FC = () => {
  useEffect(() => {
    try {
      // 使用统一配置
      const deviceConfig = UNIFIED_CONFIG.device;
      const adaptationConfig = UNIFIED_CONFIG.adaptation;
      
      // 记录初始化日志
      logger.info('组件初始化', { 
        component: 'MyComponent',
        action: 'initialization'
      });
      
      // 组件逻辑...
      
    } catch (error) {
      // 统一错误处理
      errorHandler.handleError(error as Error, {
        component: 'MyComponent',
        action: 'initialization',
        severity: 'high'
      });
    }
  }, []);

  return (
    <div>
      {/* 组件内容 */}
    </div>
  );
};

export default MyComponent;
```

### 配置使用示例
```typescript
import { 
  DEVICE_THRESHOLDS,
  MOBILE_ADAPTATION,
  PERFORMANCE_THRESHOLDS 
} from '@/config';

// 设备检测
function detectDevice(screenWidth: number): DeviceType {
  if (screenWidth <= DEVICE_THRESHOLDS.mobileMaxWidth) {
    return 'phone';
  } else if (screenWidth <= DEVICE_THRESHOLDS.tabletMaxWidth) {
    return 'tablet';
  } else {
    return 'desktop';
  }
}

// 移动端适配
function calculateMobileCanvasSize(screenWidth: number, screenHeight: number) {
  const config = MOBILE_ADAPTATION.portrait;
  const availableWidth = screenWidth - config.canvasMargin * 2;
  const availableHeight = screenHeight - config.panelHeight - config.safeAreaTop - config.safeAreaBottom;
  
  return Math.min(availableWidth, availableHeight, config.maxCanvasSize);
}

// 性能监控
function checkPerformance(metrics: PerformanceMetrics) {
  const thresholds = PERFORMANCE_THRESHOLDS;
  
  if (metrics.memoryUsage > thresholds.maxMemoryUsage) {
    logger.warn('内存使用超过阈值', { 
      current: metrics.memoryUsage,
      threshold: thresholds.maxMemoryUsage
    });
  }
  
  if (metrics.frameRate < thresholds.minFrameRate) {
    logger.warn('帧率低于阈值', {
      current: metrics.frameRate,
      threshold: thresholds.minFrameRate
    });
  }
}
```

## 最佳实践

### 1. 配置使用
- 始终从统一配置导入，避免硬编码
- 使用类型安全的配置访问
- 在组件初始化时验证配置

### 2. 错误处理
- 使用统一的错误处理服务
- 提供足够的错误上下文信息
- 实现适当的错误恢复策略

### 3. 日志记录
- 使用结构化日志记录
- 根据环境选择合适的日志级别
- 包含有用的上下文信息

### 4. 性能监控
- 定期检查性能指标
- 设置合理的性能阈值
- 实现性能问题的自动报警

## 迁移指南

### 从旧API迁移
```typescript
// 旧方式
import { ADAPTATION_CONFIG } from './old-config';
console.log('Debug info');

// 新方式
import { UNIFIED_CONFIG } from '@/config';
import { logger } from '@/core/LoggingService';

const adaptationConfig = UNIFIED_CONFIG.adaptation;
logger.debug('Debug info', { component: 'MyComponent' });
```

### 错误处理迁移
```typescript
// 旧方式
try {
  // 代码
} catch (error) {
  console.error('Error:', error);
}

// 新方式
import { errorHandler } from '@/core/ErrorHandlingService';

try {
  // 代码
} catch (error) {
  errorHandler.handleError(error as Error, {
    component: 'MyComponent',
    action: 'userAction'
  });
}
```

## Next.js API路由

> 📍 **快速跳转**: [错误处理API](#错误处理api) | [核心管理器API](#核心管理器api) | [React Hooks API](#react-hooks-api) | [返回顶部](#-快捷导航)

项目提供了完整的服务端API接口，支持性能数据查询和测试报告聚合。所有API路由位于 `app/api/` 目录下，遵循Next.js 13+ App Router规范。

### 性能趋势API

**路径**: `app/api/performance-trend/route.ts`  
**功能**: 聚合并返回Playwright测试生成的性能报告数据，支持前端趋势图表展示

```typescript
// GET /api/performance-trend
// 获取性能测试趋势数据

interface PerformanceTrendResponse {
  time: string;                    // 简化时间格式 (HH:MM)
  fullTime: string;               // 完整时间戳 (YYYY-MM-DD HH:MM:SS)
  envMode: string;                // 环境模式 (development/production)
  status: '✅' | '❌';            // 测试状态 (通过/失败)
  count: number;                  // 拼图块数量
  resourceLoadTime: number;       // 资源加载时间 (ms)
  e2eLoadTime: number;           // 端到端加载时间 (ms)
  shapeGenerationTime: number;    // 形状生成时间 (ms)
  puzzleGenerationTime: number;   // 拼图生成时间 (ms)
  scatterTime: number;           // 散开动画时间 (ms)
  avgInteractionTime: number;     // 平均交互时间 (ms)
  fps: number;                   // 平均帧率
  memoryUsage: number;           // 内存使用量 (MB)
  shapeType: string;             // 形状类型
  cutType: string;               // 切割类型
  cutCount: string | number;     // 切割次数
  version: string;               // 项目版本
  failReason?: string;           // 失败原因 (可选)
}
```

#### API实现细节

```typescript
// 数据源处理
const logsDir = path.join(process.cwd(), 'playwright-test-logs');

// 文件过滤规则
const testReportFiles = fs.readdirSync(logsDir)
  .filter(f => /^test-report-.*\.md$/.test(f))
  .sort((a, b) => b.localeCompare(a)); // 按时间降序

// Markdown元数据提取
function extractMetaFromMarkdown(content: string) {
  const match = content.match(/<!--\s*({[\s\S]*?})\s*-->/);
  if (!match) return null;
  try {
    const meta = JSON.parse(match[1]);
    return meta?.data || null;
  } catch {
    return null;
  }
}
```

#### 使用示例

```typescript
// 基础用法
const response = await fetch('/api/performance-trend');
const trends: PerformanceTrendResponse[] = await response.json();

// 错误处理
try {
  const response = await fetch('/api/performance-trend');
  if (!response.ok) {
    const error = await response.json();
    console.error('API错误:', error.error, error.detail);
    return;
  }
  const trends = await response.json();
  console.log('性能趋势数据:', trends);
} catch (error) {
  console.error('请求失败:', error);
}

// React组件中使用
const [performanceData, setPerformanceData] = useState<PerformanceTrendResponse[]>([]);

useEffect(() => {
  const fetchPerformanceData = async () => {
    try {
      const response = await fetch('/api/performance-trend');
      const data = await response.json();
      setPerformanceData(data);
    } catch (error) {
      console.error('获取性能数据失败:', error);
    }
  };
  
  fetchPerformanceData();
}, []);
```

#### 数据格式说明

- **时间字段**: 提供两种格式，`time`用于图表显示，`fullTime`用于详细信息
- **环境区分**: `envMode`字段区分开发和生产环境的测试数据
- **状态标识**: `status`字段使用emoji直观显示测试结果
- **性能指标**: 涵盖加载、生成、渲染、交互等关键性能指标
- **测试场景**: 包含形状类型、切割参数等测试场景信息
- **错误信息**: `failReason`字段提供测试失败的详细原因

#### 相关文件

- **数据源**: `playwright-test-logs/test-report-*.md` - Playwright测试生成的性能报告
- **前端消费**: `app/test/page.tsx` - 性能趋势仪表盘页面
- **测试脚本**: `e2e/` - 生成性能数据的E2E测试脚本
- **归档脚本**: `scripts/archive-test-results.js` - 测试结果归档工具

## 核心管理器API

> 📍 **快速跳转**: [Next.js API路由](#nextjs-api路由) | [React Hooks API](#react-hooks-api) | [工具函数API](#工具函数api) | [返回顶部](#-快捷导航)

### DeviceManager
```typescript
import { DeviceManager } from '@/core/DeviceManager';

// 获取单例实例
const deviceManager = DeviceManager.getInstance();

// 获取当前设备状态
const deviceState = deviceManager.getState();

// 更新设备状态
deviceManager.updateState();

// 检测iPhone 16系列
const iPhone16Detection = deviceManager.detectiPhone16();

// 获取设备布局信息
const layoutInfo = deviceManager.getDeviceLayoutInfo();

// 事件监听
deviceManager.on('stateChange', (newState) => {
  console.log('设备状态变化:', newState);
});
```

### CanvasManager
```typescript
import { CanvasManager } from '@/core/CanvasManager';

// 获取单例实例
const canvasManager = CanvasManager.getInstance();

// 初始化画布引用
canvasManager.initialize({
  containerRef,
  canvasRef,
  backgroundCanvasRef
});

// 获取画布尺寸
const canvasSize = canvasManager.getSize();

// 更新画布尺寸
canvasManager.updateSize(newSize);

// 获取画布上下文
const context = canvasManager.getContext('main');
const bgContext = canvasManager.getContext('background');

// 检查画布边界
const isInBounds = canvasManager.isInBounds(x, y);
```

### EventManager
```typescript
import { EventManager } from '@/core/EventManager';

// 获取单例实例
const eventManager = EventManager.getInstance();

// 订阅事件
const unsubscribe = eventManager.subscribe('deviceChange', (data) => {
  console.log('设备变化事件:', data);
});

// 发布事件
eventManager.publish('canvasResize', { width: 800, height: 600 });

// 取消订阅
unsubscribe();

// 清理所有订阅
eventManager.cleanup();
```

### DeviceLayoutManager
```typescript
import { DeviceLayoutManager } from '@/core/DeviceLayoutManager';

// 获取单例实例
const layoutManager = DeviceLayoutManager.getInstance();

// 计算布局
const layout = layoutManager.calculateLayout(deviceState);

// 获取画布尺寸
const canvasSize = layoutManager.calculateCanvasSize(deviceState);

// 获取面板配置
const panelConfig = layoutManager.getPanelConfiguration(deviceState);
```

## React Hooks API

> 📍 **快速跳转**: [核心管理器API](#核心管理器api) | [工具函数API](#工具函数api) | [内存管理API](#内存管理api) | [返回顶部](#-快捷导航)

### 统一系统Hooks

#### useSystem
```typescript
import { useSystem } from '@/providers/SystemProvider';

const MyComponent = () => {
  const {
    deviceManager,
    canvasManager,
    eventManager,
    layoutManager
  } = useSystem();
  
  // 使用管理器实例...
};
```

#### useDevice
```typescript
import { useDevice } from '@/providers/hooks/useDevice';

const MyComponent = () => {
  const deviceState = useDevice();
  
  const {
    isMobile,
    isTablet,
    isDesktop,
    isPortrait,
    deviceType,
    layoutMode,
    screenWidth,
    screenHeight
  } = deviceState;
};

// 兼容性导出
import { useDeviceDetection, useIsMobile } from '@/providers/hooks/useDevice';
```

#### useCanvas
```typescript
import { useCanvas } from '@/providers/hooks/useCanvas';

const MyComponent = () => {
  const canvasSize = useCanvas({
    containerRef,
    canvasRef,
    backgroundCanvasRef
  });
  
  const { width, height } = canvasSize;
};

// 专用工具Hooks
import { 
  useCanvasContext, 
  useCanvasBounds 
} from '@/providers/hooks/useCanvasSize';

const context = useCanvasContext('main');
const bounds = useCanvasBounds();
```

#### useAdaptation
```typescript
import { 
  useAdaptation,
  usePuzzleAdaptation,
  useShapeAdaptation 
} from '@/providers/hooks/useAdaptation';

// 通用适配Hook
const adaptationResult = useAdaptation({
  canvasSize,
  previousCanvasSize,
  data: puzzlePieces
});

// 拼图适配Hook
const adaptedPuzzle = usePuzzleAdaptation(canvasSize, puzzlePieces);

// 形状适配Hook
const adaptedShape = useShapeAdaptation(canvasSize, baseShape);
```

### 专用Hooks

#### usePuzzleInteractions
```typescript
import { usePuzzleInteractions } from '@/hooks/usePuzzleInteractions';

const MyComponent = () => {
  const interactions = usePuzzleInteractions({
    canvasRef,
    containerRef,
    onPieceMove: (piece, position) => {
      // 处理拼图块移动
    },
    onPieceRotate: (piece, angle) => {
      // 处理拼图块旋转
    }
  });
};
```

## 工具函数API

> 📍 **快速跳转**: [React Hooks API](#react-hooks-api) | [内存管理API](#内存管理api) | [性能监控API](#性能监控api) | [返回顶部](#-快捷导航)

### 几何计算工具
```typescript
import {
  isPointInPolygon,
  rotatePoint,
  calculateAngle,
  calculatePieceBounds
} from '@/utils/geometry/puzzleGeometry';

// 点在多边形内检测
const isInside = isPointInPolygon(x, y, polygon);

// 点旋转
const rotated = rotatePoint(x, y, centerX, centerY, angle);

// 角度计算
const angle = calculateAngle(x1, y1, x2, y2);

// 拼图块边界计算
const bounds = calculatePieceBounds(piece);
```

### 拼图适配工具
```typescript
import {
  adaptPuzzlePiecesToShape,
  adaptScatteredPuzzlePieces,
  calculateShapeTransformation,
  safeAdaptPuzzlePieces,
  adaptPuzzlePiecesAbsolute
} from '@/utils/puzzlePieceAdaptationUtils';

// 计算形状变换参数
const transformation = calculateShapeTransformation(
  originalShape,
  adaptedShape
);

// 适配拼图块到新形状
const adaptedPieces = adaptPuzzlePiecesToShape(
  pieces,
  transformation,
  canvasSize
);

// 安全适配（避免累积误差）
const safeAdapted = safeAdaptPuzzlePieces(
  pieces,
  originalShape,
  newShape,
  canvasSize
);

// 绝对位置适配
const absoluteAdapted = adaptPuzzlePiecesAbsolute(
  originalPieces,
  originalCanvasSize,
  newCanvasSize
);
```

### 形状适配工具
```typescript
import {
  adaptShapeWithMemory,
  centerShapeInCanvas,
  scaleShapeToSize,
  adaptShapeUnified
} from '@/utils/shape/shapeAdaptationUtils';

// 带记忆的形状适配
const adaptedShape = await adaptShapeWithMemory(
  memoryManager,
  shapeMemoryId,
  originalShape,
  oldSize,
  newSize
);

// 形状居中
const centeredShape = centerShapeInCanvas(shape, canvasSize);

// 形状缩放
const scaledShape = scaleShapeToSize(shape, targetSize, canvasSize);

// 统一适配
const unifiedShape = await adaptShapeUnified(
  originalShape,
  oldSize,
  newSize
);
```

### 渲染工具
```typescript
import { appendAlpha } from '@/utils/rendering/colorUtils';
import { RenderOptimizer } from '@/utils/rendering/RenderOptimizer';

// 颜色透明度处理
const colorWithAlpha = appendAlpha('#ff0000', 0.5);

// 渲染优化器
const optimizer = RenderOptimizer.getInstance();
optimizer.optimizeRender(context, renderFunction);
```

## 内存管理API

> 📍 **快速跳转**: [工具函数API](#工具函数api) | [性能监控API](#性能监控api) | [类型定义](#类型定义) | [返回顶部](#-快捷导航)

### MemoryManager
```typescript
import { MemoryManager } from '@/utils/memory/MemoryManager';

// 创建内存管理器
const memoryManager = new MemoryManager();

// 存储形状记忆
await memoryManager.storeShapeMemory(shapeId, topology, canvasSize);

// 获取形状记忆
const memory = await memoryManager.getShapeMemory(shapeId);

// 清理过期记忆
memoryManager.cleanup();

// 事件监听
memoryManager.on('memoryStored', (shapeId) => {
  console.log('记忆已存储:', shapeId);
});
```

### StatePreservationEngine
```typescript
import { StatePreservationEngine } from '@/utils/adaptation/StatePreservationEngine';

// 创建状态保存引擎
const engine = new StatePreservationEngine();

// 保存拼图块状态
engine.saveAbsoluteState(pieces, canvasSize);

// 恢复拼图块状态
const restoredPieces = engine.restoreAbsoluteState(newCanvasSize);

// 清理状态
engine.cleanup();
```

## 性能监控API

> 📍 **快速跳转**: [内存管理API](#内存管理api) | [完整使用示例](#完整使用示例) | [最佳实践](#最佳实践) | [返回顶部](#-快捷导航)

### SystemPerformanceMonitor
```typescript
import { SystemPerformanceMonitor } from '@/utils/performance/SystemPerformanceMonitor';

// 获取监控实例
const monitor = SystemPerformanceMonitor.getInstance();

// 开始性能监控
monitor.startMonitoring();

// 记录性能快照
monitor.recordSnapshot('adaptation');

// 获取性能报告
const report = monitor.getPerformanceReport();

// 停止监控
monitor.stopMonitoring();
```

### OptimizationAdapter
```typescript
import { OptimizationAdapter } from '@/utils/performance/OptimizationAdapter';

// 获取优化适配器
const adapter = OptimizationAdapter.getInstance();

// 应用性能优化
adapter.applyOptimizations();

// 获取优化建议
const suggestions = adapter.getOptimizationSuggestions();
```

## 完整使用示例

### 综合组件示例
```typescript
import React, { useEffect } from 'react';
import { useSystem } from '@/providers/SystemProvider';
import { useDevice, useCanvas, useAdaptation } from '@/providers/hooks';
import { UNIFIED_CONFIG } from '@/config';
import { LoggingService } from '@/core/LoggingService';

const PuzzleGameComponent: React.FC = () => {
  const { deviceManager, canvasManager, eventManager } = useSystem();
  const deviceState = useDevice();
  const canvasSize = useCanvas({ containerRef, canvasRef, backgroundCanvasRef });
  const adaptationResult = useAdaptation({
    canvasSize,
    previousCanvasSize,
    data: puzzlePieces
  });

  useEffect(() => {
    // 初始化日志服务
    const logger = LoggingService.getInstance();
    logger.info('拼图游戏组件初始化', {
      deviceType: deviceState.deviceType,
      canvasSize: canvasSize
    });

    // 订阅设备变化事件
    const unsubscribe = eventManager.subscribe('deviceChange', (newState) => {
      logger.info('设备状态变化', { newState });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div>
      {/* 游戏界面 */}
    </div>
  );
};
```

这套API提供了Generative Puzzle项目的完整编程接口，涵盖游戏核心逻辑、响应式适配、性能优化、状态管理等所有功能模块。通过这些API，开发者可以：

- 🎮 **构建游戏功能**: 实现形状生成、拼图切割、交互控制等核心游戏逻辑
- 📱 **实现响应式适配**: 支持多设备、多分辨率的智能适配和状态保持
- 🚀 **优化性能表现**: 利用内置的性能监控和优化工具提升用户体验
- 🔧 **扩展系统功能**: 基于模块化架构轻松添加新功能和定制化需求
- 🧪 **保证代码质量**: 通过完善的类型系统和测试工具确保代码稳定性

项目采用现代化的开发理念和工程实践，为开发者提供了一个高质量、可维护、可扩展的拼图游戏开发框架。

---

## 🔝 返回导航

### 快速跳转
- [📚 快捷导航](#-快捷导航) - 返回文档顶部
- [🔧 核心API](#-核心api) - 配置管理、错误处理
- [🏗️ 系统架构API](#️-系统架构api) - 管理器、Hooks
- [🛠️ 工具函数API](#️-工具函数api) - 几何计算、适配工具
- [💾 高级功能API](#-高级功能api) - 内存管理、性能监控
- [📖 参考资料](#-参考资料) - 类型定义、示例、最佳实践

### 相关文档
- [项目结构文档](/docs/project_structure.md) - 完整项目结构
- [配置指南](/docs/configuration/README.md) - 环境配置和部署
- [更新日志](/CHANGELOG.md) - 版本历史和变更记录

---

*📝 文档最后更新: 2025年1月*  
*🔄 本文档与项目代码同步维护，如有API变更请及时更新*  
*📋 项目版本: v1.3.37 | 文档版本: v2.0*