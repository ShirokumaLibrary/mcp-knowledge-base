/**
 * @ai-context Dependency injection container for application
 * @ai-pattern IoC container for managing dependencies
 * @ai-critical Central place for dependency resolution
 * @ai-why Enables testability and loose coupling
 * @ai-assumption All major components registered here
 */

import type { IDatabase } from '../database/interfaces/repository-interfaces.js';
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
} as const;

/**
 * @ai-intent Service registration entry
 * @ai-pattern Stores factory and singleton flag
 */
interface ServiceRegistration<T = any> {
  factory: () => T | Promise<T>;
  singleton: boolean;
  instance?: T;
}

/**
 * @ai-intent Dependency injection container
 * @ai-pattern Simple IoC container with singleton support
 * @ai-critical All services resolved through this container
 */
export class DependencyContainer {
  private static instance: DependencyContainer;
  private services: Map<symbol, ServiceRegistration> = new Map();
  private initializing: Map<symbol, Promise<any>> = new Map();

  /**
   * @ai-intent Private constructor for singleton
   * @ai-pattern Prevents direct instantiation
   */
  private constructor() {
    this.registerDefaultServices();
  }

  /**
   * @ai-intent Get container instance
   * @ai-pattern Singleton accessor
   */
  static getInstance(): DependencyContainer {
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
  private registerDefaultServices(): void {
    // @ai-logic: Register configuration
    this.registerSingleton(ServiceIdentifiers.Config, () => getConfig());

    // @ai-logic: Register data directory
    this.registerSingleton(ServiceIdentifiers.DataDirectory, () => {
      const config = this.resolve<any>(ServiceIdentifiers.Config);
      return config.paths.dataDir;
    });

    // @ai-logic: Register database
    this.registerSingleton(ServiceIdentifiers.Database, async () => {
      const dataDir = this.resolve<string>(ServiceIdentifiers.DataDirectory);
      const _config = this.resolve<any>(ServiceIdentifiers.Config);
      const dbPath = path.join(dataDir, 'search.db');

      const db = new FileIssueDatabase(dataDir, dbPath);
      await db.initialize();

      return db;
    });

    // @ai-logic: Register handler factory
    this.registerSingleton(
      ServiceIdentifiers.HandlerFactory,
      () => HandlerFactory.getInstance()
    );

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
  private registerHandler(identifier: symbol, handlerType: HandlerType): void {
    this.registerSingleton(identifier, async () => {
      const database = await this.resolve<IDatabase>(ServiceIdentifiers.Database);
      const factory = this.resolve<HandlerFactory>(ServiceIdentifiers.HandlerFactory);

      return factory.getHandler(handlerType, database);
    });
  }

  /**
   * @ai-intent Register a service factory
   * @ai-flow Stores factory function for later resolution
   * @ai-pattern Can be singleton or transient
   */
  register<T>(
    identifier: symbol,
    factory: () => T | Promise<T>,
    singleton: boolean = false
  ): void {
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
  registerSingleton<T>(
    identifier: symbol,
    factory: () => T | Promise<T>
  ): void {
    this.register(identifier, factory, true);
  }

  /**
   * @ai-intent Resolve a service
   * @ai-flow 1. Check registration -> 2. Handle singleton -> 3. Create instance
   * @ai-pattern Lazy instantiation with async support
   * @ai-critical Main resolution method
   */
  resolve<T>(identifier: symbol): T {
    const registration = this.services.get(identifier);

    if (!registration) {
      throw new Error(`Service not registered: ${identifier.toString()}`);
    }

    // @ai-logic: Return singleton instance if available
    if (registration.singleton && registration.instance !== undefined) {
      return registration.instance as T;
    }

    // @ai-logic: Check if already initializing (async singleton)
    if (registration.singleton && this.initializing.has(identifier)) {
      throw new Error(
        `Circular dependency or synchronous resolution of async service: ${identifier.toString()}`
      );
    }

    // @ai-logic: Create instance
    const instance = registration.factory();

    // @ai-logic: Handle async factory
    if (instance instanceof Promise) {
      if (registration.singleton) {
        // @ai-critical: Store promise to prevent duplicate initialization
        this.initializing.set(identifier, instance);

        throw new Error(
          `Async service must be resolved with resolveAsync: ${identifier.toString()}`
        );
      }

      throw new Error(
        `Async service must be resolved with resolveAsync: ${identifier.toString()}`
      );
    }

    // @ai-logic: Store singleton instance
    if (registration.singleton) {
      registration.instance = instance;
    }

    return instance as T;
  }

  /**
   * @ai-intent Resolve an async service
   * @ai-flow Handles Promise-returning factories
   * @ai-pattern Async resolution with singleton support
   */
  async resolveAsync<T>(identifier: symbol): Promise<T> {
    const registration = this.services.get(identifier);

    if (!registration) {
      throw new Error(`Service not registered: ${identifier.toString()}`);
    }

    // @ai-logic: Return singleton instance if available
    if (registration.singleton && registration.instance !== undefined) {
      return registration.instance as T;
    }

    // @ai-logic: Check if already initializing
    if (registration.singleton && this.initializing.has(identifier)) {
      return this.initializing.get(identifier) as Promise<T>;
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

      return instance as T;
    } catch (error) {
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
  has(identifier: symbol): boolean {
    return this.services.has(identifier);
  }

  /**
   * @ai-intent Clear all services
   * @ai-flow Removes all registrations and instances
   * @ai-usage For testing isolation
   */
  clear(): void {
    // @ai-logic: Close database if registered
    if (this.has(ServiceIdentifiers.Database)) {
      try {
        const db = this.resolve<IDatabase>(ServiceIdentifiers.Database);
        if (db && typeof db.close === 'function') {
          db.close();
        }
      } catch {
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
  reset(): void {
    this.clear();
    this.registerDefaultServices();
  }

  /**
   * @ai-intent Create scoped container
   * @ai-pattern Child container with fallback to parent
   * @ai-usage For request-scoped dependencies
   */
  createScope(): DependencyContainer {
    // @ai-todo: Implement scoped containers if needed
    throw new Error('Scoped containers not yet implemented');
  }
}