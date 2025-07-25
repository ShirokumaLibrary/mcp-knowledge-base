/**
 * @ai-context MCP handlers for work session management
 * @ai-pattern Handler class for session-related MCP tools
 * @ai-critical Validates input and delegates to SessionManager
 * @ai-dependencies SessionManager for business logic, Zod for validation
 * @ai-assumption All responses follow MCP JSON format
 */

import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { WorkSessionManager } from '../session-manager.js';
import { ToolResponse } from '../types/mcp-types.js';
import { 
  CreateWorkSessionSchema, 
  UpdateWorkSessionSchema,
  SearchSessionsByTagSchema,
  GetSessionsSchema,
  GetSessionDetailSchema
} from '../schemas/session-schemas.js';

/**
 * @ai-context Handles MCP tool calls for session operations
 * @ai-pattern Each method validates args and returns JSON response
 * @ai-critical Error handling converts exceptions to McpError
 * @ai-lifecycle Request -> Validate -> Execute -> Format response
 * @ai-why Separates MCP protocol handling from business logic
 */
export class SessionHandlers {
  /**
   * @ai-intent Initialize with session manager dependency
   * @ai-pattern Dependency injection for testability
   * @ai-assumption Single manager instance per server
   */
  constructor(private sessionManager: WorkSessionManager) {}

  /**
   * @ai-intent Handle create_session MCP tool call
   * @ai-flow 1. Validate args -> 2. Create session -> 3. Return JSON
   * @ai-validation Schema ensures title is required
   * @ai-side-effects Creates markdown file and SQLite record
   * @ai-return MCP response with complete session object
   * @ai-error-handling Zod throws on validation failure
   */
  async handleCreateWorkSession(args: any): Promise<ToolResponse> {
    const validatedArgs = CreateWorkSessionSchema.parse(args);  // @ai-critical: Validates required fields
    const session = this.sessionManager.createSession(
      validatedArgs.title,
      validatedArgs.content,
      validatedArgs.tags,
      validatedArgs.category,
      validatedArgs.id  // @ai-logic: Optional custom ID
    );
    
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ data: session }, null, 2),  // @ai-pattern: Pretty JSON
        },
      ],
    };
  }

  /**
   * @ai-intent Handle update_session MCP tool call
   * @ai-flow 1. Validate with ID required -> 2. Update -> 3. Return updated
   * @ai-validation ID is mandatory, other fields optional
   * @ai-pattern Partial updates - unspecified fields preserved
   * @ai-error-handling Manager throws if session not found
   * @ai-return Updated session in MCP format
   */
  async handleUpdateWorkSession(args: any): Promise<ToolResponse> {
    const validatedArgs = UpdateWorkSessionSchema.parse(args);
    const session = this.sessionManager.updateSession(
      validatedArgs.id,        // @ai-critical: Required for lookup
      validatedArgs.title,
      validatedArgs.content,
      validatedArgs.tags,
      validatedArgs.category
    );
    
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ data: session }, null, 2),
        },
      ],
    };
  }

  /**
   * @ai-intent Handle get_latest_session MCP tool call
   * @ai-flow 1. Get today's latest -> 2. Check exists -> 3. Return
   * @ai-pattern No arguments needed
   * @ai-error-handling Throws McpError if no sessions today
   * @ai-return Most recent session from today
   * @ai-why Quick access to continue current work
   */
  async handleGetLatestSession(args: any): Promise<ToolResponse> {
    const session = this.sessionManager.getLatestSession();
    
    if (!session) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'No session found for today'  // @ai-ux: Clear user message
      );
    }
    
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ data: session }, null, 2),
        },
      ],
    };
  }

  /**
   * @ai-intent Handle search_sessions_by_tag MCP tool call
   * @ai-flow 1. Validate tag -> 2. Search files -> 3. Return matches
   * @ai-validation Tag parameter is required
   * @ai-performance File-based search - can be slow
   * @ai-pattern Exact tag match, case-sensitive
   * @ai-return Array of matching sessions
   */
  async handleSearchSessionsByTag(args: any): Promise<ToolResponse> {
    const validatedArgs = SearchSessionsByTagSchema.parse(args);
    const sessions = this.sessionManager.searchSessionsByTag(validatedArgs.tag);  // @ai-logic: Synchronous file search
    
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ data: sessions }, null, 2),
        },
      ],
    };
  }

  /**
   * @ai-intent Handle get_sessions MCP tool call
   * @ai-flow 1. Parse date range -> 2. Get sessions -> 3. Return list
   * @ai-validation Dates optional, format YYYY-MM-DD
   * @ai-defaults No dates = today's sessions only
   * @ai-performance Reads multiple directories if date range
   * @ai-return Chronologically ordered session array
   */
  async handleGetSessions(args: any): Promise<ToolResponse> {
    const validatedArgs = GetSessionsSchema.parse(args);
    const sessions = this.sessionManager.getSessions(
      validatedArgs.start_date,  // @ai-pattern: Optional start
      validatedArgs.end_date     // @ai-pattern: Optional end
    );
    
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ data: sessions }, null, 2),
        },
      ],
    };
  }

  /**
   * @ai-intent Handle get_session_detail MCP tool call
   * @ai-flow 1. Validate ID -> 2. Search all dates -> 3. Return or error
   * @ai-validation Session ID is required
   * @ai-performance Scans all date directories
   * @ai-error-handling Specific error message with ID
   * @ai-return Complete session object or McpError
   */
  async handleGetSessionDetail(args: any): Promise<ToolResponse> {
    const validatedArgs = GetSessionDetailSchema.parse(args);
    const session = this.sessionManager.getSessionDetail(validatedArgs.id);
    
    if (!session) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Session ${validatedArgs.id} not found`  // @ai-ux: Include ID in error
      );
    }
    
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ data: session }, null, 2),
        },
      ],
    };
  }
}