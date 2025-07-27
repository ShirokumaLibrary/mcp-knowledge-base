/**
 * @ai-context Dependency injection container for application
 * @ai-pattern IoC container for managing dependencies
 * @ai-critical Central place for dependency resolution
 * @ai-why Enables testability and loose coupling
 * @ai-assumption All major components registered here
 */
/**
 * @ai-intent Service identifier types
 * @ai-pattern Type-safe service keys
 */
export declare const ServiceIdentifiers: {
    readonly Database: symbol;
    readonly SQLiteConnection: symbol;
    readonly Config: symbol;
    readonly DataDirectory: symbol;
    readonly HandlerFactory: symbol;
    readonly StatusHandler: symbol;
    readonly TagHandler: symbol;
    readonly ItemHandler: symbol;
    readonly SessionHandler: symbol;
    readonly SummaryHandler: symbol;
    readonly TypeHandler: symbol;
};
/**
 * @ai-intent Dependency injection container
 * @ai-pattern Simple IoC container with singleton support
 * @ai-critical All services resolved through this container
 */
export declare class DependencyContainer {
    private static instance;
    private services;
    private initializing;
    /**
     * @ai-intent Private constructor for singleton
     * @ai-pattern Prevents direct instantiation
     */
    private constructor();
    /**
     * @ai-intent Get container instance
     * @ai-pattern Singleton accessor
     */
    static getInstance(): DependencyContainer;
    /**
     * @ai-intent Register default services
     * @ai-flow Called once during container initialization
     * @ai-pattern Sets up core application dependencies
     */
    private registerDefaultServices;
    /**
     * @ai-intent Register a handler service
     * @ai-pattern Delegates to HandlerFactory
     * @ai-flow Gets database and factory, then creates handler
     */
    private registerHandler;
    /**
     * @ai-intent Register a service factory
     * @ai-flow Stores factory function for later resolution
     * @ai-pattern Can be singleton or transient
     */
    register<T>(identifier: symbol, factory: () => T | Promise<T>, singleton?: boolean): void;
    /**
     * @ai-intent Register a singleton service
     * @ai-pattern Convenience method for singleton registration
     * @ai-usage Most services are singletons
     */
    registerSingleton<T>(identifier: symbol, factory: () => T | Promise<T>): void;
    /**
     * @ai-intent Resolve a service
     * @ai-flow 1. Check registration -> 2. Handle singleton -> 3. Create instance
     * @ai-pattern Lazy instantiation with async support
     * @ai-critical Main resolution method
     */
    resolve<T>(identifier: symbol): T;
    /**
     * @ai-intent Resolve an async service
     * @ai-flow Handles Promise-returning factories
     * @ai-pattern Async resolution with singleton support
     */
    resolveAsync<T>(identifier: symbol): Promise<T>;
    /**
     * @ai-intent Check if service is registered
     * @ai-pattern Service existence check
     */
    has(identifier: symbol): boolean;
    /**
     * @ai-intent Clear all services
     * @ai-flow Removes all registrations and instances
     * @ai-usage For testing isolation
     */
    clear(): void;
    /**
     * @ai-intent Reset container to default state
     * @ai-flow Clears and re-registers defaults
     * @ai-usage For testing or reset scenarios
     */
    reset(): void;
    /**
     * @ai-intent Create scoped container
     * @ai-pattern Child container with fallback to parent
     * @ai-usage For request-scoped dependencies
     */
    createScope(): DependencyContainer;
}
