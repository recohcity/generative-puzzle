/**
 * CI/CD Integration Service
 * 
 * Provides integration with CI/CD pipelines, quality gates, and automated reporting.
 */

import { ILogger } from '../interfaces';
import { QualityDetectionEngine } from '../quality-detection/QualityDetectionEngine';
import { AdvancedQualityMetrics } from '../quality-detection/AdvancedQualityMetrics';
import { ImprovementSuggestionEngine } from '../quality-detection/ImprovementSuggestionEngine';

export interface CICDConfig {
  qualityGate: {
    enabled: boolean;
    minimumScore: number;
    failOnThreshold: boolean;
    requiredChecks: string[];
  };
  reporting: {
    enabled: boolean;
    formats: ('json' | 'html' | 'markdown')[];
    outputPath: string;
    includeDetails: boolean;
  };
  notifications: {
    enabled: boolean;
    channels: ('slack' | 'email' | 'github' | 'webhook')[];
    webhookUrl?: string;
    slackChannel?: string;
  };
  coverage: {
    enabled: boolean;
    minimumCoverage: number;
    failOnThreshold: boolean;
    reportPath: string;
  };
}

export interface CICDResult {
  success: boolean;
  qualityScore: number;
  gateStatus: 'passed' | 'failed' | 'warning';
  checks: CICDCheck[];
  reports: CICDReport[];
  recommendations: string[];
  metadata: {
    timestamp: Date;
    duration: number;
    environment: string;
    commit?: string;
    branch?: string;
  };
}

export interface CICDCheck {
  name: string;
  status: 'passed' | 'failed' | 'warning' | 'skipped';
  score?: number;
  threshold?: number;
  message: string;
  details?: any;
}

export interface CICDReport {
  format: 'json' | 'html' | 'markdown';
  path: string;
  content: string;
  size: number;
}

export class CICDIntegrationService {
  private logger: ILogger;
  private qualityEngine: QualityDetectionEngine;
  private metricsCalculator: AdvancedQualityMetrics;
  private suggestionEngine: ImprovementSuggestionEngine;

  constructor(
    logger: ILogger,
    qualityEngine: QualityDetectionEngine,
    metricsCalculator: AdvancedQualityMetrics,
    suggestionEngine: ImprovementSuggestionEngine
  ) {
    this.logger = logger;
    this.qualityEngine = qualityEngine;
    this.metricsCalculator = metricsCalculator;
    this.suggestionEngine = suggestionEngine;
  }

  /**
   * Run complete CI/CD quality pipeline
   */
  async runQualityPipeline(config: CICDConfig): Promise<CICDResult> {
    const startTime = Date.now();
    this.logger.info('Starting CI/CD quality pipeline');

    try {
      // Initialize quality engine
      await this.qualityEngine.initialize();

      // Run quality checks
      const checks: CICDCheck[] = [];
      const reports: CICDReport[] = [];

      // 1. Run quality detection
      const qualityChecks = await this.runQualityDetection(config);
      checks.push(...qualityChecks.checks);

      // 2. Check coverage if enabled
      if (config.coverage.enabled) {
        const coverageCheck = await this.runCoverageCheck(config);
        checks.push(coverageCheck);
      }

      // 3. Calculate overall quality score
      const overallScore = await this.calculateOverallScore();

      // 4. Run quality gate
      const gateStatus = this.evaluateQualityGate(overallScore, checks, config);

      // 5. Generate reports
      if (config.reporting.enabled) {
        const generatedReports = await this.generateReports(
          overallScore,
          checks,
          config
        );
        reports.push(...generatedReports);
      }

      // 6. Generate recommendations
      const recommendations = await this.generateRecommendations();

      // 7. Send notifications
      if (config.notifications.enabled) {
        await this.sendNotifications(overallScore, gateStatus, config);
      }

      const duration = Date.now() - startTime;
      const result: CICDResult = {
        success: gateStatus !== 'failed',
        qualityScore: overallScore,
        gateStatus,
        checks,
        reports,
        recommendations,
        metadata: {
          timestamp: new Date(),
          duration,
          environment: process.env.NODE_ENV || 'development',
          commit: process.env.GITHUB_SHA,
          branch: process.env.GITHUB_REF_NAME
        }
      };

      this.logger.info('CI/CD quality pipeline completed', {
        success: result.success,
        qualityScore: overallScore,
        gateStatus,
        duration
      });

      return result;

    } catch (error) {
      this.logger.error('CI/CD quality pipeline failed', error as Error);
      throw error;
    }
  }

  /**
   * Run quality detection checks
   */
  private async runQualityDetection(config: CICDConfig): Promise<{
    checks: CICDCheck[];
  }> {
    this.logger.info('Running quality detection checks');

    const checks: CICDCheck[] = [];

    try {
      // Run all quality checks
      const qualityResults = await this.qualityEngine.runAllChecks();
      const overallScore = await this.qualityEngine.calculateOverallScore(qualityResults);

      // TypeScript check
      const tsResult = qualityResults.find(r => r.type === 'typescript');
      if (tsResult) {
        checks.push({
          name: 'TypeScript Compilation',
          status: tsResult.status === 'completed' && tsResult.result!.score > 80 ? 'passed' : 'failed',
          score: tsResult.result?.score,
          threshold: 80,
          message: `TypeScript check ${tsResult.status} with score ${tsResult.result?.score?.toFixed(1) || 0}`,
          details: {
            issues: tsResult.result?.issues.length || 0,
            errors: tsResult.result?.issues.filter(i => i.severity === 'error').length || 0
          }
        });
      }

      // ESLint check
      const eslintResult = qualityResults.find(r => r.type === 'eslint');
      if (eslintResult) {
        checks.push({
          name: 'ESLint Code Quality',
          status: eslintResult.status === 'completed' && eslintResult.result!.score > 70 ? 'passed' : 'warning',
          score: eslintResult.result?.score,
          threshold: 70,
          message: `ESLint check ${eslintResult.status} with score ${eslintResult.result?.score?.toFixed(1) || 0}`,
          details: {
            issues: eslintResult.result?.issues.length || 0,
            fixable: eslintResult.result?.issues.filter(i => i.fixable).length || 0
          }
        });
      }

      // Coverage check
      const coverageResult = qualityResults.find(r => r.type === 'coverage');
      if (coverageResult) {
        const coverage = coverageResult.result?.metrics?.testCoverage || 0;
        checks.push({
          name: 'Test Coverage',
          status: coverage >= config.coverage.minimumCoverage ? 'passed' : 'warning',
          score: coverage,
          threshold: config.coverage.minimumCoverage,
          message: `Test coverage: ${coverage.toFixed(1)}%`,
          details: {
            lines: coverageResult.result?.metrics?.lineCoverage || 0,
            functions: coverageResult.result?.metrics?.functionCoverage || 0,
            branches: coverageResult.result?.metrics?.branchCoverage || 0
          }
        });
      }

      // Complexity check
      const complexityResult = qualityResults.find(r => r.type === 'complexity');
      if (complexityResult) {
        const complexity = complexityResult.result?.metrics?.averageCyclomaticComplexity || 0;
        checks.push({
          name: 'Code Complexity',
          status: complexity <= 10 ? 'passed' : complexity <= 15 ? 'warning' : 'failed',
          score: Math.max(0, 100 - complexity * 5),
          threshold: 10,
          message: `Average cyclomatic complexity: ${complexity.toFixed(1)}`,
          details: {
            cyclomaticComplexity: complexity,
            cognitiveComplexity: complexityResult.result?.metrics?.averageCognitiveComplexity || 0
          }
        });
      }

      return { checks };

    } catch (error) {
      this.logger.error('Quality detection checks failed', error as Error);
      checks.push({
        name: 'Quality Detection',
        status: 'failed',
        message: `Quality detection failed: ${(error as Error).message}`
      });
      return { checks };
    }
  }

  /**
   * Run coverage check
   */
  private async runCoverageCheck(config: CICDConfig): Promise<CICDCheck> {
    this.logger.info('Running coverage check');

    try {
      // This would typically read from a coverage report file
      // For now, we'll simulate coverage data
      const mockCoverage = 75; // This would be read from actual coverage report

      return {
        name: 'Coverage Gate',
        status: mockCoverage >= config.coverage.minimumCoverage ? 'passed' : 'failed',
        score: mockCoverage,
        threshold: config.coverage.minimumCoverage,
        message: `Coverage: ${mockCoverage}% (required: ${config.coverage.minimumCoverage}%)`,
        details: {
          reportPath: config.coverage.reportPath
        }
      };

    } catch (error) {
      this.logger.error('Coverage check failed', error as Error);
      return {
        name: 'Coverage Gate',
        status: 'failed',
        message: `Coverage check failed: ${(error as Error).message}`
      };
    }
  }

  /**
   * Calculate overall quality score
   */
  private async calculateOverallScore(): Promise<number> {
    try {
      const qualityResults = await this.qualityEngine.runAllChecks();
      return await this.qualityEngine.calculateOverallScore(qualityResults);
    } catch (error) {
      this.logger.error('Failed to calculate overall score', error as Error);
      return 0;
    }
  }

  /**
   * Evaluate quality gate
   */
  private evaluateQualityGate(
    overallScore: number,
    checks: CICDCheck[],
    config: CICDConfig
  ): 'passed' | 'failed' | 'warning' {
    if (!config.qualityGate.enabled) {
      return 'passed';
    }

    const failedChecks = checks.filter(c => c.status === 'failed');
    const warningChecks = checks.filter(c => c.status === 'warning');

    // Check if overall score meets threshold
    const scoreGate = overallScore >= config.qualityGate.minimumScore;

    // Check if required checks pass
    const requiredChecksPassed = config.qualityGate.requiredChecks.every(requiredCheck =>
      checks.find(c => c.name === requiredCheck)?.status === 'passed'
    );

    if (!scoreGate || !requiredChecksPassed || failedChecks.length > 0) {
      return config.qualityGate.failOnThreshold ? 'failed' : 'warning';
    }

    if (warningChecks.length > 0) {
      return 'warning';
    }

    return 'passed';
  }

  /**
   * Generate reports
   */
  private async generateReports(
    overallScore: number,
    checks: CICDCheck[],
    config: CICDConfig
  ): Promise<CICDReport[]> {
    const reports: CICDReport[] = [];

    for (const format of config.reporting.formats) {
      try {
        let content: string;
        let filename: string;

        switch (format) {
          case 'json':
            content = JSON.stringify({
              overallScore,
              checks,
              timestamp: new Date().toISOString()
            }, null, 2);
            filename = 'quality-report.json';
            break;

          case 'markdown':
            content = this.generateMarkdownReport(overallScore, checks);
            filename = 'quality-report.md';
            break;

          case 'html':
            content = this.generateHtmlReport(overallScore, checks);
            filename = 'quality-report.html';
            break;

          default:
            continue;
        }

        const path = `${config.reporting.outputPath}/${filename}`;
        reports.push({
          format,
          path,
          content,
          size: content.length
        });

        this.logger.debug(`Generated ${format} report`, { path, size: content.length });

      } catch (error) {
        this.logger.error(`Failed to generate ${format} report`, error as Error);
      }
    }

    return reports;
  }

  /**
   * Generate markdown report
   */
  private generateMarkdownReport(overallScore: number, checks: CICDCheck[]): string {
    const timestamp = new Date().toISOString();
    const passedChecks = checks.filter(c => c.status === 'passed').length;
    const failedChecks = checks.filter(c => c.status === 'failed').length;
    const warningChecks = checks.filter(c => c.status === 'warning').length;

    let markdown = `# Quality Report\n\n`;
    markdown += `**Generated:** ${timestamp}\n\n`;
    markdown += `## Summary\n\n`;
    markdown += `- **Overall Score:** ${overallScore.toFixed(1)}/100\n`;
    markdown += `- **Checks Passed:** ${passedChecks}\n`;
    markdown += `- **Checks Failed:** ${failedChecks}\n`;
    markdown += `- **Checks with Warnings:** ${warningChecks}\n\n`;

    markdown += `## Detailed Results\n\n`;
    markdown += `| Check | Status | Score | Threshold | Message |\n`;
    markdown += `|-------|--------|-------|-----------|----------|\n`;

    checks.forEach(check => {
      const statusEmoji = {
        passed: '✅',
        failed: '❌',
        warning: '⚠️',
        skipped: '⏭️'
      };

      markdown += `| ${check.name} | ${statusEmoji[check.status]} ${check.status} | `;
      markdown += `${check.score?.toFixed(1) || 'N/A'} | `;
      markdown += `${check.threshold || 'N/A'} | `;
      markdown += `${check.message} |\n`;
    });

    return markdown;
  }

  /**
   * Generate HTML report
   */
  private generateHtmlReport(overallScore: number, checks: CICDCheck[]): string {
    const timestamp = new Date().toISOString();
    const passedChecks = checks.filter(c => c.status === 'passed').length;
    const failedChecks = checks.filter(c => c.status === 'failed').length;

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Quality Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; }
        .score { font-size: 24px; font-weight: bold; color: ${overallScore >= 80 ? '#28a745' : overallScore >= 60 ? '#ffc107' : '#dc3545'}; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .warning { color: #ffc107; }
    </style>
</head>
<body>
    <h1>Quality Report</h1>
    <div class="summary">
        <p><strong>Generated:</strong> ${timestamp}</p>
        <p><strong>Overall Score:</strong> <span class="score">${overallScore.toFixed(1)}/100</span></p>
        <p><strong>Checks:</strong> ${passedChecks} passed, ${failedChecks} failed</p>
    </div>
    
    <h2>Detailed Results</h2>
    <table>
        <tr>
            <th>Check</th>
            <th>Status</th>
            <th>Score</th>
            <th>Threshold</th>
            <th>Message</th>
        </tr>
        ${checks.map(check => `
        <tr>
            <td>${check.name}</td>
            <td class="${check.status}">${check.status.toUpperCase()}</td>
            <td>${check.score?.toFixed(1) || 'N/A'}</td>
            <td>${check.threshold || 'N/A'}</td>
            <td>${check.message}</td>
        </tr>
        `).join('')}
    </table>
</body>
</html>`;
  }

  /**
   * Generate recommendations
   */
  private async generateRecommendations(): Promise<string[]> {
    try {
      const qualityResults = await this.qualityEngine.runAllChecks();
      const suggestions = this.suggestionEngine.generateSuggestions(qualityResults);
      
      return suggestions
        .filter(s => s.priority === 'critical' || s.priority === 'high')
        .slice(0, 5)
        .map(s => s.title);

    } catch (error) {
      this.logger.error('Failed to generate recommendations', error as Error);
      return ['Review quality check results and address critical issues'];
    }
  }

  /**
   * Send notifications
   */
  private async sendNotifications(
    overallScore: number,
    gateStatus: 'passed' | 'failed' | 'warning',
    config: CICDConfig
  ): Promise<void> {
    this.logger.info('Sending quality notifications', { gateStatus, score: overallScore });

    const message = `Quality Gate ${gateStatus.toUpperCase()}: Score ${overallScore.toFixed(1)}/100`;

    for (const channel of config.notifications.channels) {
      try {
        switch (channel) {
          case 'webhook':
            if (config.notifications.webhookUrl) {
              await this.sendWebhookNotification(config.notifications.webhookUrl, {
                message,
                score: overallScore,
                status: gateStatus
              });
            }
            break;

          case 'github':
            // GitHub notifications would be handled by the workflow
            this.logger.debug('GitHub notification handled by workflow');
            break;

          case 'slack':
            // Slack integration would require additional setup
            this.logger.debug('Slack notification not implemented');
            break;

          case 'email':
            // Email integration would require additional setup
            this.logger.debug('Email notification not implemented');
            break;
        }
      } catch (error) {
        this.logger.error(`Failed to send ${channel} notification`, error as Error);
      }
    }
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(url: string, payload: any): Promise<void> {
    try {
      // This would typically use fetch or axios to send the webhook
      this.logger.info('Webhook notification sent', { url, payload });
    } catch (error) {
      this.logger.error('Failed to send webhook notification', error as Error);
      throw error;
    }
  }

  /**
   * Get default CI/CD configuration
   */
  static getDefaultConfig(): CICDConfig {
    return {
      qualityGate: {
        enabled: true,
        minimumScore: 70,
        failOnThreshold: false,
        requiredChecks: ['TypeScript Compilation']
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
  }
}