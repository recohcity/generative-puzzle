// Logger Output Handlers

import * as fs from 'fs';
import * as path from 'path';
import { LogEntry, LogLevel } from '../types';
import { LoggerOutput } from './LoggerConfig';

export interface ILoggerOutput {
  write(entry: LogEntry): Promise<void>;
  flush?(): Promise<void>;
  close?(): Promise<void>;
}

export class ConsoleOutput implements ILoggerOutput {
  private config: Record<string, any>;

  constructor(config: Record<string, any> = {}) {
    this.config = config;
  }

  async write(entry: LogEntry): Promise<void> {
    const formatted = this.formatEntry(entry);
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(formatted);
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(formatted);
        break;
    }
  }

  private formatEntry(entry: LogEntry): string {
    const { colorize, prettyPrint, showLevel, showTimestamp } = this.config;
    
    let formatted = '';
    
    if (showTimestamp !== false) {
      const timestamp = entry.timestamp.toISOString();
      formatted += colorize ? `\x1b[90m[${timestamp}]\x1b[0m ` : `[${timestamp}] `;
    }
    
    if (showLevel !== false) {
      const levelName = LogLevel[entry.level];
      const colorCode = this.getLevelColor(entry.level);
      formatted += colorize ? `${colorCode}[${levelName}]\x1b[0m ` : `[${levelName}] `;
    }
    
    formatted += entry.message;
    
    if (entry.context && prettyPrint) {
      formatted += ' ' + JSON.stringify(entry.context, null, 2);
    } else if (entry.context) {
      formatted += ' ' + JSON.stringify(entry.context);
    }
    
    if (entry.error) {
      formatted += `\nError: ${entry.error.name}: ${entry.error.message}`;
      if (entry.error.stack) {
        formatted += `\nStack: ${entry.error.stack}`;
      }
    }
    
    return formatted;
  }

  private getLevelColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return '\x1b[36m'; // Cyan
      case LogLevel.INFO: return '\x1b[32m';  // Green
      case LogLevel.WARN: return '\x1b[33m';  // Yellow
      case LogLevel.ERROR: return '\x1b[31m'; // Red
      case LogLevel.CRITICAL: return '\x1b[35m'; // Magenta
      default: return '\x1b[0m'; // Reset
    }
  }
}

export class FileOutput implements ILoggerOutput {
  private config: Record<string, any>;
  private writeStream?: fs.WriteStream;
  private currentLogSize: number = 0;
  private logFileIndex: number = 0;

  constructor(config: Record<string, any>) {
    this.config = config;
    this.initializeLogFile();
  }

  async write(entry: LogEntry): Promise<void> {
    if (!this.writeStream) {
      this.initializeLogFile();
    }

    const formatted = this.formatEntry(entry);
    const logLine = formatted + '\n';
    
    // Check if log rotation is needed
    if (this.shouldRotateLog(logLine.length)) {
      await this.rotateLog();
    }
    
    return new Promise((resolve, reject) => {
      this.writeStream!.write(logLine, (error) => {
        if (error) {
          reject(error);
        } else {
          this.currentLogSize += logLine.length;
          resolve();
        }
      });
    });
  }

  async flush(): Promise<void> {
    if (this.writeStream) {
      return new Promise((resolve) => {
        this.writeStream!.end(resolve);
      });
    }
  }

  async close(): Promise<void> {
    if (this.writeStream) {
      await this.flush();
      this.writeStream = undefined;
    }
  }

  private initializeLogFile(): void {
    const logDir = path.dirname(this.config.filename);
    
    // Ensure log directory exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Get current log file stats
    const logFile = this.getCurrentLogFile();
    if (fs.existsSync(logFile)) {
      const stats = fs.statSync(logFile);
      this.currentLogSize = stats.size;
    }

    this.writeStream = fs.createWriteStream(logFile, { flags: 'a' });
  }

  private formatEntry(entry: LogEntry): string {
    return JSON.stringify({
      timestamp: entry.timestamp.toISOString(),
      level: LogLevel[entry.level],
      message: entry.message,
      context: entry.context,
      error: entry.error,
      sessionId: entry.sessionId,
      userId: entry.userId
    });
  }

  private shouldRotateLog(newLogSize: number): boolean {
    const maxSize = this.config.maxSize || 10 * 1024 * 1024; // 10MB default
    return this.currentLogSize + newLogSize > maxSize;
  }

  private async rotateLog(): Promise<void> {
    if (this.writeStream) {
      await this.close();
    }

    const maxFiles = this.config.maxFiles || 5;
    
    // Rotate existing log files
    for (let i = maxFiles - 1; i > 0; i--) {
      const oldFile = this.getLogFile(i - 1);
      const newFile = this.getLogFile(i);
      
      if (fs.existsSync(oldFile)) {
        if (fs.existsSync(newFile)) {
          fs.unlinkSync(newFile);
        }
        fs.renameSync(oldFile, newFile);
      }
    }

    this.currentLogSize = 0;
    this.initializeLogFile();
  }

  private getCurrentLogFile(): string {
    return this.getLogFile(0);
  }

  private getLogFile(index: number): string {
    const { filename } = this.config;
    const ext = path.extname(filename);
    const base = path.basename(filename, ext);
    const dir = path.dirname(filename);
    
    if (index === 0) {
      return filename;
    }
    
    return path.join(dir, `${base}.${index}${ext}`);
  }
}

export class RemoteOutput implements ILoggerOutput {
  private config: Record<string, any>;
  private logBuffer: LogEntry[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor(config: Record<string, any>) {
    this.config = config;
    this.startFlushTimer();
  }

  async write(entry: LogEntry): Promise<void> {
    this.logBuffer.push(entry);
    
    const batchSize = this.config.batchSize || 100;
    if (this.logBuffer.length >= batchSize) {
      await this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.logBuffer.length === 0) {
      return;
    }

    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          logs: logsToSend.map(entry => ({
            timestamp: entry.timestamp.toISOString(),
            level: LogLevel[entry.level],
            message: entry.message,
            context: entry.context,
            error: entry.error,
            sessionId: entry.sessionId,
            userId: entry.userId
          }))
        })
      });

      if (!response.ok) {
        console.error('Failed to send logs to remote endpoint:', response.statusText);
        // Re-add logs to buffer for retry
        this.logBuffer.unshift(...logsToSend);
      }
    } catch (error) {
      console.error('Error sending logs to remote endpoint:', error);
      // Re-add logs to buffer for retry
      this.logBuffer.unshift(...logsToSend);
    }
  }

  async close(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.flush();
  }

  private startFlushTimer(): void {
    const flushInterval = this.config.flushInterval || 5000; // 5 seconds default
    this.flushTimer = setInterval(() => {
      this.flush().catch(console.error);
    }, flushInterval);
  }
}

export class DatabaseOutput implements ILoggerOutput {
  private config: Record<string, any>;

  constructor(config: Record<string, any>) {
    this.config = config;
  }

  async write(entry: LogEntry): Promise<void> {
    // This would integrate with the actual database service
    // For now, we'll use a mock implementation
    console.log('Database log entry:', {
      timestamp: entry.timestamp,
      level: LogLevel[entry.level],
      message: entry.message,
      context: entry.context
    });
  }
}

export function createLoggerOutput(outputConfig: LoggerOutput): ILoggerOutput {
  switch (outputConfig.type) {
    case 'console':
      return new ConsoleOutput(outputConfig.config);
    case 'file':
      return new FileOutput(outputConfig.config || {});
    case 'remote':
      return new RemoteOutput(outputConfig.config || {});
    case 'database':
      return new DatabaseOutput(outputConfig.config || {});
    default:
      throw new Error(`Unknown logger output type: ${outputConfig.type}`);
  }
}