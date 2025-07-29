// Error Boundary Demo Component

'use client';

import React, { useState } from 'react';
import {
  QualitySystemErrorBoundary,
  DashboardErrorBoundary,
  FormErrorBoundary,
  ChartErrorBoundary,
  DevelopmentErrorBoundary
} from '../index';
import { useErrorBoundary, useAsyncErrorHandler, useEventErrorHandler } from '../useErrorBoundary';

// Component that throws errors for testing
const ErrorThrowingComponent: React.FC<{
  errorType: 'render' | 'async' | 'event' | 'none';
  errorMessage?: string;
}> = ({ errorType, errorMessage = 'Test error' }) => {
  const [count, setCount] = useState(0);
  const { handleAsync } = useAsyncErrorHandler();
  const { wrapEventHandler } = useEventErrorHandler();

  // Render error
  if (errorType === 'render') {
    throw new Error(errorMessage);
  }

  // Async error
  const handleAsyncError = async () => {
    await handleAsync(async () => {
      throw new Error('Async operation failed');
    }, { operation: 'demo-async' });
  };

  // Event handler error
  const handleEventError = wrapEventHandler(() => {
    throw new Error('Event handler error');
  }, { operation: 'demo-event' });

  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">测试组件</h3>
      <div className="space-y-2">
        <p>计数器: {count}</p>
        <div className="flex gap-2">
          <button
            onClick={() => setCount(c => c + 1)}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            增加计数
          </button>
          <button
            onClick={handleAsyncError}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
          >
            触发异步错误
          </button>
          <button
            onClick={handleEventError}
            className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            触发事件错误
          </button>
        </div>
      </div>
    </div>
  );
};

// Manual error boundary demo
const ManualErrorBoundaryDemo: React.FC = () => {
  const { hasError, error, captureError, clearError } = useErrorBoundary();

  const triggerManualError = () => {
    const error = new Error('手动触发的错误');
    captureError(error, {
      component: 'ManualErrorBoundaryDemo',
      trigger: 'manual-button'
    });
  };

  if (hasError && error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-semibold text-red-800 mb-2">手动错误捕获</h3>
        <p className="text-red-700 mb-4">错误: {error.message}</p>
        <button
          onClick={clearError}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          清除错误
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">手动错误边界</h3>
      <p className="text-gray-600 mb-4">
        使用 useErrorBoundary hook 手动捕获和处理错误。
      </p>
      <button
        onClick={triggerManualError}
        className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
      >
        触发手动错误
      </button>
    </div>
  );
};

// Main demo component
export const ErrorBoundaryDemo: React.FC = () => {
  const [selectedDemo, setSelectedDemo] = useState<string>('basic');
  const [errorType, setErrorType] = useState<'render' | 'async' | 'event' | 'none'>('none');

  const demos = [
    { id: 'basic', name: '基础错误边界', component: 'QualitySystemErrorBoundary' },
    { id: 'dashboard', name: '仪表板错误边界', component: 'DashboardErrorBoundary' },
    { id: 'form', name: '表单错误边界', component: 'FormErrorBoundary' },
    { id: 'chart', name: '图表错误边界', component: 'ChartErrorBoundary' },
    { id: 'development', name: '开发错误边界', component: 'DevelopmentErrorBoundary' },
    { id: 'manual', name: '手动错误边界', component: 'useErrorBoundary' }
  ];

  const renderDemo = () => {
    const ErrorBoundaryWrapper = ({ children }: { children: React.ReactNode }) => {
      switch (selectedDemo) {
        case 'dashboard':
          return <DashboardErrorBoundary dashboardName="演示仪表板">{children}</DashboardErrorBoundary>;
        case 'form':
          return <FormErrorBoundary formName="演示表单">{children}</FormErrorBoundary>;
        case 'chart':
          return <ChartErrorBoundary chartType="演示图表">{children}</ChartErrorBoundary>;
        case 'development':
          return <DevelopmentErrorBoundary componentName="演示组件">{children}</DevelopmentErrorBoundary>;
        case 'manual':
          return <>{children}</>;
        default:
          return (
            <QualitySystemErrorBoundary
              component="演示组件"
              enableRetry={true}
              maxRetries={3}
              showErrorDetails={true}
            >
              {children}
            </QualitySystemErrorBoundary>
          );
      }
    };

    if (selectedDemo === 'manual') {
      return <ManualErrorBoundaryDemo />;
    }

    return (
      <ErrorBoundaryWrapper>
        <ErrorThrowingComponent errorType={errorType} />
      </ErrorBoundaryWrapper>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          错误边界演示
        </h1>
        <p className="text-gray-600">
          演示不同类型的错误边界组件和错误处理功能。
        </p>
      </div>

      {/* Demo Selection */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">选择演示类型</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {demos.map((demo) => (
            <button
              key={demo.id}
              onClick={() => setSelectedDemo(demo.id)}
              className={`p-3 text-left border rounded-lg transition-colors ${
                selectedDemo === demo.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">{demo.name}</div>
              <div className="text-sm text-gray-500">{demo.component}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Error Type Selection */}
      {selectedDemo !== 'manual' && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">错误类型</h2>
          <div className="flex gap-3">
            {[
              { type: 'none' as const, name: '正常', color: 'bg-green-600' },
              { type: 'render' as const, name: '渲染错误', color: 'bg-red-600' },
              { type: 'async' as const, name: '异步错误', color: 'bg-orange-600' },
              { type: 'event' as const, name: '事件错误', color: 'bg-yellow-600' }
            ].map((option) => (
              <button
                key={option.type}
                onClick={() => setErrorType(option.type)}
                className={`px-4 py-2 text-white rounded transition-colors ${
                  errorType === option.type
                    ? option.color
                    : 'bg-gray-400 hover:bg-gray-500'
                }`}
              >
                {option.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Demo Area */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">演示区域</h2>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          {renderDemo()}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">使用说明</h3>
        <div className="text-blue-700 space-y-2">
          <p>• <strong>基础错误边界</strong>: 标准的错误边界，支持重试和错误报告</p>
          <p>• <strong>仪表板错误边界</strong>: 专为仪表板组件设计的错误边界</p>
          <p>• <strong>表单错误边界</strong>: 专为表单组件设计的错误边界</p>
          <p>• <strong>图表错误边界</strong>: 专为图表组件设计的错误边界</p>
          <p>• <strong>开发错误边界</strong>: 开发环境下显示详细错误信息</p>
          <p>• <strong>手动错误边界</strong>: 使用 Hook 手动捕获和处理错误</p>
        </div>
      </div>
    </div>
  );
};