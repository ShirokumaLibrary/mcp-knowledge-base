# データベース設計書

## 1. 概要

Shirokuma MCP Knowledge Base v0.8.0では、SQLiteをメインデータベースとして採用し、Prisma ORMを通じて統一Itemモデルを実装します。本書では、データベース設計の詳細とパフォーマンス最適化戦略を説明します。

## 2. データベース選定

### 2.1 SQLite選定理由

1. **ゼロコンフィグ**: インストール・設定が不要
2. **ポータブル**: 単一ファイルでデータベース完結
3. **高性能**: 小規模データセットで優秀なパフォーマンス
4. **信頼性**: ACIDトランザクションをサポート
5. **組み込み親和性**: Node.jsアプリケーションとの統合が容易

### 2.2 制約と対処

| 制約 | 対処方法 |
|------|---------|
| 同時書き込み制限 | 単一ユーザー運用で問題なし |
| データベースサイズ | 実用上問題なし（推奨最大281TB） |
| ネットワーク経由アクセス不可 | ローカル専用設計で問題なし |

## 3. スキーマ設計

### 3.1 統一Itemテーブル

```sql
CREATE TABLE items (
    -- 識別子
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    type        TEXT NOT NULL,          -- カテゴリーラベル
    
    -- コンテンツ
    title       TEXT NOT NULL,
    description TEXT NOT NULL,
    content     TEXT NOT NULL,          -- Markdown形式
    
    -- ステータス管理
    status_id   INTEGER NOT NULL,       -- 外部キー参照
    priority    TEXT NOT NULL 
                CHECK(priority IN ('CRITICAL','HIGH','MEDIUM','LOW','MINIMAL')),
    
    -- オプション属性
    category    TEXT,                   -- サブカテゴリー
    start_date  DATETIME,              -- 汎用開始日時
    end_date    DATETIME,              -- 汎用終了日時
    version     TEXT,                  -- バージョン情報
    
    -- グラフ関係
    related     TEXT,                  -- JSON配列 "[1, 2, 3]"
    
    -- インテリジェント機能
    search_index TEXT,                 -- 検索用キーワード（空白区切り）
    concepts    TEXT,                  -- JSON配列（概念タグ）
    entities    TEXT,                  -- JSON配列（エンティティ名）
    embedding   TEXT,                  -- JSON配列（ベクトル検索用）
    metadata    TEXT,                  -- JSON（追加メタデータ）
    
    -- タイムスタンプ
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- 制約
    FOREIGN KEY (status_id) REFERENCES statuses(id),
    CHECK(length(title) <= 200),
    CHECK(length(content) <= 102400)   -- 100KB制限
);
```

### 3.2 ステータス管理テーブル

```sql
CREATE TABLE statuses (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL UNIQUE,
    is_closable BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 標準ステータス
INSERT INTO statuses (name, is_closable, sort_order) VALUES
    ('Open', FALSE, 1),
    ('Specification', FALSE, 2),
    ('Waiting', FALSE, 3),
    ('Ready', FALSE, 4),
    ('In Progress', FALSE, 5),
    ('Review', FALSE, 6),
    ('Testing', FALSE, 7),
    ('Pending', FALSE, 8),
    ('Completed', TRUE, 9),
    ('Closed', TRUE, 10),
    ('Canceled', TRUE, 11),
    ('Rejected', TRUE, 12);
```

### 3.3 タグ管理テーブル

```sql
CREATE TABLE tags (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL UNIQUE,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE item_tags (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    tag_id  INTEGER NOT NULL,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE(item_id, tag_id)
);
```

### 3.4 全文検索テーブル

```sql
-- FTS5仮想テーブル
CREATE VIRTUAL TABLE items_fts USING fts5(
    title, 
    description, 
    content,
    search_index,
    content=items,
    content_rowid=id
);

-- FTS5同期トリガー
CREATE TRIGGER items_ai AFTER INSERT ON items BEGIN
    INSERT INTO items_fts(rowid, title, description, content, search_index) 
    VALUES (NEW.id, NEW.title, NEW.description, NEW.content, NEW.search_index);
END;

CREATE TRIGGER items_ad AFTER DELETE ON items BEGIN
    DELETE FROM items_fts WHERE rowid = OLD.id;
END;

CREATE TRIGGER items_au AFTER UPDATE ON items BEGIN
    UPDATE items_fts SET 
        title = NEW.title,
        description = NEW.description, 
        content = NEW.content,
        search_index = NEW.search_index
    WHERE rowid = NEW.id;
END;
```

### 3.5 現在状態テーブル

```sql
CREATE TABLE current_state (
    id          INTEGER PRIMARY KEY CHECK (id = 1), -- シングルトン
    content     TEXT NOT NULL,                       -- Markdown形式
    updated_by  TEXT,                               -- 更新者情報
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE current_state_tags (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    tag_id  INTEGER NOT NULL,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE current_state_related (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id     INTEGER NOT NULL,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);
```

## 4. インデックス戦略

### 4.1 基本インデックス

```sql
-- 基本検索インデックス
CREATE INDEX idx_items_type ON items(type);
CREATE INDEX idx_items_status ON items(status_id);
CREATE INDEX idx_items_priority ON items(priority);
CREATE INDEX idx_items_category ON items(category);

-- 複合インデックス（よく使用される組み合わせ）
CREATE INDEX idx_items_type_status ON items(type, status_id);
CREATE INDEX idx_items_type_priority ON items(type, priority);
CREATE INDEX idx_items_status_priority ON items(status_id, priority);

-- 日付検索インデックス
CREATE INDEX idx_items_dates ON items(start_date, end_date);
CREATE INDEX idx_items_created ON items(created_at);
CREATE INDEX idx_items_updated ON items(updated_at);

-- グラフトラバーサル用インデックス
CREATE INDEX idx_items_related ON items(related);
```

### 4.2 高度なインデックス

```sql
-- 部分インデックス（NULL値を除外）
CREATE INDEX idx_items_category_notnull ON items(category) WHERE category IS NOT NULL;
CREATE INDEX idx_items_version_notnull ON items(version) WHERE version IS NOT NULL;

-- 関数インデックス（検索性能向上）
CREATE INDEX idx_items_title_lower ON items(lower(title));
CREATE INDEX idx_items_type_lower ON items(lower(type));
```

## 5. Prisma ORM設計

### 5.1 スキーマ定義

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Item {
  id          Int       @id @default(autoincrement())
  type        String
  title       String
  description String
  content     String
  status      Status    @relation(fields: [statusId], references: [id])
  statusId    Int       @map("status_id")
  priority    Priority
  category    String?
  startDate   DateTime? @map("start_date")
  endDate     DateTime? @map("end_date")
  version     String?
  related     String    // JSON配列として格納
  searchIndex String?   @map("search_index")
  concepts    String?   // JSON配列
  entities    String?   // JSON配列
  embedding   String?   // JSON配列
  metadata    String?   // JSON
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  // Relations
  tags ItemTag[]

  @@map("items")
  @@index([type])
  @@index([statusId])
  @@index([priority])
  @@index([category])
  @@index([createdAt])
  @@index([updatedAt])
}

model Status {
  id         Int      @id @default(autoincrement())
  name       String   @unique
  isClosable Boolean  @default(false) @map("is_closable")
  sortOrder  Int      @default(0) @map("sort_order")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  // Relations
  items Item[]

  @@map("statuses")
}

model Tag {
  id        Int       @id @default(autoincrement())
  name      String    @unique
  createdAt DateTime  @default(now()) @map("created_at")

  // Relations
  items ItemTag[]

  @@map("tags")
}

model ItemTag {
  id     Int  @id @default(autoincrement())
  item   Item @relation(fields: [itemId], references: [id], onDelete: Cascade)
  itemId Int  @map("item_id")
  tag    Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)
  tagId  Int  @map("tag_id")

  @@unique([itemId, tagId])
  @@map("item_tags")
}

model CurrentState {
  id        Int      @id @default(1)
  content   String
  updatedBy String?  @map("updated_by")
  updatedAt DateTime @default(now()) @updatedAt @map("updated_at")

  @@map("current_state")
}

enum Priority {
  CRITICAL
  HIGH
  MEDIUM
  LOW
  MINIMAL
}
```

### 5.2 データアクセスレイヤー

```typescript
// infrastructure/database/prisma-client.ts
import { PrismaClient } from '@prisma/client';

class DatabaseClient extends PrismaClient {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query'] : [],
      datasources: {
        db: {
          url: process.env.DATABASE_URL || 'file:./data/shirokuma.db'
        }
      }
    });
  }

  async initialize(): Promise<void> {
    // 接続確認
    await this.$connect();
    
    // マイグレーション実行
    await this.runMigrations();
    
    // 初期データ投入
    await this.seedInitialData();
  }

  private async runMigrations(): Promise<void> {
    // Prisma Migrate実行
    // 本来はprisma deployコマンドで実行
  }

  private async seedInitialData(): Promise<void> {
    // 標準ステータスが存在しない場合のみ投入
    const statusCount = await this.status.count();
    if (statusCount === 0) {
      await this.createDefaultStatuses();
    }
  }
}

export const db = new DatabaseClient();
```

## 6. パフォーマンス最適化

### 6.1 クエリ最適化

```typescript
// 効率的なクエリパターン

class ItemRepository {
  // 良い例: 必要なフィールドのみ取得
  async findItemsForList(filter: ItemFilter): Promise<ItemListResult> {
    return this.db.item.findMany({
      select: {
        id: true,
        type: true,
        title: true,
        status: { select: { name: true } },
        priority: true,
        createdAt: true,
        updatedAt: true
      },
      where: this.buildWhereClause(filter),
      orderBy: { updatedAt: 'desc' },
      take: filter.limit || 20,
      skip: filter.offset || 0
    });
  }

  // 悪い例: 不要なフィールドまで取得
  async findItemsInefficient(): Promise<Item[]> {
    return this.db.item.findMany({
      include: {
        status: true,
        tags: {
          include: { tag: true }
        }
      }
    }); // contentやembedding等の大きなフィールドも取得
  }

  // 関連データの効率的な取得
  async findWithRelated(id: number): Promise<ItemWithRelated> {
    const item = await this.db.item.findUnique({
      where: { id },
      include: {
        status: true,
        tags: {
          include: { tag: true }
        }
      }
    });

    if (!item) return null;

    // related IDsを解析
    const relatedIds: number[] = JSON.parse(item.related || '[]');
    
    // 関連アイテムを別クエリで効率的に取得
    const relatedItems = await this.db.item.findMany({
      where: { id: { in: relatedIds } },
      select: {
        id: true,
        type: true,
        title: true,
        status: { select: { name: true } }
      }
    });

    return {
      ...item,
      relatedItems
    };
  }
}
```

### 6.2 バッチ処理最適化

```typescript
class BatchOperations {
  // トランザクション内での一括処理
  async createMultipleItems(items: CreateItemData[]): Promise<Item[]> {
    return this.db.$transaction(async (tx) => {
      const results: Item[] = [];
      
      for (const itemData of items) {
        // タグの一括作成/取得
        const tags = await this.ensureTags(tx, itemData.tags || []);
        
        // アイテム作成
        const item = await tx.item.create({
          data: {
            ...itemData,
            tags: {
              create: tags.map(tag => ({ tagId: tag.id }))
            }
          }
        });
        
        results.push(item);
      }
      
      return results;
    });
  }

  // タグの効率的な管理
  private async ensureTags(tx: any, tagNames: string[]): Promise<Tag[]> {
    // 既存タグを検索
    const existing = await tx.tag.findMany({
      where: { name: { in: tagNames } }
    });

    const existingNames = existing.map(tag => tag.name);
    const newTagNames = tagNames.filter(name => !existingNames.includes(name));

    // 新規タグを一括作成
    if (newTagNames.length > 0) {
      await tx.tag.createMany({
        data: newTagNames.map(name => ({ name })),
        skipDuplicates: true
      });
    }

    // 全タグを取得して返す
    return tx.tag.findMany({
      where: { name: { in: tagNames } }
    });
  }
}
```

### 6.3 接続プール設定

```typescript
// database/connection.ts
export const createDatabaseConnection = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'file:./data/shirokuma.db'
      }
    },
    log: [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'event',
        level: 'error',
      },
    ],
  });
};

// SQLite固有の最適化設定
export const optimizeSQLite = async (db: PrismaClient) => {
  // WALモード有効化（読み書き性能向上）
  await db.$executeRaw`PRAGMA journal_mode = WAL;`;
  
  // 外部キー制約有効化
  await db.$executeRaw`PRAGMA foreign_keys = ON;`;
  
  // 同期モード調整（性能向上）
  await db.$executeRaw`PRAGMA synchronous = NORMAL;`;
  
  // キャッシュサイズ調整（メモリ使用量 vs 性能）
  await db.$executeRaw`PRAGMA cache_size = -64000;`; // 64MB
  
  // 一時テーブル用メモリ使用
  await db.$executeRaw`PRAGMA temp_store = MEMORY;`;
};
```

## 7. データマイグレーション

### 7.1 マイグレーション戦略

```typescript
// migrations/migration-manager.ts
interface Migration {
  version: string;
  description: string;
  up: (db: PrismaClient) => Promise<void>;
  down: (db: PrismaClient) => Promise<void>;
}

class MigrationManager {
  private migrations: Migration[] = [];

  register(migration: Migration): void {
    this.migrations.push(migration);
    this.migrations.sort((a, b) => a.version.localeCompare(b.version));
  }

  async migrate(): Promise<void> {
    const currentVersion = await this.getCurrentVersion();
    const pendingMigrations = this.migrations.filter(
      m => m.version > currentVersion
    );

    for (const migration of pendingMigrations) {
      try {
        await migration.up(this.db);
        await this.updateVersion(migration.version);
        console.log(`Migration ${migration.version} completed`);
      } catch (error) {
        console.error(`Migration ${migration.version} failed:`, error);
        throw error;
      }
    }
  }

  async rollback(targetVersion: string): Promise<void> {
    const currentVersion = await this.getCurrentVersion();
    const rollbackMigrations = this.migrations
      .filter(m => m.version > targetVersion && m.version <= currentVersion)
      .reverse();

    for (const migration of rollbackMigrations) {
      try {
        await migration.down(this.db);
        await this.updateVersion(
          this.migrations.find(m => m.version < migration.version)?.version || '0.0.0'
        );
        console.log(`Rollback ${migration.version} completed`);
      } catch (error) {
        console.error(`Rollback ${migration.version} failed:`, error);
        throw error;
      }
    }
  }
}
```

### 7.2 バックアップ戦略

```typescript
// backup/backup-manager.ts
class BackupManager {
  async createBackup(backupPath: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `${backupPath}/shirokuma-${timestamp}.db`;
    
    // SQLiteファイルをコピー
    await this.copyFile(this.dbPath, backupFile);
    
    // メタデータファイル作成
    const metadata = {
      version: await this.getSchemaVersion(),
      timestamp,
      itemCount: await this.getItemCount(),
      size: await this.getFileSize(backupFile)
    };
    
    await this.writeFile(
      `${backupFile}.meta`, 
      JSON.stringify(metadata, null, 2)
    );
  }

  async restoreBackup(backupFile: string): Promise<void> {
    // 現在のDBをバックアップ
    await this.createBackup('./backup/pre-restore');
    
    // ファイル復元
    await this.copyFile(backupFile, this.dbPath);
    
    // スキーマバージョン確認
    const restoredVersion = await this.getSchemaVersion();
    const currentVersion = this.expectedVersion;
    
    if (restoredVersion !== currentVersion) {
      console.warn(`Schema version mismatch: ${restoredVersion} != ${currentVersion}`);
      // 必要に応じてマイグレーション実行
    }
  }
}
```

## 8. 監視・メトリクス

### 8.1 パフォーマンス監視

```typescript
// monitoring/database-monitor.ts
class DatabaseMonitor {
  async getMetrics(): Promise<DatabaseMetrics> {
    const [
      itemCount,
      dbSize,
      indexStats,
      queryStats
    ] = await Promise.all([
      this.getItemCount(),
      this.getDatabaseSize(),
      this.getIndexStatistics(),
      this.getQueryStatistics()
    ]);

    return {
      itemCount,
      dbSize,
      indexStats,
      queryStats,
      timestamp: new Date()
    };
  }

  private async getQueryStatistics(): Promise<QueryStats> {
    // SQLiteのクエリプランやEXPLAIN情報を取得
    const slowQueries = await this.db.$queryRaw`
      SELECT sql, 
             COUNT(*) as execution_count,
             AVG(execution_time) as avg_time
      FROM query_log 
      WHERE execution_time > 100
      GROUP BY sql
      ORDER BY avg_time DESC
      LIMIT 10
    `;

    return { slowQueries };
  }

  async analyzePerformance(): Promise<PerformanceReport> {
    return {
      recommendations: await this.getOptimizationRecommendations(),
      indexUsage: await this.getIndexUsage(),
      tableStats: await this.getTableStatistics()
    };
  }
}
```

## 9. まとめ

本データベース設計では、以下の特徴を実現しています：

1. **統一モデル**: 単一Itemテーブルですべてのデータを管理
2. **高性能**: 適切なインデックスとクエリ最適化
3. **拡張性**: JSONフィールドによる柔軟な属性拡張
4. **信頼性**: トランザクション、制約、バックアップによる整合性保証
5. **保守性**: Prisma ORMによるタイプセーフなデータアクセス

この設計により、シンプルでありながら高機能なGraphDB風データストレージを実現しています。