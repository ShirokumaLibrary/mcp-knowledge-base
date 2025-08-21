---
description: Validate EARS format and spec structure compliance
argument-hint: "<spec-id> | 'EARS statement' | requirements"
allowed-tools: Read, mcp__shirokuma-kb__get_item
---

# /ai-spec:validate - Format Validation Command

## Language

@.shirokuma/configs/lang.md

## Purpose

Validate EARS format compliance and spec structure to ensure proper syntax and completeness.

## Usage

```bash
/ai-spec:validate <spec-id>                    # Validate entire spec
/ai-spec:validate "WHEN user clicks THEN..."   # Validate EARS statement
/ai-spec:validate requirements <spec-id>       # Validate requirements format
```

## EARS Format Validation

### Valid EARS Patterns

#### WHEN Pattern
```
WHEN [trigger/event] THEN [system] SHALL [response]
```
✅ Valid Examples:
- `WHEN user clicks submit button THEN system SHALL validate form data`
- `WHEN file upload completes THEN system SHALL display success message`
- `WHEN session expires THEN system SHALL redirect to login page`

❌ Invalid Examples:
- `WHEN user clicks THEN validate` (missing SHALL and system)
- `User clicks submit and system validates` (not EARS format)
- `WHEN clicked SHALL respond` (missing THEN, unclear subject)

#### IF Pattern
```
IF [condition/state] THEN [system] SHALL [behavior]
```
✅ Valid Examples:
- `IF user is authenticated THEN system SHALL display dashboard`
- `IF input exceeds 100 characters THEN system SHALL show error`
- `IF database connection fails THEN system SHALL use cache`

❌ Invalid Examples:
- `IF authenticated display dashboard` (missing THEN, SHALL, system)
- `IF user THEN show` (incomplete condition and response)

#### WHILE Pattern
```
WHILE [ongoing condition] [system] SHALL [continuous behavior]
```
✅ Valid Examples:
- `WHILE file is uploading system SHALL display progress bar`
- `WHILE user is typing system SHALL show character count`
- `WHILE system is in maintenance mode system SHALL show notice`

❌ Invalid Examples:
- `WHILE uploading show progress` (missing system SHALL)
- `DURING upload display bar` (wrong keyword, missing SHALL)

#### WHERE Pattern
```
WHERE [context] [system] SHALL [contextual behavior]
```
✅ Valid Examples:
- `WHERE device is mobile system SHALL use responsive layout`
- `WHERE user location is EU system SHALL apply GDPR rules`
- `WHERE network is slow system SHALL enable offline mode`

❌ Invalid Examples:
- `WHERE mobile use responsive` (missing system SHALL)
- `ON mobile SHALL respond` (wrong keyword WHERE)

#### UNLESS Pattern
```
UNLESS [exception] [system] SHALL [default behavior]
```
✅ Valid Examples:
- `UNLESS admin override is active system SHALL enforce rate limits`
- `UNLESS user opts out system SHALL send notifications`
- `UNLESS offline mode is enabled system SHALL sync data`

## Validation Rules

### Structural Rules
1. **Keywords**: Must use WHEN, IF, WHILE, WHERE, or UNLESS
2. **SHALL**: Mandatory for system response
3. **System Subject**: Must specify "system" or specific component
4. **Clear Actions**: Verbs must be specific and measurable

### Quality Rules
1. **No Ambiguity**: Avoid "should", "could", "might"
2. **Testability**: Must be verifiable
3. **Specificity**: No vague terms like "quickly" or "user-friendly"
4. **Completeness**: All parts of pattern present

## Validation Output

### Success Output
```markdown
✅ EARS Validation: PASSED

Statement: "WHEN user submits form THEN system SHALL validate all fields"

Analysis:
- ✅ Trigger: "user submits form" (clear event)
- ✅ Keyword: WHEN-THEN properly used
- ✅ System: Explicitly specified
- ✅ SHALL: Present and correct
- ✅ Response: "validate all fields" (testable action)

Quality Score: 100%
```

### Failure Output
```markdown
❌ EARS Validation: FAILED

Statement: "When user clicks the system should probably validate"

Issues Found:
- ❌ Keyword case: Use uppercase WHEN
- ❌ Missing THEN keyword
- ❌ Missing SHALL (found "should")
- ❌ Vague response: "probably validate"
- ⚠️ Incomplete trigger: "clicks" what?

Corrected Version:
"WHEN user clicks submit button THEN system SHALL validate form inputs"

Quality Score: 20%
```

## Spec Structure Validation

### Requirements Structure
```yaml
Required Sections:
  - Introduction: Overview, scope, stakeholders
  - Requirements: User stories with EARS criteria
  - Non-Functional: Performance, security, usability
  - Constraints: Technical and business limitations
  - Success Criteria: Definition of done

Each Requirement Must Have:
  - User Story: As a/I want/So that format
  - Acceptance Criteria: EARS format statements
  - Priority: High/Medium/Low
  - Complexity: Estimation
```

### Design Structure
```yaml
Required Sections:
  - Overview: High-level approach
  - Architecture: System context and components
  - Data Models: Entities and relationships
  - API Design: Endpoints and contracts
  - Security: Auth and data protection
  - Error Handling: Strategies and responses
```

### Tasks Structure
```yaml
Required Sections:
  - Overview: Implementation strategy
  - Task Phases: Logical grouping
  - Each Task: Name, estimate, details, dependencies
  - Testing Tasks: Unit, integration, e2e
  - Documentation: Required updates
  - Definition of Done: Completion criteria
```

## Batch Validation

### Validate Multiple Statements
```bash
/ai-spec:validate batch
WHEN user logs in THEN system SHALL create session
IF password is incorrect THEN system SHALL show error
WHILE session is active system SHALL track activity
```

### Output
```markdown
## Batch Validation Results

Total Statements: 3
Passed: 3
Failed: 0
Score: 100%

1. ✅ "WHEN user logs in..." - VALID
2. ✅ "IF password is incorrect..." - VALID
3. ✅ "WHILE session is active..." - VALID
```

## Common Issues and Fixes

### Issue 1: Missing SHALL
```
❌ "WHEN user clicks THEN system validates"
✅ "WHEN user clicks THEN system SHALL validate"
```

### Issue 2: Ambiguous Terms
```
❌ "WHEN needed THEN system SHALL work properly"
✅ "WHEN user requests data THEN system SHALL return results within 2 seconds"
```

### Issue 3: Multiple Requirements
```
❌ "WHEN user submits THEN system SHALL validate AND save AND email"
✅ Split into separate statements:
   "WHEN user submits valid data THEN system SHALL save to database"
   "WHEN data is saved THEN system SHALL send confirmation email"
```

### Issue 4: Implementation Details
```
❌ "WHEN user clicks THEN system SHALL use PostgreSQL to store data"
✅ "WHEN user submits data THEN system SHALL persist information"
```

## Integration with Other Commands

- Use after `/ai-spec:req` to validate requirements
- Use with `/ai-spec:check` for comprehensive validation
- Use before `/ai-spec:refine` to identify issues

## Validation API

```typescript
interface ValidationResult {
  valid: boolean;
  score: number;
  issues: ValidationIssue[];
  suggestions: string[];
  corrected?: string;
}

interface ValidationIssue {
  type: 'error' | 'warning';
  position: number;
  message: string;
  suggestion: string;
}
```

## References

- `.claude/commands/ai-spec/shared/ears-format.markdown` - EARS reference
- `.claude/commands/ai-spec/check.md` - Comprehensive checking
- `.claude/commands/ai-spec/req.md` - Requirements generation