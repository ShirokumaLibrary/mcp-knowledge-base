# AI-Spec コマンドシステム 使用ガイド

## 📋 概要

AI-Specコマンドシステムは、Spec駆動開発（Spec-Driven Development）を実現するための包括的なコマンドセットです。要件定義から設計、タスク分解まで、開発の全フェーズを体系的にサポートします。

## 🚀 クイックスタート

### 基本的な使い方

```bash
# 新機能の完全なSpec生成（要件→設計→タスク）
/ai-spec "ユーザー認証機能を追加"

# 要件定義のみ生成
/ai-spec:req "ダッシュボード機能"

# 既存Specの改善
/ai-spec:refine 101
```

## 📊 Spec規模の判断フロー

どのSpecコマンドを使うべきか判断する：

```mermaid
graph TD
    A[新機能/変更] --> B{作業量は？}
    B -->|< 1日| C[/ai-spec:micro]
    B -->|1-3日| D{複数コンポーネント？}
    B -->|> 3日| E[/ai-spec]
    D -->|No| F[/ai-spec:quick]
    D -->|Yes| G{新技術/パターン？}
    G -->|No| F
    G -->|Yes| E
```

### 🎯 判断支援コマンド

```bash
# 自動判断サポート
/ai-spec:when "CSV エクスポート機能を追加"

# 出力例：
## Spec推奨分析
複雑度スコア: 21/60
推奨: QUICK SPEC
理由: 単一コンポーネント、既知パターン、1-2日の作業
```

## 🔧 コマンド詳細

### 1️⃣ メインコマンド：`/ai-spec`

完全な3フェーズSpec生成（要件→設計→タスク）

```bash
# 基本使用
/ai-spec "ユーザープロフィール画像アップロード機能"

# オプション指定
/ai-spec "決済システム統合" --priority HIGH --type feature
```

**生成される内容：**
- Phase 1: 要件定義（EARS形式）
- Phase 2: 技術設計
- Phase 3: タスク分解
- MCPに自動保存

### 2️⃣ フェーズ別コマンド

#### `/ai-spec:req` - 要件定義フェーズ

EARS形式で厳密な要件定義を生成：

```bash
# 新規要件生成
/ai-spec:req "通知システム"

# 既存Specの要件改善
/ai-spec:req refine 101

# 要件の検証
/ai-spec:req validate 101
```

**EARS形式の例：**
```
WHEN user clicks submit button THEN system SHALL validate all fields
IF validation fails THEN system SHALL display error messages
WHILE file is uploading system SHALL show progress indicator
```

#### `/ai-spec:design` - 設計フェーズ

技術設計とアーキテクチャを定義：

```bash
# 設計生成
/ai-spec:design 101

# アーキテクチャ図生成付き
/ai-spec:design 101 --with-diagrams
```

**設計内容：**
- システムアーキテクチャ
- データモデル
- API仕様
- 統合ポイント
- セキュリティ設計

#### `/ai-spec:tasks` - タスク分解フェーズ

実装可能なタスクに分解：

```bash
# タスク生成
/ai-spec:tasks 101

# TodoWriteと連携
/ai-spec:tasks 101 --create-todos
```

**タスク構造：**
- 2-4時間単位のタスク
- 依存関係の明確化
- 見積もり時間
- テストタスク含む

### 3️⃣ 軽量Specコマンド

#### `/ai-spec:micro` - 超軽量Spec（<1日）

シンプルな変更用の最小限Spec：

```bash
/ai-spec:micro "ボタンの色を変更"
```

**テンプレート：**
```markdown
## What
ボタンの色を青から緑に変更

## Why  
ブランドカラーとの統一性向上

## How
- CSSファイルの変数更新
- 影響する全コンポーネント確認

## Acceptance
- [ ] 全ボタンが新色に変更
- [ ] ホバー状態も調整
```

#### `/ai-spec:quick` - クイックSpec（1-3日）

中規模機能用（設計フェーズをスキップ）：

```bash
/ai-spec:quick "CSVエクスポート機能"
```

**含まれる内容：**
- 要件定義（簡易版）
- 実装計画
- タスクリスト
- 技術ノート

### 4️⃣ 検証・品質管理コマンド

#### `/ai-spec:validate` - 形式検証

EARS形式の構文チェック：

```bash
# Spec全体の検証
/ai-spec:validate 101

# 個別ステートメント検証
/ai-spec:validate "WHEN user clicks THEN validate"

# バッチ検証
/ai-spec:validate batch
```

**検証項目：**
- EARS構文の正確性
- SHALL使用の確認
- 曖昧な表現の検出
- テスト可能性の確認

#### `/ai-spec:check` - 包括的チェック

品質チェックリストによる検証：

```bash
# 全フェーズチェック
/ai-spec:check 101

# 特定フェーズのみ
/ai-spec:check 101 requirements
/ai-spec:check 101 design
/ai-spec:check 101 tasks
```

**スコアリング：**
- 90-100%: Excellent - 実装準備完了
- 75-89%: Good - 軽微な改善必要
- 60-74%: Fair - 大幅な改善必要
- <60%: Poor - 大規模な見直し必要

### 5️⃣ プロジェクト設定コマンド

#### `/ai-spec:steering` - ステアリングドキュメント

プロジェクト固有の標準・ガイドライン管理：

```bash
# ステアリング作成
/ai-spec:steering create

# 一覧表示
/ai-spec:steering list

# 特定ドキュメント表示
/ai-spec:steering show project-standards

# 更新
/ai-spec:steering update api-design
```

**ステアリングタイプ：**
- プロジェクト標準
- Git ワークフロー
- API 設計標準
- フロントエンド標準
- 開発環境設定

**包含メカニズム：**
```yaml
# 常に適用
inclusion: always

# ファイルパターンマッチ時
inclusion: fileMatch
fileMatchPattern: '**/api/**'

# 手動指定時のみ
inclusion: manual
```

### 6️⃣ 実行管理コマンド

#### `/ai-spec:execute` - Spec実行

Specからタスク実行を管理：

```bash
# 実行開始
/ai-spec:execute 101

# 進捗確認
/ai-spec:execute status 101

# 完了マーク
/ai-spec:execute complete 101
```

#### `/ai-spec:refine` - Spec改善

既存Specの洗練と改善：

```bash
# 全体改善
/ai-spec:refine 101

# 特定フェーズ改善
/ai-spec:refine 101 requirements
```

## 📁 MCP統合

すべてのSpecは自動的にshirokuma-kbに保存されます：

```typescript
// 保存形式
{
  type: "spec",
  title: "Spec: [機能名]",
  content: JSON.stringify({
    phase: "complete|requirements|design|tasks",
    requirements: {...},
    design: {...},
    tasks: {...},
    validation: {...}
  }),
  status: "Open|In Progress|Completed",
  priority: "HIGH|MEDIUM|LOW",
  tags: ["spec", "feature", phase]
}
```

### 検索とフィルタリング

```bash
# Spec検索
mcp__shirokuma-kb__search_items({
  query: "type:spec authentication",
  limit: 10
})

# 特定フェーズのSpec
mcp__shirokuma-kb__list_items({
  type: "spec",
  tags: ["requirements"]
})
```

## 🔄 ワークフロー例

### 例1: 新機能開発（フル）

```bash
# Step 1: 判断
/ai-spec:when "多要素認証機能"
→ 推奨: STANDARD SPEC (3日以上)

# Step 2: Spec生成
/ai-spec "多要素認証機能の実装"
→ Spec ID: 102 生成

# Step 3: 検証
/ai-spec:check 102
→ スコア: 85% (Good)

# Step 4: 改善
/ai-spec:refine 102 requirements
→ 要件を詳細化

# Step 5: 実行
/ai-spec:execute 102
→ タスク実行開始
```

### 例2: バグ修正（軽量）

```bash
# Step 1: Micro Spec作成
/ai-spec:micro "ログインボタンが機能しない問題を修正"

# Step 2: 即実装
→ Specに従って修正実施
```

### 例3: 中規模機能（クイック）

```bash
# Step 1: Quick Spec生成
/ai-spec:quick "レポートのPDFエクスポート"

# Step 2: タスク確認
/ai-spec:tasks show-from-quick

# Step 3: TodoWriteと連携
→ 自動的にタスクリスト作成
```

## 🎯 ベストプラクティス

### 1. Spec規模の適切な選択

| 作業量 | コマンド | 用途 |
|--------|----------|------|
| < 4時間 | `/ai-spec:micro` | 小さな修正、バグフィックス |
| < 1日 | `/ai-spec:micro` | 単純な機能追加 |
| 1-3日 | `/ai-spec:quick` | 中規模機能、既知パターン |
| > 3日 | `/ai-spec` | 複雑な機能、新アーキテクチャ |

### 2. ステアリングドキュメントの活用

```bash
# プロジェクト開始時に設定
/ai-spec:steering create
→ プロジェクト標準を定義

# Spec生成時に自動適用
/ai-spec "新機能"
→ ステアリング内容が自動的に反映
```

### 3. 継続的な検証

```bash
# 各フェーズ後に検証
/ai-spec:req "機能" → /ai-spec:validate
/ai-spec:design → /ai-spec:check design
/ai-spec:tasks → /ai-spec:check tasks
```

### 4. EARSフォーマットの徹底

```
✅ 良い例:
WHEN user submits form THEN system SHALL validate all fields
IF validation fails THEN system SHALL display specific error messages

❌ 悪い例:
User submits form and validation happens
System should probably check the input
```

## 🚨 注意事項

1. **Specなしでコード変更しない**
   - 緊急時を除き、必ずSpec作成後に実装

2. **適切な粒度を保つ**
   - タスクは2-4時間単位
   - 要件は検証可能な具体性

3. **MCPとの整合性**
   - type: "spec"で統一
   - 適切なタグ付け
   - リレーション設定

4. **ステアリングの更新**
   - プロジェクト進化に合わせて更新
   - チーム全体で共有

## 📚 関連リソース

### 内部リファレンス
- `.claude/commands/ai-spec/shared/ears-format.markdown` - EARS形式詳細
- `.claude/commands/ai-spec/shared/spec-templates.markdown` - テンプレート集
- `.claude/commands/ai-spec/shared/spec-prompts.markdown` - AI生成プロンプト

### 関連コマンド
- `/ai-issue` - イシュー管理
- `/ai-go` - タスク実行
- `/ai-commit` - Git操作

## 🔍 トラブルシューティング

### Q: Specが大きすぎる
A: `/ai-spec:when`で判断し、必要に応じて分割

### Q: EARSエラーが多い
A: `/ai-spec:validate`で個別検証し、修正箇所を特定

### Q: 既存コードとの整合性
A: ステアリングドキュメントで既存パターンを定義

### Q: Spec更新の管理
A: `/ai-spec:refine`で段階的に改善、MCPで履歴管理

## 📈 効果測定

Specの品質と効果を測定：

```bash
# 統計情報
mcp__shirokuma-kb__get_stats()

# Spec完成度
/ai-spec:check 102
→ Requirements: 90%
→ Design: 85%
→ Tasks: 95%
→ Overall: 90% (Excellent)
```

---

*Spec駆動開発で、明確な要件から始まり、しっかりとした設計を経て、実行可能なタスクへと導く開発プロセスを実現します。*