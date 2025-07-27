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
export const testIssues: Issue[] = [
  {
    id: 1,
    title: 'Bug in authentication',
    content: 'Users cannot log in with valid credentials',
    priority: 'high',
    status: 'Open',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
    tags: ['bug', 'authentication'],
    description: 'Critical authentication issue affecting all users',
    start_date: '2024-01-01',
    end_date: '2024-01-05',
    related_tasks: ['plans-1'],
    related_documents: ['docs-1']
  },
  {
    id: 2,
    title: 'Performance optimization needed',
    content: 'Database queries are running slowly',
    priority: 'medium',
    status: 'In Progress',
    created_at: '2024-01-02T10:00:00Z',
    updated_at: '2024-01-03T10:00:00Z',
    tags: ['performance', 'database'],
    description: 'Query optimization required for better performance'
  },
  {
    id: 3,
    title: 'Add dark mode',
    content: 'Implement dark mode theme',
    priority: 'low',
    status: 'Done',
    created_at: '2024-01-03T10:00:00Z',
    updated_at: '2024-01-04T10:00:00Z',
    tags: ['feature', 'ui']
  }
];

/**
 * @ai-intent Test fixtures for plans
 * @ai-pattern Sample plan data
 */
export const testPlans: Plan[] = [
  {
    id: 1,
    title: 'Q1 Development Roadmap',
    content: 'Major features and improvements for Q1',
    priority: 'high',
    status: 'In Progress',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    tags: ['roadmap', 'planning'],
    description: 'Quarterly development plan',
    start_date: '2024-01-01',
    end_date: '2024-03-31',
    related_tasks: ['issues-1', 'issues-2'],
    related_documents: ['docs-2']
  },
  {
    id: 2,
    title: 'Security Audit',
    content: 'Comprehensive security review',
    priority: 'high',
    status: 'Open',
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T10:00:00Z',
    tags: ['security', 'audit'],
    start_date: '2024-02-01',
    end_date: '2024-02-15'
  }
];

/**
 * @ai-intent Test fixtures for documents
 * @ai-pattern Sample document data
 */
export const testDocuments: Document[] = [
  {
    id: 1,
    title: 'API Documentation',
    content: '# API Documentation\n\nComplete API reference...',
    type: 'docs',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-10T10:00:00Z',
    tags: ['api', 'documentation'],
    description: 'Complete API reference guide',
    related_tasks: ['issues-1'],
    related_documents: ['knowledge-1']
  },
  {
    id: 2,
    title: 'Architecture Overview',
    content: '# System Architecture\n\nHigh-level system design...',
    type: 'docs',
    created_at: '2024-01-05T10:00:00Z',
    updated_at: '2024-01-05T10:00:00Z',
    tags: ['architecture', 'design'],
    related_tasks: ['plans-1']
  },
  {
    id: 1,
    title: 'Best Practices Guide',
    content: '# Development Best Practices\n\nCoding standards...',
    type: 'knowledge',
    created_at: '2024-01-08T10:00:00Z',
    updated_at: '2024-01-08T10:00:00Z',
    tags: ['best-practices', 'guidelines'],
    related_documents: ['docs-1']
  }
];

/**
 * @ai-intent Test fixtures for work sessions
 * @ai-pattern Sample session data
 */
export const testSessions: WorkSession[] = [
  {
    id: '2024-01-15-10.30.00.000',
    title: 'Morning Development Session',
    date: '2024-01-15',
    startTime: '10:30:00',
    endTime: '12:30:00',
    summary: 'Fixed authentication bug and optimized queries',
    content: 'Detailed work log for the session...',
    tags: ['development', 'bugfix'],
    createdAt: '2024-01-15T10:30:00Z',
    related_tasks: ['issues-1', 'issues-2'],
    related_documents: ['docs-1']
  },
  {
    id: '2024-01-15-14.00.00.000',
    title: 'Code Review Session',
    date: '2024-01-15',
    startTime: '14:00:00',
    endTime: '15:30:00',
    summary: 'Reviewed PRs and provided feedback',
    content: 'Review notes and comments...',
    tags: ['review', 'collaboration'],
    createdAt: '2024-01-15T14:00:00Z'
  }
];

/**
 * @ai-intent Test fixtures for daily summaries
 * @ai-pattern Sample summary data
 */
export const testSummaries: DailySummary[] = [
  {
    date: '2024-01-15',
    title: 'Productive Development Day',
    content: '## Summary\n\nCompleted authentication fixes...',
    tags: ['daily', 'summary'],
    createdAt: '2024-01-15T18:00:00Z',
    updatedAt: '2024-01-15T18:00:00Z',
    related_tasks: ['issues-1', 'issues-2', 'plans-1'],
    related_documents: ['docs-1']
  },
  {
    date: '2024-01-14',
    title: 'Planning and Architecture',
    content: '## Summary\n\nFocused on system design...',
    tags: ['daily', 'planning'],
    createdAt: '2024-01-14T18:00:00Z',
    updatedAt: '2024-01-14T18:00:00Z'
  }
];

/**
 * @ai-intent Test fixtures for statuses
 * @ai-pattern Sample status data
 */
export const testStatuses: Status[] = [
  { id: 1, name: 'Open', is_closed: false },
  { id: 2, name: 'In Progress', is_closed: false },
  { id: 3, name: 'Done', is_closed: true },
  { id: 4, name: 'Closed', is_closed: true },
  { id: 5, name: 'On Hold', is_closed: false },
  { id: 6, name: 'Cancelled', is_closed: true }
];

/**
 * @ai-intent Test fixtures for tags
 * @ai-pattern Sample tag data
 */
export const testTags: Tag[] = [
  { name: 'bug' },
  { name: 'feature' },
  { name: 'documentation' },
  { name: 'performance' },
  { name: 'security' },
  { name: 'ui' },
  { name: 'database' },
  { name: 'api' },
  { name: 'testing' }
];

/**
 * @ai-intent Create test data with specific attributes
 * @ai-pattern Factory functions for custom test data
 */
export const TestDataFactory = {
  createIssue(overrides: Partial<Issue> = {}): Issue {
    return {
      id: 999,
      title: 'Test Issue',
      content: 'Test content',
      priority: 'medium',
      status: 'Open',
        created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tags: [],
      ...overrides
    };
  },
  
  createPlan(overrides: Partial<Plan> = {}): Plan {
    return {
      id: 999,
      title: 'Test Plan',
      content: 'Test content',
      priority: 'medium',
      status: 'Open',
        created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tags: [],
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      ...overrides
    };
  },
  
  createDocument(overrides: Partial<Document> = {}): Document {
    return {
      id: 999,
      title: 'Test Document',
      content: 'Test content',
      type: 'docs',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tags: [],
      ...overrides
    };
  },
  
  createSession(overrides: Partial<WorkSession> = {}): WorkSession {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];
    const id = `${dateStr}-${timeStr.replace(/:/g, '.')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
    
    return {
      id,
      title: 'Test Session',
      date: dateStr,
        startTime: timeStr,
      endTime: new Date(now.getTime() + 2 * 60 * 60 * 1000).toTimeString().split(' ')[0],
      summary: 'Test summary',
      content: 'Test content',
      tags: [],
      createdAt: now.toISOString(),
      ...overrides
    };
  },
  
  createSummary(overrides: Partial<DailySummary> = {}): DailySummary {
    const date = new Date().toISOString().split('T')[0];
    
    return {
      date,
      title: 'Test Summary',
      content: 'Test content',
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides
    };
  },
  
  createStatus(overrides: Partial<Status> = {}): Status {
    return {
      id: 999,
      name: 'Test Status',
      is_closed: false,
      ...overrides
    };
  },
  
  createTag(name: string = 'test-tag'): Tag {
    return { name };
  }
};

/**
 * @ai-intent Generate bulk test data
 * @ai-pattern Create multiple test items
 */
export function generateBulkTestData<T>(
  factory: () => T,
  count: number,
  modifier?: (item: T, index: number) => T
): T[] {
  return Array.from({ length: count }, (_, index) => {
    const item = factory();
    return modifier ? modifier(item, index) : item;
  });
}

/**
 * @ai-intent Create test data with relationships
 * @ai-pattern Linked test data for integration tests
 */
export function createLinkedTestData() {
  const issue1 = TestDataFactory.createIssue({
    id: 1,
    title: 'Linked Issue 1',
    related_tasks: ['plans-1'],
    related_documents: ['docs-1']
  });
  
  const plan1 = TestDataFactory.createPlan({
    id: 1,
    title: 'Linked Plan 1',
    related_tasks: ['issues-1'],
    related_documents: ['docs-1']
  });
  
  const doc1 = TestDataFactory.createDocument({
    id: 1,
    title: 'Linked Document 1',
    related_tasks: ['issues-1', 'plans-1']
  });
  
  return { issue1, plan1, doc1 };
}