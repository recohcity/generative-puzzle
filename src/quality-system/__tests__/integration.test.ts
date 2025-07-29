// Integration tests for Quality System

import { QualitySystem } from '../QualitySystem';
import { Task } from '../types';

describe('Quality System Integration', () => {
  let qualitySystem: QualitySystem;

  beforeEach(() => {
    qualitySystem = new QualitySystem();
  });

  afterEach(async () => {
    await qualitySystem.shutdown();
  });

  describe('Task Management', () => {
    it('should create and manage tasks', async () => {
      // Create a task
      const taskData: Partial<Task> = {
        title: 'Test Task',
        description: 'A test task for integration testing',
        priority: 'P1',
        estimatedHours: 4,
        requirements: ['REQ-1.1'],
        acceptanceCriteria: [
          {
            id: 'AC-1',
            description: 'Task should be completable',
            completed: false,
            validationMethod: 'manual'
          }
        ]
      };

      const createdTask = await qualitySystem.createTask(taskData);
      
      expect(createdTask).toBeDefined();
      expect(createdTask.id).toBeDefined();
      expect(createdTask.title).toBe(taskData.title);
      expect(createdTask.status).toBe('not_started');

      // Update task status
      await qualitySystem.updateTaskStatus(createdTask.id, 'in_progress');
      
      // Assign task
      await qualitySystem.assignTask(createdTask.id, 'test-user');

      // Validate completion (should fail since criteria not met)
      const validation = await qualitySystem.validateTaskCompletion(createdTask.id);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should retrieve all tasks', async () => {
      const tasks = await qualitySystem.getAllTasks();
      expect(Array.isArray(tasks)).toBe(true);
    });
  });

  describe('Quality Detection', () => {
    it('should run quality checks', async () => {
      const checks = await qualitySystem.runQualityChecks();
      
      expect(Array.isArray(checks)).toBe(true);
      expect(checks.length).toBeGreaterThan(0);
      
      // Verify all expected check types are present
      const checkTypes = checks.map(c => c.type);
      expect(checkTypes).toContain('typescript');
      expect(checkTypes).toContain('eslint');
      expect(checkTypes).toContain('test-coverage');
      expect(checkTypes).toContain('complexity');
      expect(checkTypes).toContain('duplication');
    });

    it('should generate quality report', async () => {
      const report = await qualitySystem.getQualityReport();
      
      expect(report).toBeDefined();
      expect(typeof report.score).toBe('number');
      expect(Array.isArray(report.issues)).toBe(true);
      expect(Array.isArray(report.suggestions)).toBe(true);
      expect(typeof report.metrics).toBe('object');
    });

    it('should calculate quality score', async () => {
      const score = await qualitySystem.calculateQualityScore();
      
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('System Health', () => {
    it('should report system health', async () => {
      const health = await qualitySystem.getSystemHealth();
      
      expect(health).toBeDefined();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);
      expect(typeof health.services).toBe('object');
      expect(health.lastCheck).toBeInstanceOf(Date);
    });

    it('should provide error statistics', async () => {
      const stats = await qualitySystem.getErrorStatistics();
      
      expect(typeof stats).toBe('object');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid task operations gracefully', async () => {
      // Try to update non-existent task
      await expect(
        qualitySystem.updateTaskStatus('non-existent-id', 'completed')
      ).rejects.toThrow();

      // Try to validate non-existent task
      await expect(
        qualitySystem.validateTaskCompletion('non-existent-id')
      ).rejects.toThrow();
    });
  });
});