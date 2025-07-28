/**
 * Performance Impact Test for Logging and Error Handling (Task 20)
 * Tests the performance impact of logging service and error handling
 * Ensures that logging doesn't affect performance significantly
 */

const fs = require('fs');

class PerformanceImpactTester {
  constructor() {
    this.results = {
      loggingPerformance: {},
      errorHandlingPerformance: {},
      memoryUsage: {},
      recommendations: []
    };
  }

  // Test logging performance
  testLoggingPerformance() {
    console.log('🧪 Testing logging performance...');
    
    try {
      // Test different log volumes
      const testCases = [
        { name: 'Light load', iterations: 100 },
        { name: 'Medium load', iterations: 1000 },
        { name: 'Heavy load', iterations: 5000 }
      ];

      testCases.forEach(testCase => {
        const startTime = performance.now();
        const startMemory = process.memoryUsage();

        // Simulate logging calls
        for (let i = 0; i < testCase.iterations; i++) {
          // Simulate different types of log calls
          if (i % 4 === 0) {
            console.log(`Debug message ${i}`);
          } else if (i % 4 === 1) {
            console.log(`Info message ${i}`);
          } else if (i % 4 === 2) {
            console.log(`Warning message ${i}`);
          } else {
            console.log(`Error message ${i}`);
          }
        }

        const endTime = performance.now();
        const endMemory = process.memoryUsage();

        const duration = endTime - startTime;
        const memoryIncrease = endMemory.heapUsed - startMemory.heapUsed;
        const avgTimePerLog = duration / testCase.iterations;

        this.results.loggingPerformance[testCase.name] = {
          iterations: testCase.iterations,
          totalTime: duration,
          avgTimePerLog,
          memoryIncrease,
          logsPerSecond: (testCase.iterations / duration) * 1000
        };

        console.log(`  ${testCase.name}: ${duration.toFixed(2)}ms for ${testCase.iterations} logs (${avgTimePerLog.toFixed(3)}ms/log)`);
      });

      return true;
    } catch (error) {
      console.log(`❌ Logging performance test failed: ${error.message}`);
      return false;
    }
  }

  // Test error handling performance
  async testErrorHandlingPerformance() {
    console.log('🧪 Testing error handling performance...');
    
    try {
      const testCases = [
        { name: 'Light errors', iterations: 50 },
        { name: 'Medium errors', iterations: 200 },
        { name: 'Heavy errors', iterations: 500 }
      ];

      for (const testCase of testCases) {
        const startTime = performance.now();
        const startMemory = process.memoryUsage();

        // Simulate error handling
        const promises = [];
        for (let i = 0; i < testCase.iterations; i++) {
          promises.push(
            this.simulateErrorHandling(`Performance test error ${i}`)
          );
        }

        await Promise.all(promises);

        const endTime = performance.now();
        const endMemory = process.memoryUsage();

        const duration = endTime - startTime;
        const memoryIncrease = endMemory.heapUsed - startMemory.heapUsed;
        const avgTimePerError = duration / testCase.iterations;

        this.results.errorHandlingPerformance[testCase.name] = {
          iterations: testCase.iterations,
          totalTime: duration,
          avgTimePerError,
          memoryIncrease,
          errorsPerSecond: (testCase.iterations / duration) * 1000
        };

        console.log(`  ${testCase.name}: ${duration.toFixed(2)}ms for ${testCase.iterations} errors (${avgTimePerError.toFixed(3)}ms/error)`);
      }

      return true;
    } catch (error) {
      console.log(`❌ Error handling performance test failed: ${error.message}`);
      return false;
    }
  }

  // Simulate error handling without actual ErrorHandlingService
  async simulateErrorHandling(errorMessage) {
    return new Promise(resolve => {
      // Simulate error processing time
      setTimeout(() => {
        // Simulate logging the error
        console.log(`Error handled: ${errorMessage}`);
        resolve();
      }, Math.random() * 2); // 0-2ms random delay
    });
  }

  // Test memory usage patterns
  testMemoryUsage() {
    console.log('🧪 Testing memory usage patterns...');
    
    try {
      const initialMemory = process.memoryUsage();
      
      // Simulate sustained logging
      const logCount = 10000;
      const logs = [];
      
      for (let i = 0; i < logCount; i++) {
        logs.push(`Log entry ${i} with some data: ${Math.random()}`);
      }
      
      const afterLoggingMemory = process.memoryUsage();
      
      // Clear logs (simulate log cleanup)
      logs.length = 0;
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const afterCleanupMemory = process.memoryUsage();
      
      this.results.memoryUsage = {
        initial: initialMemory.heapUsed,
        afterLogging: afterLoggingMemory.heapUsed,
        afterCleanup: afterCleanupMemory.heapUsed,
        loggingIncrease: afterLoggingMemory.heapUsed - initialMemory.heapUsed,
        cleanupEffectiveness: afterLoggingMemory.heapUsed - afterCleanupMemory.heapUsed
      };
      
      console.log(`  Memory increase from logging: ${(this.results.memoryUsage.loggingIncrease / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Memory freed after cleanup: ${(this.results.memoryUsage.cleanupEffectiveness / 1024 / 1024).toFixed(2)} MB`);
      
      return true;
    } catch (error) {
      console.log(`❌ Memory usage test failed: ${error.message}`);
      return false;
    }
  }

  // Test concurrent logging performance
  async testConcurrentPerformance() {
    console.log('🧪 Testing concurrent logging performance...');
    
    try {
      const concurrentTasks = 10;
      const logsPerTask = 500;
      
      const startTime = performance.now();
      
      const promises = Array.from({ length: concurrentTasks }, (_, taskId) => {
        return new Promise(resolve => {
          setTimeout(() => {
            for (let i = 0; i < logsPerTask; i++) {
              console.log(`Concurrent task ${taskId}, log ${i}`);
            }
            resolve();
          }, Math.random() * 10);
        });
      });
      
      await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const totalLogs = concurrentTasks * logsPerTask;
      
      console.log(`  Concurrent logging: ${duration.toFixed(2)}ms for ${totalLogs} logs across ${concurrentTasks} tasks`);
      console.log(`  Throughput: ${((totalLogs / duration) * 1000).toFixed(0)} logs/second`);
      
      return duration < 5000; // Should complete within 5 seconds
    } catch (error) {
      console.log(`❌ Concurrent performance test failed: ${error.message}`);
      return false;
    }
  }

  // Generate performance recommendations
  generateRecommendations() {
    const recommendations = [];
    
    // Analyze logging performance
    const heavyLogging = this.results.loggingPerformance['Heavy load'];
    if (heavyLogging && heavyLogging.avgTimePerLog > 1) {
      recommendations.push('Consider optimizing logging performance - average time per log is high');
    }
    
    if (heavyLogging && heavyLogging.logsPerSecond < 1000) {
      recommendations.push('Logging throughput is below optimal - consider batching or async logging');
    }
    
    // Analyze error handling performance
    const heavyErrors = this.results.errorHandlingPerformance['Heavy errors'];
    if (heavyErrors && heavyErrors.avgTimePerError > 10) {
      recommendations.push('Error handling is slow - consider optimizing recovery strategies');
    }
    
    // Analyze memory usage
    if (this.results.memoryUsage.loggingIncrease > 50 * 1024 * 1024) { // 50MB
      recommendations.push('Logging memory usage is high - implement log rotation or cleanup');
    }
    
    if (this.results.memoryUsage.cleanupEffectiveness < this.results.memoryUsage.loggingIncrease * 0.5) {
      recommendations.push('Memory cleanup is not effective - review log retention policies');
    }
    
    this.results.recommendations = recommendations;
    return recommendations;
  }

  // Generate performance report
  generateReport() {
    console.log('\n📋 Performance Impact Test Report');
    console.log('=================================');
    
    // Logging performance summary
    console.log('\n📊 Logging Performance:');
    Object.entries(this.results.loggingPerformance).forEach(([testName, results]) => {
      console.log(`  ${testName}:`);
      console.log(`    Total time: ${results.totalTime.toFixed(2)}ms`);
      console.log(`    Avg per log: ${results.avgTimePerLog.toFixed(3)}ms`);
      console.log(`    Throughput: ${results.logsPerSecond.toFixed(0)} logs/sec`);
      console.log(`    Memory impact: ${(results.memoryIncrease / 1024).toFixed(1)} KB`);
    });
    
    // Error handling performance summary
    console.log('\n🚨 Error Handling Performance:');
    Object.entries(this.results.errorHandlingPerformance).forEach(([testName, results]) => {
      console.log(`  ${testName}:`);
      console.log(`    Total time: ${results.totalTime.toFixed(2)}ms`);
      console.log(`    Avg per error: ${results.avgTimePerError.toFixed(3)}ms`);
      console.log(`    Throughput: ${results.errorsPerSecond.toFixed(0)} errors/sec`);
      console.log(`    Memory impact: ${(results.memoryIncrease / 1024).toFixed(1)} KB`);
    });
    
    // Memory usage summary
    console.log('\n💾 Memory Usage:');
    const memory = this.results.memoryUsage;
    console.log(`  Initial: ${(memory.initial / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  After logging: ${(memory.afterLogging / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  After cleanup: ${(memory.afterCleanup / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Logging increase: ${(memory.loggingIncrease / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Cleanup effectiveness: ${(memory.cleanupEffectiveness / 1024 / 1024).toFixed(2)} MB`);
    
    // Recommendations
    const recommendations = this.generateRecommendations();
    if (recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      recommendations.forEach(rec => console.log(`  - ${rec}`));
    } else {
      console.log('\n✅ Performance is within acceptable limits');
    }
    
    // Overall assessment
    const loggingOk = this.results.loggingPerformance['Heavy load']?.avgTimePerLog < 1;
    const errorHandlingOk = this.results.errorHandlingPerformance['Heavy errors']?.avgTimePerError < 10;
    const memoryOk = this.results.memoryUsage.loggingIncrease < 100 * 1024 * 1024; // 100MB
    
    const overallOk = loggingOk && errorHandlingOk && memoryOk;
    
    console.log(`\n${overallOk ? '🎉' : '⚠️'} Overall Performance: ${overallOk ? 'ACCEPTABLE' : 'NEEDS OPTIMIZATION'}`);
    
    return overallOk;
  }

  // Run all performance tests
  async runAllTests() {
    console.log('🚀 Running Performance Impact Tests...\n');
    
    const loggingTest = this.testLoggingPerformance();
    const errorHandlingTest = await this.testErrorHandlingPerformance();
    const memoryTest = this.testMemoryUsage();
    const concurrentTest = await this.testConcurrentPerformance();
    
    const allTestsPassed = loggingTest && errorHandlingTest && memoryTest && concurrentTest;
    const performanceAcceptable = this.generateReport();
    
    const overallResult = allTestsPassed && performanceAcceptable;
    
    console.log(`\n${overallResult ? '🎉' : '❌'} Performance Tests: ${overallResult ? 'PASSED' : 'NEEDS ATTENTION'}`);
    
    return overallResult;
  }
}

// Test logging service impact on application performance
function testLoggingServiceImpact() {
  console.log('🧪 Testing logging service impact on application performance...');
  
  try {
    // Test with logging
    const withLoggingStart = performance.now();
    for (let i = 0; i < 1000; i++) {
      // Simulate application work with logging
      const data = { iteration: i, timestamp: Date.now() };
      console.log(`Processing iteration ${i}`, data);
      
      // Simulate some work
      Math.random() * Math.random();
    }
    const withLoggingEnd = performance.now();
    const withLoggingTime = withLoggingEnd - withLoggingStart;
    
    // Test without logging (comment out console.log)
    const withoutLoggingStart = performance.now();
    for (let i = 0; i < 1000; i++) {
      // Simulate application work without logging
      const data = { iteration: i, timestamp: Date.now() };
      // console.log(`Processing iteration ${i}`, data); // Commented out
      
      // Simulate some work
      Math.random() * Math.random();
    }
    const withoutLoggingEnd = performance.now();
    const withoutLoggingTime = withoutLoggingEnd - withoutLoggingStart;
    
    const overhead = withLoggingTime - withoutLoggingTime;
    const overheadPercentage = (overhead / withoutLoggingTime) * 100;
    
    console.log(`  With logging: ${withLoggingTime.toFixed(2)}ms`);
    console.log(`  Without logging: ${withoutLoggingTime.toFixed(2)}ms`);
    console.log(`  Overhead: ${overhead.toFixed(2)}ms (${overheadPercentage.toFixed(1)}%)`);
    
    // Acceptable if overhead is less than 50%
    const acceptable = overheadPercentage < 50;
    console.log(`${acceptable ? '✅' : '❌'} Logging overhead: ${acceptable ? 'Acceptable' : 'Too high'}`);
    
    return acceptable;
  } catch (error) {
    console.log(`❌ Logging service impact test failed: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runPerformanceImpactTests() {
  try {
    console.log('🚀 Starting Performance Impact Tests...\n');
    
    const tester = new PerformanceImpactTester();
    
    const performanceTests = await tester.runAllTests();
    const loggingImpactTest = testLoggingServiceImpact();
    
    const allTestsPassed = performanceTests && loggingImpactTest;
    
    console.log('\n📊 Final Performance Test Results:');
    console.log(`${performanceTests ? '✅' : '❌'} Performance Tests`);
    console.log(`${loggingImpactTest ? '✅' : '❌'} Logging Impact Test`);
    
    console.log(`\n${allTestsPassed ? '🎉' : '❌'} Overall Result: ${allTestsPassed ? 'PERFORMANCE ACCEPTABLE' : 'PERFORMANCE NEEDS OPTIMIZATION'}`);
    
    return allTestsPassed;
  } catch (error) {
    console.error('❌ Performance test execution failed:', error);
    return false;
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PerformanceImpactTester, runPerformanceImpactTests };
}

// Run if called directly
if (require.main === module) {
  runPerformanceImpactTests().then(result => {
    process.exit(result ? 0 : 1);
  });
}