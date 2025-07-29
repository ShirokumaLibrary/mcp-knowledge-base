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
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { CreateStatusSchema, UpdateStatusSchema, DeleteStatusSchema } from '../schemas/status-schemas.js';
import { createLogger } from '../utils/logger.js';
/**
 * @ai-context Handles MCP tool calls for status operations
 * @ai-pattern CRUD handlers with validation and error handling
 * @ai-critical Statuses cannot be deleted if in use
 * @ai-lifecycle Statuses are long-lived workflow states
 * @ai-why Enable customizable workflow management
 */
export class StatusHandlers {
    db;
    logger = createLogger('StatusHandlers');
    handlerName = 'StatusHandlers';
    /**
     * @ai-intent Initialize with database dependency
     * @ai-pattern Dependency injection for testability
     * @ai-assumption Database handles all persistence
     */
    constructor(db) {
        this.db = db;
    }
    /**
     * @ai-intent Handle get_statuses MCP tool call
     * @ai-flow 1. Fetch all statuses -> 2. Format as markdown table -> 3. Return
     * @ai-pattern No arguments needed for list operation
     * @ai-ux Returns user-friendly markdown table
     * @ai-edge-case Empty list shows helpful message
     * @ai-return Markdown formatted status list
     */
    async handleGetStatuses() {
        try {
            const statuses = await this.db.getAllStatuses();
            if (statuses.length === 0) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: '## Statuses\n\nNo statuses found. Please create statuses first.' // @ai-ux: Guide user
                        }
                    ]
                };
            }
            // @ai-pattern: Markdown table for readability
            const markdown = [
                '## Available Statuses',
                '',
                '| Name | Is Closed |',
                '|------|-----------|',
                ...statuses.map(status => `| ${status.name} | ${status.is_closed ? 'Yes' : 'No'} |`)
            ].join('\n');
            return {
                content: [
                    {
                        type: 'text',
                        text: markdown
                    }
                ]
            };
        }
        catch (error) {
            this.logger.error('Failed to get statuses', { error });
            if (error instanceof McpError) {
                throw error;
            }
            throw new McpError(ErrorCode.InternalError, `Failed to retrieve statuses: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * @ai-intent Handle create_status MCP tool call
     * @ai-flow 1. Validate name -> 2. Create in DB -> 3. Return new status
     * @ai-validation Name required and non-empty
     * @ai-side-effects Inserts into statuses table
     * @ai-assumption Status names should be unique (not enforced)
     * @ai-return JSON formatted new status object
     */
    async handleCreateStatus(args) {
        try {
            const validatedArgs = CreateStatusSchema.parse(args); // @ai-validation: Throws on invalid
            const status = await this.db.createStatus(validatedArgs.name);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Status created: ${JSON.stringify(status, null, 2)}` // @ai-pattern: Pretty JSON
                    }
                ]
            };
        }
        catch (error) {
            this.logger.error('Failed to create status', { error, args });
            if (error instanceof McpError) {
                throw error;
            }
            throw new McpError(ErrorCode.InternalError, `Failed to create status: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * @ai-intent Handle update_status MCP tool call
     * @ai-flow 1. Validate args -> 2. Update in DB -> 3. Check success -> 4. Return
     * @ai-validation ID and new name both required
     * @ai-error-handling Throws McpError if status not found
     * @ai-bug Missing await on updateStatus call
     * @ai-return Success message with status ID
     */
    async handleUpdateStatus(args) {
        try {
            const validatedArgs = UpdateStatusSchema.parse(args);
            const success = await this.db.updateStatus(validatedArgs.id, validatedArgs.name); // @ai-fix: Added missing await
            if (!success) {
                throw new McpError(ErrorCode.InvalidRequest, `Status ID ${validatedArgs.id} not found`);
            }
            return {
                content: [
                    {
                        type: 'text',
                        text: `Status ID ${validatedArgs.id} updated`
                    }
                ]
            };
        }
        catch (error) {
            this.logger.error('Failed to update status', { error, args });
            if (error instanceof McpError) {
                throw error;
            }
            throw new McpError(ErrorCode.InternalError, `Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * @ai-intent Handle delete_status MCP tool call
     * @ai-flow 1. Validate ID -> 2. Delete from DB -> 3. Check success -> 4. Return
     * @ai-validation Positive integer ID required
     * @ai-critical Fails if status is referenced by items
     * @ai-bug Missing await on deleteStatus call
     * @ai-return Success message or McpError
     */
    async handleDeleteStatus(args) {
        try {
            const validatedArgs = DeleteStatusSchema.parse(args);
            const success = await this.db.deleteStatus(validatedArgs.id); // @ai-fix: Added missing await
            if (!success) {
                throw new McpError(ErrorCode.InvalidRequest, `Status ID ${validatedArgs.id} not found`);
            }
            return {
                content: [
                    {
                        type: 'text',
                        text: `Status ID ${validatedArgs.id} deleted`
                    }
                ]
            };
        }
        catch (error) {
            this.logger.error('Failed to delete status', { error, args });
            if (error instanceof McpError) {
                throw error;
            }
            throw new McpError(ErrorCode.InternalError, `Failed to delete status: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
//# sourceMappingURL=status-handlers.js.map