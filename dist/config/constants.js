export const DATABASE_CONSTANTS = {
    TABLES: {
        STATUSES: 'statuses',
        TAGS: 'tags',
        SEQUENCES: 'sequences',
        SEARCH_ISSUES: 'search_issues',
        SEARCH_PLANS: 'search_plans',
        SEARCH_DOCS: 'search_docs',
        SEARCH_KNOWLEDGE: 'search_knowledge',
        SEARCH_SESSIONS: 'search_sessions',
        SEARCH_DAILY_SUMMARIES: 'search_daily_summaries',
        WORK_SESSIONS: 'work_sessions',
        DAILY_SUMMARIES: 'daily_summaries',
        ISSUE_TAGS: 'issue_tags',
        PLAN_TAGS: 'plan_tags',
        DOC_TAGS: 'doc_tags',
        KNOWLEDGE_TAGS: 'knowledge_tags',
        SESSION_TAGS: 'session_tags',
        SUMMARY_TAGS: 'summary_tags',
        RELATED_TASKS: 'related_tasks',
        RELATED_DOCUMENTS: 'related_documents'
    },
    DEFAULTS: {
        PAGE_SIZE: 20,
        MAX_PAGE_SIZE: 100,
        MAX_SEARCH_RESULTS: 100,
        MAX_TAG_LENGTH: 50,
        MAX_TITLE_LENGTH: 200,
        MAX_DESCRIPTION_LENGTH: 1000
    },
    FILE_PATTERNS: {
        ISSUE: 'issues-{id}.md',
        PLAN: 'plans-{id}.md',
        DOC: 'docs-{id}.md',
        KNOWLEDGE: 'knowledge-{id}.md',
        SESSION: '{date}/sessions-{timestamp}.md',
        SUMMARY: '{date}/dailies-{date}.md'
    }
};
export const ENTITY_CONSTANTS = {
    BASE_TYPES: {
        TASKS: 'tasks',
        DOCUMENTS: 'documents'
    },
    STATIC_TYPES: {
        ISSUES: 'issues',
        PLANS: 'plans',
        DOCS: 'docs',
        KNOWLEDGE: 'knowledge'
    },
    PRIORITIES: {
        HIGH: 'high',
        MEDIUM: 'medium',
        LOW: 'low'
    },
    DEFAULT_STATUSES: [
        { id: 1, name: 'Open', is_closed: false },
        { id: 2, name: 'In Progress', is_closed: false },
        { id: 3, name: 'Done', is_closed: true },
        { id: 4, name: 'Closed', is_closed: true },
        { id: 5, name: 'On Hold', is_closed: false },
        { id: 6, name: 'Cancelled', is_closed: true }
    ]
};
export const VALIDATION_CONSTANTS = {
    PATTERNS: {
        TAG_NAME: /^[a-z][a-z0-9-]*$/,
        TYPE_NAME: /^[a-z][a-z0-9_]*$/,
        DATE: /^\d{4}-\d{2}-\d{2}$/,
        TIME: /^\d{2}:\d{2}:\d{2}$/,
        SESSION_ID: /^\d{4}-\d{2}-\d{2}-\d{2}\.\d{2}\.\d{2}\.\d{3}$/,
        REFERENCE: /^[a-z][a-z0-9_]*-\d+$/
    },
    LIMITS: {
        MIN_TAG_LENGTH: 1,
        MAX_TAG_LENGTH: 50,
        MIN_TITLE_LENGTH: 1,
        MAX_TITLE_LENGTH: 200,
        MIN_CONTENT_LENGTH: 0,
        MAX_CONTENT_LENGTH: 100000,
        MIN_DESCRIPTION_LENGTH: 0,
        MAX_DESCRIPTION_LENGTH: 1000
    }
};
export const ERROR_MESSAGES = {
    VALIDATION: {
        REQUIRED_FIELD: (field) => `${field} is required`,
        INVALID_FORMAT: (field, format) => `${field} must be in ${format} format`,
        INVALID_LENGTH: (field, min, max) => `${field} must be between ${min} and ${max} characters`,
        INVALID_TYPE: (field, expected) => `${field} must be of type ${expected}`,
        INVALID_ENUM: (field, values) => `${field} must be one of: ${values.join(', ')}`,
        DATE_RANGE: 'Start date must be before or equal to end date'
    },
    ENTITY: {
        NOT_FOUND: (type, id) => `${type} with ID ${id} not found`,
        ALREADY_EXISTS: (type, identifier) => `${type} ${identifier} already exists`,
        IN_USE: (type, id) => `${type} ${id} is in use and cannot be deleted`,
        CREATE_FAILED: (type) => `Failed to create ${type}`,
        UPDATE_FAILED: (type, id) => `Failed to update ${type} ${id}`,
        DELETE_FAILED: (type, id) => `Failed to delete ${type} ${id}`
    },
    SYSTEM: {
        DATABASE_ERROR: 'A database error occurred',
        FILE_ERROR: 'A file system error occurred',
        INITIALIZATION_ERROR: 'Failed to initialize system',
        PERMISSION_ERROR: 'Permission denied',
        UNKNOWN_ERROR: 'An unknown error occurred'
    }
};
export const TIME_CONSTANTS = {
    TIMEOUTS: {
        DEFAULT_OPERATION: 30000,
        DATABASE_OPERATION: 10000,
        FILE_OPERATION: 5000,
        SEARCH_OPERATION: 15000,
        BATCH_OPERATION: 60000
    },
    RETRY: {
        MAX_ATTEMPTS: 3,
        INITIAL_DELAY: 1000,
        MAX_DELAY: 30000,
        BACKOFF_FACTOR: 2
    },
    CACHE: {
        DEFAULT_TTL: 300,
        SEARCH_TTL: 60,
        STATUS_TTL: 3600,
        TAG_TTL: 1800
    }
};
export const FORMAT_CONSTANTS = {
    DATE_FORMATS: {
        ISO: 'YYYY-MM-DD',
        DISPLAY: 'MMM D, YYYY',
        FULL: 'MMMM D, YYYY h:mm A',
        TIME: 'HH:mm:ss',
        RELATIVE: 'relative'
    },
    LIST_DISPLAY: {
        EMPTY_MESSAGE: (type) => `No ${type} found`,
        SINGLE_ITEM: (type) => `1 ${type} found`,
        MULTIPLE_ITEMS: (type, count) => `${count} ${type}s found`,
        TRUNCATE_LENGTH: 100,
        MAX_ITEMS_PREVIEW: 10
    },
    MARKDOWN: {
        HEADER_LEVEL_1: '#',
        HEADER_LEVEL_2: '##',
        HEADER_LEVEL_3: '###',
        LIST_ITEM: '-',
        BOLD: '**',
        ITALIC: '*',
        CODE: '`',
        CODE_BLOCK: '```'
    }
};
export const FEATURE_FLAGS = {
    ENABLE_AUTO_TAGGING: true,
    ENABLE_SEARCH_CACHE: true,
    ENABLE_BATCH_OPERATIONS: true,
    ENABLE_RELATED_ENTITIES: true,
    ENABLE_WORK_SESSIONS: true,
    ENABLE_DAILY_SUMMARIES: true,
    ENABLE_CUSTOM_TYPES: true,
    DEBUG_MODE: process.env.NODE_ENV === 'development',
    LOG_SQL_QUERIES: process.env.LOG_SQL === 'true',
    LOG_FILE_OPERATIONS: process.env.LOG_FILES === 'true',
    VERBOSE_ERRORS: process.env.NODE_ENV !== 'production'
};
export function getConfigValue(path, defaultValue) {
    const parts = path.split('.');
    let value = {
        DATABASE: DATABASE_CONSTANTS,
        ENTITY: ENTITY_CONSTANTS,
        VALIDATION: VALIDATION_CONSTANTS,
        ERROR: ERROR_MESSAGES,
        TIME: TIME_CONSTANTS,
        FORMAT: FORMAT_CONSTANTS,
        FEATURES: FEATURE_FLAGS
    };
    for (const part of parts) {
        if (value && typeof value === 'object' && part in value) {
            value = value[part];
        }
        else {
            return defaultValue;
        }
    }
    return value;
}
