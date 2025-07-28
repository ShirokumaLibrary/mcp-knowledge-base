import { FileIssueDatabase } from '../database/index.js';

export interface TestDatabaseContext {
  db: FileIssueDatabase;
  testDir: string;
  cleanup: () => Promise<void>;
}

export function createTestDatabase(prefix: string): Promise<TestDatabaseContext>;
export function closeAllTestDatabases(): Promise<void>;
export function withTestDatabase(
  prefix: string,
  testFn: (context: TestDatabaseContext) => Promise<void>
): () => Promise<void>;
export function getActiveDatabaseCount(): number;
export function listActiveDatabases(): string[];