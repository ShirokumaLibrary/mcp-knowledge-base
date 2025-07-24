#!/usr/bin/env node
/**
 * @ai-context Database reconstruction utility for disaster recovery
 * @ai-pattern Command-line tool with backup, scan, restore, sync workflow
 * @ai-critical Data preservation tool - must handle corrupted data gracefully
 * @ai-why Markdown files are source of truth, SQLite can be rebuilt anytime
 * Usage: npm run rebuild-db
 */
import { DatabaseConnection } from './database/base.js';
import { getConfig } from './config.js';
import path from 'path';
import fs from 'fs/promises';
import { statSync } from 'fs';
import { globSync } from 'glob';
import { parseMarkdown } from './utils/markdown-parser.js';
/**
 * @ai-intent Scan all markdown files and collect metadata for reconstruction
 * @ai-flow 1. Glob files -> 2. Parse each -> 3. Extract tags/statuses -> 4. Count items
 * @ai-side-effects None - read-only scanning phase
 * @ai-return Statistics object with counts and unique values
 * @ai-why Separate scanning from syncing allows progress reporting and validation
 */
async function scanAndRebuild(databasePath, db) {
    const counts = {
        issues: 0,
        plans: 0,
        docs: 0,
        knowledge: 0,
        sessions: 0,
        tags: new Set(),
        statuses: new Map() // @ai-logic: Map preserves status ID associations
    };
    // @ai-logic: Process each content type with consistent pattern
    console.log('\n📂 Scanning issues...');
    const issueFiles = globSync(path.join(databasePath, 'issues', 'issue-*.md'));
    for (const file of issueFiles) {
        const content = await fs.readFile(file, 'utf-8');
        const parsed = parseMarkdown(content);
        if (parsed.metadata.tags) {
            parsed.metadata.tags.forEach((tag) => counts.tags.add(tag));
        }
        // @ai-critical: Collect custom statuses for restoration
        // @ai-why: User-defined statuses must survive database rebuilds
        if (parsed.metadata.status_id && parsed.metadata.status) {
            counts.statuses.set(parsed.metadata.status_id, parsed.metadata.status);
        }
        counts.issues++;
    }
    // Scan plans
    console.log('📂 Scanning plans...');
    const planFiles = globSync(path.join(databasePath, 'plans', 'plan-*.md'));
    for (const file of planFiles) {
        const content = await fs.readFile(file, 'utf-8');
        const parsed = parseMarkdown(content);
        if (parsed.metadata.tags) {
            parsed.metadata.tags.forEach((tag) => counts.tags.add(tag));
        }
        // Collect custom statuses
        if (parsed.metadata.status_id && parsed.metadata.status) {
            counts.statuses.set(parsed.metadata.status_id, parsed.metadata.status);
        }
        counts.plans++;
    }
    // Scan documents
    console.log('📂 Scanning documents...');
    const docFiles = globSync(path.join(databasePath, 'docs', 'doc-*.md'));
    for (const file of docFiles) {
        const content = await fs.readFile(file, 'utf-8');
        const parsed = parseMarkdown(content);
        if (parsed.metadata.tags) {
            parsed.metadata.tags.forEach((tag) => counts.tags.add(tag));
        }
        counts.docs++;
    }
    // Scan knowledge
    console.log('📂 Scanning knowledge...');
    const knowledgeFiles = globSync(path.join(databasePath, 'knowledge', 'knowledge-*.md'));
    for (const file of knowledgeFiles) {
        const content = await fs.readFile(file, 'utf-8');
        const parsed = parseMarkdown(content);
        if (parsed.metadata.tags) {
            parsed.metadata.tags.forEach((tag) => counts.tags.add(tag));
        }
        counts.knowledge++;
    }
    // Scan sessions
    console.log('📂 Scanning sessions...');
    const sessionDirs = globSync(path.join(databasePath, 'sessions', '*')).filter(dir => {
        try {
            return statSync(dir).isDirectory();
        }
        catch {
            return false;
        }
    });
    for (const dir of sessionDirs) {
        const sessionFiles = globSync(path.join(dir, 'session-*.md'));
        counts.sessions += sessionFiles.length;
    }
    return counts;
}
async function rebuildDatabase() {
    console.log('🔄 Starting database rebuild from Markdown files...');
    const config = getConfig();
    const databasePath = config.database.path;
    const sqlitePath = config.database.sqlitePath;
    try {
        // Check if search.db exists and back it up
        try {
            await fs.access(sqlitePath);
            const backupPath = `${sqlitePath}.backup-${Date.now()}`;
            await fs.rename(sqlitePath, backupPath);
            console.log(`📦 Backed up existing database to: ${backupPath}`);
        }
        catch {
            console.log('📝 No existing database found, creating new one...');
        }
        // Create new database connection
        const connection = new DatabaseConnection(sqlitePath);
        await connection.initialize();
        const db = connection.getDatabase();
        console.log('✅ Database initialized');
        // Scan all markdown files and get counts
        const counts = await scanAndRebuild(databasePath, db);
        // Restore custom statuses from markdown files
        console.log('\n🔄 Restoring custom statuses...');
        const defaultStatuses = ['Open', 'In Progress', 'Review', 'Completed', 'Closed', 'On Hold'];
        for (const [statusId, statusName] of counts.statuses) {
            if (!defaultStatuses.includes(statusName)) {
                // This is a custom status, insert it
                try {
                    await db.runAsync(`INSERT OR IGNORE INTO statuses (id, name) VALUES (?, ?)`, [statusId, statusName]);
                    console.log(`  ✅ Restored custom status: ${statusName} (ID: ${statusId})`);
                }
                catch (error) {
                    console.error(`  ❌ Failed to restore status ${statusName}:`, error);
                }
            }
        }
        // Now initialize the full database which will trigger the sync
        const { FileIssueDatabase } = await import('./database/index.js');
        const fullDb = new FileIssueDatabase(databasePath, sqlitePath);
        await fullDb.initialize();
        // Force sync all data from markdown to SQLite
        console.log('\n🔄 Syncing data to search tables...');
        // Use the search repository's rebuild method
        const searchRepo = fullDb.searchRepo;
        if (searchRepo && searchRepo.rebuildSearchIndex) {
            await searchRepo.rebuildSearchIndex();
            console.log('  ✅ Search index rebuilt successfully');
        }
        else {
            console.log('  ⚠️  Search repository not available, manual sync required');
        }
        // Also need to handle docs separately as they're not in rebuildSearchIndex
        const docs = await fullDb.getAllDocs();
        console.log(`  📄 Syncing ${docs.length} documents...`);
        const docRepo = fullDb.docRepo;
        if (docRepo && docRepo.syncDocToSQLite) {
            for (const doc of docs) {
                await docRepo.syncDocToSQLite(doc);
            }
        }
        // Sync sessions and daily summaries
        console.log('\n🔄 Syncing sessions and daily summaries...');
        // Import SessionRepository
        const { SessionRepository } = await import('./repositories/session-repository.js');
        const sessionRepo = new SessionRepository(path.join(databasePath, 'sessions'), fullDb);
        // Get all sessions
        const sessions = sessionRepo.getSessions();
        console.log(`  📅 Syncing ${sessions.length} sessions...`);
        for (const session of sessions) {
            await fullDb.syncSessionToSQLite(session);
        }
        // Get all daily summaries
        const summaries = sessionRepo.getDailySummaries();
        console.log(`  📝 Syncing ${summaries.length} daily summaries...`);
        for (const summary of summaries) {
            await fullDb.syncDailySummaryToSQLite(summary);
        }
        console.log('\n📊 Database rebuild complete:');
        console.log(`  - Issues: ${counts.issues}`);
        console.log(`  - Plans: ${counts.plans}`);
        console.log(`  - Documents: ${counts.docs}`);
        console.log(`  - Knowledge: ${counts.knowledge}`);
        console.log(`  - Sessions: ${counts.sessions}`);
        console.log(`  - Tags: ${counts.tags.size}`);
        console.log(`  - Custom Statuses: ${Array.from(counts.statuses.values()).filter(s => !defaultStatuses.includes(s)).length}`);
        // Close connections
        fullDb.close();
        console.log('\n✨ Database rebuild successful!');
        console.log('\n💡 Tip: You can verify the rebuild by running the MCP server and checking the data.');
        process.exit(0);
    }
    catch (error) {
        console.error('\n❌ Error rebuilding database:', error);
        process.exit(1);
    }
}
// Run the rebuild
rebuildDatabase().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=rebuild-db.js.map