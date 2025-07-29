/**
 * Quality Detection Engine Demo
 * 
 * Demonstrates the capabilities of the Quality Detection Engine
 * including TypeScript analysis, ESLint checking, coverage analysis, and complexity measurement.
 */

import { AdvancedLogger } from '../../logging/AdvancedLogger';
import { QualityDetectionEngine, QualityDetectionConfig, AnalyzerType } from '../QualityDetectionEngine';

async function runQualityDetectionDemo() {
  console.log('🔍 Quality Detection Engine Demo');
  console.log('================================\n');

  // Initialize logger
  const logger = AdvancedLogger.getInstance();
  logger.info('Starting Quality Detection Engine demonstration');

  try {
    // Configure the quality detection engine
    const config: Partial<QualityDetectionConfig> = {
      projectRoot: process.cwd(),
      includePatterns: [
        'src/**/*.ts',
        'src/**/*.tsx',
        'src/**/*.js',
        'src/**/*.jsx'
      ],
      excludePatterns: [
        'node_modules/**',
        'dist/**',
        'build/**',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx'
      ],
      enabledAnalyzers: [
        AnalyzerType.TYPESCRIPT,
        AnalyzerType.ESLINT,
        AnalyzerType.COVERAGE,
        AnalyzerType.COMPLEXITY
      ],
      thresholds: {
        typescript: {
          errorThreshold: 0,
          warningThreshold: 10
        },
        eslint: {
          errorThreshold: 0,
          warningThreshold: 20
        },
        coverage: {
          minimumCoverage: 80,
          branchCoverage: 70,
          functionCoverage: 85
        },
        complexity: {
          cyclomaticComplexity: 10,
          cognitiveComplexity: 15,
          maintainabilityIndex: 60
        }
      },
      reportingOptions: {
        generateDetailedReport: true,
        includeSourceCode: false,
        includeMetrics: true,
        outputFormat: 'json'
      }
    };

    // Create and initialize the quality detection engine
    console.log('📋 Initializing Quality Detection Engine...');
    const engine = new QualityDetectionEngine(logger, config);
    await engine.initialize();
    console.log('✅ Quality Detection Engine initialized\n');

    // Demo 1: Run all quality checks
    console.log('🔍 Demo 1: Running All Quality Checks');
    console.log('-------------------------------------');
    
    const startTime = Date.now();
    const allChecks = await engine.runAllChecks();
    const duration = Date.now() - startTime;

    console.log(`✅ Completed ${allChecks.length} quality checks in ${duration}ms\n`);

    // Display results for each analyzer
    allChecks.forEach(check => {
      console.log(`📊 ${check.type.toUpperCase()} Analysis:`);
      console.log(`   Status: ${check.status}`);
      
      if (check.result) {
        console.log(`   Score: ${check.result.score.toFixed(1)}/100`);
        console.log(`   Issues: ${check.result.issues.length}`);
        console.log(`   Suggestions: ${check.result.suggestions.length}`);
        
        // Show top issues
        const topIssues = check.result.issues
          .filter(issue => issue.severity === 'error')
          .slice(0, 3);
        
        if (topIssues.length > 0) {
          console.log('   Top Issues:');
          topIssues.forEach(issue => {
            console.log(`     - ${issue.file}:${issue.line} - ${issue.message}`);
          });
        }
        
        // Show key metrics
        if (check.result.metrics && Object.keys(check.result.metrics).length > 0) {
          console.log('   Key Metrics:');
          Object.entries(check.result.metrics).slice(0, 3).forEach(([key, value]) => {
            console.log(`     - ${key}: ${typeof value === 'number' ? value.toFixed(2) : value}`);
          });
        }
      }
      
      console.log('');
    });

    // Demo 2: Calculate overall quality score
    console.log('🎯 Demo 2: Overall Quality Score Calculation');
    console.log('-------------------------------------------');
    
    const overallScore = await engine.calculateOverallScore(allChecks);
    console.log(`📈 Overall Quality Score: ${overallScore.toFixed(1)}/100`);
    
    // Determine quality grade
    let grade = 'F';
    let gradeColor = '🔴';
    if (overallScore >= 90) {
      grade = 'A+';
      gradeColor = '🟢';
    } else if (overallScore >= 80) {
      grade = 'A';
      gradeColor = '🟢';
    } else if (overallScore >= 70) {
      grade = 'B';
      gradeColor = '🟡';
    } else if (overallScore >= 60) {
      grade = 'C';
      gradeColor = '🟠';
    } else if (overallScore >= 50) {
      grade = 'D';
      gradeColor = '🔴';
    }
    
    console.log(`🏆 Quality Grade: ${gradeColor} ${grade}\n`);

    // Demo 3: Generate improvement suggestions
    console.log('💡 Demo 3: Improvement Suggestions');
    console.log('----------------------------------');
    
    const allIssues = allChecks.flatMap(check => check.result?.issues || []);
    const suggestions = await engine.generateImprovementSuggestions(allIssues);
    
    console.log(`📝 Generated ${suggestions.length} improvement suggestions:`);
    suggestions.forEach((suggestion, index) => {
      console.log(`   ${index + 1}. ${suggestion}`);
    });
    console.log('');

    // Demo 4: Comprehensive analysis
    console.log('📊 Demo 4: Comprehensive Quality Analysis');
    console.log('----------------------------------------');
    
    const comprehensiveResult = await engine.performComprehensiveAnalysis();
    
    console.log('📈 Analysis Summary:');
    console.log(`   Overall Score: ${comprehensiveResult.overallScore.toFixed(1)}/100`);
    console.log(`   Total Issues: ${comprehensiveResult.summary.totalIssues}`);
    console.log(`   Critical Issues: ${comprehensiveResult.summary.criticalIssues}`);
    console.log(`   Files Analyzed: ${comprehensiveResult.summary.filesAnalyzed}`);
    console.log(`   Analysis Duration: ${comprehensiveResult.duration}ms`);
    console.log('');

    console.log('🔧 Quality Metrics:');
    Object.entries(comprehensiveResult.metrics).forEach(([key, value]) => {
      console.log(`   ${key}: ${typeof value === 'number' ? value.toFixed(2) : value}`);
    });
    console.log('');

    console.log('🎯 Top Recommendations:');
    comprehensiveResult.recommendations.slice(0, 5).forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
    console.log('');

    // Demo 5: Individual analyzer testing
    console.log('🔬 Demo 5: Individual Analyzer Testing');
    console.log('-------------------------------------');
    
    for (const analyzerType of config.enabledAnalyzers!) {
      console.log(`🧪 Testing ${analyzerType} analyzer...`);
      
      try {
        const specificCheck = await engine.runSpecificCheck(analyzerType);
        console.log(`   ✅ ${analyzerType}: Score ${specificCheck.result?.score.toFixed(1) || 0}/100, Issues: ${specificCheck.result?.issues.length || 0}`);
      } catch (error) {
        console.log(`   ❌ ${analyzerType}: Failed - ${(error as Error).message}`);
      }
    }
    console.log('');

    // Demo 6: Task completion validation
    console.log('✅ Demo 6: Task Completion Validation');
    console.log('------------------------------------');
    
    const mockTaskId = 'quality-improvement-task-001';
    const isTaskComplete = await engine.validateTaskCompletion(mockTaskId);
    
    console.log(`📋 Task ${mockTaskId}:`);
    console.log(`   Completion Status: ${isTaskComplete ? '✅ Complete' : '❌ Incomplete'}`);
    console.log(`   Based on quality score: ${overallScore.toFixed(1)}/100`);
    console.log('');

    // Demo 7: Latest quality report
    console.log('📄 Demo 7: Latest Quality Report');
    console.log('--------------------------------');
    
    const latestReport = await engine.getLatestQualityReport();
    
    console.log('📊 Quality Report Summary:');
    console.log(`   Overall Score: ${latestReport.score.toFixed(1)}/100`);
    console.log(`   Total Issues: ${latestReport.issues.length}`);
    console.log(`   Error Issues: ${latestReport.issues.filter(i => i.severity === 'error').length}`);
    console.log(`   Warning Issues: ${latestReport.issues.filter(i => i.severity === 'warning').length}`);
    console.log(`   Suggestions: ${latestReport.suggestions.length}`);
    console.log('');

    // Show issue breakdown by file
    const issuesByFile = latestReport.issues.reduce((acc, issue) => {
      acc[issue.file] = (acc[issue.file] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topFiles = Object.entries(issuesByFile)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    if (topFiles.length > 0) {
      console.log('📁 Files with Most Issues:');
      topFiles.forEach(([file, count]) => {
        console.log(`   ${file}: ${count} issues`);
      });
      console.log('');
    }

    // Final summary
    console.log('🎉 Quality Detection Engine Demo Complete!');
    console.log('==========================================');
    console.log(`✅ Successfully analyzed ${comprehensiveResult.summary.filesAnalyzed} files`);
    console.log(`📊 Overall Quality Score: ${overallScore.toFixed(1)}/100 (Grade: ${grade})`);
    console.log(`🔍 Found ${comprehensiveResult.summary.totalIssues} total issues`);
    console.log(`💡 Generated ${suggestions.length} improvement suggestions`);
    console.log(`⏱️  Total analysis time: ${comprehensiveResult.duration}ms`);
    console.log('');
    console.log('The Quality Detection Engine is ready for production use! 🚀');

  } catch (error) {
    console.error('❌ Demo failed:', error);
    logger.error('Quality Detection Engine demo failed', error as Error);
  }
}

// Run the demo
if (require.main === module) {
  runQualityDetectionDemo().catch(console.error);
}

export { runQualityDetectionDemo };