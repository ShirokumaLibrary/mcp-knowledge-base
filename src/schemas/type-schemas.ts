/**
 * @ai-context Zod schemas for type management operations
 * @ai-pattern Validation schemas for dynamic type system
 */

import { z } from 'zod';

/**
 * @ai-intent Schema for create_type tool
 */
export const CreateTypeSchema = z.object({
  name: z.string().min(1).regex(/^[a-z][a-z0-9_]*$/, 'Type name must start with a letter and contain only lowercase letters, numbers, and underscores'),
  base_type: z.enum(['tasks', 'documents']).optional().default('documents')
}).strict();

/**
 * @ai-intent Schema for get_types tool
 */
export const GetTypesSchema = z.object({
  include_definitions: z.boolean().optional().default(false)
}).strict();

/**
 * @ai-intent Schema for delete_type tool
 */
export const DeleteTypeSchema = z.object({
  name: z.string().min(1)
}).strict();

// Export types
export type CreateTypeArgs = z.infer<typeof CreateTypeSchema>;
export type GetTypesArgs = z.infer<typeof GetTypesSchema>;
export type DeleteTypeArgs = z.infer<typeof DeleteTypeSchema>;