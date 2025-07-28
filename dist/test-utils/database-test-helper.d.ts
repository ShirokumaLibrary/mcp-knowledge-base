/**
 * @ai-context Test helper for proper database lifecycle management
 * @ai-pattern Factory pattern for test database instances
 * @ai-critical Ensures proper cleanup to prevent "Database handle is closed" errors
 */
import { FileIssueDatabase } from '../database/index.js';
export interface TestDatabaseContext {
    db: FileIssueDatabase;
    testDir: string;
    cleanup: () => Promise<void>;
}
/**
 * @ai-intent Create a test database with automatic cleanup
 * @ai-flow 1. Create unique temp dir -> 2. Initialize DB -> 3. Track instance -> 4. Return context
 * @ai-why Centralizes database creation and ensures cleanup
 */
export declare function createTestDatabase(prefix: string): Promise<TestDatabaseContext>;
/**
 * @ai-intent Ensure all databases are closed (for global cleanup)
 * @ai-critical Call this in global afterAll hook
 */
export declare function closeAllTestDatabases(): Promise<void>;
/**
 * @ai-intent Create a test context that automatically cleans up
 * @ai-pattern RAII pattern - cleanup on scope exit
 */
export declare function withTestDatabase(prefix: string, testFn: (context: TestDatabaseContext) => Promise<void>): () => Promise<void>;
/**
 * @ai-intent Get count of active databases for debugging
 */
export declare function getActiveDatabaseCount(): number;
/**
 * @ai-intent List active databases for debugging
 */
export declare function listActiveDatabases(): string[];
