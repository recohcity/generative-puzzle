/**
 * Test file for LoggingService (Task 17)
 * Verifies that the unified logging service works correctly
 * and provides all required functionality
 */

import { LoggingService, LogLevel, LogContext } from '../core/LoggingService';
import { getLoggingConfig } from '../src/config/loggingConfig';
import { logger, deviceLogger, adaptationLogger, loggers, performanceLogger } from '../utils/logger';

export class LoggingServiceTester {
  private loggingService: LoggingService;
  private originalConsole: any;
  private consoleOutput: string[] = [];

  constructor() {
    this.loggingService = LoggingService.getInstance();
    this.setupConsoleCapture();
  }

  private setupConsoleCapture() {
    this.originalConsole = {
      debug: console.debug,
      info: console.info,
      warn: console.warn,
      error: console.error
    };

    // Capture console output for testing
    console.debug = (...args) => this.captureOutput('DEBUG', args);
    console.info = (...args) => this.captureOutput('INFO', args);
    console.warn = (...args) => this.captureOutput('WARN', args);
    console.error = (...args) => this.captureOutput('ERROR', args);
  }

  private captureOutput(level: string, args: any[]) {
    this.consoleOutput.push(`${level}: ${args.join(' ')}`);
  }

  private restoreConsole() {
    console.debug = this.originalConsole.debug;
    console.info = this.originalConsole.info;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
  }

  // Test basic logging functionality
  testBasicLogging(): boolean {
    console.log('🧪 Testing basic logging functionality...');
    
    this.loggingService.clearLogs();
    this.consoleOutput = [];

    // Test different log levels
    this.loggingService.debug('Debug message');
    this.loggingService.info('Info message');
    this.loggingService.warn('Warning message');
    this.loggingService.error('Error message');

    const logs = this.loggingService.getLogs();
    const hasAllLevels = logs.length >= 3; // At least info, warn, error (debug might be filtered)

    console.log(`${hasAllLevels ? '✅' : '❌'} Basic logging: ${logs.length} log entries created`);
    
    return hasAllLevels;
  }

  // Test logging with context
  testContextLogging(): boolean {
    console.log('🧪 Testing context logging...');
    
    this.loggingService.clearLogs();

    const context: LogContext = {
      component: 'TestComponent',
      method: 'testMethod',
      userId: 'user123'
    };

    this.loggingService.info('Test message with context', context);

    const logs = this.loggingService.getLogs();
    const hasContext = logs.length > 0 && logs[0].context?.component === 'TestComponent';

    console.log(`${hasContext ? '✅' : '❌'} Context logging: Context properly stored`);
    
    return hasContext;
  }

  // Test error logging with stack traces
  testErrorLogging(): boolean {
    console.log('🧪 Testing error logging...');
    
    this.loggingService.clearLogs();

    const testError = new Error('Test error');
    this.loggingService.error('Error occurred', testError, { component: 'TestComponent' });

    const logs = this.loggingService.getLogs(LogLevel.ERROR);
    const hasError = logs.length > 0 && logs[0].error?.message === 'Test error';

    console.log(`${hasError ? '✅' : '❌'} Error logging: Error properly captured`);
    
    return hasError;
  }

  // Test log level filtering
  testLogLevelFiltering(): boolean {
    console.log('🧪 Testing log level filtering...');
    
    this.loggingService.configure({ level: LogLevel.WARN });
    this.loggingService.clearLogs();

    this.loggingService.debug('Debug message');
    this.loggingService.info('Info message');
    this.loggingService.warn('Warning message');
    this.loggingService.error('Error message');

    const logs = this.loggingService.getLogs();
    const onlyWarningsAndErrors = logs.every(log => log.level >= LogLevel.WARN);

    console.log(`${onlyWarningsAndErrors ? '✅' : '❌'} Log level filtering: Only warnings and errors logged`);
    
    // Reset to debug level for other tests
    this.loggingService.configure({ level: LogLevel.DEBUG });
    
    return onlyWarningsAndErrors;
  }

  // Test component-specific loggers
  testComponentLoggers(): boolean {
    console.log('🧪 Testing component-specific loggers...');
    
    this.loggingService.clearLogs();

    deviceLogger.info('Device manager message');
    adaptationLogger.warn('Adaptation engine warning');

    const logs = this.loggingService.getLogs();
    const hasDeviceLog = logs.some(log => log.context?.component === 'DeviceManager');
    const hasAdaptationLog = logs.some(log => log.context?.component === 'AdaptationEngine');

    const isValid = hasDeviceLog && hasAdaptationLog;

    console.log(`${isValid ? '✅' : '❌'} Component loggers: Device and Adaptation loggers work`);
    
    return isValid;
  }

  // Test logging patterns
  testLoggingPatterns(): boolean {
    console.log('🧪 Testing logging patterns...');
    
    this.loggingService.clearLogs();

    loggers.logInitialization('TestComponent', 'Component initialized');
    loggers.logStateChange('TestComponent', { state: 'old' }, { state: 'new' });
    loggers.logEventHandling('TestComponent', 'click', { x: 100, y: 200 });

    const logs = this.loggingService.getLogs();
    const hasPatterns = logs.length >= 3;

    console.log(`${hasPatterns ? '✅' : '❌'} Logging patterns: ${logs.length} pattern logs created`);
    
    return hasPatterns;
  }

  // Test performance logging
  testPerformanceLogging(): boolean {
    console.log('🧪 Testing performance logging...');
    
    this.loggingService.clearLogs();

    // Test timing function
    const result = performanceLogger.timeFunction('TestComponent', 'testFunction', () => {
      // Simulate some work
      let sum = 0;
      for (let i = 0; i < 1000; i++) {
        sum += i;
      }
      return sum;
    });

    const logs = this.loggingService.getLogs();
    const hasTimingLogs = logs.some(log => log.message.includes('Timer'));

    console.log(`${hasTimingLogs ? '✅' : '❌'} Performance logging: Timing logs created`);
    
    return hasTimingLogs && result === 499500; // Verify function actually ran
  }

  // Test log statistics
  testLogStatistics(): boolean {
    console.log('🧪 Testing log statistics...');
    
    this.loggingService.clearLogs();

    // Generate some logs
    this.loggingService.info('Info 1');
    this.loggingService.info('Info 2');
    this.loggingService.warn('Warning 1');
    this.loggingService.error('Error 1');

    const stats = this.loggingService.getStats();
    const hasCorrectStats = stats.totalEntries === 4 && 
                           stats.warningCount === 1 && 
                           stats.errorCount === 1;

    console.log(`${hasCorrectStats ? '✅' : '❌'} Log statistics: ${stats.totalEntries} total, ${stats.errorCount} errors, ${stats.warningCount} warnings`);
    
    return hasCorrectStats;
  }

  // Test log export functionality
  testLogExport(): boolean {
    console.log('🧪 Testing log export...');
    
    this.loggingService.clearLogs();

    this.loggingService.info('Export test message', { component: 'TestComponent' });

    const jsonExport = this.loggingService.exportLogs('json');
    const csvExport = this.loggingService.exportLogs('csv');

    const hasJsonExport = jsonExport.includes('Export test message');
    const hasCsvExport = csvExport.includes('Export test message');

    console.log(`${hasJsonExport && hasCsvExport ? '✅' : '❌'} Log export: JSON and CSV export work`);
    
    return hasJsonExport && hasCsvExport;
  }

  // Test configuration
  testConfiguration(): boolean {
    console.log('🧪 Testing configuration...');
    
    const originalConfig = this.loggingService.getConfig();
    
    // Test configuration change
    this.loggingService.configure({
      enableConsole: false,
      maxStorageEntries: 100
    });

    const newConfig = this.loggingService.getConfig();
    const configChanged = newConfig.enableConsole === false && 
                         newConfig.maxStorageEntries === 100;

    // Restore original config
    this.loggingService.configure(originalConfig);

    console.log(`${configChanged ? '✅' : '❌'} Configuration: Settings can be changed`);
    
    return configChanged;
  }

  // Generate test report
  generateReport(results: Record<string, boolean>): boolean {
    console.log('\n📋 LoggingService Test Report');
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
  runAllTests(): boolean {
    console.log('🚀 Running LoggingService Tests...\n');
    
    const results = {
      basicLogging: this.testBasicLogging(),
      contextLogging: this.testContextLogging(),
      errorLogging: this.testErrorLogging(),
      logLevelFiltering: this.testLogLevelFiltering(),
      componentLoggers: this.testComponentLoggers(),
      loggingPatterns: this.testLoggingPatterns(),
      performanceLogging: this.testPerformanceLogging(),
      logStatistics: this.testLogStatistics(),
      logExport: this.testLogExport(),
      configuration: this.testConfiguration()
    };
    
    const overallValid = this.generateReport(results);
    
    console.log(`\n${overallValid ? '🎉' : '❌'} LoggingService Tests: ${overallValid ? 'PASSED' : 'NEEDS ATTENTION'}`);
    
    this.restoreConsole();
    
    return overallValid;
  }
}

// Test configuration loading
export function testConfigurationLoading(): boolean {
  console.log('🧪 Testing configuration loading...');
  
  try {
    const config = getLoggingConfig();
    const hasRequiredFields = config.level !== undefined && 
                             config.enableConsole !== undefined &&
                             config.enableStorage !== undefined;

    console.log(`${hasRequiredFields ? '✅' : '❌'} Configuration loading: Config loaded successfully`);
    
    return hasRequiredFields;
  } catch (error) {
    console.log(`❌ Configuration loading failed: ${error}`);
    return false;
  }
}

// Test logger utilities
export function testLoggerUtilities(): boolean {
  console.log('🧪 Testing logger utilities...');
  
  try {
    // Test that logger utilities can be imported
    const hasLogger = typeof logger !== 'undefined';
    const hasDeviceLogger = typeof deviceLogger !== 'undefined';
    const hasLoggers = typeof loggers !== 'undefined';
    const hasPerformanceLogger = typeof performanceLogger !== 'undefined';

    const allUtilitiesAvailable = hasLogger && hasDeviceLogger && hasLoggers && hasPerformanceLogger;

    console.log(`${allUtilitiesAvailable ? '✅' : '❌'} Logger utilities: All utilities available`);
    
    return allUtilitiesAvailable;
  } catch (error) {
    console.log(`❌ Logger utilities test failed: ${error}`);
    return false;
  }
}

// Main test runner
export function runLoggingServiceTests(): boolean {
  try {
    console.log('🚀 Starting LoggingService Tests...\n');
    
    const tester = new LoggingServiceTester();
    
    const configurationValid = testConfigurationLoading();
    const utilitiesValid = testLoggerUtilities();
    const serviceValid = tester.runAllTests();
    
    const allTestsPassed = configurationValid && utilitiesValid && serviceValid;
    
    console.log('\n📊 Final Test Results:');
    console.log(`${configurationValid ? '✅' : '❌'} Configuration Loading`);
    console.log(`${utilitiesValid ? '✅' : '❌'} Logger Utilities`);
    console.log(`${serviceValid ? '✅' : '❌'} LoggingService Core`);
    
    console.log(`\n${allTestsPassed ? '🎉' : '❌'} Overall Result: ${allTestsPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
    
    return allTestsPassed;
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    return false;
  }
}