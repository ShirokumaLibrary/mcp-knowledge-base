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
 * - description: Optional string for Issue/Plan
 * - content: Required string for Knowledge/Doc
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
  created_at?: string;  // @ai-pattern: ISO 8601 timestamp
}

/**
 * @ai-intent Issue tracking entity
 * @ai-pattern Task with priority and workflow status
 * @ai-critical Core entity for task management
 * @ai-relationship References status by ID
 * @ai-defaults priority: 'medium', status_id: 1
 */
export interface Issue {
  id: number;                      // @ai-logic: Sequential ID from markdown
  title: string;                   // @ai-validation: Required, non-empty
  description: string | null;      // @ai-logic: Optional details
  priority: string;                // @ai-pattern: 'high' | 'medium' | 'low'
  status_id: number;               // @ai-relationship: Foreign key to Status
  status?: string;                 // @ai-logic: Denormalized status name
  tags?: string[];                 // @ai-pattern: Categorization
  created_at: string;              // @ai-pattern: ISO 8601
  updated_at: string;              // @ai-pattern: ISO 8601
}

/**
 * @ai-intent Planning entity with timeline
 * @ai-pattern Task with date range for scheduling
 * @ai-critical Includes start/end dates for project planning
 * @ai-relationship Can reference related issues
 * @ai-validation start_date should be <= end_date
 */
export interface Plan {
  id: number;                      // @ai-logic: Sequential ID
  title: string;                   // @ai-validation: Required
  description: string | null;      // @ai-logic: Optional details
  start_date: string | null;       // @ai-pattern: YYYY-MM-DD or null
  end_date: string | null;         // @ai-pattern: YYYY-MM-DD or null
  priority: string;                // @ai-pattern: 'high' | 'medium' | 'low'
  status_id: number;               // @ai-relationship: Foreign key to Status
  status?: string;                 // @ai-logic: Denormalized status name
  related_issues?: number[];       // @ai-relationship: Issue IDs
  tags?: string[];                 // @ai-pattern: Categorization
  created_at: string;              // @ai-pattern: ISO 8601
  updated_at: string;              // @ai-pattern: ISO 8601
}

/**
 * @ai-intent Knowledge base article
 * @ai-pattern Reference documentation
 * @ai-critical Content is required unlike issues/plans
 * @ai-assumption Knowledge items are long-lived references
 */
export interface Knowledge {
  id: number;           // @ai-logic: Sequential ID
  title: string;        // @ai-validation: Required
  content: string;      // @ai-validation: Required, main value
  tags: string[];       // @ai-pattern: Always array, may be empty
  created_at: string;   // @ai-pattern: ISO 8601
  updated_at: string;   // @ai-pattern: ISO 8601
}

/**
 * @ai-intent Technical documentation entity
 * @ai-pattern Similar to Knowledge but separate type
 * @ai-critical Content required for documentation
 * @ai-why Separate from Knowledge for semantic clarity
 */
export interface Doc {
  id: number;           // @ai-logic: Sequential ID
  title: string;        // @ai-validation: Required
  content: string;      // @ai-validation: Required documentation text
  tags?: string[];      // @ai-pattern: Optional categorization
  created_at: string;   // @ai-pattern: ISO 8601
  updated_at: string;   // @ai-pattern: ISO 8601
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
  priority: string;     // @ai-logic: For visual indicators
  status_id: number;
  status?: string;      // @ai-logic: For display
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
  title: string;        // @ai-logic: All that's needed for lists
}