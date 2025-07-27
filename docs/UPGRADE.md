# Upgrade Guide

This guide helps you upgrade between major versions of the Shirokuma MCP Knowledge Base.

## Upgrading to 0.1.0

### Breaking Changes

1. **Repository Pattern Changes**
   - All repositories now extend `BaseRepository` with proper type constraints
   - Repository constructors require `Database` type from `./base.js` instead of raw sqlite3

   ```typescript
   // Before
   import { Database } from 'sqlite3';
   
   // After
   import { Database } from './base.js';
   ```

2. **Type Safety Improvements**
   - Many `any` types have been replaced with proper types
   - Database operations now use `DatabaseRow` and `QueryParameters` types
   
   ```typescript
   // Before
   const row: any = await db.getAsync(sql);
   
   // After
   const row: DatabaseRow | undefined = await db.getAsync(sql);
   ```

3. **Error Handling**
   - All errors now extend `BaseError` with proper error codes
   - Error middleware handles all error types consistently
   
   ```typescript
   // Before
   throw new Error('Not found');
   
   // After
   throw new NotFoundError('Resource not found', { resource: 'item', id: 123 });
   ```

### New Features

1. **Performance Optimization**
   - Memory caching for frequently accessed data
   - Batch processing for bulk operations
   - Performance monitoring utilities
   
   ```typescript
   import { MemoryCache, BatchProcessor } from './utils/performance-utils.js';
   
   const cache = new MemoryCache<Item>(100, 60000); // 100 items, 1 minute TTL
   const processor = new BatchProcessor<Item>(items => processItems(items), 10, 100);
   ```

2. **Security Enhancements**
   - Input sanitization for all user inputs
   - Rate limiting with configurable limits
   - Role-based access control
   
   ```typescript
   import { InputSanitizer, RateLimiter, AccessControlManager } from './security/index.js';
   
   // Sanitize user input
   const sanitized = InputSanitizer.sanitizeString(userInput, 'fieldName');
   
   // Rate limiting
   const limiter = new RateLimiter({ windowMs: 60000, maxRequests: 60 });
   ```

3. **Testing Improvements**
   - E2E testing through MCP protocol
   - Mock factories for all entities
   - Test helpers and utilities
   
   ```typescript
   import { setupE2ETest, callTool } from './tests/e2e/setup-e2e.js';
   import { createMockIssue } from './tests/mocks/index.js';
   
   const context = await setupE2ETest();
   const result = await callTool(context.client, 'create_item', createMockIssue());
   ```

### Migration Steps

1. **Update TypeScript Configuration**
   ```bash
   npm install
   npm run build
   ```

2. **Fix Type Errors**
   - Replace `any` types with proper types
   - Update repository imports
   - Fix generic type constraints

3. **Update Error Handling**
   - Replace generic errors with specific error types
   - Add error codes where needed
   - Update catch blocks

4. **Test Your Application**
   ```bash
   npm run test:unit
   npm run test:integration
   npm run test:e2e
   ```

5. **Enable Security Features** (Optional)
   ```typescript
   import { createSecureHandler } from './security/secure-handlers.js';
   
   const handler = createSecureHandler(databasePath, {
     rateLimit: { enabled: true },
     accessControl: { enabled: true }
   });
   ```

### Deprecations

- Direct database access without repositories is deprecated
- Untyped error throwing is deprecated
- Console.log for debugging is replaced with structured logging

### Support

If you encounter issues during upgrade:
1. Check the [CHANGELOG.md](./CHANGELOG.md) for detailed changes
2. Review the [API Reference](./api-reference.md) for updated interfaces
3. Submit issues at the project repository