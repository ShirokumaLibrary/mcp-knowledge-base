/**
 * @ai-context MCP handlers for item type change operations
 * @ai-pattern Handler for changing item types within same base type
 * @ai-critical Ensures data integrity during type migration
 */

import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import type { ToolResponse } from '../types/mcp-types.js';
import type { FileIssueDatabase } from '../database.js';
import { ChangeItemTypeSchema } from '../schemas/change-type-schemas.js';
import { createLogger } from '../utils/logger.js';

/**
 * @ai-context Handles MCP tool calls for type change operations
 * @ai-pattern Validates base type compatibility before migration
 */
export class ChangeTypeHandlers {
  private logger = createLogger('ChangeTypeHandlers');
  public readonly handlerName = 'ChangeTypeHandlers';

  constructor(private db: FileIssueDatabase) {}

  /**
   * @ai-intent Handle change_item_type MCP tool call
   * @ai-flow 1. Validate params -> 2. Check base types -> 3. Migrate item -> 4. Update relations
   */
  async handleChangeItemType(args: unknown): Promise<ToolResponse> {
    this.logger.info('Changing item type');

    // Validate parameters
    const { from_type, from_id, to_type } = ChangeItemTypeSchema.parse(args);

    // Get item repository
    const itemRepository = this.db.getItemRepository();

    try {
      // Workaround: The changeItemType method exists but is not recognized
      // Call it directly without type checking
      const result = await (itemRepository as unknown as { changeItemType: (from: string, id: string, to: string) => Promise<{ success: boolean; error?: string; new_id?: string }> }).changeItemType(from_type, String(from_id), to_type);

      if (!result.success) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          result.error || 'Failed to change item type'
        );
      }

      return {
        content: [{
          type: 'text',
          text: `## Type Change Successful

Item successfully migrated:
- From: ${from_type}-${from_id}
- To: ${to_type}-${result.new_id}

Note: The original item has been deleted.`
        }]
      };
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }

      this.logger.error('Failed to change item type', error);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to change item type: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}