import { SessionMarkdownFormatter } from '../session-markdown-formatter.js';
import type { Session, Daily } from '../../types/session-types.js';

describe('SessionMarkdownFormatter', () => {
  let formatter: SessionMarkdownFormatter;

  beforeEach(() => {
    formatter = new SessionMarkdownFormatter();
  });

  describe('generateSessionMarkdown', () => {
    it('should generate markdown with basic session data', () => {
      const session: Session = {
        id: 'session-123',
        title: 'Test Session',
        date: '2025-01-29',
        createdAt: '2025-01-29T10:00:00Z',
        content: 'This is the session content.'
      };

      const markdown = formatter.generateSessionMarkdown(session);
      
      expect(markdown).toContain('---');
      expect(markdown).toContain('id: session-123');
      expect(markdown).toContain('title: "Test Session"');
      expect(markdown).toContain('date: 2025-01-29');
      expect(markdown).toContain('createdAt: 2025-01-29T10:00:00Z');
      expect(markdown).toContain('This is the session content.');
    });

    it('should include optional fields when present', () => {
      const session: Session = {
        id: 'session-456',
        title: 'Complete Session',
        description: 'A session with all fields',
        tags: ['work', 'typescript'],
        related: ['issue-1', 'plan-2', 'doc-1', 'knowledge-2'],
        date: '2025-01-29',
        createdAt: '2025-01-29T10:00:00Z',
        updatedAt: '2025-01-29T11:00:00Z',
        content: 'Content here'
      };

      const markdown = formatter.generateSessionMarkdown(session);
      
      expect(markdown).toContain('description: "A session with all fields"');
      expect(markdown).toContain('tags: ["work", "typescript"]');
      expect(markdown).toContain('related: ["issue-1", "plan-2", "doc-1", "knowledge-2"]');
      expect(markdown).toContain('updatedAt: 2025-01-29T11:00:00Z');
    });

    it('should handle special characters in fields', () => {
      const session: Session = {
        id: 'session-789',
        title: 'Title with "quotes" and \\backslashes',
        description: 'Description with\nnewlines',
        tags: ['tag"with"quotes'],
        date: '2025-01-29',
        createdAt: '2025-01-29T10:00:00Z',
        content: 'Content'
      };

      const markdown = formatter.generateSessionMarkdown(session);
      
      expect(markdown).toContain('title: "Title with "quotes" and \\backslashes"');
      expect(markdown).toContain('description: "Description with\nnewlines"');
      expect(markdown).toContain('tags: ["tag"with"quotes"]');
    });

    it('should handle empty arrays', () => {
      const session: Session = {
        id: 'session-000',
        title: 'Empty Arrays',
        tags: [],
        related: [],
        date: '2025-01-29',
        createdAt: '2025-01-29T10:00:00Z',
        content: 'Content'
      };

      const markdown = formatter.generateSessionMarkdown(session);
      
      expect(markdown).not.toContain('tags:');
      expect(markdown).not.toContain('related: []');
    });
  });

  describe('generateLegacySessionMarkdown', () => {
    it('should generate legacy format', () => {
      const session: Session = {
        id: 'session-123',
        title: 'Legacy Session',
        date: '2025-01-29',
        createdAt: '2025-01-29T10:00:00Z',
        content: 'Session content'
      };

      const markdown = formatter.generateLegacySessionMarkdown(session);
      
      expect(markdown).toContain('# Legacy Session');
      expect(markdown).toContain('**Created**: 2025-01-29T10:00:00Z');
      expect(markdown).toContain('Session content');
    });
  });

  describe('parseSessionFromMarkdown', () => {
    it('should parse modern format with frontmatter', () => {
      const markdown = `---
id: session-123
title: "Test Session"
date: 2025-01-29
createdAt: 2025-01-29T10:00:00Z
---

This is the session content.`;

      const session = formatter.parseSessionFromMarkdown(markdown, 'session-123', '2025-01-29');
      
      expect(session).toEqual({
        id: 'session-123',
        title: 'Test Session',
        date: '2025-01-29',
        createdAt: '2025-01-29T10:00:00Z',
        content: 'This is the session content.'
      });
    });

    it('should parse complete session data', () => {
      const markdown = `---
id: session-456
title: "Complete Session"
description: "A session with all fields"
tags: ["work", "typescript"]
related: ["issue-1", "plan-2", "doc-1", "knowledge-2"]
date: 2025-01-29
createdAt: 2025-01-29T10:00:00Z
updatedAt: 2025-01-29T11:00:00Z
---

Content here`;

      const session = formatter.parseSessionFromMarkdown(markdown, 'session-456', '2025-01-29');
      
      expect(session).toEqual({
        id: 'session-456',
        title: 'Complete Session',
        description: 'A session with all fields',
        tags: ['work', 'typescript'],
        related: ['issue-1', 'plan-2', 'doc-1', 'knowledge-2'],
        date: '2025-01-29',
        createdAt: '2025-01-29T10:00:00Z',
        updatedAt: '2025-01-29T11:00:00Z',
        content: 'Content here'
      });
    });

    it('should handle legacy format', () => {
      const markdown = `# Test Session

**Created**: 2025-01-29T10:00:00Z

This is the session content.`;

      const session = formatter.parseSessionFromMarkdown(markdown, 'legacy-123', '2025-01-29');
      
      expect(session.id).toBe('legacy-123');
      expect(session.title).toBe('Test Session');
      expect(session.content).toBe('This is the session content.');
      expect(session.date).toBe('2025-01-29');
      expect(session.createdAt).toBe('2025-01-29T10:00:00Z');
    });

    it('should handle invalid YAML gracefully', () => {
      const markdown = `---
id: session-123
title: "Unclosed quote
date: 2025-01-29
---

Content`;

      const session = formatter.parseSessionFromMarkdown(markdown, 'session-123', '2025-01-29');
      
      // Should fall back to legacy parsing
      expect(session.id).toBe('session-123');
      expect(session.title).toBe('Unknown Session'); // Default title from legacy parsing
      expect(session.content).toBeDefined();
    });

    it('should handle empty frontmatter arrays', () => {
      const markdown = `---
id: session-789
title: "Test Session"
tags: []
related: []
date: 2025-01-29
createdAt: 2025-01-29T10:00:00Z
---

Content`;

      const session = formatter.parseSessionFromMarkdown(markdown, 'session-789', '2025-01-29');
      
      expect(session.tags).toBeUndefined(); // Empty arrays become undefined
      expect(session.related).toBeUndefined();
    });
  });

  describe('generateDailyMarkdown', () => {
    it('should format daily summary', () => {
      const daily: Daily = {
        date: '2025-01-29',
        title: 'Daily Summary for 2025-01-29',
        content: 'Summary content here',
        tags: ['summary', 'work'],
        related: ['issue-1', 'doc-1'],
        createdAt: '2025-01-29T23:59:59Z',
        updatedAt: '2025-01-29T23:59:59Z'
      };

      const markdown = formatter.generateDailyMarkdown(daily);
      
      expect(markdown).toContain('---');
      expect(markdown).toContain('title: "Daily Summary for 2025-01-29"');
      expect(markdown).toContain('date: 2025-01-29');
      expect(markdown).toContain('tags: ["summary", "work"]');
      expect(markdown).toContain('Summary content here');
      expect(markdown).toContain('# Daily Summary for 2025-01-29'); // Visual title
    });

    it('should handle empty fields in daily', () => {
      const daily: Daily = {
        date: '2025-01-29',
        title: 'Daily Summary',
        content: 'Content',
        tags: [],
        createdAt: '2025-01-29T23:59:59Z'
      };

      const markdown = formatter.generateDailyMarkdown(daily);
      
      expect(markdown).not.toContain('tags:');
      expect(markdown).not.toContain('related: []');
      expect(markdown).not.toContain('updatedAt:');
    });
  });

  describe('parseDailyFromMarkdown', () => {
    it('should parse daily summary markdown', () => {
      const markdown = `---
title: "Daily Summary for 2025-01-29"
date: 2025-01-29
tags: ["summary", "work"]
related: ["issue-1", "doc-1"]
createdAt: 2025-01-29T23:59:59Z
updatedAt: 2025-01-29T23:59:59Z
---

# Daily Summary for 2025-01-29

Summary content here`;

      const daily = formatter.parseDailyFromMarkdown(markdown, '2025-01-29');
      
      expect(daily).not.toBeNull();
      expect(daily?.date).toBe('2025-01-29');
      expect(daily?.title).toBe('Daily Summary for 2025-01-29');
      // The parser doesn't remove the visual title in this case
      expect(daily?.content).toContain('Summary content here');
      expect(daily?.tags).toEqual(['summary', 'work']);
      expect(daily?.related).toEqual(['issue-1', 'doc-1']);
      expect(daily?.createdAt).toBe('2025-01-29T23:59:59Z');
      expect(daily?.updatedAt).toBe('2025-01-29T23:59:59Z');
    });

    it('should handle daily without frontmatter', () => {
      const markdown = `Summary content without frontmatter`;

      const daily = formatter.parseDailyFromMarkdown(markdown, '2025-01-29');
      
      expect(daily).toBeNull(); // No frontmatter means null return
    });

    it('should handle malformed daily markdown', () => {
      const markdown = `---
title: Unclosed quote"
---

Content`;

      const daily = formatter.parseDailyFromMarkdown(markdown, '2025-01-29');
      
      // Even with malformed YAML, parseDailyFromMarkdown returns a result
      expect(daily).not.toBeNull();
      expect(daily?.title).toBe('Untitled'); // Default title
      expect(daily?.content).toBe('Content');
      expect(daily?.tags).toEqual([]);
      expect(daily?.createdAt).toBe(''); // Empty string default
    });

    it('should handle empty arrays in daily markdown', () => {
      const markdown = `---
title: "Daily Summary"
date: 2025-01-29
tags: []
related: []
createdAt: 2025-01-29T23:59:59Z
---

# Daily Summary

Content`;

      const daily = formatter.parseDailyFromMarkdown(markdown, '2025-01-29');
      
      expect(daily).not.toBeNull();
      expect(daily?.tags).toEqual([]); // Empty arrays are preserved as empty arrays
      expect(daily?.related).toEqual([]);
    });
  });
});