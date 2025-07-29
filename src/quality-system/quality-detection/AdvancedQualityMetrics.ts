/**
 * Advanced Quality Metrics Calculator
 * 
 * Implements sophisticated quality metrics calculation including
 * technical debt, maintainability index, code health score, and predictive analytics.
 */

import { ILogger } from '../interfaces';
import { QualityCheckResult, QualityIssue } from '../types';

export interface TechnicalDebtMetrics {
  totalDebtHours: number;
  debtRatio: number;
  debtDensity: number;
  interestRate: number;
  paybackTime: number;
  debtTrend: 'increasing' | 'decreasing' | 'stable';
}

export interface MaintainabilityMetrics {
  maintainabilityIndex: number;
  codeHealthScore: number;
  evolutionCapacity: number;
  refactoringResistance: number;
  architecturalFitness: number;
}

export interface QualityTrendMetrics {
  velocityTrend: number;
  qualityVelocity: number;
  improvementRate: number;
  regressionRisk: number;
  stabilityIndex: number;
  predictedQuality: number;
}

export interface CodeHealthIndicators {
  codeSmellDensity: number;
  duplicatedCodeRatio: number;
  testabilityScore: number;
  modularityScore: number;
  cohesionIndex: number;
  couplingIndex: number;
}

export interface QualityPrediction {
  predictedScore: number;
  confidence: number;
  timeToTarget: number;
  requiredEffort: number;
  riskFactors: string[];
  recommendations: string[];
}

export interface ComprehensiveQualityMetrics {
  overallScore: number;
  technicalDebt: TechnicalDebtMetrics;
  maintainability: MaintainabilityMetrics;
  trends: QualityTrendMetrics;
  codeHealth: CodeHealthIndicators;
  prediction: QualityPrediction;
  timestamp: Date;
  version: string;
}

export class AdvancedQualityMetrics {
  private logger: ILogger;
  private historicalData: ComprehensiveQualityMetrics[] = [];

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  /**
   * Calculate comprehensive quality metrics
   */
  async calculateComprehensiveMetrics(
    currentResults: QualityCheckResult[],
    historicalResults?: ComprehensiveQualityMetrics[],
    projectMetadata?: {
      linesOfCode: number;
      teamSize: number;
      projectAge: number;
      releaseFrequency: number;
    }
  ): Promise<ComprehensiveQualityMetrics> {
    this.logger.info('Calculating comprehensive quality metrics');

    if (historicalResults) {
      this.historicalData = historicalResults;
    }

    const overallScore = this.calculateOverallScore(currentResults);
    const technicalDebt = this.calculateTechnicalDebt(currentResults, projectMetadata);
    const maintainability = this.calculateMaintainabilityMetrics(currentResults, projectMetadata);
    const trends = this.calculateQualityTrends(overallScore);
    const codeHealth = this.calculateCodeHealthIndicators(currentResults);
    const prediction = this.generateQualityPrediction(overallScore, trends, technicalDebt);

    const metrics: ComprehensiveQualityMetrics = {
      overallScore,
      technicalDebt,
      maintainability,
      trends,
      codeHealth,
      prediction,
      timestamp: new Date(),
      version: this.generateVersionString()
    };

    // Store for historical analysis
    this.historicalData.push(metrics);
    if (this.historicalData.length > 100) {
      this.historicalData = this.historicalData.slice(-100); // Keep last 100 entries
    }

    this.logger.info('Comprehensive quality metrics calculated', {
      overallScore,
      technicalDebtHours: technicalDebt.totalDebtHours,
      maintainabilityIndex: maintainability.maintainabilityIndex,
      predictedScore: prediction.predictedScore
    });

    return metrics;
  }

  /**
   * Calculate technical debt metrics
   */
  private calculateTechnicalDebt(
    results: QualityCheckResult[],
    projectMetadata?: any
  ): TechnicalDebtMetrics {
    const allIssues = results.flatMap(result => result.issues);
    
    // Calculate debt hours based on issue severity and type
    const debtHours = allIssues.reduce((total, issue) => {
      const baseHours = this.getIssueDebtHours(issue);
      const complexityMultiplier = this.getComplexityMultiplier(issue);
      return total + (baseHours * complexityMultiplier);
    }, 0);

    const linesOfCode = projectMetadata?.linesOfCode || 10000;
    const debtRatio = debtHours / (linesOfCode / 1000); // Hours per KLOC
    const debtDensity = allIssues.length / (linesOfCode / 1000); // Issues per KLOC

    // Calculate interest rate (how much debt grows over time)
    const interestRate = this.calculateDebtInterestRate(allIssues);
    
    // Calculate payback time (time to resolve all debt)
    const teamSize = projectMetadata?.teamSize || 3;
    const paybackTime = debtHours / (teamSize * 0.2 * 40); // 20% of team time, 40 hours/week

    // Determine debt trend
    const debtTrend = this.calculateDebtTrend();

    return {
      totalDebtHours: Math.round(debtHours * 100) / 100,
      debtRatio: Math.round(debtRatio * 100) / 100,
      debtDensity: Math.round(debtDensity * 100) / 100,
      interestRate: Math.round(interestRate * 100) / 100,
      paybackTime: Math.round(paybackTime * 100) / 100,
      debtTrend
    };
  }

  /**
   * Calculate maintainability metrics
   */
  private calculateMaintainabilityMetrics(
    results: QualityCheckResult[],
    projectMetadata?: any
  ): MaintainabilityMetrics {
    const complexityResult = results.find(r => r.metrics?.averageCyclomaticComplexity);
    const coverageResult = results.find(r => r.metrics?.testCoverage);
    const typeScriptResult = results.find(r => r.metrics?.typeScriptCompliance);

    // Base maintainability index calculation (Microsoft formula adapted)
    const avgComplexity = complexityResult?.metrics?.averageCyclomaticComplexity || 10;
    const linesOfCode = projectMetadata?.linesOfCode || 10000;
    const testCoverage = coverageResult?.metrics?.testCoverage || 0;
    
    const maintainabilityIndex = Math.max(0, 
      171 - 5.2 * Math.log(avgComplexity) - 0.23 * avgComplexity - 16.2 * Math.log(linesOfCode) + 50 * Math.sin(Math.sqrt(2.4 * testCoverage))
    );

    // Code health score (0-100)
    const codeHealthScore = this.calculateCodeHealthScore(results);

    // Evolution capacity (ability to adapt to changes)
    const evolutionCapacity = this.calculateEvolutionCapacity(results, projectMetadata);

    // Refactoring resistance (how hard it is to refactor)
    const refactoringResistance = this.calculateRefactoringResistance(results);

    // Architectural fitness (how well the code fits the intended architecture)
    const architecturalFitness = this.calculateArchitecturalFitness(results);

    return {
      maintainabilityIndex: Math.round(maintainabilityIndex * 100) / 100,
      codeHealthScore: Math.round(codeHealthScore * 100) / 100,
      evolutionCapacity: Math.round(evolutionCapacity * 100) / 100,
      refactoringResistance: Math.round(refactoringResistance * 100) / 100,
      architecturalFitness: Math.round(architecturalFitness * 100) / 100
    };
  }

  /**
   * Calculate quality trend metrics
   */
  private calculateQualityTrends(currentScore: number): QualityTrendMetrics {
    if (this.historicalData.length < 2) {
      return {
        velocityTrend: 0,
        qualityVelocity: 0,
        improvementRate: 0,
        regressionRisk: 0,
        stabilityIndex: 100,
        predictedQuality: currentScore
      };
    }

    const recentData = this.historicalData.slice(-10); // Last 10 measurements
    const scores = recentData.map(d => d.overallScore);
    
    // Calculate velocity trend (rate of change)
    const velocityTrend = this.calculateLinearTrend(scores);
    
    // Quality velocity (average change per time period)
    const qualityVelocity = scores.length > 1 ? 
      (scores[scores.length - 1] - scores[0]) / (scores.length - 1) : 0;

    // Improvement rate (percentage of positive changes)
    const improvements = scores.slice(1).filter((score, i) => score > scores[i]).length;
    const improvementRate = (improvements / Math.max(1, scores.length - 1)) * 100;

    // Regression risk (likelihood of quality decrease)
    const regressionRisk = this.calculateRegressionRisk(scores);

    // Stability index (consistency of quality)
    const stabilityIndex = this.calculateStabilityIndex(scores);

    // Predicted quality (linear extrapolation)
    const predictedQuality = Math.max(0, Math.min(100, currentScore + velocityTrend * 5));

    return {
      velocityTrend: Math.round(velocityTrend * 1000) / 1000,
      qualityVelocity: Math.round(qualityVelocity * 1000) / 1000,
      improvementRate: Math.round(improvementRate * 100) / 100,
      regressionRisk: Math.round(regressionRisk * 100) / 100,
      stabilityIndex: Math.round(stabilityIndex * 100) / 100,
      predictedQuality: Math.round(predictedQuality * 100) / 100
    };
  }

  /**
   * Calculate code health indicators
   */
  private calculateCodeHealthIndicators(results: QualityCheckResult[]): CodeHealthIndicators {
    const allIssues = results.flatMap(result => result.issues);
    
    // Code smell density (issues per KLOC)
    const codeSmellDensity = this.calculateCodeSmellDensity(allIssues);
    
    // Duplicated code ratio
    const duplicatedCodeRatio = this.calculateDuplicatedCodeRatio(results);
    
    // Testability score
    const testabilityScore = this.calculateTestabilityScore(results);
    
    // Modularity score
    const modularityScore = this.calculateModularityScore(results);
    
    // Cohesion index
    const cohesionIndex = this.calculateCohesionIndex(results);
    
    // Coupling index
    const couplingIndex = this.calculateCouplingIndex(results);

    return {
      codeSmellDensity: Math.round(codeSmellDensity * 100) / 100,
      duplicatedCodeRatio: Math.round(duplicatedCodeRatio * 100) / 100,
      testabilityScore: Math.round(testabilityScore * 100) / 100,
      modularityScore: Math.round(modularityScore * 100) / 100,
      cohesionIndex: Math.round(cohesionIndex * 100) / 100,
      couplingIndex: Math.round(couplingIndex * 100) / 100
    };
  }

  /**
   * Generate quality prediction
   */
  private generateQualityPrediction(
    currentScore: number,
    trends: QualityTrendMetrics,
    technicalDebt: TechnicalDebtMetrics
  ): QualityPrediction {
    // Predict score based on current trend
    const trendBasedPrediction = currentScore + (trends.velocityTrend * 10);
    
    // Adjust for technical debt impact
    const debtImpact = Math.min(20, technicalDebt.debtRatio * 2);
    const predictedScore = Math.max(0, Math.min(100, trendBasedPrediction - debtImpact));
    
    // Calculate confidence based on stability
    const confidence = Math.min(100, trends.stabilityIndex * 0.8 + 20);
    
    // Estimate time to reach target (90% quality)
    const targetScore = 90;
    const timeToTarget = trends.qualityVelocity > 0 ? 
      Math.max(0, (targetScore - currentScore) / trends.qualityVelocity) : Infinity;
    
    // Estimate required effort (in person-hours)
    const requiredEffort = technicalDebt.totalDebtHours * 0.7; // 70% of debt needs to be resolved
    
    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(trends, technicalDebt);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(currentScore, trends, technicalDebt);

    return {
      predictedScore: Math.round(predictedScore * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      timeToTarget: isFinite(timeToTarget) ? Math.round(timeToTarget * 100) / 100 : -1,
      requiredEffort: Math.round(requiredEffort * 100) / 100,
      riskFactors,
      recommendations
    };
  }

  // Helper methods

  private calculateOverallScore(results: QualityCheckResult[]): number {
    if (results.length === 0) return 0;
    
    const totalScore = results.reduce((sum, result) => sum + result.score, 0);
    return totalScore / results.length;
  }

  private getIssueDebtHours(issue: QualityIssue): number {
    const baseHours = {
      'error': 2.0,
      'warning': 0.5,
      'info': 0.1
    };
    return baseHours[issue.severity] || 0.5;
  }

  private getComplexityMultiplier(issue: QualityIssue): number {
    if (issue.rule?.includes('complexity')) return 2.0;
    if (issue.rule?.includes('typescript')) return 1.5;
    if (issue.rule?.includes('coverage')) return 1.2;
    return 1.0;
  }

  private calculateDebtInterestRate(issues: QualityIssue[]): number {
    // Interest rate increases with error density
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const totalIssues = issues.length;
    const errorRatio = totalIssues > 0 ? errorCount / totalIssues : 0;
    return errorRatio * 0.1; // 10% max interest rate
  }

  private calculateDebtTrend(): 'increasing' | 'decreasing' | 'stable' {
    if (this.historicalData.length < 3) return 'stable';
    
    const recentDebt = this.historicalData.slice(-3).map(d => d.technicalDebt.totalDebtHours);
    const trend = this.calculateLinearTrend(recentDebt);
    
    if (trend > 0.5) return 'increasing';
    if (trend < -0.5) return 'decreasing';
    return 'stable';
  }

  private calculateCodeHealthScore(results: QualityCheckResult[]): number {
    const weights = {
      typescript: 0.3,
      eslint: 0.25,
      coverage: 0.25,
      complexity: 0.2
    };

    let weightedScore = 0;
    let totalWeight = 0;

    results.forEach(result => {
      const type = this.getResultType(result);
      if (weights[type as keyof typeof weights]) {
        weightedScore += result.score * weights[type as keyof typeof weights];
        totalWeight += weights[type as keyof typeof weights];
      }
    });

    return totalWeight > 0 ? weightedScore / totalWeight : 0;
  }

  private calculateEvolutionCapacity(results: QualityCheckResult[], metadata?: any): number {
    const testCoverage = results.find(r => r.metrics?.testCoverage)?.metrics?.testCoverage || 0;
    const complexity = results.find(r => r.metrics?.averageCyclomaticComplexity)?.metrics?.averageCyclomaticComplexity || 10;
    const typeErrors = results.find(r => r.metrics?.typeErrors)?.metrics?.typeErrors || 0;
    
    // Higher test coverage and lower complexity = better evolution capacity
    const coverageScore = Math.min(100, testCoverage * 1.2);
    const complexityScore = Math.max(0, 100 - complexity * 5);
    const typeScore = Math.max(0, 100 - typeErrors * 2);
    
    return (coverageScore + complexityScore + typeScore) / 3;
  }

  private calculateRefactoringResistance(results: QualityCheckResult[]): number {
    const complexity = results.find(r => r.metrics?.averageCyclomaticComplexity)?.metrics?.averageCyclomaticComplexity || 10;
    const testCoverage = results.find(r => r.metrics?.testCoverage)?.metrics?.testCoverage || 0;
    
    // Higher complexity and lower test coverage = higher refactoring resistance
    const complexityResistance = Math.min(100, complexity * 8);
    const testResistance = Math.max(0, 100 - testCoverage);
    
    return (complexityResistance + testResistance) / 2;
  }

  private calculateArchitecturalFitness(results: QualityCheckResult[]): number {
    // Simplified architectural fitness based on code organization
    const eslintResult = results.find(r => r.metrics?.eslintErrors !== undefined);
    const typeScriptResult = results.find(r => r.metrics?.typeScriptCompliance !== undefined);
    
    const organizationScore = eslintResult ? Math.max(0, 100 - (eslintResult.metrics?.eslintErrors || 0) * 2) : 80;
    const typeScore = typeScriptResult ? (typeScriptResult.metrics?.typeScriptCompliance || 70) : 70;
    
    return (organizationScore + typeScore) / 2;
  }

  private calculateLinearTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + val * i, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  private calculateRegressionRisk(scores: number[]): number {
    if (scores.length < 3) return 0;
    
    const volatility = this.calculateVolatility(scores);
    const trend = this.calculateLinearTrend(scores);
    
    // Higher volatility and negative trend = higher regression risk
    const volatilityRisk = Math.min(100, volatility * 10);
    const trendRisk = trend < 0 ? Math.abs(trend) * 20 : 0;
    
    return Math.min(100, volatilityRisk + trendRisk);
  }

  private calculateStabilityIndex(scores: number[]): number {
    if (scores.length < 2) return 100;
    
    const volatility = this.calculateVolatility(scores);
    return Math.max(0, 100 - volatility * 20);
  }

  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private calculateCodeSmellDensity(issues: QualityIssue[]): number {
    const codeSmells = issues.filter(issue => 
      issue.rule?.includes('complexity') || 
      issue.rule?.includes('duplication') ||
      issue.rule?.includes('maintainability')
    );
    return codeSmells.length / Math.max(1, issues.length) * 100;
  }

  private calculateDuplicatedCodeRatio(results: QualityCheckResult[]): number {
    // Simplified calculation - in real implementation, would analyze actual code duplication
    const eslintResult = results.find(r => r.metrics?.eslintWarnings !== undefined);
    const duplicateWarnings = eslintResult?.issues?.filter(i => 
      i.rule?.includes('duplicate') || i.rule?.includes('similar')
    ).length || 0;
    
    return Math.min(30, duplicateWarnings * 2); // Cap at 30%
  }

  private calculateTestabilityScore(results: QualityCheckResult[]): number {
    const coverageResult = results.find(r => r.metrics?.testCoverage !== undefined);
    const complexityResult = results.find(r => r.metrics?.averageCyclomaticComplexity !== undefined);
    
    const coverage = coverageResult?.metrics?.testCoverage || 0;
    const complexity = complexityResult?.metrics?.averageCyclomaticComplexity || 10;
    
    // Higher coverage and lower complexity = better testability
    const coverageScore = coverage;
    const complexityScore = Math.max(0, 100 - complexity * 5);
    
    return (coverageScore + complexityScore) / 2;
  }

  private calculateModularityScore(results: QualityCheckResult[]): number {
    // Simplified modularity score based on TypeScript and ESLint results
    const typeScriptResult = results.find(r => r.metrics?.typeScriptCompliance !== undefined);
    const eslintResult = results.find(r => r.metrics?.eslintErrors !== undefined);
    
    const typeScore = typeScriptResult?.metrics?.typeScriptCompliance || 70;
    const lintScore = eslintResult ? Math.max(0, 100 - (eslintResult.metrics?.eslintErrors || 0) * 3) : 80;
    
    return (typeScore + lintScore) / 2;
  }

  private calculateCohesionIndex(results: QualityCheckResult[]): number {
    // Simplified cohesion calculation
    const complexityResult = results.find(r => r.metrics?.averageCyclomaticComplexity !== undefined);
    const complexity = complexityResult?.metrics?.averageCyclomaticComplexity || 10;
    
    // Lower complexity generally indicates better cohesion
    return Math.max(0, 100 - complexity * 6);
  }

  private calculateCouplingIndex(results: QualityCheckResult[]): number {
    // Simplified coupling calculation based on import/dependency analysis
    const typeScriptResult = results.find(r => r.metrics?.typeErrors !== undefined);
    const typeErrors = typeScriptResult?.metrics?.typeErrors || 0;
    
    // More type errors might indicate higher coupling issues
    return Math.min(100, typeErrors * 3);
  }

  private identifyRiskFactors(trends: QualityTrendMetrics, debt: TechnicalDebtMetrics): string[] {
    const risks: string[] = [];
    
    if (trends.regressionRisk > 70) {
      risks.push('High regression risk detected');
    }
    
    if (debt.debtTrend === 'increasing') {
      risks.push('Technical debt is increasing');
    }
    
    if (trends.stabilityIndex < 50) {
      risks.push('Quality metrics are unstable');
    }
    
    if (debt.totalDebtHours > 100) {
      risks.push('High technical debt burden');
    }
    
    if (trends.improvementRate < 30) {
      risks.push('Low improvement rate');
    }
    
    return risks;
  }

  private generateRecommendations(
    currentScore: number,
    trends: QualityTrendMetrics,
    debt: TechnicalDebtMetrics
  ): string[] {
    const recommendations: string[] = [];
    
    if (currentScore < 70) {
      recommendations.push('Focus on addressing critical quality issues');
    }
    
    if (debt.totalDebtHours > 50) {
      recommendations.push('Allocate time for technical debt reduction');
    }
    
    if (trends.regressionRisk > 60) {
      recommendations.push('Implement additional quality gates to prevent regressions');
    }
    
    if (trends.stabilityIndex < 60) {
      recommendations.push('Establish consistent quality practices');
    }
    
    if (trends.improvementRate < 40) {
      recommendations.push('Increase focus on continuous improvement');
    }
    
    return recommendations;
  }

  private getResultType(result: QualityCheckResult): string {
    if (result.metrics?.typeErrors !== undefined) return 'typescript';
    if (result.metrics?.eslintErrors !== undefined) return 'eslint';
    if (result.metrics?.testCoverage !== undefined) return 'coverage';
    if (result.metrics?.averageCyclomaticComplexity !== undefined) return 'complexity';
    return 'unknown';
  }

  private generateVersionString(): string {
    return `v${new Date().getFullYear()}.${new Date().getMonth() + 1}.${new Date().getDate()}`;
  }
}