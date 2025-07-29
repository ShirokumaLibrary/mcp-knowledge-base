/**
 * @ai-context Unified schemas for all item operations
 * @ai-pattern Zod schemas for request validation
 * @ai-critical Single source of truth for API contracts
 */

import { z } from 'zod';

/**
 * @ai-intent Base schemas for common fields
 */
const PrioritySchema = z.enum(['high', 'medium', 'low']);
const ItemTypeSchema = z.string().min(1);

/**
 * @ai-intent Get items parameters
 * @ai-validation Type required, optional status filtering
 */
export const GetItemsParams = z.object({
  type: ItemTypeSchema,
  statuses: z.array(z.string()).optional(),
  includeClosedStatuses: z.boolean().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  limit: z.number().optional()
});

/**
 * @ai-intent Get item detail parameters
 * @ai-validation Type and ID required
 */
export const GetItemDetailParams = z.object({
  type: ItemTypeSchema,
  id: z.union([z.string(), z.number()])
});

/**
 * @ai-intent Create item parameters
 * @ai-validation Type and title required, other fields optional
 */
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
  datetime: z.string().optional(), // For sessions: ISO datetime for past data migration
  date: z.string().optional(), // For dailies: YYYY-MM-DD format
  id: z.string()
    .refine((val) => {
      // Path traversal and security validation
      if (val.includes('..') || val.includes('/') || val.includes('\\') || 
          val.includes('\0') || val.includes('%') || val === '.') {
        return false;
      }
      // Only allow alphanumeric, dash, underscore, and dot
      return /^[a-zA-Z0-9\-_.]+$/.test(val);
    }, {
      message: "Invalid ID format: must not contain path traversal patterns"
    })
    .optional(), // For sessions: custom ID
  category: z.string().optional() // For sessions: category field
});

/**
 * @ai-intent Update item parameters
 * @ai-validation Type and ID required, all fields optional
 */
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

/**
 * @ai-intent Delete item parameters
 * @ai-validation Type and ID required
 */
export const DeleteItemParams = z.object({
  type: ItemTypeSchema,
  id: z.union([z.string(), z.number()])
});

/**
 * @ai-intent Search items by tag parameters
 * @ai-validation Tag required, types optional
 */
export const SearchItemsByTagParams = z.object({
  tag: z.string().min(1),
  types: z.array(ItemTypeSchema).optional()
});

/**
 * @ai-intent Session operation schemas
 */
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
      // Path traversal and security validation
      if (val.includes('..') || val.includes('/') || val.includes('\\') || 
          val.includes('\0') || val.includes('%') || val === '.') {
        return false;
      }
      // Only allow alphanumeric, dash, underscore, and dot
      return /^[a-zA-Z0-9\-_.]+$/.test(val);
    }, {
      message: "Invalid ID format: must not contain path traversal patterns"
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

/**
 * @ai-intent Summary operation schemas
 */
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