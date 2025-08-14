# Shirokuma MCP v0.8.0 クイックスタートガイド

## 🚀 30分で動かすGraphDB風MCP

### 1. プロジェクト作成（5分）

```bash
# プロジェクト作成
mkdir shirokuma-v8
cd shirokuma-v8

# 初期化
npm init -y
npm install @prisma/client @modelcontextprotocol/sdk commander
npm install -D typescript tsx prisma @types/node
```

### 2. 最小構成のセットアップ（10分）

#### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

#### prisma/schema.prisma
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./data.db"
}

model Item {
  id          Int      @id @default(autoincrement())
  type        String
  title       String
  description String
  content     String
  status      String   @default("Open")
  priority    String   @default("MEDIUM")
  related     String?  // JSON array [1,2,3]
  tags        String?  // JSON array ["tag1","tag2"]
  
  // インテリジェント拡張
  searchIndex String?  // 多言語キーワード
  concepts    String?  // 概念カテゴリ
  entities    String?  // エンティティ
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 3. コア実装（10分）

#### src/index.ts
```typescript
import { PrismaClient } from '@prisma/client';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const prisma = new PrismaClient();

// MCPサーバー作成
const server = new Server(
  {
    name: 'shirokuma-mcp',
    version: '0.8.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ツール: アイテム作成
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'create_item': {
      const item = await prisma.item.create({
        data: {
          type: args.type || 'default',
          title: args.title,
          description: args.description || '',
          content: args.content || '',
          status: args.status || 'Open',
          priority: args.priority || 'MEDIUM',
          related: args.related ? JSON.stringify(args.related) : null,
          tags: args.tags ? JSON.stringify(args.tags) : null,
        },
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(item, null, 2) }],
      };
    }

    case 'get_item': {
      const item = await prisma.item.findUnique({
        where: { id: args.id },
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(item, null, 2) }],
      };
    }

    case 'list_items': {
      const items = await prisma.item.findMany({
        where: args.type ? { type: args.type } : undefined,
        take: args.limit || 20,
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(items, null, 2) }],
      };
    }

    case 'search': {
      const items = await prisma.item.findMany({
        where: {
          OR: [
            { title: { contains: args.query } },
            { description: { contains: args.query } },
            { content: { contains: args.query } },
          ],
        },
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(items, null, 2) }],
      };
    }

    case 'add_relation': {
      const item = await prisma.item.findUnique({
        where: { id: args.sourceId },
      });
      const related = JSON.parse(item?.related || '[]');
      related.push(args.targetId);
      
      const updated = await prisma.item.update({
        where: { id: args.sourceId },
        data: { related: JSON.stringify(related) },
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(updated, null, 2) }],
      };
    }

    case 'get_related': {
      const item = await prisma.item.findUnique({
        where: { id: args.id },
      });
      const relatedIds = JSON.parse(item?.related || '[]');
      
      const relatedItems = await prisma.item.findMany({
        where: { id: { in: relatedIds } },
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(relatedItems, null, 2) }],
      };
    }

    case 'get_current_state': {
      const state = await prisma.item.findFirst({
        where: { type: 'current_state' },
        orderBy: { updatedAt: 'desc' },
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(state, null, 2) }],
      };
    }

    case 'update_current_state': {
      const existing = await prisma.item.findFirst({
        where: { type: 'current_state' },
      });

      const state = existing
        ? await prisma.item.update({
            where: { id: existing.id },
            data: {
              content: args.content,
              related: args.related ? JSON.stringify(args.related) : existing.related,
              tags: args.tags ? JSON.stringify(args.tags) : existing.tags,
            },
          })
        : await prisma.item.create({
            data: {
              type: 'current_state',
              title: 'Current System State',
              description: 'Latest state of the knowledge base',
              content: args.content,
              status: 'Active',
              priority: 'HIGH',
              related: args.related ? JSON.stringify(args.related) : null,
              tags: args.tags ? JSON.stringify(args.tags) : null,
            },
          });
      return {
        content: [{ type: 'text', text: JSON.stringify(state, null, 2) }],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// ツール一覧
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: 'create_item',
        description: 'Create a new item node',
        inputSchema: {
          type: 'object',
          properties: {
            type: { type: 'string', description: 'Item type (any string)' },
            title: { type: 'string', description: 'Item title' },
            description: { type: 'string', description: 'Item description' },
            content: { type: 'string', description: 'Item content (markdown)' },
            priority: { type: 'string', enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'MINIMAL'] },
            related: { type: 'array', items: { type: 'number' }, description: 'Related item IDs' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Tags' },
          },
          required: ['title'],
        },
      },
      {
        name: 'get_item',
        description: 'Get item by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'Item ID' },
          },
          required: ['id'],
        },
      },
      {
        name: 'list_items',
        description: 'List items with optional type filter',
        inputSchema: {
          type: 'object',
          properties: {
            type: { type: 'string', description: 'Filter by type' },
            limit: { type: 'number', description: 'Maximum items to return' },
          },
        },
      },
      {
        name: 'search',
        description: 'Search items by text',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
          },
          required: ['query'],
        },
      },
      {
        name: 'add_relation',
        description: 'Add relation between items',
        inputSchema: {
          type: 'object',
          properties: {
            sourceId: { type: 'number', description: 'Source item ID' },
            targetId: { type: 'number', description: 'Target item ID' },
          },
          required: ['sourceId', 'targetId'],
        },
      },
      {
        name: 'get_related',
        description: 'Get related items',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'Item ID' },
          },
          required: ['id'],
        },
      },
      {
        name: 'get_current_state',
        description: 'Get the current system state',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'update_current_state',
        description: 'Update the current system state',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'State content in Markdown' },
            related: { type: 'array', items: { type: 'number' }, description: 'Related item IDs' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Tags' },
          },
          required: ['content'],
        },
      },
    ],
  };
});

// サーバー起動
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Shirokuma MCP v0.8.0 started');
}

main().catch(console.error);
```

### 4. ビルドと実行（5分）

```bash
# データベース初期化
npx prisma db push

# TypeScriptコンパイル
npx tsc

# MCPサーバーとして起動
node dist/index.js
```

## 📝 使用例

### Claude Desktopでの設定

`~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "shirokuma": {
      "command": "node",
      "args": ["/path/to/shirokuma-v8/dist/index.js"]
    }
  }
}
```

### 基本操作

```javascript
// アイテム作成
await use_mcp_tool("shirokuma", "create_item", {
  type: "task",
  title: "GraphDB実装",
  description: "シンプルなグラフ構造の実装",
  priority: "HIGH",
  tags: ["development", "backend"]
});

// 検索
await use_mcp_tool("shirokuma", "search", {
  query: "GraphDB"
});

// 関連付け
await use_mcp_tool("shirokuma", "add_relation", {
  sourceId: 1,
  targetId: 2
});

// 関連アイテム取得
await use_mcp_tool("shirokuma", "get_related", {
  id: 1
});

// カレントステート更新
await use_mcp_tool("shirokuma", "update_current_state", {
  content: "## Current Tasks\n- Implementing graph features\n- Testing MCP integration",
  related: [1, 2],
  tags: ["active", "development"]
});

// カレントステート取得
await use_mcp_tool("shirokuma", "get_current_state", {});
```

## 🎯 設計のポイント

### なぜシンプルなのか？

1. **TYPEは単なるラベル**: システムは意味を持たない
2. **フラットな構造**: すべてのアイテムが同じ扱い
3. **グラフ思考**: 関連性を重視
4. **AI側で管理**: 複雑な処理はAIが担当

### 拡張ポイント

```typescript
// インテリジェント機能の追加

// 1. 多言語キーワード展開
const dictionary = new Map([
  ["database", ["データベース", "DB", "ＤＢ"]],
  ["認証", ["auth", "authentication", "login"]],
  ["検索", ["search", "find", "query"]]
]);

function expandKeywords(text: string): string[] {
  const words = text.toLowerCase().split(/\s+/);
  const expanded = new Set(words);
  
  words.forEach(word => {
    dictionary.forEach((synonyms, key) => {
      if (word === key || synonyms.includes(word)) {
        expanded.add(key);
        synonyms.forEach(s => expanded.add(s));
      }
    });
  });
  
  return Array.from(expanded);
}

// 2. 自動関連付け
async function smartCreateWithRelations(data: any) {
  // キーワード抽出
  const keywords = expandKeywords(`${data.title} ${data.content}`);
  
  // 類似アイテム検索
  const similar = await prisma.item.findMany({
    where: {
      OR: keywords.map(k => ({ searchIndex: { contains: k } }))
    },
    take: 5
  });
  
  // アイテム作成
  const item = await prisma.item.create({
    data: {
      ...data,
      searchIndex: keywords.join(' '),
      related: JSON.stringify(similar.map(s => s.id))
    }
  });
  
  // 双方向リレーション作成
  for (const sim of similar) {
    const related = JSON.parse(sim.related || '[]');
    if (!related.includes(item.id)) {
      related.push(item.id);
      await prisma.item.update({
        where: { id: sim.id },
        data: { related: JSON.stringify(related) }
      });
    }
  }
  
  return item;
}

// 3. グラフ探索の深度対応
async function getRelatedWithDepth(id: number, depth: number) {
  const visited = new Set<number>();
  const queue = [{id, level: 0}];
  const results = [];
  
  while (queue.length > 0) {
    const {id: currentId, level} = queue.shift()!;
    if (level > depth || visited.has(currentId)) continue;
    
    visited.add(currentId);
    const item = await prisma.item.findUnique({where: {id: currentId}});
    if (item) {
      results.push({...item, distance: level});
      const related = JSON.parse(item.related || '[]');
      related.forEach((relId: number) => {
        queue.push({id: relId, level: level + 1});
      });
    }
  }
  return results;
}

// 2. 統計情報
async function getStats() {
  const typeGroups = await prisma.item.groupBy({
    by: ['type'],
    _count: true,
  });
  
  return {
    total: await prisma.item.count(),
    byType: typeGroups,
    recentItems: await prisma.item.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
    }),
  };
}
```

## 🔧 カスタマイズ

### TYPE管理（AI側）

```typescript
// AI側でTYPEの意味を定義
const TYPE_DEFINITIONS = {
  'bug': { defaultPriority: 'HIGH', defaultStatus: 'Open' },
  'feature': { defaultPriority: 'MEDIUM', defaultStatus: 'Specification' },
  'doc': { defaultPriority: 'LOW', defaultStatus: 'Draft' },
  // 自由に追加可能
};

// AI側でバリデーション
function validateByType(type: string, item: any) {
  // TYPE別のルールを適用
  if (type === 'bug' && !item.description.includes('Steps to reproduce')) {
    return 'Bug items should include steps to reproduce';
  }
  return null;
}
```

## 🎉 完成！

これで、シンプルなGraphDB風MCPサーバーが動作します。

**特徴**:
- ✅ 30分で構築可能
- ✅ 最小限の依存関係
- ✅ 拡張が容易
- ✅ AI側で柔軟に制御

**次のステップ**:
1. より多くのツールを追加
2. グラフ探索アルゴリズムの実装
3. パフォーマンス最適化
4. テストの追加

詳細な仕様は[ドキュメント一覧](./README.md)を参照してください。