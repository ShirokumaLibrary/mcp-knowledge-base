/**
 * @ai-context E2E tests for CRUD operations
 * @ai-pattern Full lifecycle testing
 * @ai-critical Validates core functionality
 */

import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';
import {
  setupE2ETest,
  callTool,
  testFixtures,
  assertToolResult,
  runScenario,
  E2ETestContext
} from './setup-e2e.js';

describe('E2E: CRUD Operations', () => {
  let context: E2ETestContext;
  
  beforeAll(async () => {
    context = await setupE2ETest();
  }, 30000);
  
  afterAll(async () => {
    await context.cleanup();
  });
  
  describe('Issue Management', () => {
    it('should perform complete issue lifecycle', async () => {
      let createdIssue: any;
      
      await runScenario('Issue CRUD Lifecycle', [
        {
          name: 'Create issue',
          action: async () => {
            return await callTool(context.client, 'create_item', {
              type: 'issues',
              ...testFixtures.issue
            });
          },
          assertions: (result) => {
            expect(result.id).toBeDefined();
            expect(result.title).toBe(testFixtures.issue.title);
            expect(result.priority).toBe(testFixtures.issue.priority);
            createdIssue = result;
          }
        },
        
        {
          name: 'Get issue by ID',
          action: async () => {
            return await callTool(context.client, 'get_item_detail', {
              type: 'issues',
              id: createdIssue.id
            });
          },
          assertions: (result) => {
            expect(result.id).toBe(createdIssue.id);
            expect(result.content).toBe(testFixtures.issue.content);
            expect(result.tags).toEqual(testFixtures.issue.tags);
          }
        },
        
        {
          name: 'Update issue',
          action: async () => {
            return await callTool(context.client, 'update_item', {
              type: 'issues',
              id: createdIssue.id,
              title: 'Updated Issue Title',
              priority: 'low'
            });
          },
          assertions: (result) => {
            expect(result.title).toBe('Updated Issue Title');
            expect(result.priority).toBe('low');
          }
        },
        
        {
          name: 'List issues',
          action: async () => {
            return await callTool(context.client, 'get_items', {
              type: 'issues'
            });
          },
          assertions: (result) => {
            expect(Array.isArray(result)).toBe(true);
            const found = result.find((i: any) => i.id === createdIssue.id);
            expect(found).toBeDefined();
            expect(found.title).toBe('Updated Issue Title');
          }
        },
        
        {
          name: 'Delete issue',
          action: async () => {
            return await callTool(context.client, 'delete_item', {
              type: 'issues',
              id: createdIssue.id
            });
          },
          assertions: (result) => {
            expect(result.success).toBe(true);
          }
        },
        
        {
          name: 'Verify deletion',
          action: async () => {
            return await callTool(context.client, 'get_item_detail', {
              type: 'issues',
              id: createdIssue.id
            });
          },
          assertions: (result) => {
            expect(result).toBeNull();
          }
        }
      ]);
    }, 60000);
  });
  
  describe('Cross-Type Operations', () => {
    it('should handle multiple types correctly', async () => {
      const created: Record<string, any> = {};
      
      await runScenario('Multi-Type Operations', [
        {
          name: 'Create items of different types',
          action: async () => {
            // Create issue
            created.issue = await callTool(context.client, 'create_item', {
              type: 'issues',
              ...testFixtures.issue
            });
            
            // Create plan
            created.plan = await callTool(context.client, 'create_item', {
              type: 'plans',
              ...testFixtures.plan
            });
            
            // Create document
            created.doc = await callTool(context.client, 'create_item', {
              type: 'docs',
              ...testFixtures.document
            });
            
            return created;
          },
          assertions: (result) => {
            expect(result.issue.id).toBeDefined();
            expect(result.plan.id).toBeDefined();
            expect(result.doc.id).toBeDefined();
          }
        },
        
        {
          name: 'Search across all types',
          action: async () => {
            return await callTool(context.client, 'search_all', {
              query: 'test'
            });
          },
          assertions: (result) => {
            expect(result.issues.length).toBeGreaterThan(0);
            expect(result.plans.length).toBeGreaterThan(0);
            expect(result.knowledge.length).toBeGreaterThan(0);
          }
        },
        
        {
          name: 'Search by tag',
          action: async () => {
            return await callTool(context.client, 'search_items_by_tag', {
              tag: 'e2e'
            });
          },
          assertions: (result) => {
            expect(result.length).toBeGreaterThan(0);
            const types = new Set(result.map((item: any) => item.type));
            expect(types.size).toBeGreaterThanOrEqual(3);
          }
        },
        
        {
          name: 'Clean up created items',
          action: async () => {
            const results = [];
            
            for (const [type, item] of Object.entries(created)) {
              const typeMap: Record<string, string> = {
                issue: 'issues',
                plan: 'plans',
                doc: 'docs'
              };
              
              results.push(await callTool(context.client, 'delete_item', {
                type: typeMap[type],
                id: item.id
              }));
            }
            
            return results;
          },
          assertions: (results) => {
            results.forEach(result => {
              expect(result.success).toBe(true);
            });
          }
        }
      ]);
    }, 60000);
  });
  
  describe('Batch Operations', () => {
    it('should handle batch operations efficiently', async () => {
      const batchSize = 10;
      const createdIds: number[] = [];
      
      await runScenario('Batch Operations', [
        {
          name: `Create ${batchSize} issues`,
          action: async () => {
            const promises = [];
            
            for (let i = 0; i < batchSize; i++) {
              promises.push(
                callTool(context.client, 'create_item', {
                  type: 'issues',
                  title: `Batch Issue ${i}`,
                  content: `Content for batch issue ${i}`,
                  priority: ['high', 'medium', 'low'][i % 3],
                  tags: ['batch', 'test']
                })
              );
            }
            
            return await Promise.all(promises);
          },
          assertions: (results) => {
            expect(results).toHaveLength(batchSize);
            results.forEach((issue: any) => {
              expect(issue.id).toBeDefined();
              createdIds.push(issue.id);
            });
          }
        },
        
        {
          name: 'Filter by priority',
          action: async () => {
            return await callTool(context.client, 'get_items', {
              type: 'issues',
              filter: { priority: 'high' }
            });
          },
          assertions: (results) => {
            const batchIssues = results.filter((i: any) => 
              i.title.startsWith('Batch Issue')
            );
            expect(batchIssues.length).toBeGreaterThan(0);
            batchIssues.forEach((issue: any) => {
              expect(issue.priority).toBe('high');
            });
          }
        },
        
        {
          name: 'Batch delete',
          action: async () => {
            const promises = createdIds.map(id =>
              callTool(context.client, 'delete_item', {
                type: 'issues',
                id
              })
            );
            
            return await Promise.all(promises);
          },
          assertions: (results) => {
            expect(results).toHaveLength(batchSize);
            results.forEach(result => {
              expect(result.success).toBe(true);
            });
          }
        }
      ]);
    }, 60000);
  });
});