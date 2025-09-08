---
description: Generate comprehensive requirements using EARS format
argument-hint: "'feature description' | refine <spec-id> | validate <spec-id>"
allowed-tools: Read, Write, Edit, MultiEdit, Bash, Grep, mcp__shirokuma-kb__get_items, mcp__shirokuma-kb__get_item, mcp__shirokuma-kb__create_item, mcp__shirokuma-kb__update_item, TodoWrite
---

# /kuma:spec:req - Requirements Phase Command

## Language

@.shirokuma/commands/shared/lang.markdown

## Purpose

Help me understand what you want to build and turn it into clear, testable requirements. This is where we start our journey together - understanding the "what" before the "how".

## Usage

```bash
/kuma:spec:req "feature description"     # Generate new requirements
/kuma:spec:req refine <spec-id>         # Refine existing requirements
/kuma:spec:req validate <spec-id>       # Validate requirements quality
```

## What I'll Do When You Call This Command

### Understanding Your Vision

When you describe what you want to build, I'll help you by:

1. **Asking clarifying questions** to understand:
   - Who will use this feature?
   - What problem does it solve?
   - What does success look like?
   - What constraints exist?

2. **Creating user stories** that capture value:
   - From the user's perspective
   - Focused on outcomes, not implementation
   - Clear about the benefits

3. **Writing testable requirements** using EARS format:
   - See @.shirokuma/commands/shared/ears-format.markdown for patterns
   - Each requirement will be specific and measurable
   - Edge cases and exceptions will be documented

4. **Considering the full picture**:
   - How fast does it need to be?
   - How secure must it be?
   - How easy should it be to use?
   - What happens when things go wrong?

### My Approach

I won't just generate a document - I'll have a conversation with you:
- I'll ask about aspects you might not have considered
- I'll suggest patterns from similar features
- I'll help you think through edge cases
- I'll ensure requirements are complete and consistent

For shared principles, see @.shirokuma/commands/shared/spec-logic.md

### Generation Prompt

From @.shirokuma/commands/shared/spec-prompts.markdown:

```
I want to create a spec for [FEATURE_NAME]. Here's my initial idea:

[FEATURE_DESCRIPTION]

Please help me create comprehensive requirements using the EARS format. Focus on:
- User stories that capture the core value proposition
- Acceptance criteria that are testable and specific
- Edge cases and error scenarios
- Integration points with existing systems

Generate a requirements document following this structure:
[Template from @.shirokuma/commands/shared/spec-templates.markdown#requirements-template-structure]
```

### MCP Storage

Requirements are automatically stored in shirokuma-kb as human-readable Markdown.

**Type used**: `type: "spec_requirements"` - Requirements phase only (user stories, EARS criteria, non-functional requirements)

## Requirements Document Generation Process

1. **Content Structure Creation**
   - Generate comprehensive Markdown document with:
     - Metadata (version, creation date, status, phase)
     - Introduction (summary, business value, scope)
     - User Stories (role-want-benefit format with acceptance criteria)
     - Functional Requirements (EARS format with rationale)
     - Non-Functional Requirements (categorized with metrics)
     - Edge Cases & Error Scenarios (condition-behavior-recovery)
     - Integration Points (interface-dataflow-errorhandling)
     - Success Metrics (measurable targets)
     - Out of Scope (explicit exclusions)

2. **MCP Storage Operation**
```yaml
# Store requirements in shirokuma-kb
- Tool: mcp__shirokuma-kb__create_item
  Parameters:
    type: "spec_requirements"
    title: "Requirements: [featureName]"
    description: "Requirements phase of spec-driven development"
    content: "[Generated comprehensive Markdown document]"
    status: "Specification"
    priority: "HIGH"
    tags: ["spec", "requirements", "ears"]
    related: "[issueIds if exists]"
  Purpose: Store requirements document for reference and design phase input
```

3. **Return Process**
   - Display confirmation message with spec ID
   - Return spec ID for linking to subsequent design phase

### Requirements Refinement

## Requirements Refinement Process

1. **Retrieve Existing Spec**
```yaml
# Get current requirements spec
- Tool: mcp__shirokuma-kb__get_item
  Parameters:
    id: "[specId]"
  Purpose: Load existing requirements for refinement
```

2. **Content Refinement**
   - Apply refinements directly to Markdown content
   - Preserve human-readable format structure
   - Update version metadata
   - Maintain historical context

3. **Update Spec with Refined Version**
```yaml
# Update requirements with refinements
- Tool: mcp__shirokuma-kb__update_item
  Parameters:
    id: "[specId]"
    content: "[refinedMarkdownContent - updated Markdown with refinements]"
  Purpose: Save refined requirements while preserving readability
```

4. **Confirmation Process**
   - Display confirmation message with spec ID
   - Show version increment (e.g., "1.0 → 1.1")

### Requirements Validation

## Validation Checklist Process

**Completeness Validation:**
- [ ] All user stories complete (role, want, benefit)
- [ ] Acceptance criteria in proper EARS format
- [ ] Each requirement is testable
- [ ] No ambiguous language
- [ ] Edge cases covered
- [ ] Error scenarios defined
- [ ] Non-functional requirements addressed
- [ ] No conflicting requirements
- [ ] Dependencies documented

**Quality Assessment:**
- Review against project steering documents
- Check EARS format compliance
- Verify testability of all criteria
- Confirm stakeholder coverage
- Validate business value alignment

## Examples

### New Requirements Generation
```
User: /kuma:spec:req "Add user authentication with OAuth"
Assistant:
1. Analyzes authentication needs
2. Identifies user types (new users, existing users, admins)
3. Creates user stories for each flow
4. Generates EARS acceptance criteria
5. Adds security and performance requirements
6. Stores as spec in MCP
7. Returns: "✅ Requirements saved to shirokuma-kb with ID: 106"
```

### Requirements Refinement
```
User: /kuma:spec:req refine 101
Assistant:
1. Retrieves spec #101
2. Reviews current requirements
3. Asks what needs refinement
4. Updates specific sections
5. Maintains version history
```

### Requirements Validation
```
User: /kuma:spec:req validate 101
Assistant:
1. Retrieves spec #101
2. Runs validation checklist
3. Reports issues found
4. Suggests improvements
```

## Quality Guidelines

### Good Requirements Characteristics
- **Specific**: Clear and unambiguous
- **Measurable**: Testable with pass/fail criteria
- **Achievable**: Technically feasible
- **Relevant**: Addresses real user needs
- **Time-bound**: Has clear scope

### Common Issues to Avoid
- Vague terms ("fast", "user-friendly", "intuitive")
- Implementation details in requirements
- Missing error scenarios
- Incomplete user journeys
- Conflicting requirements

## Next Phase

After requirements are approved:
- Use `/kuma:spec:design` to create technical design
- Or use `/kuma:spec` to continue with all phases

## References

- `.shirokuma/commands/spec/shared/ears-format.markdown` - Complete EARS syntax guide
- `.shirokuma/commands/spec/shared/spec-templates.markdown` - Requirements template
- `.shirokuma/commands/spec/shared/spec-prompts.markdown` - Generation and refinement prompts
- `.shirokuma/commands/spec/design.md` - Next phase: Design