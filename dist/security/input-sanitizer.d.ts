/**
 * @ai-context Input sanitization utilities for security
 * @ai-pattern Defense in depth - sanitize all user inputs
 * @ai-critical Prevents injection attacks and XSS
 * @ai-why First line of defense against malicious input
 */
/**
 * @ai-intent Input sanitizer class
 * @ai-pattern Centralized input validation and sanitization
 * @ai-critical All user inputs must pass through this
 */
export declare class InputSanitizer {
    /**
     * @ai-intent Sanitize string input
     * @ai-flow 1. Check length -> 2. Trim -> 3. Check patterns -> 4. Escape
     * @ai-return Sanitized string
     * @ai-throws ValidationError if dangerous input detected
     */
    static sanitizeString(input: unknown, fieldName: string, maxLength?: number): string;
    /**
     * @ai-intent Sanitize numeric input
     * @ai-pattern Ensure valid numbers within range
     * @ai-return Sanitized number
     */
    static sanitizeNumber(input: unknown, fieldName: string, options?: {
        min?: number;
        max?: number;
        allowFloat?: boolean;
    }): number;
    /**
     * @ai-intent Sanitize boolean input
     * @ai-pattern Convert various truthy/falsy values
     * @ai-return Boolean value
     */
    static sanitizeBoolean(input: unknown, fieldName: string): boolean;
    /**
     * @ai-intent Sanitize date input
     * @ai-pattern Validate ISO date strings
     * @ai-return ISO date string
     */
    static sanitizeDate(input: unknown, fieldName: string): string;
    /**
     * @ai-intent Sanitize file path
     * @ai-pattern Prevent path traversal attacks
     * @ai-critical Must block access outside allowed directories
     */
    static sanitizePath(input: unknown, fieldName: string): string;
    /**
     * @ai-intent Sanitize array input
     * @ai-pattern Validate array and each element
     * @ai-return Sanitized array
     */
    static sanitizeArray<T>(input: unknown, fieldName: string, elementSanitizer: (element: unknown, index: number) => T, options?: {
        minLength?: number;
        maxLength?: number;
    }): T[];
    /**
     * @ai-intent Escape HTML special characters
     * @ai-pattern Prevent XSS attacks
     * @ai-usage For output that might contain user input
     */
    static escapeHtml(text: string): string;
    /**
     * @ai-intent Sanitize search query
     * @ai-pattern Allow safe search operators
     * @ai-return Sanitized query string
     */
    static sanitizeSearchQuery(input: unknown): string;
    /**
     * @ai-intent Validate enum value
     * @ai-pattern Ensure value is in allowed set
     * @ai-return Valid enum value
     */
    static sanitizeEnum<T extends string>(input: unknown, fieldName: string, allowedValues: readonly T[]): T;
}
/**
 * @ai-intent Sanitization middleware factory
 * @ai-pattern Creates Express-style middleware
 * @ai-usage For request validation
 */
export declare function createSanitizationMiddleware(schema: Record<string, (input: unknown) => unknown>): (data: unknown) => Record<string, unknown>;
