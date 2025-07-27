/**
 * @ai-context Simple mock helper utilities
 * @ai-pattern Simplified mock creation without complex typing
 * @ai-critical Use for testing without type complexities
 */
/**
 * @ai-intent Create a simple mock function
 * @ai-pattern Returns jest.fn() with any type
 */
export declare const mockFn: () => any;
/**
 * @ai-intent Create mock with resolved value
 * @ai-pattern Returns mock that resolves to value
 */
export declare const mockResolvedValue: (value: any) => any;
/**
 * @ai-intent Create mock with rejected value
 * @ai-pattern Returns mock that rejects with error
 */
export declare const mockRejectedValue: (error: any) => any;
/**
 * @ai-intent Create mock with return value
 * @ai-pattern Returns mock that returns value
 */
export declare const mockReturnValue: (value: any) => any;
/**
 * @ai-intent Create mock with implementation
 * @ai-pattern Returns mock with custom implementation
 */
export declare const mockImplementation: (impl: (...args: any[]) => any) => any;
/**
 * @ai-intent Create simple mock database
 * @ai-pattern Minimal database mock for testing
 */
export declare function createSimpleMockDatabase(): {
    statusRepository: {
        getAll: any;
        getById: any;
        getByName: any;
        create: any;
        update: any;
        delete: any;
        isInUse: any;
    };
    tagRepository: {
        getAll: any;
        create: any;
        delete: any;
        search: any;
    };
    issueRepository: {};
    planRepository: {};
    documentRepository: {};
    sessionRepository: {};
    summaryRepository: {};
    typeManager: {};
    initialize: any;
    close: any;
    validateSchema: any;
    rebuildSearchIndex: any;
    runMigrations: any;
    getVersion: any;
    isInitialized: any;
    getDatabase: any;
    transaction: any;
    search: any;
    searchByTag: any;
    getTypes: any;
    createType: any;
    deleteType: any;
    getItemsByType: any;
    getItemDetail: any;
    createItem: any;
    updateItem: any;
    deleteItem: any;
    searchItemsByTag: any;
    getStats: any;
    getAllDocumentsSummary: any;
    getDocument: any;
    createDocument: any;
    updateDocument: any;
    deleteDocument: any;
    searchDocumentsByTag: any;
    getIssue: any;
    getPlan: any;
    createIssue: any;
    createPlan: any;
    updateIssue: any;
    updatePlan: any;
    deleteIssue: any;
    deletePlan: any;
    searchIssuesByTag: any;
    searchPlansByTag: any;
    getAllTasksSummary: any;
    getTask: any;
    createTask: any;
    updateTask: any;
    deleteTask: any;
    searchTasksByTag: any;
};
/**
 * @ai-intent Create mock handler context
 * @ai-pattern Provides database and logger mocks
 */
export declare function createMockHandlerContext(): {
    database: {
        statusRepository: {
            getAll: any;
            getById: any;
            getByName: any;
            create: any;
            update: any;
            delete: any;
            isInUse: any;
        };
        tagRepository: {
            getAll: any;
            create: any;
            delete: any;
            search: any;
        };
        issueRepository: {};
        planRepository: {};
        documentRepository: {};
        sessionRepository: {};
        summaryRepository: {};
        typeManager: {};
        initialize: any;
        close: any;
        validateSchema: any;
        rebuildSearchIndex: any;
        runMigrations: any;
        getVersion: any;
        isInitialized: any;
        getDatabase: any;
        transaction: any;
        search: any;
        searchByTag: any;
        getTypes: any;
        createType: any;
        deleteType: any;
        getItemsByType: any;
        getItemDetail: any;
        createItem: any;
        updateItem: any;
        deleteItem: any;
        searchItemsByTag: any;
        getStats: any;
        getAllDocumentsSummary: any;
        getDocument: any;
        createDocument: any;
        updateDocument: any;
        deleteDocument: any;
        searchDocumentsByTag: any;
        getIssue: any;
        getPlan: any;
        createIssue: any;
        createPlan: any;
        updateIssue: any;
        updatePlan: any;
        deleteIssue: any;
        deletePlan: any;
        searchIssuesByTag: any;
        searchPlansByTag: any;
        getAllTasksSummary: any;
        getTask: any;
        createTask: any;
        updateTask: any;
        deleteTask: any;
        searchTasksByTag: any;
    };
    logger: {
        debug: any;
        info: any;
        warn: any;
        error: any;
    };
};
/**
 * @ai-intent Create mock with specific methods
 * @ai-pattern Partial mock creation
 */
export declare function createPartialMock<T>(methods: Partial<T>): T;
/**
 * @ai-intent Create mock repository
 * @ai-pattern Repository pattern mock
 */
export declare function createMockRepository<T>(overrides?: Partial<T>): any;
/**
 * @ai-intent Mock validation schemas
 * @ai-pattern Schema validation mocks
 */
export declare const mockSchemas: {
    parseSuccess: (data: any) => {
        parse: any;
        parseAsync: any;
        safeParse: any;
        safeParseAsync: any;
    };
    parseError: (error: any) => {
        parse: any;
        parseAsync: any;
        safeParse: any;
        safeParseAsync: any;
    };
};
/**
 * @ai-intent Reset all mocks
 * @ai-pattern Clean test state
 */
export declare function resetAllMocks(...mocks: any[]): void;
