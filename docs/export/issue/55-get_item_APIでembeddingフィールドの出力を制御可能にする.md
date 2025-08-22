---
id: 55
type: issue
title: "get_item APIでembeddingフィールドの出力を制御可能にする"
status: Closed
priority: MEDIUM
tags: ["embedding","api","optimization","performance","get-item","closed","superseded"]
related: [2,24,25,27,33,42,43,47,48,49,51,53,10,64,81,88,96]
keywords: {"128":1,"embedding":1,"api":1,"get_item":1,"issue":0.95}
embedding: "gIOAgICAgIGAm5OAg4CAgICGgICAgICLgLKVgI2AgICAjICAgICAk4CskICUgICAgJCAgICAgI6AsoaAk4CAgICPgICAgICVgKaAgImAgICAiYCAgICAkoCfg4CRgICAgIqAgICAgIiAiY2AhoCAgICLgICAgICAgIeUgICAgIA="
createdAt: 2025-08-22T13:32:43.000Z
updatedAt: 2025-08-22T13:32:43.000Z
---

# get_item APIでembeddingフィールドの出力を制御可能にする

get_item APIが返すembeddingフィールド（128次元のInt8配列）は大きなデータサイズでコンテキストを消費するが、実際に必要なケースは限定的。オプションで出力を制御できるようにすべき。

## AI Summary

get_item APIでembeddingフィールドの出力を制御可能にする get_item APIが返すembeddingフィールド（128次元のInt8配列）は大きなデータサイズでコンテキストを消費するが、実際に必要なケースは限定的。オプションで出力を制御できるようにすべき。 ## 問題の詳細

**このイシューは方針変更によりクローズされました。**

代わりにissue-48で「embe

## 問題の詳細

**このイシューは方針変更によりクローズされました。**

代わりにissue-48で「embeddingフィールドを完全に除外する」方針で進めます。

---

### 方針変更の理由

1. **誰も使わないデータ**
   - AIは数値の羅列を解釈できない
   - 人間も128個の数値を見ても意味がわからない
   - デバッグですら不要（類似度の結果で十分）

2. **不要な複雑性**
   - `includeEmbedding`オプションは管理の手間
   - 使われないオプションはコードを複雑にするだけ

3. **シンプルな解決策**
   - embeddingフィールドを常に除外
   - 内部処理は直接DBから取得
   - APIレスポンスはクリーンに保つ

### 元の内容

get_item APIのレスポンスに含まれる`embedding`フィールドは128次元のInt8量子化ベクトルで、以下の問題があります：

[以下省略]

## クローズ理由

- **方針変更**: オプション制御ではなく完全除外へ
- **継続先**: issue-48
- **クローズ日時**: 2025-08-14 10:00
