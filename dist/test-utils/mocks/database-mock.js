/**
 * @ai-context Mock implementations for database interfaces
 * @ai-pattern Test doubles for isolated unit testing
 * @ai-critical Ensures tests don't depend on real database
 */
import { jest } from '@jest/globals';
/**
 * @ai-intent Create mock database with all repositories
 * @ai-pattern Factory function for test database
 */
export function createMockDatabase() {
    const mockDb = {
        // Core repositories
        statusRepository: createMockStatusRepository(),
        tagRepository: createMockTagRepository(),
        issueRepository: {},
        planRepository: {},
        documentRepository: {},
        sessionRepository: {},
        summaryRepository: {},
        typeManager: {},
        // Core methods
        initialize: jest.fn().mockResolvedValue(undefined),
        close: jest.fn(),
        validateSchema: jest.fn().mockResolvedValue(true),
        rebuildSearchIndex: jest.fn().mockResolvedValue(undefined),
        runMigrations: jest.fn().mockResolvedValue(undefined),
        getVersion: jest.fn().mockReturnValue('1.0.0'),
        isInitialized: jest.fn().mockReturnValue(true),
        // Transaction support
        transaction: jest.fn().mockImplementation(async (fn) => fn()),
        // Search functionality
        search: jest.fn().mockResolvedValue([]),
        searchByTag: jest.fn().mockResolvedValue([]),
        // Type management
        getTypes: jest.fn().mockResolvedValue({
            tasks: ['issues', 'plans'],
            documents: ['docs', 'knowledge']
        }),
        createType: jest.fn().mockResolvedValue(true),
        deleteType: jest.fn().mockResolvedValue(true),
        // Utility methods
        getStats: jest.fn().mockResolvedValue({
            issues: 0,
            plans: 0,
            documents: 0,
            tags: 0
        })
    };
    return mockDb;
}
/**
 * @ai-intent Create mock status repository
 * @ai-pattern Stub implementation for status operations
 */
export function createMockStatusRepository() {
    const defaultStatuses = [
        { id: 1, name: 'Open', is_closed: false },
        { id: 2, name: 'In Progress', is_closed: false },
        { id: 3, name: 'Done', is_closed: true }
    ];
    return {
        getAll: jest.fn().mockResolvedValue(defaultStatuses),
        getById: jest.fn().mockImplementation(async (id) => defaultStatuses.find(s => s.id === id) || null),
        getByName: jest.fn().mockImplementation(async (name) => defaultStatuses.find(s => s.name === name) || null),
        create: jest.fn().mockResolvedValue({ id: 4, name: 'New Status', is_closed: false }),
        update: jest.fn().mockResolvedValue(true),
        delete: jest.fn().mockResolvedValue(true),
        isInUse: jest.fn().mockResolvedValue(false),
        getOpenStatuses: jest.fn().mockResolvedValue(defaultStatuses.filter(s => !s.is_closed)),
        getClosedStatuses: jest.fn().mockResolvedValue(defaultStatuses.filter(s => s.is_closed))
    };
}
/**
 * @ai-intent Create mock tag repository
 * @ai-pattern Stub implementation for tag operations
 */
export function createMockTagRepository() {
    const mockTags = ['bug', 'feature', 'documentation'];
    return {
        getAll: jest.fn().mockResolvedValue(mockTags),
        create: jest.fn().mockResolvedValue('new-tag'),
        delete: jest.fn().mockResolvedValue(true),
        rename: jest.fn().mockResolvedValue(true),
        search: jest.fn().mockImplementation(async (pattern) => mockTags.filter(tag => tag.includes(pattern))),
        getUsageCount: jest.fn().mockResolvedValue(5),
        getUnusedTags: jest.fn().mockResolvedValue([]),
        bulkCreate: jest.fn().mockResolvedValue(['tag1', 'tag2']),
        bulkDelete: jest.fn().mockResolvedValue(2),
        ensureExists: jest.fn().mockImplementation(async (tag) => tag)
    };
}
/**
 * @ai-intent Create mock repository with CRUD operations
 * @ai-pattern Generic mock for entity repositories
 */
export function createMockRepository(entityName, defaultItems = []) {
    const items = [...defaultItems];
    let nextId = Math.max(0, ...items.map(i => i.id)) + 1;
    return {
        getAll: jest.fn().mockResolvedValue(items),
        getById: jest.fn().mockImplementation(async (id) => items.find(item => item.id === id) || null),
        create: jest.fn().mockImplementation(async (data) => {
            const newItem = { ...data, id: nextId++ };
            items.push(newItem);
            return newItem;
        }),
        update: jest.fn().mockImplementation(async (id, data) => {
            const index = items.findIndex(item => item.id === id);
            if (index >= 0) {
                items[index] = { ...items[index], ...data };
                return true;
            }
            return false;
        }),
        delete: jest.fn().mockImplementation(async (id) => {
            const index = items.findIndex(item => item.id === id);
            if (index >= 0) {
                items.splice(index, 1);
                return true;
            }
            return false;
        }),
        search: jest.fn().mockResolvedValue(items),
        count: jest.fn().mockResolvedValue(items.length),
        exists: jest.fn().mockImplementation(async (id) => items.some(item => item.id === id))
    };
}
/**
 * @ai-intent Create mock logger
 * @ai-pattern Test logger that doesn't output
 */
export function createMockLogger() {
    return {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        verbose: jest.fn(),
        silly: jest.fn(),
        log: jest.fn()
    };
}
/**
 * @ai-intent Create spy on existing object methods
 * @ai-pattern Wrapper for partial mocking
 */
export function spyOnMethods(obj, methods) {
    const spied = { ...obj };
    methods.forEach(method => {
        if (typeof obj[method] === 'function') {
            spied[method] = jest.fn(obj[method]);
        }
    });
    return spied;
}
/**
 * @ai-intent Reset all mock functions
 * @ai-pattern Clean state between tests
 */
export function resetAllMocks(mocks) {
    mocks.forEach(mock => {
        if (mock && typeof mock === 'object') {
            Object.values(mock).forEach(value => {
                if (typeof value === 'function' && 'mockReset' in value) {
                    value.mockReset();
                }
            });
        }
    });
}
//# sourceMappingURL=database-mock.js.map