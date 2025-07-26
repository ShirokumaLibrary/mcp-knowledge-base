/**
 * @ai-context Types for work tracking and daily summaries  
 * @ai-pattern Time-based entities for productivity tracking
 * @ai-critical Sessions track individual work periods
 * @ai-assumption Multiple sessions per day, one summary per day
 * @ai-why Enables time tracking and daily reflection
 * 
 * @ai-storage-model
 * Work Sessions:
 * - Stored in database/sessions/YYYY-MM-DD/session-{timestamp}.md
 * - Multiple sessions per day in date-organized directories
 * - ID format: YYYY-MM-DD-HH.MM.SS.sss (date + timestamp + milliseconds)
 * 
 * Daily Summaries:
 * - Stored in database/sessions/YYYY-MM-DD/daily-summary-YYYY-MM-DD.md
 * - Exactly one summary file per date within the session directory
 * - Date is the primary identifier
 * 
 * @ai-use-cases
 * 1. Track work activities throughout the day
 * 2. Generate end-of-day summaries
 * 3. Review work history by date
 * 4. Search activities by tag across dates
 * 
 * @ai-relationship-to-other-types
 * - Sessions can reference issues/plans being worked on via tags
 * - Summaries aggregate multiple sessions
 * - Both use the same tag system as other content types
 */

/**
 * @ai-intent Individual work session entity
 * @ai-pattern ID includes timestamp for uniqueness
 * @ai-critical ID format: YYYY-MM-DD-HH.MM.SS.sss
 * @ai-relationship Multiple sessions aggregate into daily summary
 * @ai-lifecycle Created during work, may be updated
 */
export interface WorkSession {
  id: string;           // @ai-pattern: YYYY-MM-DD-HH.MM.SS.sss format
  title: string;        // @ai-validation: Required session name
  content?: string;     // @ai-logic: Work details and extended notes/logs
  tags?: string[];      // @ai-pattern: Categorization
  category?: string;    // @ai-logic: Work type classification
  date: string;         // @ai-pattern: YYYY-MM-DD format
  createdAt: string;    // @ai-pattern: ISO 8601 timestamp
  updatedAt?: string;   // @ai-pattern: ISO 8601 when modified
}

/**
 * @ai-intent Daily work summary entity
 * @ai-pattern One summary per date maximum
 * @ai-critical Date is primary key
 * @ai-relationship Summarizes all sessions for a date
 * @ai-usage Created at end of day or retrospectively
 */
export interface DailySummary {
  date: string;         // @ai-pattern: YYYY-MM-DD, primary key
  title: string;        // @ai-validation: Required summary title
  content: string;      // @ai-validation: Required summary text
  tags: string[];       // @ai-pattern: Day-level categorization
  createdAt: string;    // @ai-pattern: ISO 8601 creation time
  updatedAt?: string;   // @ai-pattern: ISO 8601 modification time
}


