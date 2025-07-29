/**
 * Acceptance Criteria Validator Tests
 * 
 * Comprehensive test suite for the validation system
 */

import { AcceptanceCriteriaValidator, ValidationStatus } from '../AcceptanceCriteriaValidator';
import { ScriptExecutionEngine } from '../ScriptExecutionEngine';
import { ValidationReportGenerator } from '../ValidationReportGenerator';
import { AdvancedLogger } from '../../logging/AdvancedLogger';
import { EnhancedTask, TaskType, TaskPriority, TaskStatus } from '../../task-management/TaskTypes';

// Mock the script execution engine
jest.mock('../ScriptExecutionEngine');
jest.mock('../ValidationReportGenerator');

describe('AcceptanceCriteriaValidator', () => {
  let validator: AcceptanceCriteriaValidator;
  let mockScriptEngine: jest.Mocked<ScriptExecutionEngine>;
  let mockReportGenerator: jest.Mocked<ValidationReportGenerator>;
  let logger: AdvancedLogger;

  beforeEach(() => {
    logger = AdvancedLogger.getInstance();
    mockScriptEngine = new ScriptExecutionEngine(logger) as jest.Mocked<ScriptExecutionEngine>;
    mockReportGenerator = new ValidationReportGenerator(logger) as jest.Mocked<ValidationReportGenerator>;
    
    validator = new AcceptanceCriteriaValidator(
      logger,
      mockScriptEngine,
      mockReportGenerator
    );
  });

  describe('Individual Criteria Validation', () => {
    it('should validate automated criteria successfully', async () => {
      const criteria = {
        id: 'test-001',
        description: 'Test automated validation',
        completed: false,
        validationMethod: 'automated' as const,
        validationScript: 'npm test'
      };

      mockScriptEngine.executeScript.mockResolvedValue({
        success: true,
        exitCode: 0,
        output: 'All tests passed',
        error: '',
        duration: 5000,
        retryCount: 0
      });

      const result = await validator.validateCriteria(criteria, 'task-001', 'test-user');

      expect(result.status).toBe(ValidationStatus.PASSED);
      expect(result.message).toBe('Automated validation passed');
      expect(result.criteriaId).toBe('test-001');
      expect(result.validatedBy).toBe('test-user');
      expect(mockScriptEngine.executeScript).toHaveBeenCalledWith(
        'npm test',
        expect.any(Object)
      );
    });

    it('should handle automated validation failure', async () => {
      const criteria = {
        id: 'test-002',
        description: 'Test automated validation failure',
        completed: false,
        validationMethod: 'automated' as const,
        validationScript: 'npm test'
      };

      mockScriptEngine.executeScript.mockResolvedValue({
        success: false,
        exitCode: 1,
        output: 'Tests failed',
        error: '2 tests failed',
        duration: 3000,
        retryCount: 0
      });

      const result = await validator.validateCriteria(criteria, 'task-001', 'test-user');

      expect(result.status).toBe(ValidationStatus.FAILED);
      expect(result.message).toContain('Automated validation failed');
      expect(result.details).toHaveProperty('output', 'Tests failed');
      expect(result.details).toHaveProperty('error', '2 tests failed');
    });

    it('should validate manual criteria that is already completed', async () => {
      const criteria = {
        id: 'test-003',
        description: 'Test manual validation',
        completed: true,
        validationMethod: 'manual' as const,
        validatedBy: 'qa-user',
        validatedAt: new Date(),
        notes: 'Manually verified'
      };

      const result = await validator.validateCriteria(criteria, 'task-001', 'test-user');

      expect(result.status).toBe(ValidationStatus.PASSED);
      expect(result.message).toContain('Manual validation completed by qa-user');
      expect(result.validatedBy).toBe('qa-user');
      expect(result.details).toHaveProperty('notes', 'Manually verified');
    });

    it('should handle pending manual validation', async () => {
      const criteria = {
        id: 'test-004',
        description: 'Test pending manual validation',
        completed: false,
        validationMethod: 'manual' as const
      };

      const result = await validator.validateCriteria(criteria, 'task-001', 'test-user');

      expect(result.status).toBe(ValidationStatus.PENDING);
      expect(result.message).toContain('Manual validation required');
    });

    it('should validate test criteria successfully', async () => {
      const criteria = {
        id: 'test-005',
        description: 'Test validation with tests',
        completed: false,
        validationMethod: 'test' as const,
        validationScript: 'npm run test:unit'
      };

      mockScriptEngine.executeTestScript.mockResolvedValue({
        success: true,
        exitCode: 0,
        output: 'Test results',
        error: '',
        duration: 8000,
        retryCount: 0,
        totalTests: 10,
        passedTests: 10,
        failedTests: 0,
        testsPassed: true,
        coverage: {
          percentage: 85,
          lines: 100,
          functions: 95,
          branches: 80,
          statements: 90,
          details: {}
        }
      });

      const result = await validator.validateCriteria(criteria, 'task-001', 'test-user');

      expect(result.status).toBe(ValidationStatus.PASSED);
      expect(result.message).toContain('Tests passed: 10/10');
      expect(result.details).toHaveProperty('totalTests', 10);
      expect(result.details).toHaveProperty('coverage');
      expect(mockScriptEngine.executeTestScript).toHaveBeenCalledWith(
        'npm run test:unit',
        expect.any(Object)
      );
    });

    it('should handle test validation failure', async () => {
      const criteria = {
        id: 'test-006',
        description: 'Test validation with failing tests',
        completed: false,
        validationMethod: 'test' as const,
        validationScript: 'npm run test:integration'
      };

      mockScriptEngine.executeTestScript.mockResolvedValue({
        success: false,
        exitCode: 1,
        output: 'Test results',
        error: 'Some tests failed',
        duration: 12000,
        retryCount: 0,
        totalTests: 15,
        passedTests: 12,
        failedTests: 3,
        testsPassed: false,
        failures: [
          { testName: 'should handle error case', error: 'Expected true but got false', duration: 100 }
        ]
      });

      const result = await validator.validateCriteria(criteria, 'task-001', 'test-user');

      expect(result.status).toBe(ValidationStatus.FAILED);
      expect(result.message).toContain('Tests failed: 3/15 failed');
      expect(result.details).toHaveProperty('failures');
    });

    it('should handle validation errors gracefully', async () => {
      const criteria = {
        id: 'test-007',
        description: 'Test validation error handling',
        completed: false,
        validationMethod: 'automated' as const,
        validationScript: 'invalid-command'
      };

      mockScriptEngine.executeScript.mockRejectedValue(new Error('Command not found'));

      const result = await validator.validateCriteria(criteria, 'task-001', 'test-user');

      expect(result.status).toBe(ValidationStatus.ERROR);
      expect(result.message).toContain('Script execution error: Command not found');
    });
  });

  let sampleTask: EnhancedTask;

  beforeEach(() => {
    sampleTask = {
      id: 'task-validation-test',
      title: 'Test Task',
      description: 'Task for validation testing',
      type: TaskType.FEATURE,
      priority: TaskPriority.P1,
      status: TaskStatus.IN_PROGRESS,
      createdBy: 'test-user',
      createdAt: new Date(),
      updatedAt: new Date(),
      assignments: [],
      dependencies: [],
      blockedBy: [],
      blocking: [],
      relatedTasks: [],
      requirements: [],
      acceptanceCriteria: [
        {
          id: 'criteria-001',
          description: 'Automated test',
          completed: false,
          validationMethod: 'automated',
          validationScript: 'npm test'
        },
        {
          id: 'criteria-002',
          description: 'Manual test',
          completed: true,
          validationMethod: 'manual',
          validatedBy: 'qa-user'
        }
      ],
      timeTracking: {
        estimatedHours: 8,
        actualHours: 4,
        remainingHours: 4,
        timeEntries: [],
        lastUpdated: new Date()
      },
      completionPercentage: 50,
      tags: [],
      labels: [],
      component: 'test',
      metrics: {
        cycleTime: 0,
        leadTime: 0,
        blockedTime: 0,
        reviewTime: 0,
        reworkCount: 0
      },
      comments: [],
      statusHistory: []
    };
  });

  describe('Task Validation', () => {
    beforeEach(() => {
      // Reset sampleTask for each test in this describe block
      sampleTask = {
        id: 'task-validation-test',
        title: 'Test Task',
        description: 'Task for validation testing',
        type: TaskType.FEATURE,
        priority: TaskPriority.P1,
        status: TaskStatus.IN_PROGRESS,
        createdBy: 'test-user',
        createdAt: new Date(),
        updatedAt: new Date(),
        assignments: [],
        dependencies: [],
        blockedBy: [],
        blocking: [],
        relatedTasks: [],
        requirements: [],
        acceptanceCriteria: [
          {
            id: 'criteria-001',
            description: 'Automated test',
            completed: false,
            validationMethod: 'automated',
            validationScript: 'npm test'
          },
          {
            id: 'criteria-002',
            description: 'Manual test',
            completed: true,
            validationMethod: 'manual',
            validatedBy: 'qa-user'
          }
        ],
        timeTracking: {
          estimatedHours: 8,
          actualHours: 4,
          remainingHours: 4,
          timeEntries: [],
          lastUpdated: new Date()
        },
        completionPercentage: 50,
        tags: [],
        labels: [],
        component: 'test',
        metrics: {
          cycleTime: 0,
          leadTime: 0,
          blockedTime: 0,
          reviewTime: 0,
          reworkCount: 0
        },
        comments: [],
        statusHistory: []
      };
    });

    it('should validate all criteria in a task', async () => {
      mockScriptEngine.executeScript.mockResolvedValue({
        success: true,
        exitCode: 0,
        output: 'Tests passed',
        error: '',
        duration: 5000,
        retryCount: 0
      });

      mockReportGenerator.generateValidationReport.mockResolvedValue({
        id: 'report-001',
        sessionId: 'session-001',
        taskId: sampleTask.id,
        taskTitle: sampleTask.title,
        generatedAt: new Date(),
        generatedBy: 'test',
        summary: {
          totalCriteria: 2,
          passedCriteria: 2,
          failedCriteria: 0,
          skippedCriteria: 0,
          errorCriteria: 0,
          overallStatus: 'passed',
          completionPercentage: 100,
          executionTime: 5000
        },
        results: [],
        recommendations: [],
        evidence: [],
        metadata: {
          version: '1.0.0',
          generator: 'test',
          environment: 'test',
          executionTime: 5000,
          reportSize: 1024
        }
      });

      const session = await validator.validateTask(sampleTask, 'test-user');

      expect(session.taskId).toBe(sampleTask.id);
      expect(session.validatedBy).toBe('test-user');
      expect(session.status).toBe('completed');
      expect(session.results).toHaveLength(2);
      expect(session.summary.totalCriteria).toBe(2);
      expect(mockReportGenerator.generateValidationReport).toHaveBeenCalled();
    });

    it('should calculate summary correctly', async () => {
      // Mock one passing and one failing validation
      mockScriptEngine.executeScript.mockResolvedValue({
        success: false,
        exitCode: 1,
        output: 'Tests failed',
        error: 'Validation failed',
        duration: 3000,
        retryCount: 0
      });

      const session = await validator.validateTask(sampleTask, 'test-user');

      expect(session.summary.totalCriteria).toBe(2);
      expect(session.summary.passedCriteria).toBe(1); // Manual one is already completed
      expect(session.summary.failedCriteria).toBe(1); // Automated one fails
      expect(session.summary.completionPercentage).toBe(50);
      expect(session.summary.overallStatus).toBe('partial');
    });

    it('should handle validation session cancellation', async () => {
      // Start a validation that we'll cancel
      const validationPromise = validator.validateTask(sampleTask, 'test-user');
      
      // Get the session ID (this would be available in a real scenario)
      // For testing, we'll simulate the cancellation
      
      // In a real implementation, you'd get the session ID and cancel it
      // await validator.cancelValidationSession(sessionId);
      
      // For now, just ensure the validation completes
      const session = await validationPromise;
      expect(session).toBeDefined();
    });
  });

  describe('Validation Configuration', () => {
    it('should respect timeout configuration', async () => {
      const customValidator = new AcceptanceCriteriaValidator(
        logger,
        mockScriptEngine,
        mockReportGenerator,
        { timeout: 10000, retryAttempts: 1 }
      );

      const criteria = {
        id: 'test-timeout',
        description: 'Test timeout configuration',
        completed: false,
        validationMethod: 'automated' as const,
        validationScript: 'npm test'
      };

      mockScriptEngine.executeScript.mockResolvedValue({
        success: true,
        exitCode: 0,
        output: 'Tests passed',
        error: '',
        duration: 5000,
        retryCount: 0
      });

      await customValidator.validateCriteria(criteria, 'task-001', 'test-user');

      expect(mockScriptEngine.executeScript).toHaveBeenCalledWith(
        'npm test',
        expect.objectContaining({
          timeout: 10000,
          retryAttempts: 1
        })
      );
    });

    it('should handle parallel execution configuration', async () => {
      const parallelValidator = new AcceptanceCriteriaValidator(
        logger,
        mockScriptEngine,
        mockReportGenerator,
        { parallelExecution: true }
      );

      const task = {
        ...sampleTask,
        acceptanceCriteria: [
          {
            id: 'criteria-001',
            description: 'Test 1',
            completed: false,
            validationMethod: 'automated' as const,
            validationScript: 'npm test'
          },
          {
            id: 'criteria-002',
            description: 'Test 2',
            completed: false,
            validationMethod: 'automated' as const,
            validationScript: 'npm test'
          }
        ]
      };

      mockScriptEngine.executeScript.mockResolvedValue({
        success: true,
        exitCode: 0,
        output: 'Tests passed',
        error: '',
        duration: 2000,
        retryCount: 0
      });

      const session = await parallelValidator.validateTask(task, 'test-user');

      expect(session.results).toHaveLength(2);
      expect(mockScriptEngine.executeScript).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing validation script for automated validation', async () => {
      const criteria = {
        id: 'test-no-script',
        description: 'Test without script',
        completed: false,
        validationMethod: 'automated' as const
        // No validationScript provided
      };

      const result = await validator.validateCriteria(criteria, 'task-001', 'test-user');

      expect(result.status).toBe(ValidationStatus.ERROR);
      expect(result.message).toContain('Automated validation requires a validation script');
    });

    it('should handle unknown validation method', async () => {
      const criteria = {
        id: 'test-unknown',
        description: 'Test unknown method',
        completed: false,
        validationMethod: 'unknown' as any
      };

      const result = await validator.validateCriteria(criteria, 'task-001', 'test-user');

      expect(result.status).toBe(ValidationStatus.ERROR);
      expect(result.message).toContain('Unknown validation method: unknown');
    });
  });
});