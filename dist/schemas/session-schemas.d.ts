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
export declare const CreateWorkSessionSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    title: z.ZodString;
    content: z.ZodOptional<z.ZodString>;
    related_tasks: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    related_documents: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    category: z.ZodOptional<z.ZodString>;
    datetime: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    title: string;
    tags: string[];
    content?: string | undefined;
    related_tasks?: string[] | undefined;
    id?: string | undefined;
    related_documents?: string[] | undefined;
    category?: string | undefined;
    datetime?: string | undefined;
}, {
    title: string;
    content?: string | undefined;
    tags?: string[] | undefined;
    related_tasks?: string[] | undefined;
    id?: string | undefined;
    related_documents?: string[] | undefined;
    category?: string | undefined;
    datetime?: string | undefined;
}>;
/**
 * @ai-intent Schema for update_session tool
 * @ai-validation ID required, all fields optional
 * @ai-pattern Partial updates preserve unspecified fields
 * @ai-critical Session must exist for ID
 * @ai-return Updated session object
 */
export declare const UpdateWorkSessionSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    related_tasks: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    related_documents: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    category: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    id: string;
    title?: string | undefined;
    content?: string | undefined;
    tags?: string[] | undefined;
    related_tasks?: string[] | undefined;
    related_documents?: string[] | undefined;
    category?: string | undefined;
}, {
    id: string;
    title?: string | undefined;
    content?: string | undefined;
    tags?: string[] | undefined;
    related_tasks?: string[] | undefined;
    related_documents?: string[] | undefined;
    category?: string | undefined;
}>;
/**
 * @ai-intent Schema for create_summary tool
 * @ai-validation Date format, title and content required
 * @ai-pattern One summary per date maximum
 * @ai-critical Date is primary key - overwrites existing
 * @ai-regex YYYY-MM-DD strict format validation
 */
export declare const CreateDailySummarySchema: z.ZodObject<{
    date: z.ZodString;
    title: z.ZodString;
    content: z.ZodString;
    related_tasks: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    related_documents: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strict", z.ZodTypeAny, {
    title: string;
    content: string;
    tags: string[];
    date: string;
    related_tasks?: string[] | undefined;
    related_documents?: string[] | undefined;
}, {
    title: string;
    content: string;
    date: string;
    tags?: string[] | undefined;
    related_tasks?: string[] | undefined;
    related_documents?: string[] | undefined;
}>;
/**
 * @ai-intent Schema for update_summary tool
 * @ai-validation Date required to identify summary
 * @ai-pattern Partial updates allowed
 * @ai-critical Summary must exist for date
 * @ai-bug Empty strings blocked by min(1) validation
 */
export declare const UpdateDailySummarySchema: z.ZodObject<{
    date: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    related_tasks: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    related_documents: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strict", z.ZodTypeAny, {
    date: string;
    title?: string | undefined;
    content?: string | undefined;
    tags?: string[] | undefined;
    related_tasks?: string[] | undefined;
    related_documents?: string[] | undefined;
}, {
    date: string;
    title?: string | undefined;
    content?: string | undefined;
    tags?: string[] | undefined;
    related_tasks?: string[] | undefined;
    related_documents?: string[] | undefined;
}>;
/**
 * @ai-intent Schema for search_sessions_by_tag tool
 * @ai-validation Tag name required and non-empty
 * @ai-pattern Exact tag match search
 * @ai-return Array of sessions with specified tag
 */
export declare const SearchSessionsByTagSchema: z.ZodObject<{
    tag: z.ZodString;
}, "strict", z.ZodTypeAny, {
    tag: string;
}, {
    tag: string;
}>;
/**
 * @ai-intent Schema for get_sessions tool
 * @ai-validation Optional date range parameters
 * @ai-pattern Date format: YYYY-MM-DD
 * @ai-defaults No params = today's sessions only
 * @ai-return Array of sessions in date range
 */
export declare const GetSessionsSchema: z.ZodObject<{
    start_date: z.ZodOptional<z.ZodString>;
    end_date: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    start_date?: string | undefined;
    end_date?: string | undefined;
}, {
    start_date?: string | undefined;
    end_date?: string | undefined;
}>;
/**
 * @ai-intent Schema for get_session_detail tool
 * @ai-validation Session ID is required
 * @ai-pattern ID format: YYYY-MM-DD-HH.MM.SS.sss
 * @ai-return Complete session object or error
 */
export declare const GetSessionDetailSchema: z.ZodObject<{
    id: z.ZodString;
}, "strict", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
/**
 * @ai-intent Schema for get_summaries tool
 * @ai-validation Optional date range
 * @ai-defaults No params = last 7 days
 * @ai-pattern Dates in YYYY-MM-DD format
 * @ai-return Array of daily summaries
 */
export declare const GetDailySummariesSchema: z.ZodObject<{
    start_date: z.ZodOptional<z.ZodString>;
    end_date: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    start_date?: string | undefined;
    end_date?: string | undefined;
}, {
    start_date?: string | undefined;
    end_date?: string | undefined;
}>;
/**
 * @ai-intent Schema for get_summary_detail tool
 * @ai-validation Date parameter required
 * @ai-pattern Date format: YYYY-MM-DD
 * @ai-critical One summary per date maximum
 * @ai-return Daily summary or null
 */
export declare const GetDailySummaryDetailSchema: z.ZodObject<{
    date: z.ZodString;
}, "strict", z.ZodTypeAny, {
    date: string;
}, {
    date: string;
}>;
