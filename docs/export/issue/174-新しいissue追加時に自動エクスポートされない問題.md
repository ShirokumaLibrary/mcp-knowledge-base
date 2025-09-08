---
id: 174
type: issue
title: "新しいissue追加時に自動エクスポートされない問題"
status: Completed
priority: HIGH
description: "issue #173を作成したが、SHIROKUMA_EXPORT_DIR環境変数が設定されているにも関わらず自動エクスポートされなかった"
aiSummary: "Auto-export functionality not working for new issues despite environment variable configuration, requiring MCP handler integration completion"
tags: ["mcp","export","bug","auto-export"]
keywords: {"export":0.9,"auto":0.9,"mcp":0.8,"integration":0.8,"issue":0.8}
concepts: {"automation":0.9,"configuration":0.8,"integration":0.8,"error-handling":0.7,"file-management":0.7}
embedding: "gICAhIeAgICAhoCAho2ApYCAgImAgICAgI+EgJmNgJ+AgICCgYCAgICSgICojoCYgICAgIeAgICAjISApI+AkICAgIOOgICAgIONgKmQgIuAgICKj4CAgICKkoCgj4CNgICAjYmAgICAgY+AjJOAiYCAgIqCgICAgICGgICZgJo="
createdAt: 2025-08-29T07:13:16.000Z
updatedAt: 2025-08-29T07:22:34.000Z
---

# 新しいissue追加時に自動エクスポートされない問題

## 問題の説明

issue #173を作成した際、`SHIROKUMA_EXPORT_DIR`環境変数が設定されているにも関わらず、自動的にファイルシステムへエクスポートされなかった。

## 根本原因

**MCPハンドラーへの統合がまだ完了していなかった**

## 解決内容

### Phase 2実装完了
1. ✅ `src/mcp/server.ts`に`ExportManager`をインポート
2. ✅ `create_item`ハンドラーに自動エクスポート呼び出しを追加
3. ✅ `update_item`ハンドラーに自動エクスポート呼び出しを追加
4. ✅ `update_current_state`ハンドラーに自動エクスポート呼び出しを追加

### 実装詳細
- 非ブロッキング処理（`.catch()`でエラーをログ出力）
- エクスポート失敗がAPIレスポンスに影響しない
- 環境変数が設定されていない場合は何もしない

### テスト結果
- ✅ アイテム作成時の自動エクスポート: 成功
- ✅ アイテム更新時の自動エクスポート: 成功（ファイル名変更も対応）
- ✅ Current State更新時の自動エクスポート: 成功

## 設定方法

`.mcp.json`に以下を追加：
```json
{
  "mcpServers": {
    "shirokuma-kb": {
      "env": {
        "SHIROKUMA_EXPORT_DIR": "/home/webapp/shirokuma-v8/docs/export"
      }
    }
  }
}
```

## 関連情報
- Issue #168: 機能要求
- Issue #173: Spec系コマンドの問題（別件）
- Spec #169-171: 仕様書
- Handover #172: Phase 1完了報告