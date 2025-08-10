import { TypeRouter } from '../type-router';
import { TypeCompatibilityLayer } from '../../services/type-compatibility-layer';

describe('TypeRouter', () => {
  let router: TypeRouter;
  let mockCompatibilityLayer: jest.Mocked<TypeCompatibilityLayer>;
  let mockHandler: jest.Mock;

  beforeEach(() => {
    // Mock dependencies
    mockCompatibilityLayer = {
      legacyToNew: jest.fn(),
      newToLegacy: jest.fn(),
      batchLegacyToNew: jest.fn()
    } as any;

    mockHandler = jest.fn();

    // Create router with mocked dependencies
    router = new TypeRouter({
      compatibilityLayer: mockCompatibilityLayer,
      handler: mockHandler
    });
  });

  describe('Request Routing', () => {
    describe('Legacy Type Routing', () => {
      test('should route legacy type requests to compatibility layer', async () => {
        // Given: a request with legacy type
        const request = {
          method: 'create_item',
          params: {
            type: 'features',  // Legacy type
            title: 'New feature',
            data: { priority: 'high' }
          }
        };

        // Mock compatibility layer response
        mockCompatibilityLayer.legacyToNew.mockReturnValue({
          type: 'tasks',
          data: {
            title: 'New feature',
            priority: 'high',
            taskCategory: 'feature',
            originalType: 'features'
          }
        });

        // When: routing the request
        await router.route(request);

        // Then: should use compatibility layer
        expect(mockCompatibilityLayer.legacyToNew).toHaveBeenCalledWith({
          type: 'features',
          data: expect.objectContaining({
            title: 'New feature',
            priority: 'high'
          })
        });

        // And: should pass converted request to handler
        expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining({
          method: 'create_item',
          params: expect.objectContaining({
            type: 'tasks'
          })
        }));
      });

      test('should route plans requests through compatibility layer', async () => {
        // Given: a plans type request
        const request = {
          method: 'get_items',
          params: {
            type: 'plans'
          }
        };

        // When: routing the request
        await router.route(request);

        // Then: should transform to tasks query
        expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining({
          params: expect.objectContaining({
            type: 'tasks',
            filter: { taskCategory: 'plan' }
          })
        }));
      });

      test('should route test_results requests through compatibility layer', async () => {
        // Given: a test_results type request
        const request = {
          method: 'create_item',
          params: {
            type: 'test_results',
            title: 'Test Report',
            content: 'All tests passed'
          }
        };

        // Mock compatibility layer response
        mockCompatibilityLayer.legacyToNew.mockReturnValue({
          type: 'docs',
          data: {
            title: 'Test Report',
            content: 'All tests passed',
            docCategory: 'test-report',
            originalType: 'test_results'
          }
        });

        // When: routing the request
        await router.route(request);

        // Then: should convert to docs
        expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining({
          params: expect.objectContaining({
            type: 'docs'
          })
        }));
      });

      test('should handle knowledge type with classification', async () => {
        // Given: a knowledge type request
        const request = {
          method: 'create_item',
          params: {
            type: 'knowledge',
            title: 'Best Practices Guide',
            content: 'Generic patterns for error handling...',
            tags: ['pattern', 'guide']
          }
        };

        // Mock classification result
        mockCompatibilityLayer.legacyToNew.mockReturnValue({
          type: 'patterns',
          data: {
            title: 'Best Practices Guide',
            content: 'Generic patterns for error handling...',
            patternType: 'best-practice'
          }
        });

        // When: routing the request
        await router.route(request);

        // Then: should classify and route to patterns
        expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining({
          params: expect.objectContaining({
            type: 'patterns'
          })
        }));
      });
    });

    describe('New Type Routing', () => {
      test('should handle new type requests directly', async () => {
        // Given: a request with new type
        const request = {
          method: 'create_item',
          params: {
            type: 'tasks',  // New type
            title: 'Modern task',
            taskCategory: 'feature'
          }
        };

        // When: routing the request
        await router.route(request);

        // Then: should pass directly to handler (no compatibility layer)
        expect(mockCompatibilityLayer.legacyToNew).not.toHaveBeenCalled();
        expect(mockHandler).toHaveBeenCalledWith(request);
      });

      test('should handle patterns type directly', async () => {
        // Given: a patterns type request
        const request = {
          method: 'get_items',
          params: {
            type: 'patterns'
          }
        };

        // When: routing the request
        await router.route(request);

        // Then: should handle directly
        expect(mockHandler).toHaveBeenCalledWith(request);
        expect(mockCompatibilityLayer.legacyToNew).not.toHaveBeenCalled();
      });

      test('should handle workflows type directly', async () => {
        // Given: a workflows type request
        const request = {
          method: 'create_item',
          params: {
            type: 'workflows',
            title: 'Deployment Process',
            workflowType: 'ci-cd'
          }
        };

        // When: routing the request
        await router.route(request);

        // Then: should handle directly
        expect(mockHandler).toHaveBeenCalledWith(request);
      });
    });

    describe('Response Transformation', () => {
      test('should transform responses for legacy clients', async () => {
        // Given: a legacy features request
        const request = {
          method: 'get_items',
          params: {
            type: 'features'
          },
          context: {
            clientVersion: '1.0.0',  // Legacy client
            legacyMode: true
          }
        };

        // Mock handler returns tasks
        mockHandler.mockResolvedValue({
          items: [
            {
              type: 'tasks',
              id: 1,
              title: 'Feature 1',
              taskCategory: 'feature',
              originalType: 'features'
            }
          ]
        });

        // Mock reverse transformation
        mockCompatibilityLayer.newToLegacy.mockReturnValue({
          type: 'features',
          id: 1,
          title: 'Feature 1'
        });

        // When: routing and getting response
        const response = await router.route(request);

        // Then: should transform response back to legacy format
        expect(mockCompatibilityLayer.newToLegacy).toHaveBeenCalled();
        expect(response.items[0].type).toBe('features');
      });

      test('should not transform responses for new clients', async () => {
        // Given: a modern client request
        const request = {
          method: 'get_items',
          params: {
            type: 'tasks'
          },
          context: {
            clientVersion: '2.0.0',  // New client
            legacyMode: false
          }
        };

        // Mock handler response
        mockHandler.mockResolvedValue({
          items: [
            {
              type: 'tasks',
              id: 1,
              title: 'Task 1'
            }
          ]
        });

        // When: routing
        const response = await router.route(request);

        // Then: should not transform response
        expect(mockCompatibilityLayer.newToLegacy).not.toHaveBeenCalled();
        expect(response.items[0].type).toBe('tasks');
      });
    });

    describe('Feature Flag Support', () => {
      test('should respect feature flags for gradual rollout', async () => {
        // Given: feature flags configuration
        const featureFlags = {
          enableNewTypes: false,
          enableKnowledgeClassification: false,
          enableReferenceUpdates: false
        };

        router = new TypeRouter({
          compatibilityLayer: mockCompatibilityLayer,
          handler: mockHandler,
          featureFlags
        });

        const request = {
          method: 'create_item',
          params: {
            type: 'tasks',  // New type
            title: 'Task item'
          }
        };

        // When: routing with new types disabled
        await router.route(request);

        // Then: should reject new type requests
        expect(mockHandler).not.toHaveBeenCalled();
      });

      test('should enable new types when flag is on', async () => {
        // Given: feature flags with new types enabled
        const featureFlags = {
          enableNewTypes: true,
          enableKnowledgeClassification: true,
          enableReferenceUpdates: true
        };

        router = new TypeRouter({
          compatibilityLayer: mockCompatibilityLayer,
          handler: mockHandler,
          featureFlags
        });

        const request = {
          method: 'create_item',
          params: {
            type: 'patterns',
            title: 'Design Pattern'
          }
        };

        // When: routing with new types enabled
        await router.route(request);

        // Then: should accept new type requests
        expect(mockHandler).toHaveBeenCalledWith(request);
      });

      test('should handle partial feature enablement', async () => {
        // Given: partial feature enablement
        const featureFlags = {
          enableNewTypes: true,
          enableKnowledgeClassification: false,  // Classification disabled
          enableReferenceUpdates: true
        };

        router = new TypeRouter({
          compatibilityLayer: mockCompatibilityLayer,
          handler: mockHandler,
          featureFlags
        });

        const request = {
          method: 'create_item',
          params: {
            type: 'knowledge',  // Requires classification
            title: 'Knowledge Item'
          }
        };

        // When: routing with classification disabled
        await router.route(request);

        // Then: should handle as legacy knowledge type
        expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining({
          params: expect.objectContaining({
            type: 'knowledge'  // Not classified
          })
        }));
      });
    });

    describe('Obsolete Type Handling', () => {
      test('should reject requests for obsolete state type', async () => {
        // Given: a request for obsolete state type
        const request = {
          method: 'create_item',
          params: {
            type: 'state',
            title: 'State data'
          }
        };

        // When/Then: should reject the request
        await expect(router.route(request)).rejects.toThrow('Type "state" is obsolete');
      });

      test('should provide migration guidance for obsolete types', async () => {
        // Given: request for obsolete type
        const request = {
          method: 'get_items',
          params: {
            type: 'state'
          }
        };

        // When: attempting to route
        try {
          await router.route(request);
        } catch (error: any) {
          // Then: error should include migration guidance
          expect(error.message).toContain('obsolete');
          expect(error.migrationGuidance).toBeDefined();
          expect(error.migrationGuidance).toContain('use current_state');
        }
      });
    });

    describe('Batch Operations', () => {
      test('should handle batch create with mixed types', async () => {
        // Given: batch create with mixed legacy and new types
        const request = {
          method: 'batch_create',
          params: {
            items: [
              { type: 'features', title: 'Feature 1' },
              { type: 'tasks', title: 'Task 1' },
              { type: 'knowledge', title: 'Knowledge 1' },
              { type: 'patterns', title: 'Pattern 1' }
            ]
          }
        };

        // When: routing batch request
        await router.route(request);

        // Then: should process each item appropriately
        expect(mockCompatibilityLayer.batchLegacyToNew).toHaveBeenCalled();
        expect(mockHandler).toHaveBeenCalled();
      });

      test('should optimize batch operations', async () => {
        // Given: large batch operation
        const items = Array.from({ length: 100 }, (_, i) => ({
          type: i % 2 === 0 ? 'features' : 'plans',
          title: `Item ${i}`
        }));

        const request = {
          method: 'batch_create',
          params: { items }
        };

        // When: processing batch
        const startTime = Date.now();
        await router.route(request);
        const executionTime = Date.now() - startTime;

        // Then: should process efficiently (< 500ms for 100 items)
        expect(executionTime).toBeLessThan(500);
        expect(mockHandler).toHaveBeenCalledTimes(1); // Single batch call
      });
    });

    describe('Error Handling', () => {
      test('should handle handler errors gracefully', async () => {
        // Given: handler that throws error
        mockHandler.mockRejectedValue(new Error('Database error'));

        const request = {
          method: 'create_item',
          params: {
            type: 'tasks',
            title: 'Task'
          }
        };

        // When/Then: should propagate error with context
        await expect(router.route(request)).rejects.toThrow('Database error');
      });

      test('should handle compatibility layer errors', async () => {
        // Given: compatibility layer that throws
        mockCompatibilityLayer.legacyToNew.mockImplementation(() => {
          throw new Error('Classification failed');
        });

        const request = {
          method: 'create_item',
          params: {
            type: 'knowledge',
            title: 'Knowledge item'
          }
        };

        // When/Then: should handle gracefully
        await expect(router.route(request)).rejects.toThrow('Classification failed');
      });

      test('should validate request structure', async () => {
        // Given: malformed request
        const request = {
          method: 'create_item'
          // Missing params
        };

        // When/Then: should validate and throw
        await expect(router.route(request as any)).rejects.toThrow('Invalid request');
      });
    });

    describe('Monitoring and Metrics', () => {
      test('should track type migration metrics', async () => {
        // Given: router with metrics tracking
        const metrics = {
          legacyTypeCount: 0,
          newTypeCount: 0,
          migrationErrors: 0
        };

        router = new TypeRouter({
          compatibilityLayer: mockCompatibilityLayer,
          handler: mockHandler,
          metrics
        });

        // When: processing various requests
        await router.route({ method: 'create', params: { type: 'features' } });
        await router.route({ method: 'create', params: { type: 'tasks' } });
        await router.route({ method: 'create', params: { type: 'plans' } });

        // Then: should update metrics
        expect(metrics.legacyTypeCount).toBe(2); // features, plans
        expect(metrics.newTypeCount).toBe(1); // tasks
      });

      test('should log migration warnings', async () => {
        // Given: router with warning logger
        const warnings: string[] = [];
        router = new TypeRouter({
          compatibilityLayer: mockCompatibilityLayer,
          handler: mockHandler,
          logger: {
            warn: (msg: string) => warnings.push(msg)
          }
        });

        // When: using deprecated type
        await router.route({
          method: 'create_item',
          params: { type: 'features', title: 'Feature' }
        });

        // Then: should log deprecation warning
        expect(warnings.some(w => w.includes('deprecated'))).toBe(true);
        expect(warnings.some(w => w.includes('features'))).toBe(true);
      });
    });
  });
});