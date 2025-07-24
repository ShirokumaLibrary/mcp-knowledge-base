/**
 * @ai-context Facade for knowledge base article management
 * @ai-pattern Simplifies knowledge repository API
 * @ai-critical Content is required for knowledge articles
 * @ai-dependencies KnowledgeRepository for persistence
 * @ai-why Knowledge articles are simpler - no status or priority
 */

import { BaseFacade } from './base-facade.js';
import { KnowledgeRepository } from '../knowledge-repository.js';
import { Knowledge } from '../../types/domain-types.js';
import { DatabaseConnection } from '../base.js';
import { StatusRepository } from '../status-repository.js';
import { TagRepository } from '../tag-repository.js';

export class KnowledgeFacade extends BaseFacade {
  constructor(
    connection: DatabaseConnection,
    private knowledgeRepo: KnowledgeRepository,  // @ai-logic: Repository for knowledge operations
    statusRepo: StatusRepository,  // @ai-note: Not used but required by base class
    tagRepo: TagRepository,
    private initPromise: Promise<void> | null = null  // @ai-pattern: Async init tracking
  ) {
    super(connection, statusRepo, tagRepo);
  }

  /**
   * @ai-intent Create new knowledge article
   * @ai-flow 1. Ensure init -> 2. Create knowledge with content
   * @ai-critical Content is required unlike issues/plans
   * @ai-validation Title and content must be non-empty
   * @ai-side-effects Creates markdown file and SQLite record
   * @ai-assumption Knowledge is immutable reference material
   */
  async createKnowledge(
    title: string,
    content: string,    // @ai-critical: Required field for knowledge
    tags: string[] = [] // @ai-pattern: Categorization support
  ): Promise<Knowledge> {
    await this.ensureInitialized(this.initPromise);
    return this.knowledgeRepo.createKnowledge(title, content, tags);
  }

  async getKnowledge(id: number): Promise<Knowledge | null> {
    await this.ensureInitialized(this.initPromise);
    return this.knowledgeRepo.getKnowledge(id);
  }

  async updateKnowledge(
    id: number,
    title?: string,
    content?: string,
    tags?: string[]
  ): Promise<boolean> {
    await this.ensureInitialized(this.initPromise);
    return this.knowledgeRepo.updateKnowledge(id, title, content, tags);
  }

  async deleteKnowledge(id: number): Promise<boolean> {
    await this.ensureInitialized(this.initPromise);
    return this.knowledgeRepo.deleteKnowledge(id);
  }

  async getAllKnowledge(): Promise<Knowledge[]> {
    await this.ensureInitialized(this.initPromise);
    return this.knowledgeRepo.getAllKnowledge();
  }

  async searchKnowledgeByTag(tag: string): Promise<Knowledge[]> {
    await this.ensureInitialized(this.initPromise);
    return this.knowledgeRepo.searchKnowledgeByTag(tag);
  }
}