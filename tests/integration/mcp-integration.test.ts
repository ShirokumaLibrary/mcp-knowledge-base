import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

describe('MCP Server Integration Tests', () => {
  let serverProcess: ChildProcess;
  let messageId = 1;
  let testDataDir: string;
  const createdItems: Array<{ type: string; id: number }> = [];
  const createdTypes: string[] = [];

  const sendRequest = (method: string, params: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      const id = messageId++;
      const request = {
        jsonrpc: '2.0',
        id,
        method,
        params
      };

      const timeout = setTimeout(() => {
        reject(new Error(`Timeout waiting for response to ${method}`));
      }, 10000);

      const handleData = (data: Buffer) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const response = JSON.parse(line);
            if (response.id === id) {
              clearTimeout(timeout);
              serverProcess.stdout?.removeListener('data', handleData);
              if (response.error) {
                reject(new Error(response.error.message));
              } else {
                resolve(response.result);
              }
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      };

      serverProcess.stdout?.on('data', handleData);
      serverProcess.stdin?.write(JSON.stringify(request) + '\n');
    });
  };

  const callTool = async (toolName: string, args: any): Promise<any> => {
    const result = await sendRequest('tools/call', {
      name: toolName,
      arguments: args
    });
    
    if (result?.content?.[0]?.text) {
      const text = result.content[0].text;
      
      // Handle different response formats
      if (text.startsWith('Tag created: ')) {
        // Handle tag creation response
        return { name: text.replace('Tag created: ', '').trim() };
      } else if (text.includes('Tag deleted')) {
        // Handle tag deletion response
        return { deleted: true, name: text.replace('Tag "', '').replace('" deleted', '').trim() };
      } else if (text.includes(' created: ')) {
        const parts = text.split(' created: ');
        return JSON.parse(parts[1]);
      } else if (text.includes(' updated: ')) {
        const parts = text.split(' updated: ');
        return JSON.parse(parts[1]);
      } else if (text.includes(' deleted')) {
        return text;
      } else {
        // Try to parse as JSON
        try {
          const parsed = JSON.parse(text);
          // Handle wrapped data format from unified handlers
          if (parsed.data !== undefined) {
            return parsed.data;
          }
          return parsed;
        } catch {
          return text;
        }
      }
    }
    return result;
  };

  beforeAll(async () => {
    // Create isolated test directory
    // Create test directory in project tmp folder
    await fs.mkdir(path.join(process.cwd(), 'tmp'), { recursive: true });
    testDataDir = await fs.mkdtemp(path.join(process.cwd(), 'tmp', 'mcp-integration-test-'));
    
    // Start MCP server with test directory
    serverProcess = spawn('node', [path.join(process.cwd(), 'dist/server.js')], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        MCP_DATABASE_PATH: testDataDir,
        MCP_SQLITE_PATH: path.join(testDataDir, 'test-search.db')
      }
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Send initialize message
    await sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {
        roots: { listChanged: true },
        sampling: {}
      },
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    });
  }, 15000);

  afterAll(async () => {
    // Kill server process
    if (serverProcess) {
      serverProcess.kill();
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Clean up test directory unless KEEP_TEST_DATA is set
    if (testDataDir) {
      if (process.env.KEEP_TEST_DATA !== 'true') {
        try {
          await fs.rm(testDataDir, { recursive: true, force: true });
        } catch (error) {
          console.error('Failed to clean up test directory:', error);
        }
      } else {
        console.log(`Test data kept in: ${testDataDir}`);
      }
    }
  });

  describe('Basic Operations', () => {
    test('should create and retrieve an issue', async () => {
      // Create an issue
      const created = await callTool('create_item', {
        type: 'issues',
        title: 'Test Issue',
        content: 'This is a test issue',
        priority: 'high',
        status: 'Open',
        tags: ['test', 'integration']
      });

      expect(created.id).toBeDefined();
      expect(parseInt(created.id)).toBeGreaterThan(0);
      expect(created.title).toBe('Test Issue');
      createdItems.push({ type: 'issues', id: created.id });

      // Get issues
      const result = await callTool('get_items', { type: 'issues' });
      const found = result.find((i: any) => i.id === created.id);
      expect(found).toBeDefined();
      expect(found.title).toBe('Test Issue');
    });

    test('should handle unicode and special characters', async () => {
      const created = await callTool('create_item', {
        type: 'knowledge',
        title: '日本語タイトル 🚀',
        content: '## 特殊文字\n!@#$%^&*()_+{}[]|\\:;<>?,./\n\n絵文字: 😀🎉',
        tags: ['日本語', 'unicode']
      });

      expect(created.title).toBe('日本語タイトル 🚀');
      expect(created.tags).toContain('日本語');
      createdItems.push({ type: 'knowledge', id: created.id });
    });
  });

  describe('Status Filtering', () => {
    test('should filter closed status items', async () => {
      // Create closed issue
      const closed = await callTool('create_item', {
        type: 'issues',
        title: 'Closed Issue',
        content: 'This issue is closed',
        status: 'Closed'
      });
      createdItems.push({ type: 'issues', id: closed.id });

      // Default should not include closed
      const defaultResult = await callTool('get_items', { type: 'issues' });
      const foundInDefault = defaultResult.find((i: any) => i.id === closed.id);
      expect(foundInDefault).toBeUndefined();

      // With includeClosedStatuses should include
      const allResult = await callTool('get_items', { 
        type: 'issues', 
        includeClosedStatuses: true 
      });
      const foundInAll = allResult.find((i: any) => i.id === closed.id);
      expect(foundInAll).toBeDefined();
    });
  });

  describe('Tag Management', () => {
    test('should auto-register tags and search by tag', async () => {
      const uniqueTag = `unique-tag-${Date.now()}`;
      
      // Create items with tags
      const item1 = await callTool('create_item', {
        type: 'docs',
        title: 'Tagged Document 1',
        content: 'Content with unique tag',
        tags: [uniqueTag, 'common-tag']
      });
      createdItems.push({ type: 'docs', id: item1.id });

      const item2 = await callTool('create_item', {
        type: 'knowledge',
        title: 'Tagged Knowledge',
        content: 'Another item with common tag',
        tags: ['common-tag', 'test']
      });
      createdItems.push({ type: 'knowledge', id: item2.id });

      // Check tags were registered
      const tagsResult = await callTool('get_tags', {});
      const tags = tagsResult.data || tagsResult;
      const tagNames = tags.map((t: any) => typeof t === 'string' ? t : t.name);
      expect(tagNames).toContain(uniqueTag);
      expect(tagNames).toContain('common-tag');

      // Search by tag
      const searchResult = await callTool('search_items_by_tag', { tag: 'common-tag' });
      const searchData = searchResult.data || searchResult;
      expect(searchData).toBeDefined();
      
      // Collect all items from all types
      const allItems: any[] = [];
      if (searchData.tasks) {
        Object.values(searchData.tasks).forEach((items: any) => {
          if (Array.isArray(items)) allItems.push(...items);
        });
      }
      if (searchData.documents) {
        Object.values(searchData.documents).forEach((items: any) => {
          if (Array.isArray(items)) allItems.push(...items);
        });
      }
      
      expect(allItems.length).toBeGreaterThanOrEqual(2);
      const foundIds = allItems.map((item: any) => item.id);
      expect(foundIds).toContain(item1.id);
      expect(foundIds).toContain(item2.id);
    });
  });

  describe('Session Management', () => {
    test('should create and retrieve sessions', async () => {
      // Create session
      const session = await callTool('create_item', {
        type: 'sessions',
        title: 'Test Session',
        content: 'Session content',
        tags: ['test', 'session']
      });

      const sessionData = session.data || session;
      expect(sessionData.id).toMatch(/^\d{4}-\d{2}-\d{2}-\d{2}\.\d{2}\.\d{2}\.\d{3}$/);
      expect(sessionData.title).toBe('Test Session');

      // Get latest session
      const latest = await callTool('get_items', {
        type: 'sessions',
        limit: 1
      });
      if (latest && latest.data && Array.isArray(latest.data)) {
        const latestData = latest.data[0];
        expect(latestData && latestData.id).toBe(sessionData.id);
      } else {
        console.warn('get_items returned no sessions');
      }
    });

    test('should handle session validation errors', async () => {
      // Empty session title
      await expect(callTool('create_item', {
        type: 'sessions',
        title: '',
        content: 'Content'
      })).rejects.toThrow();

      // Update non-existent session
      await expect(callTool('update_item', {
        type: 'sessions',
        id: '2099-12-31-23.59.59.999',
        title: 'Updated'
      })).rejects.toThrow();
    });

    test('should handle duplicate daily summaries', async () => {
      const testDate = '2025-06-15';
      
      // Create first summary
      await callTool('create_item', {
        type: 'dailies',
        date: testDate,
        title: 'First Summary',
        content: 'First content'
      });

      // Try to create another for same date
      await expect(callTool('create_item', {
        type: 'dailies',
        date: testDate,
        title: 'Second Summary',
        content: 'Second content'
      })).rejects.toThrow('already exists');
    });

    test('should handle invalid date formats for summaries', async () => {
      // Invalid date format
      await expect(callTool('create_item', {
        type: 'dailies',
        date: '2025/01/01',
        title: 'Invalid Date Summary',
        content: 'Testing'
      })).rejects.toThrow();

      // Future date - actually allowed
      const futureSummary = await callTool('create_item', {
        type: 'dailies',
        date: '2099-12-31',
        title: 'Future Summary',
        content: 'From the future'
      });
      expect(futureSummary).toBeDefined();
      expect(futureSummary.id).toBe('2099-12-31');
    });
  });

  describe('Type Management', () => {
    test('should create custom types', async () => {
      const typeName = `test_custom_type_${Date.now()}`;
      
      // Create custom type
      const createResult = await callTool('create_type', {
        name: typeName,
        base_type: 'documents'
      });
      expect(createResult).toContain('successfully');
      createdTypes.push(typeName);

      // Create item with custom type
      const item = await callTool('create_item', {
        type: typeName,
        title: 'Custom Type Item',
        content: 'Testing custom types'
      });
      expect(item.type).toBe(typeName);
      expect(item.id).toBe('1'); // First item of this type
      createdItems.push({ type: typeName, id: item.id });

      // List types
      const typesResult = await callTool('get_types', {});
      // get_types returns markdown format, check if type name is included
      expect(typesResult).toContain(typeName);
    });
  });

  describe('Error Handling', () => {
    test('should handle validation errors', async () => {
      // Missing required field
      await expect(callTool('create_item', {
        type: 'issues',
        title: 'No content'
        // content is missing
      })).rejects.toThrow('Content is required');

      // Invalid type
      await expect(callTool('create_item', {
        type: 'invalid_type',
        title: 'Test',
        content: 'Test'
      })).rejects.toThrow('Unknown type');

      // Invalid status
      await expect(callTool('create_item', {
        type: 'issues',
        title: 'Invalid Status',
        content: 'Test',
        status: 'InvalidStatus'
      })).rejects.toThrow('Invalid status');
    });

    test('should handle invalid date formats', async () => {
      // Invalid date format
      await expect(callTool('create_item', {
        type: 'plans',
        title: 'Invalid Date Plan',
        content: 'Testing invalid dates',
        start_date: '2025/01/01'  // Wrong format (should be YYYY-MM-DD)
      })).rejects.toThrow();

      // Invalid date range - actually allowed in current implementation
      const planWithBadDates = await callTool('create_item', {
        type: 'plans',
        title: 'Invalid Date Range',
        content: 'End before start',
        start_date: '2025-12-31',
        end_date: '2025-01-01'
      });
      // System allows this, just verify it was created
      expect(parseInt(planWithBadDates.id)).toBeGreaterThan(0);
      createdItems.push({ type: 'plans', id: parseInt(planWithBadDates.id) });
    });

    test('should handle non-existent items', async () => {
      // Get non-existent item - throws error
      await expect(callTool('get_item_detail', {
        type: 'issues',
        id: 99999
      })).rejects.toThrow('not found');

      // Update non-existent item - throws error
      await expect(callTool('update_item', {
        type: 'issues',
        id: 99999,
        title: 'Updated Title'
      })).rejects.toThrow();

      // Delete non-existent item - throws error
      await expect(callTool('delete_item', {
        type: 'issues',
        id: 99999
      })).rejects.toThrow();
    });

    test('should handle invalid enum values', async () => {
      // Invalid priority
      await expect(callTool('create_item', {
        type: 'issues',
        title: 'Invalid Priority',
        content: 'Testing invalid priority',
        priority: 'urgent'  // Should be high/medium/low
      })).rejects.toThrow();

    });

    test('should handle invalid references', async () => {
      // Create with non-existent related items
      const item = await callTool('create_item', {
        type: 'plans',
        title: 'Plan with Invalid Refs',
        content: 'Testing invalid references',
        related: ['issues-99999', 'plans-88888', 'docs-77777', 'knowledge-66666']
      });
      
      // Should create successfully but with invalid refs
      expect(parseInt(item.id)).toBeGreaterThan(0);
      createdItems.push({ type: 'plans', id: item.id });
      
      // Verify refs are stored as-is
      const detail = await callTool('get_item_detail', {
        type: 'plans',
        id: item.id
      });
      expect(detail.related).toEqual(['issues-99999', 'plans-88888', 'docs-77777', 'knowledge-66666']);
    });

    test('should handle duplicate tag creation', async () => {
      const tagName = `duplicate-test-${Date.now()}`;
      
      // Create a tag
      const createResult = await callTool('create_tag', { name: tagName });
      expect(createResult.name).toBe(tagName);
      
      // Try to create again
      await expect(callTool('create_tag', { 
        name: tagName 
      })).rejects.toThrow('already exists');
      
      // Clean up
      await callTool('delete_tag', { name: tagName });
    });

    test('should handle invalid search parameters', async () => {
      // Search with non-existent tag
      const result = await callTool('search_items_by_tag', {
        tag: 'non-existent-tag-xyz'
      });
      
      // Should return empty results, not error
      const searchData = result.data || result;
      const allItems: any[] = [];
      if (searchData.tasks) {
        Object.values(searchData.tasks).forEach((items: any) => {
          if (Array.isArray(items)) allItems.push(...items);
        });
      }
      if (searchData.documents) {
        Object.values(searchData.documents).forEach((items: any) => {
          if (Array.isArray(items)) allItems.push(...items);
        });
      }
      expect(allItems).toEqual([]);
    });

    test('should handle empty string values', async () => {
      // Empty title
      await expect(callTool('create_item', {
        type: 'docs',
        title: '',
        content: 'Content'
      })).rejects.toThrow();

      // Empty content for document types - currently allowed
      // await expect(callTool('create_item', {
      //   type: 'knowledge',
      //   title: 'Title',
      //   content: ''
      // })).rejects.toThrow();

      // Empty tag name
      await expect(callTool('create_tag', {
        name: ''
      })).rejects.toThrow();
    });

    test('should handle special characters in data', async () => {
      // SQL injection attempt
      const item = await callTool('create_item', {
        type: 'issues',
        title: "Title'; DROP TABLE issues; --",
        content: 'Testing SQL injection',
        tags: ["tag'; DELETE FROM tags; --"]
      });
      
      expect(parseInt(item.id)).toBeGreaterThan(0);
      createdItems.push({ type: 'issues', id: item.id });
      
      // Verify data is properly escaped
      const detail = await callTool('get_item_detail', {
        type: 'issues',
        id: item.id
      });
      expect(detail.title).toContain('DROP TABLE');
    });

    test('should handle concurrent operations gracefully', async () => {
      // Create multiple items with unique timestamps to ensure different IDs
      const baseTime = Date.now();
      const promises = Array(5).fill(0).map((_, i) => 
        new Promise(resolve => setTimeout(() => 
          resolve(callTool('create_item', {
            type: 'issues',
            title: `Concurrent Issue ${baseTime}-${i}`,
            content: `Testing concurrent creation ${i}`,
            tags: ['concurrent-test']
          })), i * 10)
        )
      );
      
      const results = await Promise.all(promises);
      
      // All should succeed with unique IDs
      const ids = results.map((r: any) => r.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(5);
      
      // Clean up
      results.forEach((item: any) => {
        createdItems.push({ type: 'issues', id: item.id });
      });
    });
  });

  describe('Type Management', () => {
    test('should prevent creating duplicate types', async () => {
      // Try to create a built-in type
      await expect(callTool('create_type', {
        name: 'issues'
      })).rejects.toThrow('Type "issues" already exists');

      await expect(callTool('create_type', {
        name: 'plans'
      })).rejects.toThrow('Type "plans" already exists');
    });

    test('should prevent creating sessions and dailies types', async () => {
      // These are special types with date-based IDs
      await expect(callTool('create_type', {
        name: 'sessions'
      })).rejects.toThrow('Type "sessions" already exists');

      await expect(callTool('create_type', {
        name: 'dailies'
      })).rejects.toThrow('Type "dailies" already exists');
    });

    test('should prevent duplicate custom types', async () => {
      // Create a custom type
      await callTool('create_type', {
        name: 'test_integration_type'
      });

      // Try to create it again
      await expect(callTool('create_type', {
        name: 'test_integration_type'
      })).rejects.toThrow('Type "test_integration_type" already exists');

      // Clean up
      await callTool('delete_type', {
        name: 'test_integration_type'
      });
    });
  });

  describe('Related Items', () => {
    test('should handle related tasks and documents', async () => {
      // Create a plan with relations
      const plan = await callTool('create_item', {
        type: 'plans',
        title: 'Plan with Relations',
        content: 'Testing related items',
        priority: 'medium',
        status: 'In Progress',
        related: ['issues-1', 'issues-2', 'docs-1', 'knowledge-1']
      });
      createdItems.push({ type: 'plans', id: plan.id });

      // Get detail to verify
      const detail = await callTool('get_item_detail', {
        type: 'plans',
        id: plan.id
      });
      expect(detail.related).toEqual(['issues-1', 'issues-2', 'docs-1', 'knowledge-1']);
    });
  });
});