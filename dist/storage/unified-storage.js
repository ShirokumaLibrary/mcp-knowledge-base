import { promises as fs } from 'fs';
import * as path from 'path';
import { parseMarkdown, generateMarkdown } from '../utils/markdown-parser.js';
import { createLogger } from '../utils/logger.js';
export class UnifiedStorage {
    dataDir;
    logger = createLogger('UnifiedStorage');
    constructor(dataDir) {
        this.dataDir = dataDir;
    }
    getFilePath(config, id) {
        let directory = path.join(this.dataDir, config.baseDir);
        if (config.useDateSubdir && config.dateExtractor) {
            const dateDir = config.dateExtractor(id);
            directory = path.join(directory, dateDir);
        }
        return path.join(directory, `${config.filePrefix}${id}.md`);
    }
    async ensureDirectory(filePath) {
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
    }
    async save(config, item) {
        const filePath = this.getFilePath(config, item.id);
        const markdown = generateMarkdown(item.metadata, item.content);
        await this.ensureDirectory(filePath);
        await fs.writeFile(filePath, markdown, 'utf-8');
        this.logger.debug(`Saved ${config.filePrefix}${item.id} to ${filePath}`);
    }
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
export const STORAGE_CONFIGS = {
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
    sessions: {
        baseDir: 'sessions',
        filePrefix: 'sessions-',
        useDateSubdir: true,
        dateExtractor: (id) => {
            return id.split('-').slice(0, 3).join('-');
        }
    },
    dailies: {
        baseDir: 'sessions/dailies',
        filePrefix: 'dailies-',
        useDateSubdir: false
    }
};
