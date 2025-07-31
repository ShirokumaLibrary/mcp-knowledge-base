import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { CreateStatusSchema, UpdateStatusSchema, DeleteStatusSchema } from '../schemas/status-schemas.js';
import { createLogger } from '../utils/logger.js';
export class StatusHandlers {
    db;
    logger = createLogger('StatusHandlers');
    handlerName = 'StatusHandlers';
    constructor(db) {
        this.db = db;
    }
    async handleGetStatuses() {
        try {
            const statuses = await this.db.getAllStatuses();
            if (statuses.length === 0) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: '## Statuses\n\nNo statuses found. Please create statuses first.'
                        }
                    ]
                };
            }
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
    async handleCreateStatus(args) {
        try {
            const validatedArgs = CreateStatusSchema.parse(args);
            const status = await this.db.createStatus(validatedArgs.name);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Status created: ${JSON.stringify(status)}`
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
    async handleUpdateStatus(args) {
        try {
            const validatedArgs = UpdateStatusSchema.parse(args);
            const success = await this.db.updateStatus(validatedArgs.id, validatedArgs.name);
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
    async handleDeleteStatus(args) {
        try {
            const validatedArgs = DeleteStatusSchema.parse(args);
            const success = await this.db.deleteStatus(validatedArgs.id);
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
