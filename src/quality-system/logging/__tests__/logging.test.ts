// Logging System Tests

import { AdvancedLogger } from '../AdvancedLogger';
import { LogManager } from '../LogManager';
import { getLoggerConfig, developmentLoggerConfig } from '../LoggerConfig';
import { LogLevel } from '../../types';

describe('Logging System', () => {
  let logger: AdvancedLogger;
  let logManager: LogManager;

  beforeEach(() => {
    // Create fresh instances for each test
    logger = new (AdvancedLogger as any)(developmentLoggerConfig);
    // Create LogManager with disabled global handlers for testing
    logManager = new (LogManager as any)(developmentLoggerConfig, {
      enableGlobalErrorHandler: false,
      enableUnhandledRejectionHandler: false,
      enableProcessExitHandler: false
    });
  });

  afterEach(async () => {
    await logger.shutdown();
    await logManager.shutdown();
  });

  describe('AdvancedLogger', () => {
    it('should log messages at different levels', async () => {
      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();
      const infoSpy = jest.spyOn(console, 'info').mockImplementation();
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();

      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');
      logger.critical('Critical message');

      // Wait for async logging to complete
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(consoleSpy).toHaveBeenCalled();
      expect(infoSpy).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledTimes(2); // error and critical

      consoleSpy.mockRestore();
      infoSpy.mockRestore();
      warnSpy.mockRestore();
      errorSpy.mockRestore();
    });

    it('should respect log level filtering', async () => {
      // Create logger with WARN level
      const warnConfig = { ...developmentLoggerConfig, level: LogLevel.WARN };
      const warnLogger = new (AdvancedLogger as any)(warnConfig);

      const debugSpy = jest.spyOn(console, 'debug').mockImplementation();
      const infoSpy = jest.spyOn(console, 'info').mockImplementation();
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      warnLogger.debug('Debug message'); // Should not log
      warnLogger.info('Info message');   // Should not log
      warnLogger.warn('Warning message'); // Should log

      // Wait for async logging to complete
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(debugSpy).not.toHaveBeenCalled();
      expect(infoSpy).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();

      debugSpy.mockRestore();
      infoSpy.mockRestore();
      warnSpy.mockRestore();
      
      await warnLogger.shutdown();
    });

    it('should handle context and error objects', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const testError = new Error('Test error');
      const context = { userId: '123', action: 'test' };

      logger.error('Error with context', testError, context);

      // Wait for async logging to complete
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(errorSpy).toHaveBeenCalled();
      
      errorSpy.mockRestore();
    });

    it('should manage global context', () => {
      const infoSpy = jest.spyOn(console, 'info').mockImplementation();
      
      logger.setGlobalContext({ userId: '123', sessionId: 'session-456' });
      logger.info('Test message');

      const globalContext = logger.getGlobalContext();
      expect(globalContext.userId).toBe('123');
      expect(globalContext.sessionId).toBe('session-456');

      logger.clearGlobalContext();
      const clearedContext = logger.getGlobalContext();
      expect(Object.keys(clearedContext)).toHaveLength(0);

      infoSpy.mockRestore();
    });

    it('should handle performance timing', () => {
      const infoSpy = jest.spyOn(console, 'info').mockImplementation();
      const debugSpy = jest.spyOn(console, 'debug').mockImplementation();

      const timerId = logger.startPerformanceTimer('test-operation');
      expect(typeof timerId).toBe('string');

      // Simulate some work
      setTimeout(() => {
        logger.endPerformanceTimer(timerId);
      }, 10);

      debugSpy.mockRestore();
      infoSpy.mockRestore();
    });

    it('should update configuration', () => {
      const originalConfig = logger.getConfig();
      expect(originalConfig.level).toBe(LogLevel.DEBUG);

      logger.updateConfig({ level: LogLevel.ERROR });
      const updatedConfig = logger.getConfig();
      expect(updatedConfig.level).toBe(LogLevel.ERROR);
    });
  });

  describe('LogManager', () => {
    it('should create performance monitor', () => {
      const monitor = logManager.createPerformanceMonitor('test-operation');
      expect(monitor).toBeDefined();
      expect(typeof monitor.end).toBe('function');

      // End the monitor
      monitor.end();
    });

    it('should have structured logging methods', () => {
      // Test that the methods exist and can be called without errors
      expect(() => {
        logManager.logUserAction('user123', 'login', { ip: '127.0.0.1' });
        logManager.logSystemEvent('startup', { version: '1.0.0' });
        logManager.logBusinessEvent('purchase', { amount: 100 });
      }).not.toThrow();
    });

    it('should have security event logging', () => {
      // Test that security logging methods exist and can be called
      expect(() => {
        logManager.logSecurityEvent('login-attempt', 'low', { userId: '123' });
        logManager.logSecurityEvent('failed-login', 'medium', { userId: '123' });
        logManager.logSecurityEvent('brute-force', 'high', { ip: '1.2.3.4' });
        logManager.logSecurityEvent('data-breach', 'critical', { affected: 1000 });
      }).not.toThrow();
    });

    it('should have health check logging', () => {
      // Test that health check logging methods exist and can be called
      expect(() => {
        logManager.logHealthCheck('database', 'healthy', { responseTime: 50 });
        logManager.logHealthCheck('api', 'degraded', { responseTime: 2000 });
        logManager.logHealthCheck('cache', 'unhealthy', { error: 'Connection failed' });
      }).not.toThrow();
    });
  });

  describe('Configuration', () => {
    it('should load different environment configurations', () => {
      const devConfig = getLoggerConfig('development');
      const prodConfig = getLoggerConfig('production');
      const testConfig = getLoggerConfig('test');

      expect(devConfig.level).toBe(LogLevel.DEBUG);
      expect(prodConfig.level).toBe(LogLevel.WARN);
      expect(testConfig.level).toBe(LogLevel.ERROR);

      expect(devConfig.enablePerformanceLogging).toBe(true);
      expect(prodConfig.enablePerformanceLogging).toBe(false);
    });

    it('should have appropriate output configurations', () => {
      const devConfig = getLoggerConfig('development');
      const prodConfig = getLoggerConfig('production');

      // Development should have console and file outputs
      expect(devConfig.outputs).toHaveLength(2);
      expect(devConfig.outputs.some(o => o.type === 'console')).toBe(true);
      expect(devConfig.outputs.some(o => o.type === 'file')).toBe(true);

      // Production should have file and remote outputs
      expect(prodConfig.outputs).toHaveLength(2);
      expect(prodConfig.outputs.some(o => o.type === 'file')).toBe(true);
      expect(prodConfig.outputs.some(o => o.type === 'remote')).toBe(true);
    });
  });
});