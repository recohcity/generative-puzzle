// Configuration management for Quality System

import { developmentConfig, QualitySystemConfig } from './development';

// Environment detection
const getEnvironment = (): 'development' | 'production' | 'test' => {
  if (process.env.NODE_ENV === 'test') return 'test';
  if (process.env.NODE_ENV === 'production') return 'production';
  return 'development';
};

// Configuration loader
export const loadConfig = (): QualitySystemConfig => {
  const env = getEnvironment();
  
  switch (env) {
    case 'development':
    case 'test':
      return developmentConfig;
    case 'production':
      // In production, we would load from environment variables or config files
      return {
        ...developmentConfig,
        development: {
          ...developmentConfig.development,
          enableMockServices: false,
          enableDebugMode: false,
          skipExternalDependencies: false
        },
        logging: {
          ...developmentConfig.logging,
          level: 'INFO',
          enableConsoleOutput: false,
          enableFileOutput: true
        }
      };
    default:
      return developmentConfig;
  }
};

// Export current configuration
export const config = loadConfig();

// Configuration validation
export const validateConfig = (config: QualitySystemConfig): boolean => {
  // Basic validation
  if (!config.qualityThresholds || typeof config.qualityThresholds.overall !== 'number') {
    console.error('Invalid quality thresholds configuration');
    return false;
  }
  
  if (!config.logging || !config.logging.level) {
    console.error('Invalid logging configuration');
    return false;
  }
  
  if (!config.qualityChecks) {
    console.error('Invalid quality checks configuration');
    return false;
  }
  
  return true;
};

// Ensure configuration is valid on load
if (!validateConfig(config)) {
  throw new Error('Invalid Quality System configuration');
}

export { QualitySystemConfig } from './development';