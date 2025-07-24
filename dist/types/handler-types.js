/**
 * @ai-context Advanced handler patterns and types
 * @ai-pattern Generic interfaces for type-safe handlers
 * @ai-critical Foundation for handler composition
 * @ai-dependencies MCP SDK for error types
 * @ai-why Type safety and consistent error handling
 */
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
/**
 * @ai-intent Utility for converting errors to McpError
 * @ai-pattern Static utility class
 * @ai-critical Ensures all errors follow MCP format
 * @ai-flow 1. Check if McpError -> 2. Check if Error -> 3. Handle unknown
 * @ai-why Consistent error responses to MCP clients
 */
export class ErrorHandler {
    /**
     * @ai-intent Convert any error to McpError
     * @ai-flow Already McpError -> return, Error -> wrap, unknown -> generic
     * @ai-side-effects None - pure transformation
     * @ai-return Always returns McpError instance
     */
    static handle(error) {
        // @ai-logic: Already correct type - pass through
        if (error instanceof McpError) {
            return error;
        }
        // @ai-logic: Standard Error - preserve message
        if (error instanceof Error) {
            return new McpError(ErrorCode.InternalError, error.message, { originalError: error.name } // @ai-debug: Preserve error type
            );
        }
        // @ai-edge-case: Non-Error objects (strings, numbers, etc)
        return new McpError(ErrorCode.InternalError, 'An unknown error occurred', { error: String(error) } // @ai-debug: Convert to string for logging
        );
    }
}
//# sourceMappingURL=handler-types.js.map