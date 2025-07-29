/**
 * Script Execution Engine
 * 
 * Secure and robust script execution engine for automated validation.
 * Supports various script types with timeout, retry, and security controls.
 */

import { spawn, ChildProcess } from 'child_process';
import { ILogger } from '../interfaces';
import { ValidationError, SystemError } from '../error-handling/ErrorTypes';
import * as path from 'path';
import * as fs from 'fs';

export interface ScriptExecutionOptions {
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  workingDirectory?: string;
  environment?: Record<string, string>;
  maxOutputSize?: number;
  killSignal?: NodeJS.Signals;
}

export interface ScriptExecutionResult {
  success: boolean;
  exitCode: number;
  output: string;
  error: string;
  duration: number;
  logs?: string;
  retryCount: number;
}

export interface TestExecutionOptions extends ScriptExecutionOptions {
  collectCoverage: boolean;
  generateReport: boolean;
  testPattern?: string;
  coverageThreshold?: number;
}

export interface TestExecutionResult extends ScriptExecutionResult {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  testsPassed: boolean;
  coverage?: CoverageReport;
  failures?: TestFailure[];
  report?: string;
}

export interface CoverageReport {
  percentage: number;
  lines: number;
  functions: number;
  branches: number;
  statements: number;
  details: Record<string, any>;
}

export interface TestFailure {
  testName: string;
  error: string;
  stack?: string;
  duration: number;
}

export class ScriptExecutionEngine {
  private logger: ILogger;
  private runningProcesses: Map<string, ChildProcess> = new Map();
  private defaultOptions: ScriptExecutionOptions;

  constructor(logger: ILogger, defaultOptions: Partial<ScriptExecutionOptions> = {}) {
    this.logger = logger;
    this.defaultOptions = {
      timeout: 300000, // 5 minutes
      retryAttempts: 2,
      retryDelay: 5000,
      maxOutputSize: 1024 * 1024, // 1MB
      killSignal: 'SIGTERM',
      ...defaultOptions
    };
  }

  /**
   * Execute a validation script
   */
  async executeScript(
    script: string,
    options: Partial<ScriptExecutionOptions> = {}
  ): Promise<ScriptExecutionResult> {
    const execOptions = { ...this.defaultOptions, ...options };
    const executionId = this.generateExecutionId();

    this.logger.info('Starting script execution', {
      executionId,
      script: this.sanitizeScriptForLogging(script),
      timeout: execOptions.timeout
    });

    let retryCount = 0;
    let lastError: Error | null = null;

    while (retryCount <= execOptions.retryAttempts) {
      try {
        const result = await this.executeScriptAttempt(script, execOptions, executionId);
        result.retryCount = retryCount;

        this.logger.info('Script execution completed', {
          executionId,
          success: result.success,
          exitCode: result.exitCode,
          duration: result.duration,
          retryCount
        });

        return result;

      } catch (error) {
        lastError = error as Error;
        retryCount++;

        this.logger.warn('Script execution attempt failed', {
          executionId,
          attempt: retryCount,
          error: lastError.message,
          willRetry: retryCount <= execOptions.retryAttempts
        });

        if (retryCount <= execOptions.retryAttempts) {
          await this.delay(execOptions.retryDelay);
        }
      }
    }

    // All attempts failed
    this.logger.error('Script execution failed after all retries', lastError!, {
      executionId,
      totalAttempts: retryCount
    });

    return {
      success: false,
      exitCode: -1,
      output: '',
      error: lastError?.message || 'Unknown error',
      duration: 0,
      retryCount
    };
  }

  /**
   * Execute a test script with coverage and reporting
   */
  async executeTestScript(
    script: string,
    options: Partial<TestExecutionOptions> = {}
  ): Promise<TestExecutionResult> {
    const execOptions = { ...this.defaultOptions, ...options };
    const executionId = this.generateExecutionId();

    this.logger.info('Starting test script execution', {
      executionId,
      script: this.sanitizeScriptForLogging(script),
      collectCoverage: options.collectCoverage,
      generateReport: options.generateReport
    });

    try {
      // Prepare test command with coverage if requested
      const testCommand = this.prepareTestCommand(script, options);
      const result = await this.executeScriptAttempt(testCommand, execOptions, executionId);

      // Parse test results
      const testResult = await this.parseTestResults(result, options);

      this.logger.info('Test script execution completed', {
        executionId,
        success: testResult.success,
        totalTests: testResult.totalTests,
        passedTests: testResult.passedTests,
        failedTests: testResult.failedTests,
        coverage: testResult.coverage?.percentage
      });

      return testResult;

    } catch (error) {
      this.logger.error('Test script execution failed', error as Error, { executionId });
      
      return {
        success: false,
        exitCode: -1,
        output: '',
        error: (error as Error).message,
        duration: 0,
        retryCount: 0,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        testsPassed: false
      };
    }
  }

  /**
   * Cancel a running script execution
   */
  async cancelExecution(executionId: string): Promise<void> {
    const process = this.runningProcesses.get(executionId);
    if (!process) {
      throw new ValidationError(`Execution ${executionId} not found or already completed`);
    }

    this.logger.info('Cancelling script execution', { executionId });

    try {
      // Try graceful termination first
      process.kill('SIGTERM');
      
      // Wait a bit, then force kill if necessary
      setTimeout(() => {
        if (!process.killed) {
          process.kill('SIGKILL');
        }
      }, 5000);

      this.runningProcesses.delete(executionId);

    } catch (error) {
      this.logger.error('Failed to cancel script execution', error as Error, { executionId });
      throw new SystemError(`Failed to cancel execution: ${(error as Error).message}`);
    }
  }

  /**
   * Get status of running executions
   */
  getRunningExecutions(): string[] {
    return Array.from(this.runningProcesses.keys());
  }

  // Private methods

  private async executeScriptAttempt(
    script: string,
    options: ScriptExecutionOptions,
    executionId: string
  ): Promise<ScriptExecutionResult> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      let output = '';
      let error = '';
      let outputSize = 0;

      // Parse command and arguments
      const { command, args } = this.parseCommand(script);

      // Prepare execution environment
      const env = {
        ...process.env,
        ...options.environment
      };

      // Spawn process
      const childProcess = spawn(command, args, {
        cwd: options.workingDirectory || process.cwd(),
        env,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.runningProcesses.set(executionId, childProcess);

      // Set up timeout
      const timeoutHandle = setTimeout(() => {
        this.logger.warn('Script execution timeout', { executionId, timeout: options.timeout });
        childProcess.kill(options.killSignal);
      }, options.timeout);

      // Handle stdout
      childProcess.stdout?.on('data', (data: Buffer) => {
        const chunk = data.toString();
        outputSize += chunk.length;

        if (options.maxOutputSize && outputSize > options.maxOutputSize) {
          this.logger.warn('Script output size limit exceeded', { executionId, size: outputSize });
          childProcess.kill(options.killSignal);
          return;
        }

        output += chunk;
      });

      // Handle stderr
      childProcess.stderr?.on('data', (data: Buffer) => {
        error += data.toString();
      });

      // Handle process completion
      childProcess.on('close', (code: number | null, signal: NodeJS.Signals | null) => {
        clearTimeout(timeoutHandle);
        this.runningProcesses.delete(executionId);

        const duration = Date.now() - startTime;
        const exitCode = code !== null ? code : -1;

        if (signal) {
          reject(new SystemError(`Process killed by signal: ${signal}`));
          return;
        }

        resolve({
          success: exitCode === 0,
          exitCode,
          output: output.trim(),
          error: error.trim(),
          duration,
          retryCount: 0
        });
      });

      // Handle process errors
      childProcess.on('error', (err: Error) => {
        clearTimeout(timeoutHandle);
        this.runningProcesses.delete(executionId);
        reject(new SystemError(`Process execution error: ${err.message}`));
      });
    });
  }

  private parseCommand(script: string): { command: string; args: string[] } {
    // Handle different script formats
    if (script.startsWith('npm ')) {
      const parts = script.split(' ');
      return {
        command: 'npm',
        args: parts.slice(1)
      };
    }

    if (script.startsWith('node ')) {
      const parts = script.split(' ');
      return {
        command: 'node',
        args: parts.slice(1)
      };
    }

    if (script.startsWith('npx ')) {
      const parts = script.split(' ');
      return {
        command: 'npx',
        args: parts.slice(1)
      };
    }

    // Default: treat as shell command
    return {
      command: process.platform === 'win32' ? 'cmd' : 'sh',
      args: process.platform === 'win32' ? ['/c', script] : ['-c', script]
    };
  }

  private prepareTestCommand(script: string, options: Partial<TestExecutionOptions>): string {
    let command = script;

    // Add coverage collection if requested
    if (options.collectCoverage) {
      if (script.includes('jest')) {
        command += ' --coverage';
      } else if (script.includes('mocha')) {
        command = `nyc ${command}`;
      }
    }

    // Add test pattern if specified
    if (options.testPattern) {
      if (script.includes('jest')) {
        command += ` --testPathPattern="${options.testPattern}"`;
      }
    }

    // Add report generation
    if (options.generateReport) {
      if (script.includes('jest')) {
        command += ' --json --outputFile=test-results.json';
      }
    }

    return command;
  }

  private async parseTestResults(
    result: ScriptExecutionResult,
    options: Partial<TestExecutionOptions>
  ): Promise<TestExecutionResult> {
    const testResult: TestExecutionResult = {
      ...result,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      testsPassed: result.success
    };

    try {
      // Try to parse Jest output
      if (result.output.includes('Test Suites:')) {
        const jestResults = this.parseJestOutput(result.output);
        Object.assign(testResult, jestResults);
      }

      // Try to parse coverage information
      if (options.collectCoverage && result.output.includes('Coverage')) {
        testResult.coverage = this.parseCoverageOutput(result.output);
      }

      // Load test report file if generated
      if (options.generateReport) {
        testResult.report = await this.loadTestReport();
      }

    } catch (error) {
      this.logger.warn('Failed to parse test results', error as Error);
    }

    return testResult;
  }

  private parseJestOutput(output: string): Partial<TestExecutionResult> {
    const result: Partial<TestExecutionResult> = {};

    // Parse test counts
    const testSuitesMatch = output.match(/Test Suites: (\d+) passed, (\d+) total/);
    const testsMatch = output.match(/Tests:\s+(\d+) passed, (\d+) total/);

    if (testsMatch) {
      result.passedTests = parseInt(testsMatch[1]);
      result.totalTests = parseInt(testsMatch[2]);
      result.failedTests = result.totalTests - result.passedTests;
      result.testsPassed = result.failedTests === 0;
    }

    // Parse failures
    const failureMatches = output.match(/● (.+?)\n\n\s+(.+?)\n/g);
    if (failureMatches) {
      result.failures = failureMatches.map(match => {
        const lines = match.split('\n');
        return {
          testName: lines[0].replace('● ', '').trim(),
          error: lines[2]?.trim() || 'Unknown error',
          duration: 0
        };
      });
    }

    return result;
  }

  private parseCoverageOutput(output: string): CoverageReport {
    // Simple coverage parsing - in practice, this would be more sophisticated
    const coverageMatch = output.match(/All files\s+\|\s+([\d.]+)/);
    const percentage = coverageMatch ? parseFloat(coverageMatch[1]) : 0;

    return {
      percentage,
      lines: 0,
      functions: 0,
      branches: 0,
      statements: 0,
      details: {}
    };
  }

  private async loadTestReport(): Promise<string> {
    try {
      const reportPath = path.join(process.cwd(), 'test-results.json');
      if (fs.existsSync(reportPath)) {
        return fs.readFileSync(reportPath, 'utf8');
      }
    } catch (error) {
      this.logger.warn('Failed to load test report', error as Error);
    }
    return '';
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sanitizeScriptForLogging(script: string): string {
    // Remove sensitive information from script for logging
    return script.replace(/--password[=\s]+\S+/gi, '--password=***')
                .replace(/--token[=\s]+\S+/gi, '--token=***')
                .replace(/--key[=\s]+\S+/gi, '--key=***');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}