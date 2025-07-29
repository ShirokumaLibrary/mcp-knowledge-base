# フェーズ1: 型安全性改善計画（2週間）

## 概要
any型の完全排除と厳密な型定義により、型安全性を確保します。
TypeScriptの型システムを最大限活用し、実行時エラーを編译時に検出可能にします。

## 現状分析

### any型使用統計
- **総数**: 242箇所
- **最頻出パターン**:
  - `as any`: 160箇所
  - 関数引数での`any`: 50箇所
  - 戻り値での`any`: 32箇所

### 型アサーション統計
- `as Type`: 82箇所
- `<Type>`: 32箇所
- 不適切なキャスト: 推定30箇所

## Week 1: any型の排除

### Day 1-2: 型定義の整備

#### 1. ドメイン型の完全定義
```typescript
// src/types/complete-domain-types.ts

// 現在のanyを使用した定義
export interface IssueRepository {
  getIssue(id: number): Promise<any | null>;
}

// 修正後の厳密な型定義
export interface Issue {
  id: number;
  title: string;
  description?: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  status: string;
  status_id: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  related_tasks: string[];
  related_documents: string[];
}

export interface IssueRepository {
  getIssue(id: number): Promise<Issue | null>;
}
```

#### 2. APIレスポンス型の定義
```typescript
// src/types/api-types.ts
export interface ToolResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// ジェネリック型でデータラッパーを定義
export interface DataResponse<T> {
  data: T;
  metadata?: {
    count?: number;
    timestamp?: string;
  };
}
```

### Day 3-4: repository-interfaces.tsの修正

#### 現在の問題のある定義
```typescript
// 30箇所以上のany
export interface IStatusRepository {
  getStatus(id: number): Promise<any>;  // @ai-debt
  getAllStatuses(): Promise<any[]>;
  createStatus(name: string, is_closed?: boolean): Promise<any>;
}
```

#### 修正後
```typescript
export interface Status {
  id: number;
  name: string;
  is_closed: boolean;
  created_at: string;
}

export interface IStatusRepository {
  getStatus(id: number): Promise<Status | null>;
  getAllStatuses(): Promise<Status[]>;
  createStatus(name: string, is_closed?: boolean): Promise<Status>;
  updateStatus(id: number, name: string, is_closed?: boolean): Promise<boolean>;
  deleteStatus(id: number): Promise<boolean>;
}
```

### Day 5-6: ハンドラー層の型安全性

#### 1. 引数の型安全性確保
```typescript
// Before
async handleToolCall(toolName: string, args: any): Promise<ToolResponse> {
  switch (toolName) {
    case 'get_items':
      return this.itemHandlers.handleGetItems(args);
  }
}

// After
async handleToolCall(toolName: string, args: unknown): Promise<ToolResponse> {
  switch (toolName) {
    case 'get_items':
      // Zodスキーマで検証してから型安全に渡す
      const validatedArgs = GetItemsSchema.parse(args);
      return this.itemHandlers.handleGetItems(validatedArgs);
  }
}
```

#### 2. 型ガードの実装
```typescript
// src/utils/type-guards.ts
export function isIssue(item: unknown): item is Issue {
  return (
    typeof item === 'object' &&
    item !== null &&
    'id' in item &&
    'title' in item &&
    'priority' in item
  );
}

export function isValidPriority(
  priority: string
): priority is 'high' | 'medium' | 'low' {
  return ['high', 'medium', 'low'].includes(priority);
}
```

### Day 7: 型キャストの適正化

#### 不適切なキャストの修正
```typescript
// Before - 危険なキャスト
const doc = await this.db.getDocument(type as any, id);

// After - 型安全な実装
const validType = this.validateDocumentType(type);
if (!validType) {
  throw new ValidationError(`Invalid document type: ${type}`);
}
const doc = await this.db.getDocument(validType, id);
```

## Week 2: 高度な型安全性

### Day 8-9: ジェネリクスの活用

#### 1. リポジトリ基底クラスの型安全化
```typescript
// src/database/base-repository.ts
export abstract class BaseRepository<T extends { id: number }> {
  protected abstract tableName: string;
  
  async findById(id: number): Promise<T | null> {
    const row = await this.db.getAsync(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return row ? this.mapRowToEntity(row) : null;
  }
  
  protected abstract mapRowToEntity(row: unknown): T;
}
```

#### 2. 型安全なイベントエミッター
```typescript
// src/utils/typed-event-emitter.ts
type EventMap = {
  'item:created': { type: string; id: number };
  'item:updated': { type: string; id: number; changes: Partial<Issue | Plan | Document> };
  'item:deleted': { type: string; id: number };
};

export class TypedEventEmitter {
  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    // 実装
  }
  
  on<K extends keyof EventMap>(
    event: K,
    handler: (data: EventMap[K]) => void
  ): void {
    // 実装
  }
}
```

### Day 10-11: 条件型とマップ型の活用

#### 1. 動的な型マッピング
```typescript
// src/types/type-mapping.ts
type TypeToEntity = {
  'issues': Issue;
  'plans': Plan;
  'docs': Document;
  'knowledge': Document;
};

type ItemType = keyof TypeToEntity;

// 条件型で適切な戻り値型を決定
type GetEntityType<T extends ItemType> = TypeToEntity[T];

// 使用例
async function getItem<T extends ItemType>(
  type: T,
  id: number
): Promise<GetEntityType<T> | null> {
  // 型安全な実装
}
```

#### 2. Partial型の適切な使用
```typescript
// 更新操作での型安全性
interface UpdateOptions<T> {
  id: number;
  updates: Partial<Omit<T, 'id' | 'created_at'>>;
}

async function updateItem<T extends Issue | Plan | Document>(
  options: UpdateOptions<T>
): Promise<T> {
  // 実装
}
```

### Day 12-13: 型テストの実装

#### 型レベルテストの作成
```typescript
// src/types/__tests__/type-tests.ts
import { expectType } from 'tsd';

// 型が正しく推論されることを確認
expectType<Issue | null>(await getItem('issues', 1));
expectType<Plan | null>(await getItem('plans', 1));

// コンパイルエラーになることを確認
// @ts-expect-error - invalid type
await getItem('invalid', 1);
```

### Day 14: 統合とレビュー

#### チェックリスト
- [ ] tsc --noImplicitAny でエラーが出ないこと
- [ ] 全てのany型が排除されていること
- [ ] 型アサーションが必要最小限であること
- [ ] 型定義ファイルが整理されていること

## 成果物

### 作成するファイル
1. `src/types/complete-domain-types.ts` - 完全なドメイン型定義
2. `src/types/api-types.ts` - API関連の型定義
3. `src/types/type-guards.ts` - 型ガード関数群
4. `src/types/type-mapping.ts` - 動的型マッピング
5. `src/utils/typed-event-emitter.ts` - 型安全なイベントシステム

### 修正するファイル
- 全てのリポジトリインターフェース
- 全てのハンドラークラス
- データベースアクセス層

## 成功指標

### 定量的指標
- any型使用数: 242 → 0
- 型カバレッジ: 60% → 100%
- 型アサーション: 114 → 30以下
- unknownの適切な使用: 0 → 50以上

### 定性的指標
- IDEの型推論が100%機能する
- 型エラーによる実行時エラーがゼロ
- 新規開発時の型定義が明確

## 移行戦略

### 段階的移行
1. 新規コードは厳密な型定義を必須とする
2. 既存コードは段階的に移行
3. CIで型チェックを必須化

### 互換性維持
```typescript
// 一時的な互換性レイヤー
export type LegacyIssue = any;  // deprecated
export type Issue = StrictIssue;  // 新しい型

// 移行期間中の型ガード
function migrateLegacyIssue(legacy: LegacyIssue): Issue {
  // バリデーションと変換
}
```

## リスクと対策

### リスク1: 過度に厳密な型定義
- **対策**: ユーティリティ型（Partial, Pick等）の活用

### リスク2: パフォーマンスへの影響
- **対策**: 型情報は実行時に削除されるため影響なし

### リスク3: 学習曲線
- **対策**: 型定義のドキュメントとサンプルコード作成