# Vitestモックのデフォルトエクスポート対応

## Metadata

- **ID**: 86
- **Type**: knowledge
- **Status ID**: 13
- **Priority**: HIGH
- **Created**: Fri Aug 22 2025 22:32:45 GMT+0900 (Japan Standard Time)
- **Updated**: Fri Aug 22 2025 22:32:45 GMT+0900 (Japan Standard Time)

## Description

ESM/CommonJS互換性のためPrismaインポートをデフォルトエクスポート形式に変更した際のテストモック修正方法

## Content

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
