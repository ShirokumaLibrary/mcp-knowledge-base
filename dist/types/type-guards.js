export function isPriority(value) {
    return typeof value === 'string' &&
        ['high', 'medium', 'low'].includes(value);
}
export function isBaseType(value) {
    return typeof value === 'string' &&
        ['tasks', 'documents'].includes(value);
}
export function isStatus(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'id' in value &&
        'name' in value &&
        typeof value.id === 'number' &&
        typeof value.name === 'string');
}
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
export function isSession(value) {
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
        (obj.startTime === undefined || typeof obj.startTime === 'string') &&
        (obj.endTime === undefined || typeof obj.endTime === 'string') &&
        (obj.summary === undefined || typeof obj.summary === 'string') &&
        (obj.updatedAt === undefined || typeof obj.updatedAt === 'string') &&
        (obj.related_tasks === undefined || Array.isArray(obj.related_tasks)) &&
        (obj.related_documents === undefined || Array.isArray(obj.related_documents)));
}
export function isDaily(value) {
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
export function isTag(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'name' in value &&
        typeof value.name === 'string');
}
export function isValidDateString(value) {
    return (typeof value === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(value));
}
export function isValidSessionId(value) {
    return (typeof value === 'string' &&
        /^\d{4}-\d{2}-\d{2}-\d{2}\.\d{2}\.\d{2}\.\d{3}$/.test(value));
}
export function isISODateString(value) {
    if (typeof value !== 'string') {
        return false;
    }
    const date = new Date(value);
    return !isNaN(date.getTime()) && date.toISOString() === value;
}
export function isArrayOf(value, itemGuard) {
    return Array.isArray(value) && value.every(itemGuard);
}
export function isStringArray(value) {
    return Array.isArray(value) && value.every(item => typeof item === 'string');
}
export function isNumberArray(value) {
    return Array.isArray(value) && value.every(item => typeof item === 'number');
}
export function assertType(value, guard, errorMessage) {
    if (!guard(value)) {
        throw new TypeError(errorMessage);
    }
    return value;
}
export function isDefined(value) {
    return value !== null && value !== undefined;
}
export const TypeGuards = {
    isPriority,
    isBaseType,
    isStatus,
    isIssue,
    isPlan,
    isDocument,
    isSession,
    isDaily,
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
