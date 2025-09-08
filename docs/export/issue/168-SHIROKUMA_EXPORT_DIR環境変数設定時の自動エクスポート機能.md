---
id: 168
type: issue
title: "SHIROKUMA_EXPORT_DIR環境変数設定時の自動エクスポート機能"
status: Open
priority: MEDIUM
description: "MCPサーバー実行時にSHIROKUMA_EXPORT_DIR環境変数が定義されている場合、アイテムの作成・更新時およびカレントステート更新時に自動的にファイルエクスポートする機能を実装する"
aiSummary: "Implementation of automatic file export functionality for MCP server when SHIROKUMA_EXPORT_DIR environment variable is set, automatically exporting items to files during create/update operations"
tags: ["mcp","export","feature","auto-sync","environment-variable"]
related: [169,170,171,172]
keywords: {"export":1,"environment":0.9,"variable":0.9,"mcp":0.8,"item":0.8}
concepts: {"automation":0.9,"file_management":0.9,"api":0.8,"configuration":0.7,"data_synchronization":0.7}
embedding: "gICAkIqAgIWAgICShouAgICAgIuIgICAgICEi5iLgICAgICSkICAgYCAgJGmkoCAgICAkJmAgICAgISJo5aAgICAgIicgICDgICNgZ6lgICAgICBloCAi4CAkoCTpICAgICAgYyAgJCAgI+IiJuAgICAgIiIgICNgICGkICTgIA="
createdAt: 2025-08-29T03:16:32.000Z
updatedAt: 2025-08-29T05:12:48.000Z
---

## 要求仕様

MCPサーバーとして実行時に`SHIROKUMA_EXPORT_DIR`環境変数が定義されていた場合、以下の動作を行う：

1. **create_item API実行時**
   - アイテム作成成功後、そのアイテムを指定ディレクトリに自動エクスポート
   - エクスポート形式は既存のExportManagerの形式に従う

2. **update_item API実行時**
   - アイテム更新成功後、そのアイテムを指定ディレクトリに自動エクスポート（上書き）
   - ファイル名が変更になる場合は古いファイルを削除

3. **update_current_state API実行時**
   - カレントステート更新成功後、自動エクスポート
   - 保存先: `${SHIROKUMA_EXPORT_DIR}/.system/current_state/`
   - ファイル名: `${id}.md`形式で保存

## 技術要件

### 実装場所
- `src/mcp/handlers/create-item-handler.ts`
- `src/mcp/handlers/update-item-handler.ts`
- `src/mcp/handlers/update-current-state-handler.ts`

### 処理フロー
```typescript
// create_item / update_item の処理後
if (process.env.SHIROKUMA_EXPORT_DIR) {
  const exportManager = new ExportManager(repositories);
  await exportManager.exportSingleItem(item);
}

// update_current_state の処理後
if (process.env.SHIROKUMA_EXPORT_DIR) {
  const exportManager = new ExportManager(repositories);
  await exportManager.exportCurrentState(currentState);
}
```

### エクスポート仕様
- アイテム: `${SHIROKUMA_EXPORT_DIR}/${type}/${id}-${sanitized_title}.md`
- カレントステート: `${SHIROKUMA_EXPORT_DIR}/.system/current_state/${id}.md`
- ファイル形式: 既存のExportManager形式（Markdownフロントマター付き）
- エラー処理: エクスポート失敗してもAPI応答は成功とする（ログに記録）

## 利点

1. **リアルタイム同期**: データベースとファイルシステムの自動同期
2. **バージョン管理**: Gitでの変更追跡が容易
3. **バックアップ**: 自動的にファイルベースのバックアップ生成
4. **可読性**: エディタで直接内容確認可能
5. **セッション継続性**: カレントステートの永続化により、AIセッション間での文脈保持

## 実装時の考慮事項

- パフォーマンス: 大量更新時の影響を考慮
- エラーハンドリング: エクスポート失敗がAPI動作を妨げないように
- ファイル名衝突: IDを含めることで回避
- 削除時の処理: delete_item時にファイルも削除するかは要検討
- カレントステート: 頻繁に更新される可能性があるため、書き込みパフォーマンスに注意