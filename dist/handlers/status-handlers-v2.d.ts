/**
 * @ai-context MCP handlers for workflow status management using base handler
 * @ai-pattern Extends BaseHandler for consistent error handling
 * @ai-critical Statuses are referenced by issues and plans
 * @ai-dependencies Database for status persistence
 * @ai-assumption Status names should be unique
 */
import { BaseHandler, ToolResponse } from './base-handler.js';
import type { FileIssueDatabase } from '../database/index.js';
/**
 * @ai-context Handles MCP tool calls for status operations
 * @ai-pattern CRUD handlers with validation and error handling
 * @ai-critical Statuses cannot be deleted if in use
 * @ai-lifecycle Statuses are long-lived workflow states
 */
export declare class StatusHandlersV2 extends BaseHandler {
    constructor(database: FileIssueDatabase);
    /**
     * @ai-intent No initialization needed
     * @ai-pattern Optional initialization hook
     */
    initialize(): Promise<void>;
    /**
     * @ai-intent Handle get_statuses MCP tool call
     * @ai-flow 1. Fetch all statuses -> 2. Format as markdown table
     * @ai-pattern Uses wrapHandler for consistent error handling
     * @ai-return Markdown formatted status list
     */
    handleGetStatuses: import("./base-handler.js").HandlerMethod<unknown, ToolResponse>;
    /**
     * @ai-intent Handle create_status MCP tool call
     * @ai-flow 1. Validate name -> 2. Create in DB -> 3. Return new status
     * @ai-validation Name required and non-empty
     * @ai-side-effects Inserts into statuses table
     */
    handleCreateStatus: import("./base-handler.js").HandlerMethod<unknown, ToolResponse>;
    /**
     * @ai-intent Handle update_status MCP tool call
     * @ai-flow 1. Validate ID/name -> 2. Update in DB -> 3. Return result
     * @ai-validation ID and name required
     * @ai-edge-case Status may not exist
     */
    handleUpdateStatus: import("./base-handler.js").HandlerMethod<unknown, ToolResponse>;
    /**
     * @ai-intent Handle delete_status MCP tool call
     * @ai-flow 1. Validate ID -> 2. Check usage -> 3. Delete -> 4. Return result
     * @ai-validation Status must not be in use
     * @ai-critical Can break referential integrity
     */
    handleDeleteStatus: import("./base-handler.js").HandlerMethod<unknown, ToolResponse>;
}
