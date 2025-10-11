---
id: 187
type: issue
title: "仕様作成コマンド完了後に/kuma:vibe系コマンドを次のステップとして提案する機能"
status: Completed
priority: MEDIUM
description: "仕様作成系コマンド（/kuma:spec, /kuma:spec:quick, /kuma:spec:micro）の完了時に、次のステップとして/kuma:vibe系コマンドを提案し、仕様から実装へのスムーズな移行を支援する"
aiSummary: "Enhancement proposal to add vibe-series commands (/kuma:vibe, /kuma:vibe:tdd, /kuma:vibe:code) to the work suggestion feature in /kuma:issue command, enabling adaptive development workflows based on project methodology and complexity scoring"
tags: ["workflow","commands","enhancement","vibe"]
related: [185]
keywords: {"issue":1,"command":0.95,"vibe":0.9,"workflow":0.85,"suggestion":0.8}
concepts: {"workflow-management":0.95,"command-line-interface":0.9,"development-methodology":0.85,"developer-tools":0.85,"test-driven-development":0.8}
embedding: "gICNgKGBlICAiYCViYCAi4CAjoCWgIuAgJSAmYyAgJOAgIuAiIeCgICYgJmJgICTgICEgISPiICAkICehICAlICAgICNiYCAgIWAmICAgJGAgIKAnJCCgICNgJOCgICIgICIgKKPjICAgoCPgICAgICAjoCliJSAgICAkIOAgII="
createdAt: 2025-10-09T08:07:22.000Z
updatedAt: 2025-10-09T08:17:30.000Z
---

## 背景

現在、仕様作成系のコマンドを実行した後、次のステップとして何をすべきかが明確に提示されていない。

ユーザーは仕様を作成した後、通常は以下のフローで実装に進む:
- 仕様作成 → **実装ワークフロー選択** → 実装開始

しかし、現状では実装ワークフローの選択肢（特に`/kuma:vibe`系）が提示されないため、ユーザーが適切なコマンドを見つけにくい。

## 問題の本質

仕様作成後の**自然なフロー**として、以下のような実装開始コマンドを提案すべき:

### 1. `/kuma:spec`（完全仕様）完了後
```
✅ Spec #186 created successfully (Requirements + Design + Tasks)

**次のステップ:**
1. `/kuma:vibe:spec 186` - 仕様に基づいて段階的に実装（推奨）
2. `/kuma:vibe:code 186` - ステアリング準拠の直接実装
3. `/kuma:go 186` - 仕様を参照しながら自由に実装

**推奨理由**: 完全仕様が作成されたため、/kuma:vibe:specで
要件→設計→タスクの各フェーズを段階的に実装できます。
```

### 2. `/kuma:spec:quick`（簡易仕様）完了後
```
✅ Quick Spec #185 created successfully (Requirements + Tasks)

**次のステップ:**
1. `/kuma:vibe 185` - プロジェクトのvibesに沿った適応的実装（推奨）
2. `/kuma:vibe:tdd 185` - TDD重視の実装
3. `/kuma:go 185` - 直接実装開始

**推奨理由**: 簡易仕様が作成されたため、/kuma:vibeで
プロジェクトの開発方針に沿った柔軟な実装ができます。
```

### 3. `/kuma:spec:micro`（マイクロ仕様）完了後
```
✅ Micro Spec #184 created successfully (What/Why/How)

**次のステップ:**
1. `/kuma:vibe:tdd 184` - テスト駆動で実装（推奨）
2. `/kuma:go 184` - 直接実装開始

**推奨理由**: 小規模変更のため、/kuma:vibe:tddで
テストを書きながら確実に実装することを推奨します。
```

### 4. `/kuma:issue`（イシュー作成）完了後（補足）

issue-185で実装した複雑度分析に基づく提案に、`/kuma:vibe`系も追加:

**Score 3-5: Micro Change**
```
次の作業:
- TDD実装: `/kuma:vibe:tdd [issue-id]` ← NEW
- 直接実装: `/kuma:go [issue-id]`
- または軽量仕様: `/kuma:spec:micro [issue-id]`
```

**Score 6-9: Small Feature**
```
次の作業:
- クイック仕様作成: `/kuma:spec:quick [issue-id]`
- 適応的開発: `/kuma:vibe [issue-id]` ← NEW
- または直接実装: `/kuma:go [issue-id]`
```

## 実装が必要な箇所

### 1. `/kuma:spec` コマンド（優先度: 高）
ファイル: `.shirokuma/commands/kuma/spec.md`

仕様作成完了時に以下を出力:
```markdown
## 次のステップ

仕様が完成しました。以下のコマンドで実装を開始できます:

**推奨ワークフロー:**
1. `/kuma:vibe:spec [spec-id]` - 仕様ベースの段階的実装
   - 要件フェーズ → 設計フェーズ → タスクフェーズを順次実行
   - ステアリング設定に準拠した実装

**代替ワークフロー:**
2. `/kuma:vibe:code [spec-id]` - 仕様から直接実装
   - 全フェーズを一括実行
   
3. `/kuma:go [spec-id]` - 自由な実装
   - 仕様を参照しながら独自のアプローチで実装

**Vibeコマンドの特徴:**
- プロジェクトのステアリング設定（TDD、コーディング規約等）を自動適用
- 品質ゲート（テスト、リント、ビルド）を自動チェック
- エラー時の自動リトライとロールバック
```

### 2. `/kuma:spec:quick` コマンド（優先度: 高）
ファイル: `.shirokuma/commands/kuma/spec/quick.md`

簡易仕様作成完了時:
```markdown
## 次のステップ

クイック仕様が完成しました。以下のコマンドで実装を開始できます:

**推奨:**
1. `/kuma:vibe [spec-id]` - 適応的な実装ワークフロー
2. `/kuma:vibe:tdd [spec-id]` - TDD重視の実装

**代替:**
3. `/kuma:go [spec-id]` - 直接実装
```

### 3. `/kuma:spec:micro` コマンド（優先度: 中）
ファイル: `.shirokuma/commands/kuma/spec/micro.md`

マイクロ仕様作成完了時:
```markdown
## 次のステップ

マイクロ仕様が完成しました。以下のコマンドで実装を開始できます:

**推奨:**
1. `/kuma:vibe:tdd [spec-id]` - テスト駆動開発
2. `/kuma:go [spec-id]` - 直接実装
```

### 4. `/kuma:issue` コマンド（優先度: 低）
ファイル: `.shirokuma/commands/kuma/issue.md`

issue-185で実装した提案に`/kuma:vibe`系を追加（既存のissue-187の内容）

## Vibeコマンドの説明

提案と同時に、以下の説明を含める:

```markdown
**Vibeコマンドとは:**
プロジェクトの「vibes」（開発方針、ステアリング設定）に基づいて、
適応的に開発ワークフローを調整するコマンド群です。

**主なVibeコマンド:**
- `/kuma:vibe` - プロジェクトのvibesに基づく適応的開発
- `/kuma:vibe:tdd` - テスト駆動開発（RED-GREEN-REFACTOR）
- `/kuma:vibe:code` - 仕様からの直接実装（ステアリング準拠）
- `/kuma:vibe:spec` - 既存仕様ベースの段階的実装
- `/kuma:vibe:visual` - モックアップ/スクリーンショットからの開発
- `/kuma:vibe:commit` - コンベンショナルコミット作成

**Vibeの利点:**
- プロジェクト固有のルール（TDD、コーディング規約等）を自動適用
- 品質ゲート（テスト、リント、ビルド）の自動チェック
- エラー時の自動リトライとロールバック機能
```

## 実装優先順位

1. **Phase 1**: `/kuma:spec`コマンドへの提案追加（最も使用頻度が高い）
2. **Phase 2**: `/kuma:spec:quick`コマンドへの提案追加
3. **Phase 3**: `/kuma:spec:micro`コマンドへの提案追加
4. **Phase 4**: `/kuma:issue`コマンドの提案に`/kuma:vibe`系を追加（補足的）

## 期待される効果

1. **スムーズなフロー**: 仕様作成から実装へのシームレスな移行
2. **適切なワークフロー選択**: ユーザーが状況に応じた最適な実装方法を選択できる
3. **プロジェクト方針への準拠**: ステアリング設定に基づいた開発を自然に促進
4. **学習効果**: Vibeコマンドの存在と使い方を認知させる
5. **品質向上**: TDDや品質ゲートを含むワークフローの採用率向上

**作成日時**: 2025-10-09 17:06  
**更新日時**: 2025-10-09 17:15  
**関連**: issue-185（次の作業提案機能の実装）