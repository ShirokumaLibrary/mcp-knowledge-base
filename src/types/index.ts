/**
 * @ai-context Central export point for all types
 * @ai-pattern Barrel export for type definitions
 * @ai-critical All shared types should be exported here
 * @ai-why Single source of truth for type imports
 */

// Domain types
export * from './domain-types.js';
export * from './session-types.js';
export * from './complete-domain-types.js';

// API types
export * from './api-types.js';

// MCP types - export specific items to avoid conflicts
export {
  ToolHandler
} from './mcp-types.js';

// Type guards - export specific items to avoid conflicts
export {
  isPriority,
  isBaseType,
  isStatus,
  isIssue,
  isPlan,
  isDocument,
  isWorkSession,
  isDailySummary,
  isTag,
  isValidDateString,
  isValidSessionId,
  isISODateString,
  isArrayOf,
  isStringArray,
  isNumberArray,
  assertType,
  isDefined
} from './type-guards.js';

/**
 * @ai-intent Re-export commonly used types
 * @ai-pattern Convenience exports
 */
export type {
  Status,
  Issue,
  Plan,
  Document,
  Tag
} from './domain-types.js';

export type {
  WorkSession,
  DailySummary
} from './session-types.js';

export type {
  Priority,
  BaseType,
  ContentType,
  TypeDefinition,
  TagWithCount,
  SearchResult,
  GlobalSearchResults
} from './complete-domain-types.js';

// ToolResponse is already exported from api-types.js above