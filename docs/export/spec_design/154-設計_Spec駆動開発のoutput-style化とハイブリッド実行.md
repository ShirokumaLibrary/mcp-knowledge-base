---
id: 154
type: spec_design
title: "設計: Spec駆動開発のoutput-style化とハイブリッド実行"
status: Specification
priority: HIGH
description: "Issue #152のSpec駆動開発システム設計（要件ID: 153に基づく）"
aiSummary: "Design specification for implementing spec-driven development with output-style integration and hybrid execution architecture, featuring phase management, component design, and system integration patterns."
tags: ["design","architecture","spec","output-style","issue-152","hybrid"]
related: [152,153,155]
keywords: {"spec":1,"design":0.9,"development":0.9,"phase":0.8,"architecture":0.8}
concepts: {"software architecture":0.9,"system design":0.9,"development methodology":0.8,"workflow automation":0.7,"data management":0.7}
embedding: "gIKJn5CBgICEgIClgICAgICJgZ+HgYCAjICAq4CAgICAkIGRgImAgJCAgJiAgICAgI+Kg4GTgICNgICXgICAgICIg4GKjICAhYCAjICAgICAjY2EkpSAgICAgJKAgICAgIWVjpKTgICDgICkgICAgICAk5qKioCAgICAo4CAgIA="
createdAt: 2025-08-23T12:54:38.000Z
updatedAt: 2025-08-23T13:20:54.000Z
---

# Design: Spec駆動開発のoutput-style化とハイブリッド実行

## Metadata
- **Version**: 1.2
- **Created**: 2025-08-23T12:55:00Z
- **Updated**: 2025-08-23T13:15:00Z
- **Status**: Specification
- **Phase**: Design
- **Requirements Spec**: #153
- **Issue**: #152

## Design Overview

### Goals
- 流れるような仕様作成体験の実現
- コマンドとoutput-styleのシームレスな連携
- 共通ロジックによる一貫性の確保
- ユーザー編集の柔軟な取り込み
- 高い保守性と拡張性の実現

### Key Design Decisions

1. **Decision**: Markdownファイルによる指示駆動アーキテクチャ
   - **Rationale**: Markdownコマンドは自然言語の指示書として機能すべき
   - **Trade-offs**: プログラム的な厳密性よりも、人間の理解しやすさを優先

2. **Decision**: 指示の階層化と参照システム
   - **Rationale**: `@`記法による他ファイル参照で、指示の再利用と組み合わせを実現
   - **Trade-offs**: ファイル間の依存関係が生まれるが、DRY原則を実現

3. **Decision**: AIへの指示としての設計
   - **Rationale**: コマンドファイルは「AIに何をしてほしいか」を記述する場所
   - **Trade-offs**: 実装詳細ではなく意図の記述に焦点を当てる

## 実装アプローチ：Markdownコマンドの本質

### Markdownコマンドとは何か

Markdownコマンドは、**AIへの自然言語による指示書**です。プログラムのソースコードではなく、「こういう時に、こうしてほしい」という要望を記述します。

```markdown
# このコマンドが呼ばれたら

1. まず前回の状態を思い出してください
2. ユーザーの要望を理解してください
3. 適切な形式で仕様を作成してください
4. 次に何をすべきか提案してください
```

### ファイル構成の設計思想

```
.shirokuma/commands/shared/
├── lang.markdown          # どの言語で応答するかの指示
├── mcp-rules.markdown     # MCPをどう使うかの指示
└── spec-logic.md         # Spec作成時の共通の考え方

.shirokuma/commands/kuma/
├── spec.md               # Spec作成全体の流れの指示
├── spec/
│   ├── req.md           # 要件定義時の指示
│   ├── design.md        # 設計時の指示
│   └── tasks.md         # タスク分解時の指示
└── update.md            # ドキュメント更新時の指示

.claude/output-styles/
└── kuma-spec.md         # output-styleモードでの振る舞い指示

.claude/agents/
└── shirokuma-system-harmonizer.md  # システム整合性チェック（要更新）
```

## コマンドファイルの書き方ガイド

### 基本構造

```markdown
# コマンド名と目的

## Usage
ユーザーがどう使うかの例を示す

## When this command is called
このコマンドが呼ばれた時の状況説明

## What you should do
AIがすべきことを順番に説明

## How to respond
応答の形式や含めるべき内容

## References
参照すべき他の指示書
```

### 良い例：自然言語的な指示

```markdown
# /kuma:spec:req - 要件定義の作成支援

## あなたの役割
ユーザーが新しい機能を作りたいと思っている時、その要望を整理して、
明確な要件定義書を作成するお手伝いをしてください。

## 進め方

### 1. ユーザーの要望を理解する
- 何を作りたいのか
- なぜそれが必要なのか
- 誰が使うのか

### 2. 要件として整理する
@.shirokuma/commands/shared/ears-format.markdown を参考に、
テスト可能な形式で要件を記述してください。

### 3. 確認と保存
作成した要件をユーザーに確認してもらい、
MCPに保存してください（@.shirokuma/commands/shared/mcp-rules.markdown 参照）。

## 応答例
「要件定義を作成しました。以下の内容でよろしいですか？」
と確認を求めてください。
```

## output-styleとコマンドの連携設計

### output-styleファイルの役割

`.claude/output-styles/kuma-spec.md`は、**会話の流れ全体**を制御する指示書：

```markdown
# Spec駆動開発モード

## このモードの目的
ユーザーが仕様を作成する際、要件→設計→タスクという
自然な流れで進められるようサポートします。

## 会話の進め方

### フェーズ1：要件定義
ユーザーの要望を聞いて、要件を整理します。
詳細は @.shirokuma/commands/kuma/spec/req.md を参照。

### フェーズ2：設計
要件に基づいて設計を作成します。
詳細は @.shirokuma/commands/kuma/spec/design.md を参照。

### フェーズ3：タスク分解
設計を実装可能なタスクに分解します。
詳細は @.shirokuma/commands/kuma/spec/tasks.md を参照。

## ユーザーへの提示方法
各フェーズの終わりに、次のオプションを提示：
- [続ける] - 次のフェーズへ
- [修正] - 現在の内容を調整
- [終了] - ここで中断
```

### コマンドとの使い分け

- **output-style**: 全体の流れと雰囲気を定義
- **コマンド**: 特定のアクションの詳細な指示

## /kuma:updateコマンドの設計

```markdown
# /kuma:update - ユーザー編集の取り込み

## このコマンドの目的
ユーザーがエクスポートしたMarkdownファイルを編集した後、
その変更をシステムに反映させます。

## 処理の流れ

### 1. ファイルの読み込み
ユーザーが指定したファイルを読み込んでください。

### 2. 内容の理解
- titleとcontentを抽出
- 何が変更されたか理解
- 変更の意図を推測

### 3. 妥当性の確認
大きな変更がある場合は、ユーザーに確認：
「〇〇の部分が大きく変更されていますが、意図的な変更ですか？」

### 4. MCPへの更新
@.shirokuma/commands/shared/mcp-rules.markdown に従って更新。
AIによるタグ付けや関連付けも実行。

### 5. 結果の報告
「更新が完了しました。関連する文書△△への影響も確認しました。」
```

## 共通ロジックファイル（spec-logic.md）の設計

```markdown
# Spec作成の共通ガイドライン

## 良い仕様書の条件
- 誰が読んでも理解できる
- テスト可能な内容
- 実装への道筋が見える

## フェーズ間の整合性
各フェーズで作成した内容は、必ず前のフェーズと
つながっていることを確認してください。

## テンプレートの使い方
テンプレートは出発点です。ユーザーの状況に応じて
柔軟に調整してください。

## 品質チェックポイント
- [ ] ユーザーストーリーは明確か
- [ ] 受け入れ条件は測定可能か
- [ ] エッジケースは考慮されているか
```

## システム整合性チェックエージェントの更新

### shirokuma-system-harmonizer.mdの改修内容

現在のshirokuma-system-harmonizerエージェントは、システム全体の整合性を維持する重要な役割を担っています。今回の構造変更に対応するため、以下の更新が必要です：

#### 1. 新しいファイル構造への対応

```markdown
## 監視対象の追加

### 新規追加ファイル
- `.shirokuma/commands/shared/spec-logic.md` - Spec作成共通ロジック
- `.shirokuma/commands/kuma/update.md` - ドキュメント更新コマンド
- `.claude/output-styles/kuma-spec.md` - Spec駆動開発モード

### 既存ファイルの役割変更
- `.shirokuma/commands/kuma/spec/*.md` - プログラム的記述から自然言語指示へ

## チェック項目の更新

### 指示書の品質チェック
- [ ] 自然言語で記述されているか
- [ ] プログラム的な記述（関数定義など）が含まれていないか
- [ ] `@`参照が正しく機能しているか
- [ ] 指示が明確で実行可能か

### 相互参照の整合性
- [ ] spec-logic.mdと各コマンドの参照関係
- [ ] output-styleとコマンドの役割分担
- [ ] 共通ルール（lang.markdown、mcp-rules.markdown）の適用
```

#### 2. 検証ルールの追加

```markdown
## Markdownコマンドの検証基準

### MUST（必須）
1. 自然言語による指示であること
2. AIへの要望として読めること
3. 参照ファイルが存在すること

### SHOULD（推奨）
1. 具体的な応答例を含むこと
2. ユーザーとの対話例を示すこと
3. エラーケースの対処法を記述すること

### MUST NOT（禁止）
1. プログラムコードの直接記述
2. アルゴリズムの詳細実装
3. データ構造の定義
```

#### 3. ハーモニー評価基準の更新

```markdown
## ハーモニースコア計算の変更

### 新しい評価項目
- **自然言語度**: コマンドファイルの可読性（0.2）
- **参照整合性**: ファイル間の参照関係（0.2）
- **役割明確性**: output-styleとコマンドの分離（0.2）
- **DRY遵守度**: 重複記述の削減（0.2）
- **ユーザビリティ**: 使いやすさと理解しやすさ（0.2）

### 評価方法
各項目を0-1で評価し、重み付け平均を算出
```

#### 4. 自動修正機能の追加

```markdown
## 自動修正提案

### プログラム的記述の検出と修正
検出パターン:
- function/class定義
- if/for/while文
- 変数宣言

修正提案:
「〜してください」形式への変換

### 参照の自動補完
- 共通ロジックへの参照追加
- 言語ルールへの参照追加
- MCPルールへの参照追加
```

## 実装の優先順位（最終版）

### Phase 1: 基盤整備
1. `spec-logic.md` - Spec作成の基本的な考え方
2. `kuma-spec.md` - output-styleでの振る舞い
3. 各フェーズの指示書（req.md, design.md, tasks.md）

### Phase 2: 既存システムの調整
1. コマンドファイルを自然言語的に書き直し
2. `@`参照を活用した構造化
3. プログラム的な記述の削除
4. **shirokuma-system-harmonizer.mdの更新**

### Phase 3: 新機能の実装
1. `/kuma:update`コマンドの作成
2. ファイル読み込みと理解の指示
3. MCPとの連携指示

### Phase 4: 検証と改善
1. system-harmonizerによる整合性チェック
2. 実際の使用例での検証
3. ユーザーフィードバックの収集
4. 指示書の継続的な改善

## システム全体の整合性維持戦略

### 変更管理プロセス
1. **変更前チェック**: system-harmonizerで現状評価
2. **段階的移行**: 一つずつファイルを更新
3. **都度検証**: 各変更後にハーモニースコア確認
4. **ロールバック準備**: 問題発生時の復旧手順

### 継続的改善
- 週次でのハーモニースコアレビュー
- 月次での全体最適化
- 四半期での大規模リファクタリング検討

## まとめ：Markdownコマンドの哲学（再掲）

Markdownコマンドは**AIへの願い**を記述する場所です：

- ❌ アルゴリズムやデータ構造を書く場所ではない
- ✅ 「こんな風に助けてほしい」を伝える場所
- ✅ 状況に応じた柔軟な対応を期待する場所
- ✅ 人間が読んで理解できる指示を書く場所

この設計により、Spec駆動開発は「プログラムの実行」ではなく「AIとの協働作業」として実現されます。

**system-harmonizerエージェントは、この哲学が全体に浸透し、維持されることを保証する守護者として機能します。**