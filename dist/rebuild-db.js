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
    // First, get all types from sequences table
    const sequences = await db.allAsync('SELECT type, base_type FROM sequences');
    const counts = {
        typeCountsMap: {}, // Dynamic type counts
        sessions: 0,
        tags: new Set(),
        statuses: new Set(), // @ai-logic: Now we only store status names
        maxIds: {}, // @ai-critical: Track maximum IDs to update sequences correctly
    };
    // Initialize counts for all known types
    for (const seq of sequences) {
        counts.typeCountsMap[seq.type] = 0;
        counts.maxIds[seq.type] = 0;
    }
    // @ai-logic: Also scan filesystem for types that may not be in database yet
    console.log('\n🔍 Scanning filesystem for additional types...');
    // Scan task directories
    try {
        const taskDirs = await fs.readdir(path.join(databasePath, 'tasks'));
        for (const dir of taskDirs) {
            const dirPath = path.join(databasePath, 'tasks', dir);
            const stat = await fs.stat(dirPath);
            if (stat.isDirectory() && !sequences.find((s) => s.type === dir)) {
                console.log(`  📁 Found unregistered task type: ${dir}`);
                // Add to sequences for processing
                sequences.push({ type: dir, base_type: 'tasks' });
                counts.typeCountsMap[dir] = 0;
                counts.maxIds[dir] = 0;
                // Register in database
                await db.runAsync('INSERT INTO sequences (type, current_value, base_type) VALUES (?, 0, ?)', [dir, 'tasks']);
                console.log(`  ✅ Registered task type: ${dir}`);
            }
        }
    }
    catch (e) {
        console.log('  ℹ️  No tasks directory found');
    }
    // Scan document files for types
    try {
        const docFiles = await fs.readdir(path.join(databasePath, 'documents'));
        const foundTypes = new Set();
        // Extract types from filenames
        for (const file of docFiles) {
            const match = file.match(/^(\w+)-\d+\.md$/);
            if (match) {
                foundTypes.add(match[1]);
            }
        }
        // Check subdirectories too
        for (const item of docFiles) {
            const itemPath = path.join(databasePath, 'documents', item);
            const stat = await fs.stat(itemPath);
            if (stat.isDirectory()) {
                foundTypes.add(item);
            }
        }
        // Register any unregistered document types
        for (const type of foundTypes) {
            if (!sequences.find((s) => s.type === type)) {
                console.log(`  📁 Found unregistered document type: ${type}`);
                sequences.push({ type, base_type: 'documents' });
                counts.typeCountsMap[type] = 0;
                counts.maxIds[type] = 0;
                // Register in database
                await db.runAsync('INSERT INTO sequences (type, current_value, base_type) VALUES (?, 0, ?)', [type, 'documents']);
                console.log(`  ✅ Registered document type: ${type}`);
            }
        }
    }
    catch (e) {
        console.log('  ℹ️  No documents directory found');
    }
    // @ai-logic: Process task types dynamically
    const taskTypes = sequences.filter((seq) => seq.base_type === 'tasks');
    for (const typeInfo of taskTypes) {
        const type = typeInfo.type;
        console.log(`\n📂 Scanning ${type}...`);
        // Task types are stored in tasks/[type] subdirectory
        const files = globSync(path.join(databasePath, 'tasks', type, `${type}-*.md`));
        for (const file of files) {
            const content = await fs.readFile(file, 'utf-8');
            const parsed = parseMarkdown(content);
            // Extract ID from filename and update max ID
            const filename = path.basename(file);
            const idMatch = filename.match(new RegExp(`${type}-(\\d+)\\.md`));
            if (idMatch) {
                const id = parseInt(idMatch[1]);
                if (id > counts.maxIds[type]) {
                    counts.maxIds[type] = id;
                }
            }
            if (parsed.metadata.tags) {
                // @ai-logic: Tags might be stored as comma-separated string or array
                let tags;
                if (Array.isArray(parsed.metadata.tags)) {
                    tags = parsed.metadata.tags;
                }
                else if (typeof parsed.metadata.tags === 'string') {
                    // Check if it's a JSON array string
                    if (parsed.metadata.tags.startsWith('[') && parsed.metadata.tags.endsWith(']')) {
                        try {
                            tags = JSON.parse(parsed.metadata.tags);
                        }
                        catch {
                            // If JSON parse fails, treat as comma-separated
                            tags = parsed.metadata.tags.split(',').map((t) => t.trim());
                        }
                    }
                    else {
                        tags = parsed.metadata.tags.split(',').map((t) => t.trim());
                    }
                }
                else {
                    tags = [];
                }
                tags.forEach((tag) => counts.tags.add(tag));
            }
            // @ai-critical: Collect status names from files
            // @ai-why: We now store status names, not IDs
            if (parsed.metadata.status) {
                counts.statuses.add(parsed.metadata.status);
            }
            counts.typeCountsMap[type]++;
        }
    }
    // @ai-logic: Process document types dynamically
    const documentTypes = sequences.filter((seq) => seq.base_type === 'documents');
    for (const typeInfo of documentTypes) {
        const type = typeInfo.type;
        console.log(`\n📂 Scanning ${type}...`);
        // Check if documents are in subdirectory (old structure) or main documents directory (new structure)
        let files = globSync(path.join(databasePath, 'documents', type, `${type}-*.md`));
        if (files.length === 0) {
            // Try new flat structure
            files = globSync(path.join(databasePath, 'documents', `${type}-*.md`));
        }
        for (const file of files) {
            const content = await fs.readFile(file, 'utf-8');
            const parsed = parseMarkdown(content);
            // Extract ID from filename and update max ID
            const filename = path.basename(file);
            const idMatch = filename.match(new RegExp(`${type}-(\\d+)\\.md`));
            if (idMatch) {
                const id = parseInt(idMatch[1]);
                if (id > counts.maxIds[type]) {
                    counts.maxIds[type] = id;
                }
            }
            if (parsed.metadata.tags) {
                // @ai-logic: Tags might be stored as comma-separated string or array
                let tags;
                if (Array.isArray(parsed.metadata.tags)) {
                    tags = parsed.metadata.tags;
                }
                else if (typeof parsed.metadata.tags === 'string') {
                    // Check if it's a JSON array string
                    if (parsed.metadata.tags.startsWith('[') && parsed.metadata.tags.endsWith(']')) {
                        try {
                            tags = JSON.parse(parsed.metadata.tags);
                        }
                        catch {
                            // If JSON parse fails, treat as comma-separated
                            tags = parsed.metadata.tags.split(',').map((t) => t.trim());
                        }
                    }
                    else {
                        tags = parsed.metadata.tags.split(',').map((t) => t.trim());
                    }
                }
                else {
                    tags = [];
                }
                tags.forEach((tag) => counts.tags.add(tag));
            }
            counts.typeCountsMap[type]++;
        }
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
        for (const file of sessionFiles) {
            const content = await fs.readFile(file, 'utf-8');
            const parsed = parseMarkdown(content);
            if (parsed.metadata.tags) {
                parsed.metadata.tags.forEach((tag) => counts.tags.add(tag));
            }
            counts.sessions++;
        }
        // Also scan daily summaries
        const summaryFiles = globSync(path.join(dir, 'daily-summary-*.md'));
        for (const file of summaryFiles) {
            const content = await fs.readFile(file, 'utf-8');
            const parsed = parseMarkdown(content);
            if (parsed.metadata.tags) {
                parsed.metadata.tags.forEach((tag) => counts.tags.add(tag));
            }
        }
    }
    return counts;
}
async function rebuildDatabase() {
    console.log('🔄 Starting database rebuild from Markdown files...');
    const config = getConfig();
    const databasePath = config.database.path;
    const sqlitePath = config.database.sqlitePath;
    try {
        // Remove existing database if it exists
        try {
            await fs.access(sqlitePath);
            await fs.unlink(sqlitePath);
            console.log('🗑️  Removed existing database');
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
        // Note: Status restoration is no longer needed
        // @ai-why: Statuses are now managed through database initialization only
        // @ai-logic: Custom statuses are not supported - only default statuses exist
        console.log('\n📝 Status management note:');
        console.log('  - Statuses are managed through database initialization');
        console.log('  - Custom statuses found in files: ', Array.from(counts.statuses));
        console.log('  - Only default statuses will be available after rebuild');
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
        // Docs are now handled in rebuildSearchIndex through DocumentRepository
        console.log('  ✅ Documents synced as part of search index rebuild');
        // Sync sessions and daily summaries
        console.log('\n🔄 Syncing sessions and daily summaries...');
        // Import SessionRepository
        const { SessionRepository } = await import('./repositories/session-repository.js');
        const sessionRepo = new SessionRepository(path.join(databasePath, 'sessions'), fullDb);
        // Get all sessions
        const sessions = sessionRepo.getSessions();
        console.log(`  📅 Syncing ${sessions.length} sessions...`);
        // Get all daily summaries
        const summaries = sessionRepo.getDailySummaries();
        console.log(`  📝 Syncing ${summaries.length} daily summaries...`);
        // Pre-register all session and summary tags to avoid race conditions
        const sessionTags = new Set();
        sessions.forEach((session) => {
            if (session.tags)
                session.tags.forEach((tag) => sessionTags.add(tag));
        });
        summaries.forEach((summary) => {
            if (summary.tags)
                summary.tags.forEach((tag) => sessionTags.add(tag));
        });
        if (sessionTags.size > 0) {
            const tagRepo = fullDb.tagRepo;
            if (tagRepo) {
                await tagRepo.ensureTagsExist(Array.from(sessionTags));
            }
        }
        // Now sync sessions and summaries
        for (const session of sessions) {
            await fullDb.syncSessionToSQLite(session);
        }
        for (const summary of summaries) {
            await fullDb.syncDailySummaryToSQLite(summary);
        }
        // Update sequences with max IDs to prevent overwrites
        console.log('\n🔢 Updating sequences with max IDs...');
        for (const [type, maxId] of Object.entries(counts.maxIds)) {
            await db.runAsync('UPDATE sequences SET current_value = ? WHERE type = ?', [maxId, type]);
            console.log(`  ✅ Updated sequence '${type}' to ${maxId}`);
        }
        // Tags are automatically registered during sync operations via saveEntityTags
        console.log('\n🏷️  Tags registration:');
        console.log('  Collected tags:', Array.from(counts.tags).sort());
        console.log('  ✅ Tags were automatically registered during data sync');
        console.log('\n📊 Database rebuild complete:');
        console.log('  Type counts:');
        for (const [type, count] of Object.entries(counts.typeCountsMap)) {
            console.log(`    - ${type}: ${count}`);
        }
        console.log(`  - Sessions: ${counts.sessions}`);
        console.log(`  - Tags: ${counts.tags.size}`);
        console.log(`  - Unique Status Names: ${counts.statuses.size}`);
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