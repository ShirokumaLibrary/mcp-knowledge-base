import { PrismaClient, Prisma } from '@prisma/client';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { CreateItemSchema, GetItemSchema, UpdateItemSchema, DeleteItemSchema } from '../database/schemas.js';
import { getStatusId, ensureTags } from '../database/database-init.js';
import { validateType } from '../../utils/validation.js';

// Type definition for update data - using Prisma generated type
type UpdateItemData = Prisma.ItemUpdateInput;

export class CRUDHandlers {
  constructor(private prisma: PrismaClient) {}

  async createItem(args: unknown) {
    const params = CreateItemSchema.parse(args);

    // Validate and normalize type
    const validatedType = validateType(params.type, false); // Strict validation for MCP

    const statusId = await getStatusId(this.prisma, params.status);
    const tags = params.tags ? await ensureTags(this.prisma, params.tags) : [];

    // Import enhanced AI service for one-time enrichment
    const { EnhancedAIService } = await import('../../services/enhanced-ai.service.js');
    const enhancedAI = new EnhancedAIService(this.prisma);

    // Extract weighted keywords and embedding ONCE using AI
    const enrichedMetadata = await enhancedAI.extractWeightedKeywords({
      title: params.title,
      description: params.description,
      content: params.content
    });

    // Create the item with AI-enriched metadata
    const item = await this.prisma.item.create({
      data: {
        type: validatedType,
        title: params.title,
        description: params.description,
        content: params.content,
        aiSummary: enrichedMetadata.summary,
        statusId,
        priority: params.priority,
        category: params.category || null,
        startDate: params.startDate ? new Date(params.startDate) : null,
        endDate: params.endDate ? new Date(params.endDate) : null,
        version: params.version || null,
        searchIndex: enrichedMetadata.keywords.map(k => k.keyword).join(' '),
        embedding: enrichedMetadata.embedding,
        tags: {
          create: tags.map((tag) => ({ tagId: tag.id }))
        }
      },
      include: {
        status: true,
        tags: {
          include: {
            tag: true
          }
        }
      }
    });

    // Store keywords in normalized table
    await enhancedAI.storeKeywordsForItem(
      item.id,
      enrichedMetadata.keywords
    );

    // Store concepts in normalized table
    await enhancedAI.storeConceptsForItem(
      item.id,
      enrichedMetadata.concepts
    );

    // Handle manual relations if specified
    if (params.related && params.related.length > 0) {
      const { GraphService } = await import('../../services/graph-service.js');
      const graphService = new GraphService(this.prisma);

      for (const targetId of params.related) {
        await graphService.addBidirectionalRelation(item.id, targetId);
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: `Item created successfully with ID: ${item.id}`
        }
      ]
    };
  }

  async getItem(args: unknown) {
    const params = GetItemSchema.parse(args);
    const item = await this.prisma.item.findUnique({
      where: { id: params.id },
      include: {
        status: true,
        tags: {
          include: {
            tag: true
          }
        }
      }
    });

    if (!item) {
      throw new McpError(ErrorCode.InvalidParams, `Item with ID ${params.id} not found`);
    }

    const result: Record<string, unknown> = {
      ...item,
      status: item.status.name,
      tags: item.tags.map((t) => t.tag.name),
      related: []
    };

    // Always remove embedding from response (internal use only)
    delete result.embedding;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  async updateItem(args: unknown) {
    const params = UpdateItemSchema.parse(args);

    const existingItem = await this.prisma.item.findUnique({
      where: { id: params.id }
    });

    if (!existingItem) {
      throw new McpError(ErrorCode.InvalidParams, `Item with ID ${params.id} not found`);
    }

    const updateData: UpdateItemData = {};
    // Handle type field update with validation
    if (params.type !== undefined) {
      // Validate type format (using the already imported validateType)
      if (!validateType(params.type)) {
        throw new McpError(
          ErrorCode.InvalidParams,
          'Type must contain only lowercase letters, numbers, and underscores (a-z, 0-9, _)'
        );
      }
      updateData.type = params.type;
    }
    if (params.title !== undefined) {
      updateData.title = params.title;
    }
    if (params.description !== undefined) {
      updateData.description = params.description;
    }
    if (params.content !== undefined) {
      updateData.content = params.content;
    }
    if (params.status !== undefined) {
      const statusId = await getStatusId(this.prisma, params.status);
      updateData.status = { connect: { id: statusId } };
    }
    if (params.priority !== undefined) {
      updateData.priority = params.priority;
    }
    if (params.category !== undefined) {
      updateData.category = params.category;
    }
    if (params.startDate !== undefined) {
      updateData.startDate = new Date(params.startDate);
    }
    if (params.endDate !== undefined) {
      updateData.endDate = new Date(params.endDate);
    }
    if (params.version !== undefined) {
      updateData.version = params.version;
    }

    if (params.tags !== undefined) {
      await this.prisma.itemTag.deleteMany({
        where: { itemId: params.id }
      });
      const tags = await ensureTags(this.prisma, params.tags);
      updateData.tags = {
        create: tags.map((tag) => ({ tagId: tag.id }))
      };
    }

    // Check if content, title, or description is changing and needs AI enrichment
    const contentChanged = params.content !== undefined &&
                          params.content.trim() !== existingItem.content.trim();

    const titleChanged = params.title !== undefined &&
                        params.title !== existingItem.title;

    const descriptionChanged = params.description !== undefined &&
                              params.description !== existingItem.description;

    // Trigger AI enrichment when content, title, or description actually changes
    const shouldEnrich = contentChanged || titleChanged || descriptionChanged;

    if (shouldEnrich) {
      try {
        // Import enhanced AI service for enrichment
        const { EnhancedAIService } = await import('../../services/enhanced-ai.service.js');
        const enhancedAI = new EnhancedAIService(this.prisma);

        // Use updated values if provided, otherwise use existing values
        const finalTitle = params.title !== undefined ? params.title : existingItem.title;
        const finalDescription = params.description !== undefined ? params.description : existingItem.description;
        const finalContent = params.content !== undefined ? params.content : existingItem.content;

        // Extract weighted keywords and embedding using AI with timeout
        const enrichmentPromise = enhancedAI.extractWeightedKeywords({
          title: finalTitle,
          description: finalDescription,
          content: finalContent
        });
        
        // Add 3 second timeout for AI enrichment
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AI enrichment timeout')), 3000)
        );
        
        const enrichedMetadata = await Promise.race([enrichmentPromise, timeoutPromise]) as Awaited<ReturnType<typeof enhancedAI.extractWeightedKeywords>>;

        // Add AI-enriched metadata to update
        updateData.aiSummary = enrichedMetadata.summary;
        updateData.searchIndex = enrichedMetadata.keywords.map(k => k.keyword).join(' ');
        updateData.embedding = enrichedMetadata.embedding;

        // Clean up old keywords and concepts
        await this.prisma.itemKeyword.deleteMany({
          where: { itemId: params.id }
        });
        await this.prisma.itemConcept.deleteMany({
          where: { itemId: params.id }
        });

        // Store new keywords in normalized table
        await enhancedAI.storeKeywordsForItem(
          params.id,
          enrichedMetadata.keywords
        );

        // Store new concepts in normalized table
        await enhancedAI.storeConceptsForItem(
          params.id,
          enrichedMetadata.concepts
        );
      } catch (error) {
        // Log AI enrichment failure but continue with regular update
        const { logger } = await import('../../utils/logger.js');
        logger.warn(`AI enrichment failed during update for item ${params.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    const _item = await this.prisma.item.update({
      where: { id: params.id },
      data: updateData,
      include: {
        status: true,
        tags: {
          include: {
            tag: true
          }
        }
      }
    });

    // Handle manual relations if specified
    if (params.related !== undefined) {
      const { GraphService } = await import('../../services/graph-service.js');
      const graphService = new GraphService(this.prisma);

      // Remove all existing relations
      await this.prisma.itemRelation.deleteMany({
        where: {
          OR: [
            { sourceId: params.id },
            { targetId: params.id }
          ]
        }
      });

      // Add new relations
      if (params.related.length > 0) {
        for (const targetId of params.related) {
          await graphService.addBidirectionalRelation(params.id, targetId);
        }
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: 'Item updated successfully'
        }
      ]
    };
  }

  async deleteItem(args: unknown) {
    const params = DeleteItemSchema.parse(args);
    await this.prisma.item.delete({
      where: { id: params.id }
    });

    return {
      content: [
        {
          type: 'text',
          text: `Item ${params.id} deleted successfully`
        }
      ]
    };
  }
}
