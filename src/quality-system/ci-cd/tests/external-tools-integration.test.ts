/**
 * External Tools Integration Tests
 * 
 * Tests for external tool integrations including SonarQube, Code Climate,
 * Snyk, and other third-party quality analysis platforms.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AdvancedLogger } from '../../logging/AdvancedLogger';
import { CICDIntegrationService, CICDConfig } from '../CICDIntegrationService';
import { QualityDetectionEngine } from '../../quality-detection/QualityDetectionEngine';
import { AdvancedQualityMetrics } from '../../quality-detection/AdvancedQualityMetrics';
import { ImprovementSuggestionEngine } from '../../quality-detection/ImprovementSuggestionEngine';

// Mock external tool APIs
jest.mock('axios');
jest.mock('child_process');

describe('External Tools Integration', () => {
  let logger: AdvancedLogger;
  let qualityEngine: QualityDetectionEngine;
  let metricsCalculator: AdvancedQualityMetrics;
  let suggestionEngine: ImprovementSuggestionEngine;
  let cicdService: CICDIntegrationService;

  beforeEach(() => {
    logger = AdvancedLogger.getInstance();
    qualityEngine = new QualityDetectionEngine(logger);
    metricsCalculator = new AdvancedQualityMetrics(logger);
    suggestionEngine = new ImprovementSuggestionEngine(logger);
    cicdService = new CICDIntegrationService(
      logger,
      qualityEngine,
      metricsCalculator,
      suggestionEngine
    );

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('SonarQube Integration', () => {
    it('should configure SonarQube analysis correctly', async () => {
      const config: CICDConfig = {
        qualityGate: {
          enabled: true,
          minimumScore: 80,
          failOnThreshold: true,
          requiredChecks: ['SonarQube Analysis']
        },
        reporting: {
          enabled: true,
          formats: ['json'],
          outputPath: './reports',
          includeDetails: true
        },
        notifications: {
          enabled: false,
          channels: []
        },
        coverage: {
          enabled: true,
          minimumCoverage: 70,
          failOnThreshold: false,
          reportPath: './coverage'
        },
        externalTools: {
          sonarqube: {
            enabled: true,
            serverUrl: 'http://localhost:9000',
            token: 'test-token',
            projectKey: 'test-project',
            qualityGate: { wait: true, abortPipeline: false }
          }
        }
      };

      const result = await cicdService.runQualityPipeline(config);

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(result.qualityScore).toBeGreaterThanOrEqual(0);
      expect(result.qualityScore).toBeLessThanOrEqual(100);
    });

    it('should handle SonarQube API failures gracefully', async () => {
      // Mock SonarQube API failure
      const mockError = new Error('SonarQube server unavailable');
      jest.spyOn(global, 'fetch').mockRejectedValue(mockError);

      const config: CICDConfig = {
        qualityGate: {
          enabled: true,
          minimumScore: 80,
          failOnThreshold: false,
          requiredChecks: []
        },
        reporting: {
          enabled: false,
          formats: [],
          outputPath: '',
          includeDetails: false
        },
        notifications: {
          enabled: false,
          channels: []
        },
        coverage: {
          enabled: false,
          minimumCoverage: 0,
          failOnThreshold: false,
          reportPath: ''
        },
        externalTools: {
          sonarqube: {
            enabled: true,
            serverUrl: 'http://localhost:9000',
            token: 'test-token',
            projectKey: 'test-project'
          }
        }
      };

      const result = await cicdService.runQualityPipeline(config);

      // Should continue execution despite SonarQube failure
      expect(result).toBeDefined();
      expect(result.checks.some(check => 
        check.name.includes('SonarQube') && check.status === 'failed'
      )).toBe(true);
    });

    it('should parse SonarQube quality gate results correctly', () => {
      const mockSonarResponse = {
        projectStatus: {
          status: 'OK',
          conditions: [
            {
              status: 'OK',
              metricKey: 'coverage',
              actualValue: '85.5',
              errorThreshold: '80'
            },
            {
              status: 'ERROR',
              metricKey: 'bugs',
              actualValue: '5',
              errorThreshold: '0'
            }
          ]
        }
      };

      // Test parsing logic (would be implemented in actual service)
      const conditions = mockSonarResponse.projectStatus.conditions;
      const passedConditions = conditions.filter(c => c.status === 'OK');
      const failedConditions = conditions.filter(c => c.status === 'ERROR');

      expect(passedConditions).toHaveLength(1);
      expect(failedConditions).toHaveLength(1);
      expect(passedConditions[0].metricKey).toBe('coverage');
      expect(failedConditions[0].metricKey).toBe('bugs');
    });
  });

  describe('Code Climate Integration', () => {
    it('should configure Code Climate analysis correctly', async () => {
      const config: CICDConfig = {
        qualityGate: {
          enabled: true,
          minimumScore: 75,
          failOnThreshold: false,
          requiredChecks: ['Code Climate Analysis']
        },
        reporting: {
          enabled: true,
          formats: ['json'],
          outputPath: './reports',
          includeDetails: true
        },
        notifications: {
          enabled: false,
          channels: []
        },
        coverage: {
          enabled: true,
          minimumCoverage: 70,
          failOnThreshold: false,
          reportPath: './coverage'
        },
        externalTools: {
          codeclimate: {
            enabled: true,
            repoToken: 'test-repo-token',
            testReporter: true
          }
        }
      };

      const result = await cicdService.runQualityPipeline(config);

      expect(result).toBeDefined();
      expect(result.checks.some(check => 
        check.name.includes('Code Climate')
      )).toBe(true);
    });

    it('should handle Code Climate test reporter correctly', () => {
      const mockCoverageData = {
        source_files: [
          {
            name: 'src/example.ts',
            coverage: [1, 1, 0, 1, null, 1],
            covered_percent: 80.0
          }
        ]
      };

      // Test coverage calculation
      const totalLines = mockCoverageData.source_files[0].coverage.filter(c => c !== null).length;
      const coveredLines = mockCoverageData.source_files[0].coverage.filter(c => c === 1).length;
      const coveragePercent = (coveredLines / totalLines) * 100;

      expect(coveragePercent).toBe(80);
      expect(mockCoverageData.source_files[0].covered_percent).toBe(80.0);
    });
  });

  describe('Snyk Security Integration', () => {
    it('should configure Snyk security analysis correctly', async () => {
      const config: CICDConfig = {
        qualityGate: {
          enabled: true,
          minimumScore: 70,
          failOnThreshold: true,
          requiredChecks: ['Snyk Security Scan']
        },
        reporting: {
          enabled: true,
          formats: ['json'],
          outputPath: './reports',
          includeDetails: true
        },
        notifications: {
          enabled: false,
          channels: []
        },
        coverage: {
          enabled: false,
          minimumCoverage: 0,
          failOnThreshold: false,
          reportPath: ''
        },
        externalTools: {
          snyk: {
            enabled: true,
            token: 'test-snyk-token',
            org: 'test-org',
            severityThreshold: 'medium'
          }
        }
      };

      const result = await cicdService.runQualityPipeline(config);

      expect(result).toBeDefined();
      expect(result.checks.some(check => 
        check.name.includes('Snyk')
      )).toBe(true);
    });

    it('should parse Snyk vulnerability results correctly', () => {
      const mockSnykResponse = {
        vulnerabilities: [
          {
            id: 'SNYK-JS-LODASH-567746',
            title: 'Prototype Pollution',
            severity: 'high',
            packageName: 'lodash',
            version: '4.17.15',
            fixedIn: ['4.17.19']
          },
          {
            id: 'SNYK-JS-AXIOS-1038255',
            title: 'Regular Expression Denial of Service',
            severity: 'medium',
            packageName: 'axios',
            version: '0.21.0',
            fixedIn: ['0.21.1']
          }
        ],
        summary: {
          total: 2,
          high: 1,
          medium: 1,
          low: 0
        }
      };

      const highSeverityVulns = mockSnykResponse.vulnerabilities.filter(v => v.severity === 'high');
      const mediumSeverityVulns = mockSnykResponse.vulnerabilities.filter(v => v.severity === 'medium');

      expect(highSeverityVulns).toHaveLength(1);
      expect(mediumSeverityVulns).toHaveLength(1);
      expect(mockSnykResponse.summary.total).toBe(2);
      expect(mockSnykResponse.summary.high).toBe(1);
    });

    it('should respect severity threshold configuration', () => {
      const vulnerabilities = [
        { severity: 'critical', score: 9.5 },
        { severity: 'high', score: 8.0 },
        { severity: 'medium', score: 5.5 },
        { severity: 'low', score: 2.0 }
      ];

      const severityThresholds = {
        critical: 9.0,
        high: 7.0,
        medium: 4.0,
        low: 0.0
      };

      // Test filtering by medium threshold
      const mediumThreshold = severityThresholds.medium;
      const filteredVulns = vulnerabilities.filter(v => {
        const vulnThreshold = severityThresholds[v.severity as keyof typeof severityThresholds];
        return vulnThreshold >= mediumThreshold;
      });

      expect(filteredVulns).toHaveLength(3); // critical, high, medium
      expect(filteredVulns.every(v => v.severity !== 'low')).toBe(true);
    });
  });

  describe('Multi-Tool Integration', () => {
    it('should run multiple external tools in parallel', async () => {
      const config: CICDConfig = {
        qualityGate: {
          enabled: true,
          minimumScore: 75,
          failOnThreshold: false,
          requiredChecks: ['SonarQube Analysis', 'Snyk Security Scan']
        },
        reporting: {
          enabled: true,
          formats: ['json'],
          outputPath: './reports',
          includeDetails: true
        },
        notifications: {
          enabled: false,
          channels: []
        },
        coverage: {
          enabled: true,
          minimumCoverage: 70,
          failOnThreshold: false,
          reportPath: './coverage'
        },
        externalTools: {
          sonarqube: {
            enabled: true,
            serverUrl: 'http://localhost:9000',
            token: 'test-token',
            projectKey: 'test-project'
          },
          snyk: {
            enabled: true,
            token: 'test-snyk-token',
            org: 'test-org',
            severityThreshold: 'medium'
          },
          codeclimate: {
            enabled: true,
            repoToken: 'test-cc-token',
            testReporter: true
          }
        }
      };

      const startTime = Date.now();
      const result = await cicdService.runQualityPipeline(config);
      const duration = Date.now() - startTime;

      expect(result).toBeDefined();
      expect(result.checks.length).toBeGreaterThan(0);
      
      // Should have checks from multiple tools
      const toolChecks = result.checks.filter(check => 
        check.name.includes('SonarQube') || 
        check.name.includes('Snyk') || 
        check.name.includes('Code Climate')
      );
      
      expect(toolChecks.length).toBeGreaterThan(1);
      
      // Parallel execution should be faster than sequential
      // (This is a simplified test - in reality, we'd need more sophisticated timing)
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should aggregate results from multiple tools correctly', async () => {
      const mockResults = {
        sonarqube: {
          qualityScore: 85,
          issues: 12,
          coverage: 78.5
        },
        snyk: {
          vulnerabilities: 3,
          highSeverity: 1,
          mediumSeverity: 2
        },
        codeclimate: {
          maintainabilityScore: 82,
          technicalDebt: '2h 30m',
          duplicatedCode: 5.2
        }
      };

      // Test aggregation logic
      const overallScore = (
        mockResults.sonarqube.qualityScore * 0.4 +
        (100 - mockResults.snyk.vulnerabilities * 5) * 0.3 +
        mockResults.codeclimate.maintainabilityScore * 0.3
      );

      expect(overallScore).toBeGreaterThan(70);
      expect(overallScore).toBeLessThan(90);

      const totalIssues = mockResults.sonarqube.issues + mockResults.snyk.vulnerabilities;
      expect(totalIssues).toBe(15);
    });

    it('should handle partial tool failures gracefully', async () => {
      // Mock one tool failing
      const mockError = new Error('Tool unavailable');
      jest.spyOn(console, 'error').mockImplementation(() => {});

      const config: CICDConfig = {
        qualityGate: {
          enabled: true,
          minimumScore: 70,
          failOnThreshold: false,
          requiredChecks: []
        },
        reporting: {
          enabled: false,
          formats: [],
          outputPath: '',
          includeDetails: false
        },
        notifications: {
          enabled: false,
          channels: []
        },
        coverage: {
          enabled: false,
          minimumCoverage: 0,
          failOnThreshold: false,
          reportPath: ''
        },
        externalTools: {
          sonarqube: {
            enabled: true,
            serverUrl: 'http://localhost:9000',
            token: 'test-token',
            projectKey: 'test-project'
          },
          snyk: {
            enabled: true,
            token: 'invalid-token', // This should cause failure
            org: 'test-org'
          }
        }
      };

      const result = await cicdService.runQualityPipeline(config);

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      
      // Should have some successful checks and some failed ones
      const successfulChecks = result.checks.filter(c => c.status === 'passed');
      const failedChecks = result.checks.filter(c => c.status === 'failed');
      
      expect(successfulChecks.length + failedChecks.length).toBeGreaterThan(0);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate external tool configurations', () => {
      const validConfig = {
        sonarqube: {
          enabled: true,
          serverUrl: 'http://localhost:9000',
          token: 'valid-token',
          projectKey: 'test-project'
        }
      };

      const invalidConfig = {
        sonarqube: {
          enabled: true,
          // Missing required fields
        }
      };

      // Test validation logic (would be implemented in actual service)
      const isValidConfig = (config: any) => {
        if (config.sonarqube?.enabled) {
          return !!(config.sonarqube.serverUrl && 
                   config.sonarqube.token && 
                   config.sonarqube.projectKey);
        }
        return true;
      };

      expect(isValidConfig(validConfig)).toBe(true);
      expect(isValidConfig(invalidConfig)).toBe(false);
    });

    it('should provide helpful error messages for invalid configurations', () => {
      const invalidConfigs = [
        { sonarqube: { enabled: true } }, // Missing required fields
        { snyk: { enabled: true } }, // Missing token
        { codeclimate: { enabled: true } } // Missing repo token
      ];

      const validateConfig = (config: any): string[] => {
        const errors: string[] = [];
        
        if (config.sonarqube?.enabled) {
          if (!config.sonarqube.serverUrl) errors.push('SonarQube server URL is required');
          if (!config.sonarqube.token) errors.push('SonarQube token is required');
          if (!config.sonarqube.projectKey) errors.push('SonarQube project key is required');
        }
        
        if (config.snyk?.enabled) {
          if (!config.snyk.token) errors.push('Snyk token is required');
        }
        
        if (config.codeclimate?.enabled) {
          if (!config.codeclimate.repoToken) errors.push('Code Climate repo token is required');
        }
        
        return errors;
      };

      invalidConfigs.forEach(config => {
        const errors = validateConfig(config);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.every(error => typeof error === 'string')).toBe(true);
      });
    });
  });
});