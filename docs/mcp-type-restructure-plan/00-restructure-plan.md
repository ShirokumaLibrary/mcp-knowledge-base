# MCP Type System Restructure Plan

## 概要

現在の複雑な9タイプ構成から、シンプルな2タイプ構成への移行計画。

## 現状

### 現在のタイプ構成（9タイプ）
```yaml
tasks系:
  - issues: バグ・機能要求・タスク
  - plans: プロジェクト計画・ロードマップ

documents系:
  - docs: 技術文書・API仕様・ガイド
  - knowledge: 再利用可能な知見・パターン・教訓
  - decisions: アーキテクチャ決定・技術選択
  - features: カスタムドキュメントタイプ
  - state: カスタムドキュメントタイプ

sessions系:
  - sessions: 作業セッション記録（特殊ID: YYYY-MM-DD-HH.MM.SS.sss）
  - dailies: 日次サマリー（特殊ID: YYYY-MM-DD）
```

### 問題点
1. タイプとタグの使い分けが不明確
2. サブエージェントが勝手にタイプを誤用
3. 250個以上のタグが無秩序に作成
4. どのタイプに保存すべきか迷う

## 新構成案

### シンプル2タイプ構成
```yaml
items:    # すべての通常アイテム（統一フィールド）
sessions: # 時系列の特別管理（特殊ID）
```

### itemsタイプの統一フィールド
```yaml
必須:
  - title: タイトル
  - type: "items"（固定）

オプション:
  - content: 本文（Markdown）
  - status: Open/In Progress/Closed
  - priority: high/medium/low
  - tags: 分類用タグ（必須カテゴリ＋追加タグ）
  - related: 関連アイテムID
  - version: バージョン情報
```

### タグによる分類体系
```yaml
Primary Categories（必須タグ - 1つ選択）:
  #task     - やるべきこと
  #doc      - 文書・ガイド
  #knowledge - 再利用可能な知見
  #decision - 技術決定
  #handover - 引き継ぎ情報
  #test-result - テスト結果

Secondary Tags（追加タグ）:
  #bug, #feature, #plan      # taskの細分類
  #spec, #guide, #api        # docの細分類
  #lesson, #insight, #pattern # knowledgeの細分類
  その他プロジェクト固有タグ
```

## 移行計画

### Phase 1: 準備（1週間）
1. 移行スクリプトの作成
2. 既存データのバックアップ
3. タグマッピング表の作成
4. テスト環境での検証

### Phase 2: データ移行（3日間）
1. 新タイプ構造の作成
2. 既存データの変換
   - issues → items + #task
   - plans → items + #task #plan
   - docs → items + #doc
   - knowledge → items + #knowledge
   - decisions → items + #decision
   - features/state → items + 適切なタグ
3. データ整合性チェック

### Phase 3: システム更新（1週間）
1. MCPハンドラーの更新
2. エージェントプロンプトの更新
3. コマンドの更新
4. ドキュメントの更新

### Phase 4: 移行実施（1日）
1. メンテナンスモード
2. 本番データ移行
3. 動作確認
4. 切り替え

## 影響範囲

### 更新が必要なコンポーネント
1. **データベース構造**
   - sequences テーブル
   - タイプ定義

2. **ハンドラー**
   - TypeHandlers
   - ItemHandlers
   - 検索ロジック

3. **エージェント**
   - すべてのサブエージェントのプロンプト
   - タイプ使用ルール

4. **コマンド**
   - /ai-start, /ai-finish
   - /ai-remember
   - その他MCPを使用するコマンド

5. **ドキュメント**
   - CLAUDE.md
   - SHIROKUMA.md
   - docs-14,15,16（タイプ・タグルール）

## リスクと対策

### リスク
1. 既存データの破損
2. エージェントの混乱
3. 検索パフォーマンスの低下

### 対策
1. 完全バックアップとロールバック計画
2. 段階的移行（テスト環境→本番）
3. インデックスの最適化

## 成功指標

1. すべてのデータが正しく移行される
2. エージェントが新構成で正しく動作
3. 検索性能が維持される
4. タグの無秩序な増加が止まる

## タイムライン

- Week 1: 準備とテスト
- Week 2: システム更新
- Week 3: 本番移行と安定化

## 次のステップ

1. この計画のレビューと承認
2. 保存すべき既存ドキュメントのリスト作成
3. 移行スクリプトの設計
4. テスト計画の策定