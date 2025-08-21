# Spec Generation Prompts

## Requirements Phase Prompts

### Basic Feature Requirements
```
I want to create a spec for [FEATURE_NAME]. Here's my initial idea:

[BRIEF_FEATURE_DESCRIPTION]

Please help me create comprehensive requirements using the EARS format. Focus on:
- User stories that capture the core value proposition
- Acceptance criteria that are testable and specific
- Edge cases and error scenarios
- Integration points with existing systems

The feature should serve [TARGET_USER_TYPE] and solve [CORE_PROBLEM].
```

### Complex System Requirements
```
I'm planning a [SYSTEM_TYPE] that needs to handle [CORE_FUNCTIONALITY].

Key constraints:
- Performance: [PERFORMANCE_REQUIREMENTS]
- Scale: [EXPECTED_USAGE_PATTERNS]
- Integration: [EXISTING_SYSTEMS_TO_INTEGRATE]
- Compliance: [REGULATORY_OR_BUSINESS_REQUIREMENTS]

Please help me break this down into well-structured requirements using EARS format. Pay special attention to:
- System boundaries and interfaces
- Non-functional requirements
- Data flow and processing requirements
- Security and compliance considerations
```

### API/Service Requirements
```
I need to design an API for [API_PURPOSE]. The API should:

Core functionality:
- [PRIMARY_OPERATIONS]
- [SECONDARY_OPERATIONS]

Technical context:
- Expected consumers: [WHO_WILL_USE_IT]
- Data sources: [WHERE_DATA_COMES_FROM]
- Performance needs: [RESPONSE_TIME_REQUIREMENTS]

Please create requirements that cover:
- Endpoint specifications and data models
- Authentication and authorization
- Error handling and status codes
- Rate limiting and usage policies
```

## Design Phase Prompts

### Architecture Design
```
Based on the requirements we've established, I need a comprehensive design for [FEATURE_NAME].

Requirements summary: [BRIEF_RECAP_OF_KEY_REQUIREMENTS]

Please create a design that addresses:
- Overall architecture and component relationships
- Data models and their relationships
- API interfaces and contracts
- Error handling strategies
- Testing approach

Consider these technical constraints:
- Technology stack: [CURRENT_TECH_STACK]
- Performance requirements: [KEY_PERFORMANCE_NEEDS]
- Integration points: [SYSTEMS_TO_INTEGRATE_WITH]
```

### Database Design Focus
```
I need a detailed database design for [FEATURE_NAME] based on our requirements.

Key data entities from requirements:
- [ENTITY_1]: [BRIEF_DESCRIPTION]
- [ENTITY_2]: [BRIEF_DESCRIPTION]
- [ENTITY_3]: [BRIEF_DESCRIPTION]

Please design:
- Entity relationship diagrams
- Table schemas with appropriate constraints
- Indexing strategy for performance
- Data migration considerations
- Backup and recovery approach

Database context: [CURRENT_DATABASE_TECHNOLOGY]
```

### UI/UX Design Focus
```
Based on our requirements, I need a user experience design for [FEATURE_NAME].

User context:
- Primary users: [USER_TYPES]
- Usage patterns: [HOW_THEY_WILL_USE_IT]
- Device/platform: [WHERE_THEY_ACCESS_IT]

Please design:
- User flow diagrams
- Interface component structure
- Interaction patterns
- Accessibility considerations
- Error state handling
```

## Tasks Phase Prompts

### Implementation Planning
```
Now that we have the design approved, please break it down into actionable coding tasks.

Design summary: [KEY_DESIGN_COMPONENTS]

Create an implementation plan that:
- Follows test-driven development principles
- Builds incrementally with early validation
- Sequences tasks to minimize dependencies
- Includes specific file/component creation steps

Each task should:
- Reference specific requirements it addresses
- Be completable in 2-4 hours
- Include testing requirements
- Build on previous tasks
```

### Refactoring/Migration Planning
```
I need to refactor [EXISTING_SYSTEM] to implement [NEW_FEATURE] based on our design.

Current system context:
- Existing codebase: [BRIEF_DESCRIPTION]
- Technologies used: [CURRENT_TECH_STACK]
- Areas that need changes: [COMPONENTS_TO_MODIFY]

Create tasks that:
- Minimize disruption to existing functionality
- Allow for incremental rollout
- Include comprehensive testing at each step
- Handle data migration if needed
```

## Refinement Prompts

### Requirements Refinement
```
I've reviewed the requirements and need to refine them:

Changes needed:
1. [SPECIFIC_CHANGE_1] - [REASON]
2. [SPECIFIC_CHANGE_2] - [REASON]

Please update the requirements to:
- Address these specific concerns
- Maintain EARS format consistency
- Ensure all scenarios are covered
- Keep requirements testable
```

### Design Refinement
```
The design needs adjustments based on [FEEDBACK_SOURCE]:

Areas to improve:
- [COMPONENT]: [WHAT_TO_CHANGE]
- [INTERFACE]: [WHAT_TO_ADJUST]

Please refine the design while:
- Maintaining alignment with requirements
- Preserving architectural integrity
- Addressing the specific feedback
- Documenting decision rationale
```

### Tasks Refinement
```
The task breakdown needs refinement:

Issues to address:
- Some tasks are too large (>4 hours)
- Missing testing tasks for [COMPONENT]
- Unclear dependencies between [TASK_A] and [TASK_B]

Please reorganize tasks to:
- Break down large tasks into smaller pieces
- Add missing testing coverage
- Clarify task dependencies
- Maintain logical sequencing
```

## Validation Prompts

### Requirements Validation
```
Please review the requirements document for [FEATURE_NAME] and check:

- Are all user stories complete with clear acceptance criteria?
- Do the requirements use proper EARS format?
- Are edge cases and error scenarios covered?
- Is the scope clearly defined and bounded?
- Are there any missing integration points?

Provide specific feedback on any issues found.
```

### Design Validation
```
Please review the design document for [FEATURE_NAME] and validate:

- Does the architecture address all requirements?
- Are the component interfaces well-defined?
- Is the error handling strategy comprehensive?
- Are performance considerations addressed?
- Is the testing approach adequate?

Highlight any gaps or inconsistencies.
```

### Tasks Validation
```
Please review the implementation plan for [FEATURE_NAME] and check:

- Are all tasks actionable and specific?
- Do tasks build incrementally without big jumps?
- Are all requirements covered by the tasks?
- Is the sequencing logical and dependency-aware?
- Are testing tasks integrated throughout?

Suggest improvements for any issues identified.
```