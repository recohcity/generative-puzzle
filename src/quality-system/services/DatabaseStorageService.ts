/**
 * Database Storage Service
 * 
 * Real database implementation of IDataStorageService using PostgreSQL.
 * Replaces MockDataStorageService for production use.
 */

import { IDataStorageService, ILogger } from '../interfaces';
import { Task, ProgressSnapshot, LogEntry } from '../types';
import { EnhancedTask } from '../task-management/TaskTypes';
import { DatabaseManager, DatabaseManagerConfig } from '../database/DatabaseManager';
import { TaskDAO } from '../database/dao/TaskDAO';
import { getDatabaseConfig } from '../database/config/database.config';
import { DatabaseError } from '../error-handling/ErrorTypes';

export class DatabaseStorageService implements IDataStorageService {
  private databaseManager: DatabaseManager;
  private taskDAO: TaskDAO;
  private logger: ILogger;
  private isInitialized: boolean = false;

  constructor(logger: ILogger, config?: DatabaseManagerConfig) {
    this.logger = logger;
    
    // Use provided config or get from environment
    const dbConfig = config || getDatabaseConfig();
    this.databaseManager = new DatabaseManager(dbConfig, logger);
  }

  /**
   * Initialize the database storage service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.databaseManager.initialize();
      this.taskDAO = this.databaseManager.getTaskDAO();
      this.isInitialized = true;

      this.logger.info('Database storage service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize database storage service', error as Error);
      throw new DatabaseError(`Storage service initialization failed: ${(error as Error).message}`);
    }
  }

  /**
   * Save a task to the database
   */
  async saveTask(task: Task | EnhancedTask): Promise<void> {
    this.ensureInitialized();

    try {
      const enhancedTask = task as EnhancedTask;
      
      // Check if task exists
      const existingTask = await this.taskDAO.getTaskById(enhancedTask.id);
      
      if (existingTask) {
        // Update existing task
        await this.taskDAO.updateTask(enhancedTask);
        this.logger.debug('Task updated in database', { taskId: enhancedTask.id });
      } else {
        // Create new task
        await this.taskDAO.createTask(enhancedTask);
        this.logger.debug('Task created in database', { taskId: enhancedTask.id });
      }

    } catch (error) {
      this.logger.error('Failed to save task to database', error as Error, { taskId: task.id });
      throw new DatabaseError(`Failed to save task: ${(error as Error).message}`);
    }
  }

  /**
   * Load a task from the database
   */
  async loadTask(taskId: string): Promise<Task | EnhancedTask | null> {
    this.ensureInitialized();

    try {
      const task = await this.taskDAO.getTaskById(taskId);
      
      if (task) {
        this.logger.debug('Task loaded from database', { taskId, title: task.title });
      } else {
        this.logger.debug('Task not found in database', { taskId });
      }

      return task;

    } catch (error) {
      this.logger.error('Failed to load task from database', error as Error, { taskId });
      throw new DatabaseError(`Failed to load task: ${(error as Error).message}`);
    }
  }

  /**
   * Save a quality snapshot to the database
   */
  async saveQualitySnapshot(snapshot: ProgressSnapshot): Promise<void> {
    this.ensureInitialized();

    try {
      const query = `
        INSERT INTO quality_snapshots (
          timestamp, version, overall_score, architecture_score, typescript_score,
          testing_score, performance_score, error_handling_score, complexity_score,
          duplication_score, completed_tasks, total_tasks, blocked_tasks, team_velocity
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `;

      const params = [
        snapshot.timestamp,
        snapshot.version,
        snapshot.overallScore,
        snapshot.dimensionScores.architecture || 0,
        snapshot.dimensionScores.typescript || 0,
        snapshot.dimensionScores.testing || 0,
        snapshot.dimensionScores.performance || 0,
        snapshot.dimensionScores.errorHandling || 0,
        snapshot.dimensionScores.complexity || 0,
        snapshot.dimensionScores.duplication || 0,
        snapshot.completedTasks,
        snapshot.totalTasks,
        snapshot.blockedTasks,
        snapshot.teamVelocity
      ];

      await this.databaseManager.executeQuery(query, params);
      
      this.logger.debug('Quality snapshot saved to database', { 
        version: snapshot.version,
        overallScore: snapshot.overallScore 
      });

    } catch (error) {
      this.logger.error('Failed to save quality snapshot to database', error as Error, { 
        version: snapshot.version 
      });
      throw new DatabaseError(`Failed to save quality snapshot: ${(error as Error).message}`);
    }
  }

  /**
   * Load quality snapshots from the database
   */
  async loadQualitySnapshots(limit: number): Promise<ProgressSnapshot[]> {
    this.ensureInitialized();

    try {
      const query = `
        SELECT * FROM quality_snapshots 
        ORDER BY timestamp DESC 
        LIMIT $1
      `;

      const rows = await this.databaseManager.executeQuery(query, [limit]);
      
      const snapshots: ProgressSnapshot[] = rows.map((row: any) => ({
        timestamp: row.timestamp,
        version: row.version,
        overallScore: parseFloat(row.overall_score) || 0,
        dimensionScores: {
          architecture: parseFloat(row.architecture_score) || 0,
          typescript: parseFloat(row.typescript_score) || 0,
          testing: parseFloat(row.testing_score) || 0,
          performance: parseFloat(row.performance_score) || 0,
          errorHandling: parseFloat(row.error_handling_score) || 0,
          complexity: parseFloat(row.complexity_score) || 0,
          duplication: parseFloat(row.duplication_score) || 0,
        },
        completedTasks: row.completed_tasks || 0,
        totalTasks: row.total_tasks || 0,
        blockedTasks: row.blocked_tasks || 0,
        teamVelocity: parseFloat(row.team_velocity) || 0
      }));

      this.logger.debug('Quality snapshots loaded from database', { 
        count: snapshots.length,
        limit 
      });

      return snapshots;

    } catch (error) {
      this.logger.error('Failed to load quality snapshots from database', error as Error, { limit });
      throw new DatabaseError(`Failed to load quality snapshots: ${(error as Error).message}`);
    }
  }

  /**
   * Save a log entry to the database
   */
  async saveLogEntry(entry: LogEntry): Promise<void> {
    this.ensureInitialized();

    try {
      const query = `
        INSERT INTO system_logs (
          timestamp, level, message, context, error_details, user_id, session_id, component
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;

      const params = [
        entry.timestamp,
        entry.level.toString(),
        entry.message,
        entry.context ? JSON.stringify(entry.context) : null,
        entry.error ? JSON.stringify(entry.error) : null,
        entry.userId,
        entry.sessionId,
        'quality-system'
      ];

      await this.databaseManager.executeQuery(query, params);

    } catch (error) {
      // Don't log errors for log entry saves to avoid infinite recursion
      console.error('Failed to save log entry to database:', error);
    }
  }

  /**
   * Load log entries from the database
   */
  async loadLogEntries(filter: Partial<LogEntry>, limit: number): Promise<LogEntry[]> {
    this.ensureInitialized();

    try {
      let query = 'SELECT * FROM system_logs WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      // Apply filters
      if (filter.level !== undefined) {
        query += ` AND level = $${paramIndex}`;
        params.push(filter.level.toString());
        paramIndex++;
      }

      if (filter.userId) {
        query += ` AND user_id = $${paramIndex}`;
        params.push(filter.userId);
        paramIndex++;
      }

      if (filter.sessionId) {
        query += ` AND session_id = $${paramIndex}`;
        params.push(filter.sessionId);
        paramIndex++;
      }

      query += ` ORDER BY timestamp DESC LIMIT $${paramIndex}`;
      params.push(limit);

      const rows = await this.databaseManager.executeQuery(query, params);

      const entries: LogEntry[] = rows.map((row: any) => ({
        timestamp: row.timestamp,
        level: parseInt(row.level),
        message: row.message,
        context: row.context ? JSON.parse(row.context) : undefined,
        error: row.error_details ? JSON.parse(row.error_details) : undefined,
        userId: row.user_id,
        sessionId: row.session_id
      }));

      this.logger.debug('Log entries loaded from database', { 
        count: entries.length,
        limit,
        filter 
      });

      return entries;

    } catch (error) {
      this.logger.error('Failed to load log entries from database', error as Error, { filter, limit });
      throw new DatabaseError(`Failed to load log entries: ${(error as Error).message}`);
    }
  }

  /**
   * Clean up old data from the database
   */
  async cleanup(olderThanDays: number): Promise<void> {
    this.ensureInitialized();

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      // Clean up old quality snapshots (keep at least 10 most recent)
      const snapshotQuery = `
        DELETE FROM quality_snapshots 
        WHERE timestamp < $1 
        AND id NOT IN (
          SELECT id FROM quality_snapshots 
          ORDER BY timestamp DESC 
          LIMIT 10
        )
      `;

      // Clean up old log entries
      const logQuery = `
        DELETE FROM system_logs 
        WHERE timestamp < $1
      `;

      const snapshotResult = await this.databaseManager.executeQuery(snapshotQuery, [cutoffDate]);
      const logResult = await this.databaseManager.executeQuery(logQuery, [cutoffDate]);

      this.logger.info('Database cleanup completed', {
        olderThanDays,
        snapshotsRemoved: snapshotResult.length,
        logEntriesRemoved: logResult.length
      });

    } catch (error) {
      this.logger.error('Database cleanup failed', error as Error, { olderThanDays });
      throw new DatabaseError(`Database cleanup failed: ${(error as Error).message}`);
    }
  }

  /**
   * Get database statistics
   */
  async getStatistics(): Promise<any> {
    this.ensureInitialized();

    try {
      return await this.databaseManager.getDatabaseStats();
    } catch (error) {
      this.logger.error('Failed to get database statistics', error as Error);
      throw new DatabaseError(`Failed to get statistics: ${(error as Error).message}`);
    }
  }

  /**
   * Perform database health check
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      if (!this.isInitialized) {
        return {
          status: 'unhealthy',
          details: { error: 'Service not initialized' }
        };
      }

      return await this.databaseManager.healthCheck();
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: (error as Error).message }
      };
    }
  }

  /**
   * Close database connections
   */
  async close(): Promise<void> {
    if (this.isInitialized) {
      await this.databaseManager.close();
      this.isInitialized = false;
      this.logger.info('Database storage service closed');
    }
  }

  /**
   * Reset database (for testing only)
   */
  async reset(): Promise<void> {
    this.ensureInitialized();
    
    if (process.env.NODE_ENV === 'production') {
      throw new DatabaseError('Cannot reset database in production environment');
    }

    await this.databaseManager.reset();
    this.logger.warn('Database reset completed');
  }

  // Private helper methods

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new DatabaseError('Database storage service not initialized. Call initialize() first.');
    }
  }

  /**
   * Get task DAO for advanced operations
   */
  getTaskDAO(): TaskDAO {
    this.ensureInitialized();
    return this.taskDAO;
  }

  /**
   * Get database manager for advanced operations
   */
  getDatabaseManager(): DatabaseManager {
    this.ensureInitialized();
    return this.databaseManager;
  }
}