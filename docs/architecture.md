# Architecture & Implementation Details

## Recent Improvements (2025-07-24)

### 1. Enhanced Type Safety
- Eliminated `any` types in handlers
- Created comprehensive type definitions in `types/handler-types.ts`
- Implemented generic handler interfaces
- Added strong typing for all API responses

### 2. Unified Error Handling
- Custom error class hierarchy in `utils/errors.ts`
- Specialized error types (ValidationError, NotFoundError, DatabaseError, etc.)
- Consistent error handling utilities
- Proper error logging and transformation

### 3. Refactored Architecture
- Split large `FileIssueDatabase` class into feature-specific facades
- Implemented facade pattern for better separation of concerns
- Created `IssueFacade`, `PlanFacade`, `KnowledgeFacade`, and `DocFacade`
- Maintained backward compatibility while improving maintainability

### 4. Memory Optimization
- Fixed EventEmitter memory leak warnings
- Configured proper listener limits for production and test environments
- Added `jest.setup.ts` for test environment configuration

### 5. Internationalization
- All code comments and messages are now in English
- Consistent naming conventions throughout the codebase
- Improved code readability for international contributors

## Code Organization

```
src/
├── database/
│   ├── facades/         # Feature-specific database facades
│   │   ├── base-facade.ts
│   │   ├── issue-facade.ts
│   │   ├── plan-facade.ts
│   │   ├── knowledge-facade.ts
│   │   └── doc-facade.ts
│   ├── index.ts         # Main database class
│   └── repositories/    # Individual repository implementations
├── handlers/            # Request handlers
├── schemas/             # Zod validation schemas
├── types/               # TypeScript type definitions
│   ├── domain-types.ts  # Domain model types
│   ├── handler-types.ts # Handler-specific types
│   └── repository-interfaces.ts
├── utils/               # Utility functions
│   ├── errors.ts        # Custom error classes
│   └── logger.ts        # Logging configuration
└── server.ts            # Main server entry point
```

## Database Architecture

### Storage System
- **Markdown Files**: Primary storage for all content (issues, plans, documents, knowledge, sessions)
- **SQLite**: Tag management and cross-referencing system

### Directory Structure
```
database/
├── issues/          # Issue management
│   ├── issue-*.md   # Individual issue files
│   └── statuses.json # Status definitions
├── plans/           # Plan management
│   └── plan-*.md    # Individual plan files
├── docs/            # Document management
│   └── doc-*.md     # Individual document files
├── knowledge/       # Knowledge management
│   └── knowledge-*.md    # Individual knowledge files
├── sessions/        # Work session recording
│   └── YYYY-MM-DD/  # Date-based directories
│       ├── session-YYYYMMDD-HHMMSSmmm.md  # Session records (with Front Matter)
│       └── daily-summary-YYYY-MM-DD.md   # Daily summaries
└── search.db        # SQLite high-speed search database (includes tag management)
```

### Storage Features
- **Front Matter**: YAML-formatted metadata for all content types
- **SQLite Database**: Tag management and cross-references
- **Markdown Files**: Primary content storage with full-text search capability
- **Automatic Sync**: Changes to markdown files are automatically reflected in SQLite

## Testing Strategy

- Comprehensive test coverage (61.42% overall)
- All 72 tests passing
- Test categories: unit tests for repositories, integration tests for database operations
- Automated testing with Jest and ts-jest

### Test Structure
- Repository tests: CRUD operations, error handling, concurrent operations
- Database integration tests: Cross-repository operations, tag management
- Session management tests: Work session creation, updates, daily summaries

## Security Measures

- Input validation using Zod schemas
- SQL injection protection (parameterized queries)
- Type safety enforcement (TypeScript strict mode)
- Path traversal protection
- Secure error handling (no sensitive data leakage)

## Design Patterns

### Facade Pattern
The database layer uses the facade pattern to simplify complex subsystem interactions:
- `FileIssueDatabase` acts as the main facade
- Feature-specific facades handle individual domains
- Repositories handle low-level data operations

### Repository Pattern
Each data type has its own repository:
- Encapsulates data access logic
- Provides consistent CRUD interfaces
- Handles file I/O and database operations

### Factory Pattern
Logger creation uses the factory pattern:
- `createLogger` function creates configured logger instances
- Consistent logging across all modules