/**
 * @ai-context Common validation utilities
 * @ai-pattern Centralized validation logic
 * @ai-critical Ensures consistent validation across the application
 * @ai-why Eliminates duplicate validation code
 * @ai-assumption Validation rules are consistent across entities
 */

import { z } from 'zod';
import { ValidationError } from '../errors/custom-errors.js';

/**
 * @ai-intent Common field validators
 * @ai-pattern Reusable Zod schemas
 */
export const CommonValidators = {
  /**
   * @ai-intent Non-empty string validation
   * @ai-pattern Trimmed, minimum length 1
   */
  nonEmptyString: z.string().trim().min(1),

  /**
   * @ai-intent Optional string validation
   * @ai-pattern Allows undefined, trims if present
   */
  optionalString: z.string().trim().optional(),

  /**
   * @ai-intent Tag name validation
   * @ai-pattern Lowercase letters and hyphens only
   */
  tagName: z.string()
    .trim()
    .min(1, 'Tag name is required')
    .regex(/^[a-z][a-z0-9-]*$/, 'Tag name must start with a letter and contain only lowercase letters, numbers, and hyphens'),

  /**
   * @ai-intent Priority validation
   * @ai-pattern Enum of high, medium, low
   */
  priority: z.enum(['high', 'medium', 'low']),

  /**
   * @ai-intent Version string validation
   * @ai-pattern Strict semantic version format: X.Y.Z where X, Y, Z are numbers
   */
  versionString: z.string()
    .trim()
    .regex(/^\d+\.\d+\.\d+$/, 'Version must be in X.Y.Z format where X, Y, Z are numbers'),

  /**
   * @ai-intent Date string validation
   * @ai-pattern YYYY-MM-DD format with valid date check
   */
  dateString: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine((val) => {
      const [year, month, day] = val.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.getFullYear() === year &&
             date.getMonth() === month - 1 &&
             date.getDate() === day;
    }, 'Invalid date'),

  /**
   * @ai-intent Optional date string
   * @ai-pattern YYYY-MM-DD or undefined
   */
  optionalDateString: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),

  /**
   * @ai-intent Nullable date string
   * @ai-pattern YYYY-MM-DD, null, or undefined
   */
  nullableDateString: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .nullable()
    .optional(),

  /**
   * @ai-intent Time string validation
   * @ai-pattern HH:MM:SS format
   */
  timeString: z.string()
    .regex(/^\d{2}:\d{2}:\d{2}$/, 'Time must be in HH:MM:SS format'),

  /**
   * @ai-intent Session ID validation
   * @ai-pattern YYYY-MM-DD-HH.MM.SS.sss format
   */
  sessionId: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}-\d{2}\.\d{2}\.\d{2}\.\d{3}$/, 'Session ID must be in YYYY-MM-DD-HH.MM.SS.sss format'),

  /**
   * @ai-intent Tag array validation
   * @ai-pattern Array of valid tag names
   */
  tagArray: z.array(z.string()).optional(),

  /**
   * @ai-intent ID array validation
   * @ai-pattern Array of strings for references
   */
  idArray: z.array(z.string()).optional(),

  /**
   * @ai-intent Positive integer validation
   * @ai-pattern Integer greater than 0
   */
  positiveInt: z.number().int().positive(),

  /**
   * @ai-intent Boolean with default
   * @ai-pattern Defaults to false if not provided
   */
  booleanDefault: (defaultValue: boolean = false) =>
    z.boolean().optional().default(defaultValue),

  /**
   * @ai-intent Content type validation
   * @ai-pattern Dynamic type validation
   */
  contentType: z.string()
    .regex(/^[a-z][a-z0-9_]*$/, 'Type must start with a letter and contain only lowercase letters, numbers, and underscores'),

  /**
   * @ai-intent Reference string validation
   * @ai-pattern Format: type-id
   */
  reference: z.string()
    .regex(/^[a-z][a-z0-9_]*-\d+$/, 'Reference must be in format: type-id'),

  /**
   * @ai-intent Reference array validation
   * @ai-pattern Array of type-id references
   */
  referenceArray: z.array(
    z.string().regex(/^[a-z][a-z0-9_]*-\d+$/, 'Reference must be in format: type-id')
  ).optional()
};

/**
 * @ai-intent Validation helper functions
 * @ai-pattern Common validation operations
 */
export class ValidationUtils {
  /**
   * @ai-intent Validate and clean tags
   * @ai-flow 1. Filter empty -> 2. Trim -> 3. Deduplicate -> 4. Sort
   * @ai-pattern Consistent tag processing
   */
  static cleanTags(tags?: string[]): string[] {
    if (!tags || tags.length === 0) {
      return [];
    }

    // @ai-logic: Clean and deduplicate
    const cleaned = tags
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    // @ai-logic: Remove duplicates and sort
    return Array.from(new Set(cleaned)).sort();
  }

  /**
   * @ai-intent Validate date range
   * @ai-flow Check start is before or equal to end
   * @ai-pattern Common date range validation
   */
  static validateDateRange(
    startDate?: string | null,
    endDate?: string | null
  ): void {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start > end) {
        throw new ValidationError(
          'Invalid date range',
          [{
            field: 'date_range',
            message: 'Start date must be before or equal to end date',
            value: { start_date: startDate, end_date: endDate }
          }]
        );
      }
    }
  }

  /**
   * @ai-intent Parse and validate references
   * @ai-flow 1. Validate format -> 2. Group by type -> 3. Return map
   * @ai-pattern Reference parsing and grouping
   */
  static parseReferences(
    references?: string[]
  ): Map<string, number[]> {
    const grouped = new Map<string, number[]>();

    if (!references || references.length === 0) {
      return grouped;
    }

    for (const ref of references) {
      const match = ref.match(/^([a-z][a-z0-9_]*)-(\d+)$/);

      if (!match) {
        throw new ValidationError(
          'Invalid reference format',
          [{
            field: 'reference',
            message: 'Reference must be in format: type-id',
            value: ref
          }]
        );
      }

      const [, type, id] = match;
      const numId = parseInt(id, 10);

      if (!grouped.has(type)) {
        grouped.set(type, []);
      }

      grouped.get(type)!.push(numId);
    }

    return grouped;
  }

  /**
   * @ai-intent Validate required fields
   * @ai-flow Check all required fields are present
   * @ai-pattern Generic required field validation
   */
  static validateRequired<T extends Record<string, any>>(
    data: T,
    requiredFields: (keyof T)[]
  ): void {
    const errors: Array<{ field: string; message: string }> = [];

    for (const field of requiredFields) {
      if (
        data[field] === undefined ||
        data[field] === null ||
        (typeof data[field] === 'string' && data[field].trim() === '')
      ) {
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

  /**
   * @ai-intent Sanitize string input
   * @ai-flow Trim and normalize whitespace
   * @ai-pattern Consistent string cleaning
   */
  static sanitizeString(input?: string): string {
    if (!input) {
      return '';
    }

    return input
      .trim()
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  /**
   * @ai-intent Validate enum value
   * @ai-flow Check if value is in allowed list
   * @ai-pattern Generic enum validation
   */
  static validateEnum<T extends string>(
    value: string,
    allowedValues: readonly T[],
    fieldName: string
  ): T {
    if (!allowedValues.includes(value as T)) {
      throw new ValidationError(
        `Invalid ${fieldName}`,
        [{
          field: fieldName,
          message: `Must be one of: ${allowedValues.join(', ')}`,
          value
        }]
      );
    }

    return value as T;
  }

  /**
   * @ai-intent Create pagination parameters
   * @ai-flow Validate and set defaults
   * @ai-pattern Consistent pagination
   */
  static getPaginationParams(
    page?: number,
    limit?: number
  ): { offset: number; limit: number } {
    const validPage = Math.max(1, page || 1);
    const validLimit = Math.min(100, Math.max(1, limit || 20));

    return {
      offset: (validPage - 1) * validLimit,
      limit: validLimit
    };
  }

  /**
   * @ai-intent Validate ID format
   * @ai-flow Check if valid positive integer
   * @ai-pattern Common ID validation
   */
  static validateId(id: unknown, fieldName: string = 'id'): number {
    const parsed = Number(id);

    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new ValidationError(
        `Invalid ${fieldName}`,
        [{
          field: fieldName,
          message: 'Must be a positive integer',
          value: id
        }]
      );
    }

    return parsed;
  }
}

/**
 * @ai-intent Create reusable schema builders
 * @ai-pattern Schema composition
 */
export class SchemaBuilders {
  /**
   * @ai-intent Build entity creation schema
   * @ai-pattern Common create operation fields
   */
  static createSchema(additionalFields: z.ZodRawShape = {}) {
    return z.object({
      title: CommonValidators.nonEmptyString,
      description: CommonValidators.optionalString,
      tags: CommonValidators.tagArray,
      ...additionalFields
    });
  }

  /**
   * @ai-intent Build entity update schema
   * @ai-pattern All fields optional for partial updates
   */
  static updateSchema(additionalFields: z.ZodRawShape = {}) {
    return z.object({
      title: CommonValidators.optionalString,
      description: CommonValidators.optionalString,
      tags: CommonValidators.tagArray,
      ...additionalFields
    }).partial();
  }

  /**
   * @ai-intent Build search schema
   * @ai-pattern Common search parameters
   */
  static searchSchema(additionalFields: z.ZodRawShape = {}) {
    return z.object({
      query: CommonValidators.optionalString,
      tags: CommonValidators.tagArray,
      page: z.number().int().positive().optional(),
      limit: z.number().int().positive().max(100).optional(),
      ...additionalFields
    });
  }

  /**
   * @ai-intent Build date range schema
   * @ai-pattern Common date filtering
   */
  static dateRangeSchema(additionalFields: z.ZodRawShape = {}) {
    return z.object({
      start_date: CommonValidators.optionalDateString,
      end_date: CommonValidators.optionalDateString,
      ...additionalFields
    }).refine(
      data => {
        if (data.start_date && data.end_date) {
          return new Date(data.start_date) <= new Date(data.end_date);
        }
        return true;
      },
      {
        message: 'Start date must be before or equal to end date',
        path: ['date_range']
      }
    );
  }
}