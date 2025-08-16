---
id: 29
type: issue
title: "AIエンリッチメントがtitle/description変更時に再実行されない論理的問題"
status: Completed
priority: HIGH
aiSummary: "AIエンリッチメントがtitle/description変更時に再実行されない論理的問題 現在、update_item APIでtitleやdescriptionのみが変更された場合、AIエンリッチメントが再実行されていない。これは論理的な問題で、titleやdescriptionの変更は検索キーワードに大きく影響するため修正が必要。 ## 問題の詳細\n\n現在の`crud-handlers.ts`"
tags: ["ai-enrichment","update-api","logical-bug","search-indexing"]
keywords: {"title":1,"description":1,"handlers":0.57,"const":0.57,"shouldenrich":0.57}
embedding: "gICAi5+CgICIkIqFgICKgICAgIObgICAl4mLioCAi4CAgICAkoaAgKeBiYuAgIeAgICAhIyOgICpgIOHgICKgICAgI2OkYCAm4eAgYCAhoCAgICRnoyAgKCPgYCAgIGAgICAj6aQgICJiYeDgICAgICAgJGfioCAgJCLgICAhIA="
related: [16,24,28,31,32,40]
searchIndex: "title description handlers const shouldenrich contentchanged api crud 213 typescript"
created: 2025-08-13T13:49:24.051Z
updated: 2025-08-13T23:06:46.185Z
---

# AIエンリッチメントがtitle/description変更時に再実行されない論理的問題

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

## AI Summary

AIエンリッチメントがtitle/description変更時に再実行されない論理的問題 現在、update_item APIでtitleやdescriptionのみが変更された場合、AIエンリッチメントが再実行されていない。これは論理的な問題で、titleやdescriptionの変更は検索キーワードに大きく影響するため修正が必要。 ## 問題の詳細

現在の`crud-handlers.ts`

## Keywords (Detailed)

- title (weight: 1.00)
- description (weight: 1.00)
- handlers (weight: 0.57)
- const (weight: 0.57)
- shouldenrich (weight: 0.57)
- contentchanged (weight: 0.57)
- api (weight: 0.38)
- typescript (weight: 0.38)
- crud (weight: 0.38)
- 213 (weight: 0.38)

