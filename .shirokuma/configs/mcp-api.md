# SHIROKUMA Knowledge Base - MCP API Configuration

## MCP Server Configuration

```yaml
mcp:
  server_name: "shirokuma-ai-project-management-server"
  server_version: "1.0.0"
  transport: "stdio"
  prefix: "mcp__shirokuma-knowledge-base__"
  
  tools:
    # Unified item operations
    get_items: true
    get_item_detail: true
    create_item: true
    update_item: true
    delete_item: true
    search_items_by_tag: true
    
    # Search and discovery
    search_items: true
    search_suggest: true
    
    # Metadata management
    get_statuses: true
    get_tags: true
    create_tag: true
    delete_tag: true
    search_tags: true
    get_types: true
    create_type: true
    update_type: true
    delete_type: true
    
    # State management
    get_current_state: true
    update_current_state: true
    change_item_type: true
    
    # File indexing
    index_codebase: true
    search_code: true
    get_related_files: true
    get_index_status: true
  
  # Specialized types for agent workflows
  specialized_types:
    test_results:
      purpose: "Test execution outputs storage"
      created_by: "tester agent only"
      base_type: "documents"
      
    handovers:
      purpose: "Agent-to-agent communication"
      created_by: "any agent"
      base_type: "documents"
  
  # Deprecated features
  deprecated:
    types:
      dailies: "Use sessions for work tracking instead"
      
    agents:
      - name: "shirokuma-session-automator"
        replacement: "Use /ai-start and /ai-finish commands directly"
        
      - name: "shirokuma-daily-reporter"
        replacement: "Dailies type will be removed"
```

## Tool Registration Pattern

```typescript
// MCP tool definition pattern
const tools: Tool[] = [
  {
    name: 'get_items',
    description: 'Retrieve list of items by type',
    inputSchema: {
      type: 'object',
      properties: {
        type: { 
          type: 'string',
          description: 'Type of items to retrieve'
        },
        limit: { 
          type: 'number',
          description: 'Maximum number of items'
        }
      },
      required: ['type']
    }
  }
];
```

## Handler Pattern

```typescript
// MCP request handler pattern
export async function handleGetItems(
  params: GetItemsParams
): Promise<MCPResponse> {
  // Input validation
  const validation = validateGetItemsParams(params);
  if (!validation.success) {
    throw new MCPError(-32602, validation.error);
  }
  
  // Business logic
  const result = await itemService.getItems(params);
  
  // Response formatting
  return {
    data: {
      items: result.items.map(formatItemForMCP),
      total: result.total
    }
  };
}
```

## MCP Error Codes

### Standard Error Codes
- `-32700`: Parse error
- `-32600`: Invalid request
- `-32601`: Method not found
- `-32602`: Invalid params
- `-32603`: Internal error

### Custom Error Codes
- `-32001`: Item not found
- `-32002`: Type not supported
- `-32003`: Database error
- `-32004`: Validation error
- `-32005`: Permission denied

## Error Handling

```typescript
// MCP error handling
function handleMCPError(error: unknown): MCPError {
  if (error instanceof AppError) {
    return new MCPError(error.code, error.message);
  }
  
  if (error instanceof Error) {
    logger.error('Unexpected error:', error);
    return new MCPError(-32603, 'Internal error');
  }
  
  return new MCPError(-32603, 'Unknown error');
}
```

## Request/Response Format

### Request Structure
```typescript
interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: {
    name: string;
    arguments: Record<string, any>;
  };
}
```

### Response Structure
```typescript
interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}
```

## Tool Schemas

### Item Operations

```typescript
// get_items
{
  type: { type: 'string', required: true },
  limit: { type: 'number', default: 100 },
  offset: { type: 'number', default: 0 },
  status: { type: 'string', optional: true },
  tags: { type: 'array', items: 'string', optional: true }
}

// create_item
{
  type: { type: 'string', required: true },
  title: { type: 'string', required: true },
  content: { type: 'string', optional: true },
  status: { type: 'string', optional: true },
  priority: { type: 'string', enum: ['high', 'medium', 'low'] },
  tags: { type: 'array', items: 'string', optional: true },
  related: { type: 'array', items: 'string', optional: true }
}

// update_item
{
  type: { type: 'string', required: true },
  id: { type: 'number', required: true },
  title: { type: 'string', optional: true },
  content: { type: 'string', optional: true },
  status: { type: 'string', optional: true },
  priority: { type: 'string', optional: true },
  tags: { type: 'array', items: 'string', optional: true }
}
```

### Search Operations

```typescript
// search_items
{
  query: { type: 'string', required: true },
  types: { type: 'array', items: 'string', optional: true },
  limit: { type: 'number', default: 50 },
  offset: { type: 'number', default: 0 }
}

// search_suggest
{
  query: { type: 'string', required: true },
  limit: { type: 'number', default: 10 }
}
```

## MCP Client Integration

```typescript
// Example MCP client usage
import { MCPClient } from '@modelcontextprotocol/sdk';

const client = new MCPClient({
  name: 'shirokuma-knowledge-base',
  version: '0.7.9',
  transport: {
    type: 'stdio',
    command: 'node',
    args: ['dist/index.js']
  }
});

// Using the client
const response = await client.request('get_items', {
  type: 'issues',
  limit: 10
});
```

## Handler Architecture

### Handler Layer Structure
```
handlers/
├── items/
│   ├── create-item-handler.ts
│   ├── get-items-handler.ts
│   ├── update-item-handler.ts
│   └── delete-item-handler.ts
├── search/
│   ├── search-items-handler.ts
│   └── search-suggest-handler.ts
├── metadata/
│   ├── tags-handler.ts
│   ├── types-handler.ts
│   └── statuses-handler.ts
└── state/
    ├── current-state-handler.ts
    └── change-type-handler.ts
```

### Handler Registration

```typescript
// Register handlers with MCP server
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  switch (name) {
    case 'get_items':
      return handleGetItems(args);
    case 'create_item':
      return handleCreateItem(args);
    case 'update_item':
      return handleUpdateItem(args);
    // ... other handlers
    default:
      throw new MCPError(-32601, `Unknown tool: ${name}`);
  }
});
```

## Validation with Zod

```typescript
// Zod schema for validation
import { z } from 'zod';

const GetItemsSchema = z.object({
  type: z.string(),
  limit: z.number().min(1).max(1000).optional().default(100),
  offset: z.number().min(0).optional().default(0),
  status: z.string().optional(),
  tags: z.array(z.string()).optional()
});

// Validate in handler
export async function handleGetItems(params: unknown) {
  const result = GetItemsSchema.safeParse(params);
  if (!result.success) {
    throw new MCPError(-32602, result.error.message);
  }
  
  // Use validated data
  const { type, limit, offset } = result.data;
  // ... handler logic
}
```

## Response Formatting

```typescript
// Format items for MCP response
function formatItemForMCP(item: Item): MCPItem {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    description: item.description || '',
    content: item.content || '',
    status: item.status,
    priority: item.priority,
    tags: item.tags || [],
    created_at: item.created_at,
    updated_at: item.updated_at,
    metadata: {
      version: item.version,
      author: item.author,
      related: item.related || []
    }
  };
}
```

## Streaming Support (Future)

```typescript
// Streaming response pattern (planned)
server.setStreamHandler('stream_items', async function* (params) {
  const { type, batch_size = 10 } = params;
  let offset = 0;
  
  while (true) {
    const items = await getItems({ type, limit: batch_size, offset });
    if (items.length === 0) break;
    
    for (const item of items) {
      yield formatItemForMCP(item);
    }
    
    offset += batch_size;
  }
});
```

## Performance Considerations

### Rate Limiting
```typescript
const rateLimiter = {
  requests: new Map<string, number[]>(),
  
  check(clientId: string, limit: number = 100): boolean {
    const now = Date.now();
    const minute = 60 * 1000;
    
    const timestamps = this.requests.get(clientId) || [];
    const recent = timestamps.filter(t => now - t < minute);
    
    if (recent.length >= limit) {
      return false;
    }
    
    recent.push(now);
    this.requests.set(clientId, recent);
    return true;
  }
};
```

### Caching Strategy
```typescript
const cache = new Map<string, { data: any; expires: number }>();

function getCached(key: string): any | undefined {
  const item = cache.get(key);
  if (!item) return undefined;
  
  if (Date.now() > item.expires) {
    cache.delete(key);
    return undefined;
  }
  
  return item.data;
}

function setCached(key: string, data: any, ttl: number = 300): void {
  cache.set(key, {
    data,
    expires: Date.now() + ttl * 1000
  });
}
```

## Testing MCP Handlers

```typescript
// Test MCP handler
describe('MCP Handlers', () => {
  it('should handle get_items request', async () => {
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'get_items',
        arguments: { type: 'issues' }
      }
    };
    
    const response = await server.handleRequest(request);
    
    expect(response).toHaveProperty('result.items');
    expect(response.error).toBeUndefined();
  });
});
```