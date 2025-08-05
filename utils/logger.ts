/**
 * Logger Utilities
 * Convenient wrapper functions for the LoggingService
 * Provides component-specific loggers and common logging patterns
 */

import { LoggingService, LogContext } from '../core/LoggingService';
import { getLoggingConfig, COMPONENT_CONTEXTS, LOG_PATTERNS } from '../src/config/loggingConfig';

// Initialize logging service with environment-specific configuration
const loggingService = LoggingService.getInstance();
loggingService.configure(getLoggingConfig());

// Export the main logging service instance
export { loggingService as logger };

// Component-specific loggers
export const deviceLogger = loggingService.createLogger(COMPONENT_CONTEXTS.DEVICE_MANAGER);
export const adaptationLogger = loggingService.createLogger(COMPONENT_CONTEXTS.ADAPTATION_ENGINE);
export const puzzleLogger = loggingService.createLogger(COMPONENT_CONTEXTS.PUZZLE_SERVICE);
export const canvasLogger = loggingService.createLogger(COMPONENT_CONTEXTS.CANVAS_MANAGER);
export const eventLogger = loggingService.createLogger(COMPONENT_CONTEXTS.EVENT_MANAGER);
export const useCanvasLogger = loggingService.createLogger(COMPONENT_CONTEXTS.USE_CANVAS);
export const useCanvasSizeLogger = loggingService.createLogger(COMPONENT_CONTEXTS.USE_CANVAS_SIZE);
export const useCanvasRefsLogger = loggingService.createLogger(COMPONENT_CONTEXTS.USE_CANVAS_REFS);
export const useCanvasEventsLogger = loggingService.createLogger(COMPONENT_CONTEXTS.USE_CANVAS_EVENTS);

// Convenience functions for common logging patterns
export const loggers = {
  // Initialization logging
  logInitialization: (component: string, message: string, context?: LogContext) => {
    loggingService.info(message, {
      component,
      pattern: LOG_PATTERNS.INITIALIZATION,
      ...context
    });
  },

  // State change logging
  logStateChange: (component: string, from: any, to: any, context?: LogContext) => {
    loggingService.info(`State changed from ${JSON.stringify(from)} to ${JSON.stringify(to)}`, {
      component,
      pattern: LOG_PATTERNS.STATE_CHANGE,
      fromState: from,
      toState: to,
      ...context
    });
  },

  // Event handling logging
  logEventHandling: (component: string, eventType: string, details?: any, context?: LogContext) => {
    loggingService.debug(`Handling event: ${eventType}`, {
      component,
      pattern: LOG_PATTERNS.EVENT_HANDLING,
      eventType,
      eventDetails: details,
      ...context
    });
  },

  // Error recovery logging
  logErrorRecovery: (component: string, error: Error, recoveryAction: string, context?: LogContext) => {
    loggingService.warn(`Error recovery: ${recoveryAction}`, {
      component,
      pattern: LOG_PATTERNS.ERROR_RECOVERY,
      recoveryAction,
      ...context
    });
  },

  // Performance logging
  logPerformance: (component: string, operation: string, duration: number, context?: LogContext) => {
    const level = duration > 100 ? 'warn' : 'info'; // Warn if operation takes more than 100ms
    loggingService[level](`Performance: ${operation} took ${duration.toFixed(2)}ms`, {
      component,
      pattern: LOG_PATTERNS.PERFORMANCE,
      operation,
      duration: `${duration.toFixed(2)}ms`,
      ...context
    });
  },

  // User action logging
  logUserAction: (action: string, details?: any, context?: LogContext) => {
    loggingService.info(`User action: ${action}`, {
      pattern: LOG_PATTERNS.USER_ACTION,
      action,
      actionDetails: details,
      ...context
    });
  },

  // System event logging
  logSystemEvent: (event: string, details?: any, context?: LogContext) => {
    loggingService.info(`System event: ${event}`, {
      pattern: LOG_PATTERNS.SYSTEM_EVENT,
      event,
      eventDetails: details,
      ...context
    });
  }
};

// Performance timing utilities
export const performanceLogger = {
  // Time a function execution
  timeFunction: <T>(component: string, functionName: string, fn: () => T, context?: LogContext): T => {
    const endTimer = loggingService.time(`${component}.${functionName}`, { component, method: functionName, ...context });
    
    try {
      const result = fn();
      endTimer();
      return result;
    } catch (error) {
      endTimer();
      loggingService.error(`Function ${functionName} failed`, error as Error, { component, method: functionName, ...context });
      throw error;
    }
  },

  // Time an async function execution
  timeAsyncFunction: async <T>(component: string, functionName: string, fn: () => Promise<T>, context?: LogContext): Promise<T> => {
    const endTimer = loggingService.time(`${component}.${functionName}`, { component, method: functionName, ...context });
    
    try {
      const result = await fn();
      endTimer();
      return result;
    } catch (error) {
      endTimer();
      loggingService.error(`Async function ${functionName} failed`, error as Error, { component, method: functionName, ...context });
      throw error;
    }
  }
};

// Debug utilities for development
export const debugLogger = {
  // Log object state
  logState: (component: string, stateName: string, state: any, context?: LogContext) => {
    if (process.env.NODE_ENV === 'development') {
      loggingService.debug(`State snapshot: ${stateName}`, {
        component,
        stateName,
        stateValue: state,
        ...context
      });
    }
  },

  // Log function entry and exit
  traceFunction: (component: string, functionName: string, args?: any[], context?: LogContext) => {
    if (process.env.NODE_ENV === 'development') {
      loggingService.debug(`Function entry: ${functionName}`, {
        component,
        method: functionName,
        arguments: args,
        ...context
      });

      return () => {
        loggingService.debug(`Function exit: ${functionName}`, {
          component,
          method: functionName,
          ...context
        });
      };
    }
    
    return () => {}; // No-op in production
  }
};

// Error handling utilities
export const errorLogger = {
  // Log and handle errors with context
  handleError: (component: string, error: Error, context?: LogContext, recoveryAction?: () => void) => {
    loggingService.error(`Error in ${component}`, error, { component, ...context });
    
    if (recoveryAction) {
      try {
        recoveryAction();
        loggingService.info(`Recovery action executed successfully`, { component, ...context });
      } catch (recoveryError) {
        loggingService.error(`Recovery action failed`, recoveryError as Error, { component, ...context });
      }
    }
  },

  // Log validation errors
  logValidationError: (component: string, field: string, value: any, expectedType: string, context?: LogContext) => {
    loggingService.warn(`Validation error: ${field} expected ${expectedType}, got ${typeof value}`, {
      component,
      field,
      value,
      expectedType,
      actualType: typeof value,
      ...context
    });
  }
};

// Export logging statistics and management
export const loggingStats = {
  getStats: () => loggingService.getStats(),
  getLogs: (level?: any, limit?: number) => loggingService.getLogs(level, limit),
  clearLogs: () => loggingService.clearLogs(),
  exportLogs: (format: 'json' | 'csv' = 'json') => loggingService.exportLogs(format)
};