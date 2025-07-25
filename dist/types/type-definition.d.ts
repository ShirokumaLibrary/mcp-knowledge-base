/**
 * @ai-context Type definition for dynamic content types
 * @ai-pattern Extensible type system for user-defined content types
 * @ai-critical Core structure for dynamic type management
 */
export interface FieldDefinition {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'text';
    required: boolean;
    description?: string;
    default?: any;
    validation?: {
        min?: number;
        max?: number;
        pattern?: string;
        enum?: string[];
    };
}
export interface TypeDefinition {
    name: string;
    description: string;
    fields: FieldDefinition[];
    inherits_from?: 'base' | 'document' | 'task';
    created_at: string;
    updated_at: string;
}
export declare const BASE_FIELDS: FieldDefinition[];
export declare const DOCUMENT_FIELDS: FieldDefinition[];
export declare const TASK_FIELDS: FieldDefinition[];
