---
description: Refine and update existing specifications based on feedback
argument-hint: "<spec-id> [phase] | <spec-id> 'specific change'"
allowed-tools: Read, Write, Edit, MultiEdit, Bash, Grep, mcp__shirokuma-kb__get_items, mcp__shirokuma-kb__get_item, mcp__shirokuma-kb__update_item, TodoWrite
---

# /kuma:spec:refine - Spec Refinement Command

## Language

@.shirokuma/configs/lang.md

## Purpose

Refines and updates existing specifications based on feedback, new requirements, or implementation discoveries. Works with all three phases.

## Usage

```bash
/kuma:spec:refine <spec-id>                    # Interactive refinement
/kuma:spec:refine <spec-id> requirements       # Refine requirements only
/kuma:spec:refine <spec-id> design            # Refine design only
/kuma:spec:refine <spec-id> tasks             # Refine tasks only
/kuma:spec:refine <spec-id> "specific change" # Direct refinement
```

## Implementation

### Refinement Process

#### Step 1: Load Current Spec
- Retrieve spec from MCP
- Parse all phases present
- Identify current phase
- Check version history

#### Step 2: Determine Refinement Type
- **Requirements**: Update user stories, acceptance criteria
- **Design**: Modify architecture, components, API
- **Tasks**: Adjust breakdown, sequencing, estimates
- **Cross-phase**: Changes affecting multiple phases

#### Step 3: Apply Refinements
- Maintain consistency across phases
- Update version numbers
- Document change rationale
- Preserve original for rollback

### Interactive Refinement Flow

```
1. Display current spec summary
2. Ask what needs refinement:
   - Add new requirements
   - Modify existing components
   - Adjust task estimates
   - Fix inconsistencies
3. Apply changes
4. Validate coherence
5. Update MCP
```

### Refinement Prompts

From @.shirokuma/commands/spec/shared/spec-prompts.markdown:

#### Requirements Refinement
```
I've reviewed the requirements and need to refine them:

Current requirements: [SUMMARY]

Changes needed:
1. [SPECIFIC_CHANGE_1] - [REASON]
2. [SPECIFIC_CHANGE_2] - [REASON]

Please update the requirements to:
- Address these specific concerns
- Maintain EARS format consistency
- Ensure all scenarios are covered
- Keep requirements testable
```

#### Design Refinement
```
The design needs adjustments based on [FEEDBACK_SOURCE]:

Current design: [SUMMARY]

Areas to improve:
- [COMPONENT]: [WHAT_TO_CHANGE]
- [INTERFACE]: [WHAT_TO_ADJUST]

Please refine the design while:
- Maintaining alignment with requirements
- Preserving architectural integrity
- Addressing the specific feedback
- Documenting decision rationale
```

#### Tasks Refinement
```
The task breakdown needs refinement:

Current tasks: [SUMMARY]

Issues to address:
- Some tasks are too large (>4 hours)
- Missing testing tasks for [COMPONENT]
- Unclear dependencies

Please reorganize tasks to:
- Break down large tasks
- Add missing coverage
- Clarify dependencies
- Maintain logical sequencing
```

### MCP Update Strategy

Preserve history while updating:

```typescript
const spec = mcp__shirokuma-kb__get_item({ id: specId });
const content = JSON.parse(spec.content);

// Store previous version
content.history = content.history || [];
content.history.push({
  version: content.version,
  timestamp: content.updatedAt,
  phase: content.phase,
  snapshot: { /* current state */ }
});

// Apply refinements
content.version = incrementVersion(content.version);
content.updatedAt = new Date();

// Update specific phase
switch(phase) {
  case 'requirements':
    content.requirements = refinedRequirements;
    break;
  case 'design':
    content.design = refinedDesign;
    break;
  case 'tasks':
    content.tasks = refinedTasks;
    break;
}

// Save back to MCP
mcp__shirokuma-kb__update_item({
  id: specId,
  content: JSON.stringify(content),
  description: `Refined ${phase} - v${content.version}`
});
```

### Cross-Phase Impact Analysis

When refining one phase, check impacts:

#### Requirements Change Impact
- **Design**: New components needed?
- **Tasks**: Additional implementation work?

#### Design Change Impact
- **Requirements**: Still addressing all needs?
- **Tasks**: Task breakdown still valid?

#### Tasks Change Impact
- **Design**: Revealing design gaps?
- **Requirements**: Uncovering missing requirements?

## Examples

### Interactive Refinement
```
User: /kuma:spec:refine 101
Assistant:
1. Shows spec #101 summary
2. "What would you like to refine?"
3. User: "Add caching to improve performance"
4. Updates design with caching layer
5. Adds caching implementation tasks
6. Updates spec version to 1.1
```

### Phase-Specific Refinement
```
User: /kuma:spec:refine 101 requirements
Assistant:
1. Shows current requirements
2. Asks for specific changes
3. Updates requirements only
4. Checks design alignment
5. Suggests design updates if needed
```

### Direct Refinement
```
User: /kuma:spec:refine 101 "Add rate limiting to all API endpoints"
Assistant:
1. Analyzes change request
2. Updates requirements (non-functional)
3. Modifies design (API layer)
4. Adds tasks (rate limiting implementation)
5. Updates spec comprehensively
```

## Refinement Guidelines

### When to Refine

**Requirements**:
- New stakeholder needs
- Scope changes
- Discovered edge cases
- Compliance requirements

**Design**:
- Technical constraints discovered
- Performance optimizations
- Security improvements
- Integration changes

**Tasks**:
- Estimation corrections
- Dependency clarifications
- Missing test coverage
- Deployment considerations

### Refinement Best Practices

1. **Incremental Changes**: Small, focused updates
2. **Maintain Coherence**: Check cross-phase impacts
3. **Document Rationale**: Why the change is needed
4. **Preserve History**: Keep previous versions
5. **Validate After**: Run validation on refined spec

### Version Management

- Major version (1.0 → 2.0): Significant scope change
- Minor version (1.0 → 1.1): Feature additions
- Patch version (1.0.1): Clarifications, fixes

## Validation After Refinement

Run validation checks:

```bash
/kuma:spec:req validate <spec-id>
/kuma:spec:design validate <spec-id>
/kuma:spec:tasks validate <spec-id>
```

## Rollback Support

If refinement causes issues:

```typescript
// Retrieve previous version from history
const previousVersion = content.history[content.history.length - 1];
// Restore previous state
content = { ...previousVersion.snapshot, version: content.version + '-rolled-back' };
```

## References

- `.shirokuma/commands/spec/shared/spec-prompts.markdown` - Refinement prompt templates
- `.shirokuma/commands/spec/req.md` - Requirements refinement
- `.shirokuma/commands/spec/design.md` - Design refinement
- `.shirokuma/commands/spec/tasks.md` - Tasks refinement
- `.claude/commands/kuma:spec.md` - Main spec command