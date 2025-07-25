#!/usr/bin/env node
/**
 * @ai-context Migration script to rename files from singular to plural format
 * @ai-critical One-time migration for existing data files
 * @ai-flow 1. Scan directories -> 2. Rename files -> 3. Report results
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { createLogger } from './utils/logger.js';
const logger = createLogger('MigrateToPluralFilenames');
async function migrateFiles(directory, oldPrefix, newPrefix) {
    let migratedCount = 0;
    try {
        const files = await fs.readdir(directory);
        for (const file of files) {
            if (file.startsWith(`${oldPrefix}-`) && file.endsWith('.md')) {
                const oldPath = path.join(directory, file);
                const newFileName = file.replace(`${oldPrefix}-`, `${newPrefix}-`);
                const newPath = path.join(directory, newFileName);
                try {
                    await fs.rename(oldPath, newPath);
                    logger.info(`Renamed: ${file} -> ${newFileName}`);
                    migratedCount++;
                }
                catch (error) {
                    logger.error(`Failed to rename ${file}:`, error);
                }
            }
        }
    }
    catch (error) {
        logger.error(`Failed to read directory ${directory}:`, error);
    }
    return migratedCount;
}
async function migrateDocDirectory(documentsPath) {
    const oldDocDir = path.join(documentsPath, 'doc');
    const newDocDir = path.join(documentsPath, 'docs');
    let migratedCount = 0;
    try {
        // Check if old directory exists
        await fs.access(oldDocDir);
        // Create new directory if it doesn't exist
        await fs.mkdir(newDocDir, { recursive: true });
        // Move all files from doc to docs
        const files = await fs.readdir(oldDocDir);
        for (const file of files) {
            if (file.endsWith('.md')) {
                const oldPath = path.join(oldDocDir, file);
                // Also update file prefix from doc- to docs-
                const newFileName = file.startsWith('doc-') ? file.replace('doc-', 'docs-') : file;
                const newPath = path.join(newDocDir, newFileName);
                try {
                    await fs.rename(oldPath, newPath);
                    logger.info(`Moved and renamed: doc/${file} -> docs/${newFileName}`);
                    migratedCount++;
                }
                catch (error) {
                    logger.error(`Failed to move ${file}:`, error);
                }
            }
        }
        // Remove old directory if empty
        try {
            const remainingFiles = await fs.readdir(oldDocDir);
            if (remainingFiles.length === 0) {
                await fs.rmdir(oldDocDir);
                logger.info('Removed empty doc directory');
            }
        }
        catch (error) {
            logger.error('Failed to remove old doc directory:', error);
        }
    }
    catch (error) {
        // Old directory doesn't exist, nothing to migrate
        logger.info('No doc directory to migrate');
    }
    return migratedCount;
}
async function main() {
    const dataDir = process.env.SHIROKUMA_DATA_DIR || path.join(process.cwd(), '.shirokuma/data');
    logger.info('Starting migration to plural filenames...');
    logger.info(`Data directory: ${dataDir}`);
    let totalMigrated = 0;
    // Migrate issues
    const issuesDir = path.join(dataDir, 'issues');
    const issuesMigrated = await migrateFiles(issuesDir, 'issue', 'issues');
    totalMigrated += issuesMigrated;
    logger.info(`Migrated ${issuesMigrated} issue files`);
    // Migrate plans
    const plansDir = path.join(dataDir, 'plans');
    const plansMigrated = await migrateFiles(plansDir, 'plan', 'plans');
    totalMigrated += plansMigrated;
    logger.info(`Migrated ${plansMigrated} plan files`);
    // Migrate doc directory to docs
    const documentsPath = path.join(dataDir, 'documents');
    const docsMigrated = await migrateDocDirectory(documentsPath);
    totalMigrated += docsMigrated;
    logger.info(`Migrated ${docsMigrated} doc files`);
    logger.info(`Migration complete. Total files migrated: ${totalMigrated}`);
    if (totalMigrated > 0) {
        logger.info('Remember to rebuild the database: npm run rebuild-db');
    }
}
// Run migration
main().catch((error) => {
    logger.error('Migration failed:', error);
    process.exit(1);
});
//# sourceMappingURL=migrate-to-plural-filenames.js.map