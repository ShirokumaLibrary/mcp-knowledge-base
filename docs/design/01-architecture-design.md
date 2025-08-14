# アーキテクチャ設計書

## 1. 概要

Shirokuma MCP Knowledge Base v0.8.0は、GraphDB風のシンプルなMCPツールとして設計されています。本書では、システム全体のアーキテクチャと主要コンポーネントの設計を説明します。

## 2. アーキテクチャ原則

### 2.1 基本原則

1. **シンプリシティ**: 複雑性を排除し、本質的な機能に集中
2. **グラフ指向**: ノードと関連を中心としたデータモデル
3. **AI中立性**: TYPE別の意味付けをシステムから分離
4. **統一性**: すべてのアイテムを同一の方法で扱う
5. **拡張性**: 機能追加を妨げない設計

### 2.2 設計方針

- **レイヤードアーキテクチャ**: 責任の明確な分離
- **依存性逆転**: 上位層は抽象に依存
- **単一責任**: 各コンポーネントは1つの責任のみ
- **疎結合**: コンポーネント間の依存を最小化

## 3. システム構成

### 3.1 全体構成図

```
┌─────────────────────────────────────────────────────────┐
│                    Client Applications                    │
│         (Claude.ai, CLI, Custom Clients)                 │
└─────────────┬──────────────────┬────────────────────────┘
              │                  │
              ▼                  ▼
┌──────────────────┐  ┌────────────────────┐
│   CLI Interface  │  │   MCP Interface    │
│   (Commander.js) │  │  (MCP Protocol)    │
└────────┬─────────┘  └─────────┬──────────┘
         │                      │
         ▼                      ▼
┌─────────────────────────────────────────────────────────┐
│                  Application Layer                       │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Item      │  │    Graph     │  │   Search     │  │
│  │  Service    │  │   Service    │  │   Service    │  │
│  └─────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                     Domain Layer                         │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │    Item     │  │   Relation   │  │     Tag      │  │
│  │   Entity    │  │    Entity    │  │   Entity     │  │
│  └─────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                 Infrastructure Layer                     │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Prisma    │  │   SQLite     │  │   Logger     │  │
│  │     ORM     │  │   Database   │  │              │  │
│  └─────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 3.2 レイヤー責任

| レイヤー | 責任 | 主要コンポーネント |
|---------|------|------------------|
| Interface | 外部との通信 | CLI, MCP Server |
| Application | ビジネスロジック | Services |
| Domain | ドメインモデル | Entities, Value Objects |
| Infrastructure | 技術的詳細 | Database, External APIs |

## 4. コンポーネント設計

### 4.1 Interface Layer

#### 4.1.1 CLI Interface

```typescript
// cli/index.ts
class CLIInterface {
  private itemService: ItemService;
  private graphService: GraphService;
  
  async execute(command: string, options: any): Promise<void> {
    switch(command) {
      case 'create':
        return this.handleCreate(options);
      case 'get':
        return this.handleGet(options);
      case 'search':
        return this.handleSearch(options);
      // ...
    }
  }
}
```

#### 4.1.2 MCP Server

```typescript
// mcp/server.ts
class MCPServer {
  private toolRegistry: ToolRegistry;
  
  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    const tool = this.toolRegistry.getTool(request.tool);
    return tool.execute(request.parameters);
  }
}
```

### 4.2 Application Layer

#### 4.2.1 Item Service

```typescript
// services/item-service.ts
interface ItemService {
  create(data: CreateItemDto): Promise<Item>;
  findById(id: number): Promise<Item>;
  findAll(filter: ItemFilter): Promise<ItemList>;
  update(id: number, data: UpdateItemDto): Promise<Item>;
  delete(id: number): Promise<void>;
}

class ItemServiceImpl implements ItemService {
  constructor(
    private repository: ItemRepository,
    private validator: ItemValidator,
    private eventBus: EventBus
  ) {}
  
  async create(data: CreateItemDto): Promise<Item> {
    // 1. バリデーション
    await this.validator.validate(data);
    
    // 2. エンティティ作成
    const item = Item.create(data);
    
    // 3. 永続化
    const saved = await this.repository.save(item);
    
    // 4. イベント発行
    await this.eventBus.publish(new ItemCreatedEvent(saved));
    
    return saved;
  }
}
```

#### 4.2.2 Graph Service

```typescript
// services/graph-service.ts
interface GraphService {
  getRelated(id: number, depth: number): Promise<GraphResult>;
  findPath(startId: number, endId: number): Promise<Path[]>;
  addRelation(sourceId: number, targetId: number): Promise<void>;
  removeRelation(sourceId: number, targetId: number): Promise<void>;
  getGraphStats(): Promise<GraphStats>;
}

class GraphServiceImpl implements GraphService {
  constructor(
    private repository: ItemRepository,
    private graphEngine: GraphEngine
  ) {}
  
  async getRelated(id: number, depth: number): Promise<GraphResult> {
    // BFS/DFSアルゴリズムで関連ノードを探索
    const visited = new Set<number>();
    const queue: Array<{id: number, distance: number}> = [{id, distance: 0}];
    const result: GraphNode[] = [];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.distance > depth) break;
      
      if (!visited.has(current.id)) {
        visited.add(current.id);
        const item = await this.repository.findById(current.id);
        result.push({...item, distance: current.distance});
        
        // 関連ノードをキューに追加
        for (const relatedId of item.related) {
          queue.push({id: relatedId, distance: current.distance + 1});
        }
      }
    }
    
    return { nodes: result };
  }
}
```

#### 4.2.3 Search Service

```typescript
// services/search-service.ts
interface SearchService {
  fullTextSearch(query: string, options: SearchOptions): Promise<SearchResult>;
  findSimilar(id: number, limit: number): Promise<Item[]>;
  suggest(prefix: string, type: 'tag' | 'category'): Promise<string[]>;
}

class SearchServiceImpl implements SearchService {
  constructor(
    private repository: ItemRepository,
    private searchEngine: SearchEngine
  ) {}
  
  async fullTextSearch(query: string, options: SearchOptions): Promise<SearchResult> {
    // SQLiteのFTS5を使用した全文検索
    const results = await this.searchEngine.search(query, options);
    return {
      items: results,
      total: results.length
    };
  }
}
```

### 4.3 Domain Layer

#### 4.3.1 Item Entity

```typescript
// domain/entities/item.ts
class Item {
  private constructor(
    public readonly id: number,
    public readonly type: string,
    public readonly title: string,
    public readonly description: string,
    public readonly content: string,
    public readonly status: string,
    public readonly priority: Priority,
    public readonly category: string | null,
    public readonly startDate: Date | null,
    public readonly endDate: Date | null,
    public readonly version: string | null,
    public readonly related: number[],
    public readonly tags: string[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}
  
  static create(data: CreateItemData): Item {
    // ドメインルールの適用
    if (!data.title || data.title.length === 0) {
      throw new DomainError('Title is required');
    }
    
    return new Item(
      0, // IDは永続化時に割り当て
      data.type || 'default',
      data.title,
      data.description || '',
      data.content || '',
      data.status || 'Open',
      data.priority || Priority.MEDIUM,
      data.category || null,
      data.startDate || null,
      data.endDate || null,
      data.version || null,
      data.related || [],
      data.tags || [],
      new Date(),
      new Date()
    );
  }
  
  addRelation(targetId: number): Item {
    if (this.related.includes(targetId)) {
      return this;
    }
    return new Item(
      this.id,
      this.type,
      this.title,
      this.description,
      this.content,
      this.status,
      this.priority,
      this.category,
      this.startDate,
      this.endDate,
      this.version,
      [...this.related, targetId],
      this.tags,
      this.createdAt,
      new Date()
    );
  }
}
```

#### 4.3.2 Value Objects

```typescript
// domain/value-objects/priority.ts
enum Priority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  MINIMAL = 'MINIMAL'
}

// domain/value-objects/item-filter.ts
interface ItemFilter {
  type?: string;
  status?: string[];
  priority?: Priority[];
  tags?: string[];
  category?: string;
  dateRange?: {
    start?: Date;
    end?: Date;
  };
}
```

### 4.4 Infrastructure Layer

#### 4.4.1 Repository Implementation

```typescript
// infrastructure/repositories/prisma-item-repository.ts
class PrismaItemRepository implements ItemRepository {
  constructor(private prisma: PrismaClient) {}
  
  async save(item: Item): Promise<Item> {
    const data = this.toPrismaData(item);
    const result = await this.prisma.item.create({
      data,
      include: {
        tags: true,
        status: true
      }
    });
    return this.toDomainEntity(result);
  }
  
  async findById(id: number): Promise<Item | null> {
    const result = await this.prisma.item.findUnique({
      where: { id },
      include: {
        tags: true,
        status: true
      }
    });
    return result ? this.toDomainEntity(result) : null;
  }
  
  private toPrismaData(item: Item): any {
    return {
      type: item.type,
      title: item.title,
      description: item.description,
      content: item.content,
      statusId: this.getStatusId(item.status),
      priority: item.priority,
      category: item.category,
      startDate: item.startDate,
      endDate: item.endDate,
      version: item.version,
      related: JSON.stringify(item.related),
      tags: {
        connectOrCreate: item.tags.map(tag => ({
          where: { name: tag },
          create: { name: tag }
        }))
      }
    };
  }
}
```

## 5. データフロー

### 5.1 アイテム作成フロー

```
Client → CLI/MCP → ItemService → Validator → Item Entity → Repository → Database
                                       ↓
                                   EventBus → Subscribers
```

### 5.2 グラフ探索フロー

```
Client → CLI/MCP → GraphService → GraphEngine → Repository → Database
                                        ↓
                                   Cache Layer
```

## 6. 非機能設計

### 6.1 パフォーマンス

- **キャッシング**: 頻繁にアクセスされるデータのメモリキャッシュ
- **インデックス**: 適切なデータベースインデックス
- **遅延読み込み**: 必要なときだけ関連データを取得
- **バッチ処理**: 複数操作の一括実行

### 6.2 最適化

- **インデックス最適化**: 適切なインデックス設計
- **クエリ最適化**: 効率的なクエリ実行
- **非同期処理**: バックグラウンド処理

### 6.3 信頼性

- **トランザクション**: データ整合性の保証
- **エラーハンドリング**: 包括的なエラー処理
- **ログ記録**: 詳細な操作ログ
- **監視**: ヘルスチェックエンドポイント

## 7. セキュリティ設計

### 7.1 入力検証

```typescript
class ItemValidator {
  validate(data: CreateItemDto): void {
    // タイトル検証
    if (!data.title || data.title.length > 200) {
      throw new ValidationError('Invalid title');
    }
    
    // コンテンツサイズ検証
    if (data.content && data.content.length > 102400) {
      throw new ValidationError('Content too large');
    }
    
    // XSS対策
    data.title = this.sanitize(data.title);
    data.description = this.sanitize(data.description);
  }
}
```

### 7.2 アクセス制御

- v0.8.0: ローカルアクセスのみ、シングルユーザー

## 8. 拡張ポイント

### 8.1 プラグインアーキテクチャ

```typescript
interface Plugin {
  name: string;
  version: string;
  initialize(context: PluginContext): void;
  execute(event: Event): Promise<void>;
}

class PluginManager {
  private plugins: Plugin[] = [];
  
  register(plugin: Plugin): void {
    this.plugins.push(plugin);
    plugin.initialize(this.context);
  }
  
  async emit(event: Event): Promise<void> {
    for (const plugin of this.plugins) {
      await plugin.execute(event);
    }
  }
}
```

### 8.2 カスタムTYPEハンドラー（AI側実装）

```typescript
// AI側でTYPE別の処理を定義
interface TypeHandler {
  type: string;
  getDefaultValues(): Partial<CreateItemDto>;
  validate(item: Item): void;
  getRelatedTypes(): string[];
}

// 例: issueタイプのハンドラー
class IssueTypeHandler implements TypeHandler {
  type = 'issue';
  
  getDefaultValues() {
    return {
      status: 'Open',
      priority: Priority.HIGH
    };
  }
  
  validate(item: Item) {
    // issue特有のバリデーション
  }
  
  getRelatedTypes() {
    return ['task', 'bug', 'feature'];
  }
}
```

## 9. デプロイメントアーキテクチャ

### 9.1 シングルバイナリ

```
shirokuma
├── CLI Mode (default)
└── Server Mode (--serve flag)
    ├── MCP Server
    └── REST API (optional)
```

### 9.2 Docker構成

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/index.js", "--serve"]
```

## 10. まとめ

本アーキテクチャは、シンプルさと拡張性のバランスを重視し、GraphDB風のデータモデルを採用しています。TYPE別の処理を完全に排除し、AI側で柔軟に意味付けができる設計により、柔軟な運用が可能な構造となっています。