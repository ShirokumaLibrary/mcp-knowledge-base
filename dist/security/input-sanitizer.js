import { createLogger } from '../utils/logger.js';
import { ValidationError } from '../errors/custom-errors.js';
const logger = createLogger('InputSanitizer');
const SQL_INJECTION_PATTERNS = [
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript|vbscript)\b)/gi,
    /(--|\||;|\/\*|\*\/|xp_|sp_)/gi,
    /(<script|<\/script|javascript:|onerror=|onload=|onclick=|<iframe|<object|<embed)/gi
];
const PATH_TRAVERSAL_PATTERNS = [
    /\.\./g,
    /\.\.%2[fF]/g,
    /%2[eE]\./g,
    /\.\.\\/g,
    /\.\.%5[cC]/g
];
const MAX_LENGTHS = {
    id: 50,
    title: 200,
    name: 100,
    tag: 50,
    description: 1000,
    content: 100000,
    query: 500,
    path: 500
};
export class InputSanitizer {
    static sanitizeString(input, fieldName, maxLength) {
        if (typeof input !== 'string') {
            throw new ValidationError(`${fieldName} must be a string`, [{ field: fieldName, message: 'Invalid type', value: input }]);
        }
        const sanitized = input.trim();
        const limit = maxLength || MAX_LENGTHS[fieldName] || 1000;
        if (sanitized.length > limit) {
            throw new ValidationError(`${fieldName} exceeds maximum length of ${limit}`, [{ field: fieldName, message: 'Too long', value: sanitized.length }]);
        }
        if (sanitized.length === 0) {
            throw new ValidationError(`${fieldName} cannot be empty`, [{ field: fieldName, message: 'Required', value: sanitized }]);
        }
        for (const pattern of SQL_INJECTION_PATTERNS) {
            if (pattern.test(sanitized)) {
                logger.warn('Potential SQL injection attempt detected', {
                    field: fieldName,
                    pattern: pattern.toString()
                });
                throw new ValidationError(`${fieldName} contains invalid characters`, [{ field: fieldName, message: 'Invalid characters', value: 'hidden' }]);
            }
        }
        return sanitized;
    }
    static sanitizeNumber(input, fieldName, options) {
        const num = Number(input);
        if (isNaN(num)) {
            throw new ValidationError(`${fieldName} must be a number`, [{ field: fieldName, message: 'Invalid number', value: input }]);
        }
        if (!options?.allowFloat && !Number.isInteger(num)) {
            throw new ValidationError(`${fieldName} must be an integer`, [{ field: fieldName, message: 'Must be integer', value: num }]);
        }
        if (options?.min !== undefined && num < options.min) {
            throw new ValidationError(`${fieldName} must be at least ${options.min}`, [{ field: fieldName, message: 'Too small', value: num }]);
        }
        if (options?.max !== undefined && num > options.max) {
            throw new ValidationError(`${fieldName} must be at most ${options.max}`, [{ field: fieldName, message: 'Too large', value: num }]);
        }
        return num;
    }
    static sanitizeBoolean(input, fieldName) {
        if (typeof input === 'boolean') {
            return input;
        }
        if (typeof input === 'string') {
            const lower = input.toLowerCase();
            if (['true', '1', 'yes', 'on'].includes(lower)) {
                return true;
            }
            if (['false', '0', 'no', 'off'].includes(lower)) {
                return false;
            }
        }
        if (typeof input === 'number') {
            return input !== 0;
        }
        throw new ValidationError(`${fieldName} must be a boolean`, [{ field: fieldName, message: 'Invalid boolean', value: input }]);
    }
    static sanitizeDate(input, fieldName) {
        if (typeof input !== 'string') {
            throw new ValidationError(`${fieldName} must be a date string`, [{ field: fieldName, message: 'Invalid type', value: input }]);
        }
        const date = new Date(input);
        if (isNaN(date.getTime())) {
            throw new ValidationError(`${fieldName} must be a valid date`, [{ field: fieldName, message: 'Invalid date', value: input }]);
        }
        return date.toISOString();
    }
    static sanitizePath(input, fieldName) {
        const path = this.sanitizeString(input, fieldName, MAX_LENGTHS.path);
        for (const pattern of PATH_TRAVERSAL_PATTERNS) {
            if (pattern.test(path)) {
                logger.warn('Path traversal attempt detected', {
                    field: fieldName,
                    pattern: pattern.toString()
                });
                throw new ValidationError(`${fieldName} contains invalid path characters`, [{ field: fieldName, message: 'Invalid path', value: 'hidden' }]);
            }
        }
        const normalized = path.replace(/\\/g, '/');
        return normalized.replace(/^\/+/, '');
    }
    static sanitizeArray(input, fieldName, elementSanitizer, options) {
        if (!Array.isArray(input)) {
            throw new ValidationError(`${fieldName} must be an array`, [{ field: fieldName, message: 'Invalid type', value: input }]);
        }
        if (options?.minLength !== undefined && input.length < options.minLength) {
            throw new ValidationError(`${fieldName} must have at least ${options.minLength} items`, [{ field: fieldName, message: 'Too few items', value: input.length }]);
        }
        if (options?.maxLength !== undefined && input.length > options.maxLength) {
            throw new ValidationError(`${fieldName} must have at most ${options.maxLength} items`, [{ field: fieldName, message: 'Too many items', value: input.length }]);
        }
        return input.map((element, index) => {
            try {
                return elementSanitizer(element, index);
            }
            catch (error) {
                if (error instanceof ValidationError) {
                    throw new ValidationError(`${fieldName}[${index}]: ${error.message}`, error.errors);
                }
                throw error;
            }
        });
    }
    static escapeHtml(text) {
        const htmlEscapes = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;'
        };
        return text.replace(/[&<>"'/]/g, char => htmlEscapes[char]);
    }
    static sanitizeSearchQuery(input) {
        const query = this.sanitizeString(input, 'query', MAX_LENGTHS.query);
        let sanitized = query.replace(/[%_]/g, '');
        sanitized = sanitized.replace(/[*?]/g, match => `\\${match}`);
        return sanitized;
    }
    static sanitizeEnum(input, fieldName, allowedValues) {
        const value = this.sanitizeString(input, fieldName);
        if (!allowedValues.includes(value)) {
            throw new ValidationError(`${fieldName} must be one of: ${allowedValues.join(', ')}`, [{ field: fieldName, message: 'Invalid value', value }]);
        }
        return value;
    }
}
export function createSanitizationMiddleware(schema) {
    return (data) => {
        if (typeof data !== 'object' || data === null) {
            throw new ValidationError('Invalid input data', []);
        }
        const sanitized = {};
        const inputData = data;
        for (const [field, sanitizer] of Object.entries(schema)) {
            if (field in inputData) {
                try {
                    sanitized[field] = sanitizer(inputData[field]);
                }
                catch (error) {
                    if (error instanceof ValidationError) {
                        throw error;
                    }
                    throw new ValidationError(`Failed to validate ${field}`, [{ field, message: 'Validation error', value: inputData[field] }]);
                }
            }
        }
        return sanitized;
    };
}
