/**
 * @ai-context Item repository using unified storage
 * @ai-pattern Adapter pattern wrapping UnifiedStorage
 * @ai-critical Maintains existing API while using new storage layer
 */
import type { Database } from '../database/base.js';
import type { StatusRepository } from '../database/status-repository.js';
import type { TagRepository } from '../database/tag-repository.js';
import type { FileIssueDatabase } from '../database/index.js';
import type { UnifiedItem, CreateItemParams, UpdateItemParams } from '../types/unified-types.js';
export declare class ItemRepository {
    private db;
    private statusRepo;
    private tagRepo;
    private fileDb;
    private storage;
    private logger;
    constructor(db: Database, dataDir: string, statusRepo: StatusRepository, tagRepo: TagRepository, fileDb: FileIssueDatabase);
    /**
     * @ai-intent Get storage config for a type
     */
    private getStorageConfig;
    /**
     * @ai-intent Convert UnifiedItem to StorageItem with complete field set
     */
    private itemToStorageItem;
    /**
     * @ai-intent Convert StorageItem to UnifiedItem
     */
    private storageItemToUnifiedItem;
    /**
     * @ai-intent Get next sequential ID for a type
     */
    private getNextId;
    /**
     * @ai-intent Create a new item
     */
    createItem(params: CreateItemParams): Promise<UnifiedItem>;
    /**
     * @ai-intent Get item by type and ID
     * @ai-why Read from Markdown for single items (source of truth)
     * @ai-performance Direct file read is fast for individual items
     * @ai-contrast getItems() uses SQLite for efficiency with multiple items
     */
    getItem(type: string, id: string): Promise<UnifiedItem | null>;
    /**
     * @ai-intent Update an existing item
     */
    updateItem(params: UpdateItemParams): Promise<UnifiedItem | null>;
    /**
     * @ai-intent Delete an item
     */
    deleteItem(type: string, id: string): Promise<boolean>;
    /**
     * @ai-intent Get items by type with optional filters
     * @ai-why Use SQLite for list operations (filtering, sorting, status joins)
     * @ai-performance JSON columns prevent N+1 queries for tags/related items
     * @ai-trade-off Individual items read from Markdown, lists from SQLite
     */
    getItems(type: string, includeClosedStatuses?: boolean, statuses?: string[], startDate?: string, endDate?: string, limit?: number): Promise<UnifiedItem[]>;
    /**
     * @ai-intent Search items by tag
     */
    searchItemsByTag(tag: string, types?: string[]): Promise<UnifiedItem[]>;
    /**
     * @ai-intent Sync item to SQLite (public for rebuild)
     */
    syncItemToSQLite(item: UnifiedItem): Promise<void>;
    /**
     * @ai-intent Convert database row to UnifiedItem
     */
    private rowToUnifiedItem;
    /**
     * @ai-intent Rebuild database from markdown files
     */
    rebuildFromMarkdown(type: string): Promise<number>;
}
