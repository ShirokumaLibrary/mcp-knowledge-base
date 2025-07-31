/**
 * @ai-context Unified item types for the consolidated database structure
 * @ai-pattern Single table inheritance pattern for all item types
 * @ai-critical All IDs are strings to support both numeric and timestamp formats
 */

export type { ListItem } from './list-item-types.js';

/**
 * @ai-intent Base interface for all items in the unified table
 * @ai-pattern Common fields across all item types
 */
export interface BaseItem {
  id: string;              // String to support both numeric and timestamp IDs
  type: string;            // issues, plans, docs, knowledge, sessions, summaries
  title: string;
  description?: string;
  tags: string[];
  related: string[];       // ["type-id", ...] format
  related_tasks?: string[];    // Backward compatibility
  related_documents?: string[]; // Backward compatibility
  created_at: string;
  updated_at: string;
}

/**
 * @ai-intent Task-specific fields (issues, plans)
 * @ai-pattern Extends base with task management fields
 */
export interface TaskItem extends BaseItem {
  content: string;
  priority: 'high' | 'medium' | 'low';
  status?: string;         // Status name for display
  status_id: number;
  start_date: string | null;
  end_date: string | null;
  start_time: null;
}

/**
 * @ai-intent Document-specific fields (docs, knowledge)
 * @ai-pattern Content-focused items with status support
 */
export interface DocumentItem extends BaseItem {
  content: string;
  priority: 'high' | 'medium' | 'low';
  status?: string;         // Status name for display
  status_id: number;
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
}

/**
 * @ai-intent Session-specific fields
 * @ai-pattern Time-based work tracking
 */
export interface SessionItem extends BaseItem {
  content: string;
  priority: 'high' | 'medium' | 'low';
  status?: string;         // Status name for display
  status_id: number;
  start_date: string | null;      // Date for the session
  end_date: string | null;
  start_time: string | null;      // HH:MM:SS format
}

/**
 * @ai-intent Daily summary fields
 * @ai-pattern Date-based aggregation
 */
export interface SummaryItem extends BaseItem {
  content: string;
  priority: 'high' | 'medium' | 'low';
  status?: string;         // Status name for display
  status_id: number;
  start_date: string | null;      // The date of the summary
  end_date: string | null;
  start_time: string | null;
}

/**
 * @ai-intent Union type for all item variations
 * @ai-pattern Type discrimination via 'type' field
 */
export type UnifiedItem = TaskItem | DocumentItem | SessionItem | SummaryItem;

/**
 * @ai-intent Database row representation
 * @ai-pattern Matches the actual database schema
 */
export interface ItemRow {
  type: string;
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  priority: string | null;
  status_id: number | null;
  status_name?: string;    // From JOIN with statuses table
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  tags: string;           // JSON string
  related: string;        // JSON string
  created_at: string;
  updated_at: string;
}

/**
 * @ai-intent Type guards for item type discrimination
 * @ai-pattern Runtime type checking
 */
export function isTaskItem(item: UnifiedItem): item is TaskItem {
  return ['issues', 'plans', 'bugs'].includes(item.type);
}

export function isDocumentItem(item: UnifiedItem): item is DocumentItem {
  return ['docs', 'knowledge', 'recipe', 'tutorial'].includes(item.type);
}

export function isSessionItem(item: UnifiedItem): item is SessionItem {
  return item.type === 'sessions';
}

export function isSummaryItem(item: UnifiedItem): item is SummaryItem {
  return item.type === 'dailies';
}

/**
 * @ai-intent Helper for parsing related item references
 * @ai-pattern Consistent format: "type-id"
 */
export class RelatedItemsHelper {
  static parse(ref: string): { type: string; id: string } {
    const [type, ...idParts] = ref.split('-');
    return { type, id: idParts.join('-') };
  }

  static format(type: string, id: string | number): string {
    return `${type}-${id}`;
  }

  static filterByBaseType(
    related: string[],
    baseTypeCheck: (type: string) => boolean
  ): string[] {
    return related.filter(ref => {
      const { type } = this.parse(ref);
      return baseTypeCheck(type);
    });
  }
}

/**
 * @ai-intent Creation parameters for new items
 * @ai-pattern Partial fields with type-specific requirements
 */
export interface CreateItemParams {
  type: string;
  title: string;
  description?: string;
  content?: string;
  priority?: 'high' | 'medium' | 'low';
  status?: string;         // Status name, will be resolved to ID
  start_date?: string;
  end_date?: string;
  start_time?: string;
  tags?: string[];
  related?: string[];
  related_tasks?: string[];
  related_documents?: string[];
  // Session-specific fields
  datetime?: string;      // ISO 8601 datetime for sessions (past data migration)
  id?: string;           // Custom ID for sessions
  category?: string;     // Category for sessions
  // Dailies-specific fields
  date?: string;         // YYYY-MM-DD for dailies
}

/**
 * @ai-intent Update parameters for existing items
 * @ai-pattern All fields optional except identification
 */
export interface UpdateItemParams {
  type: string;
  id: string;
  title?: string;
  description?: string;
  content?: string;
  priority?: 'high' | 'medium' | 'low';
  status?: string;
  start_date?: string | null;
  end_date?: string | null;
  start_time?: string;
  tags?: string[];
  related?: string[];
  related_tasks?: string[];
  related_documents?: string[];
}

/**
 * @ai-intent Search parameters for querying items
 * @ai-pattern Flexible filtering options
 */
export interface SearchItemParams {
  type?: string;
  types?: string[];
  query?: string;
  tags?: string[];
  status?: string;
  priority?: 'high' | 'medium' | 'low';
  includeClosedStatuses?: boolean;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}