/**
 * @ai-context MCP tool schema definitions for external API
 * @ai-pattern Declarative tool specifications following MCP protocol
 * @ai-critical This defines the external API contract - changes break clients
 * @ai-why Centralized definitions ensure consistency across all tool types
 * @ai-assumption JSON Schema format as required by MCP specification
 */
// Tool definitions for MCP server
export const toolDefinitions = [
    // @ai-pattern CRUD operations for all content types
    // @ai-intent Single API for issues, plans, docs, and knowledge
    // @ai-why Reduces API surface and simplifies client implementation
    {
        name: 'get_items',
        description: 'Retrieve list of items by type (issue, plan, doc, knowledge). For issue/plan types, defaults to excluding closed statuses.',
        // @ai-flow Returns array of items with summary fields only
        // @ai-performance Optimized for listing - minimal data per item
        inputSchema: {
            type: 'object',
            properties: {
                type: {
                    type: 'string',
                    enum: ['issue', 'plan', 'doc', 'knowledge'],
                    description: 'Type of items to retrieve',
                },
                includeClosedStatuses: {
                    type: 'boolean',
                    description: 'Include items with closed statuses (issue/plan only, default: false)',
                },
                statusIds: {
                    type: 'array',
                    items: { type: 'number' },
                    description: 'Filter by specific status IDs (issue/plan only)',
                },
            },
            required: ['type'],
        },
    },
    {
        name: 'get_item_detail',
        description: 'Get detailed information for specified item.',
        inputSchema: {
            type: 'object',
            properties: {
                type: {
                    type: 'string',
                    enum: ['issue', 'plan', 'doc', 'knowledge'],
                    description: 'Type of item',
                },
                id: {
                    type: 'number',
                    description: 'Item ID',
                },
            },
            required: ['type', 'id'],
        },
    },
    {
        name: 'create_item',
        description: 'Create new item.',
        // @ai-flow 1. Validate type-specific fields -> 2. Create file -> 3. Sync to DB
        // @ai-critical Different types have different required fields
        // @ai-validation Content required for doc/knowledge, dates optional for plans
        inputSchema: {
            type: 'object',
            properties: {
                type: {
                    type: 'string',
                    enum: ['issue', 'plan', 'doc', 'knowledge'],
                    description: 'Type of item to create',
                },
                title: {
                    type: 'string',
                    description: 'Item title (required)',
                },
                description: {
                    type: 'string',
                    description: 'Item description (optional for all types)',
                },
                content: {
                    type: 'string',
                    description: 'Item content (required for doc/knowledge)',
                },
                priority: {
                    type: 'string',
                    enum: ['high', 'medium', 'low'],
                    description: 'Priority (for issue/plan)',
                },
                status_id: {
                    type: 'number',
                    description: 'Status ID (for issue/plan)',
                },
                tags: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of tag names',
                },
                start_date: {
                    type: 'string',
                    description: 'Start date in YYYY-MM-DD format (for plan)',
                },
                end_date: {
                    type: 'string',
                    description: 'End date in YYYY-MM-DD format (for plan)',
                },
            },
            required: ['type', 'title'],
        },
    },
    {
        name: 'update_item',
        description: 'Update existing item.',
        inputSchema: {
            type: 'object',
            properties: {
                type: {
                    type: 'string',
                    enum: ['issue', 'plan', 'doc', 'knowledge'],
                    description: 'Type of item to update',
                },
                id: {
                    type: 'number',
                    description: 'Item ID',
                },
                title: {
                    type: 'string',
                    description: 'New title',
                },
                description: {
                    type: 'string',
                    description: 'New description',
                },
                content: {
                    type: 'string',
                    description: 'New content (for doc/knowledge)',
                },
                priority: {
                    type: 'string',
                    enum: ['high', 'medium', 'low'],
                    description: 'New priority (for issue/plan)',
                },
                status_id: {
                    type: 'number',
                    description: 'New status ID (for issue/plan)',
                },
                tags: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'New array of tag names',
                },
                start_date: {
                    type: 'string',
                    description: 'New start date (for plan)',
                },
                end_date: {
                    type: 'string',
                    description: 'New end date (for plan)',
                },
            },
            required: ['type', 'id'],
        },
    },
    {
        name: 'delete_item',
        description: 'Delete item.',
        inputSchema: {
            type: 'object',
            properties: {
                type: {
                    type: 'string',
                    enum: ['issue', 'plan', 'doc', 'knowledge'],
                    description: 'Type of item to delete',
                },
                id: {
                    type: 'number',
                    description: 'Item ID',
                },
            },
            required: ['type', 'id'],
        },
    },
    {
        name: 'search_items_by_tag',
        description: 'Search items by tag, optionally filtered by types.',
        // @ai-intent Cross-type tag search for unified content discovery
        // @ai-performance May be slow with many items - consider pagination
        // @ai-return Grouped by type for easy client processing
        inputSchema: {
            type: 'object',
            properties: {
                tag: {
                    type: 'string',
                    description: 'Tag name to search for',
                },
                types: {
                    type: 'array',
                    items: {
                        type: 'string',
                        enum: ['issue', 'plan', 'doc', 'knowledge'],
                    },
                    description: 'Types to search (omit to search all types)',
                },
            },
            required: ['tag'],
        },
    },
    // @ai-pattern Status workflow management tools
    // @ai-intent Manage workflow states for issues and plans
    // @ai-critical Status IDs must exist before referencing in content
    {
        name: 'get_statuses',
        description: 'Get all available statuses.',
        inputSchema: {
            type: 'object',
            properties: {},
        },
    },
    // Status modification tools are disabled to prevent accidental changes
    // Statuses should be stable and only managed through database initialization
    // create_status, update_status and delete_status are all disabled
    // @ai-pattern Tag taxonomy management tools
    // @ai-intent Centralized tag operations for categorization
    // @ai-assumption Tags are auto-created when used in content
    {
        name: 'get_tags',
        description: 'Get all available tags.',
        inputSchema: {
            type: 'object',
            properties: {},
        },
    },
    {
        name: 'create_tag',
        description: 'Create new tag.',
        inputSchema: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    description: 'Tag name (required)',
                },
            },
            required: ['name'],
        },
    },
    {
        name: 'delete_tag',
        description: 'Delete tag.',
        inputSchema: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    description: 'Name of tag to delete (required)',
                },
            },
            required: ['name'],
        },
    },
    {
        name: 'search_tags',
        description: 'Search tags by name pattern.',
        inputSchema: {
            type: 'object',
            properties: {
                pattern: {
                    type: 'string',
                    description: 'Search pattern for tag names (required)',
                },
            },
            required: ['pattern'],
        },
    },
    // @ai-pattern Work session tracking tools
    // @ai-intent Track daily work activities and progress
    // @ai-why Sessions enable time-based queries and productivity analysis
    {
        name: 'get_sessions',
        description: 'Get work sessions. Returns today\'s sessions by default, or sessions within specified date range.',
        inputSchema: {
            type: 'object',
            properties: {
                start_date: {
                    type: 'string',
                    description: 'Start date in YYYY-MM-DD format (optional)',
                },
                end_date: {
                    type: 'string',
                    description: 'End date in YYYY-MM-DD format (optional)',
                },
            },
        },
    },
    {
        name: 'get_session_detail',
        description: 'Get detailed information for a specific work session.',
        inputSchema: {
            type: 'object',
            properties: {
                id: {
                    type: 'string',
                    description: 'Session ID (required)',
                },
            },
            required: ['id'],
        },
    },
    {
        name: 'get_latest_session',
        description: 'Get the latest work session for today.',
        inputSchema: {
            type: 'object',
            properties: {},
        },
    },
    {
        name: 'create_session',
        description: 'Create or update work session.',
        inputSchema: {
            type: 'object',
            properties: {
                id: {
                    type: 'string',
                    description: 'Session ID (optional, creates new if not specified)',
                },
                title: {
                    type: 'string',
                    description: 'Session title (required)',
                },
                description: {
                    type: 'string',
                    description: 'Session description (optional)',
                },
                content: {
                    type: 'string',
                    description: 'Session content (optional)',
                },
                tags: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of tag names (optional)',
                },
                category: {
                    type: 'string',
                    description: 'Session category (optional)',
                },
            },
            required: ['title'],
        },
    },
    {
        name: 'update_session',
        description: 'Update existing work session.',
        inputSchema: {
            type: 'object',
            properties: {
                id: {
                    type: 'string',
                    description: 'Session ID (required)',
                },
                title: {
                    type: 'string',
                    description: 'New title (optional)',
                },
                description: {
                    type: 'string',
                    description: 'New description (optional)',
                },
                content: {
                    type: 'string',
                    description: 'New content (optional)',
                },
                tags: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'New array of tag names (optional)',
                },
                category: {
                    type: 'string',
                    description: 'New category (optional)',
                },
            },
            required: ['id'],
        },
    },
    {
        name: 'search_sessions_by_tag',
        description: 'Search work sessions by tag name.',
        inputSchema: {
            type: 'object',
            properties: {
                tag: {
                    type: 'string',
                    description: 'Tag name to search for (required)',
                },
            },
            required: ['tag'],
        },
    },
    // @ai-pattern Daily summary management tools
    // @ai-intent Aggregate and summarize daily activities
    // @ai-critical One summary per date - updates replace existing
    {
        name: 'get_summaries',
        description: 'Get daily summaries. Returns last 7 days by default, or summaries within specified date range.',
        inputSchema: {
            type: 'object',
            properties: {
                start_date: {
                    type: 'string',
                    description: 'Start date in YYYY-MM-DD format (optional)',
                },
                end_date: {
                    type: 'string',
                    description: 'End date in YYYY-MM-DD format (optional)',
                },
            },
        },
    },
    {
        name: 'get_summary_detail',
        description: 'Get detailed information for a specific daily summary.',
        inputSchema: {
            type: 'object',
            properties: {
                date: {
                    type: 'string',
                    description: 'Date in YYYY-MM-DD format (required)',
                },
            },
            required: ['date'],
        },
    },
    {
        name: 'create_summary',
        description: 'Create daily summary for specified date.',
        inputSchema: {
            type: 'object',
            properties: {
                date: {
                    type: 'string',
                    description: 'Date in YYYY-MM-DD format (required)',
                },
                title: {
                    type: 'string',
                    description: 'Summary title (required)',
                },
                content: {
                    type: 'string',
                    description: 'Summary content (required)',
                },
                tags: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of tag names (optional)',
                },
            },
            required: ['date', 'title', 'content'],
        },
    },
    {
        name: 'update_summary',
        description: 'Update existing daily summary.',
        inputSchema: {
            type: 'object',
            properties: {
                date: {
                    type: 'string',
                    description: 'Date in YYYY-MM-DD format (required)',
                },
                title: {
                    type: 'string',
                    description: 'New summary title (optional)',
                },
                content: {
                    type: 'string',
                    description: 'New summary content (optional)',
                },
                tags: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'New array of tag names (optional)',
                },
            },
            required: ['date'],
        },
    },
];
//# sourceMappingURL=tool-definitions.js.map