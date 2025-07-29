// Development Configuration for Quality System

export const developmentConfig = {
  // Quality thresholds
  qualityThresholds: {
    overall: 75,
    typescript: 80,
    eslint: 70,
    testCoverage: 65,
    complexity: 70,
    duplication: 85
  },

  // Logging configuration
  logging: {
    level: 'DEBUG',
    enableConsoleOutput: true,
    enableFileOutput: false,
    maxLogEntries: 1000
  },

  // Error handling configuration
  errorHandling: {
    enableRetries: true,
    maxRetries: 3,
    retryDelay: 1000,
    enableUserNotifications: true,
    enableTeamNotifications: false
  },

  // Quality check configuration
  qualityChecks: {
    enableTypeScriptCheck: true,
    enableESLintCheck: true,
    enableTestCoverageCheck: true,
    enableComplexityCheck: true,
    enableDuplicationCheck: true,
    checkInterval: 300000, // 5 minutes
    autoRunOnFileChange: false
  },

  // Task management configuration
  taskManagement: {
    enableDependencyValidation: true,
    enableAutoAssignment: false,
    defaultPriority: 'P2',
    enableProgressTracking: true
  },

  // Integration settings
  integrations: {
    eslint: {
      configPath: '.eslintrc.js',
      enableAutoFix: false
    },
    typescript: {
      configPath: 'tsconfig.json',
      enableStrictMode: true
    },
    jest: {
      configPath: 'jest.config.js',
      coverageThreshold: 65
    }
  },

  // Development specific settings
  development: {
    enableMockServices: true,
    enableDebugMode: true,
    skipExternalDependencies: true,
    enableHotReload: true
  }
};

export type QualitySystemConfig = typeof developmentConfig;