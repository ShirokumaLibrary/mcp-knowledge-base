/**
 * @ai-context File indexing functionality for semantic code search
 * @ai-pattern Repository pattern with embedding-based search
 * @ai-lifecycle Initialize -> Index files -> Handle updates -> Search
 */

import Database from 'better-sqlite3';
import { createHash } from 'crypto';
import { readFileSync, existsSync, statSync, mkdirSync } from 'fs';
import { join, extname } from 'path';
import { execSync } from 'child_process';
import { minimatch } from 'minimatch';
import { pipeline } from '@xenova/transformers';
import { config as appConfig } from '../config.js';

/**
 * File indexing configuration
 */
export interface IndexConfig {
  projectRoot: string;
  indexPath?: string;
  maxFileSize?: number;
  chunkSize?: number;
  extensions?: string[];
  ignorePatterns?: string[];
}

/**
 * Indexed file chunk with embedding
 */
export interface FileChunk {
  id?: number;
  filePath: string;
  chunkIndex: number;
  startLine: number;
  endLine: number;
  content: string;
  embedding: number[];
  fileHash: string;
  updatedAt?: Date;
}

/**
 * Search result with similarity score
 */
export interface SearchResult {
  filePath: string;
  chunkIndex: number;
  startLine: number;
  endLine: number;
  content: string;
  similarity: number;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
  indexPath: join(appConfig.database.path, 'index.db'),
  maxFileSize: 10 * 1024 * 1024, // 10MB
  chunkSize: 30, // lines per chunk
  extensions: [
    '.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs',
    '.py', '.java', '.cpp', '.c', '.h', '.go', '.rs', '.rb', '.php',
    '.html', '.xml', '.yaml', '.yml', '.json', '.toml',
    '.md', '.txt', '.rst',
    '.env.example', '.gitignore', 'Dockerfile', 'Makefile'
  ],
  ignorePatterns: [
    '**/.git/**',
    '**/node_modules/**',
    '**/.shirokuma/**',
    '*.min.js',
    '*.min.css',
    '**/*.map',
    '**/.env',
    '**/*.key',
    '**/*.pem',
    '**/dist/**',
    '**/build/**',
    '**/coverage/**'
  ]
};

/**
 * File indexer for semantic code search
 */
export class FileIndexer {
  private db: Database.Database;
  private config: Required<IndexConfig>;
  private embedder?: any; // @xenova/transformers pipeline type
  private initialized = false;

  constructor(config: IndexConfig) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      extensions: config.extensions || DEFAULT_CONFIG.extensions,
      ignorePatterns: config.ignorePatterns || DEFAULT_CONFIG.ignorePatterns
    };

    // Initialize database path
    // If indexPath is absolute, use it directly. Otherwise join with projectRoot
    const dbPath = this.config.indexPath.startsWith('/') || this.config.indexPath.match(/^[A-Za-z]:\\/)
      ? this.config.indexPath
      : join(this.config.projectRoot, this.config.indexPath);
    
    // Ensure index directory exists
    const indexDir = dbPath.substring(0, dbPath.lastIndexOf('/'));
    if (!existsSync(indexDir)) {
      mkdirSync(indexDir, { recursive: true });
    }

    // Initialize database
    this.db = new Database(dbPath);
    this.initSchema();
  }

  /**
   * Initialize database schema
   */
  private initSchema(): void {
    // Enable foreign key constraints
    this.db.exec('PRAGMA foreign_keys = ON');
    
    // Create normalized schema
    this.db.exec(`
      -- Files table
      CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_path TEXT UNIQUE NOT NULL,
        file_hash TEXT NOT NULL,
        total_chunks INTEGER NOT NULL DEFAULT 0,
        file_size INTEGER NOT NULL DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Chunks table
      CREATE TABLE IF NOT EXISTS file_chunks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id INTEGER NOT NULL,
        chunk_index INTEGER NOT NULL,
        start_line INTEGER NOT NULL,
        end_line INTEGER NOT NULL,
        content TEXT NOT NULL,
        embedding TEXT NOT NULL,
        FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
        UNIQUE(file_id, chunk_index)
      );
      
      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_files_path ON files(file_path);
      CREATE INDEX IF NOT EXISTS idx_files_hash ON files(file_hash);
      CREATE INDEX IF NOT EXISTS idx_chunks_file_id ON file_chunks(file_id);
    `);
  }

  /**
   * Initialize the embedding model
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Load embedding model
    this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    this.initialized = true;
  }

  /**
   * Get list of files from git
   */
  private getGitFiles(): string[] {
    try {
      const output = execSync('git ls-files', {
        cwd: this.config.projectRoot,
        encoding: 'utf-8'
      });

      return output
        .split('\n')
        .filter(file => file.length > 0)
        .filter(file => this.shouldIndexFile(file));
    } catch (error) {
      // Not a git repository or git command failed
      throw new Error('Not a git repository. File indexing works with git-managed files only.');
    }
  }

  /**
   * Check if file should be indexed
   */
  private shouldIndexFile(filePath: string): boolean {
    // Check extension
    const ext = extname(filePath);
    if (ext && !this.config.extensions.includes(ext)) {
      // Check files without extension (like Dockerfile, Makefile)
      const fileName = filePath.split('/').pop() || '';
      if (!this.config.extensions.includes(fileName)) {
        return false;
      }
    }

    // Check ignore patterns
    for (const pattern of this.config.ignorePatterns) {
      if (minimatch(filePath, pattern)) {
        return false;
      }
    }

    // Check .shirokumaignore if exists
    const ignorePath = join(this.config.projectRoot, '.shirokumaignore');
    if (existsSync(ignorePath)) {
      const ignorePatterns = readFileSync(ignorePath, 'utf-8')
        .split('\n')
        .filter(line => line.trim() && !line.startsWith('#'));

      for (const pattern of ignorePatterns) {
        if (pattern.startsWith('!')) {
          // Force include
          if (minimatch(filePath, pattern.slice(1))) {
            return true;
          }
        } else {
          // Exclude
          if (minimatch(filePath, pattern)) {
            return false;
          }
        }
      }
    }

    return true;
  }

  /**
   * Calculate file hash
   */
  private getFileHash(content: string): string {
    return createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  /**
   * Chunk file content
   */
  private chunkFile(content: string, filePath: string): Omit<FileChunk, 'embedding' | 'fileHash'>[] {
    const lines = content.split('\n');
    const chunks: Omit<FileChunk, 'embedding' | 'fileHash'>[] = [];

    for (let i = 0; i < lines.length; i += this.config.chunkSize) {
      const chunkLines = lines.slice(i, i + this.config.chunkSize);
      const chunkContent = chunkLines.join('\n').trim();

      if (chunkContent.length > 10) { // Skip very small chunks
        chunks.push({
          filePath,
          chunkIndex: Math.floor(i / this.config.chunkSize),
          startLine: i,
          endLine: Math.min(i + this.config.chunkSize, lines.length),
          content: chunkContent
        });
      }
    }

    return chunks;
  }

  /**
   * Generate embedding for text
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    if (!this.embedder) {
      throw new Error('Embedder not initialized');
    }

    const output = await this.embedder(text, {
      pooling: 'mean',
      normalize: true
    });

    return Array.from(output.data as Float32Array);
  }

  /**
   * Index a single file
   */
  async indexFile(filePath: string): Promise<void> {
    const fullPath = join(this.config.projectRoot, filePath);

    // Check file size
    const stats = existsSync(fullPath) && statSync(fullPath);
    if (!stats || stats.size > this.config.maxFileSize) {
      return;
    }

    // Read file content
    const content = readFileSync(fullPath, 'utf-8');
    const fileHash = this.getFileHash(content);

    // Check if file has changed
    const existing = this.db.prepare(
      'SELECT id, file_hash FROM files WHERE file_path = ? LIMIT 1'
    ).get(filePath) as { id: number; file_hash: string } | undefined;

    if (existing && existing.file_hash === fileHash) {
      return; // File hasn't changed
    }

    // Create new chunks
    const chunks = this.chunkFile(content, filePath);

    // Generate embeddings for all chunks first (outside transaction)
    const chunksWithEmbeddings = await Promise.all(
      chunks.map(async chunk => ({
        ...chunk,
        embedding: await this.generateEmbedding(chunk.content)
      }))
    );
    
    // Transaction for atomic updates
    this.db.transaction(() => {
      let fileId: number;
      
      if (existing) {
        // Update existing file
        this.db.prepare(
          'UPDATE files SET file_hash = ?, total_chunks = ?, file_size = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).run(fileHash, chunks.length, stats.size, existing.id);
        fileId = existing.id;
        
        // Delete old chunks (cascade delete handles this with FK)
        this.db.prepare('DELETE FROM file_chunks WHERE file_id = ?').run(fileId);
      } else {
        // Insert new file
        const result = this.db.prepare(
          'INSERT INTO files (file_path, file_hash, total_chunks, file_size) VALUES (?, ?, ?, ?)'
        ).run(filePath, fileHash, chunks.length, stats.size);
        fileId = result.lastInsertRowid as number;
      }
      
      // Insert chunks with embeddings
      const insertChunk = this.db.prepare(`
        INSERT INTO file_chunks 
        (file_id, chunk_index, start_line, end_line, content, embedding)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      for (const chunk of chunksWithEmbeddings) {
        insertChunk.run(
          fileId,
          chunk.chunkIndex,
          chunk.startLine,
          chunk.endLine,
          chunk.content,
          JSON.stringify(chunk.embedding)
        );
      }
    })();
  }

  /**
   * Index all files in the project
   */
  async indexAll(onProgress?: (file: string, current: number, total: number) => void): Promise<void> {
    await this.initialize();

    const files = this.getGitFiles();
    
    // Clean up deleted files
    this.cleanupDeletedFiles(files);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (onProgress) {
        onProgress(file, i + 1, files.length);
      }

      try {
        await this.indexFile(file);
      } catch (error) {
        console.error(`Error indexing ${file}:`, error);
      }
    }
  }

  /**
   * Remove entries for files that no longer exist in Git
   */
  private cleanupDeletedFiles(currentFiles: string[]): void {
    const currentFilesSet = new Set(currentFiles);
    
    // Get all indexed files
    const indexedFiles = this.db.prepare(
      'SELECT id, file_path FROM files'
    ).all() as { id: number; file_path: string }[];
    
    // Find and remove deleted files
    // CASCADE DELETE will automatically remove associated chunks
    const deleteStmt = this.db.prepare('DELETE FROM files WHERE id = ?');
    let deletedCount = 0;
    
    for (const { id, file_path } of indexedFiles) {
      if (!currentFilesSet.has(file_path)) {
        deleteStmt.run(id);
        deletedCount++;
      }
    }
    
    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} deleted files from index`);
    }
  }

  /**
   * Search for similar code
   */
  async search(query: string, options?: {
    limit?: number;
    fileTypes?: string[];
    minScore?: number;
  }): Promise<SearchResult[]> {
    await this.initialize();

    const limit = options?.limit || 10;
    const minScore = options?.minScore || 0.3;

    // Generate query embedding
    const queryEmbedding = await this.generateEmbedding(query);

    // Get all chunks with file information
    let sql = `
      SELECT 
        f.file_path,
        c.chunk_index,
        c.start_line,
        c.end_line,
        c.content,
        c.embedding
      FROM file_chunks c
      JOIN files f ON c.file_id = f.id
    `;
    const params: string[] = [];

    if (options?.fileTypes && options.fileTypes.length > 0) {
      // Build WHERE clause for file types
      sql += ` WHERE ${options.fileTypes.map(() => 'f.file_path LIKE ?').join(' OR ')}`;
      params.push(...options.fileTypes.map(type => `%.${type}`));
    }

    interface ChunkRow {
      file_path: string;
      chunk_index: number;
      start_line: number;
      end_line: number;
      content: string;
      embedding: string;
    }
    const chunks = this.db.prepare(sql).all(...params) as ChunkRow[];

    // Calculate similarities
    const results: SearchResult[] = chunks
      .map(chunk => {
        const embedding = JSON.parse(chunk.embedding) as number[];
        const similarity = this.cosineSimilarity(queryEmbedding, embedding);

        return {
          filePath: chunk.file_path,
          chunkIndex: chunk.chunk_index,
          startLine: chunk.start_line,
          endLine: chunk.end_line,
          content: chunk.content,
          similarity
        };
      })
      .filter(result => result.similarity >= minScore)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return results;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    let dotProduct = 0;
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
    }
    return dotProduct; // Vectors are already normalized
  }

  /**
   * Get index statistics
   */
  getStats(): {
    totalFiles: number;
    totalChunks: number;
    indexSize: number;
    } {
    const fileStats = this.db.prepare(`
      SELECT COUNT(*) as total_files FROM files
    `).get() as { total_files: number };
    
    const chunkStats = this.db.prepare(`
      SELECT COUNT(*) as total_chunks FROM file_chunks
    `).get() as { total_chunks: number };

    return {
      totalFiles: fileStats.total_files || 0,
      totalChunks: chunkStats.total_chunks || 0,
      indexSize: existsSync(join(this.config.projectRoot, this.config.indexPath))
        ? statSync(join(this.config.projectRoot, this.config.indexPath)).size
        : 0
    };
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}