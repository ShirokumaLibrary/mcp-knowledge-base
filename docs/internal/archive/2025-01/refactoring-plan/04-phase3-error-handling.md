# フェーズ3: エラーハンドリング改善計画（2週間）

## 概要
包括的なエラーハンドリング戦略を実装し、システムの信頼性と保守性を向上させます。
現在61.3%のasync関数でエラーハンドリングが欠如している状況を改善します。

## 現状分析

### エラーハンドリング統計
- **try-catch使用**: 55箇所（全体の38.7%）
- **async関数総数**: 142個
- **エラーハンドリングなし**: 87個（61.3%）
- **console使用**: 47箇所（エラーログとして不適切）

### 最も問題のあるファイル
1. handlers/session-handlers.ts - 0% coverage
2. handlers/tag-handlers.ts - 0% coverage
3. handlers/status-handlers.ts - 0% coverage
4. repositories/session-repository.ts - 部分的
5. database/task-repository.ts - エラーを握りつぶし

## Week 1: エラーハンドリング基盤の構築

### Day 1-2: カスタムエラー階層の拡充

```typescript
// src/errors/base-errors.ts
export abstract class BaseError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  readonly timestamp: string;
  readonly context?: Record<string, any>;
  readonly isOperational: boolean = true;

  constructor(message: string, context?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date().toISOString();
    this.context = context;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): ErrorResponse {
    return {
      error: {
        code: this.code,
        message: this.message,
        timestamp: this.timestamp,
        context: this.context,
      }
    };
  }
}

// src/errors/domain-errors.ts
export class ItemNotFoundError extends BaseError {
  readonly code = 'ITEM_NOT_FOUND';
  readonly statusCode = 404;

  constructor(type: string, id: number) {
    super(`${type} with ID ${id} not found`, { type, id });
  }
}

export class InvalidStatusTransitionError extends BaseError {
  readonly code = 'INVALID_STATUS_TRANSITION';
  readonly statusCode = 400;

  constructor(
    itemType: string,
    itemId: number,
    currentStatus: string,
    targetStatus: string
  ) {
    super(
      `Cannot transition ${itemType} ${itemId} from ${currentStatus} to ${targetStatus}`,
      { itemType, itemId, currentStatus, targetStatus }
    );
  }
}

export class DuplicateItemError extends BaseError {
  readonly code = 'DUPLICATE_ITEM';
  readonly statusCode = 409;

  constructor(type: string, field: string, value: string) {
    super(`${type} with ${field} '${value}' already exists`, { type, field, value });
  }
}

// src/errors/infrastructure-errors.ts
export class DatabaseConnectionError extends BaseError {
  readonly code = 'DATABASE_CONNECTION_ERROR';
  readonly statusCode = 503;
  readonly isOperational = false;

  constructor(details: string) {
    super(`Database connection failed: ${details}`);
  }
}

export class FileSystemError extends BaseError {
  readonly code = 'FILE_SYSTEM_ERROR';
  readonly statusCode = 500;

  constructor(operation: string, path: string, details: string) {
    super(`File system ${operation} failed for ${path}: ${details}`, {
      operation,
      path,
    });
  }
}
```

### Day 3-4: エラーハンドリングユーティリティ

```typescript
// src/utils/error-handler.ts
export class ErrorHandler {
  constructor(private logger: Logger) {}

  /**
   * 統一的なエラーハンドリング
   */
  handle(error: unknown, context: string): never {
    const baseError = this.normalizeError(error);
    
    // ロギング
    this.logError(baseError, context);
    
    // メトリクス送信（将来実装）
    this.sendMetrics(baseError);
    
    // エラーの再スロー
    throw baseError;
  }

  /**
   * エラーを正規化
   */
  private normalizeError(error: unknown): BaseError {
    if (error instanceof BaseError) {
      return error;
    }

    if (error instanceof Error) {
      // 既知のエラーパターンを識別
      if (error.message.includes('SQLITE_CONSTRAINT')) {
        return new DuplicateItemError('item', 'unknown', 'unknown');
      }
      
      if (error.message.includes('ENOENT')) {
        return new FileSystemError('read', 'unknown', error.message);
      }
      
      return new InternalServerError(error.message, {
        originalError: error.name,
        stack: error.stack,
      });
    }

    return new InternalServerError('An unknown error occurred', {
      error: String(error),
    });
  }

  private logError(error: BaseError, context: string): void {
    const logData = {
      context,
      error: error.toJSON(),
      stack: error.stack,
    };

    if (error.isOperational) {
      this.logger.warn('Operational error occurred', logData);
    } else {
      this.logger.error('System error occurred', logData);
    }
  }

  private sendMetrics(error: BaseError): void {
    // 将来実装: Prometheus, DataDog等へのメトリクス送信
  }
}

// src/utils/async-handler.ts
/**
 * async関数のエラーハンドリングをラップ
 */
export function asyncHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      const errorHandler = new ErrorHandler(logger);
      errorHandler.handle(error, context);
    }
  }) as T;
}

/**
 * デコレータバージョン
 */
export function CatchErrors(context?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = asyncHandler(
      originalMethod,
      context || `${target.constructor.name}.${propertyKey}`
    );
    return descriptor;
  };
}
```

### Day 5-6: ハンドラー層への適用

```typescript
// src/handlers/session-handlers.ts
export class SessionHandlers {
  private errorHandler: ErrorHandler;
  
  constructor(
    private sessionManager: WorkSessionManager,
    private logger: Logger
  ) {
    this.errorHandler = new ErrorHandler(logger);
  }

  @CatchErrors()
  async handleGetSessions(args: unknown): Promise<ToolResponse> {
    const validatedArgs = GetSessionsSchema.parse(args);
    
    const sessions = await this.sessionManager.getSessions(
      validatedArgs.start_date,
      validatedArgs.end_date
    );
    
    if (!sessions || sessions.length === 0) {
      // 明示的なケース処理
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ data: [], message: 'No sessions found' }),
        }],
      };
    }
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ data: sessions }),
      }],
    };
  }

  @CatchErrors()
  async handleCreateWorkSession(args: unknown): Promise<ToolResponse> {
    const validatedArgs = CreateSessionSchema.parse(args);
    
    // ビジネスルールバリデーション
    if (validatedArgs.datetime) {
      const sessionDate = new Date(validatedArgs.datetime);
      if (sessionDate > new Date()) {
        throw new ValidationError('Cannot create session for future date', {
          datetime: validatedArgs.datetime,
        });
      }
    }
    
    const session = await this.sessionManager.createSession(
      validatedArgs.title,
      validatedArgs.content,
      validatedArgs.tags,
      validatedArgs.category,
      validatedArgs.related_documents,
      validatedArgs.related_tasks,
      validatedArgs.id,
      validatedArgs.datetime
    );
    
    return {
      content: [{
        type: 'text',
        text: `Work session created: ${JSON.stringify(session, null, 2)}`,
      }],
    };
  }
}
```

### Day 7: リポジトリ層への適用

```typescript
// src/database/task-repository.ts
export class TaskRepository extends BaseRepository {
  @CatchErrors('TaskRepository.searchTasksByTag')
  async searchTasksByTag(type: string, tag: string): Promise<Task[]> {
    await this.ensureDirectoryExists();
    
    const typeDir = path.join(this.tasksDir, type);
    let taskFiles: string[] = [];
    
    try {
      const files = await fsPromises.readdir(typeDir);
      taskFiles = files.filter(f => f.startsWith(`${type}-`) && f.endsWith('.md'));
    } catch (error) {
      // ディレクトリが存在しない場合は空配列を返す（エラーではない）
      if (error.code === 'ENOENT') {
        this.logger.debug(`Type directory not found: ${typeDir}`);
        return [];
      }
      
      // その他のエラーは再スロー
      throw new FileSystemError('readdir', typeDir, error.message);
    }
    
    const tasks: Task[] = [];
    
    for (const file of taskFiles) {
      const filePath = path.join(typeDir, file);
      try {
        const content = await fsPromises.readFile(filePath, 'utf-8');
        const task = this.parseTaskFromMarkdown(content);
        
        if (task && task.tags && task.tags.includes(tag)) {
          tasks.push(task);
        }
      } catch (error) {
        // 個別ファイルの読み取りエラーは警告として記録し、処理を継続
        this.logger.warn(`Failed to read task file ${file}`, {
          error: error.message,
          file: filePath,
        });
        // スキップして次のファイルへ
        continue;
      }
    }
    
    return tasks.sort((a, b) => a.id - b.id);
  }
}
```

## Week 2: 包括的なエラーハンドリング実装

### Day 8-9: トランザクション処理とロールバック

```typescript
// src/utils/transaction-manager.ts
export class TransactionManager {
  private rollbackActions: Array<() => Promise<void>> = [];
  
  async executeInTransaction<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    this.rollbackActions = [];
    
    try {
      const result = await operation();
      this.rollbackActions = []; // 成功時はクリア
      return result;
    } catch (error) {
      // ロールバック実行
      await this.rollback();
      throw error;
    }
  }
  
  addRollbackAction(action: () => Promise<void>): void {
    this.rollbackActions.push(action);
  }
  
  private async rollback(): Promise<void> {
    // 逆順で実行
    const actions = [...this.rollbackActions].reverse();
    
    for (const action of actions) {
      try {
        await action();
      } catch (error) {
        // ロールバック中のエラーはログのみ
        logger.error('Rollback action failed', { error });
      }
    }
    
    this.rollbackActions = [];
  }
}

// 使用例
async createTaskWithTransaction(data: CreateTaskDto): Promise<Task> {
  const transaction = new TransactionManager();
  
  return transaction.executeInTransaction(async () => {
    // 1. ファイル作成
    const task = await this.createTaskFile(data);
    transaction.addRollbackAction(async () => {
      await this.deleteTaskFile(task.id);
    });
    
    // 2. DB同期
    await this.syncToDatabase(task);
    transaction.addRollbackAction(async () => {
      await this.removeFromDatabase(task.id);
    });
    
    // 3. タグ登録
    await this.registerTags(task.tags);
    // タグ登録のロールバックは不要（冪等性）
    
    return task;
  });
}
```

### Day 10-11: エラーリカバリー戦略

```typescript
// src/utils/retry-handler.ts
export interface RetryOptions {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableErrors?: Array<new (...args: any[]) => Error>;
}

export class RetryHandler {
  static async withRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions
  ): Promise<T> {
    let lastError: Error;
    let delay = options.initialDelay;
    
    for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // リトライ可能なエラーかチェック
        if (!this.isRetryable(error, options.retryableErrors)) {
          throw error;
        }
        
        // 最後の試行の場合はエラーをスロー
        if (attempt === options.maxAttempts) {
          throw new Error(
            `Operation failed after ${options.maxAttempts} attempts: ${lastError.message}`
          );
        }
        
        // 指数バックオフで待機
        await this.sleep(delay);
        delay = Math.min(delay * options.backoffFactor, options.maxDelay);
        
        logger.warn(`Retrying operation, attempt ${attempt + 1}/${options.maxAttempts}`, {
          error: lastError.message,
          nextDelay: delay,
        });
      }
    }
    
    throw lastError!;
  }
  
  private static isRetryable(
    error: unknown,
    retryableErrors?: Array<new (...args: any[]) => Error>
  ): boolean {
    if (!retryableErrors || retryableErrors.length === 0) {
      // デフォルトのリトライ可能エラー
      return error instanceof DatabaseConnectionError ||
             error instanceof NetworkError ||
             (error as any).code === 'SQLITE_BUSY';
    }
    
    return retryableErrors.some(ErrorClass => error instanceof ErrorClass);
  }
  
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 使用例
async syncWithRetry(task: Task): Promise<void> {
  await RetryHandler.withRetry(
    () => this.syncTaskToSQLite(task),
    {
      maxAttempts: 3,
      initialDelay: 100,
      maxDelay: 5000,
      backoffFactor: 2,
      retryableErrors: [DatabaseConnectionError, SQLiteBusyError],
    }
  );
}
```

### Day 12-13: エラーレポーティングとモニタリング

```typescript
// src/monitoring/error-reporter.ts
export interface ErrorReport {
  id: string;
  timestamp: string;
  error: {
    name: string;
    message: string;
    code?: string;
    stack?: string;
  };
  context: {
    user?: string;
    action: string;
    requestId?: string;
    environment: string;
  };
  metrics: {
    responseTime?: number;
    memoryUsage?: number;
  };
}

export class ErrorReporter {
  private queue: ErrorReport[] = [];
  private flushInterval: NodeJS.Timer;
  
  constructor(
    private config: {
      flushInterval: number;
      maxQueueSize: number;
      endpoint?: string;
    }
  ) {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, config.flushInterval);
  }
  
  report(error: BaseError, context: Record<string, any>): void {
    const report: ErrorReport = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack,
      },
      context: {
        ...context,
        environment: process.env.NODE_ENV || 'development',
      },
      metrics: {
        memoryUsage: process.memoryUsage().heapUsed,
      },
    };
    
    this.queue.push(report);
    
    // キューサイズ制限
    if (this.queue.length >= this.config.maxQueueSize) {
      this.flush();
    }
  }
  
  private async flush(): Promise<void> {
    if (this.queue.length === 0) return;
    
    const reports = [...this.queue];
    this.queue = [];
    
    try {
      if (this.config.endpoint) {
        // 外部サービスに送信
        await this.sendToExternalService(reports);
      } else {
        // ローカルログ
        reports.forEach(report => {
          logger.error('Error report', report);
        });
      }
    } catch (error) {
      // レポート送信の失敗は握りつぶす
      logger.error('Failed to send error reports', { error });
    }
  }
}
```

### Day 14: 統合テストとドキュメント

#### エラーハンドリングテスト
```typescript
// src/__tests__/error-handling.test.ts
describe('Error Handling', () => {
  describe('SessionHandlers', () => {
    it('should handle validation errors properly', async () => {
      const handler = new SessionHandlers(mockSessionManager, mockLogger);
      
      await expect(
        handler.handleCreateWorkSession({ datetime: '2099-01-01' })
      ).rejects.toThrow(ValidationError);
    });
    
    it('should handle database errors with retry', async () => {
      mockSessionManager.createSession
        .mockRejectedValueOnce(new DatabaseConnectionError('Connection lost'))
        .mockRejectedValueOnce(new DatabaseConnectionError('Connection lost'))
        .mockResolvedValueOnce(mockSession);
      
      const result = await handler.handleCreateWorkSession(validArgs);
      
      expect(mockSessionManager.createSession).toHaveBeenCalledTimes(3);
      expect(result).toBeDefined();
    });
  });
});
```

## 成果物

### 新規作成ファイル
1. `src/errors/base-errors.ts` - エラー基底クラス
2. `src/errors/domain-errors.ts` - ドメイン固有エラー
3. `src/errors/infrastructure-errors.ts` - インフラエラー
4. `src/utils/error-handler.ts` - エラーハンドリングユーティリティ
5. `src/utils/async-handler.ts` - 非同期エラーハンドラー
6. `src/utils/transaction-manager.ts` - トランザクション管理
7. `src/utils/retry-handler.ts` - リトライ機構
8. `src/monitoring/error-reporter.ts` - エラーレポーティング

### 修正対象ファイル
- 全てのハンドラークラス（エラーハンドリング追加）
- 全てのリポジトリクラス（適切なエラー伝播）
- server.ts（グローバルエラーハンドラー）

## 成功指標

### 定量的指標
- エラーハンドリング率: 38.7% → 100%
- console使用: 47箇所 → 0箇所
- 未処理のPromise rejection: 0件
- エラーリカバリー率: 80%以上

### 定性的指標
- エラーメッセージが明確で対処法が分かる
- エラーの原因追跡が容易
- システムの自己回復能力向上

## リスクと対策

### リスク1: 過度なエラーハンドリング
- **対策**: 本当に必要な箇所のみに適用

### リスク2: パフォーマンスへの影響
- **対策**: エラーパスのみでオーバーヘッド発生

### リスク3: エラーの隠蔽
- **対策**: 全てのエラーをログに記録