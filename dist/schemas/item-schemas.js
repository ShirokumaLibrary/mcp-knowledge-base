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
 * @ai-pattern Enum ensures only valid types accepted
 * @ai-critical Must match handler implementations
 */
const ItemTypeSchema = z.enum(['issue', 'plan', 'doc', 'knowledge']);
/**
 * @ai-intent Schema for get_items tool - list by type
 * @ai-validation Type parameter is required
 * @ai-return Will return array of items for specified type
 * @ai-params
 *   - includeClosedStatuses: If true, includes items with closed statuses (default: false)
 *   - statusIds: Optional array of specific status IDs to filter by
 */
export const GetItemsSchema = z.object({
    type: ItemTypeSchema,
    includeClosedStatuses: z.boolean().optional().default(false),
    statusIds: z.array(z.number().int().positive()).optional(),
}).strict();
/**
 * @ai-intent Schema for get_item_detail tool
 * @ai-validation Type and positive integer ID required
 * @ai-critical ID must exist for given type
 * @ai-return Single item with full details
 */
export const GetItemDetailSchema = z.object({
    type: ItemTypeSchema,
    id: z.number().int().positive(), // @ai-validation: Must be > 0
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
const dateFormatSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');
export const CreateItemSchema = z.object({
    type: ItemTypeSchema,
    title: z.string().min(1, 'Title is required'), // @ai-validation: Non-empty
    summary: z.string().optional(), // @ai-intent: One-line description for list views
    content: z.string().optional(), // @ai-logic: Required for all types (validated in handler)
    priority: z.enum(['high', 'medium', 'low']).optional(),
    status: z.string().optional(), // @ai-logic: Status name instead of ID
    tags: z.array(z.string()).optional(),
    start_date: dateFormatSchema.optional(), // @ai-pattern: YYYY-MM-DD for plans
    end_date: dateFormatSchema.optional(), // @ai-pattern: YYYY-MM-DD for plans
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
    id: z.number().int().positive(), // @ai-critical: Must identify existing item
    title: z.string().min(1).optional(), // @ai-validation: Non-empty if provided
    summary: z.string().optional(), // @ai-intent: One-line description for list views
    content: z.string().optional(), // @ai-logic: For all type updates
    priority: z.enum(['high', 'medium', 'low']).optional(),
    status: z.string().optional(), // @ai-logic: Status name instead of ID
    tags: z.array(z.string()).optional(),
    start_date: dateFormatSchema.optional(), // @ai-logic: For plan timeline changes
    end_date: dateFormatSchema.optional(), // @ai-logic: For plan timeline changes
}).strict();
/**
 * @ai-intent Schema for delete_item tool
 * @ai-validation Type and ID both required
 * @ai-critical Permanent deletion - no soft delete
 * @ai-return Boolean success indicator
 */
export const DeleteItemSchema = z.object({
    type: ItemTypeSchema,
    id: z.number().int().positive(),
}).strict();
/**
 * @ai-intent Schema for search_items_by_tag tool
 * @ai-validation Tag name required
 * @ai-pattern Optional type filter for targeted search
 * @ai-defaults types: all types if not specified
 * @ai-return Categorized results by type
 */
export const SearchItemsByTagSchema = z.object({
    tag: z.string().min(1, 'Tag is required'), // @ai-validation: Non-empty
    types: z.array(ItemTypeSchema).optional(), // @ai-logic: Filter results by type
}).strict();
//# sourceMappingURL=item-schemas.js.map