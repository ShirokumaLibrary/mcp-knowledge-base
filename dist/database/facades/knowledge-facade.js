/**
 * @ai-context Facade for knowledge base article management
 * @ai-pattern Simplifies knowledge repository API
 * @ai-critical Content is required for knowledge articles
 * @ai-dependencies KnowledgeRepository for persistence
 * @ai-why Knowledge articles are simpler - no status or priority
 */
import { BaseFacade } from './base-facade.js';
export class KnowledgeFacade extends BaseFacade {
    knowledgeRepo;
    initPromise;
    constructor(connection, knowledgeRepo, // @ai-logic: Repository for knowledge operations
    statusRepo, // @ai-note: Not used but required by base class
    tagRepo, initPromise = null // @ai-pattern: Async init tracking
    ) {
        super(connection, statusRepo, tagRepo);
        this.knowledgeRepo = knowledgeRepo;
        this.initPromise = initPromise;
    }
    /**
     * @ai-intent Create new knowledge article
     * @ai-flow 1. Ensure init -> 2. Create knowledge with content
     * @ai-critical Content is required unlike issues/plans
     * @ai-validation Title and content must be non-empty
     * @ai-side-effects Creates markdown file and SQLite record
     * @ai-assumption Knowledge is immutable reference material
     */
    async createKnowledge(title, content, // @ai-critical: Required field for knowledge
    tags = [] // @ai-pattern: Categorization support
    ) {
        await this.ensureInitialized(this.initPromise);
        return this.knowledgeRepo.createKnowledge(title, content, tags);
    }
    async getKnowledge(id) {
        await this.ensureInitialized(this.initPromise);
        return this.knowledgeRepo.getKnowledge(id);
    }
    async updateKnowledge(id, title, content, tags) {
        await this.ensureInitialized(this.initPromise);
        return this.knowledgeRepo.updateKnowledge(id, title, content, tags);
    }
    async deleteKnowledge(id) {
        await this.ensureInitialized(this.initPromise);
        return this.knowledgeRepo.deleteKnowledge(id);
    }
    async getAllKnowledge() {
        await this.ensureInitialized(this.initPromise);
        return this.knowledgeRepo.getAllKnowledge();
    }
    async searchKnowledgeByTag(tag) {
        await this.ensureInitialized(this.initPromise);
        return this.knowledgeRepo.searchKnowledgeByTag(tag);
    }
}
//# sourceMappingURL=knowledge-facade.js.map