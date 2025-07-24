/**
 * @ai-context Database module re-export for backward compatibility
 * @ai-pattern Barrel export to maintain API stability
 * @ai-critical All database functionality flows through here
 * @ai-migration Allows gradual migration from old to new structure
 * @ai-why Prevents breaking changes in existing code
 */

// @ai-logic: Re-export everything from the new modular structure
export * from './database/index.js';