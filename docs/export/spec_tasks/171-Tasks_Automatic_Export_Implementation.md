---
id: 171
type: spec_tasks
title: "Tasks: Automatic Export Implementation"
status: Ready
priority: HIGH
description: "Implementation task breakdown for automatic export functionality with SHIROKUMA_EXPORT_DIR"
aiSummary: "Tasks: Automatic Export Implementation Implementation task breakdown for automatic export functionality with SHIROKUMA_EXPORT_DIR Tasks: Automatic Export Implementation Implementation task breakdown f..."
tags: ["tdd","implementation","export","tasks"]
related: [168,169,170,172]
keywords: {"test":0.47,"export":0.44,"tests":0.31,"task":0.31,"for":0.25}
embedding: "gISfgIiMgYCAj4CAhYCAjIWAo4CRloaAgJKAgJWAgIqNgpyAlJaLgICNgICggICFkICLgI+MjICAhICAnYCAgIuIgICPgoyAgIqAgKGAgIGDk4WAhICLgICCgICagICAgJeVgICJhYCAgICAioCAgoKQooCGlICAgIeAgICAgIg="
createdAt: 2025-08-29T06:49:07.000Z
updatedAt: 2025-08-29T06:49:37.000Z
---

# Tasks: Automatic Export Implementation

## Overview
Implementation tasks for automatic export functionality that activates when `SHIROKUMA_EXPORT_DIR` environment variable is set. Following TDD methodology with clear test-first approach.

## Phase 1: Foundation (4 hours)

### Task 1.1: Create AutoExportConfig Types and Tests [1 hour]
**What to do**: 
- Create test file `tests/unit/services/export-manager-auto.test.ts`
- Write tests for AutoExportConfig interface and validation
- Implement types in `src/types/export.types.ts`

**Dependencies**: None

**Acceptance**:
- Tests define expected config structure
- Tests verify environment variable parsing
- Types compile without errors

**Testing**:
```bash
npm test -- export-manager-auto.test.ts
```

### Task 1.2: Implement ExportManager Auto-Export Methods [1.5 hours]
**What to do**:
- Write tests for `autoExportItem()` method
- Write tests for `autoExportCurrentState()` method
- Implement methods in `src/services/export-manager.ts`
- Add timeout handling with Promise.race

**Dependencies**: Task 1.1

**Acceptance**:
- Tests pass for normal export scenarios
- Tests pass for timeout scenarios
- Tests pass for disabled export (no env var)

**Testing**:
```bash
npm test -- export-manager
```

### Task 1.3: Implement Config Validation [0.5 hours]
**What to do**:
- Write tests for ConfigValidator class
- Test directory existence checks
- Test write permission checks
- Implement ConfigValidator in `src/utils/config-validator.ts`

**Dependencies**: Task 1.1

**Acceptance**:
- Validates directory exists
- Validates write permissions
- Handles validation errors gracefully

**Testing**:
```bash
npm test -- config-validator
```

### Task 1.4: Implement Path Building Logic [1 hour]
**What to do**:
- Write tests for path generation
- Test filename sanitization
- Test current_state path logic
- Implement in ExportManager

**Dependencies**: Task 1.2

**Acceptance**:
- Generates correct paths for items
- Generates correct path for current_state
- Sanitizes filenames properly
- Handles special characters

**Testing**:
```bash
npm test -- export-manager.*path
```

## Phase 2: MCP Integration (3 hours)

### Task 2.1: Integrate with CreateItemHandler [1 hour]
**What to do**:
- Write integration test for create + export
- Mock ExportManager in handler tests
- Add non-blocking export call to handler
- Verify error isolation

**Dependencies**: Task 1.2

**File to modify**: `src/mcp/handlers/create-item-handler.ts`

**Acceptance**:
- Item creation succeeds regardless of export result
- Export runs asynchronously
- Errors are logged but not thrown

**Testing**:
```bash
npm test -- create-item-handler
```

### Task 2.2: Integrate with UpdateItemHandler [1 hour]
**What to do**:
- Write integration test for update + export
- Mock ExportManager in handler tests
- Add non-blocking export call to handler
- Test error scenarios

**Dependencies**: Task 1.2

**File to modify**: `src/mcp/handlers/update-item-handler.ts`

**Acceptance**:
- Item update succeeds regardless of export result
- Export runs asynchronously
- Previous export files are overwritten

**Testing**:
```bash
npm test -- update-item-handler
```

### Task 2.3: Integrate with UpdateCurrentStateHandler [1 hour]
**What to do**:
- Write integration test for state + export
- Mock ExportManager in handler tests
- Add non-blocking export call to handler
- Test fixed path behavior

**Dependencies**: Task 1.2

**File to modify**: `src/mcp/handlers/update-current-state-handler.ts`

**Acceptance**:
- State update succeeds regardless of export result
- Always exports to `current_state/current_state.md`
- Overwrites existing file

**Testing**:
```bash
npm test -- update-current-state-handler
```

## Phase 3: Performance Optimization (3 hours)

### Task 3.1: Implement ExportQueue [1.5 hours]
**What to do**:
- Write tests for queue behavior
- Test concurrent execution limits
- Test queue processing
- Implement ExportQueue class

**Dependencies**: Task 2.1, 2.2, 2.3

**File to create**: `src/utils/export-queue.ts`

**Acceptance**:
- Limits concurrent exports to 3
- Processes queue in order
- Handles errors without stopping queue

**Testing**:
```bash
npm test -- export-queue
```

### Task 3.2: Implement DirectoryCache [0.5 hours]
**What to do**:
- Write tests for cache behavior
- Test cache hits and misses
- Implement DirectoryCache class

**Dependencies**: Task 1.4

**File to create**: `src/utils/directory-cache.ts`

**Acceptance**:
- Caches directory creation results
- Reduces filesystem calls
- Thread-safe implementation

**Testing**:
```bash
npm test -- directory-cache
```

### Task 3.3: Add Performance Monitoring [1 hour]
**What to do**:
- Add timing measurements
- Add export metrics
- Add debug logging
- Write performance test

**Dependencies**: Task 3.1

**Acceptance**:
- Logs export duration
- Tracks success/failure rates
- Performance test passes (<2s for 10 items)

**Testing**:
```bash
npm test -- performance
```

## Phase 4: Testing & Documentation (4 hours)

### Task 4.1: End-to-End Integration Tests [2 hours]
**What to do**:
- Create test environment setup
- Write full workflow tests
- Test with real filesystem
- Test error recovery

**Dependencies**: All previous tasks

**File to create**: `tests/integration/auto-export.test.ts`

**Acceptance**:
- Tests create → export → verify file
- Tests update → export → verify overwrite
- Tests with missing directory
- Tests with permission errors

**Testing**:
```bash
SHIROKUMA_EXPORT_DIR=/tmp/test npm test -- integration/auto-export
```

### Task 4.2: Manual Testing & Bug Fixes [1 hour]
**What to do**:
- Set up test environment
- Manually test all scenarios
- Fix any discovered bugs
- Test edge cases

**Dependencies**: Task 4.1

**Acceptance**:
- Manual testing checklist complete
- All edge cases handled
- No runtime errors

**Testing**:
```bash
# Manual testing commands
SHIROKUMA_EXPORT_DIR=./test-export npm run serve
# Then use MCP client to create/update items
```

### Task 4.3: Documentation [1 hour]
**What to do**:
- Update README with feature description
- Create configuration guide
- Add troubleshooting section
- Document performance characteristics

**Dependencies**: Task 4.2

**Files to update**:
- `README.md`
- `docs/configuration.md` (create if needed)

**Acceptance**:
- Clear setup instructions
- Environment variable documentation
- Troubleshooting guide
- Performance expectations documented

## Implementation Order

1. **Start with Phase 1** - Build foundation with TDD
2. **Then Phase 2** - Integrate with existing handlers
3. **Then Phase 3** - Add optimizations
4. **Finally Phase 4** - Comprehensive testing and documentation

## Success Criteria

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Performance test completes in <2 seconds
- [ ] Manual testing checklist complete
- [ ] Documentation updated
- [ ] No breaking changes to existing functionality
- [ ] Export failures don't affect API responses

## Risk Mitigation

1. **Filesystem Permissions**: Validate on startup, disable if issues
2. **Performance Impact**: Use non-blocking operations, queue management
3. **Disk Space**: Implement size limits in future iteration
4. **Concurrent Access**: Use atomic writes, handle conflicts

## Notes

- Follow TDD strictly: Red → Green → Refactor
- Keep exports completely isolated from core functionality
- Log all errors for debugging but don't propagate
- Consider feature flag for emergency disable