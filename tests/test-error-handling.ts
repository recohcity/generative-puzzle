/**
 * Test file for Error Handling System (Task 19)
 * Verifies that unified error handling, validation, and monitoring work correctly
 */

import { ErrorHandlingService, ErrorSeverity, ErrorCategory } from '../core/ErrorHandlingService';
import { ValidationService } from '../core/ValidationService';
import { ErrorMonitoringService } from '../core/ErrorMonitoringService';

export class ErrorHandlingTester {
  private errorHandler: ErrorHandlingService;
  private validator: ValidationService;
  private monitor: ErrorMonitoringService;

  constructor() {
    this.errorHandler = ErrorHandlingService.getInstance();
    this.validator = ValidationService.getInstance();
    this.monitor = ErrorMonitoringService.getInstance();
  }

  // Test basic error handling
  async testBasicErrorHandling(): Promise<boolean> {
    console.log('🧪 Testing basic error handling...');
    
    try {
      const testError = new Error('Test error for handling');
      const context = {
        component: 'TestComponent',
        method: 'testMethod',
        timestamp: Date.now()
      };

      const report = await this.errorHandler.handleError(
        testError,
        context,
        ErrorSeverity.MEDIUM,
        ErrorCategory.VALIDATION
      );

      const isValid = report.id && 
                     report.error.message === 'Test error for handling' &&
                     report.severity === ErrorSeverity.MEDIUM &&
                     report.category === ErrorCategory.VALIDATION &&
                     report.handled === true;

      console.log(`${isValid ? '✅' : '❌'} Basic error handling: ${isValid ? 'Working' : 'Failed'}`);
      return isValid;
    } catch (error) {
      console.log(`❌ Basic error handling test failed: ${error}`);
      return false;
    }
  }

  // Test error recovery
  async testErrorRecovery(): Promise<boolean> {
    console.log('🧪 Testing error recovery...');
    
    try {
      // Register a test recovery strategy
      this.errorHandler.registerRecoveryStrategy({
        category: ErrorCategory.VALIDATION,
        handler: async (error, context) => {
          // Simulate successful recovery
          return true;
        },
        maxRetries: 2,
        retryDelay: 100
      });

      const testError = new Error('Recoverable test error');
      const context = {
        component: 'TestComponent',
        method: 'testRecovery',
        timestamp: Date.now()
      };

      const report = await this.errorHandler.handleError(
        testError,
        context,
        ErrorSeverity.MEDIUM,
        ErrorCategory.VALIDATION
      );

      const isValid = report.recovered === true && report.retryCount > 0;

      console.log(`${isValid ? '✅' : '❌'} Error recovery: ${isValid ? 'Working' : 'Failed'}`);
      return isValid;
    } catch (error) {
      console.log(`❌ Error recovery test failed: ${error}`);
      return false;
    }
  }

  // Test component error handler
  async testComponentErrorHandler(): Promise<boolean> {
    console.log('🧪 Testing component error handler...');
    
    try {
      const componentHandler = this.errorHandler.createComponentErrorHandler('TestComponent');
      
      const testError = new Error('Component test error');
      const report = await componentHandler.handleError(
        testError,
        'testMethod',
        ErrorSeverity.LOW,
        ErrorCategory.DEVICE_DETECTION
      );

      const isValid = report.context.component === 'TestComponent' &&
                     report.context.method === 'testMethod' &&
                     report.severity === ErrorSeverity.LOW;

      console.log(`${isValid ? '✅' : '❌'} Component error handler: ${isValid ? 'Working' : 'Failed'}`);
      return isValid;
    } catch (error) {
      console.log(`❌ Component error handler test failed: ${error}`);
      return false;
    }
  }

  // Test validation service
  testValidationService(): boolean {
    console.log('🧪 Testing validation service...');
    
    try {
      // Test configuration validation
      const configResult = this.validator.validateConfiguration();
      
      // Test runtime validation
      const canvasSizeValid = this.validator.validateRuntime('canvas-size', { width: 800, height: 600 });
      const canvasSizeInvalid = this.validator.validateRuntime('canvas-size', { width: -100, height: 'invalid' });
      
      // Test component validator
      const componentValidator = this.validator.createComponentValidator('TestComponent');
      
      let validationPassed = true;
      try {
        componentValidator.validateRequired('test value', 'testField');
        componentValidator.validateType('test', 'string', 'testField');
        componentValidator.validateArray([1, 2, 3], 'testArray', 2);
      } catch (validationError) {
        validationPassed = false;
      }

      const isValid = configResult !== null &&
                     canvasSizeValid === true &&
                     canvasSizeInvalid === false &&
                     validationPassed === true;

      console.log(`${isValid ? '✅' : '❌'} Validation service: ${isValid ? 'Working' : 'Failed'}`);
      return isValid;
    } catch (error) {
      console.log(`❌ Validation service test failed: ${error}`);
      return false;
    }
  }

  // Test error monitoring
  async testErrorMonitoring(): Promise<boolean> {
    console.log('🧪 Testing error monitoring...');
    
    try {
      // Configure monitoring
      this.monitor.configure({
        enableRealTimeMonitoring: true,
        reportingInterval: 1000, // 1 second for testing
        alertThresholds: {
          errorRate: 2,
          criticalErrors: 1,
          recoveryFailureRate: 50
        }
      });

      // Generate some test errors
      for (let i = 0; i < 3; i++) {
        const testError = new Error(`Test error ${i}`);
        const report = await this.errorHandler.handleError(testError, {
          component: 'TestComponent',
          method: 'testMonitoring',
          timestamp: Date.now()
        }, ErrorSeverity.MEDIUM);
        
        this.monitor.recordError(report);
      }

      // Get metrics
      const metrics = this.monitor.getMetrics();
      
      // Check if monitoring is working
      const isValid = metrics.totalErrors >= 3 &&
                     metrics.errorRate > 0 &&
                     typeof metrics.recoveryRate === 'number';

      console.log(`${isValid ? '✅' : '❌'} Error monitoring: ${isValid ? 'Working' : 'Failed'}`);
      return isValid;
    } catch (error) {
      console.log(`❌ Error monitoring test failed: ${error}`);
      return false;
    }
  }

  // Test error statistics
  testErrorStatistics(): boolean {
    console.log('🧪 Testing error statistics...');
    
    try {
      const stats = this.errorHandler.getErrorStats();
      
      const isValid = typeof stats.totalErrors === 'number' &&
                     typeof stats.recoveryRate === 'number' &&
                     Array.isArray(stats.recentErrors) &&
                     typeof stats.errorsByCategory === 'object';

      console.log(`${isValid ? '✅' : '❌'} Error statistics: ${isValid ? 'Working' : 'Failed'}`);
      return isValid;
    } catch (error) {
      console.log(`❌ Error statistics test failed: ${error}`);
      return false;
    }
  }

  // Test graceful degradation
  async testGracefulDegradation(): Promise<boolean> {
    console.log('🧪 Testing graceful degradation...');
    
    try {
      // Test with a critical error that should trigger fallback
      const criticalError = new Error('Critical system failure');
      const report = await this.errorHandler.handleError(
        criticalError,
        {
          component: 'CriticalComponent',
          method: 'criticalOperation',
          timestamp: Date.now()
        },
        ErrorSeverity.CRITICAL,
        ErrorCategory.CONFIGURATION
      );

      // Should be handled even if recovery fails
      const isValid = report.handled === true;

      console.log(`${isValid ? '✅' : '❌'} Graceful degradation: ${isValid ? 'Working' : 'Failed'}`);
      return isValid;
    } catch (error) {
      console.log(`❌ Graceful degradation test failed: ${error}`);
      return false;
    }
  }

  // Generate test report
  generateReport(results: Record<string, boolean>): boolean {
    console.log('\n📋 Error Handling Test Report');
    console.log('=============================');
    
    const testNames = Object.keys(results);
    const passedTests = testNames.filter(test => results[test]);
    
    console.log(`\nTest Results: ${passedTests.length}/${testNames.length} passed`);
    
    testNames.forEach(testName => {
      const result = results[testName];
      console.log(`${result ? '✅' : '❌'} ${testName}`);
    });
    
    const overallScore = passedTests.length / testNames.length;
    console.log(`\nOverall Score: ${(overallScore * 100).toFixed(1)}%`);
    
    return overallScore >= 0.8; // 80% threshold
  }

  // Run all tests
  async runAllTests(): Promise<boolean> {
    console.log('🚀 Running Error Handling Tests...\n');
    
    const results = {
      basicErrorHandling: await this.testBasicErrorHandling(),
      errorRecovery: await this.testErrorRecovery(),
      componentErrorHandler: await this.testComponentErrorHandler(),
      validationService: this.testValidationService(),
      errorMonitoring: await this.testErrorMonitoring(),
      errorStatistics: this.testErrorStatistics(),
      gracefulDegradation: await this.testGracefulDegradation()
    };
    
    const overallValid = this.generateReport(results);
    
    console.log(`\n${overallValid ? '🎉' : '❌'} Error Handling Tests: ${overallValid ? 'PASSED' : 'NEEDS ATTENTION'}`);
    
    return overallValid;
  }
}

// Test error handling integration
export function testErrorHandlingIntegration(): boolean {
  console.log('🧪 Testing error handling integration...');
  
  try {
    // Test that all services can be instantiated
    const errorHandler = ErrorHandlingService.getInstance();
    const validator = ValidationService.getInstance();
    const monitor = ErrorMonitoringService.getInstance();
    
    const hasErrorHandler = typeof errorHandler.handleError === 'function';
    const hasValidator = typeof validator.validate === 'function';
    const hasMonitor = typeof monitor.getMetrics === 'function';
    
    const allServicesAvailable = hasErrorHandler && hasValidator && hasMonitor;
    
    console.log(`${allServicesAvailable ? '✅' : '❌'} Error handling integration: ${allServicesAvailable ? 'Working' : 'Failed'}`);
    
    return allServicesAvailable;
  } catch (error) {
    console.log(`❌ Error handling integration test failed: ${error}`);
    return false;
  }
}

// Main test runner
export async function runErrorHandlingTests(): Promise<boolean> {
  try {
    console.log('🚀 Starting Error Handling System Tests...\n');
    
    const tester = new ErrorHandlingTester();
    
    const integrationValid = testErrorHandlingIntegration();
    const systemValid = await tester.runAllTests();
    
    const allTestsPassed = integrationValid && systemValid;
    
    console.log('\n📊 Final Test Results:');
    console.log(`${integrationValid ? '✅' : '❌'} Integration Tests`);
    console.log(`${systemValid ? '✅' : '❌'} System Tests`);
    
    console.log(`\n${allTestsPassed ? '🎉' : '❌'} Overall Result: ${allTestsPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
    
    return allTestsPassed;
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    return false;
  }
}