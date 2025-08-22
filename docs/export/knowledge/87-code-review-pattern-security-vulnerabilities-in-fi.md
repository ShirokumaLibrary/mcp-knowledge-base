# Code Review Pattern: Security Vulnerabilities in File Operations

## Metadata

- **ID**: 87
- **Type**: knowledge
- **Status ID**: 14
- **Priority**: MEDIUM
- **Created**: Fri Aug 22 2025 22:32:45 GMT+0900 (Japan Standard Time)
- **Updated**: Fri Aug 22 2025 22:32:45 GMT+0900 (Japan Standard Time)

## Description

ファイル操作におけるセキュリティ脆弱性の検出パターンとベストプラクティス

## Content

# Security Vulnerabilities in File Operations

## Common Vulnerabilities

### 1. Path Traversal (Directory Traversal)
**Risk**: Accessing files outside intended directories
**Detection Pattern**:
```typescript
// VULNERABLE
const filePath = userInput; // "../../../etc/passwd"
const content = await fs.readFile(filePath);

// SECURE
import path from 'path';

function validatePath(filePath: string, baseDir: string): void {
  const resolved = path.resolve(filePath);
  const base = path.resolve(baseDir);
  
  if (!resolved.startsWith(base)) {
    throw new Error('Path traversal detected');
  }
}
```

### 2. Unvalidated File Content
**Risk**: Code injection, memory exhaustion
**Best Practices**:
- Validate file size before reading
- Use schema validation for structured data
- Sanitize user input
- Use safe parsers (avoid eval)

### 3. Race Conditions (TOCTOU)
**Risk**: Time-of-check to time-of-use vulnerabilities
**Solution**: Use atomic operations and file locks

## Security Checklist for File Operations

### Input Validation
- [ ] Path validation (no .., ~, absolute paths)
- [ ] File extension whitelist
- [ ] File size limits
- [ ] Content type verification

### Access Control
- [ ] Permission checks
- [ ] User authorization
- [ ] Sandbox/chroot environments
- [ ] Principle of least privilege

### Error Handling
- [ ] Don't expose system paths in errors
- [ ] Log security events
- [ ] Rate limiting for file operations
- [ ] Graceful degradation

## TypeScript/Node.js Specific Patterns

### Safe File Reading
```typescript
import fs from 'fs/promises';
import path from 'path';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['.md', '.txt', '.json'];

async function safeReadFile(
  filePath: string, 
  baseDir: string
): Promise<string> {
  // Validate path
  const resolved = path.resolve(baseDir, filePath);
  if (!resolved.startsWith(path.resolve(baseDir))) {
    throw new Error('Invalid path');
  }
  
  // Check extension
  const ext = path.extname(resolved);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error('Invalid file type');
  }
  
  // Check size
  const stats = await fs.stat(resolved);
  if (stats.size > MAX_FILE_SIZE) {
    throw new Error('File too large');
  }
  
  return fs.readFile(resolved, 'utf-8');
}
```

### Secure YAML/JSON Parsing
```typescript
import yaml from 'js-yaml';
import { z } from 'zod';

const ConfigSchema = z.object({
  // Define expected structure
});

function parseConfig(content: string): Config {
  try {
    // Use SAFE_SCHEMA to prevent code execution
    const data = yaml.load(content, {
      schema: yaml.SAFE_SCHEMA
    });
    
    // Validate structure
    return ConfigSchema.parse(data);
  } catch (error) {
    throw new Error('Invalid configuration');
  }
}
```

## Testing Security

### Security Test Cases
1. **Path Traversal Tests**
   - Test with `../`, `..\\`, `%2e%2e/`
   - Absolute paths
   - Symbolic links

2. **Input Validation Tests**
   - Oversized files
   - Invalid formats
   - Malformed data

3. **Permission Tests**
   - Unauthorized access attempts
   - Directory listing attempts

### Example Security Test
```typescript
describe('Security', () => {
  it('should prevent path traversal', async () => {
    const attempts = [
      '../../../etc/passwd',
      '..\\..\\windows\\system32',
      '/etc/passwd',
      '~/sensitive',
      'valid/../../../etc/passwd'
    ];
    
    for (const attempt of attempts) {
      await expect(
        importManager.importItem(attempt)
      ).rejects.toThrow(/path|security|invalid/i);
    }
  });
  
  it('should reject oversized files', async () => {
    const largeFile = 'x'.repeat(100 * 1024 * 1024);
    vi.mocked(fs.stat).mockResolvedValue({
      size: largeFile.length
    });
    
    await expect(
      importManager.importItem('large.md')
    ).rejects.toThrow(/size|large/i);
  });
});
```

## References
- OWASP Path Traversal
- Node.js Security Best Practices
- CWE-22: Path Traversal
- CWE-73: External Control of File Name
