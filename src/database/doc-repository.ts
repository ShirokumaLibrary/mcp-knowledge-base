import { Doc, Content, DocSummary } from '../types/domain-types.js';
import { ContentRepository } from './content-repository.js';
import { logger } from '../utils/logger.js';

/**
 * @ai-context Legacy wrapper for DocRepository using ContentRepository
 * @ai-pattern Adapter pattern - maintains API compatibility
 * @ai-critical Translates between Doc interface and Content storage
 * @ai-dependencies ContentRepository for actual storage
 * @ai-deprecated Use ContentRepository directly for new code
 */
export class DocRepository {
  private contentRepository: ContentRepository;

  constructor(dbPath: string, dataDir: string, tagRepository: any) {
    this.contentRepository = new ContentRepository(dbPath, dataDir, tagRepository);
  }

  /**
   * @ai-intent Initialize repository
   * @ai-delegation Delegates to ContentRepository
   */
  async initialize(): Promise<void> {
    await this.contentRepository.initialize();
  }

  /**
   * @ai-intent Convert Content to Doc format
   * @ai-pattern Adapter method for type conversion
   */
  private contentToDoc(content: Content): Doc {
    return {
      id: content.id,
      title: content.title,
      summary: content.summary,
      content: content.content,
      tags: content.tags,
      created_at: content.created_at,
      updated_at: content.updated_at
    };
  }

  /**
   * @ai-intent Convert Doc to Content format
   * @ai-pattern Adds type='doc' to Content
   */
  private docToContent(doc: Omit<Doc, 'id' | 'created_at' | 'updated_at'>): Omit<Content, 'id' | 'created_at' | 'updated_at'> {
    return {
      type: 'doc',
      title: doc.title,
      summary: doc.summary,
      content: doc.content,
      tags: doc.tags || []
    };
  }

  /**
   * @ai-intent Create new document
   * @ai-delegation Converts to Content and delegates to ContentRepository
   */
  async createDoc(docData: { title: string; content: string; tags?: string[] }): Promise<Doc | null> {
    const content = await this.contentRepository.create({
      type: 'doc',
      title: docData.title,
      content: docData.content,
      tags: docData.tags || []
    });
    
    return content ? this.contentToDoc(content) : null;
  }

  /**
   * @ai-intent Get document by ID
   * @ai-delegation Retrieves from ContentRepository and converts
   */
  async getDocById(id: number): Promise<Doc | null> {
    const content = await this.contentRepository.getById(id);
    if (!content || content.type !== 'doc') {
      return null;
    }
    return this.contentToDoc(content);
  }

  /**
   * @ai-intent Get all documents
   * @ai-delegation Filters Content by type='doc'
   */
  async getAllDocs(): Promise<Doc[]> {
    const contents = await this.contentRepository.getByType('doc');
    return contents.map(c => this.contentToDoc(c));
  }

  /**
   * @ai-intent Get document summaries
   * @ai-delegation Gets summaries from ContentRepository
   */
  async getAllDocSummaries(): Promise<DocSummary[]> {
    const summaries = await this.contentRepository.getAllSummaries('doc');
    return summaries.map(s => ({
      id: s.id,
      title: s.title,
      summary: s.summary
    }));
  }

  /**
   * @ai-intent Update document
   * @ai-delegation Updates via ContentRepository
   */
  async updateDoc(id: number, updates: { title?: string; content?: string; tags?: string[] }): Promise<Doc | null> {
    const content = await this.contentRepository.update(id, {
      ...updates,
      type: 'doc'
    });
    
    return content ? this.contentToDoc(content) : null;
  }

  /**
   * @ai-intent Delete document
   * @ai-delegation Deletes via ContentRepository
   */
  async deleteDoc(id: number): Promise<boolean> {
    return await this.contentRepository.delete(id);
  }

  /**
   * @ai-intent Search documents
   * @ai-delegation Searches via ContentRepository with type filter
   */
  async searchDocs(query: string): Promise<DocSummary[]> {
    const results = await this.contentRepository.search(query, 'doc');
    return results.map(r => ({
      id: r.id,
      title: r.title,
      summary: r.summary
    }));
  }

  /**
   * @ai-intent Sync document to SQLite
   * @ai-delegation For compatibility - delegates to ContentRepository
   */
  async syncDocToSQLite(doc: Doc): Promise<void> {
    // ContentRepository handles this internally
    logger.info('[DocRepository] syncDocToSQLite called - handled by ContentRepository');
  }

  /**
   * @ai-intent Search documents by tag
   * @ai-delegation Use ContentRepository search with tag filter
   */
  async searchDocsByTag(tag: string): Promise<Doc[]> {
    const contents = await this.contentRepository.getByType('doc');
    const filtered = contents.filter(c => c.tags.includes(tag));
    return filtered.map(c => this.contentToDoc(c));
  }

  /**
   * @ai-intent Delete documents by tag
   * @ai-delegation Find and delete matching documents
   */
  async deleteDocsByTag(tag: string): Promise<number> {
    const docs = await this.searchDocsByTag(tag);
    let deleted = 0;
    
    for (const doc of docs) {
      if (await this.deleteDoc(doc.id)) {
        deleted++;
      }
    }
    
    return deleted;
  }

  /**
   * @ai-intent Rebuild search index
   * @ai-delegation Delegates to ContentRepository
   */
  async rebuildDocsSearchIndex(): Promise<void> {
    await this.contentRepository.rebuildSearchIndex();
  }
}