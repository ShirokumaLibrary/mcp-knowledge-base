/**
 * @ai-context Item repository using unified storage
 * @ai-pattern Adapter pattern wrapping UnifiedStorage
 * @ai-critical Maintains existing API while using new storage layer
 */

import type { Database } from '../database/base.js';
import type { StatusRepository } from '../database/status-repository.js';
import type { TagRepository } from '../database/tag-repository.js';
import type { FileIssueDatabase } from '../database/index.js';
import { TypeRepository } from '../database/type-repository.js';
import { createLogger } from '../utils/logger.js';
import { cleanString } from '../utils/string-utils.js';
import type {
  UnifiedItem,
  CreateItemParams,
  UpdateItemParams,
  ItemRow,
  ListItem
} from '../types/unified-types.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { UnifiedStorage, STORAGE_CONFIGS, type StorageItem, type StorageConfig } from '../storage/unified-storage.js';

export class ItemRepository {
  private storage: UnifiedStorage;
  private logger = createLogger('ItemRepository');

  constructor(
    private db: Database,
    dataDir: string,
    private statusRepo: StatusRepository,
    private tagRepo: TagRepository,
    private fileDb: FileIssueDatabase
  ) {
    this.storage = new UnifiedStorage(dataDir);
  }

  /**
   * @ai-intent Get storage config for a type
   */
  private getStorageConfig(type: string): StorageConfig {
    // Check if it's a predefined type
    if (type in STORAGE_CONFIGS) {
      return (STORAGE_CONFIGS as any)[type];
    }

    // For additional types, create config on the fly
    return {
      baseDir: type,
      filePrefix: `${type}-`,
      useDateSubdir: false
    };
  }

  /**
   * @ai-intent Convert UnifiedItem to StorageItem with complete field set
   */
  private async itemToStorageItem(item: UnifiedItem): Promise<StorageItem> {
    // Get field definitions for this type
    const typeRepo = new TypeRepository(this.fileDb);
    await typeRepo.init();
    const fieldDefs = await typeRepo.getFieldsForType(item.type);

    // Create metadata with all defined fields
    // Define proper metadata value types
    type MetadataValue = string | number | boolean | null | string[];
    const metadata: Record<string, MetadataValue> = {};

    // @ai-critical: Add base field for ALL types uniformly (except special ID types)
    // @ai-why: No special treatment for initial types - all types are equal
    // @ai-note: Only sessions/dailies excluded due to their special ID format
    if (item.type !== 'sessions' && item.type !== 'dailies') {
      // Get base_type from sequences table
      const typeInfo = await this.db.getAsync(
        'SELECT base_type FROM sequences WHERE type = ?',
        [item.type]
      ) as { base_type: string } | undefined;

      if (typeInfo?.base_type) {
        metadata.base = typeInfo.base_type;
      }
    }

    for (const fieldDef of fieldDefs) {
      const fieldName = fieldDef.field_name;
      let value: MetadataValue;

      // Map UnifiedItem properties to field names
      switch (fieldName) {
        case 'id':
          value = parseInt(item.id) || item.id;
          break;
        case 'title':
          value = item.title;
          break;
        case 'description':
          value = item.description || fieldDef.default_value;
          break;
        case 'content':
          // Content is stored separately, not in metadata
          continue;
        case 'priority':
          value = item.priority || fieldDef.default_value;
          break;
        case 'status':
          value = item.status || fieldDef.default_value;
          break;
        case 'status_id':
          value = item.status_id;
          break;
        case 'tags':
          value = item.tags || JSON.parse(fieldDef.default_value || '[]');
          break;
        case 'start_date':
          value = item.start_date || fieldDef.default_value;
          break;
        case 'end_date':
          value = item.end_date || fieldDef.default_value;
          break;
        case 'start_time':
          value = item.start_time || fieldDef.default_value;
          break;
        case 'related':
          value = item.related || JSON.parse(fieldDef.default_value || '[]');
          break;
        case 'related_tasks':
          value = item.related_tasks || JSON.parse(fieldDef.default_value || '[]');
          break;
        case 'related_documents':
          value = item.related_documents || JSON.parse(fieldDef.default_value || '[]');
          break;
        case 'created_at':
          value = item.created_at;
          break;
        case 'updated_at':
          value = item.updated_at;
          break;
        default:
          // Use default value for unknown fields
          value = fieldDef.default_value;
      }

      // Set the value in metadata
      metadata[fieldName] = value;
    }

    return {
      id: item.id,
      metadata,
      content: item.content
    };
  }

  /**
   * @ai-intent Convert StorageItem to UnifiedItem
   */
  private async storageItemToUnifiedItem(
    item: StorageItem,
    type: string,
    statusName?: string
  ): Promise<UnifiedItem> {
    // Type assertion for metadata fields
    interface ItemMetadata {
      title?: unknown;
      description?: unknown;
      priority?: unknown;
      status?: unknown;
      status_id?: unknown;
      start_date?: unknown;
      end_date?: unknown;
      start_time?: unknown;
      tags?: unknown;
      related?: unknown;
      related_tasks?: unknown;
      related_documents?: unknown;
      created_at?: unknown;
      updated_at?: unknown;
    }
    const metadata = item.metadata as ItemMetadata;
    const related = (Array.isArray(metadata.related) ? metadata.related : []) as string[];

    // Use specific related fields if available, otherwise derive from related
    const related_tasks = (Array.isArray(metadata.related_tasks) ? metadata.related_tasks : related.filter((r: string) => r.match(/^(issues|plans)-/))) as string[];
    const related_documents = (Array.isArray(metadata.related_documents) ? metadata.related_documents : related.filter((r: string) => r.match(/^(docs|knowledge)-/))) as string[];

    // Get status info
    const statuses = await this.statusRepo.getAllStatuses();
    let statusId = Number(metadata.status_id || 1);

    if (!statusName) {
      if (metadata.status_id) {
        // Get status name from ID
        const status = statuses.find(s => s.id === Number(metadata.status_id));
        statusName = status?.name || 'Open';
      } else if (metadata.status) {
        // Get status ID from name
        const status = statuses.find(s => s.name === String(metadata.status));
        if (status) {
          statusName = status.name;
          statusId = status.id;
        } else {
          statusName = String(metadata.status);
        }
      } else {
        statusName = 'Open';
      }
    }

    const unifiedItem: UnifiedItem = {
      id: item.id,
      type,
      title: String(metadata.title || ''),
      description: metadata.description ? String(metadata.description) : undefined,
      content: item.content,
      priority: (metadata.priority === 'high' || metadata.priority === 'medium' || metadata.priority === 'low' ? metadata.priority : 'medium') as 'high' | 'medium' | 'low',
      status: statusName,
      status_id: Number(statusId),
      start_date: metadata.start_date ? String(metadata.start_date) : null,
      end_date: metadata.end_date ? String(metadata.end_date) : null,
      start_time: metadata.start_time ? String(metadata.start_time) : null,
      tags: Array.isArray(metadata.tags) ? metadata.tags.map(t => String(t)) : [],
      related,
      related_tasks,
      related_documents,
      created_at: String(metadata.created_at || new Date().toISOString()),
      updated_at: String(metadata.updated_at || metadata.created_at || new Date().toISOString())
    };

    // Add date field for sessions and dailies
    if (type === 'sessions' || type === 'dailies') {
      (unifiedItem as any).date = metadata.start_date || null;
    }

    return unifiedItem;
  }

  /**
   * @ai-intent Get next sequential ID for a type
   */
  private async getNextId(type: string): Promise<number> {
    await this.db.runAsync(
      'UPDATE sequences SET current_value = current_value + 1 WHERE type = ?',
      [type]
    );

    const row = await this.db.getAsync(
      'SELECT current_value FROM sequences WHERE type = ?',
      [type]
    ) as { current_value: number };

    return row.current_value;
  }

  /**
   * @ai-intent Create a new item
   */
  async createItem(params: CreateItemParams): Promise<UnifiedItem> {
    const { type } = params;

    // Validate type exists
    let typeInfo: { base_type: string } | undefined;

    // Handle special types (sessions and dailies)
    if (type === 'sessions') {
      typeInfo = { base_type: 'sessions' };
    } else if (type === 'dailies') {
      typeInfo = { base_type: 'documents' };
    } else {
      typeInfo = await this.db.getAsync(
        'SELECT base_type FROM sequences WHERE type = ?',
        [type]
      ) as { base_type: string } | undefined;
    }

    if (!typeInfo) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Unknown type: ${type}`
      );
    }

    // Validate required fields
    if (typeInfo.base_type === 'tasks' && !params.content) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Content is required for ${type}`
      );
    }

    // Clean and validate title
    const cleanedTitle = cleanString(params.title);
    if (cleanedTitle.length === 0) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'Title cannot be empty'
      );
    }
    if (cleanedTitle.length > 500) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'Title must be 500 characters or less'
      );
    }

    // Validate date formats and validity
    const validateDate = (dateStr: string | undefined, fieldName: string) => {
      if (!dateStr) {
        return;
      }

      // Check format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Invalid ${fieldName} format. Date must be in YYYY-MM-DD format`
        );
      }

      // Check if date is valid
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);

      if (date.getFullYear() !== year ||
          date.getMonth() !== month - 1 ||
          date.getDate() !== day) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Invalid date: ${dateStr}`
        );
      }
    };

    validateDate(params.start_date || undefined, 'start_date');
    validateDate(params.end_date || undefined, 'end_date');

    // Get ID based on type
    let id: string;
    let createdAt: string;
    let startDate: string | null = null;
    const now = new Date();
    const nowISOString = now.toISOString();

    if (type === 'sessions') {
      // Handle custom datetime for past data migration
      if (params.datetime) {
        const sessionDate = new Date(params.datetime);
        if (isNaN(sessionDate.getTime())) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            'Invalid datetime format'
          );
        }
        createdAt = sessionDate.toISOString();
        // Don't set startDate from UTC - will be set from ID or dateObj later
      } else {
        createdAt = nowISOString;
        // Don't set startDate here - will be set after ID generation
      }

      // Use custom ID or generate from datetime
      if (params.id) {
        id = params.id;
        // Extract date from custom ID if it follows the expected format
        const idMatch = id.match(/^(\d{4}-\d{2}-\d{2})/);
        if (idMatch) {
          startDate = idMatch[1];
        } else {
          // Fallback to current date for non-standard IDs
          startDate = now.toISOString().split('T')[0];
        }
      } else {
        // Generate date-based ID for sessions: YYYY-MM-DD-HH.MM.SS.sss
        const dateObj = params.datetime ? new Date(params.datetime) : now;
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const hours = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        const seconds = String(dateObj.getSeconds()).padStart(2, '0');
        const milliseconds = String(dateObj.getMilliseconds()).padStart(3, '0');
        id = `${year}-${month}-${day}-${hours}.${minutes}.${seconds}.${milliseconds}`;
        // Set startDate from the generated ID components (local date)
        startDate = `${year}-${month}-${day}`;
      }
    } else if (type === 'dailies') {
      // Use provided date or today for dailies
      if (params.date) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(params.date)) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            'Invalid date format. Date must be in YYYY-MM-DD format'
          );
        }

        // Validate date is valid
        const [year, month, day] = params.date.split('-').map(Number);
        const date = new Date(year, month - 1, day);

        if (date.getFullYear() !== year ||
            date.getMonth() !== month - 1 ||
            date.getDate() !== day) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            `Invalid date: ${params.date}`
          );
        }

        id = params.date;
        startDate = params.date;
        createdAt = params.date + 'T00:00:00.000Z';
      } else {
        id = nowISOString.split('T')[0];
        startDate = id;
        createdAt = nowISOString;
      }
      // Check if daily already exists
      const config = this.getStorageConfig(type);
      const exists = await this.storage.exists(config, id);
      if (exists) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Daily summary for ${id} already exists. Use update instead.`
        );
      }
    } else {
      // Use sequential ID for other types
      const numId = await this.getNextId(type);
      id = String(numId);
      createdAt = nowISOString;
    }

    // Get or validate status
    const statusName = params.status || 'Open';
    const statuses = await this.statusRepo.getAllStatuses();
    const status = statuses.find(s => s.name === statusName);
    if (!status) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Invalid status: ${statusName}`
      );
    }

    // Validate related fields don't contain empty strings
    const validateRelatedArray = (arr: string[] | undefined, fieldName: string) => {
      if (arr && arr.some(item => item === '')) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Related items cannot contain empty strings in ${fieldName}. Use format like ["issues-1", "plans-2"] with valid type-id references.`
        );
      }
    };

    validateRelatedArray(params.related_tasks, 'related_tasks');
    validateRelatedArray(params.related_documents, 'related_documents');
    validateRelatedArray(params.related, 'related');

    // Remove duplicates from related arrays
    const uniqueRelatedTasks = params.related_tasks ? [...new Set(params.related_tasks)] : [];
    const uniqueRelatedDocuments = params.related_documents ? [...new Set(params.related_documents)] : [];
    const uniqueRelated = [...new Set([...uniqueRelatedTasks, ...uniqueRelatedDocuments])];

    // Validate and clean tags - filter out empty or whitespace-only tags
    const cleanedTags = (params.tags || [])
      .map(tag => cleanString(tag))
      .filter(tag => tag.length > 0);

    // Create unified item
    const item: UnifiedItem = {
      id: id,
      type,
      title: cleanedTitle,
      description: params.description,
      content: params.content || '',
      priority: params.priority || 'medium',
      status: statusName,
      status_id: status.id,
      start_date: type === 'dailies' ? id : (startDate || params.start_date || null),
      end_date: params.end_date || null,
      start_time: null,
      tags: cleanedTags,
      related: uniqueRelated,
      related_tasks: uniqueRelatedTasks,
      related_documents: uniqueRelatedDocuments,
      created_at: createdAt,
      updated_at: createdAt
    };

    // Add date field for sessions and dailies
    if (type === 'sessions' || type === 'dailies') {
      (item as any).date = item.start_date;
    }

    // Save to storage
    const config = this.getStorageConfig(type);
    const storageItem = await this.itemToStorageItem(item);
    await this.storage.save(config, storageItem);

    // Sync to SQLite
    await this.syncItemToSQLite(item);

    // Register tags
    if (item.tags.length > 0) {
      await this.tagRepo.ensureTagsExist(item.tags);
    }

    this.logger.info(`Created ${type} ${id}`);
    return item;
  }

  /**
   * @ai-intent Get item by type and ID
   * @ai-why Read from Markdown for single items (source of truth)
   * @ai-performance Direct file read is fast for individual items
   * @ai-contrast getItems() uses SQLite for efficiency with multiple items
   */
  async getItem(type: string, id: string): Promise<UnifiedItem | null> {
    // Validate type exists
    let typeInfo: { base_type: string } | undefined;

    // Handle special types (sessions and dailies)
    if (type === 'sessions') {
      typeInfo = { base_type: 'sessions' };
    } else if (type === 'dailies') {
      typeInfo = { base_type: 'documents' };
    } else {
      typeInfo = await this.db.getAsync(
        'SELECT base_type FROM sequences WHERE type = ?',
        [type]
      ) as { base_type: string } | undefined;
    }

    if (!typeInfo) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Unknown type: ${type}`
      );
    }

    // @ai-data-source Read from Markdown file (not SQLite)
    // @ai-why Markdown is source of truth, SQLite is just an index
    const config = this.getStorageConfig(type);
    const storageItem = await this.storage.load(config, id);

    if (!storageItem) {
      return null;
    }

    // Get status info
    const statuses = await this.statusRepo.getAllStatuses();
    const status = statuses.find(s => s.id === storageItem.metadata.status_id);

    return await this.storageItemToUnifiedItem(storageItem, type, status?.name);
  }

  /**
   * @ai-intent Update an existing item
   */
  async updateItem(params: UpdateItemParams): Promise<UnifiedItem | null> {
    const { type, id } = params;

    const current = await this.getItem(type, id);
    if (!current) {
      return null;
    }

    // Validate title length
    let cleanedTitle: string | undefined;
    if (params.title !== undefined) {
      cleanedTitle = cleanString(params.title);
      if (cleanedTitle.length > 500) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          'Title must be 500 characters or less'
        );
      }
    }

    // Validate date formats and validity
    const validateDate = (dateStr: string | undefined, fieldName: string) => {
      if (!dateStr) {
        return;
      }

      // Check format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Invalid ${fieldName} format. Date must be in YYYY-MM-DD format`
        );
      }

      // Check if date is valid
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);

      if (date.getFullYear() !== year ||
          date.getMonth() !== month - 1 ||
          date.getDate() !== day) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Invalid date: ${dateStr}`
        );
      }
    };

    validateDate(params.start_date || undefined, 'start_date');
    validateDate(params.end_date || undefined, 'end_date');

    // Validate related fields don't contain empty strings
    const validateRelatedArray = (arr: string[] | undefined, fieldName: string) => {
      if (arr && arr.some(item => item === '')) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Related items cannot contain empty strings in ${fieldName}. Use format like ["issues-1", "plans-2"] with valid type-id references.`
        );
      }
    };

    validateRelatedArray(params.related_tasks, 'related_tasks');
    validateRelatedArray(params.related_documents, 'related_documents');
    validateRelatedArray(params.related, 'related');

    // Check for self-reference
    const currentItemRef = `${type}-${id}`;
    const allRelated = [
      ...(params.related_tasks || []),
      ...(params.related_documents || []),
      ...(params.related || [])
    ];

    if (allRelated.includes(currentItemRef)) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'Items cannot reference themselves'
      );
    }

    // Remove duplicates from related arrays
    const uniqueRelatedTasks = params.related_tasks !== undefined
      ? [...new Set(params.related_tasks)]
      : current.related_tasks;
    const uniqueRelatedDocuments = params.related_documents !== undefined
      ? [...new Set(params.related_documents)]
      : current.related_documents;

    // Validate and clean tags if provided
    const cleanedTags = params.tags !== undefined
      ? params.tags.map(tag => cleanString(tag)).filter(tag => tag.length > 0)
      : current.tags;

    // Apply updates
    const updated: UnifiedItem = {
      ...current,
      title: cleanedTitle !== undefined ? cleanedTitle : current.title,
      description: params.description !== undefined ? params.description : current.description,
      content: params.content !== undefined ? params.content : current.content,
      priority: params.priority !== undefined ? params.priority : current.priority,
      start_date: params.start_date !== undefined ? params.start_date : current.start_date,
      end_date: params.end_date !== undefined ? params.end_date : current.end_date,
      tags: cleanedTags,
      related_tasks: uniqueRelatedTasks,
      related_documents: uniqueRelatedDocuments,
      updated_at: new Date().toISOString()
    };

    // Update status if provided
    if (params.status !== undefined) {
      const statuses = await this.statusRepo.getAllStatuses();
      const status = statuses.find(s => s.name === params.status);
      if (!status) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Invalid status: ${params.status}`
        );
      }
      updated.status = params.status;
      updated.status_id = status.id;
    }

    // Update related field
    updated.related = [
      ...(updated.related_tasks || []),
      ...(updated.related_documents || [])
    ];

    // Save to storage
    const config = this.getStorageConfig(type);
    const storageItem = await this.itemToStorageItem(updated);
    await this.storage.save(config, storageItem);

    // Sync to SQLite
    await this.syncItemToSQLite(updated);

    // Register new tags
    if (updated.tags.length > 0) {
      await this.tagRepo.ensureTagsExist(updated.tags);
    }

    this.logger.info(`Updated ${type} ${id}`);
    return updated;
  }

  /**
   * @ai-intent Delete an item
   */
  async deleteItem(type: string, id: string): Promise<boolean> {
    const config = this.getStorageConfig(type);
    const deleted = await this.storage.delete(config, id);

    if (deleted) {
      // Get rowid before deletion
      const row = await this.db.getAsync(
        'SELECT rowid FROM items WHERE type = ? AND id = ?',
        [type, id]
      ) as { rowid: number } | undefined;

      // Remove from SQLite
      await this.db.runAsync(
        'DELETE FROM items WHERE type = ? AND id = ?',
        [type, id]
      );

      // Remove from FTS if rowid exists
      if (row) {
        await this.db.runAsync(
          'DELETE FROM items_fts WHERE rowid = ?',
          [row.rowid]
        );
      }

      this.logger.info(`Deleted ${type} ${id}`);
    }

    return deleted;
  }

  /**
   * @ai-intent Get items by type with optional filters
   * @ai-why Use SQLite for list operations (filtering, sorting, status joins)
   * @ai-performance JSON columns prevent N+1 queries for tags/related items
   * @ai-trade-off Individual items read from Markdown, lists from SQLite
   */
  async getItems(
    type: string,
    includeClosedStatuses?: boolean,
    statuses?: string[],
    startDate?: string,
    endDate?: string,
    limit?: number
  ): Promise<ListItem[]> {
    // Validate type exists
    let typeInfo: { base_type: string } | undefined;

    // Handle special types (sessions and dailies)
    if (type === 'sessions') {
      typeInfo = { base_type: 'sessions' };
    } else if (type === 'dailies') {
      typeInfo = { base_type: 'documents' };
    } else {
      typeInfo = await this.db.getAsync(
        'SELECT base_type FROM sequences WHERE type = ?',
        [type]
      ) as { base_type: string } | undefined;
    }

    if (!typeInfo) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Unknown type: ${type}`
      );
    }

    // @ai-architecture-decision Use SQLite for list operations
    // @ai-why 1. Status filtering requires JOIN
    // @ai-why 2. Tags/related as JSON = single query (avoids N+1)
    // @ai-why 3. Sorting/pagination easier in SQL
    // @ai-alternative Could read all Markdown files but slow for large datasets
    // @ai-optimization Return only essential fields for list views
    let query = `
      SELECT i.type, i.id, i.title, i.description, i.priority, 
             i.tags, i.updated_at, s.name as status_name,
             i.start_date
      FROM items i
      LEFT JOIN statuses s ON i.status_id = s.id
      WHERE i.type = ?
    `;
    const params: (string | number)[] = [type];

    if (!includeClosedStatuses) {
      query += ' AND s.is_closed = 0';
    }

    if (statuses !== undefined) {
      if (statuses.length === 0) {
        // Empty array means no statuses match, return empty result
        return [];
      }
      query += ` AND s.name IN (${statuses.map(() => '?').join(',')})`;
      params.push(...statuses);
    }

    // Date range filtering
    if (startDate || endDate) {
      // Use start_date for sessions/dailies, updated_at for others
      const dateField = (type === 'sessions' || type === 'dailies') ? 'i.start_date' : 'i.updated_at';
      const isDateOnly = (type === 'sessions' || type === 'dailies');

      if (startDate) {
        query += ` AND ${dateField} >= ?`;
        params.push(isDateOnly ? startDate : startDate + 'T00:00:00.000Z');
      }

      if (endDate) {
        // For end date, include the entire day
        query += ` AND ${dateField} <= ?`;
        params.push(isDateOnly ? endDate : endDate + 'T23:59:59.999Z');
      }

    }

    query += ' ORDER BY i.created_at DESC';

    // Apply limit if specified
    // @ai-validation: Only apply positive limits, ignore zero or negative values
    // @ai-logic: No limit means return all results (same as limit <= 0)
    if (limit && limit > 0) {
      // @ai-security: Cap at reasonable maximum to prevent DoS
      const maxLimit = 10000;
      const safeLimit = Math.min(limit, maxLimit);
      query += ` LIMIT ${safeLimit}`;
    }

    const rows = await this.db.allAsync(query, params) as unknown as ItemRow[];
    return rows.map(row => this.rowToListItem(row));
  }

  /**
   * @ai-intent Search items by tag
   */
  async searchItemsByTag(tag: string, types?: string[]): Promise<ListItem[]> {
    // @ai-optimization Return only essential fields for list views
    let query = `
      SELECT DISTINCT i.type, i.id, i.title, i.description, i.priority, 
             i.tags, i.updated_at, s.name as status_name,
             i.start_date
      FROM items i
      JOIN item_tags it ON i.type = it.item_type AND i.id = it.item_id
      JOIN tags t ON it.tag_id = t.id
      LEFT JOIN statuses s ON i.status_id = s.id
      WHERE t.name = ?
    `;
    const params: (string | number)[] = [tag];

    if (types && types.length > 0) {
      query += ` AND i.type IN (${types.map(() => '?').join(',')})`;
      params.push(...types);
    }

    query += ' ORDER BY i.created_at DESC';

    const rows = await this.db.allAsync(query, params) as unknown as ItemRow[];
    return rows.map(row => this.rowToListItem(row));
  }

  /**
   * @ai-intent Sync item to SQLite (public for rebuild)
   */
  public async syncItemToSQLite(item: UnifiedItem): Promise<void> {
    const params = [
      item.type,
      item.id,
      item.title,
      item.description || null,
      item.content,
      item.priority,
      item.status_id,
      item.start_date,
      item.end_date,
      item.start_time,
      item.version || null,
      JSON.stringify(item.tags),
      JSON.stringify(item.related),
      item.created_at,
      item.updated_at
    ];

    await this.db.runAsync(`
      INSERT OR REPLACE INTO items 
      (type, id, title, description, content, priority, status_id, 
       start_date, end_date, start_time, version, tags, related, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, params);

    // Update FTS
    await this.db.runAsync(`
      INSERT OR REPLACE INTO items_fts 
      (rowid, type, title, description, content, tags)
      VALUES (
        (SELECT rowid FROM items WHERE type = ? AND id = ?),
        ?, ?, ?, ?, ?
      )
    `, [
      item.type, item.id,
      item.type, item.title, item.description || '', item.content, JSON.stringify(item.tags)
    ]);

    // Update tag associations
    await this.db.runAsync(
      'DELETE FROM item_tags WHERE item_type = ? AND item_id = ?',
      [item.type, item.id]
    );

    if (item.tags.length > 0) {
      const tagIds = await Promise.all(
        item.tags.map(tag => this.tagRepo.getOrCreateTagId(tag))
      );

      for (const tagId of tagIds) {
        await this.db.runAsync(
          'INSERT INTO item_tags (item_type, item_id, tag_id) VALUES (?, ?, ?)',
          [item.type, item.id, tagId]
        );
      }
    }

    // Update related items
    await this.db.runAsync(
      'DELETE FROM related_items WHERE (source_type = ? AND source_id = ?) OR (target_type = ? AND target_id = ?)',
      [item.type, item.id, item.type, item.id]
    );

    if (item.related.length > 0) {
      // Use Set to ensure uniqueness before inserting
      const uniqueRelated = [...new Set(item.related)];
      for (const relatedRef of uniqueRelated) {
        const [relatedType, relatedId] = relatedRef.split('-');
        try {
          await this.db.runAsync(
            'INSERT INTO related_items (source_type, source_id, target_type, target_id) VALUES (?, ?, ?, ?)',
            [item.type, item.id, relatedType, relatedId]
          );
        } catch (error) {
          if (error instanceof Error && error.message?.includes('UNIQUE constraint failed')) {
            // Skip duplicate - this is OK since we're ensuring uniqueness
            this.logger.debug(`Skipping duplicate related item: ${item.type}-${item.id} -> ${relatedRef}`);
          } else {
            throw error;
          }
        }
      }
    }
  }

  /**
   * @ai-intent Convert database row to ListItem (lightweight for list views)
   */
  private rowToListItem(row: Partial<ItemRow>): ListItem {
    const tags = row.tags ? JSON.parse(row.tags) : [];

    const item: ListItem = {
      id: row.id!,
      type: row.type!,
      title: row.title!,
      description: row.description || undefined,
      tags,
      updated_at: row.updated_at!
    };

    // Add optional fields
    if (row.status_name) {
      item.status = row.status_name;
    }

    if (row.priority) {
      item.priority = row.priority as 'high' | 'medium' | 'low';
    }

    // Add date field for sessions and dailies
    if ((row.type === 'sessions' || row.type === 'dailies') && row.start_date) {
      item.date = row.start_date;
    }

    return item;
  }

  /**
   * @ai-intent Convert database row to UnifiedItem (full data)
   */
  private rowToUnifiedItem(row: ItemRow): UnifiedItem {
    const tags = row.tags ? JSON.parse(row.tags) : [];
    const related = row.related ? JSON.parse(row.related) : [];

    const item: UnifiedItem = {
      id: row.id,
      type: row.type,
      title: row.title,
      description: row.description || undefined,
      // @ai-optimization content is excluded from list operations
      // Only include content if it's present in the row (for getItem operations)
      content: row.content !== undefined ? (row.content || '') : '',
      priority: row.priority as 'high' | 'medium' | 'low',
      status: row.status_name || 'Unknown',
      status_id: row.status_id || 1,
      start_date: row.start_date,
      end_date: row.end_date,
      start_time: row.start_time,
      tags,
      related,
      // related_tasks and related_documents are deprecated - use related instead
      created_at: row.created_at,
      updated_at: row.updated_at
    };

    // Add date field for sessions and dailies
    if (row.type === 'sessions' || row.type === 'dailies') {
      (item as any).date = row.start_date;
    }

    return item;
  }

  /**
   * @ai-intent Rebuild database from markdown files
   */
  public async rebuildFromMarkdown(type: string): Promise<number> {
    const config = this.getStorageConfig(type);
    let syncedCount = 0;

    // For types with date subdirectories
    if (config.useDateSubdir) {
      const dateDirs = await this.storage.listDateDirs(config);
      for (const dateDir of dateDirs) {
        const ids = await this.storage.list(config, dateDir);
        for (const id of ids) {
          const storageItem = await this.storage.load(config, id);
          if (storageItem && storageItem.metadata.title) {
            try {
              // Migration: Merge related_tasks and related_documents into related
              this.migrateRelatedFields(storageItem);

              const item = await this.storageItemToUnifiedItem(storageItem, type);
              await this.syncItemToSQLite(item);
              await this.tagRepo.ensureTagsExist(item.tags);
              syncedCount++;
            } catch (error) {
              this.logger.error(`Failed to sync ${type} ${id}:`, error);
            }
          } else if (storageItem) {
            this.logger.warn(`Skipping ${type} ${id}: missing title`);
          }
        }
      }
    } else {
      // For types without date subdirectories
      const ids = await this.storage.list(config);
      for (const id of ids) {
        const storageItem = await this.storage.load(config, id);
        if (storageItem && storageItem.metadata.title) {
          try {
            // Migration: Merge related_tasks and related_documents into related
            this.migrateRelatedFields(storageItem);

            const item = await this.storageItemToUnifiedItem(storageItem, type);
            await this.syncItemToSQLite(item);
            await this.tagRepo.ensureTagsExist(item.tags);
            syncedCount++;
          } catch (error) {
            this.logger.error(`Failed to sync ${type} ${id}:`, error);
          }
        } else if (storageItem) {
          this.logger.warn(`Skipping ${type} ${id}: missing title`);
        }
      }
    }

    return syncedCount;
  }

  /**
   * @ai-intent Migrate old related_tasks/related_documents to unified related field
   * @ai-pattern Data migration for backward compatibility
   */
  private migrateRelatedFields(storageItem: StorageItem): void {
    const metadata = storageItem.metadata as any;

    // Check if migration is needed
    if (!metadata.related && (metadata.related_tasks || metadata.related_documents)) {
      const related = new Set<string>();

      // Add related_tasks
      if (Array.isArray(metadata.related_tasks)) {
        metadata.related_tasks.forEach((item: string) => related.add(item));
      }

      // Add related_documents
      if (Array.isArray(metadata.related_documents)) {
        metadata.related_documents.forEach((item: string) => related.add(item));
      }

      // Set unified related field
      metadata.related = Array.from(related);

      // Remove old fields
      delete metadata.related_tasks;
      delete metadata.related_documents;

      this.logger.info(`Migrated related fields for ${storageItem.id}: ${metadata.related.length} items`);
    }
  }

  /**
   * @ai-intent Change item type within same base type
   * @ai-flow 1. Validate types -> 2. Create new item -> 3. Update relations -> 4. Delete old
   * @ai-critical Must maintain referential integrity
   */
  async changeItemType(
    fromType: string,
    fromId: number,
    toType: string
  ): Promise<{ success: boolean; newId?: number; error?: string; relatedUpdates?: number }> {
    // Import the actual implementation
    const { ItemRepository: DatabaseItemRepository } = await import('../database/item-repository.js');

    // Create instance with same dependencies
    const dbItemRepo = new DatabaseItemRepository(
      this.db,
      this.fileDb.dataDirectory,
      this.statusRepo,
      this.tagRepo
    );

    // Delegate to the actual implementation
    return dbItemRepo.changeItemType(fromType, fromId, toType);
  }
}