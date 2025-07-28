/**
 * @ai-context Application constants and configuration
 * @ai-pattern Centralized configuration values
 * @ai-critical Single source of truth for settings
 * @ai-why Eliminates magic numbers and strings
 * @ai-assumption All configurable values defined here
 */
/**
 * @ai-intent Database configuration constants
 * @ai-pattern Database-related settings
 */
export const DATABASE_CONSTANTS = {
    // Table names
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
        // Relationship tables
        ISSUE_TAGS: 'issue_tags',
        PLAN_TAGS: 'plan_tags',
        DOC_TAGS: 'doc_tags',
        KNOWLEDGE_TAGS: 'knowledge_tags',
        SESSION_TAGS: 'session_tags',
        SUMMARY_TAGS: 'summary_tags',
        RELATED_TASKS: 'related_tasks',
        RELATED_DOCUMENTS: 'related_documents'
    },
    // Default values
    DEFAULTS: {
        PAGE_SIZE: 20,
        MAX_PAGE_SIZE: 100,
        MAX_SEARCH_RESULTS: 100,
        MAX_TAG_LENGTH: 50,
        MAX_TITLE_LENGTH: 200,
        MAX_DESCRIPTION_LENGTH: 1000
    },
    // File patterns
    FILE_PATTERNS: {
        ISSUE: 'issues-{id}.md',
        PLAN: 'plans-{id}.md',
        DOC: 'docs-{id}.md',
        KNOWLEDGE: 'knowledge-{id}.md',
        SESSION: '{date}/sessions-{timestamp}.md',
        SUMMARY: '{date}/dailies-{date}.md'
    }
};
/**
 * @ai-intent Entity type constants
 * @ai-pattern Type definitions and mappings
 */
export const ENTITY_CONSTANTS = {
    // Base types
    BASE_TYPES: {
        TASKS: 'tasks',
        DOCUMENTS: 'documents'
    },
    // Static types
    STATIC_TYPES: {
        ISSUES: 'issues',
        PLANS: 'plans',
        DOCS: 'docs',
        KNOWLEDGE: 'knowledge'
    },
    // Entity priorities
    PRIORITIES: {
        HIGH: 'high',
        MEDIUM: 'medium',
        LOW: 'low'
    },
    // Default statuses
    DEFAULT_STATUSES: [
        { id: 1, name: 'Open', is_closed: false },
        { id: 2, name: 'In Progress', is_closed: false },
        { id: 3, name: 'Done', is_closed: true },
        { id: 4, name: 'Closed', is_closed: true },
        { id: 5, name: 'On Hold', is_closed: false },
        { id: 6, name: 'Cancelled', is_closed: true }
    ]
};
/**
 * @ai-intent Validation constants
 * @ai-pattern Validation rules and patterns
 */
export const VALIDATION_CONSTANTS = {
    // Regular expressions
    PATTERNS: {
        TAG_NAME: /^[a-z][a-z0-9-]*$/,
        TYPE_NAME: /^[a-z][a-z0-9_]*$/,
        DATE: /^\d{4}-\d{2}-\d{2}$/,
        TIME: /^\d{2}:\d{2}:\d{2}$/,
        SESSION_ID: /^\d{4}-\d{2}-\d{2}-\d{2}\.\d{2}\.\d{2}\.\d{3}$/,
        REFERENCE: /^[a-z][a-z0-9_]*-\d+$/
    },
    // Field limits
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
/**
 * @ai-intent Error message constants
 * @ai-pattern Consistent error messages
 */
export const ERROR_MESSAGES = {
    // Validation errors
    VALIDATION: {
        REQUIRED_FIELD: (field) => `${field} is required`,
        INVALID_FORMAT: (field, format) => `${field} must be in ${format} format`,
        INVALID_LENGTH: (field, min, max) => `${field} must be between ${min} and ${max} characters`,
        INVALID_TYPE: (field, expected) => `${field} must be of type ${expected}`,
        INVALID_ENUM: (field, values) => `${field} must be one of: ${values.join(', ')}`,
        DATE_RANGE: 'Start date must be before or equal to end date'
    },
    // Entity errors
    ENTITY: {
        NOT_FOUND: (type, id) => `${type} with ID ${id} not found`,
        ALREADY_EXISTS: (type, identifier) => `${type} ${identifier} already exists`,
        IN_USE: (type, id) => `${type} ${id} is in use and cannot be deleted`,
        CREATE_FAILED: (type) => `Failed to create ${type}`,
        UPDATE_FAILED: (type, id) => `Failed to update ${type} ${id}`,
        DELETE_FAILED: (type, id) => `Failed to delete ${type} ${id}`
    },
    // System errors
    SYSTEM: {
        DATABASE_ERROR: 'A database error occurred',
        FILE_ERROR: 'A file system error occurred',
        INITIALIZATION_ERROR: 'Failed to initialize system',
        PERMISSION_ERROR: 'Permission denied',
        UNKNOWN_ERROR: 'An unknown error occurred'
    }
};
/**
 * @ai-intent Time constants
 * @ai-pattern Time-related settings
 */
export const TIME_CONSTANTS = {
    // Timeouts (in milliseconds)
    TIMEOUTS: {
        DEFAULT_OPERATION: 30000, // 30 seconds
        DATABASE_OPERATION: 10000, // 10 seconds
        FILE_OPERATION: 5000, // 5 seconds
        SEARCH_OPERATION: 15000, // 15 seconds
        BATCH_OPERATION: 60000 // 60 seconds
    },
    // Retry settings
    RETRY: {
        MAX_ATTEMPTS: 3,
        INITIAL_DELAY: 1000, // 1 second
        MAX_DELAY: 30000, // 30 seconds
        BACKOFF_FACTOR: 2
    },
    // Cache settings
    CACHE: {
        DEFAULT_TTL: 300, // 5 minutes
        SEARCH_TTL: 60, // 1 minute
        STATUS_TTL: 3600, // 1 hour
        TAG_TTL: 1800 // 30 minutes
    }
};
/**
 * @ai-intent Format constants
 * @ai-pattern Display formatting settings
 */
export const FORMAT_CONSTANTS = {
    // Date formats
    DATE_FORMATS: {
        ISO: 'YYYY-MM-DD',
        DISPLAY: 'MMM D, YYYY',
        FULL: 'MMMM D, YYYY h:mm A',
        TIME: 'HH:mm:ss',
        RELATIVE: 'relative'
    },
    // List display
    LIST_DISPLAY: {
        EMPTY_MESSAGE: (type) => `No ${type} found`,
        SINGLE_ITEM: (type) => `1 ${type} found`,
        MULTIPLE_ITEMS: (type, count) => `${count} ${type}s found`,
        TRUNCATE_LENGTH: 100,
        MAX_ITEMS_PREVIEW: 10
    },
    // Markdown settings
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
/**
 * @ai-intent Feature flags
 * @ai-pattern Enable/disable features
 */
export const FEATURE_FLAGS = {
    // Feature toggles
    ENABLE_AUTO_TAGGING: true,
    ENABLE_SEARCH_CACHE: true,
    ENABLE_BATCH_OPERATIONS: true,
    ENABLE_RELATED_ENTITIES: true,
    ENABLE_WORK_SESSIONS: true,
    ENABLE_DAILY_SUMMARIES: true,
    ENABLE_CUSTOM_TYPES: true,
    // Debug settings
    DEBUG_MODE: process.env.NODE_ENV === 'development',
    LOG_SQL_QUERIES: process.env.LOG_SQL === 'true',
    LOG_FILE_OPERATIONS: process.env.LOG_FILES === 'true',
    VERBOSE_ERRORS: process.env.NODE_ENV !== 'production'
};
/**
 * @ai-intent Get configuration value with fallback
 * @ai-pattern Safe configuration access
 */
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
//# sourceMappingURL=constants.js.map