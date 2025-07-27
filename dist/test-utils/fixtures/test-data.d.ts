/**
 * @ai-context Test data fixtures for unit tests
 * @ai-pattern Reusable test data objects
 * @ai-critical Consistent test data across test suites
 */
import { Issue, Plan, Document } from '../../types/domain-types.js';
import { WorkSession, DailySummary, Status, Tag } from '../../types/complete-domain-types.js';
/**
 * @ai-intent Test fixtures for issues
 * @ai-pattern Sample issue data
 */
export declare const testIssues: Issue[];
/**
 * @ai-intent Test fixtures for plans
 * @ai-pattern Sample plan data
 */
export declare const testPlans: Plan[];
/**
 * @ai-intent Test fixtures for documents
 * @ai-pattern Sample document data
 */
export declare const testDocuments: Document[];
/**
 * @ai-intent Test fixtures for work sessions
 * @ai-pattern Sample session data
 */
export declare const testSessions: WorkSession[];
/**
 * @ai-intent Test fixtures for daily summaries
 * @ai-pattern Sample summary data
 */
export declare const testSummaries: DailySummary[];
/**
 * @ai-intent Test fixtures for statuses
 * @ai-pattern Sample status data
 */
export declare const testStatuses: Status[];
/**
 * @ai-intent Test fixtures for tags
 * @ai-pattern Sample tag data
 */
export declare const testTags: Tag[];
/**
 * @ai-intent Create test data with specific attributes
 * @ai-pattern Factory functions for custom test data
 */
export declare const TestDataFactory: {
    createIssue(overrides?: Partial<Issue>): Issue;
    createPlan(overrides?: Partial<Plan>): Plan;
    createDocument(overrides?: Partial<Document>): Document;
    createSession(overrides?: Partial<WorkSession>): WorkSession;
    createSummary(overrides?: Partial<DailySummary>): DailySummary;
    createStatus(overrides?: Partial<Status>): Status;
    createTag(name?: string): Tag;
};
/**
 * @ai-intent Generate bulk test data
 * @ai-pattern Create multiple test items
 */
export declare function generateBulkTestData<T>(factory: () => T, count: number, modifier?: (item: T, index: number) => T): T[];
/**
 * @ai-intent Create test data with relationships
 * @ai-pattern Linked test data for integration tests
 */
export declare function createLinkedTestData(): {
    issue1: Issue;
    plan1: Plan;
    doc1: Document;
};
