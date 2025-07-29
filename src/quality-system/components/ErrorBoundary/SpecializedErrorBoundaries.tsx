// Specialized Error Boundary Components

'use client';

import React from 'react';
import { QualitySystemErrorBoundary, QualitySystemErrorBoundaryProps } from './QualitySystemErrorBoundary';
import { MinimalErrorFallback, LoadingErrorFallback } from './ErrorFallbackUI';

// Dashboard Error Boundary - for dashboard components
export const DashboardErrorBoundary: React.FC<{
  children: React.ReactNode;
  dashboardName?: string;
}> = ({ children, dashboardName = 'Dashboard' }) => (
  <QualitySystemErrorBoundary
    component={`Dashboard-${dashboardName}`}
    enableRetry={true}
    maxRetries={2}
    showErrorDetails={false}
    isolateErrors={true}
    fallback={(error, errorInfo, retry) => (
      <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {dashboardName} 加载失败
          </h3>
          <p className="text-gray-600 mb-4">
            仪表板组件遇到了问题，请尝试刷新或联系支持团队。
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={retry}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              重新加载
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              刷新页面
            </button>
          </div>
        </div>
      </div>
    )}
  >
    {children}
  </QualitySystemErrorBoundary>
);

// Form Error Boundary - for form components
export const FormErrorBoundary: React.FC<{
  children: React.ReactNode;
  formName?: string;
  onFormError?: (error: Error) => void;
}> = ({ children, formName = 'Form', onFormError }) => (
  <QualitySystemErrorBoundary
    component={`Form-${formName}`}
    enableRetry={true}
    maxRetries={1}
    showErrorDetails={false}
    onError={onFormError}
    fallback={(error, errorInfo, retry) => (
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
            <h3 className="text-sm font-medium text-red-800">表单错误</h3>
            <p className="mt-1 text-sm text-red-700">
              {formName} 遇到了问题，请重试或刷新页面。
            </p>
            <div className="mt-2">
              <button
                onClick={retry}
                className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                重试
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  >
    {children}
  </QualitySystemErrorBoundary>
);

// Chart Error Boundary - for chart/visualization components
export const ChartErrorBoundary: React.FC<{
  children: React.ReactNode;
  chartType?: string;
}> = ({ children, chartType = 'Chart' }) => (
  <QualitySystemErrorBoundary
    component={`Chart-${chartType}`}
    enableRetry={true}
    maxRetries={2}
    showErrorDetails={false}
    fallback={(error, errorInfo, retry) => (
      <div className="flex items-center justify-center h-64 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            {chartType} 无法显示
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            图表数据加载失败，请重试。
          </p>
          <button
            onClick={retry}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            重新加载
          </button>
        </div>
      </div>
    )}
  >
    {children}
  </QualitySystemErrorBoundary>
);

// Async Component Error Boundary - for lazy-loaded components
export const AsyncComponentErrorBoundary: React.FC<{
  children: React.ReactNode;
  componentName?: string;
}> = ({ children, componentName = 'Component' }) => {
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    // Reset after a brief delay
    setTimeout(() => {
      setIsRetrying(false);
      window.location.reload();
    }, 1000);
  };

  return (
    <QualitySystemErrorBoundary
      component={`Async-${componentName}`}
      enableRetry={false} // Handle retry manually
      showErrorDetails={false}
      fallback={(error) => (
        <LoadingErrorFallback
          error={error}
          onRetry={handleRetry}
          isRetrying={isRetrying}
        />
      )}
    >
      {children}
    </QualitySystemErrorBoundary>
  );
};

// Page Error Boundary - for entire page components
export const PageErrorBoundary: React.FC<{
  children: React.ReactNode;
  pageName?: string;
}> = ({ children, pageName = 'Page' }) => (
  <QualitySystemErrorBoundary
    component={`Page-${pageName}`}
    enableRetry={true}
    maxRetries={1}
    showErrorDetails={true}
    isolateErrors={false}
    fallback={(error, errorInfo, retry) => (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center p-6">
          <div className="text-red-500 mb-6">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            页面加载失败
          </h1>
          <p className="text-gray-600 mb-6">
            {pageName} 遇到了意外错误。我们已经记录了这个问题，请尝试刷新页面。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={retry}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              重试
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    )}
  >
    {children}
  </QualitySystemErrorBoundary>
);

// Silent Error Boundary - for non-critical components
export const SilentErrorBoundary: React.FC<{
  children: React.ReactNode;
  componentName?: string;
  fallbackContent?: React.ReactNode;
}> = ({ children, componentName = 'Component', fallbackContent }) => (
  <QualitySystemErrorBoundary
    component={`Silent-${componentName}`}
    enableRetry={false}
    showErrorDetails={false}
    logErrors={true}
    fallback={() => fallbackContent || <div className="hidden" />}
  >
    {children}
  </QualitySystemErrorBoundary>
);

// Development Error Boundary - enhanced error details for development
export const DevelopmentErrorBoundary: React.FC<{
  children: React.ReactNode;
  componentName?: string;
}> = ({ children, componentName = 'Component' }) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (!isDevelopment) {
    return <QualitySystemErrorBoundary>{children}</QualitySystemErrorBoundary>;
  }

  return (
    <QualitySystemErrorBoundary
      component={`Dev-${componentName}`}
      enableRetry={true}
      maxRetries={5}
      showErrorDetails={true}
      fallback={(error, errorInfo, retry) => (
        <div className="p-6 bg-red-50 border-2 border-red-200 rounded-lg m-4">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-red-800 mb-2">
              🚨 Development Error in {componentName}
            </h2>
            <div className="bg-red-100 p-3 rounded text-sm">
              <strong>Error:</strong> {error.message}
            </div>
          </div>
          
          {error.stack && (
            <div className="mb-4">
              <strong className="text-red-800">Stack Trace:</strong>
              <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                {error.stack}
              </pre>
            </div>
          )}

          {errorInfo?.componentStack && (
            <div className="mb-4">
              <strong className="text-red-800">Component Stack:</strong>
              <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                {errorInfo.componentStack}
              </pre>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={retry}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Retry Component
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Reload Page
            </button>
          </div>
        </div>
      )}
    >
      {children}
    </QualitySystemErrorBoundary>
  );
};