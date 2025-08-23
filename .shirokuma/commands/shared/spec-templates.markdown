# Spec Templates

## Requirements Template Structure

```markdown
# Requirements Document: [Feature Name]

## Document Information
- **Version**: 1.0
- **Date**: [Current Date]
- **Author**: [Author]
- **Stakeholders**: [List]

## Introduction
[Brief overview of the feature and its purpose]

### Feature Summary
[One sentence summary]

### Business Value
[Expected outcomes and benefits]

### Scope
[What's included and excluded]

## Requirements

### Requirement 1: [Title]
**User Story:** As a [role], I want [feature], so that [benefit]

#### Acceptance Criteria
1. WHEN [event] THEN [system] SHALL [response]
2. IF [condition] THEN [system] SHALL [behavior]
3. WHILE [state] [system] SHALL [continuous behavior]

#### Additional Details
- **Priority**: [High/Medium/Low]
- **Complexity**: [High/Medium/Low]
- **Dependencies**: [List]
- **Assumptions**: [List]

## Non-Functional Requirements

### Performance Requirements
- WHEN [load condition] THEN [system] SHALL [performance criteria]

### Security Requirements
- IF [security condition] THEN [system] SHALL [security behavior]

### Usability Requirements
- WHEN [user interaction] THEN [system] SHALL [usability standard]

## Success Criteria
- [ ] All acceptance criteria met
- [ ] Non-functional requirements satisfied
- [ ] Testing criteria passed
```

## Design Template Structure

```markdown
# Design Document: [Feature Name]

## Document Information
- **Version**: 1.0
- **Date**: [Current Date]
- **Related Requirements**: [Link]

## Overview
[High-level design approach]

### Design Goals
- [Goal 1]
- [Goal 2]
- [Goal 3]

### Key Design Decisions
- [Decision 1 and rationale]
- [Decision 2 and rationale]

## Architecture

### System Context
[How feature fits into broader system]

### High-Level Architecture
[Component relationships and data flow]

### Technology Stack
| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | [Tech] | [Why] |
| Backend | [Tech] | [Why] |
| Database | [Tech] | [Why] |

## Components and Interfaces

### Component 1: [Name]
**Purpose**: [What it does]
**Responsibilities**: [List]
**Interfaces**:
- Input: [What it receives]
- Output: [What it produces]
- Dependencies: [What it depends on]

## Data Models

```yaml
# Entity data structure definitions
EntityName:
  Properties:
    - id: string (unique identifier)
    - [additional properties as needed]
  Purpose: Define data structure for entity
  Validation: Include required field constraints
```

## API Design

### Endpoint: [Name]
**Method**: POST
**Path**: /api/v1/[resource]
**Request/Response**: [Schemas]

## Security Considerations
- Authentication: [Method]
- Authorization: [Model]
- Data Protection: [Approach]
```

## Tasks Template Structure

```markdown
# Implementation Tasks: [Feature Name]

## Document Information
- **Version**: 1.0
- **Date**: [Current Date]
- **Related Design**: [Link]

## Implementation Overview
[Brief implementation strategy]

### Development Approach
- **Testing Strategy**: [TDD/BDD]
- **Integration Strategy**: [Approach]
- **Deployment Strategy**: [Method]

## Implementation Plan

### Phase 1: Foundation and Setup
- [ ] 1. Set up project structure
  - Create directory structure
  - Configure dependencies
  - _Requirements: [Ref]_

- [ ] 2. Implement data models
  - Define interfaces
  - Add validation
  - Write tests
  - _Requirements: [Ref]_

### Phase 2: Core Business Logic
- [ ] 3. Implement [Component] service
  - [ ] 3.1 Create service class
  - [ ] 3.2 Add business rules
  - [ ] 3.3 Write unit tests
  - _Requirements: [Ref]_

### Phase 3: API Layer
- [ ] 4. Implement REST endpoints
  - [ ] 4.1 Create endpoints
  - [ ] 4.2 Add validation
  - [ ] 4.3 Write tests
  - _Requirements: [Ref]_

### Phase 4: User Interface
- [ ] 5. Implement UI components
  - [ ] 5.1 Create components
  - [ ] 5.2 Add state management
  - [ ] 5.3 Write tests
  - _Requirements: [Ref]_

### Phase 5: Integration and Testing
- [ ] 6. System integration
  - [ ] 6.1 External services
  - [ ] 6.2 E2E testing
  - [ ] 6.3 Performance testing
  - _Requirements: [Ref]_

### Phase 6: Deployment
- [ ] 7. Deployment preparation
  - [ ] 7.1 Configuration
  - [ ] 7.2 Documentation
  - [ ] 7.3 Validation
  - _Requirements: [Ref]_
```

## Task Guidelines

### Task Characteristics
- **Size**: 2-4 hours completion time
- **Specificity**: Exact files and functions
- **Testability**: Include test requirements
- **Dependencies**: Clear prerequisites
- **Traceability**: Reference requirements

### Task Sequencing
1. Foundation before features
2. Backend before frontend
3. Unit tests before integration
4. Core before edge cases
5. Validation before deployment