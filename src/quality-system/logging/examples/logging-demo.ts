// Logging System Demonstration

import { AdvancedLogger } from '../AdvancedLogger';
import { LogManager } from '../LogManager';
import { getLoggerConfig } from '../LoggerConfig';
import { LogLevel } from '../../types';

async function demonstrateLoggingSystem() {
  console.log('🚀 Starting Logging System Demo\n');

  // 1. Basic Logger Usage
  console.log('📝 1. Basic Logger Usage');
  const logger = AdvancedLogger.getInstance(getLoggerConfig('development'));
  
  logger.debug('This is a debug message');
  logger.info('Application started successfully');
  logger.warn('This is a warning message');
  logger.error('This is an error message', new Error('Sample error'));
  logger.critical('This is a critical message', new Error('Critical error'));

  // 2. Context Management
  console.log('\n🔧 2. Context Management');
  logger.setGlobalContext({
    userId: 'user123',
    sessionId: 'session456',
    requestId: 'req789'
  });

  logger.info('Message with global context');
  logger.info('Another message with additional context', {
    action: 'login',
    ip: '192.168.1.1'
  });

  // 3. Performance Monitoring
  console.log('\n⏱️ 3. Performance Monitoring');
  const timerId = logger.startPerformanceTimer('database-query', {
    query: 'SELECT * FROM users',
    table: 'users'
  });

  // Simulate some work
  await new Promise(resolve => setTimeout(resolve, 100));

  logger.endPerformanceTimer(timerId, {
    rowsReturned: 42,
    cacheHit: false
  });

  // 4. Log Manager Features
  console.log('\n📊 4. Log Manager Features');
  const logManager = LogManager.getInstance();

  // Structured logging
  logManager.logUserAction('user123', 'login', {
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0...',
    success: true
  });

  logManager.logSystemEvent('service-started', {
    service: 'quality-system',
    version: '1.0.0',
    port: 3000
  });

  logManager.logBusinessEvent('purchase-completed', {
    orderId: 'order123',
    amount: 99.99,
    currency: 'USD',
    userId: 'user123'
  });

  // Security events
  logManager.logSecurityEvent('login-attempt', 'low', {
    userId: 'user123',
    success: true,
    ip: '192.168.1.1'
  });

  logManager.logSecurityEvent('failed-login', 'medium', {
    userId: 'user456',
    attempts: 3,
    ip: '10.0.0.1'
  });

  logManager.logSecurityEvent('brute-force-detected', 'high', {
    ip: '10.0.0.1',
    attempts: 50,
    timeWindow: '5 minutes'
  });

  // Health checks
  logManager.logHealthCheck('database', 'healthy', {
    responseTime: 45,
    connections: 10,
    maxConnections: 100
  });

  logManager.logHealthCheck('redis', 'degraded', {
    responseTime: 2000,
    memoryUsage: '85%'
  });

  logManager.logHealthCheck('external-api', 'unhealthy', {
    error: 'Connection timeout',
    lastSuccess: '2025-01-28T10:00:00Z'
  });

  // 5. Performance Monitor
  console.log('\n🎯 5. Performance Monitor');
  const monitor = logManager.createPerformanceMonitor('api-request', {
    endpoint: '/api/users',
    method: 'GET'
  });

  // Simulate API work
  await new Promise(resolve => setTimeout(resolve, 150));

  monitor.end({
    statusCode: 200,
    responseSize: 1024
  });

  // 6. Configuration Demo
  console.log('\n⚙️ 6. Configuration Demo');
  const currentConfig = logger.getConfig();
  console.log(`Current log level: ${LogLevel[currentConfig.level]}`);
  console.log(`Outputs enabled: ${currentConfig.outputs.filter(o => o.enabled).length}`);
  console.log(`Performance logging: ${currentConfig.enablePerformanceLogging}`);

  // Update configuration
  logger.updateConfig({
    level: LogLevel.WARN,
    enablePerformanceLogging: false
  });

  logger.debug('This debug message should not appear');
  logger.warn('This warning should appear');

  // Restore original config
  logger.updateConfig(currentConfig);

  // 7. Error Handling Demo
  console.log('\n🚨 7. Error Handling Demo');
  try {
    throw new Error('Simulated application error');
  } catch (error) {
    logger.error('Caught application error', error as Error, {
      component: 'demo',
      action: 'error-simulation',
      severity: 'medium'
    });
  }

  // 8. Cleanup
  console.log('\n🧹 8. Cleanup');
  await new Promise(resolve => setTimeout(resolve, 100)); // Wait for async logs
  
  logger.info('Demo completed, shutting down logger');
  await logger.shutdown();
  await logManager.shutdown();

  console.log('\n🎉 Logging System Demo completed successfully!');
}

// Run the demo if this file is executed directly
if (require.main === module) {
  demonstrateLoggingSystem().catch(console.error);
}

export { demonstrateLoggingSystem };