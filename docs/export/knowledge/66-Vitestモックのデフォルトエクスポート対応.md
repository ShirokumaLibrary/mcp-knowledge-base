---
id: 66
type: knowledge
title: "Vitestモックのデフォルトエクスポート対応"
description: "ESM/CommonJS互換性のためPrismaインポートをデフォルトエクスポート形式に変更した際のテストモック修正方法"
status: Completed
priority: HIGH
aiSummary: "Vitestモックのデフォルトエクスポート対応 ESM/CommonJS互換性のためPrismaインポートをデフォルトエクスポート形式に変更した際のテストモック修正方法 ## 問題\nESM/CommonJS互換性対応でPrismaのインポート形式を変更：\n```javascript\n// 変更前\nimport { PrismaClient } from '@prisma/client';\n\n// "
tags: ["testing","vitest","esm","prisma","commonjs","mocking"]
keywords: {"prisma":1,"prismaclient":0.74,"const":0.59,"client":0.59,"export":0.44}
related: [65]
created: 2025-08-14T08:29:57.665Z
updated: 2025-08-14T08:29:57.665Z
---

## 問題
ESM/CommonJS互換性対応でPrismaのインポート形式を変更：
```javascript
// 変更前
import { PrismaClient } from '@prisma/client';

// 変更後  
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
```

この変更により、Vitestのモックも対応が必要になった。

## 解決方法

### 1. 共通モックヘルパーの作成
`tests/mocks/prisma-mock.ts`:
```typescript
export const createPrismaMock = () => ({
  item: { findUnique: vi.fn(), /* ... */ },
  // 他のモデル
  $transaction: vi.fn(function(callback) { return callback(this); })
});

export const MockPrismaClient = vi.fn(() => createPrismaMock());
export const MockPrisma = { /* Prismaエラークラス等 */ };
```

### 2. テストでのモック設定
```javascript
vi.mock('@prisma/client', () => ({
  default: {
    PrismaClient: MockPrismaClient,
    Prisma: MockPrisma
  }
}));
```

### 3. 動的インポートの場合（vi.doMock）
```javascript
vi.doMock('@prisma/client', () => ({
  default: {
    PrismaClient: vi.fn(() => ({})),
    Prisma: {}
  }
}));
```

## 重要なポイント
- モックオブジェクトは`default`プロパティでラップする
- PrismaClientとPrismaの両方をエクスポートする
- $transactionのモックは`this`コンテキストを維持する必要がある