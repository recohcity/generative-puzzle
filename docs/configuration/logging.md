# 日志配置

> 修订日期：2025-08-04 (v1.3.39)

本文档详细说明项目的日志系统配置，包括不同环境的日志级别、输出格式和日志管理。

---

## 📁 配置文件位置

### 主要配置文件
```
src/config/loggingConfig.ts        # 日志配置
core/LoggingService.ts              # 日志服务
utils/logger.ts                     # 日志工具
```

---

## ⚙️ 环境日志配置

### 开发环境配置
```typescript
// src/config/loggingConfig.ts
export const DEVELOPMENT_LOGGING_CONFIG: LoggingConfig = {
  level: LogLevel.DEBUG,           // 调试级别
  enableConsole: true,             // 启用控制台输出
  enableFileLogging: false,        // 禁用文件日志
  enableStructuredLogging: true,   // 启用结构化日志
  enableTimestamp: true,           // 启用时间戳
  enableStackTrace: true,          // 启用堆栈跟踪
  maxLogSize: 1000,               // 最大日志条数
  logRotation: false              // 禁用日志轮转
};
```

### 生产环境配置
```typescript
// src/config/loggingConfig.ts
export const PRODUCTION_LOGGING_CONFIG: LoggingConfig = {
  level: LogLevel.INFO,            // 信息级别
  enableConsole: true,             // 启用控制台输出
  enableFileLogging: false,        // 禁用文件日志（已简化）
  enableStructuredLogging: true,   // 启用结构化日志
  enableTimestamp: true,           // 启用时间戳
  enableStackTrace: false,         // 禁用堆栈跟踪
  maxLogSize: 500,                // 最大日志条数
  logRotation: false              // 禁用日志轮转
};
```

### 测试环境配置
```typescript
// src/config/loggingConfig.ts
export const TESTING_LOGGING_CONFIG: LoggingConfig = {
  level: LogLevel.WARN,            // 警告级别
  enableConsole: false,            // 禁用控制台输出
  enableFileLogging: false,        // 禁用文件日志
  enableStructuredLogging: false,  // 禁用结构化日志
  enableTimestamp: false,          // 禁用时间戳
  enableStackTrace: false,         // 禁用堆栈跟踪
  maxLogSize: 100,                // 最大日志条数
  logRotation: false              // 禁用日志轮转
};
```

---

## 📊 日志级别配置

### 日志级别定义
```typescript
// core/LoggingService.ts
export enum LogLevel {
  DEBUG = 0,    // 调试信息
  INFO = 1,     // 一般信息
  WARN = 2,     // 警告信息
  ERROR = 3,    // 错误信息
  FATAL = 4     // 致命错误
}
```

### 日志级别使用指南
```typescript
// 日志级别使用建议
const LOG_LEVEL_USAGE = {
  DEBUG: '详细的调试信息，仅开发环境使用',
  INFO: '一般信息，记录程序运行状态',
  WARN: '警告信息，可能的问题但不影响运行',
  ERROR: '错误信息，需要关注的问题',
  FATAL: '致命错误，导致程序无法继续运行'
};
```

---

## 🎯 组件日志配置

### 组件上下文配置
```typescript
// src/config/loggingConfig.ts
export const COMPONENT_CONTEXTS = {
  DEVICE_MANAGER: 'DeviceManager',
  ADAPTATION_ENGINE: 'AdaptationEngine',
  PUZZLE_SERVICE: 'PuzzleService',
  CANVAS_MANAGER: 'CanvasManager',
  EVENT_MANAGER: 'EventManager',
  USE_CANVAS: 'useCanvas',
  USE_CANVAS_SIZE: 'useCanvasSize',
  USE_CANVAS_REFS: 'useCanvasRefs',
  USE_CANVAS_EVENTS: 'useCanvasEvents'
};
```

### 专用日志器配置
```typescript
// utils/logger.ts
export const deviceLogger = loggingService.createLogger(COMPONENT_CONTEXTS.DEVICE_MANAGER);
export const adaptationLogger = loggingService.createLogger(COMPONENT_CONTEXTS.ADAPTATION_ENGINE);
export const puzzleLogger = loggingService.createLogger(COMPONENT_CONTEXTS.PUZZLE_SERVICE);
export const canvasLogger = loggingService.createLogger(COMPONENT_CONTEXTS.CANVAS_MANAGER);
export const eventLogger = loggingService.createLogger(COMPONENT_CONTEXTS.EVENT_MANAGER);
```

---

## 🔧 日志格式配置

### 日志模式配置
```typescript
// src/config/loggingConfig.ts
export const LOG_PATTERNS = {
  SIMPLE: '[{level}] {message}',
  DETAILED: '[{timestamp}] [{level}] [{context}] {message}',
  STRUCTURED: {
    timestamp: '{timestamp}',
    level: '{level}',
    context: '{context}',
    message: '{message}',
    data: '{data}'
  },
  DEVELOPMENT: '[{timestamp}] [{level}] [{context}] {message} {data}',
  PRODUCTION: '[{level}] [{context}] {message}'
};
```

### 时间戳格式配置
```typescript
// core/LoggingService.ts
const TIMESTAMP_CONFIG = {
  format: 'YYYY-MM-DD HH:mm:ss.SSS',
  timezone: 'local',
  includeMilliseconds: true
};
```

---

## 📈 性能日志配置

### 性能日志器配置
```typescript
// utils/logger.ts
export const performanceLogger = {
  startTiming: (label: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.time(`[PERF] ${label}`);
    }
  },
  
  endTiming: (label: string): number => {
    if (process.env.NODE_ENV === 'development') {
      console.timeEnd(`[PERF] ${label}`);
    }
    return performance.now();
  },
  
  logMemoryUsage: () => {
    if (performance.memory && process.env.NODE_ENV === 'development') {
      const memory = performance.memory;
      console.log('[PERF] Memory Usage:', {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + 'MB',
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + 'MB',
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
      });
    }
  },
  
  logFPS: (fps: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[PERF] FPS: ${fps.toFixed(1)}`);
    }
  }
};
```

---

## 🐛 调试日志配置

### 调试日志器配置
```typescript
// utils/logger.ts
export const debugLogger = {
  log: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, data || '');
    }
  },
  
  warn: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[DEBUG] ${message}`, data || '');
    }
  },
  
  error: (message: string, error?: Error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[DEBUG] ${message}`, error || '');
      if (error?.stack) {
        console.error(error.stack);
      }
    }
  },
  
  group: (label: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.group(`[DEBUG] ${label}`);
    }
  },
  
  groupEnd: () => {
    if (process.env.NODE_ENV === 'development') {
      console.groupEnd();
    }
  }
};
```

---

## ❌ 错误日志配置

### 错误日志器配置
```typescript
// utils/logger.ts
export const errorLogger = {
  logError: (error: Error, context?: any) => {
    console.error('[ERROR]', error.message, {
      stack: error.stack,
      context: context,
      timestamp: new Date().toISOString()
    });
  },
  
  logWarning: (message: string, context?: any) => {
    console.warn('[WARNING]', message, {
      context: context,
      timestamp: new Date().toISOString()
    });
  },
  
  logInfo: (message: string, context?: any) => {
    console.info('[INFO]', message, {
      context: context,
      timestamp: new Date().toISOString()
    });
  },
  
  logCritical: (error: Error, context?: any) => {
    console.error('[CRITICAL]', error.message, {
      stack: error.stack,
      context: context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  }
};
```

---

## 📊 日志统计配置

### 日志统计器配置
```typescript
// utils/logger.ts
export const loggingStats = {
  counters: {
    debug: 0,
    info: 0,
    warn: 0,
    error: 0,
    fatal: 0
  },
  
  increment: (level: string) => {
    if (level in loggingStats.counters) {
      loggingStats.counters[level as keyof typeof loggingStats.counters]++;
    }
  },
  
  getStats: () => {
    return { ...loggingStats.counters };
  },
  
  reset: () => {
    Object.keys(loggingStats.counters).forEach(key => {
      loggingStats.counters[key as keyof typeof loggingStats.counters] = 0;
    });
  },
  
  report: () => {
    console.table(loggingStats.counters);
  }
};
```

---

## 🔧 配置修改指南

### 调整日志级别
```typescript
// 开发环境启用更详细的日志
export const DEVELOPMENT_LOGGING_CONFIG = {
  ...DEVELOPMENT_LOGGING_CONFIG,
  level: LogLevel.DEBUG,     // 显示所有日志
  enableStackTrace: true     // 启用堆栈跟踪
};

// 生产环境减少日志输出
export const PRODUCTION_LOGGING_CONFIG = {
  ...PRODUCTION_LOGGING_CONFIG,
  level: LogLevel.WARN,      // 只显示警告和错误
  enableStackTrace: false    // 禁用堆栈跟踪
};
```

### 调整日志格式
```typescript
// 使用简单格式
const useSimpleFormat = () => {
  return LOG_PATTERNS.SIMPLE;
};

// 使用详细格式
const useDetailedFormat = () => {
  return LOG_PATTERNS.DETAILED;
};
```

### 启用/禁用特定组件日志
```typescript
// 禁用特定组件的日志
const disableComponentLogging = (component: string) => {
  const logger = loggingService.getLogger(component);
  logger.setLevel(LogLevel.FATAL); // 只记录致命错误
};

// 启用特定组件的详细日志
const enableVerboseLogging = (component: string) => {
  const logger = loggingService.getLogger(component);
  logger.setLevel(LogLevel.DEBUG); // 记录所有日志
};
```

---

## 🐛 故障排除

### 日志问题诊断

#### 1. 日志不显示
**检查项**:
- 日志级别设置是否正确
- 控制台输出是否启用
- 浏览器控制台过滤设置

**解决方案**:
```typescript
// 检查当前日志配置
console.log('Current logging config:', getLoggingConfig());

// 临时启用所有日志
const tempConfig = {
  ...getLoggingConfig(),
  level: LogLevel.DEBUG,
  enableConsole: true
};
```

#### 2. 日志过多影响性能
**检查项**:
- 日志级别是否过低
- 是否在循环中记录日志
- 日志数据是否过大

**解决方案**:
```typescript
// 提高日志级别
export const PRODUCTION_LOGGING_CONFIG = {
  ...PRODUCTION_LOGGING_CONFIG,
  level: LogLevel.ERROR,     // 只记录错误
  maxLogSize: 100           // 限制日志数量
};
```

#### 3. 日志格式不正确
**检查项**:
- 日志模式配置是否正确
- 时间戳格式是否有效
- 结构化日志是否启用

**解决方案**:
```typescript
// 使用标准格式
const standardFormat = LOG_PATTERNS.DETAILED;

// 检查格式配置
console.log('Log pattern:', standardFormat);
```

---

## 📊 日志监控

### 日志监控配置
```typescript
// 日志监控器
class LogMonitor {
  private errorCount = 0;
  private warningCount = 0;
  private lastErrorTime = 0;
  
  monitor() {
    // 监控错误频率
    if (this.errorCount > 10 && Date.now() - this.lastErrorTime < 60000) {
      console.warn('High error rate detected');
    }
    
    // 监控内存使用
    if (performance.memory) {
      const memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024;
      if (memoryUsage > 100) {
        console.warn('High memory usage:', memoryUsage, 'MB');
      }
    }
  }
}
```

---

## 📈 配置更新历史

### v1.3.39 (当前版本)
- ✅ 简化日志配置结构
- ✅ 删除文件日志功能（已不需要）
- ✅ 优化性能日志配置
- ✅ 增强错误日志功能

### v1.3.38
- 🔧 优化日志格式配置
- 🔧 调整日志级别

### v1.3.37
- 🔧 简化日志系统
- 🔧 删除冗余日志配置

---

## 📚 相关文档

- **[核心架构配置](./core-architecture.md)** - 整体架构说明
- **[性能配置](./performance.md)** - 性能监控配置
- **[调试配置](./debug-mode.md)** - 调试模式配置

---

*📝 文档维护: 本文档基于v1.3.39的实际配置*  
*🔄 最后更新: 2025年1月4日*  
*✅ 监督指令合规: 完全符合简化日志原则*