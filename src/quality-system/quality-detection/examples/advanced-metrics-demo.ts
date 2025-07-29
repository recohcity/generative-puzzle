/**
 * Advanced Quality Metrics Demo
 * 
 * Demonstrates the advanced quality metrics, trend analysis, and improvement suggestions.
 */

import { AdvancedLogger } from '../../logging/AdvancedLogger';
import { AdvancedQualityMetrics } from '../AdvancedQualityMetrics';
import { QualityTrendAnalyzer } from '../QualityTrendAnalyzer';
import { ImprovementSuggestionEngine } from '../ImprovementSuggestionEngine';
import { QualityCheckResult } from '../../types';

async function runAdvancedMetricsDemo() {
  console.log('🔬 Advanced Quality Metrics Demo');
  console.log('=================================\n');

  // Initialize components
  const logger = AdvancedLogger.getInstance();
  const metricsCalculator = new AdvancedQualityMetrics(logger);
  const trendAnalyzer = new QualityTrendAnalyzer(logger);
  const suggestionEngine = new ImprovementSuggestionEngine(logger);

  try {
    // Demo 1: Mock quality results for demonstration
    console.log('📊 Demo 1: Creating Mock Quality Results');
    console.log('----------------------------------------');

    const mockResults: QualityCheckResult[] = [
      {
        score: 75,
        issues: [
          { severity: 'error', file: 'src/main.ts', line: 10, message: 'Type error', rule: 'typescript-error', fixable: false },
          { severity: 'warning', file: 'src/utils.ts', line: 25, message: 'Unused variable', rule: 'no-unused-vars', fixable: true },
          { severity: 'warning', file: 'src/app.ts', line: 15, message: 'Complex function', rule: 'complexity', fixable: false }
        ],
        suggestions: ['Fix type errors', 'Remove unused variables'],
        metrics: {
          typeErrors: 1,
          typeScriptCompliance: 85,
          averageCyclomaticComplexity: 12
        }
      },
      {
        score: 60,
        issues: [
          { severity: 'warning', file: 'src/test.ts', line: 5, message: 'Missing test', rule: 'coverage', fixable: false }
        ],
        suggestions: ['Increase test coverage'],
        metrics: {
          testCoverage: 45,
          branchCoverage: 40,
          functionCoverage: 50
        }
      }
    ];

    console.log(`✅ Created ${mockResults.length} mock quality results`);
    console.log(`📈 Overall average score: ${(mockResults.reduce((sum, r) => sum + r.score, 0) / mockResults.length).toFixed(1)}`);
    console.log('');

    // Demo 2: Calculate comprehensive metrics
    console.log('🧮 Demo 2: Comprehensive Quality Metrics');
    console.log('---------------------------------------');

    const projectMetadata = {
      linesOfCode: 15000,
      teamSize: 4,
      projectAge: 18, // months
      releaseFrequency: 2 // per month
    };

    const comprehensiveMetrics = await metricsCalculator.calculateComprehensiveMetrics(
      mockResults,
      undefined,
      projectMetadata
    );

    console.log('📊 Comprehensive Metrics Results:');
    console.log(`   Overall Score: ${comprehensiveMetrics.overallScore.toFixed(1)}/100`);
    console.log(`   Technical Debt: ${comprehensiveMetrics.technicalDebt.totalDebtHours.toFixed(1)} hours`);
    console.log(`   Debt Ratio: ${comprehensiveMetrics.technicalDebt.debtRatio.toFixed(2)} hours/KLOC`);
    console.log(`   Maintainability Index: ${comprehensiveMetrics.maintainability.maintainabilityIndex.toFixed(1)}`);
    console.log(`   Code Health Score: ${comprehensiveMetrics.maintainability.codeHealthScore.toFixed(1)}`);
    console.log('');

    console.log('🔮 Quality Prediction:');
    console.log(`   Predicted Score: ${comprehensiveMetrics.prediction.predictedScore.toFixed(1)}/100`);
    console.log(`   Confidence: ${comprehensiveMetrics.prediction.confidence.toFixed(1)}%`);
    console.log(`   Time to Target: ${comprehensiveMetrics.prediction.timeToTarget > 0 ? comprehensiveMetrics.prediction.timeToTarget.toFixed(1) + ' periods' : 'N/A'}`);
    console.log(`   Required Effort: ${comprehensiveMetrics.prediction.requiredEffort.toFixed(1)} hours`);
    console.log('');

    if (comprehensiveMetrics.prediction.riskFactors.length > 0) {
      console.log('⚠️  Risk Factors:');
      comprehensiveMetrics.prediction.riskFactors.forEach((risk, index) => {
        console.log(`   ${index + 1}. ${risk}`);
      });
      console.log('');
    }

    if (comprehensiveMetrics.prediction.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      comprehensiveMetrics.prediction.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
      console.log('');
    }

    // Demo 3: Trend Analysis
    console.log('📈 Demo 3: Quality Trend Analysis');
    console.log('---------------------------------');

    // Add some historical data points
    const historicalScores = [65, 68, 70, 72, 75, 73, 76, 78, 75, 77];
    historicalScores.forEach((score, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (historicalScores.length - index) * 7);
      trendAnalyzer.addDataPoint(score, date);
    });

    const trendAnalysis = trendAnalyzer.analyzeTrends();

    console.log('📊 Trend Analysis Results:');
    console.log(`   Trend Direction: ${trendAnalysis.trend}`);
    console.log(`   Velocity: ${trendAnalysis.velocity.toFixed(3)} points/period`);
    console.log(`   Volatility: ${trendAnalysis.volatility.toFixed(2)}`);
    console.log('');

    if (trendAnalysis.predictions.length > 0) {
      console.log('🔮 Quality Predictions (next 5 weeks):');
      trendAnalysis.predictions.forEach((prediction, index) => {
        console.log(`   Week ${index + 1}: ${prediction.predictedScore.toFixed(1)} (confidence: ${prediction.confidence.toFixed(1)}%)`);
      });
      console.log('');
    }

    // Demo 4: Improvement Suggestions
    console.log('💡 Demo 4: Improvement Suggestions');
    console.log('----------------------------------');

    const suggestionContext = {
      projectSize: 'medium' as const,
      teamSize: 4,
      timeline: 'normal' as const,
      budget: 'moderate' as const,
      experience: 'mixed' as const
    };

    const suggestions = suggestionEngine.generateSuggestions(
      mockResults,
      comprehensiveMetrics,
      suggestionContext
    );

    console.log(`🎯 Generated ${suggestions.length} improvement suggestions:`);
    console.log('');

    suggestions.forEach((suggestion, index) => {
      const priorityEmoji = {
        critical: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '🟢'
      };

      console.log(`${index + 1}. ${priorityEmoji[suggestion.priority]} ${suggestion.title}`);
      console.log(`   Priority: ${suggestion.priority.toUpperCase()}`);
      console.log(`   Category: ${suggestion.category}`);
      console.log(`   Impact: ${suggestion.impact}/100 | Effort: ${suggestion.effort}/100`);
      console.log(`   Time Estimate: ${suggestion.timeEstimate}`);
      console.log(`   Description: ${suggestion.description}`);
      
      if (suggestion.steps.length > 0) {
        console.log('   Steps:');
        suggestion.steps.forEach((step, stepIndex) => {
          console.log(`     ${stepIndex + 1}. ${step}`);
        });
      }
      
      if (suggestion.resources.length > 0) {
        console.log(`   Resources: ${suggestion.resources.join(', ')}`);
      }
      
      console.log('');
    });

    // Demo 5: Quality Score Breakdown
    console.log('🔍 Demo 5: Quality Score Breakdown');
    console.log('----------------------------------');

    console.log('📊 Technical Debt Breakdown:');
    console.log(`   Total Hours: ${comprehensiveMetrics.technicalDebt.totalDebtHours.toFixed(1)}`);
    console.log(`   Debt Density: ${comprehensiveMetrics.technicalDebt.debtDensity.toFixed(2)} issues/KLOC`);
    console.log(`   Interest Rate: ${(comprehensiveMetrics.technicalDebt.interestRate * 100).toFixed(1)}%`);
    console.log(`   Payback Time: ${comprehensiveMetrics.technicalDebt.paybackTime.toFixed(1)} weeks`);
    console.log(`   Trend: ${comprehensiveMetrics.technicalDebt.debtTrend}`);
    console.log('');

    console.log('🏗️ Maintainability Breakdown:');
    console.log(`   Maintainability Index: ${comprehensiveMetrics.maintainability.maintainabilityIndex.toFixed(1)}`);
    console.log(`   Code Health Score: ${comprehensiveMetrics.maintainability.codeHealthScore.toFixed(1)}`);
    console.log(`   Evolution Capacity: ${comprehensiveMetrics.maintainability.evolutionCapacity.toFixed(1)}`);
    console.log(`   Refactoring Resistance: ${comprehensiveMetrics.maintainability.refactoringResistance.toFixed(1)}`);
    console.log(`   Architectural Fitness: ${comprehensiveMetrics.maintainability.architecturalFitness.toFixed(1)}`);
    console.log('');

    console.log('🔬 Code Health Indicators:');
    console.log(`   Code Smell Density: ${comprehensiveMetrics.codeHealth.codeSmellDensity.toFixed(1)}%`);
    console.log(`   Duplicated Code Ratio: ${comprehensiveMetrics.codeHealth.duplicatedCodeRatio.toFixed(1)}%`);
    console.log(`   Testability Score: ${comprehensiveMetrics.codeHealth.testabilityScore.toFixed(1)}`);
    console.log(`   Modularity Score: ${comprehensiveMetrics.codeHealth.modularityScore.toFixed(1)}`);
    console.log(`   Cohesion Index: ${comprehensiveMetrics.codeHealth.cohesionIndex.toFixed(1)}`);
    console.log(`   Coupling Index: ${comprehensiveMetrics.codeHealth.couplingIndex.toFixed(1)}`);
    console.log('');

    // Demo 6: Summary and Action Plan
    console.log('📋 Demo 6: Summary and Action Plan');
    console.log('----------------------------------');

    const criticalSuggestions = suggestions.filter(s => s.priority === 'critical');
    const highSuggestions = suggestions.filter(s => s.priority === 'high');

    console.log('🎯 Immediate Action Items:');
    if (criticalSuggestions.length > 0) {
      console.log('   Critical Priority:');
      criticalSuggestions.forEach(s => {
        console.log(`   • ${s.title} (${s.timeEstimate})`);
      });
    }
    
    if (highSuggestions.length > 0) {
      console.log('   High Priority:');
      highSuggestions.forEach(s => {
        console.log(`   • ${s.title} (${s.timeEstimate})`);
      });
    }
    console.log('');

    const totalEffort = suggestions.reduce((sum, s) => sum + s.effort, 0);
    const totalImpact = suggestions.reduce((sum, s) => sum + s.impact, 0);
    const avgImpactEffortRatio = totalImpact / Math.max(totalEffort, 1);

    console.log('📊 Implementation Summary:');
    console.log(`   Total Suggestions: ${suggestions.length}`);
    console.log(`   Average Impact/Effort Ratio: ${avgImpactEffortRatio.toFixed(2)}`);
    console.log(`   Estimated Quality Improvement: ${(avgImpactEffortRatio * 10).toFixed(1)} points`);
    console.log(`   Recommended Implementation Order: Critical → High → Medium → Low`);
    console.log('');

    console.log('🎉 Advanced Quality Metrics Demo Complete!');
    console.log('==========================================');
    console.log('✅ Successfully demonstrated advanced quality metrics calculation');
    console.log('✅ Analyzed quality trends and generated predictions');
    console.log('✅ Generated intelligent improvement suggestions');
    console.log('✅ Provided comprehensive quality insights and action plans');
    console.log('');
    console.log('The advanced quality metrics system is ready for production use! 🚀');

  } catch (error) {
    console.error('❌ Demo failed:', error);
    logger.error('Advanced metrics demo failed', error as Error);
  }
}

// Run the demo
if (require.main === module) {
  runAdvancedMetricsDemo().catch(console.error);
}

export { runAdvancedMetricsDemo };