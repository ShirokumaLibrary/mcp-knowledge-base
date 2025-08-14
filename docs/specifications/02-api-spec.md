# API仕様書 - GraphDB風MCP

## 1. 概要

Shirokuma MCP Knowledge Base v0.8.0は、シンプルなGraphDB風のMCPとして設計されています。ノード（アイテム）とその関連（エッジ）を中心とした、純粋なデータストレージを提供します。

### 設計思想

- **純粋なデータストア**: TYPE別の意味付けはAI側で管理
- **グラフ構造**: ノード（Item）とエッジ（Related）の関係性を重視
- **シンプルな操作**: 基本的なCRUD + グラフトラバーサル

## 2. 基本データ構造

### 2.1 Item（ノード）

```typescript
interface Item {
  // 識別子
  id: number;           // 自動採番
  type: string;         // カテゴリーラベル（AI側で意味を管理）
  
  // コンテンツ
  title: string;
  description: string;
  content: string;      // Markdown
  
  // 属性
  status: string;       // ステータス名
  priority: Priority;   // 5段階
  category?: string;    // オプション属性
  startDate?: Date;
  endDate?: Date;
  version?: string;
  
  // グラフ構造
  related: number[];    // 関連ノードのID配列
  tags: string[];       // タグ配列
  
  // メタデータ
  createdAt: Date;
  updatedAt: Date;
}
```

## 3. MCPツール定義

### 3.1 ノード操作（基本CRUD）

#### 3.1.1 ノード作成
```typescript
// Tool: create_item
interface CreateItemRequest {
  type: string;         // 任意の文字列
  title: string;
  description: string;
  content: string;
  status?: string;      // デフォルト: "Open"
  priority?: Priority;  // デフォルト: "MEDIUM"
  category?: string;
  startDate?: Date;
  endDate?: Date;
  version?: string;
  related?: number[];   // 関連ノードID
  tags?: string[];
}

interface CreateItemResponse {
  id: number;
  ...Item;
}
```

#### 3.1.2 ノード取得
```typescript
// Tool: get_item
interface GetItemRequest {
  id: number;
}

interface GetItemResponse {
  ...Item;
}

// Tool: list_items
interface ListItemsRequest {
  type?: string;        // フィルタ: タイプ
  status?: string[];    // フィルタ: ステータス（複数可）
  priority?: Priority[];// フィルタ: 優先度（複数可）
  tags?: string[];      // フィルタ: タグ（AND条件）
  limit?: number;       // デフォルト: 20、最大: 100
  offset?: number;      // デフォルト: 0
  sortBy?: 'created' | 'updated' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

interface ListItemsResponse {
  items: Item[];
  total: number;
  limit: number;
  offset: number;
}
```

#### 3.1.3 ノード更新
```typescript
// Tool: update_item
interface UpdateItemRequest {
  id: number;
  title?: string;
  description?: string;
  content?: string;
  status?: string;
  priority?: Priority;
  category?: string;
  startDate?: Date;
  endDate?: Date;
  version?: string;
  related?: number[];   // 完全置換
  tags?: string[];      // 完全置換
}

interface UpdateItemResponse {
  ...Item;
}
```

#### 3.1.4 ノード削除
```typescript
// Tool: delete_item
interface DeleteItemRequest {
  id: number;
}

interface DeleteItemResponse {
  success: boolean;
  id: number;
}
```

### 3.2 グラフ操作（関連性）

#### 3.2.1 関連ノード取得
```typescript
// Tool: get_related_items
interface GetRelatedItemsRequest {
  id: number;
  depth?: number;       // トラバーサル深度（デフォルト: 1、最大: 3）
  types?: string[];     // 特定タイプのみ取得
}

interface GetRelatedItemsResponse {
  items: Item[];
  relationships: Array<{
    source: number;
    target: number;
    distance: number;   // 元ノードからの距離
  }>;
}
```

#### 3.2.2 関連の追加/削除
```typescript
// Tool: add_relations
interface AddRelationsRequest {
  sourceId: number;
  targetIds: number[];  // 追加する関連ノードID
}

// Tool: remove_relations
interface RemoveRelationsRequest {
  sourceId: number;
  targetIds: number[];  // 削除する関連ノードID
}
```

#### 3.2.3 グラフ探索
```typescript
// Tool: graph_search
interface GraphSearchRequest {
  startId: number;      // 開始ノード
  endId?: number;       // 終了ノード（最短パス検索）
  maxDepth?: number;    // 最大探索深度
  filter?: {
    types?: string[];
    status?: string[];
    tags?: string[];
  };
}

interface GraphSearchResponse {
  nodes: Item[];
  edges: Array<{
    source: number;
    target: number;
  }>;
  paths?: Array<number[]>; // 経路（endId指定時）
}
```

### 3.3 検索操作

#### 3.3.1 全文検索
```typescript
// Tool: search_items
interface SearchItemsRequest {
  query: string;        // 検索クエリ
  types?: string[];     // タイプフィルタ
  limit?: number;
  offset?: number;
}

interface SearchItemsResponse {
  items: Array<Item & {
    relevance: number;  // 関連度スコア
  }>;
  total: number;
}
```

#### 3.3.2 類似ノード検索
```typescript
// Tool: find_similar_items
interface FindSimilarItemsRequest {
  id: number;
  limit?: number;       // デフォルト: 10
  threshold?: number;   // 類似度閾値（0-1）
}

interface FindSimilarItemsResponse {
  items: Array<Item & {
    similarity: number; // 類似度スコア
  }>;
}
```

### 3.4 集計操作

#### 3.4.1 統計情報取得
```typescript
// Tool: get_stats
interface GetStatsRequest {
  // パラメータなし
}

interface GetStatsResponse {
  totalItems: number;
  itemsByType: Record<string, number>;
  itemsByStatus: Record<string, number>;
  itemsByPriority: Record<Priority, number>;
  mostUsedTags: Array<{
    tag: string;
    count: number;
  }>;
  graphMetrics: {
    avgConnections: number;  // 平均接続数
    maxConnections: number;  // 最大接続数
    isolatedNodes: number;   // 孤立ノード数
  };
}
```

#### 3.4.2 タイプ別集計
```typescript
// Tool: get_type_stats
interface GetTypeStatsRequest {
  // パラメータなし
}

interface GetTypeStatsResponse {
  types: Array<{
    type: string;
    count: number;
    lastUsed: Date;
    avgRelations: number;
  }>;
}
```

### 3.5 タグ操作

#### 3.5.1 タグ一覧
```typescript
// Tool: get_tags
interface GetTagsRequest {
  // パラメータなし
}

interface GetTagsResponse {
  tags: Array<{
    name: string;
    count: number;      // 使用回数
  }>;
}
```

#### 3.5.2 タグサジェスト
```typescript
// Tool: suggest_tags
interface SuggestTagsRequest {
  prefix: string;       // プレフィックス
  limit?: number;       // デフォルト: 10
}

interface SuggestTagsResponse {
  suggestions: string[];
}
```

### 3.6 カレントステート操作

#### 3.6.1 カレントステート取得
```typescript
// Tool: get_current_state
interface GetCurrentStateRequest {
  // パラメータなし
}

interface GetCurrentStateResponse {
  state: Item | null;  // type: "current_state" の最新アイテム
}
```

#### 3.6.2 カレントステート更新
```typescript
// Tool: update_current_state
interface UpdateCurrentStateRequest {
  content: string;      // Markdown形式の状態記述
  related?: number[];   // 関連するアイテムID（セッション、タスクなど）
  tags?: string[];      // タグ
  metadata?: {
    updatedBy?: string; // 更新者（ai-start, ai-finish, manual等）
    context?: string;   // コンテキスト情報
  };
}

interface UpdateCurrentStateResponse {
  state: Item;
}
```

#### 3.6.3 実装詳細

カレントステートは特別な扱いを受ける `type: "current_state"` のアイテムです：

```typescript
// 内部実装例
async function updateCurrentState(data: UpdateCurrentStateRequest): Promise<Item> {
  // 既存のcurrent_stateを検索
  const existing = await prisma.item.findFirst({
    where: { type: 'current_state' },
    orderBy: { createdAt: 'desc' }
  });

  if (existing) {
    // 既存があれば更新
    return await prisma.item.update({
      where: { id: existing.id },
      data: {
        content: data.content,
        related: data.related ? JSON.stringify(data.related) : existing.related,
        tags: data.tags ? JSON.stringify(data.tags) : existing.tags,
        updatedAt: new Date()
      }
    });
  } else {
    // なければ新規作成
    return await prisma.item.create({
      data: {
        type: 'current_state',
        title: 'Current System State',
        description: 'Latest state of the knowledge base system',
        content: data.content,
        status: 'Active',
        priority: 'HIGH',
        related: data.related ? JSON.stringify(data.related) : null,
        tags: data.tags ? JSON.stringify(data.tags) : null
      }
    });
  }
}

// 取得例
async function getCurrentState(): Promise<Item | null> {
  return await prisma.item.findFirst({
    where: { type: 'current_state' },
    orderBy: { updatedAt: 'desc' }
  });
}
```

#### 3.6.4 カレントステートの特徴

- **単一性**: システム全体で1つのみ存在（古いものは自動的に更新）
- **永続性**: 削除されず、常に更新される
- **高優先度**: priority は常に "HIGH"
- **関連性**: related フィールドで最新のセッション、アクティブなタスクを参照
- **履歴**: updatedAt で最終更新時刻を追跡

#### 3.6.5 使用例

```javascript
// AIセッション開始時
await mcp.update_current_state({
  content: `## Active Session
- Session ID: ${sessionId}
- Started: ${new Date().toISOString()}
- Context: Implementing GraphDB features

## Active Tasks
- [${taskId}] Implement graph traversal
- [${issueId}] Fix relation updates

## Recent Decisions
- Adopted single-table design
- Type field is just a category label`,
  related: [sessionId, taskId, issueId],
  tags: ['active', 'development'],
  metadata: {
    updatedBy: 'ai-start'
  }
});

// 状態取得
const currentState = await mcp.get_current_state();
console.log(currentState.content);
```

## 4. MCPプロトコル仕様

### 4.1 ツール定義

```typescript
// MCP Tools
const tools = [
  // 基本操作
  {
    name: "create_item",
    description: "Create a new item node",
    parameters: CreateItemRequest
  },
  {
    name: "get_item",
    description: "Get item by ID",
    parameters: { id: number }
  },
  {
    name: "list_items",
    description: "List items with filters",
    parameters: ListItemsRequest
  },
  {
    name: "update_item",
    description: "Update an existing item",
    parameters: UpdateItemRequest & { id: number }
  },
  {
    name: "delete_item",
    description: "Delete an item",
    parameters: { id: number }
  },
  
  // グラフ操作
  {
    name: "get_related",
    description: "Get related items with depth traversal",
    parameters: GetRelatedItemsRequest & { id: number }
  },
  {
    name: "add_relations",
    description: "Add relations between items",
    parameters: { sourceId: number, targetIds: number[] }
  },
  {
    name: "remove_relations",
    description: "Remove relations between items",
    parameters: { sourceId: number, targetIds: number[] }
  },
  {
    name: "graph_search",
    description: "Search graph structure",
    parameters: GraphSearchRequest
  },
  
  // 検索
  {
    name: "search",
    description: "Full-text search across items",
    parameters: SearchRequest
  },
  {
    name: "find_similar",
    description: "Find similar items",
    parameters: GetSimilarItemsRequest & { id: number }
  },
  
  // 統計
  {
    name: "get_stats",
    description: "Get system statistics",
    parameters: {}
  },
  
  // カレントステート
  {
    name: "get_current_state",
    description: "Get the current system state",
    parameters: {}
  },
  {
    name: "update_current_state",
    description: "Update the current system state",
    parameters: {
      content: string,
      related?: number[],
      tags?: string[],
      metadata?: {
        updatedBy?: string,
        context?: string
      }
    }
  }
];
```

### 4.2 レスポンス形式

```typescript
// 成功レスポンス
interface MCPSuccessResponse {
  success: true;
  data: any;
}

// エラーレスポンス
interface MCPErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
```

## 5. エラーコード

| コード | 説明 | HTTPステータス |
|--------|------|---------------|
| NOT_FOUND | アイテムが見つからない | 404 |
| VALIDATION_ERROR | 入力値が不正 | 400 |
| DUPLICATE_ERROR | 重複エラー | 409 |
| RELATION_ERROR | 関連性エラー | 400 |
| INTERNAL_ERROR | 内部エラー | 500 |

## 6. 使用例

### 6.1 基本的なノード作成と関連付け

```javascript
// 1. 親ノードを作成
const parent = await mcp.create_item({
  type: "project",
  title: "新規プロジェクト",
  description: "プロジェクトの説明",
  content: "# プロジェクト詳細\n...",
  priority: "HIGH"
});

// 2. 子ノードを作成して関連付け
const child = await mcp.create_item({
  type: "task",
  title: "タスク1",
  description: "タスクの説明",
  content: "タスク詳細",
  related: [parent.id]
});

// 3. 双方向の関連を作成
await mcp.add_relations({
  sourceId: parent.id,
  targetIds: [child.id]
});
```

### 6.2 グラフ探索

```javascript
// 特定ノードから2階層の関連を取得
const related = await mcp.get_related({
  id: parent.id,
  depth: 2,
  types: ["task", "issue"]
});

// ノード間の最短パスを検索
const paths = await mcp.graph_search({
  startId: node1.id,
  endId: node2.id,
  maxDepth: 5
});
```

### 6.3 統計情報の活用

```javascript
// システム全体の統計を取得
const stats = await mcp.get_stats();

console.log(`総アイテム数: ${stats.totalItems}`);
console.log(`平均接続数: ${stats.graphMetrics.avgConnections}`);
console.log(`孤立ノード: ${stats.graphMetrics.isolatedNodes}`);

// タイプ別の使用状況を確認
Object.entries(stats.itemsByType).forEach(([type, count]) => {
  console.log(`${type}: ${count}件`);
});
```

## 7. パフォーマンス考慮事項

### 7.1 インデックス戦略

- type, status, priorityに単一インデックス
- 全文検索用のFTS5インデックス
- related配列の効率的な検索のための戦略

### 7.2 グラフ探索の最適化

- 深度制限によるメモリ使用量制御
- 循環参照の検出と回避
- キャッシュによる繰り返し探索の高速化

### 7.3 ページネーション

- 大量データ取得時は必ずページネーションを使用
- デフォルト20件、最大100件の制限
- オフセットベースとカーソルベースの選択

## 8. セキュリティ

### 8.1 入力検証

- SQLインジェクション対策（Prisma ORM使用）
- XSS対策（コンテンツのサニタイズ）
- 巨大ペイロードの拒否（100KB制限）

### 8.2 制限事項

- グラフ探索深度の制限（最大3階層）
- ペイロードサイズ制限（100KB）

