// Service Factory for Quality System

import {
  ITaskManagementService,
  IQualityDetectionEngine,
  ILogger,
  IErrorHandlingService,
  IProgressTrackingService,
  INotificationService,
  IReportGeneratorService,
  IDataStorageService,
  IConfigurationService
} from '../interfaces';

import { TaskManagementService } from '../services/TaskManagementService';
import { QualityDetectionEngine } from '../services/QualityDetectionEngine';
import { Logger } from '../services/Logger';
import { ErrorHandlingService } from '../services/ErrorHandlingService';
import { AdvancedErrorHandlingService } from '../error-handling/AdvancedErrorHandlingService';

// Mock implementations for services not yet created
class MockDataStorageService implements IDataStorageService {
  private tasks = new Map();
  private snapshots: any[] = [];
  private logs: any[] = [];

  async saveTask(task: any): Promise<void> {
    this.tasks.set(task.id, task);
  }

  async loadTask(taskId: string): Promise<any> {
    return this.tasks.get(taskId) || null;
  }

  async saveQualitySnapshot(snapshot: any): Promise<void> {
    this.snapshots.push(snapshot);
  }

  async loadQualitySnapshots(limit: number): Promise<any[]> {
    return this.snapshots.slice(-limit);
  }

  async saveLogEntry(entry: any): Promise<void> {
    this.logs.push(entry);
  }

  async loadLogEntries(filter: any, limit: number): Promise<any[]> {
    return this.logs.slice(-limit);
  }

  async cleanup(olderThanDays: number): Promise<void> {
    // Mock cleanup implementation
  }
}

class MockNotificationService implements INotificationService {
  async sendTaskNotification(taskId: string, type: 'assigned' | 'completed' | 'blocked'): Promise<void> {
    console.log(`Task notification: ${type} for task ${taskId}`);
  }

  async sendQualityAlert(message: string, severity: 'low' | 'medium' | 'high'): Promise<void> {
    console.log(`Quality alert [${severity}]: ${message}`);
  }

  async sendProgressUpdate(milestone: string, progress: number): Promise<void> {
    console.log(`Progress update: ${milestone} - ${progress}%`);
  }

  async subscribeToNotifications(userId: string, types: string[]): Promise<void> {
    console.log(`User ${userId} subscribed to: ${types.join(', ')}`);
  }

  async unsubscribeFromNotifications(userId: string, types: string[]): Promise<void> {
    console.log(`User ${userId} unsubscribed from: ${types.join(', ')}`);
  }
}

export class ServiceFactory {
  private static instance: ServiceFactory;
  private services: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory();
    }
    return ServiceFactory.instance;
  }

  getTaskManagementService(): ITaskManagementService {
    if (!this.services.has('taskManagement')) {
      const logger = this.getLogger();
      const storage = this.getDataStorageService();
      this.services.set('taskManagement', new TaskManagementService(logger, storage));
    }
    return this.services.get('taskManagement');
  }

  getQualityDetectionEngine(): IQualityDetectionEngine {
    if (!this.services.has('qualityDetection')) {
      const logger = this.getLogger();
      const storage = this.getDataStorageService();
      this.services.set('qualityDetection', new QualityDetectionEngine(logger, storage));
    }
    return this.services.get('qualityDetection');
  }

  getLogger(): ILogger {
    if (!this.services.has('logger')) {
      const storage = this.getDataStorageService();
      this.services.set('logger', new Logger(storage));
    }
    return this.services.get('logger');
  }

  getErrorHandlingService(): IErrorHandlingService {
    if (!this.services.has('errorHandling')) {
      const logger = this.getLogger();
      const notificationService = this.getNotificationService();
      this.services.set('errorHandling', new AdvancedErrorHandlingService(logger, notificationService));
    }
    return this.services.get('errorHandling');
  }

  getDataStorageService(): IDataStorageService {
    if (!this.services.has('dataStorage')) {
      this.services.set('dataStorage', new MockDataStorageService());
    }
    return this.services.get('dataStorage');
  }

  getNotificationService(): INotificationService {
    if (!this.services.has('notification')) {
      this.services.set('notification', new MockNotificationService());
    }
    return this.services.get('notification');
  }

  // Placeholder methods for services to be implemented later
  getProgressTrackingService(): IProgressTrackingService {
    throw new Error('ProgressTrackingService not yet implemented');
  }

  getReportGeneratorService(): IReportGeneratorService {
    throw new Error('ReportGeneratorService not yet implemented');
  }

  getConfigurationService(): IConfigurationService {
    throw new Error('ConfigurationService not yet implemented');
  }

  // Method to clear all services (useful for testing)
  clearServices(): void {
    this.services.clear();
  }
}