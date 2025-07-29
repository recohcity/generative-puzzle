/**
 * Quality Score Calculator
 * 
 * Calculates overall quality scores based on multiple analysis results.
 * Implements weighted scoring algorithms and quality metrics aggregation.
 */

import { ILogger } from '../interfaces';
import { QualityCheckResult, QualityIssue } from '../types';

export interface QualityWeights {
  typescript: number;
  eslint: number;
  coverage: number;
  complexity: number;
}

export interface QualityScoreBreakdown {
  overallScore: number;
  componentScores: {
    typescript: number;
    eslint: number;
    coverage: number;
    complexity: number;
  };
  weights: QualityWeights;
  penalties: QualityPenalties;
  bonuses: QualityBonuses;
}

export interface QualityPenalties {
  criticalIssues: number;
  highComplexity: number;
  lowCoverage: number;
  typeErrors: number;
  total: number;
}

export interface QualityBonuses {
  strictMode: number;
  highCoverage: number;
  lowComplexity: number;
  cleanCode: number;
  total: number;
}

export interface QualityTrend {
  timestamp: Date;
  score: number;
  improvement: number;
  degradation: number;
}

export class QualityScoreCalculator {
  private logger: ILogger;
  private defaultWeights: QualityWeights = {
    typescript: 0.25,
    eslint: 0.25,
    coverage: 0.30,
    complexity: 0.20
  };

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  /**
   * Calculate overall quality score from multiple analysis results
   */
  async calculateOverallScore(
    results: QualityCheckResult[],
    customWeights?: Partial<QualityWeights>
  ): Promise<number> {
    this.logger.debug('Calculating overall quality score', {
      resultsCount: results.length
    });

    if (results.length === 0) {
      this.logger.warn('No analysis results provided for score calculation');
      return 0;
    }

    const weights = { ...this.defaultWeights, ...customWeights };
    const breakdown = await this.calculateScoreBreakdown(results, weights);

    this.logger.debug('Overall quality score calculated', {
      score: breakdown.overallScore,
      componentScores: breakdown.componentScores
    });

    return breakdown.overallScore;
  }

  /**
   * Calculate detailed score breakdown
   */
  async calculateScoreBreakdown(
    results: QualityCheckResult[],
    weights: QualityWeights
  ): Promise<QualityScoreBreakdown> {
    this.logger.debug('Calculating detailed score breakdown');

    // Initialize component scores
    const componentScores = {
      typescript: 0,
      eslint: 0,
      coverage: 0,
      complexity: 0
    };

    // Calculate individual component scores
    results.forEach(result => {
      const score = this.normalizeScore(result.score);
      
      // Determine component type based on metrics or issues
      const componentType = this.determineComponentType(result);
      if (componentType && componentScores.hasOwnProperty(componentType)) {
        componentScores[componentType as keyof typeof componentScores] = score;
      }
    });

    // Calculate penalties and bonuses
    const penalties = this.calculatePenalties(results);
    const bonuses = this.calculateBonuses(results);

    // Calculate weighted overall score
    const weightedScore = 
      componentScores.typescript * weights.typescript +
      componentScores.eslint * weights.eslint +
      componentScores.coverage * weights.coverage +
      componentScores.complexity * weights.complexity;

    // Apply penalties and bonuses
    const overallScore = Math.max(0, Math.min(100, 
      weightedScore - penalties.total + bonuses.total
    ));

    const breakdown: QualityScoreBreakdown = {
      overallScore,
      componentScores,
      weights,
      penalties,
      bonuses
    };

    this.logger.debug('Score breakdown calculated', {
      overallScore,
      weightedScore,
      penalties: penalties.total,
      bonuses: bonuses.total
    });

    return breakdown;
  }

  /**
   * Calculate quality trend over time
   */
  calculateQualityTrend(
    currentScore: number,
    previousScores: number[],
    timeWindow: number = 7
  ): QualityTrend {
    const recentScores = previousScores.slice(-timeWindow);
    
    if (recentScores.length === 0) {
      return {
        timestamp: new Date(),
        score: currentScore,
        improvement: 0,
        degradation: 0
      };
    }

    const averagePreviousScore = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
    const scoreDifference = currentScore - averagePreviousScore;

    return {
      timestamp: new Date(),
      score: currentScore,
      improvement: Math.max(0, scoreDifference),
      degradation: Math.max(0, -scoreDifference)
    };
  }

  /**
   * Calculate quality score for a specific category
   */
  calculateCategoryScore(
    issues: QualityIssue[],
    metrics: Record<string, number>,
    category: 'typescript' | 'eslint' | 'coverage' | 'complexity'
  ): number {
    let score = 100; // Start with perfect score

    const errorCount = issues.filter(issue => issue.severity === 'error').length;
    const warningCount = issues.filter(issue => issue.severity === 'warning').length;
    const infoCount = issues.filter(issue => issue.severity === 'info').length;

    // Apply category-specific scoring logic
    switch (category) {
      case 'typescript':
        score = this.calculateTypeScriptScore(errorCount, warningCount, metrics);
        break;
      case 'eslint':
        score = this.calculateESLintScore(errorCount, warningCount, infoCount, metrics);
        break;
      case 'coverage':
        score = this.calculateCoverageScore(metrics);
        break;
      case 'complexity':
        score = this.calculateComplexityScore(errorCount, warningCount, metrics);
        break;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get quality grade based on score
   */
  getQualityGrade(score: number): {
    grade: string;
    description: string;
    color: string;
  } {
    if (score >= 90) {
      return {
        grade: 'A+',
        description: 'Excellent code quality',
        color: '#22c55e'
      };
    } else if (score >= 80) {
      return {
        grade: 'A',
        description: 'Very good code quality',
        color: '#84cc16'
      };
    } else if (score >= 70) {
      return {
        grade: 'B',
        description: 'Good code quality',
        color: '#eab308'
      };
    } else if (score >= 60) {
      return {
        grade: 'C',
        description: 'Acceptable code quality',
        color: '#f97316'
      };
    } else if (score >= 50) {
      return {
        grade: 'D',
        description: 'Poor code quality',
        color: '#ef4444'
      };
    } else {
      return {
        grade: 'F',
        description: 'Very poor code quality',
        color: '#dc2626'
      };
    }
  }

  /**
   * Calculate improvement recommendations based on score breakdown
   */
  generateImprovementRecommendations(breakdown: QualityScoreBreakdown): string[] {
    const recommendations: string[] = [];

    // Identify lowest scoring components
    const sortedComponents = Object.entries(breakdown.componentScores)
      .sort(([, a], [, b]) => a - b);

    const lowestComponent = sortedComponents[0];
    const secondLowestComponent = sortedComponents[1];

    // Generate recommendations based on lowest scores
    if (lowestComponent[1] < 70) {
      recommendations.push(this.getComponentRecommendation(lowestComponent[0], lowestComponent[1]));
    }

    if (secondLowestComponent[1] < 80) {
      recommendations.push(this.getComponentRecommendation(secondLowestComponent[0], secondLowestComponent[1]));
    }

    // Penalty-based recommendations
    if (breakdown.penalties.criticalIssues > 5) {
      recommendations.push('Address critical issues immediately to prevent production problems');
    }

    if (breakdown.penalties.lowCoverage > 10) {
      recommendations.push('Increase test coverage by writing tests for uncovered code paths');
    }

    if (breakdown.penalties.highComplexity > 10) {
      recommendations.push('Reduce code complexity by refactoring large functions and classes');
    }

    // Bonus opportunities
    if (breakdown.bonuses.total < 5) {
      recommendations.push('Enable strict TypeScript mode and improve code quality practices for bonus points');
    }

    return recommendations;
  }

  // Private helper methods

  private normalizeScore(score: number): number {
    return Math.max(0, Math.min(100, score));
  }

  private determineComponentType(result: QualityCheckResult): string | null {
    // Determine component type based on metrics or other indicators
    if (result.metrics) {
      if (result.metrics.typeErrors !== undefined || result.metrics.typeScriptCompliance !== undefined) {
        return 'typescript';
      }
      if (result.metrics.eslintErrors !== undefined || result.metrics.eslintWarnings !== undefined) {
        return 'eslint';
      }
      if (result.metrics.testCoverage !== undefined || result.metrics.branchCoverage !== undefined) {
        return 'coverage';
      }
      if (result.metrics.cyclomaticComplexity !== undefined || result.metrics.cognitiveComplexity !== undefined) {
        return 'complexity';
      }
    }

    // Fallback: try to determine from issues
    if (result.issues.length > 0) {
      const firstIssue = result.issues[0];
      if (firstIssue.rule?.includes('typescript') || firstIssue.rule?.startsWith('@typescript-eslint')) {
        return 'typescript';
      }
      if (firstIssue.rule?.includes('coverage')) {
        return 'coverage';
      }
      if (firstIssue.rule?.includes('complexity')) {
        return 'complexity';
      }
      return 'eslint'; // Default to ESLint for other rules
    }

    return null;
  }

  private calculatePenalties(results: QualityCheckResult[]): QualityPenalties {
    let criticalIssues = 0;
    let highComplexity = 0;
    let lowCoverage = 0;
    let typeErrors = 0;

    results.forEach(result => {
      // Count critical issues
      criticalIssues += result.issues.filter(issue => issue.severity === 'error').length;

      // Check for type errors
      if (result.metrics?.typeErrors) {
        typeErrors += result.metrics.typeErrors;
      }

      // Check for high complexity
      if (result.metrics?.averageCyclomaticComplexity && result.metrics.averageCyclomaticComplexity > 10) {
        highComplexity += (result.metrics.averageCyclomaticComplexity - 10) * 2;
      }

      // Check for low coverage
      if (result.metrics?.testCoverage && result.metrics.testCoverage < 60) {
        lowCoverage += (60 - result.metrics.testCoverage) * 0.5;
      }
    });

    const penalties: QualityPenalties = {
      criticalIssues: criticalIssues * 2,
      highComplexity: Math.min(highComplexity, 20),
      lowCoverage: Math.min(lowCoverage, 15),
      typeErrors: typeErrors * 1.5,
      total: 0
    };

    penalties.total = penalties.criticalIssues + penalties.highComplexity + penalties.lowCoverage + penalties.typeErrors;

    return penalties;
  }

  private calculateBonuses(results: QualityCheckResult[]): QualityBonuses {
    let strictMode = 0;
    let highCoverage = 0;
    let lowComplexity = 0;
    let cleanCode = 0;

    results.forEach(result => {
      // Bonus for strict TypeScript mode
      if (result.metrics?.typeScriptCompliance && result.metrics.typeScriptCompliance > 95) {
        strictMode = 3;
      }

      // Bonus for high coverage
      if (result.metrics?.testCoverage && result.metrics.testCoverage > 90) {
        highCoverage = 5;
      }

      // Bonus for low complexity
      if (result.metrics?.averageCyclomaticComplexity && result.metrics.averageCyclomaticComplexity < 5) {
        lowComplexity = 3;
      }

      // Bonus for clean code (few issues)
      const totalIssues = result.issues.length;
      if (totalIssues < 5) {
        cleanCode = 2;
      }
    });

    const bonuses: QualityBonuses = {
      strictMode,
      highCoverage,
      lowComplexity,
      cleanCode,
      total: strictMode + highCoverage + lowComplexity + cleanCode
    };

    return bonuses;
  }

  private calculateTypeScriptScore(errorCount: number, warningCount: number, metrics: Record<string, number>): number {
    let score = 100;
    
    // Deduct for errors and warnings
    score -= errorCount * 10;
    score -= warningCount * 2;
    
    // Bonus for strict mode compliance
    if (metrics.typeScriptCompliance && metrics.typeScriptCompliance > 95) {
      score += 5;
    }
    
    return score;
  }

  private calculateESLintScore(errorCount: number, warningCount: number, infoCount: number, metrics: Record<string, number>): number {
    let score = 100;
    
    // Deduct for issues
    score -= errorCount * 5;
    score -= warningCount * 1;
    score -= infoCount * 0.5;
    
    // Bonus for high fixable rate
    if (metrics.fixableRate && metrics.fixableRate > 0.8) {
      score += 3;
    }
    
    return score;
  }

  private calculateCoverageScore(metrics: Record<string, number>): number {
    const coverage = metrics.testCoverage || 0;
    
    // Linear scoring based on coverage percentage
    let score = coverage;
    
    // Bonus for very high coverage
    if (coverage > 90) {
      score += 5;
    }
    
    // Penalty for very low coverage
    if (coverage < 50) {
      score -= 10;
    }
    
    return score;
  }

  private calculateComplexityScore(errorCount: number, warningCount: number, metrics: Record<string, number>): number {
    let score = 100;
    
    // Deduct for complexity issues
    score -= errorCount * 15;
    score -= warningCount * 5;
    
    // Adjust based on average complexity
    if (metrics.averageCyclomaticComplexity) {
      const complexity = metrics.averageCyclomaticComplexity;
      if (complexity > 10) {
        score -= (complexity - 10) * 3;
      } else if (complexity < 5) {
        score += 5; // Bonus for low complexity
      }
    }
    
    return score;
  }

  private getComponentRecommendation(component: string, score: number): string {
    const recommendations: Record<string, string> = {
      typescript: `TypeScript score is ${score.toFixed(1)} - fix type errors and enable strict mode`,
      eslint: `ESLint score is ${score.toFixed(1)} - address code quality issues and style violations`,
      coverage: `Test coverage score is ${score.toFixed(1)} - write more comprehensive tests`,
      complexity: `Code complexity score is ${score.toFixed(1)} - refactor complex functions and reduce nesting`
    };

    return recommendations[component] || `Improve ${component} quality (score: ${score.toFixed(1)})`;
  }
}