/**
 * TypeScript Analyzer
 * 
 * Integrates with TypeScript compiler API to perform type checking
 * and detect TypeScript-specific issues.
 */

import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';
import { ILogger } from '../../interfaces';
import { QualityCheckResult, QualityIssue } from '../../types';
import { QualityDetectionConfig } from '../QualityDetectionEngine';

export interface TypeScriptAnalysisResult extends QualityCheckResult {
  typeErrors: number;
  semanticErrors: number;
  syntaxErrors: number;
  filesAnalyzed: number;
  compilationTime: number;
}

export class TypeScriptAnalyzer {
  private logger: ILogger;
  private program: ts.Program | null = null;
  private compilerOptions: ts.CompilerOptions = {};

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  /**
   * Initialize the TypeScript analyzer
   */
  async initialize(): Promise<void> {
    this.logger.debug('Initializing TypeScript analyzer');

    try {
      // Load TypeScript configuration
      const configPath = this.findTsConfig();
      if (configPath) {
        const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
        if (configFile.error) {
          this.logger.warn('Error reading TypeScript config', { error: configFile.error });
        } else {
          const parsedConfig = ts.parseJsonConfigFileContent(
            configFile.config,
            ts.sys,
            path.dirname(configPath)
          );
          this.compilerOptions = parsedConfig.options;
        }
      } else {
        // Use default compiler options
        this.compilerOptions = this.getDefaultCompilerOptions();
      }

      this.logger.debug('TypeScript analyzer initialized', {
        configPath,
        strict: this.compilerOptions.strict,
        target: this.compilerOptions.target
      });

    } catch (error) {
      this.logger.error('Failed to initialize TypeScript analyzer', error as Error);
      throw error;
    }
  }

  /**
   * Analyze TypeScript code quality
   */
  async analyze(config: QualityDetectionConfig): Promise<TypeScriptAnalysisResult> {
    this.logger.info('Starting TypeScript analysis', {
      projectRoot: config.projectRoot,
      includePatterns: config.includePatterns
    });

    const startTime = Date.now();

    try {
      // Find TypeScript files to analyze
      const filesToAnalyze = await this.findTypeScriptFiles(config);
      
      if (filesToAnalyze.length === 0) {
        this.logger.warn('No TypeScript files found for analysis');
        return this.createEmptyResult();
      }

      // Create TypeScript program
      this.program = ts.createProgram(filesToAnalyze, this.compilerOptions);

      // Get diagnostics
      const diagnostics = this.getAllDiagnostics();

      // Convert diagnostics to quality issues
      const issues = this.convertDiagnosticsToIssues(diagnostics);

      // Calculate metrics
      const metrics = this.calculateMetrics(diagnostics, filesToAnalyze);

      // Generate suggestions
      const suggestions = this.generateSuggestions(diagnostics, issues);

      // Calculate score
      const score = this.calculateScore(issues, metrics);

      const compilationTime = Date.now() - startTime;

      const result: TypeScriptAnalysisResult = {
        score,
        issues,
        suggestions,
        metrics: {
          typeErrors: diagnostics.semantic.length,
          semanticErrors: diagnostics.semantic.length,
          syntaxErrors: diagnostics.syntactic.length,
          filesAnalyzed: filesToAnalyze.length,
          compilationTime,
          ...metrics
        },
        typeErrors: diagnostics.semantic.length,
        semanticErrors: diagnostics.semantic.length,
        syntaxErrors: diagnostics.syntactic.length,
        filesAnalyzed: filesToAnalyze.length,
        compilationTime
      };

      this.logger.info('TypeScript analysis completed', {
        score: result.score,
        issues: result.issues.length,
        typeErrors: result.typeErrors,
        filesAnalyzed: result.filesAnalyzed,
        compilationTime
      });

      return result;

    } catch (error) {
      this.logger.error('TypeScript analysis failed', error as Error);
      throw error;
    }
  }

  // Private methods

  private findTsConfig(): string | null {
    const possiblePaths = [
      'tsconfig.json',
      'src/tsconfig.json',
      'tsconfig.build.json'
    ];

    for (const configPath of possiblePaths) {
      if (fs.existsSync(configPath)) {
        return path.resolve(configPath);
      }
    }

    return null;
  }

  private getDefaultCompilerOptions(): ts.CompilerOptions {
    return {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      lib: ['ES2020', 'DOM'],
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      declaration: true,
      declarationMap: true,
      sourceMap: true,
      outDir: './dist',
      rootDir: './src'
    };
  }

  private async findTypeScriptFiles(config: QualityDetectionConfig): Promise<string[]> {
    const files: string[] = [];
    
    // Simple file discovery - in a real implementation, you'd use glob patterns
    const searchDirs = ['src', 'lib', 'app'];
    
    for (const dir of searchDirs) {
      if (fs.existsSync(dir)) {
        const dirFiles = this.findFilesRecursively(dir, ['.ts', '.tsx']);
        files.push(...dirFiles);
      }
    }

    // Filter based on include/exclude patterns
    return files.filter(file => {
      const relativePath = path.relative(config.projectRoot, file);
      
      // Check exclude patterns
      const isExcluded = config.excludePatterns.some(pattern => 
        this.matchesPattern(relativePath, pattern)
      );
      
      if (isExcluded) return false;

      // Check include patterns
      return config.includePatterns.some(pattern => 
        this.matchesPattern(relativePath, pattern)
      );
    });
  }

  private findFilesRecursively(dir: string, extensions: string[]): string[] {
    const files: string[] = [];
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          files.push(...this.findFilesRecursively(fullPath, extensions));
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to read directory ${dir}`, error as Error);
    }
    
    return files;
  }

  private matchesPattern(filePath: string, pattern: string): boolean {
    // Simple pattern matching - in a real implementation, use minimatch or similar
    if (pattern.includes('**')) {
      const regex = pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
      return new RegExp(regex).test(filePath);
    }
    
    return filePath.includes(pattern.replace(/\*/g, ''));
  }

  private getAllDiagnostics(): {
    syntactic: ts.Diagnostic[];
    semantic: ts.Diagnostic[];
    global: ts.Diagnostic[];
  } {
    if (!this.program) {
      return { syntactic: [], semantic: [], global: [] };
    }

    const syntactic = this.program.getSyntacticDiagnostics();
    const semantic = this.program.getSemanticDiagnostics();
    const global = this.program.getGlobalDiagnostics();

    return { syntactic, semantic, global };
  }

  private convertDiagnosticsToIssues(diagnostics: {
    syntactic: ts.Diagnostic[];
    semantic: ts.Diagnostic[];
    global: ts.Diagnostic[];
  }): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Convert syntactic diagnostics
    diagnostics.syntactic.forEach(diagnostic => {
      issues.push(this.convertDiagnosticToIssue(diagnostic, 'syntax'));
    });

    // Convert semantic diagnostics
    diagnostics.semantic.forEach(diagnostic => {
      issues.push(this.convertDiagnosticToIssue(diagnostic, 'type'));
    });

    // Convert global diagnostics
    diagnostics.global.forEach(diagnostic => {
      issues.push(this.convertDiagnosticToIssue(diagnostic, 'config'));
    });

    return issues;
  }

  private convertDiagnosticToIssue(diagnostic: ts.Diagnostic, category: string): QualityIssue {
    const severity = this.getDiagnosticSeverity(diagnostic);
    const file = diagnostic.file?.fileName || 'unknown';
    const line = diagnostic.file && diagnostic.start !== undefined
      ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start).line + 1
      : undefined;
    const column = diagnostic.file && diagnostic.start !== undefined
      ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start).character + 1
      : undefined;

    return {
      severity,
      file: path.relative(process.cwd(), file),
      line,
      column,
      message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
      rule: `typescript-${category}-${diagnostic.code}`,
      fixable: false // TypeScript diagnostics are generally not auto-fixable
    };
  }

  private getDiagnosticSeverity(diagnostic: ts.Diagnostic): 'error' | 'warning' | 'info' {
    switch (diagnostic.category) {
      case ts.DiagnosticCategory.Error:
        return 'error';
      case ts.DiagnosticCategory.Warning:
        return 'warning';
      case ts.DiagnosticCategory.Suggestion:
      case ts.DiagnosticCategory.Message:
        return 'info';
      default:
        return 'error';
    }
  }

  private calculateMetrics(diagnostics: {
    syntactic: ts.Diagnostic[];
    semantic: ts.Diagnostic[];
    global: ts.Diagnostic[];
  }, files: string[]): Record<string, number> {
    const totalDiagnostics = 
      diagnostics.syntactic.length + 
      diagnostics.semantic.length + 
      diagnostics.global.length;

    return {
      totalTypeScriptIssues: totalDiagnostics,
      typeErrorDensity: files.length > 0 ? totalDiagnostics / files.length : 0,
      syntaxErrorRate: diagnostics.syntactic.length / Math.max(totalDiagnostics, 1),
      semanticErrorRate: diagnostics.semantic.length / Math.max(totalDiagnostics, 1),
      typeScriptCompliance: Math.max(0, 100 - (totalDiagnostics * 2)) // Rough calculation
    };
  }

  private generateSuggestions(diagnostics: {
    syntactic: ts.Diagnostic[];
    semantic: ts.Diagnostic[];
    global: ts.Diagnostic[];
  }, issues: QualityIssue[]): string[] {
    const suggestions: string[] = [];

    if (diagnostics.syntactic.length > 0) {
      suggestions.push(`Fix ${diagnostics.syntactic.length} syntax errors to enable proper compilation`);
    }

    if (diagnostics.semantic.length > 0) {
      suggestions.push(`Resolve ${diagnostics.semantic.length} type errors to improve type safety`);
      
      // Check for common type issues
      const commonIssues = this.analyzeCommonTypeIssues(diagnostics.semantic);
      suggestions.push(...commonIssues);
    }

    if (diagnostics.global.length > 0) {
      suggestions.push('Review TypeScript configuration for potential improvements');
    }

    // Check if strict mode is disabled
    if (!this.compilerOptions.strict) {
      suggestions.push('Enable strict mode in TypeScript configuration for better type checking');
    }

    // Check for missing type declarations
    const missingDeclarations = issues.filter(issue => 
      issue.message.includes('Could not find a declaration file')
    );
    if (missingDeclarations.length > 0) {
      suggestions.push('Install type declarations for external libraries or create custom declarations');
    }

    return suggestions;
  }

  private analyzeCommonTypeIssues(semanticDiagnostics: ts.Diagnostic[]): string[] {
    const suggestions: string[] = [];
    const issueCounts = new Map<number, number>();

    // Count diagnostic codes
    semanticDiagnostics.forEach(diagnostic => {
      const count = issueCounts.get(diagnostic.code) || 0;
      issueCounts.set(diagnostic.code, count + 1);
    });

    // Generate suggestions based on common issues
    issueCounts.forEach((count, code) => {
      switch (code) {
        case 2304: // Cannot find name
          if (count > 5) {
            suggestions.push('Multiple "Cannot find name" errors suggest missing imports or type declarations');
          }
          break;
        case 2339: // Property does not exist
          if (count > 3) {
            suggestions.push('Consider using proper interfaces or type assertions for object properties');
          }
          break;
        case 2322: // Type is not assignable
          if (count > 5) {
            suggestions.push('Review type assignments and consider using union types or type guards');
          }
          break;
        case 7053: // Element implicitly has 'any' type
          suggestions.push('Add explicit type annotations to eliminate implicit any types');
          break;
      }
    });

    return suggestions;
  }

  private calculateScore(issues: QualityIssue[], metrics: Record<string, number>): number {
    const errorCount = issues.filter(issue => issue.severity === 'error').length;
    const warningCount = issues.filter(issue => issue.severity === 'warning').length;
    
    // Base score starts at 100
    let score = 100;
    
    // Deduct points for errors and warnings
    score -= errorCount * 10; // 10 points per error
    score -= warningCount * 2; // 2 points per warning
    
    // Bonus for strict mode
    if (this.compilerOptions.strict) {
      score += 5;
    }
    
    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, score));
  }

  private createEmptyResult(): TypeScriptAnalysisResult {
    return {
      score: 0,
      issues: [],
      suggestions: ['No TypeScript files found for analysis'],
      metrics: {},
      typeErrors: 0,
      semanticErrors: 0,
      syntaxErrors: 0,
      filesAnalyzed: 0,
      compilationTime: 0
    };
  }
}