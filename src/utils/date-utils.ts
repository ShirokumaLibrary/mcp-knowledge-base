/**
 * @ai-context Date utility functions
 * @ai-pattern Common date operations
 * @ai-critical Handles date formatting and parsing
 * @ai-why Centralizes date logic
 */

/**
 * @ai-intent Format date as relative time
 * @ai-pattern Human-readable time differences
 * @ai-usage For displaying "2 hours ago" style dates
 */
export function formatRelativeDate(date: Date | string): string {
  const now = new Date();
  const then = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - then.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 30) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return then.toLocaleDateString();
  }
}

/**
 * @ai-intent Format date as YYYY-MM-DD
 * @ai-pattern Standard date format
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

/**
 * @ai-intent Format time as HH:MM:SS
 * @ai-pattern Standard time format
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toTimeString().split(' ')[0];
}

/**
 * @ai-intent Get date range for queries
 * @ai-pattern Date range utilities
 */
export function getDateRange(days: number): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);

  return {
    start: formatDate(start),
    end: formatDate(end)
  };
}

/**
 * @ai-intent Check if date is today
 * @ai-pattern Date comparison
 */
export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();

  return d.getFullYear() === today.getFullYear() &&
         d.getMonth() === today.getMonth() &&
         d.getDate() === today.getDate();
}