# Enable type field changes in update_item API

## Metadata

- **ID**: 14
- **Type**: decision
- **Status ID**: 14
- **Priority**: HIGH
- **Created**: Fri Aug 22 2025 22:32:41 GMT+0900 (Japan Standard Time)
- **Updated**: Fri Aug 22 2025 22:32:41 GMT+0900 (Japan Standard Time)

## Description

Technical design for allowing type field updates while maintaining data integrity

## Content

# Design: Enable Type Field Changes in update_item API

## Problem Statement

Currently, the `update_item` MCP API does not support updating the `type` field of existing items. This limitation prevents users from correcting incorrect type assignments or evolving item classifications over time.

**Current State Analysis:**
- `UpdateItemSchema` (line 22-34 in schemas.ts) excludes `type` field
- `updateItem` method in `CRUDHandlers` (line 144-215) has no type handling
- Type validation exists (`validateType` function) but is only used during creation
- Database schema has no constraints preventing type changes

## Solution Overview

Add type field update capability with proper validation, maintaining backward compatibility and data integrity through controlled type transitions.

## Design Decisions

### Decision 1: Schema Extension Strategy

**Options Considered:**
- Option A: Direct schema addition - Simply add `type: z.string().optional()` to UpdateItemSchema
- Option B: Separate type update endpoint - Create dedicated `update_item_type` tool
- Option C: Conditional validation - Add type with strict validation rules

**Choice**: Option A with enhanced validation
**Rationale**: 
- Maintains API consistency (single update endpoint)
- Leverages existing validation infrastructure
- Minimal breaking changes to client code
- **Confidence**: 0.9

### Decision 2: Validation Strategy

**Options Considered:**
- Option A: No additional validation - Use existing `validateType` function only
- Option B: Type transition matrix - Define allowed type changes (e.g., draft → published)
- Option C: Enhanced validation with normalization - Validate + auto-normalize invalid types

**Choice**: Option C (Enhanced validation with normalization option)
**Rationale**:
- Provides flexibility for user corrections
- Maintains data quality standards
- Allows gradual migration of legacy data
- **Confidence**: 0.8

### Decision 3: Data Integrity Preservation

**Options Considered:**
- Option A: No additional safeguards - Simple field update
- Option B: Relationship validation - Check if type change breaks existing relationships
- Option C: Audit trail - Log type changes for rollback capability

**Choice**: Option A with future-ready hooks
**Rationale**: 
- Relationships are content-based, not type-dependent in current system
- Type field doesn't have foreign key constraints
- Can add audit capabilities later without breaking changes
- **Confidence**: 0.9

## Architecture

### Components Modified

1. **UpdateItemSchema** (schemas.ts)
   - Add optional `type` field with validation
   
2. **CRUDHandlers.updateItem** (crud-handlers.ts)
   - Add type update logic with validation
   
3. **Validation Flow**
   - Existing: `validateType(type, false)` - strict validation
   - New: `validateType(type, autoNormalize)` - configurable normalization

### Data Flow

```
Client Request
    ↓
UpdateItemSchema.parse()
    ↓
[if type provided] → validateType(type, false)
    ↓
Database Update (Prisma)
    ↓
Response
```

### API Contract

```typescript
// Updated schema
export const UpdateItemSchema = z.object({
  id: z.number(),
  type: z.string().optional(), // NEW: Allow type updates
  title: z.string().min(1).max(200).optional(),
  // ... existing fields
});
```

## Implementation Plan

### Phase 1: Core Implementation (Must Have)
- [ ] Add `type` field to `UpdateItemSchema` with proper validation
- [ ] Modify `updateItem` handler to process type field updates
- [ ] Add type validation using existing `validateType` function
- [ ] Update API documentation and tool definitions

### Phase 2: Enhanced Validation (Should Have)
- [ ] Add normalization option for invalid types
- [ ] Implement validation error messages with suggestions
- [ ] Add unit tests for type update scenarios

### Phase 3: Advanced Features (Nice to Have)
- [ ] Add audit logging for type changes
- [ ] Implement type change history tracking
- [ ] Add bulk type update capabilities

## Testing Strategy

### Unit Tests
- Valid type updates (lowercase, underscore, numbers)
- Invalid type rejection (uppercase, spaces, special chars)
- Edge cases (empty string, null, undefined)
- Normalization behavior when enabled

### Integration Tests
- Full update_item workflow with type changes
- Database consistency after type updates
- Relationship preservation after type changes

### Manual Testing Scenarios
```bash
# Valid type update
update_item(id: 1, type: "new_valid_type")

# Invalid type handling
update_item(id: 1, type: "Invalid Type!") # Should fail

# Partial update with type
update_item(id: 1, type: "task", title: "Updated Title")
```

## Security Considerations

### Input Validation
- **Threat**: Malicious type values causing database issues
- **Mitigation**: Strict regex validation (^[a-z0-9_]+$)

### Data Consistency
- **Threat**: Type changes breaking application logic
- **Mitigation**: Type field has no referential constraints in current schema

### Access Control
- **Threat**: Unauthorized type modifications
- **Mitigation**: Inherits existing update_item authorization (MCP level)

## Performance Considerations

### Database Impact
- **Overhead**: Minimal - single field update, indexed column
- **Query Performance**: Type field has database index (@index([type]))

### Validation Performance
- **Overhead**: O(1) regex validation per request
- **Optimization**: Validation occurs in-memory before database call

### Migration Impact
- **Schema Change**: None required - purely application-level change
- **Data Migration**: Not needed - existing type values remain valid

## Risk Assessment

### High Risk Mitigations
- **Data corruption**: Input validation prevents invalid type values
- **Breaking changes**: Optional field maintains backward compatibility

### Medium Risk Monitoring
- **Performance degradation**: Monitor update_item response times
- **Validation bypassing**: Comprehensive test coverage

### Low Risk Acceptance
- **Type standardization**: Accept gradual improvement over time
- **Legacy compatibility**: Existing items remain functional

## Success Criteria

### Functional Requirements
- ✅ update_item accepts optional type parameter
- ✅ Valid types (a-z, 0-9, _) are accepted and stored
- ✅ Invalid types are rejected with clear error messages
- ✅ Existing functionality remains unaffected

### Non-Functional Requirements
- ✅ Response time increase < 10ms for type updates
- ✅ 100% backward compatibility with existing clients
- ✅ Zero data loss or corruption during updates

### Acceptance Criteria
```typescript
// Should succeed
await updateItem({ id: 1, type: "updated_type" });
await updateItem({ id: 1, type: "task_123", title: "New Title" });

// Should fail with validation error
await updateItem({ id: 1, type: "Invalid Type!" });
await updateItem({ id: 1, type: "TYPE" }); // uppercase
```

## Implementation Code Sketch

```typescript
// schemas.ts - Add type field
export const UpdateItemSchema = z.object({
  id: z.number(),
  type: z.string().optional(), // NEW
  // ... existing fields
});

// crud-handlers.ts - Process type updates
async updateItem(args: any) {
  const params = UpdateItemSchema.parse(args);
  
  // ... existing validation
  
  // NEW: Handle type updates
  if (params.type !== undefined) {
    const validatedType = validateType(params.type, false);
    updateData.type = validatedType;
  }
  
  // ... rest of update logic
}
```

## Future Considerations

### Extensibility Hooks
- Audit trail system for type change history
- Type validation rules configuration
- Custom type transformation pipelines

### Integration Points
- Search index updates when type changes
- Relationship recalculation for type-dependent logic
- Analytics tracking for type evolution patterns

## Decision Record

**Decision Date**: 2025-08-13  
**Status**: Designed, Pending Implementation  
**Stakeholders**: API Users, Database Maintainers  
**Review Date**: After Phase 1 implementation  

**Rationale Summary**: Enable type field updates through minimal, backward-compatible API extension with robust validation to maintain data integrity while providing necessary flexibility for users to correct and evolve item classifications.
