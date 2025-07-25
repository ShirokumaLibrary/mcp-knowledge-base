import { Knowledge, Content } from '../types/domain-types.js';
import { ContentRepository } from './content-repository.js';
import { logger } from '../utils/logger.js';

/**
 * @ai-context Legacy wrapper for KnowledgeRepository using ContentRepository
 * @ai-pattern Adapter pattern - maintains API compatibility
 * @ai-critical Translates between Knowledge interface and Content storage
 * @ai-dependencies ContentRepository for actual storage
 * @ai-deprecated Use ContentRepository directly for new code
 */
export class KnowledgeRepository {
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
   * @ai-intent Convert Content to Knowledge format
   * @ai-pattern Adapter method for type conversion
   */
  private contentToKnowledge(content: Content): Knowledge {
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
   * @ai-intent Create new knowledge
   * @ai-delegation Converts to Content and delegates to ContentRepository
   */
  async createKnowledge(knowledgeData: { title: string; content: string; tags?: string[] }): Promise<Knowledge | null> {
    const content = await this.contentRepository.create({
      type: 'knowledge',
      title: knowledgeData.title,
      content: knowledgeData.content,
      tags: knowledgeData.tags || []
    });
    
    return content ? this.contentToKnowledge(content) : null;
  }

  /**
   * @ai-intent Get knowledge by ID
   * @ai-delegation Retrieves from ContentRepository and converts
   */
  async getKnowledgeById(id: number): Promise<Knowledge | null> {
    const content = await this.contentRepository.getById(id);
    if (!content || content.type !== 'knowledge') {
      return null;
    }
    return this.contentToKnowledge(content);
  }

  /**
   * @ai-intent Get all knowledge items
   * @ai-delegation Filters Content by type='knowledge'
   */
  async getAllKnowledge(): Promise<Knowledge[]> {
    const contents = await this.contentRepository.getByType('knowledge');
    return contents.map(c => this.contentToKnowledge(c));
  }

  /**
   * @ai-intent Update knowledge
   * @ai-delegation Updates via ContentRepository
   */
  async updateKnowledge(id: number, updates: { title?: string; content?: string; tags?: string[] }): Promise<Knowledge | null> {
    const content = await this.contentRepository.update(id, {
      ...updates,
      type: 'knowledge'
    });
    
    return content ? this.contentToKnowledge(content) : null;
  }

  /**
   * @ai-intent Delete knowledge
   * @ai-delegation Deletes via ContentRepository
   */
  async deleteKnowledge(id: number): Promise<boolean> {
    return await this.contentRepository.delete(id);
  }

  /**
   * @ai-intent Search knowledge
   * @ai-delegation Searches via ContentRepository with type filter
   */
  async searchKnowledge(query: string): Promise<Knowledge[]> {
    const results = await this.contentRepository.getByType('knowledge');
    const filtered = results.filter(k => 
      k.title.toLowerCase().includes(query.toLowerCase()) ||
      k.content.toLowerCase().includes(query.toLowerCase()) ||
      k.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
    return filtered.map(c => this.contentToKnowledge(c));
  }

  /**
   * @ai-intent Sync knowledge to SQLite
   * @ai-delegation For compatibility - handled by ContentRepository
   */
  async syncKnowledgeToSQLite(knowledge: Knowledge): Promise<void> {
    // ContentRepository handles this internally
    logger.info('[KnowledgeRepository] syncKnowledgeToSQLite called - handled by ContentRepository');
  }

  /**
   * @ai-intent Search knowledge by tag
   * @ai-delegation Use ContentRepository to filter by tag
   */
  async searchKnowledgeByTag(tag: string): Promise<Knowledge[]> {
    const contents = await this.contentRepository.getByType('knowledge');
    const filtered = contents.filter(c => c.tags.includes(tag));
    return filtered.map(c => this.contentToKnowledge(c));
  }

  /**
   * @ai-intent Delete knowledge by tag
   * @ai-delegation Find and delete matching knowledge
   */
  async deleteKnowledgeByTag(tag: string): Promise<number> {
    const knowledge = await this.searchKnowledgeByTag(tag);
    let deleted = 0;
    
    for (const k of knowledge) {
      if (await this.deleteKnowledge(k.id)) {
        deleted++;
      }
    }
    
    return deleted;
  }

  /**
   * @ai-intent Rebuild search index
   * @ai-delegation Delegates to ContentRepository
   */
  async rebuildKnowledgeSearchIndex(): Promise<void> {
    await this.contentRepository.rebuildSearchIndex();
  }
}