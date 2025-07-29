# 優先度「高」改善項目 実施計画

## 概要
レビューで特定された優先度「高」の改善項目について、具体的な実施計画を策定します。

## 実施スケジュール

### Week 1（2025-07-29 〜 2025-08-04）

#### Day 1-2: ESLintエラー自動修正（Phase 1）
**目標**: 自動修正可能なESLintエラー107件を解消

```bash
# 実施手順
1. 現在の状態をバックアップ
   git add -A && git commit -m "chore: backup before ESLint auto-fix"

2. 自動修正実行
   npm run lint:fix

3. 修正結果の確認
   npm run lint > lint-results-after-fix.txt
   
4. テスト実行して動作確認
   npm run test:all

5. コミット
   git add -A && git commit -m "fix: auto-fix ESLint errors (107 issues resolved)"
```

#### Day 3-4: 手動ESLintエラー修正（Phase 2）
**目標**: 残り57件のESLintエラーを手動修正

**優先順位**:
1. **未使用変数・インポート（20件）**
   - `src/database/base.ts`: err変数（line 193）
   - `src/database/fulltext-search-repository.ts`: UnifiedItem（line 8）
   - `src/utils/markdown-parser.ts`: inFrontMatter（line 59）
   - `src/utils/transform-utils.ts`: Status, Tag, Daily, content
   - その他ファイル

2. **引用符の統一（15件）**
   - ダブルクォートをシングルクォートに統一
   - 主に`src/database/base.ts`

3. **文字クラスエラー（1件）**
   - `src/utils/string-utils.ts`: line 41の正規表現修正

4. **その他のフォーマットエラー（21件）**
   - 主にカンマ、セミコロンの問題

#### Day 5: any型優先度評価
**目標**: 341箇所のany型使用を分類し、修正優先度を決定

**分類基準**:
1. **Critical（即時修正）**: ビジネスロジックコア
   - handler-factory.ts（IDatabase移行関連）
   - base-repository.ts
   - database/index.ts

2. **High（1週間以内）**: データ処理・変換
   - transform-utils.ts
   - validation-utils.ts
   - repository層の主要メソッド

3. **Medium（2週間以内）**: ユーティリティ関数
   - logger.ts
   - error handling関連

4. **Low（1ヶ月以内）**: テストコード、モック
   - test-utils/
   - __tests__/

### Week 2（2025-08-05 〜 2025-08-11）

#### Day 6-8: Critical any型修正
**目標**: 最重要箇所のany型を具体的な型に置換（約30箇所）

**実装例**:
```typescript
// Before
constructor: new (database: any) => any;

// After
constructor: new (database: IDatabase) => IHandler;
```

**対象ファイル**:
1. `src/factories/handler-factory.ts`
   - constructor型定義
   - getHandler戻り値型
   - getAllHandlers戻り値型

2. `src/database/base-repository.ts`
   - ジェネリック型パラメータの追加
   - findByIdの戻り値型

3. `src/database/index.ts`
   - IDatabase interfaceの完全実装

#### Day 9-10: テストカバレッジ向上計画
**目標**: 現状50%から70%への改善計画策定

**重点領域**:
1. **リポジトリ層（優先度1）**
   - item-repository.ts: 新規テスト10件
   - base-repository.ts: 新規テスト8件
   - search-repository.ts: 新規テスト5件

2. **ハンドラー層（優先度2）**
   - unified-handlers.ts: 新規テスト15件
   - type-handlers.ts: 新規テスト8件
   - session-handlers.ts: 新規テスト5件

3. **ユーティリティ（優先度3）**
   - transform-utils.ts: 新規テスト5件
   - validation-utils.ts: 新規テスト5件

### Week 3（2025-08-12 〜 2025-08-18）

#### Day 11-13: リポジトリ層テスト実装
**目標**: リポジトリ層のテストカバレッジを80%以上に

**テストケース例**:
```typescript
describe('ItemRepository', () => {
  describe('create', () => {
    it('should create item with all required fields');
    it('should auto-increment ID correctly');
    it('should handle concurrent creates');
    it('should validate input data');
    it('should sync to SQLite after creation');
  });
  
  describe('update', () => {
    it('should update existing item');
    it('should preserve unchanged fields');
    it('should update timestamps');
    it('should handle non-existent items');
  });
});
```

#### Day 14-15: ハンドラー層テスト実装
**目標**: ハンドラー層のテストカバレッジを75%以上に

### Week 4（2025-08-19 〜 2025-08-25）

#### Day 16-18: High priority any型修正
**目標**: 優先度Highのany型を修正（約50箇所）

#### Day 19-20: 統合・検証
**目標**: 全修正の統合確認とパフォーマンス検証

## 成功指標

### ESLint
- [ ] エラー: 0件（現在164件）
- [ ] 警告: 100件以下（現在319件）

### TypeScript
- [ ] any型使用: 200箇所以下（現在341箇所）
- [ ] Critical/Highレベルのany型: 0件

### テスト
- [ ] 全体カバレッジ: 70%以上（現在50.47%）
- [ ] リポジトリ層: 80%以上
- [ ] ハンドラー層: 75%以上

## リスクと対策

### リスク1: 自動修正による予期しない動作変更
**対策**: 
- 段階的な修正とテスト実行
- git commitによる細かいチェックポイント作成

### リスク2: any型修正による型エラーの連鎖
**対策**:
- 影響範囲の事前調査
- 段階的な移行（@ts-ignoreの一時的使用も検討）

### リスク3: テスト追加による開発速度の低下
**対策**:
- 最も重要な機能から優先的にテスト追加
- テストヘルパー関数の作成で効率化

## 日次進捗管理

毎日の終わりに以下を記録:
1. 完了したタスク
2. 発見した問題
3. 翌日の計画調整

```markdown
## YYYY-MM-DD 進捗
- 完了: [タスク名] (X件修正/実装)
- 課題: [発見した問題]
- 明日: [調整後の計画]
```