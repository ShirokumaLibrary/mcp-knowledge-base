/**
 * @ai-context MCP handlers for daily summary management
 * @ai-pattern Handler class for summary-related tools
 * @ai-critical Daily summaries aggregate work sessions
 * @ai-dependencies SessionManager for business logic
 * @ai-assumption One summary per date maximum
 */
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { CreateDailySchema, UpdateDailySchema, GetDailySummariesSchema, GetDailyDetailSchema } from '../schemas/session-schemas.js';
import { createLogger } from '../utils/logger.js';
/**
 * @ai-context Handles MCP tool calls for daily summaries
 * @ai-pattern Each method validates and delegates
 * @ai-critical Summaries are date-keyed singletons
 * @ai-lifecycle Create/update at day end, query anytime
 * @ai-why Daily reflection and progress tracking
 */
export class SummaryHandlers {
    sessionManager;
    logger = createLogger('SummaryHandlers');
    handlerName = 'SummaryHandlers';
    /**
     * @ai-intent Initialize with session manager
     * @ai-pattern Dependency injection
     * @ai-assumption Manager handles all summary logic
     */
    constructor(sessionManager) {
        this.sessionManager = sessionManager;
    }
    /**
     * @ai-intent Handle create_summary MCP tool call
     * @ai-flow 1. Validate date/content -> 2. Create summary -> 3. Return
     * @ai-validation Date format, title and content required
     * @ai-critical Overwrites existing summary for date
     * @ai-side-effects Creates/replaces markdown file, syncs SQLite
     * @ai-return Complete summary with success message
     */
    async handleCreateDaily(args) {
        try {
            const validatedArgs = CreateDailySchema.parse(args); // @ai-validation: Strict date format
            const summary = await this.sessionManager.createDaily(validatedArgs.date, // @ai-critical: Primary key
            validatedArgs.title, // @ai-validation: Required
            validatedArgs.content, // @ai-validation: Required
            validatedArgs.tags, // @ai-default: Empty array
            validatedArgs.related_tasks, validatedArgs.related_documents, validatedArgs.description // @ai-intent: One-line description for list views
            );
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
            // @ai-error-handling: Convert duplicate error to MCP format
            if (error instanceof Error && error.message.includes('already exists')) {
                throw new McpError(ErrorCode.InvalidRequest, error.message);
            }
            if (error instanceof McpError) {
                throw error;
            }
            throw new McpError(ErrorCode.InternalError, `Failed to create daily summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * @ai-intent Handle update_summary MCP tool call
     * @ai-flow 1. Validate date -> 2. Load existing -> 3. Update -> 4. Return
     * @ai-validation Date required, other fields optional
     * @ai-error-handling Catches not found error, converts to McpError
     * @ai-bug Empty strings blocked by schema validation
     * @ai-return Updated summary with success message
     */
    async handleUpdateDaily(args) {
        try {
            const validatedArgs = UpdateDailySchema.parse(args);
            const summary = await this.sessionManager.updateDaily(validatedArgs.date, // @ai-critical: Identifies summary
            validatedArgs.title, // @ai-bug: || prevents clearing
            validatedArgs.content, // @ai-bug: || prevents clearing
            validatedArgs.tags, // @ai-logic: Can be cleared
            validatedArgs.related_tasks, validatedArgs.related_documents, validatedArgs.description // @ai-intent: One-line description for list views
            );
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
            // @ai-error-handling: Convert to MCP error format
            throw new McpError(ErrorCode.InternalError, `Failed to update daily summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * @ai-intent Handle get_summaries MCP tool call
     * @ai-flow 1. Parse date range -> 2. Query summaries -> 3. Return list
     * @ai-validation Optional date range parameters
     * @ai-defaults No params = last 7 days of summaries
     * @ai-performance Reads multiple directories if range
     * @ai-return Array of summaries in date order
     */
    async handleGetDailySummaries(args) {
        try {
            const validatedArgs = GetDailySummariesSchema.parse(args);
            const summaries = await this.sessionManager.getDailySummaries(validatedArgs.start_date, // @ai-optional: Start of range
            validatedArgs.end_date // @ai-optional: End of range
            );
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
    /**
     * @ai-intent Handle get_summary_detail MCP tool call
     * @ai-flow 1. Validate date -> 2. Load summary -> 3. Check exists -> 4. Return
     * @ai-validation Date parameter required
     * @ai-error-handling Specific error if summary not found
     * @ai-return Complete summary object or McpError
     * @ai-why View specific day's summary
     */
    async handleGetDailyDetail(args) {
        try {
            const validatedArgs = GetDailyDetailSchema.parse(args);
            const summary = await this.sessionManager.getDailyDetail(validatedArgs.date);
            if (!summary) {
                throw new McpError(ErrorCode.InvalidRequest, `Daily summary for ${validatedArgs.date} not found` // @ai-ux: Include date in error
                );
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
//# sourceMappingURL=summary-handlers.js.map