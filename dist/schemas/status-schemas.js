import { z } from 'zod';
export const CreateStatusSchema = z.object({
    name: z.string().min(1, 'Status name is required'),
    is_closed: z.boolean().optional().default(false)
}).strict();
export const UpdateStatusSchema = z.object({
    id: z.number().int().positive(),
    name: z.string().min(1, 'Status name is required'),
    is_closed: z.boolean().optional()
}).strict();
export const DeleteStatusSchema = z.object({
    id: z.number().int().positive()
}).strict();
