/**
 * @ai-context Unified repository for all item types in the consolidated database
 * @ai-pattern Repository pattern with single table inheritance
 * @ai-critical Replaces TaskRepository and DocumentRepository
 * @ai-dependencies BaseRepository for shared functionality, TypeRegistry for type management
 */

import { BaseRepository } from './base-repository.js';
import type { Database } from './base.js';
import type { DatabaseRow } from './types/database-types.js';
import {
  type UnifiedItem,
  // type ItemRow,
  type CreateItemParams,
  type UpdateItemParams,
  type SearchItemParams,
  type TaskItem,
  type DocumentItem,
  type SessionItem,
  type SummaryItem,
  // isTaskItem,
  // isDocumentItem,
  // isSessionItem,
  // isSummaryItem,
  RelatedItemsHelper
} from '../types/unified-types.js';
import { StatusRepository } from './status-repository.js';
import { TagRepository } from './tag-repository.js';
// TypeRegistry will be replaced with a simpler implementation for now
interface SimpleTypeDefinition {
  type: string;
  baseType: string;
}
import { parseMarkdown, generateMarkdown } from '../utils/markdown-parser.js';
import * as path from 'path';
import * as fs from 'fs/promises';
import { glob } from 'glob';

export class ItemRepository extends BaseRepository<UnifiedItem, string> {
  private statusRepository: StatusRepository;
  private tagRepository: TagRepository;
  private dataDir: string;
  private knownTypes: Map<string, SimpleTypeDefinition>;

  constructor(
    db: Database,
    dataDir: string,
    statusRepository?: StatusRepository,
    tagRepository?: TagRepository
  ) {
    super(db, 'ItemRepository', 'items');
    this.dataDir = dataDir;
    this.statusRepository = statusRepository || new StatusRepository(db);
    this.tagRepository = tagRepository || new TagRepository(db);

    // Initialize known types
    this.knownTypes = new Map([
      ['issues', { type: 'issues', baseType: 'tasks' }],
      ['plans', { type: 'plans', baseType: 'tasks' }],
      ['bugs', { type: 'bugs', baseType: 'tasks' }],
      ['docs', { type: 'docs', baseType: 'documents' }],
      ['knowledge', { type: 'knowledge', baseType: 'documents' }],
      ['recipe', { type: 'recipe', baseType: 'documents' }],
      ['tutorial', { type: 'tutorial', baseType: 'documents' }],
      ['sessions', { type: 'sessions', baseType: 'sessions' }],
      ['dailies', { type: 'dailies', baseType: 'dailies' }]
    ]);
  }

  private async getType(typeName: string): Promise<SimpleTypeDefinition | null> {
    // Check known types first
    if (this.knownTypes.has(typeName)) {
      return this.knownTypes.get(typeName)!;
    }

    // Check database for custom types
    const row = await this.db.getAsync(
      'SELECT type, base_type FROM sequences WHERE type = ?',
      [typeName]
    );

    if (row) {
      const typeDef = { type: String(row.type), baseType: String(row.base_type) };
      this.knownTypes.set(typeName, typeDef);
      return typeDef;
    }

    return null;
  }

  /**
   * @ai-intent Map database row to entity
   * @ai-pattern Required by BaseRepository
   */
  protected mapRowToEntity(row: DatabaseRow): UnifiedItem {
    const tags = row.tags ? JSON.parse(String(row.tags)) : [];
    const related = row.related ? JSON.parse(String(row.related)) : [];

    const item: UnifiedItem = {
      id: String(row.id),
      type: row.type,
      title: row.title,
      description: row.description || undefined,
      content: row.content || '',
      priority: row.priority || 'medium',
      status_id: row.status_id || 1,
      start_date: row.start_date,
      end_date: row.end_date,
      start_time: row.start_time,
      tags,
      related,
      created_at: row.created_at,
      updated_at: row.updated_at
    } as UnifiedItem;

    return item;
  }

  /**
   * @ai-intent Map entity to database row
   * @ai-pattern Required by BaseRepository
   */
  protected mapEntityToRow(entity: UnifiedItem): DatabaseRow {
    return {
      type: entity.type,
      id: entity.id,
      title: entity.title,
      description: entity.description || null,
      content: entity.content,
      priority: entity.priority,
      status_id: entity.status_id,
      start_date: entity.start_date,
      end_date: entity.end_date,
      start_time: entity.start_time,
      tags: JSON.stringify(entity.tags),
      related: JSON.stringify(entity.related),
      created_at: entity.created_at,
      updated_at: entity.updated_at
    };
  }

  /**
   * @ai-intent Create a new item of any type
   * @ai-flow 1. Validate type -> 2. Generate ID -> 3. Save to markdown -> 4. Sync to DB
   * @ai-critical Handles different ID generation strategies per type
   */
  async createItem(params: CreateItemParams): Promise<UnifiedItem> {
    const { type, ...data } = params;

    // Validate type exists
    const typeDef = await this.getType(type);
    if (!typeDef) {
      throw new Error(`Unknown type: '${type}'. Use the 'get_types' tool to see all available types and their descriptions.`);
    }

    // Generate ID based on type
    let id: string;
    if (type === 'sessions') {
      // Use custom ID if provided (already validated by Zod schema)
      id = data.id || this.generateSessionId();
    } else if (type === 'dailies') {
      id = data.start_date || new Date().toISOString().split('T')[0];
      // Check if summary already exists for this date
      const existing = await this.getById(type, id);
      if (existing) {
        throw new Error(`Daily summary already exists for date: ${id}. Use 'update_item' to modify the existing summary, or 'get_item_detail' with type='dailies' and id='${id}' to view it.`);
      }
    } else {
      const numId = await this.getNextId(type);
      id = numId.toString();
    }

    // Resolve status name to ID
    let statusId = 1; // Default to "Open"
    if (data.status) {
      const status = await this.statusRepository.getStatusByName(data.status);
      if (!status) {
        throw new Error(`Unknown status: '${data.status}'. Use the 'get_statuses' tool to see all available statuses.`);
      }
      statusId = status.id;
    }

    // Set default priority if not provided
    const priority = data.priority || 'medium';

    // Create the item object
    const now = new Date().toISOString();

    // For sessions and summaries, ensure start_date is set
    let startDate = data.start_date || null;
    let startTime = data.start_time || null;
    if (type === 'sessions') {
      startDate = id.split('-').slice(0, 3).join('-'); // Extract date from ID
      startTime = id.split('-').slice(3).join(':').replace(/\./g, ':'); // Extract time from ID
    } else if (type === 'dailies') {
      startDate = id; // ID is the date for summaries
    }

    const item: UnifiedItem = {
      id,
      type,
      title: data.title,
      description: data.description || undefined,
      content: data.content || '',
      priority,
      status_id: statusId,
      start_date: startDate,
      end_date: data.end_date || null,
      start_time: startTime,
      tags: data.tags || [],
      related: data.related || [],
      created_at: now,
      updated_at: now
    } as UnifiedItem;

    // Save to markdown
    await this.saveToMarkdown(item);

    // Sync to database
    await this.syncToDatabase(item);

    // Register tags
    if (item.tags.length > 0) {
      await this.tagRepository.registerTags(item.tags);
    }

    return item;
  }

  /**
   * @ai-intent Get item by type and ID
   * @ai-flow 1. Read markdown -> 2. Parse -> 3. Return item
   */
  async getById(type: string, id: string): Promise<UnifiedItem | null> {
    const filePath = this.getFilePath(type, id);

    try {
      const content = await fs.readFile(filePath, 'utf8');
      const { metadata, content: bodyContent } = parseMarkdown(content);

      if (!metadata.id) {
        return null;
      }

      // Parse tags and related as arrays
      const tags = Array.isArray(metadata.tags) ? metadata.tags : [];
      const related = Array.isArray(metadata.related) ? metadata.related :
        (Array.isArray(metadata.related_tasks) && Array.isArray(metadata.related_documents) ?
          [...metadata.related_tasks, ...metadata.related_documents] : []);

      // Get status ID from name if needed
      let statusId = metadata.status_id;
      if (!statusId && metadata.status) {
        const status = await this.statusRepository.getStatusByName(metadata.status);
        statusId = status?.id || 1;
      }

      // Create item with proper type handling
      let item: UnifiedItem;

      if (type === 'sessions' || type === 'dailies') {
        // Sessions and summaries must have start_date
        item = {
          id: String(metadata.id),
          type,
          title: metadata.title,
          description: metadata.description || undefined,
          content: bodyContent,
          priority: metadata.priority || 'medium',
          status_id: statusId || 1,
          start_date: metadata.start_date || metadata.date || new Date().toISOString().split('T')[0],
          end_date: null,
          start_time: type === 'sessions' ? (metadata.start_time || null) : null,
          tags,
          related,
          created_at: metadata.created_at || new Date().toISOString(),
          updated_at: metadata.updated_at || new Date().toISOString()
        } as SessionItem | SummaryItem;
      } else {
        // Other types can have null dates
        item = {
          id: String(metadata.id),
          type,
          title: metadata.title,
          description: metadata.description || undefined,
          content: bodyContent,
          priority: metadata.priority || 'medium',
          status_id: statusId || 1,
          start_date: metadata.start_date || metadata.date || null,
          end_date: metadata.end_date || null,
          start_time: null,
          tags,
          related,
          created_at: metadata.created_at || new Date().toISOString(),
          updated_at: metadata.updated_at || new Date().toISOString()
        } as TaskItem | DocumentItem;
      }

      return item;
    } catch {
      return null;
    }
  }

  /**
   * @ai-intent Update an existing item
   * @ai-flow 1. Get existing -> 2. Merge changes -> 3. Save -> 4. Sync
   */
  async update(type: string, id: string, params: UpdateItemParams): Promise<UnifiedItem | null> {
    const existing = await this.getById(type, id);
    if (!existing) {
      return null;
    }

    // Resolve status name to ID if provided
    let statusId = existing.status_id;
    if (params.status) {
      const status = await this.statusRepository.getStatusByName(params.status);
      if (!status) {
        throw new Error(`Unknown status: '${params.status}'. Use the 'get_statuses' tool to see all available statuses.`);
      }
      statusId = status.id;
    }

    // Merge changes - ensure proper type based on item type
    const updated = {
      ...existing,
      title: params.title ?? existing.title,
      description: params.description !== undefined ? params.description : existing.description,
      content: params.content ?? existing.content,
      priority: params.priority ?? existing.priority,
      status_id: statusId,
      start_date: params.start_date !== undefined ? params.start_date : existing.start_date,
      end_date: params.end_date !== undefined ? params.end_date : existing.end_date,
      start_time: params.start_time ?? existing.start_time,
      tags: params.tags ?? existing.tags,
      related: params.related ?? existing.related,
      updated_at: new Date().toISOString()
    } as UnifiedItem;

    // Save to markdown
    await this.saveToMarkdown(updated);

    // Sync to database
    await this.syncToDatabase(updated);

    // Update tags
    if (params.tags) {
      await this.tagRepository.registerTags(params.tags);
    }

    return updated;
  }

  /**
   * @ai-intent Delete an item
   * @ai-flow 1. Delete file -> 2. Remove from DB
   */
  async delete(type: string, id: string): Promise<boolean> {
    const filePath = this.getFilePath(type, id);

    try {
      await fs.unlink(filePath);

      // Remove from database
      await this.db.runAsync(
        'DELETE FROM items WHERE type = ? AND id = ?',
        [type, id]
      );

      // Clean up relationships
      await this.db.runAsync(
        'DELETE FROM related_items WHERE (source_type = ? AND source_id = ?) OR (target_type = ? AND target_id = ?)',
        [type, id, type, id]
      );

      // Clean up tags
      await this.db.runAsync(
        'DELETE FROM item_tags WHERE item_type = ? AND item_id = ?',
        [type, id]
      );

      return true;
    } catch {
      return false;
    }
  }

  /**
   * @ai-intent Search items based on criteria
   * @ai-flow 1. Build query -> 2. Execute -> 3. Load full items
   */
  async search(params: SearchItemParams): Promise<UnifiedItem[]> {
    let query = 'SELECT DISTINCT i.* FROM items i';
    const joins: string[] = [];
    const conditions: string[] = [];
    const values: (string | number | null)[] = [];

    // Type filtering
    if (params.type) {
      conditions.push('i.type = ?');
      values.push(params.type);
    } else if (params.types && params.types.length > 0) {
      conditions.push(`i.type IN (${params.types.map(() => '?').join(',')})`);
      values.push(...params.types);
    }

    // Text search
    if (params.query) {
      joins.push('JOIN items_fts ON items_fts.rowid = i.rowid');
      conditions.push('items_fts MATCH ?');
      values.push(params.query);
    }

    // Tag filtering
    if (params.tags && params.tags.length > 0) {
      for (let i = 0; i < params.tags.length; i++) {
        const tag = params.tags[i];
        const tagAlias = `t${i}`;
        const tagId = await this.tagRepository.getTagIdByName(tag);
        if (tagId) {
          joins.push(`JOIN item_tags ${tagAlias} ON ${tagAlias}.item_type = i.type AND ${tagAlias}.item_id = i.id`);
          conditions.push(`${tagAlias}.tag_id = ?`);
          values.push(tagId);
        }
      }
    }

    // Status filtering
    if (params.status) {
      const status = await this.statusRepository.getStatusByName(params.status);
      if (status) {
        conditions.push('i.status_id = ?');
        values.push(status.id);
      }
    } else if (!params.includeClosedStatuses) {
      // Exclude closed statuses by default
      const closedStatuses = await this.statusRepository.getClosedStatusIds();
      if (closedStatuses.length > 0) {
        conditions.push(`i.status_id NOT IN (${closedStatuses.map(() => '?').join(',')})`);
        values.push(...closedStatuses);
      }
    }

    // Priority filtering
    if (params.priority) {
      conditions.push('i.priority = ?');
      values.push(params.priority);
    }

    // Date range filtering (mainly for sessions)
    if (params.startDate) {
      conditions.push('i.start_date >= ?');
      values.push(params.startDate);
    }
    if (params.endDate) {
      conditions.push('i.start_date <= ?');
      values.push(params.endDate);
    }

    // Build final query
    if (joins.length > 0) {
      query += ' ' + joins.join(' ');
    }
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY i.created_at DESC';

    if (params.limit) {
      query += ' LIMIT ?';
      values.push(params.limit);

      if (params.offset) {
        query += ' OFFSET ?';
        values.push(params.offset);
      }
    }

    const rows = await this.db.allAsync(query, values);

    // Convert rows to items
    const items: UnifiedItem[] = [];
    for (const row of rows as any[]) {
      const item = await this.getById(String(row.type), String(row.id));
      if (item) {
        items.push(item);
      }
    }

    return items;
  }

  /**
   * @ai-intent Get all items of a specific type
   * @ai-flow 1. List files -> 2. Parse each -> 3. Return array
   */
  async getAllByType(type: string): Promise<UnifiedItem[]> {
    const dir = this.getTypeDirectory(type);

    try {
      await fs.access(dir);
    } catch {
      return [];
    }

    const pattern = path.join(dir, `${type}-*.md`);
    const files = await glob(pattern);

    const items: UnifiedItem[] = [];
    for (const file of files) {
      const filename = path.basename(file);
      const match = filename.match(new RegExp(`${type}-(.*)\\.md$`));
      if (match) {
        const id = match[1];
        const item = await this.getById(type, id);
        if (item) {
          items.push(item);
        }
      }
    }

    return items;
  }

  /**
   * @ai-intent Helper methods
   */
  private generateSessionId(): string {
    const now = new Date();
    const pad = (n: number, width: number) => n.toString().padStart(width, '0');

    return `${now.getFullYear()}-${pad(now.getMonth() + 1, 2)}-${pad(now.getDate(), 2)}-` +
           `${pad(now.getHours(), 2)}.${pad(now.getMinutes(), 2)}.${pad(now.getSeconds(), 2)}.` +
           `${pad(now.getMilliseconds(), 3)}`;
  }

  private getTypeDirectory(type: string): string {
    if (type === 'sessions') {
      return path.join(this.dataDir, 'sessions');
    }
    // For unified structure, use type name directly
    return path.join(this.dataDir, type);
  }

  private getFilePath(type: string, id: string): string {
    // Validate ID to prevent path traversal attacks
    const idStr = String(id);
    if (idStr.includes('..') || idStr.includes('/') || idStr.includes('\\') ||
        idStr.includes('\0') || idStr.includes('%') || idStr === '.' ||
        path.isAbsolute(idStr)) {
      throw new Error(`Invalid ID format: ${idStr}`);
    }

    // Additional validation: only allow alphanumeric, dash, underscore, and dot
    if (!/^[a-zA-Z0-9\-_.]+$/.test(idStr)) {
      throw new Error(`Invalid ID format: ${idStr}`);
    }

    if (type === 'sessions') {
      // Sessions are stored in date subdirectories
      const dateMatch = id.match(/^(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        const date = dateMatch[1];
        return path.join(this.dataDir, 'sessions', date, `sessions-${id}.md`);
      }
    } else if (type === 'dailies') {
      // Summaries are stored in sessions directory with date subdirectories
      return path.join(this.dataDir, 'sessions', id, `dailies-${id}.md`);
    }

    // Regular items
    const dir = this.getTypeDirectory(type);
    return path.join(dir, `${type}-${id}.md`);
  }

  private async saveToMarkdown(item: UnifiedItem): Promise<void> {
    const filePath = this.getFilePath(item.type, item.id);
    const dir = path.dirname(filePath);

    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true });

    // Get status name for markdown
    const status = await this.statusRepository.getStatusById(item.status_id);
    const statusName = status?.name || 'Open';

    // Prepare metadata
    const metadata: Record<string, string | number | null | string[]> = {
      id: item.type === 'sessions' || item.type === 'dailies' ? item.id : parseInt(item.id),
      title: item.title,
      priority: item.priority,
      status: statusName,
      tags: item.tags,
      related: item.related,
      created_at: item.created_at,
      updated_at: item.updated_at
    };

    // Add optional fields
    if (item.description) {
      metadata.description = item.description;
    }
    if (item.start_date) {
      metadata.start_date = item.start_date;
    }
    if (item.end_date) {
      metadata.end_date = item.end_date;
    }
    if (item.start_time) {
      metadata.start_time = item.start_time;
    }

    // Generate markdown
    const markdown = generateMarkdown(metadata, item.content);

    // Write to file
    await fs.writeFile(filePath, markdown, 'utf8');
  }

  /**
   * @ai-intent Search items by tag
   * @ai-flow 1. Get tag ID -> 2. Find items with tag -> 3. Load each item
   */
  async searchByTag(tag: string): Promise<UnifiedItem[]> {
    const sql = `
      SELECT DISTINCT item_type as type, item_id as id
      FROM item_tags it
      JOIN tags t ON t.id = it.tag_id
      WHERE t.name = ?
    `;

    const rows = await this.db.allAsync(sql, [tag]);
    const items: UnifiedItem[] = [];

    for (const row of rows) {
      const item = await this.getById(String(row.type), String(row.id));
      if (item) {
        items.push(item);
      }
    }

    return items;
  }

  private async syncToDatabase(item: UnifiedItem): Promise<void> {
    const tagsJson = JSON.stringify(item.tags);
    const relatedJson = JSON.stringify(item.related);

    await this.db.runAsync(`
      INSERT OR REPLACE INTO items 
      (type, id, title, description, content, priority, status_id, 
       start_date, end_date, start_time, tags, related, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
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
      tagsJson,
      relatedJson,
      item.created_at,
      item.updated_at
    ]);

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
      item.type, item.title, item.description || '', item.content, tagsJson
    ]);

    // Update tags
    await this.db.runAsync(
      'DELETE FROM item_tags WHERE item_type = ? AND item_id = ?',
      [item.type, item.id]
    );

    for (const tagName of item.tags) {
      const tagId = await this.tagRepository.getTagIdByName(tagName);
      if (tagId) {
        await this.db.runAsync(
          'INSERT INTO item_tags (item_type, item_id, tag_id) VALUES (?, ?, ?)',
          [item.type, item.id, tagId]
        );
      }
    }

    // Update relationships
    await this.db.runAsync(
      'DELETE FROM related_items WHERE source_type = ? AND source_id = ?',
      [item.type, item.id]
    );

    for (const related of item.related) {
      const { type: targetType, id: targetId } = RelatedItemsHelper.parse(related);
      await this.db.runAsync(
        'INSERT INTO related_items (source_type, source_id, target_type, target_id) VALUES (?, ?, ?, ?)',
        [item.type, item.id, targetType, targetId]
      );
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
    this.logger.info(`Changing type from ${fromType}-${fromId} to ${toType}`);
    
    try {
      // Get type definitions
      const fromTypeDef = await this.getType(fromType);
      const toTypeDef = await this.getType(toType);
      
      if (!fromTypeDef || !toTypeDef) {
        return { success: false, error: 'Invalid type specified' };
      }
      
      // Check base type compatibility
      if (fromTypeDef.baseType !== toTypeDef.baseType) {
        return { 
          success: false, 
          error: `Cannot change between different base types: ${fromTypeDef.baseType} → ${toTypeDef.baseType}` 
        };
      }
      
      // Special types cannot be changed
      if (['sessions', 'dailies'].includes(fromType) || ['sessions', 'dailies'].includes(toType)) {
        return { success: false, error: 'Sessions and dailies cannot be type-changed' };
      }
      
      // Get original item
      const originalItem = await this.getById(fromType, String(fromId));
      if (!originalItem) {
        return { success: false, error: 'Item not found' };
      }
      
      // Create new item with same content
      const newItem = await this.createItem({
        type: toType,
        title: originalItem.title,
        description: originalItem.description,
        content: originalItem.content || '',
        priority: originalItem.priority,
        status: originalItem.status,
        tags: originalItem.tags,
        start_date: originalItem.start_date || undefined,
        end_date: originalItem.end_date || undefined,
        related_tasks: originalItem.related_tasks,
        related_documents: originalItem.related_documents
      });
      
      // Update all references to this item
      const oldReference = `${fromType}-${fromId}`;
      const newReference = `${toType}-${newItem.id}`;
      let relatedUpdates = 0;
      
      // Find all items that reference the old item
      const relatedRows = await this.db.allAsync(`
        SELECT DISTINCT type, id 
        FROM items 
        WHERE related LIKE ?
      `, [`%"${oldReference}"%`]);
      
      // Update each referencing item
      for (const row of relatedRows) {
        const item = await this.getById(String(row.type), String(row.id));
        if (item) {
          const updatedRelated = item.related.map((ref: string) => 
            ref === oldReference ? newReference : ref
          );
          
          // Update the item with new references
          const tasksTypes = ['issues', 'plans', 'bugs'];
          await this.update(String(row.type), String(row.id), {
            type: String(row.type),
            id: String(row.id),
            related_tasks: updatedRelated.filter((r: string) => {
              const [refType] = r.split('-');
              return tasksTypes.includes(refType);
            }),
            related_documents: updatedRelated.filter((r: string) => {
              const [refType] = r.split('-');
              return !tasksTypes.includes(refType);
            })
          });
          
          relatedUpdates++;
        }
      }
      
      // Delete original item
      await this.delete(fromType, String(fromId));
      
      return { 
        success: true, 
        newId: Number(newItem.id),
        relatedUpdates 
      };
      
    } catch (error) {
      this.logger.error('Failed to change item type', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}