import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import type { FileIssueDatabase } from '../database.js';
import type { ToolResponse } from '../types/mcp-types.js';
import type {
  GetItemsArgs,
  GetItemDetailArgs,
  CreateItemArgs,
  UpdateItemArgs,
  DeleteItemArgs,
  SearchItemsByTagArgs
} from '../schemas/item-schemas.js';
import {
  GetItemsSchema,
  GetItemDetailSchema,
  CreateItemSchema,
  UpdateItemSchema,
  DeleteItemSchema,
  SearchItemsByTagSchema
} from '../schemas/item-schemas.js';
import { Handler } from '../types/handler-types.js';
import type { Issue, Plan, Document, IssueSummary, PlanSummary, DocumentSummary } from '../types/domain-types.js';
// Removed static type registry - now using database queries directly

/**
 * @ai-context MCP tool handlers for all content types
 * @ai-pattern Strategy pattern with type-based dispatch
 * @ai-critical Entry point for all MCP tool calls - must handle errors gracefully
 * @ai-dependencies FileIssueDatabase for all data operations
 * @ai-why Single handler class simplifies MCP tool registration and maintenance
 */
export class ItemHandlers {

  constructor(private db: FileIssueDatabase) {}

  /**
   * @ai-intent Check if a type exists in sequences table
   * @ai-logic Query sequences table to validate type
   */
  private async isValidType(type: string): Promise<boolean> {
    const db = this.db.getDatabase();
    const row = await db.getAsync(
      'SELECT type FROM sequences WHERE type = ?',
      [type]
    ) as { type: string } | undefined;
    return !!row;
  }

  /**
   * @ai-intent Check if a type belongs to a specific base type
   * @ai-logic Query sequences table to check base_type
   */
  private async isTypeOfBase(type: string, baseType: string): Promise<boolean> {
    const db = this.db.getDatabase();
    const row = await db.getAsync(
      'SELECT base_type FROM sequences WHERE type = ?',
      [type]
    ) as { base_type: string } | undefined;
    return row ? row.base_type === baseType : false;
  }

  /**
   * @ai-intent List all items of specified type (issue/plan/doc/knowledge)
   * @ai-flow 1. Validate args -> 2. Dispatch by type -> 3. Format response
   * @ai-error-handling Throws McpError for invalid types, Zod errors for validation
   * @ai-performance Summary views for issues/docs to reduce payload size
   * @ai-assumption Database methods return empty arrays, not null
   * @ai-params
   *   - includeClosedStatuses: Include items with closed statuses (issue/plan only)
   *   - statusIds: Filter by specific status IDs (issue/plan only)
   */
  async handleGetItems(args: unknown): Promise<ToolResponse> {
    const validatedArgs = GetItemsSchema.parse(args) as GetItemsArgs;
    let data: IssueSummary[] | PlanSummary[] | DocumentSummary[];

    // @ai-logic: Type-based strategy dispatch using type registry
    const typeExists = await this.isValidType(validatedArgs.type);
    if (!typeExists) {
      throw new McpError(ErrorCode.InvalidRequest, `Unknown type: ${validatedArgs.type}`);
    }

    // Check if this is a task type (issues/plans)
    if (await this.isTypeOfBase(validatedArgs.type, 'tasks')) {
      // @ai-logic: Use unified task interface
      data = await this.db.getAllTasksSummary(
        validatedArgs.type,
        validatedArgs.includeClosedStatuses,
        validatedArgs.statusIds
      );  // @ai-performance: Summary for large datasets
    } else {
      // Handle all other types as documents
      data = await this.db.getAllDocumentsSummary(validatedArgs.type);
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ data }, null, 2)
        }
      ]
    };
  }

  /**
   * @ai-intent Retrieve complete details for a specific item
   * @ai-flow 1. Validate args -> 2. Fetch by type & ID -> 3. Validate existence -> 4. Return
   * @ai-error-handling McpError for not found, preserves original error context
   * @ai-critical Must distinguish between not found vs database errors
   * @ai-return Full item data including content/description fields
   */
  async handleGetItemDetail(args: unknown): Promise<ToolResponse> {
    const validatedArgs = GetItemDetailSchema.parse(args) as GetItemDetailArgs;
    let item: Issue | Plan | Document | null;

    // @ai-logic: Type-based dispatch using type registry
    const typeExists = await this.isValidType(validatedArgs.type);
    if (!typeExists) {
      throw new McpError(ErrorCode.InvalidRequest, `Unknown type: ${validatedArgs.type}`);
    }

    if (await this.isTypeOfBase(validatedArgs.type, 'tasks')) {
      // Use unified task interface
      item = await this.db.getTask(validatedArgs.type, validatedArgs.id);
    } else {
      // Handle all other types as documents
      item = await this.db.getDocument(validatedArgs.type as any, validatedArgs.id);
    }

    // @ai-logic: Explicit null check for clear error messages
    if (!item) {
      throw new McpError(ErrorCode.InvalidRequest, `${validatedArgs.type} ID ${validatedArgs.id} not found`);
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ data: item }, null, 2)
        }
      ]
    };
  }

  /**
   * @ai-intent Create new item with type-specific validation
   * @ai-flow 1. Validate schema -> 2. Apply type rules -> 3. Create -> 4. Return with ID
   * @ai-side-effects Creates markdown file, updates SQLite, may create tags
   * @ai-critical ID generation must be atomic across concurrent requests
   * @ai-assumption Tag creation is idempotent and won't fail on duplicates
   */
  async handleCreateItem(args: unknown): Promise<ToolResponse> {
    const validatedArgs = CreateItemSchema.parse(args) as CreateItemArgs;
    let item: Issue | Plan | Document;

    // @ai-logic: Type-based creation using type registry
    const typeExists = await this.isValidType(validatedArgs.type);
    if (!typeExists) {
      throw new McpError(ErrorCode.InvalidRequest, `Unknown type: ${validatedArgs.type}`);
    }

    if (!validatedArgs.content) {
      throw new McpError(ErrorCode.InvalidRequest, `Content is required for ${validatedArgs.type}`);
    }

    if (await this.isTypeOfBase(validatedArgs.type, 'tasks')) {
      // Use unified task interface
      item = await this.db.createTask(
        validatedArgs.type,
        validatedArgs.title,
        validatedArgs.content,
        validatedArgs.priority,
        validatedArgs.status,
        validatedArgs.tags,
        validatedArgs.description,
        validatedArgs.start_date,
        validatedArgs.end_date,
        validatedArgs.related_tasks,
        validatedArgs.related_documents
      );
    } else {
      // Handle all other types as documents
      item = await this.db.createDocument(
        validatedArgs.type,
        validatedArgs.title,
        validatedArgs.content,
        validatedArgs.tags,
        validatedArgs.description,
        validatedArgs.related_tasks,
        validatedArgs.related_documents
      );
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: `${validatedArgs.type} created: ${JSON.stringify(item, null, 2)}`
        }
      ]
    };
  }

  async handleUpdateItem(args: unknown): Promise<ToolResponse> {
    const validatedArgs = UpdateItemSchema.parse(args) as UpdateItemArgs;
    let success: boolean = false;
    let updatedItem: Issue | Plan | Document | null | undefined;

    // @ai-logic: Type-based update using type registry
    const typeExists = await this.isValidType(validatedArgs.type);
    if (!typeExists) {
      throw new McpError(ErrorCode.InvalidRequest, `Unknown type: ${validatedArgs.type}`);
    }

    if (await this.isTypeOfBase(validatedArgs.type, 'tasks')) {
      // @ai-logic: Use unified task interface
      updatedItem = await this.db.updateTask(
        validatedArgs.type,
        validatedArgs.id,
        validatedArgs.title,
        validatedArgs.content,
        validatedArgs.priority,
        validatedArgs.status,
        validatedArgs.tags,
        validatedArgs.description,
        validatedArgs.start_date,
        validatedArgs.end_date,
        validatedArgs.related_tasks,
        validatedArgs.related_documents
      );
      success = updatedItem !== null;
    } else {
      // Handle all other types as documents
      success = await this.db.updateDocument(
        validatedArgs.type as any,
        validatedArgs.id,
        validatedArgs.title,
        validatedArgs.content,
        validatedArgs.tags,
        validatedArgs.description,
        validatedArgs.related_tasks,
        validatedArgs.related_documents
      );
      if (success) {
        updatedItem = await this.db.getDocument(validatedArgs.type as any, validatedArgs.id);
      }
    }

    if (!success) {
      throw new McpError(ErrorCode.InvalidRequest, `${validatedArgs.type} ID ${validatedArgs.id} not found`);
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: `${validatedArgs.type} updated: ${JSON.stringify(updatedItem, null, 2)}`
        }
      ]
    };
  }

  async handleDeleteItem(args: unknown): Promise<ToolResponse> {
    const validatedArgs = DeleteItemSchema.parse(args) as DeleteItemArgs;
    let success: boolean;

    // @ai-logic: Type-based deletion using type registry
    const typeExists = await this.isValidType(validatedArgs.type);
    if (!typeExists) {
      throw new McpError(ErrorCode.InvalidRequest, `Unknown type: ${validatedArgs.type}`);
    }

    if (await this.isTypeOfBase(validatedArgs.type, 'tasks')) {
      // @ai-logic: Use unified task interface
      success = await this.db.deleteTask(validatedArgs.type, validatedArgs.id);
    } else {
      // Handle all other types as documents
      success = await this.db.deleteDocument(validatedArgs.type as any, validatedArgs.id);
    }

    if (!success) {
      throw new McpError(ErrorCode.InvalidRequest, `${validatedArgs.type} ID ${validatedArgs.id} not found`);
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: `${validatedArgs.type} ID ${validatedArgs.id} deleted`
        }
      ]
    };
  }

  async handleSearchItemsByTag(args: unknown): Promise<ToolResponse> {
    const validatedArgs = SearchItemsByTagSchema.parse(args) as SearchItemsByTagArgs;
    const results: {
      tasks?: Record<string, (Issue | Plan)[]>;
      documents?: Record<string, Document[]>;
    } = {};

    // Support searching multiple types
    const db = this.db.getDatabase();
    const types = validatedArgs.types ||
      (await db.allAsync(
        'SELECT type FROM sequences',
        []
      )).map((row: any) => row.type);

    for (const type of types) {
      // Validate type exists
      const typeExists = await this.isValidType(type);
      if (!typeExists) {
        continue; // Skip invalid types
      }

      if (await this.isTypeOfBase(type, 'tasks')) {
        // @ai-logic: Use unified task search
        const tasks = await this.db.searchTasksByTag(type, validatedArgs.tag);
        // Add all tasks to a generic results object
        if (!results.tasks) {
          results.tasks = {};
        }
        results.tasks[type] = tasks;
      } else {
        // Handle document types
        const documents = await this.db.searchDocumentsByTag(validatedArgs.tag, type);
        // Add all documents to a generic results object
        if (!results.documents) {
          results.documents = {};
        }
        results.documents[type] = documents;
      }
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ data: results }, null, 2)
        }
      ]
    };
  }
}