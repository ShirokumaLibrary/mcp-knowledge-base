import { SearchRepository } from '../database/search-repository.js';
import { DatabaseConnection } from '../database/base.js';
import { TaskRepository } from '../database/task-repository.js';
import { DocumentRepository } from '../database/document-repository.js';

describe('SearchRepository', () => {
  let searchRepo: SearchRepository;
  let db: DatabaseConnection;
  let mockTaskRepo: any;
  let mockDocRepo: any;

  beforeEach(async () => {
    db = new DatabaseConnection(':memory:');
    await db.initialize();
    
    // Create the items table that SearchRepository expects
    await db.getDatabase().runAsync(`
      CREATE TABLE IF NOT EXISTS items (
        type TEXT NOT NULL,
        id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        tags TEXT,
        priority TEXT,
        status_id INTEGER,
        start_date TEXT,
        end_date TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (type, id)
      )
    `);
    
    // Create mock repositories
    mockTaskRepo = {
      getAllTasksByTag: jest.fn(),
      getTasksByTag: jest.fn(),
      getAllTasks: jest.fn().mockImplementation((type) => {
        // Return mocked tasks based on the test data
        if (type === 'issues') {
          return Promise.resolve([
            { id: 1, title: 'Bug with API', tags: ['bug', 'api'], priority: 'high' },
            { id: 2, title: 'Feature request', tags: ['feature', 'ui'], priority: 'medium' }
          ]);
        } else if (type === 'plans') {
          return Promise.resolve([
            { id: 1, title: 'Q1 Roadmap', tags: ['roadmap', 'planning'], priority: 'high' }
          ]);
        }
        return Promise.resolve([]);
      })
    };
    mockDocRepo = {
      getDocumentsByTag: jest.fn(),
      searchDocumentsByTag: jest.fn().mockImplementation((tag) => {
        // Return mocked documents based on tag
        const allDocs = [
          { id: 1, type: 'docs', title: 'API Guide', tags: ['documentation', 'api'] },
          { id: 1, type: 'knowledge', title: 'Best Practices', tags: ['best-practices', 'development'] }
        ];
        return Promise.resolve(allDocs.filter(d => d.tags.includes(tag)));
      }),
      getAllDocuments: jest.fn().mockResolvedValue([])
    };
    
    searchRepo = new SearchRepository(db.getDatabase(), mockTaskRepo, mockDocRepo);
    
    // Set up sequences table for task types
    await db.getDatabase().runAsync(`
      CREATE TABLE IF NOT EXISTS sequences (
        type TEXT PRIMARY KEY,
        current_value INTEGER NOT NULL DEFAULT 0,
        base_type TEXT
      )
    `);
    
    // Clear existing sequences first
    await db.getDatabase().runAsync(`DELETE FROM sequences`);
    
    await db.getDatabase().runAsync(`
      INSERT INTO sequences (type, current_value, base_type) VALUES 
      ('issues', 2, 'tasks'),
      ('plans', 1, 'tasks')
    `);
    
    // Set up test data
    await db.getDatabase().runAsync(`
      INSERT INTO items (type, id, title, tags, priority, created_at, updated_at) VALUES 
      ('issues', 1, 'Bug with API', '["bug", "api"]', 'high', datetime('now'), datetime('now')),
      ('issues', 2, 'Feature request', '["feature", "ui"]', 'medium', datetime('now'), datetime('now')),
      ('plans', 1, 'Q1 Roadmap', '["roadmap", "planning"]', 'high', datetime('now'), datetime('now')),
      ('docs', 1, 'API Guide', '["documentation", "api"]', null, datetime('now'), datetime('now')),
      ('knowledge', 1, 'Best Practices', '["best-practices", "development"]', null, datetime('now'), datetime('now'))
    `);
  });

  afterEach(async () => {
    await db.close();
  });

  describe('searchAllByTag', () => {
    it('should find items with specific tag', async () => {
      const results = await searchRepo.searchAllByTag('api');
      
      expect(results.issues).toHaveLength(1);
      expect(results.issues[0].title).toBe('Bug with API');
      expect(results.docs).toHaveLength(1);
      expect(results.docs[0].title).toBe('API Guide');
      expect(results.plans).toHaveLength(0);
    });

    it('should return empty arrays for non-existent tag', async () => {
      const results = await searchRepo.searchAllByTag('nonexistent');
      
      expect(results.issues).toHaveLength(0);
      expect(results.plans).toHaveLength(0);
      expect(results.docs).toHaveLength(0);
      expect(results.knowledge).toHaveLength(0);
    });

    it('should handle special characters in tags', async () => {
      await db.getDatabase().runAsync(`
        INSERT INTO items (type, id, title, tags, priority, created_at, updated_at) VALUES 
        ('issues', 3, 'Special chars', '["test-tag", "test_tag", "test.tag"]', 'low', datetime('now'), datetime('now'))
      `);

      // Update mock to include the new item
      mockTaskRepo.getAllTasks.mockImplementation((type: any) => {
        if (type === 'issues') {
          return Promise.resolve([
            { id: 1, title: 'Bug with API', tags: ['bug', 'api'], priority: 'high' },
            { id: 2, title: 'Feature request', tags: ['feature', 'ui'], priority: 'medium' },
            { id: 3, title: 'Special chars', tags: ['test-tag', 'test_tag', 'test.tag'], priority: 'low' }
          ]);
        } else if (type === 'plans') {
          return Promise.resolve([
            { id: 1, title: 'Q1 Roadmap', tags: ['roadmap', 'planning'], priority: 'high' }
          ]);
        }
        return Promise.resolve([]);
      });

      const results1 = await searchRepo.searchAllByTag('test-tag');
      expect(results1.issues).toHaveLength(1);

      const results2 = await searchRepo.searchAllByTag('test_tag');
      expect(results2.issues).toHaveLength(1);
    });

    it('should be case-sensitive for tags', async () => {
      const resultsLower = await searchRepo.searchAllByTag('api');
      const resultsUpper = await searchRepo.searchAllByTag('API');
      
      expect(resultsLower.issues).toHaveLength(1);
      expect(resultsUpper.issues).toHaveLength(0);
    });
  });

  describe('Performance and edge cases', () => {
    it('should handle large result sets efficiently', async () => {
      // Insert many items
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(db.getDatabase().runAsync(`
          INSERT INTO items (type, id, title, tags, priority, created_at, updated_at) VALUES 
          ('issues', ${i + 10}, 'Issue ${i}', '["performance", "test"]', 'medium', datetime('now'), datetime('now'))
        `));
      }
      await Promise.all(promises);

      // Update mock to return many items
      const manyIssues = Array(100).fill(null).map((_, i) => ({
        id: i + 10,
        title: `Issue ${i}`,
        tags: ['performance', 'test'],
        priority: 'medium'
      }));
      
      mockTaskRepo.getAllTasks.mockImplementation((type: any) => {
        if (type === 'issues') {
          return Promise.resolve([
            { id: 1, title: 'Bug with API', tags: ['bug', 'api'], priority: 'high' },
            { id: 2, title: 'Feature request', tags: ['feature', 'ui'], priority: 'medium' },
            ...manyIssues
          ]);
        } else if (type === 'plans') {
          return Promise.resolve([
            { id: 1, title: 'Q1 Roadmap', tags: ['roadmap', 'planning'], priority: 'high' }
          ]);
        }
        return Promise.resolve([]);
      });

      const start = Date.now();
      const results = await searchRepo.searchAllByTag('performance');
      const duration = Date.now() - start;

      expect(results.issues).toHaveLength(100);
      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });

    it('should handle malformed JSON tags gracefully', async () => {
      // Insert item with malformed tags
      await db.getDatabase().runAsync(`
        INSERT INTO items (type, id, title, tags, priority, created_at, updated_at) VALUES 
        ('issues', 999, 'Malformed', 'not-json', 'low', datetime('now'), datetime('now'))
      `);

      // Should not throw, just exclude malformed items
      const results = await searchRepo.searchAllByTag('test');
      expect(results.issues).toBeDefined();
    });

    it('should handle concurrent searches', async () => {
      const searches = Array(10).fill(null).map((_, i) => 
        searchRepo.searchAllByTag(i % 2 === 0 ? 'api' : 'feature')
      );

      const results = await Promise.all(searches);
      expect(results).toHaveLength(10);
      
      // Verify alternating results
      results.forEach((result, i) => {
        if (i % 2 === 0) {
          expect(result.issues).toHaveLength(1);
          expect(result.issues[0].title).toBe('Bug with API');
        } else {
          expect(result.issues).toHaveLength(1);
          expect(result.issues[0].title).toBe('Feature request');
        }
      });
    });

    it('should handle SQL injection attempts', async () => {
      // Try to inject SQL
      const maliciousTag = "'; DROP TABLE items; --";
      
      // Should handle safely
      const results = await searchRepo.searchAllByTag(maliciousTag);
      expect(results.issues).toHaveLength(0);
      
      // Verify table still exists
      const items = await db.getDatabase().allAsync('SELECT * FROM items');
      expect(items.length).toBeGreaterThan(0);
    });
  });

  describe('Cross-type search functionality', () => {
    it('should group results by base type', async () => {
      const results = await searchRepo.searchAllByTag('api');
      
      // Check structure
      expect(results).toHaveProperty('issues');
      expect(results).toHaveProperty('plans');
      expect(results).toHaveProperty('docs');
      expect(results).toHaveProperty('knowledge');
    });

    it('should include all item fields in results', async () => {
      const results = await searchRepo.searchAllByTag('bug');
      
      const issue = results.issues[0];
      expect(issue).toHaveProperty('id');
      expect(issue).toHaveProperty('title');
      expect(issue).toHaveProperty('tags');
      expect(issue.tags).toContain('bug');
    });

    it('should handle items with multiple matching tags', async () => {
      await db.getDatabase().runAsync(`
        INSERT INTO items (type, id, title, tags, priority, created_at, updated_at) VALUES 
        ('issues', 100, 'Multi-tag', '["api", "bug", "urgent"]', 'high', datetime('now'), datetime('now'))
      `);

      // Update mock to include the multi-tag item
      mockTaskRepo.getAllTasks.mockImplementation((type: any) => {
        if (type === 'issues') {
          return Promise.resolve([
            { id: 1, title: 'Bug with API', tags: ['bug', 'api'], priority: 'high' },
            { id: 2, title: 'Feature request', tags: ['feature', 'ui'], priority: 'medium' },
            { id: 100, title: 'Multi-tag', tags: ['api', 'bug', 'urgent'], priority: 'high' }
          ]);
        } else if (type === 'plans') {
          return Promise.resolve([
            { id: 1, title: 'Q1 Roadmap', tags: ['roadmap', 'planning'], priority: 'high' }
          ]);
        }
        return Promise.resolve([]);
      });

      const results1 = await searchRepo.searchAllByTag('api');
      const results2 = await searchRepo.searchAllByTag('bug');
      const results3 = await searchRepo.searchAllByTag('urgent');

      // Same item should appear in all searches
      expect(results1.issues.find((i: any) => i.id === 100)).toBeTruthy();
      expect(results2.issues.find((i: any) => i.id === 100)).toBeTruthy();
      expect(results3.issues.find((i: any) => i.id === 100)).toBeTruthy();
    });
  });
});