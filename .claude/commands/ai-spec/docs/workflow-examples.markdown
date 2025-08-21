# AI-Spec 開発フロー実例集

実際の開発シナリオに基づいた、AI-Specコマンドシステムの具体的な使用例を紹介します。

## 📚 目次

1. [シナリオ1: 新規認証機能の実装（大規模）](#シナリオ1-新規認証機能の実装大規模)
2. [シナリオ2: バグ修正（超軽量）](#シナリオ2-バグ修正超軽量)
3. [シナリオ3: API エンドポイント追加（中規模）](#シナリオ3-api-エンドポイント追加中規模)
4. [シナリオ4: UI コンポーネント改善（軽量）](#シナリオ4-ui-コンポーネント改善軽量)
5. [シナリオ5: データベース最適化（技術的改善）](#シナリオ5-データベース最適化技術的改善)

---

## シナリオ1: 新規認証機能の実装（大規模）

### 📋 要件
「Google/GitHub OAuth認証を追加し、既存のメール認証と統合する」

### 🔄 開発フロー

#### Step 1: 規模判断と初期分析
```bash
# 作業量の見積もり
/ai-spec:when "OAuth認証機能をGoogle/GitHubで実装し、既存認証と統合"
```

**AI応答例:**
```markdown
## Spec推奨分析
複雑度スコア: 48/60
推奨: STANDARD SPEC（完全3フェーズ）

理由:
- 複数の外部サービス統合（+15）
- セキュリティ考慮必要（+10）
- 既存システムとの統合（+8）
- データベーススキーマ変更（+8）
- 新しい依存関係（+7）

見積もり作業量: 5-7日
```

#### Step 2: ステアリングドキュメント確認
```bash
# プロジェクト標準の確認
/ai-spec:steering show authentication-standards
```

#### Step 3: 完全Spec生成
```bash
/ai-spec "OAuth認証機能 - Google/GitHub統合による認証システムの拡張"
```

**生成されるSpec構造:**
```markdown
# Spec: OAuth認証機能
ID: 103

## Phase 1: Requirements（要件定義）
### Functional Requirements (EARS)
- WHEN user clicks "Sign in with Google" THEN system SHALL initiate OAuth flow
- IF OAuth callback contains valid token THEN system SHALL create or update user account
- WHILE OAuth token is expired THEN system SHALL attempt refresh
- UNLESS user grants permissions THEN system SHALL display authorization error

### Non-Functional Requirements
- Response time: < 2 seconds for auth flow
- Security: OAuth 2.0 compliance, PKCE support
- Availability: 99.9% uptime

## Phase 2: Design（設計）
### Architecture
- OAuth Provider Service (Strategy Pattern)
- Token Management Module
- User Account Linking Service

### Data Model
- users table: add oauth_providers JSON field
- oauth_tokens table: provider, access_token, refresh_token, expires_at

### API Design
- POST /auth/oauth/:provider/initiate
- GET /auth/oauth/:provider/callback
- POST /auth/oauth/refresh

## Phase 3: Tasks（タスク分解）
1. [2h] OAuth Provider Service実装
2. [3h] Google OAuth Strategy実装
3. [3h] GitHub OAuth Strategy実装
4. [2h] Token管理モジュール
5. [4h] ユーザーアカウント連携
6. [2h] データベースマイグレーション
7. [3h] APIエンドポイント実装
8. [2h] フロントエンド統合
9. [3h] テスト実装
10. [1h] ドキュメント更新
```

#### Step 4: Spec検証
```bash
# 包括的チェック
/ai-spec:check 103
```

**検証結果:**
```markdown
## Spec品質レポート
### Requirements Phase: 92/100
✅ EARS形式準拠
✅ テスト可能な要件
⚠️ パフォーマンス要件をより具体化推奨

### Design Phase: 88/100
✅ 明確なアーキテクチャ
✅ データモデル定義済み
⚠️ エラーハンドリング詳細追加推奨

### Tasks Phase: 95/100
✅ 適切な粒度（2-4時間）
✅ 依存関係明確
✅ テストタスク含む

総合スコア: 91.7% (Excellent)
```

#### Step 5: 改善
```bash
# 特定フェーズの改善
/ai-spec:refine 103 requirements
```

#### Step 6: 実行開始
```bash
# TodoWriteと連携してタスク実行
/ai-spec:execute 103
```

#### Step 7: 進捗管理
```bash
# 実装中の進捗確認
/ai-spec:execute status 103

# タスク完了マーク
/ai-spec:execute complete 103 task-1
```

---

## シナリオ2: バグ修正（超軽量）

### 📋 要件
「ログインボタンをクリックしても反応しない」

### 🔄 開発フロー

#### Step 1: Micro Spec作成
```bash
/ai-spec:micro "ログインボタンのクリックイベントが発火しない問題を修正"
```

**生成されるMicro Spec:**
```markdown
# Micro Spec: ログインボタン修正
ID: 104

## What（何を）
ログインボタンのクリックイベントハンドラーが正しくバインドされていない問題を修正

## Why（なぜ）
ユーザーがログインできない致命的な問題のため緊急修正が必要

## How（どうやって）
1. イベントリスナーの登録箇所を確認
2. DOMContentLoadedのタイミング問題を調査
3. イベントバブリングの確認
4. 正しいイベント登録に修正

## Acceptance Criteria（受入基準）
- [ ] ログインボタンクリックでログインフォーム送信
- [ ] すべてのブラウザで動作確認
- [ ] エラーログが出力されない
- [ ] 既存の自動テストが全てパス

見積もり時間: 1-2時間
```

#### Step 2: 即座に実装
```bash
# バグの調査と修正
# コード修正実施...

# 修正完了後
/ai-commit "fix: ログインボタンのイベントハンドラー修正"
```

---

## シナリオ3: API エンドポイント追加（中規模）

### 📋 要件
「ユーザーの活動履歴をCSVでエクスポートするAPI」

### 🔄 開発フロー

#### Step 1: 規模判断
```bash
/ai-spec:when "ユーザー活動履歴のCSVエクスポートAPI実装"
```

**判断結果:** Quick Spec推奨（1-3日の作業）

#### Step 2: Quick Spec生成
```bash
/ai-spec:quick "ユーザー活動履歴CSVエクスポートAPI"
```

**生成されるQuick Spec:**
```markdown
# Quick Spec: 活動履歴CSVエクスポート
ID: 105

## Requirements（要件）
### User Story
As a ユーザー
I want to 自分の活動履歴をCSV形式でダウンロード
So that データ分析や記録保存ができる

### Acceptance Criteria
- 日付範囲指定可能
- 最大10,000件まで出力
- UTF-8 BOM付きCSV
- 非同期処理（大量データ対応）

## Implementation Plan（実装計画）
### Technical Approach
- Stream処理でメモリ効率化
- Queueによる非同期処理
- S3への一時ファイル保存

### Tasks（タスク）
1. [2h] APIエンドポイント設計・実装
   - POST /api/exports/activities
   - GET /api/exports/{exportId}/status
   - GET /api/exports/{exportId}/download

2. [3h] CSV生成サービス実装
   - データ取得クエリ
   - CSV変換ロジック
   - ストリーム処理

3. [2h] 非同期ジョブ実装
   - Queue設定
   - Worker実装
   - 進捗通知

4. [2h] テスト実装
   - ユニットテスト
   - 統合テスト
   - 大量データテスト

5. [1h] ドキュメント更新

総見積もり: 10時間（1.5日）
```

#### Step 3: タスク実行
```bash
# TodoWriteと連携
/ai-spec:tasks 105 --create-todos

# 実装開始
/ai-go
```

---

## シナリオ4: UI コンポーネント改善（軽量）

### 📋 要件
「ダークモードでのコントラストを改善」

### 🔄 開発フロー

#### Step 1: Micro Spec作成
```bash
/ai-spec:micro "ダークモードのコントラスト改善 - アクセシビリティ向上"
```

**Micro Spec:**
```markdown
# Micro Spec: ダークモードコントラスト
ID: 106

## What
ダークモードでのテキストと背景のコントラスト比をWCAG AA基準に適合

## Why
- 視認性の問題報告が増加
- アクセシビリティ基準未達成
- ユーザー体験の低下

## How
1. 現在のカラーパレット分析
2. WCAG AA基準（4.5:1）確認
3. CSS変数の調整
4. 全コンポーネント確認

## Acceptance
- [ ] 全テキスト要素がWCAG AA準拠
- [ ] カラーコントラストツールでの検証完了
- [ ] ユーザビリティテスト実施
```

#### Step 2: 実装と検証
```bash
# カラー調整実施
# CSS変数更新...

# アクセシビリティチェック
/ai-spec:validate "コントラスト基準を満たす"
```

---

## シナリオ5: データベース最適化（技術的改善）

### 📋 要件
「検索クエリのパフォーマンス改善（現在3秒→目標0.5秒）」

### 🔄 開発フロー

#### Step 1: 技術調査とSpec判断
```bash
# 現状分析
/ai-spec:when "データベース検索クエリの最適化 - インデックス追加とクエリ改善"
```

**推奨:** Standard Spec（アーキテクチャ変更を含む）

#### Step 2: ステアリング確認
```bash
# データベース標準確認
/ai-spec:steering show database-optimization
```

#### Step 3: Spec生成（設計重視）
```bash
/ai-spec "検索パフォーマンス最適化 - インデックス戦略とクエリ最適化" --focus design
```

**設計フェーズの詳細:**
```markdown
## Phase 2: Design

### Current State Analysis
- 平均応答時間: 3.2秒
- ボトルネック: フルテーブルスキャン
- 影響範囲: 5つの主要クエリ

### Optimization Strategy
1. **インデックス戦略**
   - Composite Index: (status, created_at, type)
   - Covering Index: search_index列
   - Partial Index: WHERE status != 'deleted'

2. **クエリ最適化**
   - N+1問題の解消
   - サブクエリからJOINへ
   - EXPLAIN ANALYZE結果に基づく調整

3. **キャッシュ戦略**
   - Redis導入（頻繁なクエリ）
   - Materialized View（集計データ）

### Migration Plan
- Step 1: 開発環境でのベンチマーク
- Step 2: インデックス追加（オンライン）
- Step 3: クエリ段階的切り替え
- Step 4: モニタリングと調整
```

#### Step 4: リスク評価
```bash
# チェックリストで確認
/ai-spec:check 107 design
```

#### Step 5: 段階的実装
```bash
# フェーズごとに実行
/ai-spec:execute 107 --phase 1
```

---

## 🎯 パターン別クイックリファレンス

### 機能追加パターン
```bash
# 小規模（< 1日）
/ai-spec:micro "機能説明"

# 中規模（1-3日）
/ai-spec:quick "機能説明"

# 大規模（> 3日）
/ai-spec "機能説明"
```

### バグ修正パターン
```bash
# 緊急修正
/ai-spec:micro "バグ内容"

# 複雑なバグ（調査必要）
/ai-spec:quick "バグ調査と修正"
```

### リファクタリングパターン
```bash
# 設計検討が必要
/ai-spec "リファクタリング内容" --focus design

# タスク分解重視
/ai-spec:tasks "リファクタリング計画"
```

### パフォーマンス改善パターン
```bash
# 計測とゴール設定
/ai-spec:req "現在X秒を Y秒に改善"

# 設計重視
/ai-spec:design "最適化戦略"
```

---

## 📊 効果測定とフィードバック

### Spec利用統計の確認
```bash
# MCPから統計取得
mcp__shirokuma-kb__search_items({
  query: "type:spec",
  limit: 100
})

# 完了率分析
mcp__shirokuma-kb__list_items({
  type: "spec",
  status: ["Completed"],
  sortBy: "updated"
})
```

### 改善サイクル
1. **Spec作成** → 見積もり記録
2. **実装** → 実際の時間記録
3. **振り返り** → 差異分析
4. **ステアリング更新** → 知見の反映

---

## 🚨 アンチパターンと対策

### ❌ アンチパターン1: Spec作成の省略
```bash
# 悪い例
"小さい変更だからSpecは不要" → 直接コーディング
```

**対策:** 最低限Micro Specを作成（5分で完了）

### ❌ アンチパターン2: 過度に詳細なSpec
```bash
# 悪い例
1行のバグ修正に10ページのSpec
```

**対策:** `/ai-spec:when`で適切な規模判断

### ❌ アンチパターン3: Spec更新の放置
```bash
# 悪い例
実装中の変更をSpecに反映しない
```

**対策:** `/ai-spec:refine`で定期更新

---

## 🔗 関連ドキュメント

- [AI-Spec README](./README.md) - 詳細なコマンドリファレンス
- [EARS Format Guide](./shared/ears-format.markdown) - EARS形式の詳細
- [Spec Templates](./shared/spec-templates.markdown) - テンプレート集
- [Steering Documents](./shared/steering-guide.md) - ステアリング設定ガイド

---

*これらの実例を参考に、プロジェクトに最適なSpec駆動開発フローを構築してください。*