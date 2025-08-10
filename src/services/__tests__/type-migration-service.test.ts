import { TypeMigrationService } from '../type-migration-service';

describe('TypeMigrationService', () => {
  let service: TypeMigrationService;

  beforeEach(() => {
    service = new TypeMigrationService();
  });

  describe('Type Consolidation', () => {
    describe('Task Type Consolidation', () => {
      test('should consolidate issues into tasks', () => {
        // Given: an issue item
        const issueItem = {
          id: 1,
          type: 'issues',
          title: 'Fix login bug',
          description: 'Login not working',
          status: 'Open'
        };

        // When: migrating to new type system
        const migratedItem = service.migrateItem(issueItem);

        // Then: should remain as issues (1:1 mapping)
        expect(migratedItem.type).toBe('issues');
        expect(migratedItem.title).toBe('Fix login bug');
      });

      test('should consolidate plans into tasks', () => {
        // Given: a plan item
        const planItem = {
          id: 2,
          type: 'plans',
          title: 'Q1 Roadmap',
          description: 'Quarterly planning',
          priority: 'high'
        };

        // When: migrating to new type system
        const migratedItem = service.migrateItem(planItem);

        // Then: should be converted to tasks
        expect(migratedItem.type).toBe('tasks');
        expect(migratedItem.title).toBe('Q1 Roadmap');
        expect(migratedItem.originalType).toBe('plans');
      });

      test('should consolidate features into tasks', () => {
        // Given: a feature item
        const featureItem = {
          id: 3,
          type: 'features',
          title: 'Dark mode support',
          description: 'Add dark mode theme',
          priority: 'medium'
        };

        // When: migrating to new type system
        const migratedItem = service.migrateItem(featureItem);

        // Then: should be converted to tasks
        expect(migratedItem.type).toBe('tasks');
        expect(migratedItem.title).toBe('Dark mode support');
        expect(migratedItem.originalType).toBe('features');
      });
    });

    describe('Knowledge Type Splitting', () => {
      test('should split knowledge into patterns for generic content', () => {
        // Given: a knowledge item with generic pattern content
        const knowledgeItem = {
          id: 4,
          type: 'knowledge',
          title: 'Error Handling Best Practices',
          content: 'Always use try-catch blocks...',
          tags: ['best-practice', 'pattern']
        };

        // When: migrating to new type system
        const migratedItem = service.migrateItem(knowledgeItem);

        // Then: should be classified as patterns
        expect(migratedItem.type).toBe('patterns');
        expect(migratedItem.title).toBe('Error Handling Best Practices');
      });

      test('should split knowledge into docs for project-specific content', () => {
        // Given: a knowledge item with project-specific content
        const knowledgeItem = {
          id: 5,
          type: 'knowledge',
          title: 'API Configuration Guide',
          content: 'Our API uses the following settings...',
          tags: ['api', 'configuration']
        };

        // When: migrating to new type system
        const migratedItem = service.migrateItem(knowledgeItem);

        // Then: should be classified as docs
        expect(migratedItem.type).toBe('docs');
        expect(migratedItem.title).toBe('API Configuration Guide');
      });
    });

    describe('Test Results Merging', () => {
      test('should merge test_results into docs', () => {
        // Given: a test_results item
        const testResultItem = {
          id: 6,
          type: 'test_results',
          title: 'Unit Test Run #123',
          content: 'All tests passed',
          timestamp: '2025-08-10T10:00:00Z'
        };

        // When: migrating to new type system
        const migratedItem = service.migrateItem(testResultItem);

        // Then: should be converted to docs
        expect(migratedItem.type).toBe('docs');
        expect(migratedItem.title).toBe('Unit Test Run #123');
        expect(migratedItem.originalType).toBe('test_results');
      });
    });

    describe('Handovers Splitting', () => {
      test('should split handovers into sessions for work records', () => {
        // Given: a handover item with work record content
        const handoverItem = {
          id: 7,
          type: 'handovers',
          title: 'Development session handover',
          content: 'Completed login feature implementation',
          tags: ['development', 'session']
        };

        // When: migrating to new type system
        const migratedItem = service.migrateItem(handoverItem);

        // Then: should be classified as sessions
        expect(migratedItem.type).toBe('sessions');
        expect(migratedItem.title).toBe('Development session handover');
      });

      test('should split handovers into workflows for process content', () => {
        // Given: a handover item with workflow process content
        const handoverItem = {
          id: 8,
          type: 'handovers',
          title: 'Deployment Workflow',
          content: 'Step 1: Build, Step 2: Test, Step 3: Deploy',
          tags: ['workflow', 'process', 'deployment']
        };

        // When: migrating to new type system
        const migratedItem = service.migrateItem(handoverItem);

        // Then: should be classified as workflows
        expect(migratedItem.type).toBe('workflows');
        expect(migratedItem.title).toBe('Deployment Workflow');
      });
    });

    describe('Dailies Integration', () => {
      test('should merge dailies into sessions', () => {
        // Given: a dailies item
        const dailyItem = {
          id: 9,
          type: 'dailies',
          title: 'Daily Summary 2025-08-10',
          content: 'Today we completed...',
          date: '2025-08-10'
        };

        // When: migrating to new type system
        const migratedItem = service.migrateItem(dailyItem);

        // Then: should be converted to sessions
        expect(migratedItem.type).toBe('sessions');
        expect(migratedItem.title).toBe('Daily Summary 2025-08-10');
        expect(migratedItem.originalType).toBe('dailies');
      });
    });

    describe('State Type Removal', () => {
      test('should return null for obsolete state type', () => {
        // Given: a state item (obsolete)
        const stateItem = {
          id: 10,
          type: 'state',
          title: 'Old state data',
          content: 'Legacy state information'
        };

        // When: migrating to new type system
        const migratedItem = service.migrateItem(stateItem);

        // Then: should return null (type removed)
        expect(migratedItem).toBeNull();
      });
    });
  });

  describe('Reference Updates', () => {
    test('should update references when types are migrated', () => {
      // Given: an item with references to old types
      const itemWithReferences = {
        id: 11,
        type: 'issues',
        title: 'Issue with references',
        related: ['plans-1', 'features-2', 'knowledge-3', 'test_results-4']
      };

      // When: migrating references
      const updatedItem = service.updateReferences(itemWithReferences);

      // Then: references should be updated to new types
      expect(updatedItem.related).toContain('tasks-1'); // plans → tasks
      expect(updatedItem.related).toContain('tasks-2'); // features → tasks
      // knowledge-3 would need classification to determine patterns vs docs
      expect(updatedItem.related).toContain('docs-4'); // test_results → docs
    });

    test('should maintain bidirectional relationships', () => {
      // Given: two items with bidirectional references
      const item1 = {
        id: 1,
        type: 'issues',
        title: 'Issue 1',
        related: ['plans-2']
      };
      
      const item2 = {
        id: 2,
        type: 'plans',
        title: 'Plan 2',
        related: ['issues-1']
      };

      // When: migrating both items
      const migrationResult = service.migrateBatch([item1, item2]);

      // Then: bidirectional relationships should be maintained
      const migratedItem1 = migrationResult.find(i => i.id === 1);
      const migratedItem2 = migrationResult.find(i => i.id === 2);
      
      expect(migratedItem1?.related).toContain('tasks-2');
      expect(migratedItem2?.related).toContain('issues-1');
      expect(migratedItem2?.type).toBe('tasks');
    });

    test('should handle missing references gracefully', () => {
      // Given: an item with references to non-existent items
      const itemWithBrokenReferences = {
        id: 12,
        type: 'issues',
        title: 'Issue with broken references',
        related: ['plans-999', 'features-888', 'nonexistent-777']
      };

      // When: updating references
      const updatedItem = service.updateReferences(itemWithBrokenReferences);

      // Then: should handle gracefully without throwing
      expect(updatedItem).toBeDefined();
      expect(updatedItem.related).toEqual(expect.any(Array));
      // Could either filter out broken references or mark them
    });
  });

  describe('Batch Migration', () => {
    test('should handle batch migration efficiently', () => {
      // Given: multiple items of different types
      const items = [
        { id: 1, type: 'issues', title: 'Issue 1' },
        { id: 2, type: 'plans', title: 'Plan 1' },
        { id: 3, type: 'features', title: 'Feature 1' },
        { id: 4, type: 'knowledge', title: 'Pattern Guide', tags: ['pattern'] },
        { id: 5, type: 'test_results', title: 'Test Run' }
      ];

      // When: performing batch migration
      const startTime = Date.now();
      const migratedItems = service.migrateBatch(items);
      const executionTime = Date.now() - startTime;

      // Then: should migrate all items correctly
      expect(migratedItems).toHaveLength(5);
      expect(migratedItems[0].type).toBe('issues');
      expect(migratedItems[1].type).toBe('tasks');
      expect(migratedItems[2].type).toBe('tasks');
      expect(migratedItems[3].type).toBe('patterns');
      expect(migratedItems[4].type).toBe('docs');
      
      // Performance: batch should be efficient (< 100ms for 5 items)
      expect(executionTime).toBeLessThan(100);
    });

    test('should provide migration summary', () => {
      // Given: multiple items to migrate
      const items = [
        { id: 1, type: 'issues', title: 'Issue 1' },
        { id: 2, type: 'plans', title: 'Plan 1' },
        { id: 3, type: 'features', title: 'Feature 1' },
        { id: 4, type: 'state', title: 'State 1' }
      ];

      // When: getting migration summary
      const summary = service.getMigrationSummary(items);

      // Then: should provide accurate counts
      expect(summary.total).toBe(4);
      expect(summary.migrated).toEqual({
        'issues': 1,
        'tasks': 2,  // plans + features
        'removed': 1  // state
      });
      expect(summary.errors).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid type gracefully', () => {
      // Given: an item with unknown type
      const invalidItem = {
        id: 99,
        type: 'unknown_type',
        title: 'Unknown item'
      };

      // When: attempting to migrate
      const result = service.migrateItem(invalidItem);

      // Then: should handle gracefully
      expect(result).toBeDefined();
      // Could either pass through unchanged or mark as needs_review
    });

    test('should validate required fields', () => {
      // Given: an item missing required fields
      const incompleteItem = {
        type: 'issues'
        // Missing id and title
      };

      // When/Then: should throw validation error
      expect(() => service.migrateItem(incompleteItem)).toThrow('Invalid item: id must be a number');
    });
  });
});