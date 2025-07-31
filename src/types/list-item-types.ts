/**
 * @ai-context Lightweight types for list operations
 * @ai-pattern Minimal data transfer for performance
 * @ai-critical Separate from UnifiedItem to avoid unnecessary fields
 */

/**
 * @ai-intent Minimal item representation for list views
 * @ai-pattern Only essential fields for list display
 */
export interface ListItem {
  id: string;
  type: string;
  title: string;
  description?: string;     // Summary for list display
  status?: string;          // For task types
  priority?: 'high' | 'medium' | 'low';  // For task types
  tags: string[];
  updated_at: string;
  
  // Optional session/daily specific field
  date?: string;            // For sessions and dailies
}

/**
 * @ai-intent Type guard for ListItem
 */
export function isListItem(item: any): item is ListItem {
  return (
    typeof item === 'object' &&
    typeof item.id === 'string' &&
    typeof item.type === 'string' &&
    typeof item.title === 'string' &&
    Array.isArray(item.tags) &&
    typeof item.updated_at === 'string'
  );
}