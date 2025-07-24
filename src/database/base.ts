import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import winston from 'winston';
import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from '../utils/logger.js';

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
export abstract class BaseRepository {
  protected db: Database;
  protected logger: winston.Logger;

  constructor(db: Database, loggerName?: string) {
    this.db = db;
    this.logger = createLogger(loggerName || this.constructor.name);
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
        `UPDATE sequences SET current_value = current_value + 1 WHERE name = ?`, 
        [sequenceName]
      );
      
      const row = await this.db.getAsync(
        `SELECT current_value FROM sequences WHERE name = ?`, 
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
    this.db.runAsync = (sql: string, params?: any[]): Promise<sqlite3.RunResult> => {
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
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tag management table
    this.logger.debug('Creating tags table...');
    await this.db.runAsync(`
      CREATE TABLE IF NOT EXISTS tags (
        name TEXT PRIMARY KEY,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Sequence management table
    this.logger.debug('Creating sequences table...');
    await this.db.runAsync(`
      CREATE TABLE IF NOT EXISTS sequences (
        name TEXT PRIMARY KEY,
        current_value INTEGER DEFAULT 1
      )
    `);

    // Insert default statuses
    this.logger.debug('Inserting default statuses...');
    await this.db.runAsync(`INSERT OR IGNORE INTO statuses (name) VALUES 
      ('Open'), ('In Progress'), ('Review'), ('Completed'), ('Closed'), ('On Hold')`);
    
    // Initialize sequences - reset to 0 if database is empty
    this.logger.debug('Initializing sequences...');
    
    // Check if sequences already exist
    const existingSequences = await this.db.allAsync(`SELECT name FROM sequences`);
    
    if (existingSequences.length === 0) {
      // Fresh database - insert new sequences starting at 0
      await this.db.runAsync(`INSERT INTO sequences (name, current_value) VALUES 
        ('issues', 0), ('plans', 0), ('knowledge', 0), ('docs', 0)`);
    } else {
      // Existing database - ensure all sequences exist
      await this.db.runAsync(`INSERT OR IGNORE INTO sequences (name, current_value) VALUES 
        ('issues', 0), ('plans', 0), ('knowledge', 0), ('docs', 0)`);
    }

    // Search tables
    this.logger.debug('Creating search tables...');
    await this.createSearchTables();

    // Create indexes
    this.logger.debug('Creating final index...');
    await this.db.runAsync(`CREATE INDEX IF NOT EXISTS idx_knowledge_tags ON search_knowledge(tags)`);
    this.logger.debug('All tables created successfully');
  }

  private async createSearchTables(): Promise<void> {
    // Issues search table
    await this.db.runAsync(`
      CREATE TABLE IF NOT EXISTS search_issues (
        id INTEGER PRIMARY KEY,
        title TEXT,
        content TEXT,
        priority TEXT,
        status_id INTEGER,
        tags TEXT,
        created_at TEXT,
        updated_at TEXT
      )
    `);

    // Plans search table  
    await this.db.runAsync(`
      CREATE TABLE IF NOT EXISTS search_plans (
        id INTEGER PRIMARY KEY,
        title TEXT,
        content TEXT,
        priority TEXT,
        status_id INTEGER,
        start_date TEXT,
        end_date TEXT,
        tags TEXT,
        created_at TEXT,
        updated_at TEXT
      )
    `);

    // Knowledge search table
    await this.db.runAsync(`
      CREATE TABLE IF NOT EXISTS search_knowledge (
        id INTEGER PRIMARY KEY,
        title TEXT,
        content TEXT,
        tags TEXT,
        created_at TEXT,
        updated_at TEXT
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

    // Docs search table
    await this.db.runAsync(`
      CREATE TABLE IF NOT EXISTS search_docs (
        id INTEGER PRIMARY KEY,
        title TEXT,
        content TEXT,
        tags TEXT,
        created_at TEXT,
        updated_at TEXT
      )
    `);

    // Create indexes
    await this.db.runAsync(`CREATE INDEX IF NOT EXISTS idx_issues_text ON search_issues(title, content)`);
    await this.db.runAsync(`CREATE INDEX IF NOT EXISTS idx_plans_text ON search_plans(title, content)`);
    await this.db.runAsync(`CREATE INDEX IF NOT EXISTS idx_knowledge_text ON search_knowledge(title, content)`);
    await this.db.runAsync(`CREATE INDEX IF NOT EXISTS idx_sessions_text ON search_sessions(title, content, summary)`);
    await this.db.runAsync(`CREATE INDEX IF NOT EXISTS idx_summaries_text ON search_daily_summaries(title, content)`);
    await this.db.runAsync(`CREATE INDEX IF NOT EXISTS idx_docs_text ON search_docs(title, content)`);
    await this.db.runAsync(`CREATE INDEX IF NOT EXISTS idx_issues_tags ON search_issues(tags)`);
    await this.db.runAsync(`CREATE INDEX IF NOT EXISTS idx_plans_tags ON search_plans(tags)`);
    await this.db.runAsync(`CREATE INDEX IF NOT EXISTS idx_sessions_tags ON search_sessions(tags)`);
    await this.db.runAsync(`CREATE INDEX IF NOT EXISTS idx_summaries_tags ON search_daily_summaries(tags)`);
    await this.db.runAsync(`CREATE INDEX IF NOT EXISTS idx_docs_tags ON search_docs(tags)`);
  }

  getDatabase(): Database {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  isInitialized(): boolean {
    return this.initializationComplete;
  }

  close(): void {
    if (this.db) {
      this.db.close();
    }
  }
}