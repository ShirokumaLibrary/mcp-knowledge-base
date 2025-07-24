/**
 * @ai-context MCP (Model Context Protocol) type definitions
 * @ai-pattern Standard MCP response format
 * @ai-critical All tools must return this format
 * @ai-reference MCP SDK specification
 * @ai-why Ensures compatibility with MCP clients
 *
 * @ai-mcp-overview
 * Model Context Protocol (MCP) is a standard for AI-tool communication.
 * This server implements MCP tools that Claude can call to manage knowledge.
 *
 * @ai-error-handling-pattern
 * 1. Validation errors: Caught by Zod schemas before handler
 * 2. Business errors: Throw McpError with appropriate ErrorCode
 * 3. System errors: Caught in server.ts, wrapped as InternalError
 *
 * @ai-response-pattern
 * All responses must be JSON-stringified and wrapped in text content:
 * Success: {content: [{type: 'text', text: JSON.stringify(data)}]}
 * Error: Thrown as McpError, handled by MCP protocol layer
 *
 * @ai-available-error-codes
 * - InvalidRequest: Bad parameters or invalid state
 * - InternalError: Unexpected system failures
 * - MethodNotFound: Unknown tool name (handled by SDK)
 */
/**
 * @ai-intent Standard MCP tool response format
 * @ai-pattern Array of content blocks
 * @ai-critical Only 'text' type supported currently
 * @ai-assumption JSON serialized in text field
 * @ai-example {content: [{type: 'text', text: '{"data": ...}'}]}
 */
export interface ToolResponse {
    content: Array<{
        type: 'text';
        text: string;
    }>;
}
/**
 * @ai-intent Function signature for MCP tool handlers
 * @ai-pattern Async handler with validated args
 * @ai-flow args validated by schema -> handler -> ToolResponse
 * @ai-critical Must handle errors appropriately
 * @ai-assumption Args already validated by Zod schema
 */
export interface ToolHandler {
    (args: any): Promise<ToolResponse>;
}
