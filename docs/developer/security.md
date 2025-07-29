# Security Guide

## Overview

This document outlines the security features and best practices implemented in the MCP Knowledge Base system.

## Security Layers

### 1. Input Sanitization

All user inputs are sanitized to prevent injection attacks:

- **SQL Injection Prevention**: Dangerous SQL keywords and patterns are blocked
- **XSS Prevention**: HTML special characters are escaped
- **Path Traversal Prevention**: Directory traversal attempts are blocked
- **Length Validation**: Maximum input lengths enforced

```typescript
// Example usage
const sanitized = InputSanitizer.sanitizeString(userInput, 'fieldName', 200);
```

### 2. Rate Limiting

Token bucket algorithm implementation to prevent DoS attacks:

- **Configurable Limits**: Different limits for different operations
- **Per-User/IP Tracking**: Individual rate limits
- **Burst Protection**: Allows short bursts while maintaining average rate

```typescript
// Rate limit configurations
const rateLimiter = new RateLimiter({
  windowMs: 60000,    // 1 minute
  maxRequests: 60     // 60 requests per minute
});
```

### 3. Access Control (RBAC)

Role-based access control with hierarchical permissions:

**Default Roles**:
- `anonymous`: Read-only access to public resources
- `user`: Create and update own resources
- `moderator`: Delete resources, manage tags/status
- `admin`: Full system access

```typescript
// Permission check
accessControl.requirePermission(user, ResourceType.ISSUE, Permission.UPDATE);
```

### 4. Cryptographic Security

Strong cryptographic functions for sensitive data:

- **Password Hashing**: PBKDF2 with salt (10,000 iterations)
- **Token Generation**: Cryptographically secure random tokens
- **Encryption**: AES-256-GCM for sensitive data
- **HMAC**: Request signing and verification

## Security Features

### Request Validation

- Maximum request size enforcement (default 1MB)
- Request structure validation
- Parameter type checking

### Secure Session Management

- Cryptographically secure session IDs
- Session timeout configuration
- Secure session storage

### Audit Logging

All security-relevant events are logged:

- Authentication attempts
- Authorization failures
- Suspicious activities
- Rate limit violations

### Error Handling

- No sensitive information in error messages
- Consistent error responses
- Proper error logging

## Best Practices

### 1. Never Trust User Input

Always sanitize and validate:
```typescript
// Bad
const title = params.title;

// Good
const title = InputSanitizer.sanitizeString(params.title, 'title', 200);
```

### 2. Use Parameterized Queries

Never concatenate SQL:
```typescript
// Bad
db.query(`SELECT * FROM users WHERE id = ${userId}`);

// Good
db.query('SELECT * FROM users WHERE id = ?', [userId]);
```

### 3. Implement Defense in Depth

Apply multiple security layers:
```typescript
const secureHandler = createSecureHandler(dbPath, {
  sanitization: { enabled: true },
  rateLimit: { enabled: true },
  accessControl: { enabled: true },
  logging: { enabled: true }
});
```

### 4. Log Security Events

Track all security-relevant activities:
```typescript
SecurityAuditor.logAuthenticationAttempt(success, userId, ip);
```

### 5. Handle Errors Securely

Don't leak sensitive information:
```typescript
// Bad
throw new Error(`User ${email} not found in database`);

// Good
throw new NotFoundError('User', 'Not found');
```

## Configuration

### Environment Variables

```bash
# Security settings
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=60
MAX_REQUEST_SIZE=1048576
SESSION_TIMEOUT=3600000

# Logging
LOG_SECURITY_EVENTS=true
LOG_LEVEL=info
```

### Security Headers

Recommended HTTP headers for web deployment:

```
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

## Threat Model

### Identified Threats

1. **Injection Attacks**
   - SQL Injection
   - NoSQL Injection
   - Command Injection
   - XSS

2. **Authentication/Authorization**
   - Unauthorized access
   - Privilege escalation
   - Session hijacking

3. **DoS/DDoS**
   - Resource exhaustion
   - Rate limit bypass
   - Large request attacks

4. **Data Exposure**
   - Information leakage
   - Error message disclosure
   - Timing attacks

### Mitigations

Each threat is mitigated through specific controls:

- Input validation and sanitization
- Parameterized queries
- Rate limiting
- Access control
- Secure session management
- Error handling
- Audit logging

## Security Checklist

Before deployment:

- [ ] Enable all security features
- [ ] Configure appropriate rate limits
- [ ] Set up access control roles
- [ ] Enable security logging
- [ ] Configure secure session settings
- [ ] Review error messages
- [ ] Test input validation
- [ ] Verify rate limiting works
- [ ] Check access control enforcement
- [ ] Review audit logs

## Incident Response

### Detection

Monitor for:
- Failed authentication attempts
- Rate limit violations
- Authorization failures
- Unusual patterns

### Response

1. Identify the threat
2. Block malicious IPs/users
3. Review audit logs
4. Patch vulnerabilities
5. Update security rules

### Recovery

1. Restore normal operations
2. Document incident
3. Update security policies
4. Implement preventive measures

## Updates and Maintenance

### Regular Tasks

- Review security logs weekly
- Update dependencies monthly
- Audit permissions quarterly
- Review rate limits based on usage
- Test security controls

### Security Updates

Keep informed about:
- Dependency vulnerabilities
- New attack vectors
- Security best practices
- Framework updates

## Contact

For security concerns or vulnerability reports:
- Create a private issue in the repository
- Email security contact (if configured)
- Follow responsible disclosure practices