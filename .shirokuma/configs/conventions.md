# SHIROKUMA Knowledge Base - Coding Conventions

## Coding Standards

### File Naming
- **Convention**: kebab-case for all files
- **Examples**: 
  - `item-service.ts` ✅
  - `ItemService.ts` ❌
  - `item_service.ts` ❌

### Code Style
- **Indent Style**: Spaces
- **Indent Size**: 2 spaces
- **Quote Style**: Single quotes for strings
- **Line Length**: Max 120 characters
- **File Length**: Max 500 lines

### Import Organization
```typescript
// 1. External dependencies
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { z } from 'zod';

// 2. Internal modules
import { DatabaseManager } from '../database/manager.js';
import { ItemService } from '../services/item-service.js';

// 3. Types and interfaces
import type { Item, ItemType } from '../types/base.js';
import type { MCPRequest, MCPResponse } from '../types/mcp.js';

// 4. Constants and utilities
import { logger } from '../utils/logger.js';
import { CONFIG } from '../config/environment.js';
```

## Error Handling Patterns

### Standard Error Handling

```typescript
// Application-wide error handling pattern
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

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

### Database Error Handling

```typescript
// Database operation with retry
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (error.code === 'SQLITE_BUSY' && i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
  
  throw lastError!;
}
```

## Type Patterns

### Result Type Pattern

```typescript
// Result type pattern used throughout
type Result<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
};

// Async operation pattern
async function operation<T>(): Promise<Result<T>> {
  try {
    const result = await doOperation();
    return { success: true, data: result };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
```

### Generic Type Constraints

```typescript
// Type constraints for database operations
interface Repository<T extends BaseItem> {
  findById(id: string): Promise<T | undefined>;
  findAll(filter?: Partial<T>): Promise<T[]>;
  create(item: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T>;
  update(id: string, updates: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
}
```

## Database Patterns

### Transaction Management

```typescript
// Transaction wrapper pattern
async function withTransaction<T>(
  operation: (tx: Transaction) => Promise<T>
): Promise<T> {
  const tx = await db.beginTransaction();
  
  try {
    const result = await operation(tx);
    await tx.commit();
    return result;
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

// Usage
const result = await withTransaction(async (tx) => {
  await tx.run('INSERT INTO items ...');
  await tx.run('INSERT INTO relationships ...');
  return { success: true };
});
```

### Query Patterns

```typescript
// Parameterized query pattern
const items = await db.all<ItemRow>(
  `SELECT * FROM items 
   WHERE type = ? AND status = ? 
   ORDER BY updated_at DESC 
   LIMIT ?`,
  [type, status, limit]
);

// Query builder pattern for complex queries
class QueryBuilder {
  private conditions: string[] = [];
  private params: any[] = [];
  
  where(column: string, value: any): this {
    this.conditions.push(`${column} = ?`);
    this.params.push(value);
    return this;
  }
  
  build(): [string, any[]] {
    const where = this.conditions.length > 0 
      ? `WHERE ${this.conditions.join(' AND ')}` 
      : '';
    return [`SELECT * FROM items ${where}`, this.params];
  }
}
```

## Security Practices

### Input Validation

```typescript
// Comprehensive input validation
export function validateItemInput(input: unknown): ValidationResult {
  if (!isObject(input)) {
    return { success: false, error: 'Input must be an object' };
  }
  
  const { type, title, content } = input as any;
  
  // Type validation
  if (!type || typeof type !== 'string') {
    return { success: false, error: 'Type is required and must be a string' };
  }
  
  // SQL injection prevention
  if (!/^[a-z_]+$/.test(type)) {
    return { success: false, error: 'Invalid type format' };
  }
  
  // XSS prevention for content
  if (content && typeof content === 'string') {
    const sanitized = sanitizeMarkdown(content);
    if (sanitized !== content) {
      return { success: false, error: 'Content contains unsafe HTML' };
    }
  }
  
  return { success: true };
}
```

### Path Traversal Prevention

```typescript
// Safe file path handling
export function getSafeFilePath(type: string, id: string): string {
  // Validate inputs
  if (!/^[a-z_]+$/.test(type) || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    throw new Error('Invalid type or id format');
  }
  
  // Use path.join to prevent traversal
  const safePath = path.join(
    DATABASE_ROOT,
    'items',
    type,
    `${id}.md`
  );
  
  // Ensure path is within expected directory
  const resolvedPath = path.resolve(safePath);
  const expectedRoot = path.resolve(DATABASE_ROOT);
  
  if (!resolvedPath.startsWith(expectedRoot)) {
    throw new Error('Path traversal attempt detected');
  }
  
  return resolvedPath;
}
```

## Logging Configuration

```typescript
// Logger configuration
export const logger = {
  error: (message: string, ...args: any[]) => {
    if (process.env.LOG_LEVEL !== 'none') {
      console.error(`[ERROR] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (['warn', 'info', 'debug'].includes(process.env.LOG_LEVEL || 'info')) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  info: (message: string, ...args: any[]) => {
    if (['info', 'debug'].includes(process.env.LOG_LEVEL || 'info')) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },
  debug: (message: string, ...args: any[]) => {
    if (process.env.LOG_LEVEL === 'debug') {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
};
```

## Performance Guidelines

### Database Optimization

```typescript
// Index usage for performance
const INDEXES = [
  'CREATE INDEX idx_items_type_status ON items(type, status)',
  'CREATE INDEX idx_items_updated ON items(updated_at DESC)',
  'CREATE INDEX idx_relationships_from ON relationships(from_id, from_type)',
  'CREATE INDEX idx_relationships_to ON relationships(to_id, to_type)',
  'CREATE INDEX idx_search_content ON search_index(content)'
];

// Batch operations for efficiency
async function batchInsert<T>(
  items: T[],
  batchSize: number = 100
): Promise<void> {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await db.run(
      `INSERT INTO items VALUES ${batch.map(() => '(?,?,?)').join(',')}`,
      batch.flatMap(item => [item.id, item.type, item.data])
    );
  }
}
```

### Caching Patterns

```typescript
// Simple in-memory cache
class Cache<T> {
  private cache = new Map<string, { data: T; expires: number }>();
  
  set(key: string, data: T, ttlSeconds: number = 300): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttlSeconds * 1000
    });
  }
  
  get(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.data;
  }
}
```

## Architecture Patterns

### Dual Storage Architecture

The project uses a unique dual-storage approach:

```typescript
// Markdown files for content (.database/items/{type}/{id}.md)
interface MarkdownStorage {
  path: string;          // File path pattern
  frontmatter: object;   // YAML frontmatter metadata
  content: string;       // Markdown content body
}

// SQLite for metadata and relationships (.database/shirokuma.db)
interface SqliteStorage {
  metadata: ItemMetadata;
  relationships: ItemRelations;
  indexes: SearchIndexes;
}
```

### Directory Structure Pattern

```
src/
├── index.ts              # MCP server entry point
├── server.ts            # Main server implementation
├── types/               # TypeScript type definitions
│   ├── base.ts         # Base types and interfaces
│   └── mcp.ts          # MCP-specific types
├── handlers/           # MCP request handlers
│   ├── items/          # Item CRUD operations
│   ├── search/         # Search functionality
│   └── state/          # State management
├── database/           # Database layer
│   ├── manager.ts      # Database connection manager
│   ├── schema.ts       # SQLite schema definitions
│   └── migrations/     # Database migrations
├── storage/            # File storage layer
│   ├── markdown.ts     # Markdown file operations
│   └── sync.ts         # DB-file synchronization
└── utils/              # Utility functions
```

## Best Practices Summary

1. **Always use TypeScript** with strict mode enabled
2. **Handle errors gracefully** with specific error types
3. **Validate all inputs** before processing
4. **Use transactions** for multi-step database operations
5. **Implement proper logging** with configurable levels
6. **Write comprehensive tests** for all features
7. **Follow the dual-storage pattern** consistently
8. **Maintain backward compatibility** in API changes
9. **Document all public interfaces** with JSDoc
10. **Use environment variables** for configuration

## Code Review Checklist

### Before Submitting Code
- [ ] All lint errors fixed (`npm run lint:errors` shows 0 errors)
- [ ] TypeScript compilation successful
- [ ] All tests passing
- [ ] No console.log statements
- [ ] File names in kebab-case
- [ ] Functions have explicit return types
- [ ] Error handling implemented
- [ ] Input validation added
- [ ] Security considerations addressed
- [ ] Performance impact assessed

### Common Issues to Check
- Unexpected `any` types
- Missing return type annotations
- Improper error handling
- SQL injection vulnerabilities
- Path traversal risks
- Memory leaks
- Inefficient queries
- Missing input validation
- Console statements left in code
- Incorrect file naming