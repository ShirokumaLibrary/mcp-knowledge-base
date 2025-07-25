import { BaseRepository, Database } from './base.js';
import { Knowledge } from '../types/domain-types.js';
import { TagRepository } from './tag-repository.js';
/**
 * @ai-context Repository for organizational knowledge and documentation
 * @ai-pattern Simple content repository without status workflow
 * @ai-critical Knowledge entries are immutable references - updates create new versions
 * @ai-dependencies TagRepository for categorization only
 * @ai-why Simpler than issues/plans - no status tracking or relationships
 */
export declare class KnowledgeRepository extends BaseRepository {
    private knowledgeDir;
    private tagRepository;
    constructor(db: Database, knowledgeDir: string, tagRepository?: TagRepository);
    private ensureDirectoryExists;
    private getKnowledgeNextId;
    private getKnowledgeFilePath;
    /**
     * @ai-intent Parse knowledge entry from markdown file
     * @ai-flow 1. Extract metadata -> 2. Validate essentials -> 3. Return structured data
     * @ai-edge-case Content is required for knowledge (unlike issues/plans)
     * @ai-assumption Knowledge always has content body, not just metadata
     * @ai-return Null for invalid entries to maintain system stability
     */
    private parseMarkdownKnowledge;
    private writeMarkdownKnowledge;
    /**
     * @ai-intent Enable full-text search on knowledge content
     * @ai-flow 1. Serialize data -> 2. Execute UPSERT -> 3. Update tag relationships
     * @ai-side-effects Updates search_knowledge table and knowledge_tags relationship table
     * @ai-performance Full content stored for text search capabilities
     * @ai-critical Content field can be large - ensure adequate DB limits
     * @ai-database-schema Uses knowledge_tags relationship table for normalized tag storage
     */
    syncKnowledgeToSQLite(knowledge: Knowledge): Promise<void>;
    getAllKnowledge(): Promise<Knowledge[]>;
    /**
     * @ai-intent Create new knowledge entry with auto-generated ID
     * @ai-flow 1. Generate ID -> 2. Create object -> 3. Save to file -> 4. Sync to DB
     * @ai-side-effects Creates markdown file, updates SQLite, registers tags
     * @ai-assumption Content is already validated and safe to store
     * @ai-critical Knowledge is append-only - no in-place updates
     */
    createKnowledge(title: string, content: string, tags?: string[], summary?: string): Promise<Knowledge>;
    updateKnowledge(id: number, title?: string, content?: string, tags?: string[], summary?: string): Promise<boolean>;
    deleteKnowledge(id: number): Promise<boolean>;
    getKnowledge(id: number): Promise<Knowledge | null>;
    /**
     * @ai-intent Search knowledge by exact tag match using relationship table
     * @ai-flow 1. Get tag ID -> 2. JOIN with knowledge_tags -> 3. Load full knowledge
     * @ai-performance Uses indexed JOIN instead of LIKE search
     * @ai-database-schema Leverages knowledge_tags relationship table
     */
    searchKnowledgeByTag(tag: string): Promise<Knowledge[]>;
}
