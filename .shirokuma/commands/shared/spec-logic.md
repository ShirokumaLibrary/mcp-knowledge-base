# Spec Creation Common Logic

## What Makes a Good Specification

When creating specifications, please ensure they have these qualities:

- **Clear**: Anyone can understand what we're building
- **Testable**: We can verify when it's complete
- **Implementable**: Shows a clear path to code
- **Valuable**: Solves a real problem for users

## The Three Phases of Spec-Driven Development

### Phase 1: Requirements (What to Build)

Start by understanding what the user needs. Ask yourself:
- What problem are we solving?
- Who will use this feature?
- What does success look like?

Use the EARS format (@.shirokuma/commands/shared/ears-format.markdown) to write requirements that are:
- Specific and measurable
- Free from ambiguity
- Testable by developers

### Phase 2: Design (How to Build)

Transform requirements into a technical approach. Consider:
- What architecture patterns fit best?
- How will components interact?
- What are the failure modes?

Your design should be like a conversation with another developer, explaining your approach in natural language rather than code.

### Phase 3: Tasks (Steps to Build)

Break down the design into manageable pieces:
- Each task should take 2-4 hours
- Tasks should build on each other logically
- Include testing at every step
- Think about dependencies

## Phase Consistency Guidelines

As you move through phases, ensure consistency:

### From Requirements to Design
- Every requirement should have a corresponding design element
- Design decisions should trace back to specific requirements
- No new features should appear in design that weren't in requirements

### From Design to Tasks
- Every design component should have implementation tasks
- Tasks should follow the architecture described in design
- Testing tasks should verify the requirements, not just the code

## Quality Checkpoints

Before moving to the next phase, ask yourself:

### Requirements Complete?
- [ ] User stories capture the value
- [ ] Acceptance criteria are measurable
- [ ] Edge cases are documented
- [ ] Integration points are clear

### Design Ready?
- [ ] Architecture supports all requirements
- [ ] Component interactions are defined
- [ ] Error handling is comprehensive
- [ ] Performance is considered

### Tasks Actionable?
- [ ] Each task has clear deliverables
- [ ] Dependencies are identified
- [ ] Time estimates are realistic
- [ ] Testing is integrated throughout

## Templates and Examples

### Requirement Template
```
WHEN [user action or event]
THEN [system response]
AND [additional outcomes]
```

### Design Section Template
```
## [Component Name]

### Purpose
What this component does and why it exists

### Interactions
How it works with other parts of the system

### Key Decisions
Important choices and their rationale

### Error Handling
How failures are managed
```

### Task Template
```
### Task [number]: [title] [estimated hours]

**What to do**: Clear description of the work
**Dependencies**: What must be done first
**Acceptance**: How we know it's complete
**Testing**: How to verify it works
```

## Common Patterns

### API Development
1. Requirements: Define endpoints and data
2. Design: Specify contracts and error codes
3. Tasks: Implement, test, document

### Feature Addition
1. Requirements: User stories and acceptance
2. Design: UI/UX and backend changes
3. Tasks: Frontend, backend, integration

### Bug Fixes
1. Requirements: Problem and expected behavior
2. Design: Root cause and solution approach
3. Tasks: Fix, test, prevent recurrence

## Working with AI

Remember, these specs are instructions for AI assistants:

- Write in natural language, not code
- Explain the "why" behind decisions
- Include examples when helpful
- Reference other documents with @ notation
- Keep language clear and conversational

## Validation and Refinement

Specs are living documents. They should:

- Evolve based on feedback
- Stay aligned with project goals
- Reflect lessons learned
- Maintain internal consistency

When refining:
1. Keep version history
2. Document what changed and why
3. Ensure phases stay synchronized
4. Update related documents

## References

- @.shirokuma/commands/shared/ears-format.markdown - Requirements format
- @.shirokuma/commands/shared/spec-prompts.markdown - Generation prompts
- @.shirokuma/commands/shared/mcp-rules.markdown - Storage and retrieval