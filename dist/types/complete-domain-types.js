export * from './domain-types.js';
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
        const staticTypes = ['issues', 'plans', 'docs', 'knowledge'];
        return staticTypes.includes(value) ||
            /^[a-z][a-z0-9_]*$/.test(value);
    },
    isValidDate(value) {
        return /^\d{4}-\d{2}-\d{2}$/.test(value);
    },
    isValidSessionId(value) {
        return /^\d{4}-\d{2}-\d{2}-\d{2}\.\d{2}\.\d{2}\.\d{3}$/.test(value);
    }
};
