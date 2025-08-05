# MCP Type System 変更の影響分析

## 影響を受けるコンポーネント一覧

### 1. データベース層

#### sequences テーブル
```sql
-- 現在
CREATE TABLE sequences (
  type TEXT PRIMARY KEY,
  current_value INTEGER DEFAULT 0,
  base_type TEXT,
  description TEXT
);

-- 移行後
-- items と sessions のみ残す
DELETE FROM sequences WHERE type NOT IN ('items', 'sessions');
```

#### Markdownファイル構造
```
現在: .database/{type}/{id}.md
移行後: .database/items/{id}.md
       .database/sessions/{id}.md
```

### 2. ハンドラー層

#### TypeHandlers
- `getTypes()`: items, sessions のみ返す
- `createType()`: 新規作成を制限
- `validateType()`: 2タイプのみ許可

#### ItemHandlers  
- `createItem()`: タイプ検証ロジックの変更
- `getItems()`: タグベース検索の強化
- `searchItems()`: 全文検索でタグも考慮

### 3. コマンド層

#### /ai-start
```typescript
// 現在
create_item({ type: 'sessions', ... })
get_current_state()

// 変更なし（sessionsは維持）
```

#### /ai-remember
```typescript
// 現在
type = userInput || 'knowledge'

// 移行後
type = 'items'
tags = determineTagsFromContent(content)
```

#### /ai-finish
```typescript
// 現在
create_item({ type: 'dailies', ... })

// 移行後
create_item({ type: 'items', tags: ['#daily'], ... })
// または
create_item({ type: 'sessions', id: date, ... })
```

### 4. エージェント層

#### 作成権限の変更
```yaml
現在の権限マトリックス:
  programmer: sessions, knowledge
  tester: test_results, knowledge
  reviewer: knowledge
  designer: decisions, docs
  researcher: knowledge, docs

移行後の権限マトリックス:
  全エージェント: items（タグで制御）
  メインのみ: sessions
```

#### プロンプト更新が必要なファイル
- `.claude/agents/shirokuma-programmer.md`
- `.claude/agents/shirokuma-tester.md`
- `.claude/agents/shirokuma-reviewer.md`
- `.claude/agents/shirokuma-designer.md`
- `.claude/agents/shirokuma-researcher.md`
- `.claude/agents/shirokuma-issue-manager.md`
- `.claude/agents/shirokuma-knowledge-curator.md`
- `.claude/agents/shirokuma-mcp-specialist.md`
- `.claude/agents/shirokuma-session-automator.md`
- `.claude/agents/shirokuma-daily-reporter.md`
- `.claude/agents/shirokuma-methodology-keeper.md`
- `.claude/agents/shirokuma-system-harmonizer.md`

### 5. ドキュメント層

#### 更新が必要な主要ドキュメント
1. **CLAUDE.md**
   - MCPタイプ使用ルール
   - クイックリファレンス

2. **SHIROKUMA.md**
   - MCPオペレーション説明
   - ワークフロー例

3. **docs-14: MCP Type System**
   - 完全に書き直し必要
   - 新2タイプ体系の説明

4. **docs-15: Tag Taxonomy**
   - Primary Categoryの必須化
   - タグ階層の再定義

5. **docs-16: Sub-agent Rules**
   - タイプ権限からタグ権限へ
   - 新ルールの策定

### 6. 検索とクエリ

#### 現在の検索パターン
```typescript
// タイプ指定検索
get_items({ type: 'issues', status: 'Open' })

// 移行後
get_items({ type: 'items', tags: ['#task'], status: 'Open' })
```

#### 影響を受けるクエリ
- dailiesの日付検索 → itemsのタグ+日付検索
- decisionsの一覧 → itemsの#decisionタグ検索
- test_resultsの状態確認 → itemsの#test-resultタグ検索

### 7. 既存ワークフロー

#### Issue管理フロー
```yaml
現在:
  1. create_item({ type: 'issues', ... })
  2. update_item({ type: 'issues', id: X, status: 'In Progress' })
  3. close issue

移行後:
  1. create_item({ type: 'items', tags: ['#task', '#issue'], ... })
  2. update_item({ type: 'items', id: X, status: 'In Progress' })
  3. close item
```

#### 知識管理フロー
```yaml
現在:
  - knowledge: 一般的な知見
  - decisions: 技術決定
  - docs: 技術文書

移行後:
  - items + #knowledge
  - items + #decision  
  - items + #doc
```

## リスク評価

### 高リスク項目
1. **データ移行エラー**
   - 影響: データ損失
   - 対策: 完全バックアップ、段階的移行

2. **エージェント混乱**
   - 影響: 誤ったタイプ使用
   - 対策: 明確なルール、検証強化

3. **検索パフォーマンス低下**
   - 影響: レスポンス遅延
   - 対策: インデックス最適化

### 中リスク項目
1. **ユーザー学習コスト**
   - 影響: 一時的な生産性低下
   - 対策: 詳細なガイド作成

2. **既存スクリプトの破損**
   - 影響: 自動化ツールの停止
   - 対策: 互換性レイヤー提供

## 移行スケジュール案

### Week 1: 準備フェーズ
- Day 1-2: 詳細設計とレビュー
- Day 3-4: バックアップとテスト環境構築
- Day 5: 移行スクリプト作成

### Week 2: 実装フェーズ
- Day 1-2: ハンドラー層の更新
- Day 3-4: エージェントプロンプト更新
- Day 5: 統合テスト

### Week 3: 移行フェーズ
- Day 1: 最終確認とバックアップ
- Day 2: 本番移行実施
- Day 3-5: 監視と調整

## 成功の測定指標

1. **データ整合性**: 100%のデータが正しく移行
2. **エージェント成功率**: 95%以上のタスクが正常完了
3. **検索速度**: 現行比±10%以内
4. **ユーザー満足度**: 移行後1週間でのフィードバック

## 次のステップ

1. ステークホルダーへの影響説明
2. 移行計画のレビューと承認
3. テスト環境の準備
4. 詳細な移行手順書の作成