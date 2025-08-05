# SHIROKUMA Knowledge Base - Project Configuration Guide

This document provides comprehensive configuration details for AI agents working with the SHIROKUMA Knowledge Base MCP server project.

**Last Updated**: 2025-08-05

## Project Overview

SHIROKUMA is a comprehensive knowledge management system built as an MCP (Model Context Protocol) server. It features a unique dual-storage architecture combining Markdown files for primary storage with SQLite for search capabilities.

### Key Characteristics
- **Architecture**: Dual-storage (Markdown + SQLite with FTS5)
- **Language**: TypeScript (ES2022, ESM)
- **Size**: ~3,500 lines of source code, ~72 compiled files
- **Type System**: Currently 9 types, future migration to 2 types planned
- **Integration**: Designed for Claude Code through MCP protocol

## How to Use This Configuration

### For AI Agents

When referencing configuration values in agent files, use the following patterns:

- **Commands**: Reference using dot notation from the embedded YAML
  - Build: `conventions.build_command`
  - Lint: `conventions.lint_command`
  - Test: `conventions.test_command`
  - Type check: `conventions.type_check_command`

- **Tech Stack**: Reference specific technologies
  - Language: `tech_stack.language`
  - Runtime: `tech_stack.runtime`
  - Frameworks: `tech_stack.frameworks`

- **Project Info**: Basic project information
  - Name: `project.name`
  - Version: `project.version`
  - Language environment: `project.language_env`

### Example Usage in Agents

```markdown
Use the commands defined in the project configuration:
- Build command (see conventions.build_command)
- Test command (see conventions.test_command)
```

## Project Configuration

```yaml
# Project Configuration for Claude Code Agents
# This embedded YAML contains all project-specific settings

project:
  name: "SHIROKUMA"
  description: "Shirokuma MCP Server for comprehensive knowledge management including issues, plans, documents, and work sessions"
  version: "0.7.9"
  language_env: "SHIROKUMA_LANG"
  type: "mcp_server"
  main_entry: "dist/server.js"
  bin_entry: "dist/cli.js"

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

references:
  methodology_file: "SHIROKUMA.md"
  project_instructions: "CLAUDE.md"
  detailed_configuration: ".claude/agents/PROJECT_CONFIGURATION.markdown"
  example_files:
    - "SHIROKUMA.md.example"
    - "CLAUDE.md.example"
  translations:
    ja: "SHIROKUMA.md.ja.example"

conventions:
  # Testing
  test_framework: "jest"
  test_pattern: "*.test.ts"
  test_command: "npm test"
  test_coverage_command: "npm run test:coverage"
  
  # Linting
  lint_command: "npm run lint:errors"
  # Type checking is included in the build process
  
  # Build
  build_command: "npm run build"  # Includes TypeScript type checking
  
  # File naming
  file_naming: "kebab-case"
  
  # Code style
  indent_style: "space"
  indent_size: 2
  quote_style: "single"
  
  # Directory structure
  directory_structure:
    agents: ".claude/agents/"
    commands: ".claude/commands/"
    modules: ".claude/modules/"
    interfaces: ".claude/interfaces/"
    tools: ".claude/tools/"

tech_stack:
  language: "TypeScript"
  runtime: "Node.js"
  package_manager: "npm"
  module_type: "ESModule"  # package.json has "type": "module"
  frameworks:
    - "MCP (Model Context Protocol)"
    - "Jest"
    - "ESLint"
  databases:
    - "SQLite"
    - "Markdown files"

quality_standards:
  review_threshold: 85
  test_coverage_target: 80
  max_complexity: 10
  
development_principles:
  - "Issue-Driven Development"
  - "TDD (Test-Driven Development)"
  - "Clean Code"
  - "SOLID Principles"
  - "Documentation First"
  - "Continuous Improvement"
  - "Security by Design"
  - "Performance Awareness"
  - "MCP Protocol Compliance"
  - "Dual Storage Architecture"
```

## Active System Components

### Available Agents (12 total, 2 deprecated)

| Agent | Purpose | Status |
|-------|---------|--------|
| **shirokuma-issue-manager** | Issue tracking and management | Active |
| **shirokuma-knowledge-curator** | Knowledge systematization | Active |
| **shirokuma-mcp-specialist** | MCP operations expert | Active |
| **shirokuma-methodology-keeper** | Development methodology guardian | Active |
| **shirokuma-programmer** | Code generation and modification | Active |
| **shirokuma-tester** | Test creation and execution | Active |
| **shirokuma-reviewer** | Code review specialist | Active |
| **shirokuma-researcher** | Technical research | Active |
| **shirokuma-designer** | Architecture and design | Active |
| **shirokuma-system-harmonizer** | System consistency checker | Active |
| **shirokuma-daily-reporter** | Daily summary generation | DEPRECATED |
| **shirokuma-session-automator** | Session automation | DEPRECATED |

### Available Commands

| Command | Purpose | Execution Mode |
|---------|---------|----------------|
| **/ai-start** | Initialize work session, restore context | Direct (main agent) |
| **/ai-finish** | End session, save progress | Direct (main agent) |
| **/ai-remember** | Record decisions with validation | Direct (main agent) |
| **/ai-go** | Execute work with appropriate agent | Delegated to agents |

### Content Type System

#### Current 9-Type System
1. **issues** - Bug reports and tasks (priority, status)
2. **plans** - Project plans with timelines
3. **docs** - Technical documentation
4. **knowledge** - Knowledge base articles
5. **sessions** - Work session logs (timestamp IDs)
6. **dailies** - Daily summaries (date IDs) [DEPRECATED]
7. **decisions** - Design decisions
8. **features** - Feature specifications
9. **test_results** - Test execution results
10. **handovers** - Inter-agent communication

#### Future 2-Type System (Planned)
- **items** - All content with type field
- **sessions** - Work sessions only

## Development Environment

### npm Scripts
```json
{
  "dev": "NODE_ENV=development tsx src/server.ts",
  "build": "tsc --build --clean && tsc --build --force tsconfig.prod.json",
  "start": "node dist/server.js",
  "test": "jest",
  "test:unit": "jest --testMatch='<rootDir>/src/**/*.test.ts'",
  "test:coverage": "jest --coverage",
  "test:integration": "jest tests/integration --runInBand",
  "test:e2e": "tsx tests/e2e/custom-runner.ts",
  "lint": "eslint src/",
  "lint:errors": "eslint src/ --quiet",
  "inspect": "npx @modelcontextprotocol/inspector node dist/server.js",
  "rebuild-db": "tsx src/rebuild-db.ts"
}
```

### Quality Standards
- **ESLint**: 40+ strict rules including:
  - `no-explicit-any`: error
  - `filename-case`: kebab-case enforced
  - `explicit-function-return-type`: required
- **TypeScript**: strict mode, noImplicitAny
- **Test Coverage**: Configured with exclusions for types/mocks

## Project Overview

**Name**: SHIROKUMA Knowledge Base  
**Type**: MCP (Model Context Protocol) Server  
**Purpose**: Dual-storage knowledge management system with Markdown files and SQLite database  
**Language**: TypeScript  
**Runtime**: Node.js  

### Project Structure
```
/home/webapp/mcp/
├── src/                          # Source code (~3,500 lines)
│   ├── __tests__/               # Unit tests (17 files)
│   ├── config/                  # Configuration management
│   ├── database/                # Database layer (7 repositories)
│   ├── handlers/                # MCP handlers (11 handlers)
│   ├── types/                   # TypeScript definitions (10 files)
│   ├── utils/                   # Utilities (10 files)
│   ├── security/                # Security features (4 files)
│   ├── services/                # Business logic
│   ├── formatters/              # Data formatters
│   ├── indexing/                # Semantic code search
│   ├── schemas/                 # Zod validation schemas
│   └── server.ts                # MCP server entry
├── tests/                       # Integration & E2E tests
│   ├── integration/             # Integration tests (11 files)
│   └── e2e/                     # End-to-end tests
├── docs/                        # Documentation
│   └── mcp-type-restructure-plan/  # Type migration plan
├── .claude/                     # Claude Code configuration
│   ├── agents/                  # AI agents (12 active)
│   └── commands/                # Custom commands (4)
├── dist/                        # Build output (~72 files)
└── .database/                   # Data storage
    ├── items/                   # Markdown content files
    └── shirokuma.db            # SQLite search index
```

### Key Libraries
- **@modelcontextprotocol/sdk**: ^1.0.2 - MCP framework
- **better-sqlite3**: ^11.5.0 - SQLite database
- **zod**: ^3.23.8 - Schema validation
- **@xenova/transformers**: ^2.17.2 - Semantic search
- **winston**: ^3.17.0 - Logging
- **jest**: ^29.7.0 - Testing with ts-jest

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

### Directory Structure

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

## TypeScript Configuration

### Compiler Options

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "allowJs": true,
    "strict": true,
    "noImplicitAny": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "sourceMap": true,
    "resolveJsonModule": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "incremental": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo",
    "removeComments": true
  }
}
```

### Type Patterns

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

## MCP-Specific Patterns

### Tool Registration

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

### Handler Pattern

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

## Testing Patterns

### Test Structure

```typescript
// Standard test structure
describe('ItemService', () => {
  let service: ItemService;
  let db: Database;
  
  beforeEach(async () => {
    db = await createTestDatabase();
    service = new ItemService(db);
  });
  
  afterEach(async () => {
    await db.close();
  });
  
  describe('getItems', () => {
    it('should return items of specified type', async () => {
      // Arrange
      await createTestItem(db, { type: 'issues' });
      
      // Act
      const result = await service.getItems({ type: 'issues' });
      
      // Assert
      expect(result.items).toHaveLength(1);
      expect(result.items[0].type).toBe('issues');
    });
  });
});
```

### Mock Patterns

```typescript
// Database mock for testing
export function createMockDatabase(): MockDatabase {
  const data = new Map<string, any>();
  
  return {
    async get(query: string, params: any[]): Promise<any> {
      // Mock implementation
    },
    async all(query: string, params: any[]): Promise<any[]> {
      // Mock implementation
    },
    async run(query: string, params: any[]): Promise<void> {
      // Mock implementation
    }
  };
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

## Development Workflow

### Git Hooks

```json
// .husky/pre-commit
{
  "scripts": {
    "pre-commit": "npm run lint:errors && npm run typecheck"
  }
}
```

### Build Process

```typescript
// Build configuration
export const buildConfig = {
  // Clean previous build
  clean: ['dist/**/*'],
  
  // TypeScript compilation
  compile: {
    src: 'src/**/*.ts',
    dest: 'dist',
    options: tsConfig.compilerOptions
  },
  
  // Copy static files
  copy: [
    { from: 'src/**/*.json', to: 'dist' },
    { from: 'README.md', to: 'dist' }
  ]
};
```

## Environment Configuration

### Environment Variables

```typescript
// Environment configuration with defaults
export const config = {
  // Database configuration
  databaseRoot: process.env.DATABASE_ROOT || '.database',
  databasePath: process.env.MCP_DATABASE_PATH || '.database/shirokuma.db',
  
  // Server configuration
  logLevel: process.env.LOG_LEVEL || 'info',
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Feature flags
  enableCodeIndexing: process.env.ENABLE_CODE_INDEXING === 'true',
  enableAutoBackup: process.env.ENABLE_AUTO_BACKUP === 'true',
  
  // Performance tuning
  maxConcurrentOperations: parseInt(process.env.MAX_CONCURRENT_OPS || '10'),
  cacheEnabled: process.env.CACHE_ENABLED !== 'false',
  cacheTTL: parseInt(process.env.CACHE_TTL || '300')
};
```

## Integration Guidelines

### MCP Client Integration

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

### Claude Code Integration

The project is designed to work seamlessly with Claude Code through:

1. **MCP Protocol**: Standard Model Context Protocol implementation
2. **Tool Naming**: Consistent `mcp__shirokuma-knowledge-base__` prefix
3. **Error Handling**: MCP-compliant error codes and messages
4. **Response Format**: Standardized JSON responses

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

This configuration guide should be used in conjunction with the `.claude/project-config.yaml` for basic settings and referenced by all AI agents working on this project.

## Design Philosophy

### Layered Architecture
1. **MCP Protocol Layer** - Handles all MCP communication
2. **Handler Layer** - 11 specialized handlers for different operations
3. **Repository Layer** - 7 repositories for data access abstraction
4. **Storage Layer** - Dual storage with Markdown + SQLite

### Key Design Patterns
- **Strategy Pattern**: Type-specific processing logic
- **Repository Pattern**: Clean data access abstraction
- **Handler Pattern**: Modular request processing
- **Dual Storage**: Markdown for content, SQLite for search

### Design Principles
- **Separation of Concerns**: Each layer has clear responsibilities
- **Type Safety**: Extensive use of TypeScript generics and Zod validation
- **Performance**: FTS5 for search, semantic indexing for code
- **Extensibility**: Easy to add new types and handlers
- **Testability**: Comprehensive mocking support

## Future Roadmap

### Type System Migration (Planned)
- **Current**: 9 specialized types (issues, plans, docs, etc.)
- **Future**: 2 universal types (items + sessions)
- **Migration Plan**: Available in `/docs/mcp-type-restructure-plan/`
- **Benefits**: Simplified maintenance, flexible categorization via tags

### Planned Features
1. **Real-time Sync**: File watcher for instant updates
2. **Advanced Search**: Graph-based relationship queries
3. **Performance**: Caching layer for frequent queries
4. **Security**: Enhanced rate limiting and access control
5. **Integration**: Direct Git integration for version control

### Deprecated Features
- **dailies type**: Use sessions for work tracking (type still exists but will be removed)
- **session-automator agent**: Functionality integrated into /ai-start and /ai-finish commands
- **daily-reporter agent**: No longer needed with session-based tracking
- **Note**: Deprecated agents have been removed from the codebase (recoverable via git history)

## Special Features

### Semantic Code Search
- Uses `@xenova/transformers` for AI-powered code search
- Natural language queries to find relevant code
- Builds embeddings index for entire codebase
- Commands: `index_codebase`, `search_code`, `get_related_files`

### Dynamic Type System
- Create custom content types at runtime
- Each type inherits from base type (tasks or documents)
- Automatic UI and validation generation
- Commands: `create_type`, `update_type`, `delete_type`

### Cross-Reference Management
- Automatic bidirectional link updates
- Type change propagation across references
- Relationship integrity maintenance
- Commands: `change_item_type` with automatic reference updates

### Multi-Language Support
- `SHIROKUMA_LANG` environment variable
- Supports any language (日本語, English, etc.)
- Language preference cascades: User request > ENV > Default (English)