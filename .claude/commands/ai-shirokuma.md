---
allowed-tools: mcp__shirokuma-knowledge-base__*, Task, Read, Write, MultiEdit, Bash(ls:*), Grep, Glob, WebFetch, WebSearch
description: Advanced task management and rule adjustment integrating shirokuma-knowledge-base with Agents - Multi-Agent Orchestration Platform
argument-hint: "<task-description or adjustment-type>"
---

# ai-shirokuma - Advanced Multi-Agent Orchestration & Task Management

## Usage
```
/ai-shirokuma <task-description or adjustment-type>
```

Examples:
- `/ai-shirokuma Report new bug: authentication error` - Bug report with agent
- `/ai-shirokuma Summarize today's work` - Daily summary with agent
- `/ai-shirokuma Learned about TypeScript type safety` - Knowledge curation
- `/ai-shirokuma Plan complex refactoring` - Multi-agent coordination
- `/ai-shirokuma Implement new feature with SPARC flow` - SPARC methodology
- `/ai-shirokuma adjust-rules` - Rule consistency check

## Context
- Available Agents: shirokuma-mcp-specialist, shirokuma-methodology-keeper, shirokuma-issue-manager, shirokuma-daily-reporter, shirokuma-knowledge-curator, shirokuma-session-automator
- MCP Integration: Full access to shirokuma-knowledge-base tools
- Agent Execution: Parallel processing up to 10 agents (10x engineer pattern)
- Methodology: SPARC (Specification, Pseudocode, Architecture, Refinement, Completion)

## Task

Note: Respond to the user in their language.

Analyze the request: $ARGUMENTS

### A. Advanced Task Management with Multi-Agent Orchestration

If the request involves tasks, issues, knowledge, or daily work:

#### 1. Task Analysis & Agent Selection

Analyze task complexity and select appropriate agents:

| Agent | Purpose | Key Capabilities | Best For |
|-------|---------|------------------|----------|
| **shirokuma-mcp-specialist** | MCP Operations Expert | • CRUD optimization<br>• Advanced search<br>• Bulk operations<br>• Data integrity | Complex queries, performance optimization, data management |
| **shirokuma-methodology-keeper** | Methodology Guardian | • TDD enforcement<br>• Quality standards<br>• Best practices<br>• Continuity assurance | Code reviews, methodology compliance, quality control |
| **shirokuma-issue-manager** | Issue Management Specialist | • Duplicate checking<br>• Automatic priority assessment<br>• Related issue/doc linking<br>• Tag management | Bug reports, feature requests, task decomposition |
| **shirokuma-daily-reporter** | Daily Report Specialist | • Session aggregation<br>• Work time calculation<br>• Achievement highlighting<br>• Progress visualization | Daily reports, weekly summaries, achievement reporting |
| **shirokuma-knowledge-curator** | Knowledge Management Specialist | • Knowledge/decisions classification<br>• Duplicate prevention<br>• Tag consistency<br>• Relationship building | Learning records, best practices, technical documentation |
| **shirokuma-session-automator** | Session Automation | • State restoration<br>• Regular recording<br>• Error recovery<br>• Automatic linking | Session management, context preservation |

#### 2. Advanced Execution Strategies

**Strategy 1: Single Agent (Simple Tasks)**
```
[Analyzing]: Analyzing task...
[Agent Selection]: {agent-name}
[Executing]: {specific action}
[Completed]: {summary with references}
```

**Strategy 2: Sequential Flow (Dependent Tasks)**
```javascript
// Example: Bug → Fix → Document → Report
const workflow = [
  { agent: 'shirokuma-issue-manager', task: 'Create bug issue' },
  { agent: 'shirokuma-knowledge-curator', task: 'Document fix' },
  { agent: 'shirokuma-daily-reporter', task: 'Update daily' }
];
await executeSequentially(workflow);
```

**Strategy 3: Parallel Clusters (Complex Tasks)**
```javascript
// 10x Engineer Pattern: Manage up to 10 agents in parallel
const clusters = [
  // Frontend Cluster
  { agents: ['ui-designer', 'css-specialist'], tasks: ['UI implementation'] },
  // Backend Cluster  
  { agents: ['api-architect', 'db-optimizer'], tasks: ['API design'] },
  // Quality Cluster
  { agents: ['code-reviewer', 'test-engineer'], tasks: ['Quality assurance'] }
];
await executeParallelClusters(clusters);
```

**Strategy 4: SPARC Methodology (New Features)**
```
1. Specification: Define clear requirements with issue-manager
2. Pseudocode: Create high-level design with knowledge-curator
3. Architecture: Document technical decisions
4. Refinement: Iterate with code review agents
5. Completion: Update docs and create release notes
```

#### 3. Advanced Patterns

**Memory Bank Pattern**
Share knowledge across agent sessions:
```javascript
// Central knowledge repository
const memoryBank = {
  context: getCurrentState(),
  decisions: getRecentDecisions(),
  patterns: getEstablishedPatterns()
};

// Each agent gets relevant memory
agents.forEach(agent => {
  agent.context = filterRelevantMemory(memoryBank, agent.type);
});
```

**Visual Development Pattern**
For UI/UX tasks:
```
1. Receive design mockup (screenshot/image)
2. Agent analyzes visual requirements
3. Generate implementation code
4. Take screenshot of result
5. Iterate 2-3 times for optimal quality
```

**Test-Driven Development (TDD) Pattern**
```
1. Write failing tests first
2. Implement minimal code to pass
3. Refactor with confidence
4. Document patterns learned
```

**Iterative Improvement Pattern**
Quality improves with 2-3 iterations:
```
Iteration 1: Basic implementation (70% quality)
Iteration 2: Refinements and optimizations (85% quality)
Iteration 3: Polish and edge cases (95% quality)
```

#### 4. Agent Coordination Techniques

**Technique 1: Context Inheritance**
```javascript
// Parent context flows to children
const parentContext = {
  projectGoals: '...',
  constraints: '...',
  previousDecisions: '...'
};
childAgents.inherit(parentContext);
```

**Technique 2: Result Aggregation**
```javascript
// Combine results from multiple agents
const results = await Promise.all(agentTasks);
const aggregated = mergeResults(results, {
  deduplication: true,
  conflictResolution: 'priority-based'
});
```

**Technique 3: Feedback Loops**
```javascript
// Agents learn from each other
const review = await codeReviewer.analyze(implementation);
await implementer.applyFeedback(review);
await documenter.updateDocs(changes);
```

### B. Rule Adjustment with Agent Integration

If the request involves methodology or rule adjustments:

#### 1. Comprehensive Analysis
Analyze all methodology files and agent configurations:
- Core Files: SHIROKUMA.md, ai-start.md, ai-finish.md
- Agent Files: All .claude/agents/*.md files
- Command Files: Relevant .claude/commands/*.md files
- Integration Points: MCP configurations, tool permissions

#### 2. Multi-Dimensional Validation
```
✓ Workflow Alignment - All files follow consistent patterns
✓ Agent Integration - Agents properly connected to workflows  
✓ Tool Permissions - Appropriate access levels
✓ Error Handling - Consistent strategies across agents
✓ Performance - Optimal agent selection and parallelization
```

#### 3. Intelligent Updates
Apply updates considering:
- Agent dependencies
- Workflow impacts
- Team collaboration needs
- Performance implications

### Advanced Examples

**Example 1: Full-Stack Feature Development**
```
/ai-shirokuma Implement user profile feature with avatar upload
```
Orchestrates:
- issue-manager: Creates epic with subtasks
- Multiple specialized agents: Frontend, backend, database
- knowledge-curator: Documents API and patterns
- daily-reporter: Tracks progress

**Example 2: Production Bug Fix**
```
/ai-shirokuma CRITICAL: Payment processing failing in production
```
Executes:
- Immediate issue creation (P0 priority)
- Parallel investigation agents
- Fix implementation with TDD
- Documentation and post-mortem

**Example 3: Architecture Decision**
```
/ai-shirokuma Evaluate switching from REST to GraphQL
```
Coordinates:
- Research agents gather pros/cons
- Architecture agents design migration
- knowledge-curator documents decision
- issue-manager creates implementation plan

### Output Formats

**For Multi-Agent Tasks:**
```
[Task Analysis]: {complexity assessment}
[Execution Strategy]: {selected strategy: single/sequential/parallel/SPARC}
[Agent Assignment]: 
  - Cluster 1: {agents} → {tasks}
  - Cluster 2: {agents} → {tasks}
[Execution Progress]: 
  - ✓ Agent 1: Completed {result}
  - ⟳ Agent 2: Processing {status}
  - ⧖ Agent 3: Queued
[Integrated Results]:
  - Created: issues-XX, knowledge-YY, decisions-ZZ
  - Updated: daily-2025-08-02, current_state
  - Insights: {key learnings}
  - Next Actions: {prioritized list}
```

**For Rule Adjustments:**
```
## 🛠️ SHIROKUMA Rule & Agent Configuration Update

### Analysis Summary
- Files Analyzed: {count}
- Issues Found: {count}
- Agents Affected: {list}

### Improvements Applied
1. {change} → Impact: {affected workflows}
2. {change} → Benefit: {efficiency gain}

### Validation Results
✓ All agents aligned with methodology
✓ Workflows optimized for parallel execution
✓ No conflicts in tool permissions

### Performance Metrics
- Before: {baseline}
- After: {improved}
- Gain: {percentage}

Recorded: decisions-XX
```

### Best Practices & Pro Tips

#### 1. **10x Engineer Pattern**
- Start with 2-3 agents, scale up to 10
- Group agents by domain (frontend/backend/infra)
- Use result aggregation for coherent output

#### 2. **Context Management**
- Keep parent context minimal but complete
- Use memory bank for cross-session knowledge
- Implement feedback loops for quality

#### 3. **Performance Optimization**
- Parallel by default, sequential when dependent
- Cache common queries and patterns
- Limit context to relevant information
- Use appropriate tools (Grep > Bash for search)

#### 4. **Team Collaboration**
- Share successful agent configurations
- Document agent specializations
- Version control agent definitions
- Create team-specific agent libraries

#### 5. **Security Considerations**
- Validate MCP server sources
- Limit agent permissions appropriately
- Audit agent actions regularly
- Implement rollback mechanisms

#### 6. **Quality Assurance**
- Always iterate 2-3 times for best results
- Use TDD for verifiable changes
- Implement code review agents
- Document decisions and patterns

### Advanced Features

**1. Autonomous Mode**
For trusted workflows, use --dangerously-skip-permissions:
```bash
claude --dangerously-skip-permissions "Fix all lint errors"
```

**2. Visual Development**
Integrate screenshot tools for UI work:
- Puppeteer MCP server
- iOS simulator integration
- Manual screenshot workflow

**3. Custom Agent Creation**
Extend with project-specific agents:
```yaml
name: your-domain-expert
description: Specialized for your domain
tools: [specific tools needed]
```

Always provide concrete references (issues-XX, knowledge-YY) and maintain complete traceability across all agent operations.