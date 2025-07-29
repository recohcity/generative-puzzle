/**
 * Validation Report Generator
 * 
 * Generates comprehensive validation reports in multiple formats
 * with detailed analysis and recommendations.
 */

import { ILogger } from '../interfaces';
import { ValidationSession, ValidationResult, ValidationStatus, ValidationSummary } from './AcceptanceCriteriaValidator';
import { EnhancedTask } from '../task-management/TaskTypes';
import * as fs from 'fs';
import * as path from 'path';

export interface ReportConfig {
  outputDirectory: string;
  formats: ReportFormat[];
  includeEvidence: boolean;
  includeRecommendations: boolean;
  includeCharts: boolean;
  templatePath?: string;
}

export enum ReportFormat {
  HTML = 'html',
  PDF = 'pdf',
  JSON = 'json',
  MARKDOWN = 'markdown'
}

export interface ValidationReport {
  id: string;
  sessionId: string;
  taskId: string;
  taskTitle: string;
  generatedAt: Date;
  generatedBy: string;
  summary: ValidationSummary;
  results: ValidationResult[];
  recommendations: string[];
  evidence: ReportEvidence[];
  metadata: ReportMetadata;
}

export interface ReportEvidence {
  criteriaId: string;
  type: string;
  description: string;
  filePath?: string;
  content?: string;
  metadata?: Record<string, any>;
}

export interface ReportMetadata {
  version: string;
  generator: string;
  environment: string;
  executionTime: number;
  reportSize: number;
}

export class ValidationReportGenerator {
  private logger: ILogger;
  private config: ReportConfig;

  constructor(logger: ILogger, config: Partial<ReportConfig> = {}) {
    this.logger = logger;
    this.config = {
      outputDirectory: path.join(process.cwd(), 'validation-reports'),
      formats: [ReportFormat.HTML, ReportFormat.JSON],
      includeEvidence: true,
      includeRecommendations: true,
      includeCharts: false,
      ...config
    };

    // Ensure output directory exists
    this.ensureOutputDirectory();
  }

  /**
   * Generate validation report for a session
   */
  async generateValidationReport(session: ValidationSession, task?: EnhancedTask): Promise<ValidationReport> {
    this.logger.info('Generating validation report', {
      sessionId: session.id,
      taskId: session.taskId,
      formats: this.config.formats
    });

    const startTime = Date.now();
    const reportId = this.generateReportId();

    // Create report data structure
    const report: ValidationReport = {
      id: reportId,
      sessionId: session.id,
      taskId: session.taskId,
      taskTitle: task?.title || 'Unknown Task',
      generatedAt: new Date(),
      generatedBy: 'ValidationReportGenerator',
      summary: session.summary,
      results: session.results,
      recommendations: await this.generateRecommendations(session),
      evidence: await this.collectReportEvidence(session),
      metadata: {
        version: '1.0.0',
        generator: 'Quality System Validation Report Generator',
        environment: process.env.NODE_ENV || 'development',
        executionTime: Date.now() - startTime,
        reportSize: 0
      }
    };

    // Generate reports in requested formats
    const generatedFiles: string[] = [];

    for (const format of this.config.formats) {
      try {
        const filePath = await this.generateReportFormat(report, format);
        generatedFiles.push(filePath);
        this.logger.debug('Report generated', { format, filePath });
      } catch (error) {
        this.logger.error(`Failed to generate ${format} report`, error as Error, {
          sessionId: session.id,
          reportId
        });
      }
    }

    report.metadata.executionTime = Date.now() - startTime;

    this.logger.info('Validation report generation completed', {
      reportId,
      sessionId: session.id,
      generatedFiles: generatedFiles.length,
      executionTime: report.metadata.executionTime
    });

    return report;
  }

  /**
   * Generate summary report for multiple sessions
   */
  async generateSummaryReport(
    sessions: ValidationSession[],
    title: string = 'Validation Summary Report'
  ): Promise<string> {
    this.logger.info('Generating summary report', {
      sessionCount: sessions.length,
      title
    });

    const summaryData = this.calculateSummaryStatistics(sessions);
    const reportContent = this.generateSummaryHTML(summaryData, title);
    
    const fileName = `summary-report-${Date.now()}.html`;
    const filePath = path.join(this.config.outputDirectory, fileName);
    
    fs.writeFileSync(filePath, reportContent, 'utf8');

    this.logger.info('Summary report generated', { filePath });
    return filePath;
  }

  /**
   * Generate trend report showing validation trends over time
   */
  async generateTrendReport(
    sessions: ValidationSession[],
    timeRange: { start: Date; end: Date }
  ): Promise<string> {
    this.logger.info('Generating trend report', {
      sessionCount: sessions.length,
      timeRange
    });

    const trendData = this.calculateTrendData(sessions, timeRange);
    const reportContent = this.generateTrendHTML(trendData);
    
    const fileName = `trend-report-${Date.now()}.html`;
    const filePath = path.join(this.config.outputDirectory, fileName);
    
    fs.writeFileSync(filePath, reportContent, 'utf8');

    this.logger.info('Trend report generated', { filePath });
    return filePath;
  }

  // Private methods

  private async generateReportFormat(report: ValidationReport, format: ReportFormat): Promise<string> {
    const fileName = `validation-report-${report.id}.${format}`;
    const filePath = path.join(this.config.outputDirectory, fileName);

    switch (format) {
      case ReportFormat.HTML:
        const htmlContent = this.generateHTMLReport(report);
        fs.writeFileSync(filePath, htmlContent, 'utf8');
        break;

      case ReportFormat.JSON:
        const jsonContent = JSON.stringify(report, null, 2);
        fs.writeFileSync(filePath, jsonContent, 'utf8');
        break;

      case ReportFormat.MARKDOWN:
        const markdownContent = this.generateMarkdownReport(report);
        fs.writeFileSync(filePath, markdownContent, 'utf8');
        break;

      case ReportFormat.PDF:
        // PDF generation would require additional libraries like puppeteer
        throw new Error('PDF generation not implemented yet');

      default:
        throw new Error(`Unsupported report format: ${format}`);
    }

    // Update report size
    const stats = fs.statSync(filePath);
    report.metadata.reportSize += stats.size;

    return filePath;
  }

  private generateHTMLReport(report: ValidationReport): string {
    const statusColors = {
      [ValidationStatus.PASSED]: '#28a745',
      [ValidationStatus.FAILED]: '#dc3545',
      [ValidationStatus.PENDING]: '#ffc107',
      [ValidationStatus.SKIPPED]: '#6c757d',
      [ValidationStatus.ERROR]: '#fd7e14',
      [ValidationStatus.RUNNING]: '#17a2b8'
    };

    const statusIcons = {
      [ValidationStatus.PASSED]: '✅',
      [ValidationStatus.FAILED]: '❌',
      [ValidationStatus.PENDING]: '⏳',
      [ValidationStatus.SKIPPED]: '⏭️',
      [ValidationStatus.ERROR]: '⚠️',
      [ValidationStatus.RUNNING]: '🔄'
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Validation Report - ${report.taskTitle}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8f9fa; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 2em; }
        .header .meta { margin-top: 10px; opacity: 0.9; }
        .content { padding: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #667eea; }
        .summary-card h3 { margin: 0 0 10px 0; color: #495057; }
        .summary-card .value { font-size: 2em; font-weight: bold; color: #667eea; }
        .results { margin-top: 30px; }
        .result-item { background: white; border: 1px solid #dee2e6; border-radius: 8px; margin-bottom: 15px; overflow: hidden; }
        .result-header { padding: 15px 20px; background: #f8f9fa; border-bottom: 1px solid #dee2e6; display: flex; align-items: center; justify-content: space-between; }
        .result-status { display: flex; align-items: center; gap: 10px; }
        .result-body { padding: 20px; }
        .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 0.85em; font-weight: 500; }
        .recommendations { background: #e3f2fd; border: 1px solid #bbdefb; border-radius: 8px; padding: 20px; margin-top: 30px; }
        .recommendations h3 { margin-top: 0; color: #1976d2; }
        .evidence { margin-top: 15px; }
        .evidence-item { background: #f8f9fa; border-radius: 4px; padding: 10px; margin-bottom: 10px; font-family: monospace; font-size: 0.9em; }
        .footer { text-align: center; padding: 20px; color: #6c757d; border-top: 1px solid #dee2e6; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Validation Report</h1>
            <div class="meta">
                <strong>Task:</strong> ${report.taskTitle}<br>
                <strong>Session ID:</strong> ${report.sessionId}<br>
                <strong>Generated:</strong> ${report.generatedAt.toLocaleString()}<br>
                <strong>Generated By:</strong> ${report.generatedBy}
            </div>
        </div>
        
        <div class="content">
            <div class="summary">
                <div class="summary-card">
                    <h3>Total Criteria</h3>
                    <div class="value">${report.summary.totalCriteria}</div>
                </div>
                <div class="summary-card">
                    <h3>Passed</h3>
                    <div class="value" style="color: #28a745;">${report.summary.passedCriteria}</div>
                </div>
                <div class="summary-card">
                    <h3>Failed</h3>
                    <div class="value" style="color: #dc3545;">${report.summary.failedCriteria}</div>
                </div>
                <div class="summary-card">
                    <h3>Completion</h3>
                    <div class="value">${report.summary.completionPercentage.toFixed(1)}%</div>
                </div>
                <div class="summary-card">
                    <h3>Execution Time</h3>
                    <div class="value">${(report.summary.executionTime / 1000).toFixed(1)}s</div>
                </div>
                <div class="summary-card">
                    <h3>Overall Status</h3>
                    <div class="value" style="color: ${report.summary.overallStatus === 'passed' ? '#28a745' : report.summary.overallStatus === 'failed' ? '#dc3545' : '#ffc107'};">
                        ${report.summary.overallStatus.toUpperCase()}
                    </div>
                </div>
            </div>

            <div class="results">
                <h2>Validation Results</h2>
                ${report.results.map(result => `
                    <div class="result-item">
                        <div class="result-header">
                            <div class="result-status">
                                <span style="font-size: 1.2em;">${statusIcons[result.status]}</span>
                                <strong>Criteria ${result.criteriaId}</strong>
                            </div>
                            <span class="status-badge" style="background-color: ${statusColors[result.status]}; color: white;">
                                ${result.status.toUpperCase()}
                            </span>
                        </div>
                        <div class="result-body">
                            <p><strong>Message:</strong> ${result.message}</p>
                            ${result.executionTime ? `<p><strong>Execution Time:</strong> ${result.executionTime}ms</p>` : ''}
                            ${result.validatedBy ? `<p><strong>Validated By:</strong> ${result.validatedBy}</p>` : ''}
                            ${result.details ? `<p><strong>Details:</strong> <pre>${JSON.stringify(result.details, null, 2)}</pre></p>` : ''}
                            ${result.evidence && result.evidence.length > 0 ? `
                                <div class="evidence">
                                    <strong>Evidence:</strong>
                                    ${result.evidence.map(evidence => `
                                        <div class="evidence-item">
                                            <strong>${evidence.type}:</strong> ${evidence.description}<br>
                                            ${evidence.content ? evidence.content.substring(0, 200) + (evidence.content.length > 200 ? '...' : '') : ''}
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>

            ${report.recommendations.length > 0 ? `
                <div class="recommendations">
                    <h3>🎯 Recommendations</h3>
                    <ul>
                        ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>

        <div class="footer">
            Generated by ${report.metadata.generator} v${report.metadata.version}<br>
            Report ID: ${report.id} | Environment: ${report.metadata.environment}
        </div>
    </div>
</body>
</html>`;
  }

  private generateMarkdownReport(report: ValidationReport): string {
    const statusEmojis = {
      [ValidationStatus.PASSED]: '✅',
      [ValidationStatus.FAILED]: '❌',
      [ValidationStatus.PENDING]: '⏳',
      [ValidationStatus.SKIPPED]: '⏭️',
      [ValidationStatus.ERROR]: '⚠️',
      [ValidationStatus.RUNNING]: '🔄'
    };

    return `# Validation Report

**Task:** ${report.taskTitle}  
**Session ID:** ${report.sessionId}  
**Generated:** ${report.generatedAt.toISOString()}  
**Generated By:** ${report.generatedBy}

## Summary

| Metric | Value |
|--------|-------|
| Total Criteria | ${report.summary.totalCriteria} |
| Passed | ${report.summary.passedCriteria} |
| Failed | ${report.summary.failedCriteria} |
| Skipped | ${report.summary.skippedCriteria} |
| Errors | ${report.summary.errorCriteria} |
| Completion | ${report.summary.completionPercentage.toFixed(1)}% |
| Execution Time | ${(report.summary.executionTime / 1000).toFixed(1)}s |
| Overall Status | **${report.summary.overallStatus.toUpperCase()}** |

## Validation Results

${report.results.map(result => `
### ${statusEmojis[result.status]} Criteria ${result.criteriaId}

**Status:** ${result.status.toUpperCase()}  
**Message:** ${result.message}  
${result.executionTime ? `**Execution Time:** ${result.executionTime}ms  ` : ''}
${result.validatedBy ? `**Validated By:** ${result.validatedBy}  ` : ''}

${result.details ? `
**Details:**
\`\`\`json
${JSON.stringify(result.details, null, 2)}
\`\`\`
` : ''}

${result.evidence && result.evidence.length > 0 ? `
**Evidence:**
${result.evidence.map(evidence => `
- **${evidence.type}:** ${evidence.description}
  ${evidence.content ? `\`\`\`\n${evidence.content.substring(0, 500)}\n\`\`\`` : ''}
`).join('')}
` : ''}
`).join('')}

${report.recommendations.length > 0 ? `
## 🎯 Recommendations

${report.recommendations.map(rec => `- ${rec}`).join('\n')}
` : ''}

---

*Generated by ${report.metadata.generator} v${report.metadata.version}*  
*Report ID: ${report.id} | Environment: ${report.metadata.environment}*
`;
  }

  private async generateRecommendations(session: ValidationSession): Promise<string[]> {
    const recommendations: string[] = [];
    const { summary, results } = session;

    // Overall recommendations based on summary
    if (summary.overallStatus === 'failed') {
      recommendations.push('Review and address all failed acceptance criteria before proceeding');
    }

    if (summary.completionPercentage < 50) {
      recommendations.push('Consider breaking down complex criteria into smaller, more manageable parts');
    }

    if (summary.errorCriteria > 0) {
      recommendations.push('Investigate and fix validation script errors to ensure accurate results');
    }

    // Specific recommendations based on results
    const failedResults = results.filter(r => r.status === ValidationStatus.FAILED);
    if (failedResults.length > 0) {
      recommendations.push(`Focus on resolving ${failedResults.length} failed criteria: ${failedResults.map(r => r.criteriaId).join(', ')}`);
    }

    const pendingResults = results.filter(r => r.status === ValidationStatus.PENDING);
    if (pendingResults.length > 0) {
      recommendations.push(`Complete manual validation for ${pendingResults.length} pending criteria`);
    }

    const errorResults = results.filter(r => r.status === ValidationStatus.ERROR);
    if (errorResults.length > 0) {
      recommendations.push('Fix validation script errors and re-run validation');
    }

    // Performance recommendations
    if (summary.executionTime > 300000) { // 5 minutes
      recommendations.push('Consider optimizing validation scripts to reduce execution time');
    }

    return recommendations;
  }

  private async collectReportEvidence(session: ValidationSession): Promise<ReportEvidence[]> {
    const evidence: ReportEvidence[] = [];

    for (const result of session.results) {
      if (result.evidence) {
        for (const item of result.evidence) {
          evidence.push({
            criteriaId: result.criteriaId,
            type: item.type,
            description: item.description,
            content: typeof item.content === 'string' ? item.content : item.content.toString(),
            metadata: item.metadata
          });
        }
      }
    }

    return evidence;
  }

  private calculateSummaryStatistics(sessions: ValidationSession[]): any {
    // Implementation for summary statistics calculation
    return {
      totalSessions: sessions.length,
      averageCompletion: sessions.reduce((sum, s) => sum + s.summary.completionPercentage, 0) / sessions.length,
      totalCriteria: sessions.reduce((sum, s) => sum + s.summary.totalCriteria, 0),
      totalPassed: sessions.reduce((sum, s) => sum + s.summary.passedCriteria, 0),
      totalFailed: sessions.reduce((sum, s) => sum + s.summary.failedCriteria, 0)
    };
  }

  private calculateTrendData(sessions: ValidationSession[], timeRange: { start: Date; end: Date }): any {
    // Implementation for trend data calculation
    return {
      timeRange,
      sessions: sessions.filter(s => s.startTime >= timeRange.start && s.startTime <= timeRange.end),
      trends: {
        completion: [],
        passRate: [],
        executionTime: []
      }
    };
  }

  private generateSummaryHTML(summaryData: any, title: string): string {
    // Implementation for summary HTML generation
    return `<html><body><h1>${title}</h1><p>Summary data would be rendered here</p></body></html>`;
  }

  private generateTrendHTML(trendData: any): string {
    // Implementation for trend HTML generation
    return `<html><body><h1>Trend Report</h1><p>Trend data would be rendered here</p></body></html>`;
  }

  private ensureOutputDirectory(): void {
    if (!fs.existsSync(this.config.outputDirectory)) {
      fs.mkdirSync(this.config.outputDirectory, { recursive: true });
    }
  }

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}