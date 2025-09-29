---
id: 167
type: issue
title: "list_items APIにis_closableフラグによるフィルタリング機能を追加"
status: Completed
priority: MEDIUM
description: "ステータス名を指定する代わりに、is_closableフラグでフィルタリングできる機能が必要。デフォルトはis_closable=false（アクティブなアイテム）のみ表示し、完了済みを含める場合はオプションで指定する。"
aiSummary: "Enhancement proposal to add is_closable flag filtering to list_items API, allowing filtering between active and completed items by default showing only active (is_closable=false) items with option to include completed ones"
tags: ["api","feature","list_items","filtering","is_closable","v0.9.1"]
related: [164,165,166]
keywords: {"list_items":1,"is_closable":1,"api":0.9,"status":0.9,"item":0.8}
concepts: {"api_design":0.9,"database_filtering":0.8,"status_management":0.8,"user_interface":0.7,"system_enhancement":0.7}
embedding: "gICAkYCFh4CEgKCAloCAloCAgIuAjY6AjYCagKSAgpeAgICSgJCFgJOAkYCkgIyNgICAkYCPgICQgIuAlYCUgoCAgImAkIOAh4COgIWAlICAgICBgIqNgICAloCFgIuAgICAgYCCk4CCgJ2Ag4CBgoCAgImAgJCAioCogIaAgIw="
createdAt: 2025-08-29T07:33:22.000Z
updatedAt: 2025-08-29T07:33:22.000Z
---

# list_items APIにis_closableフラグによるフィルタリング機能を追加

## ✅ 実装完了 - v0.9.0

### 実装内容
Issue #167の機能をv0.9.0で実装しました。

## 背景
現在のlist_items APIはステータス名でフィルタリングできるが、「アクティブなアイテム」と「完了済みアイテム」を区別する簡単な方法がない。

## 実装した解決策

### API仕様の拡張
```typescript
list_items({
  type?: string;
  status?: string;        // ステータス名でフィルタ（既存）
  includeClosable?: boolean;  // NEW: closableなステータスを含めるか
  onlyActive?: boolean;       // NEW: アクティブ（is_closable=false）のみ
  limit?: number;
  offset?: number;
})
```

### 動作確認結果
```
=== デフォルト（アクティブのみ） ===
Results: 7件
- すべてis_closable=false（Open, In Progress等）

=== includeClosable: true ===
Results: 10件（制限内）
- is_closable=false: Open, In Progress
- is_closable=true: Completed, Closed

=== 特定ステータス（後方互換） ===
status: "Completed" → Completed のみ取得
```

## 実装詳細

### 1. ItemRepository.findAll()の修正
- includeClosableパラメータを追加
- デフォルトでis_closable=falseのみ取得
- statusパラメータとの共存を実現

### 2. 後方互換性の維持
- 既存のstatus指定は継続サポート
- statusが指定された場合はis_closableフィルタを無効化

### 3. MCPハンドラの更新
- 新しいパラメータをサポート
- TypeScript型チェック対応

## ステータスのis_closableマッピング

### アクティブ（is_closable=false）
- Open
- Specification
- Waiting  
- Ready
- In Progress
- Review
- Testing
- Pending

### 完了済み（is_closable=true）
- Completed
- Closed
- Canceled
- Rejected

## 使用例
```typescript
// デフォルト：アクティブなアイテムのみ
list_items({ type: "issue" })  
// → is_closable=false のステータスのみ

// 完了済みも含める
list_items({ type: "issue", includeClosable: true })
// → 全ステータス

// アクティブなアイテムのみ（明示的）
list_items({ type: "issue", onlyActive: true })
// → is_closable=false のステータスのみ

// 特定ステータス（既存動作を維持）
list_items({ type: "issue", status: "Completed" })
// → Completedステータスのみ
```

## 影響範囲
- `/kuma:issue` コマンド - アクティブイシューのみ表示がデフォルトに
- MCP API全体のUX改善
- 画面が完了済みアイテムで埋まることを防止

## 関連
- Issue #165: list_items APIのステータスフィルタリング修正（完了）
- 設計仕様 #166: list_items API修正の設計書