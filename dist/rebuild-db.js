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
        statuses: new Set(), // @ai-logic: Now we only store status names
        maxIds: {
            issues: 0,
            plans: 0,
            docs: 0,
            knowledge: 0,
            customTypes: {} // @ai-logic: Track max IDs for custom types
        },
        customTypes: new Set() // @ai-logic: Track discovered custom types
    };
    // @ai-logic: Process each content type with consistent pattern
    console.log('\n📂 Scanning issues...');
    const issueFiles = globSync(path.join(databasePath, 'issues', 'issue-*.md'));
    for (const file of issueFiles) {
        const content = await fs.readFile(file, 'utf-8');
        const parsed = parseMarkdown(content);
        // Extract ID from filename and update max ID
        const filename = path.basename(file);
        const idMatch = filename.match(/issue-(\d+)\.md/);
        if (idMatch) {
            const id = parseInt(idMatch[1]);
            if (id > counts.maxIds.issues) {
                counts.maxIds.issues = id;
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
        counts.issues++;
    }
    // Scan plans
    console.log('📂 Scanning plans...');
    const planFiles = globSync(path.join(databasePath, 'plans', 'plan-*.md'));
    for (const file of planFiles) {
        const content = await fs.readFile(file, 'utf-8');
        const parsed = parseMarkdown(content);
        // Extract ID from filename and update max ID
        const filename = path.basename(file);
        const idMatch = filename.match(/plan-(\d+)\.md/);
        if (idMatch) {
            const id = parseInt(idMatch[1]);
            if (id > counts.maxIds.plans) {
                counts.maxIds.plans = id;
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
        // Collect status names
        if (parsed.metadata.status) {
            counts.statuses.add(parsed.metadata.status);
        }
        counts.plans++;
    }
    // Scan documents
    console.log('📂 Scanning documents...');
    const docFiles = globSync(path.join(databasePath, 'documents', 'doc', 'doc-*.md'));
    for (const file of docFiles) {
        const content = await fs.readFile(file, 'utf-8');
        const parsed = parseMarkdown(content);
        // Extract ID from filename and update max ID
        const filename = path.basename(file);
        const idMatch = filename.match(/doc-(\d+)\.md/);
        if (idMatch) {
            const id = parseInt(idMatch[1]);
            if (id > counts.maxIds.docs) {
                counts.maxIds.docs = id;
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
        counts.docs++;
    }
    // Scan knowledge
    console.log('📂 Scanning knowledge...');
    const knowledgeFiles = globSync(path.join(databasePath, 'documents', 'knowledge', 'knowledge-*.md'));
    for (const file of knowledgeFiles) {
        const content = await fs.readFile(file, 'utf-8');
        const parsed = parseMarkdown(content);
        // Extract ID from filename and update max ID
        const filename = path.basename(file);
        const idMatch = filename.match(/knowledge-(\d+)\.md/);
        if (idMatch) {
            const id = parseInt(idMatch[1]);
            if (id > counts.maxIds.knowledge) {
                counts.maxIds.knowledge = id;
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
        counts.knowledge++;
    }
    // @ai-logic: Scan custom document types
    console.log('📂 Scanning custom document types...');
    const documentsDir = path.join(databasePath, 'documents');
    try {
        const subdirs = await fs.readdir(documentsDir);
        for (const subdir of subdirs) {
            // Skip built-in types
            if (subdir === 'doc' || subdir === 'knowledge')
                continue;
            const subdirPath = path.join(documentsDir, subdir);
            const stat = await fs.stat(subdirPath);
            if (stat.isDirectory()) {
                counts.customTypes.add(subdir);
                counts.maxIds.customTypes[subdir] = 0;
                // Scan files with plural prefix pattern
                const filePrefix = subdir.endsWith('s') ? subdir : `${subdir}s`;
                const customFiles = globSync(path.join(subdirPath, `${filePrefix}-*.md`));
                for (const file of customFiles) {
                    const content = await fs.readFile(file, 'utf-8');
                    const parsed = parseMarkdown(content);
                    // Extract ID from filename and update max ID
                    const filename = path.basename(file);
                    const idMatch = filename.match(new RegExp(`${filePrefix}-(\\d+)\\.md`));
                    if (idMatch) {
                        const id = parseInt(idMatch[1]);
                        if (id > counts.maxIds.customTypes[subdir]) {
                            counts.maxIds.customTypes[subdir] = id;
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
                }
                console.log(`  📁 Found custom type: ${subdir} (${customFiles.length} files)`);
            }
        }
    }
    catch (error) {
        console.log('  ⚠️  Could not scan custom types:', error);
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
        await db.runAsync('UPDATE sequences SET current_value = ? WHERE type = ?', [counts.maxIds.issues, 'issues']);
        await db.runAsync('UPDATE sequences SET current_value = ? WHERE type = ?', [counts.maxIds.plans, 'plans']);
        await db.runAsync('UPDATE sequences SET current_value = ? WHERE type = ?', [counts.maxIds.docs, 'docs']);
        await db.runAsync('UPDATE sequences SET current_value = ? WHERE type = ?', [counts.maxIds.knowledge, 'knowledge']);
        console.log(`  ✅ Updated sequences - Issues: ${counts.maxIds.issues}, Plans: ${counts.maxIds.plans}, Docs: ${counts.maxIds.docs}, Knowledge: ${counts.maxIds.knowledge}`);
        // @ai-logic: Update or create sequences for custom types
        if (counts.customTypes.size > 0) {
            console.log('\n🔧 Processing custom types...');
            for (const customType of counts.customTypes) {
                // Check if sequence exists
                const existing = await db.getAsync('SELECT type FROM sequences WHERE type = ?', [customType]);
                if (existing) {
                    // Update existing sequence
                    await db.runAsync('UPDATE sequences SET current_value = ? WHERE type = ?', [
                        counts.maxIds.customTypes[customType] || 0,
                        customType
                    ]);
                    console.log(`  ✅ Updated sequence for custom type '${customType}' to ${counts.maxIds.customTypes[customType] || 0}`);
                }
                else {
                    // Create new sequence for custom type found in directory
                    await db.runAsync('INSERT INTO sequences (type, current_value, base_type) VALUES (?, ?, ?)', [customType, counts.maxIds.customTypes[customType] || 0, 'documents']);
                    console.log(`  ✅ Created sequence for custom type '${customType}' with base_type 'documents'`);
                }
            }
        }
        // Tags are automatically registered during sync operations via saveEntityTags
        console.log('\n🏷️  Tags registration:');
        console.log('  Collected tags:', Array.from(counts.tags).sort());
        console.log('  ✅ Tags were automatically registered during data sync');
        console.log('\n📊 Database rebuild complete:');
        console.log(`  - Issues: ${counts.issues}`);
        console.log(`  - Plans: ${counts.plans}`);
        console.log(`  - Documents: ${counts.docs}`);
        console.log(`  - Knowledge: ${counts.knowledge}`);
        console.log(`  - Custom Types: ${counts.customTypes.size}`);
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