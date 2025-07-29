/**
 * @ai-context MCP handlers for type management operations
 * @ai-pattern Handler pattern for dynamic type system
 */

import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import type { FileIssueDatabase } from '../database.js';
import type { ToolResponse } from '../types/mcp-types.js';
import { TypeRepository } from '../database/type-repository.js';
import type {
  CreateTypeArgs,
  GetTypesArgs,
  DeleteTypeArgs,
  UpdateTypeArgs
} from '../schemas/type-schemas.js';
import {
  CreateTypeSchema,
  GetTypesSchema,
  DeleteTypeSchema,
  UpdateTypeSchema
} from '../schemas/type-schemas.js';

export class TypeHandlers {
  private typeRepo: TypeRepository;
  private logger = {
    error: (message: string, context?: any) => {
      console.error(message, context);
    }
  };

  constructor(private db: FileIssueDatabase) {
    this.typeRepo = new TypeRepository(db);
  }

  /**
   * @ai-intent Initialize type repository
   */
  async init(): Promise<void> {
    await this.typeRepo.init();
  }

  /**
   * @ai-intent Create a new additional type
   * @ai-validation Validates type definition and checks for conflicts
   */
  async handleCreateType(args: unknown): Promise<ToolResponse> {
    try {
      const validatedArgs = CreateTypeSchema.parse(args) as CreateTypeArgs;

      await this.typeRepo.createType(validatedArgs.name, validatedArgs.base_type, validatedArgs.description);

      return {
        content: [
          {
            type: 'text' as const,
            text: `Type "${validatedArgs.name}" created successfully with base_type "${validatedArgs.base_type}"`
          }
        ]
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new McpError(ErrorCode.InvalidRequest, error.message);
      }
      throw error;
    }
  }

  /**
   * @ai-intent Get all available types
   * @ai-return List of types grouped by base_type with descriptions
   */
  async handleGetTypes(args: unknown): Promise<ToolResponse> {
    const validatedArgs = GetTypesSchema.parse(args) as GetTypesArgs;

    const types = await this.typeRepo.getAllTypes();

    // @ai-logic: Group types by base_type
    const typesByBase: Record<string, Array<{ type: string; base_type: string; description?: string }>> = {};
    for (const type of types) {
      if (!typesByBase[type.base_type]) {
        typesByBase[type.base_type] = [];
      }
      typesByBase[type.base_type].push(type);
    }

    // @ai-logic: Format response with base_type explanations
    let output = '## Available Types\n\n';

    // Tasks types
    if (typesByBase['tasks']) {
      output += '### Tasks (Task Management)\n';
      output += 'Task types with status and priority. Used for project management and bug tracking.\n\n';
      output += '| Type | Description |\n';
      output += '|------|-------------|\n';
      for (const type of typesByBase['tasks']) {
        const desc = type.description || 'Custom Task Type';
        output += `| ${type.type} | ${desc} |\n`;
      }
      output += '\n';
    }

    // Documents types
    if (typesByBase['documents']) {
      output += '### Documents (Documents)\n';
      output += 'Document types with required content. Used for knowledge base and technical documentation.\n\n';
      output += '| Type | Description |\n';
      output += '|------|-------------|\n';
      for (const type of typesByBase['documents']) {
        const desc = type.description || 'Custom Document Type';
        output += `| ${type.type} | ${desc} |\n`;
      }
      output += '\n';
    }

    // Other base types
    for (const [baseType, typeList] of Object.entries(typesByBase)) {
      if (baseType !== 'tasks' && baseType !== 'documents') {
        output += `### ${baseType}\n\n`;
        output += '| Type | Base Type |\n';
        output += '|------|-----------|\n';
        for (const type of typeList) {
          output += `| ${type.type} | ${type.base_type} |\n`;
        }
        output += '\n';
      }
    }

    // Special types (always available, not shown in type list)
    output += '### Special Types\n';
    output += 'These types have special ID formats and are always available:\n\n';
    output += '| Type | Description | ID Format |\n';
    output += '|------|-------------|----------|\n';
    output += '| sessions | Work session tracking. Content is optional - can be created at session start and updated later. | YYYY-MM-DD-HH.MM.SS.sss |\n';
    output += '| dailies | Daily summaries with required content. One entry per date. | YYYY-MM-DD |\n';
    output += '\n';

    // @ai-logic: Include full type definitions if requested
    if (validatedArgs.include_definitions) {
      output += '## Type Definitions (JSON)\n\n';
      output += '```json\n';
      const definitions = [
        ...types.map(t => ({
          type: t.type,
          base_type: t.base_type,
          description: t.description,
          supported_fields: this.getFieldsForBaseType(t.base_type)
        })),
        // Add special types
        {
          type: 'sessions',
          base_type: 'sessions',
          description: 'Work session tracking. Content is optional - can be created at session start and updated later. Uses timestamp-based IDs.',
          supported_fields: ['title', 'content', 'description', 'tags', 'related_tasks', 'related_documents', 'category']
        },
        {
          type: 'dailies',
          base_type: 'documents',
          description: 'Daily summaries with required content. One entry per date. Uses date as ID (YYYY-MM-DD).',
          supported_fields: ['title', 'content', 'description', 'tags', 'related_tasks', 'related_documents']
        }
      ];
      output += JSON.stringify(definitions, null, 2);
      output += '\n```\n';
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: output
        }
      ]
    };
  }

  /**
   * @ai-intent Get supported fields for a base type
   */
  private getFieldsForBaseType(baseType: string): string[] {
    switch (baseType) {
      case 'tasks':
        return ['title', 'content', 'description', 'priority', 'status', 'tags', 'start_date', 'end_date', 'related_tasks'];
      case 'documents':
        return ['title', 'content', 'description', 'tags'];
      default:
        return ['title', 'content', 'tags'];
    }
  }

  /**
   * @ai-intent Update type description
   * @ai-validation Only description can be updated
   * @ai-critical Type name changes are prohibited
   */
  async handleUpdateType(args: unknown): Promise<ToolResponse> {
    try {
      const validatedArgs = UpdateTypeSchema.parse(args) as UpdateTypeArgs;

      await this.typeRepo.updateType(validatedArgs.name, validatedArgs.description);

      return {
        content: [
          {
            type: 'text' as const,
            text: `Type "${validatedArgs.name}" description updated successfully`
          }
        ]
      };
    } catch (error) {
      this.logger.error('Failed to update type', { error, args });
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to update type: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * @ai-intent Delete an additional type
   * @ai-validation Checks for existing documents before deletion
   */
  async handleDeleteType(args: unknown): Promise<ToolResponse> {
    try {
      const validatedArgs = DeleteTypeSchema.parse(args) as DeleteTypeArgs;

      // Deletion check is now handled inside deleteType method
      await this.typeRepo.deleteType(validatedArgs.name);

      return {
        content: [
          {
            type: 'text' as const,
            text: `Type "${validatedArgs.name}" deleted successfully`
          }
        ]
      };
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new McpError(ErrorCode.InvalidRequest, error.message);
      }
      throw error;
    }
  }
}