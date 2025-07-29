// Error Fallback UI Component

'use client';

import React, { useState, ErrorInfo } from 'react';

export interface ErrorFallbackUIProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  maxRetries: number;
  enableRetry: boolean;
  showErrorDetails: boolean;
  onRetry: () => void;
  onReport: () => void;
  component?: string;
  errorId: string | null;
}

export const ErrorFallbackUI: React.FC<ErrorFallbackUIProps> = ({
  error,
  errorInfo,
  retryCount,
  maxRetries,
  enableRetry,
  showErrorDetails,
  onRetry,
  onReport,
  component,
  errorId
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isReporting, setIsReporting] = useState(false);

  const handleReport = async () => {
    setIsReporting(true);
    try {
      await onReport();
    } finally {
      setIsReporting(false);
    }
  };

  const canRetry = enableRetry && retryCount < maxRetries;
  const isMaxRetriesReached = retryCount >= maxRetries;

  return (
    <div className="min-h-[200px] flex items-center justify-center p-6 bg-gray-50 border border-gray-200 rounded-lg">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>

        {/* Error Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {isMaxRetriesReached ? '组件加载失败' : '出现了一些问题'}
        </h3>

        {/* Error Message */}
        <p className="text-gray-600 mb-4">
          {isMaxRetriesReached
            ? `经过 ${maxRetries} 次重试后，组件仍无法正常加载。`
            : '组件遇到了意外错误，但我们正在努力修复。'}
        </p>

        {/* Component Info */}
        {component && (
          <p className="text-sm text-gray-500 mb-4">
            组件: {component}
          </p>
        )}

        {/* Retry Count Info */}
        {retryCount > 0 && (
          <p className="text-sm text-gray-500 mb-4">
            重试次数: {retryCount}/{maxRetries}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
          {canRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              重试 ({maxRetries - retryCount} 次机会)
            </button>
          )}

          <button
            onClick={handleReport}
            disabled={isReporting}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isReporting ? '报告中...' : '报告问题'}
          </button>

          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
          >
            刷新页面
          </button>
        </div>

        {/* Error Details Toggle */}
        {showErrorDetails && (
          <div className="mb-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-gray-500 hover:text-gray-700 underline focus:outline-none"
            >
              {showDetails ? '隐藏' : '显示'}错误详情
            </button>
          </div>
        )}

        {/* Error Details */}
        {showDetails && showErrorDetails && (
          <div className="mt-4 p-4 bg-gray-100 rounded-md text-left">
            <div className="text-sm">
              <div className="mb-2">
                <strong className="text-gray-700">错误ID:</strong>
                <span className="ml-2 font-mono text-xs text-gray-600">{errorId}</span>
              </div>
              
              <div className="mb-2">
                <strong className="text-gray-700">错误消息:</strong>
                <pre className="mt-1 text-xs text-red-600 whitespace-pre-wrap break-words">
                  {error.message}
                </pre>
              </div>

              {error.stack && (
                <div className="mb-2">
                  <strong className="text-gray-700">错误堆栈:</strong>
                  <pre className="mt-1 text-xs text-gray-600 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                    {error.stack.split('\n').slice(0, 5).join('\n')}
                  </pre>
                </div>
              )}

              {errorInfo?.componentStack && (
                <div>
                  <strong className="text-gray-700">组件堆栈:</strong>
                  <pre className="mt-1 text-xs text-gray-600 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                    {errorInfo.componentStack.split('\n').slice(0, 5).join('\n')}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-4 text-xs text-gray-500">
          <p>如果问题持续存在，请联系技术支持团队。</p>
          {errorId && (
            <p className="mt-1">
              请提供错误ID: <span className="font-mono">{errorId}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Minimal Error Fallback for critical errors
export const MinimalErrorFallback: React.FC<{
  error: Error;
  onRetry?: () => void;
}> = ({ error, onRetry }) => (
  <div className="p-4 bg-red-50 border border-red-200 rounded-md">
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <div className="ml-3 flex-1">
        <h3 className="text-sm font-medium text-red-800">组件错误</h3>
        <p className="mt-1 text-sm text-red-700">{error.message}</p>
        {onRetry && (
          <div className="mt-2">
            <button
              onClick={onRetry}
              className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              重试
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
);

// Loading Error Fallback for async components
export const LoadingErrorFallback: React.FC<{
  error: Error;
  onRetry: () => void;
  isRetrying?: boolean;
}> = ({ error, onRetry, isRetrying = false }) => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center">
      {isRetrying ? (
        <>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">重新加载中...</p>
        </>
      ) : (
        <>
          <div className="text-red-500 mb-4">
            <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">加载失败</p>
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            重新加载
          </button>
        </>
      )}
    </div>
  </div>
);