/**
 * @ai-context Data transformation utilities
 * @ai-pattern Common data conversion and formatting
 * @ai-critical Ensures consistent data representation
 * @ai-why Centralizes transformation logic
 * @ai-assumption Data formats are consistent across the application
 */
import type { Issue, Plan, Document } from '../types/domain-types.js';
/**
 * @ai-intent Response error type
 * @ai-pattern Structured error format
 */
interface ResponseError {
    message: string;
    code?: string;
    details?: unknown;
}
import type { Session, Priority } from '../types/complete-domain-types.js';
/**
 * @ai-intent Entity to markdown transformers
 * @ai-pattern Consistent markdown formatting
 */
export declare class MarkdownTransformers {
    /**
     * @ai-intent Format issue as markdown
     * @ai-pattern Structured issue display
     */
    static formatIssue(issue: Issue): string;
    /**
     * @ai-intent Format plan as markdown
     * @ai-pattern Similar to issue but always has dates
     */
    static formatPlan(plan: Plan): string;
    /**
     * @ai-intent Format document as markdown
     * @ai-pattern Document display format
     */
    static formatDocument(doc: Document): string;
    /**
     * @ai-intent Format work session as markdown
     * @ai-pattern Session display format
     */
    static formatSession(session: Session): string;
    /**
     * @ai-intent Format date for display
     * @ai-pattern Consistent date formatting
     */
    private static formatDate;
}
/**
 * @ai-intent Data converters between formats
 * @ai-pattern Type conversions and mappings
 */
export declare class DataConverters {
    /**
     * @ai-intent Convert database row to domain entity
     * @ai-pattern Generic row mapping
     */
    static rowToEntity<T>(row: Record<string, unknown>, fieldMap: Record<string, string>): T;
    /**
     * @ai-intent Convert entity to database row
     * @ai-pattern Inverse of rowToEntity
     */
    static entityToRow<T>(entity: T, fieldMap: Record<string, string>): Record<string, unknown>;
    /**
     * @ai-intent Parse JSON safely
     * @ai-pattern Returns default on error
     */
    static parseJsonSafe<T>(json: string, defaultValue: T): T;
    /**
     * @ai-intent Convert tags to CSV
     * @ai-pattern For database storage
     */
    static tagsToCSV(tags?: string[]): string;
    /**
     * @ai-intent Parse CSV to tags
     * @ai-pattern From database storage
     */
    static csvToTags(csv?: string): string[];
    /**
     * @ai-intent Convert boolean to SQLite integer
     * @ai-pattern SQLite boolean representation
     */
    static booleanToInt(value?: boolean): number;
    /**
     * @ai-intent Convert SQLite integer to boolean
     * @ai-pattern Inverse of booleanToInt
     */
    static intToBoolean(value: number | null | undefined): boolean;
    /**
     * @ai-intent Normalize priority value
     * @ai-pattern Ensure valid priority
     */
    static normalizePriority(priority?: string): Priority;
    /**
     * @ai-intent Create reference string
     * @ai-pattern type-id format
     */
    static createReference(type: string, id: number | string): string;
    /**
     * @ai-intent Parse reference string
     * @ai-pattern Extract type and id
     */
    static parseReference(ref: string): {
        type: string;
        id: string;
    } | null;
}
/**
 * @ai-intent Response formatters for API
 * @ai-pattern Consistent API responses
 */
export declare class ResponseFormatters {
    /**
     * @ai-intent Format success response
     * @ai-pattern Standard success format
     */
    static success<T>(data: T, message?: string): {
        success: true;
        data: T;
        message?: string;
    };
    /**
     * @ai-intent Format error response
     * @ai-pattern Standard error format
     */
    static error(message: string, code?: string, details?: unknown): {
        success: false;
        error: ResponseError;
    };
    /**
     * @ai-intent Format list response
     * @ai-pattern Paginated list format
     */
    static list<T>(items: T[], total: number, page: number, limit: number): {
        items: T[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    };
    /**
     * @ai-intent Format summary response
     * @ai-pattern Entity summary format
     */
    static summary<T extends Record<string, unknown>>(entity: T): Omit<T, 'content'>;
}
/**
 * @ai-intent Field mappers for database operations
 * @ai-pattern Centralized field mappings
 */
export declare const FieldMappings: {
    issue: {
        id: string;
        title: string;
        content: string;
        priority: string;
        status: string;
        statusId: string;
        createdAt: string;
        updatedAt: string;
        description: string;
        startDate: string;
        endDate: string;
    };
    document: {
        id: string;
        type: string;
        title: string;
        content: string;
        createdAt: string;
        updatedAt: string;
        description: string;
    };
    session: {
        id: string;
        title: string;
        content: string;
        category: string;
        date: string;
        startTime: string;
        endTime: string;
        summary: string;
        createdAt: string;
        updatedAt: string;
    };
};
export {};
