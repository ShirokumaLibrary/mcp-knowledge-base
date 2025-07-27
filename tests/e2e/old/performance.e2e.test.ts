/**
 * @ai-context E2E performance tests
 * @ai-pattern Performance benchmarking
 * @ai-critical Ensures acceptable response times
 */

import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';
import {
  setupE2ETest,
  callTool,
  measurePerformance,
  runScenario,
  E2ETestContext
} from './setup-e2e.js';

describe('E2E: Performance Tests', () => {
  let context: E2ETestContext;
  
  beforeAll(async () => {
    context = await setupE2ETest();
  }, 30000);
  
  afterAll(async () => {
    await context.cleanup();
  });
  
  describe('Response Time Benchmarks', () => {
    it('should meet performance targets for basic operations', async () => {
      const performanceTargets = {
        create: 100,    // 100ms
        read: 50,       // 50ms
        update: 100,    // 100ms
        delete: 50,     // 50ms
        list: 200,      // 200ms
        search: 500     // 500ms
      };
      
      let createdId: number;
      
      await runScenario('Performance Benchmarks', [
        {
          name: 'Create operation',
          action: async () => {
            return await measurePerformance(async () => {
              const result = await callTool(context.client, 'create_item', {
                type: 'issues',
                title: 'Performance test issue',
                content: 'Testing create performance',
                priority: 'medium'
              });
              createdId = result.id;
              return result;
            }, 'Create Issue');
          },
          assertions: ({ duration }) => {
            expect(duration).toBeLessThan(performanceTargets.create);
          }
        },
        
        {
          name: 'Read operation',
          action: async () => {
            return await measurePerformance(async () => {
              return await callTool(context.client, 'get_item_detail', {
                type: 'issues',
                id: createdId
              });
            }, 'Read Issue');
          },
          assertions: ({ duration }) => {
            expect(duration).toBeLessThan(performanceTargets.read);
          }
        },
        
        {
          name: 'Update operation',
          action: async () => {
            return await measurePerformance(async () => {
              return await callTool(context.client, 'update_item', {
                type: 'issues',
                id: createdId,
                title: 'Updated performance test issue'
              });
            }, 'Update Issue');
          },
          assertions: ({ duration }) => {
            expect(duration).toBeLessThan(performanceTargets.update);
          }
        },
        
        {
          name: 'List operation',
          action: async () => {
            return await measurePerformance(async () => {
              return await callTool(context.client, 'get_items', {
                type: 'issues',
                limit: 100
              });
            }, 'List Issues');
          },
          assertions: ({ duration }) => {
            expect(duration).toBeLessThan(performanceTargets.list);
          }
        },
        
        {
          name: 'Search operation',
          action: async () => {
            return await measurePerformance(async () => {
              return await callTool(context.client, 'search_all', {
                query: 'performance'
              });
            }, 'Search All');
          },
          assertions: ({ duration }) => {
            expect(duration).toBeLessThan(performanceTargets.search);
          }
        },
        
        {
          name: 'Delete operation',
          action: async () => {
            return await measurePerformance(async () => {
              return await callTool(context.client, 'delete_item', {
                type: 'issues',
                id: createdId
              });
            }, 'Delete Issue');
          },
          assertions: ({ duration }) => {
            expect(duration).toBeLessThan(performanceTargets.delete);
          }
        }
      ]);
    });
  });
  
  describe('Load Testing', () => {
    it('should handle concurrent operations', async () => {
      const concurrentOps = 10;
      
      await runScenario('Concurrent Operations', [
        {
          name: `Create ${concurrentOps} items concurrently`,
          action: async () => {
            return await measurePerformance(async () => {
              const promises = [];
              
              for (let i = 0; i < concurrentOps; i++) {
                promises.push(
                  callTool(context.client, 'create_item', {
                    type: 'issues',
                    title: `Concurrent issue ${i}`,
                    content: `Content for concurrent issue ${i}`,
                    priority: 'low'
                  })
                );
              }
              
              return await Promise.all(promises);
            }, `Create ${concurrentOps} Issues Concurrently`);
          },
          assertions: ({ result, duration }) => {
            expect(result).toHaveLength(concurrentOps);
            
            // Should complete within reasonable time
            const maxDuration = concurrentOps * 50; // 50ms per item
            expect(duration).toBeLessThan(maxDuration);
            
            // Calculate average time per operation
            const avgTime = duration / concurrentOps;
            console.log(`    Average time per operation: ${avgTime.toFixed(2)}ms`);
          }
        },
        
        {
          name: 'Clean up concurrent items',
          action: async () => {
            const items = await callTool(context.client, 'get_items', {
              type: 'issues'
            });
            
            const concurrentItems = items.filter((item: any) =>
              item.title.startsWith('Concurrent issue')
            );
            
            const deletePromises = concurrentItems.map((item: any) =>
              callTool(context.client, 'delete_item', {
                type: 'issues',
                id: item.id
              })
            );
            
            return await Promise.all(deletePromises);
          },
          assertions: (results) => {
            expect(results.length).toBe(concurrentOps);
          }
        }
      ]);
    });
    
    it('should handle large datasets efficiently', async () => {
      const largeDataset = 100;
      const createdIds: number[] = [];
      
      await runScenario('Large Dataset Performance', [
        {
          name: `Create ${largeDataset} items`,
          action: async () => {
            const batchSize = 10;
            const batches = Math.ceil(largeDataset / batchSize);
            
            for (let batch = 0; batch < batches; batch++) {
              const promises = [];
              
              for (let i = 0; i < batchSize && (batch * batchSize + i) < largeDataset; i++) {
                const index = batch * batchSize + i;
                promises.push(
                  callTool(context.client, 'create_item', {
                    type: 'plans',
                    title: `Large dataset plan ${index}`,
                    content: `Content for plan ${index}`,
                    start_date: '2024-01-01',
                    end_date: '2024-12-31',
                    priority: ['high', 'medium', 'low'][index % 3]
                  })
                );
              }
              
              const results = await Promise.all(promises);
              results.forEach(r => createdIds.push(r.id));
            }
            
            return createdIds;
          },
          assertions: (ids) => {
            expect(ids).toHaveLength(largeDataset);
          }
        },
        
        {
          name: 'Query large dataset',
          action: async () => {
            return await measurePerformance(async () => {
              return await callTool(context.client, 'get_items', {
                type: 'plans',
                limit: 1000
              });
            }, 'Query Large Dataset');
          },
          assertions: ({ result, duration }) => {
            expect(result.length).toBeGreaterThanOrEqual(largeDataset);
            
            // Should complete within 1 second even for large dataset
            expect(duration).toBeLessThan(1000);
          }
        },
        
        {
          name: 'Search in large dataset',
          action: async () => {
            return await measurePerformance(async () => {
              return await callTool(context.client, 'search_all', {
                query: 'dataset'
              });
            }, 'Search Large Dataset');
          },
          assertions: ({ result, duration }) => {
            expect(result.plans.length).toBeGreaterThanOrEqual(largeDataset);
            
            // Search should complete within 2 seconds
            expect(duration).toBeLessThan(2000);
          }
        },
        
        {
          name: 'Clean up large dataset',
          action: async () => {
            const batchSize = 20;
            const batches = Math.ceil(createdIds.length / batchSize);
            
            for (let batch = 0; batch < batches; batch++) {
              const batchIds = createdIds.slice(
                batch * batchSize,
                (batch + 1) * batchSize
              );
              
              const promises = batchIds.map(id =>
                callTool(context.client, 'delete_item', {
                  type: 'plans',
                  id
                })
              );
              
              await Promise.all(promises);
            }
            
            return true;
          },
          assertions: (result) => {
            expect(result).toBe(true);
          }
        }
      ]);
    }, 120000); // 2 minute timeout for large dataset test
  });
  
  describe('Memory Usage', () => {
    it('should not leak memory during repeated operations', async () => {
      const iterations = 50;
      const memoryReadings: number[] = [];
      
      await runScenario('Memory Leak Test', [
        {
          name: 'Baseline memory usage',
          action: async () => {
            if (global.gc) {
              global.gc();
            }
            const baseline = process.memoryUsage().heapUsed / 1024 / 1024;
            memoryReadings.push(baseline);
            return baseline;
          },
          assertions: (baseline) => {
            console.log(`    Baseline memory: ${baseline.toFixed(2)} MB`);
            expect(baseline).toBeLessThan(200); // Should be under 200MB
          }
        },
        
        {
          name: `Perform ${iterations} create/delete cycles`,
          action: async () => {
            for (let i = 0; i < iterations; i++) {
              // Create
              const item = await callTool(context.client, 'create_item', {
                type: 'knowledge',
                title: `Memory test item ${i}`,
                content: 'x'.repeat(1000) // 1KB of content
              });
              
              // Delete
              await callTool(context.client, 'delete_item', {
                type: 'knowledge',
                id: item.id
              });
              
              // Record memory every 10 iterations
              if (i % 10 === 0) {
                const memory = process.memoryUsage().heapUsed / 1024 / 1024;
                memoryReadings.push(memory);
              }
            }
            
            return memoryReadings;
          },
          assertions: (readings) => {
            // Memory should not grow significantly
            const baseline = readings[0];
            const final = readings[readings.length - 1];
            const growth = final - baseline;
            
            console.log(`    Memory growth: ${growth.toFixed(2)} MB`);
            
            // Allow up to 50MB growth
            expect(growth).toBeLessThan(50);
          }
        }
      ]);
    });
  });
});