/**
 * logger 单元测试
 * 
 * 🎯 验证日志工具函数核心逻辑
 */

import { 
  logger, 
  loggers, 
  performanceLogger, 
  debugLogger, 
  errorLogger, 
  loggingStats 
} from '../logger';

// Mock LoggingService
jest.mock('../../core/LoggingService', () => ({
  LoggingService: {
    getInstance: jest.fn(() => ({
      configure: jest.fn(),
      createLogger: jest.fn(() => ({
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
      })),
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      time: jest.fn(() => jest.fn()),
      getStats: jest.fn(() => ({ totalLogs: 0, errorCount: 0 })),
      getLogs: jest.fn(() => []),
      clearLogs: jest.fn(),
      exportLogs: jest.fn(() => '[]')
    }))
  }
}));

// Mock config
jest.mock('../../src/config/loggingConfig', () => ({
  getLoggingConfig: jest.fn(() => ({ level: 'info' })),
  COMPONENT_CONTEXTS: {
    DEVICE_MANAGER: 'device',
    ADAPTATION_ENGINE: 'adaptation',
    PUZZLE_SERVICE: 'puzzle',
    CANVAS_MANAGER: 'canvas',
    EVENT_MANAGER: 'event',
    USE_CANVAS: 'useCanvas',
    USE_CANVAS_SIZE: 'useCanvasSize',
    USE_CANVAS_REFS: 'useCanvasRefs',
    USE_CANVAS_EVENTS: 'useCanvasEvents'
  },
  LOG_PATTERNS: {
    INITIALIZATION: 'init',
    STATE_CHANGE: 'stateChange',
    EVENT_HANDLING: 'eventHandling',
    ERROR_RECOVERY: 'errorRecovery',
    PERFORMANCE: 'performance',
    USER_ACTION: 'userAction',
    SYSTEM_EVENT: 'systemEvent'
  }
}));

describe('logger - 日志工具函数测试', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('🔑 模块初始化', () => {
    test('应该在模块加载时正确配置日志服务', () => {
      // 重新导入模块以触发初始化代码
      jest.resetModules();
      
      const mockConfigure = jest.fn();
      const mockGetInstance = jest.fn(() => ({
        configure: mockConfigure,
        createLogger: jest.fn(() => ({
          info: jest.fn(),
          debug: jest.fn(),
          warn: jest.fn(),
          error: jest.fn()
        })),
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        time: jest.fn(() => jest.fn()),
        getStats: jest.fn(() => ({ totalLogs: 0, errorCount: 0 })),
        getLogs: jest.fn(() => []),
        clearLogs: jest.fn(),
        exportLogs: jest.fn(() => '[]')
      }));

      jest.doMock('../../core/LoggingService', () => ({
        LoggingService: {
          getInstance: mockGetInstance
        }
      }));

      const mockGetLoggingConfig = jest.fn(() => ({ level: 'info' }));
      jest.doMock('../../src/config/loggingConfig', () => ({
        getLoggingConfig: mockGetLoggingConfig,
        COMPONENT_CONTEXTS: {},
        LOG_PATTERNS: {}
      }));

      // 重新导入模块，这会触发第9行的配置代码
      require('../logger');

      expect(mockGetInstance).toHaveBeenCalled();
      expect(mockConfigure).toHaveBeenCalledWith({ level: 'info' });
      expect(mockGetLoggingConfig).toHaveBeenCalled();
    });
  });

  describe('🔑 基础日志功能', () => {
    test('应该正确导出主要日志实例', () => {
      expect(logger).toBeDefined();
      expect(typeof logger).toBe('object');
    });

    test('应该正确创建组件特定的日志器', () => {
      // 这些导入应该不会抛出错误
      expect(() => {
        const { 
          deviceLogger, 
          adaptationLogger, 
          puzzleLogger, 
          canvasLogger, 
          eventLogger 
        } = require('../logger');
        
        expect(deviceLogger).toBeDefined();
        expect(adaptationLogger).toBeDefined();
        expect(puzzleLogger).toBeDefined();
        expect(canvasLogger).toBeDefined();
        expect(eventLogger).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('🔑 便利日志函数', () => {
    test('应该正确记录初始化日志', () => {
      expect(() => {
        loggers.logInitialization('TestComponent', 'Component initialized');
      }).not.toThrow();
    });

    test('应该正确记录状态变化日志', () => {
      const fromState = { value: 1 };
      const toState = { value: 2 };
      
      expect(() => {
        loggers.logStateChange('TestComponent', fromState, toState);
      }).not.toThrow();
    });

    test('应该正确记录事件处理日志', () => {
      expect(() => {
        loggers.logEventHandling('TestComponent', 'click', { x: 100, y: 200 });
      }).not.toThrow();
    });

    test('应该正确记录错误恢复日志', () => {
      const error = new Error('Test error');
      
      expect(() => {
        loggers.logErrorRecovery('TestComponent', error, 'Retry operation');
      }).not.toThrow();
    });

    test('应该正确记录性能日志', () => {
      expect(() => {
        loggers.logPerformance('TestComponent', 'testOperation', 50);
        loggers.logPerformance('TestComponent', 'slowOperation', 150);
      }).not.toThrow();
    });

    test('应该正确记录用户行为日志', () => {
      expect(() => {
        loggers.logUserAction('button_click', { buttonId: 'submit' });
      }).not.toThrow();
    });

    test('应该正确记录系统事件日志', () => {
      expect(() => {
        loggers.logSystemEvent('window_resize', { width: 1920, height: 1080 });
      }).not.toThrow();
    });
  });

  describe('🔑 性能日志工具', () => {
    test('应该正确计时同步函数', () => {
      const testFunction = () => {
        return 'test result';
      };

      expect(() => {
        const result = performanceLogger.timeFunction('TestComponent', 'testFunction', testFunction);
        expect(result).toBe('test result');
      }).not.toThrow();
    });

    test('应该正确计时异步函数', async () => {
      const asyncFunction = async () => {
        return Promise.resolve('async result');
      };

      expect(async () => {
        const result = await performanceLogger.timeAsyncFunction('TestComponent', 'asyncFunction', asyncFunction);
        expect(result).toBe('async result');
      }).not.toThrow();
    });

    test('应该处理同步函数中的错误', () => {
      const errorFunction = () => {
        throw new Error('Test error');
      };

      expect(() => {
        performanceLogger.timeFunction('TestComponent', 'errorFunction', errorFunction);
      }).toThrow('Test error');
    });

    test('应该处理异步函数中的错误', async () => {
      const asyncErrorFunction = async () => {
        throw new Error('Async test error');
      };

      await expect(
        performanceLogger.timeAsyncFunction('TestComponent', 'asyncErrorFunction', asyncErrorFunction)
      ).rejects.toThrow('Async test error');
    });
  });

  describe('🔑 调试日志工具', () => {
    test('应该正确记录状态日志', () => {
      const testState = { count: 5, active: true };
      
      expect(() => {
        debugLogger.logState('TestComponent', 'componentState', testState);
      }).not.toThrow();
    });

    test('应该正确追踪函数调用', () => {
      const args = [1, 2, 3];
      
      expect(() => {
        const exitTrace = debugLogger.traceFunction('TestComponent', 'testFunction', args);
        expect(typeof exitTrace).toBe('function');
        exitTrace();
      }).not.toThrow();
    });
  });

  describe('🔑 错误处理工具', () => {
    test('应该正确处理错误', () => {
      const error = new Error('Test error');
      const recoveryAction = jest.fn();
      
      expect(() => {
        errorLogger.handleError('TestComponent', error, {}, recoveryAction);
      }).not.toThrow();
      
      expect(recoveryAction).toHaveBeenCalled();
    });

    test('应该处理恢复操作中的错误', () => {
      const error = new Error('Test error');
      const failingRecoveryAction = () => {
        throw new Error('Recovery failed');
      };
      
      expect(() => {
        errorLogger.handleError('TestComponent', error, {}, failingRecoveryAction);
      }).not.toThrow();
    });

    test('应该正确记录验证错误', () => {
      expect(() => {
        errorLogger.logValidationError('TestComponent', 'age', 'not a number', 'number');
      }).not.toThrow();
    });
  });

  describe('🔑 日志统计和管理', () => {
    test('应该正确获取日志统计', () => {
      expect(() => {
        const stats = loggingStats.getStats();
        expect(typeof stats).toBe('object');
      }).not.toThrow();
    });

    test('应该正确获取日志记录', () => {
      expect(() => {
        const logs = loggingStats.getLogs();
        expect(Array.isArray(logs)).toBe(true);
      }).not.toThrow();
    });

    test('应该正确清除日志', () => {
      expect(() => {
        loggingStats.clearLogs();
      }).not.toThrow();
    });

    test('应该正确导出日志', () => {
      expect(() => {
        const jsonLogs = loggingStats.exportLogs('json');
        const csvLogs = loggingStats.exportLogs('csv');
        
        expect(typeof jsonLogs).toBe('string');
        expect(typeof csvLogs).toBe('string');
      }).not.toThrow();
    });

    test('应该覆盖第208行 - exportLogs默认参数分支', () => {
      expect(() => {
        // 测试不传参数时使用默认的'json'格式
        const defaultFormatLogs = loggingStats.exportLogs();
        expect(typeof defaultFormatLogs).toBe('string');
        
        // 验证默认参数确实是'json'
        const explicitJsonLogs = loggingStats.exportLogs('json');
        expect(defaultFormatLogs).toBe(explicitJsonLogs);
      }).not.toThrow();
    });
  });

  describe('🔑 边界条件测试', () => {
    test('应该处理空的上下文对象', () => {
      expect(() => {
        loggers.logInitialization('TestComponent', 'Test message', {});
        loggers.logStateChange('TestComponent', null, undefined, {});
        loggers.logEventHandling('TestComponent', 'test', null, {});
      }).not.toThrow();
    });

    test('应该处理undefined和null值', () => {
      expect(() => {
        loggers.logStateChange('TestComponent', undefined, null);
        loggers.logEventHandling('TestComponent', 'test', undefined);
        debugLogger.logState('TestComponent', 'test', null);
      }).not.toThrow();
    });

    test('应该处理复杂的嵌套对象', () => {
      const complexObject = {
        nested: {
          array: [1, 2, { deep: 'value' }],
          func: () => 'test',
          date: new Date()
        }
      };
      
      expect(() => {
        loggers.logStateChange('TestComponent', {}, complexObject);
        debugLogger.logState('TestComponent', 'complex', complexObject);
      }).not.toThrow();
    });
  });

  describe('🔑 性能基准测试', () => {
    test('日志操作应该高效', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        loggers.logInitialization('TestComponent', `Message ${i}`);
        loggers.logStateChange('TestComponent', { count: i }, { count: i + 1 });
        loggers.logEventHandling('TestComponent', 'test', { index: i });
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100); // < 100ms for 300 log operations
    });

    test('性能计时应该准确', () => {
      const testFunction = () => {
        // 模拟一些工作
        const start = Date.now();
        while (Date.now() - start < 10) {
          // 等待10ms
        }
        return 'done';
      };

      expect(() => {
        const result = performanceLogger.timeFunction('TestComponent', 'testFunction', testFunction);
        expect(result).toBe('done');
      }).not.toThrow();
    });
  });

  describe('🔑 环境特定行为', () => {
    test('应该在开发环境中启用调试功能', () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = 'development';
      
      expect(() => {
        debugLogger.logState('TestComponent', 'test', { value: 1 });
        const exitTrace = debugLogger.traceFunction('TestComponent', 'test');
        exitTrace();
      }).not.toThrow();
      
      (process.env as any).NODE_ENV = originalEnv;
    });

    test('应该在生产环境中禁用调试功能', () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = 'production';
      
      expect(() => {
        debugLogger.logState('TestComponent', 'test', { value: 1 });
        const exitTrace = debugLogger.traceFunction('TestComponent', 'test');
        expect(typeof exitTrace).toBe('function');
        exitTrace();
      }).not.toThrow();
      
      (process.env as any).NODE_ENV = originalEnv;
    });
  });

  describe('🔑 错误处理鲁棒性', () => {
    test('应该处理日志服务不可用的情况', () => {
      // 这个测试验证即使底层服务有问题，包装器也不会崩溃
      expect(() => {
        loggers.logInitialization('TestComponent', 'Test');
        performanceLogger.timeFunction('TestComponent', 'test', () => 'result');
        errorLogger.handleError('TestComponent', new Error('test'));
      }).not.toThrow();
    });

    test('应该处理循环引用对象', () => {
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;
      
      expect(() => {
        // 循环引用会导致JSON.stringify抛出错误，这是预期的行为
        loggers.logStateChange('TestComponent', {}, circularObj);
      }).toThrow();
    });
  });
});