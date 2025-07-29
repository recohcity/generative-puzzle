/**
 * Quality Detection Engine Tests
 * 
 * Comprehensive test suite for the Quality Detection Engine
 */

import { QualityDetectionEngine, QualityDetectionConfig, AnalyzerType } from '../QualityDetectionEngine';
import { AdvancedLogger } from '../../logging/AdvancedLogger';
import { QualityCheckResult, QualityIssue } from '../../types';

// Mock the analyzers
jest.mock('../analyzers/TypeScriptAnalyzer');
jest.mock('../analyzers/ESLintAnalyzer');
jest.mock('../analyzers/TestCoverageAnalyzer');
jest.mock('../analyzers/ComplexityAnalyzer');

describe('QualityDetectionEngine', () => {
  let engine: QualityDetectionEngine;
  let logger: any;
  let mockConfig: Partial<QualityDetectionConfig>;

  beforeEach(() => {
    // Create mock logger
    logger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    // Create mock configuration
    mockConfig = {
      projectRoot: '/test/project',
      includePatterns: ['src/**/*.ts'],
      excludePatterns: ['node_modules/**'],
      enabledAnalyzers: [AnalyzerType.TYPESCRIPT, AnalyzerType.ESLINT],
      thresholds: {
        typescript: { errorThreshold: 0, warningThreshold: 10 },
        eslint: { errorThreshold: 0, warningThreshold: 20 },
        coverage: { minimumCoverage: 80, branchCoverage: 70, functionCoverage: 85 },
        complexity: { cyclomaticComplexity: 10, cognitiveComplexity: 15, maintainabilityIndex: 60 }
      },
      reportingOptions: {
        generateDetailedReport: true,
        includeSourceCode: false,
        includeMetrics: true,
        outputFormat: 'json'
      }
    };

    engine = new QualityDetectionEngine(logger, mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize successfully', async () => {
      await engine.initialize();
      expect(logger.info).toHaveBeenCalledWith(
        'Initializing Quality Detection Engine',
        expect.objectContaining({
          projectRoot: mockConfig.projectRoot,
          enabledAnalyzers: mockConfig.enabledAnalyzers
        })
      );
    });

    test('should handle initialization errors', async () => {
      // Mock analyzer initialization failure
      const mockAnalyzer = {
        initialize: jest.fn().mockRejectedValue(new Error('Initialization failed'))
      };

      // Override the analyzer
      (engine as any).analyzers.set(AnalyzerType.TYPESCRIPT, mockAnalyzer);

      await expect(engine.initialize()).rejects.toThrow('Engine initialization failed');
      expect(logger.error).toHaveBeenCalled();
    });

    test('should not reinitialize if already initialized', async () => {
      await engine.initialize();
      await engine.initialize(); // Second call

      // Should only log initialization once
      expect(logger.info).toHaveBeenCalledTimes(2); // Once for start, once for success
    });
  });

  describe('Quality Checks', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    test('should run all enabled checks', async () => {
      // Mock analyzer results
      const mockResult: QualityCheckResult = {
        score: 85,
        issues: [
          {
            severity: 'warning',
            file: 'test.ts',
            line: 10,
            message: 'Test warning',
            rule: 'test-rule',
            fixable: false
          }
        ],
        suggestions: ['Fix the warning'],
        metrics: { testMetric: 42 }
      };

      // Mock analyzers
      const mockAnalyzer = {
        analyze: jest.fn().mockResolvedValue(mockResult)
      };

      (engine as any).analyzers.set(AnalyzerType.TYPESCRIPT, mockAnalyzer);
      (engine as any).analyzers.set(AnalyzerType.ESLINT, mockAnalyzer);

      const checks = await engine.runAllChecks();

      expect(checks).toHaveLength(2);
      expect(checks[0].status).toBe('completed');
      expect(checks[0].result?.score).toBe(85);
      expect(logger.info).toHaveBeenCalledWith(
        'Quality analysis completed',
        expect.objectContaining({
          checksRun: 2,
          successfulChecks: 2
        })
      );
    });

    test('should handle analyzer failures gracefully', async () => {
      // Mock one successful and one failing analyzer
      const successfulAnalyzer = {
        analyze: jest.fn().mockResolvedValue({
          score: 90,
          issues: [],
          suggestions: [],
          metrics: {}
        })
      };

      const failingAnalyzer = {
        analyze: jest.fn().mockRejectedValue(new Error('Analysis failed'))
      };

      (engine as any).analyzers.set(AnalyzerType.TYPESCRIPT, successfulAnalyzer);
      (engine as any).analyzers.set(AnalyzerType.ESLINT, failingAnalyzer);

      const checks = await engine.runAllChecks();

      expect(checks).toHaveLength(2);
      expect(checks[0].status).toBe('completed');
      expect(checks[1].status).toBe('failed');
      expect(checks[1].result?.issues[0].severity).toBe('error');
    });

    test('should run specific check', async () => {
      const mockResult: QualityCheckResult = {
        score: 75,
        issues: [],
        suggestions: ['Improve TypeScript usage'],
        metrics: { typeErrors: 2 }
      };

      const mockAnalyzer = {
        analyze: jest.fn().mockResolvedValue(mockResult)
      };

      (engine as any).analyzers.set(AnalyzerType.TYPESCRIPT, mockAnalyzer);

      const check = await engine.runSpecificCheck(AnalyzerType.TYPESCRIPT);

      expect(check.type).toBe(AnalyzerType.TYPESCRIPT);
      expect(check.status).toBe('completed');
      expect(check.result?.score).toBe(75);
      expect(mockAnalyzer.analyze).toHaveBeenCalledWith(expect.any(Object));
    });

    test('should handle specific check failure', async () => {
      const mockAnalyzer = {
        analyze: jest.fn().mockRejectedValue(new Error('TypeScript analysis failed'))
      };

      (engine as any).analyzers.set(AnalyzerType.TYPESCRIPT, mockAnalyzer);

      const check = await engine.runSpecificCheck(AnalyzerType.TYPESCRIPT);

      expect(check.status).toBe('failed');
      expect(check.result?.issues[0].message).toContain('Analysis failed');
    });

    test('should throw error for non-existent analyzer', async () => {
      const check = await engine.runSpecificCheck('non-existent' as AnalyzerType);
      expect(check.status).toBe('failed');
      expect(check.result?.issues[0].message).toContain('Analyzer non-existent not found');
    });
  });

  describe('Score Calculation', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    test('should calculate overall score from checks', async () => {
      const mockChecks = [
        {
          type: AnalyzerType.TYPESCRIPT,
          status: 'completed' as const,
          result: { score: 80, issues: [], suggestions: [], metrics: {} },
          timestamp: new Date()
        },
        {
          type: AnalyzerType.ESLINT,
          status: 'completed' as const,
          result: { score: 90, issues: [], suggestions: [], metrics: {} },
          timestamp: new Date()
        }
      ];

      // Mock the score calculator
      const mockCalculateOverallScore = jest.fn().mockResolvedValue(85);
      (engine as any).scoreCalculator.calculateOverallScore = mockCalculateOverallScore;

      const score = await engine.calculateOverallScore(mockChecks);

      expect(score).toBe(85);
      expect(mockCalculateOverallScore).toHaveBeenCalledWith([
        mockChecks[0].result,
        mockChecks[1].result
      ]);
    });

    test('should return 0 for no completed checks', async () => {
      const mockChecks = [
        {
          type: AnalyzerType.TYPESCRIPT,
          status: 'failed' as const,
          timestamp: new Date()
        }
      ];

      const score = await engine.calculateOverallScore(mockChecks);

      expect(score).toBe(0);
      expect(logger.warn).toHaveBeenCalledWith('No completed checks found for score calculation');
    });
  });

  describe('Improvement Suggestions', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    test('should generate improvement suggestions', async () => {
      const mockIssues: QualityIssue[] = [
        {
          severity: 'error',
          file: 'test.ts',
          line: 10,
          message: 'TypeScript error',
          rule: 'typescript-error',
          fixable: false
        },
        {
          severity: 'warning',
          file: 'test.ts',
          line: 15,
          message: 'ESLint warning',
          rule: 'eslint-warning',
          fixable: true
        }
      ];

      const suggestions = await engine.generateImprovementSuggestions(mockIssues);

      expect(suggestions).toContain('Fix 1 TypeScript errors to improve type safety');
      expect(suggestions).toContain('Address 1 ESLint issues to improve code quality');
      expect(suggestions).toContain('1 issues can be automatically fixed with ESLint --fix');
    });

    test('should handle empty issues array', async () => {
      const suggestions = await engine.generateImprovementSuggestions([]);

      expect(suggestions).toHaveLength(0);
    });

    test('should suggest critical issue handling for many errors', async () => {
      const mockIssues: QualityIssue[] = Array.from({ length: 15 }, (_, i) => ({
        severity: 'error' as const,
        file: `test${i}.ts`,
        line: 10,
        message: `Error ${i}`,
        rule: 'test-rule',
        fixable: false
      }));

      const suggestions = await engine.generateImprovementSuggestions(mockIssues);

      expect(suggestions).toContain('High number of critical issues detected - consider a focused refactoring sprint');
    });
  });

  describe('Task Completion Validation', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    test('should validate task completion based on quality score', async () => {
      // Mock successful analysis with high score
      const mockRunAllChecks = jest.fn().mockResolvedValue([
        {
          type: AnalyzerType.TYPESCRIPT,
          status: 'completed',
          result: { score: 85, issues: [], suggestions: [], metrics: {} },
          timestamp: new Date()
        }
      ]);

      const mockCalculateOverallScore = jest.fn().mockResolvedValue(85);

      (engine as any).runAllChecks = mockRunAllChecks;
      (engine as any).scoreCalculator.calculateOverallScore = mockCalculateOverallScore;

      const isComplete = await engine.validateTaskCompletion('test-task-1');

      expect(isComplete).toBe(true);
      expect(logger.info).toHaveBeenCalledWith(
        'Task completion validation result',
        expect.objectContaining({
          taskId: 'test-task-1',
          isComplete: true,
          overallScore: 85
        })
      );
    });

    test('should reject task completion for low quality score', async () => {
      // Mock analysis with low score
      const mockRunAllChecks = jest.fn().mockResolvedValue([
        {
          type: AnalyzerType.TYPESCRIPT,
          status: 'completed',
          result: { 
            score: 50, 
            issues: [
              { severity: 'error', file: 'test.ts', line: 1, message: 'Critical error', rule: 'test', fixable: false }
            ], 
            suggestions: [], 
            metrics: {} 
          },
          timestamp: new Date()
        }
      ]);

      const mockCalculateOverallScore = jest.fn().mockResolvedValue(50);

      (engine as any).runAllChecks = mockRunAllChecks;
      (engine as any).scoreCalculator.calculateOverallScore = mockCalculateOverallScore;

      const isComplete = await engine.validateTaskCompletion('test-task-2');

      expect(isComplete).toBe(false);
    });

    test('should handle validation errors gracefully', async () => {
      const mockRunAllChecks = jest.fn().mockRejectedValue(new Error('Analysis failed'));
      (engine as any).runAllChecks = mockRunAllChecks;

      const isComplete = await engine.validateTaskCompletion('test-task-3');

      expect(isComplete).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        'Task completion validation failed',
        expect.any(Error),
        { taskId: 'test-task-3' }
      );
    });
  });

  describe('Quality Report Generation', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    test('should generate latest quality report', async () => {
      const mockChecks = [
        {
          type: AnalyzerType.TYPESCRIPT,
          status: 'completed' as const,
          result: {
            score: 80,
            issues: [
              { severity: 'warning' as const, file: 'test.ts', line: 1, message: 'Warning', rule: 'test', fixable: false }
            ],
            suggestions: ['Fix warning'],
            metrics: { typeErrors: 1 }
          },
          timestamp: new Date()
        }
      ];

      const mockRunAllChecks = jest.fn().mockResolvedValue(mockChecks);
      const mockCalculateOverallScore = jest.fn().mockResolvedValue(80);
      const mockGenerateImprovementSuggestions = jest.fn().mockResolvedValue(['Additional suggestion']);

      (engine as any).runAllChecks = mockRunAllChecks;
      (engine as any).scoreCalculator.calculateOverallScore = mockCalculateOverallScore;
      engine.generateImprovementSuggestions = mockGenerateImprovementSuggestions;

      const report = await engine.getLatestQualityReport();

      expect(report.score).toBe(80);
      expect(report.issues).toHaveLength(1);
      expect(report.suggestions).toContain('Fix warning');
      expect(report.suggestions).toContain('Additional suggestion');
      expect(report.metrics.typeErrors).toBe(1);
    });
  });

  describe('Comprehensive Analysis', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    test('should perform comprehensive analysis', async () => {
      const mockChecks = [
        {
          type: AnalyzerType.TYPESCRIPT,
          status: 'completed' as const,
          result: {
            score: 85,
            issues: [
              { severity: 'error' as const, file: 'test.ts', line: 1, message: 'Error', rule: 'test', fixable: false }
            ],
            suggestions: ['Fix error'],
            metrics: { typeErrors: 1 }
          },
          timestamp: new Date()
        }
      ];

      const mockRunAllChecks = jest.fn().mockResolvedValue(mockChecks);
      const mockCalculateOverallScore = jest.fn().mockResolvedValue(85);

      (engine as any).runAllChecks = mockRunAllChecks;
      (engine as any).scoreCalculator.calculateOverallScore = mockCalculateOverallScore;

      const result = await engine.performComprehensiveAnalysis();

      expect(result.overallScore).toBe(85);
      expect(result.analysisResults.size).toBe(1);
      expect(result.summary.totalIssues).toBe(1);
      expect(result.summary.criticalIssues).toBe(1);
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Error Handling', () => {
    test('should throw error when not initialized', async () => {
      const uninitializedEngine = new QualityDetectionEngine(logger, mockConfig);

      await expect(uninitializedEngine.runAllChecks()).rejects.toThrow(
        'Quality Detection Engine not initialized'
      );
    });

    test('should handle configuration errors', () => {
      const invalidConfig = {
        ...mockConfig,
        enabledAnalyzers: ['invalid-analyzer' as AnalyzerType]
      };

      expect(() => new QualityDetectionEngine(logger, invalidConfig)).not.toThrow();
    });
  });

  describe('Configuration Merging', () => {
    test('should use default configuration when none provided', () => {
      const engineWithDefaults = new QualityDetectionEngine(logger);
      const config = (engineWithDefaults as any).config;

      expect(config.projectRoot).toBe(process.cwd());
      expect(config.includePatterns).toContain('src/**/*.ts');
      expect(config.excludePatterns).toContain('node_modules/**');
      expect(config.enabledAnalyzers).toHaveLength(4);
    });

    test('should merge custom configuration with defaults', () => {
      const customConfig = {
        projectRoot: '/custom/path',
        includePatterns: ['custom/**/*.ts']
      };

      const engine = new QualityDetectionEngine(logger, customConfig);
      const config = (engine as any).config;

      expect(config.projectRoot).toBe('/custom/path');
      expect(config.includePatterns).toEqual(['custom/**/*.ts']);
      expect(config.excludePatterns).toContain('node_modules/**'); // Should keep defaults
    });
  });
});