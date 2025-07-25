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
 * @ai-relationship References status by ID
 * @ai-defaults priority: 'medium', status_id: 1
 */
export interface Issue {
    id: number;
    title: string;
    content: string;
    priority: string;
    status_id: number;
    status?: string;
    tags?: string[];
    created_at: string;
    updated_at: string;
}
/**
 * @ai-intent Planning entity with timeline
 * @ai-pattern Task with date range for scheduling
 * @ai-critical Includes start/end dates for project planning
 * @ai-relationship Can reference related issues
 * @ai-validation start_date should be <= end_date
 */
export interface Plan {
    id: number;
    title: string;
    content: string;
    start_date: string | null;
    end_date: string | null;
    priority: string;
    status_id: number;
    status?: string;
    related_issues?: number[];
    tags?: string[];
    created_at: string;
    updated_at: string;
}
/**
 * @ai-intent Knowledge base article
 * @ai-pattern Reference documentation
 * @ai-critical Content is required unlike issues/plans
 * @ai-assumption Knowledge items are long-lived references
 */
export interface Knowledge {
    id: number;
    title: string;
    content: string;
    tags: string[];
    created_at: string;
    updated_at: string;
}
/**
 * @ai-intent Technical documentation entity
 * @ai-pattern Similar to Knowledge but separate type
 * @ai-critical Content required for documentation
 * @ai-why Separate from Knowledge for semantic clarity
 */
export interface Doc {
    id: number;
    title: string;
    content: string;
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
    priority: string;
    status_id: number;
    status?: string;
    created_at: string;
    updated_at: string;
}
/**
 * @ai-intent Doc summary for list display
 * @ai-pattern Minimal - just ID and title
 * @ai-performance Avoids loading large content
 */
export interface DocSummary {
    id: number;
    title: string;
}
