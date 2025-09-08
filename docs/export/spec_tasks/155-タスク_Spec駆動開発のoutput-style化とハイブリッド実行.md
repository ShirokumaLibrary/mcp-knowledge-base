---
id: 155
type: spec_tasks
title: "タスク: Spec駆動開発のoutput-style化とハイブリッド実行"
status: Ready
priority: HIGH
description: "Issue #152の実装タスク分解（設計ID: 154に基づく）"
aiSummary: "Comprehensive task breakdown for implementing specification-driven development with output-style integration and hybrid execution capabilities, including natural language command refactoring, system harmonization, and testing phases."
tags: ["implementation","spec","tasks","output-style","issue-152","natural-language"]
related: [152,153,154]
keywords: {"spec":1,"implementation":0.9,"development":0.9,"task":0.9,"command":0.8}
concepts: {"software development":0.9,"project management":0.8,"documentation":0.8,"testing":0.8,"workflow":0.8}
embedding: "gJKXgJGOgICFgICZj4CAjICNk4CIl4CAj4CAkJSAgJyAhIiAgKCAgJSAgISQgICigIqQgIKggICQgICMhoCAmYCChYCLj4CAhoCAgoCAgImAgICAk5eAgICAgIGEgICIgIaFgJOegICEgICLgICAgYCOkICKn4CAgICAloWAgII="
createdAt: 2025-08-23T13:26:44.000Z
updatedAt: 2025-08-23T13:26:56.000Z
---

# Tasks: Spec駆動開発のoutput-style化とハイブリッド実行

## Metadata
- **Version**: 1.0
- **Created**: 2025-08-23T13:30:00Z
- **Status**: Ready
- **Phase**: Tasks
- **Design Spec**: #154
- **Requirements Spec**: #153
- **Issue**: #152

## Overview

### Implementation Strategy
自然言語指示書アプローチによる段階的移行。既存のプログラム的記述を自然言語に変換し、output-styleとコマンドのハイブリッド動作を実現。

### Testing Approach
Manual validation testing (Markdownコマンドは直接的なコードテストではなく、使用時の動作確認で検証)

### Deployment Strategy
段階的移行による低リスク展開。各フェーズごとに動作確認を実施。

## Task Breakdown

### Phase 1: Foundation Setup [8h]

#### Task 1.1: Create spec-logic.md [2h]

**Description**: Spec作成の共通ロジックファイルを作成

**Subtasks**:
- [ ] `.shirokuma/commands/shared/spec-logic.md`の新規作成
- [ ] EARS形式の参照と説明を追加
- [ ] フェーズ間の整合性ガイドラインを記述
- [ ] 品質チェックポイントのリストを追加

**Requirements**: REQ-3, REQ-6
**Dependencies**: None
**Acceptance Criteria**:
- [ ] 各フェーズで参照可能な共通ガイドライン
- [ ] 自然言語による明確な指示
- [ ] テンプレートと例の提供

#### Task 1.2: Create kuma-spec output-style [3h]

**Description**: output-styleモードの中核となるファイルを作成

**Subtasks**:
- [ ] `.claude/output-styles/kuma-spec.md`の新規作成
- [ ] フェーズ管理の自然言語記述
- [ ] 各フェーズコマンドへの`@`参照追加
- [ ] ユーザーへの提示方法の定義

**Requirements**: REQ-1, REQ-2
**Dependencies**: Task 1.1
**Acceptance Criteria**:
- [ ] 要件→設計→タスクの流れが明確
- [ ] 各フェーズの説明が自然言語
- [ ] コマンドとの連携方法が記載

#### Task 1.3: Create /kuma:update command [3h]

**Description**: ユーザー編集文書の取り込みコマンドを作成

**Subtasks**:
- [ ] `.shirokuma/commands/kuma/update.md`の新規作成
- [ ] ファイル読み込みと解析の指示
- [ ] AI enrichmentプロセスの記述
- [ ] MCPへの更新処理の説明

**Requirements**: REQ-7, REQ-8
**Dependencies**: Task 1.1
**Acceptance Criteria**:
- [ ] titleとcontentの抽出方法が明確
- [ ] 妥当性確認のプロセスが定義
- [ ] 結果報告の形式が自然言語

**Phase Summary**:
- Tasks: 3
- Total Effort: 8h
- Critical Path: Task 1.1 → Task 1.2

### Phase 2: Existing Commands Refactoring [10h]

#### Task 2.1: Refactor spec/req.md [2h]

**Description**: 要件定義コマンドを自然言語指示に変換

**Subtasks**:
- [ ] プログラム的記述の削除
- [ ] 自然言語による指示への書き換え
- [ ] `@.shirokuma/commands/shared/spec-logic.md`への参照追加
- [ ] 応答例の自然言語化

**Requirements**: REQ-4, REQ-5
**Dependencies**: Task 1.1
**Acceptance Criteria**:
- [ ] 「AIへの願い」として読める内容
- [ ] 技術的詳細の除去
- [ ] 共通ロジックへの適切な参照

#### Task 2.2: Refactor spec/design.md [2h]

**Description**: 設計コマンドを自然言語指示に変換

**Subtasks**:
- [ ] プログラム的記述の削除
- [ ] 自然言語による指示への書き換え
- [ ] 共通ロジックへの参照追加
- [ ] 設計作成の流れを会話的に記述

**Requirements**: REQ-4, REQ-5
**Dependencies**: Task 1.1
**Acceptance Criteria**:
- [ ] 設計の目的が明確に伝わる
- [ ] 技術用語を最小限に
- [ ] ユーザーとの対話例を含む

#### Task 2.3: Refactor spec/tasks.md [2h]

**Description**: タスク分解コマンドを自然言語指示に変換

**Subtasks**:
- [ ] プログラム的記述の削除
- [ ] タスク作成プロセスの自然言語化
- [ ] TDDアプローチの説明を簡潔に
- [ ] TodoWriteとの連携方法を会話的に

**Requirements**: REQ-4, REQ-5
**Dependencies**: Task 1.1
**Acceptance Criteria**:
- [ ] タスク分解の意図が明確
- [ ] 実装詳細ではなく方針の記述
- [ ] 時間見積もりの考え方を含む

#### Task 2.4: Refactor spec/validate.md and check.md [2h]

**Description**: 検証系コマンドを自然言語指示に変換

**Subtasks**:
- [ ] validate.mdの自然言語化
- [ ] check.mdの自然言語化
- [ ] 品質評価基準の簡潔な説明
- [ ] フィードバックの伝え方を記述

**Requirements**: REQ-4, REQ-5
**Dependencies**: Task 1.1
**Acceptance Criteria**:
- [ ] 検証の目的が理解しやすい
- [ ] チェックポイントが明確
- [ ] 改善提案の出し方が自然

#### Task 2.5: Refactor main spec.md command [2h]

**Description**: メインのspecコマンドを統合的な指示に変換

**Subtasks**:
- [ ] 全体フローの自然言語記述
- [ ] 各サブコマンドへの適切な振り分け
- [ ] output-styleとの使い分け説明
- [ ] モード制限の実装指示

**Requirements**: REQ-2, REQ-4
**Dependencies**: Tasks 2.1-2.4
**Acceptance Criteria**:
- [ ] 統合的な動作が理解できる
- [ ] モード判定ロジックが明確
- [ ] ユーザーガイダンスが親切

**Phase Summary**:
- Tasks: 5
- Total Effort: 10h
- Critical Path: Task 1.1 → Tasks 2.1-2.4 → Task 2.5

### Phase 3: System Harmonizer Update [6h]

#### Task 3.1: Update monitoring configuration [2h]

**Description**: system-harmonizerに新ファイル構造の監視を追加

**Subtasks**:
- [ ] 新規ファイルパスの追加
- [ ] 既存ファイルの役割変更を記述
- [ ] チェック項目リストの更新
- [ ] 相互参照の整合性チェック追加

**Requirements**: REQ-9
**Dependencies**: Phase 2 completion
**Acceptance Criteria**:
- [ ] 全新規ファイルが監視対象
- [ ] 役割変更が明確に定義
- [ ] チェック項目が網羅的

#### Task 3.2: Add natural language validation [2h]

**Description**: 自然言語品質の検証ルールを実装

**Subtasks**:
- [ ] プログラム的記述の検出パターン定義
- [ ] 自然言語度の評価基準作成
- [ ] MUST/SHOULD/MUST NOT規則の追加
- [ ] 検証結果のレポート形式定義

**Requirements**: REQ-9, REQ-10
**Dependencies**: Task 3.1
**Acceptance Criteria**:
- [ ] プログラム的記述を検出できる
- [ ] 自然言語度を数値化できる
- [ ] 明確な合否判定基準

#### Task 3.3: Update harmony score calculation [2h]

**Description**: 新しい評価メトリクスでハーモニースコアを更新

**Subtasks**:
- [ ] 自然言語度メトリクスの追加（重み0.2）
- [ ] 参照整合性メトリクスの実装
- [ ] 役割明確性の評価方法定義
- [ ] スコア計算式の更新

**Requirements**: REQ-10
**Dependencies**: Task 3.2
**Acceptance Criteria**:
- [ ] 新メトリクスが機能する
- [ ] スコアが0-1で正規化
- [ ] 重み付けが適切

**Phase Summary**:
- Tasks: 3
- Total Effort: 6h
- Critical Path: Task 3.1 → Task 3.2 → Task 3.3

### Phase 4: Integration Testing & Documentation [4h]

#### Task 4.1: Integration test scenarios [2h]

**Description**: 統合動作確認のシナリオ作成と実行

**Subtasks**:
- [ ] output-styleモードでのSpec作成テスト
- [ ] コマンド明示実行のテスト
- [ ] /kuma:updateコマンドの動作確認
- [ ] system-harmonizerによる検証実行

**Requirements**: REQ-1, REQ-2, REQ-7
**Dependencies**: Phases 1-3 completion
**Acceptance Criteria**:
- [ ] 全フェーズが正常に動作
- [ ] ハイブリッド実行が機能
- [ ] ハーモニースコアが基準値以上

#### Task 4.2: Update documentation [2h]

**Description**: 関連ドキュメントの更新

**Subtasks**:
- [ ] CLAUDE.mdへの新コマンド追加
- [ ] README更新（必要に応じて）
- [ ] 移行ガイドの作成
- [ ] 使用例の追加

**Requirements**: REQ-5
**Dependencies**: Task 4.1
**Acceptance Criteria**:
- [ ] 新機能が文書化されている
- [ ] 移行手順が明確
- [ ] 例が実践的

**Phase Summary**:
- Tasks: 2
- Total Effort: 4h
- Critical Path: Task 4.1 → Task 4.2

## Summary

### Metrics
- **Total Tasks**: 13
- **Total Effort**: 28 hours
- **Phases**: 4
- **Completed**: 0/13

### Milestones
1. **Foundation Complete**: Phase 1完了 - spec-logic.md, output-style, /kuma:update実装
2. **Commands Refactored**: Phase 2完了 - 全コマンドの自然言語化
3. **System Harmonized**: Phase 3完了 - system-harmonizer更新と検証
4. **Release Ready**: Phase 4完了 - 統合テストとドキュメント完了

### Risk Assessment

- **ファイル参照の破損**: Medium likelihood
  - Impact: コマンド実行エラー
  - Mitigation: 段階的移行と都度検証
  
- **自然言語の曖昧性**: Low likelihood
  - Impact: AI動作の不安定化
  - Mitigation: 明確な例と指示の提供

- **後方互換性の問題**: Low likelihood
  - Impact: 既存ワークフローの中断
  - Mitigation: ハイブリッドアプローチ採用

### Dependencies
- [Internal] spec-logic.md: 全コマンドが参照する共通ロジック
- [Internal] output-style: フロー制御の中核
- [Internal] system-harmonizer: 品質保証メカニズム

## Execution Notes

### Prerequisites
- [ ] Issue #152がOpenまたはIn Progress状態
- [ ] 設計文書（ID: 154）が承認済み
- [ ] shirokuma-kbへのアクセス権限

### Testing Requirements
- Markdownコマンドの動作確認（コードテストではなく使用テスト）
- output-styleモードでの全フェーズ実行
- system-harmonizerによる整合性チェック
- /kuma:updateでのファイル取り込み確認

### Documentation Requirements
- 各コマンドファイルに使用例を含める
- 移行ガイドの作成
- ハイブリッドアプローチの説明

## Task Checklist (For Copy/Paste)

```markdown
- [ ] 1.1: Create spec-logic.md [2h]
- [ ] 1.2: Create kuma-spec output-style [3h]
- [ ] 1.3: Create /kuma:update command [3h]
- [ ] 2.1: Refactor spec/req.md [2h]
- [ ] 2.2: Refactor spec/design.md [2h]
- [ ] 2.3: Refactor spec/tasks.md [2h]
- [ ] 2.4: Refactor spec/validate.md and check.md [2h]
- [ ] 2.5: Refactor main spec.md command [2h]
- [ ] 3.1: Update monitoring configuration [2h]
- [ ] 3.2: Add natural language validation [2h]
- [ ] 3.3: Update harmony score calculation [2h]
- [ ] 4.1: Integration test scenarios [2h]
- [ ] 4.2: Update documentation [2h]
```