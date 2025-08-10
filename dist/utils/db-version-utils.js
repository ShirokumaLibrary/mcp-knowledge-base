import * as fs from 'fs/promises';
import * as path from 'path';
const DEFAULT_FALLBACK_VERSION = '0.7.5';
const FALLBACK_VERSION = process.env.MCP_FALLBACK_VERSION || DEFAULT_FALLBACK_VERSION;
export class VersionMismatchError extends Error {
    programVersion;
    dbVersion;
    constructor(params) {
        const message = params.message ||
            `Database version (${params.dbVersion}) does not match program version (${params.programVersion}).\n` +
                'Please rebuild the database using: npm run rebuild:mcp';
        super(message);
        this.name = 'VersionMismatchError';
        this.programVersion = params.programVersion;
        this.dbVersion = params.dbVersion;
    }
}
export async function getProgramVersion() {
    try {
        const currentDir = __dirname;
        const possiblePaths = [
            path.join(currentDir, '..', '..', 'package.json'),
            path.join(currentDir, '..', '..', '..', 'package.json')
        ];
        for (const packageJsonPath of possiblePaths) {
            try {
                const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
                if (packageJson.version) {
                    return packageJson.version;
                }
            }
            catch (error) {
                if (process.env.DEBUG) {
                    console.debug(`Failed to read ${packageJsonPath}:`, error);
                }
                continue;
            }
        }
        return FALLBACK_VERSION;
    }
    catch (error) {
        if (process.env.DEBUG) {
            console.debug('Failed to get program version:', error);
        }
        return FALLBACK_VERSION;
    }
}
export async function hasDbMetadataTable(db) {
    try {
        const result = await db.getAsync("SELECT name FROM sqlite_master WHERE type='table' AND name='db_metadata'");
        return !!result;
    }
    catch {
        return false;
    }
}
export async function getDbVersion(db) {
    try {
        const row = await db.getAsync('SELECT value FROM db_metadata WHERE key = ?', ['schema_version']);
        return row?.value || null;
    }
    catch {
        return null;
    }
}
export async function setDbVersion(db, version) {
    await db.runAsync('INSERT OR REPLACE INTO db_metadata (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)', ['schema_version', version]);
}
export async function checkDatabaseVersion(db, logger) {
    const programVersion = await getProgramVersion();
    const hasMetadataTable = await hasDbMetadataTable(db);
    if (!hasMetadataTable) {
        logger.info('Database version table not found. This appears to be an old database.');
        throw new VersionMismatchError({
            programVersion,
            dbVersion: '<0.7.5',
            message: 'This database appears to be from a version older than 0.7.5.\n' +
                `Current program version is ${programVersion}.\n` +
                'Please rebuild the database using: npm run rebuild:mcp'
        });
    }
    const dbVersion = await getDbVersion(db);
    logger.info(`Program version: ${programVersion}`);
    logger.info(`Database version: ${dbVersion || 'not set'}`);
    if (!dbVersion) {
        logger.info('Database version not set in db_metadata table.');
        throw new VersionMismatchError({
            programVersion,
            dbVersion: 'unknown',
            message: 'Database version is not set.\n' +
                `Current program version is ${programVersion}.\n` +
                'Please rebuild the database using: npm run rebuild:mcp'
        });
    }
    if (dbVersion !== programVersion) {
        throw new VersionMismatchError({
            programVersion,
            dbVersion
        });
    }
    logger.info('Database version check passed');
}
