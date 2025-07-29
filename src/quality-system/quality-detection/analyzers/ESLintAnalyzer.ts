/**
 * ESLint Analyzer
 * 
 * Integrates with ESLint API to perform code quality analysis
 * and detect style, best practice, and potential bug issues.
 */

import { ESLint } from 'eslint';
import * as path from 'path';
import * as fs from 'fs';
import { ILogger } from '../../interfaces';
import { QualityCheckResult, QualityIssue } from '../../types';
import { QualityDetectionConfig } from '../QualityDetectionEngine';

export interface ESLintAnalysisResult extends QualityCheckResult {
  rulesViolated: number;
  fixableIssues: number;
  filesAnalyzed: number;
  analysisTime: number;
  ruleBreakdown: Record<string, number>;
}

export class ESLintAnalyzer {
  private logger: ILogger;
  private eslint: ESLint | null = null;

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  /**
   * Initialize the ESLint analyzer
   */
  async initialize(): Promise<void> {
    this.logger.debug('Initializing ESLint analyzer');

    try {
      // Find ESLint configuration
      const configPath = this.findESLintConfig();
      
      // Create ESLint instance
      this.eslint = new ESLint({
        baseConfig: configPath ? undefined : this.getDefaultConfig(),
        overrideConfigFile: configPath || undefined,
        fix: false, // We don't auto-fix during analysis
        cache: true,
        cacheLocation: '.eslintcache'
      });

      this.logger.debug('ESLint analyzer initialized', {
        configPath,
        version: ESLint.version
      });

    } catch (error) {
      this.logger.error('Failed to initialize ESLint analyzer', error as Error);
      throw error;
    }
  }

  /**
   * Analyze code quality using ESLint
   */
  async analyze(config: QualityDetectionConfig): Promise<ESLintAnalysisResult> {
    if (!this.eslint) {
      throw new Error('ESLint analyzer not initialized');
    }

    this.logger.info('Starting ESLint analysis', {
      projectRoot: config.projectRoot,
      includePatterns: config.includePatterns
    });

    const startTime = Date.now();

    try {
      // Find files to analyze
      const filesToAnalyze = await this.findFilesToAnalyze(config);
      
      if (filesToAnalyze.length === 0) {
        this.logger.warn('No files found for ESLint analysis');
        return this.createEmptyResult();
      }

      // Run ESLint analysis
      const results = await this.eslint.lintFiles(filesToAnalyze);

      // Convert ESLint results to quality issues
      const issues = this.convertResultsToIssues(results);

      // Calculate metrics
      const metrics = this.calculateMetrics(results);

      // Generate suggestions
      const suggestions = this.generateSuggestions(results, issues);

      // Calculate score
      const score = this.calculateScore(issues, metrics);

      const analysisTime = Date.now() - startTime;

      const result: ESLintAnalysisResult = {
        score,
        issues,
        suggestions,
        metrics: {
          rulesViolated: this.countUniqueRules(results),
          fixableIssues: this.countFixableIssues(results),
          filesAnalyzed: results.length,
          analysisTime,
          ...metrics
        },
        rulesViolated: this.countUniqueRules(results),
        fixableIssues: this.countFixableIssues(results),
        filesAnalyzed: results.length,
        analysisTime,
        ruleBreakdown: this.getRuleBreakdown(results)
      };

      this.logger.info('ESLint analysis completed', {
        score: result.score,
        issues: result.issues.length,
        fixableIssues: result.fixableIssues,
        filesAnalyzed: result.filesAnalyzed,
        analysisTime
      });

      return result;

    } catch (error) {
      this.logger.error('ESLint analysis failed', error as Error);
      throw error;
    }
  }

  /**
   * Get auto-fixable issues count
   */
  async getFixableIssuesCount(config: QualityDetectionConfig): Promise<number> {
    if (!this.eslint) {
      await this.initialize();
    }

    try {
      const filesToAnalyze = await this.findFilesToAnalyze(config);
      const results = await this.eslint!.lintFiles(filesToAnalyze);
      return this.countFixableIssues(results);
    } catch (error) {
      this.logger.error('Failed to get fixable issues count', error as Error);
      return 0;
    }
  }

  /**
   * Apply auto-fixes to code
   */
  async applyAutoFixes(config: QualityDetectionConfig): Promise<{
    fixedFiles: number;
    fixedIssues: number;
  }> {
    if (!this.eslint) {
      await this.initialize();
    }

    this.logger.info('Applying ESLint auto-fixes');

    try {
      // Create ESLint instance with fix enabled
      const fixingESLint = new ESLint({
        baseConfig: this.getDefaultConfig(),
        fix: true,
        cache: false
      });

      const filesToAnalyze = await this.findFilesToAnalyze(config);
      const results = await fixingESLint.lintFiles(filesToAnalyze);

      // Apply fixes
      await ESLint.outputFixes(results);

      const fixedFiles = results.filter(result => result.output !== undefined).length;
      const fixedIssues = results.reduce((sum, result) => 
        sum + (result.fixableErrorCount + result.fixableWarningCount), 0
      );

      this.logger.info('Auto-fixes applied', {
        fixedFiles,
        fixedIssues
      });

      return { fixedFiles, fixedIssues };

    } catch (error) {
      this.logger.error('Failed to apply auto-fixes', error as Error);
      throw error;
    }
  }

  // Private methods

  private findESLintConfig(): string | null {
    const possibleConfigs = [
      '.eslintrc.js',
      '.eslintrc.json',
      '.eslintrc.yml',
      '.eslintrc.yaml',
      'eslint.config.js',
      'eslint.config.mjs'
    ];

    for (const configFile of possibleConfigs) {
      if (fs.existsSync(configFile)) {
        return path.resolve(configFile);
      }
    }

    // Check package.json for eslintConfig
    if (fs.existsSync('package.json')) {
      try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        if (packageJson.eslintConfig) {
          return 'package.json';
        }
      } catch (error) {
        this.logger.warn('Failed to parse package.json for ESLint config');
      }
    }

    return null;
  }

  private getDefaultConfig(): any {
    return {
      env: {
        browser: true,
        es2021: true,
        node: true
      },
      extends: [
        'eslint:recommended',
        '@typescript-eslint/recommended'
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      plugins: [
        '@typescript-eslint',
        'react',
        'react-hooks'
      ],
      rules: {
        // Error prevention
        'no-unused-vars': 'error',
        'no-undef': 'error',
        'no-unreachable': 'error',
        'no-constant-condition': 'error',
        
        // Best practices
        'eqeqeq': 'error',
        'no-eval': 'error',
        'no-implied-eval': 'error',
        'prefer-const': 'warn',
        'no-var': 'warn',
        
        // Style
        'indent': ['warn', 2],
        'quotes': ['warn', 'single'],
        'semi': ['warn', 'always'],
        
        // TypeScript specific
        '@typescript-eslint/no-unused-vars': 'error',
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/explicit-function-return-type': 'off',
        
        // React specific
        'react/jsx-uses-react': 'error',
        'react/jsx-uses-vars': 'error',
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn'
      },
      settings: {
        react: {
          version: 'detect'
        }
      }
    };
  }

  private async findFilesToAnalyze(config: QualityDetectionConfig): Promise<string[]> {
    // ESLint can handle glob patterns directly
    const patterns = config.includePatterns.filter(pattern => {
      // Filter out patterns that match excluded files
      return !config.excludePatterns.some(excludePattern => 
        pattern.includes(excludePattern.replace('**/', '').replace('/**', ''))
      );
    });

    return patterns;
  }

  private convertResultsToIssues(results: ESLint.LintResult[]): QualityIssue[] {
    const issues: QualityIssue[] = [];

    results.forEach(result => {
      result.messages.forEach(message => {
        issues.push({
          severity: message.severity === 2 ? 'error' : 'warning',
          file: path.relative(process.cwd(), result.filePath),
          line: message.line,
          column: message.column,
          message: message.message,
          rule: message.ruleId || 'unknown',
          fixable: message.fix !== undefined
        });
      });
    });

    return issues;
  }

  private calculateMetrics(results: ESLint.LintResult[]): Record<string, number> {
    const totalMessages = results.reduce((sum, result) => sum + result.messages.length, 0);
    const totalErrors = results.reduce((sum, result) => sum + result.errorCount, 0);
    const totalWarnings = results.reduce((sum, result) => sum + result.warningCount, 0);
    const totalFixable = results.reduce((sum, result) => 
      sum + result.fixableErrorCount + result.fixableWarningCount, 0
    );

    const filesWithIssues = results.filter(result => result.messages.length > 0).length;
    const totalFiles = results.length;

    return {
      totalESLintIssues: totalMessages,
      eslintErrors: totalErrors,
      eslintWarnings: totalWarnings,
      eslintFixableIssues: totalFixable,
      issuesDensity: totalFiles > 0 ? totalMessages / totalFiles : 0,
      errorRate: totalMessages > 0 ? totalErrors / totalMessages : 0,
      warningRate: totalMessages > 0 ? totalWarnings / totalMessages : 0,
      fixableRate: totalMessages > 0 ? totalFixable / totalMessages : 0,
      filesWithIssuesPercentage: totalFiles > 0 ? (filesWithIssues / totalFiles) * 100 : 0
    };
  }

  private generateSuggestions(results: ESLint.LintResult[], issues: QualityIssue[]): string[] {
    const suggestions: string[] = [];

    const totalErrors = results.reduce((sum, result) => sum + result.errorCount, 0);
    const totalWarnings = results.reduce((sum, result) => sum + result.warningCount, 0);
    const totalFixable = this.countFixableIssues(results);

    if (totalErrors > 0) {
      suggestions.push(`Fix ${totalErrors} ESLint errors to improve code quality`);
    }

    if (totalWarnings > 0) {
      suggestions.push(`Address ${totalWarnings} ESLint warnings for better code consistency`);
    }

    if (totalFixable > 0) {
      suggestions.push(`${totalFixable} issues can be automatically fixed with 'eslint --fix'`);
    }

    // Analyze common rule violations
    const ruleBreakdown = this.getRuleBreakdown(results);
    const topViolatedRules = Object.entries(ruleBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    topViolatedRules.forEach(([rule, count]) => {
      if (count > 5) {
        suggestions.push(this.getRuleSuggestion(rule, count));
      }
    });

    // Check for missing configuration
    if (!this.findESLintConfig()) {
      suggestions.push('Add ESLint configuration file for consistent code style enforcement');
    }

    return suggestions;
  }

  private getRuleSuggestion(rule: string, count: number): string {
    const ruleSuggestions: Record<string, string> = {
      'no-unused-vars': `Remove ${count} unused variables to clean up the codebase`,
      'prefer-const': `Use const instead of let for ${count} variables that are never reassigned`,
      'no-var': `Replace var declarations with let/const in ${count} locations`,
      'eqeqeq': `Use strict equality (===) instead of loose equality (==) in ${count} places`,
      'no-console': `Remove or replace ${count} console statements before production`,
      '@typescript-eslint/no-explicit-any': `Add proper type annotations to replace ${count} 'any' types`,
      'react-hooks/exhaustive-deps': `Fix ${count} useEffect dependency arrays to prevent bugs`,
      'indent': `Fix indentation in ${count} locations for better readability`,
      'quotes': `Standardize quote usage in ${count} locations`,
      'semi': `Add or remove semicolons in ${count} locations for consistency`
    };

    return ruleSuggestions[rule] || `Address ${count} violations of rule '${rule}'`;
  }

  private calculateScore(issues: QualityIssue[], metrics: Record<string, number>): number {
    const errorCount = issues.filter(issue => issue.severity === 'error').length;
    const warningCount = issues.filter(issue => issue.severity === 'warning').length;
    
    // Base score starts at 100
    let score = 100;
    
    // Deduct points for errors and warnings
    score -= errorCount * 5; // 5 points per error
    score -= warningCount * 1; // 1 point per warning
    
    // Bonus for low issue density
    const issuesDensity = metrics.issuesDensity || 0;
    if (issuesDensity < 1) {
      score += 5; // Bonus for low issue density
    }
    
    // Bonus for high fixable rate
    const fixableRate = metrics.fixableRate || 0;
    if (fixableRate > 0.8) {
      score += 3; // Bonus for high fixable rate
    }
    
    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, score));
  }

  private countUniqueRules(results: ESLint.LintResult[]): number {
    const rules = new Set<string>();
    
    results.forEach(result => {
      result.messages.forEach(message => {
        if (message.ruleId) {
          rules.add(message.ruleId);
        }
      });
    });
    
    return rules.size;
  }

  private countFixableIssues(results: ESLint.LintResult[]): number {
    return results.reduce((sum, result) => 
      sum + result.fixableErrorCount + result.fixableWarningCount, 0
    );
  }

  private getRuleBreakdown(results: ESLint.LintResult[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    
    results.forEach(result => {
      result.messages.forEach(message => {
        if (message.ruleId) {
          breakdown[message.ruleId] = (breakdown[message.ruleId] || 0) + 1;
        }
      });
    });
    
    return breakdown;
  }

  private createEmptyResult(): ESLintAnalysisResult {
    return {
      score: 0,
      issues: [],
      suggestions: ['No files found for ESLint analysis'],
      metrics: {},
      rulesViolated: 0,
      fixableIssues: 0,
      filesAnalyzed: 0,
      analysisTime: 0,
      ruleBreakdown: {}
    };
  }
}