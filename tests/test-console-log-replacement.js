/**
 * Test file for console.log replacement (Task 18)
 * Verifies that console.log statements have been properly replaced with unified logging
 */

const fs = require('fs');
const path = require('path');

class ConsoleLogReplacementTester {
  constructor() {
    this.results = {
      filesScanned: 0,
      consoleStatementsFound: 0,
      filesWithConsole: [],
      loggerImportsFound: 0,
      filesWithLoggerImports: []
    };
  }

  // Scan a file for console statements and logger imports
  scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Look for console statements (excluding test files and scripts)
      const consoleMatches = content.match(/console\.(log|warn|error|info|debug)/g);
      if (consoleMatches) {
        this.results.consoleStatementsFound += consoleMatches.length;
        this.results.filesWithConsole.push({
          file: filePath,
          count: consoleMatches.length,
          statements: consoleMatches
        });
      }

      // Look for logger imports
      const hasLoggerImport = content.includes('from \'../utils/logger\'') || 
                             content.includes('from \'../../utils/logger\'') ||
                             content.includes('from \'../../../utils/logger\'') ||
                             content.includes('Logger.') ||
                             content.includes('logger.');
      
      if (hasLoggerImport) {
        this.results.loggerImportsFound++;
        this.results.filesWithLoggerImports.push(filePath);
      }

      this.results.filesScanned++;
      
    } catch (error) {
      console.log(`❌ Error scanning ${filePath}: ${error.message}`);
    }
  }

  // Scan directory recursively
  scanDirectory(dirPath, extensions = ['.ts', '.tsx']) {
    if (!fs.existsSync(dirPath)) {
      return;
    }

    const items = fs.readdirSync(dirPath);
    
    items.forEach(item => {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        // Skip certain directories
        if (!['node_modules', '.git', 'dist', 'build', 'tests', 'docs'].includes(item)) {
          this.scanDirectory(itemPath, extensions);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (extensions.includes(ext)) {
          this.scanFile(itemPath);
        }
      }
    });
  }

  // Test specific files that should have been updated
  testSpecificFiles() {
    console.log('🧪 Testing specific files for console.log replacement...');
    
    const testFiles = [
      'providers/hooks/useAdaptation.ts',
      'providers/hooks/useCanvasEvents.ts',
      'hooks/useResponsiveCanvasSizing.ts',
      'hooks/useDeviceDetection.ts',
      'hooks/useShapeAdaptation.ts',
      'src/config/index.ts'
    ];

    let allPassed = true;

    testFiles.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for remaining console statements
        const consoleMatches = content.match(/console\.(log|warn|error|info|debug)/g);
        const hasLoggerImport = content.includes('Logger') || content.includes('logger');
        
        if (consoleMatches && consoleMatches.length > 0) {
          console.log(`❌ ${filePath}: Still has ${consoleMatches.length} console statements`);
          consoleMatches.forEach(match => console.log(`   - ${match}`));
          allPassed = false;
        } else if (hasLoggerImport) {
          console.log(`✅ ${filePath}: Console statements replaced with logger`);
        } else {
          console.log(`✅ ${filePath}: No console statements found`);
        }
      } else {
        console.log(`⚠️ ${filePath}: File not found`);
      }
    });

    return allPassed;
  }

  // Test that logger utilities are properly imported
  testLoggerImports() {
    console.log('🧪 Testing logger imports...');
    
    try {
      // Test that logger utilities can be imported
      const loggerPath = 'utils/logger.ts';
      if (fs.existsSync(loggerPath)) {
        const content = fs.readFileSync(loggerPath, 'utf8');
        
        const hasEssentialExports = [
          'export const logger',
          'export const deviceLogger',
          'export const adaptationLogger',
          'export const puzzleLogger',
          'export const canvasLogger'
        ].every(exportItem => content.includes(exportItem));

        console.log(`${hasEssentialExports ? '✅' : '❌'} Logger utilities have essential exports`);
        return hasEssentialExports;
      } else {
        console.log('❌ Logger utilities file not found');
        return false;
      }
    } catch (error) {
      console.log(`❌ Logger import test failed: ${error.message}`);
      return false;
    }
  }

  // Generate comprehensive report
  generateReport() {
    console.log('\n📋 Console.log Replacement Test Report');
    console.log('======================================');
    
    console.log(`Files scanned: ${this.results.filesScanned}`);
    console.log(`Console statements found: ${this.results.consoleStatementsFound}`);
    console.log(`Files with logger imports: ${this.results.loggerImportsFound}`);
    
    if (this.results.filesWithConsole.length > 0) {
      console.log('\n❌ Files still containing console statements:');
      this.results.filesWithConsole.forEach(({ file, count, statements }) => {
        console.log(`  ${file}: ${count} statements`);
        statements.forEach(stmt => console.log(`    - ${stmt}`));
      });
    } else {
      console.log('\n✅ No console statements found in scanned files');
    }
    
    if (this.results.filesWithLoggerImports.length > 0) {
      console.log('\n✅ Files with logger imports:');
      this.results.filesWithLoggerImports.forEach(file => {
        console.log(`  ${file}`);
      });
    }
    
    // Calculate success metrics
    const replacementSuccess = this.results.consoleStatementsFound === 0;
    const loggerAdoption = this.results.loggerImportsFound > 0;
    
    console.log('\n📊 Summary:');
    console.log(`${replacementSuccess ? '✅' : '❌'} Console statement replacement: ${replacementSuccess ? 'Complete' : 'Incomplete'}`);
    console.log(`${loggerAdoption ? '✅' : '❌'} Logger adoption: ${loggerAdoption ? 'Active' : 'Not detected'}`);
    
    return replacementSuccess && loggerAdoption;
  }

  // Run all tests
  runAllTests() {
    console.log('🚀 Running Console.log Replacement Tests...\n');
    
    // Scan main directories
    const directories = ['core', 'providers', 'hooks', 'src'];
    directories.forEach(dir => {
      if (fs.existsSync(dir)) {
        console.log(`📁 Scanning directory: ${dir}`);
        this.scanDirectory(dir);
      }
    });
    
    const specificFilesTest = this.testSpecificFiles();
    const loggerImportsTest = this.testLoggerImports();
    const overallTest = this.generateReport();
    
    const allTestsPassed = specificFilesTest && loggerImportsTest && overallTest;
    
    console.log(`\n${allTestsPassed ? '🎉' : '❌'} Console.log Replacement Tests: ${allTestsPassed ? 'PASSED' : 'NEEDS ATTENTION'}`);
    
    return allTestsPassed;
  }
}

// Test console.log replacement in AdaptationEngine specifically
function testAdaptationEngineCleanup() {
  console.log('🧪 Testing AdaptationEngine console.log cleanup...');
  
  const filePath = 'core/AdaptationEngine.ts';
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for specific console statements that should have been removed
    const forbiddenStatements = [
      '🔧 [AdaptationEngine] 拼图适配开始',
      '🧩 [AdaptationEngine] 适配未完成拼图',
      '✅ [AdaptationEngine] 拼图适配完成'
    ];
    
    const hasUnwantedLogs = forbiddenStatements.some(stmt => content.includes(stmt));
    
    console.log(`${!hasUnwantedLogs ? '✅' : '❌'} AdaptationEngine detailed logging cleanup: ${!hasUnwantedLogs ? 'Complete' : 'Incomplete'}`);
    
    if (hasUnwantedLogs) {
      console.log('   Found unwanted detailed logging statements');
    }
    
    return !hasUnwantedLogs;
  } else {
    console.log('⚠️ AdaptationEngine.ts not found');
    return false;
  }
}

// Main test runner
function runConsoleLogReplacementTests() {
  try {
    const tester = new ConsoleLogReplacementTester();
    
    const mainTests = tester.runAllTests();
    const adaptationEngineTest = testAdaptationEngineCleanup();
    
    const allTestsPassed = mainTests && adaptationEngineTest;
    
    console.log('\n📊 Final Results:');
    console.log(`${mainTests ? '✅' : '❌'} Main Console Replacement Tests`);
    console.log(`${adaptationEngineTest ? '✅' : '❌'} AdaptationEngine Cleanup Test`);
    
    console.log(`\n${allTestsPassed ? '🎉' : '❌'} Overall Result: ${allTestsPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
    
    return allTestsPassed;
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    return false;
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ConsoleLogReplacementTester, runConsoleLogReplacementTests };
}

// Run if called directly
if (require.main === module) {
  const result = runConsoleLogReplacementTests();
  process.exit(result ? 0 : 1);
}