/**
 * @ai-context MCP handlers for current state management
 * @ai-pattern Simple file-based state storage
 * @ai-critical No database sync, no search index, just a plain file
 * @ai-dependencies File system only
 */

import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import type { ToolResponse } from '../types/mcp-types.js';
import { UpdateCurrentStateSchema, CurrentStateMetadataSchema } from '../schemas/current-state-schemas.js';
import { createLogger } from '../utils/logger.js';
import { parseMarkdown, generateMarkdown } from '../utils/markdown-parser.js';
import type { TagRepository } from '../database/tag-repository.js';
import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * @ai-context Handles MCP tool calls for current state operations
 * @ai-pattern Simple read/write to fixed file
 * @ai-critical No complex operations, just get and set
 */
export class CurrentStateHandlers {
  private logger = createLogger('CurrentStateHandlers');
  public readonly handlerName = 'CurrentStateHandlers';
  private filePath: string;

  /**
   * @ai-intent Initialize with data directory and tag repository
   * @ai-pattern Fixed filename current_state.md
   * @ai-enhancement TagRepository for automatic tag registration
   */
  constructor(
    private dataDir: string,
    private tagRepo?: TagRepository,
    private validateRelatedItems?: (items: string[]) => Promise<string[]>
  ) {
    this.filePath = path.join(dataDir, 'current_state.md');
  }

  /**
   * @ai-intent Handle get_current_state MCP tool call
   * @ai-flow 1. Read file -> 2. Parse metadata -> 3. Return structured response
   * @ai-edge-case File not found returns empty response with default metadata
   * @ai-enhancement Returns both content and metadata
   */
  async handleGetCurrentState(): Promise<ToolResponse> {
    this.logger.info('Getting current state');

    try {
      const rawContent = await fs.readFile(this.filePath, 'utf-8');
      const parsed = parseMarkdown(rawContent);

      // Ensure null values are converted to empty arrays for compatibility
      if (parsed.metadata) {
        if (parsed.metadata.tags === null) {
          parsed.metadata.tags = [];
        }
        if (parsed.metadata.related === null) {
          parsed.metadata.related = [];
        }
      }

      // Validate and merge with defaults
      const metadata = CurrentStateMetadataSchema.parse(parsed.metadata || {});

      // Return structured response
      const response = {
        content: parsed.content,
        metadata: metadata
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(response)
        }]
      };
    } catch (error) {
      // File doesn't exist, return default structure
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        const defaultMetadata = CurrentStateMetadataSchema.parse({});
        const response = {
          content: '',
          metadata: defaultMetadata
        };

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response)
          }]
        };
      }

      // Other errors
      this.logger.error('Failed to read current state', error);
      throw new McpError(
        ErrorCode.InternalError,
        'Failed to read current state. ' +
        `Please ensure the file exists at ${this.filePath} and is readable. ` +
        'If this is a permission issue, please check file permissions. ' +
        `Original error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * @ai-intent Handle update_current_state MCP tool call
   * @ai-flow 1. Validate params -> 2. Build frontmatter -> 3. Write file -> 4. Return success
   * @ai-validation Content and optional metadata fields
   * @ai-enhancement Supports metadata for related items tracking
   */
  async handleUpdateCurrentState(args: unknown): Promise<ToolResponse> {
    this.logger.info('Updating current state');

    // Validate parameters
    const params = UpdateCurrentStateSchema.parse(args);

    try {
      // Ensure directory exists
      await fs.mkdir(this.dataDir, { recursive: true });

      // Build metadata
      interface CurrentStateMetadata {
        title: string;
        type: string;
        priority: string;
        tags: string[];
        updated_at: string;
        updated_by: string;
        related?: string[];
      }

      const metadata: CurrentStateMetadata = {
        title: 'プロジェクト現在状態',
        type: 'current_state',
        priority: 'high',
        tags: params.tags || ['system', 'state'],
        updated_at: new Date().toISOString(),
        updated_by: params.updated_by || 'system'
      };

      // Validate related items
      if (params.related?.length) {
        if (this.validateRelatedItems) {
          try {
            const validatedRelated = await this.validateRelatedItems(params.related);
            if (validatedRelated.length < params.related.length) {
              const invalid = params.related.filter(item => !validatedRelated.includes(item));
              throw new McpError(
                ErrorCode.InvalidRequest,
                `The following related items do not exist: ${invalid.join(', ')}. ` +
                'Please create these items first or remove them from the related field. ' +
                `Valid items: ${validatedRelated.join(', ')}`
              );
            }
            metadata.related = validatedRelated;
          } catch (error) {
            if (error instanceof McpError) {
              throw error;
            }
            throw new McpError(
              ErrorCode.InternalError,
              'Failed to validate related items. Please check the format (type-id) and try again. ' +
              'Expected format: issues-123, docs-456, sessions-2025-01-01-12.00.00.000'
            );
          }
        } else {
          metadata.related = params.related;
        }
      } else {
        metadata.related = [];
      }

      // Use generateMarkdown to ensure consistent JSON array format
      const fullContent = generateMarkdown(metadata, params.content);

      // Write content to file
      await fs.writeFile(this.filePath, fullContent, 'utf-8');

      // Register tags if TagRepository is available
      if (this.tagRepo && params.tags?.length) {
        try {
          await this.tagRepo.ensureTagsExist(params.tags);
          this.logger.info(`Registered ${params.tags.length} tags`);
        } catch (tagError) {
          this.logger.error('Failed to register tags', tagError);
          throw new McpError(
            ErrorCode.InternalError,
            `Failed to register tags: ${params.tags.join(', ')}. ` +
            'Please check if the tag names are valid (alphanumeric, hyphens, underscores only) and try again.'
          );
        }
      }

      return {
        content: [{
          type: 'text',
          text: 'Current state updated successfully'
        }]
      };
    } catch (error) {
      this.logger.error('Failed to update current state', error);

      // Re-throw McpError with AI-friendly message
      if (error instanceof McpError) {
        throw error;
      }

      // Convert other errors to AI-friendly instructions
      throw new McpError(
        ErrorCode.InternalError,
        'Failed to update current state. ' +
        'Please check: 1) The content is valid text, 2) Tags contain only alphanumeric characters, hyphens, or underscores, ' +
        '3) Related items follow the format \'type-id\' (e.g., issues-123). ' +
        `Original error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}