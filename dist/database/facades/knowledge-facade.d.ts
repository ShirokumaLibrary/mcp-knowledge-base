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
export declare class KnowledgeFacade extends BaseFacade {
    private knowledgeRepo;
    private initPromise;
    constructor(connection: DatabaseConnection, knowledgeRepo: KnowledgeRepository, // @ai-logic: Repository for knowledge operations
    statusRepo: StatusRepository, // @ai-note: Not used but required by base class
    tagRepo: TagRepository, initPromise?: Promise<void> | null);
    /**
     * @ai-intent Create new knowledge article
     * @ai-flow 1. Ensure init -> 2. Create knowledge with content
     * @ai-critical Content is required unlike issues/plans
     * @ai-validation Title and content must be non-empty
     * @ai-side-effects Creates markdown file and SQLite record
     * @ai-assumption Knowledge is immutable reference material
     */
    createKnowledge(title: string, content: string, // @ai-critical: Required field for knowledge
    tags?: string[]): Promise<Knowledge>;
    getKnowledge(id: number): Promise<Knowledge | null>;
    updateKnowledge(id: number, title?: string, content?: string, tags?: string[]): Promise<boolean>;
    deleteKnowledge(id: number): Promise<boolean>;
    getAllKnowledge(): Promise<Knowledge[]>;
    searchKnowledgeByTag(tag: string): Promise<Knowledge[]>;
}
