#!/usr/bin/env node
if (process.argv[1] && (process.argv[1].endsWith('rebuild-db.ts') || process.argv[1].endsWith('rebuild-db.js'))) {
    process.env.NODE_ENV = 'development';
    process.env.MCP_MODE = 'false';
}
import path from 'path';
import { globSync } from 'glob';
import { existsSync, statSync, readFileSync } from 'fs';
import { FileIssueDatabase } from './database/index.js';
import { parseMarkdown } from './utils/markdown-parser.js';
async function dropAllTables(db) {
    console.log('🗑️  Dropping all tables...');
    const tablesToDrop = [
        'items_fts',
        'related_items',
        'item_tags',
        'type_fields',
        'items',
        'sequences',
        'tags',
        'statuses'
    ];
    for (const table of tablesToDrop) {
        try {
            await db.runAsync(`DROP TABLE IF EXISTS ${table}`);
            console.log(`  ✅ Dropped table: ${table}`);
        }
        catch (error) {
            console.error(`  ⚠️  Failed to drop table ${table}:`, error);
        }
    }
    const indexes = await db.allAsync("SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'");
    for (const index of indexes) {
        try {
            await db.runAsync(`DROP INDEX IF EXISTS ${index.name}`);
            console.log(`  ✅ Dropped index: ${index.name}`);
        }
        catch (error) {
            console.error(`  ⚠️  Failed to drop index ${index.name}:`, error);
        }
    }
}
async function rebuildDatabase() {
    const databasePath = process.env.MCP_DATABASE_PATH || path.join(process.cwd(), '.shirokuma', 'data');
    const dbPath = path.join(databasePath, 'search.db');
    console.log('🔄 Starting database rebuild...');
    console.log(`📂 Database path: ${databasePath}`);
    const fullDb = new FileIssueDatabase(databasePath, dbPath);
    if (!existsSync(dbPath)) {
        console.log('📝 Creating new database...');
        await fullDb.initialize();
    }
    else {
        console.log('🔌 Using existing database connection...');
        await fullDb.initialize();
        const db = fullDb.getDatabase();
        await dropAllTables(db);
        const connection = fullDb.connection;
        await connection.createTables();
        console.log('✅ Tables recreated');
    }
    const typeRepo = fullDb['typeRepo'];
    await typeRepo.init();
    console.log('\n🔍 Scanning filesystem for types...');
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
    console.log('   (Includes migration: related_tasks + related_documents → related)');
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
        if (type === 'sessions' || type === 'dailies') {
            console.log(`  ⏭️  Skipped sequence '${type}' (uses timestamp/date IDs)`);
            continue;
        }
        const result = await db.getAsync('SELECT MAX(CAST(id AS INTEGER)) as max_id FROM items WHERE type = ?', [type]);
        const maxId = result?.max_id || 0;
        const filesPattern = path.join(databasePath, type, `${type}-*.md`);
        const files = globSync(filesPattern);
        let maxFileId = 0;
        for (const file of files) {
            const basename = path.basename(file);
            const match = basename.match(new RegExp(`^${type}-(\\d+)\\.md$`));
            if (match) {
                const fileId = parseInt(match[1], 10);
                if (fileId > maxFileId) {
                    maxFileId = fileId;
                }
            }
        }
        if (maxFileId > maxId) {
            console.log(`  ⚠️  Warning: Found file ${type}-${maxFileId}.md but max ID in DB is ${maxId}`);
            console.log(`     This suggests some files were not imported during rebuild`);
        }
        const sequenceValue = Math.max(maxId, maxFileId);
        await db.runAsync('UPDATE sequences SET current_value = ? WHERE type = ?', [sequenceValue, type]);
        console.log(`  ✅ Updated sequence '${type}' to ${sequenceValue} (DB max: ${maxId}, File max: ${maxFileId})`);
    }
    const tagRepo = fullDb['tagRepo'];
    const allTags = await tagRepo.getAllTags();
    console.log('\n🏷️  Tags registration:');
    console.log(`  Collected tags: ${JSON.stringify(allTags.map(t => t.name))}`);
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
    if (process.argv.includes('--write-back')) {
        console.log('\n📝 Writing migrated data back to Markdown files...');
        await writeMigratedDataBack(fullDb, allTypes);
    }
    console.log('\n✨ Database rebuild successful!');
    console.log('\n💡 Tip: Connection was preserved - no need to restart MCP server.');
    console.log('💡 For forced clean rebuild, delete the database file first: rm [path]/search.db');
    if (!process.argv.includes('--write-back')) {
        console.log('\n💡 Note: To update Markdown files with migrated related fields, run with --write-back flag');
    }
    await fullDb.close();
}
async function writeMigratedDataBack(db, allTypes) {
    const itemRepo = db.getItemRepository();
    let migratedCount = 0;
    let checkedCount = 0;
    for (const typeInfo of allTypes) {
        const type = typeInfo.type;
        if (type === 'sessions' || type === 'dailies') {
            continue;
        }
        const items = await itemRepo.getItems(type, true);
        for (const item of items) {
            checkedCount++;
            const databasePath = process.env.MCP_DATABASE_PATH || path.join(process.cwd(), '.shirokuma', 'data');
            const filePath = path.join(databasePath, type, `${type}-${item.id}.md`);
            try {
                const content = readFileSync(filePath, 'utf-8');
                const parsed = parseMarkdown(content);
                const hasOldFields = 'related_tasks' in parsed.metadata || 'related_documents' in parsed.metadata;
                if (hasOldFields) {
                    const fullItem = await itemRepo.getItem(type, item.id);
                    if (fullItem) {
                        await itemRepo.updateItem({
                            type: fullItem.type,
                            id: fullItem.id,
                            title: fullItem.title,
                            description: fullItem.description,
                            content: fullItem.content,
                            tags: fullItem.tags,
                            status: fullItem.status,
                            priority: fullItem.priority,
                            related: fullItem.related,
                            start_date: fullItem.start_date,
                            end_date: fullItem.end_date
                        });
                        migratedCount++;
                        console.log(`  ✅ Migrated ${type} ${item.id}: ${parsed.metadata.related_tasks || []} + ${parsed.metadata.related_documents || []} → ${fullItem.related}`);
                    }
                }
            }
            catch (error) {
                console.error(`  ⚠️  Failed to process ${type} ${item.id}:`, error);
            }
        }
    }
    console.log('\n  📊 Migration Summary:');
    console.log(`  - Checked: ${checkedCount} files`);
    console.log(`  - Migrated: ${migratedCount} files`);
    console.log(`  - No changes needed: ${checkedCount - migratedCount} files`);
}
export async function rebuildFromMarkdown(dbPath) {
    const databasePath = path.dirname(dbPath);
    console.log('🔄 Starting automatic database rebuild from markdown files...');
    console.log(`📂 Database path: ${databasePath}`);
    const fullDb = new FileIssueDatabase(databasePath, dbPath);
    await fullDb.initialize();
    const typeRepo = fullDb['typeRepo'];
    await typeRepo.init();
    console.log('\n🔍 Scanning filesystem for types...');
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
        return dirName !== 'sessions' && dirName !== 'state' && dirName !== 'current_state.md';
    });
    const typeMapping = {
        issues: 'tasks',
        plans: 'tasks',
        docs: 'documents',
        knowledge: 'documents',
        decisions: 'documents',
        features: 'documents'
    };
    for (const dir of dirs) {
        const typeName = path.basename(dir);
        const baseType = typeMapping[typeName] || 'documents';
        if (!existingTypeNames.has(typeName)) {
            try {
                await typeRepo.createType(typeName, baseType);
                console.log(`  ✅ Registered type: ${typeName} (base_type: ${baseType})`);
            }
            catch (error) {
                console.error(`  ⚠️  Failed to register type ${typeName}:`, error);
            }
        }
    }
    console.log('\n🔄 Syncing data to SQLite using ItemRepository...');
    const itemRepo = fullDb.getItemRepository();
    const allTypes = await typeRepo.getAllTypes();
    allTypes.push({ type: 'sessions', base_type: 'sessions' });
    allTypes.push({ type: 'dailies', base_type: 'documents' });
    let totalSynced = 0;
    for (const typeInfo of allTypes) {
        const type = typeInfo.type;
        const count = await itemRepo.rebuildFromMarkdown(type);
        totalSynced += count;
        console.log(`  ✅ ${type}: ${count} items`);
    }
    console.log(`\n✅ Database rebuild complete! Total items: ${totalSynced}`);
}
const isMainModule = process.argv[1] &&
    (process.argv[1].endsWith('rebuild-db.js') || process.argv[1].endsWith('rebuild-db.ts'));
if (isMainModule) {
    rebuildDatabase().catch(error => {
        console.error('❌ Database rebuild failed:', error);
        process.exit(1);
    });
}
