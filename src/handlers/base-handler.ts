/**
 * @ai-context Base handler class for all MCP tool handlers
 * @ai-pattern Template method pattern with common error handling
 * @ai-critical Provides consistent error handling and logging
 * @ai-why Eliminates duplicate error handling code across handlers
 * @ai-assumption All handlers follow request-response pattern
 */

import type { Logger } from 'winston';
import { createLogger } from '../utils/logger.js';
import { McpError } from '@modelcontextprotocol/sdk/types.js';
import { ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import type { IDatabase } from '../database/interfaces/repository-interfaces.js';

/**
 * @ai-intent Standard tool response structure
 * @ai-pattern MCP protocol response format
 */
export interface ToolResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
}

/**
 * @ai-intent Handler method signature
 * @ai-pattern Type-safe handler with validation
 */
export type HandlerMethod<T = unknown, R = unknown> = (args: T) => Promise<R>;

/**
 * @ai-intent Abstract base handler with common functionality
 * @ai-pattern Template method for consistent error handling
 * @ai-critical All handlers should extend this class
 */
export abstract class BaseHandler {
  protected logger: Logger;

  constructor(
    protected handlerName: string,
    protected database?: IDatabase  // Now properly typed
  ) {
    this.logger = createLogger(handlerName);
  }

  /**
   * @ai-intent Create standard text response
   * @ai-pattern Consistent response format
   * @ai-usage Return from handler methods
   */
  public createResponse(text: string): ToolResponse {
    return {
      content: [{
        type: 'text',
        text
      }]
    };
  }

  /**
   * @ai-intent Create error response
   * @ai-pattern User-friendly error messages
   * @ai-usage Return on handled errors
   */
  public createErrorResponse(message: string): ToolResponse {
    return this.createResponse(`Error: ${message}`);
  }

  /**
   * @ai-intent Wrap handler method with error handling
   * @ai-pattern Decorator pattern for consistent error handling
   * @ai-flow 1. Validate args -> 2. Execute handler -> 3. Handle errors
   * @ai-critical Catches all errors and logs them
   */
  public wrapHandler<T = unknown>(
    methodName: string,
    schema: z.ZodSchema<T>,
    handler: HandlerMethod<T, ToolResponse>
  ): HandlerMethod<unknown, ToolResponse> {
    return async (args: unknown): Promise<ToolResponse> => {
      try {
        // @ai-logic: Validate arguments
        const validatedArgs = schema.parse(args);

        // @ai-logic: Execute handler
        return await handler(validatedArgs);

      } catch (error) {
        // @ai-logic: Log error with context
        this.logger.error(`Failed to ${methodName}`, {
          error,
          args,
          handler: this.handlerName
        });

        // @ai-logic: Return appropriate error
        if (error instanceof McpError) {
          throw error;
        }

        if (error instanceof z.ZodError) {
          throw new McpError(
            ErrorCode.InvalidParams,
            `Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`
          );
        }

        throw new McpError(
          ErrorCode.InternalError,
          `Failed to ${methodName}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    };
  }

  /**
   * @ai-intent Format date for display
   * @ai-pattern Consistent date formatting
   * @ai-usage For user-facing date strings
   */
  public formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
  }

  /**
   * @ai-intent Format datetime for display
   * @ai-pattern Human-readable datetime
   * @ai-usage For timestamps in responses
   */
  public formatDateTime(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString();
  }

  /**
   * @ai-intent Parse optional array parameter
   * @ai-pattern Handle undefined/null arrays
   * @ai-usage For optional array arguments
   */
  public parseOptionalArray(value: unknown): string[] | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    if (Array.isArray(value)) {
      return value.filter(item => typeof item === 'string');
    }

    return undefined;
  }

  /**
   * @ai-intent Format list for display
   * @ai-pattern Consistent list formatting
   * @ai-usage For array fields in responses
   */
  public formatList(items: string[] | undefined, emptyText: string = 'None'): string {
    if (!items || items.length === 0) {
      return emptyText;
    }

    return items.map(item => `- ${item}`).join('\n');
  }

  /**
   * @ai-intent Format JSON for display
   * @ai-pattern Pretty-printed JSON
   * @ai-usage For complex objects in responses
   */
  public formatJson(obj: unknown): string {
    return JSON.stringify(obj, null, 2);
  }

  /**
   * @ai-intent Ensure database is initialized
   * @ai-pattern Guard clause for database operations
   * @ai-critical Prevents operations on uninitialized database
   */
  public ensureDatabase(): void {
    if (!this.database) {
      throw new McpError(
        ErrorCode.InternalError,
        'Database not initialized'
      );
    }
  }

  /**
   * @ai-intent Format error for user display
   * @ai-pattern User-friendly error messages
   * @ai-usage Convert technical errors to readable format
   */
  public formatError(error: unknown): string {
    if (error instanceof McpError) {
      return error.message;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'An unknown error occurred';
  }

  /**
   * @ai-intent Check if value is empty
   * @ai-pattern Null/undefined/empty string check
   * @ai-usage For validation logic
   */
  public isEmpty(value: unknown): boolean {
    return value === null ||
           value === undefined ||
           value === '' ||
           (Array.isArray(value) && value.length === 0);
  }

  /**
   * @ai-intent Truncate text for display
   * @ai-pattern Limit text length with ellipsis
   * @ai-usage For long content in summaries
   */
  public truncate(text: string, maxLength: number = 100): string {
    if (text.length <= maxLength) {
      return text;
    }

    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * @ai-intent Optional method for handler initialization
   * @ai-pattern Hook for subclass setup
   * @ai-lifecycle Called after construction
   */
  initialize?(): Promise<void>;
}