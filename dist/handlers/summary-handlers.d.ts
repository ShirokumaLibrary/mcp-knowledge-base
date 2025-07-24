/**
 * @ai-context MCP handlers for daily summary management
 * @ai-pattern Handler class for summary-related tools
 * @ai-critical Daily summaries aggregate work sessions
 * @ai-dependencies SessionManager for business logic
 * @ai-assumption One summary per date maximum
 */
import { WorkSessionManager } from '../session-manager.js';
import { ToolResponse } from '../types/mcp-types.js';
/**
 * @ai-context Handles MCP tool calls for daily summaries
 * @ai-pattern Each method validates and delegates
 * @ai-critical Summaries are date-keyed singletons
 * @ai-lifecycle Create/update at day end, query anytime
 * @ai-why Daily reflection and progress tracking
 */
export declare class SummaryHandlers {
    private sessionManager;
    /**
     * @ai-intent Initialize with session manager
     * @ai-pattern Dependency injection
     * @ai-assumption Manager handles all summary logic
     */
    constructor(sessionManager: WorkSessionManager);
    /**
     * @ai-intent Handle create_summary MCP tool call
     * @ai-flow 1. Validate date/content -> 2. Create summary -> 3. Return
     * @ai-validation Date format, title and content required
     * @ai-critical Overwrites existing summary for date
     * @ai-side-effects Creates/replaces markdown file, syncs SQLite
     * @ai-return Complete summary with success message
     */
    handleCreateDailySummary(args: any): Promise<ToolResponse>;
    /**
     * @ai-intent Handle update_summary MCP tool call
     * @ai-flow 1. Validate date -> 2. Load existing -> 3. Update -> 4. Return
     * @ai-validation Date required, other fields optional
     * @ai-error-handling Catches not found error, converts to McpError
     * @ai-bug Empty strings blocked by schema validation
     * @ai-return Updated summary with success message
     */
    handleUpdateDailySummary(args: any): Promise<ToolResponse>;
    /**
     * @ai-intent Handle get_summaries MCP tool call
     * @ai-flow 1. Parse date range -> 2. Query summaries -> 3. Return list
     * @ai-validation Optional date range parameters
     * @ai-defaults No params = last 7 days of summaries
     * @ai-performance Reads multiple directories if range
     * @ai-return Array of summaries in date order
     */
    handleGetDailySummaries(args: any): Promise<ToolResponse>;
    /**
     * @ai-intent Handle get_summary_detail MCP tool call
     * @ai-flow 1. Validate date -> 2. Load summary -> 3. Check exists -> 4. Return
     * @ai-validation Date parameter required
     * @ai-error-handling Specific error if summary not found
     * @ai-return Complete summary object or McpError
     * @ai-why View specific day's summary
     */
    handleGetDailySummaryDetail(args: any): Promise<ToolResponse>;
}
