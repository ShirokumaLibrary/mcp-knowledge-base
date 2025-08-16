# @shirokuma-library/mcp-knowledge-base

MCP (Model Context Protocol) server for AI-powered knowledge management with semantic search, graph analysis, and automatic enrichment.

> ⚠️ **UNDER ACTIVE DEVELOPMENT**: This package is currently in active development (v0.8.x). APIs, database schema, and features may change significantly between versions. Please pin your dependency to a specific version in production use.

## Features

- 🤖 **AI-Powered Enrichment**: Automatic summary generation, keyword extraction, and semantic embeddings
- 🔍 **Advanced Search**: Multiple search strategies including keywords, concepts, and semantic similarity
- 🔗 **Graph Analysis**: Relationship management and graph-based knowledge discovery
- 📊 **Type System**: Flexible item types for issues, knowledge, decisions, sessions, and more
- 🎯 **Priority Management**: 5-level priority system from CRITICAL to MINIMAL
- 🏷️ **Smart Tagging**: Automatic and manual tagging with tag-based discovery
- 💾 **SQLite Database**: Local-first approach with Prisma ORM
- 🚀 **MCP Integration**: Seamless integration with Claude Desktop and other MCP clients

## Installation

```bash
# Install globally (recommended for CLI usage)
npm install -g @shirokuma-library/mcp-knowledge-base

# Or pin to specific version for stability
npm install -g @shirokuma-library/mcp-knowledge-base@0.8.0
```

## Quick Start

### 1. Configure Environment

Create a `.env` file with absolute paths:

```bash
# Option 1: Generate automatically with correct paths
shirokuma-kb config export > .env

# Option 2: Copy from example and edit
cp .env.example .env
# Edit .env and update paths to use ABSOLUTE PATHS
```

**⚠️ IMPORTANT**: Always use absolute paths in `.env` file. Relative paths will cause issues with Prisma migrations.

### 2. Initialize Database

```bash
shirokuma-kb migrate
```

### 3. Start MCP Server

```bash
shirokuma-kb serve
```

### 4. Configure Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "shirokuma-kb": {
      "command": "shirokuma-kb",
      "args": ["serve"]
    }
  }
}
```

## CLI Usage

### Item Management

```bash
# Create new item
shirokuma-kb create -t issue -T "Bug in authentication" -d "Users cannot login"

# List items
shirokuma-kb list --type issue --status Open

# Get specific item
shirokuma-kb get 123

# Update item
shirokuma-kb update 123 --status "In Progress" --priority HIGH

# Delete item
shirokuma-kb delete 123
```

### Search and Discovery

```bash
# Search items
shirokuma-kb search "authentication bug"

# Find related items
shirokuma-kb related 123 --strategy hybrid
```

### Configuration

```bash
# Show configuration
shirokuma-kb config

# Set database path
shirokuma-kb config set DATABASE_URL "file:./my-database.db"

# Export configuration
shirokuma-kb config export > .env
```

### Export and Import

```bash
# Export items to Markdown
shirokuma-kb export --type issue --output ./exports

# Export with date range
shirokuma-kb export --from 2025-01-01 --to 2025-01-31
```

## MCP Tools

When using with Claude or other MCP clients, the following tools are available:

### Basic CRUD
- `create_item` - Create item with AI enrichment
- `get_item` - Retrieve item by ID
- `update_item` - Update existing item
- `delete_item` - Delete item

### Search
- `search_items` - Advanced search with filters
- `list_items` - List with filtering and sorting
- `get_related_items` - Find related items using multiple strategies

### System
- `get_current_state` - Get current system state
- `update_current_state` - Update system state
- `get_stats` - Get statistics
- `get_tags` - List all tags

## Item Types

| Type | Purpose | Example |
|------|---------|---------|
| **issue** | Bugs, features, improvements | "Fix login authentication bug" |
| **knowledge** | Reusable technical knowledge | "React Hooks best practices" |
| **decision** | Project-specific choices | "Use PostgreSQL for database" |
| **session** | Work session records | "2025-01-13 work session" |
| **pattern** | Code patterns & templates | "API error handling pattern" |

## Environment Variables

```bash
# Database location (default: ~/.shirokuma/data/shirokuma.db)
SHIROKUMA_DATABASE_URL=file:./path/to/database.db

# AI timeout in milliseconds (default: 3000)
SHIROKUMA_AI_TIMEOUT=5000

# Export directory (default: ./exports)
SHIROKUMA_EXPORT_DIR=./my-exports
```

## Development

### Setup

```bash
# Clone repository
git clone https://github.com/ShirokumaLibrary/mcp-knowledge-base.git
cd mcp-knowledge-base

# Install dependencies
npm install

# Run migrations
npm run migrate

# Start development server
npm run dev
```

### Testing

```bash
# Run tests
npm test

# Coverage report
npm run test:coverage

# Watch mode
npm run test:watch
```

### Building

```bash
# Build for production
npm run build:prod

# Type checking
npm run type-check

# Linting
npm run lint
```

## Architecture

- **TypeScript** with ES2022 modules
- **Prisma ORM** with SQLite database
- **MCP SDK** for protocol implementation
- **Commander.js** for CLI
- **Zod** for validation
- **Vitest** for testing

## Version History

- **v0.8.x** - Current development version
  - Core functionality implementation
  - MCP protocol support
  - CLI tools
  - Basic AI enrichment
  
- **v0.9.x** - (Planned) API stabilization
- **v1.0.0** - (Planned) Production release

## License

MIT

## Roadmap

- [ ] v0.9.0: Stabilize APIs and database schema
- [ ] v1.0.0: Production-ready release with stable APIs
- [ ] Import/Export functionality improvements
- [ ] Enhanced AI capabilities
- [ ] Multi-database support
- [ ] Web UI for management

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

**Note**: As the project is under active development, please open an issue first to discuss major changes.

## Support

- [GitHub Issues](https://github.com/ShirokumaLibrary/mcp-knowledge-base/issues)
- [Documentation](https://github.com/ShirokumaLibrary/mcp-knowledge-base#readme)