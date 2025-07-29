#!/usr/bin/env ts-node

/**
 * Task Management Service Demo
 * 
 * This script demonstrates the comprehensive functionality of the EnhancedTaskManagementService,
 * including task creation, assignment, dependency management, and progress tracking.
 */

import { EnhancedTaskManagementService } from '../EnhancedTaskManagementService';
import { TaskType, TaskPriority, TaskStatus } from '../TaskTypes';
import { AdvancedLogger } from '../../logging/AdvancedLogger';
import { MockDataStorageService } from '../../services/MockDataStorageService';

async function runTaskManagementDemo(): Promise<void> {
  console.log('🚀 Starting Task Management Service Demo\n');

  // Initialize services
  const logger = AdvancedLogger.getInstance();
  const storage = new MockDataStorageService();
  const taskService = new EnhancedTaskManagementService(logger, storage);

  try {
    // Demo 1: Create tasks with different types and priorities
    console.log('📝 Demo 1: Creating Tasks');
    console.log('=' .repeat(50));

    const task1 = await taskService.createTask({
      title: 'Implement Error Handling Service',
      description: 'Create a comprehensive error handling service with automatic recovery mechanisms',
      type: TaskType.FEATURE,
      priority: TaskPriority.P0,
      estimatedHours: 16,
      requirements: ['REQ-2.1', 'REQ-2.3', 'REQ-2.6'],
      acceptanceCriteria: [
        {
          description: 'Error classification system implemented',
          validationMethod: 'automated',
          validationScript: 'npm run test:error-handling'
        },
        {
          description: 'Automatic recovery strategies working',
          validationMethod: 'manual'
        },
        {
          description: 'User-friendly error notifications displayed',
          validationMethod: 'test'
        }
      ],
      tags: ['error-handling', 'core-feature'],
      component: 'error-system'
    });

    const task2 = await taskService.createTask({
      title: 'Write Unit Tests for Logger',
      description: 'Comprehensive unit tests for the advanced logging system',
      type: TaskType.TESTING,
      priority: TaskPriority.P1,
      estimatedHours: 8,
      requirements: ['REQ-3.2', 'REQ-3.6'],
      acceptanceCriteria: [
        {
          description: 'Logger class has 95% test coverage',
          validationMethod: 'automated',
          validationScript: 'npm run test:coverage -- --testPathPattern=logger'
        }
      ],
      tags: ['testing', 'logger'],
      component: 'logging-system'
    });

    const task3 = await taskService.createTask({
      title: 'Refactor GameContext Component',
      description: 'Split large GameContext into smaller, focused contexts',
      type: TaskType.REFACTORING,
      priority: TaskPriority.P2,
      estimatedHours: 12,
      requirements: ['REQ-4.1'],
      acceptanceCriteria: [
        {
          description: 'GameContext split into 3 separate contexts',
          validationMethod: 'manual'
        },
        {
          description: 'Code complexity reduced below threshold',
          validationMethod: 'automated',
          validationScript: 'npm run analyze:complexity'
        }
      ],
      tags: ['refactoring', 'context'],
      component: 'game-engine'
    });

    console.log(`✅ Created task: ${task1.title} (ID: ${task1.id})`);
    console.log(`✅ Created task: ${task2.title} (ID: ${task2.id})`);
    console.log(`✅ Created task: ${task3.title} (ID: ${task3.id})`);

    // Demo 2: Task assignment and workload management
    console.log('\n👥 Demo 2: Task Assignment and Workload Management');
    console.log('=' .repeat(50));

    await taskService.assignTask(task1.id, 'dev-001', 'owner');
    await taskService.assignTask(task1.id, 'dev-002', 'contributor');
    await taskService.assignTask(task2.id, 'qa-001', 'owner');
    await taskService.assignTask(task3.id, 'dev-001', 'owner');

    console.log('✅ Tasks assigned to team members');

    const workloadBalance = await taskService.getWorkloadBalance();
    console.log('\n📊 Current Workload Balance:');
    workloadBalance.forEach(balance => {
      console.log(`  ${balance.userName}:`);
      console.log(`    - Total Tasks: ${balance.totalTasks}`);
      console.log(`    - Active Tasks: ${balance.activeTasks}`);
      console.log(`    - Estimated Hours: ${balance.totalEstimatedHours}`);
      console.log(`    - Utilization: ${balance.utilizationPercentage.toFixed(1)}%`);
      console.log(`    - Risk Level: ${balance.overloadRisk}`);
      if (balance.recommendedActions.length > 0) {
        console.log(`    - Recommendations: ${balance.recommendedActions.join(', ')}`);
      }
      console.log();
    });

    // Demo 3: Task dependencies and blocking relationships
    console.log('🔗 Demo 3: Task Dependencies');
    console.log('=' .repeat(50));

    // Task 2 (testing) depends on Task 1 (implementation)
    await taskService.addTaskDependency(task2.id, task1.id);
    console.log(`✅ Added dependency: "${task2.title}" depends on "${task1.title}"`);

    // Demo 4: Task status management and validation
    console.log('\n🔄 Demo 4: Task Status Management');
    console.log('=' .repeat(50));

    // Start working on task 1
    await taskService.updateTaskStatus(task1.id, TaskStatus.IN_PROGRESS, 'Development started');
    console.log(`✅ Task 1 status changed to IN_PROGRESS`);

    // Try to start task 2 (should fail due to dependency)
    try {
      await taskService.updateTaskStatus(task2.id, TaskStatus.IN_PROGRESS, 'Attempting to start testing');
    } catch (error) {
      console.log(`❌ Cannot start Task 2: ${(error as Error).message}`);
    }

    // Add time entries to task 1
    await taskService.addTimeEntry(task1.id, {
      userId: 'dev-001',
      userName: 'Developer 1',
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      endTime: new Date(),
      duration: 120, // 2 hours in minutes
      description: 'Implemented error classification system',
      type: 'development'
    });

    console.log('✅ Added time entry to Task 1');

    // Update acceptance criteria
    const task1Updated = await taskService.getTaskById(task1.id);
    if (task1Updated) {
      const firstCriteria = task1Updated.acceptanceCriteria[0];
      await taskService.updateAcceptanceCriteria(task1.id, firstCriteria.id, true, 'dev-001');
      console.log('✅ Marked first acceptance criteria as completed');
    }

    // Add comments
    await taskService.addComment(task1.id, {
      userId: 'dev-001',
      userName: 'Developer 1',
      content: 'Error classification system is working well. Moving on to recovery strategies.',
      type: 'comment'
    });

    console.log('✅ Added comment to Task 1');

    // Demo 5: Task filtering and statistics
    console.log('\n📊 Demo 5: Task Analytics and Statistics');
    console.log('=' .repeat(50));

    // Get tasks by different filters
    const highPriorityTasks = await taskService.getTasksByFilter({
      priority: [TaskPriority.P0, TaskPriority.P1]
    });

    const inProgressTasks = await taskService.getTasksByFilter({
      status: [TaskStatus.IN_PROGRESS]
    });

    console.log(`📈 High Priority Tasks: ${highPriorityTasks.length}`);
    console.log(`🔄 In Progress Tasks: ${inProgressTasks.length}`);

    // Get task statistics
    const stats = await taskService.getTaskStatistics();
    console.log('\n📊 Task Statistics:');
    console.log(`  Total Tasks: ${stats.totalTasks}`);
    console.log(`  Completion Rate: ${stats.completionRate.toFixed(1)}%`);
    console.log(`  Blocked Tasks: ${stats.blockedTasksCount}`);
    console.log(`  Overdue Tasks: ${stats.overdueTasks}`);
    
    console.log('\n  Tasks by Status:');
    Object.entries(stats.tasksByStatus).forEach(([status, count]) => {
      if (count > 0) {
        console.log(`    ${status}: ${count}`);
      }
    });

    console.log('\n  Tasks by Priority:');
    Object.entries(stats.tasksByPriority).forEach(([priority, count]) => {
      if (count > 0) {
        console.log(`    ${priority}: ${count}`);
      }
    });

    // Demo 6: Task validation
    console.log('\n✅ Demo 6: Task Validation');
    console.log('=' .repeat(50));

    const validationResult = await taskService.validateCompletion(task1.id);
    console.log(`Task 1 Validation Result:`);
    console.log(`  Valid: ${validationResult.isValid}`);
    console.log(`  Completed Criteria: ${validationResult.completedCriteria}/${validationResult.totalCriteria}`);
    
    if (validationResult.errors.length > 0) {
      console.log(`  Errors:`);
      validationResult.errors.forEach(error => console.log(`    - ${error}`));
    }
    
    if (validationResult.warnings.length > 0) {
      console.log(`  Warnings:`);
      validationResult.warnings.forEach(warning => console.log(`    - ${warning}`));
    }

    // Demo 7: Dependency graph
    console.log('\n🕸️ Demo 7: Dependency Graph Analysis');
    console.log('=' .repeat(50));

    const dependencyGraph = await taskService.getDependencyGraph();
    console.log(`📊 Dependency Graph:`);
    console.log(`  Total Nodes: ${dependencyGraph.nodes.length}`);
    console.log(`  Total Edges: ${dependencyGraph.edges.length}`);
    console.log(`  Circular Dependencies: ${dependencyGraph.cycles.length}`);
    console.log(`  Critical Path Length: ${dependencyGraph.criticalPath.length}`);

    if (dependencyGraph.criticalPath.length > 0) {
      console.log(`  Critical Path: ${dependencyGraph.criticalPath.join(' → ')}`);
    }

    // Demo 8: Bulk operations
    console.log('\n🔄 Demo 8: Bulk Operations');
    console.log('=' .repeat(50));

    // Add tags to multiple tasks
    await taskService.performBulkOperation({
      taskIds: [task1.id, task2.id, task3.id],
      operation: 'add_tags',
      parameters: {
        tags: ['quality-improvement', 'v1.3.38']
      }
    });

    console.log('✅ Added tags to all tasks via bulk operation');

    // Demo 9: Task completion workflow
    console.log('\n🎯 Demo 9: Task Completion Workflow');
    console.log('=' .repeat(50));

    // Complete all acceptance criteria for task 1
    const task1Final = await taskService.getTaskById(task1.id);
    if (task1Final) {
      for (let i = 1; i < task1Final.acceptanceCriteria.length; i++) {
        const criteria = task1Final.acceptanceCriteria[i];
        await taskService.updateAcceptanceCriteria(task1.id, criteria.id, true, 'dev-001');
      }
    }

    // Complete task 1
    await taskService.updateTaskStatus(task1.id, TaskStatus.COMPLETED, 'All acceptance criteria met');
    console.log('✅ Task 1 completed');

    // Now task 2 can be started
    await taskService.updateTaskStatus(task2.id, TaskStatus.IN_PROGRESS, 'Dependency completed, starting testing');
    console.log('✅ Task 2 started (dependency resolved)');

    // Final statistics
    console.log('\n📊 Final Statistics');
    console.log('=' .repeat(50));

    const finalStats = await taskService.getTaskStatistics();
    console.log(`  Completion Rate: ${finalStats.completionRate.toFixed(1)}%`);
    console.log(`  Tasks Completed: ${finalStats.tasksByStatus[TaskStatus.COMPLETED]}`);
    console.log(`  Tasks In Progress: ${finalStats.tasksByStatus[TaskStatus.IN_PROGRESS]}`);

    console.log('\n🎉 Task Management Service Demo Completed Successfully!');
    console.log('\nKey Features Demonstrated:');
    console.log('✅ Task creation with acceptance criteria');
    console.log('✅ Task assignment and workload balancing');
    console.log('✅ Dependency management and validation');
    console.log('✅ Status transitions and business rules');
    console.log('✅ Time tracking and progress monitoring');
    console.log('✅ Comments and collaboration features');
    console.log('✅ Task filtering and analytics');
    console.log('✅ Bulk operations');
    console.log('✅ Task validation and completion workflow');

  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  }
}

// Run the demo
if (require.main === module) {
  runTaskManagementDemo().catch(console.error);
}

export { runTaskManagementDemo };