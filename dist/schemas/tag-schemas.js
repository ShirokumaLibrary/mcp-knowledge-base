import { z } from 'zod';
export const CreateTagSchema = z.object({
    name: z.string().min(1, 'Tag name is required')
}).strict();
export const DeleteTagSchema = z.object({
    name: z.string().min(1, 'Tag name is required')
}).strict();
export const SearchTagSchema = z.object({
    pattern: z.string().min(1, 'Search pattern is required')
}).strict();
export const SearchAllByTagSchema = z.object({
    tag: z.string().min(1, 'Tag is required')
}).strict();
