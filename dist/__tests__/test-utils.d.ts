/**
 * Create a test directory with optional data retention
 */
export declare function createTestDir(prefix: string): string;
/**
 * Clean up test directory unless KEEP_TEST_DATA is set
 */
export declare function cleanupTestDir(dir: string): Promise<void>;
/**
 * Get test data retention status
 */
export declare function isKeepingTestData(): boolean;
