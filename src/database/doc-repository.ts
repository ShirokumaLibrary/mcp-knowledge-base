import * as fsPromises from 'fs/promises';
import * as path from 'path';
import { BaseRepository, Database } from './base.js';
import { Doc, DocSummary } from '../types/domain-types.js';
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
      description: metadata.description || undefined,
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
      description: doc.description,
      tags: doc.tags || [],
      created_at: doc.created_at,
      updated_at: doc.updated_at
    };
    
    const content = generateMarkdown(metadata, doc.content);
    await fsPromises.writeFile(this.getDocFilePath(doc.id), content, 'utf8');
  }

  /**
   * @ai-intent Sync document to SQLite for full-text search
   * @ai-flow 1. Prepare data -> 2. UPSERT to search table -> 3. Update tag relationships
   * @ai-side-effects Updates search_docs table and doc_tags relationship table
   * @ai-performance Content can be large - ensure DB can handle
   * @ai-critical Essential for search functionality
   * @ai-database-schema Uses doc_tags relationship table for normalized tag storage
   */
  async syncDocToSQLite(doc: Doc): Promise<void> {
    // Update main doc data
    await this.db.runAsync(`
      INSERT OR REPLACE INTO search_docs 
      (id, title, summary, content, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        doc.id, doc.title, doc.description || '',
        doc.content || '',  // @ai-edge-case: Empty content stored as empty string
        JSON.stringify(doc.tags || []),  // @ai-why: Keep for backward compatibility
        doc.created_at, doc.updated_at
      ]
    );
    
    // Update tag relationships
    if (doc.tags && doc.tags.length > 0) {
      await this.tagRepository.saveEntityTags('doc', doc.id, doc.tags);
    } else {
      // Clear all tag relationships if no tags
      await this.db.runAsync('DELETE FROM doc_tags WHERE doc_id = ?', [doc.id]);
    }
  }

  private async deleteDocFromSQLite(id: number): Promise<void> {
    // @ai-logic: CASCADE DELETE in foreign key constraint handles doc_tags cleanup
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
  async getDocsSummary(): Promise<DocSummary[]> {
    const docs = await this.getAllDocs();
    return docs.map(d => ({ 
      id: d.id, 
      title: d.title,
      description: d.description 
    }));
  }

  async createDoc(title: string, content: string, tags: string[] = [], description?: string): Promise<Doc> {
    await this.ensureDirectoryExists();
    
    const now = new Date().toISOString();
    const doc: Doc = {
      id: await this.getDocNextId(),
      title,
      description,
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

  async updateDoc(id: number, title?: string, content?: string, tags?: string[], description?: string): Promise<Doc | null> {
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
      if (description !== undefined) doc.description = description;
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

  /**
   * @ai-intent Search documents by exact tag match using relationship table
   * @ai-flow 1. Get tag ID -> 2. JOIN with doc_tags -> 3. Load full docs
   * @ai-performance Uses indexed JOIN instead of LIKE search
   * @ai-database-schema Leverages doc_tags relationship table
   */
  async searchDocsByTag(tag: string): Promise<Doc[]> {
    // Get tag ID
    const tagRow = await this.db.getAsync(
      'SELECT id FROM tags WHERE name = ?',
      [tag]
    );
    
    if (!tagRow) {
      return []; // Tag doesn't exist
    }
    
    // Find all doc IDs with this tag
    const docRows = await this.db.allAsync(
      `SELECT DISTINCT d.id 
       FROM search_docs d
       JOIN doc_tags dt ON d.id = dt.doc_id
       WHERE dt.tag_id = ?
       ORDER BY d.id`,
      [tagRow.id]
    );
    
    // Load full doc data from search table for better performance
    const docs: Doc[] = [];
    for (const row of docRows) {
      const docData = await this.db.getAsync(
        'SELECT * FROM search_docs WHERE id = ?',
        [row.id]
      );
      if (docData) {
        docs.push({
          id: docData.id,
          title: docData.title,
          description: docData.description || undefined,
          content: docData.content,
          tags: JSON.parse(docData.tags || '[]'),
          created_at: docData.created_at,
          updated_at: docData.updated_at
        });
      }
    }
    
    return docs;
  }
}