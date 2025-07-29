/**
 * Database Manager
 * 
 * Manages database connections, migrations, and provides access to DAOs.
 * Supports both PostgreSQL and SQLite for different environments.
 */

import { Pool } from 'pg';
import { ILogger } from '../interfaces';
import { TaskDAO, DatabaseConfig } from './dao/TaskDAO';
import { DatabaseError } from '../error-handling/ErrorTypes';
import * as fs from 'fs';
import * as path from 'path';

export interface DatabaseManagerConfig extends DatabaseConfig {
  environment: 'development' | 'test' | 'production';
  migrationsPath?: string;
  seedsPath?: string;
  autoMigrate?: boolean;
}

export class DatabaseManager {
  private config: DatabaseManagerConfig;
  private logger: ILogger;
  private pool: Pool;
  private taskDAO: TaskDAO;
  private isInitialized: boolean = false;

  constructor(config: DatabaseManagerConfig, logger: ILogger) {
    this.config = config;
    this.logger = logger;
    
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      ssl: config.ssl,
      max: config.maxConnections || 20,
      idleTimeoutMillis: config.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: config.connectionTimeoutMillis || 2000,
    });

    this.taskDAO = new TaskDAO(config, logger);

    this.pool.on('error', (err) => {
      this.logger.error('Database pool error', err);
    });
  }

  /**
   * Initialize the database manager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Test database connection
      await this.testConnection();

      // Run migrations if enabled
      if (this.config.autoMigrate) {
        await this.runMigrations();
      }

      // Load seed data in development/test environments
      if (this.config.environment !== 'production') {
        await this.loadSeedData();
      }

      this.isInitialized = true;
      this.logger.info('Database manager initialized successfully', {
        environment: this.config.environment,
        database: this.config.database
      });

    } catch (error) {
      this.logger.error('Failed to initialize database manager', error as Error);
      throw new DatabaseError(`Database initialization failed: ${(error as Error).message}`);
    }
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query('SELECT NOW() as current_time');
      this.logger.info('Database connection successful', {
        currentTime: result.rows[0].current_time,
        database: this.config.database
      });
    } catch (error) {
      this.logger.error('Database connection failed', error as Error);
      throw new DatabaseError(`Connection test failed: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Run database migrations
   */
  async runMigrations(): Promise<void> {
    const migrationsPath = this.config.migrationsPath || path.join(__dirname, 'migrations');
    
    if (!fs.existsSync(migrationsPath)) {
      this.logger.warn('Migrations directory not found', { path: migrationsPath });
      return;
    }

    const client = await this.pool.connect();

    try {
      // Create migrations table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version VARCHAR(50) PRIMARY KEY,
          applied_at TIMESTAMP DEFAULT NOW(),
          description TEXT
        )
      `);

      // Get list of migration files
      const migrationFiles = fs.readdirSync(migrationsPath)
        .filter(file => file.endsWith('.sql'))
        .sort();

      for (const file of migrationFiles) {
        const version = path.basename(file, '.sql');
        
        // Check if migration has already been applied
        const result = await client.query(
          'SELECT version FROM schema_migrations WHERE version = $1',
          [version]
        );

        if (result.rows.length > 0) {
          this.logger.debug('Migration already applied', { version });
          continue;
        }

        // Read and execute migration
        const migrationPath = path.join(migrationsPath, file);
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        this.logger.info('Applying migration', { version, file });
        await client.query(migrationSQL);
        
        this.logger.info('Migration applied successfully', { version });
      }

    } catch (error) {
      this.logger.error('Migration failed', error as Error);
      throw new DatabaseError(`Migration failed: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Load seed data for development/testing
   */
  async loadSeedData(): Promise<void> {
    if (this.config.environment === 'production') {
      this.logger.warn('Skipping seed data loading in production environment');
      return;
    }

    const seedsPath = this.config.seedsPath || path.join(__dirname, 'seeds');
    
    if (!fs.existsSync(seedsPath)) {
      this.logger.warn('Seeds directory not found', { path: seedsPath });
      return;
    }

    const client = await this.pool.connect();

    try {
      // Check if seed data has already been loaded
      const result = await client.query('SELECT COUNT(*) as count FROM tasks');
      const taskCount = parseInt(result.rows[0].count);

      if (taskCount > 0) {
        this.logger.debug('Seed data already exists, skipping', { taskCount });
        return;
      }

      // Get list of seed files
      const seedFiles = fs.readdirSync(seedsPath)
        .filter(file => file.endsWith('.sql'))
        .sort();

      for (const file of seedFiles) {
        const seedPath = path.join(seedsPath, file);
        const seedSQL = fs.readFileSync(seedPath, 'utf8');

        this.logger.info('Loading seed data', { file });
        await client.query(seedSQL);
        
        this.logger.info('Seed data loaded successfully', { file });
      }

    } catch (error) {
      this.logger.error('Failed to load seed data', error as Error);
      // Don't throw error for seed data failures in development
      if (this.config.environment !== 'development') {
        throw new DatabaseError(`Seed data loading failed: ${(error as Error).message}`);
      }
    } finally {
      client.release();
    }
  }

  /**
   * Get Task DAO instance
   */
  getTaskDAO(): TaskDAO {
    if (!this.isInitialized) {
      throw new DatabaseError('Database manager not initialized. Call initialize() first.');
    }
    return this.taskDAO;
  }

  /**
   * Execute raw SQL query (for advanced operations)
   */
  async executeQuery(query: string, params?: any[]): Promise<any> {
    const client = await this.pool.connect();

    try {
      const result = await client.query(query, params);
      return result.rows;
    } catch (error) {
      this.logger.error('Query execution failed', error as Error, { query });
      throw new DatabaseError(`Query failed: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<any> {
    const client = await this.pool.connect();

    try {
      const stats = {
        totalConnections: this.pool.totalCount,
        idleConnections: this.pool.idleCount,
        waitingClients: this.pool.waitingCount,
        tables: {}
      };

      // Get table row counts
      const tables = ['tasks', 'task_assignments', 'task_dependencies', 'acceptance_criteria', 
                    'task_time_entries', 'task_comments', 'quality_snapshots', 'system_logs'];

      for (const table of tables) {
        try {
          const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
          (stats.tables as any)[table] = parseInt(result.rows[0].count);
        } catch (error) {
          (stats.tables as any)[table] = 'N/A';
        }
      }

      return stats;

    } catch (error) {
      this.logger.error('Failed to get database stats', error as Error);
      throw new DatabaseError(`Failed to get database stats: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Backup database (PostgreSQL specific)
   */
  async createBackup(backupPath: string): Promise<void> {
    // This would typically use pg_dump
    // Implementation depends on specific requirements
    this.logger.info('Database backup requested', { backupPath });
    throw new Error('Backup functionality not implemented yet');
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      const client = await this.pool.connect();
      
      try {
        // Test basic query
        await client.query('SELECT 1');
        
        // Get connection pool stats
        const poolStats = {
          totalConnections: this.pool.totalCount,
          idleConnections: this.pool.idleCount,
          waitingClients: this.pool.waitingCount
        };

        return {
          status: 'healthy',
          details: {
            database: this.config.database,
            environment: this.config.environment,
            poolStats,
            initialized: this.isInitialized
          }
        };

      } finally {
        client.release();
      }

    } catch (error) {
      this.logger.error('Database health check failed', error as Error);
      return {
        status: 'unhealthy',
        details: {
          error: (error as Error).message,
          database: this.config.database,
          environment: this.config.environment
        }
      };
    }
  }

  /**
   * Close all database connections
   */
  async close(): Promise<void> {
    try {
      await this.taskDAO.close();
      await this.pool.end();
      this.isInitialized = false;
      this.logger.info('Database manager closed successfully');
    } catch (error) {
      this.logger.error('Error closing database manager', error as Error);
      throw new DatabaseError(`Failed to close database: ${(error as Error).message}`);
    }
  }

  /**
   * Reset database (for testing)
   */
  async reset(): Promise<void> {
    if (this.config.environment === 'production') {
      throw new DatabaseError('Cannot reset database in production environment');
    }

    const client = await this.pool.connect();

    try {
      this.logger.warn('Resetting database', { environment: this.config.environment });

      // Drop all tables (in reverse dependency order)
      const dropQueries = [
        'DROP TABLE IF EXISTS task_labels CASCADE',
        'DROP TABLE IF EXISTS task_tags CASCADE',
        'DROP TABLE IF EXISTS task_status_history CASCADE',
        'DROP TABLE IF EXISTS task_comments CASCADE',
        'DROP TABLE IF EXISTS task_time_entries CASCADE',
        'DROP TABLE IF EXISTS acceptance_criteria CASCADE',
        'DROP TABLE IF EXISTS task_requirements CASCADE',
        'DROP TABLE IF EXISTS task_dependencies CASCADE',
        'DROP TABLE IF EXISTS task_assignments CASCADE',
        'DROP TABLE IF EXISTS tasks CASCADE',
        'DROP TABLE IF EXISTS quality_snapshots CASCADE',
        'DROP TABLE IF EXISTS system_logs CASCADE',
        'DROP TABLE IF EXISTS schema_migrations CASCADE'
      ];

      for (const query of dropQueries) {
        await client.query(query);
      }

      // Re-run migrations
      await this.runMigrations();
      
      // Re-load seed data
      await this.loadSeedData();

      this.logger.info('Database reset completed');

    } catch (error) {
      this.logger.error('Database reset failed', error as Error);
      throw new DatabaseError(`Database reset failed: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }
}