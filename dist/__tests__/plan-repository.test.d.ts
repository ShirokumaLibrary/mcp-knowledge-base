/**
 * @ai-context Test suite for plan repository async operations
 * @ai-pattern Tests file-based plan storage with timeline support
 * @ai-critical Plans have start/end dates and can reference issues
 * @ai-assumption Uses temporary directories for isolation
 * @ai-related-files
 *   - src/database/plan-repository.ts (implementation)
 *   - src/types/domain-types.ts (Plan interface)
 *   - src/database/issue-repository.ts (for related_issues)
 * @ai-compare-with issue-repository.test.ts (similar but with dates)
 */
export {};
