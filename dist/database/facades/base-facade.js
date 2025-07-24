/**
 * @ai-context Base facade for repository pattern abstraction
 * @ai-pattern Facade pattern to simplify repository interactions
 * @ai-critical Ensures repositories are initialized before use
 * @ai-dependencies StatusRepository and TagRepository for shared functionality
 * @ai-why Reduces boilerplate and ensures consistent initialization
 */
export class BaseFacade {
    connection;
    statusRepo; // @ai-logic: Shared status management
    tagRepo; // @ai-logic: Shared tag management
    constructor(connection, statusRepo, tagRepo) {
        this.connection = connection;
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
    async ensureInitialized(initPromise) {
        if (initPromise) {
            await initPromise;
        }
    }
}
//# sourceMappingURL=base-facade.js.map