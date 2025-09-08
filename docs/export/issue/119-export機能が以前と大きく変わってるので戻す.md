---
id: 119
type: issue
title: "export機能が以前と大きく変わってるので戻す"
status: Completed
priority: HIGH
description: "TypeORM移行後、export機能の動作が以前と大きく異なっている。元の動作に戻す必要がある。"
tags: ["typeorm","v0.9.0","export","regression"]
related: [66,67,71,120]
createdAt: 2025-08-22T13:53:18.000Z
updatedAt: 2025-08-22T14:00:47.000Z
---

## 問題
TypeORM移行後、export機能の動作が以前と大きく異なっていた。

## 原因
- ExportManagerクラスが削除されていた
- 簡易的なエクスポート処理に置き換えられていた
- Front Matterフォーマットが失われていた
- タグ、キーワード、コンセプト、関連情報が出力されていなかった

## 解決策
1. ExportManagerクラスをTypeORM版として復元
2. Front Matter形式でのメタデータ出力を復活
3. 全ての関連情報（タグ、キーワード、コンセプト、関連アイテム）を含める
4. CLIコマンドを更新してExportManagerを使用するように変更

## 変更内容
- `/src/services/export-manager.ts` - TypeORM版ExportManagerを作成
- `/src/cli/commands/export.ts` - ExportManagerを使用するよう更新
- `/src/entities/ItemTag.ts` - リレーション追加
- `/src/entities/ItemKeyword.ts` - リレーション追加  
- `/src/entities/ItemConcept.ts` - リレーション追加
- `/src/entities/Item.ts` - statusリレーション追加

## テスト結果
- `export preview` - 正常動作
- `export 119` - Front Matter形式で正しく出力
- タグ、関連アイテムが正しく含まれることを確認