import { z } from 'zod';
export const CreateTypeSchema = z.object({
    name: z.string().min(1).regex(/^[a-z][a-z0-9_]*$/, 'Type name must start with a letter and contain only lowercase letters, numbers, and underscores'),
    base_type: z.enum(['tasks', 'documents']).optional().default('documents'),
    description: z.string().optional()
}).strict();
export const GetTypesSchema = z.object({
    include_definitions: z.boolean().optional().default(false)
}).strict();
export const DeleteTypeSchema = z.object({
    name: z.string().min(1)
}).strict();
export const UpdateTypeSchema = z.object({
    name: z.string().min(1),
    description: z.string().min(1)
}).strict();
