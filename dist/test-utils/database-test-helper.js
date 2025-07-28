/**
 * @ai-context Test helper for proper database lifecycle management
 * @ai-pattern Factory pattern for test database instances
 * @ai-critical Ensures proper cleanup to prevent "Database handle is closed" errors
 */
import { FileIssueDatabase } from '../database/index.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
// Track all active database instances with more detail
const activeDatabases = new Map();
let dbCounter = 0;
/**
 * @ai-intent Create a test database with automatic cleanup
 * @ai-flow 1. Create unique temp dir -> 2. Initialize DB -> 3. Track instance -> 4. Return context
 * @ai-why Centralizes database creation and ensures cleanup
 */
export async function createTestDatabase(prefix) {
    // Create unique test directory with better naming
    const dbId = `${prefix}-${process.pid}-${++dbCounter}-${Date.now()}`;
    const testDir = path.join(os.tmpdir(), dbId);
    const dbPath = path.join(testDir, 'test.db');
    // Ensure directory exists
    await fs.promises.mkdir(testDir, { recursive: true });
    // Create and initialize database
    const db = new FileIssueDatabase(testDir, dbPath);
    await db.initialize();
    // Track this instance with more detail
    activeDatabases.set(dbId, { db, testDir, id: dbId });
    // Create cleanup function
    const cleanup = async () => {
        try {
            // Remove from tracking first
            activeDatabases.delete(dbId);
            // Close database connection
            await db.close();
            // Small delay to ensure database is fully closed
            await new Promise(resolve => setTimeout(resolve, 10));
            // Clean up directory unless keeping test data
            if (process.env.KEEP_TEST_DATA !== 'true') {
                await fs.promises.rm(testDir, { recursive: true, force: true }).catch(() => { });
            }
            else {
                console.log(`Test data kept in: ${testDir}`);
            }
        }
        catch (error) {
            // Log but don't throw - cleanup should be best effort
            console.error(`Cleanup error for ${dbId}:`, error);
        }
    };
    return { db, testDir, cleanup };
}
/**
 * @ai-intent Ensure all databases are closed (for global cleanup)
 * @ai-critical Call this in global afterAll hook
 */
export async function closeAllTestDatabases() {
    if (activeDatabases.size === 0)
        return;
    const closePromises = Array.from(activeDatabases.values()).map(async (tracker) => {
        try {
            console.log(`Closing orphaned database: ${tracker.id}`);
            await tracker.db.close();
            // Clean up directory
            if (process.env.KEEP_TEST_DATA !== 'true') {
                await fs.promises.rm(tracker.testDir, { recursive: true, force: true }).catch(() => { });
            }
        }
        catch (error) {
            console.error(`Error closing database ${tracker.id}:`, error);
        }
    });
    await Promise.all(closePromises);
    activeDatabases.clear();
    dbCounter = 0;
}
/**
 * @ai-intent Create a test context that automatically cleans up
 * @ai-pattern RAII pattern - cleanup on scope exit
 */
export function withTestDatabase(prefix, testFn) {
    return async () => {
        const context = await createTestDatabase(prefix);
        try {
            await testFn(context);
        }
        finally {
            await context.cleanup();
        }
    };
}
/**
 * @ai-intent Get count of active databases for debugging
 */
export function getActiveDatabaseCount() {
    return activeDatabases.size;
}
/**
 * @ai-intent List active databases for debugging
 */
export function listActiveDatabases() {
    return Array.from(activeDatabases.keys());
}
//# sourceMappingURL=database-test-helper.js.map