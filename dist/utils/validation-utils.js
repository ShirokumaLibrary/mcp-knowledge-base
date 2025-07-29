import { z } from 'zod';
import { ValidationError } from '../errors/custom-errors.js';
export const CommonValidators = {
    nonEmptyString: z.string().trim().min(1),
    optionalString: z.string().trim().optional(),
    tagName: z.string()
        .trim()
        .min(1, 'Tag name is required')
        .regex(/^[a-z][a-z0-9-]*$/, 'Tag name must start with a letter and contain only lowercase letters, numbers, and hyphens'),
    priority: z.enum(['high', 'medium', 'low']),
    dateString: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
        .refine((val) => {
        const [year, month, day] = val.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date.getFullYear() === year &&
            date.getMonth() === month - 1 &&
            date.getDate() === day;
    }, 'Invalid date'),
    optionalDateString: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
        .optional(),
    nullableDateString: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
        .nullable()
        .optional(),
    timeString: z.string()
        .regex(/^\d{2}:\d{2}:\d{2}$/, 'Time must be in HH:MM:SS format'),
    sessionId: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}-\d{2}\.\d{2}\.\d{2}\.\d{3}$/, 'Session ID must be in YYYY-MM-DD-HH.MM.SS.sss format'),
    tagArray: z.array(z.string()).optional(),
    idArray: z.array(z.string()).optional(),
    positiveInt: z.number().int().positive(),
    booleanDefault: (defaultValue = false) => z.boolean().optional().default(defaultValue),
    contentType: z.string()
        .regex(/^[a-z][a-z0-9_]*$/, 'Type must start with a letter and contain only lowercase letters, numbers, and underscores'),
    reference: z.string()
        .regex(/^[a-z][a-z0-9_]*-\d+$/, 'Reference must be in format: type-id'),
    referenceArray: z.array(z.string().regex(/^[a-z][a-z0-9_]*-\d+$/, 'Reference must be in format: type-id')).optional()
};
export class ValidationUtils {
    static cleanTags(tags) {
        if (!tags || tags.length === 0) {
            return [];
        }
        const cleaned = tags
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);
        return Array.from(new Set(cleaned)).sort();
    }
    static validateDateRange(startDate, endDate) {
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (start > end) {
                throw new ValidationError('Invalid date range', [{
                        field: 'date_range',
                        message: 'Start date must be before or equal to end date',
                        value: { start_date: startDate, end_date: endDate }
                    }]);
            }
        }
    }
    static parseReferences(references) {
        const grouped = new Map();
        if (!references || references.length === 0) {
            return grouped;
        }
        for (const ref of references) {
            const match = ref.match(/^([a-z][a-z0-9_]*)-(\d+)$/);
            if (!match) {
                throw new ValidationError('Invalid reference format', [{
                        field: 'reference',
                        message: 'Reference must be in format: type-id',
                        value: ref
                    }]);
            }
            const [, type, id] = match;
            const numId = parseInt(id, 10);
            if (!grouped.has(type)) {
                grouped.set(type, []);
            }
            grouped.get(type).push(numId);
        }
        return grouped;
    }
    static validateRequired(data, requiredFields) {
        const errors = [];
        for (const field of requiredFields) {
            if (data[field] === undefined ||
                data[field] === null ||
                (typeof data[field] === 'string' && data[field].trim() === '')) {
                errors.push({
                    field: String(field),
                    message: `${String(field)} is required`
                });
            }
        }
        if (errors.length > 0) {
            throw new ValidationError('Missing required fields', errors);
        }
    }
    static sanitizeString(input) {
        if (!input) {
            return '';
        }
        return input
            .trim()
            .replace(/\s+/g, ' ');
    }
    static validateEnum(value, allowedValues, fieldName) {
        if (!allowedValues.includes(value)) {
            throw new ValidationError(`Invalid ${fieldName}`, [{
                    field: fieldName,
                    message: `Must be one of: ${allowedValues.join(', ')}`,
                    value
                }]);
        }
        return value;
    }
    static getPaginationParams(page, limit) {
        const validPage = Math.max(1, page || 1);
        const validLimit = Math.min(100, Math.max(1, limit || 20));
        return {
            offset: (validPage - 1) * validLimit,
            limit: validLimit
        };
    }
    static validateId(id, fieldName = 'id') {
        const parsed = Number(id);
        if (!Number.isInteger(parsed) || parsed <= 0) {
            throw new ValidationError(`Invalid ${fieldName}`, [{
                    field: fieldName,
                    message: 'Must be a positive integer',
                    value: id
                }]);
        }
        return parsed;
    }
}
export class SchemaBuilders {
    static createSchema(additionalFields = {}) {
        return z.object({
            title: CommonValidators.nonEmptyString,
            description: CommonValidators.optionalString,
            tags: CommonValidators.tagArray,
            ...additionalFields
        });
    }
    static updateSchema(additionalFields = {}) {
        return z.object({
            title: CommonValidators.optionalString,
            description: CommonValidators.optionalString,
            tags: CommonValidators.tagArray,
            ...additionalFields
        }).partial();
    }
    static searchSchema(additionalFields = {}) {
        return z.object({
            query: CommonValidators.optionalString,
            tags: CommonValidators.tagArray,
            page: z.number().int().positive().optional(),
            limit: z.number().int().positive().max(100).optional(),
            ...additionalFields
        });
    }
    static dateRangeSchema(additionalFields = {}) {
        return z.object({
            start_date: CommonValidators.optionalDateString,
            end_date: CommonValidators.optionalDateString,
            ...additionalFields
        }).refine(data => {
            if (data.start_date && data.end_date) {
                return new Date(data.start_date) <= new Date(data.end_date);
            }
            return true;
        }, {
            message: 'Start date must be before or equal to end date',
            path: ['date_range']
        });
    }
}
