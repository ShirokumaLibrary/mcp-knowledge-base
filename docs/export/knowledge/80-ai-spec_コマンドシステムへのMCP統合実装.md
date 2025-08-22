---
id: 80
type: knowledge
title: "ai-spec コマンドシステムへのMCP統合実装"
status: Completed
priority: HIGH
tags: ["automation","ai-spec","mcp-integration","knowledge-base","system-update"]
related: [111,75,104,106]
keywords: {"spec":1,"mcp":1,"shirokuma":0.9,"integration":0.9,"specification":0.8}
concepts: {"specification":0.9,"automation":0.9,"integration":0.9,"data_management":0.8,"software_development":0.8}
embedding: "gIKAj4GAgIiAgICqgICPlYCJgIaKgICRgICFp4CAj4+Aj4CAk4CAkoCAgJuAgImEgI+AgpSAgIuAgIWdgICBgICHgIuLgICCgICQl4CAgISAjYCSkoCAiICAl5qAgIaPgIWAkYiAgIGAgJOggICNh4CAgIiAgICBgICIoYCAiJE="
createdAt: 2025-08-22T13:32:44.000Z
updatedAt: 2025-08-22T13:32:44.000Z
---

# ai-spec コマンドシステムへのMCP統合実装

ai-specコマンド群にshirokuma-kb自動保存機能を追加

## AI Summary

Implementation of MCP integration for ai-spec command system, adding automatic specification storage functionality to shirokuma-kb for persistence, search, and version management across all specification phases including requirements, design, tasks, and validation.

# ai-spec コマンドシステムへのMCP統合実装

## 概要
ai-specコマンドシステムの各コマンドに対して、生成されたスペックを自動的にshirokuma-kbに保存する機能を追加しました。これにより、すべてのスペックが永続化され、後から参照・検索・更新が可能になります。

## 実装内容

### 1. メインコマンド (/ai-spec)
- **変更内容**: 
  - スペック作成時に自動的にMCPに保存
  - アイテムIDを返却してユーザーに通知
  - list/show/executeコマンドでMCPから取得
  
- **保存形式**:
  ```typescript
  type: "spec"
  content: JSON.stringify({
    phase: "complete",
    requirements: {...},
    design: {...},
    tasks: {...}
  })
  ```

### 2. 要件フェーズ (/ai-spec:req)
- **変更内容**:
  - 要件生成後に自動保存
  - 既存スペックの更新対応
  - バージョン管理機能
  
- **保存形式**:
  ```typescript
  type: "spec_requirements"
  related: [parentSpecId] // 親スペックとの関連付け
  ```

### 3. 設計フェーズ (/ai-spec:design)
- **変更内容**:
  - 要件スペックからの継続対応
  - 設計内容の自動保存
  - 既存スペックへの追記
  
- **保存形式**:
  ```typescript
  // 既存スペックを更新 or 新規作成
  type: "spec_design"
  ```

### 4. タスクフェーズ (/ai-spec:tasks)
- **変更内容**:
  - タスク生成後の自動保存
  - TodoWriteとの統合
  - ステータス自動更新（Ready → In Progress）
  
- **保存形式**:
  ```typescript
  phase: "complete" // 全フェーズ完了
  status: "Ready"
  ```

### 5. マイクロスペック (/ai-spec:micro)
- **変更内容**:
  - 超軽量スペックの自動保存
  - 低優先度設定
  
- **保存形式**:
  ```typescript
  type: "spec_micro"
  priority: "LOW"
  ```

### 6. クイックスペック (/ai-spec:quick)
- **変更内容**:
  - 中規模スペックの自動保存
  - TodoWrite統合オプション
  
- **保存形式**:
  ```typescript
  type: "spec_quick"
  priority: "MEDIUM"
  ```

### 7. 判定ガイド (/ai-spec:when)
- **変更内容**:
  - 分析結果の自動保存
  - 関連スペックとのリンク
  
- **保存形式**:
  ```typescript
  type: "spec_analysis"
  content: JSON.stringify({
    scores: {...},
    recommendation: "MICRO/QUICK/STANDARD/FULL"
  })
  ```

### 8. 検証コマンド (/ai-spec:check)
- **変更内容**:
  - 検証結果の自動保存
  - 検証レポートの作成
  - スコアベースのステータス設定
  
- **保存形式**:
  ```typescript
  type: "spec_validation"
  status: score >= 75 ? "Completed" : "Review"
  related: [specId] // 検証対象スペックとのリンク
  ```

## 利点

1. **永続化**: すべてのスペックがデータベースに保存される
2. **検索可能**: MCPの検索機能でスペックを探せる
3. **関連付け**: スペック間の関係が自動的に管理される
4. **バージョン管理**: 更新履歴が保持される
5. **ステータス追跡**: 進捗状況が自動更新される
6. **統合**: TodoWriteやその他のツールとの連携

## 使用タイプの一覧

- `spec` - 完全なスペック（全フェーズ）
- `spec_requirements` - 要件フェーズのみ
- `spec_design` - 設計フェーズのみ
- `spec_micro` - マイクロスペック
- `spec_quick` - クイックスペック
- `spec_analysis` - スペック判定分析
- `spec_validation` - スペック検証結果

## 今後の拡張可能性

1. スペックテンプレートの保存・再利用
2. スペック間の依存関係管理
3. 進捗ダッシュボード機能
4. スペックの自動レビュー機能
5. AIによるスペック改善提案
