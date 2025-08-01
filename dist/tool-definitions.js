export const toolDefinitions = [
    {
        name: 'get_items',
        description: 'Retrieve list of items by type. Tasks types support status filtering. Document types return all items. For sessions, use limit=1 to get latest session.',
        inputSchema: {
            type: 'object',
            properties: {
                type: {
                    type: 'string',
                    description: 'Type of items to retrieve (use get_types to see available types)'
                },
                includeClosedStatuses: {
                    type: 'boolean',
                    description: 'Include items with closed statuses (tasks types only, default: false)'
                },
                statuses: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Filter by specific status names (tasks types only)'
                },
                start_date: {
                    type: 'string',
                    description: 'Filter items from this date (YYYY-MM-DD). For sessions/dailies: filters by date. For others: filters by updated_at'
                },
                end_date: {
                    type: 'string',
                    description: 'Filter items until this date (YYYY-MM-DD). For sessions/dailies: filters by date. For others: filters by updated_at'
                },
                limit: {
                    type: 'number',
                    description: 'Maximum number of items to return (useful for getting latest item)'
                }
            },
            required: ['type']
        }
    },
    {
        name: 'get_item_detail',
        description: 'Get detailed information for specified item.',
        inputSchema: {
            type: 'object',
            properties: {
                type: {
                    type: 'string',
                    description: 'Type of item (use get_types to see available types)'
                },
                id: {
                    type: 'number',
                    description: 'Item ID'
                }
            },
            required: ['type', 'id']
        }
    },
    {
        name: 'create_item',
        description: 'Create new item. Each type has different purposes and requirements. For issues/plans: task management with status/priority. For docs/knowledge: documentation and knowledge base. For sessions: individual work session records (datetime optional). For dailies: daily summaries (date required, one per day).',
        inputSchema: {
            type: 'object',
            properties: {
                type: {
                    type: 'string',
                    description: 'Type of item to create. Common types: issues (bug/task tracking), plans (project planning), docs (technical docs), knowledge (how-to guides), sessions (work session logs), dailies (daily summaries). Use get_types for full list with descriptions.'
                },
                title: {
                    type: 'string',
                    description: 'Item title (required)'
                },
                description: {
                    type: 'string',
                    description: 'Item description (optional for all types)'
                },
                content: {
                    type: 'string',
                    description: 'Item content. REQUIRED for document types (docs, knowledge, dailies). OPTIONAL for task types (issues, plans) and sessions. For dailies, should contain the daily summary.'
                },
                priority: {
                    type: 'string',
                    enum: ['high', 'medium', 'low'],
                    description: 'Priority level. REQUIRED for task types (issues, plans). OPTIONAL for document types.'
                },
                status: {
                    type: 'string',
                    description: 'Status name. REQUIRED for task types (issues, plans). Common values: Open, In Progress, Closed. Use get_statuses for full list.'
                },
                tags: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of tag names'
                },
                start_date: {
                    type: 'string',
                    description: 'Start date in YYYY-MM-DD format. OPTIONAL for task types (issues, plans). Useful for project planning and tracking.'
                },
                end_date: {
                    type: 'string',
                    description: 'End date in YYYY-MM-DD format. OPTIONAL for task types (issues, plans). Useful for deadlines and milestones.'
                },
                related_tasks: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Related task references. OPTIONAL for task types (issues, plans). Format: ["issues-1", "plans-2"]. Links to related issues or plans.'
                },
                related_documents: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Related document references. OPTIONAL for all types. Format: ["docs-1", "knowledge-2"]. Links to documentation or knowledge articles.'
                },
                datetime: {
                    type: 'string',
                    description: 'ISO 8601 datetime (e.g., 2025-07-30T10:00:00). OPTIONAL for sessions. If not provided, current time is used. Useful for importing past data.'
                },
                date: {
                    type: 'string',
                    description: 'Date in YYYY-MM-DD format. REQUIRED for dailies type. Each date can only have one daily summary. Example: "2025-07-30"'
                },
                id: {
                    type: 'string',
                    description: 'Custom ID (for sessions, optional)'
                },
                category: {
                    type: 'string',
                    description: 'Category for grouping sessions. OPTIONAL for sessions type. Examples: "development", "meeting", "research", "debugging"'
                }
            },
            required: ['type', 'title']
        }
    },
    {
        name: 'update_item',
        description: 'Update existing item.',
        inputSchema: {
            type: 'object',
            properties: {
                type: {
                    type: 'string',
                    description: 'Type of item to update (use get_types to see available types)'
                },
                id: {
                    type: 'number',
                    description: 'Item ID'
                },
                title: {
                    type: 'string',
                    description: 'New title'
                },
                description: {
                    type: 'string',
                    description: 'New description'
                },
                content: {
                    type: 'string',
                    description: 'New content (for document types)'
                },
                priority: {
                    type: 'string',
                    enum: ['high', 'medium', 'low'],
                    description: 'New priority (for tasks types)'
                },
                status: {
                    type: 'string',
                    description: 'New status name (for tasks types)'
                },
                tags: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'New array of tag names'
                },
                start_date: {
                    type: 'string',
                    description: 'New start date (for tasks types)'
                },
                end_date: {
                    type: 'string',
                    description: 'New end date (for tasks types)'
                },
                related_tasks: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'New related task references (for tasks types, e.g. ["issues-1", "plans-2"])'
                },
                related_documents: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'New related document references (for all types, e.g. ["docs-1", "knowledge-2"])'
                }
            },
            required: ['type', 'id']
        }
    },
    {
        name: 'delete_item',
        description: 'Delete item.',
        inputSchema: {
            type: 'object',
            properties: {
                type: {
                    type: 'string',
                    description: 'Type of item to delete (use get_types to see available types)'
                },
                id: {
                    type: 'number',
                    description: 'Item ID'
                }
            },
            required: ['type', 'id']
        }
    },
    {
        name: 'search_items_by_tag',
        description: 'Search items by tag, optionally filtered by types.',
        inputSchema: {
            type: 'object',
            properties: {
                tag: {
                    type: 'string',
                    description: 'Tag name to search for'
                },
                types: {
                    type: 'array',
                    items: {
                        type: 'string'
                    },
                    description: 'Types to search (omit to search all types, use get_types to see available types)'
                }
            },
            required: ['tag']
        }
    },
    {
        name: 'get_statuses',
        description: 'Get all available statuses.',
        inputSchema: {
            type: 'object',
            properties: {}
        }
    },
    {
        name: 'get_tags',
        description: 'Get all available tags.',
        inputSchema: {
            type: 'object',
            properties: {}
        }
    },
    {
        name: 'create_tag',
        description: 'Create new tag.',
        inputSchema: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    description: 'Tag name (required)'
                }
            },
            required: ['name']
        }
    },
    {
        name: 'delete_tag',
        description: 'Delete tag.',
        inputSchema: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    description: 'Name of tag to delete (required)'
                }
            },
            required: ['name']
        }
    },
    {
        name: 'search_tags',
        description: 'Search tags by name pattern.',
        inputSchema: {
            type: 'object',
            properties: {
                pattern: {
                    type: 'string',
                    description: 'Search pattern for tag names (required)'
                }
            },
            required: ['pattern']
        }
    },
    {
        name: 'create_type',
        description: 'Create a new custom content type',
        inputSchema: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    description: 'Type name (lowercase letters, numbers, and underscores only)'
                },
                base_type: {
                    type: 'string',
                    enum: ['tasks', 'documents'],
                    description: 'Base type for the new type (default: documents)'
                },
                description: {
                    type: 'string',
                    description: 'Description of the type purpose and usage guidelines (optional)'
                }
            },
            required: ['name']
        }
    },
    {
        name: 'get_types',
        description: 'Get all available content types with their descriptions and purposes. Returns types grouped by base_type: tasks (for project management with status/priority), documents (for documentation and knowledge base). Special types like sessions (work logs) and dailies (daily summaries) are also included.',
        inputSchema: {
            type: 'object',
            properties: {
                include_definitions: {
                    type: 'boolean',
                    description: 'Include full type definitions with supported fields in JSON format (default: false)'
                }
            }
        }
    },
    {
        name: 'update_type',
        description: 'Update type description (type name cannot be changed)',
        inputSchema: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    description: 'Name of the type to update'
                },
                description: {
                    type: 'string',
                    description: 'New description for the type'
                }
            },
            required: ['name', 'description']
        }
    },
    {
        name: 'delete_type',
        description: 'Delete a custom content type',
        inputSchema: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    description: 'Name of the type to delete'
                }
            },
            required: ['name']
        }
    },
    {
        name: 'search_items',
        description: 'Full-text search across all items\' title, description, and content',
        inputSchema: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'Search query text (required)'
                },
                types: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Filter by specific types (optional)'
                },
                limit: {
                    type: 'number',
                    description: 'Maximum number of results (default: 20, max: 100)'
                },
                offset: {
                    type: 'number',
                    description: 'Number of results to skip for pagination (default: 0)'
                }
            },
            required: ['query']
        }
    },
    {
        name: 'search_suggest',
        description: 'Get search suggestions for autocomplete',
        inputSchema: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'Partial search query (required)'
                },
                types: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Filter suggestions by specific types (optional)'
                },
                limit: {
                    type: 'number',
                    description: 'Maximum number of suggestions (default: 10, max: 20)'
                }
            },
            required: ['query']
        }
    },
    {
        name: 'get_current_state',
        description: 'Get the current application state with metadata. Returns JSON with content and metadata fields.',
        inputSchema: {
            type: 'object',
            properties: {}
        }
    },
    {
        name: 'update_current_state',
        description: 'Update the current application state with metadata support',
        inputSchema: {
            type: 'object',
            properties: {
                content: {
                    type: 'string',
                    description: 'New state content (markdown)'
                },
                related: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Related item IDs (sessions, dailies, issues, docs, etc.)'
                },
                tags: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Tags for categorization'
                },
                updated_by: {
                    type: 'string',
                    description: 'Who/what updated the state (e.g., ai-start, ai-finish)'
                }
            },
            required: ['content']
        }
    },
    {
        name: 'change_item_type',
        description: 'Change item type to another type with the same base type. Creates a new item with a new ID and updates all references. Original item is deleted.',
        inputSchema: {
            type: 'object',
            properties: {
                from_type: {
                    type: 'string',
                    description: 'Current type of the item'
                },
                from_id: {
                    type: 'number',
                    description: 'Current ID of the item'
                },
                to_type: {
                    type: 'string',
                    description: 'New type (must have same base_type as from_type). E.g., issues→bugs, docs→knowledge'
                }
            },
            required: ['from_type', 'from_id', 'to_type']
        }
    },
    {
        name: 'index_codebase',
        description: 'Index or re-index the codebase for semantic search',
        inputSchema: {
            type: 'object',
            properties: {
                force: {
                    type: 'boolean',
                    description: 'Force re-index all files'
                },
                exclude: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Additional exclude patterns'
                }
            }
        }
    },
    {
        name: 'search_code',
        description: 'Search code semantically using natural language or code snippets',
        inputSchema: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'Search query (natural language or code snippet)'
                },
                limit: {
                    type: 'number',
                    description: 'Maximum number of results (default: 10)'
                },
                fileTypes: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Filter by file extensions (e.g., ["js", "ts"])'
                }
            },
            required: ['query']
        }
    },
    {
        name: 'get_related_files',
        description: 'Find files related to a given file based on content similarity',
        inputSchema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    description: 'Base file path to find related files'
                },
                depth: {
                    type: 'number',
                    description: 'Depth of relation search (default: 1)'
                }
            },
            required: ['file']
        }
    },
    {
        name: 'get_index_status',
        description: 'Get the current status and statistics of the file index',
        inputSchema: {
            type: 'object',
            properties: {}
        }
    }
];
