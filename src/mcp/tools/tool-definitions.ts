// MCP tool definitions
export const MCPToolDefinitions = [
  {
    name: 'create_item',
    description: 'Create a new item with AI-powered enrichment (automatic summary, keywords, embeddings)',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Item type (lowercase letters, numbers, and underscores only: a-z, 0-9, _)' },
        title: { type: 'string', description: 'Item title' },
        description: { type: 'string', description: 'Brief description' },
        content: { type: 'string', description: 'Detailed content (Markdown supported)' },
        status: {
          type: 'string',
          description: 'Item status (Open, Specification, Waiting, Ready, In Progress, Review, Testing, Pending, Completed, Closed, Canceled, Rejected)',
          default: 'Open'
        },
        priority: {
          type: 'string',
          enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'MINIMAL'],
          default: 'MEDIUM'
        },
        category: { type: 'string', description: 'Item category' },
        startDate: { type: 'string', format: 'date-time' },
        endDate: { type: 'string', format: 'date-time' },
        version: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' }, description: 'List of tags' },
        related: { type: 'array', items: { type: 'number' }, description: 'List of related item IDs' }
      },
      required: ['type', 'title']
    }
  },
  {
    name: 'get_item',
    description: 'Retrieve an item by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Item ID' }
      },
      required: ['id']
    }
  },
  {
    name: 'update_item',
    description: 'Update an existing item',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Item ID' },
        type: { type: 'string', description: 'Item type (lowercase letters, numbers, and underscores only: a-z, 0-9, _)' },
        title: { type: 'string' },
        description: { type: 'string' },
        content: { type: 'string' },
        status: {
          type: 'string',
          description: 'Item status (Open, Specification, Waiting, Ready, In Progress, Review, Testing, Pending, Completed, Closed, Canceled, Rejected)'
        },
        priority: { type: 'string', enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'MINIMAL'] },
        category: { type: 'string' },
        startDate: { type: 'string', format: 'date-time' },
        endDate: { type: 'string', format: 'date-time' },
        version: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        related: { type: 'array', items: { type: 'number' }, description: 'List of related item IDs (replaces all existing relations)' }
      },
      required: ['id']
    }
  },
  {
    name: 'delete_item',
    description: 'Delete an item',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Item ID' }
      },
      required: ['id']
    }
  },
  {
    name: 'search_items',
    description: 'Advanced search with support for AND/OR queries, date ranges, and filters (e.g., "term1 AND term2", "created:2024-01-01", "type:bug")',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query with AND/OR support, date ranges (created:YYYY-MM-DD, updated:YYYY-MM-DD), and field filters (type:, tag:, priority:)' },
        types: { type: 'array', items: { type: 'string' }, description: 'Filter by item types' },
        limit: { type: 'number', default: 20, maximum: 100 },
        offset: { type: 'number', default: 0 }
      },
      required: ['query']
    }
  },
  {
    name: 'list_items',
    description: 'List items with optional filtering and sorting',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Filter by item type' },
        status: { type: 'array', items: { type: 'string' } },
        priority: {
          type: 'array',
          items: { type: 'string', enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'MINIMAL'] }
        },
        tags: { type: 'array', items: { type: 'string' } },
        limit: { type: 'number', default: 20, maximum: 100 },
        offset: { type: 'number', default: 0 },
        sortBy: { type: 'string', enum: ['created', 'updated', 'priority'] },
        sortOrder: { type: 'string', enum: ['asc', 'desc'] }
      }
    }
  },
  {
    name: 'get_related_items',
    description: 'Get related items with customizable search strategies (graph traversal, AI similarity, keywords, concepts)',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Source item ID' },
        depth: { type: 'number', description: 'Traversal depth for graph search', default: 1, minimum: 1, maximum: 3 },
        types: { type: 'array', items: { type: 'string' }, description: 'Filter by item types' },
        strategy: {
          type: 'string',
          enum: ['keywords', 'concepts', 'embedding', 'hybrid'],
          description: 'Search strategy: keywords (TF-IDF), concepts (entity extraction), embedding (semantic similarity), hybrid (combined)'
        },
        weights: {
          type: 'object',
          description: 'Strategy weights for hybrid search (e.g., {"keywords": 0.3, "embedding": 0.7})',
          additionalProperties: { type: 'number' }
        },
        thresholds: {
          type: 'object',
          description: 'Minimum thresholds for each strategy',
          properties: {
            min_confidence: { type: 'number', description: 'Minimum confidence for concept extraction' },
            min_keyword_weight: { type: 'number', description: 'Minimum TF-IDF weight for keyword matching' },
            min_similarity: { type: 'number', description: 'Minimum cosine similarity for embeddings' }
          }
        }
      },
      required: ['id']
    }
  },
  {
    name: 'add_relations',
    description: 'Add bidirectional relationships between items',
    inputSchema: {
      type: 'object',
      properties: {
        sourceId: { type: 'number', description: 'Source item ID' },
        targetIds: { type: 'array', items: { type: 'number' }, description: 'Array of target item IDs to relate to' }
      },
      required: ['sourceId', 'targetIds']
    }
  },
  {
    name: 'get_current_state',
    description: 'Get current system state',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'update_current_state',
    description: 'Update current system state',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'State description in Markdown format' },
        tags: { type: 'array', items: { type: 'string' }, description: 'List of tags' },
        metadata: {
          type: 'object',
          properties: {
            updatedBy: { type: 'string', description: 'User identifier' },
            context: { type: 'string', description: 'Context information' }
          }
        }
      },
      required: ['content']
    }
  },
  {
    name: 'get_stats',
    description: 'Get system statistics (items, types, priorities, tags)',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_tags',
    description: 'Get list of all tags with usage counts',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];