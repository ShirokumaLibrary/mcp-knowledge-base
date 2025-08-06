import { SessionMarkdownFormatter } from '../formatters/session-markdown-formatter.js';
import { UnifiedStorage, STORAGE_CONFIGS } from '../storage/unified-storage.js';
import { createLogger } from '../utils/logger.js';
export class SessionRepository {
    dataDir;
    db;
    storage;
    formatter;
    logger = createLogger('SessionRepository');
    constructor(dataDir, db) {
        this.dataDir = dataDir;
        this.db = db;
        this.storage = new UnifiedStorage(dataDir);
        this.formatter = new SessionMarkdownFormatter();
    }
    sessionToStorageItem(session) {
        const metadata = {
            title: session.title,
            description: session.description || '',
            tags: session.tags || [],
            date: session.date,
            start_time: session.startTime || '',
            created_at: session.createdAt,
            updated_at: session.updatedAt || session.createdAt
        };
        return {
            id: session.id,
            metadata,
            content: session.content || ''
        };
    }
    storageItemToSession(item, id, date) {
        const metadata = item.metadata;
        return {
            id,
            title: String(metadata.title || ''),
            description: metadata.description ? String(metadata.description) : undefined,
            content: item.content || undefined,
            tags: Array.isArray(metadata.tags) ? metadata.tags.map(t => String(t)) : [],
            date,
            startTime: metadata.start_time ? String(metadata.start_time) : undefined,
            createdAt: String(metadata.created_at || new Date().toISOString()),
            updatedAt: metadata.updated_at ? String(metadata.updated_at) : undefined
        };
    }
    dailyToStorageItem(daily) {
        const metadata = {
            title: daily.title,
            description: daily.description || '',
            tags: daily.tags || [],
            created_at: daily.createdAt,
            updated_at: daily.updatedAt || daily.createdAt
        };
        return {
            id: daily.date,
            metadata,
            content: daily.content
        };
    }
    storageItemToDaily(item, date) {
        const metadata = item.metadata;
        return {
            date,
            title: String(metadata.title || ''),
            description: metadata.description ? String(metadata.description) : undefined,
            content: item.content,
            tags: Array.isArray(metadata.tags) ? metadata.tags.map(t => String(t)) : [],
            createdAt: String(metadata.created_at || new Date().toISOString()),
            updatedAt: metadata.updated_at ? String(metadata.updated_at) : undefined
        };
    }
    async saveSession(session) {
        const item = this.sessionToStorageItem(session);
        await this.storage.save(STORAGE_CONFIGS.sessions, item);
        if (session.tags && session.tags.length > 0) {
            await this.db.getTags();
            for (const tag of session.tags) {
                try {
                    await this.db.createTag(tag);
                }
                catch {
                }
            }
        }
    }
    async loadSession(sessionId, date) {
        const item = await this.storage.load(STORAGE_CONFIGS.sessions, sessionId);
        if (!item) {
            return null;
        }
        return this.storageItemToSession(item, sessionId, date);
    }
    async getSessionsForDate(date) {
        const ids = await this.storage.list(STORAGE_CONFIGS.sessions, date);
        const sessions = [];
        for (const id of ids) {
            const item = await this.storage.load(STORAGE_CONFIGS.sessions, id);
            if (item) {
                sessions.push(this.storageItemToSession(item, id, date));
            }
        }
        return sessions;
    }
    async getSessions(startDate, endDate) {
        if (!startDate && !endDate) {
            const today = new Date().toISOString().split('T')[0];
            return this.getSessionsForDate(today);
        }
        const dateDirs = await this.storage.listDateDirs(STORAGE_CONFIGS.sessions);
        const results = [];
        for (const dateDir of dateDirs) {
            if (startDate && dateDir < startDate) {
                continue;
            }
            if (endDate && dateDir > endDate) {
                continue;
            }
            const sessions = await this.getSessionsForDate(dateDir);
            results.push(...sessions);
        }
        return results;
    }
    async getSessionDetail(sessionId) {
        const item = await this.storage.load(STORAGE_CONFIGS.sessions, sessionId);
        if (!item) {
            return null;
        }
        const dateExtractor = STORAGE_CONFIGS.sessions.dateExtractor;
        if (!dateExtractor) {
            throw new Error('Date extractor not configured for sessions');
        }
        const date = dateExtractor(sessionId);
        return this.storageItemToSession(item, sessionId, date);
    }
    async searchSessionsByTag(tag) {
        return this.storage.search(STORAGE_CONFIGS.sessions, item => {
            const tags = Array.isArray(item.metadata.tags) ? item.metadata.tags : [];
            return tags.some(t => String(t) === tag);
        }).then(items => items.map(item => {
            const dateExtractor = STORAGE_CONFIGS.sessions.dateExtractor;
            if (!dateExtractor) {
                throw new Error('Date extractor not configured for sessions');
            }
            const date = dateExtractor(item.id);
            return this.storageItemToSession(item, item.id, date);
        }));
    }
    async searchSessionsFullText(query) {
        const lowerQuery = query.toLowerCase();
        return this.storage.search(STORAGE_CONFIGS.sessions, item => {
            const searchable = [
                item.metadata.title || '',
                item.metadata.description || '',
                item.content || '',
                (Array.isArray(item.metadata.tags) ? item.metadata.tags.map(t => String(t)).join(' ') : '')
            ].join(' ').toLowerCase();
            return searchable.includes(lowerQuery);
        }).then(items => items.map(item => {
            const dateExtractor = STORAGE_CONFIGS.sessions.dateExtractor;
            if (!dateExtractor) {
                throw new Error('Date extractor not configured for sessions');
            }
            const date = dateExtractor(item.id);
            return this.storageItemToSession(item, item.id, date);
        }));
    }
    async saveDaily(summary) {
        const exists = await this.storage.exists(STORAGE_CONFIGS.dailies, summary.date);
        if (exists) {
            throw new Error(`Daily summary for ${summary.date} already exists. Use update instead.`);
        }
        const item = this.dailyToStorageItem(summary);
        await this.storage.save(STORAGE_CONFIGS.dailies, item);
        if (summary.tags && summary.tags.length > 0) {
            await this.db.getTags();
            for (const tag of summary.tags) {
                try {
                    await this.db.createTag(tag);
                }
                catch {
                }
            }
        }
    }
    async updateDaily(summary) {
        const item = this.dailyToStorageItem(summary);
        await this.storage.save(STORAGE_CONFIGS.dailies, item);
        if (summary.tags && summary.tags.length > 0) {
            await this.db.getTags();
            for (const tag of summary.tags) {
                try {
                    await this.db.createTag(tag);
                }
                catch {
                }
            }
        }
    }
    async loadDaily(date) {
        const item = await this.storage.load(STORAGE_CONFIGS.dailies, date);
        if (!item) {
            return null;
        }
        return this.storageItemToDaily(item, date);
    }
    async getDailySummaries(startDate, endDate) {
        if (!startDate && !endDate) {
            const today = new Date();
            endDate = today.toISOString().split('T')[0];
            const weekAgo = new Date(today);
            weekAgo.setDate(today.getDate() - 6);
            startDate = weekAgo.toISOString().split('T')[0];
        }
        const ids = await this.storage.list(STORAGE_CONFIGS.dailies);
        const results = [];
        for (const id of ids) {
            if (startDate && id < startDate) {
                continue;
            }
            if (endDate && id > endDate) {
                continue;
            }
            const item = await this.storage.load(STORAGE_CONFIGS.dailies, id);
            if (item) {
                results.push(this.storageItemToDaily(item, id));
            }
        }
        return results.sort((a, b) => a.date.localeCompare(b.date));
    }
    ensureDailyDirectory(date) {
        return date;
    }
}
