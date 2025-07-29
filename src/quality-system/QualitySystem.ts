// Main Quality System API

import { ServiceFactory } from './core/ServiceFactory';
import {
  ITaskManagementService,
  IQualityDetectionEngine,
  ILogger,
  IErrorHandlingService
} from './interfaces';
import {
  Task,
  QualityCheck,
  QualityCheckResult,
  ValidationResult,
  ErrorContext
} from './types';

export class QualitySystem {
  private serviceFactory: ServiceFactory;
  private taskService: ITaskManagementService;
  private qualityEngine: IQualityDetectionEngine;
  private logger: ILogger;
  private errorHandler: IErrorHandlingService;

  constructor() {
    this.serviceFactory = ServiceFactory.getInstance();
    this.taskService = this.serviceFactory.getTaskManagementService();
    this.qualityEngine = this.serviceFactory.getQualityDetectionEngine();
    this.logger = this.serviceFactory.getLogger();
    this.errorHandler = this.serviceFactory.getErrorHandlingService();
    
    this.logger.info('Quality System initialized');
  }

  // Task Management API
  async createTask(taskData: Partial<Task>): Promise<Task> {
    try {
      return await this.taskService.createTask(taskData);
    } catch (error) {
      this.handleError(error as Error, {
        component: 'QualitySystem',
        action: 'createTask',
        severity: 'medium',
        recoverable: true
      });
      throw error;
    }
  }

  async updateTaskStatus(taskId: string, status: Task['status']): Promise<void> {
    try {
      await this.taskService.updateTaskStatus(taskId, status);
    } catch (error) {
      this.handleError(error as Error, {
        component: 'QualitySystem',
        action: 'updateTaskStatus',
        severity: 'medium',
        recoverable: true
      });
      throw error;
    }
  }

  async assignTask(taskId: string, assignee: string): Promise<void> {
    try {
      await this.taskService.assignTask(taskId, assignee);
    } catch (error) {
      this.handleError(error as Error, {
        component: 'QualitySystem',
        action: 'assignTask',
        severity: 'low',
        recoverable: true
      });
      throw error;
    }
  }

  async validateTaskCompletion(taskId: string): Promise<ValidationResult> {
    try {
      return await this.taskService.validateCompletion(taskId);
    } catch (error) {
      this.handleError(error as Error, {
        component: 'QualitySystem',
        action: 'validateTaskCompletion',
        severity: 'high',
        recoverable: false
      });
      throw error;
    }
  }

  async getAllTasks(): Promise<Task[]> {
    try {
      return await this.taskService.getAllTasks();
    } catch (error) {
      this.handleError(error as Error, {
        component: 'QualitySystem',
        action: 'getAllTasks',
        severity: 'medium',
        recoverable: true
      });
      throw error;
    }
  }

  // Quality Detection API
  async runQualityChecks(): Promise<QualityCheck[]> {
    try {
      this.logger.info('Starting quality checks');
      const checks = await this.qualityEngine.runAllChecks();
      this.logger.info('Quality checks completed', { checkCount: checks.length });
      return checks;
    } catch (error) {
      this.handleError(error as Error, {
        component: 'QualitySystem',
        action: 'runQualityChecks',
        severity: 'high',
        recoverable: true
      });
      throw error;
    }
  }

  async getQualityReport(): Promise<QualityCheckResult> {
    try {
      return await this.qualityEngine.getLatestQualityReport();
    } catch (error) {
      this.handleError(error as Error, {
        component: 'QualitySystem',
        action: 'getQualityReport',
        severity: 'medium',
        recoverable: true
      });
      throw error;
    }
  }

  async calculateQualityScore(): Promise<number> {
    try {
      const checks = await this.qualityEngine.runAllChecks();
      return await this.qualityEngine.calculateOverallScore(checks);
    } catch (error) {
      this.handleError(error as Error, {
        component: 'QualitySystem',
        action: 'calculateQualityScore',
        severity: 'medium',
        recoverable: true
      });
      throw error;
    }
  }

  // System Health API
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, boolean>;
    lastCheck: Date;
  }> {
    try {
      this.logger.info('Checking system health');
      
      const services = {
        taskManagement: true,
        qualityDetection: true,
        logging: true,
        errorHandling: true
      };

      // Simple health check - in real implementation would test each service
      const allHealthy = Object.values(services).every(status => status);
      
      return {
        status: allHealthy ? 'healthy' : 'degraded',
        services,
        lastCheck: new Date()
      };
    } catch (error) {
      this.handleError(error as Error, {
        component: 'QualitySystem',
        action: 'getSystemHealth',
        severity: 'critical',
        recoverable: false
      });
      
      return {
        status: 'unhealthy',
        services: {},
        lastCheck: new Date()
      };
    }
  }

  // Utility Methods
  async getErrorStatistics(): Promise<Record<string, number>> {
    try {
      return await this.errorHandler.getErrorStatistics();
    } catch (error) {
      this.logger.error('Failed to get error statistics', error as Error);
      return {};
    }
  }

  private handleError(error: Error, context: ErrorContext): void {
    this.errorHandler.handleError(error, context);
  }

  // Cleanup method
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down Quality System');
    // Perform any necessary cleanup
    this.serviceFactory.clearServices();
  }
}

// Export singleton instance
export const qualitySystem = new QualitySystem();