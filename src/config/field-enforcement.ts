import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

export type EnforcementMode = 'off' | 'warn' | 'error';

export const ENFORCE_FIELD_REMOVAL: EnforcementMode =
  (process.env.ENFORCE_FIELD_REMOVAL as EnforcementMode) || 'error';

interface CheckContext {
  logger?: {
    warn: (event: string, data: Record<string, unknown>) => void;
  };
  source?: string;
  response?: {
    headers?: Record<string, string>;
  };
}

export function checkLegacyFields(params: Record<string, unknown>, context?: CheckContext): Record<string, unknown> {
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
    // Use logger instead of console for warnings
    if (context?.logger) {
      context.logger.warn('legacy_field_usage', {
        message,
        timestamp: Date.now(),
        source: context.source || 'unknown',
        fields: Object.keys(params).filter(k =>
          k === 'related_documents' || k === 'related_tasks'
        ),
        mode: 'warn'
      });
    }

    // Transform for external integrations
    return transformLegacyFields(params, context);
  } else {
    // mode === 'error'
    throw new McpError(
      ErrorCode.InvalidRequest,
      message
    );
  }
}

// Transform legacy fields for external integrations
export function transformLegacyFields(params: Record<string, unknown>, context?: CheckContext): Record<string, unknown> {
  const transformed = { ...params };
  const related = new Set(Array.isArray(params.related) ? params.related : []);

  if (Array.isArray(params.related_documents)) {
    params.related_documents.forEach((id: unknown) => {
      if (typeof id === 'string') {
        related.add(id);
      }
    });
    delete transformed.related_documents;
  }

  if (Array.isArray(params.related_tasks)) {
    params.related_tasks.forEach((id: unknown) => {
      if (typeof id === 'string') {
        related.add(id);
      }
    });
    delete transformed.related_tasks;
  }

  if (related.size > 0) {
    transformed.related = Array.from(related);
  }

  // Add deprecation header if in HTTP context
  if (context?.response) {
    context.response.headers = context.response.headers || {};
    context.response.headers['X-Deprecation-Warning'] =
      'related_documents and related_tasks are deprecated. Use related field.';
  }

  return transformed;
}