/**
 * @ai-context Type definition for dynamic content types
 * @ai-pattern Extensible type system for user-defined content types
 * @ai-critical Core structure for dynamic type management
 */
// @ai-logic: Base fields that all custom types inherit
export const BASE_FIELDS = [
    { name: 'id', type: 'number', required: true },
    { name: 'title', type: 'string', required: true },
    { name: 'content', type: 'text', required: true },
    { name: 'tags', type: 'array', required: false },
    { name: 'created_at', type: 'date', required: true },
    { name: 'updated_at', type: 'date', required: true }
];
// @ai-logic: Additional fields for document-like types
export const DOCUMENT_FIELDS = [
    ...BASE_FIELDS,
    { name: 'description', type: 'string', required: false }
];
// @ai-logic: Additional fields for task-like types
export const TASK_FIELDS = [
    ...BASE_FIELDS,
    { name: 'status', type: 'string', required: false, default: 'Open' },
    { name: 'priority', type: 'string', required: false, default: 'medium', validation: { enum: ['high', 'medium', 'low'] } }
];
//# sourceMappingURL=type-definition.js.map