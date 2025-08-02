import { z } from 'zod';
const ItemTypeSchema = z.string();
const DocumentSubtypeSchema = z.string();
export const GetItemsSchema = z.object({
    type: ItemTypeSchema,
    subtype: DocumentSubtypeSchema.optional(),
    includeClosedStatuses: z.boolean().optional().default(false),
    statusIds: z.array(z.number().int().positive()).optional()
}).strict();
export const GetItemDetailSchema = z.object({
    type: ItemTypeSchema,
    subtype: DocumentSubtypeSchema.optional(),
    id: z.number().int().positive()
}).strict();
const dateFormatSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');
export const CreateItemSchema = z.object({
    type: ItemTypeSchema,
    subtype: DocumentSubtypeSchema.optional(),
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    content: z.string().optional(),
    priority: z.enum(['high', 'medium', 'low']).optional(),
    status: z.string().optional(),
    version: z.string().optional(),
    tags: z.array(z.string()).optional(),
    start_date: dateFormatSchema.optional(),
    end_date: dateFormatSchema.optional(),
    related_tasks: z.array(z.string()).optional(),
    related_documents: z.array(z.string()).optional()
}).strict();
export const UpdateItemSchema = z.object({
    type: ItemTypeSchema,
    subtype: DocumentSubtypeSchema.optional(),
    id: z.number().int().positive(),
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    content: z.string().optional(),
    priority: z.enum(['high', 'medium', 'low']).optional(),
    status: z.string().optional(),
    version: z.string().optional(),
    tags: z.array(z.string()).optional(),
    start_date: dateFormatSchema.optional(),
    end_date: dateFormatSchema.optional(),
    related_tasks: z.array(z.string()).optional(),
    related_documents: z.array(z.string()).optional()
}).strict();
export const DeleteItemSchema = z.object({
    type: ItemTypeSchema,
    subtype: DocumentSubtypeSchema.optional(),
    id: z.number().int().positive()
}).strict();
export const SearchItemsByTagSchema = z.object({
    tag: z.string().min(1, 'Tag is required'),
    types: z.array(ItemTypeSchema).optional()
}).strict();
