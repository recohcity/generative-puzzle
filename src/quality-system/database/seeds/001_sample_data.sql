-- Seed Data: 001_sample_data
-- Description: Insert sample data for development and testing
-- Created: 2025-01-29
-- Author: Quality System

BEGIN;

-- Insert sample tasks
INSERT INTO tasks (
    id, title, description, type, priority, status, created_by, 
    estimated_hours, component, epic
) VALUES 
(
    'task-001', 
    'Implement Error Handling Service',
    'Create a comprehensive error handling service with automatic recovery mechanisms and user-friendly notifications',
    'feature',
    'P0',
    'completed',
    'dev-001',
    16,
    'error-system',
    'quality-improvement'
),
(
    'task-002',
    'Write Unit Tests for Logger',
    'Comprehensive unit tests for the advanced logging system with 95% coverage target',
    'testing',
    'P1',
    'in_progress',
    'qa-001',
    8,
    'logging-system',
    'quality-improvement'
),
(
    'task-003',
    'Refactor GameContext Component',
    'Split large GameContext into smaller, focused contexts to reduce complexity',
    'refactoring',
    'P2',
    'not_started',
    'dev-002',
    12,
    'game-engine',
    'architecture-improvement'
),
(
    'task-004',
    'Implement Quality Detection Engine',
    'Build automated quality detection engine with TypeScript, ESLint, and test coverage analysis',
    'feature',
    'P0',
    'not_started',
    'dev-001',
    24,
    'quality-engine',
    'quality-improvement'
),
(
    'task-005',
    'Create Quality Dashboard UI',
    'Build React dashboard for displaying quality metrics and trends',
    'feature',
    'P1',
    'not_started',
    'dev-003',
    20,
    'dashboard',
    'quality-improvement'
);

-- Insert task assignments
INSERT INTO task_assignments (
    task_id, assignee_id, assignee_name, assigned_by, role, workload_percentage
) VALUES 
('task-001', 'dev-001', 'Alice Johnson', 'pm-001', 'owner', 60),
('task-001', 'dev-002', 'Bob Smith', 'pm-001', 'contributor', 30),
('task-002', 'qa-001', 'Carol Davis', 'pm-001', 'owner', 80),
('task-003', 'dev-002', 'Bob Smith', 'pm-001', 'owner', 70),
('task-004', 'dev-001', 'Alice Johnson', 'pm-001', 'owner', 50),
('task-004', 'dev-003', 'David Wilson', 'pm-001', 'contributor', 40),
('task-005', 'dev-003', 'David Wilson', 'pm-001', 'owner', 60);

-- Insert task dependencies
INSERT INTO task_dependencies (
    task_id, depends_on_task_id, dependency_type, description
) VALUES 
('task-002', 'task-001', 'blocks', 'Testing depends on error handling implementation'),
('task-004', 'task-001', 'blocks', 'Quality engine needs error handling for robustness'),
('task-005', 'task-004', 'blocks', 'Dashboard needs quality engine data');

-- Insert task requirements
INSERT INTO task_requirements (
    task_id, requirement_id, description
) VALUES 
('task-001', 'REQ-2.1', 'Error classification and logging'),
('task-001', 'REQ-2.3', 'Automatic recovery strategies'),
('task-001', 'REQ-2.6', 'Team error reporting'),
('task-002', 'REQ-3.2', 'Unit test coverage targets'),
('task-002', 'REQ-3.6', 'Test quality standards'),
('task-003', 'REQ-4.1', 'Code complexity reduction'),
('task-004', 'REQ-7.2', 'Automated quality checks'),
('task-004', 'REQ-7.3', 'Quality metrics collection'),
('task-005', 'REQ-1.1', 'Quality dashboard display'),
('task-005', 'REQ-5.1', 'Real-time metrics'),
('task-005', 'REQ-5.3', 'Trend visualization');

-- Insert acceptance criteria
INSERT INTO acceptance_criteria (
    task_id, description, completed, validation_method, validation_script
) VALUES 
('task-001', 'Error classification system implemented', true, 'automated', 'npm run test:error-classification'),
('task-001', 'Automatic recovery strategies working', true, 'manual', null),
('task-001', 'User-friendly error notifications displayed', true, 'test', null),
('task-002', 'Logger class has 95% test coverage', false, 'automated', 'npm run test:coverage -- --testPathPattern=logger'),
('task-002', 'All log levels properly tested', false, 'automated', 'npm run test:logger-levels'),
('task-003', 'GameContext split into 3 separate contexts', false, 'manual', null),
('task-003', 'Code complexity reduced below threshold', false, 'automated', 'npm run analyze:complexity'),
('task-004', 'TypeScript compiler integration working', false, 'automated', 'npm run test:typescript-integration'),
('task-004', 'ESLint API integration functional', false, 'automated', 'npm run test:eslint-integration'),
('task-004', 'Test coverage detection accurate', false, 'automated', 'npm run test:coverage-detection'),
('task-005', 'Quality metrics display correctly', false, 'manual', null),
('task-005', 'Real-time updates working', false, 'test', null),
('task-005', 'Responsive design implemented', false, 'manual', null);

-- Insert time entries
INSERT INTO task_time_entries (
    task_id, user_id, user_name, start_time, end_time, duration, description, entry_type
) VALUES 
('task-001', 'dev-001', 'Alice Johnson', '2025-01-28 09:00:00', '2025-01-28 12:00:00', 180, 'Implemented error classification system', 'development'),
('task-001', 'dev-001', 'Alice Johnson', '2025-01-28 13:00:00', '2025-01-28 17:00:00', 240, 'Built automatic recovery mechanisms', 'development'),
('task-001', 'dev-002', 'Bob Smith', '2025-01-28 14:00:00', '2025-01-28 16:00:00', 120, 'Code review and testing', 'review'),
('task-002', 'qa-001', 'Carol Davis', '2025-01-29 09:00:00', '2025-01-29 11:00:00', 120, 'Writing unit tests for logger', 'testing'),
('task-002', 'qa-001', 'Carol Davis', '2025-01-29 14:00:00', '2025-01-29 15:30:00', 90, 'Test coverage analysis', 'testing');

-- Insert task comments
INSERT INTO task_comments (
    task_id, user_id, user_name, content, comment_type
) VALUES 
('task-001', 'dev-001', 'Alice Johnson', 'Error classification system is working well. Moving on to recovery strategies.', 'comment'),
('task-001', 'dev-002', 'Bob Smith', 'Code looks good. Added some suggestions for improvement.', 'comment'),
('task-001', 'pm-001', 'Project Manager', 'Task completed successfully. All acceptance criteria met.', 'status_change'),
('task-002', 'qa-001', 'Carol Davis', 'Started writing unit tests. Current coverage is at 60%.', 'comment'),
('task-002', 'qa-001', 'Carol Davis', 'Need to add more edge case tests to reach 95% coverage target.', 'comment'),
('task-003', 'dev-002', 'Bob Smith', 'Analyzing current GameContext structure. Planning the split.', 'comment'),
('task-004', 'dev-001', 'Alice Johnson', 'Waiting for error handling completion before starting.', 'comment'),
('task-005', 'dev-003', 'David Wilson', 'UI mockups ready. Waiting for quality engine data structure.', 'comment');

-- Insert status history
INSERT INTO task_status_history (
    task_id, from_status, to_status, changed_by, changed_at, reason
) VALUES 
('task-001', 'not_started', 'in_progress', 'dev-001', '2025-01-28 09:00:00', 'Development started'),
('task-001', 'in_progress', 'completed', 'dev-001', '2025-01-28 17:30:00', 'All acceptance criteria met'),
('task-002', 'not_started', 'in_progress', 'qa-001', '2025-01-29 09:00:00', 'Started writing unit tests');

-- Insert task tags
INSERT INTO task_tags (task_id, tag) VALUES 
('task-001', 'error-handling'),
('task-001', 'core-feature'),
('task-001', 'quality-improvement'),
('task-002', 'testing'),
('task-002', 'logger'),
('task-002', 'quality-improvement'),
('task-003', 'refactoring'),
('task-003', 'context'),
('task-003', 'architecture'),
('task-004', 'quality-engine'),
('task-004', 'automation'),
('task-004', 'core-feature'),
('task-005', 'dashboard'),
('task-005', 'ui'),
('task-005', 'visualization');

-- Insert task labels
INSERT INTO task_labels (task_id, label, color) VALUES 
('task-001', 'Critical', '#FF0000'),
('task-001', 'Backend', '#0066CC'),
('task-002', 'Testing', '#00CC66'),
('task-003', 'Refactor', '#FF9900'),
('task-004', 'Core', '#9900CC'),
('task-005', 'Frontend', '#CC0066');

-- Insert quality snapshots
INSERT INTO quality_snapshots (
    version, overall_score, architecture_score, typescript_score, testing_score,
    performance_score, error_handling_score, complexity_score, duplication_score,
    completed_tasks, total_tasks, blocked_tasks, team_velocity
) VALUES 
('v1.3.37', 85.0, 88.0, 92.0, 30.0, 87.0, 65.0, 78.0, 82.0, 0, 5, 0, 2.5),
('v1.3.38', 87.5, 88.0, 92.0, 35.0, 87.0, 85.0, 78.0, 82.0, 1, 5, 0, 3.0);

-- Insert system logs (sample)
INSERT INTO system_logs (
    level, message, context, user_id, session_id, component
) VALUES 
('INFO', 'Task created successfully', '{"taskId": "task-001", "title": "Implement Error Handling Service"}', 'dev-001', 'session-001', 'task-management'),
('INFO', 'Task assigned to user', '{"taskId": "task-001", "assigneeId": "dev-001", "role": "owner"}', 'pm-001', 'session-002', 'task-management'),
('INFO', 'Task status changed', '{"taskId": "task-001", "fromStatus": "not_started", "toStatus": "in_progress"}', 'dev-001', 'session-003', 'task-management'),
('INFO', 'Time entry added', '{"taskId": "task-001", "duration": 180, "type": "development"}', 'dev-001', 'session-004', 'time-tracking'),
('INFO', 'Task completed', '{"taskId": "task-001", "completionPercentage": 100}', 'dev-001', 'session-005', 'task-management'),
('WARN', 'Task approaching due date', '{"taskId": "task-002", "daysRemaining": 2}', 'system', 'session-006', 'notifications'),
('ERROR', 'Failed to load task dependencies', '{"taskId": "task-999", "error": "Task not found"}', 'dev-002', 'session-007', 'task-management');

COMMIT;