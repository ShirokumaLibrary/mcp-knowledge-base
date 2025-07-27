/**
 * @ai-context E2E tests for search functionality
 * @ai-pattern Search feature validation
 * @ai-critical Ensures search works correctly
 */

import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';
import {
  setupE2ETest,
  callTool,
  runScenario,
  E2ETestContext
} from './setup-e2e.js';

describe('E2E: Search Functionality', () => {
  let context: E2ETestContext;
  const testData: any[] = [];
  
  beforeAll(async () => {
    context = await setupE2ETest();
    
    // Create test data
    console.log('Setting up test data...');
    
    // Create issues with various content
    testData.push(await callTool(context.client, 'create_item', {
      type: 'issues',
      title: 'Search test: JavaScript error',
      content: 'Getting TypeError when calling function',
      tags: ['javascript', 'error', 'bug']
    }));
    
    testData.push(await callTool(context.client, 'create_item', {
      type: 'issues',
      title: 'Search test: Python import issue',
      content: 'Module not found error in Python script',
      tags: ['python', 'error', 'import']
    }));
    
    // Create plans
    testData.push(await callTool(context.client, 'create_item', {
      type: 'plans',
      title: 'Search test: Refactoring plan',
      content: 'Plan to refactor the codebase for better performance',
      start_date: '2024-01-01',
      end_date: '2024-03-31',
      tags: ['refactoring', 'performance']
    }));
    
    // Create documents
    testData.push(await callTool(context.client, 'create_item', {
      type: 'docs',
      title: 'Search test: API Documentation',
      content: 'Documentation for the REST API endpoints',
      tags: ['api', 'documentation', 'rest']
    }));
    
    testData.push(await callTool(context.client, 'create_item', {
      type: 'knowledge',
      title: 'Search test: Best Practices',
      content: 'Best practices for error handling in JavaScript',
      tags: ['javascript', 'best-practices', 'error']
    }));
  }, 60000);
  
  afterAll(async () => {
    // Clean up test data
    console.log('Cleaning up test data...');
    
    for (const item of testData) {
      try {
        await callTool(context.client, 'delete_item', {
          type: item.type,
          id: item.id
        });
      } catch (error) {
        console.error(`Failed to delete ${item.type} ${item.id}:`, error);
      }
    }
    
    await context.cleanup();
  });
  
  describe('Full-Text Search', () => {
    it('should find items by content keywords', async () => {
      await runScenario('Full-Text Search', [
        {
          name: 'Search for "error"',
          action: async () => {
            return await callTool(context.client, 'search_all', {
              query: 'error'
            });
          },
          assertions: (result) => {
            expect(result.issues.length).toBeGreaterThanOrEqual(2);
            expect(result.knowledge.length).toBeGreaterThanOrEqual(1);
            
            // Verify search results contain the keyword
            const allItems = [
              ...result.issues,
              ...result.plans,
              ...result.knowledge
            ];
            
            allItems.forEach(item => {
              const hasError = 
                item.title.toLowerCase().includes('error') ||
                item.content.toLowerCase().includes('error');
              expect(hasError).toBe(true);
            });
          }
        },
        
        {
          name: 'Search for "JavaScript"',
          action: async () => {
            return await callTool(context.client, 'search_all', {
              query: 'JavaScript'
            });
          },
          assertions: (result) => {
            const allItems = [
              ...result.issues,
              ...result.plans,
              ...result.knowledge
            ];
            
            expect(allItems.length).toBeGreaterThanOrEqual(2);
            
            allItems.forEach(item => {
              const hasJavaScript = 
                item.title.toLowerCase().includes('javascript') ||
                item.content.toLowerCase().includes('javascript');
              expect(hasJavaScript).toBe(true);
            });
          }
        },
        
        {
          name: 'Search for non-existent term',
          action: async () => {
            return await callTool(context.client, 'search_all', {
              query: 'nonexistentterm12345'
            });
          },
          assertions: (result) => {
            expect(result.issues.length).toBe(0);
            expect(result.plans.length).toBe(0);
            expect(result.knowledge.length).toBe(0);
          }
        }
      ]);
    });
    
    it('should handle special characters in search', async () => {
      await runScenario('Special Character Search', [
        {
          name: 'Search with special characters',
          action: async () => {
            // Should not throw error
            return await callTool(context.client, 'search_all', {
              query: 'test@#$%'
            });
          },
          assertions: (result) => {
            expect(result).toBeDefined();
            expect(result.issues).toBeDefined();
            expect(result.plans).toBeDefined();
            expect(result.knowledge).toBeDefined();
          }
        }
      ]);
    });
  });
  
  describe('Tag-Based Search', () => {
    it('should find items by tags', async () => {
      await runScenario('Tag Search', [
        {
          name: 'Search by tag "error"',
          action: async () => {
            return await callTool(context.client, 'search_items_by_tag', {
              tag: 'error'
            });
          },
          assertions: (result) => {
            expect(result.length).toBeGreaterThanOrEqual(2);
            
            result.forEach((item: any) => {
              expect(item.tags).toContain('error');
            });
          }
        },
        
        {
          name: 'Search by tag "javascript"',
          action: async () => {
            return await callTool(context.client, 'search_items_by_tag', {
              tag: 'javascript'
            });
          },
          assertions: (result) => {
            expect(result.length).toBeGreaterThanOrEqual(2);
            
            result.forEach((item: any) => {
              expect(item.tags).toContain('javascript');
            });
          }
        },
        
        {
          name: 'Search by tag with type filter',
          action: async () => {
            return await callTool(context.client, 'search_items_by_tag', {
              tag: 'error',
              types: ['issues']
            });
          },
          assertions: (result) => {
            expect(result.length).toBeGreaterThanOrEqual(1);
            
            result.forEach((item: any) => {
              expect(item.type).toBe('issues');
              expect(item.tags).toContain('error');
            });
          }
        },
        
        {
          name: 'Get all tags',
          action: async () => {
            return await callTool(context.client, 'get_tags');
          },
          assertions: (result) => {
            const tagNames = result.map((tag: any) => tag.name);
            
            // Verify our test tags exist
            expect(tagNames).toContain('javascript');
            expect(tagNames).toContain('error');
            expect(tagNames).toContain('python');
            expect(tagNames).toContain('api');
          }
        }
      ]);
    });
  });
  
  describe('Advanced Search Features', () => {
    it('should support complex search scenarios', async () => {
      await runScenario('Advanced Search', [
        {
          name: 'Case-insensitive search',
          action: async () => {
            const results = await Promise.all([
              callTool(context.client, 'search_all', { query: 'javascript' }),
              callTool(context.client, 'search_all', { query: 'JavaScript' }),
              callTool(context.client, 'search_all', { query: 'JAVASCRIPT' })
            ]);
            
            return results;
          },
          assertions: (results) => {
            // All searches should return same number of results
            const counts = results.map(r => 
              r.issues.length + r.plans.length + r.knowledge.length
            );
            
            expect(counts[0]).toBe(counts[1]);
            expect(counts[1]).toBe(counts[2]);
            expect(counts[0]).toBeGreaterThan(0);
          }
        },
        
        {
          name: 'Partial word search',
          action: async () => {
            return await callTool(context.client, 'search_all', {
              query: 'doc'
            });
          },
          assertions: (result) => {
            const allItems = [
              ...result.issues,
              ...result.plans,
              ...result.knowledge
            ];
            
            // Should find items containing "documentation"
            const hasDoc = allItems.some(item => 
              item.title.toLowerCase().includes('doc') ||
              item.content.toLowerCase().includes('doc')
            );
            
            expect(hasDoc).toBe(true);
          }
        },
        
        {
          name: 'Multi-word search',
          action: async () => {
            return await callTool(context.client, 'search_all', {
              query: 'error handling'
            });
          },
          assertions: (result) => {
            const allItems = [
              ...result.issues,
              ...result.plans,
              ...result.knowledge
            ];
            
            // Should find items containing both words
            expect(allItems.length).toBeGreaterThan(0);
          }
        }
      ]);
    });
  });
});