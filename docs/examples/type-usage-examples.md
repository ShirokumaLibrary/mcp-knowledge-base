# Type Usage Examples

This document provides practical examples of how to use different types in the Shirokuma MCP Knowledge Base.

## Understanding Type Categories

### Task Types (issues, plans)
Used for project management with status and priority tracking.

```bash
# Create an issue (bug report)
create_item(
  type="issues",
  title="Fix login authentication error",
  content="Users report 401 errors when logging in with valid credentials",
  priority="high",
  status="Open",
  tags=["bug", "authentication"]
)

# Create a plan (project planning)
create_item(
  type="plans", 
  title="Q1 2025 Feature Development",
  content="Implement user dashboard and API v2",
  priority="high",
  status="In Progress",
  start_date="2025-01-01",
  end_date="2025-03-31",
  related_tasks=["issues-23", "issues-24"]
)
```

### Document Types (docs, knowledge)
Used for documentation and knowledge base articles.

```bash
# Create technical documentation
create_item(
  type="docs",
  title="API Authentication Guide",
  content="## Overview\nThis guide explains how to authenticate...",
  tags=["api", "authentication", "guide"]
)

# Create knowledge article
create_item(
  type="knowledge",
  title="Best Practices for Error Handling",
  content="## Error Handling Patterns\n1. Always catch specific exceptions...",
  tags=["best-practices", "error-handling"]
)
```

### Special Types

#### Sessions (Work Session Tracking)
Individual work session records with optional content.

```bash
# Create session at start (content optional)
create_item(
  type="sessions",
  title="Implement user authentication",
  category="development",
  tags=["backend", "security"]
)

# Create session with full details
create_item(
  type="sessions",
  title="Debug production issue",
  content="Investigated memory leak in worker process. Found issue in connection pooling...",
  category="debugging",
  related_tasks=["issues-45"]
)

# Import past session with specific datetime
create_item(
  type="sessions",
  title="Team planning meeting",
  content="Discussed Q2 roadmap and priorities",
  datetime="2025-07-29T14:00:00",
  category="meeting"
)
```

#### Dailies (Daily Summaries)
One summary per date with required content.

```bash
# Create daily summary for today
create_item(
  type="dailies",
  date="2025-07-30",
  title="Development Progress",
  content="## Completed\n- Fixed authentication bug\n- Updated API docs\n\n## In Progress\n- User dashboard implementation\n\n## Blockers\n- Waiting for design approval",
  tags=["daily", "development"]
)

# Create daily summary for past date
create_item(
  type="dailies",
  date="2025-07-29",
  title="Sprint Review Day",
  content="## Sprint Achievements\n- Completed 8/10 planned stories\n- Demo went well\n\n## Next Sprint Planning\n- Focus on performance improvements",
  related_tasks=["plans-5"]
)
```

## Common Patterns

### Linking Related Items
```bash
# Create issue linked to documentation
create_item(
  type="issues",
  title="Update authentication docs",
  content="Docs are outdated after API changes",
  status="Open",
  priority="medium",
  related_documents=["docs-12", "knowledge-3"]
)
```

### Using Tags Effectively
```bash
# Consistent tagging for easy retrieval
create_item(
  type="knowledge",
  title="Docker Deployment Guide",
  content="...",
  tags=["deployment", "docker", "devops", "guide"]
)

# Search by tag later
search_items_by_tag(tag="deployment")
```

### Status Workflow
```bash
# Task lifecycle
create_item(type="issues", title="New feature", status="Open", ...)
update_item(type="issues", id=1, status="In Progress")
update_item(type="issues", id=1, status="Review")
update_item(type="issues", id=1, status="Closed")
```

## Type Selection Guide

| Use Case | Recommended Type | Key Fields |
|----------|-----------------|------------|
| Bug reports | issues | priority, status, content |
| Feature requests | issues | priority, status, related_documents |
| Project planning | plans | start_date, end_date, related_tasks |
| API documentation | docs | content (required), tags |
| How-to guides | knowledge | content (required), tags |
| Work logs | sessions | datetime (optional), category |
| Daily reports | dailies | date (required), content (required) |

## Tips

1. **Choose the right type**: Use task types (issues/plans) when you need status tracking. Use document types for reference material.

2. **Sessions vs Dailies**: 
   - Sessions: Multiple per day, tracks individual work periods
   - Dailies: One per day, summarizes the entire day

3. **Required fields**:
   - All types: title
   - Document types: content
   - Task types: status, priority
   - Dailies: date, content

4. **Use related fields**: Link issues to plans, documentation to issues, etc. for better organization.

5. **Consistent tagging**: Develop a tagging convention and stick to it for better searchability.