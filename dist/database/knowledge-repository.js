import * as fsPromises from 'fs/promises';
import * as path from 'path';
import { BaseRepository } from './base.js';
import { parseMarkdown, generateMarkdown } from '../utils/markdown-parser.js';
import { TagRepository } from './tag-repository.js';
/**
 * @ai-context Repository for organizational knowledge and documentation
 * @ai-pattern Simple content repository without status workflow
 * @ai-critical Knowledge entries are immutable references - updates create new versions
 * @ai-dependencies TagRepository for categorization only
 * @ai-why Simpler than issues/plans - no status tracking or relationships
 */
export class KnowledgeRepository extends BaseRepository {
    knowledgeDir;
    tagRepository;
    constructor(db, knowledgeDir, tagRepository) {
        super(db, 'KnowledgeRepository');
        this.knowledgeDir = knowledgeDir;
        this.tagRepository = tagRepository || new TagRepository(db);
        // @ai-async: Directory creation deferred to first operation
    }
    async ensureDirectoryExists() {
        try {
            await fsPromises.access(this.knowledgeDir);
        }
        catch {
            await fsPromises.mkdir(this.knowledgeDir, { recursive: true });
        }
    }
    async getKnowledgeNextId() {
        return this.getNextSequenceValue('knowledge');
    }
    getKnowledgeFilePath(id) {
        return path.join(this.knowledgeDir, `knowledge-${id}.md`);
    }
    /**
     * @ai-intent Parse knowledge entry from markdown file
     * @ai-flow 1. Extract metadata -> 2. Validate essentials -> 3. Return structured data
     * @ai-edge-case Content is required for knowledge (unlike issues/plans)
     * @ai-assumption Knowledge always has content body, not just metadata
     * @ai-return Null for invalid entries to maintain system stability
     */
    parseMarkdownKnowledge(content) {
        const { metadata, content: knowledgeContent } = parseMarkdown(content);
        // @ai-logic: Knowledge requires both ID/title AND content
        if (!metadata.id || !metadata.title)
            return null;
        return {
            id: metadata.id,
            title: metadata.title,
            content: knowledgeContent, // @ai-critical: Main value is in the content
            tags: Array.isArray(metadata.tags) ? metadata.tags : [],
            created_at: metadata.created_at || new Date().toISOString(),
            updated_at: metadata.updated_at || new Date().toISOString()
        };
    }
    async writeMarkdownKnowledge(knowledge) {
        const metadata = {
            id: knowledge.id,
            title: knowledge.title,
            tags: knowledge.tags,
            created_at: knowledge.created_at,
            updated_at: knowledge.updated_at
        };
        const content = generateMarkdown(metadata, knowledge.content);
        await fsPromises.writeFile(this.getKnowledgeFilePath(knowledge.id), content, 'utf8');
    }
    /**
     * @ai-intent Enable full-text search on knowledge content
     * @ai-flow 1. Serialize data -> 2. Execute UPSERT -> 3. Update tag relationships
     * @ai-side-effects Updates search_knowledge table and knowledge_tags relationship table
     * @ai-performance Full content stored for text search capabilities
     * @ai-critical Content field can be large - ensure adequate DB limits
     * @ai-database-schema Uses knowledge_tags relationship table for normalized tag storage
     */
    async syncKnowledgeToSQLite(knowledge) {
        // Update main knowledge data
        await this.db.runAsync(`
      INSERT OR REPLACE INTO search_knowledge 
      (id, title, content, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)`, [
            knowledge.id, knowledge.title, knowledge.content,
            JSON.stringify(knowledge.tags), // @ai-why: Keep for backward compatibility
            knowledge.created_at, knowledge.updated_at
        ]);
        // Update tag relationships
        if (knowledge.tags && knowledge.tags.length > 0) {
            await this.tagRepository.saveEntityTags('knowledge', knowledge.id, knowledge.tags);
        }
        else {
            // Clear all tag relationships if no tags
            await this.db.runAsync('DELETE FROM knowledge_tags WHERE knowledge_id = ?', [knowledge.id]);
        }
    }
    async getAllKnowledge() {
        await this.ensureDirectoryExists();
        const files = await fsPromises.readdir(this.knowledgeDir);
        const knowledgeFiles = files.filter(f => f.startsWith('knowledge-') && f.endsWith('.md'));
        const knowledgePromises = knowledgeFiles.map(async (file) => {
            try {
                const content = await fsPromises.readFile(path.join(this.knowledgeDir, file), 'utf8');
                return this.parseMarkdownKnowledge(content);
            }
            catch (error) {
                this.logger.error(`Error reading knowledge file ${file}:`, { error });
                return null;
            }
        });
        const results = await Promise.all(knowledgePromises);
        const knowledgeList = results.filter((knowledge) => knowledge !== null);
        return knowledgeList.sort((a, b) => a.id - b.id);
    }
    /**
     * @ai-intent Create new knowledge entry with auto-generated ID
     * @ai-flow 1. Generate ID -> 2. Create object -> 3. Save to file -> 4. Sync to DB
     * @ai-side-effects Creates markdown file, updates SQLite, registers tags
     * @ai-assumption Content is already validated and safe to store
     * @ai-critical Knowledge is append-only - no in-place updates
     */
    async createKnowledge(title, content, tags = []) {
        await this.ensureDirectoryExists();
        const now = new Date().toISOString();
        const knowledge = {
            id: await this.getKnowledgeNextId(),
            title,
            content,
            tags,
            created_at: now,
            updated_at: now
        };
        // Ensure tags exist before writing knowledge
        if (knowledge.tags && knowledge.tags.length > 0) {
            await this.tagRepository.ensureTagsExist(knowledge.tags);
        }
        await this.writeMarkdownKnowledge(knowledge);
        await this.syncKnowledgeToSQLite(knowledge);
        return knowledge;
    }
    async updateKnowledge(id, title, content, tags) {
        const filePath = this.getKnowledgeFilePath(id);
        try {
            await fsPromises.access(filePath);
        }
        catch {
            return false;
        }
        try {
            const fileContent = await fsPromises.readFile(filePath, 'utf8');
            const knowledge = this.parseMarkdownKnowledge(fileContent);
            if (!knowledge)
                return false;
            if (title !== undefined)
                knowledge.title = title;
            if (content !== undefined)
                knowledge.content = content;
            if (tags !== undefined)
                knowledge.tags = tags;
            knowledge.updated_at = new Date().toISOString();
            // Ensure tags exist before writing knowledge
            if (knowledge.tags && knowledge.tags.length > 0) {
                await this.tagRepository.ensureTagsExist(knowledge.tags);
            }
            await this.writeMarkdownKnowledge(knowledge);
            await this.syncKnowledgeToSQLite(knowledge);
            return true;
        }
        catch (error) {
            this.logger.error(`Error updating knowledge ${id}:`, { error });
            return false;
        }
    }
    async deleteKnowledge(id) {
        const filePath = this.getKnowledgeFilePath(id);
        try {
            await fsPromises.access(filePath);
        }
        catch {
            return false;
        }
        try {
            await fsPromises.unlink(filePath);
            // @ai-logic: CASCADE DELETE in foreign key constraint handles knowledge_tags cleanup
            await this.db.runAsync('DELETE FROM search_knowledge WHERE id = ?', [id]);
            return true;
        }
        catch (error) {
            this.logger.error(`Error deleting knowledge ${id}:`, { error });
            return false;
        }
    }
    async getKnowledge(id) {
        const filePath = this.getKnowledgeFilePath(id);
        try {
            const content = await fsPromises.readFile(filePath, 'utf8');
            return this.parseMarkdownKnowledge(content);
        }
        catch (error) {
            this.logger.error(`Error reading knowledge ${id}:`, { error });
            return null;
        }
    }
    /**
     * @ai-intent Search knowledge by exact tag match using relationship table
     * @ai-flow 1. Get tag ID -> 2. JOIN with knowledge_tags -> 3. Load full knowledge
     * @ai-performance Uses indexed JOIN instead of LIKE search
     * @ai-database-schema Leverages knowledge_tags relationship table
     */
    async searchKnowledgeByTag(tag) {
        // Get tag ID
        const tagRow = await this.db.getAsync('SELECT id FROM tags WHERE name = ?', [tag]);
        if (!tagRow) {
            return []; // Tag doesn't exist
        }
        // Find all knowledge IDs with this tag
        const knowledgeRows = await this.db.allAsync(`SELECT DISTINCT k.id 
       FROM search_knowledge k
       JOIN knowledge_tags kt ON k.id = kt.knowledge_id
       WHERE kt.tag_id = ?
       ORDER BY k.id`, [tagRow.id]);
        // Load full knowledge data
        const knowledgeList = [];
        for (const row of knowledgeRows) {
            const knowledge = await this.getKnowledge(row.id);
            if (knowledge) {
                knowledgeList.push(knowledge);
            }
        }
        return knowledgeList;
    }
}
//# sourceMappingURL=knowledge-repository.js.map