/**
 * Quality Detection Engine
 * 
 * Core engine for automated code quality detection and analysis.
 * Integrates TypeScript compiler API, ESLint, test coverage, and complexity analysis.
 */

import { ILogger, IQualityDetectionEngine } from '../interfaces';
import { QualityCheck, QualityCheckResult, QualityIssue } from '../types';
import { TypeScriptAnalyzer } from './analyzers/TypeScriptAnalyzer';
import { ESLintAnalyzer } from './analyzers/ESLintAnalyzer';
import { TestCoverageAnalyzer } from './analyzers/TestCoverageAnalyzer';
import { ComplexityAnalyzer } from './analyzers/ComplexityAnalyzer';
import { QualityScoreCalculator } from './QualityScoreCalculator';
import { ValidationError, SystemError } from '../error-handling/ErrorTypes';

export interface QualityDetectionConfig {
  projectRoot: string;
  includePatterns: string[];
  excludePatterns: string[];
  enabledAnalyzers: AnalyzerType[];
  thresholds: QualityThresholds;
  reportingOptions: ReportingOptions;
}

export interface QualityThresholds {
  typescript: {
    errorThreshold: number;
    warningThreshold: number;
  };
  eslint: {
    errorThreshold: number;
    warningThreshold: number;
  };
  coverage: {
    minimumCoverage: number;
    branchCoverage: number;
    functionCoverage: number;
  };
  complexity: {
    cyclomaticComplexity: number;
    cognitiveComplexity: number;
    maintainabilityIndex: number;
  };
}

export interface ReportingOptions {
  generateDetailedReport: boolean;
  includeSourceCode: boolean;
  includeMetrics: boolean;
  outputFormat: 'json' | 'html' | 'xml';
}

export enum AnalyzerType {
  TYPESCRIPT = 'typescript',
  ESLINT = 'eslint',
  COVERAGE = 'coverage',
  COMPLEXITY = 'complexity'
}

export interface QualityAnalysisResult {
  overallScore: number;
  analysisResults: Map<AnalyzerType, QualityCheckResult>;
  summary: QualityAnalysisSummary;
  recommendations: string[];
  metrics: QualityMetrics;
  timestamp: Date;
  duration: number;
}

export interface QualityAnalysisSummary {
  totalIssues: number;
  criticalIssues: number;
  majorIssues: number;
  minorIssues: number;
  filesAnalyzed: number;
  linesOfCode: number;
  technicalDebt: number; // in hours
}

export interface QualityMetrics {
  maintainabilityIndex: number;
  technicalDebtRatio: number;
  codeSmellDensity: number;
  duplicatedLinesDensity: number;
  testCoverage: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
}

export class QualityDetectionEngine implements IQualityDetectionEngine {
  private logger: ILogger;
  private config: QualityDetectionConfig;
  private analyzers: Map<AnalyzerType, any> = new Map();
  private scoreCalculator: QualityScoreCalculator;
  private isInitialized: boolean = false;

  constructor(logger: ILogger, config: Partial<QualityDetectionConfig> = {}) {
    this.logger = logger;
    this.config = this.mergeWithDefaults(config);
    this.scoreCalculator = new QualityScoreCalculator(logger);
    this.initializeAnalyzers();
  }

  /**
   * Initialize the quality detection engine
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.logger.info('Initializing Quality Detection Engine', {
      projectRoot: this.config.projectRoot,
      enabledAnalyzers: this.config.enabledAnalyzers
    });

    try {
      // Initialize all enabled analyzers
      for (const analyzerType of this.config.enabledAnalyzers) {
        const analyzer = this.analyzers.get(analyzerType);
        if (analyzer && typeof analyzer.initialize === 'function') {
          await analyzer.initialize();
          this.logger.debug(`${analyzerType} analyzer initialized`);
        }
      }

      this.isInitialized = true;
      this.logger.info('Quality Detection Engine initialized successfully');

    } catch (error) {
      this.logger.error('Failed to initialize Quality Detection Engine', error as Error);
      throw new SystemError(`Engine initialization failed: ${(error as Error).message}`);
    }
  }

  /**
   * Run all enabled quality checks
   */
  async runAllChecks(): Promise<QualityCheck[]> {
    this.ensureInitialized();
    
    this.logger.info('Starting comprehensive quality analysis', {
      analyzers: this.config.enabledAnalyzers.length,
      projectRoot: this.config.projectRoot
    });

    const startTime = Date.now();
    const checks: QualityCheck[] = [];

    try {
      // Run all enabled analyzers in parallel
      const analysisPromises = this.config.enabledAnalyzers.map(async (analyzerType) => {
        return await this.runSpecificCheck(analyzerType);
      });

      const results = await Promise.allSettled(analysisPromises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          checks.push(result.value);
        } else {
          const analyzerType = this.config.enabledAnalyzers[index];
          this.logger.error(`${analyzerType} analysis failed`, result.reason);
          
          // Create a failed check result
          checks.push({
            type: analyzerType,
            status: 'failed',
            result: {
              score: 0,
              issues: [{
                severity: 'error',
                file: 'system',
                message: `${analyzerType} analysis failed: ${result.reason}`,
                rule: 'system-error',
                fixable: false
              }],
              suggestions: [`Fix ${analyzerType} analyzer configuration`],
              metrics: {}
            },
            timestamp: new Date()
          });
        }
      });

      const duration = Date.now() - startTime;
      this.logger.info('Quality analysis completed', {
        duration,
        checksRun: checks.length,
        successfulChecks: checks.filter(c => c.status === 'completed').length
      });

      return checks;

    } catch (error) {
      this.logger.error('Quality analysis failed', error as Error);
      throw new SystemError(`Quality analysis failed: ${(error as Error).message}`);
    }
  }

  /**
   * Run a specific quality check
   */
  async runSpecificCheck(type: AnalyzerType): Promise<QualityCheck> {
    this.ensureInitialized();

    this.logger.debug(`Running ${type} analysis`);
    const startTime = Date.now();

    const check: QualityCheck = {
      type,
      status: 'running',
      timestamp: new Date()
    };

    try {
      const analyzer = this.analyzers.get(type);
      if (!analyzer) {
        throw new ValidationError(`Analyzer ${type} not found or not enabled`);
      }

      const result = await analyzer.analyze(this.config);
      
      check.status = 'completed';
      check.result = result;

      const duration = Date.now() - startTime;
      this.logger.debug(`${type} analysis completed`, {
        duration,
        score: result.score,
        issuesFound: result.issues.length
      });

      return check;

    } catch (error) {
      check.status = 'failed';
      check.result = {
        score: 0,
        issues: [{
          severity: 'error',
          file: 'system',
          message: `Analysis failed: ${(error as Error).message}`,
          rule: 'analysis-error',
          fixable: false
        }],
        suggestions: ['Check analyzer configuration and project setup'],
        metrics: {}
      };

      this.logger.error(`${type} analysis failed`, error as Error);
      return check;
    }
  }

  /**
   * Calculate overall quality score from checks
   */
  async calculateOverallScore(checks: QualityCheck[]): Promise<number> {
    this.logger.debug('Calculating overall quality score', {
      checksCount: checks.length
    });

    try {
      const completedChecks = checks.filter(check => 
        check.status === 'completed' && check.result
      );

      if (completedChecks.length === 0) {
        this.logger.warn('No completed checks found for score calculation');
        return 0;
      }

      const overallScore = await this.scoreCalculator.calculateOverallScore(
        completedChecks.map(check => check.result!)
      );

      this.logger.info('Overall quality score calculated', {
        score: overallScore,
        basedOnChecks: completedChecks.length
      });

      return overallScore;

    } catch (error) {
      this.logger.error('Failed to calculate overall score', error as Error);
      throw new SystemError(`Score calculation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Generate improvement suggestions based on analysis results
   */
  async generateImprovementSuggestions(issues: QualityIssue[]): Promise<string[]> {
    this.logger.debug('Generating improvement suggestions', {
      issuesCount: issues.length
    });

    const suggestions: string[] = [];
    const issuesByCategory = this.categorizeIssues(issues);

    // TypeScript suggestions
    if (issuesByCategory.typescript.length > 0) {
      suggestions.push(`Fix ${issuesByCategory.typescript.length} TypeScript errors to improve type safety`);
      
      const errorTypes = this.getUniqueErrorTypes(issuesByCategory.typescript);
      if (errorTypes.includes('strict-mode')) {
        suggestions.push('Enable strict mode in TypeScript configuration for better type checking');
      }
    }

    // ESLint suggestions
    if (issuesByCategory.eslint.length > 0) {
      suggestions.push(`Address ${issuesByCategory.eslint.length} ESLint issues to improve code quality`);
      
      const fixableCount = issuesByCategory.eslint.filter(issue => issue.fixable).length;
      if (fixableCount > 0) {
        suggestions.push(`${fixableCount} issues can be automatically fixed with ESLint --fix`);
      }
    }

    // Coverage suggestions
    if (issuesByCategory.coverage.length > 0) {
      suggestions.push('Increase test coverage by writing tests for uncovered code paths');
      suggestions.push('Focus on testing critical business logic and edge cases');
    }

    // Complexity suggestions
    if (issuesByCategory.complexity.length > 0) {
      suggestions.push('Reduce code complexity by breaking down large functions and classes');
      suggestions.push('Consider refactoring complex conditional logic into smaller functions');
    }

    // General suggestions based on issue patterns
    const criticalIssues = issues.filter(issue => issue.severity === 'error').length;
    if (criticalIssues > 10) {
      suggestions.push('High number of critical issues detected - consider a focused refactoring sprint');
    }

    const duplicateIssues = this.findDuplicateIssues(issues);
    if (duplicateIssues.length > 0) {
      suggestions.push('Address recurring patterns to prevent similar issues in the future');
    }

    this.logger.debug('Generated improvement suggestions', {
      suggestionsCount: suggestions.length
    });

    return suggestions;
  }

  /**
   * Validate task completion based on quality checks
   */
  async validateTaskCompletion(taskId: string): Promise<boolean> {
    this.logger.info('Validating task completion through quality checks', { taskId });

    try {
      const checks = await this.runAllChecks();
      const overallScore = await this.calculateOverallScore(checks);

      // Define completion criteria
      const completionCriteria = {
        minimumScore: 70,
        maxCriticalIssues: 0,
        maxMajorIssues: 5
      };

      const criticalIssues = this.countIssuesBySeverity(checks, 'error');
      const majorIssues = this.countIssuesBySeverity(checks, 'warning');

      const isComplete = 
        overallScore >= completionCriteria.minimumScore &&
        criticalIssues <= completionCriteria.maxCriticalIssues &&
        majorIssues <= completionCriteria.maxMajorIssues;

      this.logger.info('Task completion validation result', {
        taskId,
        isComplete,
        overallScore,
        criticalIssues,
        majorIssues
      });

      return isComplete;

    } catch (error) {
      this.logger.error('Task completion validation failed', error as Error, { taskId });
      return false;
    }
  }

  /**
   * Get the latest quality report
   */
  async getLatestQualityReport(): Promise<QualityCheckResult> {
    this.logger.info('Generating latest quality report');

    try {
      const checks = await this.runAllChecks();
      const overallScore = await this.calculateOverallScore(checks);
      
      const allIssues: QualityIssue[] = [];
      const allSuggestions: string[] = [];
      const combinedMetrics: Record<string, number> = {};

      // Combine results from all checks
      checks.forEach(check => {
        if (check.result) {
          allIssues.push(...check.result.issues);
          allSuggestions.push(...check.result.suggestions);
          Object.assign(combinedMetrics, check.result.metrics);
        }
      });

      const additionalSuggestions = await this.generateImprovementSuggestions(allIssues);
      const uniqueSuggestions = [...new Set([...allSuggestions, ...additionalSuggestions])];

      const report: QualityCheckResult = {
        score: overallScore,
        issues: allIssues,
        suggestions: uniqueSuggestions,
        metrics: combinedMetrics
      };

      this.logger.info('Quality report generated', {
        score: overallScore,
        issuesCount: allIssues.length,
        suggestionsCount: uniqueSuggestions.length
      });

      return report;

    } catch (error) {
      this.logger.error('Failed to generate quality report', error as Error);
      throw new SystemError(`Quality report generation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Perform comprehensive quality analysis
   */
  async performComprehensiveAnalysis(): Promise<QualityAnalysisResult> {
    this.logger.info('Starting comprehensive quality analysis');
    const startTime = Date.now();

    try {
      const checks = await this.runAllChecks();
      const overallScore = await this.calculateOverallScore(checks);
      
      // Build analysis results map
      const analysisResults = new Map<AnalyzerType, QualityCheckResult>();
      checks.forEach(check => {
        if (check.result) {
          analysisResults.set(check.type as AnalyzerType, check.result);
        }
      });

      // Calculate summary
      const summary = this.calculateAnalysisSummary(checks);
      
      // Generate recommendations
      const allIssues = checks.flatMap(check => check.result?.issues || []);
      const recommendations = await this.generateImprovementSuggestions(allIssues);
      
      // Calculate metrics
      const metrics = this.calculateQualityMetrics(checks);

      const duration = Date.now() - startTime;

      const result: QualityAnalysisResult = {
        overallScore,
        analysisResults,
        summary,
        recommendations,
        metrics,
        timestamp: new Date(),
        duration
      };

      this.logger.info('Comprehensive analysis completed', {
        duration,
        overallScore,
        totalIssues: summary.totalIssues
      });

      return result;

    } catch (error) {
      this.logger.error('Comprehensive analysis failed', error as Error);
      throw new SystemError(`Comprehensive analysis failed: ${(error as Error).message}`);
    }
  }

  // Private helper methods

  private mergeWithDefaults(config: Partial<QualityDetectionConfig>): QualityDetectionConfig {
    return {
      projectRoot: config.projectRoot || process.cwd(),
      includePatterns: config.includePatterns || ['src/**/*.ts', 'src/**/*.tsx'],
      excludePatterns: config.excludePatterns || ['node_modules/**', 'dist/**', '**/*.test.ts'],
      enabledAnalyzers: config.enabledAnalyzers || [
        AnalyzerType.TYPESCRIPT,
        AnalyzerType.ESLINT,
        AnalyzerType.COVERAGE,
        AnalyzerType.COMPLEXITY
      ],
      thresholds: {
        typescript: {
          errorThreshold: 0,
          warningThreshold: 10,
          ...config.thresholds?.typescript
        },
        eslint: {
          errorThreshold: 0,
          warningThreshold: 20,
          ...config.thresholds?.eslint
        },
        coverage: {
          minimumCoverage: 80,
          branchCoverage: 70,
          functionCoverage: 85,
          ...config.thresholds?.coverage
        },
        complexity: {
          cyclomaticComplexity: 10,
          cognitiveComplexity: 15,
          maintainabilityIndex: 60,
          ...config.thresholds?.complexity
        },
        ...config.thresholds
      },
      reportingOptions: {
        generateDetailedReport: true,
        includeSourceCode: false,
        includeMetrics: true,
        outputFormat: 'json',
        ...config.reportingOptions
      }
    };
  }

  private initializeAnalyzers(): void {
    // Initialize TypeScript analyzer
    if (this.config.enabledAnalyzers.includes(AnalyzerType.TYPESCRIPT)) {
      this.analyzers.set(AnalyzerType.TYPESCRIPT, new TypeScriptAnalyzer(this.logger));
    }

    // Initialize ESLint analyzer
    if (this.config.enabledAnalyzers.includes(AnalyzerType.ESLINT)) {
      this.analyzers.set(AnalyzerType.ESLINT, new ESLintAnalyzer(this.logger));
    }

    // Initialize Coverage analyzer
    if (this.config.enabledAnalyzers.includes(AnalyzerType.COVERAGE)) {
      this.analyzers.set(AnalyzerType.COVERAGE, new TestCoverageAnalyzer(this.logger));
    }

    // Initialize Complexity analyzer
    if (this.config.enabledAnalyzers.includes(AnalyzerType.COMPLEXITY)) {
      this.analyzers.set(AnalyzerType.COMPLEXITY, new ComplexityAnalyzer(this.logger));
    }
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new SystemError('Quality Detection Engine not initialized. Call initialize() first.');
    }
  }

  private categorizeIssues(issues: QualityIssue[]): Record<string, QualityIssue[]> {
    const categories: Record<string, QualityIssue[]> = {
      typescript: [],
      eslint: [],
      coverage: [],
      complexity: []
    };

    issues.forEach(issue => {
      if (issue.rule?.startsWith('@typescript-eslint') || issue.rule?.includes('typescript')) {
        categories.typescript.push(issue);
      } else if (issue.rule?.includes('coverage')) {
        categories.coverage.push(issue);
      } else if (issue.rule?.includes('complexity')) {
        categories.complexity.push(issue);
      } else {
        categories.eslint.push(issue);
      }
    });

    return categories;
  }

  private getUniqueErrorTypes(issues: QualityIssue[]): string[] {
    return [...new Set(issues.map(issue => issue.rule || 'unknown'))];
  }

  private findDuplicateIssues(issues: QualityIssue[]): QualityIssue[] {
    const issueMap = new Map<string, QualityIssue[]>();
    
    issues.forEach(issue => {
      const key = `${issue.rule}-${issue.message}`;
      if (!issueMap.has(key)) {
        issueMap.set(key, []);
      }
      issueMap.get(key)!.push(issue);
    });

    return Array.from(issueMap.values())
      .filter(group => group.length > 1)
      .flat();
  }

  private countIssuesBySeverity(checks: QualityCheck[], severity: string): number {
    return checks.reduce((count, check) => {
      if (check.result) {
        return count + check.result.issues.filter(issue => issue.severity === severity).length;
      }
      return count;
    }, 0);
  }

  private calculateAnalysisSummary(checks: QualityCheck[]): QualityAnalysisSummary {
    const allIssues = checks.flatMap(check => check.result?.issues || []);
    
    return {
      totalIssues: allIssues.length,
      criticalIssues: allIssues.filter(issue => issue.severity === 'error').length,
      majorIssues: allIssues.filter(issue => issue.severity === 'warning').length,
      minorIssues: allIssues.filter(issue => issue.severity === 'info').length,
      filesAnalyzed: new Set(allIssues.map(issue => issue.file)).size,
      linesOfCode: 0, // Would be calculated by analyzers
      technicalDebt: allIssues.length * 0.5 // Rough estimate: 30 minutes per issue
    };
  }

  private calculateQualityMetrics(checks: QualityCheck[]): QualityMetrics {
    const defaultMetrics: QualityMetrics = {
      maintainabilityIndex: 0,
      technicalDebtRatio: 0,
      codeSmellDensity: 0,
      duplicatedLinesDensity: 0,
      testCoverage: 0,
      cyclomaticComplexity: 0,
      cognitiveComplexity: 0
    };

    // Combine metrics from all analyzers
    checks.forEach(check => {
      if (check.result?.metrics) {
        Object.assign(defaultMetrics, check.result.metrics);
      }
    });

    return defaultMetrics;
  }
}