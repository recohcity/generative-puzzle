// Advanced Error Handling Service Implementation

import {
  IErrorHandlingService,
  ILogger,
  INotificationService
} from '../interfaces';
import {
  QualitySystemError,
  BaseQualityError,
  ErrorCategory,
  ErrorSeverity,
  ValidationError,
  NetworkError,
  AuthenticationError,
  BusinessLogicError,
  SystemError,
  ResourceError,
  ConfigurationError
} from './ErrorTypes';
import { RecoveryManager, RecoveryResult } from './RecoveryManager';
import { NotificationManager } from './NotificationManager';
import { ErrorContext } from '../types';

export interface ErrorStatistics {
  totalErrors: number;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  errorsByComponent: Record<string, number>;
  recoverySuccessRate: number;
  averageRecoveryTime: number;
  criticalErrorsLast24h: number;
  topErrorMessages: Array<{ message: string; count: number }>;
}

export interface ErrorPattern {
  pattern: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  frequency: number;
  lastOccurrence: Date;
  suggestedFix: string;
}

export class AdvancedErrorHandlingService implements IErrorHandlingService {
  private logger: ILogger;
  private notificationService: INotificationService;
  private recoveryManager: RecoveryManager;
  private notificationManager: NotificationManager;
  
  private errorHistory: QualitySystemError[] = [];
  private errorPatterns: Map<string, ErrorPattern> = new Map();
  private errorStats: Map<string, number> = new Map();
  private recoveryStats: { attempts: number; successes: number; totalTime: number } = {
    attempts: 0,
    successes: 0,
    totalTime: 0
  };

  constructor(logger: ILogger, notificationService: INotificationService) {
    this.logger = logger;
    this.notificationService = notificationService;
    this.recoveryManager = new RecoveryManager(logger);
    this.notificationManager = new NotificationManager(logger, notificationService);
  }

  handleError(error: Error, context: ErrorContext): void {
    const qualityError = this.classifyAndEnhanceError(error, context);
    
    this.logger.error('Handling error', qualityError, {
      correlationId: qualityError.correlationId,
      category: qualityError.category,
      severity: qualityError.severity,
      component: qualityError.component
    });

    // Record error for statistics and pattern analysis
    this.recordError(qualityError);

    // Attempt recovery if applicable
    this.attemptErrorRecovery(qualityError);

    // Send notifications
    this.sendNotifications(qualityError);

    // Update error patterns
    this.updateErrorPatterns(qualityError);
  }

  classifyError(error: Error): string {
    // Enhanced error classification with pattern matching
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    // Network-related errors
    if (message.includes('network') || message.includes('fetch') || 
        message.includes('timeout') || message.includes('connection')) {
      return ErrorCategory.NETWORK;
    }

    // Validation errors
    if (message.includes('validation') || message.includes('invalid') ||
        message.includes('required') || message.includes('format')) {
      return ErrorCategory.VALIDATION;
    }

    // Authentication/Authorization
    if (message.includes('unauthorized') || message.includes('forbidden') ||
        message.includes('authentication') || message.includes('permission')) {
      return message.includes('authentication') ? 
        ErrorCategory.AUTHENTICATION : ErrorCategory.AUTHORIZATION;
    }

    // Database/Storage errors
    if (message.includes('database') || message.includes('storage') ||
        message.includes('connection') || message.includes('query')) {
      return ErrorCategory.DATA;
    }

    // Resource errors
    if (message.includes('memory') || message.includes('disk') ||
        message.includes('cpu') || message.includes('resource')) {
      return ErrorCategory.RESOURCE;
    }

    // Configuration errors
    if (message.includes('config') || message.includes('environment') ||
        message.includes('missing') || message.includes('undefined')) {
      return ErrorCategory.CONFIGURATION;
    }

    // Business logic errors
    if (message.includes('business') || message.includes('rule') ||
        message.includes('constraint') || message.includes('logic')) {
      return ErrorCategory.BUSINESS;
    }

    // External service errors
    if (message.includes('api') || message.includes('service') ||
        message.includes('external') || message.includes('third-party')) {
      return ErrorCategory.EXTERNAL;
    }

    // Default to system error
    return ErrorCategory.SYSTEM;
  }

  attemptRecovery(error: Error, errorType: string): boolean {
    if (!(error instanceof BaseQualityError)) {
      return false;
    }

    const qualityError = error as QualitySystemError;
    
    // Simple synchronous recovery attempt
    try {
      if (qualityError.metadata.recoveryStrategy === 'RETRY' && 
          qualityError.retryCount < qualityError.metadata.maxRetries) {
        qualityError.retryCount++;
        this.logger.info('Attempting simple recovery', {
          correlationId: qualityError.correlationId,
          retryCount: qualityError.retryCount
        });
        return true;
      }
    } catch (recoveryError) {
      this.logger.error('Simple recovery failed', recoveryError as Error, {
        correlationId: qualityError.correlationId
      });
    }

    return false;
  }

  notifyUser(error: Error, severity: string): void {
    if (error instanceof BaseQualityError) {
      this.notificationManager.notifyUser(error as QualitySystemError);
    } else {
      // Convert regular error to quality error for notification
      const qualityError = this.createQualityErrorFromRegular(error, severity);
      this.notificationManager.notifyUser(qualityError);
    }
  }

  reportToTeam(error: Error, context: ErrorContext): void {
    if (error instanceof BaseQualityError) {
      this.notificationManager.notifyTeam(error as QualitySystemError);
    } else {
      // Convert regular error to quality error for team notification
      const qualityError = this.classifyAndEnhanceError(error, context);
      this.notificationManager.notifyTeam(qualityError);
    }
  }

  async getErrorStatistics(): Promise<Record<string, number>> {
    const stats = Object.fromEntries(this.errorStats);
    
    // Add computed statistics
    const detailedStats = this.generateDetailedStatistics();
    
    return {
      ...stats,
      totalErrors: detailedStats.totalErrors,
      recoverySuccessRate: Math.round(detailedStats.recoverySuccessRate * 100),
      averageRecoveryTime: Math.round(detailedStats.averageRecoveryTime),
      criticalErrorsLast24h: detailedStats.criticalErrorsLast24h
    };
  }

  // Advanced methods
  public async recoverWithStrategy(
    error: QualitySystemError,
    operation: () => Promise<any>,
    fallback?: () => Promise<any>
  ): Promise<RecoveryResult> {
    this.recoveryStats.attempts++;
    
    const result = await this.recoveryManager.attemptRecovery(
      error,
      operation,
      fallback
    );

    if (result.success) {
      this.recoveryStats.successes++;
    }
    
    this.recoveryStats.totalTime += result.duration;

    this.logger.info('Recovery attempt completed', {
      correlationId: error.correlationId,
      success: result.success,
      strategy: result.strategy,
      duration: result.duration
    });

    return result;
  }

  public createValidationError(message: string, field?: string, value?: any): ValidationError {
    return new ValidationError(message, field, value, {
      component: 'validation',
      operation: 'validate'
    });
  }

  public createNetworkError(message: string, url?: string, statusCode?: number): NetworkError {
    return new NetworkError(message, url, statusCode, {
      component: 'network',
      operation: 'request'
    });
  }

  public createBusinessError(message: string, rule?: string): BusinessLogicError {
    return new BusinessLogicError(message, rule, {
      component: 'business',
      operation: 'validate-rule'
    });
  }

  public getErrorPatterns(): ErrorPattern[] {
    return Array.from(this.errorPatterns.values())
      .sort((a, b) => b.frequency - a.frequency);
  }

  public getDetailedStatistics(): ErrorStatistics {
    return this.generateDetailedStatistics();
  }

  public getCircuitBreakerStatus(): Record<string, any> {
    return this.recoveryManager.getAllCircuitBreakers();
  }

  public resetCircuitBreaker(operationKey: string): void {
    this.recoveryManager.resetCircuitBreaker(operationKey);
    this.logger.info('Circuit breaker reset', { operationKey });
  }

  public acknowledgeError(correlationId: string, assignee?: string): void {
    const error = this.errorHistory.find(e => e.correlationId === correlationId);
    if (error) {
      this.logger.info('Error acknowledged', { correlationId, assignee });
      // Update notification status
      // This would integrate with the notification system
    }
  }

  private classifyAndEnhanceError(error: Error, context: ErrorContext): QualitySystemError {
    const category = this.classifyError(error) as ErrorCategory;
    const severity = this.determineSeverity(error, context);
    
    // Create appropriate error type based on category
    let qualityError: QualitySystemError;
    
    switch (category) {
      case ErrorCategory.VALIDATION:
        qualityError = new ValidationError(error.message, undefined, undefined, context);
        break;
      case ErrorCategory.NETWORK:
        qualityError = new NetworkError(error.message, undefined, undefined, context);
        break;
      case ErrorCategory.AUTHENTICATION:
        qualityError = new AuthenticationError(error.message, context.userId, context);
        break;
      case ErrorCategory.BUSINESS:
        qualityError = new BusinessLogicError(error.message, undefined, context);
        break;
      case ErrorCategory.RESOURCE:
        qualityError = new ResourceError(error.message, undefined, context);
        break;
      case ErrorCategory.CONFIGURATION:
        qualityError = new ConfigurationError(error.message, undefined, context);
        break;
      default:
        qualityError = new SystemError(error.message, context.component, context);
    }

    // Enhance with additional context
    qualityError.originalError = error;
    qualityError.userId = context.userId;
    qualityError.sessionId = context.sessionId;

    return qualityError;
  }

  private determineSeverity(error: Error, context: ErrorContext): ErrorSeverity {
    // Use context severity if provided
    if (context.severity) {
      switch (context.severity) {
        case 'low': return ErrorSeverity.LOW;
        case 'medium': return ErrorSeverity.MEDIUM;
        case 'high': return ErrorSeverity.HIGH;
        case 'critical': return ErrorSeverity.CRITICAL;
      }
    }

    // Determine severity based on error characteristics
    const message = error.message.toLowerCase();
    
    if (message.includes('critical') || message.includes('fatal') || 
        message.includes('crash') || message.includes('system')) {
      return ErrorSeverity.CRITICAL;
    }
    
    if (message.includes('error') || message.includes('failed') || 
        message.includes('exception')) {
      return ErrorSeverity.HIGH;
    }
    
    if (message.includes('warning') || message.includes('deprecated')) {
      return ErrorSeverity.MEDIUM;
    }
    
    return ErrorSeverity.MEDIUM; // Default
  }

  private recordError(error: QualitySystemError): void {
    // Add to history (keep last 1000 errors)
    this.errorHistory.push(error);
    if (this.errorHistory.length > 1000) {
      this.errorHistory.shift();
    }

    // Update statistics
    const categoryKey = `category_${error.category}`;
    const severityKey = `severity_${error.severity}`;
    const componentKey = `component_${error.component}`;

    this.errorStats.set(categoryKey, (this.errorStats.get(categoryKey) || 0) + 1);
    this.errorStats.set(severityKey, (this.errorStats.get(severityKey) || 0) + 1);
    this.errorStats.set(componentKey, (this.errorStats.get(componentKey) || 0) + 1);
  }

  private async attemptErrorRecovery(error: QualitySystemError): Promise<void> {
    if (!error.metadata.retryable) {
      return;
    }

    try {
      // This would be called with the actual operation that failed
      // For now, we'll just log the attempt
      this.logger.info('Recovery would be attempted here', {
        correlationId: error.correlationId,
        strategy: error.metadata.recoveryStrategy
      });
    } catch (recoveryError) {
      this.logger.error('Recovery attempt failed', recoveryError as Error, {
        correlationId: error.correlationId
      });
    }
  }

  private async sendNotifications(error: QualitySystemError): Promise<void> {
    try {
      await Promise.all([
        this.notificationManager.notifyUser(error),
        this.notificationManager.notifyTeam(error)
      ]);
    } catch (notificationError) {
      this.logger.error('Failed to send notifications', notificationError as Error, {
        correlationId: error.correlationId
      });
    }
  }

  private updateErrorPatterns(error: QualitySystemError): void {
    const patternKey = `${error.category}_${error.code}`;
    const existingPattern = this.errorPatterns.get(patternKey);

    if (existingPattern) {
      existingPattern.frequency++;
      existingPattern.lastOccurrence = new Date();
    } else {
      this.errorPatterns.set(patternKey, {
        pattern: patternKey,
        category: error.category,
        severity: error.severity,
        frequency: 1,
        lastOccurrence: new Date(),
        suggestedFix: this.generateSuggestedFix(error)
      });
    }
  }

  private generateSuggestedFix(error: QualitySystemError): string {
    switch (error.category) {
      case ErrorCategory.VALIDATION:
        return 'Check input validation rules and user input format';
      case ErrorCategory.NETWORK:
        return 'Verify network connectivity and API endpoint availability';
      case ErrorCategory.AUTHENTICATION:
        return 'Check authentication credentials and token validity';
      case ErrorCategory.RESOURCE:
        return 'Monitor system resources and consider scaling';
      case ErrorCategory.CONFIGURATION:
        return 'Review configuration settings and environment variables';
      default:
        return 'Review error logs and contact development team';
    }
  }

  private createQualityErrorFromRegular(error: Error, severity: string): QualitySystemError {
    const errorSeverity = severity === 'critical' ? ErrorSeverity.CRITICAL :
                         severity === 'high' ? ErrorSeverity.HIGH :
                         severity === 'medium' ? ErrorSeverity.MEDIUM : ErrorSeverity.LOW;

    return new SystemError(error.message, 'unknown', {
      component: 'unknown',
      operation: 'unknown',
      severity: severity as any
    });
  }

  private generateDetailedStatistics(): ErrorStatistics {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const errorsByCategory = {} as Record<ErrorCategory, number>;
    const errorsBySeverity = {} as Record<ErrorSeverity, number>;
    const errorsByComponent = {} as Record<string, number>;
    const messageCount = new Map<string, number>();

    // Initialize counters
    Object.values(ErrorCategory).forEach(cat => errorsByCategory[cat] = 0);
    Object.values(ErrorSeverity).forEach(sev => errorsBySeverity[sev] = 0);

    let criticalErrorsLast24h = 0;

    for (const error of this.errorHistory) {
      errorsByCategory[error.category]++;
      errorsBySeverity[error.severity]++;
      errorsByComponent[error.component] = (errorsByComponent[error.component] || 0) + 1;

      if (error.severity === ErrorSeverity.CRITICAL && error.timestamp >= last24h) {
        criticalErrorsLast24h++;
      }

      // Count message frequency
      const count = messageCount.get(error.message) || 0;
      messageCount.set(error.message, count + 1);
    }

    const topErrorMessages = Array.from(messageCount.entries())
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const recoverySuccessRate = this.recoveryStats.attempts > 0 ? 
      this.recoveryStats.successes / this.recoveryStats.attempts : 0;

    const averageRecoveryTime = this.recoveryStats.attempts > 0 ?
      this.recoveryStats.totalTime / this.recoveryStats.attempts : 0;

    return {
      totalErrors: this.errorHistory.length,
      errorsByCategory,
      errorsBySeverity,
      errorsByComponent,
      recoverySuccessRate,
      averageRecoveryTime,
      criticalErrorsLast24h,
      topErrorMessages
    };
  }
}