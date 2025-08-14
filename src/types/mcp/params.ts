/**
 * MCP handler parameter type definitions
 */
import type { Priority, SortOrder, SortBy, SearchStrategy } from './base.js';

/**
 * CRUD operations parameters
 */
export interface CrudParams {
  // Common fields
  id?: number;
  type?: string;
  title?: string;
  description?: string;
  content?: string;

  // Status and priority
  status?: string;
  priority?: Priority;

  // Metadata
  category?: string;
  tags?: string[];
  version?: string;

  // Dates
  startDate?: string;
  endDate?: string;

  // includeEmbedding removed - embedding is always excluded from API responses
}

/**
 * Search and list parameters
 */
export interface SearchParams {
  // Query
  query?: string;

  // Filters
  types?: string[];
  status?: string[];
  priority?: Priority[];
  tags?: string[];

  // Pagination
  limit?: number;
  offset?: number;

  // Sorting
  sortBy?: SortBy;
  sortOrder?: SortOrder;
}

/**
 * Relation management parameters
 */
export interface RelationParams {
  // IDs
  id?: number;
  sourceId?: number;
  targetIds?: number[];
  startId?: number;
  endId?: number;

  // Search options
  depth?: number;
  strategy?: SearchStrategy;
  weights?: Record<string, number>;
  types?: string[];

  // Thresholds
  thresholds?: {
    min_similarity?: number;
    min_keyword_weight?: number;
    min_confidence?: number;
  };

  // Limits
  limit?: number;
  minSize?: number;
}

/**
 * System state parameters
 */
export interface SystemParams {
  // State update
  content?: string;
  tags?: string[];
  metadata?: {
    context?: string;
    updatedBy?: string;
  };

  // Tag suggestions
  prefix?: string;
  limit?: number;

  // Checkpoint
  name?: string;
  description?: string;
  includeData?: boolean;
}

/**
 * AI-related parameters
 */
export interface AIParams {
  id?: number;
  limit?: number;
}

/**
 * Combined params type for validation
 */
export type HandlerParams = CrudParams | SearchParams | RelationParams | SystemParams | AIParams;