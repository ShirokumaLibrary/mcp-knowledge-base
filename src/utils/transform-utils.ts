/**
 * @ai-context Data transformation utilities
 * @ai-pattern Common data conversion and formatting
 * @ai-critical Ensures consistent data representation
 * @ai-why Centralizes transformation logic
 * @ai-assumption Data formats are consistent across the application
 */

import type {
  Issue,
  Plan,
  Document} from '../types/domain-types.js';

/**
 * @ai-intent Response error type
 * @ai-pattern Structured error format
 */
interface ResponseError {
  message: string;
  code?: string;
  details?: unknown;
}
import type {
  Session,
  Priority
} from '../types/complete-domain-types.js';

/**
 * @ai-intent Entity to markdown transformers
 * @ai-pattern Consistent markdown formatting
 */
export class MarkdownTransformers {
  /**
   * @ai-intent Format issue as markdown
   * @ai-pattern Structured issue display
   */
  static formatIssue(issue: Issue): string {
    const lines = [
      `# ${issue.title}`,
      '',
      `**ID:** ${issue.id}`,
      `**Priority:** ${issue.priority}`,
      `**Status:** ${issue.status || 'No status'}`,
      `**Created:** ${this.formatDate(issue.created_at)}`,
      `**Updated:** ${this.formatDate(issue.updated_at)}`,
      ''
    ];

    if (issue.description) {
      lines.push('## Description', '', issue.description, '');
    }

    lines.push('## Content', '', issue.content, '');

    if (issue.tags && issue.tags.length > 0) {
      lines.push('## Tags', '', issue.tags.map(tag => `- ${tag}`).join('\n'), '');
    }

    if (issue.start_date || issue.end_date) {
      lines.push('## Timeline', '');
      if (issue.start_date) {
        lines.push(`**Start:** ${issue.start_date}`);
      }
      if (issue.end_date) {
        lines.push(`**End:** ${issue.end_date}`);
      }
      lines.push('');
    }

    // Support both old and new related fields
    const relatedItems = new Set<string>();

    // Add from unified related field if present
    if ((issue as any).related && Array.isArray((issue as any).related)) {
      (issue as any).related.forEach((item: string) => relatedItems.add(item));
    }

    // No need for legacy fields anymore - all moved to unified field

    if (relatedItems.size > 0) {
      lines.push('## Related Items', '', Array.from(relatedItems).map(ref => `- ${ref}`).join('\n'), '');
    }

    return lines.join('\n');
  }

  /**
   * @ai-intent Format plan as markdown
   * @ai-pattern Similar to issue but always has dates
   */
  static formatPlan(plan: Plan): string {
    const lines = [
      `# ${plan.title}`,
      '',
      `**ID:** ${plan.id}`,
      `**Priority:** ${plan.priority}`,
      `**Status:** ${plan.status || 'No status'}`,
      `**Start:** ${plan.start_date || 'Not set'}`,
      `**End:** ${plan.end_date || 'Not set'}`,
      `**Created:** ${this.formatDate(plan.created_at)}`,
      `**Updated:** ${this.formatDate(plan.updated_at)}`,
      ''
    ];

    if (plan.description) {
      lines.push('## Description', '', plan.description, '');
    }

    lines.push('## Content', '', plan.content, '');

    if (plan.tags && plan.tags.length > 0) {
      lines.push('## Tags', '', plan.tags.map(tag => `- ${tag}`).join('\n'), '');
    }

    // Support both old and new related fields
    const relatedItems = new Set<string>();

    // Add from unified related field if present
    if ((plan as any).related && Array.isArray((plan as any).related)) {
      (plan as any).related.forEach((item: string) => relatedItems.add(item));
    }

    // No need for legacy fields anymore - all moved to unified field

    if (relatedItems.size > 0) {
      lines.push('## Related Items', '', Array.from(relatedItems).map(ref => `- ${ref}`).join('\n'), '');
    }

    return lines.join('\n');
  }

  /**
   * @ai-intent Format document as markdown
   * @ai-pattern Document display format
   */
  static formatDocument(doc: Document): string {
    const lines = [
      `# ${doc.title}`,
      '',
      `**ID:** ${doc.id}`,
      `**Type:** ${doc.type}`,
      `**Created:** ${this.formatDate(doc.created_at)}`,
      `**Updated:** ${this.formatDate(doc.updated_at)}`,
      ''
    ];

    if (doc.description) {
      lines.push('## Description', '', doc.description, '');
    }

    lines.push('## Content', '', doc.content, '');

    if (doc.tags && doc.tags.length > 0) {
      lines.push('## Tags', '', doc.tags.map(tag => `- ${tag}`).join('\n'), '');
    }

    // Support both old and new related fields
    const relatedItems = new Set<string>();

    // Add from unified related field if present
    if ((doc as any).related && Array.isArray((doc as any).related)) {
      (doc as any).related.forEach((item: string) => relatedItems.add(item));
    }

    // No need for legacy fields anymore - all moved to unified field

    if (relatedItems.size > 0) {
      lines.push('## Related Items', '', Array.from(relatedItems).map(ref => `- ${ref}`).join('\n'), '');
    }

    return lines.join('\n');
  }

  /**
   * @ai-intent Format work session as markdown
   * @ai-pattern Session display format
   */
  static formatSession(session: Session): string {
    const lines = [
      `# ${session.title}`,
      '',
      `**ID:** ${session.id}`,
      `**Date:** ${session.date}`,
      ''
    ];

    if (session.startTime && session.endTime) {
      lines.push(`**Time:** ${session.startTime} - ${session.endTime}`, '');
    } else if (session.startTime) {
      lines.push(`**Started:** ${session.startTime}`, '');
    }

    if (session.summary) {
      lines.push('## Summary', '', session.summary, '');
    }

    if (session.content) {
      lines.push('## Details', '', session.content, '');
    }

    if (session.tags && session.tags.length > 0) {
      lines.push('## Tags', '', session.tags.map(tag => `- ${tag}`).join('\n'), '');
    }

    if (session.related && session.related.length > 0) {
      lines.push('## Related Items', '', session.related.map((ref: string) => `- ${ref}`).join('\n'), '');
    }

    return lines.join('\n');
  }

  /**
   * @ai-intent Format date for display
   * @ai-pattern Consistent date formatting
   */
  private static formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }
}

/**
 * @ai-intent Data converters between formats
 * @ai-pattern Type conversions and mappings
 */
export class DataConverters {
  /**
   * @ai-intent Convert database row to domain entity
   * @ai-pattern Generic row mapping
   */
  static rowToEntity<T>(row: Record<string, unknown>, fieldMap: Record<string, string>): T {
    const entity: Record<string, unknown> = {};

    for (const [entityField, dbField] of Object.entries(fieldMap)) {
      if (row[dbField] !== undefined) {
        entity[entityField] = row[dbField];
      }
    }

    return entity as T;
  }

  /**
   * @ai-intent Convert entity to database row
   * @ai-pattern Inverse of rowToEntity
   */
  static entityToRow<T>(entity: T, fieldMap: Record<string, string>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    for (const [entityField, dbField] of Object.entries(fieldMap)) {
      const value = (entity as Record<string, unknown>)[entityField];
      if (value !== undefined) {
        row[dbField] = value;
      }
    }

    return row;
  }

  /**
   * @ai-intent Parse JSON safely
   * @ai-pattern Returns default on error
   */
  static parseJsonSafe<T>(json: string, defaultValue: T): T {
    try {
      return JSON.parse(json);
    } catch {
      return defaultValue;
    }
  }

  /**
   * @ai-intent Convert tags to CSV
   * @ai-pattern For database storage
   */
  static tagsToCSV(tags?: string[]): string {
    return tags && tags.length > 0 ? tags.join(',') : '';
  }

  /**
   * @ai-intent Parse CSV to tags
   * @ai-pattern From database storage
   */
  static csvToTags(csv?: string): string[] {
    if (!csv || csv.trim() === '') {
      return [];
    }

    return csv.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
  }

  /**
   * @ai-intent Convert boolean to SQLite integer
   * @ai-pattern SQLite boolean representation
   */
  static booleanToInt(value?: boolean): number {
    return value ? 1 : 0;
  }

  /**
   * @ai-intent Convert SQLite integer to boolean
   * @ai-pattern Inverse of booleanToInt
   */
  static intToBoolean(value: number | null | undefined): boolean {
    return value === 1;
  }

  /**
   * @ai-intent Normalize priority value
   * @ai-pattern Ensure valid priority
   */
  static normalizePriority(priority?: string): Priority {
    const normalized = priority?.toLowerCase();

    switch (normalized) {
      case 'high':
      case 'medium':
      case 'low':
        return normalized as Priority;
      default:
        return 'medium';
    }
  }

  /**
   * @ai-intent Create reference string
   * @ai-pattern type-id format
   */
  static createReference(type: string, id: number | string): string {
    return `${type}-${id}`;
  }

  /**
   * @ai-intent Parse reference string
   * @ai-pattern Extract type and id
   */
  static parseReference(ref: string): { type: string; id: string } | null {
    const match = ref.match(/^([a-z][a-z0-9_]*)-(.+)$/);

    if (!match) {
      return null;
    }

    return {
      type: match[1],
      id: match[2]
    };
  }
}

/**
 * @ai-intent Response formatters for API
 * @ai-pattern Consistent API responses
 */
export class ResponseFormatters {
  /**
   * @ai-intent Format success response
   * @ai-pattern Standard success format
   */
  static success<T>(data: T, message?: string): { success: true; data: T; message?: string } {
    return {
      success: true,
      data,
      ...(message && { message })
    };
  }

  /**
   * @ai-intent Format error response
   * @ai-pattern Standard error format
   */
  static error(message: string, code?: string, details?: unknown): { success: false; error: ResponseError } {
    return {
      success: false,
      error: {
        message,
        code,
        details
      } as ResponseError
    };
  }

  /**
   * @ai-intent Format list response
   * @ai-pattern Paginated list format
   */
  static list<T>(
    items: T[],
    total: number,
    page: number,
    limit: number
  ): {
    items: T[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  } {
    return {
      items,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * @ai-intent Format summary response
   * @ai-pattern Entity summary format
   */
  static summary<T extends Record<string, unknown>>(entity: T): Omit<T, 'content'> {
    const { content: _content, ...summary } = entity;
    return summary;
  }
}

/**
 * @ai-intent Field mappers for database operations
 * @ai-pattern Centralized field mappings
 */
export const FieldMappings = {
  issue: {
    id: 'id',
    title: 'title',
    content: 'content',
    priority: 'priority',
    status: 'status',
    statusId: 'status_id',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    description: 'description',
    startDate: 'start_date',
    endDate: 'end_date'
  },

  document: {
    id: 'id',
    type: 'type',
    title: 'title',
    content: 'content',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    description: 'description'
  },

  session: {
    id: 'id',
    title: 'title',
    content: 'content',
    category: 'category',
    date: 'date',
    startTime: 'start_time',
    endTime: 'end_time',
    summary: 'summary',
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
};