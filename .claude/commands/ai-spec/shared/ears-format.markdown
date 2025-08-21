# EARS Format Reference

## Easy Approach to Requirements Syntax

EARS is a requirements specification standard developed at Rolls Royce for creating clear, testable requirements.

## Basic Patterns

### Event-Driven (WHEN)
```
WHEN [event/trigger] THEN [system] SHALL [response]
```
Examples:
- `WHEN user clicks submit button THEN system SHALL validate form data`
- `WHEN data sync completes THEN system SHALL update status indicator`
- `WHEN daily backup runs THEN system SHALL send completion report`

### Precondition (IF)
```
IF [condition/state] THEN [system] SHALL [behavior]
```
Examples:
- `IF user is authenticated THEN system SHALL display user dashboard`
- `IF input is invalid THEN system SHALL show error message`
- `IF user has admin role THEN system SHALL allow access to settings`

### Continuous Behavior (WHILE)
```
WHILE [ongoing condition] [system] SHALL [continuous behavior]
```
Examples:
- `WHILE file is uploading system SHALL display progress bar`
- `WHILE system is in maintenance mode system SHALL show maintenance page`
- `WHILE user is typing system SHALL show autocomplete suggestions`

### Contextual Behavior (WHERE)
```
WHERE [context/location] [system] SHALL [contextual behavior]
```
Examples:
- `WHERE application runs on mobile system SHALL use responsive layout`
- `WHERE system is in production environment system SHALL enable monitoring`
- `WHERE user is in EU region system SHALL comply with GDPR`

### Exception Handling (UNLESS)
```
UNLESS [exception] [system] SHALL [default behavior]
```
Examples:
- `UNLESS admin override is active system SHALL enforce rate limits`
- `UNLESS offline mode is enabled system SHALL sync with server`
- `UNLESS user opts out system SHALL collect analytics`

## Complex Patterns

### Combined Conditions
```
WHEN [event] AND [condition] THEN [system] SHALL [response]
IF [condition1] OR [condition2] THEN [system] SHALL [behavior]
```

### Performance Requirements
```
WHEN [user action] THEN [system] SHALL [response] WITHIN [time limit]
```
Example: `WHEN user requests data THEN system SHALL respond WITHIN 2 seconds`

### Error Handling
```
WHEN [error condition] THEN [system] SHALL [error response]
```
Example: `WHEN database connection fails THEN system SHALL retry 3 times AND notify admin`

## Writing Guidelines

### DO's
- ✅ Use active voice and specific language
- ✅ Always use "SHALL" for mandatory behavior
- ✅ Make each requirement testable
- ✅ Include specific error scenarios
- ✅ Reference the system explicitly

### DON'Ts
- ❌ Don't use vague terms like "fast" or "user-friendly"
- ❌ Don't combine multiple requirements
- ❌ Don't specify implementation details
- ❌ Don't use "should" or "will" - use "SHALL"
- ❌ Don't forget edge cases

## Testing EARS Requirements

Each EARS requirement should be:
1. **Testable**: Can write specific test cases
2. **Measurable**: Has clear pass/fail criteria
3. **Unambiguous**: Only one interpretation
4. **Complete**: Covers all scenarios
5. **Consistent**: No conflicts with other requirements