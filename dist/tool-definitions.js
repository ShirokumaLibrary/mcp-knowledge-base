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
        description: 'Create new item. For sessions: supports datetime for past data migration. For dailies: use date parameter.',
        inputSchema: {
            type: 'object',
            properties: {
                type: {
                    type: 'string',
                    description: 'Type of item to create (use get_types to see available types)'
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
                    description: 'Item content (required for document types)'
                },
                priority: {
                    type: 'string',
                    enum: ['high', 'medium', 'low'],
                    description: 'Priority (for tasks types)'
                },
                status: {
                    type: 'string',
                    description: 'Status name (for tasks types)'
                },
                tags: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of tag names'
                },
                start_date: {
                    type: 'string',
                    description: 'Start date in YYYY-MM-DD format (for tasks types)'
                },
                end_date: {
                    type: 'string',
                    description: 'End date in YYYY-MM-DD format (for tasks types)'
                },
                related_tasks: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Related task references (for tasks types, e.g. ["issues-1", "plans-2"])'
                },
                related_documents: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Related document references (for all types, e.g. ["docs-1", "knowledge-2"])'
                },
                datetime: {
                    type: 'string',
                    description: 'ISO 8601 datetime (for sessions, optional for past data migration)'
                },
                date: {
                    type: 'string',
                    description: 'Date in YYYY-MM-DD format (for dailies)'
                },
                id: {
                    type: 'string',
                    description: 'Custom ID (for sessions, optional)'
                },
                category: {
                    type: 'string',
                    description: 'Category (for sessions, optional)'
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
        description: 'Get all available content types grouped by base_type (tasks, documents)',
        inputSchema: {
            type: 'object',
            properties: {
                include_definitions: {
                    type: 'boolean',
                    description: 'Include full type definitions (default: false)'
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
    }
];
