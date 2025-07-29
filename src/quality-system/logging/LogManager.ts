// Log Management System

import { AdvancedLogger, LogContext } from './AdvancedLogger';
import { LoggerConfig, getLoggerConfig } from './LoggerConfig';
import { LogLevel } from '../types';

export interface LogManagerConfig {
  enableGlobalErrorHandler: boolean;
  enableUnhandledRejectionHandler: boolean;
  enableProcessExitHandler: boolean;
  logUncaughtExceptions: boolean;
  exitOnUncaughtException: boolean;
}

export class LogManager {
  private static instance: LogManager;
  private logger: AdvancedLogger;
  private config: LogManagerConfig;
  private originalConsole: {
    log: typeof console.log;
    error: typeof console.error;
    warn: typeof console.warn;
    info: typeof console.info;
    debug: typeof console.debug;
  };

  private constructor(loggerConfig?: LoggerConfig, managerConfig?: Partial<LogManagerConfig>) {
    this.logger = AdvancedLogger.getInstance(loggerConfig);
    this.config = {
      enableGlobalErrorHandler: true,
      enableUnhandledRejectionHandler: true,
      enableProcessExitHandler: true,
      logUncaughtExceptions: true,
      exitOnUncaughtException: false,
      ...managerConfig
    };

    // Store original console methods
    this.originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug
    };

    this.setupGlobalHandlers();
  }

  static getInstance(loggerConfig?: LoggerConfig, managerConfig?: Partial<LogManagerConfig>): LogManager {
    if (!LogManager.instance) {
      LogManager.instance = new LogManager(loggerConfig, managerConfig);
    }
    return LogManager.instance;
  }

  // Get the underlying logger
  getLogger(): AdvancedLogger {
    return this.logger;
  }

  // Console override methods
  overrideConsole(): void {
    console.log = (...args) => {
      this.logger.info(this.formatConsoleArgs(args));
    };

    console.info = (...args) => {
      this.logger.info(this.formatConsoleArgs(args));
    };

    console.warn = (...args) => {
      this.logger.warn(this.formatConsoleArgs(args));
    };

    console.error = (...args) => {
      const message = this.formatConsoleArgs(args);
      const error = args.find(arg => arg instanceof Error) as Error | undefined;
      this.logger.error(message, error);
    };

    console.debug = (...args) => {
      this.logger.debug(this.formatConsoleArgs(args));
    };
  }

  restoreConsole(): void {
    console.log = this.originalConsole.log;
    console.error = this.originalConsole.error;
    console.warn = this.originalConsole.warn;
    console.info = this.originalConsole.info;
    console.debug = this.originalConsole.debug;
  }

  // Request/Response logging middleware
  createExpressMiddleware() {
    return (req: any, res: any, next: any) => {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const startTime = Date.now();

      // Set request context
      this.logger.setGlobalContext({
        requestId,
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });

      // Log request
      this.logger.info('HTTP Request', {
        method: req.method,
        url: req.url,
        headers: req.headers,
        query: req.query,
        body: req.body
      });

      // Override res.end to log response
      const originalEnd = res.end;
      res.end = function(chunk: any, encoding: any) {
        const duration = Date.now() - startTime;
        
        LogManager.instance.logger.info('HTTP Response', {
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          contentLength: res.get('Content-Length')
        });

        originalEnd.call(res, chunk, encoding);
      };

      next();
    };
  }

  // Performance monitoring
  createPerformanceMonitor(operation: string, context?: LogContext) {
    const timerId = this.logger.startPerformanceTimer(operation, context);
    
    return {
      end: (additionalContext?: LogContext) => {
        this.logger.endPerformanceTimer(timerId, additionalContext);
      }
    };
  }

  // Structured logging helpers
  logUserAction(userId: string, action: string, details?: any): void {
    this.logger.info('User Action', {
      userId,
      action,
      details,
      component: 'UserAction'
    });
  }

  logSystemEvent(event: string, details?: any): void {
    this.logger.info('System Event', {
      event,
      details,
      component: 'System'
    });
  }

  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', details?: any): void {
    const level = severity === 'critical' ? LogLevel.CRITICAL : 
                  severity === 'high' ? LogLevel.ERROR :
                  severity === 'medium' ? LogLevel.WARN : LogLevel.INFO;

    this.logger.logWithContext(level, 'Security Event', {
      event,
      severity,
      details,
      component: 'Security'
    });
  }

  logBusinessEvent(event: string, details?: any): void {
    this.logger.info('Business Event', {
      event,
      details,
      component: 'Business'
    });
  }

  // Health check logging
  logHealthCheck(service: string, status: 'healthy' | 'unhealthy' | 'degraded', details?: any): void {
    const level = status === 'healthy' ? LogLevel.INFO :
                  status === 'degraded' ? LogLevel.WARN : LogLevel.ERROR;

    this.logger.logWithContext(level, 'Health Check', {
      service,
      status,
      details,
      component: 'HealthCheck'
    });
  }

  // Shutdown handling
  async shutdown(): Promise<void> {
    this.logger.info('LogManager shutting down');
    
    // Restore console if overridden
    this.restoreConsole();
    
    // Remove global handlers
    this.removeGlobalHandlers();
    
    // Shutdown logger
    await this.logger.shutdown();
  }

  private setupGlobalHandlers(): void {
    if (this.config.enableGlobalErrorHandler) {
      process.on('uncaughtException', this.handleUncaughtException.bind(this));
    }

    if (this.config.enableUnhandledRejectionHandler) {
      process.on('unhandledRejection', this.handleUnhandledRejection.bind(this));
    }

    if (this.config.enableProcessExitHandler) {
      process.on('SIGINT', this.handleProcessExit.bind(this));
      process.on('SIGTERM', this.handleProcessExit.bind(this));
    }
  }

  private removeGlobalHandlers(): void {
    process.removeListener('uncaughtException', this.handleUncaughtException.bind(this));
    process.removeListener('unhandledRejection', this.handleUnhandledRejection.bind(this));
    process.removeListener('SIGINT', this.handleProcessExit.bind(this));
    process.removeListener('SIGTERM', this.handleProcessExit.bind(this));
  }

  private handleUncaughtException(error: Error): void {
    if (this.config.logUncaughtExceptions) {
      this.logger.critical('Uncaught Exception', error, {
        component: 'GlobalErrorHandler'
      });
    }

    if (this.config.exitOnUncaughtException) {
      setTimeout(() => {
        process.exit(1);
      }, 1000); // Give time for logs to flush
    }
  }

  private handleUnhandledRejection(reason: any, promise: Promise<any>): void {
    this.logger.error('Unhandled Promise Rejection', reason instanceof Error ? reason : new Error(String(reason)), {
      component: 'GlobalErrorHandler',
      promise: promise.toString()
    });
  }

  private handleProcessExit(signal: string): void {
    this.logger.info('Process exit signal received', {
      signal,
      component: 'ProcessHandler'
    });

    this.shutdown().then(() => {
      process.exit(0);
    }).catch((error) => {
      console.error('Error during shutdown:', error);
      process.exit(1);
    });
  }

  private formatConsoleArgs(args: any[]): string {
    return args.map(arg => {
      if (typeof arg === 'string') {
        return arg;
      } else if (arg instanceof Error) {
        return `${arg.name}: ${arg.message}`;
      } else {
        return JSON.stringify(arg);
      }
    }).join(' ');
  }
}

// Export singleton instance
export const logManager = LogManager.getInstance();