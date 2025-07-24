/**
 * @ai-context Zod schemas for unified MCP tool validation
 * @ai-pattern Unified API treating all content types generically
 * @ai-critical Validates all MCP tool arguments for type safety
 * @ai-dependencies Zod for runtime validation and type inference
 * @ai-why Single API reduces complexity for MCP clients
 */

import { z } from 'zod';

/**
 * @ai-intent Valid content types for unified operations
 * @ai-pattern Enum ensures only valid types accepted
 * @ai-critical Must match handler implementations
 */
const ItemTypeSchema = z.enum(['issue', 'plan', 'doc', 'knowledge']);

/**
 * @ai-intent Schema for get_items tool - list by type
 * @ai-validation Type parameter is required
 * @ai-return Will return array of items for specified type
 */
export const GetItemsSchema = z.object({
  type: ItemTypeSchema,
});

/**
 * @ai-intent Schema for get_item_detail tool
 * @ai-validation Type and positive integer ID required
 * @ai-critical ID must exist for given type
 * @ai-return Single item with full details
 */
export const GetItemDetailSchema = z.object({
  type: ItemTypeSchema,
  id: z.number().int().positive(),  // @ai-validation: Must be > 0
});

/**
 * @ai-intent Schema for create_item tool
 * @ai-validation Title required for all types
 * @ai-pattern Type-specific fields are optional
 * @ai-logic content: doc/knowledge, dates: plan, priority/status: issue/plan
 * @ai-defaults priority: 'medium', status_id: 1 (if applicable)
 */
export const CreateItemSchema = z.object({
  type: ItemTypeSchema,
  title: z.string().min(1, 'Title is required'),  // @ai-validation: Non-empty
  content: z.string().optional(), // @ai-logic: Required for all types (validated in handler)
  priority: z.enum(['high', 'medium', 'low']).optional(),
  status_id: z.number().int().positive().optional(),
  tags: z.array(z.string()).optional(),
  start_date: z.string().optional(), // @ai-pattern: YYYY-MM-DD for plans
  end_date: z.string().optional(),   // @ai-pattern: YYYY-MM-DD for plans
});

/**
 * @ai-intent Schema for update_item tool
 * @ai-validation Type and ID required, all fields optional
 * @ai-pattern Partial updates - unspecified fields unchanged
 * @ai-critical ID must exist for given type
 * @ai-logic Same field rules as create but all optional
 */
export const UpdateItemSchema = z.object({
  type: ItemTypeSchema,
  id: z.number().int().positive(),  // @ai-critical: Must identify existing item
  title: z.string().min(1).optional(),  // @ai-validation: Non-empty if provided
  content: z.string().optional(), // @ai-logic: For all type updates
  priority: z.enum(['high', 'medium', 'low']).optional(),
  status_id: z.number().int().positive().optional(),
  tags: z.array(z.string()).optional(),
  start_date: z.string().optional(), // @ai-logic: For plan timeline changes
  end_date: z.string().optional(),   // @ai-logic: For plan timeline changes
});

/**
 * @ai-intent Schema for delete_item tool
 * @ai-validation Type and ID both required
 * @ai-critical Permanent deletion - no soft delete
 * @ai-return Boolean success indicator
 */
export const DeleteItemSchema = z.object({
  type: ItemTypeSchema,
  id: z.number().int().positive(),
});

/**
 * @ai-intent Schema for search_items_by_tag tool
 * @ai-validation Tag name required
 * @ai-pattern Optional type filter for targeted search
 * @ai-defaults types: all types if not specified
 * @ai-return Categorized results by type
 */
export const SearchItemsByTagSchema = z.object({
  tag: z.string().min(1, 'Tag is required'),  // @ai-validation: Non-empty
  types: z.array(ItemTypeSchema).optional(), // @ai-logic: Filter results by type
});

/**
 * @ai-section TypeScript Type Exports
 * @ai-intent Inferred types from Zod schemas
 * @ai-pattern Type-safe argument types for handlers
 * @ai-why Ensures compile-time type checking matches runtime validation
 */
export type ItemType = z.infer<typeof ItemTypeSchema>;
export type GetItemsArgs = z.infer<typeof GetItemsSchema>;
export type GetItemDetailArgs = z.infer<typeof GetItemDetailSchema>;
export type CreateItemArgs = z.infer<typeof CreateItemSchema>;
export type UpdateItemArgs = z.infer<typeof UpdateItemSchema>;
export type DeleteItemArgs = z.infer<typeof DeleteItemSchema>;
export type SearchItemsByTagArgs = z.infer<typeof SearchItemsByTagSchema>;

/**
 * @ai-intent Schema for get_sessions tool
 * @ai-validation Optional date range parameters
 * @ai-pattern Date format: YYYY-MM-DD
 * @ai-defaults No params = today's sessions only
 * @ai-return Array of sessions in date range
 */
export const GetSessionsSchema = z.object({
  start_date: z.string().optional(), // @ai-pattern: YYYY-MM-DD format
  end_date: z.string().optional(),   // @ai-pattern: YYYY-MM-DD format
});

/**
 * @ai-intent Schema for get_session_detail tool
 * @ai-validation Session ID is required
 * @ai-pattern ID format: YYYYMMDD-HHMMSSsss
 * @ai-return Complete session object or error
 */
export const GetSessionDetailSchema = z.object({
  id: z.string().min(1, 'Session ID is required'),  // @ai-validation: Non-empty
});

/**
 * @ai-intent Schema for get_summaries tool
 * @ai-validation Optional date range
 * @ai-defaults No params = last 7 days
 * @ai-pattern Dates in YYYY-MM-DD format
 * @ai-return Array of daily summaries
 */
export const GetDailySummariesSchema = z.object({
  start_date: z.string().optional(), // @ai-pattern: YYYY-MM-DD
  end_date: z.string().optional(),   // @ai-pattern: YYYY-MM-DD
});

/**
 * @ai-intent Schema for get_summary_detail tool
 * @ai-validation Date parameter required
 * @ai-pattern Date format: YYYY-MM-DD
 * @ai-critical One summary per date maximum
 * @ai-return Daily summary or null
 */
export const GetDailySummaryDetailSchema = z.object({
  date: z.string().min(1, 'Date is required'), // @ai-pattern: YYYY-MM-DD
});