/**
 * Test Coverage Analyzer
 * 
 * Analyzes test coverage using Jest coverage reports and other testing frameworks.
 * Provides detailed coverage metrics and identifies uncovered code paths.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { ILogger } from '../../interfaces';
import { QualityCheckResult, QualityIssue } from '../../types';
import { QualityDetectionConfig } from '../QualityDetectionEngine';

export interface CoverageMetrics {
  lines: CoverageData;
  functions: CoverageData;
  branches: CoverageData;
  statements: CoverageData;
}

export interface CoverageData {
  total: number;
  covered: number;
  skipped: number;
  percentage: number;
}

export interface FileCoverage {
  filePath: string;
  lines: CoverageData;
  functions: CoverageData;
  branches: CoverageData;
  statements: CoverageData;
  uncoveredLines: number[];
  uncoveredFunctions: string[];
  uncoveredBranches: BranchCoverage[];
}

export interface BranchCoverage {
  line: number;
  type: string;
  covered: boolean;
}

export interface TestCoverageAnalysisResult extends QualityCheckResult {
  overallCoverage: number;
  lineCoverage: number;
  functionCoverage: number;
  branchCoverage: number;
  statementCoverage: number;
  filesAnalyzed: number;
  testFilesFound: number;
  analysisTime: number;
  fileCoverages: FileCoverage[];
  coverageThreshold: number;
  passesThreshold: boolean;
}

export class TestCoverageAnalyzer {
  private logger: ILogger;

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  /**
   * Initialize the test coverage analyzer
   */
  async initialize(): Promise<void> {
    this.logger.debug('Initializing Test Coverage analyzer');
    
    // Check if Jest is available
    try {
      execSync('npx jest --version', { stdio: 'pipe' });
      this.logger.debug('Jest found and available for coverage analysis');
    } catch (error) {
      this.logger.warn('Jest not found - coverage analysis may be limited');
    }
  }

  /**
   * Analyze test coverage
   */
  async analyze(config: QualityDetectionConfig): Promise<TestCoverageAnalysisResult> {
    this.logger.info('Starting test coverage analysis', {
      projectRoot: config.projectRoot,
      coverageThreshold: config.thresholds.coverage.minimumCoverage
    });

    const startTime = Date.now();

    try {
      // Run coverage analysis
      const coverageData = await this.runCoverageAnalysis(config);
      
      if (!coverageData) {
        this.logger.warn('No coverage data available');
        return this.createEmptyResult(config);
      }

      // Parse coverage data
      const fileCoverages = this.parseCoverageData(coverageData);
      
      // Calculate aggregate metrics
      const aggregateMetrics = this.calculateAggregateMetrics(fileCoverages);
      
      // Generate issues based on coverage thresholds
      const issues = this.generateCoverageIssues(fileCoverages, config.thresholds);
      
      // Generate suggestions
      const suggestions = this.generateSuggestions(fileCoverages, aggregateMetrics);
      
      // Calculate score
      const score = this.calculateScore(aggregateMetrics, config.thresholds);

      const analysisTime = Date.now() - startTime;
      const passesThreshold = aggregateMetrics.overallCoverage >= config.thresholds.coverage.minimumCoverage;

      const result: TestCoverageAnalysisResult = {
        score,
        issues,
        suggestions,
        metrics: {
          testCoverage: aggregateMetrics.overallCoverage,
          lineCoverage: aggregateMetrics.lineCoverage,
          functionCoverage: aggregateMetrics.functionCoverage,
          branchCoverage: aggregateMetrics.branchCoverage,
          statementCoverage: aggregateMetrics.statementCoverage,
          filesAnalyzed: fileCoverages.length,
          analysisTime,
          ...aggregateMetrics
        },
        overallCoverage: aggregateMetrics.overallCoverage,
        lineCoverage: aggregateMetrics.lineCoverage,
        functionCoverage: aggregateMetrics.functionCoverage,
        branchCoverage: aggregateMetrics.branchCoverage,
        statementCoverage: aggregateMetrics.statementCoverage,
        filesAnalyzed: fileCoverages.length,
        testFilesFound: this.countTestFiles(config),
        analysisTime,
        fileCoverages,
        coverageThreshold: config.thresholds.coverage.minimumCoverage,
        passesThreshold
      };

      this.logger.info('Test coverage analysis completed', {
        score: result.score,
        overallCoverage: result.overallCoverage,
        passesThreshold: result.passesThreshold,
        filesAnalyzed: result.filesAnalyzed,
        analysisTime
      });

      return result;

    } catch (error) {
      this.logger.error('Test coverage analysis failed', error as Error);
      throw error;
    }
  }

  /**
   * Run tests and generate coverage report
   */
  async runTestsWithCoverage(config: QualityDetectionConfig): Promise<{
    success: boolean;
    coverageData: any;
    testResults: any;
  }> {
    this.logger.info('Running tests with coverage');

    try {
      // Run Jest with coverage
      const jestCommand = 'npx jest --coverage --coverageReporters=json --passWithNoTests';
      const output = execSync(jestCommand, { 
        cwd: config.projectRoot,
        encoding: 'utf8',
        stdio: 'pipe'
      });

      // Read coverage data
      const coverageData = await this.readCoverageReport(config.projectRoot);

      return {
        success: true,
        coverageData,
        testResults: { output }
      };

    } catch (error) {
      this.logger.error('Failed to run tests with coverage', error as Error);
      return {
        success: false,
        coverageData: null,
        testResults: null
      };
    }
  }

  // Private methods

  private async runCoverageAnalysis(config: QualityDetectionConfig): Promise<any> {
    // Try to read existing coverage report first
    let coverageData = await this.readCoverageReport(config.projectRoot);
    
    if (!coverageData) {
      // Try to generate coverage report
      try {
        this.logger.debug('Generating coverage report');
        
        const jestCommand = 'npx jest --coverage --coverageReporters=json --passWithNoTests --silent';
        execSync(jestCommand, { 
          cwd: config.projectRoot,
          stdio: 'pipe'
        });

        // Read the generated coverage report
        coverageData = await this.readCoverageReport(config.projectRoot);
        
      } catch (error) {
        this.logger.warn('Failed to generate coverage report', error as Error);
        return null;
      }
    }

    return coverageData;
  }

  private async readCoverageReport(projectRoot: string): Promise<any> {
    const possiblePaths = [
      path.join(projectRoot, 'coverage/coverage-final.json'),
      path.join(projectRoot, 'coverage/coverage.json'),
      path.join(projectRoot, 'coverage/lcov-report/coverage.json'),
      path.join(projectRoot, '.nyc_output/coverage.json')
    ];

    for (const coveragePath of possiblePaths) {
      try {
        if (fs.existsSync(coveragePath)) {
          const coverageContent = fs.readFileSync(coveragePath, 'utf8');
          return JSON.parse(coverageContent);
        }
      } catch (error) {
        this.logger.debug(`Failed to read coverage from ${coveragePath}`, error as Error);
      }
    }

    return null;
  }

  private parseCoverageData(coverageData: any): FileCoverage[] {
    const fileCoverages: FileCoverage[] = [];

    // Handle different coverage report formats
    if (coverageData && typeof coverageData === 'object') {
      Object.entries(coverageData).forEach(([filePath, fileData]: [string, any]) => {
        if (fileData && typeof fileData === 'object') {
          const fileCoverage = this.parseFileCoverage(filePath, fileData);
          if (fileCoverage) {
            fileCoverages.push(fileCoverage);
          }
        }
      });
    }

    return fileCoverages;
  }

  private parseFileCoverage(filePath: string, fileData: any): FileCoverage | null {
    try {
      // Handle Jest coverage format
      const lines = this.parseCoverageMetric(fileData.l || fileData.lines);
      const functions = this.parseCoverageMetric(fileData.f || fileData.functions);
      const branches = this.parseCoverageMetric(fileData.b || fileData.branches);
      const statements = this.parseCoverageMetric(fileData.s || fileData.statements);

      // Find uncovered lines
      const uncoveredLines = this.findUncoveredLines(fileData.l || fileData.lines);
      const uncoveredFunctions = this.findUncoveredFunctions(fileData.f || fileData.functions, fileData.fnMap);
      const uncoveredBranches = this.findUncoveredBranches(fileData.b || fileData.branches, fileData.branchMap);

      return {
        filePath: path.relative(process.cwd(), filePath),
        lines,
        functions,
        branches,
        statements,
        uncoveredLines,
        uncoveredFunctions,
        uncoveredBranches
      };

    } catch (error) {
      this.logger.warn(`Failed to parse coverage for ${filePath}`, error as Error);
      return null;
    }
  }

  private parseCoverageMetric(data: any): CoverageData {
    if (!data) {
      return { total: 0, covered: 0, skipped: 0, percentage: 0 };
    }

    if (typeof data === 'object' && data.total !== undefined) {
      // Istanbul format
      return {
        total: data.total || 0,
        covered: data.covered || 0,
        skipped: data.skipped || 0,
        percentage: data.pct || 0
      };
    }

    if (Array.isArray(data) || typeof data === 'object') {
      // Jest format - count covered vs uncovered
      const entries = Array.isArray(data) ? data : Object.values(data);
      const total = entries.length;
      const covered = entries.filter((count: any) => count > 0).length;
      const percentage = total > 0 ? (covered / total) * 100 : 0;

      return {
        total,
        covered,
        skipped: 0,
        percentage
      };
    }

    return { total: 0, covered: 0, skipped: 0, percentage: 0 };
  }

  private findUncoveredLines(lineData: any): number[] {
    if (!lineData) return [];

    if (Array.isArray(lineData)) {
      return lineData
        .map((count, index) => ({ line: index + 1, count }))
        .filter(({ count }) => count === 0)
        .map(({ line }) => line);
    }

    if (typeof lineData === 'object') {
      return Object.entries(lineData)
        .filter(([, count]) => count === 0)
        .map(([line]) => parseInt(line));
    }

    return [];
  }

  private findUncoveredFunctions(functionData: any, functionMap: any): string[] {
    if (!functionData || !functionMap) return [];

    const uncoveredFunctions: string[] = [];

    if (Array.isArray(functionData)) {
      functionData.forEach((count, index) => {
        if (count === 0 && functionMap[index]) {
          uncoveredFunctions.push(functionMap[index].name || `function_${index}`);
        }
      });
    } else if (typeof functionData === 'object') {
      Object.entries(functionData).forEach(([index, count]) => {
        if (count === 0 && functionMap[index]) {
          uncoveredFunctions.push(functionMap[index].name || `function_${index}`);
        }
      });
    }

    return uncoveredFunctions;
  }

  private findUncoveredBranches(branchData: any, branchMap: any): BranchCoverage[] {
    if (!branchData || !branchMap) return [];

    const uncoveredBranches: BranchCoverage[] = [];

    Object.entries(branchData).forEach(([index, branches]: [string, any]) => {
      if (Array.isArray(branches) && branchMap[index]) {
        branches.forEach((count, branchIndex) => {
          uncoveredBranches.push({
            line: branchMap[index].line || 0,
            type: branchMap[index].type || 'unknown',
            covered: count > 0
          });
        });
      }
    });

    return uncoveredBranches;
  }

  private calculateAggregateMetrics(fileCoverages: FileCoverage[]): any {
    if (fileCoverages.length === 0) {
      return {
        overallCoverage: 0,
        lineCoverage: 0,
        functionCoverage: 0,
        branchCoverage: 0,
        statementCoverage: 0
      };
    }

    const totals = fileCoverages.reduce((acc, file) => ({
      lines: {
        total: acc.lines.total + file.lines.total,
        covered: acc.lines.covered + file.lines.covered
      },
      functions: {
        total: acc.functions.total + file.functions.total,
        covered: acc.functions.covered + file.functions.covered
      },
      branches: {
        total: acc.branches.total + file.branches.total,
        covered: acc.branches.covered + file.branches.covered
      },
      statements: {
        total: acc.statements.total + file.statements.total,
        covered: acc.statements.covered + file.statements.covered
      }
    }), {
      lines: { total: 0, covered: 0 },
      functions: { total: 0, covered: 0 },
      branches: { total: 0, covered: 0 },
      statements: { total: 0, covered: 0 }
    });

    const lineCoverage = totals.lines.total > 0 ? (totals.lines.covered / totals.lines.total) * 100 : 0;
    const functionCoverage = totals.functions.total > 0 ? (totals.functions.covered / totals.functions.total) * 100 : 0;
    const branchCoverage = totals.branches.total > 0 ? (totals.branches.covered / totals.branches.total) * 100 : 0;
    const statementCoverage = totals.statements.total > 0 ? (totals.statements.covered / totals.statements.total) * 100 : 0;

    // Overall coverage is weighted average
    const overallCoverage = (lineCoverage * 0.4 + functionCoverage * 0.3 + branchCoverage * 0.2 + statementCoverage * 0.1);

    return {
      overallCoverage,
      lineCoverage,
      functionCoverage,
      branchCoverage,
      statementCoverage,
      totalLines: totals.lines.total,
      coveredLines: totals.lines.covered,
      totalFunctions: totals.functions.total,
      coveredFunctions: totals.functions.covered,
      totalBranches: totals.branches.total,
      coveredBranches: totals.branches.covered,
      totalStatements: totals.statements.total,
      coveredStatements: totals.statements.covered
    };
  }

  private generateCoverageIssues(fileCoverages: FileCoverage[], thresholds: any): QualityIssue[] {
    const issues: QualityIssue[] = [];
    const coverageThresholds = thresholds.coverage || {
      minimumCoverage: 80,
      branchCoverage: 70,
      functionCoverage: 85
    };

    fileCoverages.forEach(file => {
      // Check line coverage
      if (file.lines.percentage < coverageThresholds.minimumCoverage) {
        issues.push({
          severity: file.lines.percentage < coverageThresholds.minimumCoverage * 0.7 ? 'error' : 'warning',
          file: file.filePath,
          line: 1,
          message: `Low line coverage: ${file.lines.percentage.toFixed(1)}% (threshold: ${coverageThresholds.minimumCoverage}%)`,
          rule: 'coverage-lines',
          fixable: false
        });
      }

      // Check function coverage
      if (file.functions.percentage < coverageThresholds.functionCoverage) {
        issues.push({
          severity: file.functions.percentage < coverageThresholds.functionCoverage * 0.7 ? 'error' : 'warning',
          file: file.filePath,
          line: 1,
          message: `Low function coverage: ${file.functions.percentage.toFixed(1)}% (threshold: ${coverageThresholds.functionCoverage}%)`,
          rule: 'coverage-functions',
          fixable: false
        });
      }

      // Check branch coverage
      if (file.branches.percentage < coverageThresholds.branchCoverage) {
        issues.push({
          severity: file.branches.percentage < coverageThresholds.branchCoverage * 0.7 ? 'error' : 'warning',
          file: file.filePath,
          line: 1,
          message: `Low branch coverage: ${file.branches.percentage.toFixed(1)}% (threshold: ${coverageThresholds.branchCoverage}%)`,
          rule: 'coverage-branches',
          fixable: false
        });
      }

      // Report specific uncovered lines for critical files
      if (file.uncoveredLines.length > 0 && file.lines.percentage < 50) {
        const uncoveredSample = file.uncoveredLines.slice(0, 5);
        issues.push({
          severity: 'info',
          file: file.filePath,
          line: uncoveredSample[0],
          message: `Uncovered lines: ${uncoveredSample.join(', ')}${file.uncoveredLines.length > 5 ? ` and ${file.uncoveredLines.length - 5} more` : ''}`,
          rule: 'coverage-uncovered-lines',
          fixable: false
        });
      }
    });

    return issues;
  }

  private generateSuggestions(fileCoverages: FileCoverage[], aggregateMetrics: any): string[] {
    const suggestions: string[] = [];

    if (aggregateMetrics.overallCoverage < 80) {
      suggestions.push(`Overall coverage is ${aggregateMetrics.overallCoverage.toFixed(1)}% - aim for at least 80%`);
    }

    if (aggregateMetrics.functionCoverage < 85) {
      suggestions.push(`Function coverage is ${aggregateMetrics.functionCoverage.toFixed(1)}% - write tests for uncovered functions`);
    }

    if (aggregateMetrics.branchCoverage < 70) {
      suggestions.push(`Branch coverage is ${aggregateMetrics.branchCoverage.toFixed(1)}% - test different code paths and edge cases`);
    }

    // Find files with lowest coverage
    const lowCoverageFiles = fileCoverages
      .filter(file => file.lines.percentage < 60)
      .sort((a, b) => a.lines.percentage - b.lines.percentage)
      .slice(0, 3);

    if (lowCoverageFiles.length > 0) {
      suggestions.push(`Files needing attention: ${lowCoverageFiles.map(f => `${path.basename(f.filePath)} (${f.lines.percentage.toFixed(1)}%)`).join(', ')}`);
    }

    // Suggest specific testing strategies
    suggestions.push('Focus on testing critical business logic and error handling paths');
    suggestions.push('Add integration tests to complement unit tests');
    suggestions.push('Use test-driven development (TDD) for new features');

    return suggestions;
  }

  private calculateScore(aggregateMetrics: any, thresholds: any): number {
    const coverageThreshold = thresholds.coverage.minimumCoverage || 80;
    const overallCoverage = aggregateMetrics.overallCoverage;

    // Base score is the coverage percentage
    let score = overallCoverage;

    // Bonus for exceeding thresholds
    if (overallCoverage > coverageThreshold) {
      score += Math.min(10, (overallCoverage - coverageThreshold) * 0.5);
    }

    // Penalty for very low coverage
    if (overallCoverage < 50) {
      score -= 20;
    }

    // Bonus for balanced coverage (all metrics above threshold)
    if (aggregateMetrics.lineCoverage > coverageThreshold &&
        aggregateMetrics.functionCoverage > coverageThreshold &&
        aggregateMetrics.branchCoverage > (coverageThreshold * 0.8)) {
      score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  private countTestFiles(config: QualityDetectionConfig): number {
    let testFileCount = 0;
    
    const testPatterns = [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.test.js',
      '**/*.test.jsx',
      '**/*.spec.ts',
      '**/*.spec.tsx',
      '**/*.spec.js',
      '**/*.spec.jsx'
    ];

    const searchDirs = ['src', 'test', 'tests', '__tests__'];
    
    for (const dir of searchDirs) {
      if (fs.existsSync(dir)) {
        testFileCount += this.countFilesInDirectory(dir, testPatterns);
      }
    }

    return testFileCount;
  }

  private countFilesInDirectory(dir: string, patterns: string[]): number {
    let count = 0;
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          count += this.countFilesInDirectory(fullPath, patterns);
        } else if (entry.isFile()) {
          const isTestFile = patterns.some(pattern => {
            const regex = pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
            return new RegExp(regex).test(entry.name);
          });
          
          if (isTestFile) {
            count++;
          }
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to read directory ${dir}`, error as Error);
    }
    
    return count;
  }

  private createEmptyResult(config: QualityDetectionConfig): TestCoverageAnalysisResult {
    return {
      score: 0,
      issues: [],
      suggestions: ['No coverage data available - run tests with coverage to analyze'],
      metrics: {},
      overallCoverage: 0,
      lineCoverage: 0,
      functionCoverage: 0,
      branchCoverage: 0,
      statementCoverage: 0,
      filesAnalyzed: 0,
      testFilesFound: this.countTestFiles(config),
      analysisTime: 0,
      fileCoverages: [],
      coverageThreshold: config.thresholds.coverage.minimumCoverage,
      passesThreshold: false
    };
  }
}