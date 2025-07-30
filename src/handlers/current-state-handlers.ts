/**
 * @ai-context MCP handlers for current state management
 * @ai-pattern Simple file-based state storage
 * @ai-critical No database sync, no search index, just a plain file
 * @ai-dependencies File system only
 */

import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import type { ToolResponse } from '../types/mcp-types.js';
import { UpdateCurrentStateSchema } from '../schemas/current-state-schemas.js';
import { createLogger } from '../utils/logger.js';
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
   * @ai-intent Initialize with data directory
   * @ai-pattern Fixed filename current_state.md
   */
  constructor(private dataDir: string) {
    this.filePath = path.join(dataDir, 'current_state.md');
  }

  /**
   * @ai-intent Handle get_current_state MCP tool call
   * @ai-flow 1. Read file -> 2. Return content or empty string
   * @ai-edge-case File not found returns empty string
   */
  async handleGetCurrentState(): Promise<ToolResponse> {
    this.logger.info('Getting current state');
    
    try {
      const content = await fs.readFile(this.filePath, 'utf-8');
      return {
        content: [{
          type: 'text',
          text: content
        }]
      };
    } catch (error) {
      // File doesn't exist, return empty string
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return {
          content: [{
            type: 'text',
            text: ''
          }]
        };
      }
      
      // Other errors
      this.logger.error('Failed to read current state', error);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to read current state: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * @ai-intent Handle update_current_state MCP tool call
   * @ai-flow 1. Validate params -> 2. Write file -> 3. Return success
   * @ai-validation Content must be string
   */
  async handleUpdateCurrentState(args: unknown): Promise<ToolResponse> {
    this.logger.info('Updating current state');
    
    // Validate parameters
    const { content } = UpdateCurrentStateSchema.parse(args);
    
    try {
      // Ensure directory exists
      await fs.mkdir(this.dataDir, { recursive: true });
      
      // Write content to file
      await fs.writeFile(this.filePath, content, 'utf-8');
      
      return {
        content: [{
          type: 'text',
          text: 'Current state updated successfully'
        }]
      };
    } catch (error) {
      this.logger.error('Failed to update current state', error);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to update current state: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}