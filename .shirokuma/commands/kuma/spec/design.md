---
description: Create technical design from requirements using architecture patterns
argument-hint: "<spec-id> | refine <spec-id> | validate <spec-id>"
allowed-tools: Read, Write, Edit, MultiEdit, Bash, Grep, mcp__shirokuma-kb__get_items, mcp__shirokuma-kb__get_item, mcp__shirokuma-kb__create_item, mcp__shirokuma-kb__update_item, TodoWrite
---

# /kuma:spec:design - Design Phase Command

## Language

@.shirokuma/commands/shared/lang.markdown

## Purpose

Creates comprehensive technical design documents based on requirements. This is Phase 2 of the spec-driven development process.

## Usage

```bash
/kuma:spec:design <spec-id>           # Generate design from requirements
/kuma:spec:design refine <spec-id>    # Refine existing design
/kuma:spec:design validate <spec-id>  # Validate design quality
```

## Implementation

**Type used**: `type: "spec_design"` - Design phase only (architecture, data models, interfaces)

### Design Generation Process

#### Step 1: Load Requirements
- Retrieve spec from MCP
- Parse requirements document
- Extract functional and non-functional requirements
- Identify integration points

#### Step 2: Architecture Design
- Define system context
- Create high-level architecture
- Identify components and relationships
- Choose technology stack with rationale

#### Step 3: Component Design
- Define component responsibilities
- Specify interfaces (input/output)
- Document dependencies
- Add implementation notes

#### Step 4: Data Model Design
- Create entity definitions
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

Design is automatically stored in shirokuma-kb as human-readable Markdown:

```typescript
// Generate human-readable Markdown content
const markdownContent = `# Design: ${featureName}

## Metadata
- **Version**: 1.0
- **Created**: ${new Date().toISOString()}
- **Status**: Specification
- **Phase**: Design
${relatedRequirements ? `- **Requirements Spec**: #${relatedRequirements}` : ''}

## Design Overview

### Goals
${goals.map(goal => `- ${goal}`).join('\n')}

### Key Design Decisions
${decisions.map((decision, i) => `
${i+1}. **Decision**: ${decision.decision}
   - **Rationale**: ${decision.rationale}
   - **Trade-offs**: ${decision.tradeoffs || 'None identified'}
`).join('\n')}

## System Architecture

### System Context
${architecture.systemContext}

### Component Architecture
${components.map((comp, i) => `
#### Component ${i+1}: ${comp.name}
- **Purpose**: ${comp.purpose}
- **Responsibilities**: 
  ${comp.responsibilities.map(r => `  - ${r}`).join('\n')}
- **Interfaces**:
  - **Input**: ${comp.interfaces.input}
  - **Output**: ${comp.interfaces.output}
  - **Dependencies**: ${comp.interfaces.dependencies.join(', ')}
`).join('\n')}

### Technology Stack
${technologyStack.map(tech => `
- **${tech.layer}**: ${tech.technology}
  - Rationale: ${tech.rationale}
`).join('\n')}

## Data Architecture

### Data Models
${dataModels.map(model => `
#### ${model.name}
${model.description ? `*${model.description}*\n` : ''}
**Fields:**
${model.fields.map(field => 
  `- \`${field.name}\`: ${field.type}${field.required ? ' (required)' : ''}${field.description ? ` - ${field.description}` : ''}`
).join('\n')}

**Relationships:**
${model.relationships ? model.relationships.map(rel => 
  `- ${rel.type} ${rel.target}${rel.description ? `: ${rel.description}` : ''}`
).join('\n') : '- None'}
`).join('\n')}

### Data Flow
${dataFlow.map(flow => `
#### ${flow.name}
1. ${flow.steps.join('\n2. ')}
`).join('\n')}

## API Design

### Endpoints
${apiEndpoints.map(endpoint => `
#### ${endpoint.method} ${endpoint.path}
- **Purpose**: ${endpoint.purpose}
- **Request**: ${endpoint.request || 'None'}
- **Response**: ${endpoint.response}
- **Errors**: ${endpoint.errors.join(', ')}
`).join('\n')}

## Error Handling

### Strategy
${errorHandling.strategy}

### Error Types
${errorHandling.types.map(error => `
- **${error.name}**: ${error.description}
  - Recovery: ${error.recovery}
`).join('\n')}

## Testing Approach

### Unit Testing
${testing.unit.strategy}
- Coverage Target: ${testing.unit.coverage}%

### Integration Testing
${testing.integration.strategy}
- Key Scenarios: ${testing.integration.scenarios.join(', ')}

### End-to-End Testing
${testing.e2e.strategy}
- Critical Paths: ${testing.e2e.criticalPaths.join(', ')}

## Security Considerations

${security.map(item => `
### ${item.concern}
- **Mitigation**: ${item.mitigation}
- **Implementation**: ${item.implementation}
`).join('\n')}

## Performance Targets

${performance.map(metric => `
- **${metric.metric}**: ${metric.target}
  - Measurement: ${metric.measurement}
`).join('\n')}

## Migration Strategy
${migration ? `
### Approach
${migration.approach}

### Steps
${migration.steps.map((step, i) => `${i+1}. ${step}`).join('\n')}

### Rollback Plan
${migration.rollback}
` : 'Not applicable - new feature'}

## Open Questions

${openQuestions.map((q, i) => `${i+1}. ${q}`).join('\n')}
`;

// Create or update design spec with Markdown content
const designSpec = await mcp__shirokuma-kb__create_item({
  type: "spec_design",
  title: `Design: ${featureName}`,
  description: "Design phase of spec-driven development",
  content: markdownContent, // Human-readable Markdown instead of JSON
  status: "Specification",
  priority: "HIGH",
  tags: ["spec", "design", "architecture"],
  related: relatedSpecs || []
});

console.log(`✅ Design spec saved to shirokuma-kb with ID: ${designSpec.id}`);
return designSpec.id; // Return for linking to tasks phase
```

### Design Refinement

For existing designs:

```typescript
// 1. Retrieve spec from MCP
const spec = await mcp__shirokuma-kb__get_item({ id: specId });

// 2. Update the Markdown content with design refinements
// The refinements will be applied directly to the Markdown text

// 3. Apply refinement based on feedback
const refinedDesign = refineDesign(currentDesign, userFeedback);

// 4. Update spec with refined version
const updatedSpec = await mcp__shirokuma-kb__update_item({
  id: specId,
  content: JSON.stringify({
    ...content,
    design: refinedDesign,
    version: incrementVersion(content.version),
    updatedAt: new Date().toISOString()
  })
});

console.log(`✅ Design refined and updated in spec #${specId}`);
console.log(`📝 Version updated: ${content.version} → ${incrementVersion(content.version)}`);
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