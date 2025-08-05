# 新タグ体系設計書

## 設計原則

1. **必須タグ制**: すべてのitemsは必ず1つのPrimary Categoryタグを持つ
2. **階層構造**: Primary → Secondary → Projectタグの3層構造
3. **検証可能**: 正規表現で機械的に検証可能
4. **重複防止**: 類似タグの統合と命名規則の統一

## タグ階層構造

### Level 1: Primary Category Tags（必須・1つ選択）

```yaml
#task:
  定義: やるべきこと・実行が必要なアイテム
  用途: バグ修正、機能追加、調査タスク
  必須フィールド: status, priority

#doc:
  定義: 構造化された文書・ガイド
  用途: 技術文書、API仕様、手順書
  必須フィールド: content

#knowledge:
  定義: 再利用可能な知見・学び
  用途: パターン、ベストプラクティス、教訓
  必須フィールド: content

#decision:
  定義: 技術的な決定事項と理由
  用途: アーキテクチャ決定、技術選択
  必須フィールド: content（理由を含む）

#handover:
  定義: エージェント間の引き継ぎ情報
  用途: 作業の引き継ぎ、一時的な伝達
  自動削除: 作成から24時間後

#test-result:
  定義: テスト実行結果
  用途: テストレポート、カバレッジ報告
  必須フィールド: content（結果データ）

#daily:
  定義: 日次集約情報
  用途: デイリーサマリー、日報
  制約: 1日1件まで
```

### Level 2: Secondary Tags（オプション・複数可）

```yaml
# taskのサブカテゴリ
#bug          - バグ修正
#feature      - 新機能
#enhancement  - 機能改善
#refactor     - リファクタリング
#investigation - 調査・分析

# docのサブカテゴリ
#api          - API仕様
#guide        - 使い方ガイド
#spec         - 技術仕様
#architecture - アーキテクチャ文書

# knowledgeのサブカテゴリ
#pattern      - デザインパターン
#lesson       - 学んだ教訓
#insight      - 洞察・発見
#best-practice - ベストプラクティス

# 横断的タグ
#security     - セキュリティ関連
#performance  - パフォーマンス関連
#urgent       - 緊急対応
#milestone    - マイルストーン
```

### Level 3: Project Tags（プロジェクト固有）

```yaml
# バージョンタグ
v0.7.9
v0.8.0

# イシュー参照
issues-93
issues-94

# 機能エリア
auth
payment
ui

# 技術スタック
typescript
react
mcp
```

## タグ検証ルール

### 1. Primary Categoryの検証
```javascript
const PRIMARY_TAGS = [
  '#task', '#doc', '#knowledge', 
  '#decision', '#handover', '#test-result', '#daily'
];

function validatePrimaryTag(tags) {
  const primaryTags = tags.filter(tag => PRIMARY_TAGS.includes(tag));
  if (primaryTags.length !== 1) {
    throw new Error('Exactly one primary tag required');
  }
  return true;
}
```

### 2. タグ形式の検証
```javascript
const TAG_PATTERN = /^#?[a-z0-9]+(-[a-z0-9]+)*$/;
const VERSION_PATTERN = /^v\d+\.\d+\.\d+$/;
const ISSUE_PATTERN = /^issues-\d+$/;

function validateTagFormat(tag) {
  return TAG_PATTERN.test(tag) || 
         VERSION_PATTERN.test(tag) || 
         ISSUE_PATTERN.test(tag);
}
```

### 3. タグ組み合わせの検証
```javascript
// 矛盾するタグの組み合わせを防ぐ
const EXCLUSIVE_PAIRS = [
  ['#task', '#doc'],  // taskとdocは同時に付けない
  ['#bug', '#feature'], // bugとfeatureは排他的
];

function validateTagCombination(tags) {
  for (const [tag1, tag2] of EXCLUSIVE_PAIRS) {
    if (tags.includes(tag1) && tags.includes(tag2)) {
      throw new Error(`${tag1} and ${tag2} cannot be used together`);
    }
  }
}
```

## 既存タグの移行マッピング

### 統合されるタグ
```yaml
# 類似タグの統合
test-results → #test-result
test_results → #test-result
testing → #test-result

code-review → #review
review-session → #review

# 削除されるタグ（Primary Categoryで代替）
issues → （#task で代替）
plans → （#task + #milestone）
decisions → （#decision で代替）
```

### タグクリーンアップ計画
```yaml
現在: 250+ タグ
目標: 50以下の管理されたタグ

削減方法:
1. Primary Category化（-7タグ）
2. 類似タグ統合（-50タグ）
3. 未使用タグ削除（-100タグ）
4. プロジェクト固有タグの整理（-50タグ）
```

## エージェント別タグ使用ガイド

### shirokuma-programmer
```yaml
作成可能:
  primary: #task, #knowledge, #handover
  secondary: #bug, #feature, #refactor, #pattern
  
禁止:
  primary: #test-result, #decision
```

### shirokuma-tester
```yaml
作成可能:
  primary: #test-result, #knowledge, #handover
  secondary: #bug, #performance, #security
  
禁止:
  primary: #decision, #doc
```

### shirokuma-designer
```yaml
作成可能:
  primary: #decision, #doc, #knowledge
  secondary: #architecture, #spec, #pattern
  
禁止:
  primary: #test-result
```

## タグベース検索の例

### ユースケース別クエリ
```javascript
// 未完了のバグを検索
get_items({ 
  type: 'items', 
  tags: ['#task', '#bug'], 
  status: 'Open' 
})

// セキュリティ関連の知識を検索
get_items({ 
  type: 'items', 
  tags: ['#knowledge', '#security'] 
})

// 特定バージョンのテスト結果
get_items({ 
  type: 'items', 
  tags: ['#test-result', 'v0.7.9'] 
})

// 今日の引き継ぎ事項
get_items({ 
  type: 'items', 
  tags: ['#handover'],
  start_date: today()
})
```

## タグ管理のベストプラクティス

### 1. タグ作成前の確認
```javascript
// 新しいタグを作成する前に既存タグを検索
const existingTags = await search_tags(pattern);
if (existingTags.length > 0) {
  // 既存タグを使用
} else {
  // 新規作成の妥当性を検証
}
```

### 2. 定期的なタグ監査
- 月次でタグ使用状況をレビュー
- 未使用タグの削除
- 類似タグの統合
- 新規タグの承認プロセス

### 3. タグ命名規則
- 小文字のみ使用
- 単語はハイフンで区切る
- 単数形を使用（bugs → bug）
- 明確で検索しやすい名前

## 移行後のタグ運用

### Phase 1: 初期移行（Week 1）
- Primary Categoryタグの自動付与
- 既存タグのクリーンアップ

### Phase 2: 最適化（Week 2-4）
- 使用頻度の分析
- タグ体系の微調整
- エージェントルールの更新

### Phase 3: 安定運用（Month 2+）
- 月次タグ監査の実施
- 新規タグの承認制
- タグ使用ガイドラインの更新

## 成功指標

1. **タグ数削減**: 250+ → 50以下
2. **Primary Tag準拠率**: 100%
3. **検索精度向上**: 関連アイテムの発見率90%以上
4. **エージェント準拠率**: タグルール違反0件