# MCP Usage Rules

AI Pair Programming with shirokuma-knowledge-base MCP

## Quick Start Commands

```bash
# Session Management
/kuma:start                  # Restore context and begin work
/kuma:finish                 # Save context and handoff

# Issue Management  
/kuma:issue                  # List open issues
/kuma:issue "bug description" # Create new issue
/kuma:issue 103              # Show issue details

# Work Execution
/kuma:go                     # Work on selected issue
/kuma:commit                 # Create git commit
/kuma:tests                  # Generate tests
```

## Project Configuration

Project-specific configurations are stored as MCP steering documents (type: steering):
- **Language Rules** - Chat response language settings
- **Core Configuration** - Project architecture and setup
- **Build Configuration** - Build commands and settings
- **Testing Standards** - Test requirements and coverage
- **Coding Conventions** - Style guides and naming rules

To access: `mcp.list_items({ type: "steering" })`

## Core Principles

### 1. AI Memory is Not Persistent
- All context is lost after session ends
- Continuity depends on externalization to MCP
- Explicit documentation is mandatory

### 2. Immediate Idea Capture
- Record ideas **immediately** when they arise
- Never postpone documentation (risk of forgetting)
- Use MCP as external memory for AI continuity

### 3. Issue-Driven Development
- Always create an issue before code changes
- Every change needs a "why" documented
- No code without corresponding issue

### 4. Session Management
- Start session: Restore context from MCP
- During work: Record decisions immediately
- End session: Save state for next AI

### 5. Knowledge Organization
- Generic knowledge: Use appropriate knowledge types
- Project-specific: Use project-specific types
- Avoid duplication through proper search

### 6. Quality Through Methodology
- **TDD**: Test → Code → Refactor (always in this order)
- **Tidy First**: Separate structural and behavioral changes
- **Document "why"**: Code shows "what", docs explain "why"

## Type Classification

### Common Types (Examples)

| Type | Purpose | Example |
|------|---------|---------|
| **issue** | Bugs, features, improvements | "Fix login authentication bug" |
| **knowledge** | Reusable technical knowledge | "React Hooks best practices" |
| **decision** | Project-specific choices | "Use PostgreSQL for database" |
| **session** | Work session records | "2025-08-16 work session" |
| **pattern** | Code patterns & templates | "API error handling pattern" |
| **task** | Single/standalone task management | "Fix login button bug" |
| **research** | Investigation results | "Performance optimization findings" |
| **standard** | Coding standards & conventions | "TypeScript style guide" |
| **design** | General design documents (non-spec) | "Database schema overview" |
| **handover** | Implementation records and transitions | "TDD implementation for auth module" |
| **feature** | Feature specifications and requirements | "Multi-factor authentication feature" |
| **steering** | Project configuration and settings | "Language rules configuration" |
| **spec** | Complete specifications (all phases) | "User authentication full spec" |
| **spec_requirements** | Spec-driven requirements phase | "OAuth requirements definition" |
| **spec_design** | Spec-driven design phase | "API architecture design" |
| **spec_tasks** | Spec-driven task breakdown | "Feature implementation tasks" |

### Type Usage Guidelines

#### Design Types
- **`design`**: Use for standalone design documents not part of spec-driven development
  - Examples: UI mockups, database diagrams, system architecture docs
- **`spec_design`**: Use only within spec-driven development workflow (`/kuma:spec:design`)
  - Part of the formal spec process: requirements → design → tasks

#### Task Types  
- **`task`**: Use for individual, standalone tasks not part of a larger spec
  - Examples: Bug fixes, small improvements, operational tasks
- **`spec_tasks`**: Use only within spec-driven development workflow (`/kuma:spec:tasks`)
  - Task breakdown from a formal design specification

## Search Strategies

### Keyword Search
```typescript
strategy: 'keywords'
// TF-IDF based keyword matching
// API: search_items, get_related_items
```

### Concept Search
```typescript
strategy: 'concepts'
// High-level category identification
// API: get_related_items with strategy='concepts'
```

### Embedding Search
```typescript
strategy: 'embedding'
// Semantic similarity using vectors
// API: get_related_items with strategy='embedding'
```

### Hybrid Search
```typescript
strategy: 'hybrid',
weights: { keywords: 0.4, embedding: 0.6 }
// Combined approach for best results
// API: get_related_items with weights parameter
```

## Memory Management

### Retrieving Memory (Remember)
1. **Before starting new work** - Search for existing implementations
2. **When lacking context** - Map relationships between items
3. **Before creating items** - Check for duplicates

### Storing Memory (Record)
1. **Automatic relationship detection** - Via tags, content, temporal proximity
2. **Data integrity** - Required fields, bidirectional relations
3. **Efficient organization** - Proper tagging and type classification

## MCP Instance Management

### Instance Selection
- **Production**: Real project data, persistent storage
- **Development**: Testing and debugging, temporary data
- **Test**: Automated testing, ephemeral data

### Data Isolation
- Never mix production and test data
- Use separate databases for each environment
- Clear instance naming conventions

## Best Practices

### 1. Type Field Format
- Use lowercase letters, numbers, underscores only (a-z, 0-9, _)
- Use singular form, not plural (e.g., `session` not `sessions`)
- Examples: `issue`, `feature`, `session`, `design`
- Validate before creation using `validateType()` function

### 2. Status Field Usage
- **Active Statuses** (work in progress): Open, Specification, Waiting, Ready, In Progress, Review, Testing, Pending
- **Terminal Statuses** (is_closable=true): Completed, Closed, Canceled, Rejected
- **Default**: "Open" for new items
- **Typical Flow**: Open → Ready → In Progress → Review → Testing → Completed
- See `.shirokuma/docs/status-guide.md` for detailed status explanations

### 3. Relationship Management
- Manual relations: Explicitly defined via `related` field or `add_relations`
- Dynamic similarity: Computed at runtime via `get_related_items`
- Relations are simple ID arrays for easy import/export
- Use tags for categorical grouping

### 4. Content Quality
- Write for AI consumption (clear, structured)
- Include context and rationale
- Use markdown for formatting

### 5. Search Before Create
- Always search for existing items
- Check multiple search strategies
- Prevent duplication

## Workflow Integration

### Development Workflow
1. Search for related issues/knowledge
2. Create issue if none exists
3. Record decisions during implementation
4. Update relationships after completion

### Knowledge Management
1. Capture learnings immediately
2. Generalize for reusability
3. Link to specific implementations
4. Tag appropriately for discovery

### Session Continuity
1. Start: Load context from current state
2. Work: Update state regularly
3. End: Save comprehensive handoff notes
4. Next: New AI can continue seamlessly

## Anti-Patterns to Avoid

1. **Delayed Recording** - Information loss risk
2. **Duplicate Items** - Search first, create second
3. **Orphaned Items** - Always create relationships
4. **Vague Descriptions** - Be specific and contextual
5. **Wrong Type Selection** - Understand type purposes
6. **Missing Tags** - Reduces discoverability
7. **Ignoring Relationships** - Breaks knowledge graph

## MCP API Reference

### Basic CRUD Operations
- **create_item** - Create new item with AI enrichment
- **get_item** - Retrieve single item by ID
- **update_item** - Update existing item
- **delete_item** - Remove item from database
- **list_items** - List items with filtering/sorting

### Search and Discovery
- **search_items** - Advanced search with AND/OR, date ranges, filters
- **get_related_items** - Get related items with multiple strategies (keywords, concepts, embeddings)

### Relationship Management
- **add_relations** - Create bidirectional relationships manually
- **get_related_items** - Find related items dynamically (manual relations + computed similarity)

### System State
- **get_current_state** - Retrieve current system state
- **update_current_state** - Update system state
- **get_stats** - Get system statistics
- **get_tags** - Get all tags with usage counts

## API Usage Examples

### Creating an Issue
```typescript
create_item({
  type: "issue",
  title: "Fix authentication bug",
  description: "Users cannot login with valid credentials",
  status: "Open",  // Available: Open, Specification, Waiting, Ready, In Progress, Review, Testing, Pending, Completed, Closed, Canceled, Rejected
  priority: "HIGH",
  tags: ["bug", "authentication", "critical"],
  related: [45, 46]  // Optional: manually relate to other items
})
```

### Searching for Knowledge
```typescript
search_items({
  query: "React hooks optimization",
  types: ["knowledge", "pattern"],
  limit: 10
})
```

### Finding Related Items
```typescript
get_related_items({
  id: 123,
  strategy: "hybrid",
  weights: { keywords: 0.3, embedding: 0.7 },
  depth: 2
})
```

### Updating System State
```typescript
update_current_state({
  content: "Working on authentication module refactoring",
  tags: ["session", "authentication", "refactoring"],
  metadata: { updatedBy: "ai-session-2025-08-16" }
})
```

## Specialist Agents

For specialized tasks, use these expert agents:
- **MCP Operations** → `shirokuma-mcp-specialist`
- **Development Methodology** → `shirokuma-methodology-keeper`
- **Issue Management** → `shirokuma-issue-manager`
- **Knowledge Organization** → `shirokuma-knowledge-curator`
- **Code Review** → `shirokuma-reviewer`
- **Technical Research** → `shirokuma-researcher`

## Remember

- **You are stateless** - Next session's AI remembers nothing
- **Issues drive work** - Create before coding
- **Test first** - Red → Green → Refactor
- **Document immediately** - Thoughts are fleeting
- **Use specialists** - Each agent has deep expertise
- **Verify externally** - Technical decisions need validation