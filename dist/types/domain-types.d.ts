/**
 * @ai-context Core domain types for knowledge base system
 * @ai-pattern Domain-driven design entities
 * @ai-critical These types define the data model
 * @ai-assumption All IDs are positive integers
 * @ai-why Type safety across entire application
 *
 * @ai-type-hierarchy
 * Content Types (stored as markdown files):
 * 1. Issue - Bugs, features, tasks with priority and status
 * 2. Plan - Project plans with timeline (start/end dates)
 * 3. Knowledge - Reference documentation (content required)
 * 4. Doc - Technical documentation (content required)
 *
 * Support Types (stored in SQLite only):
 * 1. Status - Workflow states (Open, In Progress, Done, etc.)
 * 2. Tag - Categorization across all content types
 *
 * @ai-field-patterns
 * - id: Always number, auto-incremented from SQLite sequences table
 * - title: Always required string
 * - content: Required string for all types
 * - priority: 'high' | 'medium' | 'low' (Issue/Plan only)
 * - status_id: Foreign key to Status table (Issue/Plan only)
 * - tags: String array for categorization
 * - created_at/updated_at: ISO 8601 timestamps
 *
 * @ai-null-handling
 * - Use null for optional fields that are missing
 * - Empty arrays [] for tags when none exist
 * - Never use undefined in domain types
 */
/**
 * @ai-intent Workflow status definition
 * @ai-pattern Simple entity with auto-generated ID
 * @ai-critical Referenced by issues and plans
 * @ai-assumption Status names are unique
 */
export interface Status {
    id: number;
    name: string;
    is_closed?: boolean;
    created_at?: string;
}
/**
 * @ai-intent Issue tracking entity
 * @ai-pattern Task with priority and workflow status
 * @ai-critical Core entity for task management
 * @ai-relationship References status by name
 * @ai-defaults priority: 'medium', status: 'Open'
 */
export interface Issue {
    id: number;
    title: string;
    description?: string;
    content: string;
    start_date?: string | null;
    end_date?: string | null;
    priority: string;
    status?: string;
    related_tasks?: string[];
    tags?: string[];
    created_at: string;
    updated_at: string;
}
/**
 * @ai-intent Internal representation with status_id
 * @ai-critical For database operations only, not for API responses
 */
export interface IssueInternal extends Issue {
    status_id: number;
}
/**
 * @ai-intent Planning entity with timeline
 * @ai-pattern Task with date range for scheduling
 * @ai-critical Includes start/end dates for project planning
 * @ai-relationship Can reference related tasks
 * @ai-validation start_date should be <= end_date
 */
export interface Plan {
    id: number;
    title: string;
    description?: string;
    content: string;
    start_date: string | null;
    end_date: string | null;
    priority: string;
    status?: string;
    related_tasks?: string[];
    tags?: string[];
    created_at: string;
    updated_at: string;
}
/**
 * @ai-intent Internal representation with status_id
 * @ai-critical For database operations only, not for API responses
 */
export interface PlanInternal extends Plan {
    status_id: number;
}
/**
 * @ai-intent Unified document entity replacing separate doc/knowledge types
 * @ai-pattern Combines doc and knowledge into single type with subtype
 * @ai-critical Uses composite key (type, id) for unique identification
 * @ai-types 'doc' | 'knowledge' preserved for backward compatibility
 */
export interface Document {
    type: string;
    id: number;
    title: string;
    description?: string;
    content: string;
    tags: string[];
    created_at: string;
    updated_at: string;
}
/**
 * @ai-intent Document summary for list display
 * @ai-pattern Minimal fields for performance
 * @ai-usage getAllDocumentsSummary() returns these
 */
export interface DocumentSummary {
    type: string;
    id: number;
    title: string;
    description?: string;
    tags?: string[];
    created_at: string;
    updated_at: string;
}
/**
 * @ai-intent Tag entity for categorization
 * @ai-pattern Simple name-based entity
 * @ai-critical Shared across all content types
 * @ai-assumption Tag names are unique (case-insensitive)
 */
export interface Tag {
    name: string;
    createdAt?: string;
}
/**
 * @ai-section Summary Types
 * @ai-intent Lightweight representations for list views
 * @ai-pattern Subset of full entity fields
 * @ai-performance Reduces data transfer for lists
 * @ai-why UI performance with large datasets
 */
/**
 * @ai-intent Issue summary for list display
 * @ai-pattern Excludes description and tags
 * @ai-usage getAllIssuesSummary() returns these
 */
export interface IssueSummary {
    id: number;
    title: string;
    description?: string;
    priority: string;
    status?: string;
    start_date?: string | null;
    end_date?: string | null;
    created_at: string;
    updated_at: string;
}
/**
 * @ai-intent Plan summary for list display
 * @ai-pattern Includes timeline data
 * @ai-performance Avoids loading full content
 */
export interface PlanSummary {
    id: number;
    title: string;
    description?: string;
    priority: string;
    status?: string;
    start_date: string | null;
    end_date: string | null;
    created_at: string;
    updated_at: string;
}
