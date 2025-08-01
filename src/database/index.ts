import { DatabaseConnection } from './base.js';
import { ItemRepository } from '../repositories/item-repository.js';
import { StatusRepository } from './status-repository.js';
import { TagRepository } from './tag-repository.js';
import { SearchRepository } from './search-repository.js';
import { FullTextSearchRepository } from './fulltext-search-repository.js';
import { TypeRepository } from './type-repository.js';
import { getConfig } from '../config.js';
import { ensureInitialized } from '../utils/decorators.js';
import { Session, Daily } from '../types/complete-domain-types.js';
import type { Issue, Plan, Document } from '../types/domain-types.js';
import type { ListItem } from '../types/unified-types.js';
// import * as path from 'path';

// Re-export types
export * from '../types/domain-types.js';

// Internal type definitions
interface GroupedItems {
  issues: Issue[];
  plans: Plan[];
  docs: Document[];
  knowledge: Document[];
  [key: string]: Issue[] | Plan[] | Document[]; // For indexing
}

interface GroupedTypes {
  tasks: string[];
  documents: string[];
  [key: string]: string[]; // For indexing
}

interface ItemRow {
  id: string;
  type: string;
  title: string;
  description?: string;
  content?: string;
  tags: string;
  related: string;
  created_at: string;
  updated_at: string;
  priority?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  date?: string;
}

/**
 * @ai-context Main database facade coordinating all repositories
 * @ai-pattern Facade pattern hiding repository complexity from handlers
 * @ai-critical Central data access layer - all data operations go through here
 * @ai-lifecycle Lazy initialization ensures DB ready before operations
 * @ai-dependencies ItemRepository for all content, Status/Tag for metadata
 * @ai-assumption Single database instance per process
 */
export class FileIssueDatabase {
  private connection: DatabaseConnection;
  private itemRepo!: ItemRepository;
  private statusRepo!: StatusRepository;
  private tagRepo!: TagRepository;
  private searchRepo!: SearchRepository;
  private fullTextSearchRepo!: FullTextSearchRepository;
  private typeRepo!: TypeRepository;
  private initializationPromise: Promise<void> | null = null;

  /**
   * Convert ListItem to legacy Issue format
   */
  private listItemToIssue(item: ListItem): Omit<Issue, 'content' | 'related_tasks' | 'related_documents'> {
    return {
      id: parseInt(item.id),
      title: item.title,
      description: item.description,
      priority: item.priority || 'medium',
      status: item.status || 'Unknown',
      start_date: null,
      end_date: null,
      tags: item.tags,
      created_at: item.updated_at,
      updated_at: item.updated_at
    };
  }

  /**
   * Convert ListItem to full Issue format with empty content
   */
  private listItemToFullIssue(item: ListItem): Issue {
    return {
      ...this.listItemToIssue(item),
      content: '',
      related_tasks: [],
      related_documents: []
    };
  }

  /**
   * Convert ListItem to Document format
   */
  private listItemToDocument(item: ListItem): Document {
    return {
      type: item.type,
      id: parseInt(item.id),
      title: item.title,
      description: item.description,
      content: '',
      tags: item.tags,
      related_tasks: [],
      related_documents: [],
      created_at: item.updated_at,
      updated_at: item.updated_at
    };
  }

  constructor(
    private dataDir: string,
    private dbPath: string = getConfig().database.sqlitePath
  ) {
    this.connection = new DatabaseConnection(this.dbPath);
  }

  /**
   * @ai-intent Get data directory for external access
   * @ai-why TypeHandlers need this to create TypeRepository
   */
  get dataDirectory(): string {
    return this.dataDir;
  }

  /**
   * @ai-intent Expose database connection
   * @ai-why TypeRepository needs direct database access
   */
  getDatabase() {
    return this.connection.getDatabase();
  }

  /**
   * @ai-intent Get ItemRepository for direct access
   * @ai-why UnifiedHandlers need direct access to ItemRepository
   */
  getItemRepository() {
    return this.itemRepo;
  }

  /**
   * @ai-intent Get TagRepository for direct access
   * @ai-why CurrentStateHandlers needs access for tag registration
   */
  getTagRepository() {
    return this.tagRepo;
  }

  /**
   * @ai-intent Get TypeRepository for direct access
   * @ai-why Type management tests need direct access
   */
  getTypeRepository() {
    return this.typeRepo;
  }

  /**
   * @ai-intent Get FullTextSearchRepository for search operations
   * @ai-why Search handlers need direct access
   */
  getFullTextSearchRepository() {
    return this.fullTextSearchRepo;
  }

  /**
   * @ai-intent Initialize database and all repositories
   * @ai-flow 1. Check if initializing -> 2. Start init -> 3. Cache promise
   * @ai-pattern Singleton initialization pattern
   * @ai-critical Must complete before any operations
   */
  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.initializeAsync();
    return this.initializationPromise;
  }

  /**
   * @ai-intent Actual initialization logic
   */
  private async initializeAsync(): Promise<void> {
    await this.connection.initialize();
    const db = this.connection.getDatabase();

    // Initialize in dependency order
    this.statusRepo = new StatusRepository(db);
    this.tagRepo = new TagRepository(db);
    this.itemRepo = new ItemRepository(db, this.dataDir, this.statusRepo, this.tagRepo, this);
    this.searchRepo = new SearchRepository(db);
    this.fullTextSearchRepo = new FullTextSearchRepository(db);
    this.typeRepo = new TypeRepository(this);

    await this.typeRepo.init();
  }

  // Status methods
  @ensureInitialized
  async getAllStatuses() {
    return this.statusRepo.getAllStatuses();
  }

  async getAllStatusesAsync() {
    return this.getAllStatuses();
  }

  // Legacy status methods for tests
  @ensureInitialized
  async createStatus(name: string) {
    // console.warn('createStatus is deprecated');
    const statuses = await this.statusRepo.getAllStatuses();
    const existing = statuses.find(s => s.name === name);
    if (existing) {
      return existing;
    }
    const id = statuses.length + 1;
    return { id, name, is_closed: false };
  }

  @ensureInitialized
  async updateStatus(_id: number, _name: string) {
    // console.warn('updateStatus is deprecated');
    return true;
  }

  @ensureInitialized
  async deleteStatus(_id: number) {
    // console.warn('deleteStatus is deprecated');
    return true;
  }

  // Tag methods
  @ensureInitialized
  async getAllTags() {
    return this.tagRepo.getAllTags();
  }

  @ensureInitialized
  async getOrCreateTagId(tagName: string) {
    return this.tagRepo.getOrCreateTagId(tagName);
  }

  @ensureInitialized
  async createTag(name: string) {
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      throw new Error('Tag name cannot be empty or whitespace only');
    }
    await this.tagRepo.createTag(trimmedName);
    const id = await this.tagRepo.getOrCreateTagId(trimmedName);
    return { id, name: trimmedName };
  }

  @ensureInitialized
  async deleteTag(name: string) {
    return this.tagRepo.deleteTag(name);
  }

  @ensureInitialized
  async searchTagsByPattern(pattern: string) {
    return this.tagRepo.searchTagsByPattern(pattern);
  }

  // Legacy task methods for tests
  @ensureInitialized
  async createTask(
    type: string,
    title: string,
    content: string,
    priority?: string,
    status?: string,
    tags?: string[],
    description?: string,
    start_date?: string | null,
    end_date?: string | null,
    related_tasks?: string[],
    related_documents?: string[]
  ) {
    return this.itemRepo.createItem({
      type,
      title,
      content,
      priority: (priority || 'medium') as 'high' | 'medium' | 'low',
      status,
      tags,
      description,
      start_date: start_date || undefined,
      end_date: end_date || undefined,
      related_tasks,
      related_documents
    });
  }

  @ensureInitialized
  async getTask(type: string, id: number) {
    return this.itemRepo.getItem(type, String(id));
  }

  @ensureInitialized
  async updateTask(
    type: string,
    id: number,
    title?: string,
    content?: string,
    priority?: string,
    status?: string,
    tags?: string[],
    description?: string,
    start_date?: string | null,
    end_date?: string | null,
    related_tasks?: string[],
    related_documents?: string[]
  ) {
    return this.itemRepo.updateItem({
      type,
      id: String(id),
      title,
      content,
      priority: (priority || 'medium') as 'high' | 'medium' | 'low',
      status,
      tags,
      description,
      start_date: start_date || undefined,
      end_date: end_date || undefined,
      related_tasks,
      related_documents
    });
  }

  @ensureInitialized
  async deleteTask(type: string, id: number) {
    return this.itemRepo.deleteItem(type, String(id));
  }

  @ensureInitialized
  async getAllTasksSummary(type: string, includeClosedStatuses?: boolean, statuses?: string[]) {
    return this.itemRepo.getItems(type, includeClosedStatuses, statuses);
  }

  @ensureInitialized
  async searchTasksByTag(tag: string) {
    return this.itemRepo.searchItemsByTag(tag, ['issues', 'plans']);
  }

  @ensureInitialized
  async getTags() {
    return this.tagRepo.getAllTags();
  }

  @ensureInitialized
  async searchTags(pattern: string) {
    return this.tagRepo.searchTagsByPattern(pattern);
  }

  @ensureInitialized
  async searchAllByTag(tag: string) {
    const items = await this.itemRepo.searchItemsByTag(tag);

    // Group by type for backward compatibility
    const grouped: GroupedItems = {
      issues: [],
      plans: [],
      docs: [],
      knowledge: []
    };

    for (const item of items) {
      switch (item.type) {
        case 'issues':
          grouped.issues.push(item as unknown as Issue);
          break;
        case 'plans':
          grouped.plans.push(item as unknown as Plan);
          break;
        case 'docs':
          grouped.docs.push(item as unknown as Document);
          break;
        case 'knowledge':
          grouped.knowledge.push(item as unknown as Document);
          break;
      }
    }

    return grouped;
  }

  @ensureInitialized
  async searchAll(query: string) {
    const items = await this.searchRepo.searchContent(query);

    // Group by type for backward compatibility
    const grouped: GroupedItems = {
      issues: [],
      plans: [],
      docs: [],
      knowledge: []
    };

    for (const item of items) {
      switch (item.type) {
        case 'issues':
          grouped.issues.push(item as unknown as Issue);
          break;
        case 'plans':
          grouped.plans.push(item as unknown as Plan);
          break;
        case 'docs':
          grouped.docs.push(item as unknown as Document);
          break;
        case 'knowledge':
          grouped.knowledge.push(item as unknown as Document);
          break;
      }
    }

    return grouped;
  }

  // Issue methods (delegate to ItemRepository)
  @ensureInitialized
  async createIssue(
    title: string,
    content: string,
    priority: string,
    status?: string,
    tags?: string[],
    description?: string,
    start_date?: string | null,
    end_date?: string | null,
    related_tasks?: string[],
    related_documents?: string[]
  ) {
    const item = await this.itemRepo.createItem({
      type: 'issues',
      title,
      content,
      priority: priority as 'high' | 'medium' | 'low' | undefined,
      status,
      tags,
      description,
      start_date: start_date || undefined,
      end_date: end_date || undefined,
      related_tasks,
      related_documents
    });

    // Convert to Issue format for backward compatibility
    return {
      id: parseInt(item.id),
      title: item.title,
      description: item.description,
      content: item.content,
      priority: item.priority,
      status: item.status,
      tags: item.tags,
      start_date: item.start_date,
      end_date: item.end_date,
      related_tasks: item.related_tasks,
      related_documents: item.related_documents,
      created_at: item.created_at,
      updated_at: item.updated_at
    };
  }

  @ensureInitialized
  async getIssue(id: number) {
    const item = await this.itemRepo.getItem('issues', String(id));
    if (!item) {
      return null;
    }

    return {
      id: parseInt(item.id),
      title: item.title,
      description: item.description,
      content: item.content,
      priority: item.priority,
      status: item.status,
      tags: item.tags,
      start_date: item.start_date,
      end_date: item.end_date,
      related_tasks: item.related_tasks,
      related_documents: item.related_documents,
      created_at: item.created_at,
      updated_at: item.updated_at
    };
  }

  @ensureInitialized
  async updateIssue(
    id: number,
    title?: string,
    content?: string,
    priority?: string,
    status?: string,
    tags?: string[],
    description?: string,
    start_date?: string | null,
    end_date?: string | null,
    related_tasks?: string[],
    related_documents?: string[]
  ) {
    const item = await this.itemRepo.updateItem({
      type: 'issues',
      id: String(id),
      title,
      content,
      priority: priority as 'high' | 'medium' | 'low' | undefined,
      status,
      tags,
      description,
      start_date: start_date || undefined,
      end_date: end_date || undefined,
      related_tasks,
      related_documents
    });

    if (!item) {
      return null;
    }

    return {
      id: parseInt(item.id),
      title: item.title,
      description: item.description,
      content: item.content,
      priority: item.priority,
      status: item.status,
      tags: item.tags,
      start_date: item.start_date,
      end_date: item.end_date,
      related_tasks: item.related_tasks,
      related_documents: item.related_documents,
      created_at: item.created_at,
      updated_at: item.updated_at
    };
  }

  @ensureInitialized
  async deleteIssue(id: number) {
    return this.itemRepo.deleteItem('issues', String(id));
  }

  @ensureInitialized
  async getAllIssuesSummary(includeClosedStatuses?: boolean, statusIds?: number[]) {
    // Convert status IDs to names for backward compatibility
    let statuses: string[] | undefined;
    if (statusIds && statusIds.length > 0) {
      const allStatuses = await this.statusRepo.getAllStatuses();
      statuses = statusIds
        .map(id => allStatuses.find(s => s.id === id)?.name)
        .filter((name): name is string => name !== undefined);
    }
    const items = await this.itemRepo.getItems('issues', includeClosedStatuses, statuses);
    return items.map(item => this.listItemToIssue(item));
  }

  @ensureInitialized
  async searchIssuesByTag(tag: string) {
    const items = await this.itemRepo.searchItemsByTag(tag, ['issues']);
    return items.map(item => this.listItemToFullIssue(item));
  }

  // Plan methods (delegate to ItemRepository)
  @ensureInitialized
  async createPlan(
    title: string,
    content: string,
    priority: string,
    status?: string,
    tags?: string[],
    description?: string,
    start_date?: string | null,
    end_date?: string | null,
    related_tasks?: string[],
    related_documents?: string[]
  ) {
    const item = await this.itemRepo.createItem({
      type: 'plans',
      title,
      content,
      priority: priority as 'high' | 'medium' | 'low' | undefined,
      status,
      tags,
      description,
      start_date: start_date || undefined,
      end_date: end_date || undefined,
      related_tasks,
      related_documents
    });

    return {
      id: parseInt(item.id),
      title: item.title,
      description: item.description,
      content: item.content,
      priority: item.priority,
      status: item.status,
      tags: item.tags,
      start_date: item.start_date,
      end_date: item.end_date,
      related_tasks: item.related_tasks,
      related_documents: item.related_documents,
      created_at: item.created_at,
      updated_at: item.updated_at
    };
  }

  @ensureInitialized
  async getPlan(id: number) {
    const item = await this.itemRepo.getItem('plans', String(id));
    if (!item) {
      return null;
    }

    return {
      id: parseInt(item.id),
      title: item.title,
      description: item.description,
      content: item.content,
      priority: item.priority,
      status: item.status,
      tags: item.tags,
      start_date: item.start_date,
      end_date: item.end_date,
      related_tasks: item.related_tasks,
      related_documents: item.related_documents,
      created_at: item.created_at,
      updated_at: item.updated_at
    };
  }

  @ensureInitialized
  async updatePlan(
    id: number,
    title?: string,
    content?: string,
    priority?: string,
    status?: string,
    tags?: string[],
    description?: string,
    start_date?: string | null,
    end_date?: string | null,
    related_tasks?: string[],
    related_documents?: string[]
  ) {
    const item = await this.itemRepo.updateItem({
      type: 'plans',
      id: String(id),
      title,
      content,
      priority: priority as 'high' | 'medium' | 'low' | undefined,
      status,
      tags,
      description,
      start_date: start_date || undefined,
      end_date: end_date || undefined,
      related_tasks,
      related_documents
    });

    if (!item) {
      return null;
    }

    return {
      id: parseInt(item.id),
      title: item.title,
      description: item.description,
      content: item.content,
      priority: item.priority,
      status: item.status,
      tags: item.tags,
      start_date: item.start_date,
      end_date: item.end_date,
      related_tasks: item.related_tasks,
      related_documents: item.related_documents,
      created_at: item.created_at,
      updated_at: item.updated_at
    };
  }

  @ensureInitialized
  async deletePlan(id: number) {
    return this.itemRepo.deleteItem('plans', String(id));
  }

  @ensureInitialized
  async getAllPlansSummary(includeClosedStatuses?: boolean, statusIds?: number[]) {
    // Convert status IDs to names for backward compatibility
    let statuses: string[] | undefined;
    if (statusIds && statusIds.length > 0) {
      const allStatuses = await this.statusRepo.getAllStatuses();
      statuses = statusIds
        .map(id => allStatuses.find(s => s.id === id)?.name)
        .filter((name): name is string => name !== undefined);
    }
    const items = await this.itemRepo.getItems('plans', includeClosedStatuses, statuses);
    return items.map(item => this.listItemToIssue(item));
  }

  @ensureInitialized
  async searchPlansByTag(tag: string) {
    const items = await this.itemRepo.searchItemsByTag(tag, ['plans']);
    return items.map(item => this.listItemToFullIssue(item));
  }

  // Document methods (delegate to ItemRepository)
  @ensureInitialized
  async getAllDocuments(type?: string) {
    if (!type) {
      // Get both docs and knowledge
      const docs = await this.itemRepo.getItems('docs');
      const knowledge = await this.itemRepo.getItems('knowledge');
      return [...docs, ...knowledge].map(item => this.listItemToDocument(item));
    }

    const items = await this.itemRepo.getItems(type);
    return items.map(item => this.listItemToDocument(item));
  }

  @ensureInitialized
  async getDocument(type: string, id: number) {
    const item = await this.itemRepo.getItem(type, String(id));
    if (!item) {
      return null;
    }

    return {
      type: item.type,
      id: parseInt(item.id),
      title: item.title,
      description: item.description,
      content: item.content,
      tags: item.tags,
      related_tasks: item.related_tasks,
      related_documents: item.related_documents,
      created_at: item.created_at,
      updated_at: item.updated_at
    };
  }

  @ensureInitialized
  async createDocument(
    type: string,
    title: string,
    content: string,
    tags?: string[],
    description?: string,
    related_tasks?: string[],
    related_documents?: string[]
  ) {
    const item = await this.itemRepo.createItem({
      type,
      title,
      content,
      tags,
      description,
      related_tasks,
      related_documents
    });

    return {
      type: item.type,
      id: item.id,
      title: item.title,
      description: item.description,
      content: item.content,
      tags: item.tags,
      related_tasks: item.related_tasks,
      related_documents: item.related_documents,
      created_at: item.created_at,
      updated_at: item.updated_at
    };
  }

  @ensureInitialized
  async updateDocument(
    type: string,
    id: number,
    title?: string,
    content?: string,
    tags?: string[],
    description?: string,
    related_tasks?: string[],
    related_documents?: string[]
  ) {
    const item = await this.itemRepo.updateItem({
      type,
      id: String(id),
      title,
      content,
      tags,
      description,
      related_tasks,
      related_documents
    });

    if (!item) {
      return false;
    }
    return true;
  }

  @ensureInitialized
  async deleteDocument(type: string, id: number) {
    return this.itemRepo.deleteItem(type, String(id));
  }

  @ensureInitialized
  async searchDocumentsByTag(tag: string, type?: string) {
    const types = type ? [type] : ['docs', 'knowledge'];
    const items = await this.itemRepo.searchItemsByTag(tag, types);
    return items.map(item => this.listItemToDocument(item));
  }

  @ensureInitialized
  async getAllDocumentsSummary(type?: string) {
    if (!type) {
      const docs = await this.itemRepo.getItems('docs');
      const knowledge = await this.itemRepo.getItems('knowledge');
      return [...docs, ...knowledge].map(item => ({
        type: item.type,
        id: parseInt(item.id),
        title: item.title,
        description: item.description,
        tags: item.tags,
        created_at: item.updated_at,
        updated_at: item.updated_at
      }));
    }

    const items = await this.itemRepo.getItems(type);
    return items.map(item => ({
      type: item.type,
      id: parseInt(item.id),
      title: item.title,
      description: item.description,
      tags: item.tags,
      created_at: item.updated_at,
      updated_at: item.updated_at
    }));
  }

  // Type methods
  @ensureInitialized
  async getAllTypes() {
    return this.typeRepo.getAllTypes();
  }

  @ensureInitialized
  async createType(name: string, baseType?: 'tasks' | 'documents') {
    return this.typeRepo.createType(name, baseType);
  }

  @ensureInitialized
  async deleteType(name: string) {
    return this.typeRepo.deleteType(name);
  }

  @ensureInitialized
  async getBaseType(name: string) {
    return this.typeRepo.getBaseType(name);
  }

  // Search methods
  @ensureInitialized
  async searchContent(query: string) {
    return this.searchRepo.searchContent(query);
  }

  // Legacy item methods
  @ensureInitialized
  async getItems(type: string) {
    return this.itemRepo.getItems(type);
  }

  @ensureInitialized
  async getTypes() {
    const types = await this.typeRepo.getAllTypes();

    // Group by base_type for backward compatibility
    const grouped: GroupedTypes = {
      tasks: [],
      documents: []
    };

    for (const type of types) {
      if (grouped[type.base_type]) {
        grouped[type.base_type].push(type.type);
      }
    }

    return grouped;
  }

  // Session search methods (placeholder - actual implementation pending)
  @ensureInitialized
  async searchSessions(query: string): Promise<Session[]> {
    // Search for sessions in the items table
    const results = await this.connection.getDatabase().allAsync(
      `SELECT * FROM items 
       WHERE type = 'sessions' AND (title LIKE ? OR content LIKE ? OR description LIKE ?)
       ORDER BY created_at DESC`,
      [`%${query}%`, `%${query}%`, `%${query}%`]
    );

    // Convert database rows to Session format
    return (results as unknown as ItemRow[]).map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description || undefined,
      content: row.content || undefined,
      tags: row.tags ? JSON.parse(row.tags) : [],
      related_tasks: row.related ? JSON.parse(row.related).filter((r: string) => r.startsWith('issues-') || r.startsWith('plans-')) : undefined,
      related_documents: row.related ? JSON.parse(row.related).filter((r: string) => r.startsWith('docs-') || r.startsWith('knowledge-')) : undefined,
      date: row.start_date || row.id.split('-').slice(0, 3).join('-'),
      startTime: row.start_time || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at || undefined
    }));
  }

  @ensureInitialized
  async searchSessionsByTag(tag: string): Promise<Session[]> {
    // Search for sessions with the specific tag
    const results = await this.connection.getDatabase().allAsync(
      `SELECT * FROM items 
       WHERE type = 'sessions' AND tags LIKE ?
       ORDER BY created_at DESC`,
      [`%"${tag}"%`]
    );

    // Convert database rows to Session format
    return (results as unknown as ItemRow[]).map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description || undefined,
      content: row.content || undefined,
      tags: row.tags ? JSON.parse(row.tags) : [],
      related_tasks: row.related ? JSON.parse(row.related).filter((r: string) => r.startsWith('issues-') || r.startsWith('plans-')) : undefined,
      related_documents: row.related ? JSON.parse(row.related).filter((r: string) => r.startsWith('docs-') || r.startsWith('knowledge-')) : undefined,
      date: row.start_date || row.id.split('-').slice(0, 3).join('-'),
      startTime: row.start_time || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at || undefined
    }));
  }

  @ensureInitialized
  async searchDailySummaries(query: string): Promise<Daily[]> {
    // Search for summaries in the items table
    const results = await this.connection.getDatabase().allAsync(
      `SELECT * FROM items 
       WHERE type = 'dailies' AND (title LIKE ? OR content LIKE ? OR description LIKE ?)
       ORDER BY created_at DESC`,
      [`%${query}%`, `%${query}%`, `%${query}%`]
    );

    // Convert database rows to Daily format
    return (results as unknown as ItemRow[]).map((row) => ({
      date: row.id, // ID is the date for summaries
      title: row.title,
      description: row.description || undefined,
      content: row.content || '',
      tags: row.tags ? JSON.parse(row.tags) : [],
      related_tasks: row.related ? JSON.parse(row.related).filter((r: string) => r.startsWith('issues-') || r.startsWith('plans-')) : [],
      related_documents: row.related ? JSON.parse(row.related).filter((r: string) => r.startsWith('docs-') || r.startsWith('knowledge-')) : [],
      createdAt: row.created_at,
      updatedAt: row.updated_at || undefined
    }));
  }

  /**
   * @ai-intent Clean up resources
   */
  async close() {
    try {
      await this.connection.close();
    } catch (error) {
      // Log but don't throw - tests need cleanup to complete
      // console.error('Error closing database connection:', error);
    }
  }
}