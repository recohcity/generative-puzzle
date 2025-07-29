/**
 * Improvement Suggestion Engine
 * 
 * Generates intelligent improvement suggestions based on quality analysis results.
 */

import { ILogger } from '../interfaces';
import { QualityCheckResult, QualityIssue } from '../types';
import { ComprehensiveQualityMetrics } from './AdvancedQualityMetrics';

export interface ImprovementSuggestion {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'technical-debt' | 'testing' | 'complexity' | 'style' | 'performance';
  title: string;
  description: string;
  impact: number; // 0-100
  effort: number; // 0-100
  timeEstimate: string;
  steps: string[];
  resources: string[];
  relatedIssues: string[];
}

export interface SuggestionContext {
  projectSize: 'small' | 'medium' | 'large';
  teamSize: number;
  timeline: 'urgent' | 'normal' | 'flexible';
  budget: 'limited' | 'moderate' | 'flexible';
  experience: 'junior' | 'mixed' | 'senior';
}

export class ImprovementSuggestionEngine {
  private logger: ILogger;

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  /**
   * Generate improvement suggestions based on quality analysis
   */
  generateSuggestions(
    qualityResults: QualityCheckResult[],
    metrics?: ComprehensiveQualityMetrics,
    context?: SuggestionContext
  ): ImprovementSuggestion[] {
    this.logger.info('Generating improvement suggestions');

    const suggestions: ImprovementSuggestion[] = [];
    const allIssues = qualityResults.flatMap(result => result.issues);

    // Generate suggestions based on different categories
    suggestions.push(...this.generateTechnicalDebtSuggestions(allIssues, metrics));
    suggestions.push(...this.generateTestingSuggestions(qualityResults, metrics));
    suggestions.push(...this.generateComplexitySuggestions(qualityResults, metrics));
    suggestions.push(...this.generateStyleSuggestions(allIssues));
    suggestions.push(...this.generatePerformanceSuggestions(qualityResults, metrics));

    // Sort by priority and impact
    const sortedSuggestions = this.prioritizeSuggestions(suggestions, context);

    this.logger.info('Generated improvement suggestions', {
      count: sortedSuggestions.length,
      critical: sortedSuggestions.filter(s => s.priority === 'critical').length,
      high: sortedSuggestions.filter(s => s.priority === 'high').length
    });

    return sortedSuggestions;
  }

  private generateTechnicalDebtSuggestions(
    issues: QualityIssue[],
    metrics?: ComprehensiveQualityMetrics
  ): ImprovementSuggestion[] {
    const suggestions: ImprovementSuggestion[] = [];

    const errorIssues = issues.filter(issue => issue.severity === 'error');
    if (errorIssues.length > 10) {
      suggestions.push({
        id: 'reduce-critical-errors',
        priority: 'critical',
        category: 'technical-debt',
        title: 'Reduce Critical Error Count',
        description: `Address ${errorIssues.length} critical errors that are blocking quality improvement`,
        impact: 90,
        effort: 70,
        timeEstimate: '2-3 weeks',
        steps: [
          'Prioritize errors by impact and frequency',
          'Create focused sprints for error resolution',
          'Implement automated error detection',
          'Set up monitoring for new errors'
        ],
        resources: [
          'Error tracking documentation',
          'Team debugging sessions',
          'Code review guidelines'
        ],
        relatedIssues: errorIssues.slice(0, 5).map(issue => `${issue.file}:${issue.line}`)
      });
    }

    if (metrics?.technicalDebt.totalDebtHours > 100) {
      suggestions.push({
        id: 'technical-debt-reduction',
        priority: 'high',
        category: 'technical-debt',
        title: 'Technical Debt Reduction Plan',
        description: `Implement systematic approach to reduce ${metrics.technicalDebt.totalDebtHours.toFixed(1)} hours of technical debt`,
        impact: 80,
        effort: 85,
        timeEstimate: '4-6 weeks',
        steps: [
          'Audit and categorize technical debt',
          'Allocate 20% of sprint capacity to debt reduction',
          'Refactor high-impact, low-effort items first',
          'Establish debt prevention practices'
        ],
        resources: [
          'Refactoring best practices guide',
          'Code quality metrics dashboard',
          'Technical debt tracking tools'
        ],
        relatedIssues: []
      });
    }

    return suggestions;
  }

  private generateTestingSuggestions(
    results: QualityCheckResult[],
    metrics?: ComprehensiveQualityMetrics
  ): ImprovementSuggestion[] {
    const suggestions: ImprovementSuggestion[] = [];

    const coverageResult = results.find(r => r.metrics?.testCoverage !== undefined);
    const coverage = coverageResult?.metrics?.testCoverage || 0;

    if (coverage < 60) {
      suggestions.push({
        id: 'increase-test-coverage',
        priority: coverage < 30 ? 'critical' : 'high',
        category: 'testing',
        title: 'Increase Test Coverage',
        description: `Current test coverage is ${coverage.toFixed(1)}%. Target: 80%+`,
        impact: 85,
        effort: 60,
        timeEstimate: '3-4 weeks',
        steps: [
          'Identify critical paths with no test coverage',
          'Write unit tests for core business logic',
          'Add integration tests for key workflows',
          'Set up coverage reporting and gates'
        ],
        resources: [
          'Testing framework documentation',
          'Test-driven development guide',
          'Coverage analysis tools'
        ],
        relatedIssues: []
      });
    }

    if (coverage > 0 && coverage < 80) {
      const missingCoverage = 80 - coverage;
      suggestions.push({
        id: 'improve-test-quality',
        priority: 'medium',
        category: 'testing',
        title: 'Improve Test Quality and Coverage',
        description: `Add ${missingCoverage.toFixed(1)}% more test coverage focusing on edge cases`,
        impact: 70,
        effort: 50,
        timeEstimate: '2-3 weeks',
        steps: [
          'Review existing tests for completeness',
          'Add edge case and error condition tests',
          'Implement property-based testing where applicable',
          'Add performance and load tests'
        ],
        resources: [
          'Advanced testing techniques guide',
          'Mock and stub libraries',
          'Test data generation tools'
        ],
        relatedIssues: []
      });
    }

    return suggestions;
  }

  private generateComplexitySuggestions(
    results: QualityCheckResult[],
    metrics?: ComprehensiveQualityMetrics
  ): ImprovementSuggestion[] {
    const suggestions: ImprovementSuggestion[] = [];

    const complexityResult = results.find(r => r.metrics?.averageCyclomaticComplexity !== undefined);
    const avgComplexity = complexityResult?.metrics?.averageCyclomaticComplexity || 0;

    if (avgComplexity > 10) {
      suggestions.push({
        id: 'reduce-code-complexity',
        priority: avgComplexity > 15 ? 'high' : 'medium',
        category: 'complexity',
        title: 'Reduce Code Complexity',
        description: `Average cyclomatic complexity is ${avgComplexity.toFixed(1)}. Target: <10`,
        impact: 75,
        effort: 65,
        timeEstimate: '3-5 weeks',
        steps: [
          'Identify most complex functions and classes',
          'Break down large functions into smaller ones',
          'Extract common logic into utility functions',
          'Simplify conditional logic using patterns'
        ],
        resources: [
          'Refactoring patterns guide',
          'Clean code principles',
          'Complexity analysis tools'
        ],
        relatedIssues: []
      });
    }

    if (metrics?.maintainability.maintainabilityIndex < 60) {
      suggestions.push({
        id: 'improve-maintainability',
        priority: 'medium',
        category: 'complexity',
        title: 'Improve Code Maintainability',
        description: `Maintainability index is ${metrics.maintainability.maintainabilityIndex.toFixed(1)}. Target: >70`,
        impact: 70,
        effort: 55,
        timeEstimate: '2-4 weeks',
        steps: [
          'Improve code documentation and comments',
          'Standardize naming conventions',
          'Reduce coupling between modules',
          'Increase cohesion within modules'
        ],
        resources: [
          'Code documentation standards',
          'Architecture design patterns',
          'Maintainability metrics guide'
        ],
        relatedIssues: []
      });
    }

    return suggestions;
  }

  private generateStyleSuggestions(issues: QualityIssue[]): ImprovementSuggestion[] {
    const suggestions: ImprovementSuggestion[] = [];

    const styleIssues = issues.filter(issue => 
      issue.rule?.includes('style') || 
      issue.rule?.includes('format') ||
      issue.severity === 'warning'
    );

    if (styleIssues.length > 20) {
      const fixableCount = styleIssues.filter(issue => issue.fixable).length;
      
      suggestions.push({
        id: 'fix-style-issues',
        priority: 'low',
        category: 'style',
        title: 'Fix Code Style Issues',
        description: `Address ${styleIssues.length} style issues (${fixableCount} auto-fixable)`,
        impact: 40,
        effort: 20,
        timeEstimate: '1-2 days',
        steps: [
          'Run automated style fixes',
          'Configure IDE for consistent formatting',
          'Set up pre-commit hooks for style checking',
          'Update style guide documentation'
        ],
        resources: [
          'Code formatter configuration',
          'Style guide documentation',
          'Pre-commit hook setup'
        ],
        relatedIssues: styleIssues.slice(0, 10).map(issue => `${issue.file}:${issue.line}`)
      });
    }

    return suggestions;
  }

  private generatePerformanceSuggestions(
    results: QualityCheckResult[],
    metrics?: ComprehensiveQualityMetrics
  ): ImprovementSuggestion[] {
    const suggestions: ImprovementSuggestion[] = [];

    // Check for performance-related issues
    const performanceIssues = results.flatMap(result => result.issues).filter(issue =>
      issue.rule?.includes('performance') ||
      issue.rule?.includes('optimization') ||
      issue.message.toLowerCase().includes('performance')
    );

    if (performanceIssues.length > 0) {
      suggestions.push({
        id: 'optimize-performance',
        priority: 'medium',
        category: 'performance',
        title: 'Optimize Code Performance',
        description: `Address ${performanceIssues.length} performance-related issues`,
        impact: 60,
        effort: 45,
        timeEstimate: '1-2 weeks',
        steps: [
          'Profile application performance',
          'Identify performance bottlenecks',
          'Optimize critical code paths',
          'Add performance monitoring'
        ],
        resources: [
          'Performance profiling tools',
          'Optimization best practices',
          'Performance monitoring setup'
        ],
        relatedIssues: performanceIssues.map(issue => `${issue.file}:${issue.line}`)
      });
    }

    return suggestions;
  }

  private prioritizeSuggestions(
    suggestions: ImprovementSuggestion[],
    context?: SuggestionContext
  ): ImprovementSuggestion[] {
    return suggestions.sort((a, b) => {
      // Priority order: critical > high > medium > low
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // If same priority, sort by impact/effort ratio
      const aRatio = a.impact / Math.max(a.effort, 1);
      const bRatio = b.impact / Math.max(b.effort, 1);
      
      return bRatio - aRatio;
    });
  }
}