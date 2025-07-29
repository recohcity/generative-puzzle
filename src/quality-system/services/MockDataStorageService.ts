/**
 * Mock Data Storage Service
 * 
 * A mock implementation of IDataStorageService for testing and development purposes.
 * This service stores data in memory and provides basic CRUD operations.
 */

import { IDataStorageService, ILogger } from '../interfaces';
import { Task, ProgressSnapshot, LogEntry } from '../types';
import { EnhancedTask } from '../task-management/TaskTypes';

export class MockDataStorageService implements IDataStorageService {
  private tasks: Map<string, Task | EnhancedTask> = new Map();
  private qualitySnapshots: ProgressSnapshot[] = [];
  private logEntries: LogEntry[] = [];
  private logger?: ILogger;

  constructor(logger?: ILogger) {
    this.logger = logger;
  }

  async saveTask(task: Task | EnhancedTask): Promise<void> {
    this.tasks.set(task.id, { ...task });
    this.logger?.debug('Task saved to mock storage', { taskId: task.id, title: task.title });
  }

  async loadTask(taskId: string): Promise<Task | EnhancedTask | null> {
    const task = this.tasks.get(taskId);
    if (task) {
      this.logger?.debug('Task loaded from mock storage', { taskId, title: task.title });
      return { ...task };
    }
    this.logger?.debug('Task not found in mock storage', { taskId });
    return null;
  }

  async saveQualitySnapshot(snapshot: ProgressSnapshot): Promise<void> {
    this.qualitySnapshots.push({ ...snapshot });
    this.logger?.debug('Quality snapshot saved to mock storage', { 
      timestamp: snapshot.timestamp,
      overallScore: snapshot.overallScore 
    });
  }

  async loadQualitySnapshots(limit: number): Promise<ProgressSnapshot[]> {
    const snapshots = this.qualitySnapshots
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
      .map(snapshot => ({ ...snapshot }));
    
    this.logger?.debug('Quality snapshots loaded from mock storage', { 
      count: snapshots.length,
      limit 
    });
    
    return snapshots;
  }

  async saveLogEntry(entry: LogEntry): Promise<void> {
    this.logEntries.push({ ...entry });
    // Don't log this to avoid infinite recursion
  }

  async loadLogEntries(filter: Partial<LogEntry>, limit: number): Promise<LogEntry[]> {
    let filteredEntries = this.logEntries;

    // Apply filters
    if (filter.level !== undefined) {
      filteredEntries = filteredEntries.filter(entry => entry.level === filter.level);
    }
    if (filter.userId) {
      filteredEntries = filteredEntries.filter(entry => entry.userId === filter.userId);
    }
    if (filter.sessionId) {
      filteredEntries = filteredEntries.filter(entry => entry.sessionId === filter.sessionId);
    }

    const entries = filteredEntries
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
      .map(entry => ({ ...entry }));

    this.logger?.debug('Log entries loaded from mock storage', { 
      count: entries.length,
      limit,
      filter 
    });

    return entries;
  }

  async cleanup(olderThanDays: number): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    // Clean up old quality snapshots
    const originalSnapshotCount = this.qualitySnapshots.length;
    this.qualitySnapshots = this.qualitySnapshots.filter(
      snapshot => snapshot.timestamp > cutoffDate
    );

    // Clean up old log entries
    const originalLogCount = this.logEntries.length;
    this.logEntries = this.logEntries.filter(
      entry => entry.timestamp > cutoffDate
    );

    this.logger?.info('Mock storage cleanup completed', {
      olderThanDays,
      snapshotsRemoved: originalSnapshotCount - this.qualitySnapshots.length,
      logEntriesRemoved: originalLogCount - this.logEntries.length
    });
  }

  // Additional utility methods for testing
  getAllTasks(): (Task | EnhancedTask)[] {
    return Array.from(this.tasks.values()).map(task => ({ ...task }));
  }

  getTaskCount(): number {
    return this.tasks.size;
  }

  getSnapshotCount(): number {
    return this.qualitySnapshots.length;
  }

  getLogEntryCount(): number {
    return this.logEntries.length;
  }

  clear(): void {
    this.tasks.clear();
    this.qualitySnapshots.length = 0;
    this.logEntries.length = 0;
    this.logger?.debug('Mock storage cleared');
  }

  // Simulate database operations with delays (optional)
  private async simulateDelay(ms: number = 10): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}