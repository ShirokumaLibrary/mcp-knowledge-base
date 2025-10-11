---
id: 185
type: issue
title: "/kuma:issueコマンドで次の作業提案時に/kuma:spec系コマンドを含め、作業規模に応じた適切なコマンドを提案する機能"
status: Completed
priority: MEDIUM
description: "/kuma:issue コマンドでイシュー登録後、次の作業提案を行う際に /kuma:spec 系のコマンド（/kuma:spec:micro, /kuma:spec:quick, /kuma:spec など）も提案に含めるようにする"
tags: ["workflow","commands","completed","enhancement"]
keywords: {"issue":1,"command":0.9,"spec":0.9,"kuma":0.8,"complexity":0.8}
concepts: {"workflow automation":0.9,"issue management":0.9,"complexity analysis":0.85,"development process":0.8,"task classification":0.8}
createdAt: 2025-10-09T00:59:14.000Z
updatedAt: 2025-10-09T00:59:14.000Z
---

## 目的

イシュー登録後のワークフロー提案を改善し、作業規模に応じた適切な開発プロセスを提案する。

## 要件

### 1. 複雑度分析の実装

イシューの内容を分析して、以下の指標でスコアリング:

**技術的複雑度 (1-5):**
- キーワード分析（refactor, migrate, fix, update等）
- 影響範囲（単一コンポーネント vs 複数システム）

**スコープ指標 (1-5):**
- 機能の大きさ（integration, API vs button, text）
- 受入基準の数
- 外部依存関係の有無

**リスクレベル (1-5):**
- セキュリティ影響
- データ整合性
- 可逆性

### 2. 提案ロジック

合計スコア（3-15）に基づいて推奨コマンドを提示:

- **Score 3-5**: Micro Change → `/kuma:go` or `/kuma:spec:micro`
- **Score 6-9**: Small Feature → `/kuma:spec:quick` 推奨
- **Score 10-12**: Medium Feature → `/kuma:spec` 推奨
- **Score 13-15**: Large Feature → `/kuma:spec` 必須

### 3. 出力フォーマット

```markdown
✅ Issue #XXX created successfully

**作業規模分析:**
- 複雑度: [Low/Medium/High/Very High]
- 推定作業時間: [X hours/days]
- リスクレベル: [Low/Medium/High]

**推奨される次のステップ:**

1. **[Primary Command]** - [Reason]
2. **[Alternative Command]** - [When to use]

**コマンド説明:**
- `/kuma:spec:micro` - 1日未満の小規模変更
- `/kuma:spec:quick` - 1-3日の機能
- `/kuma:spec` - 3日以上の機能
- `/kuma:go` - 仕様なしで直接実装
```

## 実装完了

`.shirokuma/commands/kuma/issue.md` に以下を追加:
- 複雑度分析アルゴリズム
- 提案ロジック
- 出力フォーマット定義
- 実装例3つ

**完了日時**: 2025-10-09 10:22
**実装ファイル**: `.shirokuma/commands/kuma/issue.md`