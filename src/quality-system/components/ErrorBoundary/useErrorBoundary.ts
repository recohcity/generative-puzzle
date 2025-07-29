// Error Boundary React Hook

'use client';

import { useCallback, useState } from 'react';
import { useErrorReporting } from './QualitySystemErrorBoundary';

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

export interface UseErrorBoundaryReturn {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  captureError: (error: Error, context?: Record<string, any>) => void;
  clearError: () => void;
  reportError: (error: Error, context?: Record<string, any>) => void;
}

/**
 * Hook for manual error boundary functionality
 * Useful for handling errors in async operations, event handlers, etc.
 */
export function useErrorBoundary(): UseErrorBoundaryReturn {
  const [errorState, setErrorState] = useState<ErrorBoundaryState>({
    hasError: false,
    error: null,
    errorId: null
  });

  const { reportError } = useErrorReporting();

  const captureError = useCallback((error: Error, context?: Record<string, any>) => {
    const errorId = `manual_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    setErrorState({
      hasError: true,
      error,
      errorId
    });

    // Report the error
    reportError(error, {
      errorId,
      captureMethod: 'manual',
      ...context
    });
  }, [reportError]);

  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      error: null,
      errorId: null
    });
  }, []);

  const handleReportError = useCallback((error: Error, context?: Record<string, any>) => {
    reportError(error, context);
  }, [reportError]);

  return {
    hasError: errorState.hasError,
    error: errorState.error,
    errorId: errorState.errorId,
    captureError,
    clearError,
    reportError: handleReportError
  };
}

/**
 * Hook for async error handling
 * Automatically captures errors from async operations
 */
export function useAsyncErrorHandler() {
  const { captureError } = useErrorBoundary();

  const handleAsync = useCallback(
    <T>(
      asyncFn: () => Promise<T>,
      context?: Record<string, any>
    ): Promise<T | null> => {
      return asyncFn().catch((error) => {
        captureError(error instanceof Error ? error : new Error(String(error)), {
          operation: 'async',
          ...context
        });
        return null;
      });
    },
    [captureError]
  );

  const wrapAsync = useCallback(
    <T extends any[], R>(
      asyncFn: (...args: T) => Promise<R>,
      context?: Record<string, any>
    ) => {
      return async (...args: T): Promise<R | null> => {
        try {
          return await asyncFn(...args);
        } catch (error) {
          captureError(error instanceof Error ? error : new Error(String(error)), {
            operation: 'async-wrapped',
            args: args.length,
            ...context
          });
          return null;
        }
      };
    },
    [captureError]
  );

  return {
    handleAsync,
    wrapAsync
  };
}

/**
 * Hook for event handler error catching
 */
export function useEventErrorHandler() {
  const { captureError } = useErrorBoundary();

  const wrapEventHandler = useCallback(
    <T extends any[]>(
      handler: (...args: T) => void,
      context?: Record<string, any>
    ) => {
      return (...args: T) => {
        try {
          handler(...args);
        } catch (error) {
          captureError(error instanceof Error ? error : new Error(String(error)), {
            operation: 'event-handler',
            ...context
          });
        }
      };
    },
    [captureError]
  );

  const safeEventHandler = useCallback(
    <T extends any[]>(
      handler: (...args: T) => void,
      fallback?: (...args: T) => void,
      context?: Record<string, any>
    ) => {
      return (...args: T) => {
        try {
          handler(...args);
        } catch (error) {
          captureError(error instanceof Error ? error : new Error(String(error)), {
            operation: 'safe-event-handler',
            ...context
          });
          
          if (fallback) {
            try {
              fallback(...args);
            } catch (fallbackError) {
              console.error('Fallback handler also failed:', fallbackError);
            }
          }
        }
      };
    },
    [captureError]
  );

  return {
    wrapEventHandler,
    safeEventHandler
  };
}

/**
 * Hook for component lifecycle error handling
 */
export function useLifecycleErrorHandler(componentName: string) {
  const { captureError } = useErrorReporting();

  const handleMountError = useCallback((error: Error) => {
    captureError(error, {
      component: componentName,
      lifecycle: 'mount',
      phase: 'componentDidMount'
    });
  }, [captureError, componentName]);

  const handleUpdateError = useCallback((error: Error) => {
    captureError(error, {
      component: componentName,
      lifecycle: 'update',
      phase: 'componentDidUpdate'
    });
  }, [captureError, componentName]);

  const handleUnmountError = useCallback((error: Error) => {
    captureError(error, {
      component: componentName,
      lifecycle: 'unmount',
      phase: 'componentWillUnmount'
    });
  }, [captureError, componentName]);

  const handleEffectError = useCallback((error: Error, effectName?: string) => {
    captureError(error, {
      component: componentName,
      lifecycle: 'effect',
      effectName: effectName || 'unknown'
    });
  }, [captureError, componentName]);

  return {
    handleMountError,
    handleUpdateError,
    handleUnmountError,
    handleEffectError
  };
}

/**
 * Hook for form error handling
 */
export function useFormErrorHandler(formName: string) {
  const { captureError } = useErrorBoundary();
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleFieldError = useCallback((fieldName: string, error: Error | string) => {
    const errorMessage = error instanceof Error ? error.message : error;
    
    setFormErrors(prev => ({
      ...prev,
      [fieldName]: errorMessage
    }));

    if (error instanceof Error) {
      captureError(error, {
        form: formName,
        field: fieldName,
        operation: 'field-validation'
      });
    }
  }, [captureError, formName]);

  const handleSubmitError = useCallback((error: Error) => {
    captureError(error, {
      form: formName,
      operation: 'form-submit'
    });
  }, [captureError, formName]);

  const clearFieldError = useCallback((fieldName: string) => {
    setFormErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setFormErrors({});
  }, []);

  return {
    formErrors,
    handleFieldError,
    handleSubmitError,
    clearFieldError,
    clearAllErrors
  };
}