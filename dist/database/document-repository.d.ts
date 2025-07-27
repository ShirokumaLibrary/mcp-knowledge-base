/**
 * @ai-context Unified repository for document types (doc/knowledge)
 * @ai-pattern Repository pattern with dual storage (Markdown + SQLite)
 * @ai-critical Replaces separate DocRepository and KnowledgeRepository
 * @ai-dependencies BaseRepository for shared functionality
 * @ai-filesystem Documents stored in {dataDir}/documents/{type}/{type}-{id}.md
 * @ai-database-schema Uses search_documents table with composite key (type, id)
 */
import type { Database } from './base.js';
import { BaseRepository } from './base.js';
import type { Document, DocumentSummary } from '../types/domain-types.js';
/**
 * @ai-intent Repository for unified document management
 * @ai-pattern Combines doc and knowledge repositories
 * @ai-critical Uses type field to maintain separate ID sequences
 * @ai-related-files
 *   - src/database/doc-repository.ts (replaced)
 *   - src/database/knowledge-repository.ts (replaced)
 * @ai-data-flow
 *   1. Create/Update -> Write markdown file -> Sync to SQLite
 *   2. Read -> Load from markdown file
 *   3. Search -> Query SQLite -> Load details from files
 */
export declare class DocumentRepository extends BaseRepository {
    private documentsPath;
    private tagRepo;
    constructor(db: Database, documentsPath: string);
    /**
     * @ai-intent Ensure documents directory structure exists
     * @ai-side-effects Creates directories if missing
     * @ai-filesystem Creates documents/docs and documents/knowledge subdirectories
     */
    ensureDirectories(): Promise<void>;
    /**
     * @ai-intent Normalize type to sequence type for consistency
     * @ai-logic Maps 'doc' to 'docs' but keeps others as-is
     * @ai-why Ensures consistent file naming across the system
     */
    private normalizeSequenceType;
    /**
     * @ai-intent Get directory name for a given type
     * @ai-logic Documents are stored in a single documents directory
     * @ai-why Simplifies directory structure for document types
     */
    private getTypeDirectory;
    /**
     * @ai-intent Get all document patterns including custom types
     */
    private getAllDocumentPatterns;
    /**
     * @ai-intent Create new document with type-specific ID
     * @ai-flow 1. Get next ID for type -> 2. Create file -> 3. Sync to SQLite
     * @ai-critical Content is required for documents
     * @ai-side-effects Creates markdown file and SQLite record
     */
    createDocument(type: string, // Allow any type, not just 'doc' | 'knowledge'
    title: string, content: string, tags?: string[], description?: string, related_tasks?: string[], related_documents?: string[]): Promise<Document>;
    /**
     * @ai-intent Get document by type and ID
     * @ai-flow 1. Check file exists -> 2. Parse markdown -> 3. Return document
     * @ai-return Document object or null if not found
     */
    getDocument(type: string, id: number): Promise<Document | null>;
    /**
     * @ai-intent Update existing document
     * @ai-flow 1. Load current -> 2. Apply changes -> 3. Save -> 4. Sync
     * @ai-pattern Partial updates supported
     */
    updateDocument(type: string, id: number, title?: string, content?: string, tags?: string[], description?: string, related_tasks?: string[], related_documents?: string[]): Promise<boolean>;
    /**
     * @ai-intent Delete document by type and ID
     * @ai-flow 1. Delete file -> 2. Remove from SQLite
     * @ai-side-effects Permanent deletion, cascades to document_tags
     */
    deleteDocument(type: string, id: number): Promise<boolean>;
    /**
     * @ai-intent Get all documents of a specific type
     * @ai-flow 1. List files -> 2. Parse each -> 3. Return array
     * @ai-performance Consider pagination for large datasets
     */
    getAllDocuments(type?: string): Promise<Document[]>;
    /**
     * @ai-intent Get document summaries for list views
     * @ai-performance Excludes content field for efficiency
     * @ai-return Lightweight summary objects
     */
    getAllDocumentsSummary(type?: string): Promise<DocumentSummary[]>;
    /**
     * @ai-intent Search documents by tag
     * @ai-flow 1. Query document_tags -> 2. Load documents
     * @ai-pattern Uses JOIN for efficient tag filtering
     */
    searchDocumentsByTag(tag: string, type?: string): Promise<Document[]>;
    /**
     * @ai-intent Sync document to SQLite for searching
     * @ai-flow 1. Prepare data -> 2. UPSERT to search table -> 3. Update tags
     * @ai-side-effects Updates search_documents and document_tags tables
     * @ai-critical Uses composite primary key (type, id)
     */
    syncDocumentToSQLite(document: Document): Promise<void>;
    /**
     * @ai-intent Initialize search_documents table
     * @ai-critical Must be called during database setup
     * @ai-side-effects Creates table and indexes if not exist
     */
    initializeDatabase(): Promise<void>;
}
