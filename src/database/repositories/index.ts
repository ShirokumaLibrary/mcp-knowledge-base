/**
 * @ai-context Central export point for all repositories
 * @ai-pattern Barrel export for clean imports
 * @ai-critical All repositories should be exported here
 * @ai-why Simplifies imports and provides single source of truth
 */

// Base repository
export { BaseRepository } from '../base-repository.js';

// Current repositories
export { StatusRepository } from '../status-repository.js';
export { TagRepository } from '../tag-repository.js';
// TaskRepository and DocumentRepository removed - use ItemRepository instead
export { SearchRepository } from '../search-repository.js';
export { TypeRepository } from '../type-repository.js';

// V2 repositories (when ready to switch)
// export { StatusRepositoryV2 as StatusRepository } from '../status-repository-v2.js';
// export { TagRepositoryV2 as TagRepository } from '../tag-repository-v2.js';

// Repository interfaces
export * from '../interfaces/repository-interfaces.js';

/**
 * @ai-intent Repository type definitions
 * @ai-pattern Type exports for TypeScript support
 */
export type {
  BaseEntity,
  QueryOptions
} from '../base-repository.js';