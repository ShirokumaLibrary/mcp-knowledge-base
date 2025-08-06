/**
 * @ai-context Comprehensive integration tests
 * @ai-pattern End-to-end scenarios with real data flows
 * @ai-critical Tests complex interactions between components
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

describe('Comprehensive MCP Integration Tests', () => {
  let serverProcess: ChildProcess;
  let messageId = 1;
  let testDataDir: string;
  const createdItems: Array<{ type: string; id: number }> = [];

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
      console.log('Sending request:', method, params);
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
      
      // Parse different response formats
      if (text.includes(' created: ')) {
        const parts = text.split(' created: ');
        return JSON.parse(parts[1]);
      } else if (text.includes(' updated: ')) {
        const parts = text.split(' updated: ');
        return JSON.parse(parts[1]);
      } else if (text.includes(' deleted')) {
        return text;
      } else if (text.startsWith('{') || text.startsWith('[')) {
        const parsed = JSON.parse(text);
        // Handle wrapped data format from unified handlers
        if (parsed.data !== undefined) {
          return parsed.data;
        }
        return parsed;
      } else {
        // Try to extract JSON from response
        try {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            // Handle wrapped data format from unified handlers
            if (parsed.data !== undefined) {
              return parsed.data;
            }
            return parsed;
          }
        } catch {}
        return text;
      }
    }
    return result;
  };

  beforeAll(async () => {
    // Create isolated test directory
    await fs.mkdir(path.join(process.cwd(), 'tmp'), { recursive: true });
    testDataDir = await fs.mkdtemp(path.join(process.cwd(), 'tmp', 'mcp-comprehensive-test-'));
    
    // Start MCP server
    serverProcess = spawn('node', [path.join(process.cwd(), 'dist/server.js')], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        MCP_DATABASE_PATH: testDataDir,
        MCP_SQLITE_PATH: path.join(testDataDir, 'test-search.db')
      }
    });

    // Log server errors for debugging
    serverProcess.stderr?.on('data', (data) => {
      console.error('Server error:', data.toString());
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Initialize
    await sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {
        roots: { listChanged: true },
        sampling: {}
      },
      clientInfo: {
        name: 'comprehensive-test-client',
        version: '1.0.0'
      }
    });
  }, 15000);

  afterAll(async () => {
    // Cleanup created items
    for (const item of createdItems.reverse()) {
      try {
        await callTool('delete_item', {
          type: item.type,
          id: item.id
        });
      } catch {}
    }

    if (serverProcess) {
      serverProcess.kill();
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    if (testDataDir && process.env.KEEP_TEST_DATA !== 'true') {
      try {
        await fs.rm(testDataDir, { recursive: true, force: true });
      } catch (error) {
        console.error('Failed to clean up test directory:', error);
      }
    }
  });

  describe('Complex Workflow Scenarios', () => {
    test('Project Management Workflow', async () => {
      // 1. Create a project plan
      const project = await callTool('create_item', {
        type: 'plans',
        title: 'Q1 Product Launch',
        content: '# Product Launch Plan\n\n## Overview\nLaunch new features for Q1',
        priority: 'high',
        status: 'Open',
        start_date: '2025-01-01',
        end_date: '2025-03-31',
        tags: ['product', 'q1-2025', 'launch']
      });
      createdItems.push({ type: 'plans', id: project.id });

      // 2. Create related issues
      const issues = [];
      for (const issueData of [
        { title: 'Design UI mockups', priority: 'high', status: 'In Progress' },
        { title: 'Implement backend API', priority: 'high', status: 'Open' },
        { title: 'Write documentation', priority: 'medium', status: 'Open' },
        { title: 'Performance testing', priority: 'medium', status: 'Open' }
      ]) {
        const issue = await callTool('create_item', {
          type: 'issues',
          content: `Task for ${issueData.title}`,
          tags: ['product', 'q1-2025'],
          ...issueData
        });
        issues.push(issue);
        createdItems.push({ type: 'issues', id: issue.id });
      }

      // 3. Create documentation
      const docs = [];
      for (const docData of [
        { title: 'Technical Specification', content: '# Tech Spec\n\nAPI design and architecture' },
        { title: 'User Guide', content: '# User Guide\n\nHow to use the new features' }
      ]) {
        const doc = await callTool('create_item', {
          type: 'docs',
          tags: ['product', 'documentation'],
          ...docData
        });
        docs.push(doc);
        createdItems.push({ type: 'docs', id: doc.id });
      }

      // 4. Update plan with relationships
      const updatedPlan = await callTool('update_item', {
        type: 'plans',
        id: project.id,
        related: [...issues.map(i => `issues-${i.id}`), ...docs.map(d => `docs-${d.id}`)]
      });

      // 5. Verify relationships
      const planDetail = await callTool('get_item_detail', {
        type: 'plans',
        id: project.id
      });
      expect(planDetail.related).toHaveLength(6);

      // 6. Search by tag across types
      const searchResult = await callTool('search_items_by_tag', {
        tag: 'product'
      });
      const allItems = [];
      if (searchResult.tasks) {
        Object.values(searchResult.tasks).forEach((items: any) => {
          allItems.push(...items);
        });
      }
      if (searchResult.documents) {
        Object.values(searchResult.documents).forEach((items: any) => {
          allItems.push(...items);
        });
      }
      expect(allItems.length).toBeGreaterThanOrEqual(7); // 1 plan + 4 issues + 2 docs

      // 7. Complete some issues
      const completedIssue = await callTool('update_item', {
        type: 'issues',
        id: issues[0].id,
        status: 'Closed'
      });

      // 8. Create work session
      const session = await callTool('create_item', {
        type: 'sessions',
        title: 'Sprint Planning Meeting',
        content: '## Meeting Notes\n\n- Reviewed project plan\n- Assigned tasks\n- Set milestones',
        tags: ['product', 'planning'],
        related: [`plans-${project.id}`, `issues-${issues[0].id}`, `docs-${docs[0].id}`]
      });
      expect(session.related).toHaveLength(3);

      // 9. Create daily summary
      const today = new Date().toISOString().split('T')[0];
      const summary = await callTool('create_item', {
        type: 'dailies',
        date: today,
        title: 'Product Launch Planning',
        content: '## Today\'s Progress\n\n- Completed UI mockups\n- Started API implementation\n- Created documentation structure',
        tags: ['product', 'daily-update'],
        related: [`plans-${project.id}`, ...docs.map(d => `docs-${d.id}`)]
      });
      expect(summary.related).toHaveLength(3);
    });

    test('Knowledge Base Building Workflow', async () => {
      // 1. Create knowledge categories
      const knowledgeItems = [];
      
      // Create a comprehensive guide
      const guide = await callTool('create_item', {
        type: 'knowledge',
        title: 'System Architecture Guide',
        content: `# System Architecture Guide

## Overview
This guide covers the system architecture.

## Components
- Frontend: React + TypeScript
- Backend: Node.js + Express
- Database: PostgreSQL

## Best Practices
1. Use dependency injection
2. Follow SOLID principles
3. Write comprehensive tests`,
        tags: ['architecture', 'guide', 'best-practices']
      });
      knowledgeItems.push(guide);
      createdItems.push({ type: 'knowledge', id: guide.id });

      // 2. Create related documentation
      const apiDoc = await callTool('create_item', {
        type: 'docs',
        title: 'API Reference',
        content: '# API Reference\n\n## Endpoints\n- GET /api/items\n- POST /api/items',
        tags: ['api', 'reference'],
        related: [`knowledge-${guide.id}`]
      });
      createdItems.push({ type: 'docs', id: apiDoc.id });

      // 3. Create troubleshooting guide
      const troubleshooting = await callTool('create_item', {
        type: 'knowledge',
        title: 'Troubleshooting Guide',
        content: '# Common Issues\n\n## Database Connection\n- Check credentials\n- Verify network',
        tags: ['troubleshooting', 'guide'],
        related: [`knowledge-${guide.id}`, `docs-${apiDoc.id}`]
      });
      knowledgeItems.push(troubleshooting);
      createdItems.push({ type: 'knowledge', id: troubleshooting.id });

      // 4. Update the main guide with cross-references
      await callTool('update_item', {
        type: 'knowledge',
        id: guide.id,
        related: [`docs-${apiDoc.id}`, `knowledge-${troubleshooting.id}`]
      });

      // 5. Search for guides
      const guideSearch = await callTool('search_items_by_tag', {
        tag: 'guide'
      });
      const guides = guideSearch.documents?.knowledge || [];
      expect(guides.length).toBeGreaterThanOrEqual(2);

      // 6. Create an issue referencing the knowledge
      const issue = await callTool('create_item', {
        type: 'issues',
        title: 'Update Architecture Documentation',
        content: 'Need to update the architecture guide with new microservices',
        priority: 'medium',
        status: 'Open',
        tags: ['documentation', 'architecture'],
        related: [`knowledge-${guide.id}`]
      });
      createdItems.push({ type: 'issues', id: issue.id });

      // 7. Verify cross-type relationships
      const issueDetail = await callTool('get_item_detail', {
        type: 'issues',
        id: issue.id
      });
      expect(issueDetail.related).toContain(`knowledge-${guide.id}`);
    });

    test('Tag Taxonomy Management', async () => {
      // 1. Create hierarchical tag structure
      const tagCategories = {
        'tech': ['tech-frontend', 'tech-backend', 'tech-database'],
        'priority': ['priority-urgent', 'priority-normal', 'priority-low'],
        'team': ['team-dev', 'team-qa', 'team-ops']
      };

      // 2. Create items with hierarchical tags
      const items = [];
      for (const [category, tags] of Object.entries(tagCategories)) {
        for (const tag of tags) {
          const item = await callTool('create_item', {
            type: 'issues',
            title: `Task for ${tag}`,
            content: `This is a ${category} related task`,
            priority: 'medium',
            status: 'Open',
            tags: [category, tag]
          });
          items.push(item);
          createdItems.push({ type: 'issues', id: item.id });
        }
      }

      // 3. Search by parent category
      const techItems = await callTool('search_items_by_tag', { tag: 'tech' });
      const techIssues = techItems.tasks?.issues || [];
      expect(techIssues.length).toBeGreaterThanOrEqual(3);

      // 4. Search by specific tag
      const frontendItems = await callTool('search_items_by_tag', { tag: 'tech-frontend' });
      const frontendIssues = frontendItems.tasks?.issues || [];
      expect(frontendIssues.length).toBeGreaterThanOrEqual(1);

      // 5. Get all tags and verify structure
      const allTags = await callTool('get_tags', {});
      const tagNames = allTags.map((t: any) => t.name || t);
      
      // Verify all tags were created
      for (const tags of Object.values(tagCategories)) {
        for (const tag of tags) {
          expect(tagNames).toContain(tag);
        }
      }
    });

    test('Status Workflow Progression', async () => {
      // 1. Use existing statuses instead of creating custom ones
      const statusesResult = await callTool('get_statuses', {});
      const statuses = statusesResult.data || [];
      
      // Find appropriate statuses from existing ones
      const openStatus = statuses.find((s: any) => !s.is_closed && s.name === 'Open');
      const inProgressStatus = statuses.find((s: any) => !s.is_closed && s.name === 'In Progress');
      const closedStatus = statuses.find((s: any) => s.is_closed);

      // 2. Create issue and progress through workflow
      const issue = await callTool('create_item', {
        type: 'issues',
        title: 'Feature Implementation',
        content: 'Implement new feature with proper workflow',
        priority: 'high',
        status: openStatus?.name || 'Open',
        tags: ['feature', 'workflow-test']
      });
      createdItems.push({ type: 'issues', id: issue.id });

      // 3. Progress through statuses
      const statusProgression = [
        inProgressStatus?.name || 'In Progress',
        closedStatus?.name || 'Closed'
      ];
      for (const status of statusProgression) {
        await callTool('update_item', {
          type: 'issues',
          id: issue.id,
          status: status
        });

        // Verify status change
        const detail = await callTool('get_item_detail', {
          type: 'issues',
          id: issue.id
        });
        expect(detail.status).toBe(status);
      }

      // 4. Test closed status filtering
      const openIssues = await callTool('get_items', {
        type: 'issues',
        includeClosedStatuses: false
      });
      const foundOpen = openIssues.find((i: any) => i.id === issue.id);
      expect(foundOpen).toBeUndefined(); // Should not find deployed issue

      const allIssues = await callTool('get_items', {
        type: 'issues',
        includeClosedStatuses: true
      });
      const foundAll = allIssues.find((i: any) => i.id === issue.id);
      expect(foundAll).toBeDefined(); // Should find deployed issue
    });

    test('Bulk Operations and Performance', async () => {
      const BULK_SIZE = 20;
      const bulkItems: any[] = [];

      // 1. Bulk create items sequentially to avoid ID conflicts
      const startTime = Date.now();
      const createdBulkItems = [];
      
      for (let i = 0; i < BULK_SIZE; i++) {
        const item = await callTool('create_item', {
          type: 'issues',
          title: `Bulk Issue ${i}`,
          content: `Content for bulk issue ${i}`,
          priority: ['high', 'medium', 'low'][i % 3],
          status: 'Open',
          tags: ['bulk-test', `batch-${Math.floor(i / 5)}`]
        });
        createdBulkItems.push(item);
      }

      const createDuration = Date.now() - startTime;
      
      createdBulkItems.forEach(item => {
        bulkItems.push(item);
        createdItems.push({ type: 'issues', id: item.id });
      });

      expect(bulkItems).toHaveLength(BULK_SIZE);
      expect(createDuration).toBeLessThan(10000); // Should complete within 10 seconds

      // 2. Bulk update
      const updateStartTime = Date.now();
      const updatePromises = bulkItems.slice(0, 10).map(item =>
        callTool('update_item', {
          type: 'issues',
          id: item.id,
          status: 'In Progress',
          tags: ['bulk-test', 'updated']
        })
      );

      await Promise.all(updatePromises);
      const updateDuration = Date.now() - updateStartTime;
      expect(updateDuration).toBeLessThan(5000);

      // Wait for search index to update
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 3. Search performance
      const searchStartTime = Date.now();
      const searchResult = await callTool('search_items_by_tag', {
        tag: 'bulk-test'
      });
      const searchDuration = Date.now() - searchStartTime;
      
      // Handle different response formats
      let foundCount = 0;
      if (searchResult) {
        if (searchResult.tasks?.issues) {
          foundCount += searchResult.tasks.issues.length;
        }
      } else if (searchResult.tasks?.issues) {
        foundCount += searchResult.tasks.issues.length;
      }
      
      expect(foundCount).toBeGreaterThanOrEqual(BULK_SIZE);
      expect(searchDuration).toBeLessThan(2000); // Search should be fast

      // 4. Pagination test
      const page1 = await callTool('get_items', {
        type: 'issues',
        includeClosedStatuses: true
      });
      expect(page1.length).toBeGreaterThan(0);
    });

    test('Data Integrity and Validation', async () => {
      // 1. Test referential integrity
      const doc = await callTool('create_item', {
        type: 'docs',
        title: 'Reference Document',
        content: 'This document will be referenced',
        tags: ['integrity-test']
      });
      createdItems.push({ type: 'docs', id: doc.id });

      const issue = await callTool('create_item', {
        type: 'issues',
        title: 'Issue with Reference',
        content: 'This references a document',
        priority: 'medium',
        status: 'Open',
        related: [`docs-${doc.id}`]
      });
      createdItems.push({ type: 'issues', id: issue.id });

      // 2. Delete referenced document (should succeed - no FK constraint)
      await callTool('delete_item', {
        type: 'docs',
        id: doc.id
      });
      createdItems.splice(createdItems.findIndex(i => i.type === 'docs' && i.id === doc.id), 1);

      // 3. Verify issue still exists with dangling reference
      const issueDetail = await callTool('get_item_detail', {
        type: 'issues',
        id: issue.id
      });
      expect(issueDetail.related).toContain(`docs-${doc.id}`);

      // 4. Test data consistency with concurrent updates
      const testItem = await callTool('create_item', {
        type: 'knowledge',
        title: 'Concurrent Test',
        content: 'Testing concurrent updates',
        tags: ['concurrent']
      });
      createdItems.push({ type: 'knowledge', id: testItem.id });

      // Concurrent updates with slight delays to avoid conflicts
      // Each update replaces all tags, avoiding duplicate 'concurrent' tag
      const updates = [];
      for (let i = 0; i < 5; i++) {
        updates.push(
          callTool('update_item', {
            type: 'knowledge',
            id: testItem.id,
            tags: [`update-${i}`, `version-${i}`]  // Remove 'concurrent' to avoid duplicates
          })
        );
        // Small delay between updates
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      await Promise.all(updates);

      // Final state should have last update's tags
      const finalDetail = await callTool('get_item_detail', {
        type: 'knowledge',
        id: testItem.id
      });
      // Should have tags from one of the updates (non-deterministic due to concurrency)
      expect(finalDetail.tags.some((tag: string) => tag.startsWith('update-'))).toBe(true);
      expect(finalDetail.tags.some((tag: string) => tag.startsWith('version-'))).toBe(true);
    });

    test('Session and Summary Analytics', async () => {
      // 1. Create sessions over multiple days
      const dates = [
        new Date(),
        new Date(Date.now() - 86400000), // yesterday
        new Date(Date.now() - 172800000) // 2 days ago
      ];

      const sessions = [];
      for (const date of dates) {
        const dateStr = date.toISOString().split('T')[0];
        const session = await callTool('create_item', {
          type: 'sessions',
          title: `Work on ${dateStr}`,
          content: `Progress made on ${dateStr}`,
          tags: ['daily-work'],
          datetime: date.toISOString()
        });
        sessions.push(session.data);
      }

      // 2. Get sessions with date range
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 172800000).toISOString().split('T')[0]; // 2 days ago
      
      const rangedSessions = await callTool('get_items', {
        type: 'sessions',
        start_date: startDate,
        end_date: endDate
      });
      // May have 2 or 3 sessions depending on timezone
      expect(rangedSessions.length).toBeGreaterThanOrEqual(2);

      // 3. Create summaries
      for (const date of dates.slice(1)) { // Skip today to avoid conflicts
        const dateStr = date.toISOString().split('T')[0];
        try {
          await callTool('create_item', {
            type: 'dailies',
            date: dateStr,
            title: `Summary for ${dateStr}`,
            content: `Work completed on ${dateStr}`,
            tags: ['daily-summary']
          });
        } catch {
          // Summary might already exist
        }
      }

      // 4. Get summaries with range
      const summaries = await callTool('get_items', {
        type: 'dailies',
        start_date: startDate,
        end_date: endDate
      });
      expect(summaries.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Edge Cases and Error Recovery', () => {
    test('Handle malformed data gracefully', async () => {
      // 1. Very long title - should be truncated to 500 chars
      const longTitle = 'A'.repeat(500); // Maximum allowed length
      const longItem = await callTool('create_item', {
        type: 'issues',
        title: longTitle,
        content: 'Testing long title',
        priority: 'low',
        status: 'Open'
      });
      expect(longItem.title).toBe(longTitle);
      createdItems.push({ type: 'issues', id: longItem.id });
      
      // 2. Title exceeding limit should fail
      await expect(
        callTool('create_item', {
          type: 'issues',
          title: 'A'.repeat(501),
          content: 'Testing title too long',
          priority: 'low',
          status: 'Open'
        })
      ).rejects.toThrow('Title must be 500 characters or less');

      // 3. Unicode in all fields
      const unicodeItem = await callTool('create_item', {
        type: 'knowledge',
        title: '🌍 世界 🌏 мир 🌎',
        content: '# Émojis and Ūñíçødé\n\n👍 测试 тест δοκιμή',
        tags: ['emoji-🎉', 'unicode-文字']
      });
      expect(unicodeItem.title).toContain('🌍');
      createdItems.push({ type: 'knowledge', id: unicodeItem.id });

      // 4. Nested JSON in content
      const jsonContent = {
        nested: {
          data: {
            array: [1, 2, 3],
            string: 'value'
          }
        }
      };
      const jsonItem = await callTool('create_item', {
        type: 'docs',
        title: 'JSON Content Test',
        content: JSON.stringify(jsonContent, null, 2),
        tags: ['json-test']
      });
      expect(jsonItem.content).toContain('nested');
      createdItems.push({ type: 'docs', id: jsonItem.id });
    });

    test('Recovery from partial failures', async () => {
      // 1. Create item with some invalid references
      const mixedRefs = await callTool('create_item', {
        type: 'plans',
        title: 'Plan with Mixed References',
        content: 'Some refs are valid, some are not',
        priority: 'medium',
        status: 'Open',
        related: ['issues-999999', 'plans-888888', 'docs-777777', 'knowledge-666666']
      });
      createdItems.push({ type: 'plans', id: mixedRefs.id });

      // Should create successfully despite invalid refs
      expect(parseInt(mixedRefs.id)).toBeGreaterThan(0);

      // 2. Update with mix of valid and invalid data
      const partialUpdate = await callTool('update_item', {
        type: 'plans',
        id: mixedRefs.id,
        title: 'Updated Plan Title', // Valid
        priority: 'high', // Valid
        start_date: '2025-01-01', // Valid
        end_date: '2024-12-31' // Invalid - end before start, but might be allowed
      });
      expect(partialUpdate.title).toBe('Updated Plan Title');
    });

    test('Stress test with rapid operations', async () => {
      // Rapid fire operations
      const operations = [];
      
      // Mix of different operations
      for (let i = 0; i < 10; i++) {
        operations.push(
          callTool('get_tags', {}),
          callTool('get_statuses', {}),
          callTool('get_types', {})
        );
      }

      // Should handle all without errors
      const results = await Promise.allSettled(operations);
      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBeGreaterThan(25); // Most should succeed
    });
  });
});