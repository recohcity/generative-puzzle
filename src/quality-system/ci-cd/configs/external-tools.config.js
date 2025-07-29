/**
 * External Tools Configuration
 * 
 * Configuration for integrating with external quality analysis tools
 * like SonarQube, Code Climate, Snyk, etc.
 */

module.exports = {
  // SonarQube Configuration
  sonarqube: {
    enabled: process.env.SONAR_ENABLED === 'true',
    serverUrl: process.env.SONAR_HOST_URL || 'http://localhost:9000',
    token: process.env.SONAR_TOKEN,
    projectKey: process.env.SONAR_PROJECT_KEY || 'quality-improvement-system',
    projectName: 'Code Quality Improvement System',
    projectVersion: '1.0.0',
    sources: 'src',
    tests: 'src',
    testInclusions: '**/*.test.ts,**/*.spec.ts',
    exclusions: '**/node_modules/**,**/dist/**,**/coverage/**,**/*.d.ts',
    coverageReportPaths: 'coverage/lcov.info',
    qualityGate: {
      wait: true,
      abortPipeline: false
    },
    branch: {
      name: process.env.BRANCH_NAME,
      target: process.env.TARGET_BRANCH || 'main'
    },
    pullRequest: {
      key: process.env.PR_NUMBER,
      branch: process.env.PR_BRANCH,
      base: process.env.PR_BASE
    }
  },

  // Code Climate Configuration
  codeclimate: {
    enabled: process.env.CC_ENABLED === 'true',
    repoToken: process.env.CC_TEST_REPORTER_ID,
    apiUrl: 'https://api.codeclimate.com',
    testReporter: {
      enabled: true,
      coverageFormat: 'lcov',
      coverageLocation: 'coverage/lcov.info'
    },
    excludePatterns: [
      'node_modules/**/*',
      'dist/**/*',
      '**/*.test.ts',
      '**/*.spec.ts',
      '**/examples/**',
      '**/demo/**'
    ],
    checks: {
      argumentCount: { threshold: 5 },
      complexLogic: { threshold: 4 },
      fileLines: { threshold: 500 },
      methodComplexity: { threshold: 10 },
      methodCount: { threshold: 20 },
      methodLines: { threshold: 50 },
      nestedControlFlow: { threshold: 4 },
      returnStatements: { threshold: 4 },
      similarCode: { threshold: 70 },
      identicalCode: { threshold: 50 }
    }
  },

  // Snyk Security Configuration
  snyk: {
    enabled: process.env.SNYK_ENABLED === 'true',
    token: process.env.SNYK_TOKEN,
    org: process.env.SNYK_ORG,
    apiUrl: 'https://api.snyk.io',
    severityThreshold: process.env.SNYK_SEVERITY_THRESHOLD || 'medium',
    failOn: process.env.SNYK_FAIL_ON || 'upgradable',
    monitor: process.env.SNYK_MONITOR === 'true',
    includeDevDeps: process.env.SNYK_INCLUDE_DEV === 'true',
    exclude: [
      '**/*.test.ts',
      '**/*.spec.ts',
      '**/test/**',
      '**/tests/**',
      '**/examples/**',
      '**/demo/**',
      '**/coverage/**',
      '**/dist/**'
    ],
    docker: {
      enabled: false,
      dockerfilePath: 'Dockerfile',
      excludeBaseImageVulns: false
    }
  },

  // DeepSource Configuration
  deepsource: {
    enabled: process.env.DEEPSOURCE_ENABLED === 'true',
    dsn: process.env.DEEPSOURCE_DSN,
    apiUrl: 'https://api.deepsource.io',
    repository: process.env.DEEPSOURCE_REPO,
    branch: process.env.BRANCH_NAME || 'main',
    analyzers: [
      {
        name: 'javascript',
        enabled: true,
        meta: {
          environment: ['nodejs'],
          module_system: 'es6'
        }
      },
      {
        name: 'test-coverage',
        enabled: true,
        meta: {
          coverage_file_path: 'coverage/lcov.info'
        }
      }
    ],
    exclude_patterns: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      '**/*.test.ts',
      '**/*.spec.ts'
    ]
  },

  // Codeacy Configuration
  codeacy: {
    enabled: process.env.CODEACY_ENABLED === 'true',
    projectToken: process.env.CODEACY_PROJECT_TOKEN,
    apiToken: process.env.CODEACY_API_TOKEN,
    apiUrl: 'https://api.codeacy.com',
    username: process.env.CODEACY_USERNAME,
    projectName: process.env.CODEACY_PROJECT_NAME,
    language: 'TypeScript',
    coverageReports: [
      {
        language: 'TypeScript',
        report: 'coverage/lcov.info'
      }
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      '**/*.test.ts',
      '**/*.spec.ts',
      '**/examples/**',
      '**/demo/**'
    ]
  },

  // Generic Webhook Configuration
  webhook: {
    enabled: process.env.WEBHOOK_ENABLED === 'true',
    url: process.env.WEBHOOK_URL,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': process.env.WEBHOOK_AUTH_HEADER
    },
    payload: {
      project: 'quality-improvement-system',
      branch: process.env.BRANCH_NAME,
      commit: process.env.COMMIT_SHA,
      timestamp: new Date().toISOString()
    },
    timeout: 30000,
    retries: 3
  },

  // Integration Settings
  integration: {
    // Run tools in parallel for faster execution
    parallel: true,
    
    // Maximum concurrent tools
    maxConcurrency: 3,
    
    // Timeout for each tool (in milliseconds)
    toolTimeout: 300000, // 5 minutes
    
    // Retry failed tools
    retryFailedTools: true,
    maxRetries: 2,
    
    // Continue on tool failures
    continueOnFailure: true,
    
    // Aggregate results
    aggregateResults: true,
    
    // Report generation
    generateReports: true,
    reportFormats: ['json', 'markdown', 'html'],
    reportOutputPath: './quality-reports',
    
    // Notifications
    notifications: {
      onSuccess: process.env.NOTIFY_ON_SUCCESS === 'true',
      onFailure: process.env.NOTIFY_ON_FAILURE !== 'false',
      onImprovement: process.env.NOTIFY_ON_IMPROVEMENT === 'true',
      channels: ['github', 'webhook']
    }
  },

  // Environment-specific overrides
  environments: {
    development: {
      sonarqube: { enabled: false },
      codeclimate: { enabled: false },
      snyk: { enabled: true, severityThreshold: 'high' },
      integration: { continueOnFailure: true }
    },
    
    staging: {
      sonarqube: { enabled: true, qualityGate: { abortPipeline: false } },
      codeclimate: { enabled: true },
      snyk: { enabled: true, severityThreshold: 'medium' },
      integration: { continueOnFailure: true }
    },
    
    production: {
      sonarqube: { enabled: true, qualityGate: { abortPipeline: true } },
      codeclimate: { enabled: true },
      snyk: { enabled: true, severityThreshold: 'low' },
      integration: { continueOnFailure: false }
    }
  }
};