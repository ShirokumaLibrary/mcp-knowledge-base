---
id: 145
type: knowledge
title: "Spec型の使い分けルール"
status: Completed
priority: MEDIUM
description: "仕様書の型（type）をフェーズ別に使い分けるルール"
aiSummary: "Classification rules for specification document types across different development phases including requirements, design, and task definition with associated command usage and tagging strategies"
tags: ["mcp","spec","knowledge","convention"]
keywords: {"spec":1,"specification":0.9,"type":0.9,"design":0.8,"requirements":0.8}
concepts: {"specification management":0.9,"software development":0.8,"project management":0.8,"requirements engineering":0.7,"system design":0.7}
embedding: "hYCJkoCAj4CAgICkgICJgI+AgYeAgJGAgICIqYCAhICUgIGAgICKgICAk6OAgIuAkICJg4CAgoCAgIukgICYgIaAg42AgICAgICVk4CAn4CAgIyWgICFgICAlY2AgJmAg4CTlICAgYCAgIyWgICMgICAkoqAgIiAgICCmICAj4A="
createdAt: 2025-08-23T06:06:49.000Z
updatedAt: 2025-08-23T06:11:02.000Z
---

# Spec型の使い分けルール

## 型の定義

### Spec関連の型（spec駆動開発用）

#### 1. type: "spec"
- **用途**: 包括的な仕様書（全フェーズを含む）
- **作成コマンド**: `/kuma:spec`
- **内容**: 要件、設計、タスクすべてを含む完全な仕様書

#### 2. type: "spec_requirements"
- **用途**: spec駆動開発の要件定義フェーズ
- **作成コマンド**: `/kuma:spec:req`
- **内容**: ユーザーストーリー、EARS形式の要件、非機能要件など

#### 3. type: "spec_design"
- **用途**: spec駆動開発の設計フェーズ
- **作成コマンド**: `/kuma:spec:design`
- **内容**: アーキテクチャ、データモデル、インターフェース設計など

#### 4. type: "spec_tasks"
- **用途**: spec駆動開発のタスク定義フェーズ
- **作成コマンド**: `/kuma:spec:tasks`
- **内容**: 実装タスク、テストタスク、優先順位など

### 汎用の型（通常の開発活動用）

#### 5. type: "design"
- **用途**: spec駆動開発以外の設計ドキュメント
- **作成方法**: 手動作成またはMCP API
- **内容**: UIデザイン、データベース図、システム構成など
- **例**: 既存システムの設計書、アーキテクチャ図

#### 6. type: "task"
- **用途**: spec駆動開発以外の単発タスク
- **作成方法**: 手動作成またはMCP API
- **内容**: バグ修正、小規模改善、運用タスクなど
- **例**: "ログインボタンのバグ修正"

## 使い分けの指針

### Spec駆動開発の場合
新機能や大規模変更で、要件→設計→タスクの流れを踏む場合：
- 包括的仕様 → `type: "spec"`
- 要件のみ → `type: "spec_requirements"`
- 設計のみ → `type: "spec_design"`
- タスクのみ → `type: "spec_tasks"`

### 通常の開発活動の場合
spec駆動開発のプロセスを踏まない場合：
- 設計文書 → `type: "design"`
- 単発タスク → `type: "task"`

## タグによる補完

型に加えて、以下のタグを使用して分類を明確化：
- `tags: ["spec", "requirements", "ears"]` - spec駆動の要件定義
- `tags: ["spec", "design", "architecture"]` - spec駆動の設計
- `tags: ["spec", "tasks", "implementation"]` - spec駆動のタスク
- `tags: ["design", "ui"]` - 汎用UIデザイン
- `tags: ["task", "bugfix"]` - 汎用バグ修正タスク

## 関連付け

### Spec駆動開発の場合
フェーズ別の仕様書は`related`フィールドで関連付ける：
```javascript
// 要件から設計へのリンク
spec_requirements.related = [spec_design.id]
// 設計からタスクへのリンク
spec_design.related = [spec_tasks.id]
```

### 通常の開発活動の場合
必要に応じて関連するissueやknowledgeと関連付ける：
```javascript
// デザインからissueへのリンク
design.related = [issue.id]
// タスクからissueへのリンク
task.related = [issue.id]
```