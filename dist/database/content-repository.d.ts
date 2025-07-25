/**
 * @ai-context Unified repository for all content types (doc, knowledge, etc)
 * @ai-pattern Repository pattern with dual storage (Markdown + SQLite)
 * @ai-critical Manages doc, knowledge, architecture, guideline, test content types
 * @ai-dependencies BaseRepository (parent), TagRepository (auto-tag registration)
 * @ai-filesystem Creates files in {dataDir}/contents/content-{id}.md
 */
import { BaseRepository } from './base.js';
import { Content, ContentSummary } from '../types/domain-types.js';
/**
 * @ai-intent Repository for unified content management
 * @ai-pattern Extends BaseRepository with content-specific operations
 * @ai-critical Single repository for all content types
 * @ai-flow Create/Update -> Write Markdown -> Sync to SQLite -> Register tags
 */
export declare class ContentRepository extends BaseRepository {
    private contentDir;
    constructor(dbPath: string, dataDir: string, tagRepository: any);
    /**
     * @ai-intent Initialize repository and ensure directory structure
     * @ai-critical Must be called before any operations
     * @ai-side-effects Creates contents directory
     */
    initialize(): Promise<void>;
    /**
     * @ai-intent Create table for content search index
     * @ai-critical Includes type and summary columns
     * @ai-side-effects Creates search_contents table in SQLite
     */
    protected createTables(): Promise<void>;
    /**
     * @ai-intent Create new content item
     * @ai-flow 1. Generate ID -> 2. Set timestamps -> 3. Write file -> 4. Sync to DB -> 5. Register tags
     * @ai-validation Ensures required fields and valid type
     * @ai-error-handling Returns null on failure
     */
    create(data: Omit<Content, 'id' | 'created_at' | 'updated_at'>): Promise<Content | null>;
    /**
     * @ai-intent Get content by ID
     * @ai-flow Read markdown file -> Parse content
     * @ai-error-handling Returns null if not found
     */
    getById(id: number): Promise<Content | null>;
    /**
     * @ai-intent Get all content of a specific type
     * @ai-flow Query SQLite for type -> Read files -> Parse content
     * @ai-performance Uses SQLite index for fast filtering
     */
    getByType(type: string): Promise<Content[]>;
    /**
     * @ai-intent Get all content items
     * @ai-flow Read all files -> Parse each -> Sort by date
     * @ai-performance May be slow with many files
     */
    getAll(): Promise<Content[]>;
    /**
     * @ai-intent Get content summaries for list display
     * @ai-flow Query SQLite -> Return summaries only
     * @ai-performance Avoids reading full content
     */
    getAllSummaries(type?: string): Promise<ContentSummary[]>;
    /**
     * @ai-intent Update existing content
     * @ai-flow 1. Read existing -> 2. Merge changes -> 3. Write file -> 4. Sync to DB -> 5. Update tags
     * @ai-validation Preserves ID and created_at
     */
    update(id: number, updates: Partial<Omit<Content, 'id' | 'created_at' | 'updated_at'>>): Promise<Content | null>;
    /**
     * @ai-intent Delete content by ID
     * @ai-flow 1. Delete file -> 2. Remove from SQLite
     * @ai-side-effects Permanent deletion
     */
    delete(id: number): Promise<boolean>;
    /**
     * @ai-intent Search content by query
     * @ai-flow Query SQLite FTS -> Return filtered results
     * @ai-performance Uses SQLite full-text search
     */
    search(query: string, type?: string): Promise<ContentSummary[]>;
    /**
     * @ai-intent Sync content to SQLite for searching
     * @ai-flow Prepare data -> Upsert to search_contents
     * @ai-side-effects Updates search index
     */
    private syncContentToSQLite;
    /**
     * @ai-intent Rebuild search index from markdown files
     * @ai-critical Used during database rebuild
     * @ai-flow Read all files -> Parse -> Sync to SQLite
     */
    rebuildSearchIndex(): Promise<void>;
    /**
     * @ai-intent Get all unique content types
     * @ai-flow Query distinct types from SQLite
     */
    getTypes(): Promise<string[]>;
}
