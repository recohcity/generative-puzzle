// Error Boundary Tests

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  QualitySystemErrorBoundary,
  DashboardErrorBoundary,
  FormErrorBoundary,
  withQualitySystemErrorBoundary
} from '../index';

// Mock the service factory
jest.mock('../../../core/ServiceFactory', () => ({
  ServiceFactory: {
    getInstance: () => ({
      getErrorHandlingService: () => ({
        handleError: jest.fn(),
        reportToTeam: jest.fn()
      }),
      getLogger: () => ({
        error: jest.fn(),
        info: jest.fn()
      })
    })
  }
}));

// Test component that throws errors
const ThrowError: React.FC<{ shouldThrow?: boolean; message?: string }> = ({ 
  shouldThrow = false, 
  message = 'Test error' 
}) => {
  if (shouldThrow) {
    throw new Error(message);
  }
  return <div>No error</div>;
};

// Test component for HOC
const TestComponent: React.FC<{ text: string }> = ({ text }) => (
  <div>{text}</div>
);

describe('QualitySystemErrorBoundary', () => {
  // Suppress console.error for cleaner test output
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children when there is no error', () => {
    render(
      <QualitySystemErrorBoundary>
        <ThrowError shouldThrow={false} />
      </QualitySystemErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should catch and display error when child component throws', () => {
    render(
      <QualitySystemErrorBoundary>
        <ThrowError shouldThrow={true} message="Test error message" />
      </QualitySystemErrorBoundary>
    );

    expect(screen.getByText(/出现了一些问题/)).toBeInTheDocument();
  });

  it('should show retry button when retry is enabled', () => {
    render(
      <QualitySystemErrorBoundary enableRetry={true} maxRetries={3}>
        <ThrowError shouldThrow={true} />
      </QualitySystemErrorBoundary>
    );

    expect(screen.getByText(/重试/)).toBeInTheDocument();
  });

  it('should show component name when provided', () => {
    render(
      <QualitySystemErrorBoundary component="TestComponent">
        <ThrowError shouldThrow={true} />
      </QualitySystemErrorBoundary>
    );

    expect(screen.getByText(/组件: TestComponent/)).toBeInTheDocument();
  });

  it('should use custom fallback when provided', () => {
    const customFallback = (error: Error) => (
      <div>Custom error: {error.message}</div>
    );

    render(
      <QualitySystemErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} message="Custom test error" />
      </QualitySystemErrorBoundary>
    );

    expect(screen.getByText('Custom error: Custom test error')).toBeInTheDocument();
  });

  it('should call onError callback when error occurs', () => {
    const onError = jest.fn();

    render(
      <QualitySystemErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} message="Callback test error" />
      </QualitySystemErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    );
  });

  it('should show error details when enabled', () => {
    render(
      <QualitySystemErrorBoundary showErrorDetails={true}>
        <ThrowError shouldThrow={true} message="Details test error" />
      </QualitySystemErrorBoundary>
    );

    expect(screen.getByText(/显示错误详情/)).toBeInTheDocument();
  });

  it('should handle retry functionality', async () => {
    let shouldThrow = true;
    const RetryTestComponent = () => {
      if (shouldThrow) {
        throw new Error('Retry test error');
      }
      return <div>Retry successful</div>;
    };

    render(
      <QualitySystemErrorBoundary enableRetry={true} maxRetries={3}>
        <RetryTestComponent />
      </QualitySystemErrorBoundary>
    );

    // Error should be displayed
    expect(screen.getByText(/出现了一些问题/)).toBeInTheDocument();

    // Fix the error condition
    shouldThrow = false;

    // Click retry button
    const retryButton = screen.getByText(/重试/);
    fireEvent.click(retryButton);

    // Wait for retry to complete
    await waitFor(() => {
      expect(screen.getByText('Retry successful')).toBeInTheDocument();
    }, { timeout: 1000 });
  });
});

describe('Specialized Error Boundaries', () => {
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  it('should render DashboardErrorBoundary with custom styling', () => {
    render(
      <DashboardErrorBoundary dashboardName="Test Dashboard">
        <ThrowError shouldThrow={true} />
      </DashboardErrorBoundary>
    );

    expect(screen.getByText(/Test Dashboard 加载失败/)).toBeInTheDocument();
  });

  it('should render FormErrorBoundary with form-specific styling', () => {
    render(
      <FormErrorBoundary formName="Test Form">
        <ThrowError shouldThrow={true} />
      </FormErrorBoundary>
    );

    expect(screen.getByText(/表单错误/)).toBeInTheDocument();
  });
});

describe('withQualitySystemErrorBoundary HOC', () => {
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  it('should wrap component with error boundary', () => {
    const WrappedComponent = withQualitySystemErrorBoundary(TestComponent, {
      component: 'HOC-Test'
    });

    render(<WrappedComponent text="HOC test" />);

    expect(screen.getByText('HOC test')).toBeInTheDocument();
  });

  it('should catch errors in wrapped component', () => {
    const ErrorComponent: React.FC = () => {
      throw new Error('HOC error test');
    };

    const WrappedErrorComponent = withQualitySystemErrorBoundary(ErrorComponent, {
      component: 'HOC-Error-Test'
    });

    render(<WrappedErrorComponent />);

    expect(screen.getByText(/出现了一些问题/)).toBeInTheDocument();
  });
});

describe('Error Boundary Props', () => {
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  it('should respect maxRetries prop', () => {
    render(
      <QualitySystemErrorBoundary enableRetry={true} maxRetries={1}>
        <ThrowError shouldThrow={true} />
      </QualitySystemErrorBoundary>
    );

    expect(screen.getByText(/重试 \(1 次机会\)/)).toBeInTheDocument();
  });

  it('should disable retry when enableRetry is false', () => {
    render(
      <QualitySystemErrorBoundary enableRetry={false}>
        <ThrowError shouldThrow={true} />
      </QualitySystemErrorBoundary>
    );

    expect(screen.queryByText(/重试/)).not.toBeInTheDocument();
  });

  it('should show report button', () => {
    render(
      <QualitySystemErrorBoundary>
        <ThrowError shouldThrow={true} />
      </QualitySystemErrorBoundary>
    );

    expect(screen.getByText(/报告问题/)).toBeInTheDocument();
  });

  it('should show refresh page button', () => {
    render(
      <QualitySystemErrorBoundary>
        <ThrowError shouldThrow={true} />
      </QualitySystemErrorBoundary>
    );

    expect(screen.getByText(/刷新页面/)).toBeInTheDocument();
  });
});