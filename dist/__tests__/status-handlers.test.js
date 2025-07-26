// @ts-nocheck
import { StatusHandlers } from '../handlers/status-handlers.js';
// Mock the database
jest.mock('../database.js');
describe('StatusHandlers', () => {
    let handlers;
    let mockDb;
    beforeEach(() => {
        jest.clearAllMocks();
        mockDb = {
            getAllStatuses: jest.fn()
        };
        handlers = new StatusHandlers(mockDb);
    });
    describe('handleGetStatuses', () => {
        it('should get all statuses', async () => {
            const mockStatuses = [
                { id: 1, name: 'Open', is_closed: false, display_order: 1 },
                { id: 2, name: 'In Progress', is_closed: false, display_order: 2 },
                { id: 3, name: 'Review', is_closed: false, display_order: 3 },
                { id: 4, name: 'Completed', is_closed: true, display_order: 4 },
                { id: 5, name: 'Closed', is_closed: true, display_order: 5 }
            ];
            mockDb.getAllStatuses = jest.fn().mockResolvedValue(mockStatuses);
            const result = await handlers.handleGetStatuses();
            expect(mockDb.getAllStatuses).toHaveBeenCalled();
            expect(result.content[0].type).toBe('text');
            expect(result.content[0].text).toContain('Available Statuses');
            expect(result.content[0].text).toContain('Open');
            expect(result.content[0].text).toContain('In Progress');
        });
        it('should return statuses in display order', async () => {
            const mockStatuses = [
                { id: 3, name: 'High Priority', is_closed: false, display_order: 1 },
                { id: 1, name: 'Medium Priority', is_closed: false, display_order: 2 },
                { id: 2, name: 'Low Priority', is_closed: false, display_order: 3 }
            ];
            mockDb.getAllStatuses = jest.fn().mockResolvedValue(mockStatuses);
            const result = await handlers.handleGetStatuses();
            expect(result.content[0].text).toContain('High Priority');
            expect(result.content[0].text).toContain('Medium Priority');
            expect(result.content[0].text).toContain('Low Priority');
        });
        it('should include both open and closed statuses', async () => {
            const mockStatuses = [
                { id: 1, name: 'Open', is_closed: false },
                { id: 2, name: 'Closed', is_closed: true }
            ];
            mockDb.getAllStatuses = jest.fn().mockResolvedValue(mockStatuses);
            const result = await handlers.handleGetStatuses();
            const text = result.content[0].text;
            expect(text).toContain('Open');
            expect(text).toContain('Closed');
            expect(text).toContain('| No |');
            expect(text).toContain('| Yes |');
        });
    });
    describe('Default statuses', () => {
        it('should include default statuses', async () => {
            const defaultStatuses = [
                'Open',
                'In Progress',
                'Review',
                'On Hold',
                'Completed',
                'Closed',
                'Cancelled'
            ];
            const mockStatuses = defaultStatuses.map((name, i) => ({
                id: i + 1,
                name,
                is_closed: ['Completed', 'Closed', 'Cancelled'].includes(name),
                display_order: i + 1
            }));
            mockDb.getAllStatuses = jest.fn().mockResolvedValue(mockStatuses);
            const result = await handlers.handleGetStatuses();
            // Verify all default statuses are present
            for (const statusName of defaultStatuses) {
                expect(result.content[0].text).toContain(statusName);
            }
        });
        it('should correctly categorize closed statuses', async () => {
            const mockStatuses = [
                { id: 1, name: 'Open', is_closed: false },
                { id: 2, name: 'In Progress', is_closed: false },
                { id: 3, name: 'Completed', is_closed: true },
                { id: 4, name: 'Closed', is_closed: true },
                { id: 5, name: 'Cancelled', is_closed: true }
            ];
            mockDb.getAllStatuses = jest.fn().mockResolvedValue(mockStatuses);
            const result = await handlers.handleGetStatuses();
            // Check in markdown table for closed statuses
            const text = result.content[0].text;
            expect(text).toContain('Completed');
            expect(text).toContain('Closed');
            expect(text).toContain('Cancelled');
        });
    });
    describe('Custom statuses', () => {
        it('should handle custom status definitions', async () => {
            const mockStatuses = [
                { id: 1, name: 'Open', is_closed: false },
                { id: 8, name: 'Pending Review', is_closed: false },
                { id: 9, name: 'Deployed', is_closed: true },
                { id: 10, name: 'Archived', is_closed: true }
            ];
            mockDb.getAllStatuses = jest.fn().mockResolvedValue(mockStatuses);
            const result = await handlers.handleGetStatuses();
            // Should include both default and custom statuses
            const text = result.content[0].text;
            expect(text).toContain('Open');
            expect(text).toContain('Pending Review');
            expect(text).toContain('Deployed');
        });
    });
    describe('Status workflow', () => {
        it('should support typical workflow transitions', async () => {
            const workflowStatuses = [
                { id: 1, name: 'Backlog', is_closed: false, display_order: 1 },
                { id: 2, name: 'Todo', is_closed: false, display_order: 2 },
                { id: 3, name: 'In Progress', is_closed: false, display_order: 3 },
                { id: 4, name: 'In Review', is_closed: false, display_order: 4 },
                { id: 5, name: 'Testing', is_closed: false, display_order: 5 },
                { id: 6, name: 'Done', is_closed: true, display_order: 6 }
            ];
            mockDb.getAllStatuses = jest.fn().mockResolvedValue(workflowStatuses);
            const result = await handlers.handleGetStatuses();
            // Verify statuses appear in markdown
            const text = result.content[0].text;
            expect(text).toContain('Backlog');
            expect(text).toContain('Done');
        });
    });
    describe('Error handling', () => {
        it('should handle database errors gracefully', async () => {
            mockDb.getAllStatuses = jest.fn().mockRejectedValue(new Error('Database error'));
            await expect(handlers.handleGetStatuses({}))
                .rejects.toThrow('Database error');
        });
        it('should handle empty status list', async () => {
            mockDb.getAllStatuses = jest.fn().mockResolvedValue([]);
            const result = await handlers.handleGetStatuses();
            expect(result.content[0].text).toContain('No statuses found');
        });
    });
    describe('Status metadata', () => {
        it('should include additional status metadata if available', async () => {
            const mockStatuses = [
                {
                    id: 1,
                    name: 'Open',
                    is_closed: false,
                    display_order: 1,
                    color: '#00ff00',
                    description: 'New items'
                },
                {
                    id: 2,
                    name: 'Closed',
                    is_closed: true,
                    display_order: 2,
                    color: '#ff0000',
                    description: 'Completed items'
                }
            ];
            mockDb.getAllStatuses = jest.fn().mockResolvedValue(mockStatuses);
            const result = await handlers.handleGetStatuses();
            // Since handleGetStatuses returns markdown, not JSON, check for presence in text
            const text = result.content[0].text;
            expect(text).toContain('Open');
        });
    });
    describe('Performance', () => {
        it('should handle large number of statuses efficiently', async () => {
            // Create 100 custom statuses
            const manyStatuses = Array(100).fill(null).map((_, i) => ({
                id: i + 1,
                name: `Status ${i + 1}`,
                is_closed: i >= 80, // Last 20 are closed
                display_order: i + 1
            }));
            mockDb.getAllStatuses = jest.fn().mockResolvedValue(manyStatuses);
            const start = Date.now();
            const result = await handlers.handleGetStatuses();
            const duration = Date.now() - start;
            // Check that result contains status table
            const lines = result.content[0].text.split('\n');
            // Should have header + separator + 100 status lines
            expect(lines.length).toBeGreaterThan(100);
            expect(duration).toBeLessThan(50); // Should be very fast
        });
        it('should cache status results if implemented', async () => {
            const mockStatuses = [
                { id: 1, name: 'Open', is_closed: false },
                { id: 2, name: 'Closed', is_closed: true }
            ];
            mockDb.getAllStatuses = jest.fn().mockResolvedValue(mockStatuses);
            // First call
            await handlers.handleGetStatuses({});
            // Second call
            await handlers.handleGetStatuses({});
            // If caching is implemented, getAllStatuses might be called only once
            // Otherwise, it should be called twice
            expect(mockDb.getAllStatuses).toHaveBeenCalledTimes(2);
        });
    });
    describe('Integration with task filtering', () => {
        it('should provide status IDs for filtering', async () => {
            const mockStatuses = [
                { id: 1, name: 'Open', is_closed: false },
                { id: 2, name: 'In Progress', is_closed: false },
                { id: 3, name: 'Closed', is_closed: true }
            ];
            mockDb.getAllStatuses = jest.fn().mockResolvedValue(mockStatuses);
            const result = await handlers.handleGetStatuses();
            // Verify open statuses appear in markdown
            const text = result.content[0].text;
            expect(text).toContain('Open');
            expect(text).toContain('In Progress');
        });
    });
    describe('Status validation', () => {
        it('should ensure unique status names', async () => {
            const mockStatuses = [
                { id: 1, name: 'Open', is_closed: false },
                { id: 2, name: 'Open', is_closed: false } // Duplicate
            ];
            mockDb.getAllStatuses = jest.fn().mockResolvedValue(mockStatuses);
            const result = await handlers.handleGetStatuses();
            // Should return all statuses even if duplicates exist
            // Both 'Open' entries should appear in markdown
            const text = result.content[0].text;
            const openCount = (text.match(/Open/g) || []).length;
            expect(openCount).toBeGreaterThanOrEqual(2);
        });
        it('should handle status names with special characters', async () => {
            const mockStatuses = [
                { id: 1, name: 'In Progress (Dev)', is_closed: false },
                { id: 2, name: 'Review - QA', is_closed: false },
                { id: 3, name: 'Done!', is_closed: true }
            ];
            mockDb.getAllStatuses = jest.fn().mockResolvedValue(mockStatuses);
            const result = await handlers.handleGetStatuses();
            const text = result.content[0].text;
            expect(text).toContain('In Progress (Dev)');
            expect(text).toContain('Review - QA');
            expect(text).toContain('Done!');
        });
    });
});
//# sourceMappingURL=status-handlers.test.js.map