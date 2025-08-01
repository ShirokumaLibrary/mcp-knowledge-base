/**
 * @ai-context MCP handlers for tag management operations
 * @ai-pattern Handler class for tag CRUD and search
 * @ai-critical Tags are shared across all content types
 * @ai-dependencies Database for tag persistence
 * @ai-assumption Tag names are unique (case-insensitive)
 */

import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import type { FileIssueDatabase } from '../database.js';
import type { ToolResponse } from '../types/mcp-types.js';
import {
  CreateTagSchema,
  DeleteTagSchema,
  SearchTagSchema,
  SearchAllByTagSchema
} from '../schemas/tag-schemas.js';
import { createLogger } from '../utils/logger.js';

/**
 * @ai-context Handles MCP tool calls for tag operations
 * @ai-pattern CRUD handlers plus search functionality
 * @ai-critical Tags enable cross-content categorization
 * @ai-lifecycle Tags auto-created when used, manually managed
 * @ai-why Flexible categorization across all content types
 */
export class TagHandlers {
  private logger = createLogger('TagHandlers');
  public readonly handlerName = 'TagHandlers';

  /**
   * @ai-intent Initialize with database dependency
   * @ai-pattern Dependency injection
   * @ai-assumption Database handles all tag operations
   */
  constructor(private db: FileIssueDatabase) {}

  /**
   * @ai-intent Handle get_tags MCP tool call
   * @ai-flow 1. Fetch all tags -> 2. Return as JSON
   * @ai-pattern Simple list operation, no arguments
   * @ai-return Array of tags with usage counts
   * @ai-performance May include usage statistics
   */
  async handleGetTags(): Promise<ToolResponse> {
    try {
      const tags = await this.db.getTags();  // @ai-logic: Includes usage counts
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ data: tags })
          }
        ]
      };
    } catch (error) {
      this.logger.error('Failed to get tags', { error });
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to retrieve tags: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * @ai-intent Handle create_tag MCP tool call
   * @ai-flow 1. Validate name -> 2. Create tag -> 3. Handle errors -> 4. Return
   * @ai-validation Name required and non-empty
   * @ai-error-handling Catches duplicate tag errors
   * @ai-side-effects Inserts into tags table
   * @ai-pattern Auto-creation usually preferred over manual
   */
  async handleCreateTag(args: unknown): Promise<ToolResponse> {
    try {
      const validatedArgs = CreateTagSchema.parse(args);
      const tag = await this.db.createTag(validatedArgs.name);

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ data: tag, message: 'Tag created successfully' })
          }
        ]
      };
    } catch (error) {
      this.logger.error('Failed to create tag', { error, args });
      if (error instanceof McpError) {
        throw error;
      }
      // @ai-error-handling: Convert DB errors to MCP format
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to create tag: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }


  /**
   * @ai-intent Handle delete_tag MCP tool call
   * @ai-flow 1. Validate name -> 2. Delete tag -> 3. Check success -> 4. Return
   * @ai-validation Name required (not ID)
   * @ai-critical Removes tag from all associated items
   * @ai-bug Parameter is name not ID - inconsistent with other deletes
   * @ai-return Success message or error
   */
  async handleDeleteTag(args: unknown): Promise<ToolResponse> {
    try {
      const validatedArgs = DeleteTagSchema.parse(args);
      const success = await this.db.deleteTag(validatedArgs.name);  // @ai-bug: Uses name not ID

      if (!success) {
        throw new McpError(ErrorCode.InvalidRequest, `Tag "${validatedArgs.name}" not found. Use 'get_tags' to see all available tags.`);
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ message: `Tag "${validatedArgs.name}" deleted successfully` })
          }
        ]
      };
    } catch (error) {
      this.logger.error('Failed to delete tag', { error, args });
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to delete tag: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * @ai-intent Handle search_tags MCP tool call
   * @ai-flow 1. Validate pattern -> 2. Search tags -> 3. Return matches
   * @ai-validation Pattern required for substring match
   * @ai-pattern Case-insensitive LIKE search with % wildcards
   * @ai-return Array of matching tags with usage counts
   */
  async handleSearchTags(args: unknown): Promise<ToolResponse> {
    try {
      const validatedArgs = SearchTagSchema.parse(args);
      const tags = await this.db.searchTags(validatedArgs.pattern);  // @ai-pattern: SQL LIKE %pattern%

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ data: tags })
          }
        ]
      };
    } catch (error) {
      this.logger.error('Failed to search tags', { error, args });
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to search tags: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * @ai-intent Handle cross-type tag search
   * @ai-flow 1. Validate tag -> 2. Search all types -> 3. Return categorized
   * @ai-validation Exact tag name required
   * @ai-pattern Searches issues, plans, docs, knowledge, sessions
   * @ai-bug Missing await on searchAllByTag call
   * @ai-return Object with arrays for each content type
   */
  async handleSearchAllByTag(args: unknown): Promise<ToolResponse> {
    try {
      const validatedArgs = SearchAllByTagSchema.parse(args);
      const results = await this.db.searchAllByTag(validatedArgs.tag);  // @ai-fix: Added missing await

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ data: results })  // @ai-pattern: Categorized by type
          }
        ]
      };
    } catch (error) {
      this.logger.error('Failed to search all by tag', { error, args });
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to search items by tag: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}