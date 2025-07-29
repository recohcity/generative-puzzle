// Core service interfaces for the Code Quality Improvement System

import {
  Task,
  ValidationResult,
  TaskDependencyGraph,
  QualityCheck,
  QualityCheckResult,
  LogLevel,
  LogEntry,
  ErrorContext,
  ProgressSnapshot,
  Milestone,
  ProgressReport,
  Bottleneck
} from '../types';

export interface ITaskManagementService {
  createTask(taskData: Partial<Task>): Promise<Task>;
  updateTaskStatus(taskId: string, status: Task['status']): Promise<void>;
  assignTask(taskId: string, assignee: string): Promise<void>;
  validateCompletion(taskId: string): Promise<ValidationResult>;
  getDependencyGraph(): Promise<TaskDependencyGraph>;
  getTasksByPriority(priority: Task['priority']): Promise<Task[]>;
  getTaskById(taskId: string): Promise<Task | null>;
  getAllTasks(): Promise<Task[]>;
  deleteTask(taskId: string): Promise<void>;
}

export interface IQualityDetectionEngine {
  runAllChecks(): Promise<QualityCheck[]>;
  runSpecificCheck(type: QualityCheck['type']): Promise<QualityCheck>;
  calculateOverallScore(checks: QualityCheck[]): Promise<number>;
  generateImprovementSuggestions(issues: QualityCheck[]): Promise<string[]>;
  validateTaskCompletion(taskId: string): Promise<boolean>;
  getLatestQualityReport(): Promise<QualityCheckResult>;
}

export interface ILogger {
  debug(message: string, context?: any): void;
  info(message: string, context?: any): void;
  warn(message: string, context?: any): void;
  error(message: string, error?: Error, context?: any): void;
  critical(message: string, error?: Error, context?: any): void;
  getLogHistory(level?: LogLevel, limit?: number): Promise<LogEntry[]>;
  clearLogs(): Promise<void>;
}

export interface IErrorHandlingService {
  handleError(error: Error, context: ErrorContext): void;
  classifyError(error: Error): string;
  attemptRecovery(error: Error, errorType: string): boolean;
  notifyUser(error: Error, severity: string): void;
  reportToTeam(error: Error, context: ErrorContext): void;
  getErrorStatistics(): Promise<Record<string, number>>;
}

export interface IProgressTrackingService {
  captureSnapshot(): Promise<ProgressSnapshot>;
  getMilestoneProgress(version: string): Promise<Milestone>;
  generateProgressReport(startDate: Date, endDate: Date): Promise<ProgressReport>;
  predictCompletion(milestoneVersion: string): Promise<Date>;
  identifyBottlenecks(): Promise<Bottleneck[]>;
  getProgressHistory(days: number): Promise<ProgressSnapshot[]>;
}

export interface INotificationService {
  sendTaskNotification(taskId: string, type: 'assigned' | 'completed' | 'blocked'): Promise<void>;
  sendQualityAlert(message: string, severity: 'low' | 'medium' | 'high'): Promise<void>;
  sendProgressUpdate(milestone: string, progress: number): Promise<void>;
  subscribeToNotifications(userId: string, types: string[]): Promise<void>;
  unsubscribeFromNotifications(userId: string, types: string[]): Promise<void>;
}

export interface IReportGeneratorService {
  generateQualityReport(startDate: Date, endDate: Date): Promise<string>;
  generateTaskReport(taskIds: string[]): Promise<string>;
  generateMilestoneReport(version: string): Promise<string>;
  exportReport(reportId: string, format: 'pdf' | 'html' | 'json'): Promise<Buffer>;
  scheduleReport(type: string, frequency: 'daily' | 'weekly' | 'monthly'): Promise<void>;
}

export interface IDataStorageService {
  saveTask(task: Task): Promise<void>;
  loadTask(taskId: string): Promise<Task | null>;
  saveQualitySnapshot(snapshot: ProgressSnapshot): Promise<void>;
  loadQualitySnapshots(limit: number): Promise<ProgressSnapshot[]>;
  saveLogEntry(entry: LogEntry): Promise<void>;
  loadLogEntries(filter: Partial<LogEntry>, limit: number): Promise<LogEntry[]>;
  cleanup(olderThanDays: number): Promise<void>;
}

export interface IConfigurationService {
  getQualityThresholds(): Record<string, number>;
  setQualityThreshold(metric: string, value: number): Promise<void>;
  getNotificationSettings(): Record<string, boolean>;
  updateNotificationSettings(settings: Record<string, boolean>): Promise<void>;
  getIntegrationSettings(): Record<string, any>;
  updateIntegrationSettings(settings: Record<string, any>): Promise<void>;
}