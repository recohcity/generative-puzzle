// Advanced Logger Implementation

import { ILogger } from '../interfaces';
import { LogLevel, LogEntry } from '../types';
import { LoggerConfig, getLoggerConfig } from './LoggerConfig';
import { ILoggerOutput, createLoggerOutput } from './LoggerOutputs';
import { ILoggerFormatter, createFormatter } from './LoggerFormatter';

export interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  component?: string;
  action?: string;
  [key: string]: any;
}

export interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryUsage?: NodeJS.MemoryUsage;
  operation: string;
}

export class AdvancedLogger implements ILogger {
  private static instance: AdvancedLogger;
  private config: LoggerConfig;
  private outputs: ILoggerOutput[] = [];
  private formatter: ILoggerFormatter;
  private globalContext: LogContext = {};
  private performanceMetrics: Map<string, PerformanceMetrics> = new Map();
  private logQueue: LogEntry[] = [];
  private isProcessingQueue: boolean = false;

  private constructor(config?: LoggerConfig) {
    this.config = config || getLoggerConfig();
    this.formatter = createFormatter(this.config);
    this.initializeOutputs();
    this.generateSessionId();
  }

  static getInstance(config?: LoggerConfig): AdvancedLogger {
    if (!AdvancedLogger.instance) {
      AdvancedLogger.instance = new AdvancedLogger(config);
    }
    return AdvancedLogger.instance;
  }

  // Basic logging methods
  debug(message: string, context?: any): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: any): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: any): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: any): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  critical(message: string, error?: Error, context?: any): void {
    this.log(LogLevel.CRITICAL, message, context, error);
  }

  // Advanced logging methods
  logWithContext(level: LogLevel, message: string, context: LogContext, error?: Error): void {
    this.log(level, message, context, error);
  }

  // Performance logging
  startPerformanceTimer(operation: string, context?: LogContext): string {
    const timerId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const metrics: PerformanceMetrics = {
      startTime: performance.now(),
      operation,
      memoryUsage: this.config.enablePerformanceLogging ? process.memoryUsage() : undefined
    };

    this.performanceMetrics.set(timerId, metrics);
    
    if (this.config.enablePerformanceLogging) {
      this.debug(`Performance timer started: ${operation}`, { timerId, ...context });
    }

    return timerId;
  }

  endPerformanceTimer(timerId: string, context?: LogContext): void {
    const metrics = this.performanceMetrics.get(timerId);
    if (!metrics) {
      this.warn(`Performance timer not found: ${timerId}`);
      return;
    }

    metrics.endTime = performance.now();
    metrics.duration = metrics.endTime - metrics.startTime;

    if (this.config.enablePerformanceLogging) {
      const finalMemoryUsage = process.memoryUsage();
      this.info(`Performance timer completed: ${metrics.operation}`, {
        timerId,
        duration: `${metrics.duration.toFixed(2)}ms`,
        memoryDelta: metrics.memoryUsage ? {
          heapUsed: finalMemoryUsage.heapUsed - metrics.memoryUsage.heapUsed,
          heapTotal: finalMemoryUsage.heapTotal - metrics.memoryUsage.heapTotal
        } : undefined,
        ...context
      });
    }

    this.performanceMetrics.delete(timerId);
  }

  // Context management
  setGlobalContext(context: LogContext): void {
    this.globalContext = { ...this.globalContext, ...context };
  }

  clearGlobalContext(): void {
    this.globalContext = {};
  }

  getGlobalContext(): LogContext {
    return { ...this.globalContext };
  }

  // Configuration management
  updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.formatter = createFormatter(this.config);
    this.reinitializeOutputs();
  }

  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  // Log history and management
  async getLogHistory(level?: LogLevel, limit: number = 100): Promise<LogEntry[]> {
    // This would typically query from storage
    // For now, return empty array as placeholder
    return [];
  }

  async clearLogs(): Promise<void> {
    // Clear all outputs
    for (const output of this.outputs) {
      if (output.flush) {
        await output.flush();
      }
    }
  }

  // Shutdown and cleanup
  async shutdown(): Promise<void> {
    this.info('Logger shutting down');
    
    // Process remaining queued logs
    if (this.logQueue.length > 0) {
      await this.processLogQueue();
    }

    // Close all outputs
    for (const output of this.outputs) {
      if (output.close) {
        await output.close();
      }
    }

    this.outputs = [];
  }

  // Core logging implementation
  private log(level: LogLevel, message: string, context?: any, error?: Error): void {
    // Check if log level meets threshold
    if (level < this.config.level) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context: { ...this.globalContext, ...context },
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack || ''
      } : undefined,
      sessionId: this.globalContext.sessionId,
      userId: this.globalContext.userId
    };

    if (this.config.enableAsyncLogging) {
      this.logQueue.push(entry);
      this.processLogQueueAsync();
    } else {
      this.writeLogEntry(entry);
    }
  }

  private async writeLogEntry(entry: LogEntry): Promise<void> {
    const promises = this.outputs
      .filter(output => output !== null)
      .map(output => output.write(entry).catch(error => {
        console.error('Logger output error:', error);
      }));

    await Promise.all(promises);
  }

  private processLogQueueAsync(): void {
    if (this.isProcessingQueue) {
      return;
    }

    // Use setTimeout to avoid blocking the event loop
    setTimeout(() => {
      this.processLogQueue().catch(error => {
        console.error('Error processing log queue:', error);
      });
    }, 0);
  }

  private async processLogQueue(): Promise<void> {
    if (this.isProcessingQueue || this.logQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      const entriesToProcess = [...this.logQueue];
      this.logQueue = [];

      for (const entry of entriesToProcess) {
        await this.writeLogEntry(entry);
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private initializeOutputs(): void {
    this.outputs = this.config.outputs
      .filter(outputConfig => outputConfig.enabled)
      .map(outputConfig => {
        try {
          return createLoggerOutput(outputConfig);
        } catch (error) {
          console.error(`Failed to create logger output: ${outputConfig.type}`, error);
          return null;
        }
      })
      .filter((output): output is ILoggerOutput => output !== null);
  }

  private reinitializeOutputs(): void {
    // Close existing outputs
    this.outputs.forEach(output => {
      if (output.close) {
        output.close().catch(console.error);
      }
    });

    // Initialize new outputs
    this.initializeOutputs();
  }

  private generateSessionId(): void {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.setGlobalContext({ sessionId });
  }
}

// Export singleton instance
export const advancedLogger = AdvancedLogger.getInstance();