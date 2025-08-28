---
id: 162
type: spec_design
title: "Design: search_items API改善とステータス管理の修正"
status: Specification
priority: CRITICAL
description: "search_items APIの構造化クエリ対応とステータス管理改善の技術設計"
aiSummary: "Technical design document for improving search_items API with structured query support and status management enhancements, including backward compatibility and performance optimization strategies."
tags: ["design","api","architecture","search","spec","issue-160"]
related: [160,161]
keywords: {"api":1,"search":1,"status":1,"query":0.9,"management":0.8}
concepts: {"search_functionality":1,"api_design":0.9,"database_management":0.8,"system_architecture":0.8,"software_engineering":0.8}
embedding: "gIqAgICAgICPgKGRgISAgICQgICAgICAk4CgjYCMgoCAlICAgICAgJ+AlIWAkYuAgJKAgICAgICpgIaAgI6UgICLgICAgICAmYCCgoCQk4CAkYCAgICAgJ6Ag4qAi4qAgIqAgICAgICigJGQgIOBgICHgICAgICAoYCgjICAgIA="
createdAt: 2025-08-24T01:48:23.000Z
updatedAt: 2025-08-24T02:41:32.000Z
---

# 設計書: search_items API改善とステータス管理の修正

## メタデータ
- **バージョン**: 1.3
- **作成日**: 2025-08-24
- **更新日**: 2025-08-24
- **ステータス**: ドラフト
- **フェーズ**: 設計
- **要件仕様書**: #161
- **関連イシュー**: #160

## 1. 設計概要

### 目標
1. search_items APIで構造化クエリ（status:Open等）をサポート
2. is_closableフラグを活用したステータス管理
3. 後方互換性を維持しながら機能を拡張
4. パフォーマンスを維持（2秒以内のレスポンス）
5. 既存の初期化処理の修正（`migrate.ts`内の`seedDatabase`関数）

### 主要な設計判断
- **最小限の修正アプローチ**を採用（オプション1）
- 既存のTypeORMクエリビルダーを最大限活用
- 新しいSearchQueryParserクラスで構造化クエリを処理
- StatusRepositoryを新規作成してステータス管理を改善
- **修正**: migrate.ts内の既存seedDatabase関数は正しいが、実際のDBには反映されていない

## 2. システムアーキテクチャ

### コンテキスト図
```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│ MCPクライアント│────▶│  MCPサーバー  │────▶│ データベース  │
│ (AI/CLI)    │     │              │     │  (SQLite)    │
└─────────────┘     └──────────────┘     └──────────────┘
                           │
                    ┌──────▼──────┐
                    │ リポジトリ層  │
                    ├──────────────┤
                    │ ItemRepo     │
                    │ StatusRepo   │
                    └──────────────┘
```

### コンポーネント構造
```
src/
├── repositories/
│   ├── ItemRepository.ts (修正)
│   └── StatusRepository.ts (新規)
├── services/
│   └── SearchQueryParser.ts (新規)
├── cli/
│   └── commands/
│       └── migrate.ts (既存、確認のみ)
└── migrations/
    └── UpdateStatusFlags.ts (新規)
```

### 技術スタック
- **言語**: TypeScript
- **ORM**: TypeORM
- **データベース**: SQLite
- **テスト**: Vitest

## 3. データアーキテクチャ

### ステータステーブルの問題と解決

#### 現在の問題
- `migrate.ts`の`seedDatabase`関数では正しく`isClosable`が設定されている
- しかし、実際のDBでは全て`is_closable = 0`になっている
- SQLiteの型変換問題の可能性がある

#### 既存ユーザー向けマイグレーション（必須）
```sql
-- 既存データのis_closableフラグを修正
UPDATE statuses SET is_closable = 1 WHERE name IN ('Completed', 'Closed', 'Canceled', 'Rejected');
UPDATE statuses SET is_closable = 0 WHERE name IN ('Open', 'Ready', 'In Progress', 'Review', 'Specification', 'Waiting', 'Testing', 'Pending');
```

#### 新規ユーザー向け（migrate.ts内で既に定義済み）
```typescript
// src/cli/commands/migrate.ts 内の既存コード
const defaultStatuses = [
  { name: 'Open', isClosable: false, sortOrder: 0 },
  { name: 'Specification', isClosable: false, sortOrder: 1 },
  { name: 'Waiting', isClosable: false, sortOrder: 2 },
  { name: 'Ready', isClosable: false, sortOrder: 3 },
  { name: 'In Progress', isClosable: false, sortOrder: 4 },
  { name: 'Review', isClosable: false, sortOrder: 5 },
  { name: 'Testing', isClosable: false, sortOrder: 6 },
  { name: 'Pending', isClosable: false, sortOrder: 7 },
  { name: 'Completed', isClosable: true, sortOrder: 8 },
  { name: 'Closed', isClosable: true, sortOrder: 9 },
  { name: 'Canceled', isClosable: true, sortOrder: 10 },
  { name: 'Rejected', isClosable: true, sortOrder: 11 },
];
```

**注意**: SQLiteでboolean値を保存する際の問題を調査する必要がある

### リレーションシップ
```
Item ──多対一──▶ Status
```

### データフロー
1. クライアントが検索クエリを送信
2. サーバーがSearchQueryParserでクエリを解析
3. パーサーがフィルタとキーワードを識別
4. ItemRepositoryがTypeORMクエリを構築
5. データベースが最適化されたSQLを実行
6. 結果をクライアントに返却

## 4. コンポーネント設計

### SearchQueryParserサービス（新規）
```typescript
interface ParsedQuery {
  keywords: string[];        // キーワード
  filters: {
    type?: string[];         // タイプフィルタ
    status?: string[];       // ステータスフィルタ
    is?: 'open' | 'closed';  // 開閉状態フィルタ
    priority?: string[];     // 優先度フィルタ（将来用）
  };
  raw: string;              // 元のクエリ文字列
}

class SearchQueryParser {
  /**
   * 構造化クエリ文字列をコンポーネントに分解
   * 例:
   * - "status:Open type:issue" → フィルタ
   * - "バグ修正" → キーワード
   * - "status:Open バグ" → 混合
   */
  parse(query: string): ParsedQuery {
    const filters: ParsedQuery['filters'] = {};
    const keywords: string[] = [];
    
    // パターン: key:value形式を抽出
    const filterPattern = /(\w+):([^\s]+)/g;
    let remaining = query;
    let match;
    
    while ((match = filterPattern.exec(query)) !== null) {
      const [fullMatch, key, value] = match;
      
      switch(key) {
        case 'status':
          if (!filters.status) filters.status = [];
          filters.status.push(value);
          break;
        case 'type':
          if (!filters.type) filters.type = [];
          filters.type.push(value);
          break;
        case 'is':
          if (value === 'open' || value === 'closed') {
            filters.is = value;
          }
          break;
        case 'priority':
          if (!filters.priority) filters.priority = [];
          filters.priority.push(value.toUpperCase());
          break;
      }
      
      remaining = remaining.replace(fullMatch, '');
    }
    
    // 残りの文字列をキーワードとして扱う
    const remainingWords = remaining.trim().split(/\s+/).filter(w => w.length > 0);
    keywords.push(...remainingWords);
    
    return { keywords, filters, raw: query };
  }
}
```

### StatusRepositoryクラス（新規）
```typescript
class StatusRepository {
  private repository: Repository<Status>;
  
  constructor() {
    this.repository = AppDataSource.getRepository(Status);
  }
  
  /**
   * ステータス名で検索（大文字小文字を区別しない）
   */
  async findByName(name: string): Promise<Status | null> {
    return await this.repository
      .createQueryBuilder('status')
      .where('LOWER(status.name) = LOWER(:name)', { name })
      .getOne();
  }
  
  /**
   * is_closableフラグでステータスを取得
   */
  async findByClosable(isClosable: boolean): Promise<Status[]> {
    return await this.repository.find({
      where: { isClosable }
    });
  }
  
  /**
   * 全ステータスを取得
   */
  async findAll(): Promise<Status[]> {
    return await this.repository.find({
      order: { sortOrder: 'ASC' }
    });
  }
  
  /**
   * 既存データのis_closableフラグを修正
   */
  async fixClosableFlags(): Promise<void> {
    const closableNames = ['Completed', 'Closed', 'Canceled', 'Rejected'];
    const openNames = ['Open', 'Ready', 'In Progress', 'Review', 
                      'Specification', 'Waiting', 'Testing', 'Pending'];
    
    // クローズ可能なステータスを更新
    await this.repository
      .createQueryBuilder()
      .update(Status)
      .set({ isClosable: true })
      .where('name IN (:...names)', { names: closableNames })
      .execute();
    
    // オープンステータスを更新
    await this.repository
      .createQueryBuilder()
      .update(Status)
      .set({ isClosable: false })
      .where('name IN (:...names)', { names: openNames })
      .execute();
  }
}
```

### ItemRepositoryの拡張（修正）
```typescript
class ItemRepository {
  // 既存メソッドは変更なし
  
  /**
   * 構造化クエリ対応の拡張検索
   */
  async searchAdvanced(parsedQuery: ParsedQuery): Promise<Item[]> {
    const query = this.repository.createQueryBuilder('item')
      .leftJoinAndSelect('item.status', 'status');
    
    // ステータスフィルタ
    if (parsedQuery.filters.status?.length) {
      const statusRepo = new StatusRepository();
      const statusIds: number[] = [];
      
      for (const statusName of parsedQuery.filters.status) {
        const status = await statusRepo.findByName(statusName);
        if (status) statusIds.push(status.id);
      }
      
      if (statusIds.length > 0) {
        query.andWhere('item.statusId IN (:...statusIds)', { statusIds });
      }
    }
    
    // タイプフィルタ
    if (parsedQuery.filters.type?.length) {
      query.andWhere('item.type IN (:...types)', { types: parsedQuery.filters.type });
    }
    
    // is:open/closed フィルタ
    if (parsedQuery.filters.is) {
      const isClosable = parsedQuery.filters.is === 'closed';
      query.andWhere('status.isClosable = :isClosable', { isClosable });
    }
    
    // キーワード検索
    if (parsedQuery.keywords.length > 0) {
      const keywordConditions = parsedQuery.keywords.map((_, index) => 
        `(item.title LIKE :kw${index} OR item.description LIKE :kw${index} OR item.content LIKE :kw${index})`
      ).join(' AND ');
      
      const keywordParams: any = {};
      parsedQuery.keywords.forEach((kw, index) => {
        keywordParams[`kw${index}`] = `%${kw}%`;
      });
      
      query.andWhere(`(${keywordConditions})`, keywordParams);
    }
    
    return query.orderBy('item.updatedAt', 'DESC').getMany();
  }
  
  /**
   * 後方互換性のある検索
   */
  async search(query: string): Promise<Item[]> {
    const parser = new SearchQueryParser();
    const parsed = parser.parse(query);
    
    // フィルタが検出されない場合は旧動作を使用
    if (Object.keys(parsed.filters).length === 0 && parsed.keywords.length === 0) {
      return this.searchLegacy(query);
    }
    
    return this.searchAdvanced(parsed);
  }
  
  private async searchLegacy(query: string): Promise<Item[]> {
    // 現在の実装をそのまま使用
    return await this.repository
      .createQueryBuilder('item')
      .where('item.title LIKE :query', { query: `%${query}%` })
      .orWhere('item.description LIKE :query', { query: `%${query}%` })
      .orWhere('item.content LIKE :query', { query: `%${query}%` })
      .orderBy('item.updatedAt', 'DESC')
      .getMany();
  }
}
```

## 5. API設計

### search_itemsエンドポイント（インターフェース変更なし）
```typescript
// リクエスト（変更なし）
{
  query: string;
  types?: string[];
  limit?: number;
  offset?: number;
}

// レスポンス（変更なし）
[
  {
    id: number;
    type: string;
    title: string;
    description: string;
    statusId: number;
    priority: string;
    // ... その他のフィールド
  }
]
```

### クエリ構文のドキュメント
```
サポートされるクエリ形式:
- 単純なキーワード: "認証バグ"
- 単一フィルタ: "status:Open"
- 複数フィルタ: "type:issue status:Open"
- 混合: "status:Open 認証"
- 特殊フィルタ: "is:open" または "is:closed"

フィルタ構文:
- status:<名前> - ステータス名でフィルタ
- type:<タイプ> - アイテムタイプでフィルタ
- is:open - オープンステータスのアイテム（is_closable=false）
- is:closed - クローズドステータスのアイテム（is_closable=true）
- priority:<レベル> - 優先度でフィルタ（将来実装）
```

## 6. エラー処理

### エラー戦略
1. **無効なステータス名**: 空の結果を返す（エラーなし）
2. **不正なクエリ**: シンプル検索にフォールバック
3. **データベースエラー**: 説明的なエラーメッセージを返す
4. **パフォーマンスタイムアウト**: 警告付きで部分結果を返す

## 7. テスト方針

### テストケース
```typescript
describe('SearchQueryParser', () => {
  it('単純なキーワードを解析する');
  it('ステータスフィルタを解析する');
  it('複数フィルタを解析する');
  it('is:openフィルタを処理する');
  it('混合クエリを処理する');
  it('不正な入力を適切に処理する');
});

describe('StatusRepository', () => {
  it('ステータス名で検索できる（大文字小文字を区別しない）');
  it('is_closableフラグでフィルタリングできる');
  it('fixClosableFlagsが正しく更新する');
});

describe('ItemRepository.searchAdvanced', () => {
  it('ステータス名でフィルタリングする');
  it('is:open/closedフィルタが動作する');
  it('複数条件でフィルタリングする');
  it('後方互換性を維持する');
  it('2秒以内に処理を完了する');
});
```

## 8. 移行戦略

### アプローチ: 後方互換性を保った段階的実装

### ステップ
1. **フェーズ1**: StatusRepositoryとSearchQueryParserを追加
2. **フェーズ2**: 既存DBのis_closableフラグを修正するマイグレーション実行
3. **フェーズ3**: ItemRepositoryに新検索メソッドを追加  
4. **フェーズ4**: MCPサーバーで新検索を使用
5. **フェーズ5**: ドキュメントを更新

### データベースマイグレーション（新規作成）
```typescript
// src/migrations/UpdateStatusFlags[timestamp].ts
export class UpdateStatusFlags1234567890 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // 既存データのis_closableフラグを修正
    await queryRunner.query(`
      UPDATE statuses 
      SET is_closable = 1 
      WHERE name IN ('Completed', 'Closed', 'Canceled', 'Rejected')
    `);
    
    await queryRunner.query(`
      UPDATE statuses 
      SET is_closable = 0 
      WHERE name IN ('Open', 'Ready', 'In Progress', 'Review', 
                     'Specification', 'Waiting', 'Testing', 'Pending')
    `);
    
    console.log('✅ Fixed is_closable flags for existing statuses');
  }
  
  async down(queryRunner: QueryRunner): Promise<void> {
    // すべて0にリセット
    await queryRunner.query(`UPDATE statuses SET is_closable = 0`);
  }
}
```

### ロールバック計画
1. レガシー検索メソッドを保持
2. 新検索のフィーチャーフラグ（環境変数）
3. エラー率とパフォーマンスの監視
4. 設定変更による迅速な切り戻し

## 9. ドキュメント更新

### 更新対象ファイル
1. `.shirokuma/commands/shared/mcp-rules.markdown` - 検索構文と回避策を追加
2. `README.md` - 検索機能を文書化（v0.9.1で対応）
3. `docs/api-reference.md` - search_itemsのドキュメント更新

### 回避策のドキュメント（即座に追加）
```markdown
## 既知の制限事項と回避策

### Openなイシューの検索
**現在の制限**: search_itemsがステータスで正しくフィルタリングできない場合があります。

**回避策**: list_itemsを使用してください:
```yaml
# Openなイシューを取得
Tool: mcp__shirokuma-kb__list_items
Parameters:
  type: "issue"
  limit: 20

# その後、結果をフィルタリング
# statusId: 14 = Open (既知のID)
```

**今後**: v0.9.1で修正予定。
```

## 10. 成功基準

- [ ] search_itemsで"status:Open"が正しい結果を返す
- [ ] 後方互換性が維持されている
- [ ] パフォーマンスが2秒未満
- [ ] is_closableフラグが適切に設定されている
- [ ] すべてのテストが合格
- [ ] ドキュメントが更新されている

## 11. 次のステップ

1. この設計をレビューして承認
2. 回避策をmcp-rules.markdownに即座に追加
3. 実装タスクを作成（`/kuma:spec:tasks`）
4. 実装とテスト
5. v0.9.1でリリース

## 12. 変更履歴

### v1.3 (2025-08-24)
- seed-data.tsは新規作成ではなく、migrate.ts内に既存
- 既存のseedDatabase関数は正しいが、実DBには反映されていない問題を発見
- より詳細な実装コードを追加
- 即座の回避策を明確化

### v1.2 (2025-08-24)
- 新規ユーザー向けの初期化処理を追加

### v1.1 (2025-08-24)
- 設計書全体を日本語化

### v1.0 (2025-08-24)
- 初版作成