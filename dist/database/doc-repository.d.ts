import { BaseRepository, Database } from './base.js';
import { Doc, DocSummary } from '../types/domain-types.js';
import { TagRepository } from './tag-repository.js';
/**
 * @ai-context Repository for technical documentation management
 * @ai-pattern Simple document repository similar to knowledge but for docs
 * @ai-critical Documents are long-form content - handle large text gracefully
 * @ai-dependencies TagRepository for categorization
 * @ai-assumption Documents are reference material, not time-sensitive
 */
export declare class DocRepository extends BaseRepository {
    private docsDir;
    private tagRepository;
    constructor(db: Database, docsDir: string, tagRepository?: TagRepository);
    private ensureDirectoryExists;
    private getDocNextId;
    private getDocFilePath;
    /**
     * @ai-intent Parse document from markdown file
     * @ai-flow 1. Extract metadata -> 2. Validate required fields -> 3. Return Doc object
     * @ai-edge-case Empty content allowed for placeholder docs
     * @ai-assumption Documents always have content section
     * @ai-why Identical structure to knowledge but semantic difference
     */
    private parseMarkdownDoc;
    private writeMarkdownDoc;
    /**
     * @ai-intent Sync document to SQLite for full-text search
     * @ai-flow 1. Prepare data -> 2. UPSERT to search table -> 3. Update tag relationships
     * @ai-side-effects Updates search_docs table and doc_tags relationship table
     * @ai-performance Content can be large - ensure DB can handle
     * @ai-critical Essential for search functionality
     * @ai-database-schema Uses doc_tags relationship table for normalized tag storage
     */
    syncDocToSQLite(doc: Doc): Promise<void>;
    private deleteDocFromSQLite;
    getAllDocs(): Promise<Doc[]>;
    /**
     * @ai-intent Get document list without content for performance
     * @ai-flow 1. Read all files -> 2. Parse headers only -> 3. Return summaries
     * @ai-performance Avoids loading full content for list views
     * @ai-return Lightweight objects with just ID and title
     * @ai-why Documents can be large - summary view prevents memory issues
     */
    getDocsSummary(): Promise<DocSummary[]>;
    createDoc(title: string, content: string, tags?: string[], summary?: string): Promise<Doc>;
    updateDoc(id: number, title?: string, content?: string, tags?: string[], summary?: string): Promise<Doc | null>;
    deleteDoc(id: number): Promise<boolean>;
    getDoc(id: number): Promise<Doc | null>;
    /**
     * @ai-intent Search documents by exact tag match using relationship table
     * @ai-flow 1. Get tag ID -> 2. JOIN with doc_tags -> 3. Load full docs
     * @ai-performance Uses indexed JOIN instead of LIKE search
     * @ai-database-schema Leverages doc_tags relationship table
     */
    searchDocsByTag(tag: string): Promise<Doc[]>;
}
