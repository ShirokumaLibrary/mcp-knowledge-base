# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.7.5] - 2025-08-02

### Added
- **Advanced Search with Boolean Operators**: Full support for AND/OR/NOT operators in search queries
  - Explicit boolean operators: `bug AND fix`, `bug OR error`, `NOT deprecated`
  - Negation prefix: `-tags:old`
  - Parentheses for grouping: `(bug OR error) AND critical`
  - Operator precedence: NOT > AND > OR
  - Combined with field-specific searches: `title:bug AND content:fix`
- **Expression Tree Parser**: New recursive descent parser for complex search queries
  - Handles nested expressions and proper operator precedence
  - Converts to optimized FTS5 queries
  - Backward compatible with simple searches

### Changed
- **Database Rebuild Improved**: `rebuild-db` command now preserves MCP connections
  - Drops and recreates tables instead of deleting database file
  - No server restart required - operations can continue immediately
  - Preserves all data integrity while maintaining active connections
  - For forced clean rebuild, manually delete database file first: `rm .shirokuma/data/search.db`
  - Removed redundant `rebuild-db-safe` command

## [0.7.4] - 2025-08-01

### Fixed
- **Strict Parameter Validation**: All API calls now reject unknown parameters
  - Prevents silent failures when invalid fields are provided
  - Improves error messages for API misuse
  - Ensures API contract is strictly enforced

## [0.7.3] - 2025-08-01

### Fixed
- **File Indexing**: Fixed error when running `index_codebase` from git subdirectories
  - Removed redundant `.git` directory check that failed in subdirectories
  - Relies on `git ls-files` error handling for repository validation
  - Subdirectories now correctly index only their contained files (standard git behavior)

## [0.7.2] - 2025-08-01

### Fixed
- **Migration Tool**: Fixed issue where code examples in document content were incorrectly processed
  - Now strictly processes only YAML frontmatter
  - Ignores `related_tasks` and `related_documents` in document body
  - Prevents corruption of documentation files containing code examples

## [0.7.1] - 2025-08-01

### Added
- **Related Field Migration Tool**: New command to migrate from old format to unified field
  - `shirokuma-mcp-knowledge-base-migrate-related` command for global installations
  - Converts `related_tasks` and `related_documents` to unified `related` field
  - Creates backup files by default (use `--no-backup` to skip)
  - Safe to run multiple times (idempotent)
- **Current State Metadata Support**: Enhanced current_state with YAML frontmatter
  - Structured metadata including title, tags, related items, and updated_by
  - Maintains backward compatibility with plain text format
- **Database Comparison Tools**: New tools for database verification in `.claude/tools/`
  - `compare-databases.sh`: Comprehensive database comparison
  - `dump-database-details.sh`: Detailed database content dump  
  - `verify-rebuild-content.sh`: Item-by-item content verification
- **Pre-commit Test Check**: ai-commit command now runs tests before committing
  - Prevents broken code from being committed
  - Stops commit process if any tests fail

### Changed
- **Unified Related Field**: Consolidated `related_tasks` and `related_documents` into single `related` field
  - Simplifies data structure and API
  - Automatic merging during creation and updates
  - Full backward compatibility maintained
- Enhanced test documentation with automated database comparison tools

### Fixed
- Dailies date filtering test using correct `date` parameter instead of `id`
- Frontmatter spacing issues in migration tool (only processes frontmatter, preserves content)

## [0.7.0] - 2025-07-31

### Added
- **File Indexing**: Semantic code search functionality for git-managed projects
  - New MCP tools: `index_codebase`, `search_code`, `get_related_files`, `get_index_status`
  - Vector embeddings using all-MiniLM-L6-v2 model for semantic similarity
  - Normalized database structure with files and file_chunks tables for efficient storage
  - Support for .shirokumaignore file to customize indexing patterns
  - Environment variable support for index.db location (follows MCP_DATABASE_PATH)
  - Automatic incremental updates based on file content hashes
- **Enhanced Multi-word Search**: Improved full-text search functionality
  - Proper AND logic for multi-word queries (all words must be present)
  - Fixed pagination count for multi-word searches
  - Comprehensive test coverage for search edge cases

### Changed
- Updated ai-start command to support session descriptions instead of just titles
  - Now creates more descriptive session records with context
  - Improved workflow for work session tracking

### Fixed
- Security: Removed path parameter from index_codebase tool to prevent arbitrary directory indexing
- Full-text search count method now correctly handles multi-word queries
- Test failures in fulltext-search.test.ts and server.test.ts

### Technical Details
- File indexing creates semantic embeddings of code chunks (30 lines per chunk)
- Uses SQLite with JSON storage for vector embeddings
- Implements cosine similarity for semantic search
- Supports multiple file types including programming languages, configs, and documentation
- Database normalization achieves ~82% storage reduction compared to flat structure

## [0.6.3] - 2025-07-31

### Changed
- **BREAKING**: Optimized get_items API response structure
  - Returns new ListItem type instead of UnifiedItem for list operations
  - Excludes content field to reduce data transfer size
  - Includes description field for list summaries
  - Removed JSON pretty-printing for more compact responses
- Fixed ai-finish.md and ai-start.md command files to match API implementation
  - ai-finish: Added proper conditional flow for daily creation/update
  - ai-start: Removed non-existent category field, changed related_tasks to related

### Added
- New ListItem type for lightweight list responses
- Comprehensive field validation tests to ensure correct API output
- Test case 1.14 for field validation in MCP test suite

### Fixed
- Removed redundant related_tasks/related_documents fields in favor of unified related field
- Updated all tests to expect compact JSON format

## [0.6.2] - 2025-07-31

### Fixed
- Critical JSON parsing errors in MCP protocol communication
  - Removed all console output that was polluting stdio
  - Disabled winston logging in production MCP mode
  - Removed sqlite3 verbose mode to prevent debug output
  - Added stdio guard utility to redirect unwanted output to log files
  - Fixed "Unexpected non-whitespace character at position 4" errors

### Changed
- Enhanced environment configuration for development vs production modes
  - NODE_ENV=development automatically enables logging
  - Production mode (default) suppresses all output for clean MCP protocol
  - Added npm scripts for explicit mode control

## [0.6.1] - 2025-07-30

### Added
- CLAUDE.md.example file providing guidance template for AI assistants in English
- CLAUDE.md.ja.example file providing guidance template for AI assistants in Japanese

### Changed
- Consolidated StatusRepositoryV2 into main StatusRepository implementation
- Updated .gitignore to better handle database directory structures

### Removed
- Redundant v2 repository files (status-repository-v2.ts, tag-repository-v2.ts)
- Unused v2 handler files (status-handlers-v2.ts, tag-handlers-v2.ts)
- Obsolete test files (item-repository.test.ts, change-type-handlers.test.ts)

### Documentation
- Enhanced test case 1.13 with proper test ID and prerequisites
- Added comprehensive CLAUDE.md examples for project-specific AI guidance

## [0.6.0] - 2025-07-30

### Added
- **Application State Management**: New `get_current_state` and `update_current_state` tools for persisting application-wide state across sessions
- **Type Change Functionality**: New `change_item_type` tool to change an item's type within the same base_type category
  - Automatically creates new item with new ID and updates all references
  - Supports both task-based and document-based type changes
- **Type Description Updates**: New `update_type` tool to modify type descriptions

### Changed
- Documentation reorganized to separate user-facing and developer documentation
- Updated .npmignore to properly include user documentation while excluding developer docs
- Enhanced API documentation with new features and examples

### Fixed
- Fixed ItemRepository incompatibility issue between different implementations using dynamic imports
- Fixed reference update bug when changing item types - now correctly updates all related items

## [0.5.3] - 2025-07-30

### Fixed
- Prevent tag deletion when the tag is being used by items
  - Displays error with count of items using the tag
  - Only unused tags can be deleted
- Title validation to prevent empty titles on item creation

### Added
- AI testing commands for development workflow
  - `/ai-commit` command for automated commit management
  - `/ai-tests` command for comprehensive MCP functional testing
  - Test case files for systematic validation

### Changed
- Updated .gitignore to preserve .claude/commands/ directory
- Simplified test case documentation to reference command usage

## [0.4.2] - 2025-07-29

### Security
- **Critical Fix**: Path traversal vulnerability in session ID handling
  - Added comprehensive validation for file paths and IDs
  - Prevents directory traversal attacks (e.g., `../../etc/passwd`)
  - Multi-layer defense: Zod schemas, repository validation, and file path checks

### Added
- **Monkey Testing**: Extensive stress testing with edge cases
  - Unicode and emoji handling verification
  - SQL injection prevention testing
  - Concurrent operation testing
  - Large dataset handling (50+ tags per item)
  - Custom type creation and usage validation

### Changed
- Enhanced input validation across all ID parameters
- Improved error messages for invalid input formats

### Fixed
- Security vulnerability where malicious session IDs could create files outside data directory

### Documentation
- **Major Documentation Reorganization**:
  - Separated user documentation (`docs/user/`) from developer resources (`docs/developer/`)
  - Created internal documentation directory (`docs/internal/`) for project-specific docs
  - Consolidated release notes and migration guides under `docs/releases/`
  - Japanese documentation now mirrors English structure under `docs/ja/`
  - Added comprehensive navigation READMEs for each directory
  - Created new guides: quickstart, installation, usage guides for users
  - Added developer guides: database design, API architecture, debugging
  - Implemented redirect files for backward compatibility
- **Documentation Cleanup**:
  - Removed obsolete `docs.ja/` directory
  - Cleaned up old documentation files with appropriate redirects
  - Improved documentation discoverability with clear structure

## [0.4.1] - 2025-07-29

### Added
- **Test Coverage Improvements**: Achieved 80.33% function coverage (up from 44.54%)
  - Added 500+ new tests across the codebase
  - Comprehensive security layer tests (input sanitizer, rate limiter, access control)
  - Edge case handling tests for Unicode, special characters, and validation
  - MCP protocol test suite with 12 categories and 200+ test cases
- **Development Documentation**:
  - Test results documentation in `/docs/test-results/`
  - Updated test case documentation with discovered behaviors
  - Code quality metrics in README

### Changed
- **Code Quality Improvements**:
  - Removed all TypeScript `any` types (249 → 0)
  - Enhanced type safety throughout the codebase
  - Improved error messages and validation
  - Better separation of concerns in test files

### Fixed
- Session update now correctly preserves the date field
- Empty tags handling (returns null instead of empty array from markdown)
- Build errors in test files (missing properties, incorrect types)
- Markdown parser handling of numeric strings with leading zeros
- Path traversal test expectations in security tests

### Removed
- **Code Cleanup**: Removed 11 unused files (approximately 1500 lines)
  - Obsolete dependency container and related tests
  - Unused error handling utilities and middleware
  - Deprecated performance utilities
  - Dead code in various utility modules

## [0.4.0] - 2025-07-29

### Added
- **Unified Repository System**: Complete consolidation of all repository classes
  - New `ItemRepository` handles all item types (issues, plans, docs, knowledge, sessions, dailies)
  - Unified handlers for consistent API across all content types
  - Full-text search capability with dedicated `FulltextSearchRepository`
  - String utilities for enhanced text processing
- **Search Enhancements**: 
  - New search handlers for improved content discovery
  - Full-text search across all content types
  - Better search result ranking and relevance

### Changed
- **BREAKING**: Consolidated TaskRepository and DocumentRepository into single ItemRepository
  - All item operations now go through unified repository layer
  - Consistent error handling and validation across all types
  - Improved performance with optimized queries
- **Architecture Improvements**:
  - Simplified repository structure reduces code duplication
  - Better separation of concerns with dedicated search repository
  - Enhanced type safety with unified type system

### Removed
- TaskRepository and DocumentRepository classes (replaced by ItemRepository)
- Separate item handlers (replaced by unified handlers)
- Task repository helper functions (functionality integrated into ItemRepository)
- Redundant test files for removed components

### Fixed
- Test result files no longer tracked in version control
- Development scripts properly excluded from repository

## [0.3.0] - 2025-07-28

### Added
- **Unified Items API**: Sessions and daily summaries are now accessible through the standard items API
  - `get_items` now supports 'sessions' and 'dailies' types
  - `create_item` supports session-specific parameters (datetime, id, category)
  - `create_item` supports dailies-specific parameter (date)
  - Date range filtering with type-specific behavior:
    - Sessions/dailies: Filter by start_date field
    - Other types: Filter by updated_at field
  - `limit` parameter for pagination and getting latest items
- **get_latest_session replacement**: Use `get_items(type: 'sessions', limit: 1)`
- Comprehensive integration tests for API unification

### Changed
- ItemRepository now handles sessions and dailies as special types
- Enhanced create_item to support custom datetime and IDs for sessions
- Updated API documentation to reflect unified approach

### Deprecated
- Session-specific APIs (get_sessions, create_session, update_session, etc.)
- Daily summary-specific APIs (get_summaries, create_summary, update_summary, etc.)
- Use the unified items API instead for all operations

## [0.2.0] - 2025-01-27

### Changed
- **BREAKING**: Complete database unification using Single Table Inheritance pattern
  - All content types now stored in unified `items` table
  - Replaced separate tables (search_tasks, search_documents, search_sessions, search_daily_summaries)
  - All IDs standardized to TEXT type for consistency
  - Composite primary keys (type, id) for all items
  - JSON arrays for tags and related items storage
  - Related tables unified: item_tags and related_items
- **BREAKING**: Changed `statusIds` parameter to `statuses` in get_items API
  - Now accepts status names (strings) instead of IDs (numbers)
  - Example: `statuses: ["Open", "In Progress"]` instead of `statusIds: [1, 2]`
  - Empty array now returns no results (previously returned all results)

### Added
- ItemRepository as central data access layer for all item types
- Support for dynamic custom types via sequences table lookup
- Unified API for all content operations (get_items, create_item, etc.)
- Backward compatibility in response formats where needed for tests

### Fixed
- Database column name issue: changed `last_id` to `current_value` in sequences table
- All 409 tests now passing (359 unit tests + 45 integration tests + 5 E2E tests)
- Response format consistency across all handlers
- ID type consistency (all IDs now TEXT)
- Empty status filter array now correctly returns no results

### Technical Details
- Single unified `items` table schema:
  - Common fields: type, id, title, description, content, priority, status_id
  - Task-specific: start_date, end_date
  - Session-specific: start_time
  - JSON storage: tags, related (for relationships)
- Simplified repository architecture with ItemRepository handling all types
- Type validation through sequences table with base_type field
- Maintained backward compatibility for existing API consumers

## [0.1.1] - 2025-01-27

### Removed
- Session category field - tags provide sufficient categorization
  - Removed `category` parameter from create_session and update_session tools
  - Removed category field from WorkSession type
  - Created migration script to remove category from existing markdown files
  - Updated all tests and documentation

### Fixed
- MaxListenersExceededWarning in tests by properly configuring Jest setup
  - Added jest.presetup.js to increase EventEmitter limits before module loading
  - Warnings no longer appear during test execution

## [0.1.0] - 2025-01-27

> **Note**: E2E tests require special setup due to MCP SDK module resolution issues.
> They are currently excluded from the standard test suite but can be run separately.
> This is a known limitation that will be addressed in a future release.

### Added
- Comprehensive type safety improvements throughout the codebase
- Base repository pattern with proper interfaces
- Dependency injection and IoC container
- Performance optimization utilities (caching, batching, monitoring)
- Security layers (input sanitization, rate limiting, RBAC)
- E2E testing framework with MCP protocol testing
- Mock and stub utilities for testing
- Database type definitions for better type safety
- Error handling middleware and custom error classes
- Repository factory pattern
- Test helpers and utilities
- Comprehensive documentation (API, Contributing, Upgrade guides)

### Changed
- Reduced `any` types from 242 to 175 (27% reduction)
- Improved repository structure with base classes and interfaces
- Enhanced error handling with proper error types
- Separated unit, integration, and E2E tests
- Updated build configuration for better type checking
- Improved logging with configurable levels
- Enhanced test setup with console output suppression

### Fixed
- TypeScript build errors with proper type constraints
- Test failures due to console.log output
- E2E test configuration issues with MCP SDK
- Generic type constraints in base repository
- Database connection type mismatches

### Security
- Added comprehensive input sanitization
- Implemented rate limiting with token bucket algorithm
- Added role-based access control (RBAC)
- Path traversal prevention
- SQL injection prevention
- XSS prevention

### Performance
- Added memory caching for frequently accessed data
- Implemented batch processing for bulk operations
- Added performance monitoring utilities
- Query result caching with TTL
- Optimized database queries

## [0.0.11] - 2025-07-26

### Added
- Custom datetime parameter for create_session
  - New `datetime` parameter allows creating sessions with past timestamps
  - Enables historical data migration and import
  - ISO 8601 datetime format support
- Cross-reference fields for all item types
  - `related_tasks` field added to documents, sessions, and summaries
  - `related_documents` field added to all item types (issues, plans, docs, knowledge, sessions, summaries)
  - Normalized database tables for relationship storage
  - MCP tool definitions updated with new fields

### Changed
- Session ID format changed to `YYYY-MM-DD-HH.MM.SS.sss`
  - More readable format with dots as separators
  - Example: `2025-01-26-14.30.52.123`
- Enhanced item relationships
  - All item types can now reference related tasks (e.g., ["issues-1", "plans-2"])
  - All item types can now reference related documents (e.g., ["docs-1", "knowledge-2"])
  - Database schema extended with related_documents table
- **Database connection pattern changed to per-request connections**
  - Each API call now creates a fresh database connection
  - Automatically handles database rebuild scenarios without restart
  - Eliminates connection state issues
  - Small performance trade-off (~10-15ms) for improved reliability

### Technical Details
- Database schema changes:
  - New `related_documents` table for document relationships
  - Indexes added for efficient relationship queries
  - Support for both integer and string IDs in relationships
- Updated all handlers to pass through relationship fields
- Extended Zod schemas for validation of new fields
- Removed persistent database connection in favor of per-request pattern
  - No more initialization on server startup
  - Database connections are created and closed for each tool call

## [0.0.10] - 2025-07-26

### Added
- Related tasks support for issues and plans
  - New `related_tasks` field in create_item and update_item tools
  - Array of task references (e.g., ["issues-1", "plans-2"])
  - Comprehensive unit tests for related tasks functionality

### Fixed
- MCP tool definitions missing related_tasks field
- Enhanced unit test coverage for edge cases

### Changed
- Improved test coverage for tag search functionality
- Added tests for partial matching and special characters in tag searches

## [0.0.9] - 2025-07-26

### Fixed
- Fixed :memory: directory creation issue in status-filtering tests
  - Corrected FileIssueDatabase constructor parameter order
- Fixed test failures across all test suites
  - Method name mismatches in repository tests
  - TypeScript compilation errors in test files
  - Mock implementations updated to match actual interfaces
  - Session handler tests with proper WorkSessionManager setup

### Added
- Comprehensive test coverage achieving 100% pass rate (215 passing tests)
- New test suites for better coverage:
  - Error handling tests with proper skip annotations
  - Item handlers tests for MCP response format
  - Search repository tests with correct table setup
  - Session handlers tests with correct mock setup
  - Status filtering tests with sequential task creation
  - Status handlers tests for markdown format
  - Summary handlers tests with WorkSessionManager
  - Tag handlers tests avoiding :memory: directory issue
  - Task repository tests for unified task handling
- Test annotations in AI annotation rules (@ai-skip, @ai-reason, @ai-todo, @ai-note)
- CHANGELOG.md and version management guidelines to commit documentation

### Changed
- Improved test organization with intentionally skipped tests (4 tests) properly documented
- Updated AI annotation rules to include testing tags
- Enhanced commit guidelines with version management section

## [0.0.8] - 2025-07-25

### Added
- Dynamic type system allowing custom document types
- Type management tools (create_type, get_types, delete_type)
- Centralized file naming logic in BaseRepository
- Migration scripts for plural filenames and unified documents

### Changed
- **BREAKING**: File naming convention changed to plural forms
  - `issue-{id}.md` → `issues-{id}.md`
  - `plan-{id}.md` → `plans-{id}.md`
  - `doc-{id}.md` → `docs-{id}.md`
  - Custom types remain singular (e.g., `recipe-{id}.md`)
- **BREAKING**: Removed enum constraints from type parameters
  - All type fields now accept dynamic values
  - Use `get_types` to discover available types
  - Removed `subtype` parameter - type is now specified directly
- Simplified createType to only accept name parameter
- Updated directory structure: `documents/doc/` → `documents/docs/`

### Removed
- Static type enums from tool definitions
- Unused description parameter from createType
- Subtype specification - use type directly (e.g., "recipe" instead of type="document", subtype="recipe")

### Fixed
- Hardcoded file naming replaced with dynamic sequence table lookups
- Test failures due to inconsistent file naming
- MaxListenersExceededWarning by setting Jest maxWorkers to 1

## [0.0.7] - 2025-07-25

### Added
- Summary field support for all item types (issues, plans, docs, knowledge)
- Migration script for existing summary fields (`migrate-summary-fields.ts`)
- Comprehensive test case documentation with AI validation procedures
- **Unified document type**: New 'document' type that encompasses both doc and knowledge
  - Maintains separate ID sequences for doc and knowledge subtypes
  - Uses composite primary key (type, id) in SQLite
  - Preserves existing directory structure under documents/
- Migration script for unified documents (`migrate-to-unified-documents.ts`)
- DocumentRepository for managing unified documents
- Document-specific tests validating the new unified approach

### Changed
- Unified content repository approach for doc and knowledge types
- Removed separate ContentRepository in favor of unified pattern
- Updated facades to use status names instead of IDs
- Improved schema definitions to include optional summary field
- **API Changes**: 
  - Added 'document' as a new type option in all item operations
  - Added required 'subtype' field when using type='document'
  - Doc and knowledge types remain available for backward compatibility
- Updated tool definitions to support the new document type
- Enhanced item handlers to process document type with subtype validation

### Fixed
- Test expectations for unified content repository structure
- Facade methods now properly support summary field updates
- Tag ID handling in DocumentRepository to use Map correctly

## [0.0.6] - 2025-07-25

### Changed
- **BREAKING**: Migrated from YAML frontmatter to JSON metadata format
  - Significantly improved performance (JSON parsing is ~10x faster than YAML)
  - Reduced dependencies by removing js-yaml
  - All markdown files now use JSON format between `---json` markers
  - Added migration script `migrate-tags-to-json.ts` for existing data

### Added
- JSON metadata format support in markdown parser
- Migration script to convert existing YAML frontmatter to JSON
- Backward compatibility during transition period

### Fixed
- Performance issues with large datasets due to YAML parsing overhead
- Memory usage reduced by using native JSON parsing

### Technical Details
- Replaced gray-matter YAML parsing with custom JSON parser
- Updated all repositories to generate JSON metadata
- Test cases updated to work with new format

## [0.0.5] - 2025-07-25

### Added
- `is_closed` flag to status management for distinguishing terminal states
- "Cancelled" as a default status with `is_closed=true`
- Status filtering options for issue/plan lists
  - Default behavior excludes closed statuses
  - Optional `includeClosedStatuses` parameter
  - Optional `statusIds` parameter for specific status filtering
- Commit guidelines documentation for consistent commit practices
- Development warning in README.md

### Changed
- **BREAKING**: Status storage now uses names instead of IDs in markdown files
  - More resilient to database rebuilds
  - Status IDs no longer stored in markdown frontmatter
- Improved session manager to use `getSessionDetail` for robust lookups
- Updated `rebuild-db` to handle status names instead of IDs
- Renamed "unified" terminology throughout the codebase:
  - `unified-handlers.ts` → `item-handlers.ts`
  - `unified-schemas.ts` → `item-schemas.ts`
  - `unified-tool-definitions.ts` → `tool-definitions.ts`
- Moved session and summary schemas to `session-schemas.ts`

### Removed
- Status modification tools (create_status, update_status, delete_status)
  - Status management is now done through database initialization only
- Migration system in favor of initialization-only approach

### Fixed
- Session tests now correctly find sessions regardless of date parsing
- Test expectations updated for 7 default statuses (was 6)
- Import paths updated after file renaming

## [0.0.4] - 2025-07-24

### Added
- Daily summary validation tests to ensure data integrity
- Comprehensive test cases documentation (docs/test-cases.md) for systematic validation
- updateDailySummary method in SessionRepository for proper file updates

### Fixed
- Daily summary update functionality now works correctly
- Fixed issue where empty strings couldn't be used to update summary fields
- Corrected expected default statuses in test cases (6 statuses instead of 3)

### Changed
- Improved update logic to use `!== undefined` instead of `||` operator for better field updates
- Enhanced error handling in summary update operations

## [0.0.3] - 2025-07-24

### Changed
- **BREAKING**: Changed default data directory from `database` to `.shirokuma/data`
  - Avoids naming conflicts with project directories
  - Uses hidden directory for cleaner project structure
  - All data files are now stored under `.shirokuma/data/`
- Centralized all path configurations in `src/config.ts`
  - All components now use config for path resolution
  - Removed hardcoded paths from individual modules
- Improved configuration management
  - Environment variable `MCP_DATABASE_PATH` to customize data directory
  - Environment variable `MCP_SQLITE_PATH` to customize SQLite location

### Added
- Comprehensive path configuration in config module
  - `issuesPath`, `plansPath`, `docsPath`, `knowledgePath`, `sessionsPath`
  - All paths derived from base data directory

### Fixed
- Path resolution consistency across all modules
- Session manager now uses centralized config

## [0.0.2] - 2025-07-24

### Added
- Comprehensive test coverage for session management
- Database rebuild functionality with `npm run rebuild-db`
- Migration support for legacy field names
- Full-text content support for all entity types

### Changed
- **BREAKING**: Unified field naming across all entity types
  - Replaced `description` field with `content` for Issues and Plans
  - Made `content` field required for Issues and Plans
  - All entity types now consistently use `content` field
- Session content now includes complete markdown body (everything after frontmatter)
- Improved session markdown formatter to handle legacy formats

### Fixed
- Session content parsing to include full markdown content
- SQLite table schema to use `content` instead of `description`
- Search functionality to properly query `content` field

### Migration Guide
- Existing data with `description` fields will be automatically migrated
- Run `npm run rebuild-db` to update database schema and migrate existing data
- No manual intervention required for markdown files

## [0.0.1] - 2025-07-23

### Added
- Initial release of Shirokuma MCP Knowledge Base
- Support for Issues, Plans, Documents, and Knowledge management
- Work session tracking and daily summaries
- Tag-based organization and search
- SQLite-based search index
- MCP (Model Context Protocol) server implementation
- Dual storage: Markdown files + SQLite index

### Features
- Create, read, update, and delete operations for all entity types
- Full-text search across all content
- Tag-based categorization and filtering
- Custom status management for Issues and Plans
- Date-based organization for sessions
- Automatic tag registration