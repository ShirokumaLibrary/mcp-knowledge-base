## MCP Type and Tag Usage Rules

### Main Agent Definition

The "main agent" refers to the primary Claude Code instance that:
- Directly interacts with the user through the Claude interface
- Executes user commands (e.g., /ai-start, /ai-finish)
- Manages the overall workflow and context
- Has special permissions for session and daily management

**Important**: When specialist agents (programmer, tester, etc.) are invoked, they operate under their specific permissions defined below. Only the main Claude Code instance has main agent permissions.

### Available Types

#### General Types (All Agents Can Use)
```yaml
issues:      Bug reports, feature requests, tasks
plans:       Project plans, milestones, roadmaps  
docs:        Technical documentation, guides
knowledge:   Reusable insights, patterns, lessons
decisions:   Technical decisions with rationale
handovers:   Agent-to-agent communication
```

#### Restricted Types
```yaml
test_results: Test execution results (tester agent only)
sessions:     Work session records (main agent only - see definition above)
```

### Agent-Specific Permissions

#### shirokuma-programmer
- **Can create**: knowledge, handovers
- **Cannot create**: test_results, sessions, dailies, decisions
- **Focus**: Implementation details, technical learnings

#### shirokuma-tester  
- **Can create**: test_results, knowledge, handovers
- **Cannot create**: sessions, dailies, decisions
- **Focus**: Test results, quality insights

#### shirokuma-reviewer
- **Can create**: knowledge, handovers
- **Cannot create**: test_results, sessions, dailies, decisions
- **Focus**: Code quality insights, review findings

#### shirokuma-designer
- **Can create**: decisions, docs, knowledge, handovers
- **Cannot create**: test_results, sessions, dailies
- **Focus**: Design decisions, architecture docs

#### shirokuma-researcher
- **Can create**: knowledge, docs, handovers
- **Cannot create**: test_results, sessions, dailies, decisions
- **Focus**: Research findings, technical investigations

#### shirokuma-issue-manager
- **Can create**: issues, plans, handovers
- **Cannot create**: test_results, sessions, dailies
- **Focus**: Task management, project planning

### Type Usage Guidelines

#### During Work (Temporary Records)
**sessions** - Working memory, cleared after completion
- Discussion process and iterations
- Rejected ideas and dead ends  
- Temporary notes and drafts
- Implementation attempts

#### After Decisions (Permanent Records)
**decisions** - Final architectural choices
- What was decided (not the discussion)
- Rationale for the choice
- Implementation implications

**knowledge** - Reusable patterns
- Must be generic and reusable
- No project-specific details
- Clear usage examples

**issues** - New problems found
- Specific, actionable items
- Clear acceptance criteria

#### Anti-patterns to Avoid
❌ Creating knowledge for every discussion
❌ Recording process in permanent types
❌ Duplicating session content in knowledge
❌ Creating decisions before consensus

#### Cleanup Trigger
When sessions contain decisions:
1. Extract decision → create decisions item
2. Extract patterns → create knowledge item  
3. Keep session as historical record

### Tag Usage Rules

#### Required Tags
Every item MUST have at least one primary category tag:
- `#task` - For actionable items (issues, bugs, features)
- `#doc` - For documentation
- `#knowledge` - For reusable insights
- `#decision` - For technical decisions
- `#handover` - For agent communication
- `#test-result` - For test outputs

#### Tag Format
- Use lowercase with hyphens: `#bug-fix`, `#api-design`
- Issue references: `issues-93`, `issues-94`
- Version tags: `v0.7.9`, `v0.8.0`
- Feature areas: `auth`, `payment`, `ui`

### Example Usage

#### Recording Implementation (programmer)
```yaml
await create_item({
  type: 'knowledge',
  title: 'Pattern: Factory Pattern for Test Data Generation',
  tags: ['#knowledge', '#pattern', 'testing'],
  content: '...',
  related: ['issues-89']
})
```

#### Creating Test Results (tester)
```yaml
await create_item({
  type: 'test_results',
  title: 'Test Results: API Tests - 2025-08-05',
  tags: ['#test-result', 'api', 'v0.7.9'],
  content: '# Summary\n- Total: 50\n- Passed: 48\n- Failed: 2',
  related: ['issues-93']
})
```

#### Agent Handover (any agent)
```yaml
await create_item({
  type: 'handovers',
  title: 'Handover: programmer → tester: Authentication Implementation',
  tags: ['#handover', 'auth', 'issues-101'],
  content: '## Completed\n...\n## Test Points\n...',
  status: 'Open'
})
```

### Important Rules

1. **Always search before creating** to avoid duplicates
2. **Use specific types** - don't put test results in knowledge
3. **Link related items** using the `related` field
4. **Close handovers** when the receiving agent completes work
5. **Tag consistently** - check existing tags before creating new ones