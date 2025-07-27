/**
 * @ai-context Central export point for all handlers
 * @ai-pattern Barrel export for clean imports
 * @ai-critical All handlers should be exported here
 * @ai-why Simplifies imports and provides single source of truth
 */

// Base handler
export { BaseHandler, ToolResponse } from './base-handler.js';

// Current handlers
export { StatusHandlers } from './status-handlers.js';
export { TagHandlers } from './tag-handlers.js';
export { ItemHandlers } from './item-handlers.js';
export { SessionHandlers } from './session-handlers.js';
export { SummaryHandlers } from './summary-handlers.js';
export { TypeHandlers } from './type-handlers.js';

// V2 handlers (when ready to switch)
// export { StatusHandlersV2 as StatusHandlers } from './status-handlers-v2.js';
// export { TagHandlersV2 as TagHandlers } from './tag-handlers-v2.js';

/**
 * @ai-intent Handler type definitions
 * @ai-pattern Type exports for TypeScript support
 */
export type { HandlerMethod } from './base-handler.js';