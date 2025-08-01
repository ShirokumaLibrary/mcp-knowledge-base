/**
 * @ai-context Zod schemas for MCP tool validation
 * @ai-pattern Single API treating all content types generically
 * @ai-critical Validates all MCP tool arguments for type safety
 * @ai-dependencies Zod for runtime validation and type inference
 * @ai-why Single API reduces complexity for MCP clients
 */

import { z } from 'zod';

/**
 * @ai-intent Valid content types for item operations
 * @ai-pattern Accept any string - validation happens against sequences table
 * @ai-critical Types are validated in handlers against database
 */
const ItemTypeSchema = z.string();

/**
 * @ai-intent Valid subtypes for document type
 * @ai-pattern Accept any string - validation happens against sequences table
 * @ai-deprecated Subtype concept being phased out
 */
const DocumentSubtypeSchema = z.string();

/**
 * @ai-intent Schema for get_items tool - list by type
 * @ai-validation Type parameter is required
 * @ai-return Will return array of items for specified type
 * @ai-params
 *   - includeClosedStatuses: If true, includes items with closed statuses (default: false)
 *   - statusIds: Optional array of specific status IDs to filter by
 *   - subtype: Required when type is 'document' to specify doc or knowledge
 */
export const GetItemsSchema = z.object({
  type: ItemTypeSchema,
  subtype: DocumentSubtypeSchema.optional(), // @ai-logic: Required when type='document'
  includeClosedStatuses: z.boolean().optional().default(false),
  statusIds: z.array(z.number().int().positive()).optional()
}).strict();

/**
 * @ai-intent Schema for get_item_detail tool
 * @ai-validation Type and positive integer ID required
 * @ai-critical ID must exist for given type
 * @ai-return Single item with full details
 */
export const GetItemDetailSchema = z.object({
  type: ItemTypeSchema,
  subtype: DocumentSubtypeSchema.optional(), // @ai-logic: Required when type='document'
  id: z.number().int().positive()  // @ai-validation: Must be > 0
}).strict();

/**
 * @ai-intent Schema for create_item tool
 * @ai-validation Title required for all types
 * @ai-pattern Type-specific fields are optional
 * @ai-logic content: doc/knowledge, dates: plan, priority/status: issue/plan
 * @ai-defaults priority: 'medium', status: 'Open' (if applicable)
 */
// @ai-intent Date format validation helper
// @ai-pattern Strict YYYY-MM-DD format validation
const dateFormatSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  'Date must be in YYYY-MM-DD format'
);

export const CreateItemSchema = z.object({
  type: ItemTypeSchema,
  subtype: DocumentSubtypeSchema.optional(), // @ai-logic: Required when type='document'
  title: z.string().min(1, 'Title is required'),  // @ai-validation: Non-empty
  description: z.string().optional(),  // @ai-intent: One-line description for list views
  content: z.string().optional(), // @ai-logic: Required for all types (validated in handler)
  priority: z.enum(['high', 'medium', 'low']).optional(),
  status: z.string().optional(), // @ai-logic: Status name instead of ID
  tags: z.array(z.string()).optional(),
  start_date: dateFormatSchema.optional(), // @ai-pattern: YYYY-MM-DD for issues/plans
  end_date: dateFormatSchema.optional(),   // @ai-pattern: YYYY-MM-DD for issues/plans
  related_tasks: z.array(z.string()).optional(), // @ai-pattern: ["issues-1", "plans-2"]
  related_documents: z.array(z.string()).optional() // @ai-pattern: ["docs-1", "knowledge-2"]
}).strict();

/**
 * @ai-intent Schema for update_item tool
 * @ai-validation Type and ID required, all fields optional
 * @ai-pattern Partial updates - unspecified fields unchanged
 * @ai-critical ID must exist for given type
 * @ai-logic Same field rules as create but all optional
 */
export const UpdateItemSchema = z.object({
  type: ItemTypeSchema,
  subtype: DocumentSubtypeSchema.optional(), // @ai-logic: Required when type='document'
  id: z.number().int().positive(),  // @ai-critical: Must identify existing item
  title: z.string().min(1).optional(),  // @ai-validation: Non-empty if provided
  description: z.string().optional(),  // @ai-intent: One-line description for list views
  content: z.string().optional(), // @ai-logic: For all type updates
  priority: z.enum(['high', 'medium', 'low']).optional(),
  status: z.string().optional(), // @ai-logic: Status name instead of ID
  tags: z.array(z.string()).optional(),
  start_date: dateFormatSchema.optional(), // @ai-logic: For issue/plan timeline changes
  end_date: dateFormatSchema.optional(),   // @ai-logic: For issue/plan timeline changes
  related_tasks: z.array(z.string()).optional(), // @ai-pattern: ["issues-1", "plans-2"]
  related_documents: z.array(z.string()).optional() // @ai-pattern: ["docs-1", "knowledge-2"]
}).strict();

/**
 * @ai-intent Schema for delete_item tool
 * @ai-validation Type and ID both required
 * @ai-critical Permanent deletion - no soft delete
 * @ai-return Boolean success indicator
 */
export const DeleteItemSchema = z.object({
  type: ItemTypeSchema,
  subtype: DocumentSubtypeSchema.optional(), // @ai-logic: Required when type='document'
  id: z.number().int().positive()
}).strict();

/**
 * @ai-intent Schema for search_items_by_tag tool
 * @ai-validation Tag name required
 * @ai-pattern Optional type filter for targeted search
 * @ai-defaults types: all types if not specified
 * @ai-return Categorized results by type
 */
export const SearchItemsByTagSchema = z.object({
  tag: z.string().min(1, 'Tag is required'),  // @ai-validation: Non-empty
  types: z.array(ItemTypeSchema).optional() // @ai-logic: Filter results by type
}).strict();

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