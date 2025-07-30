/**
 * @ai-context Validation schemas for item type change operations
 * @ai-pattern Zod schemas for MCP parameter validation
 * @ai-critical Ensures type changes are valid
 */

import { z } from 'zod';

/**
 * @ai-intent Schema for change_item_type parameters
 * @ai-validation All fields required for safe type migration
 */
export const ChangeItemTypeSchema = z.object({
  from_type: z.string().describe('Current type of the item'),
  from_id: z.number().positive().describe('Current ID of the item'),
  to_type: z.string().describe('New type (must have same base_type as from_type)')
});

/**
 * @ai-intent Export inferred types for TypeScript
 */
export type ChangeItemTypeParams = z.infer<typeof ChangeItemTypeSchema>;