/**
 * Unit tests for update_item API with type field support
 * TDD Red Phase - These tests should fail initially
 * 
 * Test Strategy:
 * 1. Valid type update scenarios
 * 2. Invalid type format rejection
 * 3. Backward compatibility (update without type field)
 * 4. Edge cases and error conditions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockPrismaClient, MockPrisma } from '../../../mocks/prisma-mock.js';
import { CRUDHandlers } from '../../../../src/mcp/handlers/crud-handlers.js';
import { validateType } from '../../../../src/utils/validation.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

// Mock Prisma Client with default export for ESM/CommonJS compatibility
vi.mock('@prisma/client', () => ({
  default: {
    PrismaClient: MockPrismaClient,
    Prisma: MockPrisma
  }
}));

// Mock database-init functions
vi.mock('../../../../src/mcp/database/database-init.js', () => ({
  getStatusId: vi.fn(() => 1),
  ensureTags: vi.fn(() => []),
}));

describe('UpdateItem with type field support', () => {
  let prisma: any;
  let crudHandlers: CRUDHandlers;
  
  beforeEach(() => {
    vi.clearAllMocks();
    prisma = new MockPrismaClient();
    crudHandlers = new CRUDHandlers(prisma);
  });

  describe('should update type field with valid format', () => {
    it('should update type field with lowercase letters only', async () => {
      // Arrange
      const itemId = 1;
      const newType = 'knowledge';
      const existingItem = {
        id: itemId,
        type: 'issue',
        title: 'Test Item',
        description: 'Test Description',
        content: 'Test Content',
      };
      
      prisma.item.findUnique.mockResolvedValue(existingItem);
      prisma.item.update.mockResolvedValue({
        ...existingItem,
        type: newType,
        status: { name: 'Open' },
        tags: [],
      });
      
      // Act
      const result = await crudHandlers.updateItem({
        id: itemId,
        type: newType,
      });
      
      // Assert
      expect(prisma.item.findUnique).toHaveBeenCalledWith({
        where: { id: itemId },
      });
      expect(prisma.item.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: itemId },
          data: expect.objectContaining({
            type: newType,
          }),
        })
      );
      expect(result.content[0].text).toContain('Item updated successfully');
    });

    it('should update type field with numbers and underscores', async () => {
      // Arrange
      const itemId = 2;
      const newType = 'bug_fix_123';
      const existingItem = {
        id: itemId,
        type: 'issue',
        title: 'Bug Report',
      };
      
      prisma.item.findUnique.mockResolvedValue(existingItem);
      prisma.item.update.mockResolvedValue({
        ...existingItem,
        type: newType,
        status: { name: 'Open' },
        tags: [],
      });
      
      // Act
      const result = await crudHandlers.updateItem({
        id: itemId,
        type: newType,
      });
      
      // Assert
      expect(prisma.item.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: newType,
          }),
        })
      );
    });

    it('should update type field starting with underscore', async () => {
      // Arrange
      const itemId = 3;
      const newType = '_internal_note';
      const existingItem = { id: itemId, type: 'note' };
      
      prisma.item.findUnique.mockResolvedValue(existingItem);
      prisma.item.update.mockResolvedValue({
        ...existingItem,
        type: newType,
        status: { name: 'Open' },
        tags: [],
      });
      
      // Act
      await crudHandlers.updateItem({
        id: itemId,
        type: newType,
      });
      
      // Assert
      expect(prisma.item.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: newType,
          }),
        })
      );
    });
  });

  describe('should reject invalid type formats', () => {
    it('should throw error for type with uppercase letters', async () => {
      // Arrange
      const itemId = 4;
      const invalidType = 'Issue';
      const existingItem = { id: itemId, type: 'issue' };
      
      prisma.item.findUnique.mockResolvedValue(existingItem);
      
      // Act & Assert
      await expect(
        crudHandlers.updateItem({
          id: itemId,
          type: invalidType,
        })
      ).rejects.toThrow('Invalid type format');
    });

    it('should throw error for type with special characters', async () => {
      // Arrange
      const itemId = 5;
      const invalidType = 'bug-fix';
      const existingItem = { id: itemId, type: 'bug' };
      
      prisma.item.findUnique.mockResolvedValue(existingItem);
      
      // Act & Assert
      await expect(
        crudHandlers.updateItem({
          id: itemId,
          type: invalidType,
        })
      ).rejects.toThrow('Invalid type format');
    });

    it('should throw error for type with spaces', async () => {
      // Arrange
      const itemId = 6;
      const invalidType = 'bug fix';
      const existingItem = { id: itemId, type: 'bug' };
      
      prisma.item.findUnique.mockResolvedValue(existingItem);
      
      // Act & Assert
      await expect(
        crudHandlers.updateItem({
          id: itemId,
          type: invalidType,
        })
      ).rejects.toThrow('Invalid type format');
    });

    it('should throw error for empty type string', async () => {
      // Arrange
      const itemId = 7;
      const existingItem = { id: itemId, type: 'issue' };
      
      prisma.item.findUnique.mockResolvedValue(existingItem);
      
      // Act & Assert
      await expect(
        crudHandlers.updateItem({
          id: itemId,
          type: '',
        })
      ).rejects.toThrow('Invalid type format');
    });
  });

  describe('should maintain backward compatibility', () => {
    it('should update other fields without type field', async () => {
      // Arrange
      const itemId = 8;
      const existingItem = {
        id: itemId,
        type: 'issue',
        title: 'Old Title',
        description: 'Old Description',
      };
      
      prisma.item.findUnique.mockResolvedValue(existingItem);
      prisma.item.update.mockResolvedValue({
        ...existingItem,
        title: 'New Title',
        status: { name: 'Open' },
        tags: [],
      });
      
      // Act
      const result = await crudHandlers.updateItem({
        id: itemId,
        title: 'New Title',
        description: 'New Description',
      });
      
      // Assert
      expect(prisma.item.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({
            type: expect.anything(),
          }),
        })
      );
      expect(result.content[0].text).toContain('Item updated successfully');
    });

    it('should update both type and other fields together', async () => {
      // Arrange
      const itemId = 9;
      const newType = 'knowledge';
      const existingItem = {
        id: itemId,
        type: 'issue',
        title: 'Old Title',
        priority: 'LOW',
      };
      
      prisma.item.findUnique.mockResolvedValue(existingItem);
      prisma.item.update.mockResolvedValue({
        ...existingItem,
        type: newType,
        title: 'New Title',
        priority: 'HIGH',
        status: { name: 'Open' },
        tags: [],
      });
      
      // Act
      const result = await crudHandlers.updateItem({
        id: itemId,
        type: newType,
        title: 'New Title',
        priority: 'HIGH',
      });
      
      // Assert
      expect(prisma.item.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: newType,
            title: 'New Title',
            priority: 'HIGH',
          }),
        })
      );
    });
  });

  describe('should handle edge cases and errors', () => {
    it('should throw error when item does not exist', async () => {
      // Arrange
      const itemId = 999;
      prisma.item.findUnique.mockResolvedValue(null);
      
      // Act & Assert
      await expect(
        crudHandlers.updateItem({
          id: itemId,
          type: 'knowledge',
        })
      ).rejects.toThrow(`Item with ID ${itemId} not found`);
    });

    it('should handle very long valid type strings', async () => {
      // Arrange
      const itemId = 10;
      const longType = 'a'.repeat(50) + '_' + '1'.repeat(50);
      const existingItem = { id: itemId, type: 'issue' };
      
      prisma.item.findUnique.mockResolvedValue(existingItem);
      prisma.item.update.mockResolvedValue({
        ...existingItem,
        type: longType,
        status: { name: 'Open' },
        tags: [],
      });
      
      // Act
      await crudHandlers.updateItem({
        id: itemId,
        type: longType,
      });
      
      // Assert
      expect(prisma.item.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: longType,
          }),
        })
      );
    });

    it('should handle type with multiple consecutive underscores', async () => {
      // Arrange
      const itemId = 11;
      const typeWithUnderscores = 'test__case___item';
      const existingItem = { id: itemId, type: 'test' };
      
      prisma.item.findUnique.mockResolvedValue(existingItem);
      prisma.item.update.mockResolvedValue({
        ...existingItem,
        type: typeWithUnderscores,
        status: { name: 'Open' },
        tags: [],
      });
      
      // Act
      await crudHandlers.updateItem({
        id: itemId,
        type: typeWithUnderscores,
      });
      
      // Assert
      expect(prisma.item.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: typeWithUnderscores,
          }),
        })
      );
    });

    it('should handle type field update when undefined is passed', async () => {
      // Arrange
      const itemId = 12;
      const existingItem = { id: itemId, type: 'issue' };
      
      prisma.item.findUnique.mockResolvedValue(existingItem);
      prisma.item.update.mockResolvedValue({
        ...existingItem,
        title: 'Updated Title',
        status: { name: 'Open' },
        tags: [],
      });
      
      // Act
      await crudHandlers.updateItem({
        id: itemId,
        type: undefined,
        title: 'Updated Title',
      });
      
      // Assert
      expect(prisma.item.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({
            type: expect.anything(),
          }),
        })
      );
    });

    it('should validate type using validateType function', async () => {
      // Arrange
      const itemId = 13;
      const testType = 'test_type';
      const existingItem = { id: itemId, type: 'old_type' };
      
      // Spy on validateType to ensure it's called
      const validateTypeSpy = vi.spyOn(
        await import('../../../../src/utils/validation.js'),
        'validateType'
      );
      
      prisma.item.findUnique.mockResolvedValue(existingItem);
      prisma.item.update.mockResolvedValue({
        ...existingItem,
        type: testType,
        status: { name: 'Open' },
        tags: [],
      });
      
      // Act
      await crudHandlers.updateItem({
        id: itemId,
        type: testType,
      });
      
      // Assert
      expect(validateTypeSpy).toHaveBeenCalledWith(testType);
    });
  });

  describe('should handle type field in UpdateItemSchema', () => {
    it('should parse update request with type field', async () => {
      // This test verifies that UpdateItemSchema accepts the type field
      const { UpdateItemSchema } = await import('../../../../src/mcp/database/schemas.js');
      
      const validInput = {
        id: 1,
        type: 'knowledge',
        title: 'Updated Title',
      };
      
      // Should not throw
      const parsed = UpdateItemSchema.parse(validInput);
      
      expect(parsed).toEqual(validInput);
      expect(parsed.type).toBe('knowledge');
    });

    it('should make type field optional in UpdateItemSchema', async () => {
      // This test verifies that type field is optional
      const { UpdateItemSchema } = await import('../../../../src/mcp/database/schemas.js');
      
      const inputWithoutType = {
        id: 1,
        title: 'Updated Title',
      };
      
      // Should not throw
      const parsed = UpdateItemSchema.parse(inputWithoutType);
      
      expect(parsed).toEqual(inputWithoutType);
      expect(parsed.type).toBeUndefined();
    });
  });
});

describe('UpdateItem integration with validation', () => {
  let prisma: any;
  let crudHandlers: CRUDHandlers;
  
  beforeEach(() => {
    vi.clearAllMocks();
    prisma = new MockPrismaClient();
    crudHandlers = new CRUDHandlers(prisma);
  });

  it('should use strict validation mode (autoNormalize=false) for MCP', async () => {
    // Arrange
    const itemId = 14;
    const invalidType = 'Issue-Name'; // Should fail with strict validation
    const existingItem = { id: itemId, type: 'issue' };
    
    prisma.item.findUnique.mockResolvedValue(existingItem);
    
    // Act & Assert
    // With strict validation (autoNormalize=false), this should throw
    await expect(
      crudHandlers.updateItem({
        id: itemId,
        type: invalidType,
      })
    ).rejects.toThrow('Invalid type format');
  });

  it('should properly handle type validation errors', async () => {
    // Arrange
    const itemId = 15;
    const invalidType = '###'; // No valid characters
    const existingItem = { id: itemId, type: 'issue' };
    
    prisma.item.findUnique.mockResolvedValue(existingItem);
    
    // Act & Assert
    await expect(
      crudHandlers.updateItem({
        id: itemId,
        type: invalidType,
      })
    ).rejects.toThrow();
  });

  it('should successfully update type from one valid format to another', async () => {
    // Arrange
    const itemId = 16;
    const oldType = 'bug_report';
    const newType = 'resolved_issue';
    const existingItem = { id: itemId, type: oldType };
    
    prisma.item.findUnique.mockResolvedValue(existingItem);
    prisma.item.update.mockResolvedValue({
      ...existingItem,
      type: newType,
      status: { name: 'Closed' },
      tags: [],
    });
    
    // Act
    const result = await crudHandlers.updateItem({
      id: itemId,
      type: newType,
      status: 'Closed',
    });
    
    // Assert
    expect(prisma.item.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: itemId },
        data: expect.objectContaining({
          type: newType,
          status: expect.objectContaining({
            connect: expect.objectContaining({
              id: expect.any(Number),
            }),
          }),
        }),
      })
    );
    expect(result.content[0].text).toContain('Item updated successfully');
  });
});