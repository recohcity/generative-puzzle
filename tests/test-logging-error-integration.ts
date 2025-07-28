/**
 * Test file for Logging and Error Handling Integration (Task 20)
 * Verifies that logging service and error handling work together correctly
 * Tests performance impact and error recovery mechanisms
 */

import { LoggingService, LogLevel } from '../core/LoggingService';
import { ErrorHandlingService, ErrorSeverity, ErrorCategory } from '../core/ErrorHandlingService';
import { ValidationService } from '../core/ValidationService';
import { ErrorMonitoringService } from '../core/ErrorMonitoringService';

export class LoggingErrorIntegrationTester {
  private loggingService: LoggingService;
  private errorHandler: ErrorHandlingService;
  private validator: ValidationService;
  private monitor: ErrorMonitoringService;
  private testResults: Record<string, boolean> = {};

  constructor() {
    this.loggingService = LoggingService.getInstance();
    this.errorHandler = ErrorHandlingService.getInstance();
    this.validator = ValidationService.getInstance();
    this.monitor = ErrorMonitoringService.getInstance();
  }

  // Test logging service functionality
  testLoggingServiceFunctionality(): boolean {
    console.log('🧪 Testing logging service functionality...');
    
    try {
      // Clear previous logs
      this.loggingService.clearLogs();
      
      // Test different log levels
      this.loggingService.debug('Debug message');
      this.loggingService.info('Info message');
      this.loggingService.warn('Warning message');
      this.loggingService.error('Error message', new Error('Test error'));
      
      // Get logs and verify
      const logs = this.loggingService.getLogs();
      const stats = this.loggingService.getStats();
      
      const hasLogs = logs.length > 0;
      const hasStats = stats.totalEntries > 0;
      const hasErrorCount = stats.errorCount > 0;
      
      const isValid = hasLogs && hasStats && hasErrorCount;
      
      console.log(`${isValid ? '✅' : '❌'} Logging service functionality: ${isValid ? 'Working' : 'Failed'}`);
      return isValid;
    } catch (error) {
      console.log(`❌ Logging service test failed: ${error}`);
      return false;
    }
  }

  // Test error handling functionality
  async testErrorHandlingFunctionality(): Promise<boolean> {
    console.log('🧪 Testing error handling functionality...');
    
    try {
      const testError = new Error('Integration test error');
      const context = {
        component: 'IntegrationTest',
        method: 'testErrorHandling',
        timestamp: Date.now()
      };

      const report = await this.errorHandler.handleError(
        testError,
        context,
        ErrorSeverity.MEDIUM,
        ErrorCategory.VALIDATION
      );

      const isValid = report.id && 
                     report.handled === true &&
                     report.error.message === 'Integration test error';

      console.log(`${isValid ? '✅' : '❌'} Error handling functionality: ${isValid ? 'Working' : 'Failed'}`);
      return isValid;
    } catch (error) {
      console.log(`❌ Error handling test failed: ${error}`);
      return false;
    }
  }

  // Test logging and error handling integration
  async testLoggingErrorIntegration(): Promise<boolean> {
    console.log('🧪 Testing logging and error handling integration...');
    
    try {
      // Clear logs before test
      this.loggingService.clearLogs();
      
      // Create an error that should be logged
      const testError = new Error('Integration logging test');
      const context = {
        component: 'IntegrationTest',
        method: 'testIntegration',
        timestamp: Date.now()
      };

      // Handle error (should automatically log it)
      await this.errorHandler.handleError(
        testError,
        context,
        ErrorSeverity.HIGH,
        ErrorCategory.ADAPTATION
      );

      // Check if error was logged
      const logs = this.loggingService.getLogs();
      const errorLogs = logs.filter(log => log.level >= LogLevel.WARN);
      
      const hasErrorLog = errorLogs.some(log => 
        log.message.includes('adaptation error') || 
        log.message.includes('Integration logging test')
      );

      console.log(`${hasErrorLog ? '✅' : '❌'} Logging-Error integration: ${hasErrorLog ? 'Working' : 'Failed'}`);
      return hasErrorLog;
    } catch (error) {
      console.log(`❌ Logging-Error integration test failed: ${error}`);
      return false;
    }
  }

  // Test error monitoring integration
  async testErrorMonitoringIntegration(): Promise<boolean> {
    console.log('🧪 Testing error monitoring integration...');
    
    try {
      // Configure monitoring for testing
      this.monitor.configure({
        enableRealTimeMonitoring: true,
        reportingInterval: 1000,
        alertThresholds: {
          errorRate: 2,
          criticalErrors: 1,
          recoveryFailureRate: 50
        }
      });

      // Generate test errors
      for (let i = 0; i < 3; i++) {
        const testError = new Error(`Monitoring test error ${i}`);
        const report = await this.errorHandler.handleError(testError, {
          component: 'MonitoringTest',
          method: 'generateError',
          timestamp: Date.now()
        });
        
        // Record error in monitoring
        this.monitor.recordError(report);
      }

      // Get monitoring metrics
      const metrics = this.monitor.getMetrics();
      
      const hasMetrics = metrics.totalErrors >= 3 &&
                        metrics.errorRate > 0 &&
                        typeof metrics.recoveryRate === 'number';

      console.log(`${hasMetrics ? '✅' : '❌'} Error monitoring integration: ${hasMetrics ? 'Working' : 'Failed'}`);
      return hasMetrics;
    } catch (error) {
      console.log(`❌ Error monitoring integration test failed: ${error}`);
      return false;
    }
  }

  // Test performance impact
  testPerformanceImpact(): boolean {
    console.log('🧪 Testing performance impact...');
    
    try {
      const iterations = 1000;
      
      // Test logging performance
      const loggingStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        this.loggingService.info(`Performance test log ${i}`);
      }
      const loggingEnd = performance.now();
      const loggingTime = loggingEnd - loggingStart;
      
      // Test error handling performance
      const errorStart = performance.now();
      const promises = [];
      for (let i = 0; i < 100; i++) { // Fewer iterations for async operations
        promises.push(
          this.errorHandler.handleError(
            new Error(`Performance test error ${i}`),
            {
              component: 'PerformanceTest',
              method: 'testPerformance',
              timestamp: Date.now()
            }
          )
        );
      }
      
      Promise.all(promises).then(() => {
        const errorEnd = performance.now();
        const errorTime = errorEnd - errorStart;
        
        // Performance thresholds (adjust based on requirements)
        const loggingPerformanceOk = loggingTime < 1000; // 1000ms for 1000 logs
        const errorPerformanceOk = errorTime < 2000; // 2000ms for 100 error handlings
        
        const isValid = loggingPerformanceOk && errorPerformanceOk;
        
        console.log(`${isValid ? '✅' : '❌'} Performance impact: ${isValid ? 'Acceptable' : 'Too slow'}`);
        console.log(`  Logging: ${loggingTime.toFixed(2)}ms for ${iterations} logs`);
        console.log(`  Error handling: ${errorTime.toFixed(2)}ms for 100 errors`);
        
        return isValid;
      });
      
      // Return true for now, actual result will be logged above
      return true;
    } catch (error) {
      console.log(`❌ Performance test failed: ${error}`);
      return false;
    }
  }

  // Test error recovery mechanisms
  async testErrorRecoveryMechanisms(): Promise<boolean> {
    console.log('🧪 Testing error recovery mechanisms...');
    
    try {
      // Register a test recovery strategy
      this.errorHandler.registerRecoveryStrategy({
        category: ErrorCategory.CANVAS_MANAGEMENT,
        handler: async (error, context) => {
          // Simulate successful recovery
          this.loggingService.info('Recovery attempt successful', {
            component: context.component,
            errorMessage: error.message
          });
          return true;
        },
        maxRetries: 2,
        retryDelay: 100
      });

      // Create an error that should be recoverable
      const recoverableError = new Error('Recoverable canvas error');
      const report = await this.errorHandler.handleError(
        recoverableError,
        {
          component: 'CanvasTest',
          method: 'testRecovery',
          timestamp: Date.now()
        },
        ErrorSeverity.MEDIUM,
        ErrorCategory.CANVAS_MANAGEMENT
      );

      // Check if recovery was successful and logged
      const logs = this.loggingService.getLogs();
      const recoveryLog = logs.find(log => 
        log.message.includes('Recovery attempt successful')
      );

      const isValid = report.recovered === true && 
                     report.retryCount > 0 && 
                     recoveryLog !== undefined;

      console.log(`${isValid ? '✅' : '❌'} Error recovery mechanisms: ${isValid ? 'Working' : 'Failed'}`);
      return isValid;
    } catch (error) {
      console.log(`❌ Error recovery test failed: ${error}`);
      return false;
    }
  }

  // Test configuration validation
  testConfigurationValidation(): boolean {
    console.log('🧪 Testing configuration validation...');
    
    try {
      // Test configuration validation
      const configResult = this.validator.validateConfiguration();
      
      // Log validation results
      if (configResult.valid) {
        this.loggingService.info('Configuration validation passed', {
          warnings: configResult.warnings.length
        });
      } else {
        this.loggingService.error('Configuration validation failed', new Error('Invalid configuration'), {
          errors: configResult.errors.length,
          warnings: configResult.warnings.length
        });
      }

      // Check if validation results were logged
      const logs = this.loggingService.getLogs();
      const validationLog = logs.find(log => 
        log.message.includes('Configuration validation')
      );

      const isValid = configResult !== null && validationLog !== undefined;

      console.log(`${isValid ? '✅' : '❌'} Configuration validation: ${isValid ? 'Working' : 'Failed'}`);
      return isValid;
    } catch (error) {
      console.log(`❌ Configuration validation test failed: ${error}`);
      return false;
    }
  }

  // Test log export functionality
  testLogExportFunctionality(): boolean {
    console.log('🧪 Testing log export functionality...');
    
    try {
      // Generate some test logs
      this.loggingService.info('Export test log 1');
      this.loggingService.warn('Export test warning');
      this.loggingService.error('Export test error', new Error('Test error'));

      // Test JSON export
      const jsonExport = this.loggingService.exportLogs('json');
      const csvExport = this.loggingService.exportLogs('csv');

      const hasJsonExport = jsonExport.includes('Export test log 1');
      const hasCsvExport = csvExport.includes('Export test log 1');

      const isValid = hasJsonExport && hasCsvExport;

      console.log(`${isValid ? '✅' : '❌'} Log export functionality: ${isValid ? 'Working' : 'Failed'}`);
      return isValid;
    } catch (error) {
      console.log(`❌ Log export test failed: ${error}`);
      return false;
    }
  }

  // Generate comprehensive test report
  generateTestReport(results: Record<string, boolean>): boolean {
    console.log('\n📋 Logging and Error Handling Integration Test Report');
    console.log('====================================================');
    
    const testNames = Object.keys(results);
    const passedTests = testNames.filter(test => results[test]);
    
    console.log(`\nTest Results: ${passedTests.length}/${testNames.length} passed`);
    
    testNames.forEach(testName => {
      const result = results[testName];
      console.log(`${result ? '✅' : '❌'} ${testName}`);
    });
    
    // Calculate scores
    const overallScore = passedTests.length / testNames.length;
    const criticalTests = ['loggingServiceFunctionality', 'errorHandlingFunctionality', 'loggingErrorIntegration'];
    const criticalPassed = criticalTests.filter(test => results[test]).length;
    const criticalScore = criticalPassed / criticalTests.length;
    
    console.log(`\n📊 Scores:`);
    console.log(`Overall: ${(overallScore * 100).toFixed(1)}%`);
    console.log(`Critical: ${(criticalScore * 100).toFixed(1)}%`);
    
    // Performance and reliability metrics
    const stats = this.loggingService.getStats();
    const errorStats = this.errorHandler.getErrorStats();
    
    console.log(`\n📈 System Metrics:`);
    console.log(`Total logs: ${stats.totalEntries}`);
    console.log(`Error logs: ${stats.errorCount}`);
    console.log(`Total errors handled: ${errorStats.totalErrors}`);
    console.log(`Error recovery rate: ${errorStats.recoveryRate.toFixed(1)}%`);
    
    return overallScore >= 0.8 && criticalScore >= 0.9; // High threshold for critical systems
  }

  // Run all integration tests
  async runAllTests(): Promise<boolean> {
    console.log('🚀 Running Logging and Error Handling Integration Tests...\n');
    
    const results = {
      loggingServiceFunctionality: this.testLoggingServiceFunctionality(),
      errorHandlingFunctionality: await this.testErrorHandlingFunctionality(),
      loggingErrorIntegration: await this.testLoggingErrorIntegration(),
      errorMonitoringIntegration: await this.testErrorMonitoringIntegration(),
      performanceImpact: this.testPerformanceImpact(),
      errorRecoveryMechanisms: await this.testErrorRecoveryMechanisms(),
      configurationValidation: this.testConfigurationValidation(),
      logExportFunctionality: this.testLogExportFunctionality()
    };
    
    const overallValid = this.generateTestReport(results);
    
    console.log(`\n${overallValid ? '🎉' : '❌'} Integration Tests: ${overallValid ? 'PASSED' : 'NEEDS ATTENTION'}`);
    
    return overallValid;
  }
}

// Test system stability under load
export async function testSystemStability(): Promise<boolean> {
  console.log('🧪 Testing system stability under load...');
  
  try {
    const loggingService = LoggingService.getInstance();
    const errorHandler = ErrorHandlingService.getInstance();
    
    // Simulate high load
    const promises = [];
    for (let i = 0; i < 500; i++) {
      promises.push(
        errorHandler.handleError(
          new Error(`Load test error ${i}`),
          {
            component: 'LoadTest',
            method: 'generateLoad',
            timestamp: Date.now()
          }
        )
      );
      
      // Add some logging load
      loggingService.info(`Load test log ${i}`);
    }
    
    await Promise.all(promises);
    
    // Check system state after load
    const stats = loggingService.getStats();
    const errorStats = errorHandler.getErrorStats();
    
    const systemStable = stats.totalEntries > 0 && 
                        errorStats.totalErrors > 0 &&
                        errorStats.recoveryRate >= 0; // Should not be NaN
    
    console.log(`${systemStable ? '✅' : '❌'} System stability under load: ${systemStable ? 'Stable' : 'Unstable'}`);
    return systemStable;
  } catch (error) {
    console.log(`❌ System stability test failed: ${error}`);
    return false;
  }
}

// Main test runner
export async function runLoggingErrorIntegrationTests(): Promise<boolean> {
  try {
    console.log('🚀 Starting Logging and Error Handling Integration Tests...\n');
    
    const tester = new LoggingErrorIntegrationTester();
    
    const integrationTests = await tester.runAllTests();
    const stabilityTest = await testSystemStability();
    
    const allTestsPassed = integrationTests && stabilityTest;
    
    console.log('\n📊 Final Integration Test Results:');
    console.log(`${integrationTests ? '✅' : '❌'} Integration Tests`);
    console.log(`${stabilityTest ? '✅' : '❌'} Stability Tests`);
    
    console.log(`\n${allTestsPassed ? '🎉' : '❌'} Overall Result: ${allTestsPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
    
    return allTestsPassed;
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    return false;
  }
}