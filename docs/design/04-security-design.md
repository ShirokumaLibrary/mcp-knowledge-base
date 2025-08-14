# セキュリティ設計書

## 1. 概要

Shirokuma MCP Knowledge Base v0.8.0は、ローカル環境でのシングルユーザー運用に特化した設計です。ネットワーク経由のアクセスは想定せず、stdio通信によるプロセス間通信のみをサポートします。本書では、ローカル環境における適切なセキュリティ対策を定義します。

## 2. セキュリティモデル

### 2.1 基本前提

1. **ローカル実行のみ**: ネットワークからのアクセスは一切受け付けない
2. **シングルユーザー**: 複数ユーザーによる同時利用は想定しない
3. **プロセス間通信**: stdio経由の通信のみサポート
4. **ファイルシステム保護**: データベースファイルの適切な権限管理

### 2.2 脅威モデル

#### 対象とする脅威

| 脅威レベル | 脅威の種類 | 対策 |
|-----------|-----------|------|
| **HIGH** | 悪意のある入力データ | 入力検証・サニタイゼーション |
| **HIGH** | SQLインジェクション | ORMクエリビルダー・パラメータ化クエリ |
| **MEDIUM** | ファイルシステム攻撃 | パス検証・権限制御 |
| **MEDIUM** | リソース枯渇攻撃 | リソース制限・レート制限 |
| **LOW** | 機密データ漏洩 | ログ制御・データサニタイズ |

#### 対象外とする脅威

- **ネットワーク攻撃**: HTTPサーバーなし
- **認証回避**: シングルユーザー運用
- **権限昇格**: OSレベルのセキュリティに依存
- **暗号化**: ローカルファイルシステムでの運用

## 3. 入力検証・サニタイゼーション

### 3.1 データ検証フレームワーク

```typescript
interface ValidationRule<T> {
  field: keyof T;
  validators: Validator[];
  sanitizers?: Sanitizer[];
}

abstract class Validator {
  abstract validate(value: any): ValidationResult;
}

abstract class Sanitizer {
  abstract sanitize(value: any): any;
}

class ValidationEngine {
  validate<T>(data: T, rules: ValidationRule<T>[]): ValidationResult {
    const errors: ValidationError[] = [];
    const sanitized = { ...data } as T;

    for (const rule of rules) {
      const value = data[rule.field];
      
      // バリデーション実行
      for (const validator of rule.validators) {
        const result = validator.validate(value);
        if (!result.isValid) {
          errors.push(new ValidationError(
            rule.field as string, 
            result.message, 
            value
          ));
        }
      }

      // サニタイゼーション実行
      if (rule.sanitizers && errors.length === 0) {
        let sanitizedValue = value;
        for (const sanitizer of rule.sanitizers) {
          sanitizedValue = sanitizer.sanitize(sanitizedValue);
        }
        sanitized[rule.field] = sanitizedValue;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: sanitized
    };
  }
}
```

### 3.2 具体的な検証ルール

#### 3.2.1 アイテム作成時の検証

```typescript
class ItemValidationRules {
  static getCreateItemRules(): ValidationRule<CreateItemInput>[] {
    return [
      {
        field: 'title',
        validators: [
          new RequiredValidator(),
          new StringLengthValidator(1, 200),
          new NoScriptTagValidator(),
        ],
        sanitizers: [
          new TrimSanitizer(),
          new HTMLStripSanitizer()
        ]
      },
      {
        field: 'content',
        validators: [
          new StringLengthValidator(0, 102400), // 100KB制限
          new MarkdownValidator()
        ],
        sanitizers: [
          new MarkdownSanitizer()
        ]
      },
      {
        field: 'related',
        validators: [
          new ArrayValidator(),
          new ItemIdFormatValidator(),
          new ItemExistenceValidator()
        ]
      },
      {
        field: 'tags',
        validators: [
          new ArrayValidator(),
          new TagNameValidator(),
          new ArrayLengthValidator(0, 20)
        ],
        sanitizers: [
          new TagNormalizeSanitizer()
        ]
      }
    ];
  }
}

// 具体的なバリデーター実装
class RequiredValidator extends Validator {
  validate(value: any): ValidationResult {
    const isValid = value !== null && value !== undefined && value !== '';
    return {
      isValid,
      message: isValid ? '' : 'This field is required'
    };
  }
}

class StringLengthValidator extends Validator {
  constructor(
    private minLength: number,
    private maxLength: number
  ) {
    super();
  }

  validate(value: any): ValidationResult {
    if (typeof value !== 'string') {
      return { isValid: false, message: 'Must be a string' };
    }

    const length = value.length;
    const isValid = length >= this.minLength && length <= this.maxLength;
    
    return {
      isValid,
      message: isValid ? '' : 
        `Length must be between ${this.minLength} and ${this.maxLength} characters`
    };
  }
}

class NoScriptTagValidator extends Validator {
  validate(value: any): ValidationResult {
    if (typeof value !== 'string') return { isValid: true, message: '' };
    
    const hasScriptTag = /<script[\s\S]*?>[\s\S]*?<\/script>/gi.test(value);
    
    return {
      isValid: !hasScriptTag,
      message: hasScriptTag ? 'Script tags are not allowed' : ''
    };
  }
}
```

#### 3.2.2 サニタイザー実装

```typescript
class HTMLStripSanitizer extends Sanitizer {
  sanitize(value: any): string {
    if (typeof value !== 'string') return value;
    
    return value
      .replace(/<[^>]*>/g, '')  // HTMLタグ除去
      .replace(/&[^;]+;/g, '')  // HTMLエンティティ除去
      .trim();
  }
}

class MarkdownSanitizer extends Sanitizer {
  private readonly allowedTags = [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'em', 'strong', 'code', 'pre',
    'ul', 'ol', 'li', 'blockquote',
    'a', 'img'
  ];

  sanitize(value: any): string {
    if (typeof value !== 'string') return value;
    
    // Markdownを安全なHTMLに変換し、許可されたタグのみ残す
    const marked = this.parseMarkdown(value);
    return this.stripUnallowedTags(marked);
  }

  private stripUnallowedTags(html: string): string {
    // DOMParserを使用して安全にタグをフィルタリング
    // Node.js環境ではjsdomライブラリを使用
    const allowedPattern = new RegExp(
      `</?(?:${this.allowedTags.join('|')})[^>]*>`,
      'gi'
    );
    
    return html.replace(/<[^>]*>/g, (match) => {
      return allowedPattern.test(match) ? match : '';
    });
  }
}

class TagNormalizeSanitizer extends Sanitizer {
  sanitize(tags: any): string[] {
    if (!Array.isArray(tags)) return [];
    
    return tags
      .map(tag => typeof tag === 'string' ? tag : String(tag))
      .map(tag => tag.toLowerCase().trim())
      .filter(tag => tag.length > 0 && tag.length <= 50)
      .filter(tag => /^[a-z0-9\-_]+$/.test(tag))
      .slice(0, 20); // 最大20個まで
  }
}
```

## 4. データベースセキュリティ

### 4.1 SQLインジェクション対策

```typescript
class SecureDatabaseAccess {
  // ✅ 安全: Prisma ORMによるパラメータ化クエリ
  async findItemsSafe(filter: ItemFilter): Promise<Item[]> {
    return this.db.item.findMany({
      where: {
        type: filter.type,              // 自動エスケープ
        title: { contains: filter.search }, // 自動エスケープ
        status: {
          name: { in: filter.statuses }   // 自動エスケープ
        }
      }
    });
  }

  // ❌ 危険: 直接SQL実行（使用禁止）
  async findItemsUnsafe(searchTerm: string): Promise<Item[]> {
    // このようなコードは絶対に書かない
    const sql = `SELECT * FROM items WHERE title LIKE '%${searchTerm}%'`;
    return this.db.$queryRawUnsafe(sql);
  }

  // ✅ どうしても生SQLが必要な場合
  async findItemsWithRawSQL(searchTerm: string): Promise<Item[]> {
    // Prisma.$queryRaw with tagged template literals
    return this.db.$queryRaw`
      SELECT * FROM items 
      WHERE title LIKE ${`%${searchTerm}%`}
      AND type = ${'docs'}
    `;
  }
}
```

### 4.2 データベースファイル保護

```typescript
class DatabaseSecurity {
  private readonly DB_FILE_PERMISSIONS = 0o600; // Owner read/write only
  private readonly DB_DIR_PERMISSIONS = 0o700;  // Owner full access only

  async initializeDatabaseSecurity(): Promise<void> {
    const dbPath = this.getDatabasePath();
    const dbDir = path.dirname(dbPath);

    // データベースディレクトリの権限設定
    await this.ensureDirectoryPermissions(dbDir, this.DB_DIR_PERMISSIONS);

    // データベースファイルの権限設定
    if (await this.fileExists(dbPath)) {
      await this.setFilePermissions(dbPath, this.DB_FILE_PERMISSIONS);
    }

    // WALファイルとSHMファイルの権限も設定
    const walFile = `${dbPath}-wal`;
    const shmFile = `${dbPath}-shm`;
    
    if (await this.fileExists(walFile)) {
      await this.setFilePermissions(walFile, this.DB_FILE_PERMISSIONS);
    }
    if (await this.fileExists(shmFile)) {
      await this.setFilePermissions(shmFile, this.DB_FILE_PERMISSIONS);
    }
  }

  private async setFilePermissions(filePath: string, mode: number): Promise<void> {
    try {
      await fs.promises.chmod(filePath, mode);
      console.log(`Set permissions ${mode.toString(8)} for ${filePath}`);
    } catch (error) {
      console.error(`Failed to set permissions for ${filePath}:`, error);
      throw new SecurityError(`Cannot secure database file: ${filePath}`);
    }
  }

  private async ensureDirectoryPermissions(dirPath: string, mode: number): Promise<void> {
    try {
      await fs.promises.mkdir(dirPath, { recursive: true, mode });
    } catch (error) {
      // ディレクトリが既に存在する場合は権限のみ変更
      try {
        await fs.promises.chmod(dirPath, mode);
      } catch (chmodError) {
        console.error(`Failed to set directory permissions for ${dirPath}:`, chmodError);
        throw new SecurityError(`Cannot secure database directory: ${dirPath}`);
      }
    }
  }
}
```

### 4.3 データベース接続セキュリティ

```typescript
class SecureConnectionManager {
  createSecureConnection(): PrismaClient {
    const databaseUrl = this.buildSecureDatabaseUrl();
    
    return new PrismaClient({
      datasources: {
        db: { url: databaseUrl }
      },
      log: this.getSecureLogConfig(),
      errorFormat: 'minimal' // スタックトレース情報の制限
    });
  }

  private buildSecureDatabaseUrl(): string {
    const dbPath = this.validateDatabasePath();
    return `file:${dbPath}?connection_limit=1&pool_timeout=10&timeout=5`;
  }

  private validateDatabasePath(): string {
    const configPath = process.env.DATABASE_URL?.replace('file:', '') || 
                      './data/shirokuma.db';
    
    const resolvedPath = path.resolve(configPath);
    const dataDir = path.resolve('./data');
    
    // パストラバーサル攻撃を防ぐ
    if (!resolvedPath.startsWith(dataDir)) {
      throw new SecurityError(
        `Database path must be within data directory: ${resolvedPath}`
      );
    }

    // 危険な文字列をチェック
    const dangerousPatterns = [
      /\.\./,           // Path traversal
      /[<>"|*?]/,       // Invalid filename characters
      /^[a-zA-Z]:/      // Windows drive letter (Unix環境では不要)
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(resolvedPath)) {
        throw new SecurityError(`Invalid database path: ${resolvedPath}`);
      }
    }

    return resolvedPath;
  }

  private getSecureLogConfig() {
    if (process.env.NODE_ENV === 'production') {
      return ['error']; // 本番環境ではエラーのみログ
    }
    
    return ['query', 'info', 'warn', 'error'];
  }
}
```

## 5. ファイルシステムセキュリティ

### 5.1 パス検証

```typescript
class PathValidator {
  private readonly ALLOWED_EXTENSIONS = ['.db', '.db-wal', '.db-shm', '.json', '.md'];
  private readonly BLOCKED_PATHS = ['/etc', '/usr', '/bin', '/sbin', '/proc', '/sys'];
  private readonly MAX_PATH_LENGTH = 260;

  validatePath(inputPath: string): string {
    // 基本的な検証
    if (!inputPath || typeof inputPath !== 'string') {
      throw new SecurityError('Invalid path: path must be a non-empty string');
    }

    if (inputPath.length > this.MAX_PATH_LENGTH) {
      throw new SecurityError(`Path too long: ${inputPath.length} > ${this.MAX_PATH_LENGTH}`);
    }

    // パストラバーサル攻撃防止
    if (inputPath.includes('..')) {
      throw new SecurityError('Path traversal detected');
    }

    // Null byteインジェクション防止
    if (inputPath.includes('\0')) {
      throw new SecurityError('Null byte detected in path');
    }

    // 絶対パスを解決
    const resolvedPath = path.resolve(inputPath);

    // 許可されたディレクトリ内かチェック
    if (!this.isPathAllowed(resolvedPath)) {
      throw new SecurityError(`Access denied to path: ${resolvedPath}`);
    }

    // 拡張子チェック
    const extension = path.extname(resolvedPath);
    if (extension && !this.ALLOWED_EXTENSIONS.includes(extension)) {
      throw new SecurityError(`File extension not allowed: ${extension}`);
    }

    return resolvedPath;
  }

  private isPathAllowed(resolvedPath: string): boolean {
    const workingDir = process.cwd();
    const dataDir = path.resolve(workingDir, 'data');
    const configDir = path.resolve(workingDir, '.shirokuma');
    const tmpDir = path.resolve(workingDir, 'tmp');

    // 許可されたディレクトリ内かチェック
    const allowedDirs = [dataDir, configDir, tmpDir];
    const isInAllowedDir = allowedDirs.some(dir => 
      resolvedPath.startsWith(dir)
    );

    if (!isInAllowedDir) {
      return false;
    }

    // ブロックされたパス（システムディレクトリ）かチェック
    const isBlockedPath = this.BLOCKED_PATHS.some(blocked => 
      resolvedPath.startsWith(blocked)
    );

    return !isBlockedPath;
  }

  async checkFilePermissions(filePath: string): Promise<void> {
    try {
      // ファイルの存在と読み書き権限をチェック
      await fs.promises.access(filePath, fs.constants.F_OK);
      await fs.promises.access(filePath, fs.constants.R_OK | fs.constants.W_OK);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // ファイルが存在しない場合は問題なし（新規作成）
        return;
      }
      throw new SecurityError(`File permission check failed: ${filePath}`);
    }
  }
}
```

### 5.2 ファイル操作の安全化

```typescript
class SecureFileOperations {
  private pathValidator = new PathValidator();

  async readFile(filePath: string): Promise<string> {
    const validatedPath = this.pathValidator.validatePath(filePath);
    await this.pathValidator.checkFilePermissions(validatedPath);

    try {
      const content = await fs.promises.readFile(validatedPath, 'utf-8');
      return content;
    } catch (error) {
      console.error(`Failed to read file ${validatedPath}:`, error);
      throw new SecurityError(`File read failed: ${validatedPath}`);
    }
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    const validatedPath = this.pathValidator.validatePath(filePath);

    // コンテンツサイズチェック
    const contentSize = Buffer.byteLength(content, 'utf-8');
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    if (contentSize > MAX_FILE_SIZE) {
      throw new SecurityError(`File too large: ${contentSize} > ${MAX_FILE_SIZE}`);
    }

    try {
      // 一時ファイルに書き込んでからatomic rename
      const tempPath = `${validatedPath}.tmp`;
      await fs.promises.writeFile(tempPath, content, 'utf-8');
      await fs.promises.rename(tempPath, validatedPath);

      // ファイル権限を設定
      await fs.promises.chmod(validatedPath, 0o600);
    } catch (error) {
      console.error(`Failed to write file ${validatedPath}:`, error);
      throw new SecurityError(`File write failed: ${validatedPath}`);
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    const validatedPath = this.pathValidator.validatePath(filePath);

    try {
      await fs.promises.unlink(validatedPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // ファイルが存在しない場合は成功とみなす
        return;
      }
      console.error(`Failed to delete file ${validatedPath}:`, error);
      throw new SecurityError(`File deletion failed: ${validatedPath}`);
    }
  }
}
```

## 6. リソース保護

### 6.1 メモリ使用量制限

```typescript
class ResourceLimiter {
  private readonly MAX_CONTENT_SIZE = 102400;      // 100KB per item
  private readonly MAX_SEARCH_RESULTS = 100;      // Maximum search results
  private readonly MAX_RELATED_DEPTH = 3;         // Maximum graph traversal depth
  private readonly MAX_CONCURRENT_OPERATIONS = 5;  // Maximum concurrent operations

  validateContentSize(content: string): void {
    const size = Buffer.byteLength(content, 'utf-8');
    if (size > this.MAX_CONTENT_SIZE) {
      throw new ResourceError(
        `Content too large: ${size} bytes > ${this.MAX_CONTENT_SIZE} bytes`
      );
    }
  }

  validateSearchParams(limit?: number): number {
    const actualLimit = limit || 20;
    if (actualLimit > this.MAX_SEARCH_RESULTS) {
      console.warn(
        `Search limit reduced from ${actualLimit} to ${this.MAX_SEARCH_RESULTS}`
      );
      return this.MAX_SEARCH_RESULTS;
    }
    return actualLimit;
  }

  validateGraphDepth(depth?: number): number {
    const actualDepth = depth || 1;
    if (actualDepth > this.MAX_RELATED_DEPTH) {
      console.warn(
        `Graph depth reduced from ${actualDepth} to ${this.MAX_RELATED_DEPTH}`
      );
      return this.MAX_RELATED_DEPTH;
    }
    return actualDepth;
  }
}
```

### 6.2 レート制限

```typescript
class RateLimiter {
  private operations = new Map<string, number[]>();
  private readonly WINDOW_SIZE = 60000;  // 1分
  private readonly MAX_OPERATIONS = 100; // 1分間に100操作

  checkRateLimit(operation: string): void {
    const now = Date.now();
    const windowStart = now - this.WINDOW_SIZE;
    
    // 操作履歴を取得
    const operationTimes = this.operations.get(operation) || [];
    
    // ウィンドウ外の古い記録を削除
    const recentOperations = operationTimes.filter(time => time > windowStart);
    
    // レート制限チェック
    if (recentOperations.length >= this.MAX_OPERATIONS) {
      throw new RateLimitError(
        `Rate limit exceeded for ${operation}: ${recentOperations.length} > ${this.MAX_OPERATIONS}`
      );
    }

    // 現在の操作を記録
    recentOperations.push(now);
    this.operations.set(operation, recentOperations);
  }

  // クリーンアップ（メモリリーク防止）
  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.WINDOW_SIZE;

    for (const [operation, times] of this.operations.entries()) {
      const recentTimes = times.filter(time => time > windowStart);
      if (recentTimes.length === 0) {
        this.operations.delete(operation);
      } else {
        this.operations.set(operation, recentTimes);
      }
    }
  }
}
```

### 6.3 プロセス監視

```typescript
class ProcessMonitor {
  private startTime = Date.now();
  private operationCount = 0;
  
  monitor(): NodeJS.Timeout {
    return setInterval(() => {
      this.checkMemoryUsage();
      this.checkUptime();
      this.logMetrics();
    }, 30000); // 30秒間隔
  }

  private checkMemoryUsage(): void {
    const memUsage = process.memoryUsage();
    const MAX_HEAP_SIZE = 100 * 1024 * 1024; // 100MB

    if (memUsage.heapUsed > MAX_HEAP_SIZE) {
      console.warn(`High memory usage: ${memUsage.heapUsed} bytes`);
      
      // ガベージコレクション強制実行
      if (global.gc) {
        global.gc();
      }
    }
  }

  private checkUptime(): void {
    const uptime = Date.now() - this.startTime;
    const MAX_UPTIME = 24 * 60 * 60 * 1000; // 24時間

    if (uptime > MAX_UPTIME) {
      console.warn(`Long uptime detected: ${uptime}ms, consider restart`);
    }
  }

  private logMetrics(): void {
    const memUsage = process.memoryUsage();
    const uptime = Date.now() - this.startTime;
    
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      type: 'metrics',
      memory: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss
      },
      uptime,
      operationCount: this.operationCount,
      pid: process.pid
    }));
  }
}
```

## 7. ログ・監査

### 7.1 セキュリティログ

```typescript
interface SecurityLogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  event_type: string;
  message: string;
  details?: any;
  process_info: {
    pid: number;
    working_directory: string;
    user: string;
  };
}

class SecurityLogger {
  log(level: SecurityLogEntry['level'], eventType: string, message: string, details?: any): void {
    const entry: SecurityLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      event_type: eventType,
      message,
      details: this.sanitizeLogDetails(details),
      process_info: {
        pid: process.pid,
        working_directory: process.cwd(),
        user: os.userInfo().username
      }
    };

    console.log(JSON.stringify(entry));
  }

  logValidationError(field: string, value: any, error: string): void {
    this.log('WARN', 'validation_error', `Validation failed for field: ${field}`, {
      field,
      error,
      value_type: typeof value,
      value_length: typeof value === 'string' ? value.length : undefined
    });
  }

  logSecurityViolation(violation: string, details: any): void {
    this.log('ERROR', 'security_violation', violation, details);
  }

  logResourceUsage(operation: string, resourceUsage: any): void {
    this.log('INFO', 'resource_usage', `Resource usage for ${operation}`, resourceUsage);
  }

  private sanitizeLogDetails(details: any): any {
    if (!details) return details;

    // 機密情報の除去
    const sanitized = { ...details };
    
    // パスワードやトークンらしきフィールドを除去
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    // 大きすぎる値を切り詰める
    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === 'string' && value.length > 1000) {
        sanitized[key] = value.substring(0, 1000) + '...[TRUNCATED]';
      }
    }

    return sanitized;
  }
}
```

## 8. エラーハンドリング・情報開示制限

### 8.1 安全なエラーレスポンス

```typescript
class SecurityErrorHandler {
  handleError(error: Error, context: any): MCPError {
    // セキュリティ関連エラーの特別処理
    if (error instanceof ValidationError) {
      return this.handleValidationError(error);
    }
    
    if (error instanceof SecurityError) {
      return this.handleSecurityError(error, context);
    }
    
    if (error instanceof DatabaseError) {
      return this.handleDatabaseError(error);
    }

    // 一般的なエラー
    return this.handleGenericError(error);
  }

  private handleValidationError(error: ValidationError): MCPError {
    return {
      code: 1002,
      message: 'Validation failed',
      data: {
        type: 'ValidationError',
        details: {
          field: error.field,
          constraint: error.message
          // 入力値は含めない（情報漏洩防止）
        },
        timestamp: new Date().toISOString()
      }
    };
  }

  private handleSecurityError(error: SecurityError, context: any): MCPError {
    // セキュリティログに記録
    securityLogger.logSecurityViolation(error.message, {
      context,
      stack: error.stack
    });

    return {
      code: 1005,
      message: 'Access denied',
      data: {
        type: 'SecurityError',
        // 詳細情報は含めない
        details: 'Access denied',
        timestamp: new Date().toISOString()
      }
    };
  }

  private handleDatabaseError(error: DatabaseError): MCPError {
    // データベース内部情報の漏洩を防ぐ
    return {
      code: 1003,
      message: 'Database operation failed',
      data: {
        type: 'DatabaseError',
        details: 'An internal error occurred',
        timestamp: new Date().toISOString()
      }
    };
  }

  private handleGenericError(error: Error): MCPError {
    // スタックトレースや内部情報の漏洩を防ぐ
    return {
      code: -32603,
      message: 'Internal error',
      data: {
        type: 'InternalError',
        details: 'An internal error occurred',
        timestamp: new Date().toISOString()
      }
    };
  }
}
```

## 9. セキュリティ設定管理

### 9.1 環境設定の検証

```typescript
class SecurityConfig {
  private config: Map<string, any> = new Map();

  loadConfig(): void {
    // 環境変数から設定を読み込み
    const configs = {
      DATABASE_URL: this.validateDatabaseUrl(process.env.DATABASE_URL),
      LOG_LEVEL: this.validateLogLevel(process.env.LOG_LEVEL),
      MAX_CONTENT_SIZE: this.validateNumber(process.env.MAX_CONTENT_SIZE, 102400),
      ENABLE_DEBUG: this.validateBoolean(process.env.ENABLE_DEBUG, false)
    };

    for (const [key, value] of Object.entries(configs)) {
      this.config.set(key, value);
    }

    this.logConfigurationSecurity();
  }

  private validateDatabaseUrl(url?: string): string {
    const defaultUrl = 'file:./data/shirokuma.db';
    if (!url) return defaultUrl;

    // SQLiteファイルパスのみ許可
    if (!url.startsWith('file:')) {
      console.warn('Invalid DATABASE_URL, using default');
      return defaultUrl;
    }

    return url;
  }

  private validateLogLevel(level?: string): string {
    const validLevels = ['error', 'warn', 'info', 'debug'];
    const defaultLevel = 'info';
    
    if (!level || !validLevels.includes(level)) {
      return defaultLevel;
    }

    return level;
  }

  private validateNumber(value?: string, defaultValue: number): number {
    if (!value) return defaultValue;
    
    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed < 0) {
      return defaultValue;
    }
    
    return parsed;
  }

  private validateBoolean(value?: string, defaultValue: boolean): boolean {
    if (!value) return defaultValue;
    
    return ['true', '1', 'yes'].includes(value.toLowerCase());
  }

  private logConfigurationSecurity(): void {
    const secureConfig = {
      database_configured: this.config.has('DATABASE_URL'),
      log_level: this.config.get('LOG_LEVEL'),
      debug_enabled: this.config.get('ENABLE_DEBUG'),
      // 機密情報は含めない
    };

    console.log('Security configuration loaded:', JSON.stringify(secureConfig));
  }
}
```

## 10. まとめ

本セキュリティ設計では、ローカル環境でのシングルユーザー運用に適した以下の対策を実装しています：

### 10.1 主要なセキュリティ機能

1. **入力検証**: 包括的なデータ検証・サニタイゼーション
2. **SQLインジェクション対策**: ORMによるパラメータ化クエリ
3. **ファイルシステム保護**: パス検証・権限制御
4. **リソース制限**: メモリ・CPU・ディスク使用量の制限
5. **監査ログ**: セキュリティイベントの詳細な記録
6. **エラー処理**: 情報漏洩を防ぐ安全なエラーレスポンス

### 10.2 セキュリティポリシー

- **最小権限の原則**: 必要最小限のファイルアクセス権限
- **多層防御**: 複数のセキュリティレイヤーによる保護
- **ログと監視**: すべてのセキュリティイベントを記録
- **設定の検証**: 設定値の妥当性確認
- **リソース管理**: システムリソースの適切な制限

この設計により、ローカル環境での安全な運用を実現しています。