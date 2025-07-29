// Initialization script for Quality System

import * as fs from 'fs';
import * as path from 'path';
import { CompatibilityChecker } from '../utils/compatibility';
import { config } from '../config';

export class QualitySystemInitializer {
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  async initialize(): Promise<void> {
    console.log('🚀 Initializing Quality System...\n');

    // Step 1: Run compatibility checks
    await this.runCompatibilityChecks();

    // Step 2: Create necessary directories
    await this.createDirectories();

    // Step 3: Create configuration files
    await this.createConfigFiles();

    // Step 4: Update project files
    await this.updateProjectFiles();

    // Step 5: Verify installation
    await this.verifyInstallation();

    console.log('\n🎉 Quality System initialization completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Run `npm run quality:compatibility` to verify setup');
    console.log('2. Run `npm run quality:demo` to see the system in action');
    console.log('3. Run `npm run quality:test` to run the test suite');
  }

  private async runCompatibilityChecks(): Promise<void> {
    console.log('🔍 Running compatibility checks...');
    
    const checker = new CompatibilityChecker(this.projectRoot);
    const checks = await checker.runAllChecks();
    
    const criticalFailures = checks.filter(c => c.required && c.status === 'fail');
    if (criticalFailures.length > 0) {
      console.error('\n❌ Critical compatibility issues found:');
      for (const failure of criticalFailures) {
        console.error(`   - ${failure.name}: ${failure.message}`);
      }
      throw new Error('Please resolve compatibility issues before proceeding');
    }

    const warnings = checks.filter(c => c.status === 'warning');
    if (warnings.length > 0) {
      console.warn('\n⚠️ Compatibility warnings:');
      for (const warning of warnings) {
        console.warn(`   - ${warning.name}: ${warning.message}`);
      }
    }

    console.log('✅ Compatibility checks passed');
  }

  private async createDirectories(): Promise<void> {
    console.log('📁 Creating directories...');

    const directories = [
      'src/quality-system/data',
      'src/quality-system/logs',
      'src/quality-system/reports',
      'src/quality-system/temp'
    ];

    for (const dir of directories) {
      const fullPath = path.join(this.projectRoot, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`   Created: ${dir}`);
      }
    }

    console.log('✅ Directories created');
  }

  private async createConfigFiles(): Promise<void> {
    console.log('⚙️ Creating configuration files...');

    // Create .gitignore entries for quality system
    const gitignorePath = path.join(this.projectRoot, '.gitignore');
    const gitignoreEntries = [
      '# Quality System',
      'src/quality-system/data/',
      'src/quality-system/logs/',
      'src/quality-system/temp/',
      'quality-reports/'
    ];

    if (fs.existsSync(gitignorePath)) {
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      const hasQualitySystemEntries = gitignoreContent.includes('# Quality System');
      
      if (!hasQualitySystemEntries) {
        fs.appendFileSync(gitignorePath, '\n' + gitignoreEntries.join('\n') + '\n');
        console.log('   Updated .gitignore');
      }
    } else {
      fs.writeFileSync(gitignorePath, gitignoreEntries.join('\n') + '\n');
      console.log('   Created .gitignore');
    }

    // Create quality system config file
    const configPath = path.join(this.projectRoot, 'quality-system.config.js');
    if (!fs.existsSync(configPath)) {
      const configContent = `// Quality System Configuration
module.exports = {
  // Quality thresholds
  thresholds: {
    overall: ${config.qualityThresholds.overall},
    typescript: ${config.qualityThresholds.typescript},
    eslint: ${config.qualityThresholds.eslint},
    testCoverage: ${config.qualityThresholds.testCoverage},
    complexity: ${config.qualityThresholds.complexity},
    duplication: ${config.qualityThresholds.duplication}
  },

  // Enabled checks
  checks: {
    typescript: ${config.qualityChecks.enableTypeScriptCheck},
    eslint: ${config.qualityChecks.enableESLintCheck},
    testCoverage: ${config.qualityChecks.enableTestCoverageCheck},
    complexity: ${config.qualityChecks.enableComplexityCheck},
    duplication: ${config.qualityChecks.enableDuplicationCheck}
  },

  // Notification settings
  notifications: {
    enableUserNotifications: ${config.errorHandling.enableUserNotifications},
    enableTeamNotifications: ${config.errorHandling.enableTeamNotifications}
  },

  // Integration settings
  integrations: {
    eslint: {
      configPath: '${config.integrations.eslint.configPath}',
      enableAutoFix: ${config.integrations.eslint.enableAutoFix}
    },
    typescript: {
      configPath: '${config.integrations.typescript.configPath}',
      enableStrictMode: ${config.integrations.typescript.enableStrictMode}
    },
    jest: {
      configPath: '${config.integrations.jest.configPath}',
      coverageThreshold: ${config.integrations.jest.coverageThreshold}
    }
  }
};
`;

      fs.writeFileSync(configPath, configContent);
      console.log('   Created quality-system.config.js');
    }

    console.log('✅ Configuration files created');
  }

  private async updateProjectFiles(): Promise<void> {
    console.log('📝 Updating project files...');

    // Check if package.json already has quality scripts
    const packagePath = path.join(this.projectRoot, 'package.json');
    if (fs.existsSync(packagePath)) {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      const hasQualityScripts = packageJson.scripts && packageJson.scripts['quality:demo'];
      
      if (!hasQualityScripts) {
        console.log('   ⚠️ Quality scripts not found in package.json');
        console.log('   Please add the following scripts to your package.json:');
        console.log('   "quality:demo": "tsx src/quality-system/examples/basic-usage.ts"');
        console.log('   "quality:test": "npm run test:unit -- --testPathPatterns=quality-system"');
        console.log('   "quality:compatibility": "tsx src/quality-system/cli/compatibility-check.ts"');
      } else {
        console.log('   ✅ Quality scripts found in package.json');
      }
    }

    console.log('✅ Project files updated');
  }

  private async verifyInstallation(): Promise<void> {
    console.log('🔍 Verifying installation...');

    // Check if all core files exist
    const coreFiles = [
      'src/quality-system/index.ts',
      'src/quality-system/QualitySystem.ts',
      'src/quality-system/types/index.ts',
      'src/quality-system/interfaces/index.ts',
      'src/quality-system/services/TaskManagementService.ts',
      'src/quality-system/services/QualityDetectionEngine.ts'
    ];

    let allFilesExist = true;
    for (const file of coreFiles) {
      const fullPath = path.join(this.projectRoot, file);
      if (!fs.existsSync(fullPath)) {
        console.error(`   ❌ Missing core file: ${file}`);
        allFilesExist = false;
      }
    }

    if (!allFilesExist) {
      throw new Error('Core files are missing. Please ensure all Quality System files are present.');
    }

    // Try to import the main module
    try {
      const { QualitySystem } = await import('../QualitySystem');
      const system = new QualitySystem();
      await system.shutdown();
      console.log('   ✅ Quality System can be imported and instantiated');
    } catch (error) {
      console.error('   ❌ Failed to import Quality System:', error);
      throw new Error('Quality System installation verification failed');
    }

    console.log('✅ Installation verified');
  }
}

// CLI interface
async function main() {
  try {
    const initializer = new QualitySystemInitializer();
    await initializer.initialize();
  } catch (error) {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { QualitySystemInitializer, main };