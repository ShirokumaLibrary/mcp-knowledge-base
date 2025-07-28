/**
 * @ai-context Complete domain types with strict typing
 * @ai-pattern All any types eliminated, strict type definitions
 * @ai-critical Foundation for type safety across the application
 * @ai-dependencies None - pure type definitions
 * @ai-assumption All optional fields use undefined, not null (except dates)
 */
export * from './domain-types.js';
export { Session, Daily } from './session-types.js';
/**
 * @ai-intent Priority levels for tasks
 * @ai-pattern Strict enum to replace string type
 * @ai-critical Used in Issue and Plan entities
 */
export type Priority = 'high' | 'medium' | 'low';
/**
 * @ai-intent Valid base types for content
 * @ai-pattern Used for type validation
 * @ai-critical These are the core types that can be extended
 */
export type BaseType = 'tasks' | 'documents';
/**
 * @ai-intent Content type mapping
 * @ai-pattern Maps type names to their entities
 * @ai-usage For generic type resolution
 */
export interface TypeToEntity {
    'issues': import('./domain-types.js').Issue;
    'plans': import('./domain-types.js').Plan;
    'docs': import('./domain-types.js').Document;
    'knowledge': import('./domain-types.js').Document;
    [key: string]: import('./domain-types.js').Issue | import('./domain-types.js').Plan | import('./domain-types.js').Document;
}
/**
 * @ai-intent All valid content types
 * @ai-pattern Union of static and dynamic types
 * @ai-critical Used for type validation
 */
export type ContentType = keyof TypeToEntity;
/**
 * @ai-intent Type definition from database
 * @ai-pattern Stored in sequences table
 * @ai-critical Defines custom content types
 */
export interface TypeDefinition {
    name: string;
    base_type: BaseType;
    created_at: string;
}
/**
 * @ai-intent Search result with highlights
 * @ai-pattern Used by search repository
 * @ai-critical Includes match context
 */
export interface SearchResult<T> {
    item: T;
    score: number;
    highlights?: string[];
}
/**
 * @ai-intent Cross-type search results
 * @ai-pattern Categorized by content type
 * @ai-usage searchAll() return type
 */
export interface GlobalSearchResults {
    issues: SearchResult<import('./domain-types.js').Issue>[];
    plans: SearchResult<import('./domain-types.js').Plan>[];
    docs: SearchResult<import('./domain-types.js').Document>[];
    knowledge: SearchResult<import('./domain-types.js').Document>[];
    sessions?: SearchResult<import('./session-types.js').Session>[];
    summaries?: SearchResult<import('./session-types.js').Daily>[];
}
/**
 * @ai-intent Tag with usage statistics
 * @ai-pattern Extended tag information
 * @ai-usage getTags() return type
 */
export interface TagWithCount {
    name: string;
    createdAt?: string;
    count: number;
}
/**
 * @ai-intent Session creation options
 * @ai-pattern Optional fields for flexibility
 * @ai-usage SessionManager.createSession() input
 */
export interface CreateSessionOptions {
    title: string;
    content?: string;
    tags?: string[];
    category?: string;
    id?: string;
    datetime?: string;
    related_tasks?: string[];
    related_documents?: string[];
}
/**
 * @ai-intent Summary creation options
 * @ai-pattern All required fields
 * @ai-usage SessionManager.createDaily() input
 */
export interface CreateSummaryOptions {
    date: string;
    title: string;
    content: string;
    tags?: string[];
    related_tasks?: string[];
    related_documents?: string[];
}
/**
 * @ai-intent Type guards for runtime validation
 * @ai-pattern Compile-time and runtime type safety
 * @ai-critical Export for use in implementations
 */
export declare const TypeGuards: {
    isPriority(value: string): value is Priority;
    isBaseType(value: string): value is BaseType;
    isContentType(value: unknown): value is ContentType;
    isValidDate(value: string): boolean;
    isValidSessionId(value: string): boolean;
};
