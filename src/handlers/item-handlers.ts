import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { FileIssueDatabase } from '../database.js';
import { ToolResponse } from '../types/mcp-types.js';
import { 
  GetItemsSchema,
  GetItemDetailSchema,
  CreateItemSchema,
  UpdateItemSchema,
  DeleteItemSchema,
  SearchItemsByTagSchema,
  GetItemsArgs,
  GetItemDetailArgs,
  CreateItemArgs,
  UpdateItemArgs,
  DeleteItemArgs,
  SearchItemsByTagArgs
} from '../schemas/item-schemas.js';
import { Handler } from '../types/handler-types.js';
import { Issue, Plan, Doc, Knowledge, IssueSummary, DocSummary } from '../types/domain-types.js';

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
    let data: IssueSummary[] | Plan[] | DocSummary[] | Knowledge[];

    // @ai-logic: Type-based strategy dispatch
    switch (validatedArgs.type) {
      case 'issue':
        data = await this.db.getAllIssuesSummary(
          validatedArgs.includeClosedStatuses,
          validatedArgs.statusIds
        );  // @ai-performance: Summary for large datasets
        break;
      case 'plan':
        data = await this.db.getAllPlans(
          validatedArgs.includeClosedStatuses,
          validatedArgs.statusIds
        );
        break;
      case 'doc':
        data = await this.db.getDocsSummary();  // @ai-performance: Summary excludes content
        break;
      case 'knowledge':
        data = await this.db.getAllKnowledge();
        break;
      default:
        // @ai-edge-case: TypeScript should prevent this, but runtime safety is critical
        throw new McpError(ErrorCode.InvalidRequest, `Unknown type: ${validatedArgs.type}`);
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ data }, null, 2),
        },
      ],
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
    let item: Issue | Plan | Doc | Knowledge | null;

    switch (validatedArgs.type) {
      case 'issue':
        item = await this.db.getIssue(validatedArgs.id);
        break;
      case 'plan':
        item = await this.db.getPlan(validatedArgs.id);
        break;
      case 'doc':
        item = await this.db.getDoc(validatedArgs.id);
        break;
      case 'knowledge':
        item = await this.db.getKnowledge(validatedArgs.id);
        break;
      default:
        throw new McpError(ErrorCode.InvalidRequest, `Unknown type: ${validatedArgs.type}`);
    }

    // @ai-logic: Explicit null check for clear error messages
    if (!item) {
      throw new McpError(ErrorCode.InvalidRequest, `${validatedArgs.type} ID ${validatedArgs.id} not found`);
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ data: item }, null, 2),
        },
      ],
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
    let item: Issue | Plan | Doc | Knowledge;

    // @ai-logic: Type-specific field requirements enforced here
    switch (validatedArgs.type) {
      case 'issue':
        if (!validatedArgs.content) {
          throw new McpError(ErrorCode.InvalidRequest, 'Content is required for issues');
        }
        item = await this.db.createIssue(
          validatedArgs.title,
          validatedArgs.content,
          validatedArgs.priority,
          validatedArgs.status_id,
          validatedArgs.tags
        );
        break;
      case 'plan':
        if (!validatedArgs.content) {
          throw new McpError(ErrorCode.InvalidRequest, 'Content is required for plans');
        }
        item = await this.db.createPlan(
          validatedArgs.title,
          validatedArgs.content,
          validatedArgs.priority,
          validatedArgs.status_id,
          validatedArgs.start_date,
          validatedArgs.end_date,
          validatedArgs.tags
        );
        break;
      case 'doc':
        if (!validatedArgs.content) {
          throw new McpError(ErrorCode.InvalidRequest, 'Content is required for documents');
        }
        item = await this.db.createDoc(
          validatedArgs.title,
          validatedArgs.content,
          validatedArgs.tags
        );
        break;
      case 'knowledge':
        if (!validatedArgs.content) {
          throw new McpError(ErrorCode.InvalidRequest, 'Content is required for knowledge');
        }
        item = await this.db.createKnowledge(
          validatedArgs.title,
          validatedArgs.content,
          validatedArgs.tags
        );
        break;
      default:
        throw new McpError(ErrorCode.InvalidRequest, `Unknown type: ${validatedArgs.type}`);
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: `${validatedArgs.type} created: ${JSON.stringify(item, null, 2)}`,
        },
      ],
    };
  }

  async handleUpdateItem(args: unknown): Promise<ToolResponse> {
    const validatedArgs = UpdateItemSchema.parse(args) as UpdateItemArgs;
    let success: boolean;
    let updatedItem: Issue | Plan | Doc | Knowledge | null | undefined;

    switch (validatedArgs.type) {
      case 'issue':
        success = await this.db.updateIssue(
          validatedArgs.id,
          validatedArgs.title,
          validatedArgs.content,
          validatedArgs.priority,
          validatedArgs.status_id,
          validatedArgs.tags
        );
        if (success) updatedItem = await this.db.getIssue(validatedArgs.id);
        break;
      case 'plan':
        success = await this.db.updatePlan(
          validatedArgs.id,
          validatedArgs.title,
          validatedArgs.content,
          validatedArgs.priority,
          validatedArgs.status_id,
          validatedArgs.start_date,
          validatedArgs.end_date,
          validatedArgs.tags
        );
        if (success) updatedItem = await this.db.getPlan(validatedArgs.id);
        break;
      case 'doc':
        updatedItem = await this.db.updateDoc(
          validatedArgs.id,
          validatedArgs.title,
          validatedArgs.content,
          validatedArgs.tags
        );
        success = updatedItem !== null;
        break;
      case 'knowledge':
        success = await this.db.updateKnowledge(
          validatedArgs.id,
          validatedArgs.title,
          validatedArgs.content,
          validatedArgs.tags
        );
        if (success) updatedItem = await this.db.getKnowledge(validatedArgs.id);
        break;
      default:
        throw new McpError(ErrorCode.InvalidRequest, `Unknown type: ${validatedArgs.type}`);
    }

    if (!success) {
      throw new McpError(ErrorCode.InvalidRequest, `${validatedArgs.type} ID ${validatedArgs.id} not found`);
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: `${validatedArgs.type} updated: ${JSON.stringify(updatedItem, null, 2)}`,
        },
      ],
    };
  }

  async handleDeleteItem(args: unknown): Promise<ToolResponse> {
    const validatedArgs = DeleteItemSchema.parse(args) as DeleteItemArgs;
    let success: boolean;

    switch (validatedArgs.type) {
      case 'issue':
        success = await this.db.deleteIssue(validatedArgs.id);
        break;
      case 'plan':
        success = await this.db.deletePlan(validatedArgs.id);
        break;
      case 'doc':
        success = await this.db.deleteDoc(validatedArgs.id);
        break;
      case 'knowledge':
        success = await this.db.deleteKnowledge(validatedArgs.id);
        break;
      default:
        throw new McpError(ErrorCode.InvalidRequest, `Unknown type: ${validatedArgs.type}`);
    }

    if (!success) {
      throw new McpError(ErrorCode.InvalidRequest, `${validatedArgs.type} ID ${validatedArgs.id} not found`);
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: `${validatedArgs.type} ID ${validatedArgs.id} deleted`,
        },
      ],
    };
  }

  async handleSearchItemsByTag(args: unknown): Promise<ToolResponse> {
    const validatedArgs = SearchItemsByTagSchema.parse(args) as SearchItemsByTagArgs;
    const results: {
      issues?: Issue[];
      plans?: Plan[];
      docs?: Doc[];
      knowledge?: Knowledge[];
    } = {};

    // Support searching multiple types
    const types = validatedArgs.types || ['issue', 'plan', 'doc', 'knowledge'];

    for (const type of types) {
      switch (type) {
        case 'issue':
          results.issues = await this.db.searchIssuesByTag(validatedArgs.tag);
          break;
        case 'plan':
          results.plans = await this.db.searchPlansByTag(validatedArgs.tag);
          break;
        case 'doc':
          results.docs = await this.db.searchDocsByTag(validatedArgs.tag);
          break;
        case 'knowledge':
          results.knowledge = await this.db.searchKnowledgeByTag(validatedArgs.tag);
          break;
      }
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ data: results }, null, 2),
        },
      ],
    };
  }
}