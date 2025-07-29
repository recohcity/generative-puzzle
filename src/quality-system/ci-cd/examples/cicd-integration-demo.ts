/**
 * CI/CD Integration Demo
 * 
 * Demonstrates the CI/CD integration capabilities including quality gates,
 * automated reporting, and pipeline integration.
 */

import { AdvancedLogger } from '../../logging/AdvancedLogger';
import { QualityDetectionEngine } from '../../quality-detection/QualityDetectionEngine';
import { AdvancedQualityMetrics } from '../../quality-detection/AdvancedQualityMetrics';
import { ImprovementSuggestionEngine } from '../../quality-detection/ImprovementSuggestionEngine';
import { CICDIntegrationService, CICDConfig } from '../CICDIntegrationService';

// Environment detection
const isCI = process.env.CI === 'true';
const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';
const branchName = process.env.GITHUB_REF_NAME || process.env.BRANCH_NAME || 'local';
const commitSha = process.env.GITHUB_SHA || 'local-commit';

async function runCICDIntegrationDemo() {
  console.log('🚀 CI/CD Integration Demo');
  console.log('=========================\n');

  // Initialize components
  const logger = AdvancedLogger.getInstance();
  const qualityEngine = new QualityDetectionEngine(logger);
  const metricsCalculator = new AdvancedQualityMetrics(logger);
  const suggestionEngine = new ImprovementSuggestionEngine(logger);
  
  const cicdService = new CICDIntegrationService(
    logger,
    qualityEngine,
    metricsCalculator,
    suggestionEngine
  );

  try {
    // Environment Information
    console.log('🌍 Environment Information:');
    console.log(`   Running in CI: ${isCI ? '✅ Yes' : '❌ No'}`);
    console.log(`   GitHub Actions: ${isGitHubActions ? '✅ Yes' : '❌ No'}`);
    console.log(`   Branch: ${branchName}`);
    console.log(`   Commit: ${commitSha.substring(0, 8)}`);
    console.log('');

    // Demo 1: Basic CI/CD Pipeline
    console.log('🔄 Demo 1: Basic CI/CD Quality Pipeline');
    console.log('--------------------------------------');

    const basicConfig: CICDConfig = {
      qualityGate: {
        enabled: true,
        minimumScore: 70,
        failOnThreshold: false,
        requiredChecks: ['TypeScript Compilation', 'Test Coverage']
      },
      reporting: {
        enabled: true,
        formats: ['json', 'markdown'],
        outputPath: './quality-reports',
        includeDetails: true
      },
      notifications: {
        enabled: false,
        channels: ['github']
      },
      coverage: {
        enabled: true,
        minimumCoverage: 60,
        failOnThreshold: false,
        reportPath: './coverage'
      }
    };

    console.log('📋 Configuration:');
    console.log(`   Quality Gate: ${basicConfig.qualityGate.enabled ? 'Enabled' : 'Disabled'}`);
    console.log(`   Minimum Score: ${basicConfig.qualityGate.minimumScore}`);
    console.log(`   Required Checks: ${basicConfig.qualityGate.requiredChecks.join(', ')}`);
    console.log(`   Report Formats: ${basicConfig.reporting.formats.join(', ')}`);
    console.log('');

    const result = await cicdService.runQualityPipeline(basicConfig);

    console.log('📊 Pipeline Results:');
    console.log(`   Overall Score: ${result.qualityScore.toFixed(1)}/100`);
    console.log(`   Gate Status: ${getStatusEmoji(result.gateStatus)} ${result.gateStatus.toUpperCase()}`);
    console.log(`   Success: ${result.success ? '✅' : '❌'}`);
    console.log(`   Duration: ${result.metadata.duration}ms`);
    console.log(`   Environment: ${result.metadata.environment}`);
    console.log('');

    console.log('🔍 Check Results:');
    result.checks.forEach(check => {
      const emoji = getStatusEmoji(check.status);
      console.log(`   ${emoji} ${check.name}: ${check.message}`);
      if (check.score !== undefined) {
        console.log(`      Score: ${check.score.toFixed(1)}${check.threshold ? ` (threshold: ${check.threshold})` : ''}`);
      }
    });
    console.log('');

    if (result.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      result.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
      console.log('');
    }

    if (result.reports.length > 0) {
      console.log('📄 Generated Reports:');
      result.reports.forEach(report => {
        console.log(`   ${report.format.toUpperCase()}: ${report.path} (${report.size} bytes)`);
      });
      console.log('');
    }

    // Demo 2: Strict Quality Gate
    console.log('🚪 Demo 2: Strict Quality Gate Configuration');
    console.log('-------------------------------------------');

    const strictConfig: CICDConfig = {
      qualityGate: {
        enabled: true,
        minimumScore: 85,
        failOnThreshold: true,
        requiredChecks: ['TypeScript Compilation', 'ESLint Code Quality', 'Test Coverage', 'Code Complexity']
      },
      reporting: {
        enabled: true,
        formats: ['json', 'markdown', 'html'],
        outputPath: './quality-reports',
        includeDetails: true
      },
      notifications: {
        enabled: true,
        channels: ['github', 'webhook'],
        webhookUrl: 'https://example.com/webhook'
      },
      coverage: {
        enabled: true,
        minimumCoverage: 80,
        failOnThreshold: true,
        reportPath: './coverage'
      }
    };

    console.log('📋 Strict Configuration:');
    console.log(`   Quality Gate: ${strictConfig.qualityGate.enabled ? 'Enabled' : 'Disabled'}`);
    console.log(`   Minimum Score: ${strictConfig.qualityGate.minimumScore} (High Threshold)`);
    console.log(`   Fail on Threshold: ${strictConfig.qualityGate.failOnThreshold ? 'Yes' : 'No'}`);
    console.log(`   Coverage Threshold: ${strictConfig.coverage.minimumCoverage}%`);
    console.log(`   Notification Channels: ${strictConfig.notifications.channels.join(', ')}`);
    console.log('');

    const strictResult = await cicdService.runQualityPipeline(strictConfig);

    console.log('📊 Strict Pipeline Results:');
    console.log(`   Overall Score: ${strictResult.qualityScore.toFixed(1)}/100`);
    console.log(`   Gate Status: ${getStatusEmoji(strictResult.gateStatus)} ${strictResult.gateStatus.toUpperCase()}`);
    console.log(`   Success: ${strictResult.success ? '✅' : '❌'}`);
    console.log(`   Would Fail Build: ${strictResult.gateStatus === 'failed' && strictConfig.qualityGate.failOnThreshold ? '❌ Yes' : '✅ No'}`);
    console.log('');

    // Demo 3: Environment-Specific Configuration
    console.log('🌍 Demo 3: Environment-Specific Configuration');
    console.log('--------------------------------------------');

    const environments = ['development', 'staging', 'production'];
    
    for (const env of environments) {
      console.log(`\n📦 ${env.toUpperCase()} Environment:`);
      
      const envConfig: CICDConfig = getEnvironmentConfig(env);
      
      console.log(`   Quality Gate Threshold: ${envConfig.qualityGate.minimumScore}`);
      console.log(`   Fail on Threshold: ${envConfig.qualityGate.failOnThreshold ? 'Yes' : 'No'}`);
      console.log(`   Coverage Threshold: ${envConfig.coverage.minimumCoverage}%`);
      console.log(`   Notifications: ${envConfig.notifications.enabled ? 'Enabled' : 'Disabled'}`);
      
      // Simulate environment-specific results
      const envScore = getEnvironmentScore(env);
      const envGateStatus = envScore >= envConfig.qualityGate.minimumScore ? 'passed' : 'failed';
      
      console.log(`   Simulated Score: ${envScore}/100`);
      console.log(`   Gate Status: ${getStatusEmoji(envGateStatus)} ${envGateStatus.toUpperCase()}`);
    }
    console.log('');

    // Demo 4: Report Generation
    console.log('📄 Demo 4: Report Generation Examples');
    console.log('------------------------------------');

    console.log('Generated report samples:\n');

    // Show sample markdown report
    console.log('📝 Markdown Report Sample:');
    console.log('```markdown');
    console.log('# Quality Report\n');
    console.log(`**Generated:** ${new Date().toISOString()}\n`);
    console.log('## Summary\n');
    console.log(`- **Overall Score:** ${result.qualityScore.toFixed(1)}/100`);
    console.log(`- **Checks Passed:** ${result.checks.filter(c => c.status === 'passed').length}`);
    console.log(`- **Checks Failed:** ${result.checks.filter(c => c.status === 'failed').length}`);
    console.log('```\n');

    // Show sample JSON report structure
    console.log('📊 JSON Report Structure:');
    console.log('```json');
    console.log(JSON.stringify({
      overallScore: result.qualityScore,
      gateStatus: result.gateStatus,
      checks: result.checks.slice(0, 2), // Show first 2 checks as example
      timestamp: result.metadata.timestamp,
      environment: result.metadata.environment
    }, null, 2));
    console.log('```\n');

    // Demo 5: Integration Scenarios
    console.log('🔗 Demo 5: Integration Scenarios');
    console.log('-------------------------------');

    const scenarios = [
      {
        name: 'Pull Request Check',
        description: 'Quality check on PR with moderate thresholds',
        config: { minimumScore: 70, failOnThreshold: false },
        expectedOutcome: 'Warning on low quality, but allows merge'
      },
      {
        name: 'Release Gate',
        description: 'Strict quality gate for production releases',
        config: { minimumScore: 85, failOnThreshold: true },
        expectedOutcome: 'Blocks release if quality is insufficient'
      },
      {
        name: 'Nightly Build',
        description: 'Comprehensive quality analysis with full reporting',
        config: { minimumScore: 60, failOnThreshold: false },
        expectedOutcome: 'Generates detailed reports for team review'
      }
    ];

    scenarios.forEach((scenario, index) => {
      console.log(`${index + 1}. **${scenario.name}**`);
      console.log(`   Description: ${scenario.description}`);
      console.log(`   Threshold: ${scenario.config.minimumScore}`);
      console.log(`   Fail on Threshold: ${scenario.config.failOnThreshold ? 'Yes' : 'No'}`);
      console.log(`   Expected Outcome: ${scenario.expectedOutcome}`);
      console.log('');
    });

    // Demo 6: CLI Integration
    console.log('💻 Demo 6: CLI Integration Examples');
    console.log('----------------------------------');

    console.log('Command examples for different use cases:\n');

    const cliExamples = [
      {
        command: 'npm run quality:cli',
        description: 'Basic quality check with default settings'
      },
      {
        command: 'npm run quality:cli -- --threshold 80 --fail',
        description: 'Quality check with custom threshold and fail on breach'
      },
      {
        command: 'npm run quality:cli -- --config ./ci/quality-gate.config.js --output ./reports',
        description: 'Quality check with custom config and report output'
      },
      {
        command: 'npm run quality:cli -- --format markdown --verbose',
        description: 'Generate markdown report with verbose logging'
      }
    ];

    cliExamples.forEach((example, index) => {
      console.log(`${index + 1}. ${example.description}`);
      console.log(`   \`${example.command}\``);
      console.log('');
    });

    // Summary
    console.log('🎉 CI/CD Integration Demo Complete!');
    console.log('===================================');
    console.log('✅ Successfully demonstrated CI/CD pipeline integration');
    console.log('✅ Showed quality gate configuration and enforcement');
    console.log('✅ Generated multiple report formats');
    console.log('✅ Demonstrated environment-specific configurations');
    console.log('✅ Provided CLI integration examples');
    console.log('✅ Showed integration scenarios for different workflows');
    console.log('');
    console.log('The CI/CD integration system is ready for production use! 🚀');

  } catch (error) {
    console.error('❌ Demo failed:', error);
    logger.error('CI/CD integration demo failed', error as Error);
  }
}

// Helper functions
function getStatusEmoji(status: string): string {
  const emojis: Record<string, string> = {
    passed: '✅',
    failed: '❌',
    warning: '⚠️',
    skipped: '⏭️'
  };
  return emojis[status] || '❓';
}

function getEnvironmentConfig(env: string): CICDConfig {
  const baseConfig = CICDIntegrationService.getDefaultConfig();
  
  switch (env) {
    case 'development':
      return {
        ...baseConfig,
        qualityGate: {
          ...baseConfig.qualityGate,
          minimumScore: 50,
          failOnThreshold: false
        },
        coverage: {
          ...baseConfig.coverage,
          minimumCoverage: 40
        },
        notifications: {
          ...baseConfig.notifications,
          enabled: false
        }
      };
    
    case 'staging':
      return {
        ...baseConfig,
        qualityGate: {
          ...baseConfig.qualityGate,
          minimumScore: 70,
          failOnThreshold: false
        },
        coverage: {
          ...baseConfig.coverage,
          minimumCoverage: 60
        }
      };
    
    case 'production':
      return {
        ...baseConfig,
        qualityGate: {
          ...baseConfig.qualityGate,
          minimumScore: 85,
          failOnThreshold: true
        },
        coverage: {
          ...baseConfig.coverage,
          minimumCoverage: 80,
          failOnThreshold: true
        },
        notifications: {
          ...baseConfig.notifications,
          enabled: true,
          channels: ['github', 'slack', 'webhook']
        }
      };
    
    default:
      return baseConfig;
  }
}

function getEnvironmentScore(env: string): number {
  // Simulate different quality scores for different environments
  switch (env) {
    case 'development':
      return 65; // Lower quality in development
    case 'staging':
      return 75; // Medium quality in staging
    case 'production':
      return 88; // High quality in production
    default:
      return 70;
  }
}

// Run the demo
if (require.main === module) {
  runCICDIntegrationDemo().catch(console.error);
}

export { runCICDIntegrationDemo };