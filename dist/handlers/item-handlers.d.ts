import { FileIssueDatabase } from '../database.js';
import { ToolResponse } from '../types/mcp-types.js';
/**
 * @ai-context MCP tool handlers for all content types
 * @ai-pattern Strategy pattern with type-based dispatch
 * @ai-critical Entry point for all MCP tool calls - must handle errors gracefully
 * @ai-dependencies FileIssueDatabase for all data operations
 * @ai-why Single handler class simplifies MCP tool registration and maintenance
 */
export declare class ItemHandlers {
    private db;
    private builtInTypes;
    constructor(db: FileIssueDatabase);
    /**
     * @ai-intent Check if a type exists in sequences table
     * @ai-logic Skip check for built-in types, query DB for custom types
     */
    private isValidCustomType;
    /**
     * @ai-intent List all items of specified type (issue/plan/doc/knowledge)
     * @ai-flow 1. Validate args -> 2. Dispatch by type -> 3. Format response
     * @ai-error-handling Throws McpError for invalid types, Zod errors for validation
     * @ai-performance Summary views for issues/docs to reduce payload size
     * @ai-assumption Database methods return empty arrays, not null
     * @ai-params
     *   - includeClosedStatuses: Include items with closed statuses (issue/plan only)
     *   - statusIds: Filter by specific status IDs (issue/plan only)
     */
    handleGetItems(args: unknown): Promise<ToolResponse>;
    /**
     * @ai-intent Retrieve complete details for a specific item
     * @ai-flow 1. Validate args -> 2. Fetch by type & ID -> 3. Validate existence -> 4. Return
     * @ai-error-handling McpError for not found, preserves original error context
     * @ai-critical Must distinguish between not found vs database errors
     * @ai-return Full item data including content/description fields
     */
    handleGetItemDetail(args: unknown): Promise<ToolResponse>;
    /**
     * @ai-intent Create new item with type-specific validation
     * @ai-flow 1. Validate schema -> 2. Apply type rules -> 3. Create -> 4. Return with ID
     * @ai-side-effects Creates markdown file, updates SQLite, may create tags
     * @ai-critical ID generation must be atomic across concurrent requests
     * @ai-assumption Tag creation is idempotent and won't fail on duplicates
     */
    handleCreateItem(args: unknown): Promise<ToolResponse>;
    handleUpdateItem(args: unknown): Promise<ToolResponse>;
    handleDeleteItem(args: unknown): Promise<ToolResponse>;
    handleSearchItemsByTag(args: unknown): Promise<ToolResponse>;
}
