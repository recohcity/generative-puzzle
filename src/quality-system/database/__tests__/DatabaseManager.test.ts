/**
 * Database Manager Tests
 * 
 * Tests for database manager functionality including configuration,
 * connection management, and basic operations.
 */

import { DatabaseManager } from '../DatabaseManager';
import { AdvancedLogger } from '../../logging/AdvancedLogger';
import { getDatabaseConfig } from '../config/database.config';

// Mock pg module for testing
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue({ rows: [{ current_time: new Date() }] }),
      release: jest.fn()
    }),
    end: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    totalCount: 5,
    idleCount: 3,
    waitingCount: 0
  }))
}));

describe('DatabaseManager', () => {
  let databaseManager: DatabaseManager;
  let logger: AdvancedLogger;

  beforeEach(() => {
    logger = AdvancedLogger.getInstance();
    const config = {
      ...getDatabaseConfig('test'),
      host: 'localhost',
      port: 5432,
      database: 'test_db',
      username: 'test_user',
      password: 'test_password'
    };
    databaseManager = new DatabaseManager(config, logger);
  });

  afterEach(async () => {
    await databaseManager.close();
  });

  describe('Configuration', () => {
    it('should create database manager with valid configuration', () => {
      expect(databaseManager).toBeDefined();
    });

    it('should get database configuration for different environments', () => {
      const devConfig = getDatabaseConfig('development');
      const testConfig = getDatabaseConfig('test');
      const prodConfig = getDatabaseConfig('production');

      expect(devConfig.environment).toBe('development');
      expect(testConfig.environment).toBe('test');
      expect(prodConfig.environment).toBe('production');

      expect(devConfig.autoMigrate).toBe(true);
      expect(testConfig.autoMigrate).toBe(true);
      expect(prodConfig.autoMigrate).toBe(false);
    });
  });

  describe('Connection Management', () => {
    it('should test database connection successfully', async () => {
      await expect(databaseManager.testConnection()).resolves.not.toThrow();
    });

    it('should initialize database manager', async () => {
      // Mock file system for migrations
      jest.doMock('fs', () => ({
        existsSync: jest.fn().mockReturnValue(false),
        readdirSync: jest.fn().mockReturnValue([])
      }));

      await expect(databaseManager.initialize()).resolves.not.toThrow();
    });
  });

  describe('Health Check', () => {
    it('should perform health check and return healthy status', async () => {
      const health = await databaseManager.healthCheck();

      expect(health.status).toBe('healthy');
      expect(health.details).toHaveProperty('database');
      expect(health.details).toHaveProperty('environment');
      expect(health.details).toHaveProperty('poolStats');
    });

    it('should return unhealthy status on connection failure', async () => {
      // Mock connection failure
      const mockPool = require('pg').Pool;
      mockPool.mockImplementationOnce(() => ({
        connect: jest.fn().mockRejectedValue(new Error('Connection failed')),
        end: jest.fn(),
        on: jest.fn()
      }));

      const failingManager = new DatabaseManager(getDatabaseConfig('test'), logger);
      const health = await failingManager.healthCheck();

      expect(health.status).toBe('unhealthy');
      expect(health.details).toHaveProperty('error');
    });
  });

  describe('Database Statistics', () => {
    it('should get database statistics', async () => {
      // Mock query results for statistics
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [{ count: '10' }] }) // tasks
          .mockResolvedValueOnce({ rows: [{ count: '5' }] })  // task_assignments
          .mockResolvedValueOnce({ rows: [{ count: '3' }] })  // task_dependencies
          .mockResolvedValueOnce({ rows: [{ count: '8' }] })  // acceptance_criteria
          .mockResolvedValueOnce({ rows: [{ count: '15' }] }) // task_time_entries
          .mockResolvedValueOnce({ rows: [{ count: '12' }] }) // task_comments
          .mockResolvedValueOnce({ rows: [{ count: '2' }] })  // quality_snapshots
          .mockResolvedValueOnce({ rows: [{ count: '50' }] }), // system_logs
        release: jest.fn()
      };

      const mockPool = require('pg').Pool;
      mockPool.mockImplementationOnce(() => ({
        connect: jest.fn().mockResolvedValue(mockClient),
        end: jest.fn(),
        on: jest.fn(),
        totalCount: 10,
        idleCount: 5,
        waitingCount: 2
      }));

      const statsManager = new DatabaseManager(getDatabaseConfig('test'), logger);
      const stats = await statsManager.getDatabaseStats();

      expect(stats).toHaveProperty('totalConnections', 10);
      expect(stats).toHaveProperty('idleConnections', 5);
      expect(stats).toHaveProperty('waitingClients', 2);
      expect(stats).toHaveProperty('tables');
      expect(stats.tables).toHaveProperty('tasks', 10);
    });
  });

  describe('Query Execution', () => {
    it('should execute raw SQL queries', async () => {
      const mockResult = [{ id: 1, name: 'test' }];
      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: mockResult }),
        release: jest.fn()
      };

      const mockPool = require('pg').Pool;
      mockPool.mockImplementationOnce(() => ({
        connect: jest.fn().mockResolvedValue(mockClient),
        end: jest.fn(),
        on: jest.fn()
      }));

      const queryManager = new DatabaseManager(getDatabaseConfig('test'), logger);
      const result = await queryManager.executeQuery('SELECT * FROM test_table');

      expect(result).toEqual(mockResult);
      expect(mockClient.query).toHaveBeenCalledWith('SELECT * FROM test_table', undefined);
    });

    it('should handle query execution errors', async () => {
      const mockClient = {
        query: jest.fn().mockRejectedValue(new Error('Query failed')),
        release: jest.fn()
      };

      const mockPool = require('pg').Pool;
      mockPool.mockImplementationOnce(() => ({
        connect: jest.fn().mockResolvedValue(mockClient),
        end: jest.fn(),
        on: jest.fn()
      }));

      const queryManager = new DatabaseManager(getDatabaseConfig('test'), logger);
      
      await expect(
        queryManager.executeQuery('INVALID SQL')
      ).rejects.toThrow('Query failed');
    });
  });

  describe('Migration System', () => {
    it('should handle missing migrations directory gracefully', async () => {
      jest.doMock('fs', () => ({
        existsSync: jest.fn().mockReturnValue(false)
      }));

      await expect(databaseManager.runMigrations()).resolves.not.toThrow();
    });

    it('should process migration files in order', async () => {
      const mockFiles = ['001_initial.sql', '002_views.sql'];
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [] }) // Create migrations table
          .mockResolvedValueOnce({ rows: [] }) // Check migration 001
          .mockResolvedValueOnce({ rows: [] }) // Execute migration 001
          .mockResolvedValueOnce({ rows: [] }) // Check migration 002
          .mockResolvedValueOnce({ rows: [] }), // Execute migration 002
        release: jest.fn()
      };

      jest.doMock('fs', () => ({
        existsSync: jest.fn().mockReturnValue(true),
        readdirSync: jest.fn().mockReturnValue(mockFiles),
        readFileSync: jest.fn().mockReturnValue('CREATE TABLE test();')
      }));

      const mockPool = require('pg').Pool;
      mockPool.mockImplementationOnce(() => ({
        connect: jest.fn().mockResolvedValue(mockClient),
        end: jest.fn(),
        on: jest.fn()
      }));

      const migrationManager = new DatabaseManager(getDatabaseConfig('test'), logger);
      await expect(migrationManager.runMigrations()).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      const mockPool = require('pg').Pool;
      mockPool.mockImplementationOnce(() => ({
        connect: jest.fn().mockRejectedValue(new Error('Connection refused')),
        end: jest.fn(),
        on: jest.fn()
      }));

      const errorManager = new DatabaseManager(getDatabaseConfig('test'), logger);
      
      await expect(errorManager.testConnection()).rejects.toThrow('Connection refused');
    });

    it('should prevent database reset in production', async () => {
      const prodConfig = {
        ...getDatabaseConfig('production'),
        host: 'localhost',
        database: 'prod_db'
      };
      
      const prodManager = new DatabaseManager(prodConfig, logger);
      
      await expect(prodManager.reset()).rejects.toThrow(
        'Cannot reset database in production environment'
      );
    });
  });

  describe('Cleanup and Shutdown', () => {
    it('should close database connections properly', async () => {
      const mockPool = require('pg').Pool;
      const mockEnd = jest.fn().mockResolvedValue(undefined);
      
      mockPool.mockImplementationOnce(() => ({
        connect: jest.fn(),
        end: mockEnd,
        on: jest.fn()
      }));

      const closeManager = new DatabaseManager(getDatabaseConfig('test'), logger);
      await closeManager.close();

      expect(mockEnd).toHaveBeenCalled();
    });
  });
});