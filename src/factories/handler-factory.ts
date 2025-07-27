/**
 * @ai-context Factory for creating MCP tool handlers
 * @ai-pattern Factory pattern for handler instantiation
 * @ai-critical Central place for handler creation and configuration
 * @ai-why Enables easy handler swapping and testing
 * @ai-assumption All handlers follow constructor(database) pattern
 */

import { IDatabase } from '../database/interfaces/repository-interfaces.js';
import { BaseHandler } from '../handlers/base-handler.js';

// Handler imports
import { StatusHandlers } from '../handlers/status-handlers.js';
import { TagHandlers } from '../handlers/tag-handlers.js';
import { ItemHandlers } from '../handlers/item-handlers.js';
import { SessionHandlers } from '../handlers/session-handlers.js';
import { SummaryHandlers } from '../handlers/summary-handlers.js';
import { TypeHandlers } from '../handlers/type-handlers.js';

// V2 handler imports (when available)
// import { StatusHandlersV2 } from '../handlers/status-handlers-v2.js';
// import { TagHandlersV2 } from '../handlers/tag-handlers-v2.js';

/**
 * @ai-intent Handler type enumeration
 * @ai-pattern Type-safe handler identification
 */
export enum HandlerType {
  Status = 'status',
  Tag = 'tag',
  Item = 'item',
  Session = 'session',
  Summary = 'summary',
  Type = 'type'
}

/**
 * @ai-intent Handler registration entry
 * @ai-pattern Maps handler type to implementation
 */
interface HandlerRegistration {
  type: HandlerType;
  constructor: new (database: any) => any;  // @ai-todo: Fix when all handlers use IDatabase
  useV2?: boolean;  // @ai-logic: Flag to use V2 implementation
}

/**
 * @ai-intent Factory for creating tool handlers
 * @ai-pattern Singleton factory with registration
 * @ai-critical All handlers created through this factory
 */
export class HandlerFactory {
  private static instance: HandlerFactory;
  private registrations: Map<HandlerType, HandlerRegistration> = new Map();
  private handlers: Map<HandlerType, any> = new Map();

  /**
   * @ai-intent Private constructor for singleton
   * @ai-pattern Prevents direct instantiation
   */
  private constructor() {
    this.registerDefaultHandlers();
  }

  /**
   * @ai-intent Get factory instance
   * @ai-pattern Singleton accessor
   */
  static getInstance(): HandlerFactory {
    if (!HandlerFactory.instance) {
      HandlerFactory.instance = new HandlerFactory();
    }
    return HandlerFactory.instance;
  }

  /**
   * @ai-intent Register default handler implementations
   * @ai-flow Called once during factory initialization
   * @ai-pattern Default registration can be overridden
   */
  private registerDefaultHandlers(): void {
    // @ai-logic: Register current handlers
    this.register(HandlerType.Status, StatusHandlers);
    this.register(HandlerType.Tag, TagHandlers);
    this.register(HandlerType.Item, ItemHandlers);
    this.register(HandlerType.Session, SessionHandlers);
    this.register(HandlerType.Summary, SummaryHandlers);
    this.register(HandlerType.Type, TypeHandlers);

    // @ai-todo: Switch to V2 handlers when ready
    // this.register(HandlerType.Status, StatusHandlersV2, true);
    // this.register(HandlerType.Tag, TagHandlersV2, true);
  }

  /**
   * @ai-intent Register a handler implementation
   * @ai-flow Stores constructor for later instantiation
   * @ai-pattern Allows runtime handler swapping
   */
  register(
    type: HandlerType,
    handlerClass: new (database: any) => any,  // @ai-todo: Fix when all handlers use IDatabase
    useV2: boolean = false
  ): void {
    this.registrations.set(type, {
      type,
      constructor: handlerClass,
      useV2
    });

    // @ai-logic: Clear cached instance to force recreation
    this.handlers.delete(type);
  }

  /**
   * @ai-intent Create or get cached handler instance
   * @ai-flow 1. Check cache -> 2. Create if needed -> 3. Cache and return
   * @ai-pattern Lazy instantiation with caching
   * @ai-critical All handlers share same database instance
   */
  getHandler<T = any>(type: HandlerType, database: any): T {  // @ai-todo: Fix when all handlers use IDatabase
    // @ai-logic: Return cached instance if available
    if (this.handlers.has(type)) {
      return this.handlers.get(type) as T;
    }

    // @ai-logic: Get registration
    const registration = this.registrations.get(type);
    if (!registration) {
      throw new Error(`No handler registered for type: ${type}`);
    }

    // @ai-logic: Create new instance
    const handler = new registration.constructor(database);

    // @ai-logic: Initialize if supported
    if (handler.initialize && typeof handler.initialize === 'function') {
      // @ai-todo: Handle async initialization
      handler.initialize().catch((error: Error) => {
        console.error(`Failed to initialize handler ${type}:`, error);
      });
    }

    // @ai-logic: Cache and return
    this.handlers.set(type, handler);
    return handler as T;
  }

  /**
   * @ai-intent Get all registered handlers
   * @ai-flow Creates all handlers with given database
   * @ai-usage For bulk operations or testing
   */
  getAllHandlers(database: any): Map<HandlerType, any> {  // @ai-todo: Fix when all handlers use IDatabase
    const allHandlers = new Map<HandlerType, any>();

    for (const type of this.registrations.keys()) {
      allHandlers.set(type, this.getHandler(type, database));
    }

    return allHandlers;
  }

  /**
   * @ai-intent Clear all cached handlers
   * @ai-flow Removes all cached instances
   * @ai-usage For testing or reset scenarios
   */
  clearCache(): void {
    this.handlers.clear();
  }

  /**
   * @ai-intent Reset factory to default state
   * @ai-flow Clears cache and re-registers defaults
   * @ai-usage For testing isolation
   */
  reset(): void {
    this.clearCache();
    this.registrations.clear();
    this.registerDefaultHandlers();
  }

  /**
   * @ai-intent Check if handler is registered
   * @ai-pattern Type checking before creation
   */
  hasHandler(type: HandlerType): boolean {
    return this.registrations.has(type);
  }

  /**
   * @ai-intent Get handler registration info
   * @ai-pattern Introspection for debugging
   */
  getRegistration(type: HandlerType): HandlerRegistration | undefined {
    return this.registrations.get(type);
  }
}