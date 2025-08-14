import { z } from 'zod';

// Zod schemas for MCP tool input validation
export const CreateItemSchema = z.object({
  type: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().default(''),
  content: z.string().default(''),
  status: z.string().default('Open'),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'MINIMAL']).default('MEDIUM'),
  category: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  version: z.string().optional(),
  tags: z.array(z.string()).optional(),
  related: z.array(z.number()).optional()  // Array of item IDs to relate
});

export const GetItemSchema = z.object({
  id: z.number()
  // includeEmbedding removed - embedding is always excluded from response
});

export const UpdateItemSchema = z.object({
  id: z.number(),
  type: z.string().optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  status: z.string().optional(),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'MINIMAL']).optional(),
  category: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  version: z.string().optional(),
  tags: z.array(z.string()).optional(),
  related: z.array(z.number()).optional()  // Array of item IDs to relate
});

export const DeleteItemSchema = z.object({
  id: z.number()
});

export const SearchItemsSchema = z.object({
  query: z.string(),
  types: z.array(z.string()).optional(),
  limit: z.number().max(100).default(20),
  offset: z.number().default(0)
});

export const ListItemsSchema = z.object({
  type: z.string().optional(),
  status: z.array(z.string()).optional(),
  priority: z.array(z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'MINIMAL'])).optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().max(100).default(20),
  offset: z.number().default(0),
  sortBy: z.enum(['created', 'updated', 'priority']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

export const GetRelatedItemsSchema = z.object({
  id: z.number(),
  depth: z.number().min(1).max(3).default(1),
  types: z.array(z.string()).optional()
});

export const AddRelationsSchema = z.object({
  sourceId: z.number(),
  targetIds: z.array(z.number())
});

export const UpdateCurrentStateSchema = z.object({
  content: z.string(),
  tags: z.array(z.string()).optional(),
  metadata: z.object({
    updatedBy: z.string().optional(),
    context: z.string().optional()
  }).optional()
});