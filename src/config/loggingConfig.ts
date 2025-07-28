/**
 * Logging Configuration
 * Centralized configuration for the LoggingService
 */

import { LogLevel, LoggingConfig } from '../../core/LoggingService';

// Development logging configuration
export const DEVELOPMENT_LOGGING_CONFIG: LoggingConfig = {
  level: LogLevel.DEBUG,
  enableConsole: true,
  enableStorage: true,
  maxStorageEntries: 1000,
  includeStackTrace: true,
  formatOutput: true,
  contextFields: ['component', 'method', 'timestamp', 'userId']
};

// Production logging configuration
export const PRODUCTION_LOGGING_CONFIG: LoggingConfig = {
  level: LogLevel.INFO,
  enableConsole: true,
  enableStorage: true,
  maxStorageEntries: 500,
  includeStackTrace: false,
  formatOutput: true,
  contextFields: ['component', 'method', 'timestamp']
};

// Testing logging configuration
export const TESTING_LOGGING_CONFIG: LoggingConfig = {
  level: LogLevel.WARN,
  enableConsole: false,
  enableStorage: true,
  maxStorageEntries: 100,
  includeStackTrace: true,
  formatOutput: false,
  contextFields: ['component', 'method']
};

// Get configuration based on environment
export function getLoggingConfig(): LoggingConfig {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return PRODUCTION_LOGGING_CONFIG;
    case 'test':
      return TESTING_LOGGING_CONFIG;
    case 'development':
    default:
      return DEVELOPMENT_LOGGING_CONFIG;
  }
}

// Component-specific logging contexts
export const COMPONENT_CONTEXTS = {
  DEVICE_MANAGER: { component: 'DeviceManager' },
  ADAPTATION_ENGINE: { component: 'AdaptationEngine' },
  PUZZLE_SERVICE: { component: 'PuzzleAdaptationService' },
  CANVAS_MANAGER: { component: 'CanvasManager' },
  EVENT_MANAGER: { component: 'EventManager' },
  USE_CANVAS: { component: 'useCanvas' },
  USE_CANVAS_SIZE: { component: 'useCanvasSize' },
  USE_CANVAS_REFS: { component: 'useCanvasRefs' },
  USE_CANVAS_EVENTS: { component: 'useCanvasEvents' }
} as const;

// Common logging patterns
export const LOG_PATTERNS = {
  INITIALIZATION: 'Initialization',
  STATE_CHANGE: 'State Change',
  EVENT_HANDLING: 'Event Handling',
  ERROR_RECOVERY: 'Error Recovery',
  PERFORMANCE: 'Performance',
  USER_ACTION: 'User Action',
  SYSTEM_EVENT: 'System Event'
} as const;