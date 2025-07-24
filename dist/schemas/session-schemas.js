/**
 * @ai-context Zod schemas for session-specific MCP tools
 * @ai-pattern Work sessions and daily summaries validation
 * @ai-critical Ensures data consistency for time tracking
 * @ai-dependencies Zod for runtime validation
 * @ai-why Sessions need specific validation rules
 */
import { z } from 'zod';
/**
 * @ai-intent Schema for create_session tool
 * @ai-validation Title required, ID optional for imports
 * @ai-pattern Custom ID allows session migration
 * @ai-defaults tags: empty array
 * @ai-return New session with generated/provided ID
 */
export const CreateWorkSessionSchema = z.object({
    id: z.string().optional(), // @ai-logic: Custom ID for imports
    title: z.string().min(1, 'Session title is required'),
    description: z.string().optional(),
    content: z.string().optional(),
    tags: z.array(z.string()).default([]), // @ai-default: Empty array
    category: z.string().optional(), // @ai-logic: Work categorization
});
/**
 * @ai-intent Schema for update_session tool
 * @ai-validation ID required, all fields optional
 * @ai-pattern Partial updates preserve unspecified fields
 * @ai-critical Session must exist for ID
 * @ai-return Updated session object
 */
export const UpdateWorkSessionSchema = z.object({
    id: z.string().min(1, 'Session ID is required'), // @ai-critical: Must exist
    title: z.string().min(1).optional(), // @ai-validation: Non-empty if provided
    description: z.string().optional(),
    content: z.string().optional(),
    tags: z.array(z.string()).optional(),
    category: z.string().optional(),
});
/**
 * @ai-intent Schema for create_summary tool
 * @ai-validation Date format, title and content required
 * @ai-pattern One summary per date maximum
 * @ai-critical Date is primary key - overwrites existing
 * @ai-regex YYYY-MM-DD strict format validation
 */
export const CreateDailySummarySchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'), // @ai-pattern: Strict date
    title: z.string().min(1, 'Title is required'),
    content: z.string().min(1, 'Content is required'), // @ai-validation: Non-empty summary
    tags: z.array(z.string()).default([]),
});
/**
 * @ai-intent Schema for update_summary tool
 * @ai-validation Date required to identify summary
 * @ai-pattern Partial updates allowed
 * @ai-critical Summary must exist for date
 * @ai-bug Empty strings blocked by min(1) validation
 */
export const UpdateDailySummarySchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'), // @ai-critical: Identifies summary
    title: z.string().min(1).optional(), // @ai-bug: Can't clear with empty string
    content: z.string().min(1).optional(), // @ai-bug: Can't clear with empty string
    tags: z.array(z.string()).optional(),
});
/**
 * @ai-intent Schema for search_sessions_by_tag tool
 * @ai-validation Tag name required and non-empty
 * @ai-pattern Exact tag match search
 * @ai-return Array of sessions with specified tag
 */
export const SearchSessionsByTagSchema = z.object({
    tag: z.string().min(1, 'Tag is required'), // @ai-validation: Non-empty tag
});
//# sourceMappingURL=session-schemas.js.map