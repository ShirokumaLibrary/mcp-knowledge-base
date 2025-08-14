/**
 * Status Search Test Suite
 * 
 * Test Requirements:
 * 1. Verify list_items API handles multiple status filters correctly
 * 2. Ensure "In Progress" status is properly processed
 * 3. Test case-insensitive status matching
 * 4. Handle non-existent status gracefully
 * 
 * Test Target:
 * - src/mcp/database/database-init.ts - getStatusId function
 * - src/mcp/handlers/search-handlers.ts - listItems API
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { SearchHandlers } from '../src/mcp/handlers/search-handlers';
import { getStatusId } from '../src/mcp/database/database-init';

describe('Status Search Functionality', () => {
  let prisma: PrismaClient;
  let searchHandlers: SearchHandlers;
  let testItemIds: number[] = [];
  let statusMap: Map<string, number> = new Map();

  beforeAll(async () => {
    // Initialize database connection
    prisma = new PrismaClient({
      datasourceUrl: process.env.TEST_DATABASE_URL || 'file:./test.db'
    });

    searchHandlers = new SearchHandlers(prisma);

    // Create test statuses if they don't exist
    const testStatuses = ['Open', 'In Progress', 'Pending', 'Closed', 'On Hold'];
    
    for (const statusName of testStatuses) {
      let status = await prisma.status.findUnique({
        where: { name: statusName }
      });
      
      if (!status) {
        status = await prisma.status.create({
          data: {
            name: statusName,
            sortOrder: testStatuses.indexOf(statusName) + 1,
            isClosable: statusName === 'Closed'
          }
        });
      }
      
      statusMap.set(statusName, status.id);
    }

    // Create test items with different statuses
    const testItems = [
      { type: 'issue', title: 'Open Issue 1', status: 'Open' },
      { type: 'issue', title: 'Open Issue 2', status: 'Open' },
      { type: 'task', title: 'In Progress Task 1', status: 'In Progress' },
      { type: 'task', title: 'In Progress Task 2', status: 'In Progress' },
      { type: 'task', title: 'In Progress Task 3', status: 'In Progress' },
      { type: 'bug', title: 'Pending Bug 1', status: 'Pending' },
      { type: 'bug', title: 'Pending Bug 2', status: 'Pending' },
      { type: 'feature', title: 'Closed Feature', status: 'Closed' },
      { type: 'issue', title: 'On Hold Issue', status: 'On Hold' }
    ];

    for (const itemData of testItems) {
      const item = await prisma.item.create({
        data: {
          type: itemData.type,
          title: itemData.title,
          description: `Test ${itemData.status} item`,
          content: `This is a test item with status ${itemData.status}`,
          statusId: statusMap.get(itemData.status)!,
          priority: 'MEDIUM'
        }
      });
      testItemIds.push(item.id);
    }
  });

  afterAll(async () => {
    // Clean up test data
    if (testItemIds.length > 0) {
      await prisma.item.deleteMany({
        where: { id: { in: testItemIds } }
      });
    }
    
    await prisma.$disconnect();
  });

  describe('getStatusId function', () => {
    it('should find status by exact name match', async () => {
      const statusId = await getStatusId(prisma, 'Open');
      expect(statusId).toBe(statusMap.get('Open'));
    });

    it('should find "In Progress" status correctly', async () => {
      const statusId = await getStatusId(prisma, 'In Progress');
      expect(statusId).toBe(statusMap.get('In Progress'));
    });

    it('should throw error for non-existent status', async () => {
      await expect(getStatusId(prisma, 'NonExistent')).rejects.toThrow(
        "Status 'NonExistent' not found"
      );
    });

    it('should be case-sensitive (current behavior)', async () => {
      // Test current behavior - case sensitive
      await expect(getStatusId(prisma, 'open')).rejects.toThrow(
        "Status 'open' not found"
      );
      
      await expect(getStatusId(prisma, 'in progress')).rejects.toThrow(
        "Status 'in progress' not found"
      );
      
      await expect(getStatusId(prisma, 'IN PROGRESS')).rejects.toThrow(
        "Status 'IN PROGRESS' not found"
      );
    });
  });

  describe('listItems API - Single Status Filter', () => {
    it('should filter items by single status "Open"', async () => {
      const result = await searchHandlers.listItems({
        status: ['Open'],
        limit: 20
      });

      const data = JSON.parse(result.content[0].text);
      expect(data.items).toHaveLength(2);
      expect(data.items.every((item: any) => item.status === 'Open')).toBe(true);
    });

    it('should filter items by single status "In Progress"', async () => {
      const result = await searchHandlers.listItems({
        status: ['In Progress'],
        limit: 20
      });

      const data = JSON.parse(result.content[0].text);
      expect(data.items).toHaveLength(3);
      expect(data.items.every((item: any) => item.status === 'In Progress')).toBe(true);
      expect(data.items.map((item: any) => item.title)).toEqual(
        expect.arrayContaining([
          'In Progress Task 1',
          'In Progress Task 2',
          'In Progress Task 3'
        ])
      );
    });

    it('should filter items by single status "Pending"', async () => {
      const result = await searchHandlers.listItems({
        status: ['Pending'],
        limit: 20
      });

      const data = JSON.parse(result.content[0].text);
      expect(data.items).toHaveLength(2);
      expect(data.items.every((item: any) => item.status === 'Pending')).toBe(true);
    });
  });

  describe('listItems API - Multiple Status Filters', () => {
    it('should filter items by multiple statuses ["Open", "In Progress"]', async () => {
      const result = await searchHandlers.listItems({
        status: ['Open', 'In Progress'],
        limit: 20
      });

      const data = JSON.parse(result.content[0].text);
      expect(data.items).toHaveLength(5); // 2 Open + 3 In Progress
      
      const statuses = data.items.map((item: any) => item.status);
      expect(statuses).toEqual(
        expect.arrayContaining(['Open', 'In Progress'])
      );
      
      const openCount = statuses.filter((s: string) => s === 'Open').length;
      const inProgressCount = statuses.filter((s: string) => s === 'In Progress').length;
      
      expect(openCount).toBe(2);
      expect(inProgressCount).toBe(3);
    });

    it('should filter items by multiple statuses ["Open", "In Progress", "Pending"]', async () => {
      const result = await searchHandlers.listItems({
        status: ['Open', 'In Progress', 'Pending'],
        limit: 20
      });

      const data = JSON.parse(result.content[0].text);
      expect(data.items).toHaveLength(7); // 2 Open + 3 In Progress + 2 Pending
      
      const statusCounts = data.items.reduce((acc: any, item: any) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {});
      
      expect(statusCounts).toEqual({
        'Open': 2,
        'In Progress': 3,
        'Pending': 2
      });
    });

    it('should handle all statuses filter', async () => {
      const result = await searchHandlers.listItems({
        status: ['Open', 'In Progress', 'Pending', 'Closed', 'On Hold'],
        limit: 20
      });

      const data = JSON.parse(result.content[0].text);
      expect(data.items).toHaveLength(9); // All test items
    });
  });

  describe('listItems API - Error Handling', () => {
    it('should handle non-existent status gracefully', async () => {
      await expect(
        searchHandlers.listItems({
          status: ['NonExistent'],
          limit: 20
        })
      ).rejects.toThrow("Status 'NonExistent' not found");
    });

    it('should handle mix of valid and invalid statuses', async () => {
      await expect(
        searchHandlers.listItems({
          status: ['Open', 'NonExistent', 'In Progress'],
          limit: 20
        })
      ).rejects.toThrow("Status 'NonExistent' not found");
    });

    it('should handle case-sensitive status names (current behavior)', async () => {
      // Current behavior is case-sensitive
      await expect(
        searchHandlers.listItems({
          status: ['open'], // lowercase
          limit: 20
        })
      ).rejects.toThrow("Status 'open' not found");

      await expect(
        searchHandlers.listItems({
          status: ['in progress'], // lowercase
          limit: 20
        })
      ).rejects.toThrow("Status 'in progress' not found");

      await expect(
        searchHandlers.listItems({
          status: ['IN PROGRESS'], // uppercase
          limit: 20
        })
      ).rejects.toThrow("Status 'IN PROGRESS' not found");
    });
  });

  describe('listItems API - Combined Filters', () => {
    it('should combine status and type filters', async () => {
      const result = await searchHandlers.listItems({
        status: ['In Progress', 'Pending'],
        type: 'task',
        limit: 20
      });

      const data = JSON.parse(result.content[0].text);
      expect(data.items).toHaveLength(3); // Only In Progress tasks
      expect(data.items.every((item: any) => item.type === 'task')).toBe(true);
      expect(data.items.every((item: any) => item.status === 'In Progress')).toBe(true);
    });

    it('should combine status and priority filters', async () => {
      const result = await searchHandlers.listItems({
        status: ['Open', 'In Progress'],
        priority: ['MEDIUM'],
        limit: 20
      });

      const data = JSON.parse(result.content[0].text);
      expect(data.items).toHaveLength(5); // All have MEDIUM priority
      expect(data.items.every((item: any) => item.priority === 'MEDIUM')).toBe(true);
    });

    it('should handle empty status array', async () => {
      const result = await searchHandlers.listItems({
        status: [],
        limit: 20
      });

      const data = JSON.parse(result.content[0].text);
      expect(data.items).toHaveLength(9); // All items returned
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large number of status filters efficiently', async () => {
      const startTime = Date.now();
      
      const result = await searchHandlers.listItems({
        status: ['Open', 'In Progress', 'Pending', 'Closed', 'On Hold'],
        limit: 100
      });

      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(1000); // Should complete within 1 second
      
      const data = JSON.parse(result.content[0].text);
      expect(data.items).toBeDefined();
    });

    it('should respect limit parameter with status filter', async () => {
      const result = await searchHandlers.listItems({
        status: ['In Progress'],
        limit: 2
      });

      const data = JSON.parse(result.content[0].text);
      expect(data.items).toHaveLength(2); // Respects limit even though 3 items exist
      expect(data.total).toBe(3); // Total count should still be 3
    });

    it('should handle offset with status filter', async () => {
      const result1 = await searchHandlers.listItems({
        status: ['In Progress'],
        limit: 2,
        offset: 0
      });

      const result2 = await searchHandlers.listItems({
        status: ['In Progress'],
        limit: 2,
        offset: 2
      });

      const data1 = JSON.parse(result1.content[0].text);
      const data2 = JSON.parse(result2.content[0].text);

      expect(data1.items).toHaveLength(2);
      expect(data2.items).toHaveLength(1); // Only 1 item left after offset 2
      
      // Ensure no overlap
      const ids1 = data1.items.map((item: any) => item.id);
      const ids2 = data2.items.map((item: any) => item.id);
      expect(ids1.some((id: number) => ids2.includes(id))).toBe(false);
    });
  });
});

/**
 * Proposed Enhancement Test Suite
 * 
 * These tests demonstrate how the API could be improved to handle
 * case-insensitive status matching.
 */
describe('Proposed Enhancement: Case-Insensitive Status Matching', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasourceUrl: process.env.TEST_DATABASE_URL || 'file:./test.db'
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  /**
   * Proposed enhanced version of getStatusId that handles case-insensitive matching
   */
  async function getStatusIdEnhanced(prisma: PrismaClient, statusName: string): Promise<number> {
    // Try exact match first for performance
    let status = await prisma.status.findUnique({
      where: { name: statusName }
    });

    // If not found, try case-insensitive search
    if (!status) {
      status = await prisma.status.findFirst({
        where: {
          name: {
            equals: statusName,
            mode: 'insensitive' // Prisma's case-insensitive mode
          }
        }
      });
    }

    if (!status) {
      throw new Error(`Status '${statusName}' not found`);
    }

    return status.id;
  }

  describe('Enhanced getStatusId with case-insensitive matching', () => {
    it('should find status regardless of case', async () => {
      // Assuming "In Progress" status exists
      const id1 = await getStatusIdEnhanced(prisma, 'In Progress');
      const id2 = await getStatusIdEnhanced(prisma, 'in progress');
      const id3 = await getStatusIdEnhanced(prisma, 'IN PROGRESS');
      const id4 = await getStatusIdEnhanced(prisma, 'iN pRoGrEsS');

      expect(id1).toBe(id2);
      expect(id2).toBe(id3);
      expect(id3).toBe(id4);
    });

    it('should still throw error for truly non-existent status', async () => {
      await expect(
        getStatusIdEnhanced(prisma, 'CompletelyNonExistent')
      ).rejects.toThrow("Status 'CompletelyNonExistent' not found");
    });
  });
});

/**
 * Test Documentation and Coverage Report
 * 
 * This test suite covers:
 * 
 * 1. Unit Tests:
 *    - getStatusId function behavior
 *    - Exact name matching
 *    - Error handling for non-existent statuses
 *    - Case sensitivity (current behavior)
 * 
 * 2. Integration Tests:
 *    - listItems API with single status filter
 *    - listItems API with multiple status filters
 *    - Combination with other filters (type, priority)
 *    - Pagination (limit, offset)
 * 
 * 3. Edge Cases:
 *    - Empty status array
 *    - Non-existent status names
 *    - Mixed valid/invalid statuses
 *    - Case variations
 * 
 * 4. Performance Tests:
 *    - Large number of status filters
 *    - Query execution time
 * 
 * 5. Proposed Enhancements:
 *    - Case-insensitive status matching
 *    - Backward compatibility considerations
 * 
 * Coverage Goals:
 * - Statement Coverage: 90%+
 * - Branch Coverage: 85%+
 * - Function Coverage: 100%
 * - Critical Path Coverage: 100%
 */