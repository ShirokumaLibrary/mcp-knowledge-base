---
id: 19
type: issue
title: "update_item APIでtype変更を可能にする"
description: "現在update_itemではtypeフィールドの変更が禁止されている。データ整合性を保ちながらtype変更を可能にする実装が必要。"
status: Review
priority: MEDIUM
aiSummary: "change_item_type API の実装 既存アイテムのtypeフィールドを変更するAPIが必要。現在update_itemではtype変更不可。 ## 背景\n\n現在、一度作成されたアイテムのtypeフィールドは変更できない。これにより以下の問題が発生：\n\n1. **データ移行の困難**\n   - 間違ったtypeで作成されたアイテムの修正不可\n   - 例: handovers → ha"
tags: ["api","data-integrity","feature","type-management"]
keywords: {"type":1,"newtype":0.44,"validatedtype":0.44,"await":0.44,"api":0.33}
related: [2,3,18,20,43,52,95]
created: 2025-08-13T12:39:24.002Z
updated: 2025-08-13T13:01:51.791Z
---

## 背景

現在、一度作成されたアイテムのtypeフィールドは変更できない。これにより以下の問題が発生：

1. **データ移行の困難**
   - 間違ったtypeで作成されたアイテムの修正不可
   - 例: handovers → handover への修正（issue-18）

2. **柔軟性の欠如**
   - プロジェクト進行に伴うtype変更ができない
   - 例: issue → knowledge への変換

## 要件

### 基本機能
```typescript
change_item_type({
  id: number,
  new_type: string
})
```

### 必要な処理
1. **type検証**
   - 新しいtypeが有効な形式か確認
   - validateType()関数を使用

2. **リレーション更新**
   - 関連アイテムのrelated配列内の参照を更新
   - 例: "issues-123" → "bugs-123"

3. **履歴記録**
   - type変更の履歴を保持（監査用）

## 実装案

### Option 1: 単純なtype更新
```typescript
async changeItemType(id: number, newType: string) {
  const validatedType = validateType(newType);
  
  await prisma.item.update({
    where: { id },
    data: { type: validatedType }
  });
}
```

### Option 2: リレーション対応版
```typescript
async changeItemType(id: number, newType: string) {
  const validatedType = validateType(newType);
  const oldItem = await prisma.item.findUnique({ where: { id } });
  
  // トランザクション内で実行
  await prisma.$transaction(async (tx) => {
    // 1. type更新
    await tx.item.update({
      where: { id },
      data: { type: validatedType }
    });
    
    // 2. 関連アイテムの参照更新
    // （実装が複雑なため要検討）
  });
}
```

## テストケース

1. **正常系**
   - 有効なtypeへの変更
   - 単数形への正規化

2. **異常系**
   - 無効なtype形式
   - 存在しないアイテムID
   - 権限チェック（将来的に）

## 優先度

**MEDIUM** - データ整合性の改善に有用だが、回避策あり

## 関連

- issue-18: typeフィールドの複数形使用の不整合（実例）
- `.shirokuma/mcp-api-tester-tests/1.13-type-change.md`: テスト仕様書（参考）