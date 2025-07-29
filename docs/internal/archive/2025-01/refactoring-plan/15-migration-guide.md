# マイグレーションガイド

## 概要
既存のコードベースを新しいアーキテクチャに段階的に移行するための包括的なガイドです。
ダウンタイムを最小限に抑えながら、安全に移行を実施します。

## 移行戦略

### 基本原則
1. **段階的移行** - 一度に全てを変更しない
2. **後方互換性** - 既存のAPIを維持
3. **ロールバック可能** - 各段階で元に戻せる
4. **継続的検証** - 各ステップでテスト実施

## フェーズ別移行計画

### Phase 0: 準備（1週間）

#### 1. 現状の把握
```bash
# 依存関係の分析
npm run analyze-dependencies

# コードメトリクスの収集
npm run collect-metrics

# テストカバレッジの確認
npm run test:coverage
```

#### 2. バックアップの作成
```typescript
// scripts/backup-before-migration.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function createBackup() {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  
  // コードのバックアップ
  await execAsync(`git tag backup-${timestamp}`);
  await execAsync(`git push origin backup-${timestamp}`);
  
  // データベースのバックアップ
  await execAsync(`cp database/search.db database/backup-${timestamp}.db`);
  
  // 設定ファイルのバックアップ
  await execAsync(`tar -czf backup/config-${timestamp}.tar.gz config/`);
  
  console.log(`Backup created: backup-${timestamp}`);
}
```

### Phase 1: 型安全性の改善（2週間）

#### 移行スクリプト
```typescript
// scripts/migrate-types.ts
import { Project, TypeGuards } from 'ts-morph';

async function migrateTypes() {
  const project = new Project({
    tsConfigFilePath: './tsconfig.json',
  });
  
  // Step 1: any型の検出と置換
  const sourceFiles = project.getSourceFiles();
  
  for (const file of sourceFiles) {
    // any型を unknown に置換
    file.getDescendantsOfKind(ts.SyntaxKind.AnyKeyword)
      .forEach(node => {
        // コンテキストに応じて適切な型に置換
        const parent = node.getParent();
        if (TypeGuards.isParameter(parent)) {
          // パラメータの場合は具体的な型を推論
          node.replaceWithText('unknown');
        }
      });
    
    // 型アサーションの除去
    file.getDescendantsOfKind(ts.SyntaxKind.AsExpression)
      .forEach(node => {
        // 不要な型アサーションを除去
        const type = node.getType();
        if (type.isAny()) {
          node.replaceWithText(node.getExpression().getText());
        }
      });
  }
  
  await project.save();
}
```

#### 段階的な適用
```typescript
// 1. 新しい型定義の追加（既存を変更せず）
// src/types/improved-types.ts
export interface TaskV2 extends Task {
  _version: 2;
  metadata?: {
    createdBy?: string;
    lastModifiedBy?: string;
  };
}

// 2. アダプターパターンで互換性維持
// src/adapters/task-adapter.ts
export class TaskAdapter {
  static toV2(v1Task: Task): TaskV2 {
    return {
      ...v1Task,
      _version: 2,
      metadata: {},
    };
  }
  
  static toV1(v2Task: TaskV2): Task {
    const { _version, metadata, ...v1Task } = v2Task;
    return v1Task;
  }
}
```

### Phase 2: アーキテクチャの改善（3週間）

#### 1. DIコンテナの段階的導入

```typescript
// src/migration/di-migration.ts
import { Container } from 'inversify';

export class MigrationContainer {
  private container: Container;
  private useDI: boolean = false;
  
  constructor() {
    this.container = new Container();
    this.setupBindings();
  }
  
  // 既存のコードとの互換性を保つファクトリ
  createFileIssueDatabase(dbPath: string): FileIssueDatabase {
    if (this.useDI) {
      // 新しいDIベースの実装
      return this.container.get<FileIssueDatabase>(TYPES.Database);
    } else {
      // 既存の実装
      return new FileIssueDatabase(dbPath);
    }
  }
  
  // 段階的にDIを有効化
  enableDI(feature: string): void {
    console.log(`Enabling DI for feature: ${feature}`);
    this.useDI = true;
  }
}
```

#### 2. リポジトリ層の移行

```typescript
// src/migration/repository-migration.ts
export class RepositoryMigration {
  /**
   * 既存のFileIssueDatabaseを新しいアーキテクチャに移行
   */
  static async migrate(oldDb: FileIssueDatabase): Promise<DataService> {
    // 1. 新しいコンポーネントの初期化
    const dbManager = new DatabaseManager({
      path: oldDb.getDbPath(),
    });
    
    const repoFactory = new RepositoryFactory(dbManager, config);
    const eventBus = new EventBus();
    const dataService = new DataService(repoFactory, eventBus);
    
    // 2. データの検証
    await this.validateDataIntegrity(oldDb, dataService);
    
    // 3. 移行完了
    return dataService;
  }
  
  private static async validateDataIntegrity(
    oldDb: FileIssueDatabase,
    newService: DataService
  ): Promise<void> {
    // 全ステータスの比較
    const oldStatuses = await oldDb.getAllStatuses();
    const newStatuses = await newService.getAllStatuses();
    
    if (!this.compareArrays(oldStatuses, newStatuses)) {
      throw new Error('Status data mismatch after migration');
    }
    
    // サンプルデータの比較
    const sampleIds = [1, 10, 100];
    for (const id of sampleIds) {
      const oldTask = await oldDb.getTask('issues', id);
      const newTask = await newService.getTask('issues', id);
      
      if (JSON.stringify(oldTask) !== JSON.stringify(newTask)) {
        throw new Error(`Task ${id} data mismatch after migration`);
      }
    }
  }
}
```

### Phase 3: エラーハンドリングの改善（2週間）

#### カスタムエラークラスへの移行

```typescript
// src/migration/error-migration.ts
export class ErrorMigration {
  /**
   * 既存のエラーハンドリングを新しいパターンに移行
   */
  static migrateErrorHandling(code: string): string {
    // try-catchパターンの検出と置換
    const tryBlockRegex = /try\s*{([^}]+)}\s*catch\s*\((\w+)\)\s*{([^}]+)}/g;
    
    return code.replace(tryBlockRegex, (match, tryBody, errorVar, catchBody) => {
      // console.logをloggerに置換
      catchBody = catchBody.replace(
        /console\.(log|error)\(/g,
        'this.logger.error('
      );
      
      // エラーを適切なカスタムエラーに変換
      return `try {${tryBody}} catch (${errorVar}) {
        const baseError = this.errorHandler.normalize(${errorVar});
        ${catchBody}
        throw baseError;
      }`;
    });
  }
}
```

#### 段階的なエラーハンドリング改善

```typescript
// 1. 既存のメソッドをラップ
export class SafeWrapper {
  static wrapAsync<T extends (...args: any[]) => Promise<any>>(
    method: T,
    context: string
  ): T {
    return (async (...args: Parameters<T>) => {
      try {
        return await method(...args);
      } catch (error) {
        // 既存のエラーを新しいエラークラスに変換
        if (error instanceof Error) {
          if (error.message.includes('ENOENT')) {
            throw new FileNotFoundError(context, error.message);
          }
          if (error.message.includes('SQLITE_')) {
            throw new DatabaseError(context, error.message);
          }
        }
        throw new InternalError(context, error);
      }
    }) as T;
  }
}

// 2. 使用例
class TaskRepository {
  // 既存のメソッド
  async getTask(type: string, id: number): Promise<Task | null> {
    // 既存の実装
  }
  
  // ラップされたメソッド
  getTaskSafe = SafeWrapper.wrapAsync(
    this.getTask.bind(this),
    'TaskRepository.getTask'
  );
}
```

### Phase 4: パフォーマンス最適化（2週間）

#### 1. 計測とベンチマーク

```typescript
// src/migration/performance-benchmark.ts
export class PerformanceBenchmark {
  private metrics: Map<string, number[]> = new Map();
  
  async measureBefore(operation: string, fn: () => Promise<any>): Promise<any> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    
    const key = `before_${operation}`;
    const metrics = this.metrics.get(key) || [];
    metrics.push(duration);
    this.metrics.set(key, metrics);
    
    return result;
  }
  
  async measureAfter(operation: string, fn: () => Promise<any>): Promise<any> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    
    const key = `after_${operation}`;
    const metrics = this.metrics.get(key) || [];
    metrics.push(duration);
    this.metrics.set(key, metrics);
    
    return result;
  }
  
  generateReport(): PerformanceReport {
    const report: PerformanceReport = {};
    
    for (const [key, values] of this.metrics) {
      const avg = values.reduce((a, b) => a + b) / values.length;
      const p95 = values.sort()[Math.floor(values.length * 0.95)];
      
      report[key] = {
        average: avg,
        p95: p95,
        samples: values.length,
      };
    }
    
    return report;
  }
}
```

#### 2. 最適化の適用

```typescript
// キャッシュの導入
export class CachedRepository extends BaseRepository {
  private cache: LRUCache<string, any>;
  
  constructor(options: RepositoryOptions) {
    super(options);
    this.cache = new LRUCache({
      max: 1000,
      ttl: 1000 * 60 * 5, // 5分
    });
  }
  
  async getTask(type: string, id: number): Promise<Task | null> {
    const key = `${type}-${id}`;
    
    // キャッシュチェック
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }
    
    // 既存の実装を呼び出し
    const task = await super.getTask(type, id);
    
    // キャッシュに保存
    if (task) {
      this.cache.set(key, task);
    }
    
    return task;
  }
}
```

## 移行チェックリスト

### 各フェーズ共通
- [ ] バックアップの作成
- [ ] テストの実行（移行前）
- [ ] 移行スクリプトの実行
- [ ] テストの実行（移行後）
- [ ] パフォーマンスの確認
- [ ] ロールバック手順の確認

### Phase 1: 型安全性
- [ ] any型の排除
- [ ] 型アサーションの削減
- [ ] strictモードの有効化
- [ ] 型定義ファイルの作成

### Phase 2: アーキテクチャ
- [ ] DIコンテナの設定
- [ ] インターフェースの定義
- [ ] リポジトリの分割
- [ ] サービス層の実装

### Phase 3: エラーハンドリング
- [ ] カスタムエラークラスの作成
- [ ] try-catchの適切な配置
- [ ] エラーログの改善
- [ ] リトライ機構の実装

### Phase 4: 最適化
- [ ] ベンチマークの実施
- [ ] キャッシュの導入
- [ ] クエリの最適化
- [ ] インデックスの追加

## トラブルシューティング

### 問題: 型エラーが大量に発生
```typescript
// 一時的な回避策
// @ts-ignore コメントを追加（後で修正）
// @ts-ignore
const result = someFunction(args);

// 段階的に修正
const result = someFunction(args as any); // TODO: 正しい型を定義
```

### 問題: DIコンテナの初期化エラー
```typescript
// デバッグモードで詳細を確認
const container = new Container();
container.options.defaultScope = 'Singleton';
container.options.autoBindInjectable = true;
container.options.skipBaseClassChecks = true;
```

### 問題: パフォーマンスの劣化
```typescript
// プロファイリングの実施
import * as profiler from 'v8-profiler-next';

profiler.startProfiling('Migration', true);
// 処理実行
profiler.stopProfiling('Migration');
```

## ロールバック手順

### 即座のロールバック
```bash
# Gitでの復元
git checkout backup-<timestamp>

# データベースの復元
cp database/backup-<timestamp>.db database/search.db

# 依存関係の復元
npm ci
```

### 部分的なロールバック
```typescript
// フィーチャーフラグでの制御
if (process.env.USE_NEW_ARCHITECTURE === 'true') {
  // 新しい実装
} else {
  // 既存の実装
}
```

## 移行完了後の作業

1. **クリーンアップ**
   - 古いコードの削除
   - 不要な依存関係の削除
   - デッドコードの除去

2. **ドキュメント更新**
   - APIドキュメント
   - アーキテクチャ図
   - READMEファイル

3. **チーム教育**
   - 新しいパターンの説明
   - ベストプラクティスの共有
   - コードレビューガイドライン