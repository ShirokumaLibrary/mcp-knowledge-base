# Spec/Vibe Command Rules

## Core Philosophy: User Control and Explicit Consent

### The Golden Rule
**"Suggest actively, execute only with permission."**

AI should:
- ✅ **Proactively suggest** next commands and actions
- ✅ **Explain why** each suggestion makes sense
- ✅ **Show options** for different paths forward
- ❌ **Never execute** without explicit user approval
- ❌ **Never assume** "let's do X" means "start doing X now"

### Proper Suggestion Pattern
```markdown
## Suggested Next Steps:
Based on what we've accomplished, here are your options:

1. **Continue with implementation** → `/kuma:vibe:code 123`
   - Ready to implement the design we created
   
2. **Add tests first** → `/kuma:vibe:tdd 123`
   - Follow TDD methodology
   
3. **Review and refine** → `/kuma:spec:refine 123`
   - Improve the specifications before proceeding

Which would you like to do?
```

## Fundamental Principle: Clear Phase Separation

### Planning vs Implementation
All spec and vibe commands follow strict phase separation:

1. **Planning Phase** (spec commands)
   - Requirements gathering
   - Design documentation
   - Task breakdown
   - **NO IMPLEMENTATION**

2. **Implementation Phase** (explicit user choice)
   - Code writing
   - Test creation
   - File modifications
   - **REQUIRES USER APPROVAL**

## Command Behavior Rules

### Spec Commands (`/kuma:spec*`)
- **Purpose**: Planning and documentation ONLY
- **Restrictions**:
  - MUST NOT write code during planning
  - MUST NOT modify implementation files
  - MUST NOT start tests or builds
  - MUST present options for next steps
  - MUST wait for explicit user selection

### Vibe Commands (`/kuma:vibe*`)
- **Purpose**: Visual/creative generation with approval
- **Restrictions**:
  - MUST show preview/plan before implementation
  - MUST get user confirmation for file changes
  - MUST NOT auto-execute generated code
  - MUST respect planning boundaries

## Implementation Guidelines

### When Planning Ends
At the end of any planning phase:
```markdown
## Your Options:
1. Review and refine the plan
2. Generate implementation tasks
3. Start implementation (with approval)
4. Save plan and continue later
```

### User Approval Required
Before ANY implementation:
- Show what will be created/modified
- List files that will be affected
- Wait for explicit "proceed" or equivalent
- Never assume approval from context

### Exit Plan Mode
When transitioning from planning to implementation:
- Use `ExitPlanMode` tool when applicable
- Clearly mark phase transitions
- Document the boundary in output

## Anti-Patterns to Avoid

❌ **DON'T**: Start coding while explaining the design
❌ **DON'T**: Create files during requirements gathering  
❌ **DON'T**: Run tests during planning phase
❌ **DON'T**: Assume "let's implement" means "start now"
❌ **DON'T**: Mix planning and execution in one response

## Correct Patterns

✅ **DO**: Complete all planning first
✅ **DO**: Present clear phase boundaries
✅ **DO**: Ask for explicit confirmation
✅ **DO**: Keep documentation separate from code
✅ **DO**: Use appropriate tools for each phase

## Exception Handling

### Quick Iterations (`/kuma:spec:quick`, `/kuma:vibe:quick`)
Even in "quick" modes:
- Still separate planning from implementation
- May shorten planning phase but don't skip it
- Always show what will be done before doing it

### Micro Specs (`/kuma:spec:micro`)
For small tasks:
- Brief planning is still planning
- One-line plan still needs approval
- Size doesn't override separation rules

## Enforcement Checklist

For command authors/maintainers:
- [ ] Command clearly states its planning/documentation purpose
- [ ] Implementation sections marked as "options" not "next steps"
- [ ] Explicit "NOT automatic" warnings where needed
- [ ] Links to this rules file for reference
- [ ] Examples show proper phase separation

## Remember

> "Planning is planning. Implementation is implementation. Never the twain shall meet without explicit user permission."

This rule exists because:
1. Users need control over their codebase
2. Planning helps catch issues before they become code
3. Separation enables better review and refinement
4. Unexpected changes can break working systems