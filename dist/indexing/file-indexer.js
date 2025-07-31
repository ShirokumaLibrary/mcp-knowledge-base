import Database from 'better-sqlite3';
import { createHash } from 'crypto';
import { readFileSync, existsSync, statSync, mkdirSync } from 'fs';
import { join, extname } from 'path';
import { execSync } from 'child_process';
import { minimatch } from 'minimatch';
import { pipeline } from '@xenova/transformers';
import { config as appConfig } from '../config.js';
const DEFAULT_CONFIG = {
    indexPath: join(appConfig.database.path, 'index.db'),
    maxFileSize: 10 * 1024 * 1024,
    chunkSize: 30,
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
export class FileIndexer {
    db;
    config;
    embedder;
    initialized = false;
    constructor(config) {
        this.config = {
            ...DEFAULT_CONFIG,
            ...config,
            extensions: config.extensions || DEFAULT_CONFIG.extensions,
            ignorePatterns: config.ignorePatterns || DEFAULT_CONFIG.ignorePatterns
        };
        const dbPath = this.config.indexPath.startsWith('/') || this.config.indexPath.match(/^[A-Za-z]:\\/)
            ? this.config.indexPath
            : join(this.config.projectRoot, this.config.indexPath);
        const indexDir = dbPath.substring(0, dbPath.lastIndexOf('/'));
        if (!existsSync(indexDir)) {
            mkdirSync(indexDir, { recursive: true });
        }
        this.db = new Database(dbPath);
        this.initSchema();
    }
    initSchema() {
        this.db.exec('PRAGMA foreign_keys = ON');
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
    async initialize() {
        if (this.initialized) {
            return;
        }
        this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        this.initialized = true;
    }
    getGitFiles() {
        try {
            const output = execSync('git ls-files', {
                cwd: this.config.projectRoot,
                encoding: 'utf-8'
            });
            return output
                .split('\n')
                .filter(file => file.length > 0)
                .filter(file => this.shouldIndexFile(file));
        }
        catch {
            return [];
        }
    }
    shouldIndexFile(filePath) {
        const ext = extname(filePath);
        if (ext && !this.config.extensions.includes(ext)) {
            const fileName = filePath.split('/').pop() || '';
            if (!this.config.extensions.includes(fileName)) {
                return false;
            }
        }
        for (const pattern of this.config.ignorePatterns) {
            if (minimatch(filePath, pattern)) {
                return false;
            }
        }
        const ignorePath = join(this.config.projectRoot, '.shirokumaignore');
        if (existsSync(ignorePath)) {
            const ignorePatterns = readFileSync(ignorePath, 'utf-8')
                .split('\n')
                .filter(line => line.trim() && !line.startsWith('#'));
            for (const pattern of ignorePatterns) {
                if (pattern.startsWith('!')) {
                    if (minimatch(filePath, pattern.slice(1))) {
                        return true;
                    }
                }
                else {
                    if (minimatch(filePath, pattern)) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    getFileHash(content) {
        return createHash('sha256').update(content).digest('hex').substring(0, 16);
    }
    chunkFile(content, filePath) {
        const lines = content.split('\n');
        const chunks = [];
        for (let i = 0; i < lines.length; i += this.config.chunkSize) {
            const chunkLines = lines.slice(i, i + this.config.chunkSize);
            const chunkContent = chunkLines.join('\n').trim();
            if (chunkContent.length > 10) {
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
    async generateEmbedding(text) {
        if (!this.embedder) {
            throw new Error('Embedder not initialized');
        }
        const output = await this.embedder(text, {
            pooling: 'mean',
            normalize: true
        });
        return Array.from(output.data);
    }
    async indexFile(filePath) {
        const fullPath = join(this.config.projectRoot, filePath);
        const stats = existsSync(fullPath) && statSync(fullPath);
        if (!stats || stats.size > this.config.maxFileSize) {
            return;
        }
        const content = readFileSync(fullPath, 'utf-8');
        const fileHash = this.getFileHash(content);
        const existing = this.db.prepare('SELECT id, file_hash FROM files WHERE file_path = ? LIMIT 1').get(filePath);
        if (existing && existing.file_hash === fileHash) {
            return;
        }
        const chunks = this.chunkFile(content, filePath);
        const chunksWithEmbeddings = await Promise.all(chunks.map(async (chunk) => ({
            ...chunk,
            embedding: await this.generateEmbedding(chunk.content)
        })));
        this.db.transaction(() => {
            let fileId;
            if (existing) {
                this.db.prepare('UPDATE files SET file_hash = ?, total_chunks = ?, file_size = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(fileHash, chunks.length, stats.size, existing.id);
                fileId = existing.id;
                this.db.prepare('DELETE FROM file_chunks WHERE file_id = ?').run(fileId);
            }
            else {
                const result = this.db.prepare('INSERT INTO files (file_path, file_hash, total_chunks, file_size) VALUES (?, ?, ?, ?)').run(filePath, fileHash, chunks.length, stats.size);
                fileId = result.lastInsertRowid;
            }
            const insertChunk = this.db.prepare(`
        INSERT INTO file_chunks 
        (file_id, chunk_index, start_line, end_line, content, embedding)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
            for (const chunk of chunksWithEmbeddings) {
                insertChunk.run(fileId, chunk.chunkIndex, chunk.startLine, chunk.endLine, chunk.content, JSON.stringify(chunk.embedding));
            }
        })();
    }
    async indexAll(onProgress) {
        await this.initialize();
        const files = this.getGitFiles();
        this.cleanupDeletedFiles(files);
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (onProgress) {
                onProgress(file, i + 1, files.length);
            }
            try {
                await this.indexFile(file);
            }
            catch (error) {
                console.error(`Error indexing ${file}:`, error);
            }
        }
    }
    cleanupDeletedFiles(currentFiles) {
        const currentFilesSet = new Set(currentFiles);
        const indexedFiles = this.db.prepare('SELECT id, file_path FROM files').all();
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
    async search(query, options) {
        await this.initialize();
        const limit = options?.limit || 10;
        const minScore = options?.minScore || 0.3;
        const queryEmbedding = await this.generateEmbedding(query);
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
        const params = [];
        if (options?.fileTypes && options.fileTypes.length > 0) {
            sql += ` WHERE ${options.fileTypes.map(() => 'f.file_path LIKE ?').join(' OR ')}`;
            params.push(...options.fileTypes.map(type => `%.${type}`));
        }
        const chunks = this.db.prepare(sql).all(...params);
        const results = chunks
            .map(chunk => {
            const embedding = JSON.parse(chunk.embedding);
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
    cosineSimilarity(vec1, vec2) {
        let dotProduct = 0;
        for (let i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
        }
        return dotProduct;
    }
    getStats() {
        const fileStats = this.db.prepare(`
      SELECT COUNT(*) as total_files FROM files
    `).get();
        const chunkStats = this.db.prepare(`
      SELECT COUNT(*) as total_chunks FROM file_chunks
    `).get();
        return {
            totalFiles: fileStats.total_files || 0,
            totalChunks: chunkStats.total_chunks || 0,
            indexSize: existsSync(join(this.config.projectRoot, this.config.indexPath))
                ? statSync(join(this.config.projectRoot, this.config.indexPath)).size
                : 0
        };
    }
    close() {
        this.db.close();
    }
}
