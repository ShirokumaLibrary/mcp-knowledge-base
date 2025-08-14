import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { SearchItemsSchema, ListItemsSchema } from '../database/schemas.js';
import { getStatusId } from '../database/database-init.js';
import searchQueryParser from 'search-query-parser';

export class SearchHandlers {
  constructor(private prisma: InstanceType<typeof PrismaClient>) {}

  async searchItems(args: unknown) {
    const params = SearchItemsSchema.parse(args);

    // Parse query with search-query-parser for AND/OR support
    const parsedQuery = searchQueryParser.parse(params.query, {
      keywords: ['type', 'status', 'priority', 'tag'],
      ranges: ['date', 'created', 'updated'],
      tokenize: true
    });

    let where: Record<string, unknown> = {};

    // Handle structured query or fallback to simple text search
    if (parsedQuery && typeof parsedQuery === 'object' && !Array.isArray(parsedQuery)) {
      const conditions: Record<string, unknown>[] = [];

      // Handle text search terms
      if (parsedQuery.text) {
        const textTerms = Array.isArray(parsedQuery.text) ? parsedQuery.text : [parsedQuery.text];
        const textConditions = textTerms.map(term => ({
          OR: [
            { title: { contains: term } },
            { description: { contains: term } },
            { content: { contains: term } }
          ]
        }));
        conditions.push(...textConditions);
      }

      // Handle type filter
      if (parsedQuery.type) {
        const types = Array.isArray(parsedQuery.type) ? parsedQuery.type : [parsedQuery.type];
        conditions.push({ type: { in: types } });
      }

      // Handle tag filter
      if (parsedQuery.tag) {
        const tags = Array.isArray(parsedQuery.tag) ? parsedQuery.tag : [parsedQuery.tag];
        conditions.push({
          tags: {
            some: {
              tag: {
                name: { in: tags }
              }
            }
          }
        });
      }

      // Handle priority filter
      if (parsedQuery.priority) {
        const priorities = Array.isArray(parsedQuery.priority) ? parsedQuery.priority : [parsedQuery.priority];
        conditions.push({ priority: { in: priorities } });
      }

      // Handle date range filters
      if (parsedQuery.date) {
        const dateRange = parsedQuery.date;
        try {
          if (dateRange.from && dateRange.to) {
            const fromDate = new Date(dateRange.from);
            const toDate = new Date(dateRange.to);
            if (!isNaN(fromDate.getTime()) && !isNaN(toDate.getTime())) {
              conditions.push({
                OR: [
                  {
                    AND: [
                      { startDate: { lte: toDate } },
                      { endDate: { gte: fromDate } }
                    ]
                  },
                  {
                    AND: [
                      { startDate: { gte: fromDate } },
                      { startDate: { lte: toDate } }
                    ]
                  }
                ]
              });
            }
          } else if (dateRange.from) {
            const fromDate = new Date(dateRange.from);
            if (!isNaN(fromDate.getTime())) {
              conditions.push({
                OR: [
                  { startDate: { gte: fromDate } },
                  { endDate: { gte: fromDate } }
                ]
              });
            }
          } else if (dateRange.to) {
            const toDate = new Date(dateRange.to);
            if (!isNaN(toDate.getTime())) {
              conditions.push({
                OR: [
                  { startDate: { lte: toDate } },
                  { endDate: { lte: toDate } }
                ]
              });
            }
          }
        } catch {
          // Invalid date format in date range, skip this filter
        }
      }

      // Handle created date range
      if (parsedQuery.created) {
        const createdRange = parsedQuery.created;
        try {
          if (createdRange.from && createdRange.to) {
            const fromDate = new Date(createdRange.from);
            const toDate = new Date(createdRange.to);
            if (!isNaN(fromDate.getTime()) && !isNaN(toDate.getTime())) {
              toDate.setHours(23, 59, 59, 999);
              conditions.push({
                createdAt: {
                  gte: fromDate,
                  lte: toDate
                }
              });
            }
          } else if (createdRange.from) {
            const fromDate = new Date(createdRange.from);
            if (!isNaN(fromDate.getTime())) {
              conditions.push({ createdAt: { gte: fromDate } });
            }
          } else if (createdRange.to) {
            const toDate = new Date(createdRange.to);
            if (!isNaN(toDate.getTime())) {
              toDate.setHours(23, 59, 59, 999);
              conditions.push({ createdAt: { lte: toDate } });
            }
          }
        } catch {
          // Invalid date format in created range, skip this filter
        }
      }

      // Handle updated date range
      if (parsedQuery.updated) {
        const updatedRange = parsedQuery.updated;
        try {
          if (updatedRange.from && updatedRange.to) {
            const fromDate = new Date(updatedRange.from);
            const toDate = new Date(updatedRange.to);
            if (!isNaN(fromDate.getTime()) && !isNaN(toDate.getTime())) {
              toDate.setHours(23, 59, 59, 999);
              conditions.push({
                updatedAt: {
                  gte: fromDate,
                  lte: toDate
                }
              });
            }
          } else if (updatedRange.from) {
            const fromDate = new Date(updatedRange.from);
            if (!isNaN(fromDate.getTime())) {
              conditions.push({ updatedAt: { gte: fromDate } });
            }
          } else if (updatedRange.to) {
            const toDate = new Date(updatedRange.to);
            if (!isNaN(toDate.getTime())) {
              toDate.setHours(23, 59, 59, 999);
              conditions.push({ updatedAt: { lte: toDate } });
            }
          }
        } catch {
          // Invalid date format in updated range, skip this filter
        }
      }

      where = conditions.length > 0 ? { AND: conditions } : {};
    } else {
      // Fallback to simple search
      where = {
        OR: [
          { title: { contains: params.query } },
          { description: { contains: params.query } },
          { content: { contains: params.query } }
        ]
      };
    }

    if (params.types && params.types.length > 0) {
      const andConditions = where.AND as Record<string, unknown>[] | undefined;
      where = andConditions ? { AND: [...andConditions, { type: { in: params.types } }] } : { ...where, type: { in: params.types } };
    }

    const items = await this.prisma.item.findMany({
      where,
      include: {
        status: true,
        tags: {
          include: {
            tag: true
          }
        }
      },
      take: params.limit,
      skip: params.offset,
      orderBy: { updatedAt: 'desc' }
    });

    const results = items.map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      description: item.description,
      status: item.status.name,
      priority: item.priority,
      tags: item.tags.map((t) => t.tag.name),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(results, null, 2)
        }
      ]
    };
  }

  async listItems(args: unknown) {
    const params = ListItemsSchema.parse(args);
    const where: Record<string, unknown> = {};

    if (params.type) {
      where.type = params.type;
    }
    if (params.status && params.status.length > 0) {
      // Process each status individually to handle missing statuses gracefully
      const statusPromises = params.status.map(async (s) => {
        try {
          return await getStatusId(this.prisma, s);
        } catch {
          // Return null if status not found
          return null;
        }
      });

      const statusResults = await Promise.all(statusPromises);
      // Filter out null values (statuses that weren't found)
      const validStatusIds = statusResults.filter((id): id is number => id !== null);

      // Only apply filter if we have valid status IDs
      if (validStatusIds.length > 0) {
        where.statusId = { in: validStatusIds };
      }
    }
    if (params.priority && params.priority.length > 0) {
      where.priority = { in: params.priority };
    }
    if (params.tags && params.tags.length > 0) {
      where.tags = {
        some: {
          tag: {
            name: { in: params.tags }
          }
        }
      };
    }

    const orderBy: Record<string, string> = {};
    if (params.sortBy === 'created') {
      orderBy.createdAt = params.sortOrder || 'desc';
    } else if (params.sortBy === 'updated') {
      orderBy.updatedAt = params.sortOrder || 'desc';
    } else if (params.sortBy === 'priority') {
      orderBy.priority = params.sortOrder || 'asc';
    } else {
      orderBy.updatedAt = 'desc';
    }

    const [items, total] = await Promise.all([
      this.prisma.item.findMany({
        where,
        include: {
          status: true,
          tags: {
            include: {
              tag: true
            }
          }
        },
        take: params.limit,
        skip: params.offset,
        orderBy
      }),
      this.prisma.item.count({ where })
    ]);

    const results = items.map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      description: item.description,
      status: item.status.name,
      priority: item.priority,
      tags: item.tags.map((t) => t.tag.name),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ items: results, total, limit: params.limit, offset: params.offset }, null, 2)
        }
      ]
    };
  }

  async getStats() {
    const [totalItems, itemsByType, itemsByStatus, itemsByPriority, tagStats] = await Promise.all([
      this.prisma.item.count(),
      this.prisma.item.groupBy({
        by: ['type'],
        _count: true
      }),
      this.prisma.item.groupBy({
        by: ['statusId'],
        _count: true
      }),
      this.prisma.item.groupBy({
        by: ['priority'],
        _count: true
      }),
      this.prisma.itemTag.groupBy({
        by: ['tagId'],
        _count: true,
        orderBy: {
          _count: {
            tagId: 'desc'
          }
        },
        take: 10
      })
    ]);

    const tags = await this.prisma.tag.findMany({
      where: {
        id: {
          in: tagStats.map((s) => s.tagId)
        }
      }
    });

    const tagMap = new Map(tags.map((t) => [t.id, t.name]));
    const mostUsedTags = tagStats.map((s) => ({
      tag: tagMap.get(s.tagId) || 'Unknown',
      count: s._count
    }));

    const statuses = await this.prisma.status.findMany();
    const statusMap = new Map(statuses.map((s) => [s.id, s.name]));

    const result = {
      totalItems,
      itemsByType: Object.fromEntries(itemsByType.map((t) => [t.type, t._count])),
      itemsByStatus: Object.fromEntries(itemsByStatus.map((s) => [statusMap.get(s.statusId) || 'Unknown', s._count])),
      itemsByPriority: Object.fromEntries(itemsByPriority.map((p) => [p.priority, p._count])),
      mostUsedTags
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

  async getTags() {
    const tags = await this.prisma.tag.findMany({
      include: {
        _count: {
          select: { items: true }
        }
      },
      orderBy: {
        items: {
          _count: 'desc'
        }
      }
    });

    const result = tags.map((tag) => ({
      name: tag.name,
      count: tag._count.items
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }
}