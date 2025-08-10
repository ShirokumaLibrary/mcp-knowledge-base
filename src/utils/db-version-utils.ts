import type { Database } from '../database/base.js';
import type winston from 'winston';

// Database schema version - increment ONLY when schema changes that require rebuild
// This is independent from package.json version
// Format: major.minor.patch where:
//   major: breaking schema changes requiring full rebuild
//   minor: backward compatible schema additions  
//   patch: bug fixes that don't change schema
// 
// IMPORTANT: Do NOT increment for regular code changes or bug fixes
// Only increment when database structure changes (tables, columns, indexes)
export const DB_SCHEMA_VERSION = '0.7.15';

// Allow override via environment variable for testing/migration
const SCHEMA_VERSION = process.env.MCP_SCHEMA_VERSION || DB_SCHEMA_VERSION;

export class VersionMismatchError extends Error {
  public readonly programVersion: string;
  public readonly dbVersion: string;

  constructor(params: { programVersion: string; dbVersion: string; message?: string }) {
    const message = params.message ||
      `Database version (${params.dbVersion}) does not match program version (${params.programVersion}).\n` +
      'Please rebuild the database using: shirokuma-mcp-knowledge-base-rebuild';
    super(message);
    this.name = 'VersionMismatchError';
    this.programVersion = params.programVersion;
    this.dbVersion = params.dbVersion;
  }
}

export async function getProgramVersion(): Promise<string> {
  // Simply return the schema version constant
  // This is much more reliable than trying to read package.json
  // which fails in global installations and various edge cases
  return SCHEMA_VERSION;
}

export async function hasDbMetadataTable(db: Database): Promise<boolean> {
  try {
    const result = await db.getAsync(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='db_metadata'"
    ) as { name: string } | undefined;

    return !!result;
  } catch {
    return false;
  }
}

export async function getDbVersion(db: Database): Promise<string | null> {
  try {
    const row = await db.getAsync(
      'SELECT value FROM db_metadata WHERE key = ?',
      ['schema_version']
    ) as { value: string } | undefined;

    return row?.value || null;
  } catch {
    // Table might not exist in old databases
    return null;
  }
}

export async function setDbVersion(db: Database, version: string): Promise<void> {
  await db.runAsync(
    'INSERT OR REPLACE INTO db_metadata (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
    ['schema_version', version]
  );
}

export async function checkDatabaseVersion(db: Database, logger: winston.Logger): Promise<void> {
  const programVersion = await getProgramVersion();

  // First check if db_metadata table exists
  const hasMetadataTable = await hasDbMetadataTable(db);

  if (!hasMetadataTable) {
    // Old database without version tracking (< 0.7.5)
    logger.info('Database version table not found. This appears to be an old database.');
    throw new VersionMismatchError({
      programVersion,
      dbVersion: '<0.7.5',
      message: 'This database appears to be from a version older than 0.7.5.\n' +
        `Current program version is ${programVersion}.\n` +
        'Please rebuild the database using: shirokuma-mcp-knowledge-base-rebuild'
    });
  }

  const dbVersion = await getDbVersion(db);

  logger.info(`Program version: ${programVersion}`);
  logger.info(`Database version: ${dbVersion || 'not set'}`);

  // If DB version is not set in the table, also treat as old database
  if (!dbVersion) {
    logger.info('Database version not set in db_metadata table.');
    throw new VersionMismatchError({
      programVersion,
      dbVersion: 'unknown',
      message: 'Database version is not set.\n' +
        `Current program version is ${programVersion}.\n` +
        'Please rebuild the database using: shirokuma-mcp-knowledge-base-rebuild'
    });
  }

  // Check for version mismatch
  if (dbVersion !== programVersion) {
    throw new VersionMismatchError({
      programVersion,
      dbVersion
    });
  }

  logger.info('Database version check passed');
}