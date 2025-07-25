# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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