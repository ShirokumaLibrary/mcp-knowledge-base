# get_item APIでembeddingフィールドの出力を制御可能にする

## Metadata

- **ID**: 56
- **Type**: issue
- **Status ID**: 18
- **Priority**: MEDIUM
- **Created**: Fri Aug 22 2025 22:32:43 GMT+0900 (Japan Standard Time)
- **Updated**: Fri Aug 22 2025 22:32:43 GMT+0900 (Japan Standard Time)

## Description

get_item APIが返すembeddingフィールド（128次元のInt8配列）は大きなデータサイズでコンテキストを消費するが、実際に必要なケースは限定的。オプションで出力を制御できるようにすべき。

## Content

## 問題の詳細

**このイシューはissue-26と重複のためクローズされました。**

作業はissue-26で継続します。

---

### 元の内容

get_item APIのレスポンスに含まれる`embedding`フィールドは128次元のInt8量子化ベクトルで、以下の問題があります：

### 現状の問題点
1. **コンテキストの浪費**
   - 128個の数値データ（各値0-255）
   - JSON形式で約1KB以上のデータサイズ
   - 通常の用途では不要な情報

2. **使用頻度が低い**
   - embeddingは主に`find_similar_items`や`get_related_items`で内部的に使用
   - クライアント側で直接embeddingを見る必要はほぼない
   - デバッグ時のみ必要

3. **パフォーマンスへの影響**
   - ネットワーク転送量の増加
   - JSONパース処理の負荷
   - メモリ使用量の増加

## クローズ理由

- **重複**: issue-26と完全に同一の内容
- **作成時刻**: issue-26が先（13:45:43）、issue-27が後（13:46:30）
- **統合先**: issue-26で作業を継続

## 関連リンク

- 継続先: issue-26
- クローズ日時: 2025-08-14 09:35
