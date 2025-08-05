# Shirokuma Knowledge Base Custom Agents

This directory contains custom agents for Claude Code that are integrated with the shirokuma-knowledge-base system.

## Available Agents

### 1. shirokuma-issue-manager
**Purpose**: Issue management specialist
- Create new issues with duplicate checking
- Manage priorities and statuses
- Automate relationship linking
- Regular organization and archiving

**Example usage**:
```
Please report a new bug. Authentication feature throws an error during login.
```

### 2. shirokuma-daily-reporter [DEPRECATED]
**Purpose**: [DEPRECATED - Dailies type will be removed]
- ~~Aggregate session information~~
- ~~Automatic work time calculation~~
- ~~Highlight achievements~~
- ~~Visualize progress~~

**Note**: The dailies type is being removed. Session information is sufficient for tracking work history.

### 3. shirokuma-knowledge-curator
**Purpose**: Organize and systematize technical knowledge
- Proper classification of knowledge/decisions/features
- Prevent duplication and consolidate
- Tag management and search optimization
- Knowledge relationship linking

**Example usage**:
```
Please record type-safe error handling patterns in TypeScript as knowledge
```

### 4. shirokuma-session-automator [DEPRECATED]
**Purpose**: [DEPRECATED - Use /ai-start and /ai-finish commands directly]
- ~~Streamline /ai-start and /ai-finish processing~~
- ~~Automatic context restoration~~
- ~~Regular progress recording~~
- ~~Error recovery~~

**Note**: This agent's functionality has been moved to the main agent's /ai-start and /ai-finish commands. No longer need to use Task tool to delegate.

### 5. shirokuma-mcp-specialist
**Purpose**: Expert in MCP operations and data management
- Optimize CRUD operations
- Implement advanced search strategies
- Automate relationship management
- Ensure data integrity

**Example usage**:
```
Please organize all open issues by priority and link them with related documents
```

### 6. shirokuma-methodology-keeper
**Purpose**: Guardian of development methodology and best practices
- Ensure adherence to SHIROKUMA principles
- Monitor and guide TDD cycle
- Maintain code quality standards
- Guarantee continuity

**Example usage**:
```
Please verify that current work follows TDD principles
```

## How to Use

### 1. Check Available Agents
```bash
# Display available agents
/agents
```

### 2. Automatic Invocation
Agents are automatically invoked based on the task content. When conditions in the `description` field are met, Claude Code selects the appropriate agent.

### 3. Explicit Invocation
To explicitly use a specific agent:
```
@shirokuma-issue-manager Please create a new feature request as an issue
```

## Customization

### Creating New Agents
1. Create a new `.md` file in this directory
2. Follow this format:

```markdown
---
name: your-agent-name
description: Description of conditions that trigger this agent
tools: Comma-separated list of tools to use
---

Detailed agent instructions here
```

### Tool Specification
- MCP tools: Specify like `mcp__shirokuma-knowledge-base__*`
- Standard tools: `Read, Write, Bash, Grep` etc.
- If omitted: Inherits all tools

## Best Practices

1. **Single Responsibility**: Each agent has one clear role
2. **Least Privilege**: Grant access only to necessary tools
3. **Clear Description**: Be specific as description triggers automatic invocation
4. **Error Handling**: Consider failure scenarios in instructions

## Troubleshooting

### Agent Not Being Invoked
- Verify description is specific enough
- Check tool permissions are appropriate
- Confirm agent is registered with `/agents`

### Errors Occurring
- Verify specified tools exist
- Check MCP server is running
- Look for typos in tool names

## Related Documentation
- [Claude Code Agents Complete Guide](knowledge-14)
- [SHIROKUMA.md](../../../SHIROKUMA.md) - Project management methodology
- [CLAUDE.md](../../../CLAUDE.md) - Project-specific instructions