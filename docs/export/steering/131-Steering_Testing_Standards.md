---
id: 131
type: steering
title: "Steering: Testing Standards"
status: Open
priority: HIGH
description: "テスト戦略とTDD実践ガイドライン"
aiSummary: "Comprehensive testing standards guide covering TDD methodology, Vitest framework usage, test file organization, mocking strategies, coverage goals, and best practices for unit, integration, and end-to-end testing in TypeScript projects."
tags: ["testing","vitest","tdd","steering","inclusion:always"]
keywords: {"tdd":1,"testing":1,"test":0.9,"vitest":0.9,"standards":0.9}
concepts: {"testing":1,"development":0.9,"standards":0.9,"quality":0.8,"methodology":0.8}
embedding: "gICSgJSBkYCCgICTi4CAgIiAlICXgJSAiICAi5CAgICTgJCAoYiOgIGAgIKNgICAl4CGgKiQhICAgICIhYCAgJCAgIClioCAh4CAgICAgICFgIKAqpGCgI6AgIGDgICAgICMgJyRgICPgICKgICAgIOAlICdiYeAioCAk4SAgIA="
createdAt: 2025-08-23T01:26:32.000Z
updatedAt: 2025-08-23T12:08:11.000Z
---

# Testing Standards

## Version Information
- **Current Version**: v0.9.0
- **Last Updated**: 2025-08-23

## テスト戦略
### TDD (Test-Driven Development)
1. **RED**: 失敗するテストを書く
2. **GREEN**: テストを通す最小限のコード
3. **REFACTOR**: コードを改善

### テストファイル構造
```
src/
├── services/
│   ├── item.service.ts
│   └── item.service.test.ts
├── repositories/
│   ├── ItemRepository.ts
│   └── ItemRepository.test.ts
├── utils/
│   ├── validation.ts
│   └── validation.test.ts
```

## Vitestの使用
### テストファイル命名
- ユニットテスト: `*.test.ts`
- 統合テスト: `*.integration.test.ts`
- E2Eテスト: `*.e2e.test.ts`

### テスト構造
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ComponentName', () => {
  describe('methodName', () => {
    it('should do something when condition', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = methodName(input);
      
      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

## モックの使用
### Vitestモック
```typescript
// デフォルトエクスポートのモック
vi.mock('./module', () => ({
  default: vi.fn(),
  namedExport: vi.fn()
}));

// TypeORMのモック
vi.mock('typeorm', () => ({
  DataSource: vi.fn(),
  Repository: vi.fn()
}));
```

## カバレッジ目標
- **全体**: 80%以上
- **新規コード**: 90%以上
- **クリティカルパス**: 100%

## テストカテゴリ
### ユニットテスト
- 単一関数/メソッドのテスト
- 外部依存のモック
- 高速実行

### 統合テスト
- 複数モジュールの連携
- 実データベース使用（テスト用）
- APIエンドポイントテスト

### MCPサーバーテスト
- STDIOベースのため自動化困難
- mcp-api-testerエージェントによる半自動テスト
- ユーザーレビューによる動作確認

### カスタムコマンド/エージェントテスト
- 自動テスト不可
- ユーザーレビューによる逐次調整
- 実使用でのフィードバック反映

## テスト実行
```bash
# 全テスト実行
npm test

# ウォッチモード
npm run test:watch

# カバレッジ付き
npm run test:coverage

# 特定ファイル
npm test validation.test.ts
```

## ベストプラクティス
1. **独立性**: テスト間の依存を排除
2. **明確性**: テスト名で何をテストしているか明確に
3. **速度**: ユニットテストは高速に
4. **信頼性**: flaky testの排除
5. **保守性**: DRY原則の適用

## v0.9.0での更新
- TypeORMベースのテストパターン継続
- MCPサーバーテストの現実的アプローチ明記
- カスタムコマンド/エージェントのテスト方針追加
- ディレクトリ構造をTypeORM対応で維持