import * as fs from 'fs';
import * as path from 'path';
import type { WorkSession, DailySummary } from '../types/session-types.js';
import { SessionMarkdownFormatter } from '../formatters/session-markdown-formatter.js';
import type { FileIssueDatabase } from '../database.js';
import { TagRepository } from '../database/tag-repository.js';
import { DatabaseConnection } from '../database/base.js';

/**
 * @ai-context Repository for work session tracking and daily summaries
 * @ai-pattern Date-based directory structure for chronological organization
 * @ai-critical Sessions are time-based records - preserve chronological order
 * @ai-dependencies Formatter for markdown generation, Database for search sync
 * @ai-assumption Sessions organized by date folders (YYYY-MM-DD)
 */
export class SessionRepository {
  private formatter: SessionMarkdownFormatter;

  constructor(
    private sessionsDir: string,
    private db: FileIssueDatabase
  ) {
    this.formatter = new SessionMarkdownFormatter();
    this.ensureSessionsDirectory();  // @ai-logic: Synchronous for simpler constructor
  }

  private ensureSessionsDirectory(): void {
    if (!fs.existsSync(this.sessionsDir)) {
      fs.mkdirSync(this.sessionsDir, { recursive: true });
    }
  }

  ensureDailyDirectory(date: string): string {
    const dailyDir = path.join(this.sessionsDir, date);
    if (!fs.existsSync(dailyDir)) {
      fs.mkdirSync(dailyDir, { recursive: true });
    }
    return dailyDir;
  }

  /**
   * @ai-intent Save work session to markdown file and sync to database
   * @ai-flow 1. Create date directory -> 2. Generate markdown -> 3. Write file -> 4. Sync DB
   * @ai-side-effects Creates directory, writes file, updates SQLite
   * @ai-critical Session IDs include timestamp for uniqueness
   * @ai-error-handling SQLite errors ignored for test compatibility
   * @ai-why Legacy format support for backward compatibility
   */
  saveSession(session: WorkSession): void {
    const dailyDir = this.ensureDailyDirectory(session.date);
    const filePath = path.join(dailyDir, `session-${session.id}.md`);

    // @ai-logic: Choose format based on content richness
    const content = session.tags || session.content
      ? this.formatter.generateSessionMarkdown(session)
      : this.formatter.generateLegacySessionMarkdown(session);

    fs.writeFileSync(filePath, content, 'utf8');

    // @ai-async: Fire-and-forget for performance
    this.db.syncSessionToSQLite(session).catch(err => {
      // @ai-error-recovery: Test environment may have readonly DB
      if (err.message && (err.message.includes('SQLITE_READONLY') || err.message.includes('Failed to ensure tags exist'))) {
        return;
      }
      throw err;
    });
  }

  loadSession(sessionId: string, date: string): WorkSession | null {
    const filePath = path.join(this.sessionsDir, date, `session-${sessionId}.md`);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    return this.formatter.parseSessionFromMarkdown(content, sessionId, date);
  }

  /**
   * @ai-intent Retrieve all sessions for a specific date
   * @ai-flow 1. Check directory -> 2. List session files -> 3. Parse each -> 4. Return array
   * @ai-performance Synchronous reads OK for daily session counts
   * @ai-assumption Session files named 'session-{id}.md'
   * @ai-return Empty array if no sessions or directory missing
   */
  getSessionsForDate(date: string): WorkSession[] {
    const dailyDir = path.join(this.sessionsDir, date);
    if (!fs.existsSync(dailyDir)) {
      return [];  // @ai-edge-case: No sessions for this date
    }

    const sessionFiles = fs.readdirSync(dailyDir)
      .filter(file => file.startsWith('session-') && file.endsWith('.md'));

    const sessions: WorkSession[] = [];
    for (const file of sessionFiles) {
      const sessionId = file.replace('session-', '').replace('.md', '');
      const content = fs.readFileSync(path.join(dailyDir, file), 'utf8');
      const session = this.formatter.parseSessionFromMarkdown(content, sessionId, date);
      sessions.push(session);
    }

    return sessions;
  }

  saveDailySummary(summary: DailySummary): void {
    const dailyDir = this.ensureDailyDirectory(summary.date);
    const filePath = path.join(dailyDir, `daily-summary-${summary.date}.md`);

    // @ai-critical: Check if summary already exists for this date
    if (fs.existsSync(filePath)) {
      throw new Error(`Daily summary for ${summary.date} already exists. Use update instead.`);
    }

    const content = this.formatter.generateDailySummaryMarkdown(summary);
    fs.writeFileSync(filePath, content, 'utf8');

    // Sync to SQLite (fire and forget for tests)
    this.db.syncDailySummaryToSQLite(summary).catch(err => {
      // Ignore SQLite errors in tests
      if (err.message && (err.message.includes('SQLITE_READONLY') || err.message.includes('Failed to ensure tags exist'))) {
        return;
      }
      throw err;
    });
  }

  /**
   * @ai-intent Update existing daily summary by overwriting file
   * @ai-flow 1. Ensure dir exists -> 2. Write file -> 3. Sync to SQLite
   * @ai-side-effects Overwrites existing file, updates SQLite
   * @ai-validation Caller must ensure summary exists
   */
  updateDailySummary(summary: DailySummary): void {
    const dailyDir = this.ensureDailyDirectory(summary.date);
    const filePath = path.join(dailyDir, `daily-summary-${summary.date}.md`);

    const content = this.formatter.generateDailySummaryMarkdown(summary);
    fs.writeFileSync(filePath, content, 'utf8');

    // Sync to SQLite (fire and forget for tests)
    this.db.syncDailySummaryToSQLite(summary).catch(err => {
      // Ignore SQLite errors in tests
      if (err.message && (err.message.includes('SQLITE_READONLY') || err.message.includes('Failed to ensure tags exist'))) {
        return;
      }
      throw err;
    });
  }

  loadDailySummary(date: string): DailySummary | null {
    const filePath = path.join(this.sessionsDir, date, `daily-summary-${date}.md`);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    return this.formatter.parseDailySummaryFromMarkdown(content, date);
  }

  /**
   * @ai-intent Find all sessions tagged with specific tag across all dates
   * @ai-flow 1. Scan date dirs -> 2. Read files -> 3. Quick tag check -> 4. Full parse if match
   * @ai-performance O(n) where n is total session count - consider indexing for scale
   * @ai-logic Regex parsing for performance vs full markdown parse
   * @ai-assumption Tags in frontmatter follow specific format
   * @ai-edge-case Non-directory files in sessions folder ignored
   */
  searchSessionsByTag(tag: string): WorkSession[] {
    const results: WorkSession[] = [];

    if (!fs.existsSync(this.sessionsDir)) {
      return results;  // @ai-edge-case: No sessions directory yet
    }

    const dateDirs = fs.readdirSync(this.sessionsDir);
    for (const dateDir of dateDirs) {
      const datePath = path.join(this.sessionsDir, dateDir);
      if (!fs.statSync(datePath).isDirectory()) {
        continue;
      }  // @ai-logic: Skip non-directories

      const sessionFiles = fs.readdirSync(datePath)
        .filter(f => f.startsWith('session-') && f.endsWith('.md'));

      for (const sessionFile of sessionFiles) {
        const sessionPath = path.join(datePath, sessionFile);
        const content = fs.readFileSync(sessionPath, 'utf8');

        // @ai-performance: Quick regex check before full parse
        const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (frontMatterMatch) {
          const frontMatter = frontMatterMatch[1];
          const tagsMatch = frontMatter.match(/tags: \[(.*)\]/);
          if (tagsMatch) {
            const tags = tagsMatch[1].split(', ').map(t => t.replace(/"/g, ''));
            if (tags.includes(tag)) {
              // @ai-logic: Only full parse if tag matches
              const sessionId = sessionFile.replace('.md', '').replace('session-', '');
              const session = this.formatter.parseSessionFromMarkdown(content, sessionId, dateDir);
              results.push(session);
            }
          }
        }
      }
    }

    return results;
  }

  searchSessionsFullText(query: string): WorkSession[] {
    const results: WorkSession[] = [];

    if (!fs.existsSync(this.sessionsDir)) {
      return results;
    }

    const dateDirs = fs.readdirSync(this.sessionsDir);
    for (const dateDir of dateDirs) {
      const datePath = path.join(this.sessionsDir, dateDir);
      if (!fs.statSync(datePath).isDirectory()) {
        continue;
      }

      const sessionFiles = fs.readdirSync(datePath)
        .filter(f => f.startsWith('session-') && f.endsWith('.md'));

      for (const sessionFile of sessionFiles) {
        const sessionPath = path.join(datePath, sessionFile);
        const content = fs.readFileSync(sessionPath, 'utf8');

        if (content.toLowerCase().includes(query.toLowerCase())) {
          const sessionId = sessionFile.replace('.md', '').replace('session-', '');
          const session = this.formatter.parseSessionFromMarkdown(content, sessionId, dateDir);
          results.push(session);
        }
      }
    }

    return results;
  }

  getSessions(startDate?: string, endDate?: string): WorkSession[] {
    const results: WorkSession[] = [];

    if (!fs.existsSync(this.sessionsDir)) {
      return results;
    }

    // If no dates specified, return today's sessions
    if (!startDate && !endDate) {
      const today = new Date().toISOString().split('T')[0];
      return this.getSessionsForDate(today);
    }

    const dateDirs = fs.readdirSync(this.sessionsDir)
      .filter(dir => fs.statSync(path.join(this.sessionsDir, dir)).isDirectory())
      .sort(); // Ensure chronological order

    for (const dateDir of dateDirs) {
      // Skip if before start date
      if (startDate && dateDir < startDate) {
        continue;
      }
      // Skip if after end date
      if (endDate && dateDir > endDate) {
        continue;
      }

      const sessions = this.getSessionsForDate(dateDir);
      results.push(...sessions);
    }

    return results;
  }

  getSessionDetail(sessionId: string): WorkSession | null {
    if (!fs.existsSync(this.sessionsDir)) {
      return null;
    }

    // Search all date directories for the session
    const dateDirs = fs.readdirSync(this.sessionsDir)
      .filter(dir => fs.statSync(path.join(this.sessionsDir, dir)).isDirectory());

    for (const dateDir of dateDirs) {
      const session = this.loadSession(sessionId, dateDir);
      if (session) {
        return session;
      }
    }

    return null;
  }

  getDailySummaries(startDate?: string, endDate?: string): DailySummary[] {
    const results: DailySummary[] = [];

    if (!fs.existsSync(this.sessionsDir)) {
      return results;
    }

    // If no dates specified, return last 7 days of summaries
    if (!startDate && !endDate) {
      const today = new Date();
      endDate = today.toISOString().split('T')[0];
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 6); // 7 days including today
      startDate = weekAgo.toISOString().split('T')[0];
    }

    const dateDirs = fs.readdirSync(this.sessionsDir)
      .filter(dir => fs.statSync(path.join(this.sessionsDir, dir)).isDirectory())
      .sort(); // Ensure chronological order

    for (const dateDir of dateDirs) {
      // Skip if before start date
      if (startDate && dateDir < startDate) {
        continue;
      }
      // Skip if after end date
      if (endDate && dateDir > endDate) {
        continue;
      }

      const summary = this.loadDailySummary(dateDir);
      if (summary) {
        results.push(summary);
      }
    }

    return results;
  }
}