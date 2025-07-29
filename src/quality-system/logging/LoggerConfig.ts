// Advanced Logger Configuration

import { LogLevel } from '../types';

export interface LoggerOutput {
  type: 'console' | 'file' | 'database' | 'remote';
  enabled: boolean;
  config?: Record<string, any>;
}

export interface LoggerConfig {
  level: LogLevel;
  outputs: LoggerOutput[];
  format: 'json' | 'text' | 'structured';
  includeTimestamp: boolean;
  includeStackTrace: boolean;
  maxLogSize: number;
  maxLogFiles: number;
  logRotation: boolean;
  contextFields: string[];
  sensitiveFields: string[];
  enablePerformanceLogging: boolean;
  enableAsyncLogging: boolean;
}

export const defaultLoggerConfig: LoggerConfig = {
  level: LogLevel.INFO,
  outputs: [
    {
      type: 'console',
      enabled: true,
      config: {
        colorize: true,
        prettyPrint: true
      }
    }
  ],
  format: 'structured',
  includeTimestamp: true,
  includeStackTrace: true,
  maxLogSize: 10 * 1024 * 1024, // 10MB
  maxLogFiles: 5,
  logRotation: true,
  contextFields: ['userId', 'sessionId', 'requestId', 'component', 'action'],
  sensitiveFields: ['password', 'token', 'apiKey', 'secret'],
  enablePerformanceLogging: false,
  enableAsyncLogging: true
};

export const developmentLoggerConfig: LoggerConfig = {
  ...defaultLoggerConfig,
  level: LogLevel.DEBUG,
  outputs: [
    {
      type: 'console',
      enabled: true,
      config: {
        colorize: true,
        prettyPrint: true,
        showLevel: true,
        showTimestamp: true
      }
    },
    {
      type: 'file',
      enabled: true,
      config: {
        filename: 'src/quality-system/logs/development.log',
        maxSize: 5 * 1024 * 1024, // 5MB
        maxFiles: 3
      }
    }
  ],
  enablePerformanceLogging: true
};

export const productionLoggerConfig: LoggerConfig = {
  ...defaultLoggerConfig,
  level: LogLevel.WARN,
  outputs: [
    {
      type: 'file',
      enabled: true,
      config: {
        filename: 'src/quality-system/logs/production.log',
        maxSize: 50 * 1024 * 1024, // 50MB
        maxFiles: 10
      }
    },
    {
      type: 'remote',
      enabled: true,
      config: {
        endpoint: process.env.LOG_ENDPOINT || 'https://logs.example.com/api/logs',
        apiKey: process.env.LOG_API_KEY,
        batchSize: 100,
        flushInterval: 5000
      }
    }
  ],
  format: 'json',
  enableAsyncLogging: true,
  enablePerformanceLogging: false
};

export const testLoggerConfig: LoggerConfig = {
  ...defaultLoggerConfig,
  level: LogLevel.ERROR,
  outputs: [
    {
      type: 'console',
      enabled: false
    }
  ],
  enableAsyncLogging: false
};

export function getLoggerConfig(environment?: string): LoggerConfig {
  switch (environment || process.env.NODE_ENV) {
    case 'development':
      return developmentLoggerConfig;
    case 'production':
      return productionLoggerConfig;
    case 'test':
      return testLoggerConfig;
    default:
      return defaultLoggerConfig;
  }
}