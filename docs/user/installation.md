# Installation Guide

This guide explains how to install and configure Shirokuma MCP Knowledge Base.

## System Requirements

- **Node.js**: 18.0.0 or higher
- **npm**: 8.0.0 or higher
- **OS**: Windows, macOS, Linux
- **Disk Space**: Minimum 100MB (additional space required for data storage)

## Installation Methods

### Method 1: Clone from GitHub (Recommended)

```bash
# Clone the repository
git clone https://github.com/your-repo/shirokuma-mcp-knowledge-base.git
cd shirokuma-mcp-knowledge-base

# Install dependencies
npm install

# Build
npm run build
```

### Method 2: Install as npm Package (Future Plan)

```bash
npm install -g shirokuma-mcp-knowledge-base
```

## Configuration

### 1. Environment Variables (Optional)

By default, data is stored in the `.shirokuma/data` directory, but this can be customized:

```bash
# Specify data directory
export MCP_DATABASE_PATH=/path/to/your/data

# Specify SQLite file location
export MCP_SQLITE_PATH=/path/to/your/search.db
```

### 2. MCP Client Configuration

#### For Claude Desktop

Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "shirokuma": {
      "command": "node",
      "args": ["/absolute/path/to/shirokuma-mcp-knowledge-base/dist/server.js"]
    }
  }
}
```

#### For Other MCP Clients

Follow your client's documentation to configure the following command:

```bash
node /path/to/shirokuma-mcp-knowledge-base/dist/server.js
```

## Initial Setup

### 1. Database Initialization

Created automatically on first run, but to initialize manually:

```bash
npm run rebuild-db
```

### 2. Verify Connection

Use the MCP inspector to verify the connection:

```bash
npm run inspect
```

### 3. Run Tests

Verify that the installation completed correctly:

```bash
# Unit tests
npm test

# All tests
npm run test:all
```

## Upgrade

### Upgrading an Existing Installation

```bash
# Get the latest version
git pull origin main

# Update dependencies
npm install

# Build
npm run build

# Rebuild database (if necessary)
npm run rebuild-db
```

### Version Migration

If data migration is required between specific versions, see the [Upgrade Guide](../releases/upgrades/).

## Troubleshooting

### Build Errors

```bash
# Clean up node_modules
rm -rf node_modules
npm install
npm run build
```

### Permission Errors

```bash
# Grant execution permissions
chmod +x dist/server.js
```

### Database Errors

```bash
# Rebuild the database
npm run rebuild-db
```

## Next Steps

- [Quick Start](quickstart.md) - Get started quickly
- [Usage Guide](usage.md) - Detailed usage instructions
- [API Reference](api-reference.md) - Complete API specification