# Task 17: 统一日志服务实现

## 概述

本任务实现了统一的日志服务系统，提供一致的日志接口，支持不同日志级别、可配置的日志输出和格式化，以及上下文信息和错误追踪功能。

## 实现目标

### 主要目标
1. **统一日志接口**: 创建 `LoggingService` 类提供统一的日志接口
2. **多级别支持**: 支持不同日志级别（debug, info, warn, error）
3. **可配置输出**: 实现可配置的日志输出和格式化
4. **上下文追踪**: 添加上下文信息和错误追踪
5. **组件专用**: 为各组件提供专用的日志记录器

### 具体实现
- 创建 `LoggingService` 类提供统一的日志接口
- 支持不同日志级别（debug, info, warn, error）
- 实现可配置的日志输出和格式化
- 添加上下文信息和错误追踪

## 架构设计

### 核心组件

#### 1. LoggingService (core/LoggingService.ts)
```typescript
export class LoggingService {
  // 单例模式
  public static getInstance(): LoggingService
  
  // 配置管理
  public configure(config: Partial<LoggingConfig>): void
  
  // 日志记录方法
  public debug(message: string, context?: LogContext): void
  public info(message: string, context?: LogContext): void
  public warn(message: string, context?: LogContext): void
  public error(message: string, error?: Error, context?: LogContext): void
  
  // 工具方法
  public getLogs(level?: LogLevel, limit?: number): LogEntry[]
  public getStats(): LogStats
  public clearLogs(): void
  public exportLogs(format: 'json' | 'csv'): string
  public createLogger(defaultContext: LogContext): ComponentLogger
}
```

#### 2. 日志配置 (src/config/loggingConfig.ts)
```typescript
export interface LoggingConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableStorage: boolean;
  maxStorageEntries: number;
  includeStackTrace: boolean;
  formatOutput: boolean;
  contextFields: string[];
}

// 环境特定配置
export const DEVELOPMENT_LOGGING_CONFIG: LoggingConfig
export const PRODUCTION_LOGGING_CONFIG: LoggingConfig
export const TESTING_LOGGING_CONFIG: LoggingConfig
```

#### 3. 日志工具 (utils/logger.ts)
```typescript
// 主要日志服务实例
export const logger: LoggingService

// 组件专用日志记录器
export const deviceLogger: ComponentLogger
export const adaptationLogger: ComponentLogger
export const puzzleLogger: ComponentLogger
export const canvasLogger: ComponentLogger

// 便捷日志模式
export const loggers: {
  logInitialization: (component: string, message: string) => void
  logStateChange: (component: string, from: any, to: any) => void
  logEventHandling: (component: string, eventType: string) => void
  logErrorRecovery: (component: string, error: Error, action: string) => void
}

// 性能日志工具
export const performanceLogger: {
  timeFunction: <T>(component: string, name: string, fn: () => T) => T
  timeAsyncFunction: <T>(component: string, name: string, fn: () => Promise<T>) => Promise<T>
}
```

## 功能特性

### 1. 多级别日志支持
```typescript
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

// 使用示例
logger.debug('调试信息');
logger.info('一般信息');
logger.warn('警告信息');
logger.error('错误信息', error);
```

### 2. 上下文信息追踪
```typescript
interface LogContext {
  component?: string;
  method?: string;
  userId?: string;
  sessionId?: string;
  timestamp?: number;
  [key: string]: any;
}

// 使用示例
logger.info('用户登录', {
  component: 'AuthService',
  method: 'login',
  userId: 'user123'
});
```

### 3. 错误追踪和堆栈信息
```typescript
try {
  // 一些操作
} catch (error) {
  logger.error('操作失败', error, {
    component: 'DataService',
    method: 'processData'
  });
}
```

### 4. 可配置的输出格式
```typescript
// 开发环境配置
{
  level: LogLevel.DEBUG,
  enableConsole: true,
  enableStorage: true,
  includeStackTrace: true,
  formatOutput: true
}

// 生产环境配置
{
  level: LogLevel.INFO,
  enableConsole: true,
  enableStorage: true,
  includeStackTrace: false,
  formatOutput: true
}
```

### 5. 组件专用日志记录器
```typescript
// 设备管理器专用日志
deviceLogger.info('设备状态更新', { deviceType: 'mobile' });

// 适配引擎专用日志
adaptationLogger.warn('适配性能警告', { duration: '150ms' });

// 拼图服务专用日志
puzzleLogger.debug('拼图适配开始', { pieceCount: 24 });
```

### 6. 性能监控
```typescript
// 函数执行时间监控
const result = performanceLogger.timeFunction('DataService', 'processData', () => {
  return processLargeDataset();
});

// 异步函数监控
const data = await performanceLogger.timeAsyncFunction('ApiService', 'fetchData', async () => {
  return await fetch('/api/data');
});
```

### 7. 日志统计和导出
```typescript
// 获取日志统计
const stats = logger.getStats();
console.log(`总日志: ${stats.totalEntries}, 错误: ${stats.errorCount}`);

// 导出日志
const jsonLogs = logger.exportLogs('json');
const csvLogs = logger.exportLogs('csv');
```

## 使用示例

### 基本使用
```typescript
import { logger, deviceLogger, loggers } from '../utils/logger';

// 基本日志记录
logger.info('应用启动');
logger.warn('配置缺失', { config: 'database' });

// 组件专用日志
deviceLogger.info('设备检测完成', { deviceType: 'iPhone 16' });

// 使用日志模式
loggers.logInitialization('DeviceManager', '设备管理器初始化完成');
loggers.logStateChange('DeviceManager', oldState, newState);
```

### 错误处理
```typescript
import { errorLogger } from '../utils/logger';

try {
  await riskyOperation();
} catch (error) {
  errorLogger.handleError('DataService', error, { operation: 'save' }, () => {
    // 恢复操作
    fallbackSave();
  });
}
```

### 性能监控
```typescript
import { performanceLogger } from '../utils/logger';

// 监控函数性能
const processedData = performanceLogger.timeFunction('DataProcessor', 'transform', () => {
  return transformData(rawData);
});

// 监控异步操作
const response = await performanceLogger.timeAsyncFunction('ApiClient', 'request', async () => {
  return await fetch('/api/endpoint');
});
```

### 调试工具
```typescript
import { debugLogger } from '../utils/logger';

// 状态快照
debugLogger.logState('GameEngine', 'playerState', currentPlayer);

// 函数追踪
const exitTrace = debugLogger.traceFunction('GameEngine', 'updateScore', [playerId, score]);
// ... 函数执行
exitTrace(); // 记录函数退出
```

## 配置管理

### 环境特定配置
```typescript
// 开发环境
export const DEVELOPMENT_LOGGING_CONFIG: LoggingConfig = {
  level: LogLevel.DEBUG,
  enableConsole: true,
  enableStorage: true,
  maxStorageEntries: 1000,
  includeStackTrace: true,
  formatOutput: true,
  contextFields: ['component', 'method', 'timestamp', 'userId']
};

// 生产环境
export const PRODUCTION_LOGGING_CONFIG: LoggingConfig = {
  level: LogLevel.INFO,
  enableConsole: true,
  enableStorage: true,
  maxStorageEntries: 500,
  includeStackTrace: false,
  formatOutput: true,
  contextFields: ['component', 'method', 'timestamp']
};
```

### 组件上下文
```typescript
export const COMPONENT_CONTEXTS = {
  DEVICE_MANAGER: { component: 'DeviceManager' },
  ADAPTATION_ENGINE: { component: 'AdaptationEngine' },
  PUZZLE_SERVICE: { component: 'PuzzleAdaptationService' },
  CANVAS_MANAGER: { component: 'CanvasManager' },
  EVENT_MANAGER: { component: 'EventManager' }
} as const;
```

## 测试验证

### 测试覆盖
- ✅ 基本日志功能测试
- ✅ 上下文信息测试
- ✅ 错误日志和堆栈追踪测试
- ✅ 日志级别过滤测试
- ✅ 组件专用日志记录器测试
- ✅ 日志模式测试
- ✅ 性能监控测试
- ✅ 日志统计测试
- ✅ 日志导出测试
- ✅ 配置管理测试

### 测试命令
```bash
# 运行日志服务测试
node -e "const { runLoggingServiceTests } = require('./tests/test-logging-service.ts'); runLoggingServiceTests();"
```

## 集成指南

### 1. 在现有组件中使用
```typescript
// 在 DeviceManager 中
import { deviceLogger } from '../utils/logger';

export class DeviceManager {
  constructor() {
    deviceLogger.info('DeviceManager 初始化');
  }
  
  updateState() {
    deviceLogger.debug('更新设备状态');
    // ... 实现
  }
}
```

### 2. 替换现有 console.log
```typescript
// 替换前
console.log('设备检测完成:', deviceInfo);

// 替换后
deviceLogger.info('设备检测完成', { deviceInfo });
```

### 3. 错误处理集成
```typescript
// 替换前
try {
  // 操作
} catch (error) {
  console.error('操作失败:', error);
}

// 替换后
try {
  // 操作
} catch (error) {
  logger.error('操作失败', error, { component: 'ComponentName' });
}
```

## 性能考虑

### 1. 日志级别过滤
- 生产环境使用 INFO 级别，过滤调试信息
- 开发环境使用 DEBUG 级别，显示详细信息

### 2. 存储管理
- 限制内存中存储的日志条目数量
- 提供日志清理机制

### 3. 格式化优化
- 可配置的输出格式，减少不必要的字符串操作
- 延迟格式化，只在实际输出时进行

## 未来扩展

### 1. 远程日志收集
- 支持将日志发送到远程服务器
- 实现日志聚合和分析

### 2. 日志持久化
- 支持将日志保存到本地存储
- 实现日志轮转和压缩

### 3. 实时监控
- 提供实时日志监控界面
- 支持日志告警和通知

## 总结

统一日志服务的实现为项目提供了：

1. ✅ **一致的日志接口**: 所有组件使用统一的日志记录方式
2. ✅ **灵活的配置**: 支持不同环境的日志配置
3. ✅ **丰富的上下文**: 提供详细的上下文信息追踪
4. ✅ **性能监控**: 内置性能监控和统计功能
5. ✅ **错误追踪**: 完善的错误处理和堆栈追踪
6. ✅ **易于使用**: 提供便捷的工具函数和组件专用日志器

这个统一日志服务为后续的日志管理和系统监控奠定了坚实的基础。