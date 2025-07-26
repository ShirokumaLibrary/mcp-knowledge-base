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
declare const ItemTypeSchema: z.ZodString;
/**
 * @ai-intent Schema for get_items tool - list by type
 * @ai-validation Type parameter is required
 * @ai-return Will return array of items for specified type
 * @ai-params
 *   - includeClosedStatuses: If true, includes items with closed statuses (default: false)
 *   - statusIds: Optional array of specific status IDs to filter by
 *   - subtype: Required when type is 'document' to specify doc or knowledge
 */
export declare const GetItemsSchema: z.ZodObject<{
    type: z.ZodString;
    subtype: z.ZodOptional<z.ZodString>;
    includeClosedStatuses: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    statusIds: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
}, "strict", z.ZodTypeAny, {
    type: string;
    includeClosedStatuses: boolean;
    subtype?: string | undefined;
    statusIds?: number[] | undefined;
}, {
    type: string;
    subtype?: string | undefined;
    includeClosedStatuses?: boolean | undefined;
    statusIds?: number[] | undefined;
}>;
/**
 * @ai-intent Schema for get_item_detail tool
 * @ai-validation Type and positive integer ID required
 * @ai-critical ID must exist for given type
 * @ai-return Single item with full details
 */
export declare const GetItemDetailSchema: z.ZodObject<{
    type: z.ZodString;
    subtype: z.ZodOptional<z.ZodString>;
    id: z.ZodNumber;
}, "strict", z.ZodTypeAny, {
    id: number;
    type: string;
    subtype?: string | undefined;
}, {
    id: number;
    type: string;
    subtype?: string | undefined;
}>;
export declare const CreateItemSchema: z.ZodObject<{
    type: z.ZodString;
    subtype: z.ZodOptional<z.ZodString>;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    priority: z.ZodOptional<z.ZodEnum<["high", "medium", "low"]>>;
    status: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    start_date: z.ZodOptional<z.ZodString>;
    end_date: z.ZodOptional<z.ZodString>;
    related_tasks: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    related_documents: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strict", z.ZodTypeAny, {
    title: string;
    type: string;
    content?: string | undefined;
    description?: string | undefined;
    priority?: "medium" | "high" | "low" | undefined;
    status?: string | undefined;
    tags?: string[] | undefined;
    start_date?: string | undefined;
    end_date?: string | undefined;
    related_tasks?: string[] | undefined;
    related_documents?: string[] | undefined;
    subtype?: string | undefined;
}, {
    title: string;
    type: string;
    content?: string | undefined;
    description?: string | undefined;
    priority?: "medium" | "high" | "low" | undefined;
    status?: string | undefined;
    tags?: string[] | undefined;
    start_date?: string | undefined;
    end_date?: string | undefined;
    related_tasks?: string[] | undefined;
    related_documents?: string[] | undefined;
    subtype?: string | undefined;
}>;
/**
 * @ai-intent Schema for update_item tool
 * @ai-validation Type and ID required, all fields optional
 * @ai-pattern Partial updates - unspecified fields unchanged
 * @ai-critical ID must exist for given type
 * @ai-logic Same field rules as create but all optional
 */
export declare const UpdateItemSchema: z.ZodObject<{
    type: z.ZodString;
    subtype: z.ZodOptional<z.ZodString>;
    id: z.ZodNumber;
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    priority: z.ZodOptional<z.ZodEnum<["high", "medium", "low"]>>;
    status: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    start_date: z.ZodOptional<z.ZodString>;
    end_date: z.ZodOptional<z.ZodString>;
    related_tasks: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    related_documents: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strict", z.ZodTypeAny, {
    id: number;
    type: string;
    title?: string | undefined;
    content?: string | undefined;
    description?: string | undefined;
    priority?: "medium" | "high" | "low" | undefined;
    status?: string | undefined;
    tags?: string[] | undefined;
    start_date?: string | undefined;
    end_date?: string | undefined;
    related_tasks?: string[] | undefined;
    related_documents?: string[] | undefined;
    subtype?: string | undefined;
}, {
    id: number;
    type: string;
    title?: string | undefined;
    content?: string | undefined;
    description?: string | undefined;
    priority?: "medium" | "high" | "low" | undefined;
    status?: string | undefined;
    tags?: string[] | undefined;
    start_date?: string | undefined;
    end_date?: string | undefined;
    related_tasks?: string[] | undefined;
    related_documents?: string[] | undefined;
    subtype?: string | undefined;
}>;
/**
 * @ai-intent Schema for delete_item tool
 * @ai-validation Type and ID both required
 * @ai-critical Permanent deletion - no soft delete
 * @ai-return Boolean success indicator
 */
export declare const DeleteItemSchema: z.ZodObject<{
    type: z.ZodString;
    subtype: z.ZodOptional<z.ZodString>;
    id: z.ZodNumber;
}, "strict", z.ZodTypeAny, {
    id: number;
    type: string;
    subtype?: string | undefined;
}, {
    id: number;
    type: string;
    subtype?: string | undefined;
}>;
/**
 * @ai-intent Schema for search_items_by_tag tool
 * @ai-validation Tag name required
 * @ai-pattern Optional type filter for targeted search
 * @ai-defaults types: all types if not specified
 * @ai-return Categorized results by type
 */
export declare const SearchItemsByTagSchema: z.ZodObject<{
    tag: z.ZodString;
    types: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strict", z.ZodTypeAny, {
    tag: string;
    types?: string[] | undefined;
}, {
    tag: string;
    types?: string[] | undefined;
}>;
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
export {};
