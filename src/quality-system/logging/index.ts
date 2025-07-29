// Logging System Main Export

// Core logging components
export { AdvancedLogger, advancedLogger } from './AdvancedLogger';
export { LogManager, logManager } from './LogManager';

// Configuration
export { 
  LoggerConfig, 
  LoggerOutput,
  getLoggerConfig,
  defaultLoggerConfig,
  developmentLoggerConfig,
  productionLoggerConfig,
  testLoggerConfig
} from './LoggerConfig';

// Output handlers
export {
  ILoggerOutput,
  ConsoleOutput,
  FileOutput,
  RemoteOutput,
  DatabaseOutput,
  createLoggerOutput
} from './LoggerOutputs';

// Formatters
export {
  ILoggerFormatter,
  JsonFormatter,
  TextFormatter,
  StructuredFormatter,
  createFormatter
} from './LoggerFormatter';

// Types
export type { LogContext, PerformanceMetrics } from './AdvancedLogger';
export type { LogManagerConfig } from './LogManager';

// Convenience exports for common use cases
export const logger = advancedLogger;
export const log = logManager;