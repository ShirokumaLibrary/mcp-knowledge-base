---
id: 52
type: issue
title: "update_item APIでtype変更を可能にする"
status: Closed
priority: MEDIUM
description: "現在update_itemではtypeフィールドの変更が禁止されている。データ整合性を保ちながらtype変更を可能にする実装が必要。"
aiSummary: "change_item_type API の実装 既存アイテムのtypeフィールドを変更するAPIが必要。現在update_itemではtype変更不可。 ## 背景\n\n現在、一度作成されたアイテムのtypeフィールドは変更できない。これにより以下の問題が発生：\n\n1. **データ移行の困難**\n   - 間違ったtypeで作成されたアイテムの修正不可\n   - 例: handovers → ha"
tags: ["api","data-integrity","feature","type-management"]
related: [2,3,18,20,43,52,95,10,56,94]
keywords: {"type":1,"newtype":0.44,"validatedtype":0.44,"await":0.44,"api":0.33}
embedding: "ioCAgICAj4qMhI2FgICAgISAgICAgI+EkIqbi4CAgIGAgICAgICJgI2Mr4yAgICGgYCAgICAgYKQiKWHgICAi4aAgICAgICAi4KzgYCAgIuCgICAgICAg4OGtICAgICGiICAgICAgYmAgauDgICAioyAgICAgIiMhICZgICAgIU="
createdAt: 2025-08-22T13:32:43.000Z
updatedAt: 2025-08-22T13:32:43.000Z
---

v0.9.0のTypeORM移行により、データモデルが大きく変更されるためクローズ。新アーキテクチャで必要に応じて再検討。