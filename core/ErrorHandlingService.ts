/**
 * ErrorHandlingService - Unified error handling and reporting mechanism
 * Provides centralized error handling, recovery, and monitoring capabilities
 */

import { LoggingService } from './LoggingService';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  DEVICE_DETECTION = 'device_detection',
  ADAPTATION = 'adaptation',
  CANVAS_MANAGEMENT = 'canvas_management',
  EVENT_HANDLING = 'event_handling',
  PUZZLE_LOGIC = 'puzzle_logic',
  CONFIGURATION = 'configuration',
  NETWORK = 'network',
  VALIDATION = 'validation',
  PERFORMANCE = 'performance',
  UNKNOWN = 'unknown'
}

export interface ErrorContext {
  component: string;
  method?: string;
  userId?: string;
  sessionId?: string;
  deviceInfo?: any;
  timestamp: number;
  stackTrace?: string;
  additionalData?: Record<string, any>;
}

export interface ErrorReport {
  id: string;
  error: Error;
  severity: ErrorSeverity;
  category: ErrorCategory;
  context: ErrorContext;
  timestamp: number;
  handled: boolean;
  recovered: boolean;
  recoveryAction?: string;
  retryCount: number;
  maxRetries: number;
}

export interface ErrorRecoveryStrategy {
  category: ErrorCategory;
  handler: (error: Error, context: ErrorContext) => Promise<boolean> | boolean;
  maxRetries: number;
  retryDelay: number;
  fallbackAction?: () => void;
}

export interface ErrorHandlingConfig {
  enableReporting: boolean;
  enableRecovery: boolean;
  maxReports: number;
  reportingEndpoint?: string;
  retryDelayMultiplier: number;
  criticalErrorCallback?: (report: ErrorReport) => void;
}

export class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private logger: LoggingService;
  private errorReports: ErrorReport[] = [];
  private recoveryStrategies: Map<ErrorCategory, ErrorRecoveryStrategy> = new Map();
  private config: ErrorHandlingConfig;
  private errorCount: Record<ErrorCategory, number> = {} as Record<ErrorCategory, number>;

  private constructor() {
    this.logger = LoggingService.getInstance();
    this.config = {
      enableReporting: true,
      enableRecovery: true,
      maxReports: 1000,
      retryDelayMultiplier: 1.5,
    };
    
    // Initialize error counts
    Object.values(ErrorCategory).forEach(category => {
      this.errorCount[category] = 0;
    });

    this.setupDefaultRecoveryStrategies();
  }

  public static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  /**
   * Configure error handling behavior
   */
  public configure(config: Partial<ErrorHandlingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Handle an error with automatic categorization and recovery
   */
  public async handleError(
    error: Error,
    context: ErrorContext,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    category?: ErrorCategory
  ): Promise<ErrorReport> {
    const errorCategory = category || this.categorizeError(error, context);
    const errorId = this.generateErrorId();
    
    const report: ErrorReport = {
      id: errorId,
      error,
      severity,
      category: errorCategory,
      context: {
        ...context,
        timestamp: Date.now(),
        stackTrace: error.stack
      },
      timestamp: Date.now(),
      handled: false,
      recovered: false,
      retryCount: 0,
      maxRetries: this.getMaxRetries(errorCategory)
    };

    // Log the error
    this.logError(report);

    // Store the report
    if (this.config.enableReporting) {
      this.storeErrorReport(report);
    }

    // Attempt recovery
    if (this.config.enableRecovery) {
      report.recovered = await this.attemptRecovery(report);
    }

    // Handle critical errors
    if (severity === ErrorSeverity.CRITICAL && this.config.criticalErrorCallback) {
      this.config.criticalErrorCallback(report);
    }

    report.handled = true;
    this.errorCount[errorCategory]++;

    return report;
  }

  /**
   * Register a custom recovery strategy
   */
  public registerRecoveryStrategy(strategy: ErrorRecoveryStrategy): void {
    this.recoveryStrategies.set(strategy.category, strategy);
  }

  /**
   * Get error statistics
   */
  public getErrorStats(): {
    totalErrors: number;
    errorsByCategory: Record<ErrorCategory, number>;
    recentErrors: ErrorReport[];
    recoveryRate: number;
  } {
    const totalErrors = Object.values(this.errorCount).reduce((sum, count) => sum + count, 0);
    const recoveredErrors = this.errorReports.filter(report => report.recovered).length;
    const recoveryRate = totalErrors > 0 ? (recoveredErrors / totalErrors) * 100 : 0;

    return {
      totalErrors,
      errorsByCategory: { ...this.errorCount },
      recentErrors: this.errorReports.slice(-10),
      recoveryRate
    };
  }

  /**
   * Clear error reports
   */
  public clearErrorReports(): void {
    this.errorReports = [];
    Object.keys(this.errorCount).forEach(category => {
      this.errorCount[category as ErrorCategory] = 0;
    });
  }

  /**
   * Export error reports for analysis
   */
  public exportErrorReports(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.errorReports, null, 2);
    } else {
      const headers = ['id', 'category', 'severity', 'message', 'component', 'timestamp', 'recovered'];
      const rows = this.errorReports.map(report => [
        report.id,
        report.category,
        report.severity,
        report.error.message,
        report.context.component,
        new Date(report.timestamp).toISOString(),
        report.recovered.toString()
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }

  /**
   * Create a scoped error handler for a specific component
   */
  public createComponentErrorHandler(component: string) {
    return {
      handleError: async (
        error: Error,
        method?: string,
        severity: ErrorSeverity = ErrorSeverity.MEDIUM,
        category?: ErrorCategory,
        additionalData?: Record<string, any>
      ) => {
        const context: ErrorContext = {
          component,
          method,
          timestamp: Date.now(),
          additionalData
        };
        
        return this.handleError(error, context, severity, category);
      },

      handleValidationError: (field: string, value: any, expectedType: string) => {
        const error = new Error(`Validation failed for ${field}: expected ${expectedType}, got ${typeof value}`);
        const context: ErrorContext = {
          component,
          method: 'validation',
          timestamp: Date.now(),
          additionalData: { field, value, expectedType }
        };
        
        return this.handleError(error, context, ErrorSeverity.LOW, ErrorCategory.VALIDATION);
      },

      handleAsyncError: async (asyncFn: () => Promise<any>, method: string) => {
        try {
          return await asyncFn();
        } catch (error) {
          await this.handleError(error as Error, {
            component,
            method,
            timestamp: Date.now()
          });
          throw error; // Re-throw after handling
        }
      }
    };
  }

  /**
   * Setup default recovery strategies
   */
  private setupDefaultRecoveryStrategies(): void {
    // Device detection recovery
    this.registerRecoveryStrategy({
      category: ErrorCategory.DEVICE_DETECTION,
      handler: this.recoverDeviceDetection.bind(this),
      maxRetries: 3,
      retryDelay: 1000,
      fallbackAction: () => {
        // Fallback to default device settings
        this.logger.warn('Using default device settings due to detection failure');
      }
    });

    // Adaptation recovery
    this.registerRecoveryStrategy({
      category: ErrorCategory.ADAPTATION,
      handler: this.recoverAdaptation.bind(this),
      maxRetries: 2,
      retryDelay: 500,
      fallbackAction: () => {
        // Use safe default dimensions
        this.logger.warn('Using safe default dimensions due to adaptation failure');
      }
    });

    // Canvas management recovery
    this.registerRecoveryStrategy({
      category: ErrorCategory.CANVAS_MANAGEMENT,
      handler: this.recoverCanvasManagement.bind(this),
      maxRetries: 3,
      retryDelay: 200,
      fallbackAction: () => {
        // Reset canvas to default state
        this.logger.warn('Resetting canvas to default state');
      }
    });

    // Configuration recovery
    this.registerRecoveryStrategy({
      category: ErrorCategory.CONFIGURATION,
      handler: this.recoverConfiguration.bind(this),
      maxRetries: 1,
      retryDelay: 0,
      fallbackAction: () => {
        // Use default configuration
        this.logger.warn('Using default configuration due to config error');
      }
    });
  }

  /**
   * Categorize error based on error message and context
   */
  private categorizeError(error: Error, context: ErrorContext): ErrorCategory {
    const message = error.message.toLowerCase();
    const component = context.component.toLowerCase();

    if (component.includes('device') || message.includes('device')) {
      return ErrorCategory.DEVICE_DETECTION;
    }
    if (component.includes('adaptation') || message.includes('adaptation')) {
      return ErrorCategory.ADAPTATION;
    }
    if (component.includes('canvas') || message.includes('canvas')) {
      return ErrorCategory.CANVAS_MANAGEMENT;
    }
    if (component.includes('event') || message.includes('event')) {
      return ErrorCategory.EVENT_HANDLING;
    }
    if (component.includes('puzzle') || message.includes('puzzle')) {
      return ErrorCategory.PUZZLE_LOGIC;
    }
    if (message.includes('config') || message.includes('configuration')) {
      return ErrorCategory.CONFIGURATION;
    }
    if (message.includes('network') || message.includes('fetch')) {
      return ErrorCategory.NETWORK;
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorCategory.VALIDATION;
    }
    if (message.includes('performance') || message.includes('timeout')) {
      return ErrorCategory.PERFORMANCE;
    }

    return ErrorCategory.UNKNOWN;
  }

  /**
   * Attempt error recovery
   */
  private async attemptRecovery(report: ErrorReport): Promise<boolean> {
    const strategy = this.recoveryStrategies.get(report.category);
    if (!strategy) {
      return false;
    }

    let recovered = false;
    let retryCount = 0;

    while (retryCount < strategy.maxRetries && !recovered) {
      try {
        if (retryCount > 0) {
          // Wait before retry
          await this.delay(strategy.retryDelay * Math.pow(this.config.retryDelayMultiplier, retryCount - 1));
        }

        recovered = await strategy.handler(report.error, report.context);
        retryCount++;
        report.retryCount = retryCount;

        if (recovered) {
          report.recoveryAction = `Recovered after ${retryCount} attempts`;
          this.logger.info(`Error recovery successful for ${report.category}`, {
            errorId: report.id,
            attempts: retryCount
          });
        }
      } catch (recoveryError) {
        this.logger.warn(`Recovery attempt ${retryCount + 1} failed for ${report.category}`, recoveryError as Error);
        retryCount++;
      }
    }

    if (!recovered && strategy.fallbackAction) {
      try {
        strategy.fallbackAction();
        report.recoveryAction = 'Fallback action executed';
        recovered = true;
      } catch (fallbackError) {
        this.logger.error('Fallback action failed', fallbackError as Error);
      }
    }

    return recovered;
  }

  /**
   * Recovery strategies for different error categories
   */
  private async recoverDeviceDetection(error: Error, context: ErrorContext): Promise<boolean> {
    // Try to re-initialize device detection
    try {
      // Force refresh device state
      if (typeof window !== 'undefined') {
        const deviceManager = (window as any).deviceManager;
        if (deviceManager && typeof deviceManager.forceUpdateState === 'function') {
          deviceManager.forceUpdateState();
          return true;
        }
      }
    } catch (e) {
      // Recovery failed
    }
    return false;
  }

  private async recoverAdaptation(error: Error, context: ErrorContext): Promise<boolean> {
    // Try to reset adaptation state
    try {
      // Clear any cached adaptation results
      if (context.additionalData?.clearCache) {
        context.additionalData.clearCache();
        return true;
      }
    } catch (e) {
      // Recovery failed
    }
    return false;
  }

  private async recoverCanvasManagement(error: Error, context: ErrorContext): Promise<boolean> {
    // Try to reinitialize canvas
    try {
      if (typeof window !== 'undefined' && context.additionalData?.canvasRef) {
        const canvas = context.additionalData.canvasRef.current;
        if (canvas) {
          // Reset canvas context
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return true;
          }
        }
      }
    } catch (e) {
      // Recovery failed
    }
    return false;
  }

  private async recoverConfiguration(error: Error, context: ErrorContext): Promise<boolean> {
    // Try to reload configuration
    try {
      // Validate and reload config
      const { validateConfig } = require('../src/config/index');
      if (typeof validateConfig === 'function') {
        return validateConfig();
      }
    } catch (e) {
      // Recovery failed
    }
    return false;
  }

  /**
   * Utility methods
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getMaxRetries(category: ErrorCategory): number {
    const strategy = this.recoveryStrategies.get(category);
    return strategy?.maxRetries || 1;
  }

  private logError(report: ErrorReport): void {
    const logMethod = this.getSeverityLogMethod(report.severity);
    this.logger[logMethod](
      `${report.category} error in ${report.context.component}`,
      report.error,
      {
        errorId: report.id,
        category: report.category,
        severity: report.severity,
        component: report.context.component,
        method: report.context.method
      }
    );
  }

  private getSeverityLogMethod(severity: ErrorSeverity): 'debug' | 'info' | 'warn' | 'error' {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'debug';
      case ErrorSeverity.MEDIUM:
        return 'info';
      case ErrorSeverity.HIGH:
        return 'warn';
      case ErrorSeverity.CRITICAL:
        return 'error';
      default:
        return 'error';
    }
  }

  private storeErrorReport(report: ErrorReport): void {
    this.errorReports.push(report);
    
    // Maintain storage limit
    if (this.errorReports.length > this.config.maxReports) {
      this.errorReports = this.errorReports.slice(-this.config.maxReports);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}