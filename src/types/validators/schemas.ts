/**
 * Zod schemas for parameter validation
 */
import { z } from 'zod';

// Base schemas
export const PrioritySchema = z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'MINIMAL']);
export const SortOrderSchema = z.enum(['asc', 'desc']);
export const SortBySchema = z.enum(['created', 'updated', 'priority']);
export const SearchStrategySchema = z.enum(['keywords', 'concepts', 'embedding', 'hybrid']);

// Type validation (lowercase, numbers, underscores only)
export const TypeFieldSchema = z.string().regex(/^[a-z0-9_]+$/, {
  message: 'Type must contain only lowercase letters, numbers, and underscores'
});

// CRUD parameters schema
export const CrudParamsSchema = z.object({
  id: z.number().int().positive().optional(),
  type: TypeFieldSchema.optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  status: z.string().optional(),
  priority: PrioritySchema.optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  version: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
  // includeEmbedding removed - embedding is always excluded
}).strict();

// Search parameters schema
export const SearchParamsSchema = z.object({
  query: z.string().optional(),
  types: z.array(z.string()).optional(),
  status: z.array(z.string()).optional(),
  priority: z.array(PrioritySchema).optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
  sortBy: SortBySchema.optional(),
  sortOrder: SortOrderSchema.optional()
}).strict();

// Relation parameters schema
export const RelationParamsSchema = z.object({
  id: z.number().int().positive().optional(),
  sourceId: z.number().int().positive().optional(),
  targetIds: z.array(z.number().int().positive()).optional(),
  startId: z.number().int().positive().optional(),
  endId: z.number().int().positive().optional(),
  depth: z.number().int().min(1).max(3).optional(),
  strategy: SearchStrategySchema.optional(),
  weights: z.record(z.string(), z.number()).optional(),
  types: z.array(z.string()).optional(),
  thresholds: z.object({
    min_similarity: z.number().min(0).max(1).optional(),
    min_keyword_weight: z.number().min(0).optional(),
    min_confidence: z.number().min(0).max(1).optional()
  }).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  minSize: z.number().int().min(2).optional()
}).strict();

// System parameters schema
export const SystemParamsSchema = z.object({
  content: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.object({
    context: z.string().optional(),
    updatedBy: z.string().optional()
  }).optional(),
  prefix: z.string().optional(),
  limit: z.number().int().min(1).max(20).optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  includeData: z.boolean().optional()
}).strict();

// AI parameters schema
export const AIParamsSchema = z.object({
  id: z.number().int().positive().optional(),
  limit: z.number().int().min(1).max(50).optional()
}).strict();