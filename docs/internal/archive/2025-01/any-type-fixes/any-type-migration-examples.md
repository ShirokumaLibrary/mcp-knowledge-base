# Any型移行の具体例

## 1. 高優先度の修正例

### A. MCP型定義の改善

**現状**
```typescript
// src/types/mcp-types.ts
export type ToolHandler = (args: any) => Promise<ToolResponse>;
```

**改善案**
```typescript
// ジェネリクスを使用して型安全性を向上
export type ToolHandler<T = unknown> = (args: T) => Promise<ToolResponse>;

// 各ツールに対応する引数型を定義
export interface CreateItemArgs {
  type: string;
  title: string;
  content?: string;
  tags?: string[];
  priority?: string;
  status?: string;
  [key: string]: unknown;
}

export interface UpdateItemArgs {
  type: string;
  id: number;
  [key: string]: unknown;
}

// 使用例
const createItemHandler: ToolHandler<CreateItemArgs> = async (args) => {
  // argsは CreateItemArgs 型として扱える
  const { type, title } = args; // 型安全
};
```

### B. SQLite結果型の定義

**現状**
```typescript
// src/repositories/item-repository.ts
const metadata: Record<string, any> = {};
let value: any;
```

**改善案**
```typescript
// 共通の型定義
interface SQLiteRow {
  [key: string]: string | number | null | boolean;
}

interface ItemRow extends SQLiteRow {
  id: number;
  type: string;
  title: string;
  content?: string | null;
  tags?: string | null;
  created_at: string;
  updated_at: string;
}

// メタデータ用の型
type MetadataValue = string | number | boolean | null | string[];

interface ItemMetadata {
  id: number;
  type: string;
  title: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  [key: string]: MetadataValue;
}
```

### C. 型ガードの改善

**現状**
```typescript
// src/types/type-guards.ts
typeof (value as any).id === 'number' &&
typeof (value as any).name === 'string'
```

**改善案**
```typescript
// unknownとin演算子を使用
export function isValidStatus(value: unknown): value is Status {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    typeof (value as { id: unknown }).id === 'number' &&
    typeof (value as { name: unknown }).name === 'string'
  );
}

// より読みやすいヘルパー関数
function hasProperty<K extends string>(
  obj: unknown,
  key: K
): obj is Record<K, unknown> {
  return typeof obj === 'object' && obj !== null && key in obj;
}

export function isValidStatus(value: unknown): value is Status {
  return (
    hasProperty(value, 'id') &&
    hasProperty(value, 'name') &&
    typeof value.id === 'number' &&
    typeof value.name === 'string'
  );
}
```

## 2. 中優先度の修正例

### A. 設定オブジェクトの型定義

**現状**
```typescript
// src/config/constants.ts
let value: any = {
  // 設定値
};
```

**改善案**
```typescript
interface StorageConfig {
  directory: string;
  filePattern: string;
  extensions: string[];
}

interface AppConfig {
  storage: Record<string, StorageConfig>;
  database: {
    path: string;
    timeout: number;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enabled: boolean;
  };
}

// 型安全な設定アクセス
const config: AppConfig = {
  storage: {
    issues: {
      directory: 'issues',
      filePattern: 'issue-{id}.md',
      extensions: ['.md']
    }
  },
  // ...
};
```

### B. ストレージアクセスの型安全化

**現状**
```typescript
// src/repositories/item-repository.ts
return (STORAGE_CONFIGS as any)[type];
```

**改善案**
```typescript
// 型安全なアクセサー関数
function getStorageConfig(type: string): StorageConfig | undefined {
  if (type in STORAGE_CONFIGS) {
    return STORAGE_CONFIGS[type as keyof typeof STORAGE_CONFIGS];
  }
  return undefined;
}

// または、Mapを使用
const storageConfigMap = new Map<string, StorageConfig>(
  Object.entries(STORAGE_CONFIGS)
);

function getStorageConfig(type: string): StorageConfig | undefined {
  return storageConfigMap.get(type);
}
```

## 3. 段階的移行戦略

### フェーズ1: 型定義の作成（1週間）
1. 共通型定義ファイルの作成
   - `src/types/database-types.ts`
   - `src/types/config-types.ts`
   - `src/types/mcp-protocol-types.ts`

2. 既存のany型に// @ts-expectErrorコメントを追加
   - 一時的に型エラーを抑制
   - 段階的に修正

### フェーズ2: コア機能の移行（2週間）
1. リポジトリ層の型安全化
2. ハンドラー層の型安全化
3. MCPプロトコル層の型安全化

### フェーズ3: ユーティリティの移行（1週間）
1. 設定管理の型安全化
2. バリデーション関数の改善
3. エラーハンドリングの型安全化

## 4. 移行時の注意点

### 破壊的変更を避ける
```typescript
// 既存のコードを壊さないように、段階的に移行
export type ToolHandler<T = any> = (args: T) => Promise<ToolResponse>;
//                            ^^^ 初期はanyを許可し、段階的にunknownへ
```

### 型の複雑さを管理
```typescript
// 過度に複雑な型は避ける
// Bad
type ComplexType<T> = T extends { a: infer A } 
  ? A extends { b: infer B } 
    ? B extends string ? B : never 
    : never 
  : never;

// Good
type SimpleType = {
  a: { b: string };
};
```

### テストの追加
```typescript
// 型ガードのテスト
describe('isValidStatus', () => {
  it('should return true for valid status', () => {
    const status = { id: 1, name: 'Open', is_closed: false };
    expect(isValidStatus(status)).toBe(true);
  });

  it('should return false for invalid status', () => {
    const invalid = { id: '1', name: 'Open' }; // idが文字列
    expect(isValidStatus(invalid)).toBe(false);
  });
});
```