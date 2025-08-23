---
description: Create technical design from requirements using architecture patterns
argument-hint: "<spec-id> | refine <spec-id> | validate <spec-id>"
allowed-tools: Read, Write, Edit, MultiEdit, Bash, Grep, mcp__shirokuma-kb__get_items, mcp__shirokuma-kb__get_item, mcp__shirokuma-kb__create_item, mcp__shirokuma-kb__update_item, TodoWrite
---

# /kuma:spec:design - Design Phase Command

## Language

@.shirokuma/commands/shared/lang.markdown

## Purpose

Let's transform your requirements into a thoughtful design. I'll help you explore how to build what you've envisioned, making technical decisions together while keeping things practical and maintainable.

## Usage

```bash
/kuma:spec:design <spec-id>           # Generate design from requirements
/kuma:spec:design refine <spec-id>    # Refine existing design
/kuma:spec:design validate <spec-id>  # Validate design quality
```

## What I'll Do When You Call This Command

### Starting from Your Requirements

When you provide a requirements spec ID, I'll:

1. **Review what we're building**
   - Read through your requirements carefully
   - Understand the goals and constraints
   - Note the success criteria

2. **Explore the solution space**
   - Research existing patterns that might help
   - Consider different architectural approaches
   - Think about what's worked well before

### Creating Your Design

I'll work with you to develop:

#### The Big Picture
- How the system fits into your environment
- What the major pieces are and how they connect
- Why we're choosing specific technologies
- Where the boundaries and interfaces are

#### The Details That Matter
- How components will talk to each other
- What data needs to be stored and how
- How errors will be handled gracefully
- Where performance might be a concern

#### The Implementation Path
- What patterns to follow
- Which frameworks make sense
- How to keep things testable
- Where to be flexible for future changes

### My Design Philosophy

I believe good design should be:
- **Simple** - No more complex than necessary
- **Clear** - Easy for others to understand
- **Practical** - Buildable with your resources
- **Flexible** - Able to evolve as you learn

For design principles, see @.shirokuma/commands/shared/spec-logic.md
- Define relationships
- Add validation rules
- Design data flow

#### Step 5: API Design
- Define endpoints
- Specify request/response schemas
- Document error responses
- Add authentication/authorization

### Generation Prompt

From @.shirokuma/commands/shared/spec-prompts.markdown:

```
Based on the requirements we've established, I need a comprehensive design for [FEATURE_NAME].

Requirements summary: [KEY_REQUIREMENTS_FROM_SPEC]

Please create a design that addresses:
- Overall architecture and component relationships
- Data models and their relationships
- API interfaces and contracts
- Error handling strategies
- Testing approach

Consider these technical constraints:
- Technology stack: [CURRENT_TECH_STACK]
- Performance requirements: [FROM_REQUIREMENTS]
- Integration points: [FROM_REQUIREMENTS]

Generate a design document following this structure:
[Template from @.shirokuma/commands/shared/spec-templates.markdown#design-template-structure]
```

### MCP Storage

```yaml
# Design Storage Process
- Tool: mcp__shirokuma-kb__create_item
  Parameters:
    type: "spec_design"
    title: "Design: [feature-name]"
    description: "Design phase of spec-driven development"
    content: human-readable-markdown-content
    status: "Specification"
    priority: "HIGH"
    tags: ["spec", "design", "architecture"]
    related: [related-spec-ids]
  Purpose: Store comprehensive design document

# Generated Markdown Structure
Design Document Sections:
  - Metadata: Version, dates, status, phase
  - Design Overview: Goals and key decisions
  - System Architecture: Context, components, tech stack
  - Data Architecture: Models, relationships, data flow
  - API Design: Endpoints, schemas, error responses
  - Error Handling: Strategy and error types
  - Testing Approach: Unit, integration, e2e strategies
  - Security Considerations: Concerns and mitigations
  - Performance Targets: Metrics and measurements
  - Migration Strategy: Approach, steps, rollback plan
  - Open Questions: Unresolved items

# Content Format
- Human-readable Markdown instead of JSON
- Structured sections for easy navigation
- Clear separation of concerns
- Links to related specifications
```

### Design Refinement

```yaml
# Design Refinement Process
1. Retrieve Current Design:
   - Tool: mcp__shirokuma-kb__get_item
     Parameters:
       id: spec-id
     Purpose: Get existing design spec

2. Analyze Refinement Needs:
   - Review user feedback or requirements changes
   - Identify specific areas needing updates
   - Plan refinement strategy

3. Apply Design Updates:
   - Update architecture components as needed
   - Modify API specifications
   - Adjust data models and relationships
   - Update technology choices with rationale

4. Update Specification:
   - Tool: mcp__shirokuma-kb__update_item
     Parameters:
       id: spec-id
       content: refined-design-content
     Purpose: Save refined design

5. Version Management:
   - Increment version number
   - Update timestamp
   - Document refinement rationale
```

### Design Validation

Validation checklist:
- [ ] All requirements addressed
- [ ] Architecture is clear and logical
- [ ] Components have defined interfaces
- [ ] Data models are complete
- [ ] API contracts are consistent
- [ ] Error handling is comprehensive
- [ ] Security is properly addressed
- [ ] Performance considerations included
- [ ] Testing approach defined

## Examples

### Generate Design from Requirements
```
User: /kuma:spec:design 101
Assistant:
1. Retrieves requirements from spec #101
2. Analyzes functional requirements
3. Creates architecture based on constraints
4. Designs components and interfaces
5. Defines data models and API
6. Updates spec with design phase
7. Returns: "✅ Design saved to shirokuma-kb with ID: 107"
```

### Refine Design
```
User: /kuma:spec:design refine 101
Assistant:
1. Retrieves design from spec #101
2. Asks what needs refinement
3. Updates specific components
4. Maintains design coherence
5. Documents decision changes
```

### Validate Design
```
User: /kuma:spec:design validate 101
Assistant:
1. Retrieves design from spec #101
2. Checks against requirements
3. Validates completeness
4. Reports gaps or issues
5. Suggests improvements
```

## Design Principles

### Architecture Guidelines
- **Modularity**: Loosely coupled components
- **Scalability**: Design for growth
- **Maintainability**: Clear separation of concerns
- **Testability**: Design for testing
- **Security**: Defense in depth

### Technology Selection
- Choose boring technology (proven solutions)
- Consider team expertise
- Evaluate maintenance burden
- Assess community support
- Document rationale

### API Design Best Practices
- RESTful conventions
- Consistent naming
- Proper status codes
- Comprehensive error messages
- Versioning strategy

## Next Phase

After design is approved:
- Use `/kuma:spec:tasks` to create implementation plan
- Or use `/kuma:spec` to continue with all phases

## References

- `.shirokuma/commands/spec/shared/spec-templates.markdown` - Design template structure
- `.shirokuma/commands/spec/shared/spec-prompts.markdown` - Design generation prompts
- `.shirokuma/commands/spec/req.md` - Previous phase: Requirements
- `.shirokuma/commands/spec/tasks.md` - Next phase: Tasks