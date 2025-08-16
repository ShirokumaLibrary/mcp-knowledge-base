---
id: 48
type: issue
title: "embeddingフィールドの出力オプション自体を廃止すべき"
status: Completed
priority: HIGH
aiSummary: "embeddingフィールドの出力オプション自体を廃止すべき includeEmbeddingオプションは不要。埋め込みベクトルは完全に内部データとして扱い、APIレスポンスから除外すべき。AIも人間も直接使用することはない。 ## 背景\n\n現在、`get_item` APIには`includeEmbedding`パラメータがあり、128次元のInt8量子化ベクトルの出力を制御できます。しかし、*"
tags: ["api","embedding","simplification","breaking-change","cleanup"]
keywords: {"128":0.42,"embedding":1,"includeembedding":1,"api":0.83,"typescript":0.83}
embedding: "gIaAgICAgI2AmJeLiYuAgICAgICAgISQgJ+Zl5SFgICAh4CAgICKmICblJmYgICAgJaAgICAhpOAnoiPkoCAgICfgICAgIuRgJOAg4eGgICAmoCAgICMi4CFhICKgoCAgJ6AgICAh4eAgJCIiYiAgICVgICAgIGIgImZgYGMgIA="
related: [24,26,27,49]
searchIndex: "embedding includeembedding api typescript get_item 128 async getitem args unknown"
created: 2025-08-14T01:02:37.760Z
updated: 2025-08-14T01:16:05.470Z
---

# embeddingフィールドの出力オプション自体を廃止すべき

## Description

includeEmbeddingオプションは不要。埋め込みベクトルは完全に内部データとして扱い、APIレスポンスから除外すべき。AIも人間も直接使用することはない。

## Content

## 背景

現在、`get_item` APIには`includeEmbedding`パラメータがあり、128次元のInt8量子化ベクトルの出力を制御できます。しかし、**そもそもこのオプション自体が不要**です。

## なぜ出力オプションが不要なのか

### 1. 誰も使わないデータ
- **AI**: 数値の羅列を解釈できない
- **人間**: 128個の数値を見ても意味がわからない
- **システム**: 内部で直接DBから取得すれば良い

### 2. 使用される場所は全て内部処理
```typescript
// これらは全て内部でDBから直接取得
- find_similar_items()     // 類似度計算
- get_related_items()      // embedding戦略
- suggestRelationsEfficiently()  // 関係性提案
```

### 3. デバッグですら不要
- 類似度の結果を見れば十分
- 生の埋め込みベクトルを見る必要はない
- もし必要なら専用のデバッグツールを使うべき

## 現在の問題点

### 無駄な複雑性
```typescript
// 現在の実装（不要な複雑性）
async getItem(args: unknown) {
  // ...
  if (!params.includeEmbedding) {
    delete result.embedding;
  }
}
```

### 提案する実装
```typescript
// シンプルな実装
async getItem(args: unknown) {
  // ...
  // embeddingは常に除外
  delete result.embedding;
}
```

## 推奨アクション

### 1. 即座の対応
- `includeEmbedding`パラメータを廃止
- 常にembeddingフィールドを除外
- スキーマからパラメータを削除

### 2. 影響範囲
```typescript
// 削除すべき箇所
- GetItemSchema の includeEmbedding
- list_items の同様のオプション（もしあれば）
- ドキュメントの該当部分
```

### 3. 移行方法
- 後方互換性: パラメータが渡されても無視
- 常にembeddingを除外する動作に統一
- Breaking changeとして次のメジャーバージョンで完全削除

## 結論

**`includeEmbedding`オプションは完全に不要です。**

埋め込みベクトルは：
- 内部計算専用のデータ
- APIレスポンスに含める必要なし
- オプションで制御する価値もなし

### 関連イシュー
- issue-26: get_item APIでembeddingフィールドの出力を制御可能にする
  → **クローズして、代わりに完全除外を実装すべき**

## AI Summary

embeddingフィールドの出力オプション自体を廃止すべき includeEmbeddingオプションは不要。埋め込みベクトルは完全に内部データとして扱い、APIレスポンスから除外すべき。AIも人間も直接使用することはない。 ## 背景

現在、`get_item` APIには`includeEmbedding`パラメータがあり、128次元のInt8量子化ベクトルの出力を制御できます。しかし、*

## Keywords (Detailed)

- embedding (weight: 1.00)
- includeembedding (weight: 1.00)
- api (weight: 0.83)
- typescript (weight: 0.83)
- 128 (weight: 0.42)
- get_item (weight: 0.42)
- async (weight: 0.42)
- getitem (weight: 0.42)
- args (weight: 0.42)
- unknown (weight: 0.42)

