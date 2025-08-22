# conceptsの登録が正常に動作していない

## Metadata

- **ID**: 62
- **Type**: issue
- **Status ID**: 13
- **Priority**: HIGH
- **Created**: Fri Aug 22 2025 22:32:43 GMT+0900 (Japan Standard Time)
- **Updated**: Fri Aug 22 2025 22:32:43 GMT+0900 (Japan Standard Time)

## Description

AIエンリッチメント時にconceptsの抽出と登録が期待通りに機能していない可能性がある。データベースを確認したところ、conceptsが適切に保存されていない。

## Content

## 問題の詳細

AIエンリッチメント時にconceptsの抽出と登録が期待通りに機能していない問題を調査・修正しました。

### 発見された問題

1. **Claude CLIの出力フォーマット問題**
   - `--output-format json`オプションを使用すると、Claude CLIが完全なJSONラッパーを返す
   - `result`フィールド内に実際のJSON応答が含まれている
   - Markdown形式（```json```）でラップされることがある

2. **パース処理の不備**
   - JSONラッパーの処理が不適切
   - Markdownコードブロックの除去が必要

### 実施した修正

#### 1. Claude CLI呼び出しの簡素化
```typescript
// 修正前
const command = `echo '${escapedInput}' | claude --model sonnet --output-format json -p "${escapedPrompt}"`;

// 修正後
const command = `echo '${escapedInput}' | claude --model sonnet "${escapedPrompt}"`;
```

#### 2. JSON応答の適切な処理
- JSONラッパーから`result`フィールドを抽出
- Markdownコードブロック（```json```）の除去
- 正しいJSONパースの実装

### 検証結果

```sql
-- concepts保存確認
SELECT COUNT(*) FROM concepts;  -- 10件
SELECT COUNT(*) FROM item_concepts;  -- 12件

-- 実際のデータ確認
8|Concepts Test After Restart|testing|0.9
8|Concepts Test After Restart|machine learning|0.8
8|Concepts Test After Restart|authentication|0.8
8|Concepts Test After Restart|database|0.8
```

### 修正ファイル

1. `src/services/ai/claude-interface.ts`
   - Claude CLI呼び出し方法の修正
   - JSON応答処理の改善

2. `src/services/ai/data-storage.ts`
   - エラーハンドリングの改善（デバッグログ追加・削除）

### 今後の改善案

1. **エラーログの適切な管理**
   - 本番環境でのログレベル制御
   - デバッグ時のみ詳細ログ出力

2. **テストケースの追加**
   - concepts抽出の単体テスト
   - Claude応答のモック化

3. **フォールバック機能の強化**
   - Claude API失敗時の基本的なconcepts抽出

## 結論

問題は解決され、conceptsが正しく抽出・保存されるようになりました。
