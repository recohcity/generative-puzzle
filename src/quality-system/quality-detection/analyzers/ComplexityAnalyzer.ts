/**
 * Complexity Analyzer
 * 
 * Analyzes code complexity metrics including cyclomatic complexity,
 * cognitive complexity, and maintainability index.
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { ILogger } from '../../interfaces';
import { QualityCheckResult, QualityIssue } from '../../types';
import { QualityDetectionConfig } from '../QualityDetectionEngine';

export interface ComplexityMetrics {
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  maintainabilityIndex: number;
  linesOfCode: number;
  halsteadVolume: number;
  halsteadDifficulty: number;
  halsteadEffort: number;
}

export interface FileComplexity {
  filePath: string;
  metrics: ComplexityMetrics;
  functions: FunctionComplexity[];
  classes: ClassComplexity[];
}

export interface FunctionComplexity {
  name: string;
  line: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  linesOfCode: number;
  parameters: number;
}

export interface ClassComplexity {
  name: string;
  line: number;
  methods: number;
  properties: number;
  cyclomaticComplexity: number;
  linesOfCode: number;
}

export interface ComplexityAnalysisResult extends QualityCheckResult {
  averageCyclomaticComplexity: number;
  averageCognitiveComplexity: number;
  averageMaintainabilityIndex: number;
  filesAnalyzed: number;
  functionsAnalyzed: number;
  classesAnalyzed: number;
  analysisTime: number;
  fileComplexities: FileComplexity[];
}

export class ComplexityAnalyzer {
  private logger: ILogger;
  private program: ts.Program | null = null;
  private typeChecker: ts.TypeChecker | null = null;

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  /**
   * Initialize the complexity analyzer
   */
  async initialize(): Promise<void> {
    this.logger.debug('Initializing Complexity analyzer');
    // Initialization logic if needed
  }

  /**
   * Analyze code complexity
   */
  async analyze(config: QualityDetectionConfig): Promise<ComplexityAnalysisResult> {
    this.logger.info('Starting complexity analysis', {
      projectRoot: config.projectRoot,
      includePatterns: config.includePatterns
    });

    const startTime = Date.now();

    try {
      // Find TypeScript files to analyze
      const filesToAnalyze = await this.findTypeScriptFiles(config);
      
      if (filesToAnalyze.length === 0) {
        this.logger.warn('No TypeScript files found for complexity analysis');
        return this.createEmptyResult();
      }

      // Create TypeScript program for AST analysis
      this.program = ts.createProgram(filesToAnalyze, {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.CommonJS,
        allowJs: true,
        skipLibCheck: true
      });

      this.typeChecker = this.program.getTypeChecker();

      // Analyze each file
      const fileComplexities: FileComplexity[] = [];
      const allIssues: QualityIssue[] = [];

      for (const filePath of filesToAnalyze) {
        const sourceFile = this.program.getSourceFile(filePath);
        if (sourceFile) {
          const fileComplexity = this.analyzeFile(sourceFile);
          fileComplexities.push(fileComplexity);
          
          // Generate issues based on complexity thresholds
          const fileIssues = this.generateComplexityIssues(fileComplexity, config.thresholds);
          allIssues.push(...fileIssues);
        }
      }

      // Calculate aggregate metrics
      const aggregateMetrics = this.calculateAggregateMetrics(fileComplexities);

      // Generate suggestions
      const suggestions = this.generateSuggestions(fileComplexities, aggregateMetrics);

      // Calculate score
      const score = this.calculateScore(allIssues, aggregateMetrics);

      const analysisTime = Date.now() - startTime;

      const result: ComplexityAnalysisResult = {
        score,
        issues: allIssues,
        suggestions,
        metrics: {
          averageCyclomaticComplexity: aggregateMetrics.averageCyclomaticComplexity,
          averageCognitiveComplexity: aggregateMetrics.averageCognitiveComplexity,
          averageMaintainabilityIndex: aggregateMetrics.averageMaintainabilityIndex,
          filesAnalyzed: fileComplexities.length,
          functionsAnalyzed: aggregateMetrics.totalFunctions,
          classesAnalyzed: aggregateMetrics.totalClasses,
          analysisTime,
          totalLinesOfCode: aggregateMetrics.totalLinesOfCode,
          ...aggregateMetrics
        },
        averageCyclomaticComplexity: aggregateMetrics.averageCyclomaticComplexity,
        averageCognitiveComplexity: aggregateMetrics.averageCognitiveComplexity,
        averageMaintainabilityIndex: aggregateMetrics.averageMaintainabilityIndex,
        filesAnalyzed: fileComplexities.length,
        functionsAnalyzed: aggregateMetrics.totalFunctions,
        classesAnalyzed: aggregateMetrics.totalClasses,
        analysisTime,
        fileComplexities
      };

      this.logger.info('Complexity analysis completed', {
        score: result.score,
        issues: result.issues.length,
        averageCyclomaticComplexity: result.averageCyclomaticComplexity,
        filesAnalyzed: result.filesAnalyzed,
        analysisTime
      });

      return result;

    } catch (error) {
      this.logger.error('Complexity analysis failed', error as Error);
      throw error;
    }
  }

  // Private methods

  private async findTypeScriptFiles(config: QualityDetectionConfig): Promise<string[]> {
    const files: string[] = [];
    
    // Simple file discovery
    const searchDirs = ['src', 'lib', 'app'];
    
    for (const dir of searchDirs) {
      if (fs.existsSync(dir)) {
        const dirFiles = this.findFilesRecursively(dir, ['.ts', '.tsx', '.js', '.jsx']);
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
    // Simple pattern matching
    if (pattern.includes('**')) {
      const regex = pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
      return new RegExp(regex).test(filePath);
    }
    
    return filePath.includes(pattern.replace(/\*/g, ''));
  }

  private analyzeFile(sourceFile: ts.SourceFile): FileComplexity {
    const filePath = sourceFile.fileName;
    const functions: FunctionComplexity[] = [];
    const classes: ClassComplexity[] = [];

    // Visit all nodes in the file
    const visit = (node: ts.Node) => {
      if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || ts.isArrowFunction(node)) {
        const functionComplexity = this.analyzeFunctionComplexity(node, sourceFile);
        functions.push(functionComplexity);
      } else if (ts.isClassDeclaration(node)) {
        const classComplexity = this.analyzeClassComplexity(node, sourceFile);
        classes.push(classComplexity);
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    // Calculate file-level metrics
    const fileMetrics = this.calculateFileMetrics(sourceFile, functions, classes);

    return {
      filePath: path.relative(process.cwd(), filePath),
      metrics: fileMetrics,
      functions,
      classes
    };
  }

  private analyzeFunctionComplexity(node: ts.Node, sourceFile: ts.SourceFile): FunctionComplexity {
    const name = this.getFunctionName(node);
    const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
    
    const cyclomaticComplexity = this.calculateCyclomaticComplexity(node);
    const cognitiveComplexity = this.calculateCognitiveComplexity(node);
    const linesOfCode = this.calculateLinesOfCode(node, sourceFile);
    const parameters = this.getParameterCount(node);

    return {
      name,
      line,
      cyclomaticComplexity,
      cognitiveComplexity,
      linesOfCode,
      parameters
    };
  }

  private analyzeClassComplexity(node: ts.ClassDeclaration, sourceFile: ts.SourceFile): ClassComplexity {
    const name = node.name?.text || 'anonymous';
    const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
    
    let methods = 0;
    let properties = 0;
    let totalCyclomaticComplexity = 0;

    // Count methods and properties
    node.members.forEach(member => {
      if (ts.isMethodDeclaration(member) || ts.isGetAccessorDeclaration(member) || ts.isSetAccessorDeclaration(member)) {
        methods++;
        totalCyclomaticComplexity += this.calculateCyclomaticComplexity(member);
      } else if (ts.isPropertyDeclaration(member)) {
        properties++;
      }
    });

    const linesOfCode = this.calculateLinesOfCode(node, sourceFile);

    return {
      name,
      line,
      methods,
      properties,
      cyclomaticComplexity: totalCyclomaticComplexity,
      linesOfCode
    };
  }

  private calculateCyclomaticComplexity(node: ts.Node): number {
    let complexity = 1; // Base complexity

    const visit = (node: ts.Node) => {
      // Decision points that increase complexity
      if (ts.isIfStatement(node) ||
          ts.isWhileStatement(node) ||
          ts.isDoStatement(node) ||
          ts.isForStatement(node) ||
          ts.isForInStatement(node) ||
          ts.isForOfStatement(node) ||
          ts.isSwitchStatement(node) ||
          ts.isConditionalExpression(node) ||
          ts.isCatchClause(node)) {
        complexity++;
      } else if (ts.isCaseClause(node)) {
        complexity++;
      } else if (ts.isBinaryExpression(node)) {
        // Logical operators (&&, ||) increase complexity
        if (node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
            node.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
          complexity++;
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(node);
    return complexity;
  }

  private calculateCognitiveComplexity(node: ts.Node): number {
    let complexity = 0;
    let nestingLevel = 0;

    const visit = (node: ts.Node, currentNesting: number) => {
      let increment = 0;
      let newNesting = currentNesting;

      // Cognitive complexity rules
      if (ts.isIfStatement(node)) {
        increment = 1 + currentNesting;
        newNesting = currentNesting + 1;
      } else if (ts.isWhileStatement(node) || ts.isDoStatement(node) || 
                 ts.isForStatement(node) || ts.isForInStatement(node) || ts.isForOfStatement(node)) {
        increment = 1 + currentNesting;
        newNesting = currentNesting + 1;
      } else if (ts.isSwitchStatement(node)) {
        increment = 1 + currentNesting;
        newNesting = currentNesting + 1;
      } else if (ts.isCatchClause(node)) {
        increment = 1 + currentNesting;
        newNesting = currentNesting + 1;
      } else if (ts.isBinaryExpression(node)) {
        if (node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
            node.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
          increment = 1;
        }
      } else if (ts.isConditionalExpression(node)) {
        increment = 1 + currentNesting;
      }

      complexity += increment;

      ts.forEachChild(node, (child) => visit(child, newNesting));
    };

    visit(node, 0);
    return complexity;
  }

  private calculateLinesOfCode(node: ts.Node, sourceFile: ts.SourceFile): number {
    const start = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line;
    const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line;
    return end - start + 1;
  }

  private getFunctionName(node: ts.Node): string {
    if (ts.isFunctionDeclaration(node) && node.name) {
      return node.name.text;
    } else if (ts.isMethodDeclaration(node) && node.name) {
      return ts.isIdentifier(node.name) ? node.name.text : 'method';
    } else if (ts.isArrowFunction(node)) {
      return 'arrow function';
    }
    return 'anonymous';
  }

  private getParameterCount(node: ts.Node): number {
    if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || ts.isArrowFunction(node)) {
      return node.parameters.length;
    }
    return 0;
  }

  private calculateFileMetrics(sourceFile: ts.SourceFile, functions: FunctionComplexity[], classes: ClassComplexity[]): ComplexityMetrics {
    const linesOfCode = sourceFile.getLineStarts().length;
    
    const totalCyclomaticComplexity = functions.reduce((sum, fn) => sum + fn.cyclomaticComplexity, 0) +
                                     classes.reduce((sum, cls) => sum + cls.cyclomaticComplexity, 0);
    
    const totalCognitiveComplexity = functions.reduce((sum, fn) => sum + fn.cognitiveComplexity, 0);
    
    const averageCyclomaticComplexity = (functions.length + classes.length) > 0 ? 
      totalCyclomaticComplexity / (functions.length + classes.length) : 0;

    // Simplified maintainability index calculation
    const maintainabilityIndex = Math.max(0, 
      171 - 5.2 * Math.log(averageCyclomaticComplexity || 1) - 0.23 * averageCyclomaticComplexity - 16.2 * Math.log(linesOfCode || 1)
    );

    // Simplified Halstead metrics
    const halsteadVolume = linesOfCode * 4.8; // Rough approximation
    const halsteadDifficulty = averageCyclomaticComplexity * 0.5;
    const halsteadEffort = halsteadVolume * halsteadDifficulty;

    return {
      cyclomaticComplexity: totalCyclomaticComplexity,
      cognitiveComplexity: totalCognitiveComplexity,
      maintainabilityIndex,
      linesOfCode,
      halsteadVolume,
      halsteadDifficulty,
      halsteadEffort
    };
  }

  private calculateAggregateMetrics(fileComplexities: FileComplexity[]): any {
    const totalFiles = fileComplexities.length;
    const totalFunctions = fileComplexities.reduce((sum, file) => sum + file.functions.length, 0);
    const totalClasses = fileComplexities.reduce((sum, file) => sum + file.classes.length, 0);
    const totalLinesOfCode = fileComplexities.reduce((sum, file) => sum + file.metrics.linesOfCode, 0);

    const totalCyclomaticComplexity = fileComplexities.reduce((sum, file) => sum + file.metrics.cyclomaticComplexity, 0);
    const totalCognitiveComplexity = fileComplexities.reduce((sum, file) => sum + file.metrics.cognitiveComplexity, 0);
    const totalMaintainabilityIndex = fileComplexities.reduce((sum, file) => sum + file.metrics.maintainabilityIndex, 0);

    return {
      averageCyclomaticComplexity: totalFiles > 0 ? totalCyclomaticComplexity / totalFiles : 0,
      averageCognitiveComplexity: totalFiles > 0 ? totalCognitiveComplexity / totalFiles : 0,
      averageMaintainabilityIndex: totalFiles > 0 ? totalMaintainabilityIndex / totalFiles : 0,
      totalFunctions,
      totalClasses,
      totalLinesOfCode,
      totalCyclomaticComplexity,
      totalCognitiveComplexity
    };
  }

  private generateComplexityIssues(fileComplexity: FileComplexity, thresholds: any): QualityIssue[] {
    const issues: QualityIssue[] = [];
    const complexityThresholds = thresholds.complexity || {
      cyclomaticComplexity: 10,
      cognitiveComplexity: 15,
      maintainabilityIndex: 60
    };

    // Check function complexity
    fileComplexity.functions.forEach(fn => {
      if (fn.cyclomaticComplexity > complexityThresholds.cyclomaticComplexity) {
        issues.push({
          severity: fn.cyclomaticComplexity > complexityThresholds.cyclomaticComplexity * 1.5 ? 'error' : 'warning',
          file: fileComplexity.filePath,
          line: fn.line,
          message: `Function '${fn.name}' has high cyclomatic complexity (${fn.cyclomaticComplexity})`,
          rule: 'complexity-cyclomatic',
          fixable: false
        });
      }

      if (fn.cognitiveComplexity > complexityThresholds.cognitiveComplexity) {
        issues.push({
          severity: fn.cognitiveComplexity > complexityThresholds.cognitiveComplexity * 1.5 ? 'error' : 'warning',
          file: fileComplexity.filePath,
          line: fn.line,
          message: `Function '${fn.name}' has high cognitive complexity (${fn.cognitiveComplexity})`,
          rule: 'complexity-cognitive',
          fixable: false
        });
      }
    });

    // Check file maintainability
    if (fileComplexity.metrics.maintainabilityIndex < complexityThresholds.maintainabilityIndex) {
      issues.push({
        severity: fileComplexity.metrics.maintainabilityIndex < complexityThresholds.maintainabilityIndex * 0.7 ? 'error' : 'warning',
        file: fileComplexity.filePath,
        line: 1,
        message: `File has low maintainability index (${fileComplexity.metrics.maintainabilityIndex.toFixed(1)})`,
        rule: 'complexity-maintainability',
        fixable: false
      });
    }

    return issues;
  }

  private generateSuggestions(fileComplexities: FileComplexity[], aggregateMetrics: any): string[] {
    const suggestions: string[] = [];

    if (aggregateMetrics.averageCyclomaticComplexity > 10) {
      suggestions.push(`Average cyclomatic complexity is ${aggregateMetrics.averageCyclomaticComplexity.toFixed(1)} - consider breaking down complex functions`);
    }

    if (aggregateMetrics.averageCognitiveComplexity > 15) {
      suggestions.push(`Average cognitive complexity is ${aggregateMetrics.averageCognitiveComplexity.toFixed(1)} - simplify conditional logic`);
    }

    if (aggregateMetrics.averageMaintainabilityIndex < 60) {
      suggestions.push(`Average maintainability index is ${aggregateMetrics.averageMaintainabilityIndex.toFixed(1)} - refactor complex code`);
    }

    // Find most complex functions
    const allFunctions = fileComplexities.flatMap(file => 
      file.functions.map(fn => ({ ...fn, file: file.filePath }))
    );
    
    const mostComplexFunctions = allFunctions
      .sort((a, b) => b.cyclomaticComplexity - a.cyclomaticComplexity)
      .slice(0, 3);

    if (mostComplexFunctions.length > 0 && mostComplexFunctions[0].cyclomaticComplexity > 15) {
      suggestions.push(`Most complex function: '${mostComplexFunctions[0].name}' (complexity: ${mostComplexFunctions[0].cyclomaticComplexity})`);
    }

    // General suggestions
    suggestions.push('Use early returns to reduce nesting levels');
    suggestions.push('Extract complex conditions into well-named functions');
    suggestions.push('Consider using polymorphism instead of complex switch statements');

    return suggestions;
  }

  private calculateScore(issues: QualityIssue[], aggregateMetrics: any): number {
    const errorCount = issues.filter(issue => issue.severity === 'error').length;
    const warningCount = issues.filter(issue => issue.severity === 'warning').length;
    
    // Base score starts at 100
    let score = 100;
    
    // Deduct points for complexity issues
    score -= errorCount * 15; // 15 points per error
    score -= warningCount * 5; // 5 points per warning
    
    // Adjust based on average complexity
    if (aggregateMetrics.averageCyclomaticComplexity > 10) {
      score -= (aggregateMetrics.averageCyclomaticComplexity - 10) * 2;
    }
    
    if (aggregateMetrics.averageMaintainabilityIndex < 60) {
      score -= (60 - aggregateMetrics.averageMaintainabilityIndex) * 0.5;
    }
    
    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, score));
  }

  private createEmptyResult(): ComplexityAnalysisResult {
    return {
      score: 0,
      issues: [],
      suggestions: ['No files found for complexity analysis'],
      metrics: {},
      averageCyclomaticComplexity: 0,
      averageCognitiveComplexity: 0,
      averageMaintainabilityIndex: 0,
      filesAnalyzed: 0,
      functionsAnalyzed: 0,
      classesAnalyzed: 0,
      analysisTime: 0,
      fileComplexities: []
    };
  }
}