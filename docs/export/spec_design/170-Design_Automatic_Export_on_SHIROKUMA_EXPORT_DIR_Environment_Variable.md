---
id: 170
type: spec_design
title: "Design: Automatic Export on SHIROKUMA_EXPORT_DIR Environment Variable"
status: In Progress
priority: HIGH
description: "Technical design for automatic file export functionality triggered by environment variable presence"
aiSummary: "Technical design document for implementing automatic file export functionality in SHIROKUMA system, triggered by environment variable presence, including architecture, component design, error handling, and performance optimization strategies."
tags: ["mcp","design","export","auto-sync","environment-variables"]
related: [168,169,171,172]
keywords: {"design":1,"export":1,"shirokuma":0.9,"automatic":0.9,"api":0.8}
concepts: {"software architecture":0.9,"configuration management":0.8,"automation":0.8,"system integration":0.8,"file management":0.8}
embedding: "gICKgIeAgICJgICahoqAk4CAgYCAgICAjYCAmpiBgI6AgIGAgYCAgIqAgKGmhoCEgICKgIiAgICEgICTo5SAgICAg4CQgICAiYCAj56fgISAgI2AkICAgIKAgIiSn4COgICVgIqAgICAgICJh5+Ah4CAk4CCgICAg4CAkoCYgJA="
createdAt: 2025-08-29T06:39:56.000Z
updatedAt: 2025-08-29T06:40:06.000Z
---

# Design: Automatic Export on SHIROKUMA_EXPORT_DIR Environment Variable

## Overview

This design document describes the technical implementation for automatic file export functionality that activates when the `SHIROKUMA_EXPORT_DIR` environment variable is defined. The system will automatically export items and current state to the file system on create, update, and delete operations.

## Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     MCP API Layer                           │
├─────────────────────────────────────────────────────────────┤
│  CreateItemHandler │ UpdateItemHandler │ UpdateCurrentState │
└────────┬───────────┴────────┬──────────┴──────────┬────────┘
         │                    │                      │
         └────────────────────┼──────────────────────┘
                              ▼
                    ┌──────────────────┐
                    │  ExportManager    │
                    │  (Enhanced)       │
                    └──────────────────┘
                              │
                    ┌─────────┴──────────┐
                    ▼                     ▼
            ┌──────────────┐    ┌──────────────┐
            │ ConfigManager │    │ FileSystem   │
            └──────────────┘    └──────────────┘
```

### Key Design Decisions

1. **Lazy Initialization**: ExportManager checks for `SHIROKUMA_EXPORT_DIR` only when needed
2. **Fire-and-Forget Pattern**: Export operations are non-blocking with Promise.catch() error handling
3. **Singleton Pattern**: Single ExportManager instance shared across all handlers
4. **Strategy Pattern**: Different export strategies for items vs current_state

## Component Design

### 1. Enhanced ExportManager

```typescript
interface AutoExportConfig {
  enabled: boolean;
  baseDir: string;
  timeout: number;  // 2000ms default
}

class ExportManager {
  private autoExportConfig: AutoExportConfig;
  
  constructor() {
    this.autoExportConfig = this.loadAutoExportConfig();
  }
  
  private loadAutoExportConfig(): AutoExportConfig {
    const exportDir = process.env.SHIROKUMA_EXPORT_DIR;
    return {
      enabled: !!exportDir,
      baseDir: exportDir || '',
      timeout: 2000
    };
  }
  
  // New method for automatic export
  async autoExportItem(item: Item): Promise<void> {
    if (!this.autoExportConfig.enabled) return;
    
    try {
      await this.exportWithTimeout(item, this.autoExportConfig.timeout);
    } catch (error) {
      logger.error('Auto export failed', { itemId: item.id, error });
      // Error is logged but not propagated
    }
  }
  
  // New method for current state export
  async autoExportCurrentState(state: CurrentState): Promise<void> {
    if (!this.autoExportConfig.enabled) return;
    
    try {
      await this.exportCurrentStateWithTimeout(state, this.autoExportConfig.timeout);
    } catch (error) {
      logger.error('Current state auto export failed', { error });
    }
  }
  
  private async exportWithTimeout(item: Item, timeout: number): Promise<void> {
    return Promise.race([
      this.exportItemToFile(item),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Export timeout')), timeout)
      )
    ]);
  }
}
```

### 2. MCP Handler Integration

#### CreateItemHandler Enhancement

```typescript
class CreateItemHandler {
  async handle(params: CreateItemParams): Promise<Item> {
    // Existing create logic
    const item = await this.itemService.create(params);
    
    // Auto-export (non-blocking)
    this.exportManager.autoExportItem(item).catch(error => {
      logger.error('Background export failed', { itemId: item.id, error });
    });
    
    return item; // Return immediately
  }
}
```

#### UpdateItemHandler Enhancement

```typescript
class UpdateItemHandler {
  async handle(params: UpdateItemParams): Promise<Item> {
    // Existing update logic
    const item = await this.itemService.update(params);
    
    // Auto-export (non-blocking)
    this.exportManager.autoExportItem(item).catch(error => {
      logger.error('Background export failed', { itemId: item.id, error });
    });
    
    return item;
  }
}
```

#### UpdateCurrentStateHandler Enhancement

```typescript
class UpdateCurrentStateHandler {
  async handle(params: UpdateStateParams): Promise<CurrentState> {
    // Existing update logic
    const state = await this.stateService.update(params);
    
    // Auto-export (non-blocking)
    this.exportManager.autoExportCurrentState(state).catch(error => {
      logger.error('Background current state export failed', { error });
    });
    
    return state;
  }
}
```

### 3. File Path Structure

```typescript
interface ExportPathBuilder {
  buildItemPath(item: Item): string {
    const sanitizedTitle = this.sanitizeFilename(item.title);
    return path.join(
      this.autoExportConfig.baseDir,
      item.type,
      `${item.id}-${sanitizedTitle}.md`
    );
  }
  
  buildCurrentStatePath(): string {
    return path.join(
      this.autoExportConfig.baseDir,
      'current_state',
      'current_state.md'
    );
  }
  
  private sanitizeFilename(title: string): string {
    return title
      .replace(/[^a-z0-9_\-\s]/gi, '_')
      .replace(/\s+/g, '_')
      .slice(0, 100);  // Limit length
  }
}
```

## Data Models

### Export Metadata

```typescript
interface ExportMetadata {
  exportedAt: Date;
  exportVersion: string;
  sourceSystem: 'shirokuma-kb';
  autoExport: boolean;
}

interface ExportedItem extends Item {
  _export?: ExportMetadata;
}
```

### Export Result Tracking

```typescript
interface ExportResult {
  itemId: number;
  success: boolean;
  duration: number;
  error?: string;
  timestamp: Date;
}
```

## Error Handling Strategy

### Error Categories

1. **Environment Errors**
   - Missing export directory
   - Permission denied
   - Disk full
   - **Action**: Log and disable auto-export

2. **Transient Errors**
   - File lock conflicts
   - Temporary I/O errors
   - **Action**: Log and continue (no retry)

3. **Data Errors**
   - Invalid characters in filename
   - Corrupted item data
   - **Action**: Log with item details

### Error Isolation Implementation

```typescript
class ErrorIsolator {
  static async isolateExportError<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      logger.error(`Export error in ${context}`, { error });
      // Send metrics if available
      metrics?.increment('export.error', { context });
      return null;
    }
  }
}
```

## Performance Optimization

### 1. Asynchronous Export Queue

```typescript
class ExportQueue {
  private queue: Array<() => Promise<void>> = [];
  private processing = false;
  private maxConcurrent = 3;
  
  async add(exportTask: () => Promise<void>): void {
    this.queue.push(exportTask);
    if (!this.processing) {
      this.process();
    }
  }
  
  private async process(): Promise<void> {
    this.processing = true;
    
    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.maxConcurrent);
      await Promise.allSettled(batch.map(task => task()));
    }
    
    this.processing = false;
  }
}
```

### 2. Write Batching

```typescript
class WriteBatcher {
  private pendingWrites = new Map<string, string>();
  private flushTimer: NodeJS.Timeout | null = null;
  
  async scheduleWrite(path: string, content: string): void {
    this.pendingWrites.set(path, content);
    
    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), 100);
    }
  }
  
  private async flush(): Promise<void> {
    const writes = Array.from(this.pendingWrites.entries());
    this.pendingWrites.clear();
    this.flushTimer = null;
    
    await Promise.allSettled(
      writes.map(([path, content]) => 
        fs.promises.writeFile(path, content, 'utf8')
      )
    );
  }
}
```

### 3. Directory Caching

```typescript
class DirectoryCache {
  private cache = new Set<string>();
  
  async ensureDirectory(dirPath: string): Promise<void> {
    if (this.cache.has(dirPath)) return;
    
    await fs.promises.mkdir(dirPath, { recursive: true });
    this.cache.add(dirPath);
  }
}
```

## Configuration Management

### Environment Variables

```typescript
interface EnvironmentConfig {
  SHIROKUMA_EXPORT_DIR?: string;
  SHIROKUMA_EXPORT_TIMEOUT?: string;  // milliseconds
  SHIROKUMA_EXPORT_MAX_CONCURRENT?: string;
  SHIROKUMA_EXPORT_BATCH_SIZE?: string;
}
```

### Configuration Validation

```typescript
class ConfigValidator {
  static validateExportConfig(config: AutoExportConfig): void {
    if (config.enabled) {
      // Check directory exists and is writable
      if (!fs.existsSync(config.baseDir)) {
        throw new Error(`Export directory does not exist: ${config.baseDir}`);
      }
      
      // Test write permissions
      const testFile = path.join(config.baseDir, '.write-test');
      try {
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
      } catch (error) {
        throw new Error(`Export directory not writable: ${config.baseDir}`);
      }
    }
  }
}
```

## Testing Strategy

### Unit Tests

1. **ExportManager Tests**
   - Auto-export enablement detection
   - Timeout handling
   - Error isolation
   - Path generation

2. **Handler Integration Tests**
   - Non-blocking export verification
   - Error doesn't affect response
   - Correct item/state passed to export

### Integration Tests

```typescript
describe('Auto Export Integration', () => {
  beforeEach(() => {
    process.env.SHIROKUMA_EXPORT_DIR = '/tmp/test-export';
  });
  
  it('should export item on creation', async () => {
    const item = await createItemHandler.handle({
      type: 'issue',
      title: 'Test Issue'
    });
    
    // Wait for background export
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const exportPath = `/tmp/test-export/issue/${item.id}-Test_Issue.md`;
    expect(fs.existsSync(exportPath)).toBe(true);
  });
  
  it('should continue on export failure', async () => {
    // Make directory read-only
    fs.chmodSync('/tmp/test-export', 0o444);
    
    const item = await createItemHandler.handle({
      type: 'issue',
      title: 'Test Issue'
    });
    
    // Should succeed despite export failure
    expect(item.id).toBeDefined();
  });
});
```

### Performance Tests

```typescript
describe('Export Performance', () => {
  it('should complete within 2 seconds', async () => {
    const start = Date.now();
    
    // Create 10 items concurrently
    await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        createItemHandler.handle({
          type: 'issue',
          title: `Issue ${i}`
        })
      )
    );
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(2000);
  });
});
```

## Monitoring and Observability

### Metrics

```typescript
interface ExportMetrics {
  'export.success': Counter;
  'export.error': Counter;
  'export.duration': Histogram;
  'export.queue.size': Gauge;
}
```

### Logging

```typescript
const exportLogger = logger.child({ module: 'auto-export' });

exportLogger.info('Auto export enabled', { 
  directory: process.env.SHIROKUMA_EXPORT_DIR 
});

exportLogger.error('Export failed', {
  itemId: item.id,
  error: error.message,
  duration: Date.now() - startTime
});
```

## Migration and Rollback

### Feature Flag

```typescript
class FeatureFlags {
  static isAutoExportEnabled(): boolean {
    return !!process.env.SHIROKUMA_EXPORT_DIR && 
           process.env.DISABLE_AUTO_EXPORT !== 'true';
  }
}
```

### Graceful Degradation

```typescript
class ExportManager {
  async initialize(): Promise<void> {
    if (this.autoExportConfig.enabled) {
      try {
        await ConfigValidator.validateExportConfig(this.autoExportConfig);
        logger.info('Auto export initialized successfully');
      } catch (error) {
        logger.error('Auto export initialization failed, disabling', { error });
        this.autoExportConfig.enabled = false;
      }
    }
  }
}
```

## Security Considerations

1. **Path Traversal Prevention**: Sanitize filenames to prevent directory traversal
2. **Permission Validation**: Check write permissions on startup
3. **Resource Limits**: Implement timeouts and queue limits
4. **Sensitive Data**: No credentials or tokens in export paths

## Future Enhancements

1. **Incremental Export**: Export only changed fields
2. **Compression**: Gzip large exports
3. **S3 Support**: Export to cloud storage
4. **Webhook Notifications**: Notify on export completion
5. **Export Formats**: Support JSON, YAML formats