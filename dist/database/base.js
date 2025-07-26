import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from '../utils/logger.js';
/**
 * @ai-context Base class for all repository implementations
 * @ai-pattern Template Method pattern for common repository operations
 * @ai-dependencies Database (for SQL operations), Logger (for debugging)
 * @ai-critical Provides atomic sequence generation for entity IDs
 */
export class BaseRepository {
    db;
    logger;
    constructor(db, loggerName) {
        this.db = db;
        this.logger = createLogger(loggerName || this.constructor.name);
    }
    /**
     * @ai-intent Generate consistent file names for entity storage
     * @ai-pattern Uses sequence type as file prefix directly
     * @ai-why Sequence types are already properly pluralized in the database
     */
    getEntityFileName(sequenceType, id) {
        // Use sequence type directly as it's already properly formatted
        return `${sequenceType}-${id}.md`;
    }
    /**
     * @ai-intent Get sequence type information from database
     * @ai-flow Query sequences table for type metadata
     * @ai-return Returns sequence type or null if not found
     */
    async getSequenceType(sequenceName) {
        const row = await this.db.getAsync('SELECT type FROM sequences WHERE type = ?', [sequenceName]);
        return row?.type || null;
    }
    /**
     * @ai-intent Generate unique sequential IDs for entities
     * @ai-flow 1. Atomically increment sequence -> 2. Retrieve new value -> 3. Return ID
     * @ai-critical Must be atomic to prevent duplicate IDs in concurrent operations
     * @ai-error-handling Throws Error with detailed message on failure
     * @ai-assumption Sequence table exists and is initialized
     */
    async getNextSequenceValue(sequenceName) {
        try {
            // @ai-logic: Atomic increment prevents race conditions
            await this.db.runAsync(`UPDATE sequences SET current_value = current_value + 1 WHERE type = ?`, [sequenceName]);
            const row = await this.db.getAsync(`SELECT current_value FROM sequences WHERE type = ?`, [sequenceName]);
            if (!row || !row.current_value) {
                throw new Error(`Failed to get sequence value for ${sequenceName}`);
            }
            return row.current_value;
        }
        catch (err) {
            this.logger.error('Error getting sequence value:', { error: err, sequenceName });
            throw new Error(`Failed to get sequence value for ${sequenceName}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    }
}
/**
 * @ai-context Manages SQLite database lifecycle and initialization
 * @ai-pattern Singleton-like connection management with lazy initialization
 * @ai-critical Central point for all database operations - failure here affects entire system
 * @ai-lifecycle Initialize once, reuse connection, close on shutdown
 */
export class DatabaseConnection {
    dbPath;
    db;
    initializationPromise = null;
    initializationComplete = false;
    logger;
    constructor(dbPath) {
        this.dbPath = dbPath;
        this.logger = createLogger('DatabaseConnection');
    }
    async initialize() {
        if (this.initializationPromise) {
            return this.initializationPromise;
        }
        this.initializationPromise = this.initializeDatabase();
        return this.initializationPromise;
    }
    async initializeDatabase() {
        this.logger.debug('Starting database initialization...');
        const sqlite = sqlite3.verbose();
        // Ensure the database directory exists
        const dbDir = path.dirname(this.dbPath);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }
        this.db = new sqlite.Database(this.dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);
        this.logger.debug('Database connection created');
        // Add Promise wrappers with custom promisification for run
        this.db.runAsync = (sql, params) => {
            return new Promise((resolve, reject) => {
                this.db.run(sql, params || [], function (err) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(this);
                    }
                });
            });
        };
        this.db.getAsync = promisify(this.db.get.bind(this.db));
        this.db.allAsync = promisify(this.db.all.bind(this.db));
        this.logger.debug('Promise wrappers added');
        // Initialize tables
        await this.createTables();
        this.logger.debug('Tables created');
        this.initializationComplete = true;
        this.logger.debug('Database initialization complete');
    }
    async createTables() {
        this.logger.debug('Creating tables...');
        // Status management table
        this.logger.debug('Creating statuses table...');
        await this.db.runAsync(`
      CREATE TABLE IF NOT EXISTS statuses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        is_closed BOOLEAN DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Tag management table with auto-increment ID
        this.logger.debug('Creating tags table...');
        await this.db.runAsync(`
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Sequence management table
        this.logger.debug('Creating sequences table...');
        await this.db.runAsync(`
      CREATE TABLE IF NOT EXISTS sequences (
        type TEXT PRIMARY KEY,
        current_value INTEGER DEFAULT 0,
        base_type TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Insert default statuses
        this.logger.debug('Inserting default statuses...');
        await this.db.runAsync(`INSERT OR IGNORE INTO statuses (name, is_closed) VALUES 
      ('Open', 0), ('In Progress', 0), ('Review', 0), ('Completed', 1), ('Closed', 1), ('On Hold', 0), ('Cancelled', 1)`);
        // Initialize sequences - reset to 0 if database is empty
        this.logger.debug('Initializing sequences...');
        // Check if sequences already exist
        const existingSequences = await this.db.allAsync(`SELECT type FROM sequences`);
        if (existingSequences.length === 0) {
            // Fresh database - insert new sequences starting at 0
            // Using type registry information
            const sequenceValues = [];
            const typeDefinitions = [
                { type: 'issues', baseType: 'tasks' },
                { type: 'plans', baseType: 'tasks' },
                { type: 'docs', baseType: 'documents' },
                { type: 'knowledge', baseType: 'documents' }
            ];
            for (const def of typeDefinitions) {
                sequenceValues.push(`('${def.type}', 0, '${def.baseType}')`);
            }
            await this.db.runAsync(`INSERT INTO sequences (type, current_value, base_type) VALUES ${sequenceValues.join(', ')}`);
        }
        else {
            // Existing database - ensure all sequences exist
            await this.db.runAsync(`INSERT OR IGNORE INTO sequences (type, current_value, base_type) VALUES 
        ('issues', 0, 'tasks'), ('plans', 0, 'tasks'), ('knowledge', 0, 'documents'), ('docs', 0, 'documents')`);
        }
        // Search tables
        this.logger.debug('Creating search tables...');
        await this.createSearchTables();
        // Create relationship tables for tags
        this.logger.debug('Creating tag relationship tables...');
        await this.createTagRelationshipTables();
        // Create indexes
        this.logger.debug('Creating indexes...');
        await this.createIndexes();
        this.logger.debug('All tables created successfully');
    }
    async createSearchTables() {
        // Unified tasks search table (for both issues and plans)
        await this.db.runAsync(`
      CREATE TABLE IF NOT EXISTS search_tasks (
        type TEXT NOT NULL,  -- Entity type (e.g., 'issues', 'plans', etc.)
        id INTEGER NOT NULL,
        title TEXT,
        summary TEXT,
        content TEXT,
        priority TEXT,
        status_id INTEGER,
        start_date TEXT,
        end_date TEXT,
        tags TEXT,
        created_at TEXT,
        updated_at TEXT,
        PRIMARY KEY (type, id)
      )
    `);
        // Sessions search table
        await this.db.runAsync(`
      CREATE TABLE IF NOT EXISTS search_sessions (
        id TEXT PRIMARY KEY,
        title TEXT,
        content TEXT,
        category TEXT,
        tags TEXT,
        date TEXT,
        start_time TEXT,
        end_time TEXT,
        summary TEXT
      )
    `);
        // Daily Summaries search table
        await this.db.runAsync(`
      CREATE TABLE IF NOT EXISTS search_daily_summaries (
        date TEXT PRIMARY KEY,
        title TEXT,
        content TEXT,
        tags TEXT,
        created_at TEXT,
        updated_at TEXT
      )
    `);
    }
    async createTagRelationshipTables() {
        // Issue tags relationship
        await this.db.runAsync(`
      CREATE TABLE IF NOT EXISTS task_tags (
        task_type TEXT NOT NULL,
        task_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        PRIMARY KEY (task_type, task_id, tag_id),
        FOREIGN KEY (task_type, task_id) REFERENCES search_tasks(type, id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      )
    `);
        // Note: doc_tags and knowledge_tags are replaced by document_tags table
        // created in DocumentRepository
        // Session tags relationship
        await this.db.runAsync(`
      CREATE TABLE IF NOT EXISTS session_tags (
        session_id TEXT,
        tag_id INTEGER,
        PRIMARY KEY (session_id, tag_id),
        FOREIGN KEY (session_id) REFERENCES work_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      )
    `);
        // Daily summary tags relationship
        await this.db.runAsync(`
      CREATE TABLE IF NOT EXISTS summary_tags (
        summary_date TEXT,
        tag_id INTEGER,
        PRIMARY KEY (summary_date, tag_id),
        FOREIGN KEY (summary_date) REFERENCES daily_summaries(date) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      )
    `);
        // Related tasks table (normalized many-to-many relationship)
        // @ai-context Stores relationships between tasks (issues/plans)
        // @ai-pattern Normalized junction table for many-to-many relationships
        await this.db.runAsync(`
      CREATE TABLE IF NOT EXISTS related_tasks (
        source_type TEXT NOT NULL,
        source_id INTEGER NOT NULL,
        target_type TEXT NOT NULL,
        target_id INTEGER NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (source_type, source_id, target_type, target_id)
      )
    `);
        // Related documents table (normalized many-to-many relationship)
        // @ai-context Stores relationships between items and documents
        // @ai-pattern Normalized junction table for many-to-many relationships
        await this.db.runAsync(`
      CREATE TABLE IF NOT EXISTS related_documents (
        source_type TEXT NOT NULL,
        source_id TEXT NOT NULL,  -- TEXT to support both integer and string IDs
        target_type TEXT NOT NULL,
        target_id INTEGER NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (source_type, source_id, target_type, target_id)
      )
    `);
    }
    async createIndexes() {
        // Text search indexes
        await this.db.runAsync(`CREATE INDEX IF NOT EXISTS idx_tasks_text ON search_tasks(title, content)`);
        await this.db.runAsync(`CREATE INDEX IF NOT EXISTS idx_tasks_type ON search_tasks(type)`);
        await this.db.runAsync(`CREATE INDEX IF NOT EXISTS idx_sessions_text ON search_sessions(title, content)`);
        await this.db.runAsync(`CREATE INDEX IF NOT EXISTS idx_summaries_text ON search_daily_summaries(title, content)`);
        // Tag relationship indexes
        await this.db.runAsync(`CREATE INDEX IF NOT EXISTS idx_task_tags_task ON task_tags(task_type, task_id)`);
        await this.db.runAsync(`CREATE INDEX IF NOT EXISTS idx_task_tags_tag ON task_tags(tag_id)`);
        // Note: doc_tags and knowledge_tags indexes are replaced by document_tags indexes
        await this.db.runAsync(`CREATE INDEX IF NOT EXISTS idx_session_tags_session ON session_tags(session_id)`);
        await this.db.runAsync(`CREATE INDEX IF NOT EXISTS idx_session_tags_tag ON session_tags(tag_id)`);
        await this.db.runAsync(`CREATE INDEX IF NOT EXISTS idx_summary_tags_summary ON summary_tags(summary_date)`);
        await this.db.runAsync(`CREATE INDEX IF NOT EXISTS idx_summary_tags_tag ON summary_tags(tag_id)`);
        // Tag name index for quick lookups
        await this.db.runAsync(`CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name)`);
        // Related tasks and documents indexes
        await this.db.runAsync(`CREATE INDEX IF NOT EXISTS idx_related_tasks_source ON related_tasks(source_type, source_id)`);
        await this.db.runAsync(`CREATE INDEX IF NOT EXISTS idx_related_tasks_target ON related_tasks(target_type, target_id)`);
        await this.db.runAsync(`CREATE INDEX IF NOT EXISTS idx_related_documents_source ON related_documents(source_type, source_id)`);
        await this.db.runAsync(`CREATE INDEX IF NOT EXISTS idx_related_documents_target ON related_documents(target_type, target_id)`);
    }
    getDatabase() {
        if (!this.db) {
            throw new Error('Database not initialized');
        }
        return this.db;
    }
    isInitialized() {
        return this.initializationComplete;
    }
    close() {
        if (this.db) {
            this.db.close();
        }
    }
}
//# sourceMappingURL=base.js.map