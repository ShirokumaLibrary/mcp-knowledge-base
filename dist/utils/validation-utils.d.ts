/**
 * @ai-context Common validation utilities
 * @ai-pattern Centralized validation logic
 * @ai-critical Ensures consistent validation across the application
 * @ai-why Eliminates duplicate validation code
 * @ai-assumption Validation rules are consistent across entities
 */
import { z } from 'zod';
/**
 * @ai-intent Common field validators
 * @ai-pattern Reusable Zod schemas
 */
export declare const CommonValidators: {
    /**
     * @ai-intent Non-empty string validation
     * @ai-pattern Trimmed, minimum length 1
     */
    nonEmptyString: z.ZodString;
    /**
     * @ai-intent Optional string validation
     * @ai-pattern Allows undefined, trims if present
     */
    optionalString: z.ZodOptional<z.ZodString>;
    /**
     * @ai-intent Tag name validation
     * @ai-pattern Lowercase letters and hyphens only
     */
    tagName: z.ZodString;
    /**
     * @ai-intent Priority validation
     * @ai-pattern Enum of high, medium, low
     */
    priority: z.ZodEnum<["high", "medium", "low"]>;
    /**
     * @ai-intent Date string validation
     * @ai-pattern YYYY-MM-DD format with valid date check
     */
    dateString: z.ZodEffects<z.ZodString, string, string>;
    /**
     * @ai-intent Optional date string
     * @ai-pattern YYYY-MM-DD or undefined
     */
    optionalDateString: z.ZodOptional<z.ZodString>;
    /**
     * @ai-intent Nullable date string
     * @ai-pattern YYYY-MM-DD, null, or undefined
     */
    nullableDateString: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    /**
     * @ai-intent Time string validation
     * @ai-pattern HH:MM:SS format
     */
    timeString: z.ZodString;
    /**
     * @ai-intent Session ID validation
     * @ai-pattern YYYY-MM-DD-HH.MM.SS.sss format
     */
    sessionId: z.ZodString;
    /**
     * @ai-intent Tag array validation
     * @ai-pattern Array of valid tag names
     */
    tagArray: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    /**
     * @ai-intent ID array validation
     * @ai-pattern Array of strings for references
     */
    idArray: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    /**
     * @ai-intent Positive integer validation
     * @ai-pattern Integer greater than 0
     */
    positiveInt: z.ZodNumber;
    /**
     * @ai-intent Boolean with default
     * @ai-pattern Defaults to false if not provided
     */
    booleanDefault: (defaultValue?: boolean) => z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    /**
     * @ai-intent Content type validation
     * @ai-pattern Dynamic type validation
     */
    contentType: z.ZodString;
    /**
     * @ai-intent Reference string validation
     * @ai-pattern Format: type-id
     */
    reference: z.ZodString;
    /**
     * @ai-intent Reference array validation
     * @ai-pattern Array of type-id references
     */
    referenceArray: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
};
/**
 * @ai-intent Validation helper functions
 * @ai-pattern Common validation operations
 */
export declare class ValidationUtils {
    /**
     * @ai-intent Validate and clean tags
     * @ai-flow 1. Filter empty -> 2. Trim -> 3. Deduplicate -> 4. Sort
     * @ai-pattern Consistent tag processing
     */
    static cleanTags(tags?: string[]): string[];
    /**
     * @ai-intent Validate date range
     * @ai-flow Check start is before or equal to end
     * @ai-pattern Common date range validation
     */
    static validateDateRange(startDate?: string | null, endDate?: string | null): void;
    /**
     * @ai-intent Parse and validate references
     * @ai-flow 1. Validate format -> 2. Group by type -> 3. Return map
     * @ai-pattern Reference parsing and grouping
     */
    static parseReferences(references?: string[]): Map<string, number[]>;
    /**
     * @ai-intent Validate required fields
     * @ai-flow Check all required fields are present
     * @ai-pattern Generic required field validation
     */
    static validateRequired<T extends Record<string, any>>(data: T, requiredFields: (keyof T)[]): void;
    /**
     * @ai-intent Sanitize string input
     * @ai-flow Trim and normalize whitespace
     * @ai-pattern Consistent string cleaning
     */
    static sanitizeString(input?: string): string;
    /**
     * @ai-intent Validate enum value
     * @ai-flow Check if value is in allowed list
     * @ai-pattern Generic enum validation
     */
    static validateEnum<T extends string>(value: string, allowedValues: readonly T[], fieldName: string): T;
    /**
     * @ai-intent Create pagination parameters
     * @ai-flow Validate and set defaults
     * @ai-pattern Consistent pagination
     */
    static getPaginationParams(page?: number, limit?: number): {
        offset: number;
        limit: number;
    };
    /**
     * @ai-intent Validate ID format
     * @ai-flow Check if valid positive integer
     * @ai-pattern Common ID validation
     */
    static validateId(id: unknown, fieldName?: string): number;
}
/**
 * @ai-intent Create reusable schema builders
 * @ai-pattern Schema composition
 */
export declare class SchemaBuilders {
    /**
     * @ai-intent Build entity creation schema
     * @ai-pattern Common create operation fields
     */
    static createSchema(additionalFields?: z.ZodRawShape): z.ZodObject<{
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        description?: string | undefined;
        tags?: string[] | undefined;
    }, {
        title: string;
        description?: string | undefined;
        tags?: string[] | undefined;
    }>;
    /**
     * @ai-intent Build entity update schema
     * @ai-pattern All fields optional for partial updates
     */
    static updateSchema(additionalFields?: z.ZodRawShape): z.ZodObject<{
        title: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        tags: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    }, "strip", z.ZodTypeAny, {
        title?: string | undefined;
        description?: string | undefined;
        tags?: string[] | undefined;
    }, {
        title?: string | undefined;
        description?: string | undefined;
        tags?: string[] | undefined;
    }>;
    /**
     * @ai-intent Build search schema
     * @ai-pattern Common search parameters
     */
    static searchSchema(additionalFields?: z.ZodRawShape): z.ZodObject<{
        query: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        page: z.ZodOptional<z.ZodNumber>;
        limit: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        tags?: string[] | undefined;
        limit?: number | undefined;
        query?: string | undefined;
        page?: number | undefined;
    }, {
        tags?: string[] | undefined;
        limit?: number | undefined;
        query?: string | undefined;
        page?: number | undefined;
    }>;
    /**
     * @ai-intent Build date range schema
     * @ai-pattern Common date filtering
     */
    static dateRangeSchema(additionalFields?: z.ZodRawShape): z.ZodEffects<z.ZodObject<{
        start_date: z.ZodOptional<z.ZodString>;
        end_date: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        start_date?: string | undefined;
        end_date?: string | undefined;
    }, {
        start_date?: string | undefined;
        end_date?: string | undefined;
    }>, {
        start_date?: string | undefined;
        end_date?: string | undefined;
    }, {
        start_date?: string | undefined;
        end_date?: string | undefined;
    }>;
}
