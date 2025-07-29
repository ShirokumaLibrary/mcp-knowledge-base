# Quick Start Guide

This guide explains how to quickly get started with Shirokuma MCP Knowledge Base.

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- MCP-compatible client (Claude Desktop, etc.)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-repo/shirokuma-mcp-knowledge-base.git
cd shirokuma-mcp-knowledge-base
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build

```bash
npm run build
```

### 4. MCP Configuration

Add the following to your MCP client configuration file (e.g., `claude_desktop_config.json` for Claude Desktop):

```json
{
  "mcpServers": {
    "shirokuma": {
      "command": "node",
      "args": ["/path/to/shirokuma-mcp-knowledge-base/dist/server.js"]
    }
  }
}
```

## Basic Usage

### 1. Create Your First Issue

```typescript
// MCP tool invocation
create_item({
  type: "issues",
  title: "First Issue",
  content: "This is my first issue",
  tags: ["bug", "high-priority"]
})
```

### 2. Search for Items

```typescript
// Search by tag
search_items_by_tag({
  tag: "bug"
})

// Full-text search
search_items({
  query: "first"
})
```

### 3. Record a Session

```typescript
// Start a work session
create_item({
  type: "sessions",
  title: "Development Work",
  content: "Started implementing new feature"
})
```

## Next Steps

- [Usage Guide](usage.md) - More detailed usage instructions
- [API Reference](api-reference.md) - Complete API specification
- [FAQ](faq.md) - Frequently asked questions

## Troubleshooting

### If you encounter database errors

```bash
npm run rebuild-db
```

### If files are not found

Specify the data directory with an environment variable:

```bash
export MCP_DATABASE_PATH=/path/to/your/data
```

For more details, see the [FAQ](faq.md).