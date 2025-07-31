/**
 * @ai-context API response types for MCP protocol
 * @ai-pattern Strict typing for all API interactions
 * @ai-critical These types ensure type safety at API boundaries
 * @ai-dependencies MCP SDK types
 * @ai-assumption All responses follow MCP protocol standards
 */

import type { ErrorCode } from '@modelcontextprotocol/sdk/types.js';

/**
 * @ai-intent Standard MCP tool response
 * @ai-pattern Text-based response format
 * @ai-critical All handlers must return this type
 */
export interface ToolResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
}

/**
 * @ai-intent MCP error response
 * @ai-pattern Standard error format
 * @ai-usage Thrown as McpError in handlers
 */
export interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    data?: unknown;
  };
}

/**
 * @ai-intent Generic data wrapper
 * @ai-pattern Consistent data response format
 * @ai-usage Wrap all data responses in this structure
 */
export interface DataResponse<T> {
  data: T;
  message?: string;
  metadata?: {
    count?: number;
    timestamp?: string;
    version?: string;
  };
}

/**
 * @ai-intent Paginated response wrapper
 * @ai-pattern For large result sets
 * @ai-future Not yet implemented but reserved
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * @ai-intent Success response with optional message
 * @ai-pattern For operations without data return
 * @ai-usage Delete operations, status updates
 */
export interface SuccessResponse {
  success: boolean;
  message?: string;
}

/**
 * @ai-intent Batch operation result
 * @ai-pattern For operations on multiple items
 * @ai-future Reserved for batch operations
 */
export interface BatchResult<T> {
  succeeded: T[];
  failed: Array<{
    item: T;
    error: string;
  }>;
  total: number;
  successCount: number;
  failureCount: number;
}

/**
 * @ai-intent Tool handler function signature
 * @ai-pattern Replaces any with unknown for type safety
 * @ai-critical All handlers must match this signature
 */
export type ToolHandler = (args: unknown) => Promise<ToolResponse>;

/**
 * @ai-intent Validated tool handler with typed args
 * @ai-pattern For use after schema validation
 * @ai-usage Generic handler with validated input
 */
export type ValidatedToolHandler<T> = (args: T) => Promise<ToolResponse>;

/**
 * @ai-intent API operation types
 * @ai-pattern Standard CRUD operations
 * @ai-usage For logging and metrics
 */
export type OperationType =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'search'
  | 'list';

/**
 * @ai-intent API request context
 * @ai-pattern Metadata for all API operations
 * @ai-future For request tracking and auditing
 */
export interface RequestContext {
  requestId: string;
  timestamp: string;
  operation: OperationType;
  resource: string;
  userId?: string;
}

/**
 * @ai-intent Format helpers for API responses
 * @ai-pattern Consistent response formatting
 * @ai-usage Use these instead of manual formatting
 */
export const ResponseFormatters = {
  /**
   * @ai-intent Format data as MCP tool response
   * @ai-pattern Wraps data in proper structure
   */
  formatDataResponse<T>(data: T, message?: string): ToolResponse {
    const response: DataResponse<T> = { data };
    if (message) {
      response.message = message;
    }

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(response)
      }]
    };
  },

  /**
   * @ai-intent Format success message
   * @ai-pattern For operations without data
   */
  formatSuccessResponse(message: string): ToolResponse {
    return {
      content: [{
        type: 'text' as const,
        text: message
      }]
    };
  },

  /**
   * @ai-intent Format markdown table
   * @ai-pattern For human-readable responses
   */
  formatMarkdownResponse(markdown: string): ToolResponse {
    return {
      content: [{
        type: 'text' as const,
        text: markdown
      }]
    };
  },

  /**
   * @ai-intent Format error for MCP
   * @ai-pattern Consistent error formatting
   */
  formatErrorResponse(code: ErrorCode, message: string, data?: unknown): ErrorResponse {
    return {
      error: {
        code,
        message,
        data
      }
    };
  }
};

/**
 * @ai-intent Type predicates for API types
 * @ai-pattern Runtime type checking
 * @ai-usage Validate API responses
 */
export const ApiTypeGuards = {
  isToolResponse(value: unknown): value is ToolResponse {
    return (
      typeof value === 'object' &&
      value !== null &&
      'content' in value &&
      Array.isArray((value as any).content)
    );
  },

  isErrorResponse(value: unknown): value is ErrorResponse {
    return (
      typeof value === 'object' &&
      value !== null &&
      'error' in value &&
      typeof (value as any).error === 'object'
    );
  },

  isDataResponse<T>(value: unknown): value is DataResponse<T> {
    return (
      typeof value === 'object' &&
      value !== null &&
      'data' in value
    );
  }
};