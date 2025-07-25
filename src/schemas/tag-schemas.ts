/**
 * @ai-context Zod schemas for tag management tools
 * @ai-pattern Tag CRUD and search operations
 * @ai-critical Tags are shared across all content types
 * @ai-assumption Tag names are unique (case-insensitive)
 * @ai-why Tags enable cross-cutting categorization
 */

import { z } from 'zod';

/**
 * @ai-intent Schema for create_tag tool
 * @ai-validation Name required and non-empty
 * @ai-side-effects Creates in SQLite tags table
 * @ai-pattern Auto-created when items use new tags
 */
export const CreateTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required'),  // @ai-validation: Non-empty
}).strict();

/**
 * @ai-intent Schema for delete_tag tool
 * @ai-validation Name required (not ID)
 * @ai-critical Removes tag from all associated items
 * @ai-bug Parameter named 'name' not 'id' - inconsistent
 */
export const DeleteTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required'),  // @ai-bug: Should be 'id' for consistency
}).strict();

/**
 * @ai-intent Schema for search_tags tool
 * @ai-validation Pattern required for substring match
 * @ai-pattern Case-insensitive LIKE search
 * @ai-return Tags matching pattern with usage counts
 */
export const SearchTagSchema = z.object({
  pattern: z.string().min(1, 'Search pattern is required'),  // @ai-pattern: SQL LIKE %pattern%
}).strict();

/**
 * @ai-intent Schema for cross-type tag search
 * @ai-validation Exact tag name required
 * @ai-pattern Searches all content types
 * @ai-return Categorized results by type
 */
export const SearchAllByTagSchema = z.object({
  tag: z.string().min(1, 'Tag is required'),  // @ai-pattern: Exact match
}).strict();