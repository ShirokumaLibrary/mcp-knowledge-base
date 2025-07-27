/**
 * @ai-context E2E security tests
 * @ai-pattern Security validation
 * @ai-critical Ensures security measures work
 */

import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';
import {
  setupE2ETest,
  callTool,
  runScenario,
  E2ETestContext
} from './setup-e2e.js';

describe('E2E: Security Tests', () => {
  let context: E2ETestContext;
  
  beforeAll(async () => {
    context = await setupE2ETest();
  }, 30000);
  
  afterAll(async () => {
    await context.cleanup();
  });
  
  describe('Input Validation', () => {
    it('should reject invalid inputs', async () => {
      await runScenario('Input Validation', [
        {
          name: 'Reject empty title',
          action: async () => {
            try {
              await callTool(context.client, 'create_item', {
                type: 'issues',
                title: '',
                content: 'Valid content'
              });
              return { error: null };
            } catch (error) {
              return { error };
            }
          },
          assertions: ({ error }) => {
            expect(error).toBeDefined();
            expect(error.message).toContain('title');
          }
        },
        
        {
          name: 'Reject invalid type',
          action: async () => {
            try {
              await callTool(context.client, 'create_item', {
                type: 'invalid_type',
                title: 'Test',
                content: 'Test content'
              });
              return { error: null };
            } catch (error) {
              return { error };
            }
          },
          assertions: ({ error }) => {
            expect(error).toBeDefined();
            expect(error.message).toContain('type');
          }
        },
        
        {
          name: 'Reject excessively long title',
          action: async () => {
            try {
              await callTool(context.client, 'create_item', {
                type: 'issues',
                title: 'x'.repeat(1000),
                content: 'Valid content'
              });
              return { error: null };
            } catch (error) {
              return { error };
            }
          },
          assertions: ({ error }) => {
            expect(error).toBeDefined();
            expect(error.message).toContain('length');
          }
        },
        
        {
          name: 'Reject invalid priority',
          action: async () => {
            try {
              await callTool(context.client, 'create_item', {
                type: 'issues',
                title: 'Test issue',
                content: 'Test content',
                priority: 'invalid_priority'
              });
              return { error: null };
            } catch (error) {
              return { error };
            }
          },
          assertions: ({ error }) => {
            expect(error).toBeDefined();
            expect(error.message).toContain('priority');
          }
        }
      ]);
    });
    
    it('should sanitize potentially dangerous inputs', async () => {
      await runScenario('Input Sanitization', [
        {
          name: 'Handle SQL injection attempts',
          action: async () => {
            try {
              // Should either sanitize or reject
              const result = await callTool(context.client, 'create_item', {
                type: 'issues',
                title: "Test'; DROP TABLE issues; --",
                content: 'Normal content'
              });
              return { result, error: null };
            } catch (error) {
              return { result: null, error };
            }
          },
          assertions: ({ result, error }) => {
            // Either sanitized or rejected
            if (result) {
              // If accepted, dangerous SQL should be sanitized
              expect(result.title).not.toContain('DROP TABLE');
            } else {
              // If rejected, should have appropriate error
              expect(error).toBeDefined();
            }
          }
        },
        
        {
          name: 'Handle script injection attempts',
          action: async () => {
            try {
              const result = await callTool(context.client, 'create_item', {
                type: 'docs',
                title: 'Test <script>alert("XSS")</script>',
                content: 'Normal content'
              });
              return { result, error: null };
            } catch (error) {
              return { result: null, error };
            }
          },
          assertions: ({ result, error }) => {
            if (result) {
              // Script tags should be escaped or removed
              expect(result.title).not.toContain('<script>');
              expect(result.title).not.toContain('</script>');
            } else {
              expect(error).toBeDefined();
            }
          }
        },
        
        {
          name: 'Handle path traversal attempts',
          action: async () => {
            try {
              const result = await callTool(context.client, 'create_item', {
                type: 'knowledge',
                title: 'Test ../../etc/passwd',
                content: 'Normal content'
              });
              return { result, error: null };
            } catch (error) {
              return { result: null, error };
            }
          },
          assertions: ({ result, error }) => {
            if (result) {
              // Path traversal should be sanitized
              expect(result.title).not.toContain('../');
            } else {
              expect(error).toBeDefined();
            }
          }
        }
      ]);
    });
  });
  
  describe('Access Control', () => {
    it('should enforce resource limits', async () => {
      const createdIds: number[] = [];
      
      await runScenario('Resource Limits', [
        {
          name: 'Test tag limit',
          action: async () => {
            try {
              // Try to create item with too many tags
              const tags = Array.from({ length: 50 }, (_, i) => `tag${i}`);
              
              const result = await callTool(context.client, 'create_item', {
                type: 'issues',
                title: 'Too many tags test',
                content: 'Testing tag limits',
                tags
              });
              
              return { result, error: null };
            } catch (error) {
              return { result: null, error };
            }
          },
          assertions: ({ result, error }) => {
            // Should either limit tags or reject
            if (result) {
              createdIds.push(result.id);
              expect(result.tags.length).toBeLessThanOrEqual(20);
            } else {
              expect(error).toBeDefined();
            }
          }
        },
        
        {
          name: 'Test non-existent resource access',
          action: async () => {
            try {
              const result = await callTool(context.client, 'get_item_detail', {
                type: 'issues',
                id: 999999
              });
              return { result, error: null };
            } catch (error) {
              return { result: null, error };
            }
          },
          assertions: ({ result, error }) => {
            // Should return null or error, not crash
            expect(result === null || error !== null).toBe(true);
          }
        },
        
        {
          name: 'Clean up',
          action: async () => {
            for (const id of createdIds) {
              await callTool(context.client, 'delete_item', {
                type: 'issues',
                id
              });
            }
            return true;
          },
          assertions: (result) => {
            expect(result).toBe(true);
          }
        }
      ]);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      await runScenario('Error Handling', [
        {
          name: 'Invalid tool name',
          action: async () => {
            try {
              await callTool(context.client, 'invalid_tool_name', {});
              return { error: null };
            } catch (error) {
              return { error };
            }
          },
          assertions: ({ error }) => {
            expect(error).toBeDefined();
            // Should not expose internal details
            expect(error.message).not.toContain('stack');
            expect(error.message).not.toContain('trace');
          }
        },
        
        {
          name: 'Malformed parameters',
          action: async () => {
            try {
              await callTool(context.client, 'create_item', {
                // Missing required fields
                type: 'issues'
              });
              return { error: null };
            } catch (error) {
              return { error };
            }
          },
          assertions: ({ error }) => {
            expect(error).toBeDefined();
            expect(error.message).toContain('required');
          }
        },
        
        {
          name: 'Type mismatch',
          action: async () => {
            try {
              await callTool(context.client, 'get_item_detail', {
                type: 'issues',
                id: 'not_a_number'
              });
              return { error: null };
            } catch (error) {
              return { error };
            }
          },
          assertions: ({ error }) => {
            expect(error).toBeDefined();
          }
        }
      ]);
    });
  });
  
  describe('Data Integrity', () => {
    it('should maintain data consistency', async () => {
      let testItem: any;
      
      await runScenario('Data Integrity', [
        {
          name: 'Create test item',
          action: async () => {
            return await callTool(context.client, 'create_item', {
              type: 'plans',
              title: 'Data integrity test',
              content: 'Testing data consistency',
              start_date: '2024-01-01',
              end_date: '2024-12-31',
              priority: 'high',
              tags: ['test', 'integrity']
            });
          },
          assertions: (result) => {
            testItem = result;
            expect(result.id).toBeDefined();
            expect(result.created_at).toBeDefined();
            expect(result.updated_at).toBeDefined();
          }
        },
        
        {
          name: 'Verify timestamps',
          action: async () => {
            // Update the item
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const updated = await callTool(context.client, 'update_item', {
              type: 'plans',
              id: testItem.id,
              title: 'Updated title'
            });
            
            return { original: testItem, updated };
          },
          assertions: ({ original, updated }) => {
            // created_at should not change
            expect(updated.created_at).toBe(original.created_at);
            
            // updated_at should change
            expect(new Date(updated.updated_at).getTime())
              .toBeGreaterThan(new Date(original.updated_at).getTime());
          }
        },
        
        {
          name: 'Verify data persistence',
          action: async () => {
            // Get the item again
            return await callTool(context.client, 'get_item_detail', {
              type: 'plans',
              id: testItem.id
            });
          },
          assertions: (result) => {
            expect(result.title).toBe('Updated title');
            expect(result.content).toBe(testItem.content);
            expect(result.priority).toBe(testItem.priority);
            expect(result.tags).toEqual(testItem.tags);
          }
        },
        
        {
          name: 'Clean up',
          action: async () => {
            return await callTool(context.client, 'delete_item', {
              type: 'plans',
              id: testItem.id
            });
          },
          assertions: (result) => {
            expect(result.success).toBe(true);
          }
        }
      ]);
    });
  });
});