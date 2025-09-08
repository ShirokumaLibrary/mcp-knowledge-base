# Coding Conventions

## ファイル命名規則

### 必須: kebab-case
```
✅ 正しい例:
- item-service.ts
- crud-handlers.ts
- database-init.ts

❌ 間違った例:
- ItemService.ts (PascalCase)
- item_service.ts (snake_case)
- itemService.ts (camelCase)
```

## コードスタイル

### 基本設定
- **インデント**: スペース2個
- **文字列**: シングルクォート推奨
- **行の長さ**: 最大120文字
- **ファイルの長さ**: 最大500行

### インポート順序
```typescript
// 1. 外部依存
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

// 2. 内部モジュール  
import { EnhancedAIService } from '../services/enhanced-ai.service.js';
import { validateType } from '../utils/validation.js';

// 3. 型定義
import type { Item, CreateItemParams } from '../types/index.js';
```

## TypeScript規約

### 型定義
```typescript
// ✅ 明示的な型定義
function calculateScore(items: Item[]): number {
  return items.length;
}

// ❌ anyの使用を避ける
function processData(data: any) {  // ESLintエラー
  return data;
}
```

### エクスポート
```typescript
// ✅ 名前付きエクスポート推奨
export class ItemService { }
export function validateItem() { }

// ⚠️ デフォルトエクスポートは避ける
export default class { }  // 非推奨
```

## データベース規約

### Prismaモデル
- テーブル名: 複数形、snake_case
- フィールド名: camelCase（TypeScript）、snake_case（DB）
- リレーション: 明示的な命名

```prisma
model Item {
  id          Int      @id @default(autoincrement())
  createdAt   DateTime @default(now()) @map("created_at")
  
  @@map("items")
}
```

### typeフィールド
- **形式**: 英小文字、数字、アンダースコアのみ（a-z, 0-9, _）
- **例**: `issue`, `knowledge_base`, `test_123`
- **検証**: `validateType()`関数を使用

## エラーハンドリング

### 基本パターン
```typescript
try {
  // 処理
} catch (error) {
  // ❌ console.log使用禁止
  console.log(error);  // ESLintエラー
  
  // ✅ 適切なエラー処理
  throw new McpError(
    ErrorCode.InvalidParams,
    `Failed to process: ${error.message}`
  );
}
```

## コメント規約

### 必要なコメント
```typescript
/**
 * アイテムを作成し、AIエンリッチメントを実行
 * @param params - 作成パラメータ
 * @returns 作成されたアイテム
 */
async function createItem(params: CreateItemParams): Promise<Item> {
  // 重要なビジネスロジックの説明
  // ...
}
```

### 不要なコメント
```typescript
// ❌ 自明なコメントは不要
// idを1増やす
id++;

// アイテムを返す
return item;
```

## Git規約

### コミットメッセージ
```bash
# ✅ 簡潔で明確
feat: Add type validation for item creation
fix: Correct embedding calculation error
docs: Update API documentation

# ❌ Claude署名は不要
feat: Add validation
🤖 Generated with Claude Code  # 削除すること
```

## 品質チェック

### 必須チェック項目
```bash
# コード提出前に実行
npm run lint:errors     # ESLintエラーチェック
npm run build          # TypeScriptコンパイル
```

### よくある違反
1. `Unexpected any` - 型を明示的に指定
2. `Filename not in kebab case` - ファイル名を修正
3. `Missing return type` - 戻り値の型を追加
4. `Unexpected console` - console.logを削除
5. `Unused variable` - 未使用変数を削除

## モジュール規約

### サービスクラス
```typescript
export class ItemService {
  constructor(private prisma: PrismaClient) {}
  
  // パブリックメソッドは明示的な戻り値型
  async getItem(id: number): Promise<Item | null> {
    return this.prisma.item.findUnique({ where: { id } });
  }
  
  // プライベートメソッドはprivate修飾子
  private validateData(data: unknown): boolean {
    return true;
  }
}
```

### ユーティリティ関数
```typescript
// 純粋関数として実装
export function normalizeType(type: string): string {
  return type.toLowerCase().replace(/[^a-z0-9_]/g, '_');
}
```