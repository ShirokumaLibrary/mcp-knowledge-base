/**
 * @ai-context Factory for creating MCP tool handlers
 * @ai-pattern Factory pattern for handler instantiation
 * @ai-critical Central place for handler creation and configuration
 * @ai-why Enables easy handler swapping and testing
 * @ai-assumption All handlers follow constructor(database) pattern
 */
/**
 * @ai-intent Handler type enumeration
 * @ai-pattern Type-safe handler identification
 */
export declare enum HandlerType {
    Status = "status",
    Tag = "tag",
    Item = "item",
    Session = "session",
    Summary = "summary",
    Type = "type"
}
/**
 * @ai-intent Handler registration entry
 * @ai-pattern Maps handler type to implementation
 */
interface HandlerRegistration {
    type: HandlerType;
    constructor: new (database: any) => any;
    useV2?: boolean;
}
/**
 * @ai-intent Factory for creating tool handlers
 * @ai-pattern Singleton factory with registration
 * @ai-critical All handlers created through this factory
 */
export declare class HandlerFactory {
    private static instance;
    private registrations;
    private handlers;
    /**
     * @ai-intent Private constructor for singleton
     * @ai-pattern Prevents direct instantiation
     */
    private constructor();
    /**
     * @ai-intent Get factory instance
     * @ai-pattern Singleton accessor
     */
    static getInstance(): HandlerFactory;
    /**
     * @ai-intent Register default handler implementations
     * @ai-flow Called once during factory initialization
     * @ai-pattern Default registration can be overridden
     */
    private registerDefaultHandlers;
    /**
     * @ai-intent Register a handler implementation
     * @ai-flow Stores constructor for later instantiation
     * @ai-pattern Allows runtime handler swapping
     */
    register(type: HandlerType, handlerClass: new (database: any) => any, // @ai-todo: Fix when all handlers use IDatabase
    useV2?: boolean): void;
    /**
     * @ai-intent Create or get cached handler instance
     * @ai-flow 1. Check cache -> 2. Create if needed -> 3. Cache and return
     * @ai-pattern Lazy instantiation with caching
     * @ai-critical All handlers share same database instance
     */
    getHandler<T = any>(type: HandlerType, database: any): T;
    /**
     * @ai-intent Get all registered handlers
     * @ai-flow Creates all handlers with given database
     * @ai-usage For bulk operations or testing
     */
    getAllHandlers(database: any): Map<HandlerType, any>;
    /**
     * @ai-intent Clear all cached handlers
     * @ai-flow Removes all cached instances
     * @ai-usage For testing or reset scenarios
     */
    clearCache(): void;
    /**
     * @ai-intent Reset factory to default state
     * @ai-flow Clears cache and re-registers defaults
     * @ai-usage For testing isolation
     */
    reset(): void;
    /**
     * @ai-intent Check if handler is registered
     * @ai-pattern Type checking before creation
     */
    hasHandler(type: HandlerType): boolean;
    /**
     * @ai-intent Get handler registration info
     * @ai-pattern Introspection for debugging
     */
    getRegistration(type: HandlerType): HandlerRegistration | undefined;
}
export {};
