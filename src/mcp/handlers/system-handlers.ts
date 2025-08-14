import { PrismaClient } from '@prisma/client';
import { UpdateCurrentStateSchema } from '../database/schemas.js';

export class SystemHandlers {
  constructor(private prisma: PrismaClient) {}

  async getCurrentState() {
    const currentState = await this.prisma.systemState.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!currentState) {
      return {
        content: [
          {
            type: 'text',
            text: 'No active system state found'
          }
        ]
      };
    }

    const result = {
      id: currentState.id,
      version: currentState.version,
      content: currentState.content,
      summary: currentState.summary,
      metrics: currentState.metrics ? JSON.parse(currentState.metrics) : null,
      context: currentState.context ? JSON.parse(currentState.context) : null,
      checkpoint: currentState.checkpoint ? JSON.parse(currentState.checkpoint) : null,
      relatedItems: [],
      tags: JSON.parse(currentState.tags || '[]'),
      metadata: currentState.metadata ? JSON.parse(currentState.metadata) : null,
      createdAt: currentState.createdAt,
      updatedAt: currentState.updatedAt
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  async updateCurrentState(args: unknown) {
    const params = UpdateCurrentStateSchema.parse(args);

    // Deactivate any existing active state
    await this.prisma.systemState.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });

    // Calculate current metrics
    const { GraphService } = await import('../../services/graph-service.js');
    const graphService = new GraphService(this.prisma);

    const [totalItems, totalRelations, graphStats] = await Promise.all([
      this.prisma.item.count(),
      this.prisma.itemRelation.count(),
      graphService.getGraphStats()
    ]);

    const metrics = {
      totalItems,
      totalRelations,
      avgConnections: graphStats.avgConnections,
      maxConnections: graphStats.maxConnections,
      isolatedNodes: graphStats.isolatedNodes,
      timestamp: new Date().toISOString()
    };

    // Create new active state
    const created = await this.prisma.systemState.create({
      data: {
        content: params.content,
        summary: params.content.split('\n').slice(0, 3).join(' ').substring(0, 200),
        metrics: JSON.stringify(metrics),
        context: params.metadata ? JSON.stringify(params.metadata) : null,
        relatedItems: '[]',
        tags: params.tags ? JSON.stringify(params.tags) : '[]',
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        isActive: true
      }
    });

    return {
      content: [
        {
          type: 'text',
          text: `System state saved successfully (ID: ${created.id})`
        }
      ]
    };
  }
}