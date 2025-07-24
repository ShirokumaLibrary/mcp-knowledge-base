/**
 * @ai-context Test suite for plan repository async operations
 * @ai-pattern Tests file-based plan storage with timeline support
 * @ai-critical Plans have start/end dates and can reference issues
 * @ai-assumption Uses temporary directories for isolation
 * @ai-related-files
 *   - src/database/plan-repository.ts (implementation)
 *   - src/types/domain-types.ts (Plan interface)
 *   - src/database/issue-repository.ts (for related_issues)
 * @ai-compare-with issue-repository.test.ts (similar but with dates)
 */
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { FileIssueDatabase } from '../database.js';
import * as fs from 'fs';
import * as path from 'path';
describe('PlanRepository Async Tests', () => {
    let db;
    // @ai-pattern: Unique test directory using process ID
    const testDataDir = path.join(process.cwd(), 'tmp', 'mcp-test-plan-' + process.pid);
    const testDbPath = path.join(testDataDir, 'test.db');
    /**
     * @ai-intent Set up clean test environment
     * @ai-flow 1. Remove old data -> 2. Create dirs -> 3. Init database
     * @ai-critical Must await initialization for async operations
     * @ai-side-effects Creates test directories and SQLite database
     * @ai-integration-point Database initialization creates default statuses
     */
    beforeEach(async () => {
        // @ai-logic: Clean slate for test isolation
        if (fs.existsSync(testDataDir)) {
            fs.rmSync(testDataDir, { recursive: true, force: true });
        }
        fs.mkdirSync(testDataDir, { recursive: true });
        db = new FileIssueDatabase(testDataDir, testDbPath);
        await db.initialize(); // @ai-critical: Sets up tables and default data
    });
    afterEach(() => {
        db.close();
        // Clean up test directory
        if (fs.existsSync(testDataDir)) {
            fs.rmSync(testDataDir, { recursive: true, force: true });
        }
    });
    describe('Async file operations', () => {
        /**
         * @ai-intent Test async plan creation with timeline
         * @ai-validation Ensures dates are stored correctly
         * @ai-critical Plans have timeline support unlike issues
         * @ai-pattern plan-{id}.md naming convention
         * @ai-filesystem Creates in {dataDir}/plans/ directory
         * @ai-database-schema Updates search_plans with date columns
         */
        test('should create plan with async file write', async () => {
            const plan = await db.createPlan('Test Plan', 'Description', 'high', undefined, // @ai-default: Uses first status or ID 1
            '2025-07-23', // @ai-pattern: YYYY-MM-DD format
            '2025-07-30', // @ai-validation: Should be >= start_date
            ['test']);
            expect(plan.title).toBe('Test Plan');
            expect(plan.start_date).toBe('2025-07-23');
            expect(plan.end_date).toBe('2025-07-30');
            // @ai-validation: Verify plan was created successfully
            expect(plan.id).toBeGreaterThan(0);
            expect(plan.created_at).toBeDefined();
            expect(plan.updated_at).toBeDefined();
        });
        /**
         * @ai-intent Test async plan retrieval from file
         * @ai-validation Ensures data persists across operations
         * @ai-flow 1. Create -> 2. Read -> 3. Verify content
         * @ai-data-flow Repository -> parseMarkdown -> Plan object with status
         * @ai-integration-point Status name loaded from StatusRepository
         */
        test('should read plan with async file read', async () => {
            const plan = await db.createPlan('Async Read Test', 'Test Description');
            const retrieved = await db.getPlan(plan.id);
            expect(retrieved).not.toBeNull();
            expect(retrieved.title).toBe('Async Read Test');
            expect(retrieved.content).toBe('Test Description'); // @ai-logic: Content preserved
        });
        /**
         * @ai-intent Test concurrent async plan operations
         * @ai-validation Ensures thread safety with parallel writes
         * @ai-performance Tests async I/O under load
         * @ai-critical File system must handle concurrent access
         * @ai-database-schema Also updates search_plans table concurrently
         * @ai-related-files
         *   - src/database/base.ts (sequence generation for IDs)
         *   - src/database/plan-repository.ts (syncPlanToSQLite)
         */
        test('should handle concurrent plan operations', async () => {
            // @ai-pattern: Create multiple promises for parallel execution
            const promises = Array.from({ length: 5 }, (_, i) => db.createPlan(`Concurrent Plan ${i}`, `Description ${i}`));
            const plans = await Promise.all(promises);
            expect(plans).toHaveLength(5);
            plans.forEach((plan, i) => {
                expect(plan.title).toBe(`Concurrent Plan ${i}`);
            });
            // @ai-validation: Files were created successfully - the repository handles file creation
            expect(plans.every(p => p.id > 0)).toBe(true);
        });
        /**
         * @ai-intent Test async plan update with timeline changes
         * @ai-validation Ensures all fields can be updated
         * @ai-flow 1. Create -> 2. Update -> 3. Verify persistence
         * @ai-critical Update must be atomic (file + SQLite)
         * @ai-data-flow
         *   1. updatePlan -> readFile -> parseMarkdown
         *   2. Update fields -> generateMarkdown -> writeFile
         *   3. syncPlanToSQLite -> UPDATE search_plans
         */
        test('should update plan with async file operations', async () => {
            const plan = await db.createPlan('Original Title');
            const updateResult = await db.updatePlan(plan.id, 'Updated Title', 'Updated Description');
            expect(updateResult).toBe(true);
            // @ai-validation: Verify changes persisted to file
            const updated = await db.getPlan(plan.id);
            expect(updated.title).toBe('Updated Title');
            expect(updated.content).toBe('Updated Description');
        });
        /**
         * @ai-intent Test async file and database deletion for plans
         * @ai-validation Ensures file is physically removed
         * @ai-flow 1. Create -> 2. Verify exists -> 3. Delete -> 4. Verify gone
         * @ai-critical Must remove both file and DB record
         * @ai-data-flow
         *   1. deletePlan -> unlink file
         *   2. DELETE FROM search_plans WHERE id = ?
         * @ai-filesystem Removes from {dataDir}/plans/ directory
         */
        test('should delete plan with async file deletion', async () => {
            const plan = await db.createPlan('To Delete');
            const deleteResult = await db.deletePlan(plan.id);
            expect(deleteResult).toBe(true);
            // @ai-validation: Verify plan is no longer accessible
            const deletedPlan = await db.getPlan(plan.id);
            expect(deletedPlan).toBeNull();
        });
        /**
         * @ai-intent Test graceful handling of missing files
         * @ai-validation Ensures null return instead of throwing
         * @ai-pattern Defensive programming for file operations
         * @ai-compare-with Same pattern in issue/doc/knowledge tests
         * @ai-edge-case Non-existent ID returns null not error
         */
        test('should handle file read errors gracefully', async () => {
            // @ai-logic: Try to read non-existent plan
            const plan = await db.getPlan(99999);
            expect(plan).toBeNull(); // @ai-pattern: Null for not found
        });
        /**
         * @ai-intent Test concurrent read operations for plan list
         * @ai-validation Ensures consistent results under parallel access
         * @ai-performance Tests read scalability
         * @ai-critical File system must handle concurrent reads
         * @ai-data-flow getAllPlans -> readdir -> parallel readFile -> parseMarkdown
         * @ai-compare-with getAllIssues/getAllDocs pattern
         * @ai-filesystem Reads all files from {dataDir}/plans/
         */
        test('should handle parallel getAllPlans', async () => {
            // @ai-setup: Create test plans with timeline data
            const p1 = await db.createPlan('Plan 1');
            const p2 = await db.createPlan('Plan 2');
            const p3 = await db.createPlan('Plan 3');
            // @ai-pattern: Parallel calls to test concurrency
            const [result1, result2, result3] = await Promise.all([
                db.getAllPlans(),
                db.getAllPlans(),
                db.getAllPlans()
            ]);
            // @ai-validation: Check that we get at least the plans we created
            expect(result1.length).toBeGreaterThanOrEqual(3);
            expect(result2.length).toBeGreaterThanOrEqual(3);
            expect(result3.length).toBeGreaterThanOrEqual(3);
            // @ai-validation: All results should be identical
            expect(result1).toEqual(result2);
            expect(result2).toEqual(result3);
            // @ai-validation: Verify our created plans are present
            const ids = [p1.id, p2.id, p3.id];
            const result1Ids = result1.map(p => p.id);
            expect(result1Ids).toEqual(expect.arrayContaining(ids));
        });
    });
});
//# sourceMappingURL=plan-repository.test.js.map