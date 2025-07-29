# フェーズ4: DRY原則適用計画（2週間）

## 概要
重複コードを排除し、保守性と拡張性を向上させます。
100箇所以上の重複パターンを共通化し、コードベースをスリム化します。

## 現状分析

### 主要な重複パターン
1. **初期化チェック** - 40箇所以上
2. **型チェックとエラー** - 5箇所
3. **ディレクトリ確認** - 15箇所
4. **SQLite同期処理** - 各リポジトリで重複
5. **JSONレスポンス生成** - 全ハンドラーで重複
6. **関連アイテム処理** - task/documentで重複

### 影響範囲
- 推定削減可能コード: 約2,000行
- 影響ファイル数: 30ファイル以上

## Week 1: 共通ユーティリティの作成

### Day 1-2: 初期化管理の共通化

```typescript
// src/utils/initialization-manager.ts
export interface Initializable {
  initialize(): Promise<void>;
  isInitialized(): boolean;
}

export class InitializationManager {
  private static instances = new WeakMap<object, InitializationManager>();
  private initPromise: Promise<void> | null = null;
  private initialized = false;
  
  static for(instance: Initializable): InitializationManager {
    if (!this.instances.has(instance)) {
      this.instances.set(instance, new InitializationManager());
    }
    return this.instances.get(instance)!;
  }
  
  async ensureInitialized(instance: Initializable): Promise<void> {
    if (this.initialized) return;
    
    if (this.initPromise) {
      await this.initPromise;
      return;
    }
    
    this.initPromise = this.performInitialization(instance);
    await this.initPromise;
  }
  
  private async performInitialization(instance: Initializable): Promise<void> {
    try {
      await instance.initialize();
      this.initialized = true;
    } catch (error) {
      this.initPromise = null; // リトライ可能にする
      throw new InitializationError(
        `Failed to initialize ${instance.constructor.name}`,
        error
      );
    }
  }
}

// デコレータ版
export function RequiresInitialization(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;
  
  descriptor.value = async function(this: Initializable, ...args: any[]) {
    await InitializationManager.for(this).ensureInitialized(this);
    return originalMethod.apply(this, args);
  };
  
  return descriptor;
}

// 使用例
export class FileIssueDatabase implements Initializable {
  async initialize(): Promise<void> {
    await this.connection.initialize();
  }
  
  isInitialized(): boolean {
    return this.connection.isInitialized();
  }
  
  @RequiresInitialization
  async getAllStatuses(): Promise<Status[]> {
    // 初期化が保証されている
    return this.statusRepo.getAllStatuses();
  }
}
```

### Day 3: ファイルシステム操作の共通化

```typescript
// src/utils/file-system-helper.ts
export class FileSystemHelper {
  /**
   * ディレクトリの存在確認と作成
   */
  static async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }
  
  /**
   * ファイルの安全な読み込み
   */
  static async readFileSafe(filePath: string): Promise<string | null> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw new FileSystemError('read', filePath, error.message);
    }
  }
  
  /**
   * ファイルの安全な書き込み（アトミック）
   */
  static async writeFileAtomic(
    filePath: string,
    content: string
  ): Promise<void> {
    const tempPath = `${filePath}.tmp`;
    const dir = path.dirname(filePath);
    
    await this.ensureDirectory(dir);
    
    try {
      await fs.writeFile(tempPath, content, 'utf-8');
      await fs.rename(tempPath, filePath);
    } catch (error) {
      // クリーンアップ
      try {
        await fs.unlink(tempPath);
      } catch {
        // 無視
      }
      
      throw new FileSystemError('write', filePath, error.message);
    }
  }
  
  /**
   * ディレクトリ内のファイル検索
   */
  static async findFiles(
    dir: string,
    pattern: RegExp
  ): Promise<string[]> {
    try {
      const files = await fs.readdir(dir);
      return files.filter(file => pattern.test(file));
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw new FileSystemError('readdir', dir, error.message);
    }
  }
}

// 既存コードの置き換え例
// Before
if (!fs.existsSync(this.tasksDir)) {
  fs.mkdirSync(this.tasksDir, { recursive: true });
}

// After
await FileSystemHelper.ensureDirectory(this.tasksDir);
```

### Day 4: レスポンスフォーマッターの共通化

```typescript
// src/utils/response-formatter.ts
export class ResponseFormatter {
  /**
   * 成功レスポンスの生成
   */
  static success<T>(
    data: T,
    message?: string,
    metadata?: Record<string, any>
  ): ToolResponse {
    const response = {
      data,
      ...(message && { message }),
      ...(metadata && { metadata }),
    };
    
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(response, null, 2),
      }],
    };
  }
  
  /**
   * エラーレスポンスの生成
   */
  static error(error: BaseError): ToolResponse {
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          error: error.toJSON(),
        }, null, 2),
      }],
    };
  }
  
  /**
   * ページネーション付きレスポンス
   */
  static paginated<T>(
    items: T[],
    page: number,
    pageSize: number,
    total: number
  ): ToolResponse {
    return this.success(items, undefined, {
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  }
  
  /**
   * 作成完了レスポンス
   */
  static created<T>(item: T, type: string): ToolResponse {
    return this.success(item, `${type} created successfully`);
  }
  
  /**
   * 更新完了レスポンス
   */
  static updated<T>(item: T, type: string): ToolResponse {
    return this.success(item, `${type} updated successfully`);
  }
  
  /**
   * 削除完了レスポンス
   */
  static deleted(type: string, id: number | string): ToolResponse {
    return this.success(
      { id },
      `${type} ${id} deleted successfully`
    );
  }
}

// 使用例
// Before
return {
  content: [{
    type: 'text' as const,
    text: JSON.stringify({ data: items }, null, 2),
  }],
};

// After
return ResponseFormatter.success(items);
```

### Day 5: バリデーションヘルパーの共通化

```typescript
// src/utils/validation-helper.ts
export class ValidationHelper {
  /**
   * 型の存在確認とエラー
   */
  static async validateType(
    type: string,
    validator: (type: string) => Promise<boolean>
  ): Promise<void> {
    const isValid = await validator(type);
    if (!isValid) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Unknown type: ${type}`
      );
    }
  }
  
  /**
   * 必須フィールドの検証
   */
  static validateRequired<T>(
    value: T | undefined | null,
    fieldName: string
  ): T {
    if (value === undefined || value === null) {
      throw new ValidationError(`${fieldName} is required`);
    }
    return value;
  }
  
  /**
   * 文字列長の検証
   */
  static validateStringLength(
    value: string,
    fieldName: string,
    min?: number,
    max?: number
  ): void {
    if (min && value.length < min) {
      throw new ValidationError(
        `${fieldName} must be at least ${min} characters`
      );
    }
    
    if (max && value.length > max) {
      throw new ValidationError(
        `${fieldName} must be at most ${max} characters`
      );
    }
  }
  
  /**
   * 日付フォーマットの検証
   */
  static validateDateFormat(
    value: string,
    fieldName: string
  ): void {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new ValidationError(
        `${fieldName} must be in YYYY-MM-DD format`
      );
    }
    
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new ValidationError(
        `${fieldName} is not a valid date`
      );
    }
  }
  
  /**
   * 列挙型の検証
   */
  static validateEnum<T extends string>(
    value: string,
    fieldName: string,
    validValues: T[]
  ): T {
    if (!validValues.includes(value as T)) {
      throw new ValidationError(
        `${fieldName} must be one of: ${validValues.join(', ')}`
      );
    }
    return value as T;
  }
}
```

## Week 2: 高度な共通化

### Day 6-7: SQLite同期処理の抽象化

```typescript
// src/database/sync/base-sync-service.ts
export abstract class BaseSyncService<T> {
  constructor(
    protected db: Database,
    protected tableName: string,
    protected logger: Logger
  ) {}
  
  /**
   * エンティティの同期
   */
  async sync(entity: T, type: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      await this.db.runAsync('BEGIN TRANSACTION');
      
      // 基本データの同期
      await this.syncCore(entity, type);
      
      // タグの同期
      if (this.hasTags(entity)) {
        await this.syncTags(entity, type);
      }
      
      // 関連アイテムの同期
      if (this.hasRelations(entity)) {
        await this.syncRelations(entity, type);
      }
      
      await this.db.runAsync('COMMIT');
      
      this.logger.debug(`Synced ${type} in ${Date.now() - startTime}ms`);
    } catch (error) {
      await this.db.runAsync('ROLLBACK');
      throw new DatabaseError(
        'sync',
        `Failed to sync ${type}: ${error.message}`
      );
    }
  }
  
  /**
   * 基本データの同期（サブクラスで実装）
   */
  protected abstract syncCore(entity: T, type: string): Promise<void>;
  
  /**
   * タグの同期（共通実装）
   */
  protected async syncTags(entity: T, type: string): Promise<void> {
    const id = this.getId(entity);
    const tags = this.getTags(entity);
    
    // 既存のタグ関係を削除
    await this.db.runAsync(
      `DELETE FROM ${type}_tags WHERE ${type}_id = ?`,
      [id]
    );
    
    // 新しいタグ関係を挿入
    for (const tagName of tags) {
      const tagId = await this.getOrCreateTagId(tagName);
      await this.db.runAsync(
        `INSERT INTO ${type}_tags (${type}_id, tag_id) VALUES (?, ?)`,
        [id, tagId]
      );
    }
  }
  
  /**
   * 関連アイテムの同期（共通実装）
   */
  protected async syncRelations(entity: T, type: string): Promise<void> {
    const id = this.getId(entity);
    
    // 関連タスク
    const relatedTasks = this.getRelatedTasks(entity);
    if (relatedTasks.length > 0) {
      await this.syncRelatedItems(
        'related_tasks',
        type,
        id,
        relatedTasks
      );
    }
    
    // 関連ドキュメント
    const relatedDocs = this.getRelatedDocuments(entity);
    if (relatedDocs.length > 0) {
      await this.syncRelatedItems(
        'related_documents',
        type,
        id,
        relatedDocs
      );
    }
  }
  
  private async syncRelatedItems(
    table: string,
    sourceType: string,
    sourceId: number | string,
    items: string[]
  ): Promise<void> {
    // 既存の関係を削除
    await this.db.runAsync(
      `DELETE FROM ${table} WHERE source_type = ? AND source_id = ?`,
      [sourceType, sourceId]
    );
    
    // 新しい関係を挿入
    for (const item of items) {
      const [targetType, targetId] = item.split('-');
      if (targetType && targetId) {
        await this.db.runAsync(
          `INSERT INTO ${table} (source_type, source_id, target_type, target_id)
           VALUES (?, ?, ?, ?)`,
          [sourceType, sourceId, targetType, targetId]
        );
      }
    }
  }
  
  // サブクラスで実装するメソッド
  protected abstract getId(entity: T): number | string;
  protected abstract hasTags(entity: T): boolean;
  protected abstract getTags(entity: T): string[];
  protected abstract hasRelations(entity: T): boolean;
  protected abstract getRelatedTasks(entity: T): string[];
  protected abstract getRelatedDocuments(entity: T): string[];
}

// 実装例
export class TaskSyncService extends BaseSyncService<Task> {
  protected async syncCore(task: Task, type: string): Promise<void> {
    await this.db.runAsync(
      `INSERT OR REPLACE INTO search_tasks 
       (type, id, title, summary, content, priority, status_id, 
        start_date, end_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        type,
        task.id,
        task.title,
        task.description,
        task.content,
        task.priority,
        task.status_id,
        task.start_date,
        task.end_date,
        task.created_at,
        task.updated_at,
      ]
    );
  }
  
  protected getId(task: Task): number {
    return task.id;
  }
  
  protected hasTags(task: Task): boolean {
    return task.tags && task.tags.length > 0;
  }
  
  protected getTags(task: Task): string[] {
    return task.tags || [];
  }
  
  // ... 他のメソッドも実装
}
```

### Day 8-9: リポジトリ基底クラスの強化

```typescript
// src/database/base-markdown-repository.ts
export abstract class BaseMarkdownRepository<T extends { id: number }> {
  constructor(
    protected db: Database,
    protected baseDir: string,
    protected entityType: string,
    protected syncService: BaseSyncService<T>
  ) {}
  
  /**
   * エンティティの作成（テンプレートメソッドパターン）
   */
  async create(data: Partial<T>): Promise<T> {
    // 1. ID生成
    const id = await this.getNextId();
    
    // 2. エンティティ構築
    const entity = await this.buildEntity(id, data);
    
    // 3. バリデーション
    await this.validate(entity);
    
    // 4. ファイル保存
    await this.saveToFile(entity);
    
    // 5. DB同期
    await this.syncService.sync(entity, this.entityType);
    
    // 6. イベント発火
    await this.emitCreatedEvent(entity);
    
    return entity;
  }
  
  /**
   * エンティティの更新
   */
  async update(id: number, updates: Partial<T>): Promise<T | null> {
    // 1. 既存エンティティ取得
    const existing = await this.findById(id);
    if (!existing) return null;
    
    // 2. マージ
    const updated = await this.mergeUpdates(existing, updates);
    
    // 3. バリデーション
    await this.validate(updated);
    
    // 4. ファイル保存
    await this.saveToFile(updated);
    
    // 5. DB同期
    await this.syncService.sync(updated, this.entityType);
    
    // 6. イベント発火
    await this.emitUpdatedEvent(existing, updated);
    
    return updated;
  }
  
  /**
   * エンティティの削除
   */
  async delete(id: number): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    
    // 1. ファイル削除
    await this.deleteFile(id);
    
    // 2. DB削除
    await this.deleteFromDb(id);
    
    // 3. イベント発火
    await this.emitDeletedEvent(existing);
    
    return true;
  }
  
  /**
   * ファイル操作の共通化
   */
  protected async saveToFile(entity: T): Promise<void> {
    const filePath = this.getFilePath(entity.id);
    const content = this.serialize(entity);
    await FileSystemHelper.writeFileAtomic(filePath, content);
  }
  
  protected async deleteFile(id: number): Promise<void> {
    const filePath = this.getFilePath(id);
    await fs.unlink(filePath);
  }
  
  protected getFilePath(id: number): string {
    const dir = path.join(this.baseDir, this.entityType);
    const filename = `${this.entityType}-${id}.md`;
    return path.join(dir, filename);
  }
  
  // サブクラスで実装
  protected abstract buildEntity(id: number, data: Partial<T>): Promise<T>;
  protected abstract validate(entity: T): Promise<void>;
  protected abstract serialize(entity: T): string;
  protected abstract deserialize(content: string): T;
  protected abstract mergeUpdates(existing: T, updates: Partial<T>): Promise<T>;
}
```

### Day 10-11: パターンマッチングの共通化

```typescript
// src/utils/pattern-matcher.ts
export class PatternMatcher {
  /**
   * ファイル名パターンの生成
   */
  static createFilePattern(type: string, id?: number): RegExp {
    if (id !== undefined) {
      return new RegExp(`^${type}-${id}\\.md$`);
    }
    return new RegExp(`^${type}-(\\d+)\\.md$`);
  }
  
  /**
   * 参照パターンの解析
   */
  static parseReference(ref: string): { type: string; id: number } | null {
    const match = ref.match(/^(\w+)-(\d+)$/);
    if (!match) return null;
    
    return {
      type: match[1],
      id: parseInt(match[2], 10),
    };
  }
  
  /**
   * タグパターンの検証
   */
  static isValidTag(tag: string): boolean {
    return /^[a-zA-Z0-9_-]+$/.test(tag) && tag.length <= 50;
  }
  
  /**
   * 日付パターンの検証と解析
   */
  static parseDate(dateStr: string): Date | null {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return null;
    }
    
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  }
  
  /**
   * セッションIDパターンの生成と解析
   */
  static createSessionId(date: Date = new Date()): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    
    return [
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate()),
      pad(date.getHours()),
      pad(date.getMinutes()),
      pad(date.getSeconds()),
      date.getMilliseconds().toString().padStart(3, '0'),
    ].join('.');
  }
  
  static parseSessionId(id: string): Date | null {
    const match = id.match(
      /^(\d{4})\.(\d{2})\.(\d{2})\.(\d{2})\.(\d{2})\.(\d{2})\.(\d{3})$/
    );
    
    if (!match) return null;
    
    const [, year, month, day, hour, minute, second, ms] = match;
    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      parseInt(second),
      parseInt(ms)
    );
  }
}
```

### Day 12-13: 定数とマジックナンバーの集約

```typescript
// src/constants/index.ts
export const FILE_CONSTANTS = {
  ENCODING: 'utf-8' as const,
  TEMP_SUFFIX: '.tmp',
  MARKDOWN_EXTENSION: '.md',
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
} as const;

export const DATABASE_CONSTANTS = {
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 100,
  MAX_RETRY_DELAY: 5000,
  TRANSACTION_TIMEOUT: 30000,
  BUSY_TIMEOUT: 5000,
} as const;

export const VALIDATION_CONSTANTS = {
  MIN_TITLE_LENGTH: 3,
  MAX_TITLE_LENGTH: 200,
  MIN_TAG_LENGTH: 2,
  MAX_TAG_LENGTH: 50,
  MAX_TAGS_PER_ITEM: 20,
  MAX_CONTENT_LENGTH: 100000,
} as const;

export const PRIORITY_LEVELS = ['high', 'medium', 'low'] as const;
export type Priority = typeof PRIORITY_LEVELS[number];

export const DEFAULT_STATUSES = [
  { name: 'Open', is_closed: false },
  { name: 'In Progress', is_closed: false },
  { name: 'Review', is_closed: false },
  { name: 'Completed', is_closed: true },
  { name: 'Closed', is_closed: true },
  { name: 'On Hold', is_closed: false },
  { name: 'Cancelled', is_closed: true },
] as const;

export const ERROR_MESSAGES = {
  TYPE_NOT_FOUND: (type: string) => `Unknown type: ${type}`,
  ITEM_NOT_FOUND: (type: string, id: number) => `${type} with ID ${id} not found`,
  VALIDATION_FAILED: (field: string, reason: string) => `${field} validation failed: ${reason}`,
  DATABASE_ERROR: (operation: string) => `Database ${operation} failed`,
  FILE_ERROR: (operation: string, path: string) => `File ${operation} failed for ${path}`,
} as const;

// 環境変数のデフォルト値
export const ENV_DEFAULTS = {
  DATA_DIR: './database',
  LOG_LEVEL: 'info',
  NODE_ENV: 'development',
} as const;
```

### Day 14: 統合とリファクタリング

#### マイグレーションスクリプト
```typescript
// scripts/apply-dry-refactoring.ts
import { Project } from 'ts-morph';

async function applyDryRefactoring() {
  const project = new Project();
  project.addSourceFilesAtPaths('src/**/*.ts');
  
  // 1. 初期化パターンの置き換え
  replaceInitializationPattern(project);
  
  // 2. ファイルシステム操作の置き換え
  replaceFileSystemOperations(project);
  
  // 3. レスポンス生成の置き換え
  replaceResponseGeneration(project);
  
  // 4. 定数の置き換え
  replaceHardcodedConstants(project);
  
  await project.save();
}

function replaceInitializationPattern(project: Project) {
  const sourceFiles = project.getSourceFiles();
  
  for (const file of sourceFiles) {
    // パターンを検索して置き換え
    const text = file.getText();
    const pattern = /if\s*\(this\.initializationPromise\)\s*{\s*await\s+this\.initializationPromise;\s*}/g;
    
    if (pattern.test(text)) {
      // インポート追加
      file.addImportDeclaration({
        moduleSpecifier: '../utils/initialization-manager',
        namedImports: ['RequiresInitialization'],
      });
      
      // メソッドにデコレータ追加
      // ... 実装
    }
  }
}
```

## 成果物

### 新規作成ファイル
1. `src/utils/initialization-manager.ts`
2. `src/utils/file-system-helper.ts`
3. `src/utils/response-formatter.ts`
4. `src/utils/validation-helper.ts`
5. `src/utils/pattern-matcher.ts`
6. `src/database/sync/base-sync-service.ts`
7. `src/database/base-markdown-repository.ts`
8. `src/constants/index.ts`

### 削除可能なコード
- 約2,000行の重複コード

## 成功指標

### 定量的指標
- 重複コード: 100箇所 → 10箇所以下
- コードベース全体: 約-20%削減
- 共通ユーティリティ: 8個以上作成
- マジックナンバー: 34箇所 → 0箇所

### 定性的指標
- 新機能追加時のコード量削減
- バグ修正の一箇所対応
- コードの一貫性向上

## リスクと対策

### リスク1: 過度な抽象化
- **対策**: 3回以上の重複のみ共通化

### リスク2: パフォーマンス劣化
- **対策**: ベンチマークテストで検証

### リスク3: 可読性低下
- **対策**: 明確な命名と適切なドキュメント