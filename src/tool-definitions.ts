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
  // @ai-intent Single API for all content types
  // @ai-why Reduces API surface and simplifies client implementation
  {
    name: 'get_items',
    description: 'Retrieve list of items by type. Tasks types support status filtering. Document types return all items. For sessions, use limit=1 to get latest session.',
    // @ai-flow Returns array of items with summary fields only
    // @ai-performance Optimized for listing - minimal data per item
    // @ai-examples
    //   Get latest session: type='sessions', limit=1
    //   Get today's sessions: type='sessions', start_date='2025-07-28', end_date='2025-07-28'
    //   Get recent documents: type='docs', start_date='2025-07-01'
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
    // @ai-flow 1. Validate type-specific fields -> 2. Create file -> 3. Sync to DB
    // @ai-critical Different types have different required fields
    // @ai-validation Content required for document types, dates optional for task types
    // @ai-examples
    //   Create session: type='sessions', title='Morning work', content='...'
    //   Create daily: type='dailies', date='2025-07-28', title='Daily summary', content='...'
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
    // @ai-intent Cross-type tag search for unified content discovery
    // @ai-performance May be slow with many items - consider pagination
    // @ai-return Grouped by type for easy client processing
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

  // @ai-pattern Status workflow management tools
  // @ai-intent Manage workflow states for tasks types
  // @ai-critical Status IDs must exist before referencing in content
  {
    name: 'get_statuses',
    description: 'Get all available statuses.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
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

  // @ai-pattern Work session tracking tools - DEPRECATED (use unified items API)
  // @ai-intent Track daily work activities and progress
  // @ai-why Sessions enable time-based queries and productivity analysis
  /*
  // DEPRECATED: Use get_items with type='sessions' instead
  {
    name: 'get_sessions',
    description: 'Get work sessions. Returns today\'s sessions by default, or sessions within specified date range.',
    inputSchema: {
      type: 'object',
      properties: {
        start_date: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format (optional)'
        },
        end_date: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format (optional)'
        }
      }
    }
  },
  {
    name: 'get_session_detail',
    description: 'Get detailed information for a specific work session.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Session ID (required)'
        }
      },
      required: ['id']
    }
  },
  {
    name: 'get_latest_session',
    description: 'Get the latest work session for today.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'create_session',
    description: 'Create new work session. Sessions are identified by YYYY-MM-DD-HH.MM.SS.sss format.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Session ID (optional, creates new if not specified)'
        },
        title: {
          type: 'string',
          description: 'Session title (required)'
        },
        content: {
          type: 'string',
          description: 'Session content (optional)'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of tag names (optional)'
        },
        category: {
          type: 'string',
          description: 'Session category (optional)'
        },
        datetime: {
          type: 'string',
          description: 'ISO 8601 datetime for session creation (optional, for past data migration)'
        },
        related_tasks: {
          type: 'array',
          items: { type: 'string' },
          description: 'Related task references (optional, e.g. ["issues-1", "plans-2"])'
        },
        related_documents: {
          type: 'array',
          items: { type: 'string' },
          description: 'Related document references (optional, e.g. ["docs-1", "knowledge-2"])'
        }
      },
      required: ['title']
    }
  },
  {
    name: 'update_session',
    description: 'Update existing work session.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Session ID (required)'
        },
        title: {
          type: 'string',
          description: 'New title (optional)'
        },
        content: {
          type: 'string',
          description: 'New content (optional)'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'New array of tag names (optional)'
        },
        category: {
          type: 'string',
          description: 'New category (optional)'
        },
        related_tasks: {
          type: 'array',
          items: { type: 'string' },
          description: 'New related task references (optional, e.g. ["issues-1", "plans-2"])'
        },
        related_documents: {
          type: 'array',
          items: { type: 'string' },
          description: 'New related document references (optional, e.g. ["docs-1", "knowledge-2"])'
        }
      },
      required: ['id']
    }
  },
  {
    name: 'search_sessions_by_tag',
    description: 'Search work sessions by tag name.',
    inputSchema: {
      type: 'object',
      properties: {
        tag: {
          type: 'string',
          description: 'Tag name to search for (required)'
        }
      },
      required: ['tag']
    }
  },
  */

  // @ai-pattern Daily summary management tools - DEPRECATED (use unified items API)
  // @ai-intent Aggregate and summarize daily activities
  // @ai-critical One summary per date - updates replace existing
  /*
  // DEPRECATED: Use get_items/create_item/update_item with type='dailies' instead
  {
    name: 'get_summaries',
    description: 'Get daily summaries. Returns last 7 days by default, or summaries within specified date range.',
    inputSchema: {
      type: 'object',
      properties: {
        start_date: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format (optional)'
        },
        end_date: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format (optional)'
        }
      }
    }
  },
  {
    name: 'get_summary_detail',
    description: 'Get detailed information for a specific daily summary.',
    inputSchema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format (required)'
        }
      },
      required: ['date']
    }
  },
  {
    name: 'create_summary',
    description: 'Create daily summary for specified date.',
    inputSchema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format (required)'
        },
        title: {
          type: 'string',
          description: 'Summary title (required)'
        },
        content: {
          type: 'string',
          description: 'Summary content (required)'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of tag names (optional)'
        },
        related_tasks: {
          type: 'array',
          items: { type: 'string' },
          description: 'Related task references (optional, e.g. ["issues-1", "plans-2"])'
        },
        related_documents: {
          type: 'array',
          items: { type: 'string' },
          description: 'Related document references (optional, e.g. ["docs-1", "knowledge-2"])'
        }
      },
      required: ['date', 'title', 'content']
    }
  },
  {
    name: 'update_summary',
    description: 'Update existing daily summary.',
    inputSchema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format (required)'
        },
        title: {
          type: 'string',
          description: 'New summary title (optional)'
        },
        content: {
          type: 'string',
          description: 'New summary content (optional)'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'New array of tag names (optional)'
        },
        related_tasks: {
          type: 'array',
          items: { type: 'string' },
          description: 'New related task references (optional, e.g. ["issues-1", "plans-2"])'
        },
        related_documents: {
          type: 'array',
          items: { type: 'string' },
          description: 'New related document references (optional, e.g. ["docs-1", "knowledge-2"])'
        }
      },
      required: ['date']
    }
  },
  */

  // Type management tools
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
  // Full-text search tools
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