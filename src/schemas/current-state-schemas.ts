/**
 * @ai-context Validation schemas for current state operations
 * @ai-pattern Zod schemas for MCP parameter validation
 * @ai-critical Ensures valid state updates
 */

import { z } from 'zod';

/**
 * @ai-intent Schema for update_current_state parameters
 * @ai-validation Content is required string
 */
export const UpdateCurrentStateSchema = z.object({
  content: z.string().describe('New state content')
});

/**
 * @ai-intent Export inferred types for TypeScript
 */
export type UpdateCurrentStateParams = z.infer<typeof UpdateCurrentStateSchema>;