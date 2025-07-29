// Basic usage example for the Quality System

import { qualitySystem } from '../QualitySystem';
import { Task } from '../types';

async function demonstrateQualitySystem() {
  console.log('🚀 Starting Quality System Demo');

  try {
    // 1. Create a quality improvement task
    console.log('\n📝 Creating a new task...');
    const taskData: Partial<Task> = {
      title: 'Improve TypeScript Coverage',
      description: 'Add proper type annotations to utility functions',
      priority: 'P1',
      estimatedHours: 6,
      requirements: ['REQ-1.1', 'REQ-6.5'],
      acceptanceCriteria: [
        {
          id: 'AC-1',
          description: 'All utility functions have proper TypeScript types',
          completed: false,
          validationMethod: 'automated',
          validationScript: 'npm run type-check'
        },
        {
          id: 'AC-2', 
          description: 'TypeScript strict mode is enabled',
          completed: false,
          validationMethod: 'manual'
        }
      ]
    };

    const task = await qualitySystem.createTask(taskData);
    console.log(`✅ Task created: ${task.id} - ${task.title}`);

    // 2. Run quality checks
    console.log('\n🔍 Running quality checks...');
    const checks = await qualitySystem.runQualityChecks();
    console.log(`✅ Completed ${checks.length} quality checks`);

    // 3. Calculate overall quality score
    console.log('\n📊 Calculating quality score...');
    const score = await qualitySystem.calculateQualityScore();
    console.log(`✅ Overall quality score: ${score}/100`);

    // 4. Get detailed quality report
    console.log('\n📋 Generating quality report...');
    const report = await qualitySystem.getQualityReport();
    console.log(`✅ Report generated with ${report.issues.length} issues and ${report.suggestions.length} suggestions`);

    // 5. Update task status
    console.log('\n🔄 Updating task status...');
    await qualitySystem.updateTaskStatus(task.id, 'in_progress');
    console.log('✅ Task status updated to in_progress');

    // 6. Assign task
    console.log('\n👤 Assigning task...');
    await qualitySystem.assignTask(task.id, 'developer@example.com');
    console.log('✅ Task assigned to developer@example.com');

    // 7. Check system health
    console.log('\n🏥 Checking system health...');
    const health = await qualitySystem.getSystemHealth();
    console.log(`✅ System status: ${health.status}`);
    console.log('   Services:', Object.entries(health.services)
      .map(([name, status]) => `${name}: ${status ? '✅' : '❌'}`)
      .join(', '));

    // 8. Get error statistics
    console.log('\n📈 Getting error statistics...');
    const errorStats = await qualitySystem.getErrorStatistics();
    console.log('✅ Error statistics:', errorStats);

    // 9. Validate task completion (will fail since criteria not met)
    console.log('\n✅ Validating task completion...');
    const validation = await qualitySystem.validateTaskCompletion(task.id);
    console.log(`   Valid: ${validation.isValid}`);
    console.log(`   Completed criteria: ${validation.completedCriteria}/${validation.totalCriteria}`);
    if (validation.errors.length > 0) {
      console.log('   Errors:', validation.errors);
    }

    console.log('\n🎉 Quality System Demo completed successfully!');

  } catch (error) {
    console.error('❌ Demo failed:', error);
  } finally {
    // Clean up
    await qualitySystem.shutdown();
    console.log('🔄 Quality System shut down');
  }
}

// Example of using individual services
async function demonstrateAdvancedUsage() {
  console.log('\n🔧 Advanced Usage Demo');

  try {
    // Get specific quality check
    const qualityEngine = qualitySystem['qualityEngine'];
    const typeScriptCheck = await qualityEngine.runSpecificCheck('typescript');
    console.log(`TypeScript check score: ${typeScriptCheck.result?.score || 'N/A'}`);

    // Get all tasks
    const allTasks = await qualitySystem.getAllTasks();
    console.log(`Total tasks in system: ${allTasks.length}`);

  } catch (error) {
    console.error('❌ Advanced demo failed:', error);
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  demonstrateQualitySystem()
    .then(() => demonstrateAdvancedUsage())
    .catch(console.error);
}

export { demonstrateQualitySystem, demonstrateAdvancedUsage };