/**
 * LoggingService - Unified logging interface for the application
 * Provides consistent logging with different levels, formatting, and context
 * Supports configurable output and error tracking
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

export interface LogContext {
  component?: string;
  method?: string;
  userId?: string;
  sessionId?: string;
  timestamp?: number;
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp: number;
  error?: Error;
}

export interface LoggingConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableStorage: boolean;
  maxStorageEntries: number;
  includeStackTrace: boolean;
  formatOutput: boolean;
  contextFields: string[];
}

export class LoggingService {
  private static instance: LoggingService;
  private config: LoggingConfig;
  private logStorage: LogEntry[] = [];
  private errorCount: number = 0;
  private warningCount: number = 0;

  private constructor() {
    this.config = {
      level: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
      enableConsole: true,
      enableStorage: true,
      maxStorageEntries: 1000,
      includeStackTrace: false,
      formatOutput: true,
      contextFields: ['component', 'method', 'timestamp']
    };
  }

  public static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  /**
   * Configure logging behavior
   */
  public configure(config: Partial<LoggingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  public getConfig(): LoggingConfig {
    return { ...this.config };
  }

  /**
   * Debug level logging
   */
  public debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Info level logging
   */
  public info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Warning level logging
   */
  public warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
    this.warningCount++;
  }

  /**
   * Error level logging
   */
  public error(message: string, error?: Error, context?: LogContext): void {
    const logContext = { ...context };
    if (error) {
      logContext.errorName = error.name;
      logContext.errorMessage = error.message;
      if (this.config.includeStackTrace) {
        logContext.stackTrace = error.stack;
      }
    }
    
    this.log(LogLevel.ERROR, message, logContext, error);
    this.errorCount++;
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    // Check if logging is enabled for this level
    if (level < this.config.level) {
      return;
    }

    const timestamp = Date.now();
    const logEntry: LogEntry = {
      level,
      message,
      context: {
        ...context,
        timestamp
      },
      timestamp,
      error
    };

    // Store log entry if storage is enabled
    if (this.config.enableStorage) {
      this.storeLogEntry(logEntry);
    }

    // Output to console if enabled
    if (this.config.enableConsole) {
      this.outputToConsole(logEntry);
    }
  }

  /**
   * Store log entry in memory
   */
  private storeLogEntry(entry: LogEntry): void {
    this.logStorage.push(entry);
    
    // Maintain storage size limit
    if (this.logStorage.length > this.config.maxStorageEntries) {
      this.logStorage = this.logStorage.slice(-this.config.maxStorageEntries);
    }
  }

  /**
   * Output log entry to console
   */
  private outputToConsole(entry: LogEntry): void {
    const levelName = LogLevel[entry.level];
    const timestamp = new Date(entry.timestamp).toISOString();
    
    let output: string;
    
    if (this.config.formatOutput) {
      // Formatted output with context
      const contextStr = this.formatContext(entry.context);
      output = `[${timestamp}] ${levelName}: ${entry.message}${contextStr}`;
    } else {
      // Simple output
      output = `${levelName}: ${entry.message}`;
    }

    // Choose appropriate console method
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(output);
        break;
      case LogLevel.INFO:
        console.info(output);
        break;
      case LogLevel.WARN:
        console.warn(output);
        break;
      case LogLevel.ERROR:
        console.error(output);
        if (entry.error && this.config.includeStackTrace) {
          console.error(entry.error);
        }
        break;
    }
  }

  /**
   * Format context information for display
   */
  private formatContext(context?: LogContext): string {
    if (!context || Object.keys(context).length === 0) {
      return '';
    }

    const relevantContext: any = {};
    
    // Include only configured context fields
    this.config.contextFields.forEach(field => {
      if (context[field] !== undefined) {
        relevantContext[field] = context[field];
      }
    });

    // Add any additional context fields that might be important
    if (context.errorName) relevantContext.errorName = context.errorName;
    if (context.errorMessage) relevantContext.errorMessage = context.errorMessage;

    if (Object.keys(relevantContext).length === 0) {
      return '';
    }

    return ` | ${JSON.stringify(relevantContext)}`;
  }

  /**
   * Get stored log entries
   */
  public getLogs(level?: LogLevel, limit?: number): LogEntry[] {
    let logs = this.logStorage;
    
    if (level !== undefined) {
      logs = logs.filter(entry => entry.level >= level);
    }
    
    if (limit) {
      logs = logs.slice(-limit);
    }
    
    return logs;
  }

  /**
   * Get logging statistics
   */
  public getStats(): {
    totalEntries: number;
    errorCount: number;
    warningCount: number;
    levelDistribution: Record<string, number>;
  } {
    const levelDistribution: Record<string, number> = {};
    
    this.logStorage.forEach(entry => {
      const levelName = LogLevel[entry.level];
      levelDistribution[levelName] = (levelDistribution[levelName] || 0) + 1;
    });

    return {
      totalEntries: this.logStorage.length,
      errorCount: this.errorCount,
      warningCount: this.warningCount,
      levelDistribution
    };
  }

  /**
   * Clear stored logs
   */
  public clearLogs(): void {
    this.logStorage = [];
    this.errorCount = 0;
    this.warningCount = 0;
  }

  /**
   * Create a logger with predefined context
   */
  public createLogger(defaultContext: LogContext): {
    debug: (message: string, context?: LogContext) => void;
    info: (message: string, context?: LogContext) => void;
    warn: (message: string, context?: LogContext) => void;
    error: (message: string, error?: Error, context?: LogContext) => void;
  } {
    return {
      debug: (message: string, context?: LogContext) => 
        this.debug(message, { ...defaultContext, ...context }),
      info: (message: string, context?: LogContext) => 
        this.info(message, { ...defaultContext, ...context }),
      warn: (message: string, context?: LogContext) => 
        this.warn(message, { ...defaultContext, ...context }),
      error: (message: string, error?: Error, context?: LogContext) => 
        this.error(message, error, { ...defaultContext, ...context })
    };
  }

  /**
   * Export logs for external analysis
   */
  public exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.logStorage, null, 2);
    } else {
      // CSV format
      const headers = ['timestamp', 'level', 'message', 'component', 'method', 'error'];
      const rows = this.logStorage.map(entry => [
        new Date(entry.timestamp).toISOString(),
        LogLevel[entry.level],
        entry.message,
        entry.context?.component || '',
        entry.context?.method || '',
        entry.error?.message || ''
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }

  /**
   * Performance logging helper
   */
  public time(label: string, context?: LogContext): () => void {
    const startTime = performance.now();
    const startContext = { ...context, label, startTime };
    
    this.debug(`Timer started: ${label}`, startContext);
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      const endContext = { ...context, label, duration: `${duration.toFixed(2)}ms` };
      
      this.info(`Timer ended: ${label} (${duration.toFixed(2)}ms)`, endContext);
    };
  }

  /**
   * Group related log entries
   */
  public group(label: string, callback: () => void, context?: LogContext): void {
    this.info(`Group start: ${label}`, context);
    
    try {
      callback();
    } catch (error) {
      this.error(`Group error: ${label}`, error as Error, context);
      throw error;
    } finally {
      this.info(`Group end: ${label}`, context);
    }
  }
}