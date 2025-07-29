import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { CreateSessionSchema, UpdateSessionSchema, SearchSessionsByTagSchema, GetSessionsSchema, GetSessionDetailSchema } from '../schemas/session-schemas.js';
import { createLogger } from '../utils/logger.js';
export class SessionHandlers {
    sessionManager;
    logger = createLogger('SessionHandlers');
    handlerName = 'SessionHandlers';
    constructor(sessionManager) {
        this.sessionManager = sessionManager;
    }
    async handleCreateSession(args) {
        try {
            const validatedArgs = CreateSessionSchema.parse(args);
            const session = await this.sessionManager.createSession(validatedArgs.title, validatedArgs.content, validatedArgs.tags, validatedArgs.id, validatedArgs.datetime, validatedArgs.related_tasks, validatedArgs.related_documents, validatedArgs.description);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({ data: session }, null, 2)
                    }
                ]
            };
        }
        catch (error) {
            this.logger.error('Failed to create work session', { error, args });
            if (error instanceof McpError) {
                throw error;
            }
            throw new McpError(ErrorCode.InternalError, `Failed to create work session: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async handleUpdateSession(args) {
        try {
            const validatedArgs = UpdateSessionSchema.parse(args);
            const session = await this.sessionManager.updateSession(validatedArgs.id, validatedArgs.title, validatedArgs.content, validatedArgs.tags, validatedArgs.related_tasks, validatedArgs.related_documents, validatedArgs.description);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({ data: session }, null, 2)
                    }
                ]
            };
        }
        catch (error) {
            this.logger.error('Failed to update work session', { error, args });
            if (error instanceof McpError) {
                throw error;
            }
            throw new McpError(ErrorCode.InternalError, `Failed to update work session: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async handleGetLatestSession(_args) {
        try {
            const session = await this.sessionManager.getLatestSession();
            if (!session) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({ data: null }, null, 2)
                        }
                    ]
                };
            }
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({ data: session }, null, 2)
                    }
                ]
            };
        }
        catch (error) {
            this.logger.error('Failed to get latest session', { error });
            if (error instanceof McpError) {
                throw error;
            }
            throw new McpError(ErrorCode.InternalError, `Failed to get latest session: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async handleSearchSessionsByTag(args) {
        try {
            const validatedArgs = SearchSessionsByTagSchema.parse(args);
            const sessions = await this.sessionManager.searchSessionsByTag(validatedArgs.tag);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({ data: sessions }, null, 2)
                    }
                ]
            };
        }
        catch (error) {
            this.logger.error('Failed to search sessions by tag', { error, args });
            if (error instanceof McpError) {
                throw error;
            }
            throw new McpError(ErrorCode.InternalError, `Failed to search sessions by tag: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async handleGetSessions(args) {
        try {
            const validatedArgs = GetSessionsSchema.parse(args);
            const sessions = await this.sessionManager.getSessions(validatedArgs.start_date, validatedArgs.end_date);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({ data: sessions }, null, 2)
                    }
                ]
            };
        }
        catch (error) {
            this.logger.error('Failed to get sessions', { error, args });
            if (error instanceof McpError) {
                throw error;
            }
            throw new McpError(ErrorCode.InternalError, `Failed to get sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async handleGetSessionDetail(args) {
        try {
            const validatedArgs = GetSessionDetailSchema.parse(args);
            const session = await this.sessionManager.getSessionDetail(validatedArgs.id);
            if (!session) {
                throw new McpError(ErrorCode.InvalidRequest, `Session ${validatedArgs.id} not found`);
            }
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({ data: session }, null, 2)
                    }
                ]
            };
        }
        catch (error) {
            this.logger.error('Failed to get session detail', { error, args });
            if (error instanceof McpError) {
                throw error;
            }
            throw new McpError(ErrorCode.InternalError, `Failed to get session detail: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
