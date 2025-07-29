/**
 * @ai-context MCP handlers for workflow status management using base handler
 * @ai-pattern Extends BaseHandler for consistent error handling
 * @ai-critical Statuses are referenced by issues and plans
 * @ai-dependencies Database for status persistence
 * @ai-assumption Status names should be unique
 */
import { BaseHandler } from './base-handler.js';
import { CreateStatusSchema, UpdateStatusSchema, DeleteStatusSchema } from '../schemas/status-schemas.js';
import { z } from 'zod';
/**
 * @ai-intent Empty schema for parameterless operations
 * @ai-pattern Common pattern for list operations
 */
const EmptySchema = z.object({});
/**
 * @ai-context Handles MCP tool calls for status operations
 * @ai-pattern CRUD handlers with validation and error handling
 * @ai-critical Statuses cannot be deleted if in use
 * @ai-lifecycle Statuses are long-lived workflow states
 */
export class StatusHandlersV2 extends BaseHandler {
    constructor(database) {
        // @ai-any-deliberate: V2 handlers use FileIssueDatabase which doesn't fully implement IDatabase
        super('StatusHandlers', database);
    }
    /**
     * @ai-intent No initialization needed
     * @ai-pattern Optional initialization hook
     */
    async initialize() {
        // No initialization required for status handlers
    }
    /**
     * @ai-intent Handle get_statuses MCP tool call
     * @ai-flow 1. Fetch all statuses -> 2. Format as markdown table
     * @ai-pattern Uses wrapHandler for consistent error handling
     * @ai-return Markdown formatted status list
     */
    handleGetStatuses = this.wrapHandler('get statuses', EmptySchema, async () => {
        this.ensureDatabase();
        const statuses = await this.database.getAllStatuses();
        if (statuses.length === 0) {
            return this.createResponse('## Statuses\n\nNo statuses found. Please create statuses first.');
        }
        // @ai-pattern: Markdown table for readability
        const markdown = [
            '## Available Statuses',
            '',
            '| Name | Is Closed |',
            '|------|-----------|',
            ...statuses.map((status) => `| ${status.name} | ${status.is_closed ? 'Yes' : 'No'} |`)
        ].join('\n');
        return this.createResponse(markdown);
    });
    /**
     * @ai-intent Handle create_status MCP tool call
     * @ai-flow 1. Validate name -> 2. Create in DB -> 3. Return new status
     * @ai-validation Name required and non-empty
     * @ai-side-effects Inserts into statuses table
     */
    handleCreateStatus = this.wrapHandler('create status', CreateStatusSchema, async (args) => {
        this.ensureDatabase();
        // @ai-logic: Create new status
        const newStatus = await this.database.createStatus(args.name, args.is_closed || false);
        // @ai-pattern: JSON response for created entities
        return this.createResponse(`## Status Created\n\n${this.formatJson(newStatus)}`);
    });
    /**
     * @ai-intent Handle update_status MCP tool call
     * @ai-flow 1. Validate ID/name -> 2. Update in DB -> 3. Return result
     * @ai-validation ID and name required
     * @ai-edge-case Status may not exist
     */
    handleUpdateStatus = this.wrapHandler('update status', UpdateStatusSchema, async (args) => {
        this.ensureDatabase();
        // @ai-logic: Update existing status
        const updated = await this.database.updateStatus(args.id, args.name, args.is_closed);
        if (!updated) {
            return this.createErrorResponse(`Status with ID ${args.id} not found`);
        }
        return this.createResponse(`## Status Updated\n\nStatus ID ${args.id} has been updated to "${args.name}"`);
    });
    /**
     * @ai-intent Handle delete_status MCP tool call
     * @ai-flow 1. Validate ID -> 2. Check usage -> 3. Delete -> 4. Return result
     * @ai-validation Status must not be in use
     * @ai-critical Can break referential integrity
     */
    handleDeleteStatus = this.wrapHandler('delete status', DeleteStatusSchema, async (args) => {
        this.ensureDatabase();
        // @ai-logic: Attempt to delete status
        const deleted = await this.database.deleteStatus(args.id);
        if (!deleted) {
            return this.createErrorResponse(`Status with ID ${args.id} not found or is in use by existing items`);
        }
        return this.createResponse(`## Status Deleted\n\nStatus ID ${args.id} has been successfully deleted`);
    });
}
//# sourceMappingURL=status-handlers-v2.js.map