# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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