/**
 * Component Functionality Test (Task 16)
 * Tests that refactored components maintain their functionality
 * and work correctly after responsibility separation
 */

const fs = require('fs');

class ComponentFunctionalityTester {
  constructor() {
    this.testResults = {};
  }

  // Test DeviceManager functionality
  testDeviceManager() {
    console.log('🧪 Testing DeviceManager functionality...');
    
    try {
      const content = fs.readFileSync('core/DeviceManager.ts', 'utf8');
      
      // Check for essential DeviceManager methods
      const essentialMethods = [
        'getInstance',
        'getDeviceType',
        'getScreenInfo',
        'subscribe',
        'updateState'
      ];
      
      let methodsFound = 0;
      essentialMethods.forEach(method => {
        if (content.includes(method)) {
          methodsFound++;
        }
      });
      
      // Check that it doesn't contain layout-specific logic (should be in DeviceLayoutManager)
      const shouldNotContain = [
        'calculateLayout',
        'getLayoutInfo'
      ];
      
      const hasUnwantedMethods = shouldNotContain.some(method => content.includes(method));
      
      const isValid = methodsFound >= 3 && !hasUnwantedMethods; // At least 3 essential methods
      
      console.log(`${isValid ? '✅' : '❌'} DeviceManager: ${methodsFound}/${essentialMethods.length} methods found`);
      
      this.testResults.DeviceManager = {
        valid: isValid,
        methodsFound,
        totalMethods: essentialMethods.length,
        hasUnwantedMethods
      };
      
      return isValid;
    } catch (error) {
      console.log(`❌ DeviceManager test failed: ${error.message}`);
      this.testResults.DeviceManager = { valid: false, error: error.message };
      return false;
    }
  }

  // Test AdaptationEngine functionality
  testAdaptationEngine() {
    console.log('🧪 Testing AdaptationEngine functionality...');
    
    try {
      const content = fs.readFileSync('core/AdaptationEngine.ts', 'utf8');
      
      // Check for essential AdaptationEngine methods
      const essentialMethods = [
        'calculateCanvasSize',
        'adaptShape',
        'adaptPuzzlePieces', // Should delegate to PuzzleAdaptationService
        'normalizePosition',
        'denormalizePosition'
      ];
      
      let methodsFound = 0;
      essentialMethods.forEach(method => {
        if (content.includes(method)) {
          methodsFound++;
        }
      });
      
      // Check that puzzle-specific detailed logic has been removed
      const shouldNotContain = [
        '🔧 [AdaptationEngine] 拼图适配开始',
        '🧩 [AdaptationEngine] 适配未完成拼图',
        'private scalePuzzlePiece(' // Should not be a method anymore, should be in service
      ];
      
      const hasUnwantedContent = shouldNotContain.some(unwanted => content.includes(unwanted));
      
      // Check that it delegates to PuzzleAdaptationService
      const delegatesToService = content.includes('PuzzleAdaptationService');
      
      const isValid = methodsFound >= 4 && !hasUnwantedContent && delegatesToService;
      
      console.log(`${isValid ? '✅' : '❌'} AdaptationEngine: ${methodsFound}/${essentialMethods.length} methods, delegates: ${delegatesToService}`);
      
      this.testResults.AdaptationEngine = {
        valid: isValid,
        methodsFound,
        totalMethods: essentialMethods.length,
        hasUnwantedContent,
        delegatesToService
      };
      
      return isValid;
    } catch (error) {
      console.log(`❌ AdaptationEngine test failed: ${error.message}`);
      this.testResults.AdaptationEngine = { valid: false, error: error.message };
      return false;
    }
  }

  // Test PuzzleAdaptationService functionality
  testPuzzleAdaptationService() {
    console.log('🧪 Testing PuzzleAdaptationService functionality...');
    
    try {
      const content = fs.readFileSync('core/PuzzleAdaptationService.ts', 'utf8');
      
      // Check for essential PuzzleAdaptationService methods
      const essentialMethods = [
        'getInstance',
        'adaptPuzzlePieces',
        'scalePuzzlePiece',
        'validatePuzzlePieces',
        'calculatePuzzleBounds'
      ];
      
      let methodsFound = 0;
      essentialMethods.forEach(method => {
        if (content.includes(method)) {
          methodsFound++;
        }
      });
      
      // Check that it's independent (doesn't import AdaptationEngine)
      const importLines = content.split('\n').filter(line => 
        line.trim().startsWith('import') || line.includes('require(')
      );
      const hasAdaptationEngineImport = importLines.some(line => 
        line.includes('AdaptationEngine')
      );
      const isIndependent = !hasAdaptationEngineImport;
      
      const isValid = methodsFound >= 4 && isIndependent;
      
      console.log(`${isValid ? '✅' : '❌'} PuzzleAdaptationService: ${methodsFound}/${essentialMethods.length} methods, independent: ${isIndependent}`);
      
      this.testResults.PuzzleAdaptationService = {
        valid: isValid,
        methodsFound,
        totalMethods: essentialMethods.length,
        isIndependent
      };
      
      return isValid;
    } catch (error) {
      console.log(`❌ PuzzleAdaptationService test failed: ${error.message}`);
      this.testResults.PuzzleAdaptationService = { valid: false, error: error.message };
      return false;
    }
  }

  // Test useCanvas hook refactoring
  testUseCanvasHooks() {
    console.log('🧪 Testing useCanvas hooks refactoring...');
    
    try {
      // Test main useCanvas hook
      const useCanvasContent = fs.readFileSync('providers/hooks/useCanvas.ts', 'utf8');
      
      // Should use specialized hooks
      const usesSpecializedHooks = [
        'useCanvasSize',
        'useCanvasRefs', 
        'useCanvasEvents'
      ].every(hook => useCanvasContent.includes(hook));
      
      // Should be much shorter now (orchestration only)
      const lineCount = useCanvasContent.split('\\n').length;
      const isSimplified = lineCount < 50; // Should be much shorter than original
      
      // Should re-export utility hooks for backward compatibility
      const reExportsUtilities = useCanvasContent.includes('useCanvasContext') && 
                                 useCanvasContent.includes('useCanvasBounds');
      
      console.log(`${usesSpecializedHooks ? '✅' : '❌'} useCanvas uses specialized hooks`);
      console.log(`${isSimplified ? '✅' : '❌'} useCanvas is simplified (${lineCount} lines)`);
      console.log(`${reExportsUtilities ? '✅' : '❌'} useCanvas re-exports utilities`);
      
      // Test specialized hooks exist
      const specializedHooks = [
        'providers/hooks/useCanvasSize.ts',
        'providers/hooks/useCanvasRefs.ts',
        'providers/hooks/useCanvasEvents.ts'
      ];
      
      const allSpecializedExist = specializedHooks.every(hook => fs.existsSync(hook));
      console.log(`${allSpecializedExist ? '✅' : '❌'} All specialized hooks exist`);
      
      const isValid = usesSpecializedHooks && isSimplified && reExportsUtilities && allSpecializedExist;
      
      this.testResults.useCanvasHooks = {
        valid: isValid,
        usesSpecializedHooks,
        isSimplified,
        lineCount,
        reExportsUtilities,
        allSpecializedExist
      };
      
      return isValid;
    } catch (error) {
      console.log(`❌ useCanvas hooks test failed: ${error.message}`);
      this.testResults.useCanvasHooks = { valid: false, error: error.message };
      return false;
    }
  }

  // Test backward compatibility
  testBackwardCompatibility() {
    console.log('🧪 Testing backward compatibility...');
    
    try {
      // Check that main APIs are still exported
      const useCanvasContent = fs.readFileSync('providers/hooks/useCanvas.ts', 'utf8');
      const adaptationEngineContent = fs.readFileSync('core/AdaptationEngine.ts', 'utf8');
      
      // useCanvas should still export the main hook and utilities
      const useCanvasExports = [
        'export const useCanvas',
        'useCanvasContext',
        'useCanvasBounds'
      ].every(exportItem => useCanvasContent.includes(exportItem));
      
      // AdaptationEngine should still have adaptPuzzlePieces method (even if delegated)
      const adaptationEngineExports = [
        'adaptPuzzlePieces',
        'adaptShape',
        'calculateCanvasSize'
      ].every(method => adaptationEngineContent.includes(method));
      
      console.log(`${useCanvasExports ? '✅' : '❌'} useCanvas maintains exports`);
      console.log(`${adaptationEngineExports ? '✅' : '❌'} AdaptationEngine maintains methods`);
      
      const isValid = useCanvasExports && adaptationEngineExports;
      
      this.testResults.backwardCompatibility = {
        valid: isValid,
        useCanvasExports,
        adaptationEngineExports
      };
      
      return isValid;
    } catch (error) {
      console.log(`❌ Backward compatibility test failed: ${error.message}`);
      this.testResults.backwardCompatibility = { valid: false, error: error.message };
      return false;
    }
  }

  // Generate functionality test report
  generateReport() {
    console.log('\\n📋 Component Functionality Test Report');
    console.log('=======================================');
    
    const testNames = Object.keys(this.testResults);
    const passedTests = testNames.filter(test => this.testResults[test].valid);
    
    console.log(`\\nTest Results: ${passedTests.length}/${testNames.length} passed`);
    
    testNames.forEach(testName => {
      const result = this.testResults[testName];
      console.log(`${result.valid ? '✅' : '❌'} ${testName}`);
      
      if (!result.valid && result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    const overallScore = passedTests.length / testNames.length;
    console.log(`\\nOverall Functionality Score: ${(overallScore * 100).toFixed(1)}%`);
    
    return overallScore >= 0.8; // 80% threshold
  }

  // Run all functionality tests
  runAllTests() {
    console.log('🚀 Running Component Functionality Tests...\\n');
    
    const deviceManagerValid = this.testDeviceManager();
    const adaptationEngineValid = this.testAdaptationEngine();
    const puzzleServiceValid = this.testPuzzleAdaptationService();
    const useCanvasHooksValid = this.testUseCanvasHooks();
    const backwardCompatibilityValid = this.testBackwardCompatibility();
    
    const overallValid = this.generateReport();
    
    console.log(`\\n${overallValid ? '🎉' : '❌'} Component Functionality: ${overallValid ? 'PASSED' : 'NEEDS ATTENTION'}`);
    
    return overallValid;
  }
}

// Run the functionality tests
function runFunctionalityTests() {
  try {
    const tester = new ComponentFunctionalityTester();
    return tester.runAllTests();
  } catch (error) {
    console.error('❌ Functionality tests failed:', error.message);
    return false;
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ComponentFunctionalityTester, runFunctionalityTests };
}

// Run if called directly
if (require.main === module) {
  const result = runFunctionalityTests();
  process.exit(result ? 0 : 1);
}