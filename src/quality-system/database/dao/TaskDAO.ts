/**
 * Task Data Access Object (DAO)
 * 
 * Provides database operations for task management with proper error handling,
 * connection management, and query optimization.
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import { ILogger } from '../../interfaces';
import { EnhancedTask, TaskStatus, TaskPriority, TaskType, TaskFilter, TaskSort } from '../../task-management/TaskTypes';
import { DatabaseError, ValidationError } from '../../error-handling/ErrorTypes';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  maxConnections?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

export class TaskDAO {
  private pool: Pool;
  private logger: ILogger;

  constructor(config: DatabaseConfig, logger: ILogger) {
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

    this.pool.on('error', (err) => {
      this.logger.error('Database pool error', err);
    });
  }

  /**
   * Create a new task in the database
   */
  async createTask(task: EnhancedTask): Promise<void> {
    const client = await this.getClient();
    
    try {
      await client.query('BEGIN');

      // Insert main task record
      const taskQuery = `
        INSERT INTO tasks (
          id, title, description, type, priority, status, created_by,
          created_at, updated_at, estimated_hours, actual_hours, remaining_hours,
          due_date, completion_percentage, completed_at, component, epic, sprint,
          cycle_time, lead_time, blocked_time, review_time, rework_count
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
      `;

      await client.query(taskQuery, [
        task.id, task.title, task.description, task.type, task.priority, task.status,
        task.createdBy, task.createdAt, task.updatedAt, task.timeTracking.estimatedHours,
        task.timeTracking.actualHours, task.timeTracking.remainingHours, task.dueDate,
        task.completionPercentage, task.completedAt, task.component, task.epic, task.sprint,
        task.metrics.cycleTime, task.metrics.leadTime, task.metrics.blockedTime,
        task.metrics.reviewTime, task.metrics.reworkCount
      ]);

      // Insert task assignments
      if (task.assignments.length > 0) {
        await this.insertTaskAssignments(client, task.id, task.assignments);
      }

      // Insert task requirements
      if (task.requirements.length > 0) {
        await this.insertTaskRequirements(client, task.id, task.requirements);
      }

      // Insert acceptance criteria
      if (task.acceptanceCriteria.length > 0) {
        await this.insertAcceptanceCriteria(client, task.id, task.acceptanceCriteria);
      }

      // Insert tags
      if (task.tags.length > 0) {
        await this.insertTaskTags(client, task.id, task.tags);
      }

      // Insert initial status history
      if (task.statusHistory.length > 0) {
        await this.insertStatusHistory(client, task.id, task.statusHistory);
      }

      await client.query('COMMIT');
      this.logger.info('Task created in database', { taskId: task.id, title: task.title });

    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Failed to create task in database', error as Error, { taskId: task.id });
      throw new DatabaseError(`Failed to create task: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Retrieve a task by ID
   */
  async getTaskById(taskId: string): Promise<EnhancedTask | null> {
    const client = await this.getClient();

    try {
      const taskQuery = `
        SELECT * FROM tasks WHERE id = $1
      `;

      const result = await client.query(taskQuery, [taskId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const taskRow = result.rows[0];
      const task = await this.buildEnhancedTask(client, taskRow);

      this.logger.debug('Task retrieved from database', { taskId, title: task.title });
      return task;

    } catch (error) {
      this.logger.error('Failed to retrieve task from database', error as Error, { taskId });
      throw new DatabaseError(`Failed to retrieve task: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Update an existing task
   */
  async updateTask(task: EnhancedTask): Promise<void> {
    const client = await this.getClient();

    try {
      await client.query('BEGIN');

      // Update main task record
      const updateQuery = `
        UPDATE tasks SET
          title = $2, description = $3, type = $4, priority = $5, status = $6,
          updated_at = $7, estimated_hours = $8, actual_hours = $9, remaining_hours = $10,
          due_date = $11, completion_percentage = $12, completed_at = $13,
          component = $14, epic = $15, sprint = $16,
          cycle_time = $17, lead_time = $18, blocked_time = $19,
          review_time = $20, rework_count = $21
        WHERE id = $1
      `;

      await client.query(updateQuery, [
        task.id, task.title, task.description, task.type, task.priority, task.status,
        task.updatedAt, task.timeTracking.estimatedHours, task.timeTracking.actualHours,
        task.timeTracking.remainingHours, task.dueDate, task.completionPercentage,
        task.completedAt, task.component, task.epic, task.sprint,
        task.metrics.cycleTime, task.metrics.leadTime, task.metrics.blockedTime,
        task.metrics.reviewTime, task.metrics.reworkCount
      ]);

      // Update related data (assignments, criteria, etc.)
      await this.updateTaskRelatedData(client, task);

      await client.query('COMMIT');
      this.logger.info('Task updated in database', { taskId: task.id, title: task.title });

    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Failed to update task in database', error as Error, { taskId: task.id });
      throw new DatabaseError(`Failed to update task: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Delete a task and all related data
   */
  async deleteTask(taskId: string): Promise<void> {
    const client = await this.getClient();

    try {
      await client.query('BEGIN');

      // Delete task (cascading deletes will handle related data)
      const deleteQuery = 'DELETE FROM tasks WHERE id = $1';
      const result = await client.query(deleteQuery, [taskId]);

      if (result.rowCount === 0) {
        throw new ValidationError(`Task with ID ${taskId} not found`);
      }

      await client.query('COMMIT');
      this.logger.info('Task deleted from database', { taskId });

    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Failed to delete task from database', error as Error, { taskId });
      throw new DatabaseError(`Failed to delete task: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Get tasks with filtering and sorting
   */
  async getTasks(filter?: TaskFilter, sort?: TaskSort, limit?: number, offset?: number): Promise<EnhancedTask[]> {
    const client = await this.getClient();

    try {
      let query = 'SELECT * FROM tasks WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      // Apply filters
      if (filter) {
        if (filter.status && filter.status.length > 0) {
          query += ` AND status = ANY($${paramIndex})`;
          params.push(filter.status);
          paramIndex++;
        }

        if (filter.priority && filter.priority.length > 0) {
          query += ` AND priority = ANY($${paramIndex})`;
          params.push(filter.priority);
          paramIndex++;
        }

        if (filter.type && filter.type.length > 0) {
          query += ` AND type = ANY($${paramIndex})`;
          params.push(filter.type);
          paramIndex++;
        }

        if (filter.component && filter.component.length > 0) {
          query += ` AND component = ANY($${paramIndex})`;
          params.push(filter.component);
          paramIndex++;
        }

        if (filter.dueDateBefore) {
          query += ` AND due_date <= $${paramIndex}`;
          params.push(filter.dueDateBefore);
          paramIndex++;
        }

        if (filter.dueDateAfter) {
          query += ` AND due_date >= $${paramIndex}`;
          params.push(filter.dueDateAfter);
          paramIndex++;
        }

        if (filter.createdAfter) {
          query += ` AND created_at >= $${paramIndex}`;
          params.push(filter.createdAfter);
          paramIndex++;
        }

        if (filter.createdBefore) {
          query += ` AND created_at <= $${paramIndex}`;
          params.push(filter.createdBefore);
          paramIndex++;
        }
      }

      // Apply sorting
      if (sort) {
        const sortField = this.mapSortField(sort.field);
        const sortDirection = sort.direction.toUpperCase();
        query += ` ORDER BY ${sortField} ${sortDirection}`;
      } else {
        query += ' ORDER BY created_at DESC';
      }

      // Apply pagination
      if (limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(limit);
        paramIndex++;
      }

      if (offset) {
        query += ` OFFSET $${paramIndex}`;
        params.push(offset);
        paramIndex++;
      }

      const result = await client.query(query, params);
      const tasks: EnhancedTask[] = [];

      for (const row of result.rows) {
        const task = await this.buildEnhancedTask(client, row);
        tasks.push(task);
      }

      this.logger.debug('Tasks retrieved from database', { 
        count: tasks.length, 
        filter, 
        sort 
      });

      return tasks;

    } catch (error) {
      this.logger.error('Failed to retrieve tasks from database', error as Error, { filter, sort });
      throw new DatabaseError(`Failed to retrieve tasks: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Get task statistics
   */
  async getTaskStatistics(): Promise<any> {
    const client = await this.getClient();

    try {
      const query = 'SELECT * FROM task_statistics';
      const result = await client.query(query);

      return result.rows[0] || {};

    } catch (error) {
      this.logger.error('Failed to retrieve task statistics', error as Error);
      throw new DatabaseError(`Failed to retrieve task statistics: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Get user workload data
   */
  async getUserWorkload(): Promise<any[]> {
    const client = await this.getClient();

    try {
      const query = 'SELECT * FROM user_workload ORDER BY total_tasks DESC';
      const result = await client.query(query);

      return result.rows;

    } catch (error) {
      this.logger.error('Failed to retrieve user workload', error as Error);
      throw new DatabaseError(`Failed to retrieve user workload: ${(error as Error).message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Close database connections
   */
  async close(): Promise<void> {
    await this.pool.end();
    this.logger.info('Database connection pool closed');
  }

  // Private helper methods

  private async getClient(): Promise<PoolClient> {
    try {
      return await this.pool.connect();
    } catch (error) {
      this.logger.error('Failed to get database client', error as Error);
      throw new DatabaseError(`Database connection failed: ${(error as Error).message}`);
    }
  }

  private async buildEnhancedTask(client: PoolClient, taskRow: any): Promise<EnhancedTask> {
    const task: EnhancedTask = {
      id: taskRow.id,
      title: taskRow.title,
      description: taskRow.description,
      type: taskRow.type as TaskType,
      priority: taskRow.priority as TaskPriority,
      status: taskRow.status as TaskStatus,
      createdBy: taskRow.created_by,
      createdAt: taskRow.created_at,
      updatedAt: taskRow.updated_at,
      
      assignments: await this.getTaskAssignments(client, taskRow.id),
      dependencies: await this.getTaskDependencies(client, taskRow.id),
      blockedBy: await this.getBlockedByTasks(client, taskRow.id),
      blocking: await this.getBlockingTasks(client, taskRow.id),
      relatedTasks: [],
      
      requirements: await this.getTaskRequirements(client, taskRow.id),
      acceptanceCriteria: await this.getAcceptanceCriteria(client, taskRow.id),
      
      timeTracking: {
        estimatedHours: taskRow.estimated_hours || 0,
        actualHours: taskRow.actual_hours || 0,
        remainingHours: taskRow.remaining_hours || 0,
        timeEntries: await this.getTimeEntries(client, taskRow.id),
        lastUpdated: taskRow.updated_at
      },
      
      dueDate: taskRow.due_date,
      completionPercentage: taskRow.completion_percentage || 0,
      completedAt: taskRow.completed_at,
      
      tags: await this.getTaskTags(client, taskRow.id),
      labels: await this.getTaskLabels(client, taskRow.id),
      component: taskRow.component || 'general',
      epic: taskRow.epic,
      sprint: taskRow.sprint,
      
      metrics: {
        cycleTime: taskRow.cycle_time || 0,
        leadTime: taskRow.lead_time || 0,
        blockedTime: taskRow.blocked_time || 0,
        reviewTime: taskRow.review_time || 0,
        reworkCount: taskRow.rework_count || 0
      },
      
      comments: await this.getTaskComments(client, taskRow.id),
      statusHistory: await this.getStatusHistory(client, taskRow.id)
    };

    return task;
  }

  private async insertTaskAssignments(client: PoolClient, taskId: string, assignments: any[]): Promise<void> {
    if (assignments.length === 0) return;

    const query = `
      INSERT INTO task_assignments (task_id, assignee_id, assignee_name, assigned_by, role, workload_percentage, assigned_at)
      VALUES ${assignments.map((_, i) => `($${i * 7 + 1}, $${i * 7 + 2}, $${i * 7 + 3}, $${i * 7 + 4}, $${i * 7 + 5}, $${i * 7 + 6}, $${i * 7 + 7})`).join(', ')}
    `;

    const params = assignments.flatMap(assignment => [
      taskId, assignment.assigneeId, assignment.assigneeName, assignment.assignedBy,
      assignment.role, assignment.workloadPercentage, assignment.assignedAt
    ]);

    await client.query(query, params);
  }

  private async insertTaskRequirements(client: PoolClient, taskId: string, requirements: string[]): Promise<void> {
    if (requirements.length === 0) return;

    const query = `
      INSERT INTO task_requirements (task_id, requirement_id)
      VALUES ${requirements.map((_, i) => `($1, $${i + 2})`).join(', ')}
    `;

    await client.query(query, [taskId, ...requirements]);
  }

  private async insertAcceptanceCriteria(client: PoolClient, taskId: string, criteria: any[]): Promise<void> {
    if (criteria.length === 0) return;

    const query = `
      INSERT INTO acceptance_criteria (id, task_id, description, completed, validation_method, validation_script, validated_by, validated_at, notes)
      VALUES ${criteria.map((_, i) => `($${i * 9 + 1}, $${i * 9 + 2}, $${i * 9 + 3}, $${i * 9 + 4}, $${i * 9 + 5}, $${i * 9 + 6}, $${i * 9 + 7}, $${i * 9 + 8}, $${i * 9 + 9})`).join(', ')}
    `;

    const params = criteria.flatMap(criterion => [
      criterion.id, taskId, criterion.description, criterion.completed,
      criterion.validationMethod, criterion.validationScript,
      criterion.validatedBy, criterion.validatedAt, criterion.notes
    ]);

    await client.query(query, params);
  }

  private async insertTaskTags(client: PoolClient, taskId: string, tags: string[]): Promise<void> {
    if (tags.length === 0) return;

    const query = `
      INSERT INTO task_tags (task_id, tag)
      VALUES ${tags.map((_, i) => `($1, $${i + 2})`).join(', ')}
    `;

    await client.query(query, [taskId, ...tags]);
  }

  private async insertStatusHistory(client: PoolClient, taskId: string, history: any[]): Promise<void> {
    if (history.length === 0) return;

    const query = `
      INSERT INTO task_status_history (id, task_id, from_status, to_status, changed_by, changed_at, reason)
      VALUES ${history.map((_, i) => `($${i * 7 + 1}, $${i * 7 + 2}, $${i * 7 + 3}, $${i * 7 + 4}, $${i * 7 + 5}, $${i * 7 + 6}, $${i * 7 + 7})`).join(', ')}
    `;

    const params = history.flatMap(entry => [
      entry.id, taskId, entry.fromStatus, entry.toStatus,
      entry.changedBy, entry.changedAt, entry.reason
    ]);

    await client.query(query, params);
  }

  // Additional helper methods for retrieving related data
  private async getTaskAssignments(client: PoolClient, taskId: string): Promise<any[]> {
    const query = 'SELECT * FROM task_assignments WHERE task_id = $1';
    const result = await client.query(query, [taskId]);
    return result.rows.map(row => ({
      assigneeId: row.assignee_id,
      assigneeName: row.assignee_name,
      assignedAt: row.assigned_at,
      assignedBy: row.assigned_by,
      role: row.role,
      workloadPercentage: row.workload_percentage
    }));
  }

  private async getTaskDependencies(client: PoolClient, taskId: string): Promise<any[]> {
    const query = 'SELECT * FROM task_dependencies WHERE task_id = $1';
    const result = await client.query(query, [taskId]);
    return result.rows.map(row => ({
      taskId: row.depends_on_task_id,
      type: row.dependency_type,
      description: row.description
    }));
  }

  private async getBlockedByTasks(client: PoolClient, taskId: string): Promise<string[]> {
    const query = 'SELECT depends_on_task_id FROM task_dependencies WHERE task_id = $1';
    const result = await client.query(query, [taskId]);
    return result.rows.map(row => row.depends_on_task_id);
  }

  private async getBlockingTasks(client: PoolClient, taskId: string): Promise<string[]> {
    const query = 'SELECT task_id FROM task_dependencies WHERE depends_on_task_id = $1';
    const result = await client.query(query, [taskId]);
    return result.rows.map(row => row.task_id);
  }

  private async getTaskRequirements(client: PoolClient, taskId: string): Promise<string[]> {
    const query = 'SELECT requirement_id FROM task_requirements WHERE task_id = $1';
    const result = await client.query(query, [taskId]);
    return result.rows.map(row => row.requirement_id);
  }

  private async getAcceptanceCriteria(client: PoolClient, taskId: string): Promise<any[]> {
    const query = 'SELECT * FROM acceptance_criteria WHERE task_id = $1 ORDER BY created_at';
    const result = await client.query(query, [taskId]);
    return result.rows.map(row => ({
      id: row.id,
      description: row.description,
      completed: row.completed,
      validationMethod: row.validation_method,
      validationScript: row.validation_script,
      validatedBy: row.validated_by,
      validatedAt: row.validated_at,
      notes: row.notes
    }));
  }

  private async getTimeEntries(client: PoolClient, taskId: string): Promise<any[]> {
    const query = 'SELECT * FROM task_time_entries WHERE task_id = $1 ORDER BY start_time';
    const result = await client.query(query, [taskId]);
    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      startTime: row.start_time,
      endTime: row.end_time,
      duration: row.duration,
      description: row.description,
      type: row.entry_type
    }));
  }

  private async getTaskTags(client: PoolClient, taskId: string): Promise<string[]> {
    const query = 'SELECT tag FROM task_tags WHERE task_id = $1';
    const result = await client.query(query, [taskId]);
    return result.rows.map(row => row.tag);
  }

  private async getTaskLabels(client: PoolClient, taskId: string): Promise<string[]> {
    const query = 'SELECT label FROM task_labels WHERE task_id = $1';
    const result = await client.query(query, [taskId]);
    return result.rows.map(row => row.label);
  }

  private async getTaskComments(client: PoolClient, taskId: string): Promise<any[]> {
    const query = 'SELECT * FROM task_comments WHERE task_id = $1 ORDER BY created_at';
    const result = await client.query(query, [taskId]);
    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      content: row.content,
      createdAt: row.created_at,
      type: row.comment_type
    }));
  }

  private async getStatusHistory(client: PoolClient, taskId: string): Promise<any[]> {
    const query = 'SELECT * FROM task_status_history WHERE task_id = $1 ORDER BY changed_at';
    const result = await client.query(query, [taskId]);
    return result.rows.map(row => ({
      id: row.id,
      fromStatus: row.from_status,
      toStatus: row.to_status,
      changedBy: row.changed_by,
      changedAt: row.changed_at,
      reason: row.reason
    }));
  }

  private async updateTaskRelatedData(client: PoolClient, task: EnhancedTask): Promise<void> {
    // This would involve updating assignments, criteria, tags, etc.
    // For brevity, implementing a simplified version
    
    // Update acceptance criteria completion status
    for (const criteria of task.acceptanceCriteria) {
      await client.query(
        'UPDATE acceptance_criteria SET completed = $1, validated_by = $2, validated_at = $3 WHERE id = $4',
        [criteria.completed, criteria.validatedBy, criteria.validatedAt, criteria.id]
      );
    }
  }

  private mapSortField(field: string): string {
    const fieldMap: Record<string, string> = {
      'priority': 'priority',
      'dueDate': 'due_date',
      'createdAt': 'created_at',
      'updatedAt': 'updated_at',
      'status': 'status',
      'title': 'title'
    };

    return fieldMap[field] || 'created_at';
  }
}