// Advanced Error Types and Classifications

export enum ErrorCategory {
  SYSTEM = 'SYSTEM',
  BUSINESS = 'BUSINESS',
  VALIDATION = 'VALIDATION',
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  RESOURCE = 'RESOURCE',
  EXTERNAL = 'EXTERNAL',
  CONFIGURATION = 'CONFIGURATION',
  DATA = 'DATA'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum RecoveryStrategy {
  RETRY = 'RETRY',
  FALLBACK = 'FALLBACK',
  CIRCUIT_BREAKER = 'CIRCUIT_BREAKER',
  GRACEFUL_DEGRADATION = 'GRACEFUL_DEGRADATION',
  FAIL_FAST = 'FAIL_FAST',
  MANUAL_INTERVENTION = 'MANUAL_INTERVENTION'
}

export interface ErrorMetadata {
  category: ErrorCategory;
  severity: ErrorSeverity;
  recoveryStrategy: RecoveryStrategy;
  retryable: boolean;
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
  timeout: number;
  userNotification: boolean;
  teamNotification: boolean;
  logLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  tags: string[];
}

export interface QualitySystemError extends Error {
  code: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  metadata: ErrorMetadata;
  context: Record<string, any>;
  timestamp: Date;
  correlationId: string;
  userId?: string;
  sessionId?: string;
  component: string;
  operation: string;
  originalError?: Error;
  retryCount?: number;
  recoveryAttempts?: number;
}

export class BaseQualityError extends Error implements QualitySystemError {
  public code: string;
  public category: ErrorCategory;
  public severity: ErrorSeverity;
  public metadata: ErrorMetadata;
  public context: Record<string, any>;
  public timestamp: Date;
  public correlationId: string;
  public userId?: string;
  public sessionId?: string;
  public component: string;
  public operation: string;
  public originalError?: Error;
  public retryCount: number = 0;
  public recoveryAttempts: number = 0;

  constructor(
    message: string,
    code: string,
    category: ErrorCategory,
    severity: ErrorSeverity,
    metadata: Partial<ErrorMetadata> = {},
    context: Record<string, any> = {}
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.category = category;
    this.severity = severity;
    this.context = context;
    this.timestamp = new Date();
    this.correlationId = this.generateCorrelationId();
    this.component = context.component || 'unknown';
    this.operation = context.operation || 'unknown';

    // Set default metadata
    this.metadata = {
      category,
      severity,
      recoveryStrategy: RecoveryStrategy.RETRY,
      retryable: true,
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2,
      timeout: 30000,
      userNotification: severity === ErrorSeverity.HIGH || severity === ErrorSeverity.CRITICAL,
      teamNotification: severity === ErrorSeverity.CRITICAL,
      logLevel: this.mapSeverityToLogLevel(severity),
      tags: [],
      ...metadata
    };

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  private generateCorrelationId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private mapSeverityToLogLevel(severity: ErrorSeverity): 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL' {
    switch (severity) {
      case ErrorSeverity.LOW: return 'WARN';
      case ErrorSeverity.MEDIUM: return 'ERROR';
      case ErrorSeverity.HIGH: return 'ERROR';
      case ErrorSeverity.CRITICAL: return 'CRITICAL';
      default: return 'ERROR';
    }
  }

  public toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      category: this.category,
      severity: this.severity,
      metadata: this.metadata,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      correlationId: this.correlationId,
      userId: this.userId,
      sessionId: this.sessionId,
      component: this.component,
      operation: this.operation,
      retryCount: this.retryCount,
      recoveryAttempts: this.recoveryAttempts,
      stack: this.stack
    };
  }
}

// Specific error classes
export class ValidationError extends BaseQualityError {
  constructor(message: string, field?: string, value?: any, context: Record<string, any> = {}) {
    super(
      message,
      'VALIDATION_FAILED',
      ErrorCategory.VALIDATION,
      ErrorSeverity.MEDIUM,
      {
        retryable: false,
        maxRetries: 0,
        userNotification: true,
        teamNotification: false
      },
      { field, value, ...context }
    );
  }
}

export class NetworkError extends BaseQualityError {
  constructor(message: string, url?: string, statusCode?: number, context: Record<string, any> = {}) {
    super(
      message,
      'NETWORK_ERROR',
      ErrorCategory.NETWORK,
      ErrorSeverity.MEDIUM,
      {
        retryable: true,
        maxRetries: 3,
        retryDelay: 2000,
        backoffMultiplier: 2,
        recoveryStrategy: RecoveryStrategy.RETRY
      },
      { url, statusCode, ...context }
    );
  }
}

export class AuthenticationError extends BaseQualityError {
  constructor(message: string, userId?: string, context: Record<string, any> = {}) {
    super(
      message,
      'AUTHENTICATION_FAILED',
      ErrorCategory.AUTHENTICATION,
      ErrorSeverity.HIGH,
      {
        retryable: false,
        maxRetries: 0,
        userNotification: true,
        teamNotification: true,
        recoveryStrategy: RecoveryStrategy.FAIL_FAST
      },
      { userId, ...context }
    );
  }
}

export class BusinessLogicError extends BaseQualityError {
  constructor(message: string, businessRule?: string, context: Record<string, any> = {}) {
    super(
      message,
      'BUSINESS_LOGIC_ERROR',
      ErrorCategory.BUSINESS,
      ErrorSeverity.MEDIUM,
      {
        retryable: false,
        maxRetries: 0,
        userNotification: true,
        teamNotification: false,
        recoveryStrategy: RecoveryStrategy.GRACEFUL_DEGRADATION
      },
      { businessRule, ...context }
    );
  }
}

export class SystemError extends BaseQualityError {
  constructor(message: string, systemComponent?: string, context: Record<string, any> = {}) {
    super(
      message,
      'SYSTEM_ERROR',
      ErrorCategory.SYSTEM,
      ErrorSeverity.CRITICAL,
      {
        retryable: true,
        maxRetries: 2,
        retryDelay: 5000,
        userNotification: true,
        teamNotification: true,
        recoveryStrategy: RecoveryStrategy.CIRCUIT_BREAKER
      },
      { systemComponent, ...context }
    );
  }
}

export class ResourceError extends BaseQualityError {
  constructor(message: string, resource?: string, context: Record<string, any> = {}) {
    super(
      message,
      'RESOURCE_ERROR',
      ErrorCategory.RESOURCE,
      ErrorSeverity.HIGH,
      {
        retryable: true,
        maxRetries: 2,
        retryDelay: 3000,
        recoveryStrategy: RecoveryStrategy.FALLBACK
      },
      { resource, ...context }
    );
  }
}

export class ConfigurationError extends BaseQualityError {
  constructor(message: string, configKey?: string, context: Record<string, any> = {}) {
    super(
      message,
      'CONFIGURATION_ERROR',
      ErrorCategory.CONFIGURATION,
      ErrorSeverity.CRITICAL,
      {
        retryable: false,
        maxRetries: 0,
        userNotification: false,
        teamNotification: true,
        recoveryStrategy: RecoveryStrategy.MANUAL_INTERVENTION
      },
      { configKey, ...context }
    );
  }
}

export class DatabaseError extends BaseQualityError {
  constructor(message: string, query?: string, context: Record<string, any> = {}) {
    super(
      message,
      'DATABASE_ERROR',
      ErrorCategory.DATA,
      ErrorSeverity.HIGH,
      {
        retryable: true,
        maxRetries: 2,
        retryDelay: 2000,
        backoffMultiplier: 2,
        userNotification: false,
        teamNotification: true,
        recoveryStrategy: RecoveryStrategy.RETRY
      },
      { query, ...context }
    );
  }
}