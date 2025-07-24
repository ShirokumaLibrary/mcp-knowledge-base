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
export {};
//# sourceMappingURL=mcp-types.js.map