import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { CreateDailySchema, UpdateDailySchema, GetDailySummariesSchema, GetDailyDetailSchema } from '../schemas/session-schemas.js';
import { createLogger } from '../utils/logger.js';
export class SummaryHandlers {
    sessionManager;
    logger = createLogger('SummaryHandlers');
    handlerName = 'SummaryHandlers';
    constructor(sessionManager) {
        this.sessionManager = sessionManager;
    }
    async handleCreateDaily(args) {
        try {
            const validatedArgs = CreateDailySchema.parse(args);
            const summary = await this.sessionManager.createDaily(validatedArgs.date, validatedArgs.title, validatedArgs.content, validatedArgs.tags, validatedArgs.related_tasks, validatedArgs.related_documents, validatedArgs.description);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({ data: summary, message: 'Daily summary created successfully' }, null, 2)
                    }
                ]
            };
        }
        catch (error) {
            this.logger.error('Failed to create daily summary', { error, args });
            if (error instanceof Error && error.message.includes('already exists')) {
                throw new McpError(ErrorCode.InvalidRequest, error.message);
            }
            if (error instanceof McpError) {
                throw error;
            }
            throw new McpError(ErrorCode.InternalError, `Failed to create daily summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async handleUpdateDaily(args) {
        try {
            const validatedArgs = UpdateDailySchema.parse(args);
            const summary = await this.sessionManager.updateDaily(validatedArgs.date, validatedArgs.title, validatedArgs.content, validatedArgs.tags, validatedArgs.related_tasks, validatedArgs.related_documents, validatedArgs.description);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({ data: summary, message: 'Daily summary updated successfully' }, null, 2)
                    }
                ]
            };
        }
        catch (error) {
            this.logger.error('Failed to update daily summary', { error, args });
            if (error instanceof McpError) {
                throw error;
            }
            throw new McpError(ErrorCode.InternalError, `Failed to update daily summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async handleGetDailySummaries(args) {
        try {
            const validatedArgs = GetDailySummariesSchema.parse(args);
            const summaries = await this.sessionManager.getDailySummaries(validatedArgs.start_date, validatedArgs.end_date);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({ data: summaries }, null, 2)
                    }
                ]
            };
        }
        catch (error) {
            this.logger.error('Failed to get daily summaries', { error, args });
            if (error instanceof McpError) {
                throw error;
            }
            throw new McpError(ErrorCode.InternalError, `Failed to get daily summaries: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async handleGetDailyDetail(args) {
        try {
            const validatedArgs = GetDailyDetailSchema.parse(args);
            const summary = await this.sessionManager.getDailyDetail(validatedArgs.date);
            if (!summary) {
                throw new McpError(ErrorCode.InvalidRequest, `Daily summary for ${validatedArgs.date} not found`);
            }
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({ data: summary }, null, 2)
                    }
                ]
            };
        }
        catch (error) {
            this.logger.error('Failed to get daily summary detail', { error, args });
            if (error instanceof McpError) {
                throw error;
            }
            throw new McpError(ErrorCode.InternalError, `Failed to get daily summary detail: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
