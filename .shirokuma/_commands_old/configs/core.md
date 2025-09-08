# SHIROKUMA Knowledge Base - Core Configuration

**Version**: 0.8.0
**Last Updated**: 2025-08-13

## プロジェクト概要

SHIROKUMA Knowledge Baseは、MCP (Model Context Protocol) サーバーとして実装された知識管理システムです。

### 主な特徴
- **アーキテクチャ**: Prisma + SQLite
- **言語**: TypeScript (ES2022, ESM)
- **AI統合**: Claude AI による自動エンリッチメント
- **検索**: キーワード、コンセプト、埋め込みベクトルによるハイブリッド検索

## 技術スタック

```yaml
project:
  name: "@shirokuma-library/mcp-knowledge-base"
  version: "0.8.0"
  type: "mcp_server"
  
runtime:
  language: "TypeScript"
  node: ">=18.0.0"
  module: "ESModule"
  
database:
  orm: "Prisma"
  engine: "SQLite"
  location: ".shirokuma/data/shirokuma.db"
  
dependencies:
  core:
    - "@modelcontextprotocol/sdk": "^1.0.6"
    - "@prisma/client": "^6.13.0"
    - "commander": "^13.1.0"
    - "chalk": "^5.4.1"
    - "zod": "^3.24.1"
```

## ディレクトリ構造

```
shirokuma-v8/
├── src/
│   ├── cli/               # CLIコマンド実装
│   ├── mcp/              # MCPサーバー実装
│   │   ├── server.ts     # メインサーバー
│   │   ├── handlers/     # CRUD、検索、システムハンドラー
│   │   ├── tools/        # ツール定義
│   │   └── database/     # データベース操作
│   ├── services/         # ビジネスロジック
│   │   ├── ai/          # AI関連サービス（モジュール化済み）
│   │   └── *.service.ts # 各種サービス
│   └── utils/            # ユーティリティ
│       └── validation.ts # バリデーション（typeフィールド等）
├── prisma/
│   ├── schema.prisma     # データベーススキーマ
│   └── migrations/       # マイグレーションファイル
├── dist/                 # ビルド出力
├── .shirokuma/
│   ├── configs/         # プロジェクト設定
│   ├── rules/           # 汎用ルール
│   └── data/            # 本番データベース
└── .claude/
    ├── agents/          # AIエージェント定義
    └── commands/        # カスタムコマンド
```

## データモデル

### Item（メインエンティティ）
```typescript
{
  id: number
  type: string          // a-z, 0-9, _ のみ
  title: string
  description: string
  content: string
  aiSummary?: string    // AI生成サマリー
  statusId: number
  priority: Priority
  category?: string
  startDate?: Date
  endDate?: Date
  version?: string
  searchIndex?: string  // 検索用インデックス
  embedding?: Buffer    // 量子化済み埋め込みベクトル
  createdAt: Date
  updatedAt: Date
}
```

### 関連テーブル
- **Status**: ステータス管理
- **Tag / ItemTag**: タグ管理
- **Keyword / ItemKeyword**: キーワード管理（正規化済み）
- **Concept / ItemConcept**: コンセプト管理（正規化済み）
- **ItemRelation**: アイテム間の関係
- **SystemState**: システム状態（カレントステート）

## AI機能

### エンリッチメント
アイテム作成時に自動的に以下を生成：
- **キーワード抽出**: TF-IDFによる重み付き英語キーワード
- **コンセプト検出**: 高レベルカテゴリの識別
- **サマリー生成**: 簡潔な要約
- **埋め込みベクトル**: 128次元、Int8量子化

### 検索戦略
```typescript
// キーワード検索
strategy: 'keywords'

// コンセプト検索  
strategy: 'concepts'

// 埋め込みベクトル検索
strategy: 'embedding'

// ハイブリッド検索
strategy: 'hybrid',
weights: { keywords: 0.4, embedding: 0.6 }
```

## CLI コマンド

```bash
# アイテム操作
shirokuma-kb create -t <type> -T <title> -d <description>
shirokuma-kb list [--type <type>] [--status <status>]
shirokuma-kb get <id>
shirokuma-kb update <id> [options]
shirokuma-kb delete <id>

# 検索
shirokuma-kb search <query>
shirokuma-kb related <id>

# システム
shirokuma-kb migrate [--reset] [--seed]
shirokuma-kb serve
```

## MCP ツール

### 基本CRUD
- `create_item` - アイテム作成（AI自動エンリッチメント付き）
- `get_item` - アイテム取得
- `update_item` - アイテム更新
- `delete_item` - アイテム削除

### 検索・一覧
- `search_items` - 高度な検索（AND/OR、日付範囲、フィルター）
- `list_items` - フィルタリング・ソート付き一覧

### 関係管理
- `get_related_items` - 関連アイテム取得（複数戦略）
- `add_relations` - 双方向リレーション追加
- `remove_relations` - リレーション削除

### システム
- `get_current_state` - 現在のシステム状態取得
- `update_current_state` - システム状態更新
- `get_stats` - 統計情報取得

## 開発原則

1. **イシュー駆動開発** - コード変更前に必ずイシュー作成
2. **TDD** - テスト → 実装 → リファクタリング
3. **即座の記録** - アイデアは思いついたらすぐMCPに記録
4. **型安全性** - TypeScript + Zod による厳格な型検証
5. **モジュール化** - 機能ごとに分離されたモジュール構成