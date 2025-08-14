import { PrismaClient } from '@prisma/client';
import { ClaudeInterface, EnrichedMetadata } from './ai/claude-interface.js';
import { EmbeddingManager } from './ai/embedding-manager.js';
import { DataStorage } from './ai/data-storage.js';
import { SimilaritySearch } from './ai/similarity-search.js';
import { UnifiedSearch, RelationStrategy, RelatedItem } from './ai/unified-search.js';

/**
 * Enhanced AI Service - Modular architecture for AI-powered features
 *
 * This service orchestrates multiple AI components:
 * - Claude interface for enrichment
 * - Embedding management for similarity
 * - Data storage for keywords/concepts
 * - Similarity search for recommendations
 * - Unified search with multiple strategies
 */
export class EnhancedAIService {
  private claudeInterface: ClaudeInterface;
  private embeddingManager: EmbeddingManager;
  private dataStorage: DataStorage;
  private similaritySearch: SimilaritySearch;
  private unifiedSearch: UnifiedSearch;

  constructor(private prisma: PrismaClient) {
    this.claudeInterface = new ClaudeInterface();
    this.embeddingManager = new EmbeddingManager();
    this.dataStorage = new DataStorage(prisma);
    this.similaritySearch = new SimilaritySearch(prisma);
    this.unifiedSearch = new UnifiedSearch(prisma);
  }

  // === Primary Interface Methods ===

  /**
   * Generate enrichments with weighted text processing
   * Integrates title, description, and content with different weights
   */
  async generateEnrichments(params: {
    title?: string;
    description?: string;
    content?: string;
  }): Promise<EnrichedMetadata> {
    // Combine texts with weights: title(1.0), description(0.8), content(0.6)
    const weightedTexts: string[] = [];

    if (params.title) {
      // Title gets highest weight - repeat it
      weightedTexts.push(params.title);
      weightedTexts.push(params.title);
    }

    if (params.description) {
      // Description gets medium weight
      weightedTexts.push(params.description);
    }

    if (params.content) {
      // Content gets lower weight but still included
      weightedTexts.push(params.content);
    }

    // Create combined content object with weighted text
    const combinedContent = {
      title: params.title || '',
      description: params.description || '',
      content: weightedTexts.join(' ')
    };

    return this.claudeInterface.extractWeightedKeywords(combinedContent);
  }

  /**
   * Extract weighted keywords and generate enriched metadata using Claude
   */
  async extractWeightedKeywords(content: Record<string, string>): Promise<EnrichedMetadata> {
    return this.claudeInterface.extractWeightedKeywords(content);
  }

  /**
   * Store concepts for an item in normalized table
   */
  async storeConceptsForItem(itemId: number, concepts: Array<{ concept: string; confidence: number }>): Promise<void> {
    return this.dataStorage.storeConceptsForItem(itemId, concepts);
  }

  /**
   * Store keywords for an item in normalized table
   */
  async storeKeywordsForItem(itemId: number, keywords: Array<{ keyword?: string; word?: string; weight: number }>): Promise<void> {
    return this.dataStorage.storeKeywordsForItem(itemId, keywords);
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  calculateSimilarity(embedding1: Buffer | Uint8Array | number[], embedding2: Buffer | Uint8Array | number[]): number {
    return this.embeddingManager.calculateSimilarity(embedding1, embedding2);
  }

  /**
   * Find similar items efficiently using pre-filtered search
   */
  async findSimilarItemsEfficiently(itemId: number, threshold: number = 0.5): Promise<number[]> {
    return this.similaritySearch.findSimilarItemsEfficiently(itemId, threshold);
  }

  /**
   * Suggest relations efficiently based on multiple signals
   */
  async suggestRelationsEfficiently(itemId: number): Promise<Array<{ id: number; score: number; reason: string }>> {
    return this.similaritySearch.suggestRelationsEfficiently(itemId);
  }

  /**
   * Find related items using unified search strategies
   */
  async findRelatedItemsUnified(itemId: number, strategy?: RelationStrategy): Promise<RelatedItem[]> {
    return this.unifiedSearch.findRelatedItemsUnified(itemId, strategy);
  }

  // === Utility Methods ===

  /**
   * Generate embedding from weighted keywords
   */
  generateEmbedding(keywords: Array<{ word: string; weight: number }>): number[] {
    return this.embeddingManager.generateEmbedding(keywords);
  }

  /**
   * Quantize embedding for storage
   */
  quantizeEmbedding(embedding: number[]): Buffer {
    return this.embeddingManager.quantizeEmbedding(embedding);
  }

  /**
   * Dequantize embedding from storage
   */
  dequantizeEmbedding(buffer: Buffer): number[] {
    return this.embeddingManager.dequantizeEmbedding(buffer);
  }
}