/**
 * @ai-context Simplified session repository using unified storage
 * @ai-pattern Adapter pattern wrapping UnifiedStorage
 * @ai-critical Maintains backward compatibility while using new storage
 */
import type { Session, Daily } from '../types/session-types.js';
import type { FileIssueDatabase } from '../database.js';
export declare class SessionRepository {
    private dataDir;
    private db;
    private storage;
    private formatter;
    private logger;
    constructor(dataDir: string, db: FileIssueDatabase);
    /**
     * @ai-intent Convert Session to StorageItem
     */
    private sessionToStorageItem;
    /**
     * @ai-intent Convert StorageItem to Session
     */
    private storageItemToSession;
    /**
     * @ai-intent Convert Daily to StorageItem
     */
    private dailyToStorageItem;
    /**
     * @ai-intent Convert StorageItem to Daily
     */
    private storageItemToDaily;
    saveSession(session: Session): Promise<void>;
    loadSession(sessionId: string, date: string): Promise<Session | null>;
    getSessionsForDate(date: string): Promise<Session[]>;
    getSessions(startDate?: string, endDate?: string): Promise<Session[]>;
    getSessionDetail(sessionId: string): Promise<Session | null>;
    searchSessionsByTag(tag: string): Promise<Session[]>;
    searchSessionsFullText(query: string): Promise<Session[]>;
    saveDaily(summary: Daily): Promise<void>;
    updateDaily(summary: Daily): Promise<void>;
    loadDaily(date: string): Promise<Daily | null>;
    getDailySummaries(startDate?: string, endDate?: string): Promise<Daily[]>;
    ensureDailyDirectory(date: string): string;
}
