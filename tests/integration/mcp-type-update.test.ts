/**
 * Integration test for type field update via MCP API
 * TDD Red Phase - This test exposes the bug that type field cannot be updated
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { CRUDHandlers } from '../../src/mcp/handlers/crud-handlers.js';
import fs from 'fs';
import path from 'path';

// Mock AI service to avoid external calls
vi.mock('../../src/services/ai/unified-search.js', () => ({
  UnifiedSearch: vi.fn().mockImplementation(() => ({
    enrichItem: vi.fn().mockResolvedValue({
      keywords: [],
      concepts: [],
      summary: 'Test summary',
      embedding: Buffer.alloc(128)
    })
  }))
}));

describe('MCP API Type Field Update Integration', () => {
  let prisma: PrismaClient;
  let handlers: CRUDHandlers;
  let testItemId: number;
  
  beforeAll(async () => {
    // Use test database with absolute path
    const testDbPath = path.join(process.cwd(), '.shirokuma', 'data-test', 'test.db');
    const testDbDir = path.dirname(testDbPath);
    
    // Ensure test database directory exists
    if (!fs.existsSync(testDbDir)) {
      fs.mkdirSync(testDbDir, { recursive: true });
    }
    
    process.env.SHIROKUMA_DATABASE_URL = `file:${testDbPath}`;
    
    // Initialize database schema
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    try {
      // Push schema to test database
      await execAsync('npx prisma db push --skip-generate', {
        env: { ...process.env, SHIROKUMA_DATABASE_URL: `file:${testDbPath}` }
      });
    } catch (error) {
      console.error('Failed to initialize test database:', error);
    }
    
    prisma = new PrismaClient();
    handlers = new CRUDHandlers(prisma);
    
    // Ensure test database is ready and seed statuses
    try {
      // Check if statuses exist, if not create them
      const statusCount = await prisma.status.count();
      console.log('Status count:', statusCount);
      if (statusCount === 0) {
        // Create basic statuses
        await prisma.status.createMany({
          data: [
            { name: 'Open', isClosable: false, sortOrder: 1 },
            { name: 'In Progress', isClosable: false, sortOrder: 2 },
            { name: 'Completed', isClosable: true, sortOrder: 3 }
          ]
        });
        console.log('Created statuses');
      }
      // Create a test item
      const result = await handlers.createItem({
        type: 'test_item',
        title: 'Test Item for Type Update',
        description: 'Testing type field update',
        content: 'This item will test type field updates',
      });
      
      // Extract ID from response - check different possible formats
      let match = result.content[0].text.match(/ID:\s*(\d+)/);
      if (!match) {
        match = result.content[0].text.match(/\bid[:\s]+(\d+)/i);
      }
      if (!match) {
        match = result.content[0].text.match(/created with id (\d+)/i);
      }
      if (!match) {
        // Try to find any number in the response
        match = result.content[0].text.match(/\b(\d+)\b/);
      }
      testItemId = match ? parseInt(match[1]) : 0;
      console.log('Response text:', result.content[0].text);
      console.log('Created test item with ID:', testItemId);
    } catch (error) {
      console.error('Setup failed:', error);
    }
  });
  
  afterAll(async () => {
    // Cleanup
    if (testItemId) {
      try {
        await handlers.deleteItem({ id: testItemId });
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    await prisma.$disconnect();
  });
  
  it('should expose bug: type field cannot be updated via update_item', async () => {
    // This test exposes the current bug where type field is ignored
    
    // Arrange
    expect(testItemId).toBeGreaterThan(0);
    const newType = 'updated_type';
    
    // Act - Set a shorter timeout to avoid hanging
    const updatePromise = handlers.updateItem({
      id: testItemId,
      type: newType,
      title: 'Updated Title',
    });
    
    // Wait for the update with a timeout
    await Promise.race([
      updatePromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Update timeout')), 5000))
    ]).catch(() => {
      // Ignore timeout errors for now
    });
    
    // Assert - Verify type was actually updated
    const updatedItem = await prisma.item.findUnique({
      where: { id: testItemId },
    });
    
    // This assertion should FAIL in RED phase, proving the bug exists
    expect(updatedItem?.type).toBe(newType);
  }, 15000); // Set test timeout to 15 seconds
  
  it('should validate type format when updating', async () => {
    // This test verifies that invalid type formats are rejected
    
    // Arrange
    expect(testItemId).toBeGreaterThan(0);
    const invalidType = 'Invalid-Type';
    
    // Act & Assert
    // This should throw an error for invalid type format
    await expect(
      handlers.updateItem({
        id: testItemId,
        type: invalidType,
      })
    ).rejects.toThrow('Invalid type format');
  });
});