// Error Boundary Components Main Export

// Core Error Boundary
export {
  QualitySystemErrorBoundary,
  withQualitySystemErrorBoundary,
  useErrorReporting
} from './QualitySystemErrorBoundary';

// Fallback UI Components
export {
  ErrorFallbackUI,
  MinimalErrorFallback,
  LoadingErrorFallback
} from './ErrorFallbackUI';

// Specialized Error Boundaries
export {
  DashboardErrorBoundary,
  FormErrorBoundary,
  ChartErrorBoundary,
  AsyncComponentErrorBoundary,
  PageErrorBoundary,
  SilentErrorBoundary,
  DevelopmentErrorBoundary
} from './SpecializedErrorBoundaries';

// Types
export type {
  QualitySystemErrorBoundaryProps,
  QualitySystemErrorBoundaryState
} from './QualitySystemErrorBoundary';

export type {
  ErrorFallbackUIProps
} from './ErrorFallbackUI';