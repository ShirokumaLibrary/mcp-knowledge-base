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
declare const ItemTypeSchema: z.ZodEnum<["issue", "plan", "doc", "knowledge"]>;
/**
 * @ai-intent Schema for get_items tool - list by type
 * @ai-validation Type parameter is required
 * @ai-return Will return array of items for specified type
 * @ai-params
 *   - includeClosedStatuses: If true, includes items with closed statuses (default: false)
 *   - statusIds: Optional array of specific status IDs to filter by
 */
export declare const GetItemsSchema: z.ZodObject<{
    type: z.ZodEnum<["issue", "plan", "doc", "knowledge"]>;
    includeClosedStatuses: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    statusIds: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
}, "strip", z.ZodTypeAny, {
    type: "knowledge" | "issue" | "plan" | "doc";
    includeClosedStatuses: boolean;
    statusIds?: number[] | undefined;
}, {
    type: "knowledge" | "issue" | "plan" | "doc";
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
    type: z.ZodEnum<["issue", "plan", "doc", "knowledge"]>;
    id: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: number;
    type: "knowledge" | "issue" | "plan" | "doc";
}, {
    id: number;
    type: "knowledge" | "issue" | "plan" | "doc";
}>;
export declare const CreateItemSchema: z.ZodObject<{
    type: z.ZodEnum<["issue", "plan", "doc", "knowledge"]>;
    title: z.ZodString;
    content: z.ZodOptional<z.ZodString>;
    priority: z.ZodOptional<z.ZodEnum<["high", "medium", "low"]>>;
    status_id: z.ZodOptional<z.ZodNumber>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    start_date: z.ZodOptional<z.ZodString>;
    end_date: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    type: "knowledge" | "issue" | "plan" | "doc";
    tags?: string[] | undefined;
    content?: string | undefined;
    status_id?: number | undefined;
    priority?: "medium" | "high" | "low" | undefined;
    start_date?: string | undefined;
    end_date?: string | undefined;
}, {
    title: string;
    type: "knowledge" | "issue" | "plan" | "doc";
    tags?: string[] | undefined;
    content?: string | undefined;
    status_id?: number | undefined;
    priority?: "medium" | "high" | "low" | undefined;
    start_date?: string | undefined;
    end_date?: string | undefined;
}>;
/**
 * @ai-intent Schema for update_item tool
 * @ai-validation Type and ID required, all fields optional
 * @ai-pattern Partial updates - unspecified fields unchanged
 * @ai-critical ID must exist for given type
 * @ai-logic Same field rules as create but all optional
 */
export declare const UpdateItemSchema: z.ZodObject<{
    type: z.ZodEnum<["issue", "plan", "doc", "knowledge"]>;
    id: z.ZodNumber;
    title: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    priority: z.ZodOptional<z.ZodEnum<["high", "medium", "low"]>>;
    status_id: z.ZodOptional<z.ZodNumber>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    start_date: z.ZodOptional<z.ZodString>;
    end_date: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: number;
    type: "knowledge" | "issue" | "plan" | "doc";
    tags?: string[] | undefined;
    content?: string | undefined;
    title?: string | undefined;
    status_id?: number | undefined;
    priority?: "medium" | "high" | "low" | undefined;
    start_date?: string | undefined;
    end_date?: string | undefined;
}, {
    id: number;
    type: "knowledge" | "issue" | "plan" | "doc";
    tags?: string[] | undefined;
    content?: string | undefined;
    title?: string | undefined;
    status_id?: number | undefined;
    priority?: "medium" | "high" | "low" | undefined;
    start_date?: string | undefined;
    end_date?: string | undefined;
}>;
/**
 * @ai-intent Schema for delete_item tool
 * @ai-validation Type and ID both required
 * @ai-critical Permanent deletion - no soft delete
 * @ai-return Boolean success indicator
 */
export declare const DeleteItemSchema: z.ZodObject<{
    type: z.ZodEnum<["issue", "plan", "doc", "knowledge"]>;
    id: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: number;
    type: "knowledge" | "issue" | "plan" | "doc";
}, {
    id: number;
    type: "knowledge" | "issue" | "plan" | "doc";
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
    types: z.ZodOptional<z.ZodArray<z.ZodEnum<["issue", "plan", "doc", "knowledge"]>, "many">>;
}, "strip", z.ZodTypeAny, {
    tag: string;
    types?: ("knowledge" | "issue" | "plan" | "doc")[] | undefined;
}, {
    tag: string;
    types?: ("knowledge" | "issue" | "plan" | "doc")[] | undefined;
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
