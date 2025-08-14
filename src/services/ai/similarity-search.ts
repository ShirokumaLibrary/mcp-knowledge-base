import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { EmbeddingManager } from './embedding-manager.js';

export class SimilaritySearch {
  private embeddingManager = new EmbeddingManager();

  constructor(private prisma: InstanceType<typeof PrismaClient>) {}

  /**
   * Find similar items efficiently using pre-filtered search
   */
  async findSimilarItemsEfficiently(itemId: number, threshold: number = 0.5): Promise<number[]> {
    try {
      // Get the source item with its embedding
      const sourceItem = await this.prisma.item.findUnique({
        where: { id: itemId },
        select: { embedding: true, type: true }
      });

      if (!sourceItem || !sourceItem.embedding) {
        return [];
      }

      // Pre-filter: get items of same type or related types for efficiency
      const candidates = await this.prisma.item.findMany({
        where: {
          id: { not: itemId },
          embedding: { not: null }
          // Optional: filter by type for performance
          // type: sourceItem.type
        },
        select: { id: true, embedding: true },
        take: 100 // Limit candidates for performance
      });

      const similarities: Array<{ id: number; similarity: number }> = [];

      for (const candidate of candidates) {
        if (!candidate.embedding) {
          continue;
        }

        const similarity = this.embeddingManager.calculateSimilarity(
          sourceItem.embedding,
          candidate.embedding
        );

        if (similarity >= threshold) {
          similarities.push({ id: candidate.id, similarity });
        }
      }

      // Sort by similarity descending and return IDs
      return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 10) // Top 10 most similar
        .map(s => s.id);

    } catch {
      // Error finding similar items, return empty array
      return [];
    }
  }

  /**
   * Suggest relations efficiently based on multiple signals
   */
  async suggestRelationsEfficiently(itemId: number): Promise<Array<{ id: number; score: number; reason: string }>> {
    try {
      const sourceItem = await this.prisma.item.findUnique({
        where: { id: itemId },
        include: {
          keywords: true,
          concepts: true
        }
      });

      if (!sourceItem) {
        return [];
      }

      // Get existing relations to avoid suggesting duplicates
      const existingRelations = await this.prisma.itemRelation.findMany({
        where: {
          OR: [
            { sourceId: itemId },
            { targetId: itemId }
          ]
        },
        select: { sourceId: true, targetId: true }
      });

      const existingIds = new Set<number>();
      existingRelations.forEach(rel => {
        existingIds.add(rel.sourceId);
        existingIds.add(rel.targetId);
      });

      const suggestions: Array<{ id: number; score: number; reason: string }> = [];

      // 1. Keyword-based suggestions (fast)
      const keywords = await this.prisma.itemKeyword.findMany({
        where: { itemId },
        include: { keyword: true },
        orderBy: { weight: 'desc' },
        take: 5
      });

      if (keywords.length > 0) {
        const keywords = await this.prisma.itemKeyword.findMany({
          where: { itemId },
          include: { keyword: true },
          orderBy: { weight: 'desc' },
          take: 5
        });

        const topKeywords = keywords.map(k => k.keyword.word);

        const keywordMatches = await this.prisma.itemKeyword.findMany({
          where: {
            keyword: { word: { in: topKeywords } },
            itemId: { not: itemId }
          },
          include: {
            item: { select: { id: true, title: true } },
            keyword: true
          },
          take: 20
        });

        const keywordScores = new Map<number, { score: number; keywords: string[] }>();
        keywordMatches.forEach(match => {
          const current = keywordScores.get(match.itemId) || { score: 0, keywords: [] };
          current.score += match.weight * 0.8; // Weight keyword matches
          current.keywords.push(match.keyword.word);
          keywordScores.set(match.itemId, current);
        });

        keywordScores.forEach((data, candidateId) => {
          if (!existingIds.has(candidateId) && data.score > 0.3) {
            suggestions.push({
              id: candidateId,
              score: data.score,
              reason: `Shared keywords: ${data.keywords.slice(0, 3).join(', ')}`
            });
          }
        });
      }

      // 2. Concept-based suggestions
      const concepts = await this.prisma.itemConcept.findMany({
        where: { itemId },
        include: { concept: true },
        orderBy: { confidence: 'desc' },
        take: 3
      });

      if (concepts.length > 0) {
        const topConcepts = concepts.map(c => c.concept.name);

        const conceptMatches = await this.prisma.itemConcept.findMany({
          where: {
            concept: { name: { in: topConcepts } },
            itemId: { not: itemId }
          },
          include: {
            item: { select: { id: true, title: true } },
            concept: true
          },
          take: 15
        });

        const conceptScores = new Map<number, { score: number; concepts: string[] }>();
        conceptMatches.forEach(match => {
          const current = conceptScores.get(match.itemId) || { score: 0, concepts: [] };
          current.score += match.confidence * 1.2; // Weight concept matches higher
          current.concepts.push(match.concept.name);
          conceptScores.set(match.itemId, current);
        });

        conceptScores.forEach((data, candidateId) => {
          if (!existingIds.has(candidateId) && data.score > 0.4) {
            // Check if already suggested via keywords
            const existing = suggestions.find(s => s.id === candidateId);
            if (existing) {
              existing.score += data.score;
              existing.reason += ` + concepts: ${data.concepts.slice(0, 2).join(', ')}`;
            } else {
              suggestions.push({
                id: candidateId,
                score: data.score,
                reason: `Shared concepts: ${data.concepts.slice(0, 2).join(', ')}`
              });
            }
          }
        });
      }

      // 3. Embedding-based suggestions (for top candidates only)
      if (sourceItem.embedding && suggestions.length < 5) {
        const embeddingSimilar = await this.findSimilarItemsEfficiently(itemId, 0.4);

        embeddingSimilar.forEach((similarId, index) => {
          if (!existingIds.has(similarId)) {
            const existing = suggestions.find(s => s.id === similarId);
            const embeddingScore = 0.8 - (index * 0.1); // Decreasing score

            if (existing) {
              existing.score += embeddingScore;
              existing.reason += ' + semantic similarity';
            } else if (suggestions.length < 8) {
              suggestions.push({
                id: similarId,
                score: embeddingScore,
                reason: 'Semantic similarity'
              });
            }
          }
        });
      }

      // Sort by combined score and return top suggestions
      return suggestions
        .sort((a, b) => b.score - a.score)
        .slice(0, 5) // Top 5 suggestions
        .filter(s => s.score > 0.3); // Minimum threshold

    } catch {
      // Error suggesting relations, return empty array
      return [];
    }
  }
}