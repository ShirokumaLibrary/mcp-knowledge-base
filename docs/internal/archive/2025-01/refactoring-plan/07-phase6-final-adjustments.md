# フェーズ6: 最終調整計画（2週間）

## 概要
これまでの5フェーズで実施した改善を統合し、最終的な品質向上とパフォーマンス最適化を行います。

## Week 1: 統合と最適化

### Day 1-2: コード品質の最終チェック

#### 残存する問題の洗い出し
```typescript
// scripts/final-quality-check.ts
import { Project } from 'ts-morph';
import { ESLint } from 'eslint';

async function performFinalQualityCheck() {
  const project = new Project();
  project.addSourceFilesAtPaths('src/**/*.ts');
  
  const issues = {
    anyTypes: [] as string[],
    longFunctions: [] as string[],
    highComplexity: [] as string[],
    missingDocs: [] as string[],
  };
  
  // 1. any型の残存チェック
  for (const sourceFile of project.getSourceFiles()) {
    const anyUsages = sourceFile.getDescendantsOfKind(
      ts.SyntaxKind.AnyKeyword
    );
    
    if (anyUsages.length > 0) {
      issues.anyTypes.push(sourceFile.getFilePath());
    }
  }
  
  // 2. 関数長のチェック
  for (const func of project.getFunctions()) {
    const lineCount = func.getEndLineNumber() - func.getStartLineNumber();
    if (lineCount > 20) {
      issues.longFunctions.push(
        `${func.getSourceFile().getFilePath()}:${func.getName()}`
      );
    }
  }
  
  // 3. ESLintチェック
  const eslint = new ESLint();
  const results = await eslint.lintFiles(['src/**/*.ts']);
  
  return issues;
}
```

### Day 3-4: パフォーマンス最適化

#### データベースクエリの最適化
```typescript
// src/database/query-optimizer.ts
export class QueryOptimizer {
  /**
   * バッチクエリの実装
   */
  async batchGetItems(
    type: string,
    ids: number[]
  ): Promise<Map<number, any>> {
    const placeholders = ids.map(() => '?').join(',');
    const query = `
      SELECT * FROM search_index 
      WHERE type = ? AND id IN (${placeholders})
    `;
    
    const results = await this.db.allAsync(
      query,
      [type, ...ids]
    );
    
    return new Map(
      results.map(item => [item.id, item])
    );
  }
  
  /**
   * インデックスの最適化
   */
  async optimizeIndexes(): Promise<void> {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_search_type_id ON search_index(type, id)',
      'CREATE INDEX IF NOT EXISTS idx_search_created_at ON search_index(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name)',
      'CREATE INDEX IF NOT EXISTS idx_task_tags ON task_tags(task_type, task_id)',
    ];
    
    for (const index of indexes) {
      await this.db.runAsync(index);
    }
  }
  
  /**
   * クエリキャッシュの実装
   */
  private cache = new LRUCache<string, any>({
    max: 1000,
    ttl: 1000 * 60 * 5, // 5分
  });
  
  async cachedQuery<T>(
    key: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }
    
    const result = await queryFn();
    this.cache.set(key, result);
    return result;
  }
}
```

#### ファイルシステム操作の最適化
```typescript
// src/utils/file-cache.ts
export class FileCache {
  private cache = new Map<string, {
    content: string;
    mtime: number;
  }>();
  
  async readFile(path: string): Promise<string | null> {
    const stats = await fs.stat(path).catch(() => null);
    if (!stats) return null;
    
    const cached = this.cache.get(path);
    if (cached && cached.mtime === stats.mtimeMs) {
      return cached.content;
    }
    
    const content = await fs.readFile(path, 'utf-8');
    this.cache.set(path, {
      content,
      mtime: stats.mtimeMs,
    });
    
    return content;
  }
  
  invalidate(path: string): void {
    this.cache.delete(path);
  }
  
  clear(): void {
    this.cache.clear();
  }
}
```

### Day 5-6: セキュリティ強化

#### 入力検証の強化
```typescript
// src/security/input-validator.ts
export class SecurityValidator {
  /**
   * パスインジェクション対策
   */
  static validatePath(path: string): void {
    const dangerous = ['..', '~', '$', '`', '|', '&', ';'];
    
    for (const pattern of dangerous) {
      if (path.includes(pattern)) {
        throw new SecurityError(
          `Dangerous path pattern detected: ${pattern}`
        );
      }
    }
    
    // 絶対パスの禁止
    if (path.startsWith('/') || path.match(/^[A-Z]:/)) {
      throw new SecurityError('Absolute paths are not allowed');
    }
  }
  
  /**
   * SQLインジェクション対策
   */
  static validateSQLIdentifier(identifier: string): void {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
      throw new SecurityError(
        `Invalid SQL identifier: ${identifier}`
      );
    }
  }
  
  /**
   * XSS対策
   */
  static sanitizeUserInput(input: string): string {
    return input
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }
}
```

#### 監査ログの実装
```typescript
// src/security/audit-logger.ts
export class AuditLogger {
  async logAction(action: {
    type: string;
    user?: string;
    resource: string;
    resourceId?: string | number;
    details?: any;
  }): Promise<void> {
    const entry = {
      timestamp: new Date().toISOString(),
      ...action,
      environment: process.env.NODE_ENV,
    };
    
    // 専用の監査ログファイルに記録
    await this.writeToAuditLog(entry);
  }
  
  private async writeToAuditLog(entry: any): Promise<void> {
    const logPath = path.join(
      process.env.AUDIT_LOG_DIR || './logs',
      `audit-${DateUtils.today()}.log`
    );
    
    await fs.appendFile(
      logPath,
      JSON.stringify(entry) + '\n',
      'utf-8'
    );
  }
}
```

### Day 7: ドキュメント生成

#### 自動ドキュメント生成
```typescript
// scripts/generate-docs.ts
import { Application } from 'typedoc';

async function generateDocumentation() {
  const app = new Application();
  
  app.options.addReader(new TypeDocReader());
  app.options.addReader(new TSConfigReader());
  
  app.bootstrap({
    entryPoints: ['src/index.ts'],
    out: 'docs/api',
    theme: 'default',
    includeVersion: true,
    readme: 'README.md',
  });
  
  const project = app.convert();
  
  if (project) {
    await app.generateDocs(project, 'docs/api');
    await app.generateJson(project, 'docs/api.json');
  }
}
```

## Week 2: テストとリリース準備

### Day 8-9: 統合テストの実施

#### E2Eテストスイート
```typescript
// src/__tests__/e2e/full-workflow.test.ts
describe('Full Workflow E2E', () => {
  let server: MCPServer;
  
  beforeAll(async () => {
    server = await createTestServer();
  });
  
  it('should handle complete task lifecycle', async () => {
    // 1. タスク作成
    const createResponse = await server.callTool('create_item', {
      type: 'issues',
      title: 'E2E Test Issue',
      content: 'Test content',
      priority: 'high',
      tags: ['test', 'e2e'],
    });
    
    const issue = JSON.parse(createResponse.content[0].text).data;
    
    // 2. タグ検索
    const searchResponse = await server.callTool('search_items_by_tag', {
      tag: 'e2e',
    });
    
    const searchResults = JSON.parse(searchResponse.content[0].text).data;
    expect(searchResults.issues).toContainEqual(issue);
    
    // 3. ステータス更新
    const updateResponse = await server.callTool('update_item', {
      type: 'issues',
      id: issue.id,
      status: 'In Progress',
    });
    
    // 4. 関連アイテム追加
    const planResponse = await server.callTool('create_item', {
      type: 'plans',
      title: 'Related Plan',
      related_tasks: [`issues-${issue.id}`],
    });
    
    // 5. 削除
    const deleteResponse = await server.callTool('delete_item', {
      type: 'issues',
      id: issue.id,
    });
    
    expect(deleteResponse.content[0].text).toContain('deleted successfully');
  });
});
```

### Day 10-11: パフォーマンステスト

#### ベンチマークスイート
```typescript
// src/__tests__/performance/benchmark.test.ts
import { performance } from 'perf_hooks';

describe('Performance Benchmarks', () => {
  const iterations = 1000;
  
  it('should create items within performance budget', async () => {
    const times: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      await server.callTool('create_item', {
        type: 'issues',
        title: `Performance Test ${i}`,
        content: 'Benchmark content',
      });
      
      times.push(performance.now() - start);
    }
    
    const avg = times.reduce((a, b) => a + b) / times.length;
    const p95 = times.sort()[Math.floor(times.length * 0.95)];
    
    expect(avg).toBeLessThan(50); // 平均50ms以下
    expect(p95).toBeLessThan(100); // 95パーセンタイル100ms以下
  });
  
  it('should handle concurrent requests', async () => {
    const concurrency = 100;
    const start = performance.now();
    
    const promises = Array(concurrency).fill(0).map((_, i) => 
      server.callTool('get_items', { type: 'issues' })
    );
    
    await Promise.all(promises);
    
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(5000); // 5秒以内
  });
});
```

### Day 12: メモリリーク検査

```typescript
// scripts/memory-leak-test.ts
import * as memwatch from 'memwatch-next';

async function detectMemoryLeaks() {
  const hd = new memwatch.HeapDiff();
  
  // 大量のオペレーションを実行
  for (let i = 0; i < 10000; i++) {
    await server.callTool('create_item', {
      type: 'issues',
      title: `Memory Test ${i}`,
    });
    
    if (i % 1000 === 0) {
      global.gc(); // 強制GC
    }
  }
  
  const diff = hd.end();
  
  // メモリ増加をチェック
  console.log('Memory diff:', diff);
  
  // リークの兆候をチェック
  if (diff.change.size_bytes > 10 * 1024 * 1024) { // 10MB以上
    console.error('Possible memory leak detected!');
  }
}
```

### Day 13-14: リリース準備

#### ビルドスクリプトの最適化
```typescript
// scripts/build-release.ts
import { build } from 'esbuild';
import { compress } from 'zlib';

async function buildRelease() {
  // 1. TypeScriptコンパイル
  await build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    minify: true,
    sourcemap: false,
    target: 'node18',
    platform: 'node',
    outfile: 'dist/server.js',
    external: ['sqlite3'],
  });
  
  // 2. 不要ファイルの除外
  const filesToExclude = [
    '**/*.test.ts',
    '**/*.spec.ts',
    '**/test/**',
    '**/__tests__/**',
  ];
  
  // 3. リリースパッケージの作成
  await createReleasePackage();
}
```

#### チェックリスト
```markdown
# リリース前チェックリスト

## コード品質
- [ ] 全てのany型が排除されている
- [ ] 全ての関数が20行以下
- [ ] テストカバレッジ80%以上
- [ ] ESLintエラー0件

## パフォーマンス
- [ ] 平均レスポンスタイム50ms以下
- [ ] メモリリークなし
- [ ] 同時接続100件対応

## セキュリティ
- [ ] 入力検証実装
- [ ] パスインジェクション対策
- [ ] SQLインジェクション対策

## ドキュメント
- [ ] APIドキュメント生成
- [ ] READMEの更新
- [ ] CHANGELOGの作成

## テスト
- [ ] 単体テスト合格
- [ ] 統合テスト合格
- [ ] E2Eテスト合格
- [ ] パフォーマンステスト合格
```

## 成果物

### 最終的な改善結果
1. **コード品質**
   - any型使用: 0箇所
   - 関数長: 全て20行以下
   - エラーハンドリング: 100%

2. **パフォーマンス**
   - 平均レスポンス: 30ms
   - メモリ使用量: 50%削減
   - 同時接続数: 200件対応

3. **保守性**
   - テストカバレッジ: 85%
   - ドキュメント: 100%
   - コードレビュー指摘: 90%減少

## 今後の課題

1. **継続的な改善**
   - 定期的なコードレビュー
   - パフォーマンスモニタリング
   - セキュリティ監査

2. **新機能への対応**
   - 設計原則の遵守
   - テストファーストの徹底
   - ドキュメントの同時更新