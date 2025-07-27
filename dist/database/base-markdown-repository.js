/**
 * @ai-context Abstract base class for markdown-based repositories
 * @ai-pattern Template Method pattern for file-based persistence
 * @ai-critical Provides common functionality for all markdown repositories
 * @ai-why Reduces code duplication across issue/plan/doc/knowledge repos
 * @ai-assumption All entities use markdown files with numeric IDs
 */
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import { BaseRepository } from './base.js';
/**
 * @ai-context Generic base class for markdown file repositories
 * @ai-pattern Template Method with abstract methods for customization
 * @ai-critical Subclasses must implement parse/generate/sync methods
 * @ai-generic T must extend MarkdownEntity for type safety
 * @ai-lifecycle Create files -> Parse content -> Sync to SQLite
 */
export class BaseMarkdownRepository extends BaseRepository {
    directory; // @ai-logic: Base directory for markdown files
    sequenceName; // @ai-logic: Sequence name for ID generation
    filePrefix; // @ai-logic: File prefix (e.g., 'issue', 'plan')
    constructor(db, directory, sequenceName, filePrefix) {
        super(db);
        this.directory = directory;
        this.sequenceName = sequenceName;
        this.filePrefix = filePrefix;
        // @ai-note: Directory creation deferred to first operation
    }
    /**
     * @ai-intent Ensure storage directory exists before operations
     * @ai-flow 1. Check access -> 2. Create if missing
     * @ai-pattern Lazy directory creation
     * @ai-side-effects Creates directory structure on disk
     * @ai-why Avoids startup failures if directories don't exist
     */
    async ensureDirectoryExists() {
        try {
            await fsPromises.access(this.directory);
        }
        catch {
            await fsPromises.mkdir(this.directory, { recursive: true }); // @ai-logic: Creates parent dirs too
        }
    }
    /**
     * @ai-intent Get next sequential ID for new entity
     * @ai-flow Delegates to base class sequence management
     * @ai-critical IDs must be unique and sequential
     * @ai-return Next available ID number
     */
    async getNextId() {
        return this.getNextSequenceValue(this.sequenceName);
    }
    /**
     * @ai-intent Build file path from entity ID
     * @ai-pattern Consistent naming: prefix-id.md
     * @ai-example issue-123.md, plan-45.md
     * @ai-critical Path construction must match file reading logic
     */
    getFilePath(id) {
        return path.join(this.directory, `${this.filePrefix}-${id}.md`);
    }
    /**
     * @ai-intent Read markdown file content by ID
     * @ai-flow 1. Build path -> 2. Read file -> 3. Return content
     * @ai-error-handling Returns null for missing/unreadable files
     * @ai-return File content or null
     * @ai-why Graceful handling of missing files
     */
    async readFile(id) {
        try {
            return await fsPromises.readFile(this.getFilePath(id), 'utf8');
        }
        catch {
            return null; // @ai-logic: File doesn't exist or can't be read
        }
    }
    /**
     * @ai-intent Write entity to markdown file
     * @ai-flow 1. Generate content -> 2. Write to file
     * @ai-side-effects Creates/overwrites file on disk
     * @ai-critical Must be atomic to prevent corruption
     * @ai-assumption Entity has valid ID
     */
    async writeFile(entity) {
        const content = this.generateMarkdownContent(entity);
        await fsPromises.writeFile(this.getFilePath(entity.id), content, 'utf8');
    }
    /**
     * @ai-intent Delete markdown file by ID
     * @ai-flow 1. Build path -> 2. Delete file -> 3. Return success
     * @ai-error-handling Returns false if file doesn't exist
     * @ai-return true if deleted, false if not found
     * @ai-why Idempotent deletion (safe to call multiple times)
     */
    async deleteFile(id) {
        try {
            await fsPromises.unlink(this.getFilePath(id));
            return true;
        }
        catch {
            return false; // @ai-logic: File doesn't exist or can't be deleted
        }
    }
    /**
     * @ai-intent List all markdown files for this entity type
     * @ai-flow 1. Ensure dir -> 2. List files -> 3. Filter by pattern
     * @ai-pattern Filters by prefix and .md extension
     * @ai-return Array of filenames (not paths)
     * @ai-performance May be slow with many files
     */
    async getAllFiles() {
        await this.ensureDirectoryExists();
        const files = await fsPromises.readdir(this.directory);
        return files.filter(f => f.startsWith(this.filePrefix) && f.endsWith('.md'));
    }
    /**
     * @ai-intent Load all entities from markdown files
     * @ai-flow 1. Get files -> 2. Read in parallel -> 3. Parse -> 4. Filter nulls
     * @ai-performance Parallel reads for better performance
     * @ai-error-handling Skips corrupted files with logging
     * @ai-return Array of valid entities only
     * @ai-critical May use significant memory with many files
     */
    async readAllEntities() {
        const files = await this.getAllFiles();
        // @ai-performance: Parallel file reading
        const entityPromises = files.map(async (file) => {
            try {
                const content = await fsPromises.readFile(path.join(this.directory, file), 'utf8');
                return this.parseMarkdownContent(content);
            }
            catch (error) {
                console.error(`Error reading file ${file}:`, error); // @ai-logging: Track failures
                return null;
            }
        });
        const results = await Promise.all(entityPromises);
        // @ai-logic: Filter out nulls from failed parses
        const entities = [];
        for (const result of results) {
            if (result !== null) {
                entities.push(result);
            }
        }
        return entities;
    }
    /**
     * @ai-intent Get single entity by ID
     * @ai-flow 1. Read file -> 2. Parse content -> 3. Return entity
     * @ai-return Entity object or null if not found/invalid
     * @ai-why Common operation for all entity types
     */
    async getEntity(id) {
        const content = await this.readFile(id);
        if (!content) {
            return null;
        } // @ai-logic: File doesn't exist
        return this.parseMarkdownContent(content);
    }
    /**
     * @ai-intent Delete entity from both file system and database
     * @ai-flow 1. Delete file -> 2. If successful, delete from SQLite
     * @ai-side-effects Removes markdown file and SQLite record
     * @ai-critical Two-phase delete - file first, then DB
     * @ai-return true if file deleted (DB delete is best-effort)
     * @ai-assumption Table name matches search_[type] pattern
     */
    async deleteEntity(id, tableName) {
        const success = await this.deleteFile(id);
        if (success) {
            // @ai-logic: Only delete from DB if file deletion succeeded
            await this.db.runAsync(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
        }
        return success;
    }
}
//# sourceMappingURL=base-markdown-repository.js.map