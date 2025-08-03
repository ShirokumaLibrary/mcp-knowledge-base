# Test Environment Setup Guide

This guide explains how to set up and use the test environment for shirokuma-knowledge-base v2.

## Overview

The test environment provides an isolated instance of shirokuma-knowledge-base that:
- Uses a separate test database
- Has its own test data directory
- Runs independently from the production instance
- Includes sample data for testing

## Quick Setup

1. **Run the setup script:**
   ```bash
   npm run test:setup
   ```

   This will:
   - Create test directories
   - Build the project
   - Initialize the test database
   - Create sample test data
   - Update MCP configuration

2. **Start the test server:**
   ```bash
   npm run test:server
   ```

## Configuration

### Environment Variables

The test environment uses these environment variables:
- `NODE_ENV=test`
- `DATABASE_PATH=/home/webapp/mcp/.test-database/test.db`
- `MARKDOWN_DIR=/home/webapp/mcp/.shirokuma/test-data`
- `LOG_LEVEL=debug`

### File Locations

- **Test Database**: `/home/webapp/mcp/.test-database/test.db`
- **Test Data**: `/home/webapp/mcp/.shirokuma/test-data/`
- **Config File**: `/home/webapp/mcp/test-env-config.yaml`
- **Environment File**: `/home/webapp/mcp/.env.test`

### MCP Configuration

The test instance is configured in `.mcp.json` as:
```json
{
  "test-knowledge-base": {
    "command": "node",
    "args": ["/home/webapp/mcp/dist/index.js"],
    "cwd": "/home/webapp/mcp",
    "env": {
      "NODE_ENV": "test",
      "DATABASE_PATH": "/home/webapp/mcp/.test-database/test.db",
      "MARKDOWN_DIR": "/home/webapp/mcp/.shirokuma/test-data",
      "LOG_LEVEL": "debug"
    }
  }
}
```

## Sample Data

The test environment includes sample data:

1. **Test Issue**:
   - ID: `issues-1`
   - Title: "Test Issue: Setup CI/CD Pipeline"
   - Status: Open
   - Priority: high
   - Tags: test, ci-cd

2. **Test Documentation**:
   - ID: `docs-1`
   - Title: "Test Environment Setup Guide"
   - Tags: test, documentation

## Usage

### In Claude or MCP Client

1. Restart your MCP client after setup
2. Select the `test-knowledge-base` instance
3. You can now interact with the test environment

### Available Commands

All standard MCP commands work with the test instance:
- `get_types` - List available types
- `get_items` - Retrieve items
- `create_item` - Create new items
- `search_items` - Search functionality
- etc.

### Testing Scenarios

1. **Create a new issue:**
   ```
   create_item({
     type: "issues",
     title: "Test Issue 2",
     status: "Open",
     priority: "medium",
     tags: ["test", "new"]
   })
   ```

2. **Search for items:**
   ```
   search_items({
     query: "test"
   })
   ```

3. **Update existing item:**
   ```
   update_item({
     type: "issues",
     id: 1,
     status: "In Progress"
   })
   ```

## Cleanup

To reset the test environment:
```bash
rm -rf /home/webapp/mcp/.test-database
rm -rf /home/webapp/mcp/.shirokuma/test-data
npm run test:setup
```

## Troubleshooting

### Test server won't start
- Check if the production server is already running
- Ensure the test database directory exists
- Check file permissions

### Database errors
- Delete the test database and run setup again
- Check for file locking issues

### MCP client doesn't show test instance
- Restart the MCP client
- Check `.mcp.json` configuration
- Ensure the path is correct

## Development Tips

1. **Isolated Testing**: Use the test environment for trying new features without affecting production data

2. **Automated Tests**: The test environment is used by E2E tests:
   ```bash
   npm run test:e2e
   ```

3. **Debug Mode**: The test environment runs with `LOG_LEVEL=debug` for detailed logging

4. **Custom Test Data**: Add your own test markdown files to `.shirokuma/test-data/`

## Notes

- The test database uses the same schema (v2) as production
- Test data is not synced with markdown files by default
- The test instance name is `test-knowledge-base`
- All data in the test environment is ephemeral and can be reset anytime