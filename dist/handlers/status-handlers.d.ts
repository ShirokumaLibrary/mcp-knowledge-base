/**
 * @ai-context MCP handlers for workflow status management
 * @ai-pattern Handler class for status CRUD operations
 * @ai-critical Statuses are referenced by issues and plans
 * @ai-dependencies Database for status persistence
 * @ai-assumption Status names should be unique
 * @ai-related-files
 *   - src/database/status-repository.ts (actual implementation)
 *   - src/schemas/status-schemas.ts (validation schemas)
 *   - src/unified-tool-definitions.ts (MCP tool definitions)
 *   - src/server.ts (registers these handlers)
 * @ai-data-flow MCP client -> server.ts -> StatusHandlers -> Database -> StatusRepository
 * @ai-integration-point Used by issues and plans for workflow state
 */
import { FileIssueDatabase } from '../database.js';
import { ToolResponse } from '../types/mcp-types.js';
/**
 * @ai-context Handles MCP tool calls for status operations
 * @ai-pattern CRUD handlers with validation and error handling
 * @ai-critical Statuses cannot be deleted if in use
 * @ai-lifecycle Statuses are long-lived workflow states
 * @ai-why Enable customizable workflow management
 */
export declare class StatusHandlers {
    private db;
    /**
     * @ai-intent Initialize with database dependency
     * @ai-pattern Dependency injection for testability
     * @ai-assumption Database handles all persistence
     */
    constructor(db: FileIssueDatabase);
    /**
     * @ai-intent Handle get_statuses MCP tool call
     * @ai-flow 1. Fetch all statuses -> 2. Format as markdown table -> 3. Return
     * @ai-pattern No arguments needed for list operation
     * @ai-ux Returns user-friendly markdown table
     * @ai-edge-case Empty list shows helpful message
     * @ai-return Markdown formatted status list
     */
    handleGetStatuses(): Promise<ToolResponse>;
    /**
     * @ai-intent Handle create_status MCP tool call
     * @ai-flow 1. Validate name -> 2. Create in DB -> 3. Return new status
     * @ai-validation Name required and non-empty
     * @ai-side-effects Inserts into statuses table
     * @ai-assumption Status names should be unique (not enforced)
     * @ai-return JSON formatted new status object
     */
    handleCreateStatus(args: any): Promise<ToolResponse>;
    /**
     * @ai-intent Handle update_status MCP tool call
     * @ai-flow 1. Validate args -> 2. Update in DB -> 3. Check success -> 4. Return
     * @ai-validation ID and new name both required
     * @ai-error-handling Throws McpError if status not found
     * @ai-bug Missing await on updateStatus call
     * @ai-return Success message with status ID
     */
    handleUpdateStatus(args: any): Promise<ToolResponse>;
    /**
     * @ai-intent Handle delete_status MCP tool call
     * @ai-flow 1. Validate ID -> 2. Delete from DB -> 3. Check success -> 4. Return
     * @ai-validation Positive integer ID required
     * @ai-critical Fails if status is referenced by items
     * @ai-bug Missing await on deleteStatus call
     * @ai-return Success message or McpError
     */
    handleDeleteStatus(args: any): Promise<ToolResponse>;
}
