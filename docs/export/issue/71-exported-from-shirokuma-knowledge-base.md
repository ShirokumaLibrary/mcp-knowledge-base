# エクスポート時の「Exported from SHIROKUMA Knowledge Base」削除

## Metadata

- **ID**: 71
- **Type**: issue
- **Status ID**: 13
- **Priority**: LOW
- **Created**: Fri Aug 22 2025 22:32:44 GMT+0900 (Japan Standard Time)
- **Updated**: Fri Aug 22 2025 22:32:44 GMT+0900 (Japan Standard Time)

## Description

エクスポートファイルに自動挿入される「*Exported from SHIROKUMA Knowledge Base*」というフッター文言を削除する

## Content

## 問題
`/ai-issue export`コマンドでエクスポートしたファイルに、自動的に以下の文言が挿入される：
```
*Exported from SHIROKUMA Knowledge Base*
```

この文言は不要なため削除する。

## 対象箇所
- ExportManagerクラス（src/services/export-manager.ts）
- 行382: アイテムエクスポート時のフッター
- 行573: システムステートエクスポート時のフッター

## 修正内容
✅ 以下の2箇所のフッター追加処理を削除：
1. `formatItemAsMarkdown()`メソッド（行380-382）
2. `formatSystemStateAsMarkdown()`メソッド（行571-573）

## 結果
エクスポートファイルにフッターが追加されなくなった
