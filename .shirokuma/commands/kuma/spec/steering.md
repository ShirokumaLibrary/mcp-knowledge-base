---
description: Create and manage project-specific steering documents
argument-hint: "create | list | show <name> | update <name>"
allowed-tools: Read, Write, Edit, MultiEdit, Bash, mcp__shirokuma-kb__create_item, mcp__shirokuma-kb__list_items
---

# /kuma:spec:steering - Steering Documents Command

## Language

@.shirokuma/commands/shared/lang.markdown

## Language for Steering Documents

Steering documents should be written in the user's language. Use the language that matches the user's environment for better AI comprehension.

## Purpose

Create and manage steering documents that provide project-specific context, standards, and guidelines to influence spec generation and development.

## Usage

```bash
/kuma:spec:steering create              # Create steering documents
/kuma:spec:steering list                # List steering documents
/kuma:spec:steering show <name>         # Show specific document
/kuma:spec:steering update <name>       # Update existing document
```

## What Are Steering Documents?

Steering documents are contextual guidelines that influence how specs are created and how development proceeds. They contain:
- Project-specific standards and conventions
- Technology stack details
- Best practices and patterns
- Security and compliance requirements
- Team workflows and processes

## Steering Document Types

### 1. Language Rules
```markdown
# Language Usage Rules

## Chat Response
**Always respond in [user's language].** All user interactions in [user's language].

## Code Writing
- **Comments**: Write in English
- **Error messages**: Write in English
- **Variable/function names**: Write in English
- **Log messages**: Write in English

## Documentation
- **Technical docs**: Write in English (README.md, API docs)
- **Localized versions**: Create as separate files (README.[lang].md)
- **MCP documents**: Write in [user's language]
```

### 2. Project Standards
```markdown
# Project Standards

## Code Quality
- Language: TypeScript (strict mode)
- Style: ESLint + Prettier
- Testing: Minimum 80% coverage
- Documentation: JSDoc for public APIs

## Architecture Patterns
- Service layer: Business logic separation
- Repository pattern: Data access abstraction
- Error handling: Centralized management
- Logging: Structured JSON logs

## Naming Conventions
- Files: kebab-case
- Classes: PascalCase
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE
```

### 3. Git Workflow
```markdown
# Git Workflow Standards

## Branch Naming
- Features: feature/issue-number-brief-description
- Bug fixes: bugfix/issue-number-problem-description
- Hotfixes: hotfix/critical-issue

## Commit Messages
Format: type(scope): description

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructuring
- test: Test additions
- chore: Maintenance

## Pull Request Process
1. Create PR with template
2. Get review approval
3. Pass CI checks
4. Squash and merge
```

### 4. Testing Standards
```markdown
# Testing Standards

## Test Strategy
- Unit tests: All services and utilities
- Integration tests: API endpoints
- E2E tests: Critical user flows

## Coverage Goals
- Overall: 80% minimum
- New code: 90% minimum
- Critical paths: 100%

## Test File Structure
tests/
├── unit/        # Unit tests
├── integration/ # Integration tests
├── e2e/        # E2E tests
└── fixtures/   # Test data

## Mocking Strategy
- External APIs: Use MSW
- Database: In-memory DB
- File system: mock-fs
```

### 5. Build Configuration
```markdown
# Build Configuration

## Build Commands
npm run dev          # Development server
npm run build        # Production build
npm run lint:errors  # Lint check
npm test            # Run tests

## TypeScript Settings
- target: ES2022
- module: ESModule
- strict: true
- esModuleInterop: true

## ESLint Settings
- no-explicit-any: error
- no-unused-vars: error
- no-console: error
- File naming: kebab-case required

## Dependency Management
- Regular updates: Monthly
- Security audits: Weekly
- Lock files: Must commit
```

### 6. API Design Standards
```markdown
# API Design Standards

## RESTful Conventions
- GET /resources - List all
- GET /resources/{id} - Get one
- POST /resources - Create new
- PUT /resources/{id} - Update
- DELETE /resources/{id} - Delete

## Response Format
{
  "data": {...},
  "meta": {
    "timestamp": "ISO8601",
    "version": "1.0"
  },
  "errors": []
}

## Error Handling
- Consistent error format
- Meaningful error codes
- User-friendly messages
- Stack traces in dev only
```

### 7. Security Standards
```markdown
# Security Standards

## Authentication
- OAuth 2.0 / JWT tokens
- MFA for sensitive operations
- Session timeout: 30 minutes
- Refresh token rotation

## Data Protection
- Encrypt PII at rest
- TLS 1.3 for transit
- No sensitive data in logs
- GDPR compliance

## Security Practices
- Input validation
- SQL injection prevention
- XSS protection
- CSRF tokens
```

### 8. Performance Standards
```markdown
# Performance Standards

## Response Times
- API p50: < 200ms
- API p95: < 500ms
- API p99: < 1000ms
- Page load: < 3 seconds

## Resource Optimization
- Bundle size: < 500KB
- Image optimization: WebP
- Lazy loading
- Code splitting

## Database Performance
- Query timeout: 5 seconds
- Connection pooling
- Index optimization
- N+1 query prevention
```

## Inclusion Mechanisms

### 1. Always Included (Default)
```yaml
---
inclusion: always
---
```
Documents without front-matter or with `inclusion: always` are included in every spec generation.

### 2. File Match Conditional
```yaml
---
inclusion: fileMatch
fileMatchPattern: '**/api/**'
---
```
Included when working with files matching the pattern.

### 3. Manual Inclusion
```yaml
---
inclusion: manual
---
```
Only included when explicitly requested.

## Creating Steering Documents

### Interactive Creation
```bash
/kuma:spec:steering create
```

Prompts for:
1. Document type selection
2. Inclusion mechanism (always/fileMatch/manual)
3. Priority level (HIGH/MEDIUM/LOW)
4. Specific standards and patterns
5. Technology stack details

### Available Document Types
- **language**: Language usage rules
- **project**: Project standards and conventions
- **git**: Git workflow and branching strategy
- **testing**: Test strategy and coverage
- **build**: Build and deployment configuration
- **api**: API design and conventions
- **security**: Security requirements
- **performance**: Performance targets
- **custom**: Custom steering document

### Assessment Process
1. **Project Analysis**: Examine codebase structure and dependencies
2. **Technology Detection**: Identify stack (TypeScript, Python, etc.)
3. **Gap Identification**: Find missing standards and guidelines
4. **Priority Ranking**: Focus on high-impact areas
5. **Language Selection**: Create in user's language for clarity

## MCP Storage

Store steering documents as knowledge items:

### Required Fields
- **type**: "steering"
- **title**: Document name in user's language
- **description**: Brief description in user's language
- **content**: Pure Markdown content in user's language
- **tags**: Include steering type and inclusion pattern
- **priority**: HIGH, MEDIUM, or LOW based on importance

### Tag Conventions
- **inclusion:always** - Always applied
- **inclusion:filematch** - Applied based on file pattern
- **inclusion:manual** - Manual application only
- **pattern:[technology]** - Technology-specific (e.g., pattern:typescript)
- **category:[type]** - Document category (e.g., category:testing)

## Using Steering in Specs

Steering documents automatically influence:
1. **Requirements Generation**: Constraints and standards
2. **Design Creation**: Architecture patterns and tech stack
3. **Task Planning**: Development workflow and practices
4. **Validation**: Compliance with standards

Example influence:
```markdown
# When generating a new API spec with steering:

## Automatically Applied:
- RESTful endpoint structure from API standards
- Response format from API standards
- Authentication pattern from security steering
- Testing requirements from project standards
- Git workflow from git standards
```

## Steering Document Examples

### Security Steering
```markdown
---
inclusion: always
---

# Security Standards

## Authentication
- OAuth 2.0 with PKCE flow
- MFA required for admin roles
- Session timeout: 30 minutes

## Data Protection
- Encrypt PII at rest (AES-256)
- TLS 1.3 for transit
- No sensitive data in logs

## Vulnerability Management
- Weekly dependency scanning
- Penetration testing quarterly
- Security review for PRs
```

### Performance Steering
```markdown
---
inclusion: fileMatch
fileMatchPattern: '**/api/**'
---

# Performance Standards

## API Response Times
- p50: < 200ms
- p95: < 500ms
- p99: < 1000ms

## Database Queries
- N+1 query prevention
- Index on foreign keys
- Query timeout: 5 seconds

## Caching Strategy
- Redis for session data
- CDN for static assets
- Browser cache headers
```

## Managing Steering Documents

### List All Steering
```bash
/kuma:spec:steering list
```

Output:
```
## Active Steering Documents

1. **project-standards.md** (always)
   - Code quality and architecture patterns
   
2. **git-workflow.md** (always)
   - Branching and commit standards
   
3. **api-design.md** (fileMatch: **/api/**)
   - RESTful conventions and formats
   
4. **dev-environment.md** (manual)
   - Setup and configuration
```

### Update Steering
```bash
/kuma:spec:steering update project-standards
```

Opens editor to modify existing steering document.

## Best Practices

1. **Language Consistency**: Write in user's language for better AI understanding
2. **Keep Focused**: One concern per document
3. **Be Specific**: Concrete examples and patterns
4. **Stay Current**: Update as project evolves
5. **Document Rationale**: Explain why, not just what
6. **Use Tags Effectively**: Proper inclusion and pattern tags
7. **Priority Management**: Set appropriate MCP priority levels

## Implementation Guidelines

### When Creating Steering
1. **Detect user's language** from their communication
2. **Write content in that language** for better AI comprehension
3. **Use appropriate tags** for automatic application
4. **Set correct priority** based on importance

### Language Consideration
- Create steering documents in the user's language
- Japanese users → Japanese documentation
- English users → English documentation
- This ensures AI correctly understands context and requirements

## Integration

- Automatically applied during `/kuma:spec` generation
- Referenced in `/kuma:spec:check` validation
- Used by `/kuma:spec:refine` for consistency
- Loaded by `/kuma:vibe` for adaptive development
- Influences all spec phases and code generation

## References

- @.shirokuma/commands/shared/steering-loader.markdown
- @.shirokuma/commands/shared/spec-templates.markdown