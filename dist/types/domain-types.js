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
export {};
//# sourceMappingURL=domain-types.js.map