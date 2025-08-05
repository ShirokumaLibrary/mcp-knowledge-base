# 保存すべきMCPドキュメント一覧

## 重要度：最高（移行前に必ず保存）

### システムルール系
1. **docs-14: MCP Type System - Definitive Guide**
   - 現在のタイプ定義の完全版
   - 移行前の仕様として保存必須

2. **docs-15: Tag Taxonomy - Simple Hierarchical System**
   - 現在のタグ体系
   - 新タグ体系の参考資料

3. **docs-16: Sub-agent MCP Rules - Mandatory Compliance Guide**
   - エージェントの権限ルール
   - 新システムでも参考になる

4. **docs-17: MCP Validation System Implementation**
   - 検証システムのコード
   - 新システムでも流用可能

### プロジェクト管理系
5. **docs-1: プロジェクト管理ガイドライン**
   - SHIROKUMA全体の方針
   - タイプに依存しない内容

6. **docs-2: 技術仕様書 - アーキテクチャとコマンド**
   - システム全体の仕様
   - 更新が必要だが基本は保持

### インスタンス管理
7. **docs-3: MCP サーバーインスタンスガイド**
   - 本番/テストの使い分け
   - 移行後も重要

## 重要度：高（アーカイブ推奨）

### 設計・決定事項
8. **decisions-24: Design: Date Range Filtering and Session Management**
   - sessionsタイプの重要な設計
   - 移行後も参照価値あり

9. **decisions-22: ProgrammerとTesterの並行実行アーキテクチャ**
   - エージェント設計の重要事例

10. **decisions-20: サブエージェントシステム包括的テスト計画**
    - テストフレームワークの設計

### ナレッジ系
11. **knowledge-56: SHIROKUMA設定ファイル統合完了報告**
    - 設定システムの現状記録

12. **knowledge-48: コードレビュー: サブエージェントシステムテストフレームワーク**
    - 品質基準の参考

## 移行時の変換対象

### タイプ別の移行先
```yaml
現在のタイプ → 新構成での扱い:

docs-* → items + #doc + 適切なサブタグ
decisions-* → items + #decision
knowledge-* → items + #knowledge
issues-* → items + #task
plans-* → items + #task #plan

sessions → sessions（そのまま維持）
dailies → sessions（統合を検討）
```

### 特別な考慮事項

1. **current_state**
   - 特殊な使い方をしているため個別検討
   - itemsではなくsessionsに統合する可能性

2. **test_results（未実装）**
   - 新システムでは items + #test-result として実装

3. **handovers（提案中）**
   - 新システムでは items + #handover として実装

## バックアップ計画

### 完全バックアップ
```bash
# 全データのエクスポート
1. データベース全体のダンプ
2. Markdownファイルのアーカイブ
3. 関連設定ファイルの保存
```

### 選択的保存
```bash
# 重要ドキュメントのみ
1. docs/* の全内容をMarkdownで保存
2. 重要なdecisions/* を選別して保存
3. 再利用可能なknowledge/* を保存
```

## 次のアクション

1. 上記リストの各ドキュメントを確認
2. 移行後も必要な内容を抽出
3. 新フォーマットへの変換ルール策定
4. アーカイブ用ディレクトリ構造の設計