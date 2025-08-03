/**
 * @ai-context Integration tests for database rebuild functionality
 * @ai-pattern End-to-end test of rebuild-db.ts script
 * @ai-critical Validates complete rebuild workflow
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { FileIssueDatabase } from '../../src/database/index.js';

describe('Database Rebuild Integration', () => {
  let tempDir: string;
  let database: FileIssueDatabase;

  beforeEach(async () => {
    // Create temp directory
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-rebuild-int-'));
    
    // Create subdirectories
    await fs.mkdir(path.join(tempDir, '.shirokuma/data/issues'), { recursive: true });
    await fs.mkdir(path.join(tempDir, '.shirokuma/data/plans'), { recursive: true });
    await fs.mkdir(path.join(tempDir, '.shirokuma/data/docs'), { recursive: true });
    await fs.mkdir(path.join(tempDir, '.shirokuma/data/knowledge'), { recursive: true });
    await fs.mkdir(path.join(tempDir, '.shirokuma/data/sessions/2025-07-27'), { recursive: true });
  });

  afterEach(async () => {
    // データベースは各テストで必要に応じて作成されるため、
    // 存在する場合のみクローズ
    if (database) {
      try {
        database.close();
      } catch (error) {
        // Already closed, ignore
      }
      database = undefined;
    }
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  async function runRebuildScript(dataPath: string): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const env = { 
        ...process.env, 
        MCP_DATABASE_PATH: dataPath,
        NODE_ENV: 'test',
        MCP_MODE: 'false'
      };
      const child = spawn('npx', ['tsx', 'src/rebuild-db.ts'], { 
        env,
        cwd: process.cwd()
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => stdout += data.toString());
      child.stderr.on('data', (data) => stderr += data.toString());
      
      child.on('error', reject);
      child.on('exit', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`rebuild-db.ts exited with code ${code}\nstdout: ${stdout}\nstderr: ${stderr}`));
        }
      });
    });
  }

  it('should rebuild database from markdown files', async () => {
    const dataPath = path.join(tempDir, '.shirokuma/data');
    
    // Create test markdown files
    await fs.writeFile(
      path.join(dataPath, 'issues/issues-1.md'),
      `---
title: Test Issue
description: Issue description
priority: high
status: In Progress
tags: ["bug", "urgent"]
related: ["plans-1"]
created_at: 2025-01-01T00:00:00Z
updated_at: 2025-01-02T00:00:00Z
---

This is the issue content.`,
      'utf-8'
    );

    await fs.writeFile(
      path.join(dataPath, 'plans/plans-1.md'),
      `---
title: Q1 Plan
description: Quarterly plan
priority: medium
status: Open
start_date: 2025-01-01
end_date: 2025-03-31
tags: ["planning", "q1-2025"]
related: ["issues-1"]
---

Plan details here.`,
      'utf-8'
    );

    await fs.writeFile(
      path.join(dataPath, 'docs/docs-1.md'),
      `---
title: API Documentation
tags: ["docs", "api"]
---

# API Documentation

This is the documentation content.`,
      'utf-8'
    );

    await fs.writeFile(
      path.join(dataPath, 'knowledge/knowledge-1.md'),
      `---
title: Best Practices
tags: ["knowledge", "practices"]
---

Knowledge content here.`,
      'utf-8'
    );

    await fs.writeFile(
      path.join(dataPath, 'sessions/2025-07-27/sessions-2025-07-27-10.00.00.000.md'),
      `---
title: Morning Session
tags: ["work", "coding"]
related_tasks: ["issues-1"]
---

Session notes.`,
      'utf-8'
    );

    await fs.writeFile(
      path.join(dataPath, 'sessions/2025-07-27/dailies-2025-07-27.md'),
      `---
title: Daily Summary
tags: ["summary", "daily"]
related_tasks: ["issues-1", "plans-1"]
related_documents: ["docs-1"]
---

Today's summary.`,
      'utf-8'
    );

    // Run rebuild script
    const { stdout, stderr } = await runRebuildScript(dataPath);
    
    // Verify output
    expect(stdout).toContain('Starting database rebuild');
    expect(stdout).toContain('Creating new database');
    expect(stdout).toContain('Scanning issues');
    expect(stdout).toContain('Scanning plans');
    expect(stdout).toContain('Scanning docs');
    expect(stdout).toContain('Scanning knowledge');
    expect(stdout).toContain('Synced 1 issues items');
    expect(stdout).toContain('Synced 1 plans items');
    expect(stdout).toContain('Synced 1 docs items');
    expect(stdout).toContain('Synced 1 knowledge items');
    expect(stdout).toContain('Database rebuild successful!');
    
    // Open database and verify data
    database = new FileIssueDatabase(dataPath, path.join(dataPath, 'search.db'));
    await database.initialize();
    
    // Verify issues
    const issues = await database.getAllIssuesSummary(true);
    expect(issues).toHaveLength(1);
    expect(issues[0].title).toBe('Test Issue');
    expect(issues[0].tags).toEqual(['bug', 'urgent']);
    
    // Verify plans
    const plans = await database.getAllPlansSummary();
    expect(plans).toHaveLength(1);
    expect(plans[0].title).toBe('Q1 Plan');
    // ListItem doesn't have start_date field - only available in detail view
    // expect(plans[0].start_date).toBe('2025-01-01');
    
    // Verify documents
    const docs = await database.getAllDocumentsSummary('docs');
    expect(docs).toHaveLength(1);
    expect(docs[0].title).toBe('API Documentation');
    
    // Verify knowledge
    const knowledge = await database.getAllDocumentsSummary('knowledge');
    expect(knowledge).toHaveLength(1);
    expect(knowledge[0].title).toBe('Best Practices');
    
    // Verify tags were registered
    const tags = await database.getAllTags();
    const tagNames = tags.map(t => t.name).sort();
    expect(tagNames).toContain('bug');
    expect(tagNames).toContain('urgent');
    expect(tagNames).toContain('planning');
    expect(tagNames).toContain('docs');
    expect(tagNames).toContain('api');
  });

  it('should handle empty database rebuild', async () => {
    const dataPath = path.join(tempDir, '.shirokuma/data');
    
    // Run rebuild with no markdown files
    const { stdout } = await runRebuildScript(dataPath);
    
    expect(stdout).toContain('Starting database rebuild');
    expect(stdout).toContain('Creating new database');
    expect(stdout).toContain('Total items synced: 0');
    expect(stdout).toContain('Database rebuild successful!');
  });

  it('should update sequences correctly', async () => {
    const dataPath = path.join(tempDir, '.shirokuma/data');
    
    // Create files with higher IDs
    await fs.writeFile(
      path.join(dataPath, 'issues/issues-5.md'),
      `---
title: Issue 5
status: Open
---
Content`,
      'utf-8'
    );

    await fs.writeFile(
      path.join(dataPath, 'issues/issues-10.md'),
      `---
title: Issue 10
status: Open
---
Content`,
      'utf-8'
    );

    // Run rebuild
    await runRebuildScript(dataPath);
    
    // Open database and create new item
    database = new FileIssueDatabase(dataPath, path.join(dataPath, 'search.db'));
    await database.initialize();
    
    const newIssue = await database.createIssue(
      'New Issue',
      'New content',
      'low',
      'Open'
    );
    
    // Should get ID 11, not 1 or 3
    expect(newIssue.id).toBe(11);
  });

  it('should handle malformed files gracefully', async () => {
    const dataPath = path.join(tempDir, '.shirokuma/data');
    
    // Create valid file
    await fs.writeFile(
      path.join(dataPath, 'docs/docs-1.md'),
      `---
title: Valid Doc
---
Content`,
      'utf-8'
    );

    // Create malformed files
    await fs.writeFile(
      path.join(dataPath, 'docs/docs-2.md'),
      'No frontmatter here',
      'utf-8'
    );

    await fs.writeFile(
      path.join(dataPath, 'docs/invalid-name.md'),
      `---
title: Wrong filename
---
Content`,
      'utf-8'
    );

    // Run rebuild
    const { stdout } = await runRebuildScript(dataPath);
    
    expect(stdout).toContain('Synced 1 docs items');
    expect(stdout).toContain('Database rebuild successful!');
    
    // Verify only valid file was synced
    database = new FileIssueDatabase(dataPath, path.join(dataPath, 'search.db'));
    await database.initialize();
    
    const docs = await database.getAllDocumentsSummary('docs');
    expect(docs).toHaveLength(1);
    expect(docs[0].title).toBe('Valid Doc');
  });

  it('should register custom types found in filesystem', async () => {
    const dataPath = path.join(tempDir, '.shirokuma/data');
    
    // Create custom type directory
    await fs.mkdir(path.join(dataPath, 'research'), { recursive: true });
    
    // Create file for custom type
    await fs.writeFile(
      path.join(dataPath, 'research/research-1.md'),
      `---
title: Research Topic
tags: ["research", "ai"]
---
Research content`,
      'utf-8'
    );

    // Run rebuild
    const { stdout } = await runRebuildScript(dataPath);
    
    expect(stdout).toContain('Found unregistered type: research');
    expect(stdout).toContain('Registered type: research');
    expect(stdout).toContain('Synced 1 research items');
    
    // Verify type was registered
    database = new FileIssueDatabase(dataPath, path.join(dataPath, 'search.db'));
    await database.initialize();
    
    const types = await database.getTypes();
    expect(types.documents).toContain('research');
  });
});