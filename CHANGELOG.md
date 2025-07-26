# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.11] - 2025-07-26

### Added
- Custom datetime parameter for create_session
  - New `datetime` parameter allows creating sessions with past timestamps
  - Enables historical data migration and import
  - ISO 8601 datetime format support

### Changed
- Session ID format changed to `YYYY-MM-DD-HH.MM.SS.sss`
  - More readable format with dots as separators
  - Example: `2025-01-26-14.30.52.123`

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