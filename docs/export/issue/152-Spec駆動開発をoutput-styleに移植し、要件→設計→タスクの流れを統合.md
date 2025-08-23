---
id: 152
type: issue
title: "Spec駆動開発をoutput-styleに移植し、要件→設計→タスクの流れを統合"
status: Completed
priority: HIGH
description: "コマンドベースのSpec駆動開発を.claude/output-styles/kuma-spec.mdに移植し、より流れるような開発プロセスを実現する"
aiSummary: "Migration of spec-driven development from command-based to output-style format, integrating requirements, design, and task phases into a unified workflow with automation and interactive controls"
tags: ["automation","workflow","spec-driven","output-style","dx-improvement"]
related: [153,154,155,158]
keywords: {"spec":1,"design":0.9,"requirements":0.9,"development":0.9,"driven":0.9}
concepts: {"software development":0.9,"development methodology":0.8,"workflow management":0.8,"process automation":0.8,"system integration":0.7}
embedding: "hZKZgICLgICAgICXj4CAjY+NkICAkoCAgICAj5WAgJ2VhIiAgJuAgICAgISRgICkkIuXgICcgICAgICLh4CAo4aCiICAjoCAgICAgYCAgJiAgI2AgJWAgICAgIGEgICIg4aXgICbgICAgICKgICAgYCPnYCAmoCAgICAlIWAgII="
createdAt: 2025-08-23T12:25:43.000Z
updatedAt: 2025-08-23T13:44:59.000Z
---

# Issue: Spec駆動開発をoutput-styleとコマンドのハイブリッドに移植

## 概要
Spec駆動開発機能を純粋なコマンドベースから、output-styleとコマンドのハイブリッドアプローチに移行する。

## 背景と動機
- output-styleによる流れるような仕様作成体験
- 必要に応じてコマンドで明示的な制御も可能
- 共通ロジックの一元化によるDRY原則の実現

## 要件
- ✅ output-styleを主体とした自然な会話フロー
- ✅ 明示的な指示が必要な場合のコマンド併用
- ✅ SPECコマンドはspecモード時のみ実行可能に制限
- ✅ 共通ロジックを.shirokuma/commands/sharedに配置
- ✅ ユーザー編集文書の取り込み機能（/kuma:update）

## 設計方針
- ✅ Markdownコマンドは「AIへの自然言語による指示書」として記述
- ✅ プログラム的な記述を避け、会話的な表現を使用
- ✅ @記法による他ファイル参照で再利用性を確保

## 実装結果

### ✅ Phase 1: Foundation Setup (3/3)
- [x] spec-logic.md作成
- [x] kuma-spec output-style作成  
- [x] /kuma:updateコマンド作成

### ✅ Phase 2: Commands Refactoring (5/5)
- [x] spec/req.mdの自然言語化
- [x] spec/design.mdの自然言語化
- [x] spec/tasks.mdの自然言語化
- [x] spec/validate.md & check.mdの自然言語化
- [x] spec.mdメインコマンドの更新

### ✅ Phase 3: System Harmonizer Update (3/3)
- [x] 新ファイル構造の監視追加
- [x] 自然言語品質検証ルール実装
- [x] ハーモニースコア計算更新

### ✅ Phase 4: Integration Testing (2/2)
- [x] 統合テストシナリオ実行（Harmony Score: 0.88/1.00）
- [x] CLAUDE.mdへの新コマンド追加

## 成果

### 自然言語品質の向上
- 全コマンドが会話的トーンに統一
- 「AIへの願い」として読める内容に
- 技術的詳細を抽象化し、意図を明確化

### システム整合性
- Harmony Score: **0.88/1.00**
- 優れた自然言語品質
- 強固な統合パターン
- 明確な役割分離

### 新機能
1. **output-style統合**: 自然な会話フローでSpec作成
2. **/kuma:update**: ユーザー編集文書の取り込み
3. **共通ロジック**: spec-logic.mdによる一元管理
4. **自然言語検証**: system-harmonizerによる品質保証

## 関連文書
- Requirements: #153
- Design: #154  
- Tasks: #155

## 完了
- 総タスク: 13
- 完了: 13
- 進捗率: **100%**

---
実装完了日: 2025-08-23