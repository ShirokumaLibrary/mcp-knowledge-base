/**
 * @ai-context Input sanitization utilities for security
 * @ai-pattern Defense in depth - sanitize all user inputs
 * @ai-critical Prevents injection attacks and XSS
 * @ai-why First line of defense against malicious input
 */
import { createLogger } from '../utils/logger.js';
import { ValidationError } from '../errors/custom-errors.js';
const logger = createLogger('InputSanitizer');
/**
 * @ai-intent SQL injection prevention patterns
 * @ai-pattern Blacklist dangerous SQL keywords
 * @ai-critical Must be comprehensive but not too restrictive
 */
const SQL_INJECTION_PATTERNS = [
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript|vbscript)\b)/gi,
    /(--|\||;|\/\*|\*\/|xp_|sp_)/gi,
    /(<script|<\/script|javascript:|onerror=|onload=|onclick=|<iframe|<object|<embed)/gi
];
/**
 * @ai-intent Path traversal prevention patterns
 * @ai-pattern Block directory traversal attempts
 */
const PATH_TRAVERSAL_PATTERNS = [
    /\.\./g,
    /\.\.%2[fF]/g,
    /%2[eE]\./g,
    /\.\.\\/g,
    /\.\.%5[cC]/g
];
/**
 * @ai-intent Maximum input lengths
 * @ai-pattern Prevent DoS through large inputs
 */
const MAX_LENGTHS = {
    id: 50,
    title: 200,
    name: 100,
    tag: 50,
    description: 1000,
    content: 100000, // 100KB
    query: 500,
    path: 500
};
/**
 * @ai-intent Input sanitizer class
 * @ai-pattern Centralized input validation and sanitization
 * @ai-critical All user inputs must pass through this
 */
export class InputSanitizer {
    /**
     * @ai-intent Sanitize string input
     * @ai-flow 1. Check length -> 2. Trim -> 3. Check patterns -> 4. Escape
     * @ai-return Sanitized string
     * @ai-throws ValidationError if dangerous input detected
     */
    static sanitizeString(input, fieldName, maxLength) {
        // Type check
        if (typeof input !== 'string') {
            throw new ValidationError(`${fieldName} must be a string`, [{ field: fieldName, message: 'Invalid type', value: input }]);
        }
        // Trim whitespace
        const sanitized = input.trim();
        // Length check
        const limit = maxLength || MAX_LENGTHS[fieldName] || 1000;
        if (sanitized.length > limit) {
            throw new ValidationError(`${fieldName} exceeds maximum length of ${limit}`, [{ field: fieldName, message: 'Too long', value: sanitized.length }]);
        }
        // Empty check for required fields
        if (sanitized.length === 0) {
            throw new ValidationError(`${fieldName} cannot be empty`, [{ field: fieldName, message: 'Required', value: sanitized }]);
        }
        // Check for SQL injection patterns
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
    /**
     * @ai-intent Sanitize numeric input
     * @ai-pattern Ensure valid numbers within range
     * @ai-return Sanitized number
     */
    static sanitizeNumber(input, fieldName, options) {
        // Type coercion
        const num = Number(input);
        // Validation
        if (isNaN(num)) {
            throw new ValidationError(`${fieldName} must be a number`, [{ field: fieldName, message: 'Invalid number', value: input }]);
        }
        // Float check
        if (!options?.allowFloat && !Number.isInteger(num)) {
            throw new ValidationError(`${fieldName} must be an integer`, [{ field: fieldName, message: 'Must be integer', value: num }]);
        }
        // Range check
        if (options?.min !== undefined && num < options.min) {
            throw new ValidationError(`${fieldName} must be at least ${options.min}`, [{ field: fieldName, message: 'Too small', value: num }]);
        }
        if (options?.max !== undefined && num > options.max) {
            throw new ValidationError(`${fieldName} must be at most ${options.max}`, [{ field: fieldName, message: 'Too large', value: num }]);
        }
        return num;
    }
    /**
     * @ai-intent Sanitize boolean input
     * @ai-pattern Convert various truthy/falsy values
     * @ai-return Boolean value
     */
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
    /**
     * @ai-intent Sanitize date input
     * @ai-pattern Validate ISO date strings
     * @ai-return ISO date string
     */
    static sanitizeDate(input, fieldName) {
        if (typeof input !== 'string') {
            throw new ValidationError(`${fieldName} must be a date string`, [{ field: fieldName, message: 'Invalid type', value: input }]);
        }
        // Try to parse the date
        const date = new Date(input);
        if (isNaN(date.getTime())) {
            throw new ValidationError(`${fieldName} must be a valid date`, [{ field: fieldName, message: 'Invalid date', value: input }]);
        }
        // Return ISO string
        return date.toISOString();
    }
    /**
     * @ai-intent Sanitize file path
     * @ai-pattern Prevent path traversal attacks
     * @ai-critical Must block access outside allowed directories
     */
    static sanitizePath(input, fieldName) {
        const path = this.sanitizeString(input, fieldName, MAX_LENGTHS.path);
        // Check for path traversal patterns
        for (const pattern of PATH_TRAVERSAL_PATTERNS) {
            if (pattern.test(path)) {
                logger.warn('Path traversal attempt detected', {
                    field: fieldName,
                    pattern: pattern.toString()
                });
                throw new ValidationError(`${fieldName} contains invalid path characters`, [{ field: fieldName, message: 'Invalid path', value: 'hidden' }]);
            }
        }
        // Normalize slashes
        const normalized = path.replace(/\\/g, '/');
        // Remove leading slashes
        return normalized.replace(/^\/+/, '');
    }
    /**
     * @ai-intent Sanitize array input
     * @ai-pattern Validate array and each element
     * @ai-return Sanitized array
     */
    static sanitizeArray(input, fieldName, elementSanitizer, options) {
        if (!Array.isArray(input)) {
            throw new ValidationError(`${fieldName} must be an array`, [{ field: fieldName, message: 'Invalid type', value: input }]);
        }
        // Length checks
        if (options?.minLength !== undefined && input.length < options.minLength) {
            throw new ValidationError(`${fieldName} must have at least ${options.minLength} items`, [{ field: fieldName, message: 'Too few items', value: input.length }]);
        }
        if (options?.maxLength !== undefined && input.length > options.maxLength) {
            throw new ValidationError(`${fieldName} must have at most ${options.maxLength} items`, [{ field: fieldName, message: 'Too many items', value: input.length }]);
        }
        // Sanitize each element
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
    /**
     * @ai-intent Escape HTML special characters
     * @ai-pattern Prevent XSS attacks
     * @ai-usage For output that might contain user input
     */
    static escapeHtml(text) {
        const htmlEscapes = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;'
        };
        return text.replace(/[&<>"'\/]/g, char => htmlEscapes[char]);
    }
    /**
     * @ai-intent Sanitize search query
     * @ai-pattern Allow safe search operators
     * @ai-return Sanitized query string
     */
    static sanitizeSearchQuery(input) {
        const query = this.sanitizeString(input, 'query', MAX_LENGTHS.query);
        // Remove SQL wildcards that could affect LIKE queries
        let sanitized = query.replace(/[%_]/g, '');
        // Allow basic search operators but escape them
        sanitized = sanitized.replace(/[*?]/g, match => `\\${match}`);
        return sanitized;
    }
    /**
     * @ai-intent Validate enum value
     * @ai-pattern Ensure value is in allowed set
     * @ai-return Valid enum value
     */
    static sanitizeEnum(input, fieldName, allowedValues) {
        const value = this.sanitizeString(input, fieldName);
        if (!allowedValues.includes(value)) {
            throw new ValidationError(`${fieldName} must be one of: ${allowedValues.join(', ')}`, [{ field: fieldName, message: 'Invalid value', value }]);
        }
        return value;
    }
}
/**
 * @ai-intent Sanitization middleware factory
 * @ai-pattern Creates Express-style middleware
 * @ai-usage For request validation
 */
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
//# sourceMappingURL=input-sanitizer.js.map