# AIエンリッチメントがtitle/description変更時に再実行されない論理的問題

## Metadata

- **ID**: 58
- **Type**: issue
- **Status ID**: 13
- **Priority**: HIGH
- **Created**: Fri Aug 22 2025 22:32:43 GMT+0900 (Japan Standard Time)
- **Updated**: Fri Aug 22 2025 22:32:43 GMT+0900 (Japan Standard Time)

## Description

現在、update_item APIでtitleやdescriptionのみが変更された場合、AIエンリッチメントが再実行されていない。これは論理的な問題で、titleやdescriptionの変更は検索キーワードに大きく影響するため修正が必要。

## Content

## 問題の詳細

現在の`crud-handlers.ts`の実装（213行目）で：
```typescript
const shouldEnrich = contentChanged;
```

これは`content`フィールドの変更時のみAIエンリッチメントを再実行しており、`title`や`description`の変更を無視している。

### 問題の根拠

1. **titleの重要性**
   - "React Hooks" → "Vue Composition API" のような変更は全く異なるキーワードを生成する
   - タイトルは検索で最も重要な要素

2. **descriptionの重要性**  
   - "基本的な使い方" → "高度なパフォーマンス最適化" のような変更
   - 説明文にも重要なキーワードが含まれる

3. **実際の影響**
   - キーワード抽出が古い情報に基づく
   - 検索インデックスが不正確になる
   - 関連アイテム検索の精度低下

### 現在のテストの問題

`tests/unit/mcp/handlers/ai-enrichment-update.test.ts`の603-638行で、titleやdescriptionのみの変更時にAIエンリッチメントが**実行されない**ことを期待値としている。これは論理的に間違った仕様。

### 修正すべき箇所

1. **crud-handlers.ts 213行目**
   ```typescript
   // 現在
   const shouldEnrich = contentChanged;
   
   // 修正後
   const shouldEnrich = contentChanged || titleChanged || descriptionChanged;
   ```

2. **テストケース**
   - title変更時にAIエンリッチメントが実行されることをテスト
   - description変更時にAIエンリッチメントが実行されることをテスト

### 期待される動作

- **title変更**: キーワード、コンセプト、埋め込みベクトルを再生成
- **description変更**: 同様に再生成
- **content変更**: 従来通り再生成
- **複数フィールド変更**: 1回のみ実行（パフォーマンス最適化）
