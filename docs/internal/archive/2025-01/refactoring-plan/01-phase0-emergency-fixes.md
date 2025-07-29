# フェーズ0: 緊急対応計画（1週間）

## 概要
最も深刻で、システムの安定性に直接影響する問題を即座に修正します。
これらの修正は後続のリファクタリングの基盤となります。

## 優先度: 最高の修正項目

### 1. エラーハンドリング0%のハンドラー修正（3日）

#### 対象ファイル
- `src/handlers/session-handlers.ts`
- `src/handlers/tag-handlers.ts`
- `src/handlers/status-handlers.ts`

#### 修正内容
```typescript
// Before
async handleGetTags(): Promise<ToolResponse> {
  const tags = await this.db.getTags();
  return formatResponse(tags);
}

// After
async handleGetTags(): Promise<ToolResponse> {
  try {
    const tags = await this.db.getTags();
    return formatResponse(tags);
  } catch (error) {
    this.logger.error('Failed to get tags', { error });
    if (error instanceof McpError) throw error;
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to retrieve tags: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
```

#### タスク一覧
- [ ] session-handlers.ts: 全8メソッドにtry-catch追加
- [ ] tag-handlers.ts: 全4メソッドにtry-catch追加
- [ ] status-handlers.ts: 全1メソッドにtry-catch追加
- [ ] 各ハンドラーにlogger注入
- [ ] エラーメッセージの標準化

### 2. 最も危険なany型の排除（2日）

#### 優先排除対象
1. **ハンドラーの引数** (全ハンドラー共通)
```typescript
// Before
async handleToolCall(toolName: string, args: any): Promise<ToolResponse>

// After
async handleToolCall(toolName: string, args: unknown): Promise<ToolResponse>
// 各ハンドラー内でZodスキーマによる検証
```

2. **データベースメソッドの戻り値**
```typescript
// Before
getTag(id: number): Promise<any>

// After
getTag(id: number): Promise<Tag | null>
```

#### タスク一覧
- [ ] 全ハンドラーメソッドの引数をunknownに変更
- [ ] repository-interfaces.tsの全any型に適切な型定義
- [ ] 型定義ファイルの整備（missing-types.d.ts作成）

### 3. FileIssueDatabaseの初期化パターン共通化（1日）

#### 現状の問題
40箇所以上で以下のパターンが重複：
```typescript
if (this.initializationPromise) {
  await this.initializationPromise;
}
```

#### 修正方法
```typescript
// デコレータパターンの実装
function ensureInitialized(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;
  descriptor.value = async function(...args: any[]) {
    await this.ensureInitialized();
    return originalMethod.apply(this, args);
  };
  return descriptor;
}

// 使用例
@ensureInitialized
async getAllStatuses(): Promise<Status[]> {
  return this.statusRepo.getAllStatuses();
}
```

#### タスク一覧
- [ ] ensureInitializedデコレータの実装
- [ ] 全40メソッドへのデコレータ適用
- [ ] 初期化エラーの適切なハンドリング

### 4. 最長関数トップ5の分割（1日）

#### 対象関数と分割計画

1. **task-repository.ts: createTask (89行)**
   - 分割後: 
     - validateTaskInput (15行)
     - prepareTaskData (15行)
     - saveTaskToFile (20行)
     - syncTaskToDatabase (20行)
     - registerTaskTags (10行)

2. **task-repository.ts: updateTask (82行)**
   - 分割後:
     - loadExistingTask (10行)
     - validateUpdateInput (15行)
     - mergeTaskData (15行)
     - saveUpdatedTask (20行)
     - syncUpdatedTask (15行)

3. **type-handlers.ts: handleGetTypes (81行)**
   - 分割後:
     - loadStaticTypes (20行)
     - loadDynamicTypes (20行)
     - mergeTypeDefinitions (20行)
     - formatTypesResponse (15行)

4. **base.ts: createTables (80行)**
   - 分割後:
     - createStatusTable (15行)
     - createTagTable (15行)
     - createSequenceTable (15行)
     - createSearchTables (20行)
     - initializeDefaults (10行)

5. **task-repository.ts: syncTaskToSQLite (76行)**
   - 分割後:
     - syncTaskCore (20行)
     - syncTaskTags (20行)
     - syncRelatedTasks (15行)
     - syncRelatedDocuments (15行)

## 実装スケジュール

### Day 1-3: エラーハンドリング
- Day 1: session-handlers.ts
- Day 2: tag-handlers.ts, status-handlers.ts
- Day 3: テストとレビュー

### Day 4-5: 型安全性
- Day 4: ハンドラー引数の修正
- Day 5: インターフェース定義の修正

### Day 6: 初期化パターン
- デコレータ実装と適用

### Day 7: 関数分割
- 最長関数5つの分割実装

## 成功基準

### 定量的指標
- エラーハンドリング率: 0% → 100%（対象3ファイル）
- any型使用数: 242 → 200以下
- 20行超の関数: 35 → 30以下
- 初期化パターン重複: 40 → 0

### 品質チェック項目
- [ ] 全ての変更に対するユニットテスト作成
- [ ] エラーケースのテスト網羅
- [ ] 型定義の正確性確認
- [ ] パフォーマンステスト（初期化オーバーヘッド）

## リスクと対策

### リスク1: 破壊的変更
- **対策**: 既存APIの互換性維持レイヤー作成

### リスク2: パフォーマンス劣化
- **対策**: ベンチマークテストの実施

### リスク3: 新規バグの混入
- **対策**: 包括的な回帰テストスイート実行

## 次のフェーズへの準備

フェーズ0完了後、以下が可能になります：
- 安全な型システムの構築（フェーズ1）
- 信頼性の高いリファクタリング（フェーズ2以降）
- エラー追跡とデバッグの容易化