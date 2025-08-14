import { PrismaClient } from '@prisma/client';

export class GraphService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Add bidirectional relation between items (manual relations only)
   */
  async addBidirectionalRelation(sourceId: number, targetId: number) {
    await this.prisma.$transaction([
      // Add forward relation
      this.prisma.itemRelation.upsert({
        where: {
          sourceId_targetId: {
            sourceId,
            targetId
          }
        },
        update: {},
        create: {
          sourceId,
          targetId
        }
      }),
      // Add reverse relation
      this.prisma.itemRelation.upsert({
        where: {
          sourceId_targetId: {
            sourceId: targetId,
            targetId: sourceId
          }
        },
        update: {},
        create: {
          sourceId: targetId,
          targetId: sourceId
        }
      })
    ]);
  }

  /**
   * Remove bidirectional relation
   */
  async removeBidirectionalRelation(sourceId: number, targetId: number) {
    await this.prisma.$transaction([
      this.prisma.itemRelation.deleteMany({
        where: {
          OR: [
            { sourceId, targetId },
            { sourceId: targetId, targetId: sourceId }
          ]
        }
      })
    ]);
  }

  /**
   * Get related items with depth traversal (BFS)
   */
  async getRelatedItems(itemId: number, depth: number = 1, types?: string[]) {
    const visited = new Set<number>();
    const queue: { id: number; distance: number }[] = [{ id: itemId, distance: 0 }];
    const results: Array<Record<string, unknown>> = [];
    const edges: { source: number; target: number; type: string }[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.distance > depth) {
        break;
      }

      if (!visited.has(current.id)) {
        visited.add(current.id);

        const item = await this.prisma.item.findUnique({
          where: { id: current.id },
          include: {
            status: true,
            tags: { include: { tag: true } },
            relationsFrom: true,
            relationsTo: true
          }
        });

        if (item) {
          if (!types || types.includes(item.type)) {
            results.push({
              ...item,
              distance: current.distance
            });
          }

          // Add relations to queue
          const relations = [...item.relationsFrom, ...item.relationsTo];
          for (const rel of relations) {
            const nextId = rel.sourceId === current.id ? rel.targetId : rel.sourceId;
            if (!visited.has(nextId)) {
              queue.push({ id: nextId, distance: current.distance + 1 });
              edges.push({
                source: rel.sourceId,
                target: rel.targetId,
                type: 'manual' // All relations are manual now
              });
            }
          }
        }
      }
    }

    return { items: results, edges };
  }

  /**
   * Find shortest path between two items (Dijkstra)
   */
  async findShortestPath(startId: number, endId: number): Promise<number[] | null> {
    const distances = new Map<number, number>();
    const previous = new Map<number, number | null>();
    const unvisited = new Set<number>();

    // Initialize
    distances.set(startId, 0);
    unvisited.add(startId);

    // Get all items with relations
    const items = await this.prisma.item.findMany({
      include: {
        relationsFrom: true,
        relationsTo: true
      }
    });

    for (const item of items) {
      if (item.id !== startId) {
        distances.set(item.id, Infinity);
        unvisited.add(item.id);
      }
      previous.set(item.id, null);
    }

    while (unvisited.size > 0) {
      // Find node with minimum distance
      let current: number | null = null;
      let minDistance = Infinity;

      for (const node of unvisited) {
        const dist = distances.get(node) || Infinity;
        if (dist < minDistance) {
          minDistance = dist;
          current = node;
        }
      }

      if (current === null || minDistance === Infinity) {
        break;
      }
      if (current === endId) {
        break;
      }

      unvisited.delete(current);

      // Get neighbors
      const currentItem = items.find(i => i.id === current);
      if (!currentItem) {
        continue;
      }

      const neighbors = new Set<number>();
      for (const rel of currentItem.relationsFrom) {
        neighbors.add(rel.targetId);
      }
      for (const rel of currentItem.relationsTo) {
        neighbors.add(rel.sourceId);
      }

      // Update distances
      for (const neighbor of neighbors) {
        if (!unvisited.has(neighbor)) {
          continue;
        }

        const alt = (distances.get(current) || 0) + 1;
        if (alt < (distances.get(neighbor) || Infinity)) {
          distances.set(neighbor, alt);
          previous.set(neighbor, current);
        }
      }
    }

    // Reconstruct path
    if (!previous.has(endId) || previous.get(endId) === null) {
      return null;
    }

    const path: number[] = [];
    let current: number | null = endId;

    while (current !== null) {
      path.unshift(current);
      current = previous.get(current) || null;
    }

    return path;
  }

  /**
   * Get graph statistics
   */
  async getGraphStats() {
    const [itemCount, relationCount, items] = await Promise.all([
      this.prisma.item.count(),
      this.prisma.itemRelation.count(),
      this.prisma.item.findMany({
        include: {
          _count: {
            select: {
              relationsFrom: true,
              relationsTo: true
            }
          }
        }
      })
    ]);

    const connectionCounts = items.map(
      item => item._count.relationsFrom + item._count.relationsTo
    );

    const avgConnections = connectionCounts.length > 0
      ? connectionCounts.reduce((a, b) => a + b, 0) / connectionCounts.length
      : 0;

    const maxConnections = Math.max(...connectionCounts, 0);
    const isolatedNodes = connectionCounts.filter(c => c === 0).length;

    return {
      totalItems: itemCount,
      totalRelations: relationCount,
      avgConnections,
      maxConnections,
      isolatedNodes
    };
  }

  /**
   * Detect and fix graph inconsistencies
   */
  async fixGraphIntegrity() {
    const results = {
      deadLinks: 0,
      duplicates: 0,
      selfReferences: 0
    };

    // Remove dead links (references to non-existent items)
    const relations = await this.prisma.itemRelation.findMany();
    const itemIds = new Set(
      (await this.prisma.item.findMany({ select: { id: true } })).map(i => i.id)
    );

    for (const rel of relations) {
      if (!itemIds.has(rel.sourceId) || !itemIds.has(rel.targetId)) {
        await this.prisma.itemRelation.delete({
          where: {
            sourceId_targetId: {
              sourceId: rel.sourceId,
              targetId: rel.targetId
            }
          }
        });
        results.deadLinks++;
      }
    }

    // Remove self-references (items relating to themselves)
    const selfRefsQuery = await this.prisma.itemRelation.findMany({
      where: {}
    });

    let selfRefCount = 0;
    for (const rel of selfRefsQuery) {
      if (rel.sourceId === rel.targetId) {
        await this.prisma.itemRelation.delete({
          where: {
            sourceId_targetId: {
              sourceId: rel.sourceId,
              targetId: rel.targetId
            }
          }
        });
        selfRefCount++;
      }
    }
    results.selfReferences = selfRefCount;

    return results;
  }
}