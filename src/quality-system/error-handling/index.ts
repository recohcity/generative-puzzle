// Error Handling System Main Export

// Core error handling components
export { AdvancedErrorHandlingService } from './AdvancedErrorHandlingService';
export { RecoveryManager } from './RecoveryManager';
export { NotificationManager } from './NotificationManager';

// Error types and classes
export {
  ErrorCategory,
  ErrorSeverity,
  RecoveryStrategy,
  QualitySystemError,
  BaseQualityError,
  ValidationError,
  NetworkError,
  AuthenticationError,
  BusinessLogicError,
  SystemError,
  ResourceError,
  ConfigurationError
} from './ErrorTypes';

// Interfaces and types
export type {
  ErrorMetadata,
  RecoveryResult,
  CircuitBreakerState,
  FallbackFunction,
  NotificationTemplate,
  UserNotification,
  TeamNotification,
  ErrorStatistics,
  ErrorPattern
} from './ErrorTypes';

export type { RecoveryResult, CircuitBreakerState, FallbackFunction } from './RecoveryManager';
export type { NotificationTemplate, UserNotification, TeamNotification } from './NotificationManager';
export type { ErrorStatistics, ErrorPattern } from './AdvancedErrorHandlingService';

// Convenience exports
export const createValidationError = (message: string, field?: string, value?: any) => {
  return new ValidationError(message, field, value);
};

export const createNetworkError = (message: string, url?: string, statusCode?: number) => {
  return new NetworkError(message, url, statusCode);
};

export const createBusinessError = (message: string, rule?: string) => {
  return new BusinessLogicError(message, rule);
};

export const createSystemError = (message: string, component?: string) => {
  return new SystemError(message, component);
};

export const createAuthError = (message: string, userId?: string) => {
  return new AuthenticationError(message, userId);
};

export const createResourceError = (message: string, resource?: string) => {
  return new ResourceError(message, resource);
};

export const createConfigError = (message: string, configKey?: string) => {
  return new ConfigurationError(message, configKey);
};