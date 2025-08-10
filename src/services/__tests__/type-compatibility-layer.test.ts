import { TypeCompatibilityLayer } from '../type-compatibility-layer';

describe('TypeCompatibilityLayer', () => {
  let compatibilityLayer: TypeCompatibilityLayer;

  beforeEach(() => {
    compatibilityLayer = new TypeCompatibilityLayer();
  });

  describe('Legacy to New Type Mapping', () => {
    describe('Direct Mappings (1:1)', () => {
      test('should map issues directly to issues', () => {
        // Given: a legacy issues type request
        const legacyRequest = {
          type: 'issues',
          data: { title: 'Bug fix', status: 'Open' }
        };

        // When: converting to new type system
        const newRequest = compatibilityLayer.legacyToNew(legacyRequest);

        // Then: should maintain the same type
        expect(newRequest.type).toBe('issues');
        expect(newRequest.data).toEqual(legacyRequest.data);
      });

      test('should map decisions directly to decisions', () => {
        // Given: a legacy decisions type request
        const legacyRequest = {
          type: 'decisions',
          data: { title: 'Architecture decision', rationale: 'Performance reasons' }
        };

        // When: converting to new type system
        const newRequest = compatibilityLayer.legacyToNew(legacyRequest);

        // Then: should maintain the same type
        expect(newRequest.type).toBe('decisions');
        expect(newRequest.data).toEqual(legacyRequest.data);
      });

      test('should map sessions directly to sessions', () => {
        // Given: a legacy sessions type request
        const legacyRequest = {
          type: 'sessions',
          data: { title: 'Development session', duration: '2 hours' }
        };

        // When: converting to new type system
        const newRequest = compatibilityLayer.legacyToNew(legacyRequest);

        // Then: should maintain the same type
        expect(newRequest.type).toBe('sessions');
        expect(newRequest.data).toEqual(legacyRequest.data);
      });
    });

    describe('Consolidation Mappings (Many:1)', () => {
      test('should map features request to tasks', () => {
        // Given: a legacy features type request
        const legacyRequest = {
          type: 'features',
          data: { title: 'User authentication', priority: 'high' }
        };

        // When: converting to new type system
        const newRequest = compatibilityLayer.legacyToNew(legacyRequest);

        // Then: should convert to tasks with metadata
        expect(newRequest.type).toBe('tasks');
        expect(newRequest.data.title).toBe('User authentication');
        expect(newRequest.data.originalType).toBe('features');
        expect(newRequest.data.taskCategory).toBe('feature');
      });

      test('should map plans request to tasks', () => {
        // Given: a legacy plans type request
        const legacyRequest = {
          type: 'plans',
          data: { title: 'Q1 Roadmap', timeline: '3 months' }
        };

        // When: converting to new type system
        const newRequest = compatibilityLayer.legacyToNew(legacyRequest);

        // Then: should convert to tasks with metadata
        expect(newRequest.type).toBe('tasks');
        expect(newRequest.data.title).toBe('Q1 Roadmap');
        expect(newRequest.data.originalType).toBe('plans');
        expect(newRequest.data.taskCategory).toBe('plan');
      });

      test('should map test_results to docs', () => {
        // Given: a legacy test_results type request
        const legacyRequest = {
          type: 'test_results',
          data: { title: 'Test Report #123', passed: 50, failed: 2 }
        };

        // When: converting to new type system
        const newRequest = compatibilityLayer.legacyToNew(legacyRequest);

        // Then: should convert to docs
        expect(newRequest.type).toBe('docs');
        expect(newRequest.data.title).toBe('Test Report #123');
        expect(newRequest.data.originalType).toBe('test_results');
        expect(newRequest.data.docCategory).toBe('test-report');
      });

      test('should map dailies to sessions', () => {
        // Given: a legacy dailies type request
        const legacyRequest = {
          type: 'dailies',
          data: { title: 'Daily Summary', date: '2025-08-10' }
        };

        // When: converting to new type system
        const newRequest = compatibilityLayer.legacyToNew(legacyRequest);

        // Then: should convert to sessions
        expect(newRequest.type).toBe('sessions');
        expect(newRequest.data.title).toBe('Daily Summary');
        expect(newRequest.data.originalType).toBe('dailies');
        expect(newRequest.data.sessionCategory).toBe('daily-summary');
      });
    });

    describe('Classification Mappings (1:Many)', () => {
      test('should classify knowledge as pattern for generic content', () => {
        // Given: a knowledge request with pattern indicators
        const legacyRequest = {
          type: 'knowledge',
          data: {
            title: 'Error Handling Patterns',
            content: 'Best practices for error handling...',
            tags: ['pattern', 'best-practice']
          }
        };

        // When: converting to new type system
        const newRequest = compatibilityLayer.legacyToNew(legacyRequest);

        // Then: should classify as patterns
        expect(newRequest.type).toBe('patterns');
        expect(newRequest.data.title).toBe('Error Handling Patterns');
        expect(newRequest.data.patternType).toBe('best-practice');
      });

      test('should classify knowledge as doc for project-specific content', () => {
        // Given: a knowledge request with project-specific content
        const legacyRequest = {
          type: 'knowledge',
          data: {
            title: 'Database Schema Documentation',
            content: 'Our database uses PostgreSQL with...',
            tags: ['database', 'schema', 'documentation']
          }
        };

        // When: converting to new type system
        const newRequest = compatibilityLayer.legacyToNew(legacyRequest);

        // Then: should classify as docs
        expect(newRequest.type).toBe('docs');
        expect(newRequest.data.title).toBe('Database Schema Documentation');
        expect(newRequest.data.docCategory).toBe('technical-documentation');
      });

      test('should classify handovers as sessions for work records', () => {
        // Given: a handover request with session characteristics
        const legacyRequest = {
          type: 'handovers',
          data: {
            title: 'Development Handover',
            content: 'Completed the login feature...',
            tags: ['development', 'handover']
          }
        };

        // When: converting to new type system
        const newRequest = compatibilityLayer.legacyToNew(legacyRequest);

        // Then: should classify as sessions
        expect(newRequest.type).toBe('sessions');
        expect(newRequest.data.title).toBe('Development Handover');
        expect(newRequest.data.sessionCategory).toBe('handover');
      });

      test('should classify handovers as workflows for process content', () => {
        // Given: a handover request with workflow characteristics
        const legacyRequest = {
          type: 'handovers',
          data: {
            title: 'CI/CD Pipeline Process',
            content: 'Step 1: Build, Step 2: Test, Step 3: Deploy',
            tags: ['workflow', 'process', 'ci-cd']
          }
        };

        // When: converting to new type system
        const newRequest = compatibilityLayer.legacyToNew(legacyRequest);

        // Then: should classify as workflows
        expect(newRequest.type).toBe('workflows');
        expect(newRequest.data.title).toBe('CI/CD Pipeline Process');
        expect(newRequest.data.workflowType).toBe('process');
      });
    });

    describe('Obsolete Type Handling', () => {
      test('should handle state type as obsolete', () => {
        // Given: a legacy state type request
        const legacyRequest = {
          type: 'state',
          data: { title: 'Old state data' }
        };

        // When: converting to new type system
        const newRequest = compatibilityLayer.legacyToNew(legacyRequest);

        // Then: should mark as obsolete
        expect(newRequest.type).toBe('obsolete');
        expect(newRequest.skipProcessing).toBe(true);
        expect(newRequest.reason).toContain('state type is obsolete');
      });
    });
  });

  describe('New to Legacy Type Mapping', () => {
    test('should present tasks as features when legacy flag is on', () => {
      // Given: a tasks item with feature category and legacy mode enabled
      const newItem = {
        type: 'tasks',
        data: {
          title: 'User authentication',
          taskCategory: 'feature',
          originalType: 'features'
        }
      };

      // When: converting to legacy format with flag enabled
      const legacyItem = compatibilityLayer.newToLegacy(newItem, { legacyMode: true });

      // Then: should present as features
      expect(legacyItem.type).toBe('features');
      expect(legacyItem.data.title).toBe('User authentication');
      // Should remove new type metadata
      expect(legacyItem.data.taskCategory).toBeUndefined();
      expect(legacyItem.data.originalType).toBeUndefined();
    });

    test('should present tasks as plans when original type was plans', () => {
      // Given: a tasks item that was originally a plan
      const newItem = {
        type: 'tasks',
        data: {
          title: 'Q1 Roadmap',
          taskCategory: 'plan',
          originalType: 'plans'
        }
      };

      // When: converting to legacy format
      const legacyItem = compatibilityLayer.newToLegacy(newItem, { legacyMode: true });

      // Then: should present as plans
      expect(legacyItem.type).toBe('plans');
      expect(legacyItem.data.title).toBe('Q1 Roadmap');
    });

    test('should present patterns as knowledge in legacy mode', () => {
      // Given: a patterns item
      const newItem = {
        type: 'patterns',
        data: {
          title: 'Error Handling Patterns',
          patternType: 'best-practice'
        }
      };

      // When: converting to legacy format
      const legacyItem = compatibilityLayer.newToLegacy(newItem, { legacyMode: true });

      // Then: should present as knowledge
      expect(legacyItem.type).toBe('knowledge');
      expect(legacyItem.data.title).toBe('Error Handling Patterns');
      expect(legacyItem.data.tags).toContain('pattern');
    });

    test('should present docs as knowledge when appropriate', () => {
      // Given: a docs item that was originally knowledge
      const newItem = {
        type: 'docs',
        data: {
          title: 'API Documentation',
          originalType: 'knowledge'
        }
      };

      // When: converting to legacy format
      const legacyItem = compatibilityLayer.newToLegacy(newItem, { legacyMode: true });

      // Then: should present as knowledge
      expect(legacyItem.type).toBe('knowledge');
      expect(legacyItem.data.title).toBe('API Documentation');
    });

    test('should present docs as test_results when appropriate', () => {
      // Given: a docs item that was originally test_results
      const newItem = {
        type: 'docs',
        data: {
          title: 'Test Report #123',
          originalType: 'test_results',
          docCategory: 'test-report'
        }
      };

      // When: converting to legacy format
      const legacyItem = compatibilityLayer.newToLegacy(newItem, { legacyMode: true });

      // Then: should present as test_results
      expect(legacyItem.type).toBe('test_results');
      expect(legacyItem.data.title).toBe('Test Report #123');
    });

    test('should pass through unchanged when legacy mode is off', () => {
      // Given: a new type item with legacy mode disabled
      const newItem = {
        type: 'tasks',
        data: {
          title: 'Modern task',
          taskCategory: 'feature'
        }
      };

      // When: converting with legacy mode off
      const result = compatibilityLayer.newToLegacy(newItem, { legacyMode: false });

      // Then: should pass through unchanged
      expect(result).toEqual(newItem);
    });
  });

  describe('Batch Processing', () => {
    test('should handle batch conversion efficiently', () => {
      // Given: multiple legacy requests
      const legacyRequests = [
        { type: 'features', data: { title: 'Feature 1' } },
        { type: 'plans', data: { title: 'Plan 1' } },
        { type: 'knowledge', data: { title: 'Pattern Guide', tags: ['pattern'] } },
        { type: 'test_results', data: { title: 'Test Run' } },
        { type: 'issues', data: { title: 'Bug Report' } }
      ];

      // When: batch converting
      const startTime = Date.now();
      const newRequests = compatibilityLayer.batchLegacyToNew(legacyRequests);
      const executionTime = Date.now() - startTime;

      // Then: should convert all correctly
      expect(newRequests).toHaveLength(5);
      expect(newRequests[0].type).toBe('tasks');
      expect(newRequests[1].type).toBe('tasks');
      expect(newRequests[2].type).toBe('patterns');
      expect(newRequests[3].type).toBe('docs');
      expect(newRequests[4].type).toBe('issues');
      
      // Performance check (< 50ms for 5 items)
      expect(executionTime).toBeLessThan(50);
    });
  });

  describe('Classification Logic', () => {
    test('should use content analysis for knowledge classification', () => {
      // Given: knowledge items with ambiguous titles
      const testCases = [
        {
          input: {
            type: 'knowledge',
            data: {
              title: 'Guide',
              content: 'This pattern can be applied to any error handling scenario...',
              tags: []
            }
          },
          expectedType: 'patterns'
        },
        {
          input: {
            type: 'knowledge',
            data: {
              title: 'Guide',
              content: 'Our API endpoint /api/users requires authentication...',
              tags: []
            }
          },
          expectedType: 'docs'
        }
      ];

      testCases.forEach(testCase => {
        // When: classifying based on content
        const result = compatibilityLayer.legacyToNew(testCase.input);

        // Then: should classify correctly based on content
        expect(result.type).toBe(testCase.expectedType);
      });
    });

    test('should prioritize tags over content for classification', () => {
      // Given: a knowledge item with conflicting signals
      const legacyRequest = {
        type: 'knowledge',
        data: {
          title: 'Implementation Guide',
          content: 'Our specific API implementation...', // suggests docs
          tags: ['pattern', 'reusable'] // suggests patterns
        }
      };

      // When: classifying
      const newRequest = compatibilityLayer.legacyToNew(legacyRequest);

      // Then: tags should take priority
      expect(newRequest.type).toBe('patterns');
    });
  });

  describe('Error Handling', () => {
    test('should handle unknown legacy types gracefully', () => {
      // Given: an unknown legacy type
      const unknownRequest = {
        type: 'unknown_type',
        data: { title: 'Unknown' }
      };

      // When: attempting to convert
      const result = compatibilityLayer.legacyToNew(unknownRequest);

      // Then: should handle gracefully
      expect(result.type).toBe('unknown');
      expect(result.requiresManualReview).toBe(true);
    });

    test('should validate data structure', () => {
      // Given: malformed request
      const malformedRequest = {
        type: 'features'
        // Missing data field
      };

      // When/Then: should throw validation error
      expect(() => compatibilityLayer.legacyToNew(malformedRequest))
        .toThrow('Invalid request structure');
    });
  });
});