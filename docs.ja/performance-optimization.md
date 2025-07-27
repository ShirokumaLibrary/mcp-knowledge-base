# パフォーマンス最適化ガイド

## 概要

このガイドは、Shirokuma MCPナレッジベースのパフォーマンスを最適化するための戦略とテクニックを提供します。

## パフォーマンス目標

### レスポンスタイム目標

| 操作 | 目標時間 | 最大許容時間 |
|------|---------|-------------|
| 作成 | < 50ms | 100ms |
| 読取 | < 30ms | 50ms |
| 更新 | < 50ms | 100ms |
| 削除 | < 30ms | 50ms |
| リスト（100件） | < 100ms | 200ms |
| 検索 | < 200ms | 500ms |

### スループット目標

- 同時接続: 100+
- リクエスト/秒: 1000+
- データベース接続: 50

## 最適化戦略

### 1. キャッシング

#### メモリキャッシュ

```typescript
import { MemoryCache } from './utils/performance-utils.js';

// エンティティキャッシュ
const entityCache = new MemoryCache<Entity>({
  maxSize: 1000,
  ttl: 300000, // 5分
  onEvict: (key, value) => {
    logger.debug(`Cache evicted: ${key}`);
  }
});

// 使用例
async function getEntity(id: string): Promise<Entity> {
  // キャッシュチェック
  const cached = entityCache.get(id);
  if (cached) {
    return cached;
  }

  // データベースから取得
  const entity = await database.findById(id);
  
  // キャッシュに保存
  entityCache.set(id, entity);
  
  return entity;
}
```

#### クエリ結果キャッシュ

```typescript
const queryCache = new MemoryCache<QueryResult[]>({
  maxSize: 100,
  ttl: 60000, // 1分
  keyGenerator: (params) => generateQueryCacheKey(params)
});
```

### 2. バッチ処理

#### バッチプロセッサー

```typescript
import { BatchProcessor } from './utils/performance-utils.js';

const batchProcessor = new BatchProcessor<WriteOperation>({
  batchSize: 100,
  flushInterval: 1000, // 1秒
  processor: async (batch) => {
    await database.bulkWrite(batch);
  }
});

// 使用例
async function createMany(items: Item[]): Promise<void> {
  for (const item of items) {
    await batchProcessor.add({
      operation: 'insert',
      data: item
    });
  }
}
```

### 3. データベース最適化

#### インデックス戦略

```sql
-- 頻繁な検索フィールドにインデックス
CREATE INDEX idx_items_type ON items(type);
CREATE INDEX idx_items_status ON items(status_id);
CREATE INDEX idx_items_created ON items(created_at);

-- 複合インデックス
CREATE INDEX idx_items_type_status ON items(type, status_id);

-- 全文検索インデックス
CREATE VIRTUAL TABLE items_fts USING fts5(
  title, content, tokenize='porter unicode61'
);
```

#### クエリ最適化

```typescript
// 悪い例：N+1問題
const items = await getItems();
for (const item of items) {
  item.tags = await getTags(item.id); // N個のクエリ
}

// 良い例：JOINまたはバッチ取得
const items = await getItemsWithTags(); // 1個のクエリ
```

### 4. 接続プーリング

```typescript
import { DatabasePool } from './database/pool.js';

const pool = new DatabasePool({
  min: 5,
  max: 20,
  idleTimeout: 30000,
  acquireTimeout: 1000
});

// 使用例
async function withConnection<T>(
  fn: (conn: Connection) => Promise<T>
): Promise<T> {
  const conn = await pool.acquire();
  try {
    return await fn(conn);
  } finally {
    pool.release(conn);
  }
}
```

### 5. 非同期処理

#### 並列処理

```typescript
// 悪い例：順次処理
const result1 = await operation1();
const result2 = await operation2();
const result3 = await operation3();

// 良い例：並列処理
const [result1, result2, result3] = await Promise.all([
  operation1(),
  operation2(),
  operation3()
]);
```

#### ストリーミング

```typescript
// 大量データの処理
async function* streamLargeDataset(): AsyncGenerator<Item> {
  let offset = 0;
  const batchSize = 100;
  
  while (true) {
    const batch = await database.query({
      limit: batchSize,
      offset
    });
    
    if (batch.length === 0) break;
    
    for (const item of batch) {
      yield item;
    }
    
    offset += batchSize;
  }
}

// 使用例
for await (const item of streamLargeDataset()) {
  await processItem(item);
}
```

## パフォーマンス監視

### 1. パフォーマンスタイマー

```typescript
import { PerformanceTimer } from './utils/performance-utils.js';

const timer = new PerformanceTimer();

timer.start('database-query');
const result = await database.query(params);
const duration = timer.end('database-query');

logger.info(`Query completed in ${duration}ms`);
```

### 2. メトリクス収集

```typescript
interface PerformanceMetrics {
  requestCount: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
}

class MetricsCollector {
  private metrics: Map<string, number[]> = new Map();
  
  record(operation: string, duration: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    this.metrics.get(operation)!.push(duration);
  }
  
  getStats(operation: string): PerformanceMetrics {
    const durations = this.metrics.get(operation) || [];
    return calculateStats(durations);
  }
}
```

### 3. プロファイリング

```typescript
// CPUプロファイリング
import { performance } from 'perf_hooks';

function profile<T>(name: string, fn: () => T): T {
  const start = performance.now();
  try {
    return fn();
  } finally {
    const duration = performance.now() - start;
    logger.debug(`${name} took ${duration.toFixed(2)}ms`);
  }
}
```

## 最適化テクニック

### 1. 遅延読み込み

```typescript
class LazyLoader<T> {
  private value?: T;
  private loader: () => Promise<T>;
  
  constructor(loader: () => Promise<T>) {
    this.loader = loader;
  }
  
  async get(): Promise<T> {
    if (!this.value) {
      this.value = await this.loader();
    }
    return this.value;
  }
}
```

### 2. デバウンスとスロットル

```typescript
// デバウンス：最後の呼び出しから一定時間後に実行
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T {
  let timeoutId: NodeJS.Timeout;
  
  return ((...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
}

// スロットル：一定時間に1回のみ実行
function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): T {
  let inThrottle = false;
  
  return ((...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }) as T;
}
```

### 3. メモ化

```typescript
function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}
```

## ボトルネックの特定

### 1. 一般的なボトルネック

- **データベースクエリ**: インデックス不足、非効率なクエリ
- **メモリ使用**: メモリリーク、大きなオブジェクト
- **ネットワーク**: 過剰なラウンドトリップ
- **CPU**: 重い計算、非効率なアルゴリズム

### 2. 診断ツール

```bash
# Node.jsプロファイラー
node --prof app.js
node --prof-process isolate-*.log > profile.txt

# メモリ使用量
node --expose-gc --trace-gc app.js

# イベントループ監視
node --trace-event-categories v8,node app.js
```

## パフォーマンスチューニング

### 1. Node.js設定

```bash
# メモリ制限を増やす
node --max-old-space-size=4096 app.js

# GCを最適化
node --optimize-for-size app.js
```

### 2. データベースチューニング

```sql
-- SQLite設定
PRAGMA cache_size = 10000;
PRAGMA temp_store = MEMORY;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
```

### 3. 環境変数

```bash
# パフォーマンス関連の環境変数
NODE_ENV=production
UV_THREADPOOL_SIZE=16
CACHE_ENABLED=true
CACHE_TTL=300000
BATCH_SIZE=100
CONNECTION_POOL_SIZE=20
```

## ベストプラクティス

1. **測定してから最適化**: 推測ではなくデータに基づいて最適化
2. **漸進的改善**: 一度に全てを最適化しない
3. **トレードオフを理解**: パフォーマンスvs可読性vs保守性
4. **キャッシュの無効化**: キャッシュは難しい、慎重に設計
5. **監視の継続**: パフォーマンスは継続的な取り組み

## トラブルシューティング

### メモリリーク

```typescript
// ヒープスナップショットを取得
import v8 from 'v8';
import fs from 'fs';

function takeHeapSnapshot(filename: string): void {
  const snapshot = v8.writeHeapSnapshot();
  fs.renameSync(snapshot, filename);
}

// 定期的にスナップショットを取得
setInterval(() => {
  takeHeapSnapshot(`heap-${Date.now()}.heapsnapshot`);
}, 60000);
```

### スロークエリ

```typescript
// クエリログを有効化
database.on('query', (query, duration) => {
  if (duration > 100) {
    logger.warn('Slow query detected', { query, duration });
  }
});
```