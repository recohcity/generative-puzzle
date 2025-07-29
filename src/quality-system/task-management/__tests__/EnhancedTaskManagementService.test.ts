/**
 * Enhanced Task Management Service Tests
 * 
 * Comprehensive test suite for the EnhancedTaskManagementService
 */

import { EnhancedTaskManagementService } from '../EnhancedTaskManagementService';
import { TaskType, TaskPriority, TaskStatus } from '../TaskTypes';
import { AdvancedLogger } from '../../logging/AdvancedLogger';
import { MockDataStorageService } from '../../services/MockDataStorageService';
import { ValidationError, BusinessLogicError } from '../../error-handling';

describe('EnhancedTaskManagementService', () => {
  let taskService: EnhancedTaskManagementService;
  let logger: AdvancedLogger;
  let storage: MockDataStorageService;

  beforeEach(() => {
    logger = AdvancedLogger.getInstance();
    storage = new MockDataStorageService();
    taskService = new EnhancedTaskManagementService(logger, storage);
  });

  describe('Task Creation', () => {
    it('should create a task with all required fields', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        type: TaskType.FEATURE,
        priority: TaskPriority.P1,
        estimatedHours: 8,
        requirements: ['REQ-1.1'],
        acceptanceCriteria: [
          {
            description: 'Feature should work correctly',
            validationMethod: 'automated' as const,
            validationScript: 'npm test'
          }
        ],
        tags: ['test'],
        component: 'test-component'
      };

      const task = await taskService.createTask(taskData);

      expect(task.id).toBeDefined();
      expect(task.title).toBe(taskData.title);
      expect(task.description).toBe(taskData.description);
      expect(task.type).toBe(taskData.type);
      expect(task.priority).toBe(taskData.priority);
      expect(task.status).toBe(TaskStatus.NOT_STARTED);
      expect(task.timeTracking.estimatedHours).toBe(taskData.estimatedHours);
      expect(task.requirements).toEqual(taskData.requirements);
      expect(task.acceptanceCriteria).toHaveLength(1);
      expect(task.acceptanceCriteria[0].description).toBe(taskData.acceptanceCriteria[0].description);
      expect(task.acceptanceCriteria[0].completed).toBe(false);
      expect(task.tags).toEqual(taskData.tags);
      expect(task.component).toBe(taskData.component);
      expect(task.completionPercentage).toBe(0);
    });

    it('should throw validation error for missing title', async () => {
      const taskData = {
        title: '',
        description: 'Test Description',
        type: TaskType.FEATURE,
        priority: TaskPriority.P1
      };

      await expect(taskService.createTask(taskData)).rejects.toThrow(ValidationError);
    });

    it('should throw validation error for missing description', async () => {
      const taskData = {
        title: 'Test Task',
        description: '',
        type: TaskType.FEATURE,
        priority: TaskPriority.P1
      };

      await expect(taskService.createTask(taskData)).rejects.toThrow(ValidationError);
    });

    it('should throw validation error for negative estimated hours', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        type: TaskType.FEATURE,
        priority: TaskPriority.P1,
        estimatedHours: -5
      };

      await expect(taskService.createTask(taskData)).rejects.toThrow(ValidationError);
    });
  });

  describe('Task Retrieval', () => {
    let taskId: string;

    beforeEach(async () => {
      const task = await taskService.createTask({
        title: 'Test Task',
        description: 'Test Description',
        type: TaskType.FEATURE,
        priority: TaskPriority.P1
      });
      taskId = task.id;
    });

    it('should retrieve task by ID', async () => {
      const task = await taskService.getTaskById(taskId);
      expect(task).toBeDefined();
      expect(task!.id).toBe(taskId);
      expect(task!.title).toBe('Test Task');
    });

    it('should return null for non-existent task', async () => {
      const task = await taskService.getTaskById('non-existent-id');
      expect(task).toBeNull();
    });

    it('should retrieve all tasks', async () => {
      const tasks = await taskService.getAllTasks();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe(taskId);
    });
  });

  describe('Task Updates', () => {
    let taskId: string;

    beforeEach(async () => {
      const task = await taskService.createTask({
        title: 'Test Task',
        description: 'Test Description',
        type: TaskType.FEATURE,
        priority: TaskPriority.P1
      });
      taskId = task.id;
    });

    it('should update task properties', async () => {
      const updateData = {
        title: 'Updated Task',
        priority: TaskPriority.P0,
        completionPercentage: 50
      };

      const updatedTask = await taskService.updateTask(taskId, updateData);

      expect(updatedTask.title).toBe(updateData.title);
      expect(updatedTask.priority).toBe(updateData.priority);
      expect(updatedTask.completionPercentage).toBe(updateData.completionPercentage);
    });

    it('should throw error for non-existent task', async () => {
      await expect(
        taskService.updateTask('non-existent-id', { title: 'Updated' })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('Task Status Management', () => {
    let taskId: string;

    beforeEach(async () => {
      const task = await taskService.createTask({
        title: 'Test Task',
        description: 'Test Description',
        type: TaskType.FEATURE,
        priority: TaskPriority.P1
      });
      taskId = task.id;
    });

    it('should update task status', async () => {
      await taskService.updateTaskStatus(taskId, TaskStatus.IN_PROGRESS, 'Starting work');

      const task = await taskService.getTaskById(taskId);
      expect(task!.status).toBe(TaskStatus.IN_PROGRESS);
      expect(task!.statusHistory).toHaveLength(2); // Initial + update
      expect(task!.statusHistory[1].toStatus).toBe(TaskStatus.IN_PROGRESS);
      expect(task!.statusHistory[1].reason).toBe('Starting work');
    });

    it('should validate status transitions', async () => {
      // Try to go from NOT_STARTED to COMPLETED (invalid transition)
      await expect(
        taskService.updateTaskStatus(taskId, TaskStatus.COMPLETED, 'Invalid transition')
      ).rejects.toThrow(BusinessLogicError);
    });

    it('should update completion percentage and date when completed', async () => {
      // First move to in progress, then complete
      await taskService.updateTaskStatus(taskId, TaskStatus.IN_PROGRESS);
      await taskService.updateTaskStatus(taskId, TaskStatus.COMPLETED);

      const task = await taskService.getTaskById(taskId);
      expect(task!.status).toBe(TaskStatus.COMPLETED);
      expect(task!.completionPercentage).toBe(100);
      expect(task!.completedAt).toBeDefined();
      expect(task!.timeTracking.remainingHours).toBe(0);
    });
  });

  describe('Task Assignment', () => {
    let taskId: string;

    beforeEach(async () => {
      const task = await taskService.createTask({
        title: 'Test Task',
        description: 'Test Description',
        type: TaskType.FEATURE,
        priority: TaskPriority.P1
      });
      taskId = task.id;
    });

    it('should assign task to user', async () => {
      await taskService.assignTask(taskId, 'user-001', 'owner');

      const task = await taskService.getTaskById(taskId);
      expect(task!.assignments).toHaveLength(1);
      expect(task!.assignments[0].assigneeId).toBe('user-001');
      expect(task!.assignments[0].role).toBe('owner');
      expect(task!.assignments[0].workloadPercentage).toBe(60); // Owner gets 60%
    });

    it('should update existing assignment role', async () => {
      await taskService.assignTask(taskId, 'user-001', 'owner');
      await taskService.assignTask(taskId, 'user-001', 'contributor');

      const task = await taskService.getTaskById(taskId);
      expect(task!.assignments).toHaveLength(1);
      expect(task!.assignments[0].role).toBe('contributor');
    });

    it('should add comment when assigning task', async () => {
      await taskService.assignTask(taskId, 'user-001', 'owner');

      const task = await taskService.getTaskById(taskId);
      expect(task!.comments).toHaveLength(1);
      expect(task!.comments[0].type).toBe('assignment');
    });
  });

  describe('Task Dependencies', () => {
    let task1Id: string;
    let task2Id: string;

    beforeEach(async () => {
      const task1 = await taskService.createTask({
        title: 'Task 1',
        description: 'First task',
        type: TaskType.FEATURE,
        priority: TaskPriority.P1
      });
      task1Id = task1.id;

      const task2 = await taskService.createTask({
        title: 'Task 2',
        description: 'Second task',
        type: TaskType.FEATURE,
        priority: TaskPriority.P1
      });
      task2Id = task2.id;
    });

    it('should add task dependency', async () => {
      await taskService.addTaskDependency(task2Id, task1Id);

      const task1 = await taskService.getTaskById(task1Id);
      const task2 = await taskService.getTaskById(task2Id);

      expect(task1!.blocking).toContain(task2Id);
      expect(task2!.blockedBy).toContain(task1Id);
    });

    it('should prevent starting task with incomplete dependencies', async () => {
      await taskService.addTaskDependency(task2Id, task1Id);

      await expect(
        taskService.updateTaskStatus(task2Id, TaskStatus.IN_PROGRESS)
      ).rejects.toThrow(BusinessLogicError);
    });

    it('should allow starting task after dependencies are completed', async () => {
      await taskService.addTaskDependency(task2Id, task1Id);

      // Complete task 1
      await taskService.updateTaskStatus(task1Id, TaskStatus.IN_PROGRESS);
      await taskService.updateTaskStatus(task1Id, TaskStatus.COMPLETED);

      // Now task 2 should be able to start
      await taskService.updateTaskStatus(task2Id, TaskStatus.IN_PROGRESS);

      const task2 = await taskService.getTaskById(task2Id);
      expect(task2!.status).toBe(TaskStatus.IN_PROGRESS);
    });
  });

  describe('Task Filtering', () => {
    beforeEach(async () => {
      // Create multiple tasks with different properties
      await taskService.createTask({
        title: 'High Priority Feature',
        description: 'Important feature',
        type: TaskType.FEATURE,
        priority: TaskPriority.P0,
        tags: ['important']
      });

      await taskService.createTask({
        title: 'Bug Fix',
        description: 'Fix critical bug',
        type: TaskType.BUG_FIX,
        priority: TaskPriority.P1,
        tags: ['bug']
      });

      await taskService.createTask({
        title: 'Documentation',
        description: 'Update docs',
        type: TaskType.DOCUMENTATION,
        priority: TaskPriority.P2,
        tags: ['docs']
      });
    });

    it('should filter tasks by priority', async () => {
      const highPriorityTasks = await taskService.getTasksByFilter({
        priority: [TaskPriority.P0, TaskPriority.P1]
      });

      expect(highPriorityTasks).toHaveLength(2);
      expect(highPriorityTasks.every(task => 
        task.priority === TaskPriority.P0 || task.priority === TaskPriority.P1
      )).toBe(true);
    });

    it('should filter tasks by type', async () => {
      const featureTasks = await taskService.getTasksByFilter({
        type: [TaskType.FEATURE]
      });

      expect(featureTasks).toHaveLength(1);
      expect(featureTasks[0].type).toBe(TaskType.FEATURE);
    });

    it('should filter tasks by tags', async () => {
      const bugTasks = await taskService.getTasksByFilter({
        tags: ['bug']
      });

      expect(bugTasks).toHaveLength(1);
      expect(bugTasks[0].tags).toContain('bug');
    });

    it('should sort tasks by priority', async () => {
      const tasks = await taskService.getTasksByFilter({}, {
        field: 'priority',
        direction: 'desc'
      });

      expect(tasks).toHaveLength(3);
      expect(tasks[0].priority).toBe(TaskPriority.P0);
      expect(tasks[1].priority).toBe(TaskPriority.P1);
      expect(tasks[2].priority).toBe(TaskPriority.P2);
    });
  });

  describe('Task Validation', () => {
    let taskId: string;

    beforeEach(async () => {
      const task = await taskService.createTask({
        title: 'Test Task',
        description: 'Test Description',
        type: TaskType.FEATURE,
        priority: TaskPriority.P1,
        acceptanceCriteria: [
          {
            description: 'Criteria 1',
            validationMethod: 'manual'
          },
          {
            description: 'Criteria 2',
            validationMethod: 'automated'
          }
        ]
      });
      taskId = task.id;
    });

    it('should validate incomplete task', async () => {
      const result = await taskService.validateCompletion(taskId);

      expect(result.isValid).toBe(false);
      expect(result.completedCriteria).toBe(0);
      expect(result.totalCriteria).toBe(2);
      expect(result.errors).toHaveLength(2);
    });

    it('should validate completed task', async () => {
      const task = await taskService.getTaskById(taskId);
      
      // Complete all acceptance criteria
      for (const criteria of task!.acceptanceCriteria) {
        await taskService.updateAcceptanceCriteria(taskId, criteria.id, true, 'test-user');
      }

      const result = await taskService.validateCompletion(taskId);

      expect(result.isValid).toBe(true);
      expect(result.completedCriteria).toBe(2);
      expect(result.totalCriteria).toBe(2);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Time Tracking', () => {
    let taskId: string;

    beforeEach(async () => {
      const task = await taskService.createTask({
        title: 'Test Task',
        description: 'Test Description',
        type: TaskType.FEATURE,
        priority: TaskPriority.P1,
        estimatedHours: 8
      });
      taskId = task.id;
    });

    it('should add time entry', async () => {
      await taskService.addTimeEntry(taskId, {
        userId: 'user-001',
        userName: 'Test User',
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        endTime: new Date(),
        duration: 120, // 2 hours in minutes
        description: 'Development work',
        type: 'development'
      });

      const task = await taskService.getTaskById(taskId);
      expect(task!.timeTracking.timeEntries).toHaveLength(1);
      expect(task!.timeTracking.actualHours).toBe(2);
      expect(task!.timeTracking.remainingHours).toBe(6);
    });
  });

  describe('Task Statistics', () => {
    beforeEach(async () => {
      // Create tasks with different statuses
      const task1 = await taskService.createTask({
        title: 'Completed Task',
        description: 'Done',
        type: TaskType.FEATURE,
        priority: TaskPriority.P1
      });

      const task2 = await taskService.createTask({
        title: 'In Progress Task',
        description: 'Working',
        type: TaskType.BUG_FIX,
        priority: TaskPriority.P0
      });

      // Complete task 1
      await taskService.updateTaskStatus(task1.id, TaskStatus.IN_PROGRESS);
      await taskService.updateTaskStatus(task1.id, TaskStatus.COMPLETED);

      // Start task 2
      await taskService.updateTaskStatus(task2.id, TaskStatus.IN_PROGRESS);
    });

    it('should calculate task statistics', async () => {
      const stats = await taskService.getTaskStatistics();

      expect(stats.totalTasks).toBe(2);
      expect(stats.tasksByStatus[TaskStatus.COMPLETED]).toBe(1);
      expect(stats.tasksByStatus[TaskStatus.IN_PROGRESS]).toBe(1);
      expect(stats.tasksByPriority[TaskPriority.P0]).toBe(1);
      expect(stats.tasksByPriority[TaskPriority.P1]).toBe(1);
      expect(stats.tasksByType[TaskType.FEATURE]).toBe(1);
      expect(stats.tasksByType[TaskType.BUG_FIX]).toBe(1);
      expect(stats.completionRate).toBe(50);
    });
  });

  describe('Workload Balance', () => {
    beforeEach(async () => {
      // Create tasks and assign them
      const task1 = await taskService.createTask({
        title: 'Task 1',
        description: 'First task',
        type: TaskType.FEATURE,
        priority: TaskPriority.P1,
        estimatedHours: 8
      });

      const task2 = await taskService.createTask({
        title: 'Task 2',
        description: 'Second task',
        type: TaskType.FEATURE,
        priority: TaskPriority.P1,
        estimatedHours: 16
      });

      await taskService.assignTask(task1.id, 'user-001', 'owner');
      await taskService.assignTask(task2.id, 'user-001', 'contributor');
      await taskService.assignTask(task2.id, 'user-002', 'owner');
    });

    it('should calculate workload balance', async () => {
      const balance = await taskService.getWorkloadBalance();

      expect(balance).toHaveLength(2);
      
      const user1Balance = balance.find(b => b.userId === 'user-001');
      const user2Balance = balance.find(b => b.userId === 'user-002');

      expect(user1Balance).toBeDefined();
      expect(user2Balance).toBeDefined();

      expect(user1Balance!.totalTasks).toBe(2);
      expect(user2Balance!.totalTasks).toBe(1);

      // User 1: 60% of 8 hours + 30% of 16 hours = 4.8 + 4.8 = 9.6 hours
      expect(user1Balance!.totalEstimatedHours).toBe(9.6);
      
      // User 2: 60% of 16 hours = 9.6 hours
      expect(user2Balance!.totalEstimatedHours).toBe(9.6);
    });
  });
});