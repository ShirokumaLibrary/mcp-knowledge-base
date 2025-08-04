# Quick Start Guide

> Last Updated: 2025-08-03 (v0.7.8)

Get started with Shirokuma MCP Knowledge Base in 5 minutes.

## Prerequisites

- Node.js 18 or higher
- npm (comes with Node.js)
- Claude Desktop or other MCP-compatible client

## Installation

### Option 1: Global Installation (Recommended)

```bash
# Install globally
sudo npm install -g @shirokuma-library/mcp-knowledge-base

# Verify installation
shirokuma-mcp-knowledge-base --help
```

### Option 2: Local Installation

```bash
# Clone repository
git clone https://github.com/ShirokumaLibrary/mcp-knowledge-base.git
cd mcp-knowledge-base

# Install and build
npm install
npm run build
```

## Configuration

### For Global Installation

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "shirokuma-knowledge-base": {
      "command": "shirokuma-mcp-knowledge-base",
      "args": ["--data", ".database"]
    }
  }
}
```

### For Local Installation

```json
{
  "mcpServers": {
    "shirokuma-knowledge-base": {
      "command": "node",
      "args": ["/path/to/mcp-knowledge-base/dist/index.js"]
    }
  }
}
```

## Basic Usage

### 1. Create Your First Issue

In Claude, ask to create an issue:

"Create an issue titled 'Set up authentication' with high priority"

Or use the tool directly:
- Tool: `create_item`
- Parameters:
  - type: "issues"
  - title: "Set up authentication"
  - content: "Implement OAuth2 authentication"
  - status: "Open"
  - priority: "high"
  - tags: ["auth", "feature"]

### 2. Search for Items

Search by tag:
- Tool: `search_items_by_tag`
- Parameters:
  - tag: "auth"

Full-text search:
- Tool: `search_items`
- Parameters:
  - query: "authentication"

### 3. Record a Work Session

- Tool: `create_item`
- Parameters:
  - type: "sessions"
  - title: "Working on authentication"
  - content: "Started OAuth2 implementation"
  - category: "development"

## Key Features to Explore

### Semantic Code Search

1. Index your codebase:
   - Tool: `index_codebase`

2. Search with natural language:
   - Tool: `search_code`
   - query: "authentication middleware"

### Daily Summaries

Track daily progress:
- Tool: `create_item`
- type: "dailies"
- date: "2025-08-03"
- title: "Completed authentication module"

### Custom Types

Create types for your workflow:
- Tool: `create_type`
- name: "decisions"
- base_type: "documents"
- description: "Architecture decision records"

## Troubleshooting

### Database Issues

Rebuild the database:
```bash
# Global installation
shirokuma-mcp-knowledge-base-rebuild

# Local installation
npm run rebuild-db
```

### Custom Data Location

Set environment variable:
```bash
export DATABASE_ROOT="/path/to/your/data"
```

### Common Issues

- **"Database locked"**: Another process is using the database
- **"Table not found"**: Run the rebuild command
- **"Permission denied"**: Check file permissions on data directory

## Next Steps

- [Usage Guide](usage.md) - Detailed examples
- [API Reference](api-reference.md) - Complete tool reference
- [FAQ](faq.md) - Common questions