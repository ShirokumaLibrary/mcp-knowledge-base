/**
 * @ai-context Advanced handler patterns and types
 * @ai-pattern Generic interfaces for type-safe handlers
 * @ai-critical Foundation for handler composition
 * @ai-dependencies MCP SDK for error types
 * @ai-why Type safety and consistent error handling
 */
import { McpError } from '@modelcontextprotocol/sdk/types.js';
/**
 * @ai-intent Generic handler interface
 * @ai-pattern Command pattern with typed args/result
 * @ai-critical All handlers implement this interface
 * @ai-generic TArgs: input type, TResult: output type
 * @ai-async All handlers are async for consistency
 */
export interface Handler<TArgs, TResult> {
    handle(args: TArgs): Promise<TResult>;
}
/**
 * @ai-intent Success response wrapper
 * @ai-pattern Discriminated union with success=true
 * @ai-generic T: the data payload type
 * @ai-usage Return from handlers on success
 */
export interface HandlerSuccess<T> {
    success: true;
    data: T;
}
/**
 * @ai-intent Error response wrapper
 * @ai-pattern Discriminated union with success=false
 * @ai-critical Consistent error format across handlers
 * @ai-usage Return from handlers on failure
 */
export interface HandlerError {
    success: false;
    error: string;
    code?: string;
}
/**
 * @ai-intent Result type for handlers
 * @ai-pattern Discriminated union for type-safe error handling
 * @ai-usage if (response.success) { response.data } else { response.error }
 * @ai-why Avoids exceptions for expected errors
 */
export type HandlerResponse<T> = HandlerSuccess<T> | HandlerError;
/**
 * @ai-intent Pagination metadata
 * @ai-pattern Standard pagination info
 * @ai-critical For large result sets
 * @ai-calculation totalPages = Math.ceil(total / pageSize)
 */
export interface PaginationInfo {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
/**
 * @ai-intent Paginated list response
 * @ai-pattern Items + pagination metadata
 * @ai-generic T: Type of items in the list
 * @ai-usage For endpoints returning lists
 */
export interface PaginatedResponse<T> {
    items: T[];
    pagination: PaginationInfo;
}
/**
 * @ai-intent Common arguments for list operations
 * @ai-pattern Standard pagination and sorting
 * @ai-defaults page: 1, pageSize: 20, sortOrder: 'asc'
 * @ai-validation page >= 1, pageSize > 0
 */
export interface ListArgs {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
/**
 * @ai-intent Arguments for ID-based operations
 * @ai-pattern Simple ID wrapper
 * @ai-flexibility Supports numeric or string IDs
 * @ai-usage Get, update, delete by ID
 */
export interface IdArgs {
    id: number | string;
}
/**
 * @ai-intent Arguments for tag-based search
 * @ai-pattern Single tag exact match
 * @ai-validation Non-empty tag name
 * @ai-usage Search items by tag
 */
export interface TagSearchArgs {
    tag: string;
}
/**
 * @ai-intent Arguments for date range queries
 * @ai-pattern Optional start/end dates
 * @ai-validation Dates in YYYY-MM-DD format
 * @ai-logic Both optional for flexible queries
 */
export interface DateRangeArgs {
    startDate?: string;
    endDate?: string;
}
/**
 * @ai-intent Mapping of tool names to handlers
 * @ai-pattern Registry pattern for tool lookup
 * @ai-usage Server maintains map for routing
 * @ai-critical Keys must match MCP tool names
 */
export type ToolHandlerMap = Map<string, Handler<any, any>>;
/**
 * @ai-intent Utility for converting errors to McpError
 * @ai-pattern Static utility class
 * @ai-critical Ensures all errors follow MCP format
 * @ai-flow 1. Check if McpError -> 2. Check if Error -> 3. Handle unknown
 * @ai-why Consistent error responses to MCP clients
 */
export declare class ErrorHandler {
    /**
     * @ai-intent Convert any error to McpError
     * @ai-flow Already McpError -> return, Error -> wrap, unknown -> generic
     * @ai-side-effects None - pure transformation
     * @ai-return Always returns McpError instance
     */
    static handle(error: unknown): McpError;
}
