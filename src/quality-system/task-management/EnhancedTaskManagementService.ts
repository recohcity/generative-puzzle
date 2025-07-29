// Enhanced Task Management Service Implementation

import { ITaskManagementService, ILogger, IDataStorageService } from '../interfaces';
import {
  EnhancedTask,
  TaskStatus,
  TaskPriority,
  TaskType,
  TaskCreationRequest,
  TaskUpdateRequest,
  TaskFilter,
  TaskSort,
  TaskValidationResult,
  WorkloadBalance,
  TaskDependencyGraph,
  TaskStatistics,
  BulkTaskOperation,
  TaskAssignment,
  TaskComment,
  TaskStatusChange,
  TimeEntry,
  AcceptanceCriteria
} from './TaskTypes';
import { ValidationError, BusinessLogicError } from '../error-handling';

export class EnhancedTaskManagementService implements ITaskManagementService {
  private logger: ILogger;
  private storage: IDataStorageService;
  private tasks: Map<string, EnhancedTask> = new Map();
  private taskIndex: Map<string, Set<string>> = new Map(); // For fast lookups

  constructor(logger: ILogger, storage: IDataStorageService) {
    this.logger = logger;
    this.storage = storage;
    this.initializeIndexes();
  }

  // Core CRUD Operations
  async createTask(taskData: TaskCreationRequest): Promise<EnhancedTask> {
    this.logger.info('Creating new task', { title: taskData.title, type: taskData.type });

    // Validate task data
    this.validateTaskCreationRequest(taskData);

    // Generate task ID
    const taskId = this.generateTaskId();

    // Create enhanced task
    const task: EnhancedTask = {
      id: taskId,
      title: taskData.title,
      description: taskData.description,
      type: taskData.type,
      priority: taskData.priority,
      status: TaskStatus.NOT_STARTED,
      
      assignments: [],
      createdBy: 'system', // This would come from auth context
      createdAt: new Date(),
      updatedAt: new Date(),
      
      dependencies: [],
      blockedBy: [],
      blocking: [],
      relatedTasks: [],
      
      requirements: taskData.requirements || [],
      acceptanceCriteria: this.createAcceptanceCriteria(taskData.acceptanceCriteria || []),
      
      timeTracking: {
        estimatedHours: taskData.estimatedHours || 0,
        actualHours: 0,
        remainingHours: taskData.estimatedHours || 0,
        timeEntries: [],
        lastUpdated: new Date()
      },
      
      dueDate: taskData.dueDate,
      completionPercentage: 0,
      
      tags: taskData.tags || [],
      labels: [],
      component: taskData.component || 'general',
      epic: taskData.epic,
      
      metrics: {
        cycleTime: 0,
        leadTime: 0,
        blockedTime: 0,
        reviewTime: 0,
        reworkCount: 0
      },
      
      comments: [],
      statusHistory: [{
        id: this.generateId(),
        fromStatus: TaskStatus.NOT_STARTED,
        toStatus: TaskStatus.NOT_STARTED,
        changedBy: 'system',
        changedAt: new Date(),
        reason: 'Task created'
      }]
    };

    // Handle initial assignments
    if (taskData.assigneeIds && taskData.assigneeIds.length > 0) {
      await this.assignTaskToUsers(task, taskData.assigneeIds);
    }

    // Handle dependencies
    if (taskData.dependencies && taskData.dependencies.length > 0) {
      await this.addTaskDependencies(task, taskData.dependencies);
    }

    // Store task
    this.tasks.set(taskId, task);
    await this.storage.saveTask(task);
    this.updateIndexes(task);

    this.logger.info('Task created successfully', { taskId, title: task.title });
    return task;
  } 
 async updateTask(taskId: string, updateData: TaskUpdateRequest): Promise<EnhancedTask> {
    this.logger.info('Updating task', { taskId, updateData });

    const task = await this.getTaskById(taskId);
    if (!task) {
      throw new ValidationError(`Task with ID ${taskId} not found`);
    }

    const oldStatus = task.status;
    
    // Update basic properties
    if (updateData.title) task.title = updateData.title;
    if (updateData.description) task.description = updateData.description;
    if (updateData.type) task.type = updateData.type;
    if (updateData.priority) task.priority = updateData.priority;
    if (updateData.dueDate !== undefined) task.dueDate = updateData.dueDate;
    if (updateData.tags) task.tags = updateData.tags;
    if (updateData.component) task.component = updateData.component;
    if (updateData.completionPercentage !== undefined) {
      task.completionPercentage = Math.max(0, Math.min(100, updateData.completionPercentage));
    }

    // Handle status change
    if (updateData.status && updateData.status !== oldStatus) {
      await this.changeTaskStatus(task, updateData.status, 'Manual update');
    }

    task.updatedAt = new Date();

    // Save updated task
    this.tasks.set(taskId, task);
    await this.storage.saveTask(task);
    this.updateIndexes(task);

    this.logger.info('Task updated successfully', { taskId, changes: Object.keys(updateData) });
    return task;
  }

  async deleteTask(taskId: string): Promise<void> {
    this.logger.info('Deleting task', { taskId });

    const task = await this.getTaskById(taskId);
    if (!task) {
      throw new ValidationError(`Task with ID ${taskId} not found`);
    }

    // Check if task has dependencies
    if (task.blocking.length > 0) {
      throw new BusinessLogicError(
        `Cannot delete task ${taskId} as it blocks other tasks: ${task.blocking.join(', ')}`
      );
    }

    // Remove from dependencies of other tasks
    for (const dependentTaskId of task.blockedBy) {
      const dependentTask = await this.getTaskById(dependentTaskId);
      if (dependentTask) {
        dependentTask.blocking = dependentTask.blocking.filter(id => id !== taskId);
        await this.storage.saveTask(dependentTask);
      }
    }

    // Remove from storage and memory
    this.tasks.delete(taskId);
    this.removeFromIndexes(task);

    this.logger.info('Task deleted successfully', { taskId });
  }

  async getTaskById(taskId: string): Promise<EnhancedTask | null> {
    let task = this.tasks.get(taskId);
    
    if (!task) {
      // Try loading from storage
      const storedTask = await this.storage.loadTask(taskId);
      if (storedTask) {
        task = storedTask as EnhancedTask;
        this.tasks.set(taskId, task);
        this.updateIndexes(task);
      }
    }
    
    return task || null;
  }

  async getAllTasks(): Promise<EnhancedTask[]> {
    return Array.from(this.tasks.values());
  }

  async getTasksByFilter(filter: TaskFilter, sort?: TaskSort): Promise<EnhancedTask[]> {
    this.logger.debug('Filtering tasks', { filter, sort });

    let tasks = Array.from(this.tasks.values());

    // Apply filters
    if (filter.status && filter.status.length > 0) {
      tasks = tasks.filter(task => filter.status!.includes(task.status));
    }

    if (filter.priority && filter.priority.length > 0) {
      tasks = tasks.filter(task => filter.priority!.includes(task.priority));
    }

    if (filter.type && filter.type.length > 0) {
      tasks = tasks.filter(task => filter.type!.includes(task.type));
    }

    if (filter.assigneeId && filter.assigneeId.length > 0) {
      tasks = tasks.filter(task => 
        task.assignments.some(assignment => 
          filter.assigneeId!.includes(assignment.assigneeId)
        )
      );
    }

    if (filter.component && filter.component.length > 0) {
      tasks = tasks.filter(task => filter.component!.includes(task.component));
    }

    if (filter.tags && filter.tags.length > 0) {
      tasks = tasks.filter(task => 
        filter.tags!.some(tag => task.tags.includes(tag))
      );
    }

    if (filter.dueDateBefore) {
      tasks = tasks.filter(task => 
        task.dueDate && task.dueDate <= filter.dueDateBefore!
      );
    }

    if (filter.dueDateAfter) {
      tasks = tasks.filter(task => 
        task.dueDate && task.dueDate >= filter.dueDateAfter!
      );
    }

    // Apply sorting
    if (sort) {
      tasks.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sort.field) {
          case 'priority':
            aValue = this.getPriorityWeight(a.priority);
            bValue = this.getPriorityWeight(b.priority);
            break;
          case 'dueDate':
            aValue = a.dueDate?.getTime() || Infinity;
            bValue = b.dueDate?.getTime() || Infinity;
            break;
          case 'createdAt':
            aValue = a.createdAt.getTime();
            bValue = b.createdAt.getTime();
            break;
          case 'updatedAt':
            aValue = a.updatedAt.getTime();
            bValue = b.updatedAt.getTime();
            break;
          case 'title':
            aValue = a.title.toLowerCase();
            bValue = b.title.toLowerCase();
            break;
          default:
            return 0;
        }

        if (sort.direction === 'desc') {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        } else {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        }
      });
    }

    return tasks;
  }

  // Task Status Management
  async updateTaskStatus(taskId: string, status: TaskStatus, reason?: string): Promise<void> {
    const task = await this.getTaskById(taskId);
    if (!task) {
      throw new ValidationError(`Task with ID ${taskId} not found`);
    }

    await this.changeTaskStatus(task, status, reason);
  }

  private async changeTaskStatus(task: EnhancedTask, newStatus: TaskStatus, reason?: string): Promise<void> {
    const oldStatus = task.status;
    
    if (oldStatus === newStatus) {
      return; // No change needed
    }

    // Validate status transition
    this.validateStatusTransition(oldStatus, newStatus);

    // Check dependencies for certain status changes
    if (newStatus === TaskStatus.IN_PROGRESS) {
      await this.validateDependenciesForStart(task);
    }

    // Update status
    task.status = newStatus;
    task.updatedAt = new Date();

    // Record status change
    const statusChange: TaskStatusChange = {
      id: this.generateId(),
      fromStatus: oldStatus,
      toStatus: newStatus,
      changedBy: 'system', // This would come from auth context
      changedAt: new Date(),
      reason
    };
    task.statusHistory.push(statusChange);

    // Update metrics based on status change
    this.updateTaskMetrics(task, oldStatus, newStatus);

    // Handle completion
    if (newStatus === TaskStatus.COMPLETED) {
      task.completedAt = new Date();
      task.completionPercentage = 100;
      task.timeTracking.remainingHours = 0;
    }

    // Save task
    await this.storage.saveTask(task);
    this.updateIndexes(task);

    this.logger.info('Task status changed', {
      taskId: task.id,
      fromStatus: oldStatus,
      toStatus: newStatus,
      reason
    });
  }

  // Task Assignment Management
  async assignTask(taskId: string, assigneeId: string, role: 'owner' | 'contributor' | 'reviewer' = 'owner'): Promise<void> {
    const task = await this.getTaskById(taskId);
    if (!task) {
      throw new ValidationError(`Task with ID ${taskId} not found`);
    }

    await this.assignTaskToUser(task, assigneeId, role);
  }

  private async assignTaskToUser(task: EnhancedTask, assigneeId: string, role: 'owner' | 'contributor' | 'reviewer'): Promise<void> {
    // Check if user is already assigned
    const existingAssignment = task.assignments.find(a => a.assigneeId === assigneeId);
    if (existingAssignment) {
      existingAssignment.role = role;
      existingAssignment.assignedAt = new Date();
      return;
    }

    // Create new assignment
    const assignment: TaskAssignment = {
      assigneeId,
      assigneeName: `User ${assigneeId}`, // This would come from user service
      assignedAt: new Date(),
      assignedBy: 'system',
      role,
      workloadPercentage: this.calculateWorkloadPercentage(task, role)
    };

    task.assignments.push(assignment);
    task.updatedAt = new Date();

    // Add comment
    const comment: TaskComment = {
      id: this.generateId(),
      userId: 'system',
      userName: 'System',
      content: `Task assigned to ${assignment.assigneeName} as ${role}`,
      createdAt: new Date(),
      type: 'assignment'
    };
    task.comments.push(comment);

    await this.storage.saveTask(task);
    this.updateIndexes(task);

    this.logger.info('Task assigned', {
      taskId: task.id,
      assigneeId,
      role
    });
  }

  private async assignTaskToUsers(task: EnhancedTask, assigneeIds: string[]): Promise<void> {
    for (const assigneeId of assigneeIds) {
      await this.assignTaskToUser(task, assigneeId, 'contributor');
    }
  }

  // Dependency Management
  async addTaskDependency(taskId: string, dependsOnTaskId: string): Promise<void> {
    const task = await this.getTaskById(taskId);
    const dependsOnTask = await this.getTaskById(dependsOnTaskId);

    if (!task) {
      throw new ValidationError(`Task with ID ${taskId} not found`);
    }
    if (!dependsOnTask) {
      throw new ValidationError(`Dependency task with ID ${dependsOnTaskId} not found`);
    }

    // Check for circular dependencies
    if (await this.wouldCreateCircularDependency(taskId, dependsOnTaskId)) {
      throw new BusinessLogicError(`Adding dependency would create circular dependency`);
    }

    // Add dependency
    if (!task.blockedBy.includes(dependsOnTaskId)) {
      task.blockedBy.push(dependsOnTaskId);
    }
    if (!dependsOnTask.blocking.includes(taskId)) {
      dependsOnTask.blocking.push(taskId);
    }

    // Save both tasks
    await this.storage.saveTask(task);
    await this.storage.saveTask(dependsOnTask);
    this.updateIndexes(task);
    this.updateIndexes(dependsOnTask);

    this.logger.info('Task dependency added', {
      taskId,
      dependsOnTaskId
    });
  }

  private async addTaskDependencies(task: EnhancedTask, dependencyIds: string[]): Promise<void> {
    for (const dependencyId of dependencyIds) {
      await this.addTaskDependency(task.id, dependencyId);
    }
  }

  // Task Validation
  async validateCompletion(taskId: string): Promise<TaskValidationResult> {
    const task = await this.getTaskById(taskId);
    if (!task) {
      throw new ValidationError(`Task with ID ${taskId} not found`);
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    const validationDetails: TaskValidationResult['validationDetails'] = [];
    let completedCriteria = 0;
    const totalCriteria = task.acceptanceCriteria.length;

    // Validate acceptance criteria
    for (const criteria of task.acceptanceCriteria) {
      if (criteria.completed) {
        completedCriteria++;
        validationDetails.push({
          criteriaId: criteria.id,
          status: 'passed',
          message: `Criteria completed: ${criteria.description}`
        });
      } else {
        errors.push(`Acceptance criteria not met: ${criteria.description}`);
        validationDetails.push({
          criteriaId: criteria.id,
          status: 'failed',
          message: `Criteria not completed: ${criteria.description}`
        });
      }
    }

    // Check dependencies
    for (const dependencyId of task.blockedBy) {
      const dependencyTask = await this.getTaskById(dependencyId);
      if (!dependencyTask) {
        errors.push(`Dependency task not found: ${dependencyId}`);
        continue;
      }
      if (dependencyTask.status !== TaskStatus.COMPLETED) {
        errors.push(`Dependency task not completed: ${dependencyTask.title}`);
      }
    }

    // Check if task has any time logged
    if (task.timeTracking.actualHours === 0 && task.timeTracking.estimatedHours > 0) {
      warnings.push('No time has been logged for this task');
    }

    // Check if task is overdue
    if (task.dueDate && task.dueDate < new Date() && task.status !== TaskStatus.COMPLETED) {
      warnings.push('Task is overdue');
    }

    const isValid = errors.length === 0 && completedCriteria === totalCriteria;

    this.logger.info('Task validation completed', {
      taskId,
      isValid,
      completedCriteria,
      totalCriteria,
      errorCount: errors.length,
      warningCount: warnings.length
    });

    return {
      isValid,
      errors,
      warnings,
      completedCriteria,
      totalCriteria,
      validationDetails
    };
  }

  // Workload Balance Management
  async getWorkloadBalance(): Promise<WorkloadBalance[]> {
    this.logger.info('Calculating workload balance');

    const userWorkloads = new Map<string, {
      totalTasks: number;
      activeTasks: number;
      totalEstimatedHours: number;
      totalActualHours: number;
      tasks: EnhancedTask[];
    }>();

    // Collect workload data
    for (const task of this.tasks.values()) {
      for (const assignment of task.assignments) {
        if (!userWorkloads.has(assignment.assigneeId)) {
          userWorkloads.set(assignment.assigneeId, {
            totalTasks: 0,
            activeTasks: 0,
            totalEstimatedHours: 0,
            totalActualHours: 0,
            tasks: []
          });
        }

        const workload = userWorkloads.get(assignment.assigneeId)!;
        workload.totalTasks++;
        workload.tasks.push(task);

        if (task.status === TaskStatus.IN_PROGRESS || task.status === TaskStatus.NOT_STARTED) {
          workload.activeTasks++;
        }

        // Calculate proportional hours based on assignment percentage
        const hoursProportion = assignment.workloadPercentage / 100;
        workload.totalEstimatedHours += task.timeTracking.estimatedHours * hoursProportion;
        workload.totalActualHours += task.timeTracking.actualHours * hoursProportion;
      }
    }

    // Calculate balance metrics
    const balances: WorkloadBalance[] = [];
    for (const [userId, workload] of userWorkloads) {
      const utilizationPercentage = workload.totalEstimatedHours > 0 
        ? (workload.totalActualHours / workload.totalEstimatedHours) * 100 
        : 0;

      let overloadRisk: 'low' | 'medium' | 'high' = 'low';
      const recommendedActions: string[] = [];

      // Determine overload risk
      if (workload.activeTasks > 5) {
        overloadRisk = 'high';
        recommendedActions.push('Consider redistributing some tasks');
      } else if (workload.activeTasks > 3) {
        overloadRisk = 'medium';
        recommendedActions.push('Monitor workload closely');
      }

      if (workload.totalEstimatedHours > 40) {
        overloadRisk = 'high';
        recommendedActions.push('Estimated hours exceed weekly capacity');
      }

      // Check for overdue tasks
      const overdueTasks = workload.tasks.filter(task => 
        task.dueDate && task.dueDate < new Date() && task.status !== TaskStatus.COMPLETED
      );
      if (overdueTasks.length > 0) {
        recommendedActions.push(`${overdueTasks.length} overdue tasks need attention`);
      }

      balances.push({
        userId,
        userName: `User ${userId}`, // This would come from user service
        totalTasks: workload.totalTasks,
        activeTasks: workload.activeTasks,
        totalEstimatedHours: workload.totalEstimatedHours,
        totalActualHours: workload.totalActualHours,
        utilizationPercentage,
        overloadRisk,
        recommendedActions
      });
    }

    return balances.sort((a, b) => b.overloadRisk.localeCompare(a.overloadRisk));
  }

  // Dependency Graph
  async getDependencyGraph(): Promise<TaskDependencyGraph> {
    this.logger.info('Generating dependency graph');

    const tasks = Array.from(this.tasks.values());
    const edges: any[] = [];
    const cycles: string[][] = [];

    // Build edges
    for (const task of tasks) {
      for (const dependencyId of task.blockedBy) {
        edges.push({
          taskId: dependencyId,
          type: 'blocks',
          description: `${dependencyId} blocks ${task.id}`
        });
      }
    }

    // Detect cycles (simplified implementation)
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const detectCycle = (taskId: string, path: string[]): void => {
      if (recursionStack.has(taskId)) {
        const cycleStart = path.indexOf(taskId);
        cycles.push(path.slice(cycleStart));
        return;
      }

      if (visited.has(taskId)) {
        return;
      }

      visited.add(taskId);
      recursionStack.add(taskId);

      const task = this.tasks.get(taskId);
      if (task) {
        for (const dependencyId of task.blockedBy) {
          detectCycle(dependencyId, [...path, taskId]);
        }
      }

      recursionStack.delete(taskId);
    };

    for (const task of tasks) {
      if (!visited.has(task.id)) {
        detectCycle(task.id, []);
      }
    }

    // Calculate critical path (simplified)
    const criticalPath = this.calculateCriticalPath(tasks);

    return {
      nodes: tasks,
      edges,
      cycles,
      criticalPath
    };
  }

  // Statistics and Analytics
  async getTaskStatistics(): Promise<TaskStatistics> {
    const tasks = Array.from(this.tasks.values());
    const now = new Date();

    const stats: TaskStatistics = {
      totalTasks: tasks.length,
      tasksByStatus: {
        [TaskStatus.NOT_STARTED]: 0,
        [TaskStatus.IN_PROGRESS]: 0,
        [TaskStatus.COMPLETED]: 0,
        [TaskStatus.BLOCKED]: 0,
        [TaskStatus.CANCELLED]: 0,
        [TaskStatus.ON_HOLD]: 0
      },
      tasksByPriority: {
        [TaskPriority.P0]: 0,
        [TaskPriority.P1]: 0,
        [TaskPriority.P2]: 0,
        [TaskPriority.P3]: 0
      },
      tasksByType: {
        [TaskType.FEATURE]: 0,
        [TaskType.BUG_FIX]: 0,
        [TaskType.IMPROVEMENT]: 0,
        [TaskType.REFACTORING]: 0,
        [TaskType.DOCUMENTATION]: 0,
        [TaskType.TESTING]: 0,
        [TaskType.RESEARCH]: 0
      },
      averageCycleTime: 0,
      averageLeadTime: 0,
      completionRate: 0,
      blockedTasksCount: 0,
      overdueTasks: 0
    };

    let totalCycleTime = 0;
    let totalLeadTime = 0;
    let completedTasks = 0;

    for (const task of tasks) {
      // Count by status
      stats.tasksByStatus[task.status]++;

      // Count by priority
      stats.tasksByPriority[task.priority]++;

      // Count by type
      stats.tasksByType[task.type]++;

      // Count blocked tasks
      if (task.status === TaskStatus.BLOCKED) {
        stats.blockedTasksCount++;
      }

      // Count overdue tasks
      if (task.dueDate && task.dueDate < now && task.status !== TaskStatus.COMPLETED) {
        stats.overdueTasks++;
      }

      // Calculate cycle and lead times for completed tasks
      if (task.status === TaskStatus.COMPLETED && task.completedAt) {
        completedTasks++;
        totalLeadTime += task.completedAt.getTime() - task.createdAt.getTime();
        
        // Find when task was started
        const startedChange = task.statusHistory.find(change => 
          change.toStatus === TaskStatus.IN_PROGRESS
        );
        if (startedChange) {
          totalCycleTime += task.completedAt.getTime() - startedChange.changedAt.getTime();
        }
      }
    }

    // Calculate averages
    if (completedTasks > 0) {
      stats.averageCycleTime = totalCycleTime / completedTasks / (1000 * 60 * 60 * 24); // days
      stats.averageLeadTime = totalLeadTime / completedTasks / (1000 * 60 * 60 * 24); // days
      stats.completionRate = (completedTasks / tasks.length) * 100;
    }

    return stats;
  }

  // Bulk Operations
  async performBulkOperation(operation: BulkTaskOperation): Promise<void> {
    this.logger.info('Performing bulk operation', { 
      operation: operation.operation, 
      taskCount: operation.taskIds.length 
    });

    for (const taskId of operation.taskIds) {
      try {
        switch (operation.operation) {
          case 'update_status':
            await this.updateTaskStatus(taskId, operation.parameters.status, 'Bulk update');
            break;
          case 'assign':
            await this.assignTask(taskId, operation.parameters.assigneeId, operation.parameters.role);
            break;
          case 'add_tags':
            const task = await this.getTaskById(taskId);
            if (task) {
              task.tags = [...new Set([...task.tags, ...operation.parameters.tags])];
              await this.storage.saveTask(task);
            }
            break;
          case 'set_priority':
            await this.updateTask(taskId, { priority: operation.parameters.priority });
            break;
          case 'delete':
            await this.deleteTask(taskId);
            break;
        }
      } catch (error) {
        this.logger.error(`Bulk operation failed for task ${taskId}`, error as Error);
      }
    }
  }

  // Helper Methods
  private validateTaskCreationRequest(taskData: TaskCreationRequest): void {
    if (!taskData.title || taskData.title.trim().length === 0) {
      throw new ValidationError('Task title is required');
    }
    if (!taskData.description || taskData.description.trim().length === 0) {
      throw new ValidationError('Task description is required');
    }
    if (taskData.estimatedHours && taskData.estimatedHours < 0) {
      throw new ValidationError('Estimated hours cannot be negative');
    }
  }

  private validateStatusTransition(fromStatus: TaskStatus, toStatus: TaskStatus): void {
    const validTransitions: Record<TaskStatus, TaskStatus[]> = {
      [TaskStatus.NOT_STARTED]: [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED, TaskStatus.ON_HOLD],
      [TaskStatus.IN_PROGRESS]: [TaskStatus.COMPLETED, TaskStatus.BLOCKED, TaskStatus.ON_HOLD, TaskStatus.CANCELLED],
      [TaskStatus.BLOCKED]: [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
      [TaskStatus.ON_HOLD]: [TaskStatus.NOT_STARTED, TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
      [TaskStatus.COMPLETED]: [], // Completed tasks cannot change status
      [TaskStatus.CANCELLED]: []  // Cancelled tasks cannot change status
    };

    if (!validTransitions[fromStatus].includes(toStatus)) {
      throw new BusinessLogicError(
        `Invalid status transition from ${fromStatus} to ${toStatus}`
      );
    }
  }

  private async validateDependenciesForStart(task: EnhancedTask): Promise<void> {
    for (const dependencyId of task.blockedBy) {
      const dependencyTask = await this.getTaskById(dependencyId);
      if (!dependencyTask) {
        throw new ValidationError(`Dependency task ${dependencyId} not found`);
      }
      if (dependencyTask.status !== TaskStatus.COMPLETED) {
        throw new BusinessLogicError(
          `Cannot start task ${task.id} because dependency ${dependencyTask.title} is not completed`
        );
      }
    }
  }

  private async wouldCreateCircularDependency(taskId: string, dependsOnTaskId: string): Promise<boolean> {
    const visited = new Set<string>();
    const stack = [dependsOnTaskId];

    while (stack.length > 0) {
      const currentId = stack.pop()!;
      
      if (currentId === taskId) {
        return true; // Circular dependency found
      }

      if (visited.has(currentId)) {
        continue;
      }

      visited.add(currentId);
      const currentTask = await this.getTaskById(currentId);
      if (currentTask) {
        stack.push(...currentTask.blockedBy);
      }
    }

    return false;
  }

  // Additional helper methods
  private initializeIndexes(): void {
    this.taskIndex.set('status', new Set());
    this.taskIndex.set('priority', new Set());
    this.taskIndex.set('type', new Set());
    this.taskIndex.set('assignee', new Set());
    this.taskIndex.set('component', new Set());
  }

  private updateIndexes(task: EnhancedTask): void {
    // Update status index
    this.taskIndex.get('status')?.add(`${task.status}:${task.id}`);
    
    // Update priority index
    this.taskIndex.get('priority')?.add(`${task.priority}:${task.id}`);
    
    // Update type index
    this.taskIndex.get('type')?.add(`${task.type}:${task.id}`);
    
    // Update assignee index
    for (const assignment of task.assignments) {
      this.taskIndex.get('assignee')?.add(`${assignment.assigneeId}:${task.id}`);
    }
    
    // Update component index
    this.taskIndex.get('component')?.add(`${task.component}:${task.id}`);
  }

  private removeFromIndexes(task: EnhancedTask): void {
    // Remove from all indexes
    for (const [indexName, indexSet] of this.taskIndex) {
      const toRemove = Array.from(indexSet).filter(entry => entry.endsWith(`:${task.id}`));
      toRemove.forEach(entry => indexSet.delete(entry));
    }
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createAcceptanceCriteria(criteriaData: Omit<AcceptanceCriteria, 'id' | 'completed' | 'validatedAt' | 'validatedBy'>[]): AcceptanceCriteria[] {
    return criteriaData.map(criteria => ({
      ...criteria,
      id: this.generateId(),
      completed: false
    }));
  }

  private getPriorityWeight(priority: TaskPriority): number {
    const weights = {
      [TaskPriority.P0]: 4,
      [TaskPriority.P1]: 3,
      [TaskPriority.P2]: 2,
      [TaskPriority.P3]: 1
    };
    return weights[priority];
  }

  private calculateWorkloadPercentage(task: EnhancedTask, role: 'owner' | 'contributor' | 'reviewer'): number {
    const roleWeights = {
      owner: 60,
      contributor: 30,
      reviewer: 10
    };
    return roleWeights[role];
  }

  private updateTaskMetrics(task: EnhancedTask, oldStatus: TaskStatus, newStatus: TaskStatus): void {
    const now = new Date();
    
    // Update cycle time when task is completed
    if (newStatus === TaskStatus.COMPLETED) {
      const startedChange = task.statusHistory.find(change => 
        change.toStatus === TaskStatus.IN_PROGRESS
      );
      if (startedChange) {
        task.metrics.cycleTime = now.getTime() - startedChange.changedAt.getTime();
      }
      task.metrics.leadTime = now.getTime() - task.createdAt.getTime();
    }

    // Update blocked time
    if (oldStatus === TaskStatus.BLOCKED) {
      const blockedChange = task.statusHistory
        .slice()
        .reverse()
        .find(change => change.toStatus === TaskStatus.BLOCKED);
      if (blockedChange) {
        task.metrics.blockedTime += now.getTime() - blockedChange.changedAt.getTime();
      }
    }

    // Update rework count
    if (oldStatus === TaskStatus.COMPLETED && newStatus !== TaskStatus.COMPLETED) {
      task.metrics.reworkCount++;
    }
  }

  private calculateCriticalPath(tasks: EnhancedTask[]): string[] {
    // Simplified critical path calculation
    // In a real implementation, this would use proper CPM algorithm
    const taskMap = new Map(tasks.map(task => [task.id, task]));
    const visited = new Set<string>();
    const longestPath: string[] = [];

    const findLongestPath = (taskId: string, currentPath: string[]): string[] => {
      if (visited.has(taskId)) {
        return currentPath;
      }

      visited.add(taskId);
      const task = taskMap.get(taskId);
      if (!task) {
        return currentPath;
      }

      const newPath = [...currentPath, taskId];
      let longest = newPath;

      for (const dependencyId of task.blocking) {
        const path = findLongestPath(dependencyId, newPath);
        if (path.length > longest.length) {
          longest = path;
        }
      }

      return longest;
    };

    // Find the longest path from all root tasks (tasks with no dependencies)
    for (const task of tasks) {
      if (task.blockedBy.length === 0) {
        visited.clear();
        const path = findLongestPath(task.id, []);
        if (path.length > longestPath.length) {
          longestPath.splice(0, longestPath.length, ...path);
        }
      }
    }

    return longestPath;
  }

  // Time tracking methods
  async addTimeEntry(taskId: string, timeEntry: Omit<TimeEntry, 'id'>): Promise<void> {
    const task = await this.getTaskById(taskId);
    if (!task) {
      throw new ValidationError(`Task with ID ${taskId} not found`);
    }

    const entry: TimeEntry = {
      ...timeEntry,
      id: this.generateId()
    };

    task.timeTracking.timeEntries.push(entry);
    task.timeTracking.actualHours += entry.duration / 60; // Convert minutes to hours
    task.timeTracking.remainingHours = Math.max(0, 
      task.timeTracking.estimatedHours - task.timeTracking.actualHours
    );
    task.timeTracking.lastUpdated = new Date();
    task.updatedAt = new Date();

    await this.storage.saveTask(task);
    this.updateIndexes(task);

    this.logger.info('Time entry added', {
      taskId,
      duration: entry.duration,
      type: entry.type
    });
  }

  async addComment(taskId: string, comment: Omit<TaskComment, 'id' | 'createdAt'>): Promise<void> {
    const task = await this.getTaskById(taskId);
    if (!task) {
      throw new ValidationError(`Task with ID ${taskId} not found`);
    }

    const newComment: TaskComment = {
      ...comment,
      id: this.generateId(),
      createdAt: new Date()
    };

    task.comments.push(newComment);
    task.updatedAt = new Date();

    await this.storage.saveTask(task);
    this.updateIndexes(task);

    this.logger.info('Comment added to task', {
      taskId,
      commentType: newComment.type,
      userId: newComment.userId
    });
  }

  async updateAcceptanceCriteria(taskId: string, criteriaId: string, completed: boolean, validatedBy?: string): Promise<void> {
    const task = await this.getTaskById(taskId);
    if (!task) {
      throw new ValidationError(`Task with ID ${taskId} not found`);
    }

    const criteria = task.acceptanceCriteria.find(c => c.id === criteriaId);
    if (!criteria) {
      throw new ValidationError(`Acceptance criteria with ID ${criteriaId} not found`);
    }

    criteria.completed = completed;
    if (completed) {
      criteria.validatedBy = validatedBy || 'system';
      criteria.validatedAt = new Date();
    } else {
      criteria.validatedBy = undefined;
      criteria.validatedAt = undefined;
    }

    // Update task completion percentage based on completed criteria
    const completedCount = task.acceptanceCriteria.filter(c => c.completed).length;
    task.completionPercentage = (completedCount / task.acceptanceCriteria.length) * 100;
    task.updatedAt = new Date();

    await this.storage.saveTask(task);
    this.updateIndexes(task);

    this.logger.info('Acceptance criteria updated', {
      taskId,
      criteriaId,
      completed,
      completionPercentage: task.completionPercentage
    });
  }}
