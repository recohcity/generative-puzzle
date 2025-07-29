// Advanced Log Formatting

import { LogEntry, LogLevel } from '../types';
import { LoggerConfig } from './LoggerConfig';

export interface ILoggerFormatter {
  format(entry: LogEntry): string;
}

export class JsonFormatter implements ILoggerFormatter {
  private config: LoggerConfig;

  constructor(config: LoggerConfig) {
    this.config = config;
  }

  format(entry: LogEntry): string {
    const formatted: Record<string, any> = {
      timestamp: entry.timestamp.toISOString(),
      level: LogLevel[entry.level],
      message: entry.message
    };

    // Add context fields if present
    if (entry.context) {
      const sanitizedContext = this.sanitizeContext(entry.context);
      formatted.context = sanitizedContext;
    }

    // Add error information if present
    if (entry.error) {
      formatted.error = {
        name: entry.error.name,
        message: entry.error.message,
        stack: this.config.includeStackTrace ? entry.error.stack : undefined
      };
    }

    // Add configured context fields
    for (const field of this.config.contextFields) {
      if (entry[field as keyof LogEntry]) {
        formatted[field] = entry[field as keyof LogEntry];
      }
    }

    return JSON.stringify(formatted);
  }

  private sanitizeContext(context: Record<string, any>): Record<string, any> {
    const sanitized = { ...context };
    
    for (const sensitiveField of this.config.sensitiveFields) {
      if (sensitiveField in sanitized) {
        sanitized[sensitiveField] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}

export class TextFormatter implements ILoggerFormatter {
  private config: LoggerConfig;

  constructor(config: LoggerConfig) {
    this.config = config;
  }

  format(entry: LogEntry): string {
    let formatted = '';

    // Add timestamp
    if (this.config.includeTimestamp) {
      formatted += `[${entry.timestamp.toISOString()}] `;
    }

    // Add level
    formatted += `[${LogLevel[entry.level]}] `;

    // Add message
    formatted += entry.message;

    // Add context
    if (entry.context) {
      const sanitizedContext = this.sanitizeContext(entry.context);
      formatted += ` ${JSON.stringify(sanitizedContext)}`;
    }

    // Add error information
    if (entry.error) {
      formatted += `\nError: ${entry.error.name}: ${entry.error.message}`;
      if (this.config.includeStackTrace && entry.error.stack) {
        formatted += `\nStack: ${entry.error.stack}`;
      }
    }

    return formatted;
  }

  private sanitizeContext(context: Record<string, any>): Record<string, any> {
    const sanitized = { ...context };
    
    for (const sensitiveField of this.config.sensitiveFields) {
      if (sensitiveField in sanitized) {
        sanitized[sensitiveField] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}

export class StructuredFormatter implements ILoggerFormatter {
  private config: LoggerConfig;

  constructor(config: LoggerConfig) {
    this.config = config;
  }

  format(entry: LogEntry): string {
    const parts: string[] = [];

    // Timestamp
    if (this.config.includeTimestamp) {
      parts.push(`timestamp=${entry.timestamp.toISOString()}`);
    }

    // Level
    parts.push(`level=${LogLevel[entry.level]}`);

    // Message
    parts.push(`message="${entry.message}"`);

    // Context fields
    if (entry.context) {
      const sanitizedContext = this.sanitizeContext(entry.context);
      for (const [key, value] of Object.entries(sanitizedContext)) {
        if (typeof value === 'string') {
          parts.push(`${key}="${value}"`);
        } else {
          parts.push(`${key}=${JSON.stringify(value)}`);
        }
      }
    }

    // Configured context fields
    for (const field of this.config.contextFields) {
      const value = entry[field as keyof LogEntry];
      if (value !== undefined) {
        if (typeof value === 'string') {
          parts.push(`${field}="${value}"`);
        } else {
          parts.push(`${field}=${JSON.stringify(value)}`);
        }
      }
    }

    // Error information
    if (entry.error) {
      parts.push(`error.name="${entry.error.name}"`);
      parts.push(`error.message="${entry.error.message}"`);
      if (this.config.includeStackTrace && entry.error.stack) {
        parts.push(`error.stack="${entry.error.stack.replace(/\n/g, '\\n')}"`);
      }
    }

    return parts.join(' ');
  }

  private sanitizeContext(context: Record<string, any>): Record<string, any> {
    const sanitized = { ...context };
    
    for (const sensitiveField of this.config.sensitiveFields) {
      if (sensitiveField in sanitized) {
        sanitized[sensitiveField] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}

export function createFormatter(config: LoggerConfig): ILoggerFormatter {
  switch (config.format) {
    case 'json':
      return new JsonFormatter(config);
    case 'text':
      return new TextFormatter(config);
    case 'structured':
      return new StructuredFormatter(config);
    default:
      return new TextFormatter(config);
  }
}