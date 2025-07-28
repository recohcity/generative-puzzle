/**
 * Unified Configuration Export
 * Central export point for all configuration modules
 */

// Import all configurations
import {
  DEVICE_THRESHOLDS,
  IPHONE16_MODELS,
  DETECTION_CONFIG,
  LARGE_SCREEN_THRESHOLDS,
  USER_AGENT_PATTERNS,
  type DeviceType,
  type LayoutMode,
  type iPhone16Model,
  type DeviceState,
  type iPhone16Detection,
  type DeviceLayoutInfo,
} from './deviceConfig';

import {
  DESKTOP_ADAPTATION,
  MOBILE_ADAPTATION,
  IPHONE16_OPTIMIZATION,
  HIGH_RESOLUTION_MOBILE,
  CANVAS_SAFETY,
  type AdaptationContext,
  type AdaptationResult,
  type CanvasSizeResult,
} from './adaptationConfig';

import {
  EVENT_CONFIG,
  MEMORY_CONFIG,
  PERFORMANCE_THRESHOLDS,
  OPTIMIZATION_FLAGS,
  BROWSER_SUPPORT,
  ERROR_HANDLING,
  LOGGING_CONFIG,
  type PerformanceMetrics,
  type PerformanceThresholds,
  type EventTimingConfig,
} from './performanceConfig';

import { logger } from '../../utils/logger';

// Re-export all configurations
export {
  // Device configuration
  DEVICE_THRESHOLDS,
  IPHONE16_MODELS,
  DETECTION_CONFIG,
  LARGE_SCREEN_THRESHOLDS,
  USER_AGENT_PATTERNS,
  type DeviceType,
  type LayoutMode,
  type iPhone16Model,
  type DeviceState,
  type iPhone16Detection,
  type DeviceLayoutInfo,
  
  // Adaptation configuration
  DESKTOP_ADAPTATION,
  MOBILE_ADAPTATION,
  IPHONE16_OPTIMIZATION,
  HIGH_RESOLUTION_MOBILE,
  CANVAS_SAFETY,
  type AdaptationContext,
  type AdaptationResult,
  type CanvasSizeResult,
  
  // Performance configuration
  EVENT_CONFIG,
  MEMORY_CONFIG,
  PERFORMANCE_THRESHOLDS,
  OPTIMIZATION_FLAGS,
  BROWSER_SUPPORT,
  ERROR_HANDLING,
  LOGGING_CONFIG,
  type PerformanceMetrics,
  type PerformanceThresholds,
  type EventTimingConfig,
};

// Unified configuration object for backward compatibility
export const UNIFIED_CONFIG = {
  // Device detection
  device: {
    thresholds: DEVICE_THRESHOLDS,
    iPhone16Models: IPHONE16_MODELS,
    detection: DETECTION_CONFIG,
    largeScreen: LARGE_SCREEN_THRESHOLDS,
    userAgent: USER_AGENT_PATTERNS,
  },
  
  // Adaptation parameters
  adaptation: {
    desktop: DESKTOP_ADAPTATION,
    mobile: MOBILE_ADAPTATION,
    iPhone16: IPHONE16_OPTIMIZATION,
    highResMobile: HIGH_RESOLUTION_MOBILE,
    safety: CANVAS_SAFETY,
  },
  
  // Performance settings
  performance: {
    events: EVENT_CONFIG,
    memory: MEMORY_CONFIG,
    thresholds: PERFORMANCE_THRESHOLDS,
    optimization: OPTIMIZATION_FLAGS,
    browser: BROWSER_SUPPORT,
    errorHandling: ERROR_HANDLING,
    logging: LOGGING_CONFIG,
  },
} as const;

// Legacy compatibility exports (to be gradually phased out)
export const ADAPTATION_CONFIG = {
  DESKTOP: DESKTOP_ADAPTATION,
  MOBILE: MOBILE_ADAPTATION,
  THRESHOLDS: DEVICE_THRESHOLDS,
} as const;

// Configuration validation utilities
export function validateConfig(): boolean {
  try {
    // Basic validation checks
    const hasDeviceConfig = DEVICE_THRESHOLDS && IPHONE16_MODELS;
    const hasAdaptationConfig = DESKTOP_ADAPTATION && MOBILE_ADAPTATION;
    const hasPerformanceConfig = EVENT_CONFIG && PERFORMANCE_THRESHOLDS;
    
    if (!hasDeviceConfig) {
      logger.error('Device configuration validation failed');
      return false;
    }
    
    if (!hasAdaptationConfig) {
      logger.error('Adaptation configuration validation failed');
      return false;
    }
    
    if (!hasPerformanceConfig) {
      logger.error('Performance configuration validation failed');
      return false;
    }
    
    logger.info('Configuration validation passed');
    return true;
  } catch (error) {
    logger.error('Configuration validation error', error as Error);
    return false;
  }
}

// Configuration info for debugging
export function getConfigInfo() {
  return {
    deviceModels: Object.keys(IPHONE16_MODELS).length,
    adaptationModes: ['desktop', 'mobile-portrait', 'mobile-landscape'],
    performanceFlags: Object.keys(OPTIMIZATION_FLAGS).filter(
      key => OPTIMIZATION_FLAGS[key as keyof typeof OPTIMIZATION_FLAGS]
    ),
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  };
}