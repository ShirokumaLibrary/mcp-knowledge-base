/**
 * @ai-context MCP handlers for tag management using base handler
 * @ai-pattern Extends BaseHandler for consistent error handling
 * @ai-critical Tags are auto-created when referenced
 * @ai-dependencies Database for tag persistence
 * @ai-assumption Tag names are case-sensitive
 */

import { BaseHandler } from './base-handler.js';
import type { FileIssueDatabase } from '../database/index.js';
import {
  CreateTagSchema,
  DeleteTagSchema,
  SearchTagSchema
} from '../schemas/tag-schemas.js';
import { z } from 'zod';

/**
 * @ai-intent Empty schema for parameterless operations
 * @ai-pattern Common pattern for list operations
 */
const EmptySchema = z.object({});

/**
 * @ai-context Handles MCP tool calls for tag operations
 * @ai-pattern CRUD handlers with auto-creation support
 * @ai-critical Tags deleted cascade to all relationships
 * @ai-lifecycle Tags created on demand, rarely deleted
 */
export class TagHandlersV2 extends BaseHandler {
  constructor(database: FileIssueDatabase) {
    super('TagHandlers', database);
  }

  /**
   * @ai-intent No initialization needed
   * @ai-pattern Optional initialization hook
   */
  async initialize(): Promise<void> {
    // No initialization required for tag handlers
  }

  /**
   * @ai-intent Handle get_tags MCP tool call
   * @ai-flow 1. Fetch tags with counts -> 2. Sort by name -> 3. Format as list
   * @ai-pattern Shows usage statistics for each tag
   * @ai-return Markdown formatted tag list with counts
   */
  handleGetTags = this.wrapHandler(
    'get tags',
    EmptySchema,
    async () => {
      this.ensureDatabase();
      const tags = await this.database.getTags();

      if (tags.length === 0) {
        return this.createResponse(
          '## Tags\n\nNo tags found. Tags are automatically created when you use them.'
        );
      }

      // @ai-pattern: Sort alphabetically for easy scanning
      const sortedTags = tags.sort((a: any, b: any) => a.name.localeCompare(b.name));

      // @ai-pattern: Markdown list with usage counts
      const markdown = [
        '## Available Tags',
        '',
        ...sortedTags.map((tag: any) => `- ${tag.name} (used ${tag.count} times)`)
      ].join('\n');

      return this.createResponse(markdown);
    }
  );

  /**
   * @ai-intent Handle create_tag MCP tool call
   * @ai-flow 1. Validate name -> 2. Create tag -> 3. Return success
   * @ai-validation Tag name must be lowercase letters and hyphens
   * @ai-side-effects Inserts into tags table
   * @ai-edge-case Tag may already exist
   */
  handleCreateTag = this.wrapHandler(
    'create tag',
    CreateTagSchema,
    async (args) => {
      this.ensureDatabase();

      // @ai-logic: Attempt to create tag
      const tag = await this.database.createTag(args.name);

      return this.createResponse(
        `## Tag Created\n\nTag "${tag.name}" has been created successfully.`
      );
    }
  );

  /**
   * @ai-intent Handle delete_tag MCP tool call
   * @ai-flow 1. Validate name -> 2. Delete tag -> 3. Return result
   * @ai-critical Cascades to all tag relationships
   * @ai-side-effects Removes from tags and relationship tables
   * @ai-edge-case Tag may not exist
   */
  handleDeleteTag = this.wrapHandler(
    'delete tag',
    DeleteTagSchema,
    async (args) => {
      this.ensureDatabase();

      // @ai-logic: Attempt to delete tag
      const deleted = await this.database.deleteTag(args.name);

      if (!deleted) {
        return this.createErrorResponse(`Tag "${args.name}" not found`);
      }

      return this.createResponse(
        `## Tag Deleted\n\nTag "${args.name}" has been deleted. All references to this tag have been removed.`
      );
    }
  );

  /**
   * @ai-intent Handle search_tags MCP tool call
   * @ai-flow 1. Validate pattern -> 2. Search tags -> 3. Format results
   * @ai-pattern Case-insensitive substring matching
   * @ai-return Markdown list of matching tags
   */
  handleSearchTags = this.wrapHandler(
    'search tags',
    SearchTagSchema,
    async (args) => {
      this.ensureDatabase();

      // @ai-logic: Search for matching tags
      const tags = await this.database.searchTags(args.pattern);

      if (tags.length === 0) {
        return this.createResponse(
          `## Search Results\n\nNo tags found matching "${args.pattern}".`
        );
      }

      // @ai-pattern: Markdown list with usage counts
      const markdown = [
        `## Tags Matching "${args.pattern}"`,
        '',
        ...tags.map((tag: any) => `- ${tag.name} (used ${tag.count} times)`)
      ].join('\n');

      return this.createResponse(markdown);
    }
  );
}