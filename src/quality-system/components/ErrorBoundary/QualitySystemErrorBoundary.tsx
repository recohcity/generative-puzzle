// Quality System Error Boundary Component

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AdvancedErrorHandlingService } from '../../error-handling/AdvancedErrorHandlingService';
import { SystemError, ErrorSeverity } from '../../error-handling/ErrorTypes';
import { ServiceFactory } from '../../core/ServiceFactory';
import { ErrorFallbackUI } from './ErrorFallbackUI';

export interface QualitySystemErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: ErrorInfo, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableRetry?: boolean;
  maxRetries?: number;
  component?: string;
  isolateErrors?: boolean;
  showErrorDetails?: boolean;
  logErrors?: boolean;
}

export interface QualitySystemErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  errorId: string | null;
  isRecovering: boolean;
}

export class QualitySystemErrorBoundary extends Component<
  QualitySystemErrorBoundaryProps,
  QualitySystemErrorBoundaryState
> {
  private errorHandlingService: AdvancedErrorHandlingService;
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: QualitySystemErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      errorId: null,
      isRecovering: false
    };

    // Initialize error handling service
    const serviceFactory = ServiceFactory.getInstance();
    this.errorHandlingService = serviceFactory.getErrorHandlingService() as AdvancedErrorHandlingService;
  }

  static getDerivedStateFromError(error: Error): Partial<QualitySystemErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `boundary_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, component = 'ErrorBoundary', logErrors = true } = this.props;

    // Update state with error info
    this.setState({
      errorInfo,
      retryCount: 0
    });

    // Create enhanced error with React context
    const enhancedError = this.createEnhancedError(error, errorInfo);

    // Log error if enabled
    if (logErrors) {
      this.logError(enhancedError, errorInfo);
    }

    // Handle error through error handling service
    this.errorHandlingService.handleError(enhancedError, {
      component,
      action: 'render',
      severity: 'high',
      recoverable: this.props.enableRetry !== false
    });

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Attempt automatic recovery if enabled
    if (this.props.enableRetry !== false) {
      this.scheduleRetry();
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private createEnhancedError(error: Error, errorInfo: ErrorInfo): SystemError {
    const componentStack = errorInfo.componentStack;
    const errorBoundaryStack = errorInfo.errorBoundary?.toString() || 'Unknown';

    const enhancedError = new SystemError(
      `React Error: ${error.message}`,
      this.props.component || 'ErrorBoundary',
      {
        component: this.props.component || 'ErrorBoundary',
        operation: 'render',
        originalError: error,
        componentStack,
        errorBoundaryStack,
        errorBoundary: errorInfo.errorBoundary?.constructor.name,
        errorInfo: {
          componentStack: componentStack?.split('\n').slice(0, 5).join('\n'), // Limit stack size
          props: this.sanitizeProps()
        }
      }
    );

    enhancedError.originalError = error;
    return enhancedError;
  }

  private sanitizeProps(): Record<string, any> {
    const { children, fallback, onError, ...safeProps } = this.props;
    return {
      ...safeProps,
      hasChildren: !!children,
      hasFallback: !!fallback,
      hasOnError: !!onError
    };
  }

  private logError(error: SystemError, errorInfo: ErrorInfo) {
    const serviceFactory = ServiceFactory.getInstance();
    const logger = serviceFactory.getLogger();

    logger.error('React Error Boundary caught error', error, {
      errorId: this.state.errorId,
      component: this.props.component,
      componentStack: errorInfo.componentStack?.split('\n').slice(0, 3).join('\n'),
      retryCount: this.state.retryCount,
      props: this.sanitizeProps()
    });
  }

  private scheduleRetry = () => {
    const maxRetries = this.props.maxRetries || 3;
    
    if (this.state.retryCount >= maxRetries) {
      return;
    }

    // Calculate retry delay with exponential backoff
    const baseDelay = 1000; // 1 second
    const delay = baseDelay * Math.pow(2, this.state.retryCount);

    this.retryTimeoutId = setTimeout(() => {
      this.handleRetry();
    }, delay);
  };

  private handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    
    if (this.state.retryCount >= maxRetries) {
      return;
    }

    this.setState(prevState => ({
      isRecovering: true,
      retryCount: prevState.retryCount + 1
    }));

    // Log retry attempt
    const serviceFactory = ServiceFactory.getInstance();
    const logger = serviceFactory.getLogger();
    
    logger.info('Error Boundary retry attempt', {
      errorId: this.state.errorId,
      retryCount: this.state.retryCount + 1,
      maxRetries,
      component: this.props.component
    });

    // Reset error state after a brief delay to allow for re-rendering
    setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        isRecovering: false
      });
    }, 100);
  };

  private handleManualRetry = () => {
    this.handleRetry();
  };

  private handleReportError = () => {
    if (this.state.error && this.state.errorInfo) {
      const enhancedError = this.createEnhancedError(this.state.error, this.state.errorInfo);
      
      // Report to team
      this.errorHandlingService.reportToTeam(enhancedError, {
        component: this.props.component || 'ErrorBoundary',
        action: 'manual-report',
        severity: 'high',
        recoverable: false
      });

      // Show confirmation
      alert('错误已报告给开发团队，我们会尽快处理。');
    }
  };

  render() {
    const { hasError, error, errorInfo, retryCount, isRecovering } = this.state;
    const { 
      children, 
      fallback, 
      enableRetry = true, 
      maxRetries = 3,
      showErrorDetails = false,
      isolateErrors = true
    } = this.props;

    if (hasError && error) {
      // Show recovery indicator
      if (isRecovering) {
        return (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">正在恢复...</p>
            </div>
          </div>
        );
      }

      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, errorInfo!, this.handleManualRetry);
      }

      // Use default error fallback UI
      return (
        <ErrorFallbackUI
          error={error}
          errorInfo={errorInfo}
          retryCount={retryCount}
          maxRetries={maxRetries}
          enableRetry={enableRetry}
          showErrorDetails={showErrorDetails}
          onRetry={this.handleManualRetry}
          onReport={this.handleReportError}
          component={this.props.component}
          errorId={this.state.errorId}
        />
      );
    }

    // Wrap children in error isolation if enabled
    if (isolateErrors) {
      return (
        <div className="quality-system-error-boundary">
          {children}
        </div>
      );
    }

    return children;
  }
}

// Higher-order component for easy wrapping
export function withQualitySystemErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<QualitySystemErrorBoundaryProps, 'children'>
) {
  const WithErrorBoundary = (props: P) => (
    <QualitySystemErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </QualitySystemErrorBoundary>
  );

  WithErrorBoundary.displayName = `withQualitySystemErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithErrorBoundary;
}

// Hook for manual error reporting
export function useErrorReporting() {
  const serviceFactory = ServiceFactory.getInstance();
  const errorHandlingService = serviceFactory.getErrorHandlingService() as AdvancedErrorHandlingService;

  const reportError = React.useCallback((error: Error, context?: Record<string, any>) => {
    const enhancedError = new SystemError(
      error.message,
      'manual-report',
      {
        component: 'manual-report',
        operation: 'user-report',
        originalError: error,
        ...context
      }
    );

    errorHandlingService.handleError(enhancedError, {
      component: 'manual-report',
      action: 'user-report',
      severity: 'medium',
      recoverable: false
    });
  }, [errorHandlingService]);

  return { reportError };
}