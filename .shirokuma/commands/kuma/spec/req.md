---
description: Generate comprehensive requirements using EARS format
argument-hint: "'feature description' | refine <spec-id> | validate <spec-id>"
allowed-tools: Read, Write, Edit, MultiEdit, Bash, Grep, mcp__shirokuma-kb__get_items, mcp__shirokuma-kb__get_item, mcp__shirokuma-kb__create_item, mcp__shirokuma-kb__update_item, TodoWrite
---

# /kuma:spec:req - Requirements Phase Command

## Language

@.shirokuma/commands/shared/lang.markdown

## Purpose

Generates comprehensive requirements documents using EARS (Easy Approach to Requirements Syntax) format. This is Phase 1 of the spec-driven development process.

## Usage

```bash
/kuma:spec:req "feature description"     # Generate new requirements
/kuma:spec:req refine <spec-id>         # Refine existing requirements
/kuma:spec:req validate <spec-id>       # Validate requirements quality
```

## Implementation

### Requirements Generation Process

#### Step 1: Analyze Feature Request
- Parse feature description
- Identify key stakeholders
- Determine system boundaries
- Extract core functionality

#### Step 2: Generate User Stories
Format: `As a [role], I want [feature], so that [benefit]`

#### Step 3: Create EARS Acceptance Criteria
Using patterns from @.shirokuma/commands/shared/ears-format.markdown:
- WHEN [event] THEN [system] SHALL [response]
- IF [condition] THEN [system] SHALL [behavior]
- WHILE [state] [system] SHALL [continuous behavior]
- WHERE [context] [system] SHALL [contextual behavior]
- UNLESS [exception] [system] SHALL [default behavior]

#### Step 4: Add Non-Functional Requirements
- Performance requirements
- Security requirements
- Usability requirements
- Reliability requirements

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

```typescript
// Generate human-readable Markdown content
const markdownContent = `# Requirements: ${featureName}

## Metadata
- **Version**: 1.0
- **Created**: ${new Date().toISOString()}
- **Status**: Specification
- **Phase**: Requirements

## Introduction

### Summary
${introduction.summary}

### Business Value
${introduction.businessValue}

### Scope
${introduction.scope}

## User Stories

${userStories.map((story, i) => `
### Story ${i+1}: ${story.title}
**As a** ${story.role}  
**I want** ${story.want}  
**So that** ${story.benefit}

#### Acceptance Criteria
${story.acceptanceCriteria.map(criteria => `- [ ] ${criteria}`).join('\n')}
`).join('\n')}

## Functional Requirements (EARS Format)

${functionalRequirements.map((req, i) => 
  `### REQ-${i+1}: ${req.title}
**${req.type}** ${req.condition} **THEN** system SHALL ${req.behavior}
${req.rationale ? `\n*Rationale:* ${req.rationale}` : ''}`
).join('\n\n')}

## Non-Functional Requirements

${Object.entries(nonFunctionalRequirements).map(([category, items]) => `
### ${category}
${items.map(item => `- ${item.description}${item.metric ? ` (Metric: ${item.metric})` : ''}`).join('\n')}
`).join('\n')}

## Edge Cases & Error Scenarios

${edgeCases.map(edge => `
### ${edge.scenario}
- **Condition**: ${edge.condition}
- **Expected Behavior**: ${edge.expectedBehavior}
- **Recovery**: ${edge.recovery || 'N/A'}
`).join('\n')}

## Integration Points

${integrationPoints.map(point => `
### ${point.system}
- **Interface**: ${point.interface}
- **Data Flow**: ${point.dataFlow}
- **Error Handling**: ${point.errorHandling}
`).join('\n')}

## Success Metrics

${successMetrics.map(metric => 
  `- **${metric.name}**: ${metric.target} (Measured by: ${metric.measurement})`
).join('\n')}

## Out of Scope

${outOfScope.map(item => `- ${item}`).join('\n')}
`;

// Create new requirements spec with Markdown content
const reqSpec = await mcp__shirokuma-kb__create_item({
  type: "spec_requirements",
  title: `Requirements: ${featureName}`,
  description: "Requirements phase of spec-driven development",
  content: markdownContent, // Human-readable Markdown instead of JSON
  status: "Specification",
  priority: "HIGH",
  tags: ["spec", "requirements", "ears"],
  related: issueIds || []
});

console.log(`✅ Requirements spec saved to shirokuma-kb with ID: ${reqSpec.id}`);
return reqSpec.id; // Return for linking to design phase
```

### Requirements Refinement

For existing requirements:

```typescript
// 1. Retrieve spec from MCP
const spec = await mcp__shirokuma-kb__get_item({ id: specId });

// 2. Update the Markdown content with refinements
// The refinements will be applied directly to the Markdown text
// preserving the human-readable format

// 3. Update spec with refined version
const updatedSpec = await mcp__shirokuma-kb__update_item({
  id: specId,
  content: refinedMarkdownContent // Updated Markdown with refinements
});

console.log(`✅ Requirements refined and updated in spec #${specId}`);
console.log(`📝 Version updated: ${content.version} → ${incrementVersion(content.version)}`);
```

### Requirements Validation

Validation checklist:
- [ ] All user stories complete (role, want, benefit)
- [ ] Acceptance criteria in proper EARS format
- [ ] Each requirement is testable
- [ ] No ambiguous language
- [ ] Edge cases covered
- [ ] Error scenarios defined
- [ ] Non-functional requirements addressed
- [ ] No conflicting requirements
- [ ] Dependencies documented

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