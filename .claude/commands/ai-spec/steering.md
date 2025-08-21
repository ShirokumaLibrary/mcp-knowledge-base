---
description: Create and manage project-specific steering documents
argument-hint: "create | list | show <name> | update <name>"
allowed-tools: Read, Write, Edit, MultiEdit, Bash, mcp__shirokuma-kb__create_item, mcp__shirokuma-kb__list_items
---

# /ai-spec:steering - Steering Documents Command

## Language

@.shirokuma/configs/lang.md

## Purpose

Create and manage steering documents that provide project-specific context, standards, and guidelines to influence spec generation and development.

## Usage

```bash
/ai-spec:steering create              # Create steering documents
/ai-spec:steering list                # List steering documents
/ai-spec:steering show <name>         # Show specific document
/ai-spec:steering update <name>       # Update existing document
```

## What Are Steering Documents?

Steering documents are contextual guidelines that influence how specs are created and how development proceeds. They contain:
- Project-specific standards and conventions
- Technology stack details
- Best practices and patterns
- Security and compliance requirements
- Team workflows and processes

## Steering Document Types

### 1. Project Standards
```markdown
---
inclusion: always
---

# Project Standards

## Code Quality
- Language: TypeScript with strict mode
- Style: ESLint + Prettier configuration
- Testing: Minimum 80% coverage
- Documentation: JSDoc for public APIs

## Architecture Patterns
- State Management: Redux Toolkit
- API: RESTful with OpenAPI specs
- Error Handling: Centralized error boundary
- Logging: Structured JSON logs

## Naming Conventions
- Files: kebab-case
- Components: PascalCase
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE
```

### 2. Git Workflow
```markdown
---
inclusion: always
---

# Git Workflow Standards

## Branch Naming
- Features: feature/JIRA-123-brief-description
- Bugs: bugfix/JIRA-456-issue-description
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
2. Require 2 approvals
3. Pass all CI checks
4. Squash and merge
```

### 3. API Design Standards
```markdown
---
inclusion: fileMatch
fileMatchPattern: '**/api/**'
---

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

## Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Server Error

## Authentication
- Bearer token in Authorization header
- JWT with 1 hour expiry
- Refresh token pattern
```

### 4. Frontend Standards
```markdown
---
inclusion: fileMatch
fileMatchPattern: '**/components/**'
---

# Frontend Development Standards

## Component Structure
ComponentName/
├── index.ts
├── ComponentName.tsx
├── ComponentName.test.tsx
├── ComponentName.styles.ts
└── ComponentName.types.ts

## State Management
- Local state: useState for simple
- Global state: Redux for complex
- Server state: React Query
- Form state: React Hook Form

## Performance
- Lazy load routes
- Memoize expensive computations
- Virtual scrolling for long lists
- Image optimization with WebP

## Accessibility
- WCAG 2.1 AA compliance
- Semantic HTML
- ARIA labels where needed
- Keyboard navigation support
```

### 5. Development Environment
```markdown
---
inclusion: manual
---

# Development Environment Setup

## Required Tools
- Node.js 18+
- Docker Desktop
- AWS CLI configured
- Postgres 14+

## Environment Variables
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
AWS_REGION=us-east-1
API_KEY=...

## Local Development
npm run dev        # Start dev server
npm run test:watch # Run tests
npm run lint       # Check code quality
npm run build      # Production build

## Docker Setup
docker-compose up -d  # Start services
docker-compose logs   # View logs
docker-compose down   # Stop services
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
/ai-spec:steering create
```

Prompts for:
1. Document type (project/git/api/frontend/dev-env/custom)
2. Inclusion mechanism (always/fileMatch/manual)
3. Specific standards and patterns
4. Technology stack details

### Assessment Process
1. **Project Analysis**: Examine codebase structure
2. **Gap Identification**: Find missing standards
3. **Priority Ranking**: Focus on high-impact areas
4. **Template Selection**: Choose appropriate format

## MCP Storage

Store steering documents as knowledge items:

```typescript
{
  type: "steering",
  title: "Steering: [Document Name]",
  description: "Project steering document",
  content: JSON.stringify({
    documentType: "project-standards",
    inclusion: "always",
    frontMatter: {...},
    content: "markdown content",
    appliesTo: ["specs", "development"],
    priority: 100
  }),
  tags: ["steering", "standards", documentType]
}
```

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
/ai-spec:steering list
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
/ai-spec:steering update project-standards
```

Opens editor to modify existing steering document.

## Best Practices

1. **Keep Focused**: One concern per document
2. **Be Specific**: Concrete examples and patterns
3. **Stay Current**: Update as project evolves
4. **Document Rationale**: Explain why, not just what
5. **Version Control**: Track changes over time

## Integration

- Automatically applied during `/ai-spec` generation
- Referenced in `/ai-spec:check` validation
- Used by `/ai-spec:refine` for consistency
- Influences all spec phases

## References

- `.claude/commands/ai-spec.md` - Main spec command
- `.claude/commands/ai-spec/shared/spec-templates.markdown` - Templates
- Kiro steering documentation for additional patterns