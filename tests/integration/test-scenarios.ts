/**
 * MCPサーバー結合テストシナリオ定義
 */

export interface TestScenario {
  name: string;
  description: string;
  steps: TestStep[];
  expectedResults: ExpectedResult[];
}

export interface TestStep {
  action: string;
  method: string;
  params: Record<string, any>;
  saveAs?: string; // 結果を保存する変数名
}

export interface ExpectedResult {
  field: string;
  matcher: 'equals' | 'contains' | 'exists' | 'length';
  value?: any;
}

export const testScenarios: TestScenario[] = [
  {
    name: 'Complete Issue Lifecycle',
    description: 'Issue作成から更新、削除までの完全なライフサイクル',
    steps: [
      {
        action: 'Create issue',
        method: 'create_item',
        params: {
          type: 'issues',
          title: 'Test Issue Lifecycle',
          content: 'Testing complete lifecycle',
          priority: 'high',
          status: 'Open',
          tags: ['test', 'lifecycle']
        },
        saveAs: 'createdIssue'
      },
      {
        action: 'Update issue status',
        method: 'update_item',
        params: {
          type: 'issues',
          id: '{{createdIssue.id}}',
          status: 'In Progress'
        }
      },
      {
        action: 'Add related documents',
        method: 'update_item',
        params: {
          type: 'issues',
          id: '{{createdIssue.id}}',
          related_documents: ['docs-1', 'knowledge-1']
        }
      },
      {
        action: 'Close issue',
        method: 'update_item',
        params: {
          type: 'issues',
          id: '{{createdIssue.id}}',
          status: 'Closed'
        }
      },
      {
        action: 'Verify closed issues excluded',
        method: 'get_items',
        params: {
          type: 'issues'
        },
        saveAs: 'openIssues'
      },
      {
        action: 'Delete issue',
        method: 'delete_item',
        params: {
          type: 'issues',
          id: '{{createdIssue.id}}'
        }
      }
    ],
    expectedResults: [
      {
        field: 'createdIssue.id',
        matcher: 'exists'
      },
      {
        field: 'openIssues',
        matcher: 'length',
        value: 0
      }
    ]
  },
  {
    name: 'Session and Summary Workflow',
    description: 'セッションとサマリーの作成と関連付け',
    steps: [
      {
        action: 'Create work session',
        method: 'create_session',
        params: {
          title: 'Development Work',
          content: 'Implemented new features',
          tags: ['development'],
          category: 'coding',
          related_tasks: ['issues-1', 'plans-1']
        },
        saveAs: 'session'
      },
      {
        action: 'Get latest session',
        method: 'get_latest_session',
        params: {},
        saveAs: 'latestSession'
      },
      {
        action: 'Create daily summary',
        method: 'create_summary',
        params: {
          date: '{{today}}',
          title: 'Daily Progress',
          content: 'Completed multiple tasks',
          tags: ['daily', 'summary'],
          related_tasks: ['issues-1'],
          related_documents: ['docs-1']
        }
      }
    ],
    expectedResults: [
      {
        field: 'session.id',
        matcher: 'contains',
        value: '{{today}}'
      },
      {
        field: 'latestSession.id',
        matcher: 'equals',
        value: '{{session.id}}'
      }
    ]
  },
  {
    name: 'Tag Management Flow',
    description: 'タグの自動登録と検索',
    steps: [
      {
        action: 'Create items with tags',
        method: 'create_item',
        params: {
          type: 'knowledge',
          title: 'Tagged Knowledge',
          content: 'Content with tags',
          tags: ['unique-tag-1', 'unique-tag-2', 'shared-tag']
        }
      },
      {
        action: 'Create another item with shared tag',
        method: 'create_item',
        params: {
          type: 'docs',
          title: 'Tagged Document',
          content: 'Document with shared tag',
          tags: ['shared-tag', 'doc-specific']
        }
      },
      {
        action: 'Search by tag',
        method: 'search_items_by_tag',
        params: {
          tag: 'shared-tag'
        },
        saveAs: 'tagSearchResults'
      },
      {
        action: 'Get all tags',
        method: 'get_tags',
        params: {},
        saveAs: 'allTags'
      }
    ],
    expectedResults: [
      {
        field: 'tagSearchResults.data',
        matcher: 'length',
        value: 2
      },
      {
        field: 'allTags',
        matcher: 'contains',
        value: 'unique-tag-1'
      }
    ]
  },
  {
    name: 'Custom Type Creation and Usage',
    description: 'カスタムタイプの作成と使用',
    steps: [
      {
        action: 'Create custom document type',
        method: 'create_type',
        params: {
          name: 'proposal',
          base_type: 'documents'
        }
      },
      {
        action: 'Create custom task type',
        method: 'create_type',
        params: {
          name: 'feature',
          base_type: 'tasks'
        }
      },
      {
        action: 'Create proposal item',
        method: 'create_item',
        params: {
          type: 'proposal',
          title: 'New Feature Proposal',
          content: 'Proposal for implementing X feature'
        },
        saveAs: 'proposal'
      },
      {
        action: 'Create feature task',
        method: 'create_item',
        params: {
          type: 'feature',
          title: 'Implement Feature X',
          content: 'Implementation details',
          priority: 'high',
          status: 'Open'
        },
        saveAs: 'feature'
      },
      {
        action: 'List all types',
        method: 'get_types',
        params: {},
        saveAs: 'allTypes'
      }
    ],
    expectedResults: [
      {
        field: 'proposal.type',
        matcher: 'equals',
        value: 'proposal'
      },
      {
        field: 'feature.priority',
        matcher: 'equals',
        value: 'high'
      },
      {
        field: 'allTypes',
        matcher: 'contains',
        value: 'proposal'
      }
    ]
  },
  {
    name: 'Complex Data Relationships',
    description: '複雑なデータ関係性のテスト',
    steps: [
      {
        action: 'Create parent issue',
        method: 'create_item',
        params: {
          type: 'issues',
          title: 'Parent Issue',
          content: 'Main issue to be referenced',
          priority: 'high',
          status: 'Open',
          tags: ['parent', 'main']
        },
        saveAs: 'parentIssue'
      },
      {
        action: 'Create child issue with parent reference',
        method: 'create_item',
        params: {
          type: 'issues',
          title: 'Child Issue',
          content: 'References parent issue',
          priority: 'medium',
          status: 'Open',
          related_tasks: ['issues-{{parentIssue.id}}']
        },
        saveAs: 'childIssue'
      },
      {
        action: 'Create plan referencing both issues',
        method: 'create_item',
        params: {
          type: 'plans',
          title: 'Implementation Plan',
          content: 'Plan for both issues',
          status: 'Open',
          related_tasks: ['issues-{{parentIssue.id}}', 'issues-{{childIssue.id}}']
        },
        saveAs: 'plan'
      },
      {
        action: 'Create documentation',
        method: 'create_item',
        params: {
          type: 'docs',
          title: 'Implementation Guide',
          content: 'Documentation for the plan',
          related_documents: ['plans-{{plan.id}}']
        },
        saveAs: 'doc'
      },
      {
        action: 'Update plan with documentation reference',
        method: 'update_item',
        params: {
          type: 'plans',
          id: '{{plan.id}}',
          related_documents: ['docs-{{doc.id}}']
        }
      }
    ],
    expectedResults: [
      {
        field: 'childIssue.related_tasks',
        matcher: 'contains',
        value: 'issues-{{parentIssue.id}}'
      },
      {
        field: 'plan.related_tasks',
        matcher: 'length',
        value: 2
      }
    ]
  },
  {
    name: 'Bulk Operations Performance',
    description: '大量データ操作のパフォーマンステスト',
    steps: [
      {
        action: 'Create multiple issues',
        method: 'create_item',
        params: {
          type: 'issues',
          title: 'Bulk Issue 1',
          content: 'First bulk issue',
          priority: 'low',
          status: 'Open',
          tags: ['bulk', 'performance']
        },
        saveAs: 'bulkIssue1'
      },
      {
        action: 'Create multiple issues',
        method: 'create_item',
        params: {
          type: 'issues',
          title: 'Bulk Issue 2',
          content: 'Second bulk issue',
          priority: 'medium',
          status: 'Open',
          tags: ['bulk', 'performance']
        },
        saveAs: 'bulkIssue2'
      },
      {
        action: 'Create multiple issues',
        method: 'create_item',
        params: {
          type: 'issues',
          title: 'Bulk Issue 3',
          content: 'Third bulk issue',
          priority: 'high',
          status: 'Open',
          tags: ['bulk', 'performance']
        },
        saveAs: 'bulkIssue3'
      },
      {
        action: 'Search all bulk items by tag',
        method: 'search_items_by_tag',
        params: {
          tag: 'bulk'
        },
        saveAs: 'bulkSearchResults'
      },
      {
        action: 'Get all issues with closed status filter',
        method: 'get_items',
        params: {
          type: 'issues',
          includeClosedStatuses: false
        },
        saveAs: 'openIssues'
      }
    ],
    expectedResults: [
      {
        field: 'bulkSearchResults.data',
        matcher: 'length',
        value: 3
      },
      {
        field: 'openIssues.data',
        matcher: 'exists'
      }
    ]
  },
  {
    name: 'Error Recovery Workflow',
    description: 'エラー処理とリカバリーのテスト',
    steps: [
      {
        action: 'Try to create item with invalid type',
        method: 'create_item',
        params: {
          type: 'invalid_type',
          title: 'Should Fail',
          content: 'This should fail'
        },
        saveAs: 'errorResult'
      },
      {
        action: 'Create valid item after error',
        method: 'create_item',
        params: {
          type: 'issues',
          title: 'Recovery Issue',
          content: 'Created after error',
          priority: 'low',
          status: 'Open'
        },
        saveAs: 'recoveryIssue'
      },
      {
        action: 'Try to update non-existent item',
        method: 'update_item',
        params: {
          type: 'issues',
          id: 99999,
          title: 'Should Also Fail'
        },
        saveAs: 'updateError'
      },
      {
        action: 'Verify recovery issue exists',
        method: 'get_item_detail',
        params: {
          type: 'issues',
          id: '{{recoveryIssue.id}}'
        },
        saveAs: 'verifiedIssue'
      }
    ],
    expectedResults: [
      {
        field: 'recoveryIssue.id',
        matcher: 'exists'
      },
      {
        field: 'verifiedIssue.data.title',
        matcher: 'equals',
        value: 'Recovery Issue'
      }
    ]
  },
  {
    name: 'Session Date Handling',
    description: 'セッションの日付処理と検索のテスト',
    steps: [
      {
        action: 'Create session with specific datetime',
        method: 'create_session',
        params: {
          title: 'Past Session',
          content: 'Session from yesterday',
          datetime: '{{yesterday}}T10:30:00.000Z',
          tags: ['past', 'test']
        },
        saveAs: 'pastSession'
      },
      {
        action: 'Create today session',
        method: 'create_session',
        params: {
          title: 'Current Session',
          content: 'Session from today',
          tags: ['current', 'test']
        },
        saveAs: 'currentSession'
      },
      {
        action: 'Get sessions for date range',
        method: 'get_sessions',
        params: {
          start_date: '{{yesterday}}',
          end_date: '{{today}}'
        },
        saveAs: 'dateRangeSessions'
      },
      {
        action: 'Get latest session',
        method: 'get_latest_session',
        params: {},
        saveAs: 'latestSession'
      }
    ],
    expectedResults: [
      {
        field: 'dateRangeSessions',
        matcher: 'length',
        value: 2
      },
      {
        field: 'latestSession.title',
        matcher: 'equals',
        value: 'Current Session'
      }
    ]
  }
];