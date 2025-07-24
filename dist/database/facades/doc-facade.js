/**
 * @ai-context Facade for technical documentation management
 * @ai-pattern Simplifies document repository API
 * @ai-critical Content is required for documents
 * @ai-dependencies DocRepository for persistence
 * @ai-why Documents are similar to knowledge but semantically different
 */
import { BaseFacade } from './base-facade.js';
export class DocFacade extends BaseFacade {
    docRepo;
    initPromise;
    constructor(connection, docRepo, // @ai-logic: Repository for doc operations
    statusRepo, // @ai-note: Not used but required by base class
    tagRepo, initPromise = null // @ai-pattern: Async init tracking
    ) {
        super(connection, statusRepo, tagRepo);
        this.docRepo = docRepo;
        this.initPromise = initPromise;
    }
    /**
     * @ai-intent Create new technical documentation
     * @ai-flow 1. Ensure init -> 2. Create doc with content
     * @ai-critical Content is required for documents
     * @ai-validation Title and content must be non-empty
     * @ai-side-effects Creates markdown file and SQLite record
     * @ai-why Separate from knowledge for technical vs general content
     */
    async createDoc(title, content, // @ai-critical: Required field for docs
    tags = [] // @ai-pattern: Optional categorization
    ) {
        await this.ensureInitialized(this.initPromise);
        return this.docRepo.createDoc(title, content, tags);
    }
    async getDoc(id) {
        await this.ensureInitialized(this.initPromise);
        return this.docRepo.getDoc(id);
    }
    /**
     * @ai-intent Update existing document
     * @ai-flow 1. Ensure init -> 2. Update doc -> 3. Convert result to boolean
     * @ai-return true if updated, false if not found
     * @ai-why Repository returns Doc or null, facade returns boolean
     */
    async updateDoc(id, title, content, tags) {
        await this.ensureInitialized(this.initPromise);
        const result = await this.docRepo.updateDoc(id, title, content, tags);
        return result !== null; // @ai-logic: Convert null to false for consistency
    }
    async deleteDoc(id) {
        await this.ensureInitialized(this.initPromise);
        return this.docRepo.deleteDoc(id);
    }
    async getAllDocs() {
        await this.ensureInitialized(this.initPromise);
        return this.docRepo.getAllDocs();
    }
    /**
     * @ai-intent Get lightweight doc summaries for lists
     * @ai-performance Only returns id and title fields
     * @ai-return Minimal objects for UI rendering
     * @ai-why Avoids loading large content fields
     */
    async getDocsSummary() {
        await this.ensureInitialized(this.initPromise);
        return this.docRepo.getDocsSummary();
    }
    async searchDocsByTag(tag) {
        await this.ensureInitialized(this.initPromise);
        return this.docRepo.searchDocsByTag(tag);
    }
}
//# sourceMappingURL=doc-facade.js.map