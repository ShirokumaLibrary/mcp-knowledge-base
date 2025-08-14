# エラーハンドリング設計書

## 1. 概要

Shirokuma MCP Knowledge Base v0.8.0のエラーハンドリング設計書です。MCP Protocol over stdioでの通信において、堅牢で一貫性のあるエラー処理を実現し、適切な復旧機能を提供します。

## 2. エラー分類体系

### 2.1 エラーレベル分類

```typescript
enum ErrorLevel {
  TRACE = 0,    // 詳細な実行情報
  DEBUG = 1,    // デバッグ情報
  INFO = 2,     // 一般的な情報
  WARN = 3,     // 警告（処理は継続）
  ERROR = 4,    // エラー（処理中断）
  FATAL = 5     // 致命的エラー（システム停止）
}

enum ErrorCategory {
  VALIDATION = 'validation',      // 入力検証エラー
  BUSINESS = 'business',          // ビジネスロジックエラー
  DATA = 'data',                 // データアクセスエラー
  INFRASTRUCTURE = 'infrastructure', // インフラストラクチャーエラー
  SECURITY = 'security',         // セキュリティエラー
  SYSTEM = 'system'             // システムエラー
}
```

### 2.2 MCP準拠エラーコード

```typescript
const MCP_ERROR_CODES = {
  // JSON-RPC 2.0 標準エラー
  PARSE_ERROR: -32700,           // JSONパースエラー
  INVALID_REQUEST: -32600,       // 無効なリクエスト
  METHOD_NOT_FOUND: -32601,      // メソッド未発見
  INVALID_PARAMS: -32602,        // パラメータ無効
  INTERNAL_ERROR: -32603,        // 内部エラー

  // MCPアプリケーション固有エラー (1000番台)
  ITEM_NOT_FOUND: 1001,         // アイテム未発見
  VALIDATION_ERROR: 1002,        // 検証エラー
  DATABASE_ERROR: 1003,         // データベースエラー
  CONSTRAINT_VIOLATION: 1004,    // 制約違反
  PERMISSION_DENIED: 1005,       // アクセス拒否
  RESOURCE_EXHAUSTED: 1006,      // リソース枯渇
  CONFLICT: 1007,               // 競合状態
  RATE_LIMITED: 1008,           // レート制限
  DEPENDENCY_FAILED: 1009,       // 依存関係エラー
  OPERATION_TIMEOUT: 1010        // タイムアウト
} as const;
```

## 3. エラークラス設計

### 3.1 基底エラークラス

```typescript
abstract class ShirokumaError extends Error {
  public readonly code: number;
  public readonly level: ErrorLevel;
  public readonly category: ErrorCategory;
  public readonly timestamp: Date;
  public readonly correlationId: string;
  public readonly context?: any;

  constructor(
    message: string,
    code: number,
    level: ErrorLevel,
    category: ErrorCategory,
    context?: any,
    correlationId?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.level = level;
    this.category = category;
    this.timestamp = new Date();
    this.correlationId = correlationId || this.generateCorrelationId();
    this.context = context;

    // スタックトレースの設定
    Error.captureStackTrace(this, this.constructor);
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  toMCPError(): MCPError {
    return {
      code: this.code,
      message: this.message,
      data: {
        type: this.name,
        level: ErrorLevel[this.level],
        category: this.category,
        timestamp: this.timestamp.toISOString(),
        correlationId: this.correlationId,
        details: this.getSafeContext()
      }
    };
  }

  protected getSafeContext(): any {
    if (!this.context) return undefined;

    // 機密情報の除去
    const safe = { ...this.context };
    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    
    for (const field of sensitiveFields) {
      if (field in safe) {
        safe[field] = '[REDACTED]';
      }
    }

    return safe;
  }
}
```

### 3.2 具体的なエラークラス

#### 3.2.1 検証エラー

```typescript
class ValidationError extends ShirokumaError {
  public readonly field?: string;
  public readonly constraint?: string;
  public readonly rejectedValue?: any;

  constructor(
    message: string,
    field?: string,
    constraint?: string,
    rejectedValue?: any,
    correlationId?: string
  ) {
    super(
      message,
      MCP_ERROR_CODES.VALIDATION_ERROR,
      ErrorLevel.WARN,
      ErrorCategory.VALIDATION,
      {
        field,
        constraint,
        valueType: typeof rejectedValue,
        valueLength: typeof rejectedValue === 'string' ? rejectedValue.length : undefined
      },
      correlationId
    );

    this.field = field;
    this.constraint = constraint;
    this.rejectedValue = rejectedValue;
  }

  static required(field: string, correlationId?: string): ValidationError {
    return new ValidationError(
      `${field} is required`,
      field,
      'required',
      undefined,
      correlationId
    );
  }

  static tooLong(field: string, maxLength: number, actualLength: number, correlationId?: string): ValidationError {
    return new ValidationError(
      `${field} is too long (max: ${maxLength}, actual: ${actualLength})`,
      field,
      `max_length:${maxLength}`,
      actualLength,
      correlationId
    );
  }

  static invalidFormat(field: string, expectedFormat: string, correlationId?: string): ValidationError {
    return new ValidationError(
      `${field} has invalid format (expected: ${expectedFormat})`,
      field,
      `format:${expectedFormat}`,
      undefined,
      correlationId
    );
  }
}
```

#### 3.2.2 ビジネスロジックエラー

```typescript
class ItemNotFoundError extends ShirokumaError {
  public readonly itemType: string;
  public readonly itemId: number | string;

  constructor(itemType: string, itemId: number | string, correlationId?: string) {
    super(
      `Item not found: ${itemType}-${itemId}`,
      MCP_ERROR_CODES.ITEM_NOT_FOUND,
      ErrorLevel.ERROR,
      ErrorCategory.BUSINESS,
      {
        itemType,
        itemId,
        compositeId: `${itemType}-${itemId}`
      },
      correlationId
    );

    this.itemType = itemType;
    this.itemId = itemId;
  }
}

class ConflictError extends ShirokumaError {
  public readonly resource: string;
  public readonly conflictReason: string;

  constructor(resource: string, conflictReason: string, correlationId?: string) {
    super(
      `Conflict detected: ${conflictReason}`,
      MCP_ERROR_CODES.CONFLICT,
      ErrorLevel.ERROR,
      ErrorCategory.BUSINESS,
      {
        resource,
        conflictReason
      },
      correlationId
    );

    this.resource = resource;
    this.conflictReason = conflictReason;
  }
}
```

#### 3.2.3 データアクセスエラー

```typescript
class DatabaseError extends ShirokumaError {
  public readonly operation: string;
  public readonly tableName?: string;

  constructor(
    message: string, 
    operation: string,
    originalError?: Error,
    tableName?: string,
    correlationId?: string
  ) {
    super(
      `Database ${operation} failed: ${message}`,
      MCP_ERROR_CODES.DATABASE_ERROR,
      ErrorLevel.ERROR,
      ErrorCategory.DATA,
      {
        operation,
        tableName,
        originalError: originalError?.message
      },
      correlationId
    );

    this.operation = operation;
    this.tableName = tableName;
  }

  static fromPrismaError(error: any, operation: string, correlationId?: string): DatabaseError {
    let message = 'Unknown database error';
    let tableName: string | undefined;

    // Prismaエラーコードの解析
    if (error.code) {
      switch (error.code) {
        case 'P2002':
          message = 'Unique constraint violation';
          tableName = error.meta?.target;
          break;
        case 'P2003':
          message = 'Foreign key constraint violation';
          tableName = error.meta?.field_name;
          break;
        case 'P2025':
          message = 'Record not found';
          break;
        default:
          message = error.message || message;
      }
    }

    return new DatabaseError(message, operation, error, tableName, correlationId);
  }
}
```

#### 3.2.4 インフラストラクチャーエラー

```typescript
class FileSystemError extends ShirokumaError {
  public readonly operation: string;
  public readonly filePath: string;

  constructor(
    operation: string,
    filePath: string,
    originalError?: Error,
    correlationId?: string
  ) {
    super(
      `File system ${operation} failed for ${filePath}`,
      MCP_ERROR_CODES.INTERNAL_ERROR,
      ErrorLevel.ERROR,
      ErrorCategory.INFRASTRUCTURE,
      {
        operation,
        filePath,
        originalError: originalError?.message
      },
      correlationId
    );

    this.operation = operation;
    this.filePath = filePath;
  }
}

class ResourceExhaustedError extends ShirokumaError {
  public readonly resourceType: string;
  public readonly currentUsage: number;
  public readonly limit: number;

  constructor(
    resourceType: string,
    currentUsage: number,
    limit: number,
    correlationId?: string
  ) {
    super(
      `Resource exhausted: ${resourceType} (${currentUsage}/${limit})`,
      MCP_ERROR_CODES.RESOURCE_EXHAUSTED,
      ErrorLevel.WARN,
      ErrorCategory.SYSTEM,
      {
        resourceType,
        currentUsage,
        limit,
        utilizationPercent: Math.round((currentUsage / limit) * 100)
      },
      correlationId
    );

    this.resourceType = resourceType;
    this.currentUsage = currentUsage;
    this.limit = limit;
  }
}
```

#### 3.2.5 セキュリティエラー

```typescript
class SecurityError extends ShirokumaError {
  public readonly securityViolationType: string;

  constructor(
    message: string,
    securityViolationType: string,
    context?: any,
    correlationId?: string
  ) {
    super(
      message,
      MCP_ERROR_CODES.PERMISSION_DENIED,
      ErrorLevel.ERROR,
      ErrorCategory.SECURITY,
      context,
      correlationId
    );

    this.securityViolationType = securityViolationType;
  }

  // セキュリティエラーでは詳細情報を隠す
  protected getSafeContext(): any {
    return {
      violationType: this.securityViolationType,
      timestamp: this.timestamp.toISOString()
    };
  }
}
```

## 4. エラーハンドラー設計

### 4.1 中央エラーハンドラー

```typescript
class ErrorHandler {
  private logger: Logger;
  private metrics: MetricsCollector;

  constructor(logger: Logger, metrics: MetricsCollector) {
    this.logger = logger;
    this.metrics = metrics;
  }

  async handleError(error: unknown, context?: any): Promise<MCPError> {
    // エラーの正規化
    const normalizedError = this.normalizeError(error);
    
    // ログ記録
    await this.logError(normalizedError, context);
    
    // メトリクス記録
    this.recordMetrics(normalizedError);
    
    // 復旧処理
    await this.attemptRecovery(normalizedError, context);
    
    // MCPエラーレスポンス生成
    return normalizedError.toMCPError();
  }

  private normalizeError(error: unknown): ShirokumaError {
    if (error instanceof ShirokumaError) {
      return error;
    }

    if (error instanceof Error) {
      return this.convertStandardError(error);
    }

    // 未知のエラー型
    return new InternalError(
      'An unexpected error occurred',
      String(error)
    );
  }

  private convertStandardError(error: Error): ShirokumaError {
    // TypeErrorやRangeErrorなどの標準エラーを変換
    if (error.name === 'TypeError') {
      return new ValidationError(
        error.message,
        undefined,
        'type_error',
        undefined
      );
    }

    if (error.name === 'RangeError') {
      return new ValidationError(
        error.message,
        undefined,
        'range_error',
        undefined
      );
    }

    // Prismaエラーの変換
    if (error.constructor.name === 'PrismaClientKnownRequestError') {
      return DatabaseError.fromPrismaError(error, 'query');
    }

    // 一般的な未知エラー
    return new InternalError(error.message, error.stack);
  }

  private async logError(error: ShirokumaError, context?: any): Promise<void> {
    const logLevel = this.getLogLevelForError(error);
    
    const logEntry = {
      level: logLevel,
      message: error.message,
      error: {
        name: error.name,
        code: error.code,
        category: error.category,
        correlationId: error.correlationId,
        stack: error.stack
      },
      context,
      timestamp: error.timestamp.toISOString()
    };

    switch (logLevel) {
      case 'fatal':
      case 'error':
        this.logger.error(logEntry);
        break;
      case 'warn':
        this.logger.warn(logEntry);
        break;
      default:
        this.logger.info(logEntry);
    }
  }

  private getLogLevelForError(error: ShirokumaError): string {
    switch (error.level) {
      case ErrorLevel.FATAL:
        return 'fatal';
      case ErrorLevel.ERROR:
        return 'error';
      case ErrorLevel.WARN:
        return 'warn';
      default:
        return 'info';
    }
  }

  private recordMetrics(error: ShirokumaError): void {
    this.metrics.incrementCounter('errors_total', {
      error_code: error.code.toString(),
      error_category: error.category,
      error_level: ErrorLevel[error.level]
    });

    if (error.level >= ErrorLevel.ERROR) {
      this.metrics.incrementCounter('error_events', {
        error_type: error.name
      });
    }
  }

  private async attemptRecovery(error: ShirokumaError, context?: any): Promise<void> {
    // データベース接続エラーの場合は再接続を試行
    if (error instanceof DatabaseError) {
      await this.recoverDatabaseConnection();
    }

    // リソース枯渇エラーの場合はクリーンアップを実行
    if (error instanceof ResourceExhaustedError) {
      await this.performResourceCleanup(error.resourceType);
    }

    // ファイルシステムエラーの場合はディレクトリ権限を確認
    if (error instanceof FileSystemError) {
      await this.checkFileSystemPermissions(error.filePath);
    }
  }

  private async recoverDatabaseConnection(): Promise<void> {
    try {
      // データベース接続の再試行
      console.log('Attempting database connection recovery...');
      // await this.database.reconnect();
    } catch (recoveryError) {
      console.error('Database recovery failed:', recoveryError);
    }
  }

  private async performResourceCleanup(resourceType: string): Promise<void> {
    console.log(`Performing cleanup for resource type: ${resourceType}`);
    
    switch (resourceType) {
      case 'memory':
        if (global.gc) {
          global.gc();
        }
        break;
      case 'cache':
        // キャッシュクリア
        break;
      case 'connections':
        // 不要な接続クリア
        break;
    }
  }

  private async checkFileSystemPermissions(filePath: string): Promise<void> {
    try {
      await fs.promises.access(filePath, fs.constants.R_OK | fs.constants.W_OK);
      console.log(`File permissions OK: ${filePath}`);
    } catch (error) {
      console.error(`File permission check failed: ${filePath}`, error);
    }
  }
}
```

### 4.2 MCP Tool Wrapper

```typescript
class MCPToolWrapper {
  constructor(private errorHandler: ErrorHandler) {}

  wrap<TInput, TOutput>(
    toolName: string,
    implementation: (input: TInput, context?: any) => Promise<TOutput>
  ): (input: TInput, context?: any) => Promise<TOutput> {
    return async (input: TInput, context?: any): Promise<TOutput> => {
      const startTime = Date.now();
      const correlationId = this.generateCorrelationId();
      
      try {
        // 入力ログ
        this.logToolStart(toolName, input, correlationId);
        
        // 実装実行
        const result = await implementation(input, { 
          ...context, 
          correlationId 
        });
        
        // 成功ログ
        this.logToolSuccess(toolName, correlationId, Date.now() - startTime);
        
        return result;
        
      } catch (error) {
        // エラーハンドリング
        const mcpError = await this.errorHandler.handleError(error, {
          toolName,
          input,
          correlationId,
          executionTime: Date.now() - startTime
        });

        this.logToolError(toolName, correlationId, mcpError, Date.now() - startTime);
        
        throw mcpError;
      }
    };
  }

  private logToolStart(toolName: string, input: any, correlationId: string): void {
    console.log(JSON.stringify({
      type: 'tool_start',
      tool: toolName,
      correlationId,
      inputSize: JSON.stringify(input).length,
      timestamp: new Date().toISOString()
    }));
  }

  private logToolSuccess(toolName: string, correlationId: string, executionTime: number): void {
    console.log(JSON.stringify({
      type: 'tool_success',
      tool: toolName,
      correlationId,
      executionTime,
      timestamp: new Date().toISOString()
    }));
  }

  private logToolError(
    toolName: string,
    correlationId: string,
    error: MCPError,
    executionTime: number
  ): void {
    console.log(JSON.stringify({
      type: 'tool_error',
      tool: toolName,
      correlationId,
      error: {
        code: error.code,
        message: error.message
      },
      executionTime,
      timestamp: new Date().toISOString()
    }));
  }

  private generateCorrelationId(): string {
    return `tool-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

## 5. 復旧戦略

### 5.1 自動復旧システム

```typescript
interface RecoveryStrategy {
  canRecover(error: ShirokumaError): boolean;
  recover(error: ShirokumaError, context?: any): Promise<RecoveryResult>;
}

interface RecoveryResult {
  success: boolean;
  message: string;
  retryable: boolean;
  retryAfterMs?: number;
}

class AutoRecoveryManager {
  private strategies: RecoveryStrategy[] = [];
  private maxRetries = 3;
  private baseRetryDelayMs = 1000;

  registerStrategy(strategy: RecoveryStrategy): void {
    this.strategies.push(strategy);
  }

  async attemptRecovery(
    error: ShirokumaError, 
    context?: any,
    retryCount: number = 0
  ): Promise<RecoveryResult> {
    // 復旧戦略を検索
    const strategy = this.strategies.find(s => s.canRecover(error));
    if (!strategy) {
      return {
        success: false,
        message: 'No recovery strategy available',
        retryable: false
      };
    }

    try {
      const result = await strategy.recover(error, context);
      
      if (!result.success && result.retryable && retryCount < this.maxRetries) {
        // 指数バックオフでリトライ
        const delay = (result.retryAfterMs || this.baseRetryDelayMs) * Math.pow(2, retryCount);
        await this.sleep(delay);
        
        return this.attemptRecovery(error, context, retryCount + 1);
      }

      return result;
      
    } catch (recoveryError) {
      return {
        success: false,
        message: `Recovery failed: ${recoveryError.message}`,
        retryable: false
      };
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 5.2 具体的な復旧戦略

```typescript
class DatabaseRecoveryStrategy implements RecoveryStrategy {
  constructor(private db: any) {}

  canRecover(error: ShirokumaError): boolean {
    return error instanceof DatabaseError;
  }

  async recover(error: DatabaseError, context?: any): Promise<RecoveryResult> {
    try {
      // データベース接続のヘルスチェック
      await this.db.$queryRaw`SELECT 1`;
      
      return {
        success: true,
        message: 'Database connection is healthy',
        retryable: true,
        retryAfterMs: 100
      };
      
    } catch (healthCheckError) {
      // 再接続を試行
      try {
        await this.db.$disconnect();
        await this.db.$connect();
        
        return {
          success: true,
          message: 'Database reconnected successfully',
          retryable: true,
          retryAfterMs: 500
        };
        
      } catch (reconnectError) {
        return {
          success: false,
          message: 'Database reconnection failed',
          retryable: true,
          retryAfterMs: 5000
        };
      }
    }
  }
}

class FileSystemRecoveryStrategy implements RecoveryStrategy {
  canRecover(error: ShirokumaError): boolean {
    return error instanceof FileSystemError;
  }

  async recover(error: FileSystemError, context?: any): Promise<RecoveryResult> {
    try {
      const filePath = error.filePath;
      const dirPath = path.dirname(filePath);
      
      // ディレクトリが存在しない場合は作成
      if (!await this.pathExists(dirPath)) {
        await fs.promises.mkdir(dirPath, { recursive: true });
      }

      // 権限を修正
      await fs.promises.chmod(dirPath, 0o755);
      
      return {
        success: true,
        message: 'File system permissions fixed',
        retryable: true,
        retryAfterMs: 100
      };
      
    } catch (recoveryError) {
      return {
        success: false,
        message: 'File system recovery failed',
        retryable: false
      };
    }
  }

  private async pathExists(path: string): Promise<boolean> {
    try {
      await fs.promises.access(path);
      return true;
    } catch {
      return false;
    }
  }
}

class ResourceRecoveryStrategy implements RecoveryStrategy {
  canRecover(error: ShirokumaError): boolean {
    return error instanceof ResourceExhaustedError;
  }

  async recover(error: ResourceExhaustedError, context?: any): Promise<RecoveryResult> {
    const resourceType = error.resourceType;
    
    switch (resourceType) {
      case 'memory':
        return this.recoverMemory();
      case 'disk':
        return this.recoverDisk();
      case 'connections':
        return this.recoverConnections();
      default:
        return {
          success: false,
          message: `Unknown resource type: ${resourceType}`,
          retryable: false
        };
    }
  }

  private recoverMemory(): RecoveryResult {
    if (global.gc) {
      global.gc();
      return {
        success: true,
        message: 'Garbage collection executed',
        retryable: true,
        retryAfterMs: 1000
      };
    }

    return {
      success: false,
      message: 'Garbage collection not available',
      retryable: false
    };
  }

  private async recoverDisk(): Promise<RecoveryResult> {
    // ログファイルのローテーション、一時ファイルの削除など
    try {
      // 実装例: 古いログファイルを削除
      const logDir = './logs';
      const files = await fs.promises.readdir(logDir);
      const oldFiles = files.filter(file => {
        const filePath = path.join(logDir, file);
        const stats = fs.statSync(filePath);
        const ageMs = Date.now() - stats.mtime.getTime();
        return ageMs > 7 * 24 * 60 * 60 * 1000; // 7日以上古い
      });

      for (const file of oldFiles) {
        await fs.promises.unlink(path.join(logDir, file));
      }

      return {
        success: true,
        message: `Cleaned up ${oldFiles.length} old log files`,
        retryable: true,
        retryAfterMs: 1000
      };
      
    } catch (error) {
      return {
        success: false,
        message: 'Disk cleanup failed',
        retryable: false
      };
    }
  }

  private recoverConnections(): RecoveryResult {
    // 接続プールのクリーンアップ
    return {
      success: true,
      message: 'Connection pool cleaned',
      retryable: true,
      retryAfterMs: 500
    };
  }
}
```

## 6. エラー監視・アラート

### 6.1 エラーメトリクス収集

```typescript
class ErrorMetricsCollector {
  private errorCounts = new Map<string, number>();
  private errorRates = new Map<string, number[]>();
  private readonly RATE_WINDOW_MS = 60000; // 1分

  recordError(error: ShirokumaError): void {
    const key = `${error.category}:${error.code}`;
    
    // エラー数カウント
    this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + 1);
    
    // エラー率計算用
    const now = Date.now();
    const rates = this.errorRates.get(key) || [];
    rates.push(now);
    
    // 古いデータを削除
    const cutoff = now - this.RATE_WINDOW_MS;
    const recentRates = rates.filter(timestamp => timestamp > cutoff);
    this.errorRates.set(key, recentRates);
  }

  getErrorRate(category: string, code: number): number {
    const key = `${category}:${code}`;
    const rates = this.errorRates.get(key) || [];
    return rates.length / (this.RATE_WINDOW_MS / 1000); // 秒間エラー数
  }

  getTopErrors(limit: number = 10): Array<{ key: string; count: number; rate: number }> {
    return Array.from(this.errorCounts.entries())
      .map(([key, count]) => ({
        key,
        count,
        rate: this.getErrorRate(...key.split(':') as [string, number])
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  generateHealthReport(): HealthReport {
    const totalErrors = Array.from(this.errorCounts.values())
      .reduce((sum, count) => sum + count, 0);

    const criticalErrors = Array.from(this.errorCounts.entries())
      .filter(([key]) => key.includes('FATAL') || key.includes('ERROR'))
      .reduce((sum, [, count]) => sum + count, 0);

    return {
      totalErrors,
      criticalErrors,
      errorRate: this.getTotalErrorRate(),
      topErrors: this.getTopErrors(5),
      timestamp: new Date().toISOString()
    };
  }

  private getTotalErrorRate(): number {
    const allRates = Array.from(this.errorRates.values())
      .flat()
      .filter(timestamp => timestamp > Date.now() - this.RATE_WINDOW_MS);
    
    return allRates.length / (this.RATE_WINDOW_MS / 1000);
  }
}
```

### 6.2 アラートシステム

```typescript
interface AlertRule {
  name: string;
  condition: (metrics: HealthReport) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cooldownMs: number;
  lastTriggered?: Date;
}

class AlertManager {
  private rules: AlertRule[] = [];
  private notifications: Array<(alert: Alert) => void> = [];

  constructor() {
    this.setupDefaultRules();
  }

  private setupDefaultRules(): void {
    this.rules = [
      {
        name: 'High Error Rate',
        condition: (metrics) => metrics.errorRate > 10, // 10 errors/sec
        severity: 'high',
        cooldownMs: 5 * 60 * 1000 // 5分
      },
      {
        name: 'Critical Errors Detected',
        condition: (metrics) => metrics.criticalErrors > 0,
        severity: 'critical',
        cooldownMs: 1 * 60 * 1000 // 1分
      },
      {
        name: 'Database Connection Issues',
        condition: (metrics) => 
          metrics.topErrors.some(error => 
            error.key.includes('DATABASE_ERROR') && error.rate > 1
          ),
        severity: 'high',
        cooldownMs: 3 * 60 * 1000 // 3分
      }
    ];
  }

  checkAlerts(metrics: HealthReport): void {
    const now = new Date();

    for (const rule of this.rules) {
      // クールダウン期間中はスキップ
      if (rule.lastTriggered) {
        const timeSinceLastTrigger = now.getTime() - rule.lastTriggered.getTime();
        if (timeSinceLastTrigger < rule.cooldownMs) {
          continue;
        }
      }

      // 条件チェック
      if (rule.condition(metrics)) {
        rule.lastTriggered = now;
        
        const alert: Alert = {
          name: rule.name,
          severity: rule.severity,
          message: this.generateAlertMessage(rule, metrics),
          timestamp: now,
          metrics
        };

        this.triggerAlert(alert);
      }
    }
  }

  private generateAlertMessage(rule: AlertRule, metrics: HealthReport): string {
    switch (rule.name) {
      case 'High Error Rate':
        return `Error rate is ${metrics.errorRate.toFixed(2)} errors/sec (threshold: 10)`;
      
      case 'Critical Errors Detected':
        return `${metrics.criticalErrors} critical errors detected`;
      
      case 'Database Connection Issues':
        const dbErrors = metrics.topErrors.find(e => e.key.includes('DATABASE_ERROR'));
        return `Database errors: ${dbErrors?.count} total, ${dbErrors?.rate.toFixed(2)}/sec`;
      
      default:
        return `Alert triggered: ${rule.name}`;
    }
  }

  private triggerAlert(alert: Alert): void {
    // ログ出力
    console.error(JSON.stringify({
      type: 'alert',
      severity: alert.severity,
      name: alert.name,
      message: alert.message,
      timestamp: alert.timestamp.toISOString()
    }));

    // 通知ハンドラーを実行
    for (const handler of this.notifications) {
      try {
        handler(alert);
      } catch (error) {
        console.error('Alert handler failed:', error);
      }
    }
  }

  addNotificationHandler(handler: (alert: Alert) => void): void {
    this.notifications.push(handler);
  }
}

interface HealthReport {
  totalErrors: number;
  criticalErrors: number;
  errorRate: number;
  topErrors: Array<{ key: string; count: number; rate: number }>;
  timestamp: string;
}

interface Alert {
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  metrics: HealthReport;
}
```

## 7. テスト戦略

### 7.1 エラーハンドリングテスト

```typescript
describe('Error Handling', () => {
  let errorHandler: ErrorHandler;
  let mockLogger: Logger;
  let mockMetrics: MetricsCollector;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };
    mockMetrics = {
      incrementCounter: jest.fn()
    };
    errorHandler = new ErrorHandler(mockLogger, mockMetrics);
  });

  describe('Validation Errors', () => {
    it('should handle required field validation error', async () => {
      const error = ValidationError.required('title');
      const mcpError = await errorHandler.handleError(error);

      expect(mcpError.code).toBe(MCP_ERROR_CODES.VALIDATION_ERROR);
      expect(mcpError.message).toBe('title is required');
      expect(mcpError.data.type).toBe('ValidationError');
      expect(mcpError.data.details.field).toBe('title');
    });

    it('should handle length validation error', async () => {
      const error = ValidationError.tooLong('content', 100, 150);
      const mcpError = await errorHandler.handleError(error);

      expect(mcpError.code).toBe(MCP_ERROR_CODES.VALIDATION_ERROR);
      expect(mcpError.data.details.constraint).toBe('max_length:100');
    });
  });

  describe('Database Errors', () => {
    it('should handle Prisma unique constraint error', async () => {
      const prismaError = {
        code: 'P2002',
        message: 'Unique constraint violation',
        meta: { target: ['name'] }
      };
      
      const error = DatabaseError.fromPrismaError(prismaError, 'create');
      const mcpError = await errorHandler.handleError(error);

      expect(mcpError.code).toBe(MCP_ERROR_CODES.DATABASE_ERROR);
      expect(mcpError.message).toContain('Unique constraint violation');
    });
  });

  describe('Error Recovery', () => {
    it('should attempt database recovery for database errors', async () => {
      const databaseError = new DatabaseError('Connection failed', 'query');
      const mockDb = {
        $queryRaw: jest.fn().mockResolvedValue([]),
        $disconnect: jest.fn(),
        $connect: jest.fn()
      };

      const recoveryStrategy = new DatabaseRecoveryStrategy(mockDb);
      const result = await recoveryStrategy.recover(databaseError);

      expect(result.success).toBe(true);
      expect(result.retryable).toBe(true);
    });
  });

  describe('Metrics Collection', () => {
    it('should record error metrics', async () => {
      const error = new ValidationError('Test error');
      await errorHandler.handleError(error);

      expect(mockMetrics.incrementCounter).toHaveBeenCalledWith(
        'errors_total',
        expect.objectContaining({
          error_code: MCP_ERROR_CODES.VALIDATION_ERROR.toString(),
          error_category: ErrorCategory.VALIDATION
        })
      );
    });
  });
});
```

### 7.2 統合テスト

```typescript
describe('End-to-End Error Handling', () => {
  let server: MCPServer;
  let errorHandler: ErrorHandler;

  beforeEach(async () => {
    server = new MCPServer({
      errorHandler: new ErrorHandler(logger, metrics)
    });
    await server.initialize();
  });

  it('should handle tool execution errors gracefully', async () => {
    // 存在しないアイテムを取得しようとする
    const request = {
      method: 'tools/call',
      params: {
        name: 'get_item_detail',
        arguments: {
          type: 'docs',
          id: 99999
        }
      }
    };

    const response = await server.handleRequest(request);

    expect(response.error).toBeDefined();
    expect(response.error.code).toBe(MCP_ERROR_CODES.ITEM_NOT_FOUND);
    expect(response.error.data.type).toBe('ItemNotFoundError');
  });

  it('should recover from temporary database errors', async () => {
    // データベース接続を一時的に切断
    await server.database.$disconnect();

    const request = {
      method: 'tools/call',
      params: {
        name: 'get_items',
        arguments: { type: 'docs' }
      }
    };

    const response = await server.handleRequest(request);

    // 最初の試行は失敗するが、復旧後のリトライで成功
    expect(response.result).toBeDefined();
  });
});
```

## 8. まとめ

本エラーハンドリング設計では、以下の特徴を実現しています：

### 8.1 主要機能

1. **階層化されたエラークラス**: 体系的なエラー分類と処理
2. **自動復旧機能**: 一時的なエラーからの自動回復
3. **包括的なログ記録**: 詳細なエラートラッキング
4. **メトリクス収集**: エラーパターンの分析
5. **アラートシステム**: 重要なエラーの即座な通知
6. **MCP準拠**: JSON-RPC 2.0標準に準拠したエラーレスポンス

### 8.2 設計原則

- **一貫性**: すべてのエラーが同じパターンで処理される
- **可観測性**: エラーの発生から復旧まで完全に追跡可能
- **回復力**: 一時的な障害から自動的に回復
- **安全性**: 機密情報の漏洩を防ぐ安全なエラー処理
- **保守性**: テスト可能で拡張しやすい設計

この設計により、堅牢で信頼性の高いエラーハンドリングシステムを実現しています。