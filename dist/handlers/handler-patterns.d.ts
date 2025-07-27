/**
 * @ai-context Common handler patterns
 * @ai-pattern Reusable handler logic
 * @ai-critical Ensures consistent behavior across handlers
 * @ai-why Eliminates duplicate code in handlers
 * @ai-assumption All handlers follow similar patterns
 */
import type { BaseHandler } from './base-handler.js';
import { ToolResponse } from './base-handler.js';
import { z } from 'zod';
/**
 * @ai-intent Common handler response patterns
 * @ai-pattern Standardized response formatting
 */
export declare class HandlerPatterns {
    /**
     * @ai-intent Create standard CRUD handlers
     * @ai-pattern Factory for common operations
     */
    static createCrudHandlers<T extends {
        id: number | string;
        title: string;
    }>(handler: BaseHandler, entityName: string, operations: {
        getAll: () => Promise<T[]>;
        getById: (id: number | string) => Promise<T | null>;
        create: (data: any) => Promise<T>;
        update: (id: number | string, data: any) => Promise<T | null>;
        delete: (id: number | string) => Promise<boolean>;
    }, schemas: {
        create: z.ZodSchema<any>;
        update: z.ZodSchema<any>;
        delete: z.ZodSchema<any>;
    }, formatters?: {
        list?: (items: T[]) => string;
        detail?: (item: T) => string;
    }): {
        /**
         * @ai-intent Handle list operation
         * @ai-pattern Standard list response
         */
        handleList: import("./base-handler.js").HandlerMethod<unknown, ToolResponse>;
        /**
         * @ai-intent Handle get by ID operation
         * @ai-pattern Standard detail response
         */
        handleGetById: import("./base-handler.js").HandlerMethod<unknown, ToolResponse>;
        /**
         * @ai-intent Handle create operation
         * @ai-pattern Standard creation response
         */
        handleCreate: import("./base-handler.js").HandlerMethod<unknown, ToolResponse>;
        /**
         * @ai-intent Handle update operation
         * @ai-pattern Standard update response
         */
        handleUpdate: import("./base-handler.js").HandlerMethod<unknown, ToolResponse>;
        /**
         * @ai-intent Handle delete operation
         * @ai-pattern Standard deletion response
         */
        handleDelete: import("./base-handler.js").HandlerMethod<unknown, ToolResponse>;
    };
    /**
     * @ai-intent Create search handler
     * @ai-pattern Standard search operation
     */
    static createSearchHandler<T extends {
        id: number | string;
        title: string;
    }>(handler: BaseHandler, entityName: string, searchOperation: (query: string, filters?: any) => Promise<T[]>, schema: z.ZodSchema<any>, formatter?: (items: T[]) => string): import("./base-handler.js").HandlerMethod<unknown, ToolResponse>;
    /**
     * @ai-intent Create tag-based search handler
     * @ai-pattern Standard tag search
     */
    static createTagSearchHandler<T>(handler: BaseHandler, entityName: string, searchByTag: (tag: string) => Promise<T[]>, formatter: (items: T[]) => string): import("./base-handler.js").HandlerMethod<unknown, ToolResponse>;
    /**
     * @ai-intent Create batch operation handler
     * @ai-pattern Standard batch processing
     */
    static createBatchHandler<T, R>(handler: BaseHandler, operationName: string, batchOperation: (items: T[]) => Promise<R[]>, schema: z.ZodSchema<{
        items: T[];
    }>, formatter: (results: R[]) => string): import("./base-handler.js").HandlerMethod<unknown, ToolResponse>;
    /**
     * @ai-intent Create date range handler
     * @ai-pattern Standard date filtering
     */
    static createDateRangeHandler<T>(handler: BaseHandler, entityName: string, operation: (startDate?: string, endDate?: string) => Promise<T[]>, formatter: (items: T[]) => string): import("./base-handler.js").HandlerMethod<unknown, ToolResponse>;
    /**
     * @ai-intent Format date range for display
     * @ai-pattern Consistent date range formatting
     */
    private static formatDateRange;
}
/**
 * @ai-intent Response formatting helpers
 * @ai-pattern Common response formats
 */
export declare class ResponsePatterns {
    /**
     * @ai-intent Format item list as markdown table
     * @ai-pattern Table format for structured data
     */
    static formatAsTable<T extends Record<string, any>>(items: T[], columns: Array<{
        key: keyof T;
        header: string;
        formatter?: (value: any) => string;
    }>, title?: string): string;
    /**
     * @ai-intent Format items as grouped list
     * @ai-pattern Group items by a field
     */
    static formatGroupedList<T extends Record<string, any>>(items: T[], groupBy: keyof T, itemFormatter: (item: T) => string, title?: string): string;
    /**
     * @ai-intent Format summary statistics
     * @ai-pattern Statistics display format
     */
    static formatStats(stats: Record<string, number | string>, title?: string): string;
}
