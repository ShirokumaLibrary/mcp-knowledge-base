import { DataSource } from 'typeorm';
import { Keyword } from '../../entities/Keyword.js';
import { ItemKeyword } from '../../entities/ItemKeyword.js';
import { Concept } from '../../entities/Concept.js';
import { ItemConcept } from '../../entities/ItemConcept.js';

/**
 * Data Storage Service - TypeORM version
 * Handles normalized storage of keywords and concepts
 */
export class DataStorage {
  constructor(private dataSource: DataSource) {}

  /**
   * Store keywords for an item in normalized table
   */
  async storeKeywordsForItem(
    itemId: number,
    keywords: Array<{ keyword: string; weight: number }>
  ): Promise<void> {
    const keywordRepo = this.dataSource.getRepository(Keyword);
    const itemKeywordRepo = this.dataSource.getRepository(ItemKeyword);

    for (const { keyword, weight } of keywords) {
      // Get or create keyword
      let keywordEntity = await keywordRepo.findOne({
        where: { word: keyword }
      });

      if (!keywordEntity) {
        keywordEntity = await keywordRepo.save({ word: keyword });
      }

      // Check if relation already exists
      const existing = await itemKeywordRepo.findOne({
        where: {
          itemId,
          keywordId: keywordEntity.id
        }
      });

      if (!existing) {
        // Create item-keyword relation with weight
        await itemKeywordRepo.save({
          itemId,
          keywordId: keywordEntity.id,
          weight
        });
      } else {
        // Update weight if relation exists
        await itemKeywordRepo.update(
          { itemId, keywordId: keywordEntity.id },
          { weight }
        );
      }
    }
  }

  /**
   * Store concepts for an item in normalized table
   */
  async storeConceptsForItem(
    itemId: number,
    concepts: Array<{ concept: string; confidence: number }>
  ): Promise<void> {
    const conceptRepo = this.dataSource.getRepository(Concept);
    const itemConceptRepo = this.dataSource.getRepository(ItemConcept);

    for (const { concept, confidence } of concepts) {
      // Get or create concept
      let conceptEntity = await conceptRepo.findOne({
        where: { name: concept }
      });

      if (!conceptEntity) {
        conceptEntity = await conceptRepo.save({ name: concept });
      }

      // Check if relation already exists
      const existing = await itemConceptRepo.findOne({
        where: {
          itemId,
          conceptId: conceptEntity.id
        }
      });

      if (!existing) {
        // Create item-concept relation with confidence
        await itemConceptRepo.save({
          itemId,
          conceptId: conceptEntity.id,
          confidence
        });
      } else {
        // Update confidence if relation exists
        await itemConceptRepo.update(
          { itemId, conceptId: conceptEntity.id },
          { confidence }
        );
      }
    }
  }

  /**
   * Get keywords for an item
   */
  async getKeywordsForItem(itemId: number): Promise<Array<{ keyword: string; weight: number }>> {
    const itemKeywordRepo = this.dataSource.getRepository(ItemKeyword);
    
    const relations = await itemKeywordRepo
      .createQueryBuilder('ik')
      .leftJoinAndSelect('ik.keyword', 'k')
      .where('ik.itemId = :itemId', { itemId })
      .orderBy('ik.weight', 'DESC')
      .getMany();

    return relations.map(r => ({
      keyword: r.keyword.word,
      weight: r.weight
    }));
  }

  /**
   * Get concepts for an item
   */
  async getConceptsForItem(itemId: number): Promise<Array<{ concept: string; confidence: number }>> {
    const itemConceptRepo = this.dataSource.getRepository(ItemConcept);
    
    const relations = await itemConceptRepo
      .createQueryBuilder('ic')
      .leftJoinAndSelect('ic.concept', 'c')
      .where('ic.itemId = :itemId', { itemId })
      .orderBy('ic.confidence', 'DESC')
      .getMany();

    return relations.map(r => ({
      concept: r.concept.name,
      confidence: r.confidence
    }));
  }

  /**
   * Clean up orphaned keywords and concepts
   */
  async cleanupOrphaned(): Promise<void> {
    // Delete keywords with no items
    const keywordIds = await this.dataSource
      .getRepository(ItemKeyword)
      .createQueryBuilder('ik')
      .select('DISTINCT ik.keywordId', 'keywordId')
      .getRawMany();
    
    const usedKeywordIds = keywordIds.map(k => k.keywordId);
    
    if (usedKeywordIds.length > 0) {
      await this.dataSource
        .createQueryBuilder()
        .delete()
        .from(Keyword)
        .where('id NOT IN (:...ids)', { ids: usedKeywordIds })
        .execute();
    }

    // Delete concepts with no items
    const conceptIds = await this.dataSource
      .getRepository(ItemConcept)
      .createQueryBuilder('ic')
      .select('DISTINCT ic.conceptId', 'conceptId')
      .getRawMany();
    
    const usedConceptIds = conceptIds.map(c => c.conceptId);
    
    if (usedConceptIds.length > 0) {
      await this.dataSource
        .createQueryBuilder()
        .delete()
        .from(Concept)
        .where('id NOT IN (:...ids)', { ids: usedConceptIds })
        .execute();
    }
  }
}