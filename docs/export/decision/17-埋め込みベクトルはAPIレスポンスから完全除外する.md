---
id: 17
type: decision
title: "埋め込みベクトルはAPIレスポンスから完全除外する"
status: Completed
priority: HIGH
description: "embeddingフィールドは内部処理専用データであり、API利用者（AI・人間問わず）には不要。出力オプションも含めて廃止。"
aiSummary: "埋め込みベクトルはAPIレスポンスから完全除外する embeddingフィールドは内部処理専用データであり、API利用者（AI・人間問わず）には不要。出力オプションも含めて廃止。 ## 決定事項\n\n**埋め込みベクトル（embedding）はAPIレスポンスから完全に除外する**\n\n## 理由\n\n### 1. 使用者が存在しない\n| 利用者 | 使用可能性 | 理由 |\n|--------|---"
tags: ["embedding","api-design","simplification","architecture","decision"]
related: [8,13,25,26,48,57,81,82,83]
keywords: {"embedding":1,"api":0.86,"phase":0.86,"typescript":0.86,"issue":0.57}
embedding: "gIOEgICAgICDm5SWgICAgICAh4CAgICDgKuWqYCAgICAg4aAgICAh4OokauAgICAgIuDgICAgISLqYeagICAgICPgICAgICHhZuAhYCAgICAjICAgICAhoySg4CAgICAgI+AgICAgIOPhI6PgICAgICKgYCAgICAioiWg4CAgIA="
createdAt: 2025-08-22T13:32:41.000Z
updatedAt: 2025-08-22T13:32:41.000Z
---

## 決定事項

**埋め込みベクトル（embedding）はAPIレスポンスから完全に除外する**

## 理由

### 1. 使用者が存在しない
| 利用者 | 使用可能性 | 理由 |
|--------|------------|------|
| AI (Claude) | ❌ | 128個の数値の羅列は解釈不可能 |
| 人間 | ❌ | 量子化されたInt8配列に意味なし |
| システム | ⚠️ | 内部処理は直接DBアクセスで十分 |

### 2. 実際の使用箇所
```typescript
// 全て内部処理でDBから直接取得
- find_similar_items()
- get_related_items()  
- suggestRelationsEfficiently()
```

### 3. コストとメリット
- **コスト**: 約1KB/レスポンス、コンテキスト消費、複雑性増加
- **メリット**: なし（デバッグですら不要）

## 実装方針

### Phase 1: 即座の対応
```typescript
// get_item, list_items から embedding を常に除外
delete result.embedding;
```

### Phase 2: スキーマ更新
```typescript
// GetItemSchema から includeEmbedding を削除
// 後方互換性のため、パラメータは無視
```

### Phase 3: クリーンアップ
- v0.9.0でパラメータ完全削除
- ドキュメント更新
- テスト修正

## 影響と移行

### Breaking Change
- なし（embeddingを使っている利用者がいない）
- `includeEmbedding: true`は単に無視される

### パフォーマンス改善
- レスポンスサイズ: 約1KB削減/アイテム
- パース処理: 高速化
- メモリ使用: 削減

## 関連情報
- issue-26: 元の提案（クローズ）
- issue-48: 完全除外の提案（実装予定）
- 決定日: 2025-08-14
- 実装予定: v0.8.1