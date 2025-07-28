/**
 * @ai-context Unified storage layer for all markdown-based entities
 * @ai-pattern Strategy pattern for different storage configurations
 * @ai-critical Central file I/O handling with consistent error handling
 * @ai-why Eliminates duplicate file handling logic across repositories
 */
import { promises as fs } from 'fs';
import * as path from 'path';
import { parseMarkdown, generateMarkdown } from '../utils/markdown-parser.js';
import { createLogger } from '../utils/logger.js';
/**
 * @ai-context Unified storage for markdown files
 * @ai-pattern Facade pattern hiding file system complexity
 * @ai-critical All file I/O goes through this layer
 */
export class UnifiedStorage {
    dataDir;
    logger = createLogger('UnifiedStorage');
    constructor(dataDir) {
        this.dataDir = dataDir;
    }
    /**
     * @ai-intent Build file path based on storage configuration
     * @ai-flow 1. Extract date if needed -> 2. Build directory path -> 3. Append filename
     */
    getFilePath(config, id) {
        let directory = path.join(this.dataDir, config.baseDir);
        if (config.useDateSubdir && config.dateExtractor) {
            const dateDir = config.dateExtractor(id);
            directory = path.join(directory, dateDir);
        }
        return path.join(directory, `${config.filePrefix}${id}.md`);
    }
    /**
     * @ai-intent Ensure directory exists before writing
     * @ai-side-effects Creates directories if they don't exist
     */
    async ensureDirectory(filePath) {
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
    }
    /**
     * @ai-intent Save item to markdown file
     * @ai-flow 1. Generate markdown -> 2. Ensure directory -> 3. Write file
     * @ai-side-effects Creates directories and writes file
     */
    async save(config, item) {
        const filePath = this.getFilePath(config, item.id);
        const markdown = generateMarkdown(item.metadata, item.content);
        await this.ensureDirectory(filePath);
        await fs.writeFile(filePath, markdown, 'utf-8');
        this.logger.debug(`Saved ${config.filePrefix}${item.id} to ${filePath}`);
    }
    /**
     * @ai-intent Load item from markdown file
     * @ai-flow 1. Build path -> 2. Read file -> 3. Parse markdown
     * @ai-return null if file doesn't exist
     */
    async load(config, id) {
        const filePath = this.getFilePath(config, id);
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const parsed = parseMarkdown(content);
            return {
                id,
                metadata: parsed.metadata,
                content: parsed.content
            };
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                this.logger.debug(`File not found: ${filePath}`);
                return null;
            }
            throw error;
        }
    }
    /**
     * @ai-intent Delete item file
     * @ai-side-effects Removes file from filesystem
     */
    async delete(config, id) {
        const filePath = this.getFilePath(config, id);
        try {
            await fs.unlink(filePath);
            this.logger.debug(`Deleted ${filePath}`);
            return true;
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                return false;
            }
            throw error;
        }
    }
    /**
     * @ai-intent Check if item exists
     */
    async exists(config, id) {
        const filePath = this.getFilePath(config, id);
        try {
            await fs.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * @ai-intent List all items in a directory
     * @ai-flow 1. Read directory -> 2. Filter by prefix -> 3. Extract IDs
     */
    async list(config, dateDir) {
        let directory = path.join(this.dataDir, config.baseDir);
        if (config.useDateSubdir && dateDir) {
            directory = path.join(directory, dateDir);
        }
        try {
            const files = await fs.readdir(directory);
            const prefix = config.filePrefix;
            const suffix = '.md';
            return files
                .filter(file => file.startsWith(prefix) && file.endsWith(suffix))
                .map(file => file.slice(prefix.length, -suffix.length));
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                return [];
            }
            throw error;
        }
    }
    /**
     * @ai-intent List all date directories
     * @ai-return Array of date directory names (YYYY-MM-DD format)
     */
    async listDateDirs(config) {
        if (!config.useDateSubdir) {
            return [];
        }
        const directory = path.join(this.dataDir, config.baseDir);
        try {
            const entries = await fs.readdir(directory, { withFileTypes: true });
            return entries
                .filter(entry => entry.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(entry.name))
                .map(entry => entry.name)
                .sort();
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                return [];
            }
            throw error;
        }
    }
    /**
     * @ai-intent Search for items containing text
     * @ai-flow 1. List all items -> 2. Load each -> 3. Check content
     * @ai-performance O(n) where n is total item count
     */
    async search(config, predicate) {
        const results = [];
        if (config.useDateSubdir) {
            const dateDirs = await this.listDateDirs(config);
            for (const dateDir of dateDirs) {
                const ids = await this.list(config, dateDir);
                for (const id of ids) {
                    const item = await this.load(config, id);
                    if (item && predicate(item)) {
                        results.push(item);
                    }
                }
            }
        }
        else {
            const ids = await this.list(config);
            for (const id of ids) {
                const item = await this.load(config, id);
                if (item && predicate(item)) {
                    results.push(item);
                }
            }
        }
        return results;
    }
    /**
     * @ai-intent Move item to new location (for migrations)
     * @ai-flow 1. Load from old location -> 2. Save to new location -> 3. Delete old
     */
    async move(oldConfig, newConfig, id) {
        const item = await this.load(oldConfig, id);
        if (!item) {
            return false;
        }
        await this.save(newConfig, item);
        await this.delete(oldConfig, id);
        return true;
    }
}
// Common storage configurations
export const STORAGE_CONFIGS = {
    // Task types - no date subdirectories
    issues: {
        baseDir: 'issues',
        filePrefix: 'issues-',
        useDateSubdir: false
    },
    plans: {
        baseDir: 'plans',
        filePrefix: 'plans-',
        useDateSubdir: false
    },
    // Document types - no date subdirectories
    docs: {
        baseDir: 'docs',
        filePrefix: 'docs-',
        useDateSubdir: false
    },
    knowledge: {
        baseDir: 'knowledge',
        filePrefix: 'knowledge-',
        useDateSubdir: false
    },
    // Session type - uses date subdirectories
    sessions: {
        baseDir: 'sessions',
        filePrefix: 'sessions-',
        useDateSubdir: true,
        dateExtractor: (id) => {
            // Extract date from session ID: YYYY-MM-DD-HH.MM.SS.sss
            return id.split('-').slice(0, 3).join('-');
        }
    },
    // Daily summaries - under sessions directory
    dailies: {
        baseDir: 'sessions/dailies',
        filePrefix: 'dailies-',
        useDateSubdir: false
    }
};
//# sourceMappingURL=unified-storage.js.map