#!/usr/bin/env node
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
    if (existsSync(dbPath)) {
        unlinkSync(dbPath);
        console.log('🗑️  Removed existing database');
    }
    const fullDb = new FileIssueDatabase(databasePath, dbPath);
    await fullDb.initialize();
    console.log('✅ Database initialized');
    console.log('\n🔍 Scanning filesystem for types...');
    const typeRepo = fullDb['typeRepo'];
    const existingTypes = await typeRepo.getAllTypes();
    const existingTypeNames = new Set(existingTypes.map(t => t.type));
    const dirs = globSync(path.join(databasePath, '*')).filter(dir => {
        const stat = statSync(dir);
        const dirName = path.basename(dir);
        if (!stat.isDirectory() || dirName === 'search.db') {
            return false;
        }
        const parentDir = path.dirname(dir);
        if (path.basename(parentDir) === 'sessions') {
            return false;
        }
        return true;
    });
    for (const dir of dirs) {
        const typeName = path.basename(dir);
        if (typeName === 'sessions') {
            continue;
        }
        if (!existingTypeNames.has(typeName)) {
            console.log(`  📁 Found unregistered type: ${typeName}`);
            let baseType = 'documents';
            const sampleFiles = globSync(path.join(dir, `${typeName}-*.md`)).slice(0, 3);
            for (const file of sampleFiles) {
                try {
                    const content = readFileSync(file, 'utf-8');
                    const parsed = parseMarkdown(content);
                    if (parsed.metadata.base) {
                        baseType = parsed.metadata.base;
                        break;
                    }
                    if (parsed.metadata.priority && parsed.metadata.status) {
                        baseType = 'tasks';
                        break;
                    }
                }
                catch {
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
    const counts = {
        typeCountsMap: {},
        tags: new Set(),
        statuses: new Set()
    };
    const allTypes = await typeRepo.getAllTypes();
    allTypes.push({ type: 'sessions', base_type: 'sessions' });
    allTypes.push({ type: 'dailies', base_type: 'documents' });
    for (const typeInfo of allTypes) {
        const type = typeInfo.type;
        console.log(`\n📂 Scanning ${type}...`);
        counts.typeCountsMap[type] = 0;
        if (type === 'sessions') {
            const sessionFiles = globSync(path.join(databasePath, type, '*', `${type}-*.md`));
            counts.typeCountsMap[type] = sessionFiles.length;
            console.log(`    Found ${sessionFiles.length} session files`);
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
            const dailiesFiles = globSync(path.join(databasePath, 'sessions', 'dailies', 'dailies-*.md'));
            counts.typeCountsMap[type] = dailiesFiles.length;
            console.log(`    Found ${dailiesFiles.length} dailies files`);
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
            const files = globSync(path.join(databasePath, type, `${type}-*.md`));
            counts.typeCountsMap[type] = files.length;
            console.log(`    Found ${files.length} ${type} files`);
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
    console.log('\n📝 Status management note:');
    console.log('  - Statuses are managed through database initialization');
    console.log('  - Custom statuses found in files: ', Array.from(counts.statuses));
    console.log('  - Only default statuses will be available after rebuild');
    console.log('\n🔄 Syncing data to SQLite using ItemRepository...');
    const itemRepo = fullDb.getItemRepository();
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
    console.log('\n🔢 Updating sequences with max IDs...');
    const db = fullDb.getDatabase();
    const allSequences = await db.allAsync('SELECT type FROM sequences', []);
    for (const { type } of allSequences) {
        const result = await db.getAsync('SELECT MAX(CAST(id AS INTEGER)) as max_id FROM items WHERE type = ?', [type]);
        const maxId = result?.max_id || 0;
        await db.runAsync('UPDATE sequences SET current_value = ? WHERE type = ?', [maxId, type]);
        console.log(`  ✅ Updated sequence '${type}' to ${maxId}`);
    }
    const tagRepo = fullDb['tagRepo'];
    const allTags = await tagRepo.getAllTags();
    console.log('\n🏷️  Tags registration:');
    console.log(`  Collected tags: ${JSON.stringify(allTags.map(t => t.name), null, 2)}`);
    console.log('  ✅ Tags were automatically registered during data sync');
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
rebuildDatabase().catch(error => {
    console.error('❌ Database rebuild failed:', error);
    process.exit(1);
});
