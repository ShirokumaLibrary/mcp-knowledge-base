import { createTestDatabase } from '../test-utils/database-test-helper.js';
describe('Full-text Search', () => {
    let context;
    let db;
    let searchRepo;
    let itemRepo;
    beforeEach(async () => {
        context = await createTestDatabase('fulltext-search');
        db = context.db;
        searchRepo = db.getFullTextSearchRepository();
        itemRepo = db.getItemRepository();
    });
    afterEach(async () => {
        await context.cleanup();
    });
    describe('search()', () => {
        beforeEach(async () => {
            // Create test data
            const testItems = [
                {
                    type: 'issues',
                    title: 'Authentication System Bug Fix',
                    content: 'The login authentication is broken and needs immediate attention',
                    priority: 'high',
                    status: 'Open',
                    tags: ['bug', 'authentication', 'urgent']
                },
                {
                    type: 'docs',
                    title: 'API Authentication Guide',
                    content: 'This guide explains how to implement OAuth2 authentication in our API',
                    priority: 'medium',
                    status: 'Open',
                    tags: ['documentation', 'api', 'authentication']
                },
                {
                    type: 'knowledge',
                    title: 'Security Best Practices',
                    content: 'Always use HTTPS and implement proper authentication mechanisms',
                    priority: 'medium',
                    status: 'Open',
                    tags: ['security', 'best-practices']
                },
                {
                    type: 'plans',
                    title: 'Q1 2025 Development Roadmap',
                    content: 'Planning for new features including improved search functionality',
                    priority: 'high',
                    status: 'Open',
                    tags: ['roadmap', 'planning']
                }
            ];
            for (const item of testItems) {
                await itemRepo.createItem(item);
            }
        });
        test('should find items by keyword in title', async () => {
            const results = await searchRepo.search('authentication');
            expect(results.length).toBe(3); // 3 items contain "authentication"
            // Check that at least 2 have "Authentication" in the title
            const titlesWithAuth = results.filter(r => r.title.includes('Authentication'));
            expect(titlesWithAuth.length).toBeGreaterThanOrEqual(2);
        });
        test('should find items by keyword in content', async () => {
            const results = await searchRepo.search('OAuth2');
            expect(results.length).toBe(1);
            expect(results[0].type).toBe('docs');
            expect(results[0].title).toBe('API Authentication Guide');
        });
        test('should return snippet with highlighted matches', async () => {
            const results = await searchRepo.search('authentication');
            expect(results[0].snippet).toContain('<mark>');
            expect(results[0].snippet).toContain('</mark>');
            expect(results[0].snippet).toContain('authentication');
        });
        test('should filter by types', async () => {
            const results = await searchRepo.search('authentication', {
                types: ['docs']
            });
            expect(results.length).toBe(1);
            expect(results[0].type).toBe('docs');
        });
        test('should support pagination', async () => {
            // Search for a different term that will give us predictable results
            // Create specific items for this test
            await itemRepo.createItem({
                type: 'docs',
                title: 'Pagination Test Doc 1',
                content: 'This document contains the word pagination',
                priority: 'medium',
                status: 'Open'
            });
            await itemRepo.createItem({
                type: 'docs',
                title: 'Pagination Test Doc 2',
                content: 'This also has pagination in the content',
                priority: 'medium',
                status: 'Open'
            });
            await itemRepo.createItem({
                type: 'docs',
                title: 'Pagination Test Doc 3',
                content: 'Another pagination document for testing',
                priority: 'medium',
                status: 'Open'
            });
            // Now test pagination with this specific term
            const page1 = await searchRepo.search('pagination', {
                limit: 2,
                offset: 0
            });
            const page2 = await searchRepo.search('pagination', {
                limit: 2,
                offset: 2
            });
            expect(page1.length).toBe(2);
            expect(page2.length).toBeGreaterThanOrEqual(1);
            // Check that pages have different items
            const page1Ids = page1.map(r => r.id);
            const page2Ids = page2.map(r => r.id);
            const hasOverlap = page1Ids.some(id => page2Ids.includes(id));
            expect(hasOverlap).toBe(false);
        });
        test('should handle Japanese text', async () => {
            const item = await itemRepo.createItem({
                type: 'knowledge',
                title: '日本語のドキュメント',
                content: 'これは認証システムに関する日本語の説明です',
                priority: 'medium',
                status: 'Open',
                tags: ['日本語', 'ドキュメント']
            });
            // First check if the item was created
            const createdItem = await itemRepo.getItem('knowledge', item.id);
            expect(createdItem).toBeTruthy();
            expect(createdItem?.title).toBe('日本語のドキュメント');
            // Try searching for a simpler term or the full word
            const results1 = await searchRepo.search('日本語');
            const results2 = await searchRepo.search('認証システム');
            // At least one search should work
            const hasResults = results1.length > 0 || results2.length > 0;
            expect(hasResults).toBe(true);
            if (results1.length > 0) {
                expect(results1.some(r => r.title === '日本語のドキュメント')).toBe(true);
            }
        });
        test('should return empty array for no matches', async () => {
            const results = await searchRepo.search('nonexistentterm');
            expect(results).toEqual([]);
        });
        test('should handle special characters', async () => {
            const results = await searchRepo.search('Q1 2025');
            expect(results.length).toBe(1);
            expect(results[0].title).toBe('Q1 2025 Development Roadmap');
        });
    });
    describe('suggest()', () => {
        beforeEach(async () => {
            // Create test data
            await itemRepo.createItem({
                type: 'issues',
                title: 'Authentication System Bug',
                content: 'Bug in auth',
                priority: 'high',
                status: 'Open'
            });
            await itemRepo.createItem({
                type: 'docs',
                title: 'Authorization Guide',
                content: 'How to authorize',
                priority: 'medium',
                status: 'Open'
            });
            await itemRepo.createItem({
                type: 'knowledge',
                title: 'Automatic Deployment Setup',
                content: 'CI/CD automation',
                priority: 'low',
                status: 'Open'
            });
        });
        test('should return suggestions for partial query', async () => {
            const suggestions = await searchRepo.suggest('auth');
            expect(suggestions.length).toBe(2);
            expect(suggestions).toContain('Authentication System Bug');
            expect(suggestions).toContain('Authorization Guide');
        });
        test('should limit suggestions', async () => {
            const suggestions = await searchRepo.suggest('a', {
                limit: 2
            });
            expect(suggestions.length).toBeLessThanOrEqual(2);
        });
        test('should filter suggestions by type', async () => {
            const suggestions = await searchRepo.suggest('auth', {
                types: ['docs']
            });
            expect(suggestions.length).toBe(1);
            expect(suggestions[0]).toBe('Authorization Guide');
        });
        test('should return empty array for no matches', async () => {
            const suggestions = await searchRepo.suggest('xyz');
            expect(suggestions).toEqual([]);
        });
    });
    describe('count()', () => {
        beforeEach(async () => {
            // Create multiple items
            for (let i = 1; i <= 5; i++) {
                await itemRepo.createItem({
                    type: 'issues',
                    title: `Issue ${i} - Authentication Problem`,
                    content: 'Details about authentication',
                    priority: 'medium',
                    status: 'Open'
                });
            }
            for (let i = 1; i <= 3; i++) {
                await itemRepo.createItem({
                    type: 'docs',
                    title: `Document ${i}`,
                    content: 'Some content',
                    priority: 'low',
                    status: 'Open'
                });
            }
        });
        test('should count total search results', async () => {
            const count = await searchRepo.count('authentication');
            expect(count).toBe(5);
        });
        test('should count results filtered by type', async () => {
            const count = await searchRepo.count('authentication', {
                types: ['issues']
            });
            expect(count).toBe(5);
        });
        test('should return 0 for no matches', async () => {
            const count = await searchRepo.count('nonexistent');
            expect(count).toBe(0);
        });
    });
    describe('FTS synchronization', () => {
        test('should sync new items to FTS', async () => {
            const item = await itemRepo.createItem({
                type: 'issues',
                title: 'New Searchable Issue',
                content: 'This should be findable',
                priority: 'high',
                status: 'Open'
            });
            const results = await searchRepo.search('searchable');
            expect(results.length).toBe(1);
            expect(results[0].id).toBe(item.id);
        });
        test('should update FTS on item update', async () => {
            const item = await itemRepo.createItem({
                type: 'issues',
                title: 'Original Title',
                content: 'Original content',
                priority: 'medium',
                status: 'Open'
            });
            await itemRepo.updateItem({
                type: 'issues',
                id: item.id,
                title: 'Updated Searchable Title'
            });
            const oldResults = await searchRepo.search('original title');
            const newResults = await searchRepo.search('searchable');
            expect(oldResults.length).toBe(0); // Should not find old title
            expect(newResults.length).toBe(1);
            expect(newResults[0].title).toBe('Updated Searchable Title');
        });
        test('should remove from FTS on item deletion', async () => {
            const item = await itemRepo.createItem({
                type: 'issues',
                title: 'Temporary Issue',
                content: 'Will be deleted',
                priority: 'low',
                status: 'Open'
            });
            const beforeDelete = await searchRepo.search('temporary');
            expect(beforeDelete.length).toBe(1);
            await itemRepo.deleteItem(item.type, item.id);
            const afterDelete = await searchRepo.search('temporary');
            expect(afterDelete.length).toBe(0);
        });
    });
});
//# sourceMappingURL=fulltext-search.test.js.map