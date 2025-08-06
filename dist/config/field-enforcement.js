import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
export const ENFORCE_FIELD_REMOVAL = process.env.ENFORCE_FIELD_REMOVAL || 'error';
export function checkLegacyFields(params, context) {
    if (ENFORCE_FIELD_REMOVAL === 'off') {
        return params;
    }
    const hasLegacyFields = 'related_documents' in params || 'related_tasks' in params;
    if (!hasLegacyFields) {
        return params;
    }
    const message = 'Legacy fields (related_documents/related_tasks) detected. ' +
        'Use the unified "related" field instead. ' +
        'Run "npm run migrate:related" to migrate existing data.';
    if (ENFORCE_FIELD_REMOVAL === 'warn') {
        if (context?.logger) {
            context.logger.warn('legacy_field_usage', {
                message,
                timestamp: Date.now(),
                source: context.source || 'unknown',
                fields: Object.keys(params).filter(k => k === 'related_documents' || k === 'related_tasks'),
                mode: 'warn'
            });
        }
        return transformLegacyFields(params, context);
    }
    else {
        throw new McpError(ErrorCode.InvalidRequest, message);
    }
}
export function transformLegacyFields(params, context) {
    const transformed = { ...params };
    const related = new Set(Array.isArray(params.related) ? params.related : []);
    if (Array.isArray(params.related_documents)) {
        params.related_documents.forEach((id) => {
            if (typeof id === 'string') {
                related.add(id);
            }
        });
        delete transformed.related_documents;
    }
    if (Array.isArray(params.related_tasks)) {
        params.related_tasks.forEach((id) => {
            if (typeof id === 'string') {
                related.add(id);
            }
        });
        delete transformed.related_tasks;
    }
    if (related.size > 0) {
        transformed.related = Array.from(related);
    }
    if (context?.response) {
        context.response.headers = context.response.headers || {};
        context.response.headers['X-Deprecation-Warning'] =
            'related_documents and related_tasks are deprecated. Use related field.';
    }
    return transformed;
}
