/**
 * @ai-context MCP handlers for tag management operations
 * @ai-pattern Handler class for tag CRUD and search
 * @ai-critical Tags are shared across all content types
 * @ai-dependencies Database for tag persistence
 * @ai-assumption Tag names are unique (case-insensitive)
 */
import type { FileIssueDatabase } from '../database.js';
import type { ToolResponse } from '../types/mcp-types.js';
/**
 * @ai-context Handles MCP tool calls for tag operations
 * @ai-pattern CRUD handlers plus search functionality
 * @ai-critical Tags enable cross-content categorization
 * @ai-lifecycle Tags auto-created when used, manually managed
 * @ai-why Flexible categorization across all content types
 */
export declare class TagHandlers {
    private db;
    private logger;
    /**
     * @ai-intent Initialize with database dependency
     * @ai-pattern Dependency injection
     * @ai-assumption Database handles all tag operations
     */
    constructor(db: FileIssueDatabase);
    /**
     * @ai-intent Handle get_tags MCP tool call
     * @ai-flow 1. Fetch all tags -> 2. Return as JSON
     * @ai-pattern Simple list operation, no arguments
     * @ai-return Array of tags with usage counts
     * @ai-performance May include usage statistics
     */
    handleGetTags(): Promise<ToolResponse>;
    /**
     * @ai-intent Handle create_tag MCP tool call
     * @ai-flow 1. Validate name -> 2. Create tag -> 3. Handle errors -> 4. Return
     * @ai-validation Name required and non-empty
     * @ai-error-handling Catches duplicate tag errors
     * @ai-side-effects Inserts into tags table
     * @ai-pattern Auto-creation usually preferred over manual
     */
    handleCreateTag(args: unknown): Promise<ToolResponse>;
    /**
     * @ai-intent Handle delete_tag MCP tool call
     * @ai-flow 1. Validate name -> 2. Delete tag -> 3. Check success -> 4. Return
     * @ai-validation Name required (not ID)
     * @ai-critical Removes tag from all associated items
     * @ai-bug Parameter is name not ID - inconsistent with other deletes
     * @ai-return Success message or error
     */
    handleDeleteTag(args: unknown): Promise<ToolResponse>;
    /**
     * @ai-intent Handle search_tags MCP tool call
     * @ai-flow 1. Validate pattern -> 2. Search tags -> 3. Return matches
     * @ai-validation Pattern required for substring match
     * @ai-pattern Case-insensitive LIKE search with % wildcards
     * @ai-return Array of matching tags with usage counts
     */
    handleSearchTags(args: unknown): Promise<ToolResponse>;
    /**
     * @ai-intent Handle cross-type tag search
     * @ai-flow 1. Validate tag -> 2. Search all types -> 3. Return categorized
     * @ai-validation Exact tag name required
     * @ai-pattern Searches issues, plans, docs, knowledge, sessions
     * @ai-bug Missing await on searchAllByTag call
     * @ai-return Object with arrays for each content type
     */
    handleSearchAllByTag(args: unknown): Promise<ToolResponse>;
}
