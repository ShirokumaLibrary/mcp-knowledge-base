import { createLogger } from '../utils/logger.js';
import { McpError } from '@modelcontextprotocol/sdk/types.js';
import { ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
export class BaseHandler {
    handlerName;
    database;
    logger;
    constructor(handlerName, database) {
        this.handlerName = handlerName;
        this.database = database;
        this.logger = createLogger(handlerName);
    }
    createResponse(text) {
        return {
            content: [{
                    type: 'text',
                    text
                }]
        };
    }
    createErrorResponse(message) {
        return this.createResponse(`Error: ${message}`);
    }
    wrapHandler(methodName, schema, handler) {
        return async (args) => {
            try {
                const validatedArgs = schema.parse(args);
                return await handler(validatedArgs);
            }
            catch (error) {
                this.logger.error(`Failed to ${methodName}`, {
                    error,
                    args,
                    handler: this.handlerName
                });
                if (error instanceof McpError) {
                    throw error;
                }
                if (error instanceof z.ZodError) {
                    throw new McpError(ErrorCode.InvalidParams, `Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`);
                }
                throw new McpError(ErrorCode.InternalError, `Failed to ${methodName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        };
    }
    formatDate(date) {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toISOString().split('T')[0];
    }
    formatDateTime(date) {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleString();
    }
    parseOptionalArray(value) {
        if (value === undefined || value === null) {
            return undefined;
        }
        if (Array.isArray(value)) {
            return value.filter(item => typeof item === 'string');
        }
        return undefined;
    }
    formatList(items, emptyText = 'None') {
        if (!items || items.length === 0) {
            return emptyText;
        }
        return items.map(item => `- ${item}`).join('\n');
    }
    formatJson(obj) {
        return JSON.stringify(obj);
    }
    ensureDatabase() {
        if (!this.database) {
            throw new McpError(ErrorCode.InternalError, 'Database not initialized');
        }
    }
    formatError(error) {
        if (error instanceof McpError) {
            return error.message;
        }
        if (error instanceof Error) {
            return error.message;
        }
        return 'An unknown error occurred';
    }
    isEmpty(value) {
        return value === null ||
            value === undefined ||
            value === '' ||
            (Array.isArray(value) && value.length === 0);
    }
    truncate(text, maxLength = 100) {
        if (text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength - 3) + '...';
    }
}
