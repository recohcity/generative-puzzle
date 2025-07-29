/**
 * Quality Gate Configuration
 * 
 * Defines quality thresholds and rules for CI/CD pipeline
 */

module.exports = {
  // Overall quality gate settings
  qualityGate: {
    enabled: true,
    minimumScore: 70,
    failOnThreshold: false, // Set to true to fail builds on threshold breach
    requiredChecks: [
      'TypeScript Compilation',
      'Test Coverage'
    ]
  },

  // Individual check thresholds
  thresholds: {
    typescript: {
      minimumScore: 80,
      maxErrors: 0,
      maxWarnings: 10
    },
    eslint: {
      minimumScore: 70,
      maxErrors: 0,
      maxWarnings: 20
    },
    coverage: {
      minimumCoverage: 60,
      minimumBranchCoverage: 50,
      minimumFunctionCoverage: 70
    },
    complexity: {
      maxCyclomaticComplexity: 10,
      maxCognitiveComplexity: 15,
      minimumMaintainabilityIndex: 60
    }
  },

  // Reporting configuration
  reporting: {
    enabled: true,
    formats: ['json', 'markdown', 'html'],
    outputPath: './quality-reports',
    includeDetails: true,
    archiveReports: true,
    retentionDays: 30
  },

  // Notification settings
  notifications: {
    enabled: process.env.CI === 'true',
    channels: ['github'],
    onSuccess: false,
    onFailure: true,
    onWarning: true,
    webhookUrl: process.env.QUALITY_WEBHOOK_URL,
    slackChannel: process.env.SLACK_CHANNEL
  },

  // Environment-specific overrides
  environments: {
    development: {
      qualityGate: {
        minimumScore: 50,
        failOnThreshold: false
      },
      notifications: {
        enabled: false
      }
    },
    staging: {
      qualityGate: {
        minimumScore: 70,
        failOnThreshold: false
      }
    },
    production: {
      qualityGate: {
        minimumScore: 80,
        failOnThreshold: true
      },
      thresholds: {
        coverage: {
          minimumCoverage: 80
        }
      }
    }
  },

  // Integration settings
  integrations: {
    github: {
      enabled: true,
      createCommitStatus: true,
      commentOnPR: true,
      updateCheckRuns: true
    },
    codecov: {
      enabled: true,
      uploadCoverage: true,
      failOnError: false
    },
    sonarqube: {
      enabled: false,
      serverUrl: process.env.SONAR_HOST_URL,
      token: process.env.SONAR_TOKEN
    }
  },

  // Custom rules
  customRules: [
    {
      name: 'No console.log in production',
      pattern: 'console\\.log',
      severity: 'warning',
      excludePatterns: ['**/*.test.ts', '**/*.spec.ts']
    },
    {
      name: 'TODO comments check',
      pattern: 'TODO|FIXME|HACK',
      severity: 'info',
      maxCount: 10
    }
  ]
};