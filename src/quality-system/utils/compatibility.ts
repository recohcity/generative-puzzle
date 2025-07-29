// Project compatibility utilities

import * as fs from 'fs';
import * as path from 'path';

export interface CompatibilityCheck {
  name: string;
  required: boolean;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

export class CompatibilityChecker {
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  async runAllChecks(): Promise<CompatibilityCheck[]> {
    const checks: CompatibilityCheck[] = [];

    checks.push(await this.checkTypeScriptConfig());
    checks.push(await this.checkPackageJson());
    checks.push(await this.checkJestConfig());
    checks.push(await this.checkESLintConfig());
    checks.push(await this.checkNextJsConfig());
    checks.push(await this.checkNodeVersion());

    return checks;
  }

  private async checkTypeScriptConfig(): Promise<CompatibilityCheck> {
    const tsconfigPath = path.join(this.projectRoot, 'tsconfig.json');
    
    if (!fs.existsSync(tsconfigPath)) {
      return {
        name: 'TypeScript Configuration',
        required: true,
        status: 'fail',
        message: 'tsconfig.json not found'
      };
    }

    try {
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
      
      // Check for required compiler options
      const compilerOptions = tsconfig.compilerOptions || {};
      const hasStrictMode = compilerOptions.strict === true;
      const hasPathMapping = compilerOptions.paths && compilerOptions.paths['@/*'];

      if (!hasStrictMode) {
        return {
          name: 'TypeScript Configuration',
          required: false,
          status: 'warning',
          message: 'Strict mode is not enabled. Consider enabling for better type safety.'
        };
      }

      if (!hasPathMapping) {
        return {
          name: 'TypeScript Configuration',
          required: false,
          status: 'warning',
          message: 'Path mapping for @/* not configured. Quality system uses @/ imports.'
        };
      }

      return {
        name: 'TypeScript Configuration',
        required: true,
        status: 'pass',
        message: 'TypeScript configuration is compatible'
      };
    } catch (error) {
      return {
        name: 'TypeScript Configuration',
        required: true,
        status: 'fail',
        message: `Invalid tsconfig.json: ${(error as Error).message}`
      };
    }
  }

  private async checkPackageJson(): Promise<CompatibilityCheck> {
    const packagePath = path.join(this.projectRoot, 'package.json');
    
    if (!fs.existsSync(packagePath)) {
      return {
        name: 'Package Configuration',
        required: true,
        status: 'fail',
        message: 'package.json not found'
      };
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      // Check for required dependencies
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      const requiredDeps = ['typescript', 'jest', '@types/node'];
      const missingDeps = requiredDeps.filter(dep => !dependencies[dep]);

      if (missingDeps.length > 0) {
        return {
          name: 'Package Configuration',
          required: true,
          status: 'fail',
          message: `Missing required dependencies: ${missingDeps.join(', ')}`
        };
      }

      return {
        name: 'Package Configuration',
        required: true,
        status: 'pass',
        message: 'All required dependencies are present'
      };
    } catch (error) {
      return {
        name: 'Package Configuration',
        required: true,
        status: 'fail',
        message: `Invalid package.json: ${(error as Error).message}`
      };
    }
  }

  private async checkJestConfig(): Promise<CompatibilityCheck> {
    const jestConfigPath = path.join(this.projectRoot, 'jest.config.js');
    
    if (!fs.existsSync(jestConfigPath)) {
      return {
        name: 'Jest Configuration',
        required: false,
        status: 'warning',
        message: 'jest.config.js not found. Quality system tests may not run properly.'
      };
    }

    return {
      name: 'Jest Configuration',
      required: false,
      status: 'pass',
      message: 'Jest configuration found'
    };
  }

  private async checkESLintConfig(): Promise<CompatibilityCheck> {
    const eslintConfigs = ['.eslintrc.js', '.eslintrc.json', '.eslintrc.yml'];
    const hasESLintConfig = eslintConfigs.some(config => 
      fs.existsSync(path.join(this.projectRoot, config))
    );

    if (!hasESLintConfig) {
      return {
        name: 'ESLint Configuration',
        required: false,
        status: 'warning',
        message: 'ESLint configuration not found. Code quality checks will be limited.'
      };
    }

    return {
      name: 'ESLint Configuration',
      required: false,
      status: 'pass',
      message: 'ESLint configuration found'
    };
  }

  private async checkNextJsConfig(): Promise<CompatibilityCheck> {
    const nextConfigPath = path.join(this.projectRoot, 'next.config.js');
    const packagePath = path.join(this.projectRoot, 'package.json');
    
    if (fs.existsSync(packagePath)) {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      const hasNext = packageJson.dependencies?.next || packageJson.devDependencies?.next;
      
      if (hasNext && !fs.existsSync(nextConfigPath)) {
        return {
          name: 'Next.js Configuration',
          required: false,
          status: 'warning',
          message: 'Next.js detected but next.config.js not found'
        };
      }
      
      if (hasNext) {
        return {
          name: 'Next.js Configuration',
          required: false,
          status: 'pass',
          message: 'Next.js project detected and configured'
        };
      }
    }

    return {
      name: 'Next.js Configuration',
      required: false,
      status: 'pass',
      message: 'Not a Next.js project'
    };
  }

  private async checkNodeVersion(): Promise<CompatibilityCheck> {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 16) {
      return {
        name: 'Node.js Version',
        required: true,
        status: 'fail',
        message: `Node.js ${nodeVersion} is not supported. Minimum version is 16.x`
      };
    }

    if (majorVersion < 18) {
      return {
        name: 'Node.js Version',
        required: false,
        status: 'warning',
        message: `Node.js ${nodeVersion} works but 18.x+ is recommended`
      };
    }

    return {
      name: 'Node.js Version',
      required: true,
      status: 'pass',
      message: `Node.js ${nodeVersion} is supported`
    };
  }

  generateReport(checks: CompatibilityCheck[]): string {
    const passed = checks.filter(c => c.status === 'pass').length;
    const warnings = checks.filter(c => c.status === 'warning').length;
    const failed = checks.filter(c => c.status === 'fail').length;

    let report = `\n🔍 Quality System Compatibility Report\n`;
    report += `${'='.repeat(50)}\n\n`;
    report += `📊 Summary: ${passed} passed, ${warnings} warnings, ${failed} failed\n\n`;

    for (const check of checks) {
      const icon = check.status === 'pass' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
      const required = check.required ? '[REQUIRED]' : '[OPTIONAL]';
      report += `${icon} ${check.name} ${required}\n`;
      report += `   ${check.message}\n\n`;
    }

    if (failed > 0) {
      report += `❌ ${failed} critical issues found. Please resolve before using the Quality System.\n`;
    } else if (warnings > 0) {
      report += `⚠️ ${warnings} warnings found. Quality System will work but some features may be limited.\n`;
    } else {
      report += `🎉 All compatibility checks passed! Quality System is ready to use.\n`;
    }

    return report;
  }
}