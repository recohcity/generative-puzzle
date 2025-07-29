// Error Handling System Demonstration

import {
  AdvancedErrorHandlingService,
  ValidationError,
  NetworkError,
  SystemError,
  BusinessLogicError,
  ErrorCategory,
  ErrorSeverity
} from '../index';

// Mock services for demo
class MockLogger {
  debug(message: string, context?: any): void {
    console.log(`🔍 DEBUG: ${message}`, context ? JSON.stringify(context, null, 2) : '');
  }
  
  info(message: string, context?: any): void {
    console.log(`ℹ️ INFO: ${message}`, context ? JSON.stringify(context, null, 2) : '');
  }
  
  warn(message: string, context?: any): void {
    console.log(`⚠️ WARN: ${message}`, context ? JSON.stringify(context, null, 2) : '');
  }
  
  error(message: string, error?: Error, context?: any): void {
    console.log(`❌ ERROR: ${message}`, error?.message || '', context ? JSON.stringify(context, null, 2) : '');
  }
  
  critical(message: string, error?: Error, context?: any): void {
    console.log(`🚨 CRITICAL: ${message}`, error?.message || '', context ? JSON.stringify(context, null, 2) : '');
  }
  
  async getLogHistory(): Promise<any[]> { return []; }
  async clearLogs(): Promise<void> {}
}

class MockNotificationService {
  async sendTaskNotification(taskId: string, type: string): Promise<void> {
    console.log(`📧 Task notification: ${type} for task ${taskId}`);
  }
  
  async sendQualityAlert(message: string, severity: string): Promise<void> {
    console.log(`🔔 Quality alert [${severity}]: ${message}`);
  }
  
  async sendProgressUpdate(milestone: string, progress: number): Promise<void> {
    console.log(`📊 Progress update: ${milestone} - ${progress}%`);
  }
  
  async subscribeToNotifications(): Promise<void> {}
  async unsubscribeFromNotifications(): Promise<void> {}
}

async function demonstrateErrorHandling() {
  console.log('🚀 Starting Error Handling System Demo\n');

  const logger = new MockLogger();
  const notificationService = new MockNotificationService();
  const errorHandlingService = new AdvancedErrorHandlingService(logger as any, notificationService as any);

  // 1. Error Type Creation
  console.log('📝 1. Creating Different Error Types');
  
  const validationError = new ValidationError('Email is required', 'email', '');
  console.log(`✅ Validation Error: ${validationError.message}`);
  console.log(`   Category: ${validationError.category}, Severity: ${validationError.severity}`);
  console.log(`   Retryable: ${validationError.metadata.retryable}, Max Retries: ${validationError.metadata.maxRetries}`);

  const networkError = new NetworkError('Connection timeout', 'https://api.example.com', 408);
  console.log(`✅ Network Error: ${networkError.message}`);
  console.log(`   URL: ${networkError.context.url}, Status: ${networkError.context.statusCode}`);
  console.log(`   Retryable: ${networkError.metadata.retryable}, Max Retries: ${networkError.metadata.maxRetries}`);

  const systemError = new SystemError('Database connection failed', 'database');
  console.log(`✅ System Error: ${systemError.message}`);
  console.log(`   Component: ${systemError.context.systemComponent}`);
  console.log(`   User Notification: ${systemError.metadata.userNotification}, Team Notification: ${systemError.metadata.teamNotification}`);

  // 2. Error Factory Functions (Direct Creation)
  console.log('\n🏭 2. Creating More Error Examples');
  
  const factoryValidationError = new ValidationError('Password too weak', 'password', 'abc');
  console.log(`✅ Additional Validation Error: ${factoryValidationError.message}`);
  
  const factoryNetworkError = new NetworkError('API rate limit exceeded', 'https://api.service.com', 429);
  console.log(`✅ Additional Network Error: ${factoryNetworkError.message}`);
  
  const factorySystemError = new SystemError('Memory allocation failed', 'memory-manager');
  console.log(`✅ Additional System Error: ${factorySystemError.message}`);

  // 3. Error Classification
  console.log('\n🔍 3. Error Classification');
  
  const regularErrors = [
    new Error('Validation failed: invalid email format'),
    new Error('Network connection timeout'),
    new Error('Authentication token expired'),
    new Error('Database query failed'),
    new Error('Unknown system error')
  ];

  for (const error of regularErrors) {
    const classification = errorHandlingService.classifyError(error);
    console.log(`✅ "${error.message}" → ${classification}`);
  }

  // 4. Error Handling
  console.log('\n🛠️ 4. Error Handling Process');
  
  const testErrors = [validationError, networkError, systemError];
  
  for (const error of testErrors) {
    console.log(`\n--- Handling ${error.constructor.name} ---`);
    
    errorHandlingService.handleError(error, {
      component: 'demo-component',
      action: 'demo-action',
      severity: error.severity.toLowerCase() as any,
      recoverable: error.metadata.retryable
    });
  }

  // 5. Error Statistics
  console.log('\n📊 5. Error Statistics');
  
  const stats = await errorHandlingService.getErrorStatistics();
  console.log('✅ Error Statistics:', JSON.stringify(stats, null, 2));

  const detailedStats = errorHandlingService.getDetailedStatistics();
  console.log('✅ Detailed Statistics:');
  console.log(`   Total Errors: ${detailedStats.totalErrors}`);
  console.log(`   Recovery Success Rate: ${(detailedStats.recoverySuccessRate * 100).toFixed(1)}%`);
  console.log(`   Critical Errors (24h): ${detailedStats.criticalErrorsLast24h}`);

  // 6. Error Patterns
  console.log('\n🔄 6. Error Patterns');
  
  // Create some duplicate errors to show pattern detection
  const duplicateError1 = new ValidationError('Email format invalid');
  const duplicateError2 = new ValidationError('Email format invalid');
  const duplicateError3 = new NetworkError('Connection timeout');

  [duplicateError1, duplicateError2, duplicateError3].forEach(error => {
    errorHandlingService.handleError(error, {
      component: 'pattern-demo',
      action: 'test',
      severity: 'medium',
      recoverable: false
    });
  });

  const patterns = errorHandlingService.getErrorPatterns();
  console.log('✅ Error Patterns:');
  patterns.forEach(pattern => {
    console.log(`   ${pattern.pattern}: ${pattern.frequency} occurrences, ${pattern.category} category`);
    console.log(`   Suggested Fix: ${pattern.suggestedFix}`);
  });

  // 7. Error Serialization
  console.log('\n📄 7. Error Serialization');
  
  const businessError = new BusinessLogicError('Order limit exceeded', 'max-orders-per-day');
  const serialized = businessError.toJSON();
  console.log('✅ Serialized Error:', JSON.stringify(serialized, null, 2));

  // 8. Circuit Breaker Status
  console.log('\n⚡ 8. Circuit Breaker Status');
  
  const circuitStatus = errorHandlingService.getCircuitBreakerStatus();
  console.log('✅ Circuit Breaker Status:', JSON.stringify(circuitStatus, null, 2));

  console.log('\n🎉 Error Handling System Demo completed successfully!');
}

// Run the demo if this file is executed directly
if (require.main === module) {
  demonstrateErrorHandling().catch(console.error);
}

export { demonstrateErrorHandling };