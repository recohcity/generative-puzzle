/**
 * ValidationService - Configuration validation and runtime checks
 * Provides comprehensive validation for configurations, data, and runtime state
 */

import { LoggingService } from './LoggingService';
import { ErrorHandlingService, ErrorSeverity, ErrorCategory } from './ErrorHandlingService';

export interface ValidationRule<T = any> {
  name: string;
  validator: (value: T) => boolean | string;
  required?: boolean;
  errorMessage?: string;
}

export interface ValidationSchema {
  [key: string]: ValidationRule | ValidationRule[];
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
  rule?: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  value?: any;
}

export class ValidationService {
  private static instance: ValidationService;
  private logger: LoggingService;
  private errorHandler: ErrorHandlingService;
  private validationSchemas: Map<string, ValidationSchema> = new Map();

  private constructor() {
    this.logger = LoggingService.getInstance();
    this.errorHandler = ErrorHandlingService.getInstance();
    this.setupDefaultSchemas();
  }

  public static getInstance(): ValidationService {
    if (!ValidationService.instance) {
      ValidationService.instance = new ValidationService();
    }
    return ValidationService.instance;
  }

  /**
   * Register a validation schema
   */
  public registerSchema(name: string, schema: ValidationSchema): void {
    this.validationSchemas.set(name, schema);
  }

  /**
   * Validate data against a schema
   */
  public validate(data: any, schemaName: string): ValidationResult {
    const schema = this.validationSchemas.get(schemaName);
    if (!schema) {
      throw new Error(`Validation schema '${schemaName}' not found`);
    }

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    Object.entries(schema).forEach(([field, rules]) => {
      const fieldRules = Array.isArray(rules) ? rules : [rules];
      const value = this.getNestedValue(data, field);

      fieldRules.forEach(rule => {
        try {
          const result = rule.validator(value);
          
          if (result === false || typeof result === 'string') {
            const error: ValidationError = {
              field,
              message: typeof result === 'string' ? result : (rule.errorMessage || `Validation failed for ${field}`),
              value,
              rule: rule.name
            };

            if (rule.required !== false) {
              errors.push(error);
            } else {
              warnings.push({
                field: error.field,
                message: error.message,
                value: error.value
              });
            }
          }
        } catch (validationError) {
          errors.push({
            field,
            message: `Validation error: ${(validationError as Error).message}`,
            value,
            rule: rule.name
          });
        }
      });
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate configuration objects
   */
  public validateConfiguration(): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Validate device configuration
      const deviceConfigResult = this.validateDeviceConfig();
      errors.push(...deviceConfigResult.errors);
      warnings.push(...deviceConfigResult.warnings);

      // Validate adaptation configuration
      const adaptationConfigResult = this.validateAdaptationConfig();
      errors.push(...adaptationConfigResult.errors);
      warnings.push(...adaptationConfigResult.warnings);

      // Validate performance configuration
      const performanceConfigResult = this.validatePerformanceConfig();
      errors.push(...performanceConfigResult.errors);
      warnings.push(...performanceConfigResult.warnings);

      // Validate logging configuration
      const loggingConfigResult = this.validateLoggingConfig();
      errors.push(...loggingConfigResult.errors);
      warnings.push(...loggingConfigResult.warnings);

    } catch (error) {
      errors.push({
        field: 'configuration',
        message: `Configuration validation failed: ${(error as Error).message}`
      });
    }

    const result = {
      valid: errors.length === 0,
      errors,
      warnings
    };

    // Log validation results
    if (result.valid) {
      this.logger.info('Configuration validation passed', {
        warnings: warnings.length
      });
    } else {
      this.logger.error('Configuration validation failed', new Error('Invalid configuration'), {
        errors: errors.length,
        warnings: warnings.length
      });
    }

    return result;
  }

  /**
   * Runtime validation for critical operations
   */
  public validateRuntime(operation: string, data: any): boolean {
    try {
      switch (operation) {
        case 'canvas-size':
          return this.validateCanvasSize(data);
        case 'device-state':
          return this.validateDeviceState(data);
        case 'puzzle-pieces':
          return this.validatePuzzlePieces(data);
        case 'adaptation-params':
          return this.validateAdaptationParams(data);
        default:
          this.logger.warn(`Unknown runtime validation operation: ${operation}`);
          return true;
      }
    } catch (error) {
      this.errorHandler.handleError(error as Error, {
        component: 'ValidationService',
        method: 'validateRuntime',
        timestamp: Date.now(),
        additionalData: { operation, data }
      }, ErrorSeverity.MEDIUM, ErrorCategory.VALIDATION);
      return false;
    }
  }

  /**
   * Create a validator for a specific component
   */
  public createComponentValidator(component: string) {
    return {
      validateRequired: (value: any, fieldName: string) => {
        if (value === null || value === undefined || value === '') {
          throw new Error(`${fieldName} is required in ${component}`);
        }
        return true;
      },

      validateType: (value: any, expectedType: string, fieldName: string) => {
        const actualType = typeof value;
        if (actualType !== expectedType) {
          throw new Error(`${fieldName} in ${component} must be ${expectedType}, got ${actualType}`);
        }
        return true;
      },

      validateRange: (value: number, min: number, max: number, fieldName: string) => {
        if (value < min || value > max) {
          throw new Error(`${fieldName} in ${component} must be between ${min} and ${max}, got ${value}`);
        }
        return true;
      },

      validateArray: (value: any, fieldName: string, minLength = 0) => {
        if (!Array.isArray(value)) {
          throw new Error(`${fieldName} in ${component} must be an array`);
        }
        if (value.length < minLength) {
          throw new Error(`${fieldName} in ${component} must have at least ${minLength} items`);
        }
        return true;
      },

      validateObject: (value: any, fieldName: string, requiredKeys: string[] = []) => {
        if (typeof value !== 'object' || value === null) {
          throw new Error(`${fieldName} in ${component} must be an object`);
        }
        
        const missingKeys = requiredKeys.filter(key => !(key in value));
        if (missingKeys.length > 0) {
          throw new Error(`${fieldName} in ${component} missing required keys: ${missingKeys.join(', ')}`);
        }
        return true;
      }
    };
  }

  /**
   * Setup default validation schemas
   */
  private setupDefaultSchemas(): void {
    // Device configuration schema
    this.registerSchema('deviceConfig', {
      'thresholds.mobile': {
        name: 'mobileThreshold',
        validator: (value) => typeof value === 'number' && value > 0 && value < 2000,
        errorMessage: 'Mobile threshold must be a positive number less than 2000'
      },
      'thresholds.tablet': {
        name: 'tabletThreshold',
        validator: (value) => typeof value === 'number' && value > 0 && value < 3000,
        errorMessage: 'Tablet threshold must be a positive number less than 3000'
      },
      'iPhone16Models': {
        name: 'iPhone16Models',
        validator: (value) => typeof value === 'object' && value !== null,
        errorMessage: 'iPhone16Models must be an object'
      }
    });

    // Canvas size schema
    this.registerSchema('canvasSize', {
      'width': {
        name: 'canvasWidth',
        validator: (value) => typeof value === 'number' && value > 0 && value <= 4000,
        errorMessage: 'Canvas width must be a positive number not exceeding 4000'
      },
      'height': {
        name: 'canvasHeight',
        validator: (value) => typeof value === 'number' && value > 0 && value <= 4000,
        errorMessage: 'Canvas height must be a positive number not exceeding 4000'
      }
    });

    // Puzzle pieces schema
    this.registerSchema('puzzlePieces', {
      'length': {
        name: 'puzzleCount',
        validator: (value) => typeof value === 'number' && value > 0 && value <= 1000,
        errorMessage: 'Puzzle pieces count must be between 1 and 1000'
      }
    });
  }

  /**
   * Specific validation methods
   */
  private validateDeviceConfig(): ValidationResult {
    try {
      const { DEVICE_THRESHOLDS, IPHONE16_MODELS } = require('../src/config/deviceConfig');
      return this.validate({ thresholds: DEVICE_THRESHOLDS, iPhone16Models: IPHONE16_MODELS }, 'deviceConfig');
    } catch (error) {
      return {
        valid: false,
        errors: [{ field: 'deviceConfig', message: `Failed to load device config: ${(error as Error).message}` }],
        warnings: []
      };
    }
  }

  private validateAdaptationConfig(): ValidationResult {
    try {
      const { DESKTOP_ADAPTATION, MOBILE_ADAPTATION } = require('../src/config/adaptationConfig');
      
      const errors: ValidationError[] = [];
      const warnings: ValidationWarning[] = [];

      // Validate desktop adaptation
      if (!DESKTOP_ADAPTATION || typeof DESKTOP_ADAPTATION !== 'object') {
        errors.push({ field: 'DESKTOP_ADAPTATION', message: 'Desktop adaptation config is missing or invalid' });
      }

      // Validate mobile adaptation
      if (!MOBILE_ADAPTATION || typeof MOBILE_ADAPTATION !== 'object') {
        errors.push({ field: 'MOBILE_ADAPTATION', message: 'Mobile adaptation config is missing or invalid' });
      }

      return { valid: errors.length === 0, errors, warnings };
    } catch (error) {
      return {
        valid: false,
        errors: [{ field: 'adaptationConfig', message: `Failed to load adaptation config: ${(error as Error).message}` }],
        warnings: []
      };
    }
  }

  private validatePerformanceConfig(): ValidationResult {
    try {
      const { PERFORMANCE_THRESHOLDS, EVENT_CONFIG } = require('../src/config/performanceConfig');
      
      const errors: ValidationError[] = [];
      const warnings: ValidationWarning[] = [];

      if (!PERFORMANCE_THRESHOLDS) {
        errors.push({ field: 'PERFORMANCE_THRESHOLDS', message: 'Performance thresholds config is missing' });
      }

      if (!EVENT_CONFIG) {
        errors.push({ field: 'EVENT_CONFIG', message: 'Event config is missing' });
      }

      return { valid: errors.length === 0, errors, warnings };
    } catch (error) {
      return {
        valid: false,
        errors: [{ field: 'performanceConfig', message: `Failed to load performance config: ${(error as Error).message}` }],
        warnings: []
      };
    }
  }

  private validateLoggingConfig(): ValidationResult {
    try {
      const { getLoggingConfig } = require('../src/config/loggingConfig');
      const config = getLoggingConfig();
      
      const errors: ValidationError[] = [];
      const warnings: ValidationWarning[] = [];

      if (!config || typeof config !== 'object') {
        errors.push({ field: 'loggingConfig', message: 'Logging config is missing or invalid' });
      } else {
        if (typeof config.level !== 'number') {
          errors.push({ field: 'loggingConfig.level', message: 'Logging level must be a number' });
        }
        if (typeof config.enableConsole !== 'boolean') {
          errors.push({ field: 'loggingConfig.enableConsole', message: 'enableConsole must be a boolean' });
        }
      }

      return { valid: errors.length === 0, errors, warnings };
    } catch (error) {
      return {
        valid: false,
        errors: [{ field: 'loggingConfig', message: `Failed to load logging config: ${(error as Error).message}` }],
        warnings: []
      };
    }
  }

  private validateCanvasSize(data: any): boolean {
    const result = this.validate(data, 'canvasSize');
    if (!result.valid) {
      result.errors.forEach(error => {
        this.logger.warn(`Canvas size validation error: ${error.message}`, {
          field: error.field,
          value: error.value
        });
      });
    }
    return result.valid;
  }

  private validateDeviceState(data: any): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }

    const requiredFields = ['deviceType', 'layoutMode', 'screenWidth', 'screenHeight'];
    return requiredFields.every(field => field in data);
  }

  private validatePuzzlePieces(data: any): boolean {
    if (!Array.isArray(data)) {
      return false;
    }

    const result = this.validate({ length: data.length }, 'puzzlePieces');
    return result.valid && data.every(piece => 
      piece && 
      typeof piece === 'object' && 
      typeof piece.x === 'number' && 
      typeof piece.y === 'number' &&
      Array.isArray(piece.points)
    );
  }

  private validateAdaptationParams(data: any): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }

    return (
      data.fromCanvasSize && this.validateCanvasSize(data.fromCanvasSize) &&
      data.toCanvasSize && this.validateCanvasSize(data.toCanvasSize)
    );
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}