/**
 * @ai-context Complete domain types with strict typing
 * @ai-pattern All any types eliminated, strict type definitions
 * @ai-critical Foundation for type safety across the application
 * @ai-dependencies None - pure type definitions
 * @ai-assumption All optional fields use undefined, not null (except dates)
 */
// Re-export existing domain types
export * from './domain-types.js';
/**
 * @ai-intent Type guards for runtime validation
 * @ai-pattern Compile-time and runtime type safety
 * @ai-critical Export for use in implementations
 */
export const TypeGuards = {
    isPriority(value) {
        return ['high', 'medium', 'low'].includes(value);
    },
    isBaseType(value) {
        return ['tasks', 'documents'].includes(value);
    },
    isContentType(value) {
        if (typeof value !== 'string') {
            return false;
        }
        // Static types
        const staticTypes = ['issues', 'plans', 'docs', 'knowledge'];
        return staticTypes.includes(value) ||
            // Dynamic types must be validated against database
            /^[a-z][a-z0-9_]*$/.test(value);
    },
    isValidDate(value) {
        return /^\d{4}-\d{2}-\d{2}$/.test(value);
    },
    isValidSessionId(value) {
        return /^\d{4}-\d{2}-\d{2}-\d{2}\.\d{2}\.\d{2}\.\d{3}$/.test(value);
    }
};
//# sourceMappingURL=complete-domain-types.js.map