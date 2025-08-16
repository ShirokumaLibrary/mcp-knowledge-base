import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { AddRelationsSchema } from '../database/schemas.js';

export class RelationHandlers {
  constructor(private prisma: InstanceType<typeof PrismaClient>) {}

  async getRelatedItems(args: unknown) {
    const params = args as Record<string, unknown>;

    // Check if strategy parameters are provided for unified search
    if (params.strategy || params.weights || params.thresholds) {
      // Import and instantiate EnhancedAI service for strategy-based search
      const { EnhancedAIService } = await import('../../services/enhanced-ai.service.js');
      const enhancedAI = new EnhancedAIService(this.prisma);

      // Use unified strategy-based search
      const strategy = {
        strategy: (params.strategy as 'hybrid' | 'embedding' | 'keywords' | 'concepts') || 'hybrid',
        weights: params.weights as Record<string, number> | undefined,
        thresholds: params.thresholds as Record<string, number> | undefined
      };

      const relatedItems = await enhancedAI.findRelatedItemsUnified(params.id as number, strategy);

      // Get full item details for results (excluding content to reduce size)
      const itemDetails = await Promise.all(
        relatedItems.map(async (related) => {
          const item = await this.prisma.item.findUnique({
            where: { id: related.id },
            include: {
              status: true,
              tags: { include: { tag: true } }
            }
          });

          if (!item) {
            return null;
          }

          // Exclude content and other large fields from response
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { content, aiSummary, searchIndex, embedding, ...itemWithoutContent } = item;

          return {
            ...itemWithoutContent,
            status: item.status.name,
            tags: item.tags.map((t: { tag: { name: string } }) => t.tag.name) || [],
            related: [],
            searchScore: related.score,
            searchReason: related.reason,
            distance: 1
          };
        })
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              items: itemDetails.filter(item => item !== null),
              edges: relatedItems.map(r => ({ source: params.id, target: r.id, type: 'strategy-based' })),
              strategy: strategy.strategy,
              weights: strategy.weights
            }, null, 2)
          }
        ]
      };
    } else {
      // Use traditional graph traversal for backward compatibility
      const { GraphService } = await import('../../services/graph-service.js');
      const graphService = new GraphService(this.prisma);

      const parsedParams = { id: params.id as number, depth: (params.depth as number) || 1, types: params.types as string[] | undefined };
      const result = await graphService.getRelatedItems(parsedParams.id, parsedParams.depth, parsedParams.types);

      // Format results for output (excluding content to reduce size)
      const formattedResults = result.items.map((item: Record<string, unknown>) => {
        const itemStatus = item.status as { name: string };
        const itemTags = item.tags as Array<{ tag: { name: string } }>;

        // Exclude content and other large fields from response
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { content, aiSummary, searchIndex, embedding, ...itemWithoutContent } = item;

        return {
          ...itemWithoutContent,
          status: itemStatus.name,
          tags: itemTags.map((t: { tag: { name: string } }) => t.tag.name),
          related: []
        };
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              items: formattedResults,
              edges: result.edges
            }, null, 2)
          }
        ]
      };
    }
  }

  async addRelations(args: unknown) {
    const params = AddRelationsSchema.parse(args);
    const item = await this.prisma.item.findUnique({
      where: { id: params.sourceId }
    });

    if (!item) {
      throw new McpError(ErrorCode.InvalidParams, `Item with ID ${params.sourceId} not found`);
    }

    // Add bidirectional relations using GraphService with new schema
    const { GraphService } = await import('../../services/graph-service.js');
    const graphService = new GraphService(this.prisma);

    for (const targetId of params.targetIds) {
      await graphService.addBidirectionalRelation(params.sourceId, targetId);
    }

    return {
      content: [
        {
          type: 'text',
          text: `Bidirectional relations added successfully between item ${params.sourceId} and items ${params.targetIds.join(', ')}`
        }
      ]
    };
  }
}