import { SessionRepository } from './repositories/session-repository.js';
import { SessionSearchService } from './services/session-search-service.js';
import { SessionMarkdownFormatter } from './formatters/session-markdown-formatter.js';
import { getConfig } from './config.js';
import * as path from 'path';
export class SessionManager {
    db;
    repository;
    searchService;
    formatter;
    constructor(sessionsDir = getConfig().database.sessionsPath, db) {
        this.db = db;
        this.repository = new SessionRepository(sessionsDir, db);
        this.searchService = new SessionSearchService(db, this.repository);
        this.formatter = new SessionMarkdownFormatter();
    }
    generateSessionId(date) {
        const now = date || new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
        return `${year}-${month}-${day}-${hours}.${minutes}.${seconds}.${milliseconds}`;
    }
    async createSession(title, content, tags, id, datetime, related, description) {
        const sessionDate = datetime ? new Date(datetime) : new Date();
        const date = sessionDate.toISOString().split('T')[0];
        if (id) {
            if (id.includes('..') || id.includes('/') || id.includes('\\') ||
                id.includes('\0') || id.includes('%') || id === '.' ||
                path.isAbsolute(id)) {
                throw new Error(`Invalid session ID format: ${id}`);
            }
            if (!/^[a-zA-Z0-9\-_.]+$/.test(id)) {
                throw new Error(`Invalid session ID format: ${id}`);
            }
        }
        const sessionId = id || this.generateSessionId(sessionDate);
        const session = {
            id: sessionId,
            title,
            description,
            content,
            tags,
            related,
            date,
            createdAt: sessionDate.toISOString()
        };
        await this.repository.saveSession(session);
        return session;
    }
    async updateSession(id, title, content, tags, related, description) {
        const session = await this.repository.getSessionDetail(id);
        if (!session) {
            throw new Error(`Session ${id} not found`);
        }
        const updatedSession = {
            ...session,
            title: title !== undefined ? title : session.title,
            description: description !== undefined ? description : session.description,
            content: content !== undefined ? content : session.content,
            tags: tags !== undefined ? tags : session.tags,
            related: related !== undefined ? related : session.related,
            updatedAt: new Date().toISOString()
        };
        await this.repository.saveSession(updatedSession);
        return updatedSession;
    }
    async getSession(sessionId) {
        return await this.repository.getSessionDetail(sessionId);
    }
    async getLatestSession() {
        const today = new Date().toISOString().split('T')[0];
        const sessions = await this.repository.getSessionsForDate(today);
        if (sessions.length === 0) {
            return null;
        }
        sessions.sort((a, b) => a.id.localeCompare(b.id));
        return sessions[sessions.length - 1];
    }
    async createDaily(date, title, content, tags = [], related, description) {
        const now = new Date().toISOString();
        const summary = {
            date,
            title,
            description,
            content,
            tags,
            related,
            createdAt: now
        };
        await this.repository.saveDaily(summary);
        return summary;
    }
    async updateDaily(date, title, content, tags, related, description) {
        const existing = await this.repository.loadDaily(date);
        if (!existing) {
            throw new Error(`Daily summary for ${date} not found`);
        }
        const updated = {
            ...existing,
            title: title !== undefined ? title : existing.title,
            description: description !== undefined ? description : existing.description,
            content: content !== undefined ? content : existing.content,
            tags: tags !== undefined ? tags : existing.tags,
            related: related !== undefined ? related : existing.related,
            updatedAt: new Date().toISOString()
        };
        await this.repository.updateDaily(updated);
        return updated;
    }
    async searchSessionsByTag(tag) {
        return await this.searchService.searchSessionsByTagDetailed(tag);
    }
    async searchSessionsFast(query) {
        return this.searchService.searchSessionsFast(query);
    }
    async searchSessionsByTagFast(tag) {
        return this.searchService.searchSessionsByTagFast(tag);
    }
    async searchDailySummariesFast(query) {
        return this.searchService.searchDailySummariesFast(query);
    }
    async searchSessionsDetailed(query) {
        return await this.searchService.searchSessionsDetailed(query);
    }
    async getSessions(startDate, endDate) {
        return await this.repository.getSessions(startDate, endDate);
    }
    async getSessionDetail(sessionId) {
        return await this.repository.getSessionDetail(sessionId);
    }
    async getDailySummaries(startDate, endDate) {
        return await this.repository.getDailySummaries(startDate, endDate);
    }
    async getDailyDetail(date) {
        return await this.repository.loadDaily(date);
    }
}
