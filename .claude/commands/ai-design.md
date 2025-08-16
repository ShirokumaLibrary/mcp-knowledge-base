---
description: Create technical designs with automated review validation
argument-hint: "[issue-id | 'feature description' | feedback 'revision text']"
allowed-tools: Task, mcp__shirokuma-kb__get_items, mcp__shirokuma-kb__get_item, mcp__shirokuma-kb__create_item, mcp__shirokuma-kb__update_item, mcp__shirokuma-kb__search_items, TodoWrite
---

# /ai-design

## Language

@.shirokuma/configs/lang.md

## Project Configuration

@.shirokuma/configs/core.md
@.shirokuma/configs/conventions.md

## TDD Methodology (for testable design)

@.shirokuma/rules/tdd-methodology.md

## Purpose

Create technical designs for issues with automated review validation. This command focuses solely on the design phase, producing clear, implementable specifications that pass quality review before user approval.

## Usage

```bash
/ai-design                      # Design for current/selected issue
/ai-design 42                   # Design for specific issue
/ai-design "feature"            # Create design for new feature (creates issue first)
/ai-design feedback "text"      # Revise current design based on feedback
/ai-design 42 feedback "text"   # Revise specific design based on feedback
```

## Process Flow

1. **Issue Analysis** → Understand the problem
2. **Design Creation** → Generate technical design
3. **Self-Validation** → Check completeness
4. **Peer Review** → Automated review by shirokuma-reviewer
5. **User Review** → Present for final approval

## Features

### 1. Issue-Based Design
- Automatically fetches issue details
- Links design to issue in MCP
- Creates design document as `design` type

### 2. Design Document Structure
```markdown
# Design: [Feature Name]

## Problem Statement
[Clear problem definition]

## Solution Overview
[High-level approach]

## Design Decisions
### Decision 1: [Title]
- Options: A, B, C with trade-offs
- Choice: Selected option
- Rationale: Why this option
- Confidence: 0.X

## Architecture
### Components
[Component responsibilities]

### Data Flow
[How data moves]

### API Design
[Interfaces and contracts]

## Implementation Plan
### Phase 1: Core
### Phase 2: Enhanced
### Phase 3: Optimal

## Testing Strategy
[Verification approach]

## Security & Performance
[Key considerations]
```

### 3. Quality Gates

**Self-Validation Checklist**:
- ✓ Problem clearly stated
- ✓ Solution addresses problem
- ✓ Design decisions documented
- ✓ Architecture specified
- ✓ Implementation actionable
- ✓ Testing strategy defined
- ✓ Security considered

**Automated Review** (via @agent-shirokuma-reviewer):
- Invoked through Task tool
- Validates design completeness and quality
- Must achieve APPROVED status
- Feedback incorporated automatically (max 3 iterations)

### 4. MCP Integration
- Creates design as MCP item (type: `design`)
- Links to original issue
- Tags: ["design", "issue-XX", "reviewed"]

## Implementation Details

### Step 1: Argument Analysis
```python
# Parse the argument to determine action:
if no_argument:
    # Use current issue from todo or context
elif is_number(arg1):
    if arg2 == "feedback" and arg3:
        # Revise specific design with feedback
        design_id = arg1
        feedback_text = arg3
    else:
        # Fetch specific issue for new design
        issue_id = arg1
elif arg1 == "feedback" and arg2:
    # Revise most recent design with feedback
    feedback_text = arg2
else:
    # Create new issue with the text as description
    new_issue_description = arg1
```

### Step 2: Design Generation or Revision
```python
if revision_mode:
    # Fetch latest design from MCP
    # Apply user feedback
    # Re-validate design
    # Create new version
else:
    # Use shirokuma-designer agent
    # Generate comprehensive design document
    # Self-validate completeness
    # Iterate if gaps found
```

### Step 3: Review Process
```python
# Invoke @agent-shirokuma-reviewer via Task tool
iteration = 0
MAX_ITERATIONS = 3

while iteration < MAX_ITERATIONS:
    review_result = Task({
        subagent_type: "shirokuma-reviewer",
        prompt: f"Review design {design_id} for completeness, clarity, and implementability",
        description: "Design review"
    })
    
    if review_result.status == "APPROVED":
        # Additional testability check
        testability_check = Task({
            subagent_type: "shirokuma-methodology-keeper",
            prompt: "Verify design testability for TDD. Brief assessment only.",
            description: "Testability check"
        })
        
        if testability_check.has_issues:
            add_testability_notes(design_id, testability_check.notes)
        
        present_to_user()
        break
    elif review_result.status == "NEEDS_CHANGES":
        apply_feedback(review_result.feedback)
        iteration += 1
    
if iteration >= MAX_ITERATIONS:
    present_with_caveats()
```

### Step 4: User Presentation
```markdown
## 🎨 Design Complete: [Feature Name]

**Issue**: #XX - [Title]
**Review Status**: ✅ APPROVED
**Confidence**: 0.9

[Design Summary]

**Next Steps**:
1. Review the design document
2. Use `/ai-go XX` to implement
3. Or request changes with `/ai-design XX revise`

**Design Document**: design-YY
```

## Examples

```bash
# Design for current work
/ai-design
> Analyzing issue #67...
> Creating design document...
> Self-validation: ✓ Complete
> Peer review: ✅ APPROVED
> Design ready for your review

# Design for specific issue
/ai-design 42
> Fetching issue #42...
> Generating technical design...

# Design for new feature
/ai-design "Add caching layer"
> Creating issue #83...
> Designing solution...

# Revise based on user feedback
/ai-design feedback "Security considerations are insufficient. Add authentication flow"
> Found recent design: design-YY
> Applying feedback...
> Adding authentication flow...
> Re-validating design...
> Design v2 ready for review

# Revise specific design
/ai-design 42 feedback "Performance bottleneck concern. Reconsider caching strategy"
> Fetching design #42...
> Revising performance section...
> Adding caching strategy...
> Updated design ready
```

## Revision Mode Features

### Clear Command Structure
- `feedback` subcommand makes intent explicit
- No ambiguity with issue descriptions
- Supports both recent and specific design revision

### Version Management
- Original design preserved
- New version created with feedback applied
- Change summary documented

## Success Criteria

1. **Completeness**: All sections filled
2. **Clarity**: Unambiguous specifications
3. **Implementability**: Clear action items
4. **Quality**: Passes automated review
5. **Traceability**: Linked to issue

## Related Commands

- `/ai-issue` - Create or view issues
- `/ai-go` - Implement approved designs
- `/ai-review` - Review implementation

## Notes

- Designs are immutable once approved
- Revisions create new versions
- All designs stored in MCP for reference
- Focus on pragmatic, implementable solutions