/**
 * @ai-context Facade for issue management operations
 * @ai-pattern Simplifies issue repository API with defaults and initialization
 * @ai-critical Ensures proper status assignment and initialization
 * @ai-dependencies IssueRepository for persistence, StatusRepository for defaults
 * @ai-why Provides cleaner API and handles async initialization transparently
 */
import { BaseFacade } from './base-facade.js';
export class IssueFacade extends BaseFacade {
    issueRepo;
    initPromise;
    constructor(connection, issueRepo, // @ai-logic: Main repository for issue operations
    statusRepo, tagRepo, initPromise = null // @ai-pattern: Async initialization tracking
    ) {
        super(connection, statusRepo, tagRepo);
        this.issueRepo = issueRepo;
        this.initPromise = initPromise;
    }
    /**
     * @ai-intent Create new issue with smart defaults
     * @ai-flow 1. Ensure init -> 2. Default status to 'Open' -> 3. Create issue
     * @ai-critical Finds 'Open' status or falls back to ID 1
     * @ai-defaults priority: 'medium', status: 'Open', tags: []
     * @ai-side-effects Creates markdown file and SQLite record
     */
    async createIssue(title, content, priority = 'medium', statusId, tags = []) {
        await this.ensureInitialized(this.initPromise);
        if (!statusId) {
            const statuses = await this.statusRepo.getAllStatuses();
            const openStatus = statuses.find(s => s.name === 'Open'); // @ai-logic: Prefer 'Open' status
            statusId = openStatus ? openStatus.id : 1; // @ai-fallback: Default to ID 1
        }
        return this.issueRepo.createIssue(title, content || '', priority, statusId, tags);
    }
    async getIssue(id) {
        await this.ensureInitialized(this.initPromise);
        return this.issueRepo.getIssue(id);
    }
    async updateIssue(id, title, content, priority, statusId, tags) {
        await this.ensureInitialized(this.initPromise);
        return this.issueRepo.updateIssue(id, title, content, priority, statusId, tags);
    }
    async deleteIssue(id) {
        await this.ensureInitialized(this.initPromise);
        return this.issueRepo.deleteIssue(id);
    }
    async getAllIssues() {
        await this.ensureInitialized(this.initPromise);
        return this.issueRepo.getAllIssues();
    }
    /**
     * @ai-intent Get lightweight issue summaries for lists
     * @ai-performance Excludes description and tags for speed
     * @ai-return Array of summary objects with minimal fields
     * @ai-why Optimized for UI list rendering performance
     */
    async getAllIssuesSummary() {
        await this.ensureInitialized(this.initPromise);
        return this.issueRepo.getAllIssuesSummary();
    }
    async searchIssuesByTag(tag) {
        await this.ensureInitialized(this.initPromise);
        return this.issueRepo.searchIssuesByTag(tag);
    }
}
//# sourceMappingURL=issue-facade.js.map