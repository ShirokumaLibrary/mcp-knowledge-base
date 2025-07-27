/**
 * @ai-context MCP handlers for tag management using base handler
 * @ai-pattern Extends BaseHandler for consistent error handling
 * @ai-critical Tags are auto-created when referenced
 * @ai-dependencies Database for tag persistence
 * @ai-assumption Tag names are case-sensitive
 */
import { BaseHandler, ToolResponse } from './base-handler.js';
import type { FileIssueDatabase } from '../database/index.js';
/**
 * @ai-context Handles MCP tool calls for tag operations
 * @ai-pattern CRUD handlers with auto-creation support
 * @ai-critical Tags deleted cascade to all relationships
 * @ai-lifecycle Tags created on demand, rarely deleted
 */
export declare class TagHandlersV2 extends BaseHandler {
    constructor(database: FileIssueDatabase);
    /**
     * @ai-intent No initialization needed
     * @ai-pattern Optional initialization hook
     */
    initialize(): Promise<void>;
    /**
     * @ai-intent Handle get_tags MCP tool call
     * @ai-flow 1. Fetch tags with counts -> 2. Sort by name -> 3. Format as list
     * @ai-pattern Shows usage statistics for each tag
     * @ai-return Markdown formatted tag list with counts
     */
    handleGetTags: import("./base-handler.js").HandlerMethod<unknown, ToolResponse>;
    /**
     * @ai-intent Handle create_tag MCP tool call
     * @ai-flow 1. Validate name -> 2. Create tag -> 3. Return success
     * @ai-validation Tag name must be lowercase letters and hyphens
     * @ai-side-effects Inserts into tags table
     * @ai-edge-case Tag may already exist
     */
    handleCreateTag: import("./base-handler.js").HandlerMethod<unknown, ToolResponse>;
    /**
     * @ai-intent Handle delete_tag MCP tool call
     * @ai-flow 1. Validate name -> 2. Delete tag -> 3. Return result
     * @ai-critical Cascades to all tag relationships
     * @ai-side-effects Removes from tags and relationship tables
     * @ai-edge-case Tag may not exist
     */
    handleDeleteTag: import("./base-handler.js").HandlerMethod<unknown, ToolResponse>;
    /**
     * @ai-intent Handle search_tags MCP tool call
     * @ai-flow 1. Validate pattern -> 2. Search tags -> 3. Format results
     * @ai-pattern Case-insensitive substring matching
     * @ai-return Markdown list of matching tags
     */
    handleSearchTags: import("./base-handler.js").HandlerMethod<unknown, ToolResponse>;
}
