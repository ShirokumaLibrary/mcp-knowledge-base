/**
 * Validation utility functions
 */
import { z } from 'zod';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * Validate parameters and execute handler
 */
export async function validateAndExecute<T>(
  schema: z.ZodSchema<T>,
  params: unknown,
  handler: (validated: T) => Promise<CallToolResult>
): Promise<CallToolResult> {
  try {
    const validated = schema.parse(params);
    return await handler(validated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(e =>
        `${e.path.join('.')}: ${e.message}`
      ).join(', ');

      throw new McpError(
        ErrorCode.InvalidParams,
        `Validation failed: ${errors}`
      );
    }
    throw error;
  }
}

/**
 * Safe parameter validation with error details
 */
export function validateParams<T>(
  schema: z.ZodSchema<T>,
  params: unknown
): T {
  try {
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(e =>
        `${e.path.join('.')}: ${e.message}`
      ).join(', ');

      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid parameters: ${errors}`
      );
    }
    throw new McpError(
      ErrorCode.InvalidParams,
      'Invalid parameters provided'
    );
  }
}