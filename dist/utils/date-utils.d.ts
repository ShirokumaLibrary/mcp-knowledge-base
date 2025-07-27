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
export declare function formatRelativeDate(date: Date | string): string;
/**
 * @ai-intent Format date as YYYY-MM-DD
 * @ai-pattern Standard date format
 */
export declare function formatDate(date: Date | string): string;
/**
 * @ai-intent Format time as HH:MM:SS
 * @ai-pattern Standard time format
 */
export declare function formatTime(date: Date | string): string;
/**
 * @ai-intent Get date range for queries
 * @ai-pattern Date range utilities
 */
export declare function getDateRange(days: number): {
    start: string;
    end: string;
};
/**
 * @ai-intent Check if date is today
 * @ai-pattern Date comparison
 */
export declare function isToday(date: Date | string): boolean;
