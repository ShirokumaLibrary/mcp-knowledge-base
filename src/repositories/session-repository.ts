/**
 * @ai-context Simplified session repository using unified storage
 * @ai-pattern Adapter pattern wrapping UnifiedStorage
 * @ai-critical Maintains backward compatibility while using new storage
 */

import type { Session, Daily } from '../types/session-types.js';
import { SessionMarkdownFormatter } from '../formatters/session-markdown-formatter.js';
import type { FileIssueDatabase } from '../database.js';
import { UnifiedStorage, STORAGE_CONFIGS, type StorageItem } from '../storage/unified-storage.js';
import { createLogger } from '../utils/logger.js';

export class SessionRepository {
  private storage: UnifiedStorage;
  private formatter: SessionMarkdownFormatter;
  private logger = createLogger('SessionRepository');

  constructor(
    private dataDir: string,
    private db: FileIssueDatabase
  ) {
    this.storage = new UnifiedStorage(dataDir);
    this.formatter = new SessionMarkdownFormatter();
  }

  /**
   * @ai-intent Convert Session to StorageItem
   */
  private sessionToStorageItem(session: Session): StorageItem {
    const metadata = {
      title: session.title,
      description: session.description || '',
      tags: session.tags || [],
      related_tasks: session.related_tasks || [],
      related_documents: session.related_documents || [],
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

  /**
   * @ai-intent Convert StorageItem to Session
   */
  private storageItemToSession(item: StorageItem, id: string, date: string): Session {
    return {
      id,
      title: item.metadata.title,
      description: item.metadata.description || undefined,
      content: item.content || undefined,
      tags: item.metadata.tags || [],
      related_tasks: item.metadata.related_tasks || undefined,
      related_documents: item.metadata.related_documents || undefined,
      date,
      startTime: item.metadata.start_time || undefined,
      createdAt: item.metadata.created_at,
      updatedAt: item.metadata.updated_at || undefined
    };
  }

  /**
   * @ai-intent Convert Daily to StorageItem
   */
  private dailyToStorageItem(daily: Daily): StorageItem {
    const metadata = {
      title: daily.title,
      description: daily.description || '',
      tags: daily.tags || [],
      related_tasks: daily.related_tasks || [],
      related_documents: daily.related_documents || [],
      created_at: daily.createdAt,
      updated_at: daily.updatedAt || daily.createdAt
    };

    return {
      id: daily.date,
      metadata,
      content: daily.content
    };
  }

  /**
   * @ai-intent Convert StorageItem to Daily
   */
  private storageItemToDaily(item: StorageItem, date: string): Daily {
    return {
      date,
      title: item.metadata.title,
      description: item.metadata.description || undefined,
      content: item.content,
      tags: item.metadata.tags || [],
      related_tasks: item.metadata.related_tasks || [],
      related_documents: item.metadata.related_documents || [],
      createdAt: item.metadata.created_at,
      updatedAt: item.metadata.updated_at || undefined
    };
  }

  // Session methods
  async saveSession(session: Session): Promise<void> {
    const item = this.sessionToStorageItem(session);
    await this.storage.save(STORAGE_CONFIGS.sessions, item);

    // Auto-register tags
    if (session.tags && session.tags.length > 0) {
      await this.db.getTags(); // Initialize tags table if needed
      for (const tag of session.tags) {
        try {
          await this.db.createTag(tag);
        } catch {
          // Tag already exists, ignore
        }
      }
    }
  }

  async loadSession(sessionId: string, date: string): Promise<Session | null> {
    const item = await this.storage.load(STORAGE_CONFIGS.sessions, sessionId);
    if (!item) {
      return null;
    }
    return this.storageItemToSession(item, sessionId, date);
  }

  async getSessionsForDate(date: string): Promise<Session[]> {
    const ids = await this.storage.list(STORAGE_CONFIGS.sessions, date);
    const sessions: Session[] = [];

    for (const id of ids) {
      const item = await this.storage.load(STORAGE_CONFIGS.sessions, id);
      if (item) {
        sessions.push(this.storageItemToSession(item, id, date));
      }
    }

    return sessions;
  }

  async getSessions(startDate?: string, endDate?: string): Promise<Session[]> {
    if (!startDate && !endDate) {
      const today = new Date().toISOString().split('T')[0];
      return this.getSessionsForDate(today);
    }

    const dateDirs = await this.storage.listDateDirs(STORAGE_CONFIGS.sessions);
    const results: Session[] = [];

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

  async getSessionDetail(sessionId: string): Promise<Session | null> {
    const item = await this.storage.load(STORAGE_CONFIGS.sessions, sessionId);
    if (!item) {
      return null;
    }

    const date = STORAGE_CONFIGS.sessions.dateExtractor!(sessionId);
    return this.storageItemToSession(item, sessionId, date);
  }

  async searchSessionsByTag(tag: string): Promise<Session[]> {
    return this.storage.search(STORAGE_CONFIGS.sessions, item => {
      const tags = item.metadata.tags || [];
      return tags.includes(tag);
    }).then(items =>
      items.map(item => {
        const date = STORAGE_CONFIGS.sessions.dateExtractor!(item.id);
        return this.storageItemToSession(item, item.id, date);
      })
    );
  }

  async searchSessionsFullText(query: string): Promise<Session[]> {
    const lowerQuery = query.toLowerCase();
    return this.storage.search(STORAGE_CONFIGS.sessions, item => {
      const searchable = [
        item.metadata.title || '',
        item.metadata.description || '',
        item.content || '',
        (item.metadata.tags || []).join(' ')
      ].join(' ').toLowerCase();

      return searchable.includes(lowerQuery);
    }).then(items =>
      items.map(item => {
        const date = STORAGE_CONFIGS.sessions.dateExtractor!(item.id);
        return this.storageItemToSession(item, item.id, date);
      })
    );
  }

  // Daily summary methods
  async saveDaily(summary: Daily): Promise<void> {
    const exists = await this.storage.exists(STORAGE_CONFIGS.dailies, summary.date);
    if (exists) {
      throw new Error(`Daily summary for ${summary.date} already exists. Use update instead.`);
    }

    const item = this.dailyToStorageItem(summary);
    await this.storage.save(STORAGE_CONFIGS.dailies, item);

    // Auto-register tags
    if (summary.tags && summary.tags.length > 0) {
      await this.db.getTags(); // Initialize tags table if needed
      for (const tag of summary.tags) {
        try {
          await this.db.createTag(tag);
        } catch {
          // Tag already exists, ignore
        }
      }
    }
  }

  async updateDaily(summary: Daily): Promise<void> {
    const item = this.dailyToStorageItem(summary);
    await this.storage.save(STORAGE_CONFIGS.dailies, item);

    // Auto-register tags
    if (summary.tags && summary.tags.length > 0) {
      await this.db.getTags(); // Initialize tags table if needed
      for (const tag of summary.tags) {
        try {
          await this.db.createTag(tag);
        } catch {
          // Tag already exists, ignore
        }
      }
    }
  }

  async loadDaily(date: string): Promise<Daily | null> {
    const item = await this.storage.load(STORAGE_CONFIGS.dailies, date);
    if (!item) {
      return null;
    }
    return this.storageItemToDaily(item, date);
  }

  async getDailySummaries(startDate?: string, endDate?: string): Promise<Daily[]> {
    if (!startDate && !endDate) {
      const today = new Date();
      endDate = today.toISOString().split('T')[0];
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 6);
      startDate = weekAgo.toISOString().split('T')[0];
    }

    const ids = await this.storage.list(STORAGE_CONFIGS.dailies);
    const results: Daily[] = [];

    for (const id of ids) {
      // ID is the date for dailies
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

  // Legacy compatibility methods
  ensureDailyDirectory(date: string): string {
    // No longer needed with new structure
    return date;
  }
}