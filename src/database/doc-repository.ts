import * as fsPromises from 'fs/promises';
import * as path from 'path';
import { BaseRepository, Database } from './base.js';
import { Doc } from '../types/domain-types.js';
import { parseMarkdown, generateMarkdown } from '../utils/markdown-parser.js';
import { TagRepository } from './tag-repository.js';

/**
 * @ai-context Repository for technical documentation management
 * @ai-pattern Simple document repository similar to knowledge but for docs
 * @ai-critical Documents are long-form content - handle large text gracefully
 * @ai-dependencies TagRepository for categorization
 * @ai-assumption Documents are reference material, not time-sensitive
 */
export class DocRepository extends BaseRepository {
  private docsDir: string;
  private tagRepository: TagRepository;

  constructor(db: Database, docsDir: string, tagRepository?: TagRepository) {
    super(db, 'DocRepository');
    this.docsDir = docsDir;
    this.tagRepository = tagRepository || new TagRepository(db);
    // @ai-async: Directory creation deferred to first operation
  }

  private async ensureDirectoryExists(): Promise<void> {
    try {
      await fsPromises.access(this.docsDir);
    } catch {
      await fsPromises.mkdir(this.docsDir, { recursive: true });
    }
  }

  private async getDocNextId(): Promise<number> {
    return this.getNextSequenceValue('docs');
  }

  private getDocFilePath(id: number): string {
    return path.join(this.docsDir, `doc-${id}.md`);
  }

  /**
   * @ai-intent Parse document from markdown file
   * @ai-flow 1. Extract metadata -> 2. Validate required fields -> 3. Return Doc object
   * @ai-edge-case Empty content allowed for placeholder docs
   * @ai-assumption Documents always have content section
   * @ai-why Identical structure to knowledge but semantic difference
   */
  private parseMarkdownDoc(content: string): Doc | null {
    const { metadata, content: docContent } = parseMarkdown(content);
    
    // @ai-logic: ID and title are mandatory
    if (!metadata.id || !metadata.title) return null;

    return {
      id: metadata.id,
      title: metadata.title,
      content: docContent,  // @ai-logic: Main value is the documentation content
      tags: Array.isArray(metadata.tags) ? metadata.tags : [],
      created_at: metadata.created_at || new Date().toISOString(),
      updated_at: metadata.updated_at || new Date().toISOString()
    };
  }

  private async writeMarkdownDoc(doc: Doc): Promise<void> {
    const metadata = {
      id: doc.id,
      title: doc.title,
      tags: doc.tags || [],
      created_at: doc.created_at,
      updated_at: doc.updated_at
    };
    
    const content = generateMarkdown(metadata, doc.content);
    await fsPromises.writeFile(this.getDocFilePath(doc.id), content, 'utf8');
  }

  /**
   * @ai-intent Sync document to SQLite for full-text search
   * @ai-flow 1. Prepare data -> 2. UPSERT to search table
   * @ai-side-effects Updates search_docs table
   * @ai-performance Content can be large - ensure DB can handle
   * @ai-critical Essential for search functionality
   */
  async syncDocToSQLite(doc: Doc): Promise<void> {
    await this.db.runAsync(`
      INSERT OR REPLACE INTO search_docs 
      (id, title, content, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        doc.id, doc.title, doc.content || '',  // @ai-edge-case: Empty content stored as empty string
        JSON.stringify(doc.tags || []),
        doc.created_at, doc.updated_at
      ]
    );
  }

  private async deleteDocFromSQLite(id: number): Promise<void> {
    await this.db.runAsync('DELETE FROM search_docs WHERE id = ?', [id]);
  }

  async getAllDocs(): Promise<Doc[]> {
    await this.ensureDirectoryExists();
    const files = await fsPromises.readdir(this.docsDir);
    const docFiles = files.filter(f => f.startsWith('doc-') && f.endsWith('.md'));
    
    const docPromises = docFiles.map(async (file) => {
      try {
        const content = await fsPromises.readFile(path.join(this.docsDir, file), 'utf8');
        return this.parseMarkdownDoc(content);
      } catch (error) {
        this.logger.error(`Error reading doc file ${file}:`, { error });
        return null;
      }
    });

    const results = await Promise.all(docPromises);
    const docs = results.filter((doc): doc is Doc => doc !== null);
    return docs.sort((a, b) => a.id - b.id);
  }

  /**
   * @ai-intent Get document list without content for performance
   * @ai-flow 1. Read all files -> 2. Parse headers only -> 3. Return summaries
   * @ai-performance Avoids loading full content for list views
   * @ai-return Lightweight objects with just ID and title
   * @ai-why Documents can be large - summary view prevents memory issues
   */
  async getDocsSummary(): Promise<Array<{id: number, title: string}>> {
    const docs = await this.getAllDocs();
    return docs.map(d => ({ id: d.id, title: d.title }));
  }

  async createDoc(title: string, content: string, tags: string[] = []): Promise<Doc> {
    await this.ensureDirectoryExists();
    
    const now = new Date().toISOString();
    const doc: Doc = {
      id: await this.getDocNextId(),
      title,
      content,
      tags,
      created_at: now,
      updated_at: now
    };

    // Ensure tags exist before writing doc
    if (doc.tags && doc.tags.length > 0) {
      await this.tagRepository.ensureTagsExist(doc.tags);
    }

    await this.writeMarkdownDoc(doc);
    await this.syncDocToSQLite(doc);
    return doc;
  }

  async updateDoc(id: number, title?: string, content?: string, tags?: string[]): Promise<Doc | null> {
    const filePath = this.getDocFilePath(id);
    
    try {
      await fsPromises.access(filePath);
    } catch {
      return null;
    }

    try {
      const fileContent = await fsPromises.readFile(filePath, 'utf8');
      const doc = this.parseMarkdownDoc(fileContent);
      if (!doc) return null;

      if (title !== undefined) doc.title = title;
      if (content !== undefined) doc.content = content;
      if (tags !== undefined) doc.tags = tags;
      doc.updated_at = new Date().toISOString();

      // Ensure tags exist before writing doc
      if (doc.tags && doc.tags.length > 0) {
        await this.tagRepository.ensureTagsExist(doc.tags);
      }

      await this.writeMarkdownDoc(doc);
      await this.syncDocToSQLite(doc);
      return doc;
    } catch (error) {
      this.logger.error(`Error updating doc ${id}:`, { error });
      return null;
    }
  }

  async deleteDoc(id: number): Promise<boolean> {
    const filePath = this.getDocFilePath(id);
    
    try {
      await fsPromises.access(filePath);
    } catch {
      return false;
    }

    try {
      await fsPromises.unlink(filePath);
      await this.deleteDocFromSQLite(id);
      return true;
    } catch (error) {
      this.logger.error(`Error deleting doc ${id}:`, { error });
      return false;
    }
  }

  async getDoc(id: number): Promise<Doc | null> {
    const filePath = this.getDocFilePath(id);
    
    try {
      const content = await fsPromises.readFile(filePath, 'utf8');
      return this.parseMarkdownDoc(content);
    } catch (error) {
      this.logger.error(`Error reading doc ${id}:`, { error });
      return null;
    }
  }

  async searchDocsByTag(tag: string): Promise<Doc[]> {
    const rows = await this.db.allAsync(
      `SELECT * FROM search_docs WHERE tags LIKE ?`,
      [`%${tag}%`]
    );
    
    return rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      tags: JSON.parse(row.tags || '[]'),
      created_at: row.created_at,
      updated_at: row.updated_at
    })).filter((doc: Doc) => doc.tags?.includes(tag));
  }
}