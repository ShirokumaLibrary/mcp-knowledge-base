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
export declare const DATABASE_CONSTANTS: {
    readonly TABLES: {
        readonly STATUSES: "statuses";
        readonly TAGS: "tags";
        readonly SEQUENCES: "sequences";
        readonly SEARCH_ISSUES: "search_issues";
        readonly SEARCH_PLANS: "search_plans";
        readonly SEARCH_DOCS: "search_docs";
        readonly SEARCH_KNOWLEDGE: "search_knowledge";
        readonly SEARCH_SESSIONS: "search_sessions";
        readonly SEARCH_DAILY_SUMMARIES: "search_daily_summaries";
        readonly WORK_SESSIONS: "work_sessions";
        readonly DAILY_SUMMARIES: "daily_summaries";
        readonly ISSUE_TAGS: "issue_tags";
        readonly PLAN_TAGS: "plan_tags";
        readonly DOC_TAGS: "doc_tags";
        readonly KNOWLEDGE_TAGS: "knowledge_tags";
        readonly SESSION_TAGS: "session_tags";
        readonly SUMMARY_TAGS: "summary_tags";
        readonly RELATED_TASKS: "related_tasks";
        readonly RELATED_DOCUMENTS: "related_documents";
    };
    readonly DEFAULTS: {
        readonly PAGE_SIZE: 20;
        readonly MAX_PAGE_SIZE: 100;
        readonly MAX_SEARCH_RESULTS: 100;
        readonly MAX_TAG_LENGTH: 50;
        readonly MAX_TITLE_LENGTH: 200;
        readonly MAX_DESCRIPTION_LENGTH: 1000;
    };
    readonly FILE_PATTERNS: {
        readonly ISSUE: "issues-{id}.md";
        readonly PLAN: "plans-{id}.md";
        readonly DOC: "docs-{id}.md";
        readonly KNOWLEDGE: "knowledge-{id}.md";
        readonly SESSION: "{date}/sessions-{timestamp}.md";
        readonly SUMMARY: "{date}/dailies-{date}.md";
    };
};
/**
 * @ai-intent Entity type constants
 * @ai-pattern Type definitions and mappings
 */
export declare const ENTITY_CONSTANTS: {
    readonly BASE_TYPES: {
        readonly TASKS: "tasks";
        readonly DOCUMENTS: "documents";
    };
    readonly STATIC_TYPES: {
        readonly ISSUES: "issues";
        readonly PLANS: "plans";
        readonly DOCS: "docs";
        readonly KNOWLEDGE: "knowledge";
    };
    readonly PRIORITIES: {
        readonly HIGH: "high";
        readonly MEDIUM: "medium";
        readonly LOW: "low";
    };
    readonly DEFAULT_STATUSES: readonly [{
        readonly id: 1;
        readonly name: "Open";
        readonly is_closed: false;
    }, {
        readonly id: 2;
        readonly name: "In Progress";
        readonly is_closed: false;
    }, {
        readonly id: 3;
        readonly name: "Done";
        readonly is_closed: true;
    }, {
        readonly id: 4;
        readonly name: "Closed";
        readonly is_closed: true;
    }, {
        readonly id: 5;
        readonly name: "On Hold";
        readonly is_closed: false;
    }, {
        readonly id: 6;
        readonly name: "Cancelled";
        readonly is_closed: true;
    }];
};
/**
 * @ai-intent Validation constants
 * @ai-pattern Validation rules and patterns
 */
export declare const VALIDATION_CONSTANTS: {
    readonly PATTERNS: {
        readonly TAG_NAME: RegExp;
        readonly TYPE_NAME: RegExp;
        readonly DATE: RegExp;
        readonly TIME: RegExp;
        readonly SESSION_ID: RegExp;
        readonly REFERENCE: RegExp;
    };
    readonly LIMITS: {
        readonly MIN_TAG_LENGTH: 1;
        readonly MAX_TAG_LENGTH: 50;
        readonly MIN_TITLE_LENGTH: 1;
        readonly MAX_TITLE_LENGTH: 200;
        readonly MIN_CONTENT_LENGTH: 0;
        readonly MAX_CONTENT_LENGTH: 100000;
        readonly MIN_DESCRIPTION_LENGTH: 0;
        readonly MAX_DESCRIPTION_LENGTH: 1000;
    };
};
/**
 * @ai-intent Error message constants
 * @ai-pattern Consistent error messages
 */
export declare const ERROR_MESSAGES: {
    readonly VALIDATION: {
        readonly REQUIRED_FIELD: (field: string) => string;
        readonly INVALID_FORMAT: (field: string, format: string) => string;
        readonly INVALID_LENGTH: (field: string, min: number, max: number) => string;
        readonly INVALID_TYPE: (field: string, expected: string) => string;
        readonly INVALID_ENUM: (field: string, values: string[]) => string;
        readonly DATE_RANGE: "Start date must be before or equal to end date";
    };
    readonly ENTITY: {
        readonly NOT_FOUND: (type: string, id: string | number) => string;
        readonly ALREADY_EXISTS: (type: string, identifier: string) => string;
        readonly IN_USE: (type: string, id: string | number) => string;
        readonly CREATE_FAILED: (type: string) => string;
        readonly UPDATE_FAILED: (type: string, id: string | number) => string;
        readonly DELETE_FAILED: (type: string, id: string | number) => string;
    };
    readonly SYSTEM: {
        readonly DATABASE_ERROR: "A database error occurred";
        readonly FILE_ERROR: "A file system error occurred";
        readonly INITIALIZATION_ERROR: "Failed to initialize system";
        readonly PERMISSION_ERROR: "Permission denied";
        readonly UNKNOWN_ERROR: "An unknown error occurred";
    };
};
/**
 * @ai-intent Time constants
 * @ai-pattern Time-related settings
 */
export declare const TIME_CONSTANTS: {
    readonly TIMEOUTS: {
        readonly DEFAULT_OPERATION: 30000;
        readonly DATABASE_OPERATION: 10000;
        readonly FILE_OPERATION: 5000;
        readonly SEARCH_OPERATION: 15000;
        readonly BATCH_OPERATION: 60000;
    };
    readonly RETRY: {
        readonly MAX_ATTEMPTS: 3;
        readonly INITIAL_DELAY: 1000;
        readonly MAX_DELAY: 30000;
        readonly BACKOFF_FACTOR: 2;
    };
    readonly CACHE: {
        readonly DEFAULT_TTL: 300;
        readonly SEARCH_TTL: 60;
        readonly STATUS_TTL: 3600;
        readonly TAG_TTL: 1800;
    };
};
/**
 * @ai-intent Format constants
 * @ai-pattern Display formatting settings
 */
export declare const FORMAT_CONSTANTS: {
    readonly DATE_FORMATS: {
        readonly ISO: "YYYY-MM-DD";
        readonly DISPLAY: "MMM D, YYYY";
        readonly FULL: "MMMM D, YYYY h:mm A";
        readonly TIME: "HH:mm:ss";
        readonly RELATIVE: "relative";
    };
    readonly LIST_DISPLAY: {
        readonly EMPTY_MESSAGE: (type: string) => string;
        readonly SINGLE_ITEM: (type: string) => string;
        readonly MULTIPLE_ITEMS: (type: string, count: number) => string;
        readonly TRUNCATE_LENGTH: 100;
        readonly MAX_ITEMS_PREVIEW: 10;
    };
    readonly MARKDOWN: {
        readonly HEADER_LEVEL_1: "#";
        readonly HEADER_LEVEL_2: "##";
        readonly HEADER_LEVEL_3: "###";
        readonly LIST_ITEM: "-";
        readonly BOLD: "**";
        readonly ITALIC: "*";
        readonly CODE: "`";
        readonly CODE_BLOCK: "```";
    };
};
/**
 * @ai-intent Feature flags
 * @ai-pattern Enable/disable features
 */
export declare const FEATURE_FLAGS: {
    readonly ENABLE_AUTO_TAGGING: true;
    readonly ENABLE_SEARCH_CACHE: true;
    readonly ENABLE_BATCH_OPERATIONS: true;
    readonly ENABLE_RELATED_ENTITIES: true;
    readonly ENABLE_WORK_SESSIONS: true;
    readonly ENABLE_DAILY_SUMMARIES: true;
    readonly ENABLE_CUSTOM_TYPES: true;
    readonly DEBUG_MODE: boolean;
    readonly LOG_SQL_QUERIES: boolean;
    readonly LOG_FILE_OPERATIONS: boolean;
    readonly VERBOSE_ERRORS: boolean;
};
/**
 * @ai-intent Get configuration value with fallback
 * @ai-pattern Safe configuration access
 */
export declare function getConfigValue<T>(path: string, defaultValue: T): T;
