# パフォーマンス最適化計画

## 概要
MCP Knowledge Baseのパフォーマンスを体系的に分析し、ボトルネックを特定して最適化を実施します。
レスポンスタイムの短縮、スループットの向上、リソース使用効率の改善を目指します。

## 現状分析

### パフォーマンスボトルネック
1. **ファイルI/O** - 同期的な読み書きが多い
2. **データベースクエリ** - N+1問題、インデックス不足
3. **メモリ使用** - 大量のファイル内容を保持
4. **同期処理** - Markdown → SQLiteの重複処理
5. **検索性能** - 全文検索の非効率性

### 測定基準
- **レスポンスタイム**: 平均100ms以上
- **スループット**: 100req/s以下
- **メモリ使用量**: 起動時200MB以上
- **CPU使用率**: アイドル時10%以上

## 最適化戦略

### 1. ファイルI/O最適化

#### バッチ読み込みの実装
```typescript
// src/optimizations/batch-file-reader.ts
export class BatchFileReader {
  private queue: Map<string, Promise<string | null>> = new Map();
  private batchSize = 10;
  private batchDelay = 10; // ms
  private pendingReads: Array<{
    path: string;
    resolve: (value: string | null) => void;
    reject: (error: any) => void;
  }> = [];
  private batchTimer: NodeJS.Timeout | null = null;
  
  async read(path: string): Promise<string | null> {
    // 既にキューにある場合は既存のPromiseを返す
    const existing = this.queue.get(path);
    if (existing) {
      return existing;
    }
    
    // 新しいPromiseを作成してキューに追加
    const promise = new Promise<string | null>((resolve, reject) => {
      this.pendingReads.push({ path, resolve, reject });
      
      // バッチ処理をスケジュール
      if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => this.processBatch(), this.batchDelay);
      }
    });
    
    this.queue.set(path, promise);
    return promise;
  }
  
  private async processBatch(): Promise<void> {
    const batch = this.pendingReads.splice(0, this.batchSize);
    this.batchTimer = null;
    
    // 並列読み込み
    const results = await Promise.allSettled(
      batch.map(({ path }) => fs.readFile(path, 'utf-8').catch(() => null))
    );
    
    // 結果を各Promiseに配信
    batch.forEach(({ path, resolve, reject }, index) => {
      const result = results[index];
      if (result.status === 'fulfilled') {
        resolve(result.value);
      } else {
        reject(result.reason);
      }
      
      // キューから削除
      this.queue.delete(path);
    });
    
    // 残りがあれば次のバッチをスケジュール
    if (this.pendingReads.length > 0) {
      this.batchTimer = setTimeout(() => this.processBatch(), this.batchDelay);
    }
  }
}
```

#### 非同期ストリーミング
```typescript
// src/optimizations/streaming-writer.ts
import { pipeline } from 'stream/promises';
import { createReadStream, createWriteStream } from 'fs';

export class StreamingWriter {
  /**
   * 大きなファイルの効率的な書き込み
   */
  async writeStream(path: string, content: AsyncIterable<string>): Promise<void> {
    const writeStream = createWriteStream(path, { encoding: 'utf-8' });
    
    try {
      for await (const chunk of content) {
        if (!writeStream.write(chunk)) {
          // バックプレッシャーの処理
          await new Promise(resolve => writeStream.once('drain', resolve));
        }
      }
      
      writeStream.end();
      await new Promise((resolve, reject) => {
        writeStream.once('finish', resolve);
        writeStream.once('error', reject);
      });
    } catch (error) {
      writeStream.destroy();
      throw error;
    }
  }
  
  /**
   * ファイルの効率的なコピー
   */
  async copyFile(source: string, destination: string): Promise<void> {
    await pipeline(
      createReadStream(source),
      createWriteStream(destination)
    );
  }
}
```

### 2. データベース最適化

#### コネクションプーリング
```typescript
// src/optimizations/db-connection-pool.ts
export class DatabaseConnectionPool {
  private connections: Database[] = [];
  private available: Database[] = [];
  private waitQueue: Array<(db: Database) => void> = [];
  
  constructor(
    private config: {
      path: string;
      minConnections: number;
      maxConnections: number;
    }
  ) {}
  
  async initialize(): Promise<void> {
    // 最小接続数を事前に作成
    for (let i = 0; i < this.config.minConnections; i++) {
      const db = await this.createConnection();
      this.connections.push(db);
      this.available.push(db);
    }
  }
  
  async acquire(): Promise<Database> {
    // 利用可能な接続がある場合
    if (this.available.length > 0) {
      return this.available.pop()!;
    }
    
    // 最大接続数に達していない場合は新規作成
    if (this.connections.length < this.config.maxConnections) {
      const db = await this.createConnection();
      this.connections.push(db);
      return db;
    }
    
    // 接続が空くまで待機
    return new Promise(resolve => {
      this.waitQueue.push(resolve);
    });
  }
  
  release(db: Database): void {
    // 待機中のリクエストがある場合
    if (this.waitQueue.length > 0) {
      const waiter = this.waitQueue.shift()!;
      waiter(db);
    } else {
      this.available.push(db);
    }
  }
  
  async withConnection<T>(fn: (db: Database) => Promise<T>): Promise<T> {
    const db = await this.acquire();
    try {
      return await fn(db);
    } finally {
      this.release(db);
    }
  }
  
  private async createConnection(): Promise<Database> {
    const db = new Database(this.config.path);
    await db.exec('PRAGMA busy_timeout = 5000');
    await db.exec('PRAGMA journal_mode = WAL');
    await db.exec('PRAGMA synchronous = NORMAL');
    return db;
  }
}
```

#### クエリ最適化
```typescript
// src/optimizations/query-optimizer.ts
export class QueryOptimizer {
  /**
   * N+1問題の解決 - 関連データの一括取得
   */
  async getTasksWithRelations(
    type: string,
    ids: number[]
  ): Promise<Map<number, TaskWithRelations>> {
    // 1. メインデータの取得（1クエリ）
    const tasksQuery = `
      SELECT * FROM search_tasks 
      WHERE type = ? AND id IN (${ids.map(() => '?').join(',')})
    `;
    const tasks = await this.db.allAsync(tasksQuery, [type, ...ids]);
    
    // 2. タグの一括取得（1クエリ）
    const tagsQuery = `
      SELECT tt.task_id, t.name 
      FROM task_tags tt
      JOIN tags t ON tt.tag_id = t.id
      WHERE tt.task_type = ? AND tt.task_id IN (${ids.map(() => '?').join(',')})
    `;
    const tags = await this.db.allAsync(tagsQuery, [type, ...ids]);
    
    // 3. 関連タスクの一括取得（1クエリ）
    const relatedTasksQuery = `
      SELECT source_id, target_type, target_id
      FROM related_tasks
      WHERE source_type = ? AND source_id IN (${ids.map(() => '?').join(',')})
    `;
    const relatedTasks = await this.db.allAsync(relatedTasksQuery, [type, ...ids]);
    
    // 4. データの結合
    const result = new Map<number, TaskWithRelations>();
    
    for (const task of tasks) {
      result.set(task.id, {
        ...task,
        tags: tags.filter(t => t.task_id === task.id).map(t => t.name),
        related_tasks: relatedTasks
          .filter(r => r.source_id === task.id)
          .map(r => `${r.target_type}-${r.target_id}`),
      });
    }
    
    return result;
  }
  
  /**
   * インデックスの最適化
   */
  async createOptimalIndexes(): Promise<void> {
    const indexes = [
      // 複合インデックス
      'CREATE INDEX IF NOT EXISTS idx_search_tasks_type_status ON search_tasks(type, status_id)',
      'CREATE INDEX IF NOT EXISTS idx_search_tasks_type_created ON search_tasks(type, created_at DESC)',
      
      // カバリングインデックス
      'CREATE INDEX IF NOT EXISTS idx_task_tags_covering ON task_tags(task_type, task_id, tag_id)',
      
      // 部分インデックス
      'CREATE INDEX IF NOT EXISTS idx_search_tasks_open ON search_tasks(type, id) WHERE status_id IN (1, 2, 3)',
    ];
    
    for (const index of indexes) {
      await this.db.execAsync(index);
    }
    
    // 統計情報の更新
    await this.db.execAsync('ANALYZE');
  }
}
```

### 3. メモリ最適化

#### オブジェクトプーリング
```typescript
// src/optimizations/object-pool.ts
export class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: (obj: T) => void;
  private maxSize: number;
  
  constructor(options: {
    create: () => T;
    reset: (obj: T) => void;
    maxSize?: number;
  }) {
    this.createFn = options.create;
    this.resetFn = options.reset;
    this.maxSize = options.maxSize || 100;
  }
  
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.createFn();
  }
  
  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.resetFn(obj);
      this.pool.push(obj);
    }
  }
}

// 使用例：Markdownパーサーのプーリング
const parserPool = new ObjectPool({
  create: () => new MarkdownParser(),
  reset: (parser) => parser.reset(),
  maxSize: 10,
});
```

#### メモリ効率的なキャッシュ
```typescript
// src/optimizations/memory-cache.ts
export class MemoryEfficientCache<K, V> {
  private cache = new Map<K, CacheEntry<V>>();
  private accessOrder: K[] = [];
  private totalSize = 0;
  
  constructor(
    private options: {
      maxSize: number; // バイト単位
      sizeOf: (value: V) => number;
      ttl?: number;
    }
  ) {}
  
  set(key: K, value: V): void {
    const size = this.options.sizeOf(value);
    
    // 既存エントリの削除
    if (this.cache.has(key)) {
      this.delete(key);
    }
    
    // サイズ制限チェック
    while (this.totalSize + size > this.options.maxSize && this.accessOrder.length > 0) {
      const lru = this.accessOrder.shift()!;
      this.delete(lru);
    }
    
    // 新規エントリの追加
    this.cache.set(key, {
      value,
      size,
      timestamp: Date.now(),
    });
    this.accessOrder.push(key);
    this.totalSize += size;
  }
  
  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    
    // TTLチェック
    if (this.options.ttl && Date.now() - entry.timestamp > this.options.ttl) {
      this.delete(key);
      return undefined;
    }
    
    // アクセス順序の更新（LRU）
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
      this.accessOrder.push(key);
    }
    
    return entry.value;
  }
  
  private delete(key: K): void {
    const entry = this.cache.get(key);
    if (entry) {
      this.cache.delete(key);
      this.totalSize -= entry.size;
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
    }
  }
}

interface CacheEntry<V> {
  value: V;
  size: number;
  timestamp: number;
}
```

### 4. 検索性能の最適化

#### 全文検索の改善
```typescript
// src/optimizations/search-optimizer.ts
export class SearchOptimizer {
  /**
   * FTS5を使用した高速全文検索
   */
  async initializeFTS(): Promise<void> {
    // FTS5テーブルの作成
    await this.db.execAsync(`
      CREATE VIRTUAL TABLE IF NOT EXISTS search_fts USING fts5(
        type,
        id,
        title,
        content,
        tags,
        tokenize = 'porter unicode61'
      )
    `);
    
    // トリガーで自動同期
    await this.db.execAsync(`
      CREATE TRIGGER IF NOT EXISTS search_fts_insert
      AFTER INSERT ON search_index
      BEGIN
        INSERT INTO search_fts(type, id, title, content, tags)
        VALUES (NEW.type, NEW.id, NEW.title, NEW.content, NEW.tags);
      END
    `);
  }
  
  /**
   * 検索クエリの最適化
   */
  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    // クエリの前処理
    const normalizedQuery = this.normalizeQuery(query);
    
    // FTS5検索
    const ftsQuery = `
      SELECT 
        type,
        id,
        title,
        snippet(search_fts, 3, '<mark>', '</mark>', '...', 64) as snippet,
        rank
      FROM search_fts
      WHERE search_fts MATCH ?
      ORDER BY rank
      LIMIT ?
      OFFSET ?
    `;
    
    const results = await this.db.allAsync(ftsQuery, [
      normalizedQuery,
      options?.limit || 20,
      options?.offset || 0,
    ]);
    
    return results;
  }
  
  private normalizeQuery(query: string): string {
    // 特殊文字のエスケープ
    return query
      .replace(/[*"]/g, '')
      .split(/\s+/)
      .filter(term => term.length > 1)
      .map(term => `"${term}"*`)
      .join(' OR ');
  }
}
```

### 5. 並行処理の最適化

#### Worker Threadsの活用
```typescript
// src/optimizations/worker-pool.ts
import { Worker } from 'worker_threads';

export class WorkerPool {
  private workers: Worker[] = [];
  private queue: Array<{
    data: any;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];
  private busyWorkers = new Set<Worker>();
  
  constructor(
    private workerScript: string,
    private poolSize: number = 4
  ) {}
  
  async initialize(): Promise<void> {
    for (let i = 0; i < this.poolSize; i++) {
      const worker = new Worker(this.workerScript);
      
      worker.on('message', (result) => {
        this.busyWorkers.delete(worker);
        
        // 次のタスクを処理
        const next = this.queue.shift();
        if (next) {
          this.processTask(worker, next);
        }
      });
      
      worker.on('error', (error) => {
        console.error('Worker error:', error);
        this.busyWorkers.delete(worker);
      });
      
      this.workers.push(worker);
    }
  }
  
  async execute<T>(data: any): Promise<T> {
    // 空いているワーカーを探す
    const availableWorker = this.workers.find(w => !this.busyWorkers.has(w));
    
    if (availableWorker) {
      return new Promise((resolve, reject) => {
        this.processTask(availableWorker, { data, resolve, reject });
      });
    }
    
    // キューに追加
    return new Promise((resolve, reject) => {
      this.queue.push({ data, resolve, reject });
    });
  }
  
  private processTask(worker: Worker, task: any): void {
    this.busyWorkers.add(worker);
    
    const handler = (result: any) => {
      worker.off('message', handler);
      worker.off('error', errorHandler);
      task.resolve(result);
    };
    
    const errorHandler = (error: any) => {
      worker.off('message', handler);
      worker.off('error', errorHandler);
      task.reject(error);
    };
    
    worker.once('message', handler);
    worker.once('error', errorHandler);
    worker.postMessage(task.data);
  }
  
  async terminate(): Promise<void> {
    await Promise.all(this.workers.map(w => w.terminate()));
  }
}

// Worker スクリプト例 (markdown-worker.js)
const { parentPort } = require('worker_threads');

parentPort.on('message', (data) => {
  // 重い処理（Markdown解析など）
  const result = parseMarkdown(data);
  parentPort.postMessage(result);
});
```

## 測定とモニタリング

### パフォーマンス測定フレームワーク
```typescript
// src/monitoring/performance-monitor.ts
export class PerformanceMonitor {
  private metrics = new Map<string, Metric>();
  
  startTimer(operation: string): () => void {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(operation, duration);
    };
  }
  
  async measure<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const stopTimer = this.startTimer(operation);
    try {
      return await fn();
    } finally {
      stopTimer();
    }
  }
  
  private recordMetric(operation: string, duration: number): void {
    let metric = this.metrics.get(operation);
    if (!metric) {
      metric = {
        count: 0,
        total: 0,
        min: Infinity,
        max: -Infinity,
        values: [],
      };
      this.metrics.set(operation, metric);
    }
    
    metric.count++;
    metric.total += duration;
    metric.min = Math.min(metric.min, duration);
    metric.max = Math.max(metric.max, duration);
    metric.values.push(duration);
    
    // 最新1000件のみ保持
    if (metric.values.length > 1000) {
      metric.values.shift();
    }
  }
  
  getReport(): PerformanceReport {
    const report: PerformanceReport = {};
    
    for (const [operation, metric] of this.metrics) {
      const sorted = [...metric.values].sort((a, b) => a - b);
      
      report[operation] = {
        count: metric.count,
        average: metric.total / metric.count,
        min: metric.min,
        max: metric.max,
        p50: sorted[Math.floor(sorted.length * 0.5)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)],
      };
    }
    
    return report;
  }
}
```

## 最適化目標

### レスポンスタイム
- 平均: 50ms以下
- P95: 100ms以下
- P99: 200ms以下

### スループット
- 通常時: 500req/s以上
- ピーク時: 1000req/s対応

### リソース使用
- メモリ: 起動時100MB以下
- CPU: アイドル時1%以下
- ファイルハンドル: 100以下

## 実装優先順位

1. **High Priority**
   - データベースインデックス最適化
   - クエリのバッチ化
   - メモリキャッシュ実装

2. **Medium Priority**
   - ファイルI/Oの非同期化
   - Worker Threadsの導入
   - FTS5の実装

3. **Low Priority**
   - オブジェクトプーリング
   - 詳細なメトリクス収集
   - 自動チューニング