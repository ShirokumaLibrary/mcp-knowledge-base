import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { EmbeddingManager } from './embedding-manager.js';

export interface WeightConfig {
  [key: string]: number;
}

export interface RelationStrategy {
  strategy: 'keywords' | 'concepts' | 'embedding' | 'hybrid';
  weights?: WeightConfig;
  thresholds?: {
    min_confidence?: number;
    min_keyword_weight?: number;
    min_similarity?: number;
  };
}

export interface RelatedItem {
  id: number;
  score: number;
  reason: string;
}

export class UnifiedSearch {
  private embeddingManager = new EmbeddingManager();

  constructor(private prisma: InstanceType<typeof PrismaClient>) {}

  /**
   * Find related items using unified search strategies
   */
  async findRelatedItemsUnified(itemId: number, strategy?: RelationStrategy): Promise<RelatedItem[]> {
    const config = strategy || { strategy: 'hybrid' };

    switch (config.strategy) {
    case 'keywords':
      return this.findRelatedByKeywords(itemId, config.thresholds);
    case 'concepts':
      return this.findRelatedByConcepts(itemId, config.thresholds);
    case 'embedding':
      return this.findRelatedByEmbedding(itemId, config.thresholds);
    case 'hybrid':
      return this.findRelatedByHybrid(itemId, config.weights, config.thresholds);
    default:
      return this.findRelatedItemsSimple(itemId);
    }
  }

  private async findRelatedItemsSimple(itemId: number): Promise<RelatedItem[]> {
    // Simple relation finding based on existing relations
    const relations = await this.prisma.itemRelation.findMany({
      where: {
        OR: [{ sourceId: itemId }, { targetId: itemId }]
      }
    });

    return relations.map(rel => ({
      id: rel.sourceId === itemId ? rel.targetId : rel.sourceId,
      score: 1.0, // Manual relations have maximum score
      reason: 'Manual Relation'
    }));
  }

  private async findRelatedByKeywords(itemId: number, thresholds?: { min_keyword_weight?: number }): Promise<RelatedItem[]> {
    const minWeight = thresholds?.min_keyword_weight || 0.3;

    const sourceKeywords = await this.prisma.itemKeyword.findMany({
      where: { itemId, weight: { gte: minWeight } },
      include: { keyword: true },
      orderBy: { weight: 'desc' },
      take: 10
    });

    if (sourceKeywords.length === 0) {
      return [];
    }

    const keywordTexts = sourceKeywords.map(k => k.keyword.word);
    const relatedKeywords = await this.prisma.itemKeyword.findMany({
      where: {
        keyword: { word: { in: keywordTexts } },
        itemId: { not: itemId }
      },
      include: {
        item: { select: { id: true, title: true } },
        keyword: true
      }
    });

    const scores = new Map<number, { score: number; keywords: string[] }>();
    relatedKeywords.forEach(kw => {
      const current = scores.get(kw.itemId) || { score: 0, keywords: [] };
      current.score += kw.weight;
      current.keywords.push(kw.keyword.word);
      scores.set(kw.itemId, current);
    });

    return Array.from(scores.entries())
      .filter(([, data]) => data.score > minWeight)
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, 10)
      .map(([id, data]) => ({
        id,
        score: data.score,
        reason: `Keywords: ${data.keywords.slice(0, 3).join(', ')}`
      }));
  }

  private async findRelatedByConcepts(itemId: number, thresholds?: { min_confidence?: number }): Promise<RelatedItem[]> {
    const minConfidence = thresholds?.min_confidence || 0.5;

    const sourceConcepts = await this.prisma.itemConcept.findMany({
      where: { itemId, confidence: { gte: minConfidence } },
      include: { concept: true },
      orderBy: { confidence: 'desc' },
      take: 8
    });

    if (sourceConcepts.length === 0) {
      return [];
    }

    const conceptTexts = sourceConcepts.map(c => c.concept.name);
    const relatedConcepts = await this.prisma.itemConcept.findMany({
      where: {
        concept: { name: { in: conceptTexts } },
        itemId: { not: itemId }
      },
      include: {
        item: { select: { id: true, title: true } },
        concept: true
      }
    });

    const scores = new Map<number, { score: number; concepts: string[] }>();
    relatedConcepts.forEach(concept => {
      const current = scores.get(concept.itemId) || { score: 0, concepts: [] };
      current.score += concept.confidence;
      current.concepts.push(concept.concept.name);
      scores.set(concept.itemId, current);
    });

    return Array.from(scores.entries())
      .filter(([, data]) => data.score > minConfidence)
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, 10)
      .map(([id, data]) => ({
        id,
        score: data.score,
        reason: `Concepts: ${data.concepts.slice(0, 2).join(', ')}`
      }));
  }

  private async findRelatedByEmbedding(itemId: number, thresholds?: { min_similarity?: number }): Promise<RelatedItem[]> {
    const minSimilarity = thresholds?.min_similarity || 0.5;

    const sourceItem = await this.prisma.item.findUnique({
      where: { id: itemId },
      select: { embedding: true }
    });

    if (!sourceItem?.embedding) {
      return [];
    }

    const candidates = await this.prisma.item.findMany({
      where: {
        id: { not: itemId },
        embedding: { not: null }
      },
      select: { id: true, embedding: true, title: true },
      take: 50
    });

    const similarities: RelatedItem[] = [];
    candidates.forEach(candidate => {
      if (!candidate.embedding) {
        return;
      }

      const similarity = this.embeddingManager.calculateSimilarity(
        sourceItem.embedding!,
        candidate.embedding
      );

      if (similarity >= minSimilarity) {
        similarities.push({
          id: candidate.id,
          score: similarity,
          reason: `Similarity: ${(similarity * 100).toFixed(1)}%`
        });
      }
    });

    return similarities
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  private async findRelatedByHybrid(itemId: number, weights?: WeightConfig, thresholds?: Record<string, number>): Promise<RelatedItem[]> {
    const normalizedWeights = this.normalizeWeights(weights || {
      keywords: 0.3,
      concepts: 0.4,
      embedding: 0.3
    });

    const results = await Promise.all([
      this.findRelatedByKeywords(itemId, thresholds),
      this.findRelatedByConcepts(itemId, thresholds),
      this.findRelatedByEmbedding(itemId, thresholds)
    ]);

    const [keywordResults, conceptResults, embeddingResults] = results;
    const combinedScores = new Map<number, { score: number; reasons: string[] }>();

    // Combine keyword results
    keywordResults.forEach(item => {
      const current = combinedScores.get(item.id) || { score: 0, reasons: [] };
      current.score += item.score * normalizedWeights.keywords;
      current.reasons.push(item.reason);
      combinedScores.set(item.id, current);
    });

    // Combine concept results
    conceptResults.forEach(item => {
      const current = combinedScores.get(item.id) || { score: 0, reasons: [] };
      current.score += item.score * normalizedWeights.concepts;
      current.reasons.push(item.reason);
      combinedScores.set(item.id, current);
    });

    // Combine embedding results
    embeddingResults.forEach(item => {
      const current = combinedScores.get(item.id) || { score: 0, reasons: [] };
      current.score += item.score * normalizedWeights.embedding;
      current.reasons.push(item.reason);
      combinedScores.set(item.id, current);
    });

    return Array.from(combinedScores.entries())
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, 15)
      .map(([id, data]) => ({
        id,
        score: data.score,
        reason: data.reasons.join(' + ')
      }));
  }

  private normalizeWeights(weights: WeightConfig): WeightConfig {
    const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    if (total === 0) {
      return weights;
    }

    const normalized: WeightConfig = {};
    Object.entries(weights).forEach(([key, weight]) => {
      normalized[key] = weight / total;
    });
    return normalized;
  }
}