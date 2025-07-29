// Error Handling Service Implementation

import {
  IErrorHandlingService,
  ILogger,
  INotificationService
} from '../interfaces';
import {
  ErrorType,
  ErrorContext,
  ErrorHandlingStrategy
} from '../types';

export class ErrorHandlingService implements IErrorHandlingService {
  private logger: ILogger;
  private notificationService: INotificationService;
  private errorStrategies: Map<ErrorType, ErrorHandlingStrategy>;
  private errorStats: Map<string, number>;

  constructor(logger: ILogger, notificationService: INotificationService) {
    this.logger = logger;
    this.notificationService = notificationService;
    this.errorStrategies = new Map();
    this.errorStats = new Map();
    this.initializeErrorStrategies();
  }

  handleError(error: Error, context: ErrorContext): void {
    this.logger.error('Handling error', error, context);
    
    const errorType = this.classifyError(error);
    this.updateErrorStatistics(errorType);
    
    const strategy = this.errorStrategies.get(errorType as ErrorType);
    
    if (strategy) {
      this.executeErrorStrategy(error, context, strategy);
    } else {
      this.handleUnknownError(error, context);
    }
  }

  classifyError(error: Error): string {
    // Classify error based on error message, type, and stack trace
    if (error.name === 'ValidationError' || error.message.includes('validation')) {
      return ErrorType.VALIDATION_ERROR;
    }
    
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return ErrorType.NETWORK_ERROR;
    }
    
    if (error.message.includes('database') || error.message.includes('storage')) {
      return ErrorType.DATABASE_ERROR;
    }
    
    if (error.message.includes('authentication') || error.message.includes('unauthorized')) {
      return ErrorType.AUTHENTICATION_ERROR;
    }
    
    if (error.message.includes('permission') || error.message.includes('forbidden')) {
      return ErrorType.AUTHORIZATION_ERROR;
    }
    
    if (error.message.includes('business') || error.message.includes('logic')) {
      return ErrorType.BUSINESS_LOGIC_ERROR;
    }
    
    return ErrorType.SYSTEM_ERROR;
  }

  attemptRecovery(error: Error, errorType: string): boolean {
    this.logger.info('Attempting error recovery', { errorType });
    
    const strategy = this.errorStrategies.get(errorType as ErrorType);
    
    if (!strategy || !strategy.retryable) {
      this.logger.warn('Error is not recoverable', { errorType });
      return false;
    }

    try {
      if (strategy.fallbackAction) {
        strategy.fallbackAction();
        this.logger.info('Fallback action executed successfully', { errorType });
        return true;
      }
    } catch (recoveryError) {
      this.logger.error('Recovery attempt failed', recoveryError as Error, { errorType });
    }

    return false;
  }

  notifyUser(error: Error, severity: string): void {
    this.logger.info('Notifying user of error', { severity });
    
    const userMessage = this.generateUserFriendlyMessage(error, severity);
    
    // This would integrate with the notification service
    this.notificationService.sendQualityAlert(
      userMessage, 
      severity as 'low' | 'medium' | 'high'
    ).catch(notifyError => {
      this.logger.error('Failed to send user notification', notifyError as Error);
    });
  }

  reportToTeam(error: Error, context: ErrorContext): void {
    this.logger.info('Reporting error to team', context);
    
    if (context.severity === 'critical' || context.severity === 'high') {
      const teamMessage = this.generateTeamReport(error, context);
      
      this.notificationService.sendQualityAlert(
        teamMessage,
        context.severity === 'critical' ? 'high' : 'medium'
      ).catch(reportError => {
        this.logger.error('Failed to send team notification', reportError as Error);
      });
    }
  }

  async getErrorStatistics(): Promise<Record<string, number>> {
    return Object.fromEntries(this.errorStats);
  }

  private initializeErrorStrategies(): void {
    this.errorStrategies.set(ErrorType.VALIDATION_ERROR, {
      errorType: ErrorType.VALIDATION_ERROR,
      retryable: false,
      maxRetries: 0,
      backoffStrategy: 'linear',
      userNotification: true,
      teamNotification: false
    });

    this.errorStrategies.set(ErrorType.NETWORK_ERROR, {
      errorType: ErrorType.NETWORK_ERROR,
      retryable: true,
      maxRetries: 3,
      backoffStrategy: 'exponential',
      userNotification: true,
      teamNotification: false
    });

    this.errorStrategies.set(ErrorType.DATABASE_ERROR, {
      errorType: ErrorType.DATABASE_ERROR,
      retryable: true,
      maxRetries: 2,
      backoffStrategy: 'linear',
      userNotification: false,
      teamNotification: true
    });

    this.errorStrategies.set(ErrorType.SYSTEM_ERROR, {
      errorType: ErrorType.SYSTEM_ERROR,
      retryable: false,
      maxRetries: 0,
      backoffStrategy: 'linear',
      userNotification: true,
      teamNotification: true
    });
  }

  private executeErrorStrategy(
    error: Error, 
    context: ErrorContext, 
    strategy: ErrorHandlingStrategy
  ): void {
    if (strategy.userNotification) {
      this.notifyUser(error, context.severity);
    }

    if (strategy.teamNotification) {
      this.reportToTeam(error, context);
    }

    if (strategy.retryable && context.recoverable) {
      this.attemptRecovery(error, strategy.errorType);
    }
  }

  private handleUnknownError(error: Error, context: ErrorContext): void {
    this.logger.critical('Unknown error type encountered', error, context);
    
    // Default to conservative approach for unknown errors
    this.notifyUser(error, 'high');
    this.reportToTeam(error, { ...context, severity: 'high' });
  }

  private updateErrorStatistics(errorType: string): void {
    const currentCount = this.errorStats.get(errorType) || 0;
    this.errorStats.set(errorType, currentCount + 1);
  }

  private generateUserFriendlyMessage(error: Error, severity: string): string {
    const baseMessage = 'An issue occurred while processing your request.';
    
    switch (severity) {
      case 'low':
        return `${baseMessage} This is a minor issue and shouldn't affect your work.`;
      case 'medium':
        return `${baseMessage} Some features may be temporarily unavailable.`;
      case 'high':
      case 'critical':
        return `${baseMessage} Please try again later or contact support if the issue persists.`;
      default:
        return baseMessage;
    }
  }

  private generateTeamReport(error: Error, context: ErrorContext): string {
    return `Critical Error in ${context.component}:
Action: ${context.action}
Error: ${error.message}
Severity: ${context.severity}
Recoverable: ${context.recoverable}
Stack: ${error.stack?.substring(0, 500)}...`;
  }
}