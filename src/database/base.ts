import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import type winston from 'winston';
import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from '../utils/logger.js';
import type { DatabaseRow, QueryParameters } from './types/database-types.js';

/**
 * @ai-context Promise-based wrapper for SQLite3 database operations
 * @ai-pattern Adapter pattern to convert callback-based API to Promise-based
 * @ai-why Native sqlite3 uses callbacks, but async/await is cleaner for our codebase
 */
export interface Database extends sqlite3.Database {
  runAsync(sql: string, params?: QueryParameters): Promise<sqlite3.RunResult>;
  getAsync(sql: string, params?: QueryParameters): Promise<DatabaseRow | undefined>;
  allAsync(sql: string, params?: QueryParameters): Promise<DatabaseRow[]>;
}

/**
 * @ai-context Base class for all repository implementations
 * @ai-pattern Template Method pattern for common repository operations
 * @ai-dependencies Database (for SQL operations), Logger (for debugging)
 * @ai-critical Provides atomic sequence generation for entity IDs
 */
export abstract class BaseRepository {
  protected db: Database;
  protected logger: winston.Logger;

  constructor(db: Database, loggerName?: string) {
    this.db = db;
    this.logger = createLogger(loggerName || this.constructor.name);
  }

  /**
   * @ai-intent Generate consistent file names for entity storage
   * @ai-pattern Uses sequence type as file prefix directly
   * @ai-why Sequence types are already properly pluralized in the database
   * @ai-security Validates ID to prevent path traversal attacks
   */
  protected getEntityFileName(sequenceType: string, id: number | string): string {
    // Validate ID to prevent path traversal attacks
    const idStr = String(id);

    // Check for path traversal patterns
    if (idStr.includes('..') || idStr.includes('/') || idStr.includes('\\') ||
        idStr.includes('\0') || idStr.includes('%') || idStr === '.' ||
        path.isAbsolute(idStr)) {
      throw new Error(`Invalid ID format: ${idStr}`);
    }

    // Additional validation: only allow alphanumeric, dash, underscore, and dot
    if (!/^[a-zA-Z0-9\-_.]+$/.test(idStr)) {
      throw new Error(`Invalid ID format: ${idStr}`);
    }

    // Use sequence type directly as it's already properly formatted
    return `${sequenceType}-${idStr}.md`;
  }

  /**
   * @ai-intent Get sequence type information from database
   * @ai-flow Query sequences table for type metadata
   * @ai-return Returns sequence type or null if not found
   */
  protected async getSequenceType(sequenceName: string): Promise<string | null> {
    const row = await this.db.getAsync(
      'SELECT type FROM sequences WHERE type = ?',
      [sequenceName]
    ) as { type: string } | undefined;

    return row?.type || null;
  }

  /**
   * @ai-intent Generate unique sequential IDs for entities
   * @ai-flow 1. Atomically increment sequence -> 2. Retrieve new value -> 3. Return ID
   * @ai-critical Must be atomic to prevent duplicate IDs in concurrent operations
   * @ai-error-handling Throws Error with detailed message on failure
   * @ai-assumption Sequence table exists and is initialized
   */
  protected async getNextSequenceValue(sequenceName: string): Promise<number> {
    try {
      // @ai-logic: Atomic increment prevents race conditions
      await this.db.runAsync(
        'UPDATE sequences SET current_value = current_value + 1 WHERE type = ?',
        [sequenceName]
      );

      const row = await this.db.getAsync(
        'SELECT current_value FROM sequences WHERE type = ?',
        [sequenceName]
      ) as { current_value: number } | undefined;

      if (!row || !row.current_value) {
        throw new Error(`Failed to get sequence value for ${sequenceName}`);
      }

      return row.current_value;
    } catch (err) {
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
  private db!: Database;
  private initializationPromise: Promise<void> | null = null;
  private initializationComplete: boolean = false;
  private logger: winston.Logger;

  constructor(private dbPath: string) {
    this.logger = createLogger('DatabaseConnection');
  }

  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.initializeDatabase();
    return this.initializationPromise;
  }

  private async initializeDatabase(): Promise<void> {
    this.logger.debug('Starting database initialization...');
    const sqlite = sqlite3.verbose();
    // Ensure the database directory exists
    const dbDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    this.db = new sqlite.Database(this.dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE) as Database;
    this.logger.debug('Database connection created');

    // Add Promise wrappers with custom promisification for run
    this.db.runAsync = (sql: string, params?: QueryParameters): Promise<sqlite3.RunResult> => {
      return new Promise((resolve, reject) => {
        this.db.run(sql, params || [], function(this: sqlite3.RunResult, err: Error | null) {
          if (err) {
            reject(err);
          } else {
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

  private async createTables(): Promise<void> {
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
    // @ai-pattern Type registry and ID sequence management
    // @ai-why Sessions/dailies use date-based IDs but still need registry entry
    // @ai-critical Acts as both ID generator AND type existence validator
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

    // Add description column if it doesn't exist (for existing databases)
    try {
      await this.db.runAsync('ALTER TABLE sequences ADD COLUMN description TEXT');
      this.logger.debug('Added description column to sequences table');
    } catch {
      // Column already exists, ignore error
    }

    // Insert default statuses
    this.logger.debug('Inserting default statuses...');
    await this.db.runAsync(`INSERT OR IGNORE INTO statuses (name, is_closed) VALUES 
      ('Open', 0), ('In Progress', 0), ('Review', 0), ('Completed', 1), ('Closed', 1), ('On Hold', 0), ('Cancelled', 1)`);

    // Initialize sequences - reset to 0 if database is empty
    this.logger.debug('Initializing sequences...');

    // Check if sequences already exist
    const existingSequences = await this.db.allAsync('SELECT type FROM sequences');

    if (existingSequences.length === 0) {
      // @ai-critical: Initial type configuration - NOT special handling
      // @ai-note: These types are pre-configured for convenience only
      // @ai-pattern: Any new type can be added with same capabilities
      const sequenceValues: string[] = [];
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
        // Note: sessions and dailies are handled separately due to special ID format
      ];

      for (const def of typeDefinitions) {
        sequenceValues.push(`('${def.type}', 0, '${def.baseType}', '${def.description.replace(/'/g, "''")}')`);
      }

      await this.db.runAsync(`INSERT INTO sequences (type, current_value, base_type, description) VALUES ${sequenceValues.join(', ')}`);

      // Add special types (sessions and dailies) that don't use sequential IDs
      await this.db.runAsync(`INSERT INTO sequences (type, current_value, base_type, description) VALUES 
        ('sessions', 0, 'sessions', 'Work session tracking. Content is optional - can be created at session start and updated later. Uses timestamp-based IDs.'),
        ('dailies', 0, 'documents', 'Daily summaries with required content. One entry per date. Uses date as ID (YYYY-MM-DD).')`);
    } else {
      // Existing database - ensure all sequences exist with descriptions
      await this.db.runAsync(`INSERT OR IGNORE INTO sequences (type, current_value, base_type, description) VALUES 
        ('issues', 0, 'tasks', 'Bug reports, feature requests, and general tasks. Includes priority, status, and timeline tracking.'),
        ('plans', 0, 'tasks', 'Project plans and milestones with start/end dates. Used for planning and tracking larger initiatives.'),
        ('knowledge', 0, 'documents', 'Knowledge base articles, best practices, and how-to guides. Searchable reference material.'),
        ('docs', 0, 'documents', 'Technical documentation, API references, and user guides. Structured content with required text.'),
        ('sessions', 0, 'sessions', 'Work session tracking. Content is optional - can be created at session start and updated later. Uses timestamp-based IDs.'),
        ('dailies', 0, 'documents', 'Daily summaries with required content. One entry per date. Uses date as ID (YYYY-MM-DD).')`);
    }

    // Search tables
    this.logger.debug('Creating search tables...');
    await this.createSearchTables();

    // Create relationship tables for tags
    this.logger.debug('Creating tag relationship tables...');
    await this.createTagRelationshipTables();

    // Create type fields table
    this.logger.debug('Creating type fields table...');
    await this.createTypeFieldsTable();

    // Create indexes
    this.logger.debug('Creating indexes...');
    await this.createIndexes();
    this.logger.debug('All tables created successfully');
  }

  private async createSearchTables(): Promise<void> {
    // Unified items table for all types (NEW)
    // @ai-pattern Dual storage strategy: JSON for speed, normalized for queries
    // @ai-why Tags/related as JSON = single query reads, matches Markdown format
    // @ai-critical JSON columns are source of truth, normalized tables are indexes
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
        tags TEXT,                     -- JSON array @ai-redundant: Also in item_tags
        related TEXT,                  -- JSON array ["type-id", ...] @ai-redundant: Also in related_items
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (type, id)
      )
    `);


    // Create FTS5 virtual table for full-text search
    await this.db.runAsync(`
      CREATE VIRTUAL TABLE IF NOT EXISTS items_fts USING fts5(
        type, title, description, content, tags
      )
    `);

    // Create index for date-based queries (mainly for sessions)
    await this.db.runAsync(`
      CREATE INDEX IF NOT EXISTS idx_items_date 
      ON items(start_date) WHERE type = 'sessions'
    `);

    // Create index for status filtering
    await this.db.runAsync(`
      CREATE INDEX IF NOT EXISTS idx_items_status 
      ON items(status_id)
    `);

    // Create index for priority filtering
    await this.db.runAsync(`
      CREATE INDEX IF NOT EXISTS idx_items_priority 
      ON items(priority)
    `);
  }

  private async createTagRelationshipTables(): Promise<void> {
    // Unified item tags relationship table (NEW)
    await this.db.runAsync(`
      CREATE TABLE IF NOT EXISTS item_tags (
        item_type TEXT NOT NULL,
        item_id TEXT NOT NULL,
        tag_id INTEGER NOT NULL,
        PRIMARY KEY (item_type, item_id, tag_id),
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      )
    `);


    // Create index for efficient tag queries
    await this.db.runAsync(`
      CREATE INDEX IF NOT EXISTS idx_item_tags_tag 
      ON item_tags(tag_id)
    `);

    // Unified related items table (normalized many-to-many relationship)
    // @ai-context Stores relationships between all items
    // @ai-pattern Normalized junction table for many-to-many relationships
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


    // Create indexes for efficient relationship queries
    await this.db.runAsync(`
      CREATE INDEX IF NOT EXISTS idx_related_source 
      ON related_items(source_type, source_id)
    `);

    await this.db.runAsync(`
      CREATE INDEX IF NOT EXISTS idx_related_target 
      ON related_items(target_type, target_id)
    `);
  }

  private async createTypeFieldsTable(): Promise<void> {
    // Type fields definition table
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

    // @ai-note: Field definitions for initial configuration types
    // @ai-critical: These are NOT special types - just pre-configured for convenience
    // @ai-pattern: Any type can have any fields - no hardcoded restrictions
    const defaultFields = [
      // Common fields for all types
      { types: ['issues', 'plans', 'docs', 'knowledge', 'sessions', 'dailies'], fields: [
        { name: 'id', type: 'string', required: true, default: '', desc: 'Unique identifier' },
        { name: 'title', type: 'string', required: true, default: '', desc: 'Title of the item' },
        { name: 'description', type: 'string', required: false, default: '', desc: 'Brief description' },
        { name: 'tags', type: 'tags', required: false, default: '[]', desc: 'Tags for categorization' },
        { name: 'created_at', type: 'date', required: true, default: '', desc: 'Creation timestamp' },
        { name: 'updated_at', type: 'date', required: true, default: '', desc: 'Last update timestamp' }
      ]},
      // Task-specific fields
      { types: ['issues', 'plans'], fields: [
        { name: 'content', type: 'text', required: true, default: '', desc: 'Main content' },
        { name: 'priority', type: 'priority', required: false, default: 'medium', desc: 'Priority level' },
        { name: 'status', type: 'status', required: false, default: 'Open', desc: 'Current status' },
        { name: 'start_date', type: 'date', required: false, default: '', desc: 'Start date' },
        { name: 'end_date', type: 'date', required: false, default: '', desc: 'End date' },
        { name: 'related_tasks', type: 'related', required: false, default: '[]', desc: 'Related tasks' },
        { name: 'related_documents', type: 'related', required: false, default: '[]', desc: 'Related documents' }
      ]},
      // Document-specific fields
      { types: ['docs', 'knowledge'], fields: [
        { name: 'content', type: 'text', required: true, default: '', desc: 'Document content' },
        { name: 'priority', type: 'priority', required: false, default: 'medium', desc: 'Document importance' },
        { name: 'status', type: 'status', required: false, default: 'Open', desc: 'Document status' },
        { name: 'related_documents', type: 'related', required: false, default: '[]', desc: 'Related documents' }
      ]},
      // Session-specific fields
      { types: ['sessions'], fields: [
        { name: 'content', type: 'text', required: false, default: '', desc: 'Session notes' },
        { name: 'related_tasks', type: 'related', required: false, default: '[]', desc: 'Related tasks' },
        { name: 'related_documents', type: 'related', required: false, default: '[]', desc: 'Related documents' }
      ]},
      // Daily-specific fields
      { types: ['dailies'], fields: [
        { name: 'content', type: 'text', required: true, default: '', desc: 'Daily summary content' },
        { name: 'related_tasks', type: 'related', required: false, default: '[]', desc: 'Related tasks' },
        { name: 'related_documents', type: 'related', required: false, default: '[]', desc: 'Related documents' }
      ]}
    ];

    // Insert field definitions
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

  private async createIndexes(): Promise<void> {
    // Tag name index for quick lookups
    await this.db.runAsync('CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name)');

    // Type index for efficient filtering
    await this.db.runAsync('CREATE INDEX IF NOT EXISTS idx_items_type ON items(type)');

    // Composite indexes for common queries
    await this.db.runAsync('CREATE INDEX IF NOT EXISTS idx_items_type_status ON items(type, status_id)');
    await this.db.runAsync('CREATE INDEX IF NOT EXISTS idx_items_type_priority ON items(type, priority)');

    // Index for tag relationships
    await this.db.runAsync('CREATE INDEX IF NOT EXISTS idx_item_tags_item ON item_tags(item_type, item_id)');

    // Index for type fields
    await this.db.runAsync('CREATE INDEX IF NOT EXISTS idx_type_fields_type ON type_fields(type)');
  }

  getDatabase(): Database {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  async close(): Promise<void> {
    if (!this.db) {
      return;
    }

    // Set flags first to prevent any new operations
    this.initializationComplete = false;
    this.initializationPromise = null;

    return new Promise((resolve) => {
      this.db.close((err) => {
        if (err) {
          this.logger.error('Error closing database:', err);
          // Don't reject - resolve anyway to avoid hanging tests
        } else {
          this.logger.debug('Database connection closed');
        }
        // Clear the db reference
        // @ai-any-deliberate: Type assertion needed to clear nullable database reference
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.db = null as any;
        resolve();
      });
    });
  }

  isInitialized(): boolean {
    return this.initializationComplete;
  }
}