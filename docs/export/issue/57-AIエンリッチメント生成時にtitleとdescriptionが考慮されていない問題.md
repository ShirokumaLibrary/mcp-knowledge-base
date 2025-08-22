---
id: 57
type: issue
title: "AIエンリッチメント生成時にtitleとdescriptionが考慮されていない問題"
status: Completed
priority: HIGH
tags: ["ai-enrichment","bug","search","keywords","title","description"]
related: [16,17,24,29,31,32,40,42,38,39,66,82,83]
keywords: {"title":1,"description":1,"content":0.8,"const":0.4,"params":0.4}
embedding: "iICAiaSAgICImYaEgICAioiAgIKdgICAmYyAiYCAgIuPgICAjICAgKSBgIqAgICLiYCAhICAgICdgoaGgICAi4uAgIqFgICAjI6NgYCAgIqNgICOlYCAgJmajYCAgICJjICAjKKAgICIm4iDgICAkoqAgI6ggICAgJyMgICAgIk="
createdAt: 2025-08-22T13:32:43.000Z
updatedAt: 2025-08-22T13:32:43.000Z
---

# AIエンリッチメント生成時にtitleとdescriptionが考慮されていない問題

現在のAIエンリッチメント（キーワード抽出、コンセプト検出）はcontentフィールドのみを対象としており、titleとdescriptionが含まれていない。これらの重要なメタデータを見逃している可能性がある。

## AI Summary

AIエンリッチメント生成時にtitleとdescriptionが考慮されていない問題 現在のAIエンリッチメント（キーワード抽出、コンセプト検出）はcontentフィールドのみを対象としており、titleとdescriptionが含まれていない。これらの重要なメタデータを見逃している可能性がある。 ## 問題の詳細

現在の実装を確認したところ、AIエンリッチメント処理に問題があることが判明しまし

## 問題の詳細

現在の実装を確認したところ、AIエンリッチメント処理に問題があることが判明しました。

### 現状の問題点

1. **issue-24の実装で発見された問題**
   - update_item時のテストコードで`mockExtractWeightedKeywords`の呼び出しを確認
   - **実際にtitle、description、contentが渡されている**
   - しかし、現在の実装ではcontentのみが処理対象の可能性

2. **EnhancedAIServiceの実装確認が必要**
   ```typescript
   // テストでの期待値（正しい）
   expect(mockExtractWeightedKeywords).toHaveBeenCalledWith({
     title: 'New Title',
     description: 'New Description', 
     content: 'New content'
   });
   ```

3. **影響範囲**
   - **キーワード抽出**: titleの重要な単語が除外される
   - **コンセプト検出**: descriptionの文脈が失われる
   - **検索精度**: searchIndexが不完全
   - **関連性判定**: タイトルベースの関連が検出されない

### 具体例

アイテム:
- title: "React Hooksのベストプラクティス"
- description: "useEffectとuseStateの適切な使い方"
- content: "詳細な実装例..."

現在の問題:
- "React", "Hooks", "useEffect", "useState"などの重要キーワードが抽出されない可能性
- 検索で "React Hooks" がヒットしない

### 調査が必要な箇所

1. `src/services/enhanced-ai.service.ts`
   - extractWeightedKeywords関数の実装
   - 実際にtitle/descriptionを処理しているか

2. `src/mcp/handlers/crud-handlers.ts`
   - createItemとupdateItemでの呼び出し方
   - パラメータが正しく渡されているか

### 修正案

#### オプション1: 重み付き統合
```typescript
async extractWeightedKeywords(params: {
  title: string;
  description: string;
  content: string;
}) {
  // タイトル: 高い重み (3x)
  const titleKeywords = extractFromText(params.title, weight: 3.0);
  
  // 説明: 中程度の重み (2x)
  const descKeywords = extractFromText(params.description, weight: 2.0);
  
  // コンテンツ: 標準の重み (1x)
  const contentKeywords = extractFromText(params.content, weight: 1.0);
  
  return mergeKeywords([titleKeywords, descKeywords, contentKeywords]);
}
```

#### オプション2: フィールド別処理
```typescript
// 各フィールドを個別に処理し、結果を統合
const keywords = {
  fromTitle: [...],
  fromDescription: [...],
  fromContent: [...]
};
```

### テストケース

1. titleのみのアイテムでキーワードが抽出されること
2. descriptionのみのアイテムでキーワードが抽出されること
3. 各フィールドの重要度が適切に反映されること
4. 重複キーワードが適切にマージされること

### 優先度

**HIGH** - 検索機能の精度に直接影響するため

### 関連イシュー

- issue-24: update_item時のAIエンリッチメント再生成（完了済み）
  - この実装中に問題が発覚
