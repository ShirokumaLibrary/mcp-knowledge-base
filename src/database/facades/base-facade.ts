/**
 * @ai-context Base facade for repository pattern abstraction
 * @ai-pattern Facade pattern to simplify repository interactions
 * @ai-critical Ensures repositories are initialized before use
 * @ai-dependencies StatusRepository and TagRepository for shared functionality
 * @ai-why Reduces boilerplate and ensures consistent initialization
 */

import { DatabaseConnection } from '../base.js';
import { StatusRepository } from '../status-repository.js';
import { TagRepository } from '../tag-repository.js';

export abstract class BaseFacade {
  protected statusRepo: StatusRepository;  // @ai-logic: Shared status management
  protected tagRepo: TagRepository;        // @ai-logic: Shared tag management

  constructor(
    protected connection: DatabaseConnection,
    statusRepo: StatusRepository,
    tagRepo: TagRepository
  ) {
    this.statusRepo = statusRepo;
    this.tagRepo = tagRepo;
  }

  /**
   * @ai-intent Ensure async initialization completes before operations
   * @ai-flow 1. Check if init promise exists -> 2. Await if needed
   * @ai-critical Prevents race conditions with async repository setup
   * @ai-pattern Deferred initialization pattern
   * @ai-why Some repositories need async setup (directory creation)
   */
  protected async ensureInitialized(initPromise: Promise<void> | null): Promise<void> {
    if (initPromise) {
      await initPromise;
    }
  }
}