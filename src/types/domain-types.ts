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
  id: number;           // @ai-logic: Auto-incremented primary key
  name: string;         // @ai-validation: Should be unique
  is_closed?: boolean;  // @ai-logic: True for terminal states (Closed, Completed)
  created_at?: string;  // @ai-pattern: ISO 8601 timestamp
}

/**
 * @ai-intent Issue tracking entity
 * @ai-pattern Task with priority and workflow status
 * @ai-critical Core entity for task management
 * @ai-relationship References status by name
 * @ai-defaults priority: 'medium', status: 'Open'
 */
export interface Issue {
  id: number;                      // @ai-logic: Sequential ID from markdown
  title: string;                   // @ai-validation: Required, non-empty
  description?: string;            // @ai-intent: One-line description for list views
  content: string;                 // @ai-validation: Required content
  start_date?: string | null;      // @ai-pattern: YYYY-MM-DD or null
  end_date?: string | null;        // @ai-pattern: YYYY-MM-DD or null
  priority: string;                // @ai-pattern: 'high' | 'medium' | 'low'
  status?: string;                 // @ai-logic: Status name for display
  related_tasks?: string[];        // @ai-relationship: Task IDs as ["issues-1", "plans-2"]
  related_documents?: string[];    // @ai-relationship: Document IDs as ["docs-1", "knowledge-2"]
  tags?: string[];                 // @ai-pattern: Categorization
  created_at: string;              // @ai-pattern: ISO 8601
  updated_at: string;              // @ai-pattern: ISO 8601
}

/**
 * @ai-intent Internal representation with status_id
 * @ai-critical For database operations only, not for API responses
 */
export interface IssueInternal extends Issue {
  status_id: number;               // @ai-relationship: Foreign key to Status
}

/**
 * @ai-intent Planning entity with timeline
 * @ai-pattern Task with date range for scheduling
 * @ai-critical Includes start/end dates for project planning
 * @ai-relationship Can reference related tasks
 * @ai-validation start_date should be <= end_date
 */
export interface Plan {
  id: number;                      // @ai-logic: Sequential ID
  title: string;                   // @ai-validation: Required
  description?: string;            // @ai-intent: One-line description for list views
  content: string;                 // @ai-validation: Required content
  start_date: string | null;       // @ai-pattern: YYYY-MM-DD or null
  end_date: string | null;         // @ai-pattern: YYYY-MM-DD or null
  priority: string;                // @ai-pattern: 'high' | 'medium' | 'low'
  status?: string;                 // @ai-logic: Status name for display
  related_tasks?: string[];        // @ai-relationship: Task IDs as ["issues-1", "plans-2"]
  related_documents?: string[];    // @ai-relationship: Document IDs as ["docs-1", "knowledge-2"]
  tags?: string[];                 // @ai-pattern: Categorization
  created_at: string;              // @ai-pattern: ISO 8601
  updated_at: string;              // @ai-pattern: ISO 8601
}

/**
 * @ai-intent Internal representation with status_id
 * @ai-critical For database operations only, not for API responses
 */
export interface PlanInternal extends Plan {
  status_id: number;               // @ai-relationship: Foreign key to Status
}

/**
 * @ai-intent Unified document entity replacing separate doc/knowledge types
 * @ai-pattern Combines doc and knowledge into single type with subtype
 * @ai-critical Uses composite key (type, id) for unique identification
 * @ai-types 'doc' | 'knowledge' preserved for backward compatibility
 */
export interface Document {
  type: string;               // @ai-logic: Subtype for ID namespacing, can be custom
  id: number;                 // @ai-logic: Sequential ID per type
  title: string;              // @ai-validation: Required
  description?: string;       // @ai-intent: One-line description for list views
  content: string;            // @ai-validation: Required, main value
  related_tasks?: string[];   // @ai-relationship: Task IDs as ["issues-1", "plans-2"]
  related_documents?: string[]; // @ai-relationship: Document IDs as ["docs-1", "knowledge-2"]
  tags: string[];             // @ai-pattern: Always array, may be empty
  created_at: string;         // @ai-pattern: ISO 8601
  updated_at: string;         // @ai-pattern: ISO 8601
}

/**
 * @ai-intent Document summary for list display
 * @ai-pattern Minimal fields for performance
 * @ai-usage getAllDocumentsSummary() returns these
 */
export interface DocumentSummary {
  type: string;               // @ai-logic: Can be custom type
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
  name: string;         // @ai-validation: Unique identifier
  createdAt?: string;   // @ai-pattern: Optional timestamp
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
  description?: string; // @ai-intent: One-line description
  priority: string;     // @ai-logic: For visual indicators
  status?: string;      // @ai-logic: For display
  start_date?: string | null;
  end_date?: string | null;
  tags?: string[];
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
  description?: string; // @ai-intent: One-line description
  priority: string;
  status?: string;
  start_date: string | null;
  end_date: string | null;
  tags?: string[];
  created_at: string;
  updated_at: string;
}