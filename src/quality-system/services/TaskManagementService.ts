// Task Management Service Implementation

import { 
  ITaskManagementService,
  ILogger,
  IDataStorageService 
} from '../interfaces';
import {
  Task,
  ValidationResult,
  TaskDependencyGraph
} from '../types';

export class TaskManagementService implements ITaskManagementService {
  private logger: ILogger;
  private storage: IDataStorageService;

  constructor(logger: ILogger, storage: IDataStorageService) {
    this.logger = logger;
    this.storage = storage;
  }

  async createTask(taskData: Partial<Task>): Promise<Task> {
    this.logger.info('Creating new task', { taskData });
    
    const task: Task = {
      id: this.generateTaskId(),
      title: taskData.title || '',
      description: taskData.description || '',
      priority: taskData.priority || 'P2',
      status: 'not_started',
      estimatedHours: taskData.estimatedHours || 0,
      dependencies: taskData.dependencies || [],
      requirements: taskData.requirements || [],
      acceptanceCriteria: taskData.acceptanceCriteria || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...taskData
    };

    await this.storage.saveTask(task);
    this.logger.info('Task created successfully', { taskId: task.id });
    
    return task;
  }

  async updateTaskStatus(taskId: string, status: Task['status']): Promise<void> {
    this.logger.info('Updating task status', { taskId, status });
    
    const task = await this.storage.loadTask(taskId);
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found`);
    }

    task.status = status;
    task.updatedAt = new Date();
    
    await this.storage.saveTask(task);
    this.logger.info('Task status updated successfully', { taskId, status });
  }

  async assignTask(taskId: string, assignee: string): Promise<void> {
    this.logger.info('Assigning task', { taskId, assignee });
    
    const task = await this.storage.loadTask(taskId);
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found`);
    }

    task.assignee = assignee;
    task.updatedAt = new Date();
    
    await this.storage.saveTask(task);
    this.logger.info('Task assigned successfully', { taskId, assignee });
  }

  async validateCompletion(taskId: string): Promise<ValidationResult> {
    this.logger.info('Validating task completion', { taskId });
    
    const task = await this.storage.loadTask(taskId);
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found`);
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    let completedCriteria = 0;
    const totalCriteria = task.acceptanceCriteria.length;

    // Validate acceptance criteria
    for (const criteria of task.acceptanceCriteria) {
      if (criteria.completed) {
        completedCriteria++;
      } else {
        errors.push(`Acceptance criteria not met: ${criteria.description}`);
      }
    }

    // Check dependencies
    const dependencyTasks = await Promise.all(
      task.dependencies.map(depId => this.storage.loadTask(depId))
    );

    for (const depTask of dependencyTasks) {
      if (!depTask) {
        errors.push('Dependency task not found');
        continue;
      }
      if (depTask.status !== 'completed') {
        errors.push(`Dependency task not completed: ${depTask.title}`);
      }
    }

    const isValid = errors.length === 0 && completedCriteria === totalCriteria;
    
    this.logger.info('Task validation completed', { 
      taskId, 
      isValid, 
      completedCriteria, 
      totalCriteria 
    });

    return {
      isValid,
      errors,
      warnings,
      completedCriteria,
      totalCriteria
    };
  }

  async getDependencyGraph(): Promise<TaskDependencyGraph> {
    this.logger.info('Generating dependency graph');
    
    const tasks = await this.getAllTasks();
    const edges: { from: string; to: string }[] = [];

    for (const task of tasks) {
      for (const depId of task.dependencies) {
        edges.push({ from: depId, to: task.id });
      }
    }

    return {
      nodes: tasks,
      edges
    };
  }

  async getTasksByPriority(priority: Task['priority']): Promise<Task[]> {
    this.logger.info('Getting tasks by priority', { priority });
    
    const allTasks = await this.getAllTasks();
    return allTasks.filter(task => task.priority === priority);
  }

  async getTaskById(taskId: string): Promise<Task | null> {
    return await this.storage.loadTask(taskId);
  }

  async getAllTasks(): Promise<Task[]> {
    // This would be implemented based on the storage service
    // For now, return empty array as placeholder
    return [];
  }

  async deleteTask(taskId: string): Promise<void> {
    this.logger.info('Deleting task', { taskId });
    
    const task = await this.storage.loadTask(taskId);
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found`);
    }

    // Implementation would depend on storage service
    this.logger.info('Task deleted successfully', { taskId });
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}