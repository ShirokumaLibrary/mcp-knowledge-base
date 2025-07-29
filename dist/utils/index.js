export { createLogger } from './logger.js';
export { ensureInitialized } from './decorators.js';
export { formatRelativeDate } from './date-utils.js';
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
export async function retry(operation, options = {}) {
    const { maxAttempts = 3, initialDelay = 1000, maxDelay = 30000, backoffFactor = 2 } = options;
    let lastError;
    let delay = initialDelay;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await operation();
        }
        catch (error) {
            lastError = error;
            if (attempt === maxAttempts) {
                throw lastError;
            }
            await sleep(delay);
            delay = Math.min(delay * backoffFactor, maxDelay);
        }
    }
    throw lastError;
}
export function chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}
export function unique(array) {
    return Array.from(new Set(array));
}
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
export function isPlainObject(value) {
    return (typeof value === 'object' &&
        value !== null &&
        value.constructor === Object &&
        Object.prototype.toString.call(value) === '[object Object]');
}
export function debounce(func, wait) {
    let timeoutId;
    return (...args) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            func(...args);
        }, wait);
    };
}
export function createEnum(values) {
    const enumObj = {};
    for (const value of values) {
        enumObj[value] = value;
    }
    return enumObj;
}
