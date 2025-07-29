// Basic Error Handling Tests (No Async Issues)

import {
  ValidationError,
  NetworkError,
  SystemError,
  ErrorCategory,
  ErrorSeverity,
  createValidationError,
  createNetworkError,
  createSystemError
} from '../index';

describe('Error Types', () => {
  describe('ValidationError', () => {
    it('should create validation error with correct properties', () => {
      const error = new ValidationError('Email is required', 'email', '');
      
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.context.field).toBe('email');
      expect(error.metadata.retryable).toBe(false);
      expect(error.correlationId).toBeDefined();
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should have proper error metadata', () => {
      const error = new ValidationError('Invalid input');
      
      expect(error.metadata.userNotification).toBe(true);
      expect(error.metadata.teamNotification).toBe(false);
      expect(error.metadata.maxRetries).toBe(0);
    });
  });

  describe('NetworkError', () => {
    it('should create network error with correct properties', () => {
      const error = new NetworkError('Connection timeout', 'https://api.example.com', 408);
      
      expect(error.category).toBe(ErrorCategory.NETWORK);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.context.url).toBe('https://api.example.com');
      expect(error.context.statusCode).toBe(408);
      expect(error.metadata.retryable).toBe(true);
    });

    it('should have retry configuration', () => {
      const error = new NetworkError('Network failed');
      
      expect(error.metadata.maxRetries).toBe(3);
      expect(error.metadata.retryDelay).toBe(2000);
      expect(error.metadata.backoffMultiplier).toBe(2);
    });
  });

  describe('SystemError', () => {
    it('should create system error with correct properties', () => {
      const error = new SystemError('Database connection failed', 'database');
      
      expect(error.category).toBe(ErrorCategory.SYSTEM);
      expect(error.severity).toBe(ErrorSeverity.CRITICAL);
      expect(error.context.systemComponent).toBe('database');
      expect(error.metadata.userNotification).toBe(true);
      expect(error.metadata.teamNotification).toBe(true);
    });
  });

  describe('Error Serialization', () => {
    it('should serialize error to JSON', () => {
      const error = new ValidationError('Test error', 'testField', 'testValue');
      const json = error.toJSON();
      
      expect(json.name).toBe('ValidationError');
      expect(json.message).toBe('Test error');
      expect(json.category).toBe(ErrorCategory.VALIDATION);
      expect(json.severity).toBe(ErrorSeverity.MEDIUM);
      expect(json.correlationId).toBeDefined();
      expect(json.timestamp).toBeDefined();
      expect(json.context.field).toBe('testField');
      expect(json.context.value).toBe('testValue');
    });
  });
});

describe('Error Factory Functions', () => {
  it('should create validation error using factory', () => {
    const error = createValidationError('Email required', 'email', '');
    
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.category).toBe(ErrorCategory.VALIDATION);
    expect(error.context.field).toBe('email');
  });

  it('should create network error using factory', () => {
    const error = createNetworkError('Timeout', 'https://api.test.com', 408);
    
    expect(error).toBeInstanceOf(NetworkError);
    expect(error.category).toBe(ErrorCategory.NETWORK);
    expect(error.context.url).toBe('https://api.test.com');
  });

  it('should create system error using factory', () => {
    const error = createSystemError('System failure', 'auth-service');
    
    expect(error).toBeInstanceOf(SystemError);
    expect(error.category).toBe(ErrorCategory.SYSTEM);
    expect(error.context.systemComponent).toBe('auth-service');
  });
});

describe('Error Categories and Severities', () => {
  it('should have all error categories defined', () => {
    expect(ErrorCategory.SYSTEM).toBeDefined();
    expect(ErrorCategory.BUSINESS).toBeDefined();
    expect(ErrorCategory.VALIDATION).toBeDefined();
    expect(ErrorCategory.NETWORK).toBeDefined();
    expect(ErrorCategory.AUTHENTICATION).toBeDefined();
    expect(ErrorCategory.AUTHORIZATION).toBeDefined();
    expect(ErrorCategory.RESOURCE).toBeDefined();
    expect(ErrorCategory.EXTERNAL).toBeDefined();
    expect(ErrorCategory.CONFIGURATION).toBeDefined();
    expect(ErrorCategory.DATA).toBeDefined();
  });

  it('should have all error severities defined', () => {
    expect(ErrorSeverity.LOW).toBeDefined();
    expect(ErrorSeverity.MEDIUM).toBeDefined();
    expect(ErrorSeverity.HIGH).toBeDefined();
    expect(ErrorSeverity.CRITICAL).toBeDefined();
  });
});

describe('Error Context and Metadata', () => {
  it('should generate unique correlation IDs', () => {
    const error1 = new ValidationError('Error 1');
    const error2 = new ValidationError('Error 2');
    
    expect(error1.correlationId).not.toBe(error2.correlationId);
    expect(error1.correlationId).toMatch(/^err_\d+_[a-z0-9]+$/);
  });

  it('should set timestamps correctly', () => {
    const before = new Date();
    const error = new ValidationError('Test error');
    const after = new Date();
    
    expect(error.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(error.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('should track retry counts', () => {
    const error = new NetworkError('Network error');
    
    expect(error.retryCount).toBe(0);
    expect(error.recoveryAttempts).toBe(0);
    
    error.retryCount = 2;
    error.recoveryAttempts = 1;
    
    expect(error.retryCount).toBe(2);
    expect(error.recoveryAttempts).toBe(1);
  });
});