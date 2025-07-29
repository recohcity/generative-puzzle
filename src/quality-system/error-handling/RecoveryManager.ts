// Error Recovery Management System

import { QualitySystemError, RecoveryStrategy, ErrorSeverity } from './ErrorTypes';
import { ILogger } from '../interfaces';

export interface RecoveryResult {
  success: boolean;
  strategy: RecoveryStrategy;
  attempts: number;
  duration: number;
  fallbackUsed: boolean;
  message: string;
  nextRetryDelay?: number;
}

export interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime: Date;
  nextAttemptTime: Date;
  successCount: number;
}

export interface FallbackFunction {
  (): Promise<any> | any;
}

export class RecoveryManager {
  private logger: ILogger;
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private fallbackFunctions: Map<string, FallbackFunction> = new Map();
  private retryAttempts: Map<string, number> = new Map();

  // Circuit breaker configuration
  private readonly FAILURE_THRESHOLD = 5;
  private readonly RECOVERY_TIMEOUT = 60000; // 1 minute
  private readonly HALF_OPEN_MAX_CALLS = 3;

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  async attemptRecovery(
    error: QualitySystemError,
    operation: () => Promise<any>,
    fallback?: FallbackFunction
  ): Promise<RecoveryResult> {
    const startTime = Date.now();
    const operationKey = `${error.component}:${error.operation}`;

    this.logger.info('Starting error recovery', {
      correlationId: error.correlationId,
      strategy: error.metadata.recoveryStrategy,
      component: error.component,
      operation: error.operation
    });

    try {
      switch (error.metadata.recoveryStrategy) {
        case RecoveryStrategy.RETRY:
          return await this.handleRetryStrategy(error, operation, startTime);

        case RecoveryStrategy.FALLBACK:
          return await this.handleFallbackStrategy(error, operation, fallback, startTime);

        case RecoveryStrategy.CIRCUIT_BREAKER:
          return await this.handleCircuitBreakerStrategy(error, operation, operationKey, startTime);

        case RecoveryStrategy.GRACEFUL_DEGRADATION:
          return await this.handleGracefulDegradation(error, operation, fallback, startTime);

        case RecoveryStrategy.FAIL_FAST:
          return this.handleFailFast(error, startTime);

        case RecoveryStrategy.MANUAL_INTERVENTION:
          return this.handleManualIntervention(error, startTime);

        default:
          return await this.handleRetryStrategy(error, operation, startTime);
      }
    } catch (recoveryError) {
      this.logger.error('Recovery attempt failed', recoveryError as Error, {
        correlationId: error.correlationId,
        originalError: error.code
      });

      return {
        success: false,
        strategy: error.metadata.recoveryStrategy,
        attempts: error.recoveryAttempts + 1,
        duration: Date.now() - startTime,
        fallbackUsed: false,
        message: `Recovery failed: ${(recoveryError as Error).message}`
      };
    }
  }

  private async handleRetryStrategy(
    error: QualitySystemError,
    operation: () => Promise<any>,
    startTime: number
  ): Promise<RecoveryResult> {
    const maxRetries = error.metadata.maxRetries;
    let attempts = 0;
    let lastError = error;

    while (attempts < maxRetries) {
      attempts++;
      const delay = this.calculateRetryDelay(error, attempts);

      this.logger.debug('Attempting retry', {
        correlationId: error.correlationId,
        attempt: attempts,
        maxRetries,
        delay
      });

      await this.sleep(delay);

      try {
        await operation();
        
        this.logger.info('Retry successful', {
          correlationId: error.correlationId,
          attempts,
          duration: Date.now() - startTime
        });

        return {
          success: true,
          strategy: RecoveryStrategy.RETRY,
          attempts,
          duration: Date.now() - startTime,
          fallbackUsed: false,
          message: `Recovery successful after ${attempts} attempts`
        };
      } catch (retryError) {
        lastError = retryError as QualitySystemError;
        this.logger.warn('Retry attempt failed', {
          correlationId: error.correlationId,
          attempt: attempts,
          error: (retryError as Error).message
        });
      }
    }

    return {
      success: false,
      strategy: RecoveryStrategy.RETRY,
      attempts,
      duration: Date.now() - startTime,
      fallbackUsed: false,
      message: `All ${maxRetries} retry attempts failed`,
      nextRetryDelay: this.calculateRetryDelay(error, attempts + 1)
    };
  }

  private async handleFallbackStrategy(
    error: QualitySystemError,
    operation: () => Promise<any>,
    fallback: FallbackFunction | undefined,
    startTime: number
  ): Promise<RecoveryResult> {
    // First try the original operation once
    try {
      await operation();
      return {
        success: true,
        strategy: RecoveryStrategy.FALLBACK,
        attempts: 1,
        duration: Date.now() - startTime,
        fallbackUsed: false,
        message: 'Original operation succeeded'
      };
    } catch (operationError) {
      this.logger.warn('Original operation failed, attempting fallback', {
        correlationId: error.correlationId,
        error: (operationError as Error).message
      });
    }

    // Try fallback if available
    if (fallback) {
      try {
        await fallback();
        
        this.logger.info('Fallback operation successful', {
          correlationId: error.correlationId,
          duration: Date.now() - startTime
        });

        return {
          success: true,
          strategy: RecoveryStrategy.FALLBACK,
          attempts: 1,
          duration: Date.now() - startTime,
          fallbackUsed: true,
          message: 'Fallback operation succeeded'
        };
      } catch (fallbackError) {
        this.logger.error('Fallback operation failed', fallbackError as Error, {
          correlationId: error.correlationId
        });
      }
    }

    return {
      success: false,
      strategy: RecoveryStrategy.FALLBACK,
      attempts: 1,
      duration: Date.now() - startTime,
      fallbackUsed: !!fallback,
      message: 'Both original and fallback operations failed'
    };
  }

  private async handleCircuitBreakerStrategy(
    error: QualitySystemError,
    operation: () => Promise<any>,
    operationKey: string,
    startTime: number
  ): Promise<RecoveryResult> {
    const circuitState = this.getCircuitBreakerState(operationKey);

    // Check if circuit is open
    if (circuitState.state === 'OPEN') {
      if (Date.now() < circuitState.nextAttemptTime.getTime()) {
        return {
          success: false,
          strategy: RecoveryStrategy.CIRCUIT_BREAKER,
          attempts: 0,
          duration: Date.now() - startTime,
          fallbackUsed: false,
          message: 'Circuit breaker is OPEN, operation blocked'
        };
      } else {
        // Transition to half-open
        circuitState.state = 'HALF_OPEN';
        circuitState.successCount = 0;
        this.logger.info('Circuit breaker transitioning to HALF_OPEN', { operationKey });
      }
    }

    try {
      await operation();
      
      // Success - handle circuit breaker state
      if (circuitState.state === 'HALF_OPEN') {
        circuitState.successCount++;
        if (circuitState.successCount >= this.HALF_OPEN_MAX_CALLS) {
          circuitState.state = 'CLOSED';
          circuitState.failureCount = 0;
          this.logger.info('Circuit breaker CLOSED after successful recovery', { operationKey });
        }
      } else {
        circuitState.failureCount = 0;
      }

      return {
        success: true,
        strategy: RecoveryStrategy.CIRCUIT_BREAKER,
        attempts: 1,
        duration: Date.now() - startTime,
        fallbackUsed: false,
        message: 'Operation succeeded, circuit breaker updated'
      };
    } catch (operationError) {
      // Failure - update circuit breaker
      circuitState.failureCount++;
      circuitState.lastFailureTime = new Date();

      if (circuitState.failureCount >= this.FAILURE_THRESHOLD) {
        circuitState.state = 'OPEN';
        circuitState.nextAttemptTime = new Date(Date.now() + this.RECOVERY_TIMEOUT);
        this.logger.warn('Circuit breaker OPENED due to failures', {
          operationKey,
          failureCount: circuitState.failureCount
        });
      }

      return {
        success: false,
        strategy: RecoveryStrategy.CIRCUIT_BREAKER,
        attempts: 1,
        duration: Date.now() - startTime,
        fallbackUsed: false,
        message: `Operation failed, circuit breaker state: ${circuitState.state}`
      };
    }
  }

  private async handleGracefulDegradation(
    error: QualitySystemError,
    operation: () => Promise<any>,
    fallback: FallbackFunction | undefined,
    startTime: number
  ): Promise<RecoveryResult> {
    // For graceful degradation, we always use fallback if available
    if (fallback) {
      try {
        await fallback();
        
        this.logger.info('Graceful degradation successful', {
          correlationId: error.correlationId,
          duration: Date.now() - startTime
        });

        return {
          success: true,
          strategy: RecoveryStrategy.GRACEFUL_DEGRADATION,
          attempts: 1,
          duration: Date.now() - startTime,
          fallbackUsed: true,
          message: 'Graceful degradation applied successfully'
        };
      } catch (fallbackError) {
        this.logger.error('Graceful degradation failed', fallbackError as Error, {
          correlationId: error.correlationId
        });
      }
    }

    return {
      success: false,
      strategy: RecoveryStrategy.GRACEFUL_DEGRADATION,
      attempts: 1,
      duration: Date.now() - startTime,
      fallbackUsed: !!fallback,
      message: 'Graceful degradation not available or failed'
    };
  }

  private handleFailFast(error: QualitySystemError, startTime: number): RecoveryResult {
    this.logger.info('Fail-fast strategy applied', {
      correlationId: error.correlationId,
      component: error.component,
      operation: error.operation
    });

    return {
      success: false,
      strategy: RecoveryStrategy.FAIL_FAST,
      attempts: 0,
      duration: Date.now() - startTime,
      fallbackUsed: false,
      message: 'Fail-fast strategy - no recovery attempted'
    };
  }

  private handleManualIntervention(error: QualitySystemError, startTime: number): RecoveryResult {
    this.logger.critical('Manual intervention required', {
      correlationId: error.correlationId,
      component: error.component,
      operation: error.operation,
      severity: error.severity
    });

    return {
      success: false,
      strategy: RecoveryStrategy.MANUAL_INTERVENTION,
      attempts: 0,
      duration: Date.now() - startTime,
      fallbackUsed: false,
      message: 'Manual intervention required - operation suspended'
    };
  }

  private calculateRetryDelay(error: QualitySystemError, attempt: number): number {
    const baseDelay = error.metadata.retryDelay;
    const multiplier = error.metadata.backoffMultiplier;
    return baseDelay * Math.pow(multiplier, attempt - 1);
  }

  private getCircuitBreakerState(operationKey: string): CircuitBreakerState {
    if (!this.circuitBreakers.has(operationKey)) {
      this.circuitBreakers.set(operationKey, {
        state: 'CLOSED',
        failureCount: 0,
        lastFailureTime: new Date(),
        nextAttemptTime: new Date(),
        successCount: 0
      });
    }
    return this.circuitBreakers.get(operationKey)!;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public methods for managing fallbacks and circuit breakers
  public registerFallback(operationKey: string, fallback: FallbackFunction): void {
    this.fallbackFunctions.set(operationKey, fallback);
    this.logger.debug('Fallback function registered', { operationKey });
  }

  public resetCircuitBreaker(operationKey: string): void {
    const state = this.getCircuitBreakerState(operationKey);
    state.state = 'CLOSED';
    state.failureCount = 0;
    state.successCount = 0;
    this.logger.info('Circuit breaker manually reset', { operationKey });
  }

  public getCircuitBreakerStatus(operationKey: string): CircuitBreakerState {
    return { ...this.getCircuitBreakerState(operationKey) };
  }

  public getAllCircuitBreakers(): Record<string, CircuitBreakerState> {
    const result: Record<string, CircuitBreakerState> = {};
    for (const [key, state] of this.circuitBreakers.entries()) {
      result[key] = { ...state };
    }
    return result;
  }
}