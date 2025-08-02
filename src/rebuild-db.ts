#!/usr/bin/env node

/**
 * @ai-context Database rebuild utility that preserves connection
 * @ai-pattern Drops all tables instead of deleting database file
 * @ai-critical Prevents connection loss during rebuild
 * @ai-flow 1. Drop tables -> 2. Reinitialize tables -> 3. Scan files -> 4. Rebuild data
 * @ai-note For forced clean rebuild, manually delete the database file first
 */

import path from 'path';
import { globSync } from 'glob';
import { existsSync, statSync, readFileSync } from 'fs';
import { FileIssueDatabase } from './database/index.js';
import { parseMarkdown } from './utils/markdown-parser.js';

async function dropAllTables(db: any): Promise<void> {
  console.log('🗑️  Dropping all tables...');
  
  // Drop tables in correct order to avoid foreign key constraints
  const tablesToDrop = [
    'items_fts',        // FTS virtual table first
    'related_items',    // Relationship tables
    'item_tags',        
    'type_fields',      // Type metadata
    'items',            // Main data table
    'sequences',        // Type registry
    'tags',             // Reference tables
    'statuses'
  ];

  for (const table of tablesToDrop) {
    try {
      await db.runAsync(`DROP TABLE IF EXISTS ${table}`);
      console.log(`  ✅ Dropped table: ${table}`);
    } catch (error) {
      console.error(`  ⚠️  Failed to drop table ${table}:`, error);
    }
  }
  
  // Also drop any indexes
  const indexes = await db.allAsync(
    "SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'"
  );
  
  for (const index of indexes) {
    try {
      await db.runAsync(`DROP INDEX IF EXISTS ${index.name}`);
      console.log(`  ✅ Dropped index: ${index.name}`);
    } catch (error) {
      console.error(`  ⚠️  Failed to drop index ${index.name}:`, error);
    }
  }
}

async function rebuildDatabase() {
  const databasePath = process.env.MCP_DATABASE_PATH || path.join(process.cwd(), '.shirokuma', 'data');
  const dbPath = path.join(databasePath, 'search.db');

  console.log('🔄 Starting database rebuild...');
  console.log(`📂 Database path: ${databasePath}`);

  // Initialize database connection
  const fullDb = new FileIssueDatabase(databasePath, dbPath);
  
  if (!existsSync(dbPath)) {
    // New database - just initialize normally
    console.log('📝 Creating new database...');
    await fullDb.initialize();
  } else {
    // Existing database - drop tables instead of deleting file
    console.log('🔌 Using existing database connection...');
    await fullDb.initialize();
    
    // Get the raw database connection
    const db = fullDb.getDatabase();
    
    // Drop all tables
    await dropAllTables(db);
    
    // Force re-creation of tables by calling private method
    const connection = (fullDb as any).connection;
    await connection.createTables();
    
    console.log('✅ Tables recreated');
  }

  // Re-initialize repositories after table recreation
  const typeRepo = fullDb['typeRepo'];
  await typeRepo.init();

  // Check for new types by scanning directories
  console.log('\n🔍 Scanning filesystem for types...');
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

      // Determine base type from markdown header or content
      let baseType = 'documents';

      // Check markdown files for 'base' field in header
      const sampleFiles = globSync(path.join(dir, `${typeName}-*.md`)).slice(0, 3);
      for (const file of sampleFiles) {
        try {
          const content = readFileSync(file, 'utf-8');
          const parsed = parseMarkdown(content);

          // Always check for explicit 'base' field first
          if (parsed.metadata.base) {
            baseType = parsed.metadata.base;
            break;
          }

          // Only infer if no explicit base field
          if (parsed.metadata.priority && parsed.metadata.status) {
            baseType = 'tasks';
            break;
          }
        } catch {
          // Skip file if parsing fails
        }
      }

      try {
        await typeRepo.createType(typeName, baseType);
        console.log(`  ✅ Registered type: ${typeName} (base_type: ${baseType})`);
      } catch (error) {
        console.error(`  ⚠️  Failed to register type ${typeName}:`, error);
      }
    }
  }

  // Count items by type
  const counts = {
    typeCountsMap: {} as Record<string, number>,
    tags: new Set<string>(),
    statuses: new Set<string>()
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
          parsed.metadata.tags.forEach((tag: string) => counts.tags.add(tag));
        }
      }
    } else if (type === 'dailies') {
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
          parsed.metadata.tags.forEach((tag: string) => counts.tags.add(tag));
        }
      }
    } else {
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
          parsed.metadata.tags.forEach((tag: string) => counts.tags.add(tag));
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
  console.log('   (Includes migration: related_tasks + related_documents → related)');
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
      } catch (error) {
        console.error(`  ⚠️  Failed to sync ${type}:`, error);
      }
    }
  }
  console.log(`  ✅ Total items synced: ${totalSynced}`);

  // Update sequences to match highest IDs
  console.log('\n🔢 Updating sequences with max IDs...');
  const db = fullDb.getDatabase();

  // Get all types from sequences table, not just those with markdown files
  const allSequences = await db.allAsync(
    'SELECT type FROM sequences',
    []
  ) as { type: string }[];

  for (const { type } of allSequences) {
    // Skip sessions and dailies as they don't use numeric IDs
    if (type === 'sessions' || type === 'dailies') {
      console.log(`  ⏭️  Skipped sequence '${type}' (uses timestamp/date IDs)`);
      continue;
    }

    // Get max ID from items table
    const result = await db.getAsync(
      'SELECT MAX(CAST(id AS INTEGER)) as max_id FROM items WHERE type = ?',
      [type]
    ) as { max_id: number | null };

    const maxId = result?.max_id || 0;

    // Update sequence
    await db.runAsync(
      'UPDATE sequences SET current_value = ? WHERE type = ?',
      [maxId, type]
    );
    console.log(`  ✅ Updated sequence '${type}' to ${maxId}`);
  }

  // Collect and display all tags
  const tagRepo = fullDb['tagRepo'];
  const allTags = await tagRepo.getAllTags();
  console.log('\n🏷️  Tags registration:');
  console.log(`  Collected tags: ${JSON.stringify(allTags.map(t => t.name))}`);
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

  // Check if --write-back flag is provided
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

/**
 * Write migrated data back to Markdown files
 */
async function writeMigratedDataBack(db: FileIssueDatabase, allTypes: any[]): Promise<void> {
  const itemRepo = db.getItemRepository();
  let migratedCount = 0;
  let checkedCount = 0;
  
  for (const typeInfo of allTypes) {
    const type = typeInfo.type;
    
    // Skip types that don't use markdown storage
    if (type === 'sessions' || type === 'dailies') {
      continue;
    }
    
    const items = await itemRepo.getItems(type, true);
    
    for (const item of items) {
      checkedCount++;
      
      // Read the original markdown file to check if it has old fields
      const databasePath = process.env.MCP_DATABASE_PATH || path.join(process.cwd(), '.shirokuma', 'data');
      const filePath = path.join(databasePath, type, `${type}-${item.id}.md`);
      
      try {
        const content = readFileSync(filePath, 'utf-8');
        const parsed = parseMarkdown(content);
        
        // Check if this file has the old fields that need migration
        const hasOldFields = 'related_tasks' in parsed.metadata || 'related_documents' in parsed.metadata;
        
        if (hasOldFields) {
          // Get the migrated item from database
          const fullItem = await itemRepo.getItem(type, item.id);
          
          if (fullItem) {
            // Update will save back to Markdown with new structure
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
      } catch (error) {
        console.error(`  ⚠️  Failed to process ${type} ${item.id}:`, error);
      }
    }
  }
  
  console.log(`\n  📊 Migration Summary:`);
  console.log(`  - Checked: ${checkedCount} files`);
  console.log(`  - Migrated: ${migratedCount} files`);
  console.log(`  - No changes needed: ${checkedCount - migratedCount} files`);
}

// Run rebuild
rebuildDatabase().catch(error => {
  console.error('❌ Database rebuild failed:', error);
  process.exit(1);
});