// Enhanced Task Types and Interfaces

export enum TaskStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  BLOCKED = 'blocked',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold'
}

export enum TaskPriority {
  P0 = 'P0', // Critical
  P1 = 'P1', // High
  P2 = 'P2', // Medium
  P3 = 'P3'  // Low
}

export enum TaskType {
  FEATURE = 'feature',
  BUG_FIX = 'bug_fix',
  IMPROVEMENT = 'improvement',
  REFACTORING = 'refactoring',
  DOCUMENTATION = 'documentation',
  TESTING = 'testing',
  RESEARCH = 'research'
}

export interface TaskDependency {
  taskId: string;
  type: 'blocks' | 'blocked_by' | 'related_to';
  description?: string;
}

export interface AcceptanceCriteria {
  id: string;
  description: string;
  completed: boolean;
  validationMethod: 'manual' | 'automated' | 'test';
  validationScript?: string;
  validatedBy?: string;
  validatedAt?: Date;
  notes?: string;
}

export interface TaskAssignment {
  assigneeId: string;
  assigneeName: string;
  assignedAt: Date;
  assignedBy: string;
  role: 'owner' | 'contributor' | 'reviewer';
  workloadPercentage: number;
}

export interface TaskTimeTracking {
  estimatedHours: number;
  actualHours: number;
  remainingHours: number;
  timeEntries: TimeEntry[];
  lastUpdated: Date;
}

export interface TimeEntry {
  id: string;
  userId: string;
  userName: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  description: string;
  type: 'development' | 'testing' | 'review' | 'research' | 'meeting';
}

export interface TaskMetrics {
  cycleTime: number; // time from start to completion
  leadTime: number;  // time from creation to completion
  blockedTime: number; // total time in blocked state
  reviewTime: number; // time spent in review
  reworkCount: number; // number of times task was reopened
}

export interface EnhancedTask {
  // Basic properties
  id: string;
  title: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  
  // Assignment and ownership
  assignments: TaskAssignment[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Dependencies and relationships
  dependencies: TaskDependency[];
  blockedBy: string[];
  blocking: string[];
  relatedTasks: string[];
  
  // Requirements and acceptance
  requirements: string[];
  acceptanceCriteria: AcceptanceCriteria[];
  
  // Time tracking
  timeTracking: TaskTimeTracking;
  dueDate?: Date;
  
  // Progress and completion
  completionPercentage: number;
  completedAt?: Date;
  
  // Metadata
  tags: string[];
  labels: string[];
  component: string;
  epic?: string;
  sprint?: string;
  
  // Quality metrics
  metrics: TaskMetrics;
  
  // Comments and history
  comments: TaskComment[];
  statusHistory: TaskStatusChange[];
}

export interface TaskComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
  type: 'comment' | 'status_change' | 'assignment' | 'system';
}

export interface TaskStatusChange {
  id: string;
  fromStatus: TaskStatus;
  toStatus: TaskStatus;
  changedBy: string;
  changedAt: Date;
  reason?: string;
}

export interface TaskFilter {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  type?: TaskType[];
  assigneeId?: string[];
  createdBy?: string;
  component?: string[];
  tags?: string[];
  dueDateBefore?: Date;
  dueDateAfter?: Date;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface TaskSort {
  field: 'priority' | 'dueDate' | 'createdAt' | 'updatedAt' | 'status' | 'title';
  direction: 'asc' | 'desc';
}

export interface WorkloadBalance {
  userId: string;
  userName: string;
  totalTasks: number;
  activeTasks: number;
  totalEstimatedHours: number;
  totalActualHours: number;
  utilizationPercentage: number;
  overloadRisk: 'low' | 'medium' | 'high';
  recommendedActions: string[];
}

export interface TaskDependencyGraph {
  nodes: EnhancedTask[];
  edges: TaskDependency[];
  cycles: string[][]; // circular dependencies
  criticalPath: string[];
}

export interface TaskValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  completedCriteria: number;
  totalCriteria: number;
  validationDetails: {
    criteriaId: string;
    status: 'passed' | 'failed' | 'pending';
    message: string;
  }[];
}

export interface TaskCreationRequest {
  title: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  assigneeIds?: string[];
  dependencies?: string[];
  requirements?: string[];
  acceptanceCriteria?: Omit<AcceptanceCriteria, 'id' | 'completed' | 'validatedAt' | 'validatedBy'>[];
  estimatedHours?: number;
  dueDate?: Date;
  tags?: string[];
  component?: string;
  epic?: string;
}

export interface TaskUpdateRequest {
  title?: string;
  description?: string;
  type?: TaskType;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: Date;
  tags?: string[];
  component?: string;
  completionPercentage?: number;
}

export interface BulkTaskOperation {
  taskIds: string[];
  operation: 'update_status' | 'assign' | 'add_tags' | 'set_priority' | 'delete';
  parameters: Record<string, any>;
}

export interface TaskStatistics {
  totalTasks: number;
  tasksByStatus: Record<TaskStatus, number>;
  tasksByPriority: Record<TaskPriority, number>;
  tasksByType: Record<TaskType, number>;
  averageCycleTime: number;
  averageLeadTime: number;
  completionRate: number;
  blockedTasksCount: number;
  overdueTasks: number;
}