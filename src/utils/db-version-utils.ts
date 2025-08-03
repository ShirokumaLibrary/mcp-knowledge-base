import * as fs from 'fs/promises';
import * as path from 'path';
import type { Database } from '../database/base.js';
import type winston from 'winston';

export class VersionMismatchError extends Error {
  public readonly programVersion: string;
  public readonly dbVersion: string;

  constructor(params: { programVersion: string; dbVersion: string; message?: string }) {
    const message = params.message ||
      `Database version (${params.dbVersion}) does not match program version (${params.programVersion}).\n` +
      'Please rebuild the database using: npm run rebuild:mcp';
    super(message);
    this.name = 'VersionMismatchError';
    this.programVersion = params.programVersion;
    this.dbVersion = params.dbVersion;
  }
}

export async function getProgramVersion(): Promise<string> {
  try {
    // In production, package.json should be at the root
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    return packageJson.version;
  } catch {
    // Fallback to a default version if package.json not found
    // This might happen in test environments
    return '0.7.5';
  }
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
      message: `This database appears to be from a version older than 0.7.5.\n` +
        `Current program version is ${programVersion}.\n` +
        'Please rebuild the database using: npm run rebuild:mcp'
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
      message: `Database version is not set.\n` +
        `Current program version is ${programVersion}.\n` +
        'Please rebuild the database using: npm run rebuild:mcp'
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