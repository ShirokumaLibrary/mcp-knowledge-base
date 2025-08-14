# バリデーション仕様書

## 1. 概要

本書は、Shirokuma MCP Knowledge Base v0.8.0のデータバリデーション仕様を定義します。入力検証、ビジネスルール、データ整合性の確保について記述します。

## 2. バリデーション階層

### 2.1 階層構造

```
1. フロントエンド検証（CLI/MCP）
   ↓
2. アプリケーション層検証（Services）
   ↓
3. ドメイン層検証（Entities）
   ↓
4. データベース層検証（Constraints）
```

### 2.2 検証タイミング

| タイミング | 内容 | 責任層 |
|-----------|------|--------|
| 入力時 | 形式チェック | フロントエンド |
| 処理前 | ビジネスルール | アプリケーション |
| 保存前 | ドメインルール | ドメイン |
| 保存時 | 制約チェック | データベース |

## 3. フィールド別バリデーション

### 3.1 基本フィールド

#### id
```typescript
{
  type: "number",
  required: false,  // 作成時は不要
  min: 1,
  integer: true,
  unique: true
}
```

#### type
```typescript
{
  type: "string",
  required: true,
  minLength: 1,
  maxLength: 50,
  pattern: /^[a-z][a-z0-9_]*$/,  // 小文字英数字とアンダースコア
  transform: (value) => value.toLowerCase().trim()
}
```

#### title
```typescript
{
  type: "string",
  required: true,
  minLength: 1,
  maxLength: 200,
  trim: true,
  sanitize: true  // XSS対策
}
```

#### description
```typescript
{
  type: "string",
  required: false,
  maxLength: 1000,
  trim: true,
  sanitize: true
}
```

#### content
```typescript
{
  type: "string",
  required: false,
  maxLength: 102400,  // 100KB
  format: "markdown",
  sanitize: true
}
```

### 3.2 ステータス・優先度

#### status
```typescript
{
  type: "string",
  required: false,
  default: "Open",
  enum: [
    "Open", "Specification", "Waiting", "Ready",
    "In Progress", "Review", "Testing", "Pending",
    "Completed", "Closed", "Canceled", "Rejected"
  ]
}
```

#### priority
```typescript
{
  type: "string",
  required: false,
  default: "MEDIUM",
  enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW", "MINIMAL"]
}
```

### 3.3 オプションフィールド

#### category
```typescript
{
  type: "string",
  required: false,
  maxLength: 50,
  pattern: /^[a-zA-Z0-9-_]+$/,
  trim: true
}
```

#### startDate / endDate
```typescript
{
  type: "date",
  required: false,
  format: "ISO8601",
  validation: {
    endDate: (value, item) => {
      if (item.startDate && value) {
        return value >= item.startDate;
      }
      return true;
    }
  }
}
```

#### version
```typescript
{
  type: "string",
  required: false,
  maxLength: 20,
  pattern: /^v?\d+(\.\d+)*(-[a-zA-Z0-9]+)?$/,  // セマンティックバージョニング
  examples: ["1.0.0", "v2.1.3", "0.9.0-beta"]
}
```

### 3.4 関連・タグ

#### related
```typescript
{
  type: "array",
  required: false,
  items: {
    type: "number",
    min: 1,
    integer: true
  },
  maxItems: 100,
  unique: true,
  validation: async (ids) => {
    // 存在チェック
    const existing = await checkItemsExist(ids);
    return existing.length === ids.length;
  }
}
```

#### tags
```typescript
{
  type: "array",
  required: false,
  items: {
    type: "string",
    minLength: 1,
    maxLength: 30,
    pattern: /^[a-zA-Z0-9-_]+$/,
    transform: (tag) => tag.toLowerCase().trim()
  },
  maxItems: 20,
  unique: true
}
```

## 4. ビジネスルール検証

### 4.1 作成時ルール

```typescript
interface CreateValidationRules {
  // 必須フィールドチェック
  requiredFields: ['type', 'title'];
  
  // タイプ別デフォルト値
  typeDefaults: {
    issues: {
      status: 'Open',
      priority: 'HIGH'
    },
    tasks: {
      status: 'Open',
      priority: 'MEDIUM'
    },
    docs: {
      status: 'Open',
      priority: 'LOW'
    }
  };
  
  // カスタムバリデーション
  customValidations: [
    {
      name: 'session-requires-date',
      condition: (item) => item.type === 'sessions',
      validate: (item) => !!item.startDate,
      message: 'Sessions must have a start date'
    }
  ];
}
```

### 4.2 更新時ルール

```typescript
interface UpdateValidationRules {
  // 変更不可フィールド
  immutableFields: ['id', 'type', 'createdAt'];
  
  // ステータス遷移ルール（オプション）
  statusTransitions: {
    'Open': ['In Progress', 'Closed', 'Canceled'],
    'In Progress': ['Review', 'Pending', 'Completed'],
    'Review': ['In Progress', 'Testing', 'Completed'],
    'Completed': ['Closed', 'In Progress']
  };
  
  // 条件付き必須
  conditionalRequired: [
    {
      condition: (item) => item.status === 'Completed',
      required: ['endDate'],
      message: 'End date is required for completed items'
    }
  ];
}
```

### 4.3 削除時ルール

```typescript
interface DeleteValidationRules {
  // 削除制約
  preventDelete: [
    {
      name: 'has-relations',
      check: async (id) => {
        const relations = await getRelatedItems(id);
        return relations.length === 0;
      },
      message: 'Cannot delete item with active relations'
    },
    {
      name: 'is-current-state',
      check: async (item) => item.type !== 'current_state',
      message: 'Cannot delete current state'
    }
  ];
}
```

## 5. データ型別検証

### 5.1 文字列検証

```typescript
class StringValidator {
  static validate(value: any, rules: StringRules): ValidationResult {
    const errors: ValidationError[] = [];
    
    // 型チェック
    if (typeof value !== 'string') {
      errors.push({ field: rules.field, error: 'Must be a string' });
      return { valid: false, errors };
    }
    
    // 長さチェック
    if (rules.minLength && value.length < rules.minLength) {
      errors.push({ 
        field: rules.field, 
        error: `Minimum length is ${rules.minLength}` 
      });
    }
    
    if (rules.maxLength && value.length > rules.maxLength) {
      errors.push({ 
        field: rules.field, 
        error: `Maximum length is ${rules.maxLength}` 
      });
    }
    
    // パターンチェック
    if (rules.pattern && !rules.pattern.test(value)) {
      errors.push({ 
        field: rules.field, 
        error: 'Invalid format' 
      });
    }
    
    return { 
      valid: errors.length === 0, 
      errors 
    };
  }
}
```

### 5.2 数値検証

```typescript
class NumberValidator {
  static validate(value: any, rules: NumberRules): ValidationResult {
    const errors: ValidationError[] = [];
    
    // 型チェック
    if (typeof value !== 'number' || isNaN(value)) {
      errors.push({ field: rules.field, error: 'Must be a number' });
      return { valid: false, errors };
    }
    
    // 範囲チェック
    if (rules.min !== undefined && value < rules.min) {
      errors.push({ 
        field: rules.field, 
        error: `Minimum value is ${rules.min}` 
      });
    }
    
    if (rules.max !== undefined && value > rules.max) {
      errors.push({ 
        field: rules.field, 
        error: `Maximum value is ${rules.max}` 
      });
    }
    
    // 整数チェック
    if (rules.integer && !Number.isInteger(value)) {
      errors.push({ 
        field: rules.field, 
        error: 'Must be an integer' 
      });
    }
    
    return { 
      valid: errors.length === 0, 
      errors 
    };
  }
}
```

### 5.3 配列検証

```typescript
class ArrayValidator {
  static validate(value: any, rules: ArrayRules): ValidationResult {
    const errors: ValidationError[] = [];
    
    // 型チェック
    if (!Array.isArray(value)) {
      errors.push({ field: rules.field, error: 'Must be an array' });
      return { valid: false, errors };
    }
    
    // サイズチェック
    if (rules.minItems && value.length < rules.minItems) {
      errors.push({ 
        field: rules.field, 
        error: `Minimum ${rules.minItems} items required` 
      });
    }
    
    if (rules.maxItems && value.length > rules.maxItems) {
      errors.push({ 
        field: rules.field, 
        error: `Maximum ${rules.maxItems} items allowed` 
      });
    }
    
    // ユニークチェック
    if (rules.unique) {
      const unique = new Set(value);
      if (unique.size !== value.length) {
        errors.push({ 
          field: rules.field, 
          error: 'Duplicate values not allowed' 
        });
      }
    }
    
    // アイテム検証
    if (rules.itemValidator) {
      value.forEach((item, index) => {
        const itemResult = rules.itemValidator(item);
        if (!itemResult.valid) {
          errors.push({ 
            field: `${rules.field}[${index}]`, 
            error: itemResult.error 
          });
        }
      });
    }
    
    return { 
      valid: errors.length === 0, 
      errors 
    };
  }
}
```

## 6. サニタイゼーション

### 6.1 XSS対策

```typescript
class Sanitizer {
  static sanitizeHTML(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  
  static sanitizeMarkdown(value: string): string {
    // Markdownの危険な要素を除去
    return value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }
}
```

### 6.2 SQLインジェクション対策

```typescript
// Prisma ORMが自動的に処理
// 追加の検証
class SQLValidator {
  static validateIdentifier(value: string): boolean {
    // テーブル名、カラム名の検証
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value);
  }
  
  static escapeWildcards(value: string): string {
    // LIKE検索用のエスケープ
    return value
      .replace(/%/g, '\\%')
      .replace(/_/g, '\\_');
  }
}
```

## 7. エラーハンドリング

### 7.1 エラー形式

```typescript
interface ValidationError {
  field: string;
  error: string;
  code?: string;
  details?: any;
}

interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
  warnings?: ValidationError[];
}
```

### 7.2 エラーメッセージ

```typescript
const ErrorMessages = {
  REQUIRED: (field) => `${field} is required`,
  MIN_LENGTH: (field, min) => `${field} must be at least ${min} characters`,
  MAX_LENGTH: (field, max) => `${field} must be at most ${max} characters`,
  INVALID_FORMAT: (field) => `${field} has invalid format`,
  INVALID_TYPE: (field, type) => `${field} must be ${type}`,
  INVALID_ENUM: (field, values) => `${field} must be one of: ${values.join(', ')}`,
  DUPLICATE: (field) => `${field} already exists`,
  NOT_FOUND: (field) => `${field} not found`,
  INVALID_REFERENCE: (field) => `${field} references non-existent item`,
  BUSINESS_RULE: (rule) => `Business rule violation: ${rule}`
};
```

## 8. カスタムバリデーター

### 8.1 プラガブルバリデーター

```typescript
interface Validator<T> {
  name: string;
  validate(value: T, context?: any): Promise<ValidationResult>;
}

class ValidatorRegistry {
  private validators = new Map<string, Validator<any>>();
  
  register(validator: Validator<any>): void {
    this.validators.set(validator.name, validator);
  }
  
  async validate(name: string, value: any, context?: any): Promise<ValidationResult> {
    const validator = this.validators.get(name);
    if (!validator) {
      throw new Error(`Validator ${name} not found`);
    }
    return validator.validate(value, context);
  }
}
```

### 8.2 複合バリデーション

```typescript
class CompositeValidator {
  private validators: Validator<any>[] = [];
  
  add(validator: Validator<any>): this {
    this.validators.push(validator);
    return this;
  }
  
  async validate(value: any, context?: any): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    
    for (const validator of this.validators) {
      const result = await validator.validate(value, context);
      if (!result.valid && result.errors) {
        errors.push(...result.errors);
      }
      if (result.warnings) {
        warnings.push(...result.warnings);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}
```

## 9. パフォーマンス最適化

### 9.1 キャッシング

```typescript
class ValidationCache {
  private cache = new Map<string, ValidationResult>();
  private ttl = 60000; // 1分
  
  getCacheKey(type: string, value: any): string {
    return `${type}:${JSON.stringify(value)}`;
  }
  
  get(type: string, value: any): ValidationResult | null {
    const key = this.getCacheKey(type, value);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.result;
    }
    
    return null;
  }
  
  set(type: string, value: any, result: ValidationResult): void {
    const key = this.getCacheKey(type, value);
    this.cache.set(key, {
      result,
      timestamp: Date.now()
    });
  }
}
```

### 9.2 バッチ検証

```typescript
class BatchValidator {
  async validateBatch<T>(
    items: T[],
    validator: Validator<T>,
    options: { parallel?: boolean; batchSize?: number } = {}
  ): Promise<ValidationResult[]> {
    if (options.parallel) {
      // 並列処理
      const batchSize = options.batchSize || 10;
      const results: ValidationResult[] = [];
      
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(item => validator.validate(item))
        );
        results.push(...batchResults);
      }
      
      return results;
    } else {
      // 逐次処理
      const results: ValidationResult[] = [];
      for (const item of items) {
        results.push(await validator.validate(item));
      }
      return results;
    }
  }
}
```

## 10. テスト戦略

### 10.1 単体テスト

```typescript
describe('Validation', () => {
  describe('StringValidator', () => {
    it('should validate min length', () => {
      const result = StringValidator.validate('ab', {
        field: 'title',
        minLength: 3
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0].error).toContain('at least 3');
    });
    
    it('should validate pattern', () => {
      const result = StringValidator.validate('invalid-type!', {
        field: 'type',
        pattern: /^[a-z][a-z0-9_]*$/
      });
      expect(result.valid).toBe(false);
    });
  });
});
```

### 10.2 統合テスト

```typescript
describe('Item Validation', () => {
  it('should validate complete item creation', async () => {
    const item = {
      type: 'task',
      title: 'Test Task',
      priority: 'INVALID'
    };
    
    const result = await validateCreateItem(item);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: 'priority',
        error: expect.stringContaining('must be one of')
      })
    );
  });
});
```

## 11. 国際化対応

### 11.1 多言語エラーメッセージ

```typescript
class I18nValidator {
  private locale = 'ja';
  private messages = {
    ja: {
      required: (field) => `${field}は必須です`,
      minLength: (field, min) => `${field}は${min}文字以上必要です`,
      maxLength: (field, max) => `${field}は${max}文字以内で入力してください`
    },
    en: {
      required: (field) => `${field} is required`,
      minLength: (field, min) => `${field} must be at least ${min} characters`,
      maxLength: (field, max) => `${field} must be at most ${max} characters`
    }
  };
  
  getMessage(key: string, ...args: any[]): string {
    const messages = this.messages[this.locale] || this.messages.en;
    const message = messages[key];
    return typeof message === 'function' ? message(...args) : message;
  }
}
```

## 12. セキュリティ考慮事項

### 12.1 入力サイズ制限

- 最大リクエストサイズ: 10MB
- 最大文字列長: 100KB
- 最大配列要素数: 1000
- 最大ネスト深度: 10

### 12.2 レート制限

```typescript
class RateLimiter {
  private attempts = new Map<string, number[]>();
  private maxAttempts = 100;
  private windowMs = 60000; // 1分
  
  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // 古い試行を削除
    const recent = attempts.filter(time => now - time < this.windowMs);
    
    if (recent.length >= this.maxAttempts) {
      return false;
    }
    
    recent.push(now);
    this.attempts.set(key, recent);
    return true;
  }
}
```