// Logger Service Implementation (Legacy Wrapper)

import { ILogger, IDataStorageService } from '../interfaces';
import { LogLevel, LogEntry } from '../types';
import { AdvancedLogger } from '../logging/AdvancedLogger';
import { getLoggerConfig } from '../logging/LoggerConfig';

export class Logger implements ILogger {
  private storage: IDataStorageService;
  private advancedLogger: AdvancedLogger;

  constructor(storage: IDataStorageService) {
    this.storage = storage;
    this.advancedLogger = AdvancedLogger.getInstance(getLoggerConfig());
    
    // Set up storage integration
    this.setupStorageIntegration();
  }

  debug(message: string, context?: any): void {
    this.advancedLogger.debug(message, context);
  }

  info(message: string, context?: any): void {
    this.advancedLogger.info(message, context);
  }

  warn(message: string, context?: any): void {
    this.advancedLogger.warn(message, context);
  }

  error(message: string, error?: Error, context?: any): void {
    this.advancedLogger.error(message, error, context);
  }

  critical(message: string, error?: Error, context?: any): void {
    this.advancedLogger.critical(message, error, context);
  }

  async getLogHistory(level?: LogLevel, limit: number = 100): Promise<LogEntry[]> {
    // Try to get from advanced logger first, fallback to storage
    try {
      const entries = await this.advancedLogger.getLogHistory(level, limit);
      if (entries.length > 0) {
        return entries;
      }
    } catch (error) {
      this.advancedLogger.warn('Failed to get log history from advanced logger', { error });
    }

    // Fallback to storage service
    const filter: Partial<LogEntry> = {};
    if (level !== undefined) {
      filter.level = level;
    }

    return await this.storage.loadLogEntries(filter, limit);
  }

  async clearLogs(): Promise<void> {
    await this.advancedLogger.clearLogs();
  }

  // Additional methods for advanced functionality
  setContext(context: Record<string, any>): void {
    this.advancedLogger.setGlobalContext(context);
  }

  startPerformanceTimer(operation: string): string {
    return this.advancedLogger.startPerformanceTimer(operation);
  }

  endPerformanceTimer(timerId: string): void {
    this.advancedLogger.endPerformanceTimer(timerId);
  }

  async shutdown(): Promise<void> {
    await this.advancedLogger.shutdown();
  }

  private setupStorageIntegration(): void {
    // This would set up the advanced logger to also save to storage
    // For now, we'll keep the existing storage integration
    this.advancedLogger.setGlobalContext({
      component: 'QualitySystem',
      storageEnabled: true
    });
  }
}