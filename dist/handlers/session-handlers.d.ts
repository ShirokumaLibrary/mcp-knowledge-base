/**
 * @ai-context MCP handlers for work session management
 * @ai-pattern Handler class for session-related MCP tools
 * @ai-critical Validates input and delegates to SessionManager
 * @ai-dependencies SessionManager for business logic, Zod for validation
 * @ai-assumption All responses follow MCP JSON format
 */
import type { SessionManager } from '../session-manager.js';
import type { ToolResponse } from '../types/mcp-types.js';
/**
 * @ai-context Handles MCP tool calls for session operations
 * @ai-pattern Each method validates args and returns JSON response
 * @ai-critical Error handling converts exceptions to McpError
 * @ai-lifecycle Request -> Validate -> Execute -> Format response
 * @ai-why Separates MCP protocol handling from business logic
 */
export declare class SessionHandlers {
    private sessionManager;
    private logger;
    readonly handlerName = "SessionHandlers";
    /**
     * @ai-intent Initialize with session manager dependency
     * @ai-pattern Dependency injection for testability
     * @ai-assumption Single manager instance per server
     */
    constructor(sessionManager: SessionManager);
    /**
     * @ai-intent Handle create_session MCP tool call
     * @ai-flow 1. Validate args -> 2. Create session -> 3. Return JSON
     * @ai-validation Schema ensures title is required
     * @ai-side-effects Creates markdown file and SQLite record
     * @ai-return MCP response with complete session object
     * @ai-error-handling Zod throws on validation failure
     */
    handleCreateSession(args: unknown): Promise<ToolResponse>;
    /**
     * @ai-intent Handle update_session MCP tool call
     * @ai-flow 1. Validate with ID required -> 2. Update -> 3. Return updated
     * @ai-validation ID is mandatory, other fields optional
     * @ai-pattern Partial updates - unspecified fields preserved
     * @ai-error-handling Manager throws if session not found
     * @ai-return Updated session in MCP format
     */
    handleUpdateSession(args: unknown): Promise<ToolResponse>;
    /**
     * @ai-intent Handle get_latest_session MCP tool call
     * @ai-flow 1. Get today's latest -> 2. Check exists -> 3. Return
     * @ai-pattern No arguments needed
     * @ai-error-handling Throws McpError if no sessions today
     * @ai-return Most recent session from today
     * @ai-why Quick access to continue current work
     */
    handleGetLatestSession(_args: unknown): Promise<ToolResponse>;
    /**
     * @ai-intent Handle search_sessions_by_tag MCP tool call
     * @ai-flow 1. Validate tag -> 2. Search files -> 3. Return matches
     * @ai-validation Tag parameter is required
     * @ai-performance File-based search - can be slow
     * @ai-pattern Exact tag match, case-sensitive
     * @ai-return Array of matching sessions
     */
    handleSearchSessionsByTag(args: unknown): Promise<ToolResponse>;
    /**
     * @ai-intent Handle get_sessions MCP tool call
     * @ai-flow 1. Parse date range -> 2. Get sessions -> 3. Return list
     * @ai-validation Dates optional, format YYYY-MM-DD
     * @ai-defaults No dates = today's sessions only
     * @ai-performance Reads multiple directories if date range
     * @ai-return Chronologically ordered session array
     */
    handleGetSessions(args: unknown): Promise<ToolResponse>;
    /**
     * @ai-intent Handle get_session_detail MCP tool call
     * @ai-flow 1. Validate ID -> 2. Search all dates -> 3. Return or error
     * @ai-validation Session ID is required
     * @ai-performance Scans all date directories
     * @ai-error-handling Specific error message with ID
     * @ai-return Complete session object or McpError
     */
    handleGetSessionDetail(args: unknown): Promise<ToolResponse>;
}
