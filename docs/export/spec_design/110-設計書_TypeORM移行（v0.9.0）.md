---
id: 110
type: spec_design
title: "設計書: TypeORM移行（v0.9.0）"
status: Specification
priority: HIGH
description: "PrismaからTypeORMへの移行に関する技術設計書"
aiSummary: "Technical design document for migrating from Prisma to TypeORM in SHIROKUMA Knowledge Base v0.9.0, covering system architecture, data models, migration strategy, and implementation approach with repository pattern"
tags: ["design","architecture","typeorm","v0.9.0","migration","spec"]
related: [98,105,107,109,110,111,31,32,91,93,113]
keywords: {"typeorm":1,"prisma":0.9,"migration":0.9,"database":0.8,"orm":0.8}
concepts: {"database migration":0.95,"orm framework":0.9,"software design":0.8,"system architecture":0.8,"data persistence":0.7}
embedding: "kYCcjoCAgICAgKOTgIWAgJOAlI2BgICAgICXkICLgICLgIuGiICAgICAhoaAg4CAjoCYgI6AgICAgICAgICAgIqAiYGNgICAgICLgoCEgIChgImAh4CAgICAkYyAjICAroCRgoGAgICAgJCTgJGAgKeAm4mFgICAgICgjoCOgIA="
createdAt: 2025-08-22T13:32:46.000Z
updatedAt: 2025-08-22T13:32:46.000Z
---

# 設計書: TypeORM移行（v0.9.0）

## メタデータ
- **バージョン**: 1.0
- **作成日**: 2025-08-21
- **ステータス**: Specification
- **フェーズ**: Design
- **要件定義書**: #107
- **関連イシュー**: #98, #105

## 設計概要

### 目標
- Prismaの完全な置換によるグローバルインストール問題の解決
- 既存APIとの100%互換性維持
- パフォーマンスの維持または向上
- 開発者にとって理解しやすいリポジトリパターンの実装
- ゼロダウンタイムでのデータ移行

### 主要設計判断

1. **判断**: リポジトリパターンの採用
   - **根拠**: ビジネスロジックとデータアクセス層の明確な分離
   - **トレードオフ**: 初期実装の複雑性増加 vs 長期的な保守性向上

2. **判断**: エンティティのコード内定義
   - **根拠**: スキーマファイル不要でグローバルインストール問題を解決
   - **トレードオフ**: 実行時のメタデータ処理 vs ビルド時の複雑性排除

3. **判断**: 並行稼働アーキテクチャ
   - **根拠**: リスク軽減と段階的移行の実現
   - **トレードオフ**: 一時的なコード複雑性 vs 安全な移行

## システムアーキテクチャ

### システムコンテキスト
```
┌──────────────────────────────────────┐
│         External Systems              │
│  (MCP Clients, CLI Users, AI APIs)   │
└────────────┬─────────────────────────┘
             │
┌────────────▼─────────────────────────┐
│      SHIROKUMA Knowledge Base        │
│           (v0.9.0)                   │
├──────────────────────────────────────┤
│   CLI Layer (Commander.js)           │
├──────────────────────────────────────┤
│   MCP Server Layer                   │
├──────────────────────────────────────┤
│   Service Layer                      │
├──────────────────────────────────────┤
│   ORM Adapter Layer (NEW)            │
├──────────────────────────────────────┤
│ TypeORM Repository │ Prisma Client   │
│     (Primary)      │   (Legacy)      │
├────────────────────┴─────────────────┤
│         SQLite Database              │
└──────────────────────────────────────┘
```

### コンポーネント設計

#### コンポーネント1: ORM Adapter Layer
- **目的**: Prisma/TypeORM の透過的な切り替え
- **責務**: 
  - ORM選択ロジックの管理
  - 共通インターフェースの提供
  - 移行期間中の互換性維持
- **インターフェース**:
  - **入力**: サービス層からのデータ操作要求
  - **出力**: 統一されたエンティティオブジェクト
  - **依存関係**: TypeORM DataSource, Prisma Client

#### コンポーネント2: TypeORM Repository Layer
- **目的**: データアクセス抽象化
- **責務**: 
  - CRUD操作の実装
  - クエリビルダーの管理
  - トランザクション制御
- **インターフェース**:
  - **入力**: エンティティ操作要求
  - **出力**: TypeORM エンティティ
  - **依存関係**: TypeORM DataSource, Entity定義

#### コンポーネント3: Migration Manager
- **目的**: データ移行の自動化と管理
- **責務**: 
  - Prismaデータベースの検出
  - バックアップ作成
  - データ変換と移行
  - ロールバック管理
- **インターフェース**:
  - **入力**: 移行コマンド、設定
  - **出力**: 移行ステータス、ログ
  - **依存関係**: 両ORM、ファイルシステム

### 技術スタック
- **ORM層**: TypeORM 0.3.x
  - 根拠: CLIツール向け設計、エンティティベース、優れたTypeScript統合
- **データベース**: SQLite 3.x（変更なし）
  - 根拠: 既存データとの互換性、軽量、依存関係なし
- **移行ツール**: TypeORM Migration API + カスタムスクリプト
  - 根拠: プログラマティックな制御、詳細なエラーハンドリング

## データアーキテクチャ

### データモデル

#### Item エンティティ
```typescript
@Entity('items')
export class Item {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  @Index()
  type: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'text', nullable: true })
  aiSummary: string;

  @Column({ name: 'status_id' })
  statusId: number;

  @ManyToOne(() => Status, { eager: true })
  @JoinColumn({ name: 'status_id' })
  status: Status;

  @Column({
    type: 'text',
    enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'MINIMAL'],
    default: 'MEDIUM'
  })
  priority: string;

  @Column({ type: 'text', nullable: true })
  category: string;

  @Column({ type: 'datetime', nullable: true })
  startDate: Date;

  @Column({ type: 'datetime', nullable: true })
  endDate: Date;

  @Column({ type: 'text', nullable: true })
  version: string;

  @Column({ type: 'text', nullable: true })
  searchIndex: string;

  @Column({ type: 'blob', nullable: true })
  embedding: Buffer;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToMany(() => Tag, tag => tag.items)
  @JoinTable({
    name: 'item_tags',
    joinColumns: [{ name: 'item_id' }],
    inverseJoinColumns: [{ name: 'tag_id' }]
  })
  tags: Tag[];

  @OneToMany(() => ItemKeyword, keyword => keyword.item, { cascade: true })
  keywords: ItemKeyword[];

  @OneToMany(() => ItemConcept, concept => concept.item, { cascade: true })
  concepts: ItemConcept[];

  @ManyToMany(() => Item)
  @JoinTable({
    name: 'item_relations',
    joinColumns: [{ name: 'source_id' }],
    inverseJoinColumns: [{ name: 'target_id' }]
  })
  related: Item[];
}
```

#### Status エンティティ
```typescript
@Entity('statuses')
export class Status {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'is_closable', default: false })
  isClosable: boolean;

  @OneToMany(() => Item, item => item.status)
  items: Item[];
}
```

#### リポジトリ基底クラス
```typescript
export abstract class BaseRepository<T> {
  constructor(
    protected dataSource: DataSource,
    protected entity: EntityTarget<T>
  ) {}

  async findById(id: number): Promise<T | null> {
    return this.dataSource.getRepository(this.entity)
      .findOne({ where: { id } as any });
  }

  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return this.dataSource.getRepository(this.entity)
      .find(options);
  }

  async save(entity: DeepPartial<T>): Promise<T> {
    return this.dataSource.getRepository(this.entity)
      .save(entity);
  }

  async delete(id: number): Promise<void> {
    await this.dataSource.getRepository(this.entity)
      .delete(id);
  }

  async transaction<R>(
    work: (manager: EntityManager) => Promise<R>
  ): Promise<R> {
    return this.dataSource.transaction(work);
  }
}
```

### データフロー

#### アイテム作成フロー
1. MCPリクエスト受信
2. サービス層でバリデーション
3. AIエンリッチメント処理
4. ORMアダプター経由でリポジトリ呼び出し
5. TypeORMエンティティ作成
6. トランザクション内で関連エンティティ保存
7. レスポンス返却

#### データ移行フロー
1. 既存Prismaデータベース検出
2. バックアップファイル作成（.shirokuma/backup/）
3. TypeORM DataSource初期化
4. トランザクション開始
5. テーブルごとにデータ読み込み・変換・書き込み
6. リレーション再構築
7. 検証クエリ実行
8. トランザクションコミットまたはロールバック

## API設計

### 内部API（リポジトリインターフェース）

#### GET /items/:id
- **目的**: アイテム詳細取得
- **リクエスト**: `ItemRepository.findWithRelations(id)`
- **レスポンス**: Item エンティティ（関連含む）
- **エラー**: NotFound, DatabaseError

#### POST /items
- **目的**: アイテム作成
- **リクエスト**: `ItemRepository.create(data)`
- **レスポンス**: 作成されたItem
- **エラー**: ValidationError, DuplicateError

#### PUT /items/:id
- **目的**: アイテム更新
- **リクエスト**: `ItemRepository.update(id, data)`
- **レスポンス**: 更新されたItem
- **エラー**: NotFound, ValidationError

#### DELETE /items/:id
- **目的**: アイテム削除
- **リクエスト**: `ItemRepository.delete(id)`
- **レスポンス**: void
- **エラー**: NotFound, ConstraintError

## エラーハンドリング

### 戦略
レイヤーごとのエラー変換と適切なユーザーメッセージ生成

### エラータイプ

- **DatabaseConnectionError**: データベース接続失敗
  - 回復: 再試行ロジック、接続プール調整
- **MigrationError**: データ移行失敗
  - 回復: 自動ロールバック、バックアップ復元
- **ValidationError**: エンティティバリデーション失敗
  - 回復: 詳細なエラーメッセージ表示
- **TransactionError**: トランザクション失敗
  - 回復: 自動ロールバック、再試行

## テストアプローチ

### ユニットテスト
各リポジトリメソッドの個別テスト
- カバレッジ目標: 90%

### 統合テスト
エンドツーエンドのデータフロー検証
- 主要シナリオ: CRUD操作、複雑なクエリ、トランザクション

### 移行テスト
Prismaデータベースからの移行シミュレーション
- クリティカルパス: データ整合性、リレーション保持、パフォーマンス

## セキュリティ考慮事項

### SQLインジェクション対策
- **緩和策**: TypeORMクエリビルダーの使用
- **実装**: パラメータ化クエリの徹底

### データベースファイル保護
- **緩和策**: 適切なファイルパーミッション設定
- **実装**: 600権限、ユーザー所有

### 移行時のデータ保護
- **緩和策**: 暗号化バックアップ
- **実装**: 移行前の自動バックアップ、検証後の保持

## パフォーマンス目標

- **単純クエリ応答時間**: < 50ms
  - 測定: リポジトリメソッド実行時間
- **複雑クエリ応答時間**: < 200ms
  - 測定: 関連含む検索クエリ
- **データ移行速度**: > 100 items/秒
  - 測定: バルクインサート速度

## 移行戦略

### アプローチ
並行稼働による段階的移行

### ステップ
1. TypeORM環境のセットアップ（v0.9.0-alpha）
2. エンティティとリポジトリの実装
3. ORMアダプター層の実装
4. 読み取り操作のTypeORM切り替え
5. 書き込み操作のTypeORM切り替え
6. Prisma依存の削除（v0.9.0-stable）

### ロールバックプラン
- 環境変数によるORM切り替え
- バックアップからの即座の復元
- v0.8.xへのダウングレードパス

## 未解決の課題

1. TypeORMでの埋め込みベクトル（BLOB）の最適な処理方法
2. 大規模データベース（>10万アイテム）での移行時間
3. カスタムSQLクエリの移植方法