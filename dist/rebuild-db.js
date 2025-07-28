#!/usr/bin/env node
/**
 * @ai-context Database rebuild utility for disaster recovery
 * @ai-pattern Command-line tool that reconstructs SQLite from markdown files
 * @ai-critical Used when database is corrupted or out of sync
 * @ai-flow 1. Drop DB -> 2. Reinitialize -> 3. Scan files -> 4. Rebuild data
 * @ai-assumption Markdown files are source of truth
 */
import path from 'path';
import { globSync } from 'glob';
import { existsSync, statSync, unlinkSync, readFileSync } from 'fs';
import { FileIssueDatabase } from './database/index.js';
import { parseMarkdown } from './utils/markdown-parser.js';
async function rebuildDatabase() {
    const databasePath = process.env.MCP_DATABASE_PATH || path.join(process.cwd(), '.shirokuma', 'data');
    const dbPath = path.join(databasePath, 'search.db');
    console.log('🔄 Starting database rebuild from Markdown files...');
    console.log(`📂 Database path: ${databasePath}`);
    // Remove existing database
    if (existsSync(dbPath)) {
        unlinkSync(dbPath);
        console.log('🗑️  Removed existing database');
    }
    // Initialize new database
    const fullDb = new FileIssueDatabase(databasePath, dbPath);
    await fullDb.initialize();
    console.log('✅ Database initialized');
    // Check for new types by scanning directories
    console.log('\n🔍 Scanning filesystem for types...');
    const typeRepo = fullDb['typeRepo'];
    const existingTypes = await typeRepo.getAllTypes();
    const existingTypeNames = new Set(existingTypes.map(t => t.type));
    const dirs = globSync(path.join(databasePath, '*')).filter(dir => {
        const stat = statSync(dir);
        const dirName = path.basename(dir);
        // Skip non-directories and special directories
        if (!stat.isDirectory() || dirName === 'search.db') {
            return false;
        }
        // Skip subdirectories of sessions (like dailies)
        const parentDir = path.dirname(dir);
        if (path.basename(parentDir) === 'sessions') {
            return false;
        }
        return true;
    });
    // Register any new types found
    for (const dir of dirs) {
        const typeName = path.basename(dir);
        // Skip sessions directory as it's handled specially
        if (typeName === 'sessions') {
            continue;
        }
        if (!existingTypeNames.has(typeName)) {
            console.log(`  📁 Found unregistered type: ${typeName}`);
            // @ai-critical: Determine base type from markdown header or content
            // @ai-pattern: No special treatment for initial types - treat all types equally
            let baseType = 'documents';
            // Check markdown files for 'base' field in header
            const sampleFiles = globSync(path.join(dir, `${typeName}-*.md`)).slice(0, 3);
            for (const file of sampleFiles) {
                try {
                    const content = readFileSync(file, 'utf-8');
                    const parsed = parseMarkdown(content);
                    // @ai-priority: Always check for explicit 'base' field first
                    // @ai-why: Explicit metadata should override any inference
                    if (parsed.metadata.base) {
                        baseType = parsed.metadata.base;
                        break;
                    }
                    // @ai-fallback: Only infer if no explicit base field
                    // @ai-logic: Tasks have priority and status, documents don't
                    if (parsed.metadata.priority && parsed.metadata.status) {
                        baseType = 'tasks';
                        break;
                    }
                }
                catch (error) {
                    // Skip file if parsing fails
                }
            }
            try {
                await typeRepo.createType(typeName, baseType);
                console.log(`  ✅ Registered type: ${typeName} (base_type: ${baseType})`);
            }
            catch (error) {
                console.error(`  ⚠️  Failed to register type ${typeName}:`, error);
            }
        }
    }
    // Count items by type
    const counts = {
        typeCountsMap: {},
        tags: new Set(),
        statuses: new Set()
    };
    // Count items for all types (including sessions and dailies)
    const allTypes = await typeRepo.getAllTypes();
    // Add special types that are not in the type repository
    allTypes.push({ type: 'sessions', base_type: 'sessions' });
    allTypes.push({ type: 'dailies', base_type: 'documents' });
    for (const typeInfo of allTypes) {
        const type = typeInfo.type;
        console.log(`\n📂 Scanning ${type}...`);
        counts.typeCountsMap[type] = 0;
        // Different pattern for sessions (date subdirs) vs others
        if (type === 'sessions') {
            const sessionFiles = globSync(path.join(databasePath, type, '*', `${type}-*.md`));
            counts.typeCountsMap[type] = sessionFiles.length;
            console.log(`    Found ${sessionFiles.length} session files`);
            // Collect tags and statuses from sessions
            for (const file of sessionFiles) {
                const content = readFileSync(file, 'utf-8');
                const parsed = parseMarkdown(content);
                if (parsed.metadata.status) {
                    counts.statuses.add(parsed.metadata.status);
                }
                if (parsed.metadata.tags && Array.isArray(parsed.metadata.tags)) {
                    parsed.metadata.tags.forEach((tag) => counts.tags.add(tag));
                }
            }
        }
        else if (type === 'dailies') {
            // Dailies are stored under sessions/dailies/
            const dailiesFiles = globSync(path.join(databasePath, 'sessions', 'dailies', 'dailies-*.md'));
            counts.typeCountsMap[type] = dailiesFiles.length;
            console.log(`    Found ${dailiesFiles.length} dailies files`);
            // Collect tags and statuses from dailies
            for (const file of dailiesFiles) {
                const content = readFileSync(file, 'utf-8');
                const parsed = parseMarkdown(content);
                if (parsed.metadata.status) {
                    counts.statuses.add(parsed.metadata.status);
                }
                if (parsed.metadata.tags && Array.isArray(parsed.metadata.tags)) {
                    parsed.metadata.tags.forEach((tag) => counts.tags.add(tag));
                }
            }
        }
        else {
            // Regular pattern for other types
            const files = globSync(path.join(databasePath, type, `${type}-*.md`));
            counts.typeCountsMap[type] = files.length;
            console.log(`    Found ${files.length} ${type} files`);
            // Collect tags and statuses
            for (const file of files) {
                const content = readFileSync(file, 'utf-8');
                const parsed = parseMarkdown(content);
                if (parsed.metadata.status) {
                    counts.statuses.add(parsed.metadata.status);
                }
                if (parsed.metadata.tags && Array.isArray(parsed.metadata.tags)) {
                    parsed.metadata.tags.forEach((tag) => counts.tags.add(tag));
                }
            }
        }
    }
    // Show status warning
    console.log('\n📝 Status management note:');
    console.log('  - Statuses are managed through database initialization');
    console.log('  - Custom statuses found in files: ', Array.from(counts.statuses));
    console.log('  - Only default statuses will be available after rebuild');
    // Sync all data using ItemRepository
    console.log('\n🔄 Syncing data to SQLite using ItemRepository...');
    const itemRepo = fullDb.getItemRepository();
    // Sync all types including sessions
    let totalSynced = 0;
    for (const typeInfo of allTypes) {
        const type = typeInfo.type;
        const count = counts.typeCountsMap[type] || 0;
        if (count > 0 || type === 'sessions' || type === 'dailies') {
            console.log(`  📝 Syncing ${type} items...`);
            try {
                const syncedCount = await itemRepo.rebuildFromMarkdown(type);
                console.log(`  ✅ Synced ${syncedCount} ${type} items`);
                totalSynced += syncedCount;
            }
            catch (error) {
                console.error(`  ⚠️  Failed to sync ${type}:`, error);
            }
        }
    }
    console.log(`  ✅ Total items synced: ${totalSynced}`);
    // Update sequences to match highest IDs
    console.log('\n🔢 Updating sequences with max IDs...');
    const db = fullDb.getDatabase();
    // Get all types from sequences table, not just those with markdown files
    const allSequences = await db.allAsync('SELECT type FROM sequences', []);
    for (const { type } of allSequences) {
        // Get max ID from items table
        const result = await db.getAsync('SELECT MAX(CAST(id AS INTEGER)) as max_id FROM items WHERE type = ?', [type]);
        const maxId = result?.max_id || 0;
        // Update sequence
        await db.runAsync('UPDATE sequences SET current_value = ? WHERE type = ?', [maxId, type]);
        console.log(`  ✅ Updated sequence '${type}' to ${maxId}`);
    }
    // Collect and display all tags
    const tagRepo = fullDb['tagRepo'];
    const allTags = await tagRepo.getAllTags();
    console.log('\n🏷️  Tags registration:');
    console.log(`  Collected tags: ${JSON.stringify(allTags.map(t => t.name), null, 2)}`);
    console.log('  ✅ Tags were automatically registered during data sync');
    // Final summary
    console.log('\n📊 Database rebuild complete:');
    console.log('  Type counts:');
    for (const [type, count] of Object.entries(counts.typeCountsMap)) {
        if (count > 0) {
            console.log(`    - ${type}: ${count}`);
        }
    }
    console.log(`  - Total items: ${totalSynced}`);
    console.log(`  - Tags: ${allTags.length}`);
    console.log(`  - Unique Status Names: ${counts.statuses.size}`);
    console.log('\n✨ Database rebuild successful!');
    console.log('\n💡 Tip: You can verify the rebuild by running the MCP server and checking the data.');
    await fullDb.close();
}
// Run rebuild
rebuildDatabase().catch(error => {
    console.error('❌ Database rebuild failed:', error);
    process.exit(1);
});
//# sourceMappingURL=rebuild-db.js.map