/**
 * @ai-context Type guard functions for runtime type checking
 * @ai-pattern Type predicates for safe type narrowing
 * @ai-critical Ensures type safety at runtime boundaries
 * @ai-dependencies Domain types
 * @ai-assumption Guards are used at API boundaries and data parsing
 */
import type { Status, Issue, Plan, Document, WorkSession, DailySummary, Priority, BaseType, Tag } from './complete-domain-types.js';
/**
 * @ai-intent Check if value is a valid Priority
 * @ai-pattern String literal type guard
 * @ai-usage Validate user input for priority fields
 */
export declare function isPriority(value: unknown): value is Priority;
/**
 * @ai-intent Check if value is a valid BaseType
 * @ai-pattern String literal type guard
 * @ai-usage Validate type categorization
 */
export declare function isBaseType(value: unknown): value is BaseType;
/**
 * @ai-intent Check if object has required Status fields
 * @ai-pattern Structural type checking
 * @ai-critical Used when parsing database results
 */
export declare function isStatus(value: unknown): value is Status;
/**
 * @ai-intent Check if object has required Issue fields
 * @ai-pattern Deep structural validation
 * @ai-critical Validates markdown parse results
 */
export declare function isIssue(value: unknown): value is Issue;
/**
 * @ai-intent Check if object has required Plan fields
 * @ai-pattern Similar to Issue but always has date fields
 * @ai-critical Validates plan-specific requirements
 */
export declare function isPlan(value: unknown): value is Plan;
/**
 * @ai-intent Check if object has required Document fields
 * @ai-pattern Validates unified document structure
 * @ai-critical Includes type field validation
 */
export declare function isDocument(value: unknown): value is Document;
/**
 * @ai-intent Check if object has required WorkSession fields
 * @ai-pattern Validates session structure with ID format
 * @ai-critical Checks session ID format
 */
export declare function isWorkSession(value: unknown): value is WorkSession;
/**
 * @ai-intent Check if object has required DailySummary fields
 * @ai-pattern Validates summary with date as key
 * @ai-critical Checks date format
 */
export declare function isDailySummary(value: unknown): value is DailySummary;
/**
 * @ai-intent Check if object has required Tag fields
 * @ai-pattern Simple tag validation
 * @ai-usage Validate tag responses
 */
export declare function isTag(value: unknown): value is Tag;
/**
 * @ai-intent Check if value is a valid date string
 * @ai-pattern YYYY-MM-DD format validation
 * @ai-usage Validate date inputs
 */
export declare function isValidDateString(value: unknown): value is string;
/**
 * @ai-intent Check if value is a valid session ID
 * @ai-pattern YYYY-MM-DD-HH.MM.SS.sss format
 * @ai-usage Validate session identifiers
 */
export declare function isValidSessionId(value: unknown): value is string;
/**
 * @ai-intent Check if value is a valid ISO date string
 * @ai-pattern Full ISO 8601 datetime
 * @ai-usage Validate timestamps
 */
export declare function isISODateString(value: unknown): value is string;
/**
 * @ai-intent Type guard for arrays of specific types
 * @ai-pattern Generic array type guard factory
 * @ai-usage Create array validators for any type
 */
export declare function isArrayOf<T>(value: unknown, itemGuard: (item: unknown) => item is T): value is T[];
/**
 * @ai-intent Check if value is a string array
 * @ai-pattern Common pattern for tags
 * @ai-usage Validate tag arrays
 */
export declare function isStringArray(value: unknown): value is string[];
/**
 * @ai-intent Check if value is a number array
 * @ai-pattern For ID arrays
 * @ai-usage Validate status ID lists
 */
export declare function isNumberArray(value: unknown): value is number[];
/**
 * @ai-intent Narrow unknown to specific type with validation
 * @ai-pattern Safe type assertion with validation
 * @ai-usage Replace unsafe type assertions
 */
export declare function assertType<T>(value: unknown, guard: (value: unknown) => value is T, errorMessage: string): T;
/**
 * @ai-intent Check if value is defined (not null or undefined)
 * @ai-pattern Null/undefined filtering
 * @ai-usage Filter arrays to remove nullish values
 */
export declare function isDefined<T>(value: T | null | undefined): value is T;
/**
 * @ai-intent Export all guards as a namespace
 * @ai-pattern Convenient grouped export
 * @ai-usage Import as TypeGuards.isIssue() etc
 */
export declare const TypeGuards: {
    readonly isPriority: typeof isPriority;
    readonly isBaseType: typeof isBaseType;
    readonly isStatus: typeof isStatus;
    readonly isIssue: typeof isIssue;
    readonly isPlan: typeof isPlan;
    readonly isDocument: typeof isDocument;
    readonly isWorkSession: typeof isWorkSession;
    readonly isDailySummary: typeof isDailySummary;
    readonly isTag: typeof isTag;
    readonly isValidDateString: typeof isValidDateString;
    readonly isValidSessionId: typeof isValidSessionId;
    readonly isISODateString: typeof isISODateString;
    readonly isArrayOf: typeof isArrayOf;
    readonly isStringArray: typeof isStringArray;
    readonly isNumberArray: typeof isNumberArray;
    readonly assertType: typeof assertType;
    readonly isDefined: typeof isDefined;
};
