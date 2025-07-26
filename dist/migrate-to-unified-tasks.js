#!/usr/bin/env node
/**
 * @ai-context Migration script to unify issues and plans into tasks
 * @ai-pattern One-time migration with safety checks
 * @ai-critical Preserves existing data while transforming structure
 * @ai-flow 1. Create new tables -> 2. Migrate data -> 3. Update sequences
 */
import { Database as SQLiteDatabase } from 'sqlite3';
import { promisify } from 'util';
import { getConfig } from './config.js';
async function migrateToUnifiedTasks() {
    console.log('🔄 Starting migration to unified tasks...\n');
    const config = getConfig();
    const dbPath = config.database.sqlitePath;
    // Open database
    const db = new SQLiteDatabase(dbPath);
    const runAsync = promisify(db.run.bind(db));
    const allAsync = promisify(db.all.bind(db));
    const getAsync = promisify(db.get.bind(db));
    const stats = {
        issues: { success: 0, failed: 0 },
        plans: { success: 0, failed: 0 },
        tags: { success: 0, failed: 0 }
    };
    try {
        // Check if migration already done
        const tableCheck = await getAsync("SELECT name FROM sqlite_master WHERE type='table' AND name='search_tasks'");
        if (tableCheck) {
            console.log('⚠️  Migration already completed - search_tasks table exists');
            return;
        }
        console.log('📋 Creating unified search_tasks table...');
        await runAsync(`
      CREATE TABLE IF NOT EXISTS search_tasks (
        type TEXT NOT NULL,
        id INTEGER NOT NULL,
        title TEXT,
        summary TEXT,
        content TEXT,
        priority TEXT,
        status_id INTEGER,
        start_date TEXT,
        end_date TEXT,
        tags TEXT,
        created_at TEXT,
        updated_at TEXT,
        PRIMARY KEY (type, id)
      )
    `);
        console.log('📋 Creating unified task_tags table...');
        await runAsync(`
      CREATE TABLE IF NOT EXISTS task_tags (
        task_type TEXT NOT NULL,
        task_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        PRIMARY KEY (task_type, task_id, tag_id),
        FOREIGN KEY (task_type, task_id) REFERENCES search_tasks(type, id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      )
    `);
        // Create indexes
        console.log('🔍 Creating indexes...');
        await runAsync(`CREATE INDEX IF NOT EXISTS idx_tasks_text ON search_tasks(title, content)`);
        await runAsync(`CREATE INDEX IF NOT EXISTS idx_tasks_type ON search_tasks(type)`);
        await runAsync(`CREATE INDEX IF NOT EXISTS idx_task_tags_task ON task_tags(task_type, task_id)`);
        await runAsync(`CREATE INDEX IF NOT EXISTS idx_task_tags_tag ON task_tags(tag_id)`);
        // Migrate issues
        console.log('\n📦 Migrating issues...');
        const issues = await allAsync('SELECT * FROM search_issues');
        console.log(`  Found ${issues.length} issues to migrate`);
        for (const issue of issues) {
            try {
                await runAsync(`INSERT INTO search_tasks (type, id, title, summary, content, priority, status_id, start_date, end_date, tags, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, ['issues', issue.id, issue.title, issue.summary, issue.content, issue.priority,
                    issue.status_id, issue.start_date, issue.end_date, issue.tags, issue.created_at, issue.updated_at]);
                stats.issues.success++;
            }
            catch (error) {
                console.error(`  ❌ Failed to migrate issue ${issue.id}:`, error);
                stats.issues.failed++;
            }
        }
        // Migrate issue tags
        console.log('📦 Migrating issue tags...');
        const issueTags = await allAsync('SELECT * FROM issue_tags');
        for (const tag of issueTags) {
            try {
                await runAsync('INSERT INTO task_tags (task_type, task_id, tag_id) VALUES (?, ?, ?)', ['issues', tag.issue_id, tag.tag_id]);
                stats.tags.success++;
            }
            catch (error) {
                console.error(`  ❌ Failed to migrate issue tag:`, error);
                stats.tags.failed++;
            }
        }
        // Migrate plans
        console.log('\n📦 Migrating plans...');
        const plans = await allAsync('SELECT * FROM search_plans');
        console.log(`  Found ${plans.length} plans to migrate`);
        for (const plan of plans) {
            try {
                await runAsync(`INSERT INTO search_tasks (type, id, title, summary, content, priority, status_id, start_date, end_date, tags, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, ['plans', plan.id, plan.title, plan.summary, plan.content, plan.priority,
                    plan.status_id, plan.start_date, plan.end_date, plan.tags, plan.created_at, plan.updated_at]);
                stats.plans.success++;
            }
            catch (error) {
                console.error(`  ❌ Failed to migrate plan ${plan.id}:`, error);
                stats.plans.failed++;
            }
        }
        // Migrate plan tags
        console.log('📦 Migrating plan tags...');
        const planTags = await allAsync('SELECT * FROM plan_tags');
        for (const tag of planTags) {
            try {
                await runAsync('INSERT INTO task_tags (task_type, task_id, tag_id) VALUES (?, ?, ?)', ['plans', tag.plan_id, tag.tag_id]);
                stats.tags.success++;
            }
            catch (error) {
                console.error(`  ❌ Failed to migrate plan tag:`, error);
                stats.tags.failed++;
            }
        }
        // Update sequences base_type
        console.log('\n🔧 Updating sequences base_type...');
        await runAsync("UPDATE sequences SET base_type = 'tasks' WHERE type IN ('issues', 'plans')");
        console.log('\n✅ Migration completed!');
        console.log('📊 Migration Statistics:');
        console.log(`  Issues: ${stats.issues.success} success, ${stats.issues.failed} failed`);
        console.log(`  Plans: ${stats.plans.success} success, ${stats.plans.failed} failed`);
        console.log(`  Tags: ${stats.tags.success} success, ${stats.tags.failed} failed`);
        console.log('\n⚠️  Note: Old tables (search_issues, search_plans, issue_tags, plan_tags) are preserved.');
        console.log('    You can drop them manually after verifying the migration.');
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
    finally {
        db.close();
    }
}
// Run migration
migrateToUnifiedTasks().catch(console.error);
//# sourceMappingURL=migrate-to-unified-tasks.js.map