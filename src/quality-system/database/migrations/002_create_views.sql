-- Migration: 002_create_views
-- Description: Create database views for common queries and analytics
-- Created: 2025-01-29
-- Author: Quality System

BEGIN;

-- Check if this migration has already been applied
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM schema_migrations WHERE version = '002_create_views') THEN
        RAISE NOTICE 'Migration 002_create_views has already been applied';
        RETURN;
    END IF;
END
$$;

-- Create view for task summary with aggregated data
CREATE VIEW task_summary AS
SELECT 
    t.id,
    t.title,
    t.description,
    t.type,
    t.priority,
    t.status,
    t.created_by,
    t.created_at,
    t.updated_at,
    t.estimated_hours,
    t.actual_hours,
    t.completion_percentage,
    t.due_date,
    t.component,
    t.epic,
    t.sprint,
    COUNT(DISTINCT ta.assignee_id) as assignee_count,
    COUNT(DISTINCT td.depends_on_task_id) as dependency_count,
    COUNT(DISTINCT ac.id) as criteria_count,
    COUNT(DISTINCT CASE WHEN ac.completed = true THEN ac.id END) as completed_criteria_count,
    COUNT(DISTINCT tte.id) as time_entry_count,
    COUNT(DISTINCT tc.id) as comment_count,
    ARRAY_AGG(DISTINCT tt.tag) FILTER (WHERE tt.tag IS NOT NULL) as tags
FROM tasks t
LEFT JOIN task_assignments ta ON t.id = ta.task_id
LEFT JOIN task_dependencies td ON t.id = td.task_id
LEFT JOIN acceptance_criteria ac ON t.id = ac.task_id
LEFT JOIN task_time_entries tte ON t.id = tte.task_id
LEFT JOIN task_comments tc ON t.id = tc.task_id
LEFT JOIN task_tags tt ON t.id = tt.task_id
GROUP BY t.id, t.title, t.description, t.type, t.priority, t.status, 
         t.created_by, t.created_at, t.updated_at, t.estimated_hours, 
         t.actual_hours, t.completion_percentage, t.due_date, t.component,
         t.epic, t.sprint;

-- Create view for user workload analysis
CREATE VIEW user_workload AS
SELECT 
    ta.assignee_id,
    ta.assignee_name,
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN t.status IN ('not_started', 'in_progress') THEN 1 END) as active_tasks,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN t.status = 'blocked' THEN 1 END) as blocked_tasks,
    SUM(t.estimated_hours * ta.workload_percentage / 100.0) as total_estimated_hours,
    SUM(t.actual_hours * ta.workload_percentage / 100.0) as total_actual_hours,
    AVG(t.completion_percentage) as avg_completion_percentage,
    COUNT(CASE WHEN t.due_date < NOW() AND t.status != 'completed' THEN 1 END) as overdue_tasks,
    CASE 
        WHEN COUNT(CASE WHEN t.status IN ('not_started', 'in_progress') THEN 1 END) > 5 THEN 'high'
        WHEN COUNT(CASE WHEN t.status IN ('not_started', 'in_progress') THEN 1 END) > 3 THEN 'medium'
        ELSE 'low'
    END as overload_risk
FROM task_assignments ta
JOIN tasks t ON ta.task_id = t.id
GROUP BY ta.assignee_id, ta.assignee_name;

-- Create view for comprehensive task statistics
CREATE VIEW task_statistics AS
SELECT 
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN status = 'not_started' THEN 1 END) as not_started_tasks,
    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN status = 'blocked' THEN 1 END) as blocked_tasks,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_tasks,
    COUNT(CASE WHEN status = 'on_hold' THEN 1 END) as on_hold_tasks,
    COUNT(CASE WHEN priority = 'P0' THEN 1 END) as p0_tasks,
    COUNT(CASE WHEN priority = 'P1' THEN 1 END) as p1_tasks,
    COUNT(CASE WHEN priority = 'P2' THEN 1 END) as p2_tasks,
    COUNT(CASE WHEN priority = 'P3' THEN 1 END) as p3_tasks,
    COUNT(CASE WHEN type = 'feature' THEN 1 END) as feature_tasks,
    COUNT(CASE WHEN type = 'bug_fix' THEN 1 END) as bug_fix_tasks,
    COUNT(CASE WHEN type = 'improvement' THEN 1 END) as improvement_tasks,
    COUNT(CASE WHEN type = 'refactoring' THEN 1 END) as refactoring_tasks,
    COUNT(CASE WHEN type = 'documentation' THEN 1 END) as documentation_tasks,
    COUNT(CASE WHEN type = 'testing' THEN 1 END) as testing_tasks,
    COUNT(CASE WHEN type = 'research' THEN 1 END) as research_tasks,
    AVG(CASE WHEN completed_at IS NOT NULL THEN 
        EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400.0 
    END) as avg_lead_time_days,
    AVG(CASE WHEN status = 'completed' AND cycle_time > 0 THEN 
        cycle_time / 86400000.0 
    END) as avg_cycle_time_days,
    COUNT(CASE WHEN due_date < NOW() AND status != 'completed' THEN 1 END) as overdue_tasks,
    ROUND(
        COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / 
        NULLIF(COUNT(*), 0), 2
    ) as completion_rate_percentage
FROM tasks;

-- Create view for task dependency analysis
CREATE VIEW task_dependency_analysis AS
SELECT 
    t.id as task_id,
    t.title,
    t.status,
    t.priority,
    COUNT(DISTINCT td_blocking.depends_on_task_id) as dependencies_count,
    COUNT(DISTINCT td_blocked.task_id) as blocking_count,
    ARRAY_AGG(DISTINCT td_blocking.depends_on_task_id) FILTER (WHERE td_blocking.depends_on_task_id IS NOT NULL) as depends_on_tasks,
    ARRAY_AGG(DISTINCT td_blocked.task_id) FILTER (WHERE td_blocked.task_id IS NOT NULL) as blocking_tasks,
    CASE 
        WHEN COUNT(DISTINCT td_blocking.depends_on_task_id) > 0 AND t.status = 'not_started' THEN 'dependency_blocked'
        WHEN COUNT(DISTINCT td_blocked.task_id) > 3 THEN 'critical_path'
        WHEN COUNT(DISTINCT td_blocking.depends_on_task_id) = 0 THEN 'independent'
        ELSE 'normal'
    END as dependency_status
FROM tasks t
LEFT JOIN task_dependencies td_blocking ON t.id = td_blocking.task_id
LEFT JOIN task_dependencies td_blocked ON t.id = td_blocked.depends_on_task_id
GROUP BY t.id, t.title, t.status, t.priority;

-- Create view for time tracking analysis
CREATE VIEW time_tracking_analysis AS
SELECT 
    t.id as task_id,
    t.title,
    t.status,
    t.estimated_hours,
    t.actual_hours,
    t.remaining_hours,
    COUNT(tte.id) as time_entry_count,
    SUM(tte.duration) / 60.0 as total_logged_hours,
    AVG(tte.duration) / 60.0 as avg_time_entry_hours,
    COUNT(DISTINCT tte.user_id) as contributors_count,
    CASE 
        WHEN t.estimated_hours > 0 THEN 
            ROUND((t.actual_hours * 100.0 / t.estimated_hours), 2)
        ELSE 0
    END as time_utilization_percentage,
    CASE 
        WHEN t.actual_hours > t.estimated_hours * 1.2 THEN 'over_budget'
        WHEN t.actual_hours > t.estimated_hours * 0.8 THEN 'on_track'
        ELSE 'under_budget'
    END as budget_status
FROM tasks t
LEFT JOIN task_time_entries tte ON t.id = tte.task_id
GROUP BY t.id, t.title, t.status, t.estimated_hours, t.actual_hours, t.remaining_hours;

-- Create view for quality metrics over time
CREATE VIEW quality_trends AS
SELECT 
    qs.version,
    qs.timestamp,
    qs.overall_score,
    qs.architecture_score,
    qs.typescript_score,
    qs.testing_score,
    qs.performance_score,
    qs.error_handling_score,
    qs.complexity_score,
    qs.duplication_score,
    qs.completed_tasks,
    qs.total_tasks,
    qs.blocked_tasks,
    qs.team_velocity,
    LAG(qs.overall_score) OVER (ORDER BY qs.timestamp) as previous_overall_score,
    qs.overall_score - LAG(qs.overall_score) OVER (ORDER BY qs.timestamp) as score_change,
    CASE 
        WHEN qs.total_tasks > 0 THEN 
            ROUND((qs.completed_tasks * 100.0 / qs.total_tasks), 2)
        ELSE 0
    END as completion_percentage
FROM quality_snapshots qs
ORDER BY qs.timestamp;

-- Create view for component analysis
CREATE VIEW component_analysis AS
SELECT 
    t.component,
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN t.status IN ('not_started', 'in_progress') THEN 1 END) as active_tasks,
    COUNT(CASE WHEN t.status = 'blocked' THEN 1 END) as blocked_tasks,
    AVG(t.completion_percentage) as avg_completion_percentage,
    SUM(t.estimated_hours) as total_estimated_hours,
    SUM(t.actual_hours) as total_actual_hours,
    COUNT(CASE WHEN t.due_date < NOW() AND t.status != 'completed' THEN 1 END) as overdue_tasks,
    COUNT(DISTINCT ta.assignee_id) as unique_contributors,
    ROUND(
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END) * 100.0 / 
        NULLIF(COUNT(*), 0), 2
    ) as completion_rate
FROM tasks t
LEFT JOIN task_assignments ta ON t.id = ta.task_id
GROUP BY t.component
ORDER BY total_tasks DESC;

-- Record this migration as applied
INSERT INTO schema_migrations (version, description) 
VALUES ('002_create_views', 'Create database views for common queries and analytics');

COMMIT;