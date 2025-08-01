/**
 * @ai-context Validation schemas for current state operations
 * @ai-pattern Zod schemas for MCP parameter validation
 * @ai-critical Ensures valid state updates
 */

import { z } from 'zod';

/**
 * @ai-intent Schema for update_current_state parameters
 * @ai-validation Content is required string
 * @ai-enhancement Now supports metadata fields for state tracking
 */
export const UpdateCurrentStateSchema = z.object({
  content: z.string().describe('New state content'),
  // Optional metadata fields
  related: z.array(z.string()).optional().describe('Related item IDs (sessions, dailies, issues, docs, etc.)'),
  tags: z.array(z.string()).optional().describe('Tags for categorization'),
  updated_by: z.string().optional().describe('Who/what updated the state (e.g., ai-start, ai-finish)')
});

/**
 * @ai-intent Schema for current state metadata
 * @ai-pattern YAML frontmatter structure
 */
export const CurrentStateMetadataSchema = z.object({
  title: z.string().default('プロジェクト現在状態'),
  type: z.literal('current_state').default('current_state'),
  priority: z.enum(['high', 'medium', 'low']).default('high'),
  tags: z.array(z.string()).default(['system', 'state']),
  related: z.array(z.string()).default([]),
  updated_at: z.string().optional(),
  updated_by: z.string().optional()
});

/**
 * @ai-intent Export inferred types for TypeScript
 */
export type UpdateCurrentStateParams = z.infer<typeof UpdateCurrentStateSchema>;
export type CurrentStateMetadata = z.infer<typeof CurrentStateMetadataSchema>;