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
export {};
//# sourceMappingURL=session-types.js.map