import { z } from 'zod';
export const CreateSessionSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(1, 'Session title is required'),
    description: z.string().optional(),
    content: z.string().optional(),
    related_tasks: z.array(z.string()).optional(),
    related_documents: z.array(z.string()).optional(),
    tags: z.array(z.string()).default([]),
    datetime: z.string().optional()
}).strict();
export const UpdateSessionSchema = z.object({
    id: z.string().min(1, 'Session ID is required'),
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    content: z.string().optional(),
    related_tasks: z.array(z.string()).optional(),
    related_documents: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional()
}).strict();
export const CreateDailySchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    content: z.string().min(1, 'Content is required'),
    related_tasks: z.array(z.string()).optional(),
    related_documents: z.array(z.string()).optional(),
    tags: z.array(z.string()).default([])
}).strict();
export const UpdateDailySchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    content: z.string().min(1).optional(),
    related_tasks: z.array(z.string()).optional(),
    related_documents: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional()
}).strict();
export const SearchSessionsByTagSchema = z.object({
    tag: z.string().min(1, 'Tag is required')
}).strict();
export const GetSessionsSchema = z.object({
    start_date: z.string().optional(),
    end_date: z.string().optional()
}).strict();
export const GetSessionDetailSchema = z.object({
    id: z.string().min(1, 'Session ID is required')
}).strict();
export const GetDailySummariesSchema = z.object({
    start_date: z.string().optional(),
    end_date: z.string().optional()
}).strict();
export const GetDailyDetailSchema = z.object({
    date: z.string().min(1, 'Date is required')
}).strict();
