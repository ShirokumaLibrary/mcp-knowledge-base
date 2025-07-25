import sqlite3 from 'sqlite3';
import winston from 'winston';
/**
 * @ai-context Promise-based wrapper for SQLite3 database operations
 * @ai-pattern Adapter pattern to convert callback-based API to Promise-based
 * @ai-why Native sqlite3 uses callbacks, but async/await is cleaner for our codebase
 */
export interface Database extends sqlite3.Database {
    runAsync(sql: string, params?: any[]): Promise<sqlite3.RunResult>;
    getAsync(sql: string, params?: any[]): Promise<any>;
    allAsync(sql: string, params?: any[]): Promise<any[]>;
}
/**
 * @ai-context Base class for all repository implementations
 * @ai-pattern Template Method pattern for common repository operations
 * @ai-dependencies Database (for SQL operations), Logger (for debugging)
 * @ai-critical Provides atomic sequence generation for entity IDs
 */
export declare abstract class BaseRepository {
    protected db: Database;
    protected logger: winston.Logger;
    constructor(db: Database, loggerName?: string);
    /**
     * @ai-intent Generate unique sequential IDs for entities
     * @ai-flow 1. Atomically increment sequence -> 2. Retrieve new value -> 3. Return ID
     * @ai-critical Must be atomic to prevent duplicate IDs in concurrent operations
     * @ai-error-handling Throws Error with detailed message on failure
     * @ai-assumption Sequence table exists and is initialized
     */
    protected getNextSequenceValue(sequenceName: string): Promise<number>;
}
/**
 * @ai-context Manages SQLite database lifecycle and initialization
 * @ai-pattern Singleton-like connection management with lazy initialization
 * @ai-critical Central point for all database operations - failure here affects entire system
 * @ai-lifecycle Initialize once, reuse connection, close on shutdown
 */
export declare class DatabaseConnection {
    private dbPath;
    private db;
    private initializationPromise;
    private initializationComplete;
    private logger;
    constructor(dbPath: string);
    initialize(): Promise<void>;
    private initializeDatabase;
    private createTables;
    private createSearchTables;
    private createTagRelationshipTables;
    private createIndexes;
    getDatabase(): Database;
    isInitialized(): boolean;
    close(): void;
}
