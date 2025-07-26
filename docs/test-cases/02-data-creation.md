# 2. Data Creation Tests

This test suite creates various types of items with different configurations to test the creation functionality.

## 2.1 Issue Creation

Create multiple Issues with various configurations.

### Issue 1 - Basic Issue with tags
```
mcp__shirokuma-knowledge-base__create_item(
  type: "issues",
  title: "Authentication System Bug Fix",
  content: "## Issue Details\nUsers cannot login with passwords containing special characters.\n\n### Reproduction Steps\n1. Enter username on login screen\n2. Include special characters in password\n3. Click login button\n4. Error is displayed\n\n### Expected Behavior\nUsers should be able to login with special character passwords\n\n### Impact\n- All users\n- All authentication-dependent features",
  priority: "high",
  status: "Open",
  tags: ["bug", "authentication", "urgent"]
)
```
Expected: Success with id: 1

### Issue 2 - Issue without tags
```
mcp__shirokuma-knowledge-base__create_item(
  type: "issues",
  title: "Performance Optimization Needed",
  content: "## Problem\nThe dashboard page takes too long to load (>5 seconds).\n\n### Analysis\n- Database queries are not optimized\n- No caching implemented\n- Large data sets being loaded unnecessarily",
  priority: "medium",
  status: "Open"
)
```
Expected: Success with id: 2, no tags

### Issue 3 - Issue with different status
```
mcp__shirokuma-knowledge-base__create_item(
  type: "issues",
  title: "Add Dark Mode Support",
  content: "## Feature Request\nUsers have requested dark mode support for better visibility in low-light conditions.\n\n### Requirements\n- Toggle switch in settings\n- Persistent preference storage\n- Smooth transition animations",
  priority: "low",
  status: "In Progress",
  tags: ["feature", "ui", "enhancement"]
)
```
Expected: Success with id: 3

### Issue 4 - Issue with description field
```
mcp__shirokuma-knowledge-base__create_item(
  type: "issues",
  title: "Memory Leak in Background Worker",
  description: "Background worker process consumes increasing memory over time",
  content: "## Problem Description\nThe background worker process shows steadily increasing memory usage.\n\n### Observations\n- Memory grows by ~50MB per hour\n- No corresponding increase in workload\n- Process eventually crashes after 48 hours\n\n### Initial Investigation\n- Profiler shows object accumulation\n- Suspect event listener leak",
  priority: "high",
  status: "Open",
  tags: ["bug", "memory", "performance"]
)
```
Expected: Success with id: 4, description field stored

### Issue creation without content - Verify error occurs
```
mcp__shirokuma-knowledge-base__create_item(
  type: "issues",
  title: "Test Issue",
  priority: "medium"
)
```
Expected: Error "Content is required for issues"

## 2.2 Plan Creation

Create multiple Plans with various configurations.

### Plan 1 - Plan with dates and tags
```
mcp__shirokuma-knowledge-base__create_item(
  type: "plans",
  title: "Q1 2025 Development Roadmap",
  content: "## Goals\n- New feature implementation\n- Performance improvements\n- Security enhancements\n\n## Milestones\n1. Authentication system renewal (January)\n2. API optimization (February)\n3. UI renewal (March)",
  priority: "high",
  status: "Open",
  start_date: "2025-01-01",
  end_date: "2025-03-31",
  tags: ["roadmap", "q1-2025", "planning"]
)
```
Expected: Success with id: 1

### Plan 2 - Plan without tags
```
mcp__shirokuma-knowledge-base__create_item(
  type: "plans",
  title: "Database Migration Project",
  content: "## Objective\nMigrate from PostgreSQL 12 to PostgreSQL 16\n\n## Tasks\n- Backup current database\n- Test migration in staging\n- Schedule maintenance window\n- Execute production migration",
  priority: "high",
  status: "Open",
  start_date: "2025-02-01",
  end_date: "2025-02-28"
)
```
Expected: Success with id: 2, no tags

### Plan 3 - Plan without dates
```
mcp__shirokuma-knowledge-base__create_item(
  type: "plans",
  title: "Technical Debt Reduction",
  content: "## Areas to Address\n- Refactor legacy authentication code\n- Update deprecated dependencies\n- Improve test coverage to 80%\n- Document internal APIs",
  priority: "medium",
  status: "Open",
  tags: ["technical-debt", "refactoring"]
)
```
Expected: Success with id: 3, null dates

### Plan 4 - Plan with description field
```
mcp__shirokuma-knowledge-base__create_item(
  type: "plans",
  title: "API Rate Limiting Implementation",
  description: "Implement rate limiting to prevent API abuse and ensure fair usage",
  content: "## Overview\nImplement comprehensive rate limiting across all API endpoints\n\n## Requirements\n- Per-user rate limits\n- Per-IP rate limits\n- Configurable limits per endpoint\n- Graceful degradation\n\n## Implementation Plan\n1. Research rate limiting algorithms\n2. Choose appropriate library/framework\n3. Implement middleware\n4. Add monitoring and alerts\n5. Document usage limits",
  priority: "medium",
  status: "Open",
  start_date: "2025-03-01",
  end_date: "2025-03-15",
  tags: ["api", "security", "infrastructure"]
)
```
Expected: Success with id: 4, description field stored

## 2.3 Document Creation

Create multiple Documents with various configurations.

### Doc 1 - Document with tags
```
mcp__shirokuma-knowledge-base__create_item(
  type: "docs",
  title: "API Authentication Guide",
  content: "# API Authentication Guide\n\n## Overview\nThis document explains API authentication methods.\n\n## Authentication Methods\n### JWT Token\n- How to obtain tokens\n- Token refresh\n- Error handling\n\n### API Key\n- API key issuance\n- Usage\n- Security best practices",
  tags: ["documentation", "api", "authentication"]
)
```
Expected: Success with id: 1

### Doc 2 - Document without tags
```
mcp__shirokuma-knowledge-base__create_item(
  type: "docs",
  title: "System Architecture Overview",
  content: "# System Architecture\n\n## Components\n- Frontend: React + TypeScript\n- Backend: Node.js + Express\n- Database: PostgreSQL\n- Cache: Redis\n\n## Communication\n- REST API for client-server\n- WebSocket for real-time updates\n- Message Queue for background jobs"
)
```
Expected: Success with id: 2, no tags

### Doc 3 - Development guidelines
```
mcp__shirokuma-knowledge-base__create_item(
  type: "docs",
  title: "Development Guidelines",
  content: "# Development Guidelines\n\n## Code Style\n- Use ESLint configuration\n- Follow TypeScript strict mode\n- Write tests for all features\n\n## Git Workflow\n- Feature branches from main\n- PR reviews required\n- Squash merge policy",
  tags: ["guidelines", "development", "standards"]
)
```
Expected: Success with id: 3

### Doc 4 - Document with description field
```
mcp__shirokuma-knowledge-base__create_item(
  type: "docs",
  title: "CI/CD Pipeline Documentation",
  description: "Complete guide for our continuous integration and deployment pipeline setup",
  content: "# CI/CD Pipeline Documentation\n\n## Overview\nOur CI/CD pipeline automates testing, building, and deployment processes.\n\n## Pipeline Stages\n1. **Build Stage**\n   - Compile TypeScript\n   - Bundle assets\n   - Generate artifacts\n\n2. **Test Stage**\n   - Unit tests\n   - Integration tests\n   - E2E tests\n\n3. **Deploy Stage**\n   - Deploy to staging\n   - Run smoke tests\n   - Deploy to production\n\n## Configuration\nSee `.github/workflows/` for GitHub Actions configuration.",
  tags: ["ci-cd", "devops", "automation"]
)
```
Expected: Success with id: 4, description field stored

## 2.4 Knowledge Creation

Create multiple Knowledge entries with various configurations.

### Knowledge 1 - Knowledge with tags
```
mcp__shirokuma-knowledge-base__create_item(
  type: "knowledge",
  title: "Error Handling Best Practices",
  content: "## Error Handling Principles\n\n### 1. Early Return\nReturn early when errors occur to avoid deep nesting\n\n### 2. Specific Error Messages\nProvide messages that help users understand the problem\n\n### 3. Logging\nLog all errors appropriately\n\n### 4. Retry Strategy\nImplement retry for temporary failures",
  tags: ["best-practices", "error-handling", "development"]
)
```
Expected: Success with id: 1

### Knowledge 2 - Knowledge without tags
```
mcp__shirokuma-knowledge-base__create_item(
  type: "knowledge",
  title: "Database Query Optimization",
  content: "## Query Optimization Techniques\n\n### Indexing Strategy\n- Create indexes on frequently queried columns\n- Use composite indexes for multi-column queries\n- Monitor index usage and remove unused ones\n\n### Query Patterns\n- Avoid SELECT *\n- Use EXPLAIN ANALYZE\n- Batch operations when possible"
)
```
Expected: Success with id: 2, no tags

### Knowledge 3 - Security practices
```
mcp__shirokuma-knowledge-base__create_item(
  type: "knowledge",
  title: "Security Checklist",
  content: "## Application Security\n\n### Authentication\n- Use bcrypt for password hashing\n- Implement rate limiting\n- Enable 2FA for sensitive accounts\n\n### Data Protection\n- Encrypt sensitive data at rest\n- Use HTTPS everywhere\n- Validate all inputs\n- Sanitize outputs",
  tags: ["security", "checklist", "best-practices"]
)
```
Expected: Success with id: 3

### Knowledge 4 - Knowledge with description field
```
mcp__shirokuma-knowledge-base__create_item(
  type: "knowledge",
  title: "Microservices Design Patterns",
  description: "Common patterns and anti-patterns when building microservices architectures",
  content: "## Microservices Design Patterns\n\n### Communication Patterns\n1. **API Gateway Pattern**\n   - Single entry point for clients\n   - Handles routing, authentication, rate limiting\n\n2. **Service Mesh**\n   - Sidecar proxy for service-to-service communication\n   - Provides observability, security, traffic management\n\n3. **Event-Driven Architecture**\n   - Asynchronous communication via message queues\n   - Loose coupling between services\n\n### Data Management\n- Database per Service\n- Saga Pattern for distributed transactions\n- CQRS for read/write separation\n\n### Anti-Patterns to Avoid\n- Shared database\n- Chatty interfaces\n- Distributed monolith",
  tags: ["architecture", "microservices", "patterns"]
)
```
Expected: Success with id: 4, description field stored