/**
 * @ai-context Type guard functions for runtime type checking
 * @ai-pattern Type predicates for safe type narrowing
 * @ai-critical Ensures type safety at runtime boundaries
 * @ai-dependencies Domain types
 * @ai-assumption Guards are used at API boundaries and data parsing
 */
/**
 * @ai-intent Check if value is a valid Priority
 * @ai-pattern String literal type guard
 * @ai-usage Validate user input for priority fields
 */
export function isPriority(value) {
    return typeof value === 'string' &&
        ['high', 'medium', 'low'].includes(value);
}
/**
 * @ai-intent Check if value is a valid BaseType
 * @ai-pattern String literal type guard
 * @ai-usage Validate type categorization
 */
export function isBaseType(value) {
    return typeof value === 'string' &&
        ['tasks', 'documents'].includes(value);
}
/**
 * @ai-intent Check if object has required Status fields
 * @ai-pattern Structural type checking
 * @ai-critical Used when parsing database results
 */
export function isStatus(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'id' in value &&
        'name' in value &&
        typeof value.id === 'number' &&
        typeof value.name === 'string');
}
/**
 * @ai-intent Check if object has required Issue fields
 * @ai-pattern Deep structural validation
 * @ai-critical Validates markdown parse results
 */
export function isIssue(value) {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const obj = value;
    return (typeof obj.id === 'number' &&
        typeof obj.title === 'string' &&
        typeof obj.content === 'string' &&
        isPriority(obj.priority) &&
        typeof obj.created_at === 'string' &&
        typeof obj.updated_at === 'string' &&
        (obj.tags === undefined || Array.isArray(obj.tags)) &&
        (obj.status === undefined || typeof obj.status === 'string') &&
        (obj.description === undefined || typeof obj.description === 'string') &&
        (obj.start_date === undefined || obj.start_date === null || typeof obj.start_date === 'string') &&
        (obj.end_date === undefined || obj.end_date === null || typeof obj.end_date === 'string') &&
        (obj.related_tasks === undefined || Array.isArray(obj.related_tasks)) &&
        (obj.related_documents === undefined || Array.isArray(obj.related_documents)));
}
/**
 * @ai-intent Check if object has required Plan fields
 * @ai-pattern Similar to Issue but always has date fields
 * @ai-critical Validates plan-specific requirements
 */
export function isPlan(value) {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const obj = value;
    return (typeof obj.id === 'number' &&
        typeof obj.title === 'string' &&
        typeof obj.content === 'string' &&
        isPriority(obj.priority) &&
        typeof obj.created_at === 'string' &&
        typeof obj.updated_at === 'string' &&
        (obj.start_date === null || typeof obj.start_date === 'string') &&
        (obj.end_date === null || typeof obj.end_date === 'string') &&
        (obj.tags === undefined || Array.isArray(obj.tags)) &&
        (obj.status === undefined || typeof obj.status === 'string') &&
        (obj.description === undefined || typeof obj.description === 'string') &&
        (obj.related_tasks === undefined || Array.isArray(obj.related_tasks)) &&
        (obj.related_documents === undefined || Array.isArray(obj.related_documents)));
}
/**
 * @ai-intent Check if object has required Document fields
 * @ai-pattern Validates unified document structure
 * @ai-critical Includes type field validation
 */
export function isDocument(value) {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const obj = value;
    return (typeof obj.type === 'string' &&
        typeof obj.id === 'number' &&
        typeof obj.title === 'string' &&
        typeof obj.content === 'string' &&
        Array.isArray(obj.tags) &&
        typeof obj.created_at === 'string' &&
        typeof obj.updated_at === 'string' &&
        (obj.description === undefined || typeof obj.description === 'string') &&
        (obj.related_tasks === undefined || Array.isArray(obj.related_tasks)) &&
        (obj.related_documents === undefined || Array.isArray(obj.related_documents)));
}
/**
 * @ai-intent Check if object has required WorkSession fields
 * @ai-pattern Validates session structure with ID format
 * @ai-critical Checks session ID format
 */
export function isWorkSession(value) {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const obj = value;
    return (typeof obj.id === 'string' &&
        /^\d{4}-\d{2}-\d{2}-\d{2}\.\d{2}\.\d{2}\.\d{3}$/.test(obj.id) &&
        typeof obj.title === 'string' &&
        typeof obj.date === 'string' &&
        typeof obj.createdAt === 'string' &&
        (obj.tags === undefined || Array.isArray(obj.tags)) &&
        (obj.content === undefined || typeof obj.content === 'string') &&
        (obj.category === undefined || typeof obj.category === 'string') &&
        (obj.startTime === undefined || typeof obj.startTime === 'string') &&
        (obj.endTime === undefined || typeof obj.endTime === 'string') &&
        (obj.summary === undefined || typeof obj.summary === 'string') &&
        (obj.updatedAt === undefined || typeof obj.updatedAt === 'string') &&
        (obj.related_tasks === undefined || Array.isArray(obj.related_tasks)) &&
        (obj.related_documents === undefined || Array.isArray(obj.related_documents)));
}
/**
 * @ai-intent Check if object has required DailySummary fields
 * @ai-pattern Validates summary with date as key
 * @ai-critical Checks date format
 */
export function isDailySummary(value) {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const obj = value;
    return (typeof obj.date === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(obj.date) &&
        typeof obj.title === 'string' &&
        typeof obj.content === 'string' &&
        Array.isArray(obj.tags) &&
        typeof obj.createdAt === 'string' &&
        (obj.updatedAt === undefined || typeof obj.updatedAt === 'string') &&
        (obj.related_tasks === undefined || Array.isArray(obj.related_tasks)) &&
        (obj.related_documents === undefined || Array.isArray(obj.related_documents)));
}
/**
 * @ai-intent Check if object has required Tag fields
 * @ai-pattern Simple tag validation
 * @ai-usage Validate tag responses
 */
export function isTag(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'name' in value &&
        typeof value.name === 'string');
}
/**
 * @ai-intent Check if value is a valid date string
 * @ai-pattern YYYY-MM-DD format validation
 * @ai-usage Validate date inputs
 */
export function isValidDateString(value) {
    return (typeof value === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(value));
}
/**
 * @ai-intent Check if value is a valid session ID
 * @ai-pattern YYYY-MM-DD-HH.MM.SS.sss format
 * @ai-usage Validate session identifiers
 */
export function isValidSessionId(value) {
    return (typeof value === 'string' &&
        /^\d{4}-\d{2}-\d{2}-\d{2}\.\d{2}\.\d{2}\.\d{3}$/.test(value));
}
/**
 * @ai-intent Check if value is a valid ISO date string
 * @ai-pattern Full ISO 8601 datetime
 * @ai-usage Validate timestamps
 */
export function isISODateString(value) {
    if (typeof value !== 'string') {
        return false;
    }
    const date = new Date(value);
    return !isNaN(date.getTime()) && date.toISOString() === value;
}
/**
 * @ai-intent Type guard for arrays of specific types
 * @ai-pattern Generic array type guard factory
 * @ai-usage Create array validators for any type
 */
export function isArrayOf(value, itemGuard) {
    return Array.isArray(value) && value.every(itemGuard);
}
/**
 * @ai-intent Check if value is a string array
 * @ai-pattern Common pattern for tags
 * @ai-usage Validate tag arrays
 */
export function isStringArray(value) {
    return Array.isArray(value) && value.every(item => typeof item === 'string');
}
/**
 * @ai-intent Check if value is a number array
 * @ai-pattern For ID arrays
 * @ai-usage Validate status ID lists
 */
export function isNumberArray(value) {
    return Array.isArray(value) && value.every(item => typeof item === 'number');
}
/**
 * @ai-intent Narrow unknown to specific type with validation
 * @ai-pattern Safe type assertion with validation
 * @ai-usage Replace unsafe type assertions
 */
export function assertType(value, guard, errorMessage) {
    if (!guard(value)) {
        throw new TypeError(errorMessage);
    }
    return value;
}
/**
 * @ai-intent Check if value is defined (not null or undefined)
 * @ai-pattern Null/undefined filtering
 * @ai-usage Filter arrays to remove nullish values
 */
export function isDefined(value) {
    return value !== null && value !== undefined;
}
/**
 * @ai-intent Export all guards as a namespace
 * @ai-pattern Convenient grouped export
 * @ai-usage Import as TypeGuards.isIssue() etc
 */
export const TypeGuards = {
    isPriority,
    isBaseType,
    isStatus,
    isIssue,
    isPlan,
    isDocument,
    isWorkSession,
    isDailySummary,
    isTag,
    isValidDateString,
    isValidSessionId,
    isISODateString,
    isArrayOf,
    isStringArray,
    isNumberArray,
    assertType,
    isDefined
};
//# sourceMappingURL=type-guards.js.map