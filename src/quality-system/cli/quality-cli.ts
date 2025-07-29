#!/usr/bin/env node

/**
 * Quality CLI Tool
 * 
 * Command-line interface for running quality checks and CI/CD integration
 */

import * as fs from 'fs';
import * as path from 'path';
import { AdvancedLogger } from '../logging/AdvancedLogger';
import { QualityDetectionEngine } from '../quality-detection/QualityDetectionEngine';
import { AdvancedQualityMetrics } from '../quality-detection/AdvancedQualityMetrics';
import { ImprovementSuggestionEngine } from '../quality-detection/ImprovementSuggestionEngine';
import { CICDIntegrationService } from '../ci-cd/CICDIntegrationService';

interface CLIOptions {
  config?: string;
  output?: string;
  format?: 'json' | 'markdown' | 'html';
  threshold?: number;
  fail?: boolean;
  verbose?: boolean;
  help?: boolean;
}

class QualityCLI {
  private logger: AdvancedLogger;

  constructor() {
    this.logger = AdvancedLogger.getInstance();
  }

  async run(args: string[]): Promise<void> {
    const options = this.parseArgs(args);

    if (options.help) {
      this.showHelp();
      return;
    }

    if (options.verbose) {
      this.logger.setLevel('DEBUG');
    }

    try {
      console.log('🔍 Quality CLI - Starting quality analysis...\n');

      // Load configuration
      const config = this.loadConfig(options.config);

      // Initialize services
      const qualityEngine = new QualityDetectionEngine(this.logger);
      const metricsCalculator = new AdvancedQualityMetrics(this.logger);
      const suggestionEngine = new ImprovementSuggestionEngine(this.logger);
      const cicdService = new CICDIntegrationService(
        this.logger,
        qualityEngine,
        metricsCalculator,
        suggestionEngine
      );

      // Run quality pipeline
      const result = await cicdService.runQualityPipeline(config);

      // Output results
      await this.outputResults(result, options);

      // Exit with appropriate code
      const exitCode = this.getExitCode(result, options);
      console.log(`\n${result.success ? '✅' : '❌'} Quality analysis completed with exit code ${exitCode}`);
      
      if (exitCode !== 0) {
        console.log('\n💡 Recommendations:');
        result.recommendations.forEach((rec, index) => {
          console.log(`   ${index + 1}. ${rec}`);
        });
      }

      process.exit(exitCode);

    } catch (error) {
      console.error('❌ Quality analysis failed:', (error as Error).message);
      this.logger.error('CLI execution failed', error as Error);
      process.exit(1);
    }
  }

  private parseArgs(args: string[]): CLIOptions {
    const options: CLIOptions = {};

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      const nextArg = args[i + 1];

      switch (arg) {
        case '--config':
        case '-c':
          options.config = nextArg;
          i++;
          break;
        case '--output':
        case '-o':
          options.output = nextArg;
          i++;
          break;
        case '--format':
        case '-f':
          options.format = nextArg as 'json' | 'markdown' | 'html';
          i++;
          break;
        case '--threshold':
        case '-t':
          options.threshold = parseInt(nextArg, 10);
          i++;
          break;
        case '--fail':
          options.fail = true;
          break;
        case '--verbose':
        case '-v':
          options.verbose = true;
          break;
        case '--help':
        case '-h':
          options.help = true;
          break;
      }
    }

    return options;
  }

  private loadConfig(configPath?: string): any {
    const defaultConfigPath = path.join(process.cwd(), 'quality-gate.config.js');
    const configFile = configPath || defaultConfigPath;

    try {
      if (fs.existsSync(configFile)) {
        delete require.cache[require.resolve(configFile)];
        const config = require(configFile);
        
        // Apply environment-specific overrides
        const env = process.env.NODE_ENV || 'development';
        if (config.environments && config.environments[env]) {
          return this.mergeConfig(config, config.environments[env]);
        }
        
        return config;
      }
    } catch (error) {
      this.logger.warn('Failed to load config file, using defaults', error as Error);
    }

    // Return default configuration
    return CICDIntegrationService.getDefaultConfig();
  }

  private mergeConfig(base: any, override: any): any {
    const result = { ...base };
    
    for (const key in override) {
      if (typeof override[key] === 'object' && !Array.isArray(override[key])) {
        result[key] = this.mergeConfig(result[key] || {}, override[key]);
      } else {
        result[key] = override[key];
      }
    }
    
    return result;
  }

  private async outputResults(result: any, options: CLIOptions): Promise<void> {
    // Console output
    console.log('📊 Quality Analysis Results');
    console.log('===========================');
    console.log(`Overall Score: ${result.qualityScore.toFixed(1)}/100`);
    console.log(`Gate Status: ${this.getStatusEmoji(result.gateStatus)} ${result.gateStatus.toUpperCase()}`);
    console.log(`Duration: ${result.metadata.duration}ms`);
    console.log('');

    // Check results
    console.log('🔍 Check Results:');
    result.checks.forEach((check: any) => {
      const emoji = this.getStatusEmoji(check.status);
      console.log(`   ${emoji} ${check.name}: ${check.message}`);
    });
    console.log('');

    // Save reports if output specified
    if (options.output) {
      await this.saveReports(result, options);
    }
  }

  private async saveReports(result: any, options: CLIOptions): Promise<void> {
    const outputDir = options.output || './quality-reports';
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save reports
    for (const report of result.reports) {
      const filePath = path.join(outputDir, path.basename(report.path));
      fs.writeFileSync(filePath, report.content);
      console.log(`📄 Report saved: ${filePath}`);
    }

    // Save summary JSON
    const summaryPath = path.join(outputDir, 'quality-summary.json');
    const summary = {
      qualityScore: result.qualityScore,
      gateStatus: result.gateStatus,
      checks: result.checks,
      recommendations: result.recommendations,
      metadata: result.metadata
    };
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`📄 Summary saved: ${summaryPath}`);
  }

  private getExitCode(result: any, options: CLIOptions): number {
    // Check if we should fail on threshold
    if (options.fail || (options.threshold && result.qualityScore < options.threshold)) {
      return result.gateStatus === 'failed' ? 1 : 0;
    }

    // Default: only fail on actual failures, not warnings
    return result.gateStatus === 'failed' ? 1 : 0;
  }

  private getStatusEmoji(status: string): string {
    const emojis: Record<string, string> = {
      passed: '✅',
      failed: '❌',
      warning: '⚠️',
      skipped: '⏭️'
    };
    return emojis[status] || '❓';
  }

  private showHelp(): void {
    console.log(`
Quality CLI - Code Quality Analysis Tool

USAGE:
  quality-cli [OPTIONS]

OPTIONS:
  -c, --config <path>     Path to quality configuration file
  -o, --output <path>     Output directory for reports
  -f, --format <format>   Report format (json|markdown|html)
  -t, --threshold <num>   Minimum quality score threshold
  --fail                  Fail on quality gate failure
  -v, --verbose           Enable verbose logging
  -h, --help              Show this help message

EXAMPLES:
  quality-cli                                    # Run with default settings
  quality-cli --config ./my-quality.config.js   # Use custom config
  quality-cli --output ./reports --fail         # Save reports and fail on gate failure
  quality-cli --threshold 80 --verbose          # Set custom threshold with verbose output

ENVIRONMENT VARIABLES:
  NODE_ENV                Set environment (development|staging|production)
  QUALITY_WEBHOOK_URL     Webhook URL for notifications
  SLACK_CHANNEL           Slack channel for notifications
  GITHUB_SHA              Git commit SHA (auto-detected in CI)
  GITHUB_REF_NAME         Git branch name (auto-detected in CI)

EXIT CODES:
  0    Success or warnings only
  1    Quality gate failure or errors
`);
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  const cli = new QualityCLI();
  cli.run(process.argv.slice(2)).catch(error => {
    console.error('CLI execution failed:', error);
    process.exit(1);
  });
}

export { QualityCLI };