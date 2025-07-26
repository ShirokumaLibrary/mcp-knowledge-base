import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { Database as SQLiteDatabase } from 'sqlite3';
import { promisify } from 'util';
describe('Migration to unified tasks', () => {
    let testDir;
    let dbPath;
    let db;
    let runAsync;
    let allAsync;
    let getAsync;
    beforeEach(async () => {
        // Create test directory
        testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mcp-migration-test-'));
        dbPath = path.join(testDir, 'test.db');
        // Create database with old structure
        db = new SQLiteDatabase(dbPath);
        runAsync = promisify(db.run.bind(db));
        allAsync = promisify(db.all.bind(db));
        getAsync = promisify(db.get.bind(db));
        // Create old tables
        await runAsync(`
      CREATE TABLE search_issues (
        id INTEGER PRIMARY KEY,
        title TEXT,
        summary TEXT,
        content TEXT,
        priority TEXT,
        status_id INTEGER,
        start_date TEXT,
        end_date TEXT,
        tags TEXT,
        created_at TEXT,
        updated_at TEXT
      )
    `);
        await runAsync(`
      CREATE TABLE search_plans (
        id INTEGER PRIMARY KEY,
        title TEXT,
        summary TEXT,
        content TEXT,
        priority TEXT,
        status_id INTEGER,
        start_date TEXT,
        end_date TEXT,
        tags TEXT,
        created_at TEXT,
        updated_at TEXT
      )
    `);
        await runAsync(`
      CREATE TABLE tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
        await runAsync(`
      CREATE TABLE issue_tags (
        issue_id INTEGER,
        tag_id INTEGER,
        PRIMARY KEY (issue_id, tag_id)
      )
    `);
        await runAsync(`
      CREATE TABLE plan_tags (
        plan_id INTEGER,
        tag_id INTEGER,
        PRIMARY KEY (plan_id, tag_id)
      )
    `);
        await runAsync(`
      CREATE TABLE sequences (
        type TEXT PRIMARY KEY,
        current_value INTEGER DEFAULT 0,
        base_type TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Insert test data
        await runAsync("INSERT INTO tags (name) VALUES ('bug'), ('feature'), ('milestone')");
        await runAsync("INSERT INTO sequences (type, current_value, base_type) VALUES ('issues', 2, 'issues'), ('plans', 1, 'plans')");
        await runAsync(`
      INSERT INTO search_issues (id, title, summary, content, priority, status_id, tags, created_at, updated_at)
      VALUES (1, 'Test Issue 1', 'Summary 1', 'Content 1', 'high', 1, '["bug"]', '2025-01-01', '2025-01-01')
    `);
        await runAsync(`
      INSERT INTO search_issues (id, title, summary, content, priority, status_id, tags, created_at, updated_at)
      VALUES (2, 'Test Issue 2', 'Summary 2', 'Content 2', 'low', 2, '["feature"]', '2025-01-02', '2025-01-02')
    `);
        await runAsync(`
      INSERT INTO search_plans (id, title, summary, content, priority, status_id, start_date, end_date, tags, created_at, updated_at)
      VALUES (1, 'Test Plan 1', 'Plan Summary', 'Plan Content', 'medium', 1, '2025-02-01', '2025-03-01', '["milestone"]', '2025-01-03', '2025-01-03')
    `);
        await runAsync("INSERT INTO issue_tags (issue_id, tag_id) VALUES (1, 1), (2, 2)");
        await runAsync("INSERT INTO plan_tags (plan_id, tag_id) VALUES (1, 3)");
    });
    afterEach(async () => {
        db.close();
        await fs.rm(testDir, { recursive: true, force: true });
    });
    it('should have correct test data setup', async () => {
        const issues = await allAsync('SELECT * FROM search_issues');
        expect(issues).toHaveLength(2);
        const plans = await allAsync('SELECT * FROM search_plans');
        expect(plans).toHaveLength(1);
        const tags = await allAsync('SELECT * FROM tags');
        expect(tags).toHaveLength(3);
    });
    it('should migrate to unified structure', async () => {
        // Create new tables
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
        await runAsync(`
      CREATE TABLE IF NOT EXISTS task_tags (
        task_type TEXT NOT NULL,
        task_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        PRIMARY KEY (task_type, task_id, tag_id)
      )
    `);
        // Migrate issues
        const issues = await allAsync('SELECT * FROM search_issues');
        for (const issue of issues) {
            await runAsync(`INSERT INTO search_tasks (type, id, title, summary, content, priority, status_id, start_date, end_date, tags, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, ['issues', issue.id, issue.title, issue.summary, issue.content, issue.priority,
                issue.status_id, issue.start_date, issue.end_date, issue.tags, issue.created_at, issue.updated_at]);
        }
        // Migrate plans
        const plans = await allAsync('SELECT * FROM search_plans');
        for (const plan of plans) {
            await runAsync(`INSERT INTO search_tasks (type, id, title, summary, content, priority, status_id, start_date, end_date, tags, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, ['plans', plan.id, plan.title, plan.summary, plan.content, plan.priority,
                plan.status_id, plan.start_date, plan.end_date, plan.tags, plan.created_at, plan.updated_at]);
        }
        // Migrate tags
        const issueTags = await allAsync('SELECT * FROM issue_tags');
        for (const tag of issueTags) {
            await runAsync('INSERT INTO task_tags (task_type, task_id, tag_id) VALUES (?, ?, ?)', ['issues', tag.issue_id, tag.tag_id]);
        }
        const planTags = await allAsync('SELECT * FROM plan_tags');
        for (const tag of planTags) {
            await runAsync('INSERT INTO task_tags (task_type, task_id, tag_id) VALUES (?, ?, ?)', ['plans', tag.plan_id, tag.tag_id]);
        }
        // Update sequences
        await runAsync("UPDATE sequences SET base_type = 'tasks' WHERE type IN ('issues', 'plans')");
        // Verify migration
        const tasks = await allAsync('SELECT * FROM search_tasks ORDER BY type, id');
        expect(tasks).toHaveLength(3);
        expect(tasks[0].type).toBe('issues');
        expect(tasks[0].id).toBe(1);
        expect(tasks[0].title).toBe('Test Issue 1');
        expect(tasks[2].type).toBe('plans');
        expect(tasks[2].title).toBe('Test Plan 1');
        const taskTags = await allAsync('SELECT * FROM task_tags ORDER BY task_type, task_id');
        expect(taskTags).toHaveLength(3);
        const sequences = await allAsync('SELECT * FROM sequences WHERE type IN ("issues", "plans")');
        expect(sequences).toHaveLength(2);
        expect(sequences[0].base_type).toBe('tasks');
        expect(sequences[1].base_type).toBe('tasks');
    });
});
//# sourceMappingURL=migration.test.js.map