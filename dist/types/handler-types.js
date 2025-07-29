import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
export class ErrorHandler {
    static handle(error) {
        if (error instanceof McpError) {
            return error;
        }
        if (error instanceof Error) {
            return new McpError(ErrorCode.InternalError, error.message, { originalError: error.name });
        }
        return new McpError(ErrorCode.InternalError, 'An unknown error occurred', { error: String(error) });
    }
}
