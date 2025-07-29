// Quality System Public API

// Main system export
export { QualitySystem, qualitySystem } from './QualitySystem';

// Core types
export type {
  Task,
  QualityScore,
  QualityTrend,
  QualityCheck,
  QualityCheckResult,
  QualityIssue,
  ValidationResult,
  AcceptanceCriteria,
  LogEntry,
  ErrorContext,
  ProgressSnapshot,
  Milestone,
  ProgressReport,
  Bottleneck,
  TaskDependencyGraph
} from './types';

// Enums
export { LogLevel, ErrorType } from './types';

// Service interfaces (for advanced usage)
export type {
  ITaskManagementService,
  IQualityDetectionEngine,
  ILogger,
  IErrorHandlingService,
  IProgressTrackingService,
  INotificationService,
  IReportGeneratorService,
  IDataStorageService,
  IConfigurationService
} from './interfaces';

// Service factory (for dependency injection)
export { ServiceFactory } from './core/ServiceFactory';

// Individual services (for advanced usage)
export { TaskManagementService } from './services/TaskManagementService';
export { QualityDetectionEngine } from './services/QualityDetectionEngine';
export { Logger } from './services/Logger';
export { ErrorHandlingService } from './services/ErrorHandlingService';