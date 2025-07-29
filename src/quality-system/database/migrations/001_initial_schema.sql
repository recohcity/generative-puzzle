-- Migration: 001_initial_schema
-- Description: Create initial database schema for Code Quality Improvement System
-- Created: 2025-01-29
-- Author: Quality System

BEGIN;

-- Create migration tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(50) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT NOW(),
    description TEXT
);

-- Check if this migration has already been applied
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM schema_migrations WHERE version = '001_initial_schema') THEN
        RAISE NOTICE 'Migration 001_initial_schema has already been applied';
        RETURN;
    END IF;
END
$$;

-- Enable UUID extension for PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tasks table - Core task information
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('feature', 'bug_fix', 'improvement', 'refactoring', 'documentation', 'testing', 'research')),
    priority VARCHAR(10) NOT NULL CHECK (priority IN ('P0', 'P1', 'P2', 'P3')),
    status VARCHAR(20) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'blocked', 'cancelled', 'on_hold')),
    
    -- Assignment and ownership
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Time tracking
    estimated_hours INTEGER DEFAULT 0,
    actual_hours INTEGER DEFAULT 0,
    remaining_hours INTEGER DEFAULT 0,
    due_date TIMESTAMP,
    
    -- Progress and completion
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    completed_at TIMESTAMP,
    
    -- Metadata
    component VARCHAR(100) DEFAULT 'general',
    epic VARCHAR(100),
    sprint VARCHAR(100),
    
    -- Quality metrics
    cycle_time BIGINT DEFAULT 0,
    lead_time BIGINT DEFAULT 0,
    blocked_time BIGINT DEFAULT 0,
    review_time BIGINT DEFAULT 0,
    rework_count INTEGER DEFAULT 0,
    
    -- Constraints
    CONSTRAINT tasks_title_not_empty CHECK (LENGTH(TRIM(title)) > 0),
    CONSTRAINT tasks_description_not_empty CHECK (LENGTH(TRIM(description)) > 0)
);

-- Task assignments table
CREATE TABLE task_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    assignee_id VARCHAR(100) NOT NULL,
    assignee_name VARCHAR(255) NOT NULL,
    assigned_at TIMESTAMP DEFAULT NOW(),
    assigned_by VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'contributor', 'reviewer')),
    workload_percentage INTEGER DEFAULT 0 CHECK (workload_percentage >= 0 AND workload_percentage <= 100),
    
    UNIQUE(task_id, assignee_id, role)
);

-- Task dependencies table
CREATE TABLE task_dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    dependency_type VARCHAR(20) DEFAULT 'blocks' CHECK (dependency_type IN ('blocks', 'blocked_by', 'related_to')),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT no_self_dependency CHECK (task_id != depends_on_task_id),
    UNIQUE(task_id, depends_on_task_id, dependency_type)
);

-- Task requirements table
CREATE TABLE task_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    requirement_id VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(task_id, requirement_id)
);

-- Acceptance criteria table
CREATE TABLE acceptance_criteria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    validation_method VARCHAR(20) NOT NULL CHECK (validation_method IN ('manual', 'automated', 'test')),
    validation_script TEXT,
    validated_by VARCHAR(100),
    validated_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT acceptance_criteria_description_not_empty CHECK (LENGTH(TRIM(description)) > 0)
);

-- Task time entries table
CREATE TABLE task_time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id VARCHAR(100) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration INTEGER NOT NULL,
    description TEXT NOT NULL,
    entry_type VARCHAR(20) NOT NULL CHECK (entry_type IN ('development', 'testing', 'review', 'research', 'meeting')),
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT time_entry_positive_duration CHECK (duration > 0),
    CONSTRAINT time_entry_valid_time_range CHECK (end_time IS NULL OR end_time >= start_time)
);

-- Task comments table
CREATE TABLE task_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id VARCHAR(100) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    comment_type VARCHAR(20) DEFAULT 'comment' CHECK (comment_type IN ('comment', 'status_change', 'assignment', 'system')),
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT comment_content_not_empty CHECK (LENGTH(TRIM(content)) > 0)
);

-- Task status history table
CREATE TABLE task_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    from_status VARCHAR(20) NOT NULL,
    to_status VARCHAR(20) NOT NULL,
    changed_by VARCHAR(100) NOT NULL,
    changed_at TIMESTAMP DEFAULT NOW(),
    reason TEXT,
    
    CONSTRAINT status_history_valid_statuses CHECK (
        from_status IN ('not_started', 'in_progress', 'completed', 'blocked', 'cancelled', 'on_hold') AND
        to_status IN ('not_started', 'in_progress', 'completed', 'blocked', 'cancelled', 'on_hold')
    )
);

-- Task tags table
CREATE TABLE task_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    tag VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(task_id, tag),
    CONSTRAINT tag_not_empty CHECK (LENGTH(TRIM(tag)) > 0)
);

-- Task labels table
CREATE TABLE task_labels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    label VARCHAR(100) NOT NULL,
    color VARCHAR(7),
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(task_id, label),
    CONSTRAINT label_not_empty CHECK (LENGTH(TRIM(label)) > 0)
);

-- Quality snapshots table
CREATE TABLE quality_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP DEFAULT NOW(),
    version VARCHAR(50),
    overall_score DECIMAL(5,2) CHECK (overall_score >= 0 AND overall_score <= 100),
    architecture_score DECIMAL(5,2) CHECK (architecture_score >= 0 AND architecture_score <= 100),
    typescript_score DECIMAL(5,2) CHECK (typescript_score >= 0 AND typescript_score <= 100),
    testing_score DECIMAL(5,2) CHECK (testing_score >= 0 AND testing_score <= 100),
    performance_score DECIMAL(5,2) CHECK (performance_score >= 0 AND performance_score <= 100),
    error_handling_score DECIMAL(5,2) CHECK (error_handling_score >= 0 AND error_handling_score <= 100),
    complexity_score DECIMAL(5,2) CHECK (complexity_score >= 0 AND complexity_score <= 100),
    duplication_score DECIMAL(5,2) CHECK (duplication_score >= 0 AND duplication_score <= 100),
    completed_tasks INTEGER DEFAULT 0,
    total_tasks INTEGER DEFAULT 0,
    blocked_tasks INTEGER DEFAULT 0,
    team_velocity DECIMAL(5,2) DEFAULT 0
);

-- System logs table
CREATE TABLE system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP DEFAULT NOW(),
    level VARCHAR(10) NOT NULL CHECK (level IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL')),
    message TEXT NOT NULL,
    context JSONB,
    error_details JSONB,
    user_id VARCHAR(100),
    session_id VARCHAR(100),
    component VARCHAR(100),
    
    CONSTRAINT log_message_not_empty CHECK (LENGTH(TRIM(message)) > 0)
);

-- Create indexes for better performance
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_type ON tasks(type);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_component ON tasks(component);

CREATE INDEX idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX idx_task_assignments_assignee_id ON task_assignments(assignee_id);
CREATE INDEX idx_task_assignments_role ON task_assignments(role);

CREATE INDEX idx_task_dependencies_task_id ON task_dependencies(task_id);
CREATE INDEX idx_task_dependencies_depends_on ON task_dependencies(depends_on_task_id);

CREATE INDEX idx_acceptance_criteria_task_id ON acceptance_criteria(task_id);
CREATE INDEX idx_acceptance_criteria_completed ON acceptance_criteria(completed);

CREATE INDEX idx_time_entries_task_id ON task_time_entries(task_id);
CREATE INDEX idx_time_entries_user_id ON task_time_entries(user_id);
CREATE INDEX idx_time_entries_start_time ON task_time_entries(start_time);

CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX idx_task_comments_user_id ON task_comments(user_id);
CREATE INDEX idx_task_comments_created_at ON task_comments(created_at);

CREATE INDEX idx_status_history_task_id ON task_status_history(task_id);
CREATE INDEX idx_status_history_changed_at ON task_status_history(changed_at);

CREATE INDEX idx_task_tags_task_id ON task_tags(task_id);
CREATE INDEX idx_task_tags_tag ON task_tags(tag);

CREATE INDEX idx_quality_snapshots_timestamp ON quality_snapshots(timestamp);
CREATE INDEX idx_quality_snapshots_version ON quality_snapshots(version);

CREATE INDEX idx_system_logs_timestamp ON system_logs(timestamp);
CREATE INDEX idx_system_logs_level ON system_logs(level);
CREATE INDEX idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX idx_system_logs_component ON system_logs(component);

-- Record this migration as applied
INSERT INTO schema_migrations (version, description) 
VALUES ('001_initial_schema', 'Create initial database schema for Code Quality Improvement System');

COMMIT;