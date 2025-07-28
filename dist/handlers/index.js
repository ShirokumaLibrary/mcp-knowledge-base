/**
 * @ai-context Central export point for all handlers
 * @ai-pattern Barrel export for clean imports
 * @ai-critical All handlers should be exported here
 * @ai-why Simplifies imports and provides single source of truth
 */
// Base handler
export { BaseHandler } from './base-handler.js';
// Current handlers
export { StatusHandlers } from './status-handlers.js';
export { TagHandlers } from './tag-handlers.js';
// ItemHandlers removed - use unified-handlers instead
export { SessionHandlers } from './session-handlers.js';
export { SummaryHandlers } from './summary-handlers.js';
export { TypeHandlers } from './type-handlers.js';
//# sourceMappingURL=index.js.map