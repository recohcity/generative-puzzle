/**
 * Acceptance Criteria Validator
 * 
 * Comprehensive validation system for task acceptance criteria with support for
 * automated, manual, and test-based validation methods.
 */

import { ILogger } from '../interfaces';
import { EnhancedTask, AcceptanceCriteria } from '../task-management/TaskTypes';
import { ValidationError, BusinessLogicError } from '../error-handling/ErrorTypes';
import { ScriptExecutionEngine } from './ScriptExecutionEngine';
import { ValidationReportGenerator } from './ValidationReportGenerator';

export enum ValidationStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PASSED = 'passed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  ERROR = 'error'
}

export interface ValidationResult {
  criteriaId: string;
  status: ValidationStatus;
  message: string;
  details?: any;
  executionTime?: number;
  timestamp: Date;
  validatedBy?: string;
  evidence?: ValidationEvidence[];
  retryCount?: number;
}

export interface ValidationEvidence {
  type: 'screenshot' | 'log' | 'output' | 'file' | 'metric';
  description: string;
  content: string | Buffer;
  metadata?: Record<string, any>;
}

export interface ValidationSession {
  id: string;
  taskId: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  results: ValidationResult[];
  summary: ValidationSummary;
  validatedBy: string;
  notes?: string;
}

export interface ValidationSummary {
  totalCriteria: number;
  passedCriteria: number;
  failedCriteria: number;
  skippedCriteria: number;
  errorCriteria: number;
  overallStatus: 'passed' | 'failed' | 'partial';
  completionPercentage: number;
  executionTime: number;
}

export interface ValidationConfig {
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  parallelExecution: boolean;
  evidenceCollection: boolean;
  reportGeneration: boolean;
  notificationEnabled: boolean;
}

export class AcceptanceCriteriaValidator {
  private logger: ILogger;
  private scriptEngine: ScriptExecutionEngine;
  private reportGenerator: ValidationReportGenerator;
  private activeSessions: Map<string, ValidationSession> = new Map();
  private config: ValidationConfig;

  constructor(
    logger: ILogger,
    scriptEngine: ScriptExecutionEngine,
    reportGenerator: ValidationReportGenerator,
    config: Partial<ValidationConfig> = {}
  ) {
    this.logger = logger;
    this.scriptEngine = scriptEngine;
    this.reportGenerator = reportGenerator;
    
    this.config = {
      timeout: 300000, // 5 minutes
      retryAttempts: 2,
      retryDelay: 5000,
      parallelExecution: false,
      evidenceCollection: true,
      reportGeneration: true,
      notificationEnabled: true,
      ...config
    };
  }

  /**
   * Validate all acceptance criteria for a task
   */
  async validateTask(task: EnhancedTask, validatedBy: string): Promise<ValidationSession> {
    this.logger.info('Starting task validation', {
      taskId: task.id,
      criteriaCount: task.acceptanceCriteria.length,
      validatedBy
    });

    const sessionId = this.generateSessionId();
    const session: ValidationSession = {
      id: sessionId,
      taskId: task.id,
      startTime: new Date(),
      status: 'running',
      results: [],
      summary: this.initializeSummary(task.acceptanceCriteria.length),
      validatedBy,
    };

    this.activeSessions.set(sessionId, session);

    try {
      if (this.config.parallelExecution) {
        await this.validateCriteriaParallel(task.acceptanceCriteria, session);
      } else {
        await this.validateCriteriaSequential(task.acceptanceCriteria, session);
      }

      session.endTime = new Date();
      session.status = 'completed';
      session.summary = this.calculateSummary(session.results);

      // Generate validation report
      if (this.config.reportGeneration) {
        await this.reportGenerator.generateValidationReport(session);
      }

      this.logger.info('Task validation completed', {
        sessionId,
        taskId: task.id,
        summary: session.summary
      });

      return session;

    } catch (error) {
      session.endTime = new Date();
      session.status = 'failed';
      session.summary = this.calculateSummary(session.results);

      this.logger.error('Task validation failed', error as Error, {
        sessionId,
        taskId: task.id
      });

      throw new ValidationError(`Task validation failed: ${(error as Error).message}`);
    } finally {
      this.activeSessions.delete(sessionId);
    }
  }

  /**
   * Validate a single acceptance criteria
   */
  async validateCriteria(
    criteria: AcceptanceCriteria,
    taskId: string,
    validatedBy: string
  ): Promise<ValidationResult> {
    this.logger.debug('Validating acceptance criteria', {
      criteriaId: criteria.id,
      taskId,
      method: criteria.validationMethod
    });

    const startTime = Date.now();
    const result: ValidationResult = {
      criteriaId: criteria.id,
      status: ValidationStatus.RUNNING,
      message: 'Validation in progress',
      timestamp: new Date(),
      validatedBy,
      retryCount: 0
    };

    try {
      switch (criteria.validationMethod) {
        case 'automated':
          await this.validateAutomated(criteria, result);
          break;
        case 'manual':
          await this.validateManual(criteria, result, validatedBy);
          break;
        case 'test':
          await this.validateTest(criteria, result);
          break;
        default:
          throw new ValidationError(`Unknown validation method: ${criteria.validationMethod}`);
      }

      result.executionTime = Date.now() - startTime;
      
      this.logger.debug('Criteria validation completed', {
        criteriaId: criteria.id,
        status: result.status,
        executionTime: result.executionTime
      });

      return result;

    } catch (error) {
      result.status = ValidationStatus.ERROR;
      result.message = `Validation error: ${(error as Error).message}`;
      result.executionTime = Date.now() - startTime;

      this.logger.error('Criteria validation error', error as Error, {
        criteriaId: criteria.id,
        taskId
      });

      return result;
    }
  }

  /**
   * Automated validation using script execution
   */
  private async validateAutomated(
    criteria: AcceptanceCriteria,
    result: ValidationResult
  ): Promise<void> {
    if (!criteria.validationScript) {
      throw new ValidationError('Automated validation requires a validation script');
    }

    try {
      const scriptResult = await this.scriptEngine.executeScript(
        criteria.validationScript,
        {
          timeout: this.config.timeout,
          retryAttempts: this.config.retryAttempts,
          retryDelay: this.config.retryDelay
        }
      );

      if (scriptResult.success) {
        result.status = ValidationStatus.PASSED;
        result.message = 'Automated validation passed';
        result.details = scriptResult.output;
      } else {
        result.status = ValidationStatus.FAILED;
        result.message = `Automated validation failed: ${scriptResult.error}`;
        result.details = {
          output: scriptResult.output,
          error: scriptResult.error,
          exitCode: scriptResult.exitCode
        };
      }

      // Collect evidence if enabled
      if (this.config.evidenceCollection) {
        result.evidence = await this.collectAutomatedEvidence(scriptResult);
      }

    } catch (error) {
      result.status = ValidationStatus.ERROR;
      result.message = `Script execution error: ${(error as Error).message}`;
    }
  }

  /**
   * Manual validation requiring human verification
   */
  private async validateManual(
    criteria: AcceptanceCriteria,
    result: ValidationResult,
    validatedBy: string
  ): Promise<void> {
    // For manual validation, we check if it's already been completed
    if (criteria.completed && criteria.validatedBy) {
      result.status = ValidationStatus.PASSED;
      result.message = `Manual validation completed by ${criteria.validatedBy}`;
      result.validatedBy = criteria.validatedBy;
      
      if (criteria.notes) {
        result.details = { notes: criteria.notes };
      }
    } else {
      result.status = ValidationStatus.PENDING;
      result.message = 'Manual validation required - awaiting human verification';
      
      // Create a manual validation task/notification
      await this.createManualValidationTask(criteria, validatedBy);
    }
  }

  /**
   * Test-based validation using test execution
   */
  private async validateTest(
    criteria: AcceptanceCriteria,
    result: ValidationResult
  ): Promise<void> {
    try {
      // Execute test command if provided
      if (criteria.validationScript) {
        const testResult = await this.scriptEngine.executeTestScript(
          criteria.validationScript,
          {
            timeout: this.config.timeout,
            collectCoverage: true,
            generateReport: true
          }
        );

        if (testResult.success && testResult.testsPassed) {
          result.status = ValidationStatus.PASSED;
          result.message = `Tests passed: ${testResult.passedTests}/${testResult.totalTests}`;
          result.details = {
            totalTests: testResult.totalTests,
            passedTests: testResult.passedTests,
            failedTests: testResult.failedTests,
            coverage: testResult.coverage,
            duration: testResult.duration
          };
        } else {
          result.status = ValidationStatus.FAILED;
          result.message = `Tests failed: ${testResult.failedTests}/${testResult.totalTests} failed`;
          result.details = {
            totalTests: testResult.totalTests,
            passedTests: testResult.passedTests,
            failedTests: testResult.failedTests,
            failures: testResult.failures,
            duration: testResult.duration
          };
        }

        // Collect test evidence
        if (this.config.evidenceCollection) {
          result.evidence = await this.collectTestEvidence(testResult);
        }

      } else {
        // Generic test validation - check if related tests exist and pass
        result.status = ValidationStatus.SKIPPED;
        result.message = 'No test script specified for test validation';
      }

    } catch (error) {
      result.status = ValidationStatus.ERROR;
      result.message = `Test execution error: ${(error as Error).message}`;
    }
  }

  /**
   * Validate criteria sequentially
   */
  private async validateCriteriaSequential(
    criteria: AcceptanceCriteria[],
    session: ValidationSession
  ): Promise<void> {
    for (const criterion of criteria) {
      const result = await this.validateCriteria(
        criterion,
        session.taskId,
        session.validatedBy
      );
      session.results.push(result);
    }
  }

  /**
   * Validate criteria in parallel
   */
  private async validateCriteriaParallel(
    criteria: AcceptanceCriteria[],
    session: ValidationSession
  ): Promise<void> {
    const validationPromises = criteria.map(criterion =>
      this.validateCriteria(criterion, session.taskId, session.validatedBy)
    );

    const results = await Promise.allSettled(validationPromises);
    
    session.results = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          criteriaId: criteria[index].id,
          status: ValidationStatus.ERROR,
          message: `Parallel validation error: ${result.reason}`,
          timestamp: new Date(),
          validatedBy: session.validatedBy
        };
      }
    });
  }

  /**
   * Get validation session by ID
   */
  getValidationSession(sessionId: string): ValidationSession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * Cancel a running validation session
   */
  async cancelValidationSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new ValidationError(`Validation session ${sessionId} not found`);
    }

    if (session.status !== 'running') {
      throw new BusinessLogicError(`Cannot cancel session ${sessionId} - not running`);
    }

    session.status = 'cancelled';
    session.endTime = new Date();
    session.summary = this.calculateSummary(session.results);

    this.activeSessions.delete(sessionId);

    this.logger.info('Validation session cancelled', { sessionId });
  }

  /**
   * Get validation history for a task
   */
  async getValidationHistory(taskId: string): Promise<ValidationSession[]> {
    // This would typically query a database
    // For now, return empty array as this is a demo implementation
    return [];
  }

  // Private helper methods

  private generateSessionId(): string {
    return `validation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeSummary(totalCriteria: number): ValidationSummary {
    return {
      totalCriteria,
      passedCriteria: 0,
      failedCriteria: 0,
      skippedCriteria: 0,
      errorCriteria: 0,
      overallStatus: 'partial',
      completionPercentage: 0,
      executionTime: 0
    };
  }

  private calculateSummary(results: ValidationResult[]): ValidationSummary {
    const summary = this.initializeSummary(results.length);
    
    let totalExecutionTime = 0;

    for (const result of results) {
      switch (result.status) {
        case ValidationStatus.PASSED:
          summary.passedCriteria++;
          break;
        case ValidationStatus.FAILED:
          summary.failedCriteria++;
          break;
        case ValidationStatus.SKIPPED:
          summary.skippedCriteria++;
          break;
        case ValidationStatus.ERROR:
          summary.errorCriteria++;
          break;
      }

      if (result.executionTime) {
        totalExecutionTime += result.executionTime;
      }
    }

    summary.completionPercentage = (summary.passedCriteria / summary.totalCriteria) * 100;
    summary.executionTime = totalExecutionTime;

    // Determine overall status
    if (summary.passedCriteria === summary.totalCriteria) {
      summary.overallStatus = 'passed';
    } else if (summary.passedCriteria === 0) {
      summary.overallStatus = 'failed';
    } else {
      summary.overallStatus = 'partial';
    }

    return summary;
  }

  private async collectAutomatedEvidence(scriptResult: any): Promise<ValidationEvidence[]> {
    const evidence: ValidationEvidence[] = [];

    // Collect script output
    if (scriptResult.output) {
      evidence.push({
        type: 'output',
        description: 'Script execution output',
        content: scriptResult.output,
        metadata: {
          exitCode: scriptResult.exitCode,
          duration: scriptResult.duration
        }
      });
    }

    // Collect logs if available
    if (scriptResult.logs) {
      evidence.push({
        type: 'log',
        description: 'Script execution logs',
        content: scriptResult.logs
      });
    }

    return evidence;
  }

  private async collectTestEvidence(testResult: any): Promise<ValidationEvidence[]> {
    const evidence: ValidationEvidence[] = [];

    // Collect test report
    if (testResult.report) {
      evidence.push({
        type: 'file',
        description: 'Test execution report',
        content: testResult.report,
        metadata: {
          format: 'json',
          totalTests: testResult.totalTests,
          passedTests: testResult.passedTests
        }
      });
    }

    // Collect coverage report
    if (testResult.coverage) {
      evidence.push({
        type: 'metric',
        description: 'Test coverage metrics',
        content: JSON.stringify(testResult.coverage),
        metadata: {
          type: 'coverage',
          percentage: testResult.coverage.percentage
        }
      });
    }

    return evidence;
  }

  private async createManualValidationTask(
    criteria: AcceptanceCriteria,
    assignedTo: string
  ): Promise<void> {
    // This would create a manual validation task or notification
    // For now, just log the requirement
    this.logger.info('Manual validation required', {
      criteriaId: criteria.id,
      description: criteria.description,
      assignedTo
    });
  }
}