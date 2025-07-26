import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

/**
 * Create a test directory with optional data retention
 */
export function createTestDir(prefix: string): string {
  const keepData = process.env.KEEP_TEST_DATA === 'true';
  const timestamp = keepData ? new Date().toISOString().replace(/[:.]/g, '-') : process.pid.toString();
  
  // Use environment variable or default to process.cwd()/tmp
  const testBaseDir = process.env.TEST_DATA_DIR || path.join(process.cwd(), 'tmp');
  return path.join(testBaseDir, `${prefix}-${timestamp}`);
}

/**
 * Clean up test directory unless KEEP_TEST_DATA is set
 */
export async function cleanupTestDir(dir: string): Promise<void> {
  if (process.env.KEEP_TEST_DATA === 'true') {
    console.log(`Test data kept in: ${dir}`);
  } else {
    try {
      await fs.rm(dir, { recursive: true });
    } catch {
      // Ignore errors during cleanup
    }
  }
}

/**
 * Get test data retention status
 */
export function isKeepingTestData(): boolean {
  return process.env.KEEP_TEST_DATA === 'true';
}