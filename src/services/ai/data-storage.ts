import pkg from '@prisma/client';
const { PrismaClient } = pkg;

export class DataStorage {
  constructor(private prisma: InstanceType<typeof PrismaClient>) {}

  /**
   * Store concepts for an item in normalized table
   */
  async storeConceptsForItem(itemId: number, concepts: Array<{ concept: string; confidence: number }>): Promise<void> {
    if (!concepts || concepts.length === 0) {
      return;
    }

    try {
      // Clear existing concepts for this item
      await this.prisma.itemConcept.deleteMany({
        where: { itemId }
      });

      // Create or find concepts and create relations
      for (const conceptData of concepts.slice(0, 20)) {
        if (!conceptData.concept || conceptData.confidence <= 0) {
          continue;
        }

        const conceptName = conceptData.concept.toLowerCase().trim();
        const confidence = Math.min(Math.max(conceptData.confidence, 0), 1);

        // Create or find the concept
        const concept = await this.prisma.concept.upsert({
          where: { name: conceptName },
          update: {},
          create: { name: conceptName }
        });

        // Create the relation
        await this.prisma.itemConcept.upsert({
          where: {
            itemId_conceptId: {
              itemId,
              conceptId: concept.id
            }
          },
          update: { confidence },
          create: {
            itemId,
            conceptId: concept.id,
            confidence
          }
        });
      }
    } catch {
      // Failed to store concepts, silently continue
    }
  }

  /**
   * Store keywords for an item in normalized table
   */
  async storeKeywordsForItem(itemId: number, keywords: Array<{ keyword?: string; word?: string; weight: number }>): Promise<void> {
    if (!keywords || keywords.length === 0) {
      return;
    }

    try {
      // Clear existing keywords for this item
      await this.prisma.itemKeyword.deleteMany({
        where: { itemId }
      });

      // Create or find keywords and create relations
      for (const keywordData of keywords.slice(0, 15)) {
        const keywordText = keywordData.keyword || keywordData.word;
        if (!keywordText || keywordData.weight <= 0) {
          continue;
        }

        const word = keywordText.toLowerCase().trim();
        const weight = Math.min(Math.max(keywordData.weight, 0), 1);

        // Create or find the keyword
        const keyword = await this.prisma.keyword.upsert({
          where: { word },
          update: {},
          create: { word }
        });

        // Create the relation
        await this.prisma.itemKeyword.upsert({
          where: {
            itemId_keywordId: {
              itemId,
              keywordId: keyword.id
            }
          },
          update: { weight },
          create: {
            itemId,
            keywordId: keyword.id,
            weight
          }
        });
      }
    } catch {
      // Failed to store keywords, silently continue
    }
  }
}