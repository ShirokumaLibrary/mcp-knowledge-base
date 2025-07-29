import { z } from 'zod';
const PrioritySchema = z.enum(['high', 'medium', 'low']);
const ItemTypeSchema = z.string().min(1);
export const GetItemsParams = z.object({
    type: ItemTypeSchema,
    statuses: z.array(z.string()).optional(),
    includeClosedStatuses: z.boolean().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    limit: z.number().optional()
});
export const GetItemDetailParams = z.object({
    type: ItemTypeSchema,
    id: z.union([z.string(), z.number()])
});
export const CreateItemParams = z.object({
    type: ItemTypeSchema,
    title: z.string().min(1),
    description: z.string().optional(),
    content: z.string().optional(),
    priority: PrioritySchema.optional(),
    status: z.string().optional(),
    tags: z.array(z.string()).optional(),
    related: z.array(z.string()).optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    start_time: z.string().optional(),
    related_documents: z.array(z.string()).optional(),
    related_tasks: z.array(z.string()).optional(),
    datetime: z.string().optional(),
    date: z.string().optional(),
    id: z.string()
        .refine((val) => {
        if (val.includes('..') || val.includes('/') || val.includes('\\') ||
            val.includes('\0') || val.includes('%') || val === '.') {
            return false;
        }
        return /^[a-zA-Z0-9\-_.]+$/.test(val);
    }, {
        message: 'Invalid ID format: must not contain path traversal patterns'
    })
        .optional(),
    category: z.string().optional()
});
export const UpdateItemParams = z.object({
    type: ItemTypeSchema,
    id: z.union([z.string(), z.number()]),
    title: z.string().optional(),
    description: z.string().optional(),
    content: z.string().optional(),
    priority: PrioritySchema.optional(),
    status: z.string().optional(),
    tags: z.array(z.string()).optional(),
    related: z.array(z.string()).optional(),
    start_date: z.string().nullable().optional(),
    end_date: z.string().nullable().optional(),
    start_time: z.string().optional(),
    related_documents: z.array(z.string()).optional(),
    related_tasks: z.array(z.string()).optional()
});
export const DeleteItemParams = z.object({
    type: ItemTypeSchema,
    id: z.union([z.string(), z.number()])
});
export const SearchItemsByTagParams = z.object({
    tag: z.string().min(1),
    types: z.array(ItemTypeSchema).optional()
});
export const GetSessionsParams = z.object({
    start_date: z.string().optional(),
    end_date: z.string().optional()
});
export const GetSessionDetailParams = z.object({
    id: z.string()
});
export const GetLatestSessionParams = z.object({});
export const CreateSessionParams = z.object({
    title: z.string().min(1),
    content: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    related_documents: z.array(z.string()).optional(),
    related_tasks: z.array(z.string()).optional(),
    datetime: z.string().optional(),
    id: z.string()
        .refine((val) => {
        if (val.includes('..') || val.includes('/') || val.includes('\\') ||
            val.includes('\0') || val.includes('%') || val === '.') {
            return false;
        }
        return /^[a-zA-Z0-9\-_.]+$/.test(val);
    }, {
        message: 'Invalid ID format: must not contain path traversal patterns'
    })
        .optional()
});
export const UpdateSessionParams = z.object({
    id: z.string(),
    title: z.string().optional(),
    content: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    related_documents: z.array(z.string()).optional(),
    related_tasks: z.array(z.string()).optional()
});
export const SearchSessionsByTagParams = z.object({
    tag: z.string().min(1)
});
export const GetSummariesParams = z.object({
    start_date: z.string().optional(),
    end_date: z.string().optional()
});
export const GetSummaryDetailParams = z.object({
    date: z.string()
});
export const CreateSummaryParams = z.object({
    date: z.string(),
    title: z.string().min(1),
    content: z.string(),
    tags: z.array(z.string()).optional(),
    related_documents: z.array(z.string()).optional(),
    related_tasks: z.array(z.string()).optional()
});
export const UpdateSummaryParams = z.object({
    date: z.string(),
    title: z.string().optional(),
    content: z.string().optional(),
    tags: z.array(z.string()).optional(),
    related_documents: z.array(z.string()).optional(),
    related_tasks: z.array(z.string()).optional()
});
