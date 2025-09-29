---
id: 166
type: spec_design
title: "Design: list_items APIステータスフィルタリング修正"
status: Specification
priority: CRITICAL
description: "list_items APIでステータス名によるフィルタリングが正しく動作しない問題の設計仕様"
aiSummary: "Technical design specification for fixing a database API filtering bug in the list_items endpoint, focusing on status name filtering issues and their resolution through SQL JOIN operations"
tags: ["api","v0.9.0","design","list_items","spec","bugfix"]
related: [158,160,165,167]
keywords: {"api":1,"status":1,"items":0.9,"list":0.9,"filtering":0.9}
concepts: {"database":0.9,"api":0.9,"software_engineering":0.8,"system_design":0.8,"bug_fixing":0.8}
embedding: "ioCJjoCGiICMgJaTgICQgJSAgYWAgZCAg4CYj4CAioCVgIGAgImFgICAk4aAgJ+AjYCJgoCSgICGgIeAgICtgJOAgoqAk4SAgYCAgoCAp4CKgIyQgIuOgIiAg4uAgJKAgYCTj4CCloCRgI+TgICCgIGAkYiAgJOAk4CYjoCAhYA="
createdAt: 2025-08-29T07:33:27.000Z
updatedAt: 2025-08-29T07:33:27.000Z
---

# 設計仕様書: list_items APIステータスフィルタリング修正

## メタデータ
- **バージョン**: 1.0.0
- **日付**: 2025-08-28
- **フェーズ**: 設計
- **ステータス**: 仕様策定中
- **イシュー**: #165
- **優先度**: CRITICAL

## 設計概要

### 目標
1. list_items APIでステータス名による正しいフィルタリングを実現
2. searchAdvanced APIと一貫性のある動作を確保
3. 後方互換性の維持
4. 包括的なテストカバレッジの追加

### 主要な決定事項
- **アプローチ**: ItemRepository.findAllをstatusテーブルとの適切なJOINを使用するよう修正
- **一貫性**: 既存のsearchAdvanced実装パターンに合わせる
- **テスト**: リグレッション防止のためのユニットテスト追加

## システムアーキテクチャ

### 現在の問題
`ItemRepository.findAll()`メソッドが`item.status`リレーションオブジェクトを文字列値と比較しようとしており、SQLエラーが発生して空の結果が返される。

```typescript
// 現在の（壊れている）実装
if (options?.status) {
  query.andWhere('item.status = :status', { status: options.status });
}
```

### 根本原因分析
1. **エンティティ構造**: Itemエンティティは`statusId`（数値）と`status`（リレーション）を持つ
2. **フィルタ入力**: APIはステータス名を文字列として受け取る
3. **不一致**: リレーションオブジェクトと文字列の直接比較が失敗
4. **JOIN不足**: クエリに必要なstatusテーブルとのJOINが含まれていない

## データアーキテクチャ

### エンティティリレーション
```
itemsテーブル
├── id (主キー)
├── status_id (外部キー) → statuses.id
└── ... その他のフィールド

statusesテーブル
├── id (主キー)
├── name (ユニーク)
├── is_closable
└── sort_order
```

### クエリフロー
1. APIが受信: `{ status: "Open" }`
2. リポジトリが実行すべき処理:
   - itemsテーブルとstatusesテーブルをJOIN
   - status.name = "Open"でフィルタ
   - 一致するアイテムを返す

## ソリューション設計

### オプション1: 直接JOINアプローチ（推奨）
```typescript
async findAll(options?: {
  type?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<Item[]> {
  const query = this.repository.createQueryBuilder('item');
  
  // ステータスフィルタが必要な場合にJOINを追加
  if (options?.status) {
    query.leftJoinAndSelect('item.status', 'status')
         .andWhere('LOWER(status.name) = LOWER(:statusName)', { 
           statusName: options.status 
         });
  }
  
  // クエリの残り部分は変更なし
  if (options?.type) {
    query.andWhere('item.type = :type', { type: options.type });
  }
  
  // ... limit, offset, orderBy
  
  return await query.getMany();
}
```

### オプション2: ステータス検索アプローチ（代替案）
```typescript
async findAll(options?: {...}): Promise<Item[]> {
  const query = this.repository.createQueryBuilder('item');
  
  if (options?.status) {
    const statusRepo = new StatusRepository();
    const status = await statusRepo.findByName(options.status);
    
    if (status) {
      query.andWhere('item.statusId = :statusId', { 
        statusId: status.id 
      });
    } else {
      return []; // 一致するステータス名なし
    }
  }
  
  // ... 残りの実装
}
```

### 決定根拠
**推奨: オプション1（直接JOIN）**
- 長所:
  - 単一のデータベースクエリ（パフォーマンス向上）
  - searchAdvancedパターンとの一貫性
  - よりシンプルなエラーハンドリング
  - 必要に応じてstatusリレーションデータを返す
- 短所:
  - わずかに複雑なSQL

**代替案: オプション2（ステータス検索）**
- 長所:
  - よりシンプルなクエリ構築
  - 明示的なステータス検証
- 短所:
  - 2つのデータベースクエリが必要
  - 追加のエラーハンドリングが必要
  - 既存パターンとの非一貫性

## API設計

### API変更は不要
外部APIインターフェースは変更なし:
```typescript
// MCP API呼び出し
mcp__shirokuma-kb__list_items({
  type: "issue",
  status: "Open",  // 文字列のステータス名
  limit: 20
})
```

### 内部変更のみ
- 修正はItemRepository内で完結
- MCPハンドラやAPIスキーマの変更なし
- 後方互換性維持

## エラーハンドリング

### シナリオ1: 無効なステータス名
- **現在**: 空配列を返す（有効なアイテムに対して不正確）
- **修正後**: 空配列を返す（正しい - そのステータスのアイテムなし）

### シナリオ2: 大文字小文字の区別
- **現在**: 大文字小文字を区別する比較が失敗
- **修正後**: LOWER()を使用した大文字小文字を区別しない比較

### シナリオ3: null/空のステータス
- **現在**: フィルタを正しくスキップ
- **修正後**: 同じ動作を維持

## テストアプローチ

### ユニットテスト
```typescript
describe('ItemRepository.findAll', () => {
  it('ステータス名で正しくフィルタリングすること', async () => {
    // 異なるステータスのアイテムを作成
    const openItem = await createItem({ statusId: 1 }); // Open
    const closedItem = await createItem({ statusId: 10 }); // Closed
    
    // ステータスフィルタをテスト
    const results = await repo.findAll({ status: 'Open' });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(openItem.id);
  });
  
  it('大文字小文字を区別しないステータス名を処理すること', async () => {
    const results = await repo.findAll({ status: 'open' });
    expect(results).toHaveLength(1);
  });
  
  it('存在しないステータスに対して空を返すこと', async () => {
    const results = await repo.findAll({ status: 'NonExistent' });
    expect(results).toHaveLength(0);
  });
});
```

### 統合テスト
1. 実際のデータベースとマイグレーションでテスト
2. issue-158の特定ケースを検証
3. すべてのステータス値でテスト
4. 組み合わせフィルタ（type + status）を検証

### リグレッション防止
- issue-158専用のテストケースを追加
- すべての既存ステータス名をテスト
- `/kuma:issue`コマンドの機能を検証

## セキュリティ考慮事項

### SQLインジェクション防止
- パラメータ化クエリを使用（既に実装済み）
- 生のSQL連結なし
- TypeORMがエスケープを処理

### アクセス制御
- 既存の権限に変更なし
- ステータスフィルタリングはセキュリティをバイパスしない

## パフォーマンス目標

### クエリパフォーマンス
- 単一JOINクエリ: 典型的なデータセットで約5-10ms
- status_idのインデックスは既に存在
- 追加のインデックスは不要

### スケーラビリティ
- JOINは結果セットに対して線形にスケール
- N+1クエリ問題なし
- 10,000アイテムまで効率的

## マイグレーション戦略

### データベースマイグレーション不要
- コードのみの修正
- 既存のスキーマを使用
- データ変更は不要

### デプロイメント手順
1. コード修正をデプロイ
2. テストを実行して検証
3. issue-158の特定ケースをテスト
4. 問題をモニタリング

### ロールバック計画
- 必要に応じてシンプルなコードリバート
- データベース変更のアンドゥなし
- 低リスクのデプロイメント

## 未解決の質問

1. **ステータス検索をキャッシュすべきか？**
   - ステータステーブルは小さくめったに変更されない
   - パフォーマンスをわずかに改善できる可能性
   - 決定: 初期修正では不要

2. **デフォルト結果にstatusリレーションを含めるか？**
   - 追加クエリなしでステータス名を提供
   - レスポンスサイズがわずかに増加
   - 決定: ステータスでフィルタリング時のみ含める

3. **文字列ステータスフィルタを非推奨にするか？**
   - statusIdを直接使用可能
   - APIの破壊的変更
   - 決定: 後方互換性のため維持

## 実装優先順位

1. **即座**: ItemRepository.findAllメソッドの修正
2. **次**: 包括的なテストの追加
3. **後**: パフォーマンス最適化の検討
4. **将来**: v1.0のAPI改善の評価

## 関連仕様
- イシュー #160: search_items修正（完了）
- イシュー #158: ドキュメント更新が必要
- v0.9.0リリース計画