import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from '../utils/logger.js';
import { getProgramVersion, setDbVersion } from '../utils/db-version-utils.js';
import { globSync } from 'glob';
export class BaseRepository {
    db;
    logger;
    constructor(db, loggerName) {
        this.db = db;
        this.logger = createLogger(loggerName || this.constructor.name);
    }
    getEntityFileName(sequenceType, id) {
        const idStr = String(id);
        if (idStr.includes('..') || idStr.includes('/') || idStr.includes('\\') ||
            idStr.includes('\0') || idStr.includes('%') || idStr === '.' ||
            path.isAbsolute(idStr)) {
            throw new Error(`Invalid ID format: ${idStr}`);
        }
        if (!/^[a-zA-Z0-9\-_.]+$/.test(idStr)) {
            throw new Error(`Invalid ID format: ${idStr}`);
        }
        return `${sequenceType}-${idStr}.md`;
    }
    async getSequenceType(sequenceName) {
        const row = await this.db.getAsync('SELECT type FROM sequences WHERE type = ?', [sequenceName]);
        return row?.type || null;
    }
    async getCurrentSequenceValue(sequenceName) {
        const row = await this.db.getAsync('SELECT current_value FROM sequences WHERE type = ?', [sequenceName]);
        if (!row) {
            throw new Error(`Sequence not found for type: ${sequenceName}`);
        }
        return row.current_value;
    }
    async getNextSequenceValue(sequenceName) {
        try {
            await this.db.runAsync('UPDATE sequences SET current_value = current_value + 1 WHERE type = ?', [sequenceName]);
            const row = await this.db.getAsync('SELECT current_value FROM sequences WHERE type = ?', [sequenceName]);
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
export class DatabaseConnection {
    dbPath;
    dataDir;
    db;
    initializationPromise = null;
    initializationComplete = false;
    logger;
    constructor(dbPath, dataDir) {
        this.dbPath = dbPath;
        this.dataDir = dataDir;
        this.logger = createLogger('DatabaseConnection');
        if (this.isMCPEnvironment()) {
            const noop = () => this.logger;
            this.logger.debug = noop;
            this.logger.info = noop;
            this.logger.warn = noop;
            this.logger.error = noop;
        }
    }
    isMCPEnvironment() {
        if (process.env.NODE_ENV === 'test' || process.env.MCP_MODE === 'false') {
            return false;
        }
        return process.argv.some(arg => arg.includes('server.js')) ||
            process.env.MCP_MODE === 'true' ||
            process.env.NODE_ENV === 'production';
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
        const sqlite = sqlite3;
        const dbDir = path.dirname(this.dbPath);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }
        const isNewDatabase = !fs.existsSync(this.dbPath);
        this.db = new sqlite.Database(this.dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);
        this.logger.debug('Database connection created');
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
        await this.createTables();
        this.logger.debug('Tables created');
        if (isNewDatabase) {
            const programVersion = await getProgramVersion();
            await setDbVersion(this.db, programVersion);
            this.logger.info(`New database - version set to: ${programVersion}`);
        }
        if (isNewDatabase) {
            const markdownDir = this.dataDir || dbDir;
            const hasExistingData = await this.checkForExistingMarkdownFiles(markdownDir);
            if (hasExistingData) {
                this.logger.warn('New database created, but existing markdown files detected');
                this.logger.warn('To import existing data, run: npm run rebuild:mcp');
                await this.db.runAsync('INSERT INTO db_metadata (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)', ['needs_rebuild', 'true']);
            }
        }
        this.initializationComplete = true;
        this.logger.debug('Database initialization complete');
    }
    async checkForExistingMarkdownFiles(markdownDir) {
        try {
            const patterns = [
                'issues/*.md',
                'plans/*.md',
                'docs/*.md',
                'knowledge/*.md',
                'sessions/**/*.md'
            ];
            for (const pattern of patterns) {
                const fullPattern = path.join(markdownDir, pattern);
                const files = globSync(fullPattern);
                if (files.length > 0) {
                    this.logger.info(`Found existing markdown files in ${pattern}`);
                    return true;
                }
            }
            return false;
        }
        catch (error) {
            this.logger.error('Error checking for markdown files', error);
            return false;
        }
    }
    async createTables() {
        this.logger.debug('Creating tables...');
        this.logger.debug('Creating statuses table...');
        await this.db.runAsync(`
      CREATE TABLE IF NOT EXISTS statuses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        is_closed BOOLEAN DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
        this.logger.debug('Creating tags table...');
        await this.db.runAsync(`
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
        this.logger.debug('Creating sequences table...');
        await this.db.runAsync(`
      CREATE TABLE IF NOT EXISTS sequences (
        type TEXT PRIMARY KEY,
        current_value INTEGER DEFAULT 0,  -- @ai-note: 0 for sessions/dailies (unused)
        base_type TEXT NOT NULL,
        description TEXT,              -- @ai-note: Type description and usage guidelines
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
        try {
            await this.db.runAsync('ALTER TABLE sequences ADD COLUMN description TEXT');
            this.logger.debug('Added description column to sequences table');
        }
        catch {
        }
        this.logger.debug('Creating db_metadata table...');
        await this.db.runAsync(`
      CREATE TABLE IF NOT EXISTS db_metadata (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
        this.logger.debug('Inserting default statuses...');
        await this.db.runAsync(`INSERT OR IGNORE INTO statuses (name, is_closed) VALUES 
      ('Open', 0), ('In Progress', 0), ('Review', 0), ('Completed', 1), ('Closed', 1), ('On Hold', 0), ('Cancelled', 1)`);
        this.logger.debug('Initializing sequences...');
        const existingSequences = await this.db.allAsync('SELECT type FROM sequences');
        if (existingSequences.length === 0) {
            const sequenceValues = [];
            const typeDefinitions = [
                {
                    type: 'issues',
                    baseType: 'tasks',
                    description: 'Bug reports, feature requests, and general tasks. Includes priority, status, and timeline tracking.'
                },
                {
                    type: 'plans',
                    baseType: 'tasks',
                    description: 'Project plans and milestones with start/end dates. Used for planning and tracking larger initiatives.'
                },
                {
                    type: 'docs',
                    baseType: 'documents',
                    description: 'Technical documentation, API references, and user guides. Structured content with required text.'
                },
                {
                    type: 'knowledge',
                    baseType: 'documents',
                    description: 'Knowledge base articles, best practices, and how-to guides. Searchable reference material.'
                }
            ];
            for (const def of typeDefinitions) {
                sequenceValues.push(`('${def.type}', 0, '${def.baseType}', '${def.description.replace(/'/g, "''")}')`);
            }
            await this.db.runAsync(`INSERT INTO sequences (type, current_value, base_type, description) VALUES ${sequenceValues.join(', ')}`);
            await this.db.runAsync(`INSERT INTO sequences (type, current_value, base_type, description) VALUES 
        ('sessions', 0, 'sessions', 'Work session tracking. Content is optional - can be created at session start and updated later. Uses timestamp-based IDs.'),
        ('dailies', 0, 'documents', 'Daily summaries with required content. One entry per date. Uses date as ID (YYYY-MM-DD).')`);
        }
        else {
            await this.db.runAsync(`INSERT OR IGNORE INTO sequences (type, current_value, base_type, description) VALUES 
        ('issues', 0, 'tasks', 'Bug reports, feature requests, and general tasks. Includes priority, status, and timeline tracking.'),
        ('plans', 0, 'tasks', 'Project plans and milestones with start/end dates. Used for planning and tracking larger initiatives.'),
        ('knowledge', 0, 'documents', 'Knowledge base articles, best practices, and how-to guides. Searchable reference material.'),
        ('docs', 0, 'documents', 'Technical documentation, API references, and user guides. Structured content with required text.'),
        ('sessions', 0, 'sessions', 'Work session tracking. Content is optional - can be created at session start and updated later. Uses timestamp-based IDs.'),
        ('dailies', 0, 'documents', 'Daily summaries with required content. One entry per date. Uses date as ID (YYYY-MM-DD).')`);
        }
        this.logger.debug('Creating search tables...');
        await this.createSearchTables();
        this.logger.debug('Creating tag relationship tables...');
        await this.createTagRelationshipTables();
        this.logger.debug('Creating type fields table...');
        await this.createTypeFieldsTable();
        this.logger.debug('Creating indexes...');
        await this.createIndexes();
        this.logger.debug('All tables created successfully');
    }
    async createSearchTables() {
        await this.db.runAsync(`
      CREATE TABLE IF NOT EXISTS items (
        type TEXT NOT NULL,           -- Any type name (no hardcoded restrictions)
        id TEXT NOT NULL,             -- INTEGER or STRING (for sessions)
        title TEXT NOT NULL,
        description TEXT,
        content TEXT,                  -- Main content (required for most types, optional for sessions)
        priority TEXT,                 -- high/medium/low (used as importance for all types)
        status_id INTEGER,             -- Used by all types (documents use Open/Closed)
        start_date TEXT,               -- For tasks, or date for sessions/summaries
        end_date TEXT,                 -- For tasks
        start_time TEXT,               -- For sessions (HH:MM:SS)
        version TEXT,                  -- Version information (e.g. "0.7.5", "v1.2.0")
        tags TEXT,                     -- JSON array @ai-redundant: Also in item_tags
        related TEXT,                  -- JSON array ["type-id", ...] @ai-redundant: Also in related_items
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (type, id)
      )
    `);
        await this.db.runAsync(`
      CREATE VIRTUAL TABLE IF NOT EXISTS items_fts USING fts5(
        type, title, description, content, tags
      )
    `);
        await this.db.runAsync(`
      CREATE INDEX IF NOT EXISTS idx_items_date 
      ON items(start_date) WHERE type = 'sessions'
    `);
        await this.db.runAsync(`
      CREATE INDEX IF NOT EXISTS idx_items_status 
      ON items(status_id)
    `);
        await this.db.runAsync(`
      CREATE INDEX IF NOT EXISTS idx_items_priority 
      ON items(priority)
    `);
        await this.db.runAsync(`
      CREATE INDEX IF NOT EXISTS idx_items_version 
      ON items(version)
    `);
    }
    async createTagRelationshipTables() {
        await this.db.runAsync(`
      CREATE TABLE IF NOT EXISTS item_tags (
        item_type TEXT NOT NULL,
        item_id TEXT NOT NULL,
        tag_id INTEGER NOT NULL,
        PRIMARY KEY (item_type, item_id, tag_id),
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      )
    `);
        await this.db.runAsync(`
      CREATE INDEX IF NOT EXISTS idx_item_tags_tag 
      ON item_tags(tag_id)
    `);
        await this.db.runAsync(`
      CREATE TABLE IF NOT EXISTS related_items (
        source_type TEXT NOT NULL,
        source_id TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_id TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (source_type, source_id, target_type, target_id)
      )
    `);
        await this.db.runAsync(`
      CREATE INDEX IF NOT EXISTS idx_related_source 
      ON related_items(source_type, source_id)
    `);
        await this.db.runAsync(`
      CREATE INDEX IF NOT EXISTS idx_related_target 
      ON related_items(target_type, target_id)
    `);
    }
    async createTypeFieldsTable() {
        await this.db.runAsync(`
      CREATE TABLE IF NOT EXISTS type_fields (
        type TEXT NOT NULL,
        field_name TEXT NOT NULL,
        field_type TEXT NOT NULL,     -- 'string', 'text', 'date', 'priority', 'status', 'tags', 'related'
        required BOOLEAN DEFAULT 0,
        default_value TEXT,
        description TEXT,
        PRIMARY KEY (type, field_name)
      )
    `);
        const defaultFields = [
            { types: ['issues', 'plans', 'docs', 'knowledge', 'sessions', 'dailies'], fields: [
                    { name: 'id', type: 'string', required: true, default: '', desc: 'Unique identifier' },
                    { name: 'title', type: 'string', required: true, default: '', desc: 'Title of the item' },
                    { name: 'description', type: 'string', required: false, default: '', desc: 'Brief description' },
                    { name: 'version', type: 'string', required: false, default: '', desc: 'Version information' },
                    { name: 'tags', type: 'tags', required: false, default: '[]', desc: 'Tags for categorization' },
                    { name: 'created_at', type: 'date', required: true, default: '', desc: 'Creation timestamp' },
                    { name: 'updated_at', type: 'date', required: true, default: '', desc: 'Last update timestamp' }
                ] },
            { types: ['issues', 'plans'], fields: [
                    { name: 'content', type: 'text', required: true, default: '', desc: 'Main content' },
                    { name: 'priority', type: 'priority', required: false, default: 'medium', desc: 'Priority level' },
                    { name: 'status', type: 'status', required: false, default: 'Open', desc: 'Current status' },
                    { name: 'start_date', type: 'date', required: false, default: '', desc: 'Start date' },
                    { name: 'end_date', type: 'date', required: false, default: '', desc: 'End date' },
                    { name: 'related_tasks', type: 'related', required: false, default: '[]', desc: 'Related tasks' },
                    { name: 'related_documents', type: 'related', required: false, default: '[]', desc: 'Related documents' }
                ] },
            { types: ['docs', 'knowledge'], fields: [
                    { name: 'content', type: 'text', required: true, default: '', desc: 'Document content' },
                    { name: 'priority', type: 'priority', required: false, default: 'medium', desc: 'Document importance' },
                    { name: 'status', type: 'status', required: false, default: 'Open', desc: 'Document status' },
                    { name: 'related_documents', type: 'related', required: false, default: '[]', desc: 'Related documents' }
                ] },
            { types: ['sessions'], fields: [
                    { name: 'content', type: 'text', required: false, default: '', desc: 'Session notes' },
                    { name: 'related_tasks', type: 'related', required: false, default: '[]', desc: 'Related tasks' },
                    { name: 'related_documents', type: 'related', required: false, default: '[]', desc: 'Related documents' }
                ] },
            { types: ['dailies'], fields: [
                    { name: 'content', type: 'text', required: true, default: '', desc: 'Daily summary content' },
                    { name: 'related_tasks', type: 'related', required: false, default: '[]', desc: 'Related tasks' },
                    { name: 'related_documents', type: 'related', required: false, default: '[]', desc: 'Related documents' }
                ] }
        ];
        for (const group of defaultFields) {
            for (const type of group.types) {
                for (const field of group.fields) {
                    await this.db.runAsync(`
            INSERT OR IGNORE INTO type_fields (type, field_name, field_type, required, default_value, description)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [type, field.name, field.type, field.required ? 1 : 0, field.default, field.desc]);
                }
            }
        }
    }
    async createIndexes() {
        await this.db.runAsync('CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name)');
        await this.db.runAsync('CREATE INDEX IF NOT EXISTS idx_items_type ON items(type)');
        await this.db.runAsync('CREATE INDEX IF NOT EXISTS idx_items_type_status ON items(type, status_id)');
        await this.db.runAsync('CREATE INDEX IF NOT EXISTS idx_items_type_priority ON items(type, priority)');
        await this.db.runAsync('CREATE INDEX IF NOT EXISTS idx_item_tags_item ON item_tags(item_type, item_id)');
        await this.db.runAsync('CREATE INDEX IF NOT EXISTS idx_type_fields_type ON type_fields(type)');
        try {
            await this.db.runAsync('ALTER TABLE statuses ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP');
            this.logger.debug('Added updated_at column to statuses table');
        }
        catch (err) {
            if (!err.message.includes('duplicate column name')) {
                this.logger.error('Error adding updated_at to statuses:', err);
            }
        }
        try {
            await this.db.runAsync('ALTER TABLE items ADD COLUMN version TEXT');
            this.logger.debug('Added version column to items table');
        }
        catch (err) {
            if (!err.message.includes('duplicate column name')) {
                this.logger.error('Error adding version to items:', err);
            }
        }
    }
    getDatabase() {
        if (!this.db) {
            throw new Error('Database not initialized');
        }
        return this.db;
    }
    async close() {
        if (!this.db) {
            return;
        }
        this.initializationComplete = false;
        this.initializationPromise = null;
        return new Promise((resolve) => {
            this.db.close((err) => {
                if (err) {
                    this.logger.error('Error closing database:', err);
                }
                else {
                    this.logger.debug('Database connection closed');
                }
                this.db = null;
                resolve();
            });
        });
    }
    isInitialized() {
        return this.initializationComplete;
    }
}
