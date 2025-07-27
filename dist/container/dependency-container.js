/**
 * @ai-context Dependency injection container for application
 * @ai-pattern IoC container for managing dependencies
 * @ai-critical Central place for dependency resolution
 * @ai-why Enables testability and loose coupling
 * @ai-assumption All major components registered here
 */
import { FileIssueDatabase } from '../database/index.js';
import { HandlerFactory, HandlerType } from '../factories/handler-factory.js';
import { getConfig } from '../config.js';
import * as path from 'path';
/**
 * @ai-intent Service identifier types
 * @ai-pattern Type-safe service keys
 */
export const ServiceIdentifiers = {
    Database: Symbol.for('Database'),
    SQLiteConnection: Symbol.for('SQLiteConnection'),
    Config: Symbol.for('Config'),
    DataDirectory: Symbol.for('DataDirectory'),
    HandlerFactory: Symbol.for('HandlerFactory'),
    // Handlers
    StatusHandler: Symbol.for('StatusHandler'),
    TagHandler: Symbol.for('TagHandler'),
    ItemHandler: Symbol.for('ItemHandler'),
    SessionHandler: Symbol.for('SessionHandler'),
    SummaryHandler: Symbol.for('SummaryHandler'),
    TypeHandler: Symbol.for('TypeHandler')
};
/**
 * @ai-intent Dependency injection container
 * @ai-pattern Simple IoC container with singleton support
 * @ai-critical All services resolved through this container
 */
export class DependencyContainer {
    static instance;
    services = new Map();
    initializing = new Map();
    /**
     * @ai-intent Private constructor for singleton
     * @ai-pattern Prevents direct instantiation
     */
    constructor() {
        this.registerDefaultServices();
    }
    /**
     * @ai-intent Get container instance
     * @ai-pattern Singleton accessor
     */
    static getInstance() {
        if (!DependencyContainer.instance) {
            DependencyContainer.instance = new DependencyContainer();
        }
        return DependencyContainer.instance;
    }
    /**
     * @ai-intent Register default services
     * @ai-flow Called once during container initialization
     * @ai-pattern Sets up core application dependencies
     */
    registerDefaultServices() {
        // @ai-logic: Register configuration
        this.registerSingleton(ServiceIdentifiers.Config, () => getConfig());
        // @ai-logic: Register data directory
        this.registerSingleton(ServiceIdentifiers.DataDirectory, () => {
            const config = this.resolve(ServiceIdentifiers.Config);
            return config.paths.dataDir;
        });
        // @ai-logic: Register database
        this.registerSingleton(ServiceIdentifiers.Database, async () => {
            const dataDir = this.resolve(ServiceIdentifiers.DataDirectory);
            const _config = this.resolve(ServiceIdentifiers.Config);
            const dbPath = path.join(dataDir, 'search.db');
            const db = new FileIssueDatabase(dataDir, dbPath);
            await db.initialize();
            return db;
        });
        // @ai-logic: Register handler factory
        this.registerSingleton(ServiceIdentifiers.HandlerFactory, () => HandlerFactory.getInstance());
        // @ai-logic: Register individual handlers
        this.registerHandler(ServiceIdentifiers.StatusHandler, HandlerType.Status);
        this.registerHandler(ServiceIdentifiers.TagHandler, HandlerType.Tag);
        this.registerHandler(ServiceIdentifiers.ItemHandler, HandlerType.Item);
        this.registerHandler(ServiceIdentifiers.SessionHandler, HandlerType.Session);
        this.registerHandler(ServiceIdentifiers.SummaryHandler, HandlerType.Summary);
        this.registerHandler(ServiceIdentifiers.TypeHandler, HandlerType.Type);
    }
    /**
     * @ai-intent Register a handler service
     * @ai-pattern Delegates to HandlerFactory
     * @ai-flow Gets database and factory, then creates handler
     */
    registerHandler(identifier, handlerType) {
        this.registerSingleton(identifier, async () => {
            const database = await this.resolve(ServiceIdentifiers.Database);
            const factory = this.resolve(ServiceIdentifiers.HandlerFactory);
            return factory.getHandler(handlerType, database);
        });
    }
    /**
     * @ai-intent Register a service factory
     * @ai-flow Stores factory function for later resolution
     * @ai-pattern Can be singleton or transient
     */
    register(identifier, factory, singleton = false) {
        this.services.set(identifier, {
            factory,
            singleton,
            instance: undefined
        });
    }
    /**
     * @ai-intent Register a singleton service
     * @ai-pattern Convenience method for singleton registration
     * @ai-usage Most services are singletons
     */
    registerSingleton(identifier, factory) {
        this.register(identifier, factory, true);
    }
    /**
     * @ai-intent Resolve a service
     * @ai-flow 1. Check registration -> 2. Handle singleton -> 3. Create instance
     * @ai-pattern Lazy instantiation with async support
     * @ai-critical Main resolution method
     */
    resolve(identifier) {
        const registration = this.services.get(identifier);
        if (!registration) {
            throw new Error(`Service not registered: ${identifier.toString()}`);
        }
        // @ai-logic: Return singleton instance if available
        if (registration.singleton && registration.instance !== undefined) {
            return registration.instance;
        }
        // @ai-logic: Check if already initializing (async singleton)
        if (registration.singleton && this.initializing.has(identifier)) {
            throw new Error(`Circular dependency or synchronous resolution of async service: ${identifier.toString()}`);
        }
        // @ai-logic: Create instance
        const instance = registration.factory();
        // @ai-logic: Handle async factory
        if (instance instanceof Promise) {
            if (registration.singleton) {
                // @ai-critical: Store promise to prevent duplicate initialization
                this.initializing.set(identifier, instance);
                throw new Error(`Async service must be resolved with resolveAsync: ${identifier.toString()}`);
            }
            throw new Error(`Async service must be resolved with resolveAsync: ${identifier.toString()}`);
        }
        // @ai-logic: Store singleton instance
        if (registration.singleton) {
            registration.instance = instance;
        }
        return instance;
    }
    /**
     * @ai-intent Resolve an async service
     * @ai-flow Handles Promise-returning factories
     * @ai-pattern Async resolution with singleton support
     */
    async resolveAsync(identifier) {
        const registration = this.services.get(identifier);
        if (!registration) {
            throw new Error(`Service not registered: ${identifier.toString()}`);
        }
        // @ai-logic: Return singleton instance if available
        if (registration.singleton && registration.instance !== undefined) {
            return registration.instance;
        }
        // @ai-logic: Check if already initializing
        if (registration.singleton && this.initializing.has(identifier)) {
            return this.initializing.get(identifier);
        }
        // @ai-logic: Create instance
        const instancePromise = Promise.resolve(registration.factory());
        // @ai-logic: Track initialization for singletons
        if (registration.singleton) {
            this.initializing.set(identifier, instancePromise);
        }
        try {
            const instance = await instancePromise;
            // @ai-logic: Store singleton instance
            if (registration.singleton) {
                registration.instance = instance;
                this.initializing.delete(identifier);
            }
            return instance;
        }
        catch (error) {
            // @ai-logic: Clean up on error
            if (registration.singleton) {
                this.initializing.delete(identifier);
            }
            throw error;
        }
    }
    /**
     * @ai-intent Check if service is registered
     * @ai-pattern Service existence check
     */
    has(identifier) {
        return this.services.has(identifier);
    }
    /**
     * @ai-intent Clear all services
     * @ai-flow Removes all registrations and instances
     * @ai-usage For testing isolation
     */
    clear() {
        // @ai-logic: Close database if registered
        if (this.has(ServiceIdentifiers.Database)) {
            try {
                const db = this.resolve(ServiceIdentifiers.Database);
                if (db && typeof db.close === 'function') {
                    db.close();
                }
            }
            catch {
                // Ignore errors during cleanup
            }
        }
        this.services.clear();
        this.initializing.clear();
    }
    /**
     * @ai-intent Reset container to default state
     * @ai-flow Clears and re-registers defaults
     * @ai-usage For testing or reset scenarios
     */
    reset() {
        this.clear();
        this.registerDefaultServices();
    }
    /**
     * @ai-intent Create scoped container
     * @ai-pattern Child container with fallback to parent
     * @ai-usage For request-scoped dependencies
     */
    createScope() {
        // @ai-todo: Implement scoped containers if needed
        throw new Error('Scoped containers not yet implemented');
    }
}
//# sourceMappingURL=dependency-container.js.map