/**
 * @ai-context Simple mock helper utilities
 * @ai-pattern Simplified mock creation without complex typing
 * @ai-critical Use for testing without type complexities
 */
import { jest } from '@jest/globals';
/**
 * @ai-intent Create a simple mock function
 * @ai-pattern Returns jest.fn() with any type
 */
export const mockFn = () => jest.fn();
/**
 * @ai-intent Create mock with resolved value
 * @ai-pattern Returns mock that resolves to value
 */
export const mockResolvedValue = (value) => {
    const fn = jest.fn();
    fn.mockResolvedValue(value);
    return fn;
};
/**
 * @ai-intent Create mock with rejected value
 * @ai-pattern Returns mock that rejects with error
 */
export const mockRejectedValue = (error) => {
    const fn = jest.fn();
    fn.mockRejectedValue(error);
    return fn;
};
/**
 * @ai-intent Create mock with return value
 * @ai-pattern Returns mock that returns value
 */
export const mockReturnValue = (value) => {
    const fn = jest.fn();
    fn.mockReturnValue(value);
    return fn;
};
/**
 * @ai-intent Create mock with implementation
 * @ai-pattern Returns mock with custom implementation
 */
export const mockImplementation = (impl) => {
    const fn = jest.fn();
    fn.mockImplementation(impl);
    return fn;
};
/**
 * @ai-intent Create simple mock database
 * @ai-pattern Minimal database mock for testing
 */
export function createSimpleMockDatabase() {
    return {
        statusRepository: {
            getAll: mockResolvedValue([]),
            getById: mockResolvedValue(null),
            getByName: mockResolvedValue(null),
            create: mockResolvedValue({ id: 1, name: 'Test', is_closed: false }),
            update: mockResolvedValue(true),
            delete: mockResolvedValue(true),
            isInUse: mockResolvedValue(false)
        },
        tagRepository: {
            getAll: mockResolvedValue([]),
            create: mockResolvedValue('new-tag'),
            delete: mockResolvedValue(true),
            search: mockResolvedValue([])
        },
        issueRepository: {},
        planRepository: {},
        documentRepository: {},
        sessionRepository: {},
        summaryRepository: {},
        typeManager: {},
        // Core methods
        initialize: mockResolvedValue(undefined),
        close: mockFn(),
        validateSchema: mockResolvedValue(true),
        rebuildSearchIndex: mockResolvedValue(undefined),
        runMigrations: mockResolvedValue(undefined),
        getVersion: mockReturnValue('1.0.0'),
        isInitialized: mockReturnValue(true),
        getDatabase: mockReturnValue({
            getAsync: mockImplementation(async (query, params) => {
                // Mock for isValidType check
                if (query.includes('SELECT type FROM sequences WHERE type = ?')) {
                    const validTypes = ['issues', 'plans', 'docs', 'knowledge'];
                    return validTypes.includes(params[0]) ? { type: params[0] } : null;
                }
                // Mock for isTypeOfBase check
                if (query.includes('SELECT base_type FROM sequences WHERE type = ?')) {
                    const taskTypes = ['issues', 'plans'];
                    const documentTypes = ['docs', 'knowledge'];
                    if (taskTypes.includes(params[0]))
                        return { base_type: 'tasks' };
                    if (documentTypes.includes(params[0]))
                        return { base_type: 'documents' };
                    return null;
                }
                return null;
            }),
            allAsync: mockResolvedValue([
                { type: 'issues' },
                { type: 'plans' },
                { type: 'docs' },
                { type: 'knowledge' }
            ])
        }),
        // Transaction support
        transaction: mockImplementation(async (fn) => fn()),
        // Search functionality
        search: mockResolvedValue([]),
        searchByTag: mockResolvedValue([]),
        // Type management
        getTypes: mockResolvedValue({
            tasks: ['issues', 'plans'],
            documents: ['docs', 'knowledge']
        }),
        createType: mockResolvedValue(true),
        deleteType: mockResolvedValue(true),
        // Item operations
        getItemsByType: mockResolvedValue([]),
        getItemDetail: mockResolvedValue(null),
        createItem: mockResolvedValue(null),
        updateItem: mockResolvedValue(null),
        deleteItem: mockResolvedValue(false),
        searchItemsByTag: mockResolvedValue([]),
        // Utility methods
        getStats: mockResolvedValue({
            issues: 0,
            plans: 0,
            documents: 0,
            tags: 0
        }),
        // Document methods
        getAllDocumentsSummary: mockResolvedValue([]),
        getDocument: mockResolvedValue(null),
        createDocument: mockResolvedValue(null),
        updateDocument: mockResolvedValue(false),
        deleteDocument: mockResolvedValue(false),
        searchDocumentsByTag: mockResolvedValue([]),
        // Task methods
        getIssue: mockResolvedValue(null),
        getPlan: mockResolvedValue(null),
        createIssue: mockResolvedValue(null),
        createPlan: mockResolvedValue(null),
        updateIssue: mockResolvedValue(false),
        updatePlan: mockResolvedValue(false),
        deleteIssue: mockResolvedValue(false),
        deletePlan: mockResolvedValue(false),
        searchIssuesByTag: mockResolvedValue([]),
        searchPlansByTag: mockResolvedValue([]),
        getAllTasksSummary: mockResolvedValue([]),
        getTask: mockResolvedValue(null),
        createTask: mockResolvedValue(null),
        updateTask: mockResolvedValue(null),
        deleteTask: mockResolvedValue(false),
        searchTasksByTag: mockResolvedValue([])
    };
}
/**
 * @ai-intent Create mock handler context
 * @ai-pattern Provides database and logger mocks
 */
export function createMockHandlerContext() {
    const mockDatabase = createSimpleMockDatabase();
    const mockLogger = {
        debug: mockFn(),
        info: mockFn(),
        warn: mockFn(),
        error: mockFn()
    };
    return {
        database: mockDatabase,
        logger: mockLogger
    };
}
/**
 * @ai-intent Create mock with specific methods
 * @ai-pattern Partial mock creation
 */
export function createPartialMock(methods) {
    return methods;
}
/**
 * @ai-intent Create mock repository
 * @ai-pattern Repository pattern mock
 */
export function createMockRepository(overrides = {}) {
    const baseMock = {
        getAll: mockResolvedValue([]),
        getById: mockResolvedValue(null),
        create: mockResolvedValue(null),
        update: mockResolvedValue(true),
        delete: mockResolvedValue(true),
        search: mockResolvedValue([])
    };
    return { ...baseMock, ...overrides };
}
/**
 * @ai-intent Mock validation schemas
 * @ai-pattern Schema validation mocks
 */
export const mockSchemas = {
    parseSuccess: (data) => ({
        parse: mockReturnValue(data),
        parseAsync: mockResolvedValue(data),
        safeParse: mockReturnValue({ success: true, data }),
        safeParseAsync: mockResolvedValue({ success: true, data })
    }),
    parseError: (error) => ({
        parse: mockImplementation(() => { throw error; }),
        parseAsync: mockRejectedValue(error),
        safeParse: mockReturnValue({ success: false, error }),
        safeParseAsync: mockResolvedValue({ success: false, error })
    })
};
/**
 * @ai-intent Reset all mocks
 * @ai-pattern Clean test state
 */
export function resetAllMocks(...mocks) {
    mocks.forEach(mock => {
        if (mock && typeof mock === 'object') {
            Object.values(mock).forEach(value => {
                if (value && typeof value === 'object' && 'mockReset' in value && typeof value.mockReset === 'function') {
                    value.mockReset();
                }
            });
        }
    });
}
//# sourceMappingURL=mock-helpers.js.map