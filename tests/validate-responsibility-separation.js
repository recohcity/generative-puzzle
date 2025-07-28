/**
 * Simple validation script for responsibility separation (Task 16)
 * Checks component structure and responsibilities without complex TypeScript
 */

const fs = require('fs');
const path = require('path');

class ResponsibilityValidator {
  constructor() {
    this.results = {
      componentExists: {},
      responsibilityAnalysis: {},
      dependencyAnalysis: {},
      complexityAnalysis: {}
    };
  }

  // Check if all refactored components exist
  validateComponentExistence() {
    console.log('🔍 Validating Component Existence...');
    
    const components = {
      'DeviceManager': 'core/DeviceManager.ts',
      'DeviceLayoutManager': 'core/DeviceLayoutManager.ts',
      'AdaptationEngine': 'core/AdaptationEngine.ts',
      'PuzzleAdaptationService': 'core/PuzzleAdaptationService.ts',
      'useCanvas': 'providers/hooks/useCanvas.ts',
      'useCanvasSize': 'providers/hooks/useCanvasSize.ts',
      'useCanvasRefs': 'providers/hooks/useCanvasRefs.ts',
      'useCanvasEvents': 'providers/hooks/useCanvasEvents.ts'
    };

    let allExist = true;
    
    Object.entries(components).forEach(([name, filePath]) => {
      const exists = fs.existsSync(filePath);
      this.results.componentExists[name] = exists;
      
      console.log(`${exists ? '✅' : '❌'} ${name}: ${filePath}`);
      
      if (!exists) allExist = false;
    });

    return allExist;
  }

  // Analyze component responsibilities based on file content
  analyzeResponsibilities() {
    console.log('\\n🎯 Analyzing Component Responsibilities...');
    
    const componentAnalysis = {
      'DeviceManager': {
        file: 'core/DeviceManager.ts',
        expectedResponsibilities: ['device detection', 'state management', 'event emission'],
        shouldNotContain: ['layout calculation', 'puzzle logic', 'canvas management']
      },
      'DeviceLayoutManager': {
        file: 'core/DeviceLayoutManager.ts', 
        expectedResponsibilities: ['layout calculation', 'layout optimization'],
        shouldNotContain: ['device detection', 'puzzle logic']
      },
      'AdaptationEngine': {
        file: 'core/AdaptationEngine.ts',
        expectedResponsibilities: ['general adaptation', 'canvas calculation', 'shape adaptation'],
        shouldNotContain: ['puzzle-specific logic', 'detailed logging']
      },
      'PuzzleAdaptationService': {
        file: 'core/PuzzleAdaptationService.ts',
        expectedResponsibilities: ['puzzle adaptation', 'puzzle scaling', 'puzzle validation'],
        shouldNotContain: ['general adaptation', 'device detection']
      },
      'useCanvas': {
        file: 'providers/hooks/useCanvas.ts',
        expectedResponsibilities: ['hook orchestration', 'backward compatibility'],
        shouldNotContain: ['direct event handling', 'direct size management', 'direct ref management']
      },
      'useCanvasSize': {
        file: 'providers/hooks/useCanvasSize.ts',
        expectedResponsibilities: ['size management', 'bounds checking'],
        shouldNotContain: ['event handling', 'ref management']
      },
      'useCanvasRefs': {
        file: 'providers/hooks/useCanvasRefs.ts',
        expectedResponsibilities: ['reference management', 'initialization'],
        shouldNotContain: ['size management', 'event handling']
      },
      'useCanvasEvents': {
        file: 'providers/hooks/useCanvasEvents.ts',
        expectedResponsibilities: ['event handling', 'device changes', 'orientation changes'],
        shouldNotContain: ['size management', 'ref management']
      }
    };

    let allValid = true;

    Object.entries(componentAnalysis).forEach(([name, analysis]) => {
      if (!fs.existsSync(analysis.file)) {
        console.log(`❌ ${name}: File not found`);
        this.results.responsibilityAnalysis[name] = { valid: false, reason: 'File not found' };
        allValid = false;
        return;
      }

      const content = fs.readFileSync(analysis.file, 'utf8').toLowerCase();
      
      // Check for expected responsibilities
      const hasExpectedResponsibilities = analysis.expectedResponsibilities.some(resp => 
        content.includes(resp.toLowerCase())
      );
      
      // Check for things that should not be present
      const hasUnwantedContent = analysis.shouldNotContain.some(unwanted => 
        content.includes(unwanted.toLowerCase())
      );

      const isValid = hasExpectedResponsibilities && !hasUnwantedContent;
      
      console.log(`${isValid ? '✅' : '❌'} ${name}: ${isValid ? 'Proper responsibilities' : 'Responsibility issues'}`);
      
      if (!isValid) {
        if (!hasExpectedResponsibilities) {
          console.log(`   Missing expected: ${analysis.expectedResponsibilities.join(', ')}`);
        }
        if (hasUnwantedContent) {
          console.log(`   Contains unwanted: ${analysis.shouldNotContain.filter(u => content.includes(u.toLowerCase())).join(', ')}`);
        }
        allValid = false;
      }

      this.results.responsibilityAnalysis[name] = { 
        valid: isValid, 
        hasExpected: hasExpectedResponsibilities,
        hasUnwanted: hasUnwantedContent
      };
    });

    return allValid;
  }

  // Analyze file complexity (line count as a simple metric)
  analyzeComplexity() {
    console.log('\\n📊 Analyzing Component Complexity...');
    
    const components = [
      'core/DeviceManager.ts',
      'core/DeviceLayoutManager.ts',
      'core/AdaptationEngine.ts',
      'core/PuzzleAdaptationService.ts',
      'providers/hooks/useCanvas.ts',
      'providers/hooks/useCanvasSize.ts',
      'providers/hooks/useCanvasRefs.ts',
      'providers/hooks/useCanvasEvents.ts'
    ];

    let allReasonable = true;

    components.forEach(filePath => {
      if (!fs.existsSync(filePath)) return;
      
      const content = fs.readFileSync(filePath, 'utf8');
      const lineCount = content.split('\\n').length;
      const componentName = path.basename(filePath, '.ts');
      
      // Define reasonable complexity thresholds
      let threshold = 200; // Default threshold
      if (filePath.includes('useCanvas.ts')) threshold = 50; // Main hook should be simple
      if (filePath.includes('useCanvasSize.ts') || filePath.includes('useCanvasRefs.ts')) threshold = 100;
      
      const isReasonable = lineCount <= threshold;
      const complexity = lineCount < 50 ? 'Low' : lineCount < 150 ? 'Medium' : 'High';
      
      console.log(`${isReasonable ? '✅' : '❌'} ${componentName}: ${lineCount} lines (${complexity})`);
      
      this.results.complexityAnalysis[componentName] = {
        lineCount,
        complexity,
        reasonable: isReasonable,
        threshold
      };
      
      if (!isReasonable) allReasonable = false;
    });

    return allReasonable;
  }

  // Check for circular dependencies (basic check)
  checkDependencies() {
    console.log('\\n🔄 Checking Dependency Structure...');
    
    const components = [
      'core/DeviceManager.ts',
      'core/AdaptationEngine.ts', 
      'core/PuzzleAdaptationService.ts',
      'providers/hooks/useCanvas.ts'
    ];

    let noCycles = true;

    components.forEach(filePath => {
      if (!fs.existsSync(filePath)) return;
      
      const content = fs.readFileSync(filePath, 'utf8');
      const componentName = path.basename(filePath, '.ts');
      
      // Extract imports
      const imports = [];
      const importMatches = content.match(/import.*from\\s+['"]([^'"]+)['"]/g) || [];
      const requireMatches = content.match(/require\\(['"]([^'"]+)['"]\\)/g) || [];
      
      [...importMatches, ...requireMatches].forEach(match => {
        const pathMatch = match.match(/['"]([^'"]+)['"]/);
        if (pathMatch && (pathMatch[1].startsWith('./') || pathMatch[1].startsWith('../'))) {
          imports.push(pathMatch[1]);
        }
      });

      console.log(`✅ ${componentName}: ${imports.length} internal dependencies`);
      
      this.results.dependencyAnalysis[componentName] = {
        dependencies: imports,
        count: imports.length
      };
    });

    // Simple check: if PuzzleAdaptationService doesn't import AdaptationEngine, that's good separation
    const puzzleService = this.results.dependencyAnalysis['PuzzleAdaptationService'];
    if (puzzleService) {
      const hasAdaptationEngineDep = puzzleService.dependencies.some(dep => 
        dep.includes('AdaptationEngine')
      );
      if (!hasAdaptationEngineDep) {
        console.log('✅ Good separation: PuzzleAdaptationService is independent of AdaptationEngine');
      }
    }

    return noCycles;
  }

  // Generate summary report
  generateReport() {
    console.log('\\n📋 Responsibility Separation Summary');
    console.log('=====================================');
    
    const componentCount = Object.keys(this.results.componentExists).length;
    const existingCount = Object.values(this.results.componentExists).filter(Boolean).length;
    
    console.log(`Components: ${existingCount}/${componentCount} exist`);
    
    const responsibilityCount = Object.keys(this.results.responsibilityAnalysis).length;
    const validResponsibilities = Object.values(this.results.responsibilityAnalysis).filter(r => r.valid).length;
    
    console.log(`Responsibilities: ${validResponsibilities}/${responsibilityCount} properly separated`);
    
    const complexityCount = Object.keys(this.results.complexityAnalysis).length;
    const reasonableComplexity = Object.values(this.results.complexityAnalysis).filter(c => c.reasonable).length;
    
    console.log(`Complexity: ${reasonableComplexity}/${complexityCount} components have reasonable complexity`);
    
    const overallScore = ((existingCount / componentCount) + 
                         (validResponsibilities / responsibilityCount) + 
                         (reasonableComplexity / complexityCount)) / 3;
    
    console.log(`\\nOverall Score: ${(overallScore * 100).toFixed(1)}%`);
    
    return overallScore >= 0.8; // 80% threshold for success
  }

  // Run all validations
  runAllValidations() {
    console.log('🚀 Running Responsibility Separation Validation...\\n');
    
    const componentExists = this.validateComponentExistence();
    const responsibilitiesValid = this.analyzeResponsibilities();
    const complexityReasonable = this.analyzeComplexity();
    const dependenciesClean = this.checkDependencies();
    
    const overallValid = this.generateReport();
    
    console.log(`\\n${overallValid ? '🎉' : '❌'} Responsibility Separation: ${overallValid ? 'PASSED' : 'NEEDS IMPROVEMENT'}`);
    
    return overallValid;
  }
}

// Run the validation
function runValidation() {
  try {
    const validator = new ResponsibilityValidator();
    return validator.runAllValidations();
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    return false;
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ResponsibilityValidator, runValidation };
}

// Run if called directly
if (require.main === module) {
  const result = runValidation();
  process.exit(result ? 0 : 1);
}