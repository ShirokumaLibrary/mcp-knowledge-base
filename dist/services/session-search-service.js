export class SessionSearchService {
    db;
    repository;
    constructor(db, repository) {
        this.db = db;
        this.repository = repository;
    }
    async searchSessionsFast(query) {
        return this.db.searchSessions(query);
    }
    async searchSessionsByTagFast(tag) {
        return this.db.searchSessionsByTag(tag);
    }
    async searchDailySummariesFast(query) {
        return this.db.searchDailySummaries(query);
    }
    async searchSessionsDetailed(query) {
        return await this.repository.searchSessionsFullText(query);
    }
    async searchSessionsByTagDetailed(tag) {
        return await this.repository.searchSessionsByTag(tag);
    }
}
