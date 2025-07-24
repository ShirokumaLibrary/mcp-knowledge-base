/**
 * @ai-context Facade for technical documentation management
 * @ai-pattern Simplifies document repository API
 * @ai-critical Content is required for documents
 * @ai-dependencies DocRepository for persistence
 * @ai-why Documents are similar to knowledge but semantically different
 */
import { BaseFacade } from './base-facade.js';
import { DocRepository } from '../doc-repository.js';
import { Doc } from '../../types/domain-types.js';
import { DatabaseConnection } from '../base.js';
import { StatusRepository } from '../status-repository.js';
import { TagRepository } from '../tag-repository.js';
export declare class DocFacade extends BaseFacade {
    private docRepo;
    private initPromise;
    constructor(connection: DatabaseConnection, docRepo: DocRepository, // @ai-logic: Repository for doc operations
    statusRepo: StatusRepository, // @ai-note: Not used but required by base class
    tagRepo: TagRepository, initPromise?: Promise<void> | null);
    /**
     * @ai-intent Create new technical documentation
     * @ai-flow 1. Ensure init -> 2. Create doc with content
     * @ai-critical Content is required for documents
     * @ai-validation Title and content must be non-empty
     * @ai-side-effects Creates markdown file and SQLite record
     * @ai-why Separate from knowledge for technical vs general content
     */
    createDoc(title: string, content: string, // @ai-critical: Required field for docs
    tags?: string[]): Promise<Doc>;
    getDoc(id: number): Promise<Doc | null>;
    /**
     * @ai-intent Update existing document
     * @ai-flow 1. Ensure init -> 2. Update doc -> 3. Convert result to boolean
     * @ai-return true if updated, false if not found
     * @ai-why Repository returns Doc or null, facade returns boolean
     */
    updateDoc(id: number, title?: string, content?: string, tags?: string[]): Promise<boolean>;
    deleteDoc(id: number): Promise<boolean>;
    getAllDocs(): Promise<Doc[]>;
    /**
     * @ai-intent Get lightweight doc summaries for lists
     * @ai-performance Only returns id and title fields
     * @ai-return Minimal objects for UI rendering
     * @ai-why Avoids loading large content fields
     */
    getDocsSummary(): Promise<Array<{
        id: number;
        title: string;
    }>>;
    searchDocsByTag(tag: string): Promise<Doc[]>;
}
