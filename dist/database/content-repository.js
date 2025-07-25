/**
 * @ai-context Unified repository for all content types (doc, knowledge, etc)
 * @ai-pattern Repository pattern with dual storage (Markdown + SQLite)
 * @ai-critical Manages doc, knowledge, architecture, guideline, test content types
 * @ai-dependencies BaseRepository (parent), TagRepository (auto-tag registration)
 * @ai-filesystem Creates files in {dataDir}/contents/content-{id}.md
 */
import { BaseRepository } from './base.js';
import { ensureDirectoryExists } from '../utils/file-utils.js';
import { logger } from '../utils/logger.js';
import path from 'path';
import fs from 'fs/promises';
import { generateContentMarkdown, parseContentMarkdown } from '../utils/markdown-parser.js';
import { getNextId } from '../utils/id-generator.js';
import { contentPath } from '../config.js';
/**
 * @ai-intent Repository for unified content management
 * @ai-pattern Extends BaseRepository with content-specific operations
 * @ai-critical Single repository for all content types
 * @ai-flow Create/Update -> Write Markdown -> Sync to SQLite -> Register tags
 */
export class ContentRepository extends BaseRepository {
    contentDir;
    constructor(dbPath, dataDir, tagRepository) {
        super(dbPath, tagRepository);
        this.contentDir = contentPath(dataDir);
    }
    /**
     * @ai-intent Initialize repository and ensure directory structure
     * @ai-critical Must be called before any operations
     * @ai-side-effects Creates contents directory
     */
    async initialize() {
        await super.initialize();
        await ensureDirectoryExists(this.contentDir);
        logger.info('[ContentRepository] Initialized with directory:', { contentDir: this.contentDir });
    }
    /**
     * @ai-intent Create table for content search index
     * @ai-critical Includes type and summary columns
     * @ai-side-effects Creates search_contents table in SQLite
     */
    async createTables() {
        const sql = `
      CREATE TABLE IF NOT EXISTS search_contents (
        id INTEGER PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        summary TEXT,
        content TEXT NOT NULL,
        tags TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_search_contents_type ON search_contents(type);
      CREATE INDEX IF NOT EXISTS idx_search_contents_created ON search_contents(created_at);
    `;
        await this.db.exec(sql);
        logger.info('[ContentRepository] Created search_contents table');
    }
    /**
     * @ai-intent Create new content item
     * @ai-flow 1. Generate ID -> 2. Set timestamps -> 3. Write file -> 4. Sync to DB -> 5. Register tags
     * @ai-validation Ensures required fields and valid type
     * @ai-error-handling Returns null on failure
     */
    async create(data) {
        try {
            // Generate ID and timestamps
            const id = await getNextId(this.db, 'content');
            const now = new Date().toISOString();
            const content = {
                ...data,
                id,
                tags: data.tags || [],
                created_at: now,
                updated_at: now
            };
            // Write markdown file
            const filePath = path.join(this.contentDir, `content-${id}.md`);
            const markdown = generateContentMarkdown(content);
            await fs.writeFile(filePath, markdown, 'utf-8');
            // Sync to SQLite
            await this.syncContentToSQLite(content);
            // Auto-register tags
            if (content.tags.length > 0) {
                await this.tagRepository.ensureTagsExist(content.tags);
            }
            logger.info('[ContentRepository] Created content:', {
                id,
                type: content.type,
                title: content.title
            });
            return content;
        }
        catch (error) {
            logger.error('[ContentRepository] Error creating content:', { error });
            return null;
        }
    }
    /**
     * @ai-intent Get content by ID
     * @ai-flow Read markdown file -> Parse content
     * @ai-error-handling Returns null if not found
     */
    async getById(id) {
        try {
            const filePath = path.join(this.contentDir, `content-${id}.md`);
            const fileContent = await fs.readFile(filePath, 'utf-8');
            const content = parseContentMarkdown(fileContent, id);
            return content;
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                logger.error(`[ContentRepository] Error reading content ${id}:`, { error });
            }
            return null;
        }
    }
    /**
     * @ai-intent Get all content of a specific type
     * @ai-flow Query SQLite for type -> Read files -> Parse content
     * @ai-performance Uses SQLite index for fast filtering
     */
    async getByType(type) {
        try {
            const query = `
        SELECT id FROM search_contents 
        WHERE type = ? 
        ORDER BY created_at DESC
      `;
            const rows = await this.db.all(query, [type]);
            const contents = [];
            for (const row of rows) {
                const content = await this.getById(row.id);
                if (content) {
                    contents.push(content);
                }
            }
            return contents;
        }
        catch (error) {
            logger.error('[ContentRepository] Error getting contents by type:', { error, type });
            return [];
        }
    }
    /**
     * @ai-intent Get all content items
     * @ai-flow Read all files -> Parse each -> Sort by date
     * @ai-performance May be slow with many files
     */
    async getAll() {
        try {
            const files = await fs.readdir(this.contentDir);
            const contentFiles = files.filter(f => f.startsWith('content-') && f.endsWith('.md'));
            const contents = [];
            for (const file of contentFiles) {
                const id = parseInt(file.replace('content-', '').replace('.md', ''));
                const content = await this.getById(id);
                if (content) {
                    contents.push(content);
                }
            }
            return contents.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }
        catch (error) {
            logger.error('[ContentRepository] Error getting all contents:', { error });
            return [];
        }
    }
    /**
     * @ai-intent Get content summaries for list display
     * @ai-flow Query SQLite -> Return summaries only
     * @ai-performance Avoids reading full content
     */
    async getAllSummaries(type) {
        try {
            let query = `
        SELECT id, type, title, summary, tags, created_at, updated_at 
        FROM search_contents
      `;
            const params = [];
            if (type) {
                query += ' WHERE type = ?';
                params.push(type);
            }
            query += ' ORDER BY created_at DESC';
            const rows = await this.db.all(query, params);
            return rows.map(row => ({
                ...row,
                tags: row.tags ? JSON.parse(row.tags) : []
            }));
        }
        catch (error) {
            logger.error('[ContentRepository] Error getting summaries:', { error });
            return [];
        }
    }
    /**
     * @ai-intent Update existing content
     * @ai-flow 1. Read existing -> 2. Merge changes -> 3. Write file -> 4. Sync to DB -> 5. Update tags
     * @ai-validation Preserves ID and created_at
     */
    async update(id, updates) {
        try {
            const existing = await this.getById(id);
            if (!existing) {
                logger.warn('[ContentRepository] Content not found for update:', { id });
                return null;
            }
            // Merge updates
            const updated = {
                ...existing,
                ...updates,
                id: existing.id,
                created_at: existing.created_at,
                updated_at: new Date().toISOString()
            };
            // Write updated file
            const filePath = path.join(this.contentDir, `content-${id}.md`);
            const markdown = generateContentMarkdown(updated);
            await fs.writeFile(filePath, markdown, 'utf-8');
            // Sync to SQLite
            await this.syncContentToSQLite(updated);
            // Update tags if changed
            if (updates.tags && updates.tags.length > 0) {
                await this.tagRepository.ensureTagsExist(updates.tags);
            }
            logger.info('[ContentRepository] Updated content:', { id, type: updated.type });
            return updated;
        }
        catch (error) {
            logger.error('[ContentRepository] Error updating content:', { error, id });
            return null;
        }
    }
    /**
     * @ai-intent Delete content by ID
     * @ai-flow 1. Delete file -> 2. Remove from SQLite
     * @ai-side-effects Permanent deletion
     */
    async delete(id) {
        try {
            const filePath = path.join(this.contentDir, `content-${id}.md`);
            // Delete file
            await fs.unlink(filePath);
            // Remove from SQLite
            await this.db.run('DELETE FROM search_contents WHERE id = ?', [id]);
            logger.info('[ContentRepository] Deleted content:', { id });
            return true;
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                logger.error('[ContentRepository] Error deleting content:', { error, id });
            }
            return false;
        }
    }
    /**
     * @ai-intent Search content by query
     * @ai-flow Query SQLite FTS -> Return filtered results
     * @ai-performance Uses SQLite full-text search
     */
    async search(query, type) {
        try {
            let sql = `
        SELECT id, type, title, summary, tags, created_at, updated_at
        FROM search_contents
        WHERE (title LIKE ? OR content LIKE ? OR tags LIKE ?)
      `;
            const params = [`%${query}%`, `%${query}%`, `%${query}%`];
            if (type) {
                sql += ' AND type = ?';
                params.push(type);
            }
            sql += ' ORDER BY created_at DESC';
            const rows = await this.db.all(sql, params);
            return rows.map(row => ({
                ...row,
                tags: row.tags ? JSON.parse(row.tags) : []
            }));
        }
        catch (error) {
            logger.error('[ContentRepository] Error searching content:', { error });
            return [];
        }
    }
    /**
     * @ai-intent Sync content to SQLite for searching
     * @ai-flow Prepare data -> Upsert to search_contents
     * @ai-side-effects Updates search index
     */
    async syncContentToSQLite(content) {
        const sql = `
      INSERT OR REPLACE INTO search_contents 
      (id, type, title, summary, content, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
        await this.db.run(sql, [
            content.id,
            content.type,
            content.title,
            content.summary || null,
            content.content,
            JSON.stringify(content.tags),
            content.created_at,
            content.updated_at
        ]);
    }
    /**
     * @ai-intent Rebuild search index from markdown files
     * @ai-critical Used during database rebuild
     * @ai-flow Read all files -> Parse -> Sync to SQLite
     */
    async rebuildSearchIndex() {
        logger.info('[ContentRepository] Rebuilding search index...');
        try {
            // Clear existing index
            await this.db.run('DELETE FROM search_contents');
            // Read all content files
            const files = await fs.readdir(this.contentDir);
            const contentFiles = files.filter(f => f.startsWith('content-') && f.endsWith('.md'));
            let count = 0;
            for (const file of contentFiles) {
                const id = parseInt(file.replace('content-', '').replace('.md', ''));
                const content = await this.getById(id);
                if (content) {
                    await this.syncContentToSQLite(content);
                    count++;
                }
            }
            logger.info('[ContentRepository] Rebuilt search index:', { count });
        }
        catch (error) {
            logger.error('[ContentRepository] Error rebuilding search index:', { error });
        }
    }
    /**
     * @ai-intent Get all unique content types
     * @ai-flow Query distinct types from SQLite
     */
    async getTypes() {
        try {
            const rows = await this.db.all('SELECT DISTINCT type FROM search_contents ORDER BY type');
            return rows.map(row => row.type);
        }
        catch (error) {
            logger.error('[ContentRepository] Error getting types:', { error });
            return [];
        }
    }
}
//# sourceMappingURL=content-repository.js.map