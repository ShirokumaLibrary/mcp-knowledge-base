/**
 * @ai-context Markdown formatter for session and summary persistence
 * @ai-pattern Custom markdown format with YAML frontmatter
 * @ai-critical Handles serialization/deserialization for file storage
 * @ai-assumption Sessions use complex format, summaries use simple format
 * @ai-why Human-readable format allows manual editing
 */

import type { WorkSession, DailySummary } from '../types/session-types.js';

/**
 * @ai-context Formats work sessions and daily summaries to/from markdown
 * @ai-pattern Two-way conversion maintaining data integrity
 * @ai-critical Parsing must handle legacy and modern formats
 * @ai-lifecycle Sessions evolve: legacy -> frontmatter format
 * @ai-why Markdown provides version control friendly storage
 */
export class SessionMarkdownFormatter {
  /**
   * @ai-intent Generate modern markdown format with frontmatter
   * @ai-flow 1. Build YAML header -> 2. Add title -> 3. Add metadata -> 4. Add content
   * @ai-pattern YAML frontmatter + markdown body
   * @ai-critical Quotes prevent YAML parsing errors
   * @ai-assumption All string values quoted for safety
   * @ai-return Complete markdown file content
   */
  generateSessionMarkdown(session: WorkSession): string {
    let content = '---\n';
    content += `id: ${session.id}\n`;  // @ai-logic: ID unquoted (alphanumeric)
    content += `title: "${session.title}"\n`;  // @ai-critical: Quote for special chars
    if (session.tags && session.tags.length > 0) {
      content += `tags: [${session.tags.map(tag => `"${tag}"`).join(', ')}]\n`;  // @ai-pattern: JSON array format
    }
    if (session.related_tasks && session.related_tasks.length > 0) {
      content += `related_tasks: [${session.related_tasks.map(t => `"${t}"`).join(', ')}]\n`;
    }
    if (session.related_documents && session.related_documents.length > 0) {
      content += `related_documents: [${session.related_documents.map(d => `"${d}"`).join(', ')}]\n`;
    }
    content += `date: ${session.date}\n`;  // @ai-pattern: YYYY-MM-DD unquoted
    content += `createdAt: ${session.createdAt}\n`;  // @ai-pattern: ISO 8601 unquoted
    if (session.updatedAt) {
      content += `updatedAt: ${session.updatedAt}\n`;
    }
    content += '---\n\n';

    // @ai-logic: Content should be stored as-is without additional formatting
    if (session.content) {
      content += session.content;
    }

    return content;
  }

  /**
   * @ai-intent Generate legacy format without frontmatter
   * @ai-flow Simple markdown with inline metadata
   * @ai-pattern Used for minimal sessions
   * @ai-deprecated Prefer generateSessionMarkdown for new sessions
   * @ai-why Backward compatibility with older files
   */
  generateLegacySessionMarkdown(session: WorkSession): string {
    // @ai-logic: Legacy format still needs basic structure for sessions without frontmatter
    let markdown = `# ${session.title}\n\n`;
    markdown += `**Created**: ${session.createdAt}\n`;
    if (session.updatedAt) {
      markdown += `**Updated**: ${session.updatedAt}\n`;
    }
    markdown += '\n';

    if (session.content) {
      markdown += `\n${session.content}\n`;
    }

    return markdown;
  }

  /**
   * @ai-intent Parse markdown back to WorkSession object
   * @ai-flow 1. Detect format -> 2. Route to parser -> 3. Return session
   * @ai-pattern Auto-detects frontmatter vs legacy format
   * @ai-critical Must handle both formats for compatibility
   * @ai-return Always returns valid session (no null)
   */
  parseSessionFromMarkdown(content: string, sessionId: string, date: string): WorkSession {
    const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);  // @ai-pattern: Frontmatter detection

    if (frontMatterMatch) {
      return this.parseFrontMatterSession(frontMatterMatch, sessionId, date);
    } else {
      return this.parseLegacySession(content, sessionId, date);  // @ai-fallback: Legacy format
    }
  }

  /**
   * @ai-intent Parse modern format with YAML frontmatter
   * @ai-flow 1. Extract metadata -> 2. Parse body -> 3. Build session
   * @ai-complexity Complex parsing to extract clean content
   * @ai-critical Must skip redundant body metadata
   * @ai-assumption Frontmatter values follow exact format
   */
  private parseFrontMatterSession(match: RegExpMatchArray, sessionId: string, date: string): WorkSession {
    const frontMatter = match[1];
    const bodyContent = match[2];

    // @ai-logic: Extract each field with specific regex
    const titleMatch = frontMatter.match(/title: "(.+)"/);
    const tagsMatch = frontMatter.match(/tags: \[(.*)\]/);
    const relatedTasksMatch = frontMatter.match(/related_tasks: \[(.*)\]/);
    const relatedDocsMatch = frontMatter.match(/related_documents: \[(.*)\]/);
    const createdAtMatch = frontMatter.match(/createdAt: (.+)/);
    const updatedAtMatch = frontMatter.match(/updatedAt: (.+)/);

    // @ai-logic: Content is everything after the frontmatter
    const content = bodyContent.trim() || undefined;

    return {
      id: sessionId,
      title: titleMatch?.[1] || 'Unknown Session',
      content,
      tags: tagsMatch?.[1] ? tagsMatch[1].split(', ').map(tag => tag.replace(/"/g, '')) : undefined,
      related_tasks: relatedTasksMatch?.[1] ? relatedTasksMatch[1].split(', ').map(t => t.replace(/"/g, '')) : undefined,
      related_documents: relatedDocsMatch?.[1] ? relatedDocsMatch[1].split(', ').map(d => d.replace(/"/g, '')) : undefined,
      date,
      createdAt: createdAtMatch?.[1] || '',
      updatedAt: updatedAtMatch?.[1]
    };
  }

  /**
   * @ai-intent Parse legacy format without frontmatter
   * @ai-flow 1. Extract title -> 2. Find metadata -> 3. Get content
   * @ai-pattern Simple regex-based extraction
   * @ai-fallback Default values for missing fields
   * @ai-return Minimal session object
   */
  private parseLegacySession(content: string, sessionId: string, date: string): WorkSession {
    const lines = content.split('\n');

    const titleMatch = lines[0].match(/^# (.+)$/);  // @ai-pattern: Markdown h1
    const title = titleMatch ? titleMatch[1] : 'Unknown Session';  // @ai-fallback: Default title

    const createdAtMatch = content.match(/\*\*Created\*\*: (.+)/);
    const updatedAtMatch = content.match(/\*\*Updated\*\*: (.+)/);

    // Get content after title
    const contentStart = content.indexOf('\n\n', content.indexOf('\n\n') + 2);
    const bodyContent = contentStart !== -1 ? content.substring(contentStart).trim() : '';

    return {
      id: sessionId,
      title,
      date,
      createdAt: createdAtMatch?.[1] || '',
      updatedAt: updatedAtMatch?.[1],
      content: bodyContent || undefined
    };
  }

  /**
   * @ai-intent Generate markdown for daily summary
   * @ai-flow 1. YAML header -> 2. Title -> 3. Content
   * @ai-pattern Simpler than sessions - no redundant metadata
   * @ai-critical Date is primary key in frontmatter
   * @ai-return Complete markdown file content
   */
  generateDailySummaryMarkdown(summary: DailySummary): string {
    let content = '---\n';
    content += `date: ${summary.date}\n`;  // @ai-critical: Primary key
    content += `title: "${summary.title}"\n`;
    if (summary.tags.length > 0) {
      content += `tags: [${summary.tags.map(tag => `"${tag}"`).join(', ')}]\n`;
    }
    if (summary.related_tasks && summary.related_tasks.length > 0) {
      content += `related_tasks: [${summary.related_tasks.map(t => `"${t}"`).join(', ')}]\n`;
    }
    if (summary.related_documents && summary.related_documents.length > 0) {
      content += `related_documents: [${summary.related_documents.map(d => `"${d}"`).join(', ')}]\n`;
    }
    content += `createdAt: ${summary.createdAt}\n`;
    if (summary.updatedAt) {
      content += `updatedAt: ${summary.updatedAt}\n`;
    }
    content += '---\n\n';

    content += `# ${summary.title}\n\n`;  // @ai-ux: Visual title
    content += summary.content;  // @ai-logic: Main summary text

    return content;
  }

  /**
   * @ai-intent Parse markdown back to DailySummary
   * @ai-flow 1. Extract frontmatter -> 2. Parse fields -> 3. Build summary
   * @ai-validation Returns null if no frontmatter
   * @ai-pattern Only supports frontmatter format
   * @ai-return Summary object or null
   */
  parseDailySummaryFromMarkdown(content: string, date: string): DailySummary | null {
    const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

    if (!frontMatterMatch) {
      return null;  // @ai-validation: No legacy format for summaries
    }

    const frontMatter = frontMatterMatch[1];
    const bodyContent = frontMatterMatch[2];

    const dateMatch = frontMatter.match(/date: (.+)/);
    const titleMatch = frontMatter.match(/title: "(.+)"/);
    const tagsMatch = frontMatter.match(/tags: \[(.*)\]/);
    const relatedTasksMatch = frontMatter.match(/related_tasks: \[(.*)\]/);
    const relatedDocsMatch = frontMatter.match(/related_documents: \[(.*)\]/);
    const createdAtMatch = frontMatter.match(/createdAt: (.+)/);
    const updatedAtMatch = frontMatter.match(/updatedAt: (.+)/);

    return {
      date: dateMatch?.[1] || date,
      title: titleMatch?.[1] || 'Untitled',
      content: bodyContent.replace(/^# .+\n\n/, '').trim(),
      tags: tagsMatch?.[1] ? tagsMatch[1].split(', ').map(tag => tag.replace(/"/g, '')) : [],
      related_tasks: relatedTasksMatch?.[1] ? relatedTasksMatch[1].split(', ').map(t => t.replace(/"/g, '')) : [],
      related_documents: relatedDocsMatch?.[1] ? relatedDocsMatch[1].split(', ').map(d => d.replace(/"/g, '')) : [],
      createdAt: createdAtMatch?.[1] || '',
      updatedAt: updatedAtMatch?.[1]
    };
  }

}