// Core type definitions for the Code Quality Improvement System

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  BUSINESS_LOGIC_ERROR = 'BUSINESS_LOGIC_ERROR',
  SYSTEM_ERROR = 'SYSTEM_ERROR'
}

export interface QualityScore {
  overall: number;
  architecture: number;
  typescript: number;
  testing: number;
  performance: number;
  errorHandling: number;
  codeComplexity: number;
  duplication: number;
}

export interface QualityTrend {
  date: string;
  score: number;
  version: string;
  improvements: string[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'P0' | 'P1' | 'P2';
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  assignee?: string;
  estimatedHours: number;
  actualHours?: number;
  dependencies: string[];
  requirements: string[];
  acceptanceCriteria: AcceptanceCriteria[];
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
}

export interface AcceptanceCriteria {
  id: string;
  description: string;
  completed: boolean;
  validationMethod: 'manual' | 'automated' | 'test';
  validationScript?: string;
}

export interface QualityCheck {
  type: 'typescript' | 'eslint' | 'test-coverage' | 'complexity' | 'duplication';
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: QualityCheckResult;
  timestamp: Date;
}

export interface QualityCheckResult {
  score: number;
  issues: QualityIssue[];
  suggestions: string[];
  metrics: Record<string, number>;
}

export interface QualityIssue {
  severity: 'error' | 'warning' | 'info';
  file: string;
  line?: number;
  column?: number;
  message: string;
  rule?: string;
  fixable: boolean;
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack: string;
  };
  userId?: string;
  sessionId?: string;
}

export interface ErrorContext {
  component: string;
  action: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
}

export interface ProgressSnapshot {
  timestamp: Date;
  version: string;
  overallScore: number;
  dimensionScores: Record<string, number>;
  completedTasks: number;
  totalTasks: number;
  blockedTasks: number;
  teamVelocity: number;
}

export interface Milestone {
  version: string;
  targetDate: Date;
  targetScore: number;
  requiredTasks: string[];
  status: 'planned' | 'in_progress' | 'completed' | 'delayed';
  completionPercentage: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  completedCriteria: number;
  totalCriteria: number;
}

export interface TaskDependencyGraph {
  nodes: Task[];
  edges: { from: string; to: string }[];
}

export interface Bottleneck {
  taskId: string;
  type: 'dependency' | 'resource' | 'complexity';
  impact: number;
  suggestions: string[];
}

export interface ProgressReport {
  period: { start: Date; end: Date };
  summary: {
    tasksCompleted: number;
    qualityImprovement: number;
    teamVelocity: number;
  };
  milestones: Milestone[];
  bottlenecks: Bottleneck[];
  recommendations: string[];
}

export interface ErrorHandlingStrategy {
  errorType: ErrorType;
  retryable: boolean;
  maxRetries: number;
  backoffStrategy: 'linear' | 'exponential';
  fallbackAction?: () => void;
  userNotification: boolean;
  teamNotification: boolean;
}