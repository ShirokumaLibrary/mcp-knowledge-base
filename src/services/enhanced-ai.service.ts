import { DataSource } from 'typeorm';
import { ClaudeInterface, EnrichedMetadata } from './ai/claude-interface.js';
import { EmbeddingManager } from './ai/embedding-manager.js';
import { DataStorage } from './ai/data-storage.js';
import { Item } from '../entities/Item.js';

/**
 * Enhanced AI Service - TypeORM version
 * 
 * This service orchestrates AI-powered features:
 * - Claude interface for enrichment
 * - Embedding management for similarity
 * - Keyword/concept extraction and storage
 */
export class EnhancedAIService {
  private claudeInterface: ClaudeInterface;
  private embeddingManager: EmbeddingManager;
  private dataStorage: DataStorage;

  constructor(private dataSource: DataSource) {
    this.claudeInterface = new ClaudeInterface();
    this.embeddingManager = new EmbeddingManager();
    this.dataStorage = new DataStorage(dataSource);
  }

  /**
   * Generate enrichments with weighted text processing
   */
  async generateEnrichments(params: {
    title?: string;
    description?: string;
    content?: string;
  }): Promise<EnrichedMetadata> {
    // Combine texts with weights
    const weightedTexts: string[] = [];

    if (params.title) {
      weightedTexts.push(params.title);
    }
    if (params.description) {
      weightedTexts.push(params.description);
    }
    if (params.content) {
      weightedTexts.push(params.content);
    }

    const combinedContent = {
      title: params.title || '',
      description: params.description || '',
      content: weightedTexts.join(' ')
    };

    return this.claudeInterface.extractWeightedKeywords(combinedContent);
  }


  /**
   * Enrich an item with AI-generated metadata
   */
  async enrichItem(item: Item): Promise<void> {
    const enrichments = await this.generateEnrichments({
      title: item.title,
      description: item.description,
      content: item.content
    });

    // Update item with AI enrichments
    const itemRepo = this.dataSource.getRepository(Item);
    await itemRepo.update(item.id, {
      aiSummary: enrichments.summary,
      searchIndex: enrichments.keywords.map(k => k.keyword).join(' '),
      embedding: enrichments.embedding
    });

    // Store normalized keywords and concepts
    if (enrichments.keywords.length > 0) {
      await this.dataStorage.storeKeywordsForItem(item.id, enrichments.keywords);
    }

    if (enrichments.concepts.length > 0) {
      await this.dataStorage.storeConceptsForItem(item.id, enrichments.concepts);
    }
  }

  /**
   * Find similar items using embeddings
   */
  async findSimilarItems(
    itemId: number,
    limit: number = 10
  ): Promise<Array<{ id: number; similarity: number }>> {
    const itemRepo = this.dataSource.getRepository(Item);
    const item = await itemRepo.findOne({ where: { id: itemId } });
    
    if (!item || !item.embedding) {
      return [];
    }

    // Get all items with embeddings
    const items = await itemRepo
      .createQueryBuilder('item')
      .select(['item.id', 'item.embedding'])
      .where('item.embedding IS NOT NULL')
      .andWhere('item.id != :itemId', { itemId })
      .getMany();

    // Calculate similarities
    const similarities = items
      .map(other => {
        if (!other.embedding) return null;
        const similarity = this.embeddingManager.calculateSimilarity(
          item.embedding!,
          other.embedding
        );
        return { id: other.id, similarity };
      })
      .filter((s): s is { id: number; similarity: number } => s !== null)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return similarities;
  }
}