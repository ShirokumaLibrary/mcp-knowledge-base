/**
 * @ai-context Test suite for automatic tag creation across all entities
 * @ai-pattern Tests tag auto-registration when entities are created/updated
 * @ai-critical Tags must be automatically created when referenced
 * @ai-assumption Tag names are case-sensitive and unique
 * @ai-related-files
 *   - src/database/tag-repository.ts (auto-registration logic)
 *   - src/database/*-repository.ts (all entities that use tags)
 *   - src/types/domain-types.ts (Tag interface)
 * @ai-why Simplifies UX by not requiring manual tag creation
 * @ai-integration-point All repository create/update methods trigger tag registration
 */
export {};
