/**
 * @ai-context Unified repository for all item types in the consolidated database
 * @ai-pattern Repository pattern with single table inheritance
 * @ai-critical Replaces TaskRepository and DocumentRepository
 * @ai-dependencies BaseRepository for shared functionality, TypeRegistry for type management
 */
import { BaseRepository } from './base-repository.js';
import type { Database } from './base.js';
import { type UnifiedItem, type CreateItemParams, type UpdateItemParams, type SearchItemParams } from '../types/unified-types.js';
import { StatusRepository } from './status-repository.js';
import { TagRepository } from './tag-repository.js';
export declare class ItemRepository extends BaseRepository<UnifiedItem, string> {
    private statusRepository;
    private tagRepository;
    private dataDir;
    private knownTypes;
    constructor(db: Database, dataDir: string, statusRepository?: StatusRepository, tagRepository?: TagRepository);
    private getType;
    /**
     * @ai-intent Map database row to entity
     * @ai-pattern Required by BaseRepository
     */
    protected mapRowToEntity(row: any): UnifiedItem;
    /**
     * @ai-intent Map entity to database row
     * @ai-pattern Required by BaseRepository
     */
    protected mapEntityToRow(entity: UnifiedItem): any;
    /**
     * @ai-intent Create a new item of any type
     * @ai-flow 1. Validate type -> 2. Generate ID -> 3. Save to markdown -> 4. Sync to DB
     * @ai-critical Handles different ID generation strategies per type
     */
    createItem(params: CreateItemParams): Promise<UnifiedItem>;
    /**
     * @ai-intent Get item by type and ID
     * @ai-flow 1. Read markdown -> 2. Parse -> 3. Return item
     */
    getById(type: string, id: string): Promise<UnifiedItem | null>;
    /**
     * @ai-intent Update an existing item
     * @ai-flow 1. Get existing -> 2. Merge changes -> 3. Save -> 4. Sync
     */
    update(type: string, id: string, params: UpdateItemParams): Promise<UnifiedItem | null>;
    /**
     * @ai-intent Delete an item
     * @ai-flow 1. Delete file -> 2. Remove from DB
     */
    delete(type: string, id: string): Promise<boolean>;
    /**
     * @ai-intent Search items based on criteria
     * @ai-flow 1. Build query -> 2. Execute -> 3. Load full items
     */
    search(params: SearchItemParams): Promise<UnifiedItem[]>;
    /**
     * @ai-intent Get all items of a specific type
     * @ai-flow 1. List files -> 2. Parse each -> 3. Return array
     */
    getAllByType(type: string): Promise<UnifiedItem[]>;
    /**
     * @ai-intent Helper methods
     */
    private generateSessionId;
    private getTypeDirectory;
    private getFilePath;
    private saveToMarkdown;
    private syncToDatabase;
}
